/**
 * SaveManager (M11): giữ bản lưu trong bộ nhớ, ghi xuống kho cục bộ theo thứ tự sau mỗi thay đổi.
 * Kho là interface bất đồng bộ (IndexedDB trên trình duyệt, bộ nhớ khi test); cloud (Backend,
 * xung đột hai thiết bị) sẽ cắm vào đây sau, dùng `revision` và `savedAt` để so bản.
 * Logic thuần, không import Phaser hay API trình duyệt.
 */
import { decodeSaveCode, encodeSaveCode } from './save-code';
import { defaultSave, parseSave, type SaveData, SaveError } from './save-data';

export interface SaveStore {
  read(): Promise<string | null>;
  write(text: string): Promise<void>;
}

export class MemorySaveStore implements SaveStore {
  text: string | null = null;
  writes = 0;
  constructor(text: string | null = null) {
    this.text = text;
  }
  read(): Promise<string | null> {
    return Promise.resolve(this.text);
  }
  write(text: string): Promise<void> {
    this.text = text;
    this.writes += 1;
    return Promise.resolve();
  }
}

/** Chuẩn hóa bản lưu theo dữ liệu cấu hình (ví dụ build M8); trả `save` cũ nếu không đổi. */
export type SaveNormalizer = (save: SaveData) => { save: SaveData; notice: string | undefined };

const IDENTITY: SaveNormalizer = (save) => ({ save, notice: undefined });

/** Chạy lần lượt nhiều bước chuẩn hóa; gộp thông báo. */
export function chainNormalizers(...steps: SaveNormalizer[]): SaveNormalizer {
  return (save) => {
    let cur = save;
    const notices: string[] = [];
    for (const step of steps) {
      const r = step(cur);
      cur = r.save;
      if (r.notice) notices.push(r.notice);
    }
    return { save: cur, notice: notices.length > 0 ? notices.join(' ') : undefined };
  };
}

/** Kết quả giao dịch: đã ghi xuống kho (hoặc không có gì đổi), hoặc lỗi và đã hoàn tác. */
export type TransactResult = { ok: true; changed: boolean } | { ok: false; error: string };
type SaveMode = 'writable' | 'newer-version' | 'read-unavailable';
const READ_ONLY_ERROR = 'Bản lưu chỉ đọc (của phiên bản game mới hơn).';
const READ_UNAVAILABLE_ERROR = 'Không đọc được bản lưu. Phiên tạm không ghi vào kho.';

export class SaveManager {
  /** Lỗi đọc/ghi gần nhất (để hiện cho người chơi); undefined = ổn. */
  lastError: string | undefined;
  /** Thông báo cần hiện một lần (bản lưu được chuẩn hóa lại); người hiện xong thì xóa. */
  notice: string | undefined;
  private current: SaveData;
  private persisted: SaveData;
  private writeFailed = false;
  private chain: Promise<void> = Promise.resolve();

  private constructor(
    private readonly store: SaveStore,
    private readonly now: () => number,
    data: SaveData,
    private readonly mode: SaveMode,
    error: string | undefined,
    private readonly normalize: SaveNormalizer,
  ) {
    this.current = data;
    this.persisted = data;
    this.lastError = error;
    const fixed = normalize(data);
    if (fixed.save !== data) {
      this.notice = fixed.notice;
      void this.commit(fixed.save, data.revision + 1);
    }
  }

  /**
   * Chỉ bản đọc được hoặc ô trống đã xác nhận mới được ghi. Nếu đọc kho lỗi, chơi tạm
   * trong bộ nhớ để giữ nguyên bản chưa đọc được. `normalize` vẫn áp dụng trong bộ nhớ.
   */
  static async open(
    store: SaveStore,
    now: () => number = Date.now,
    normalize: SaveNormalizer = IDENTITY,
  ): Promise<SaveManager> {
    let text: string | null;
    const make = (data: SaveData, mode: SaveMode, error?: string): SaveManager =>
      new SaveManager(store, now, data, mode, error, normalize);
    try {
      text = await store.read();
    } catch (e) {
      return make(defaultSave(), 'read-unavailable', `Không đọc được dữ liệu lưu: ${e}`);
    }
    if (text === null) return make(defaultSave(), 'writable');
    try {
      return make(parseSave(JSON.parse(text)), 'writable');
    } catch (e) {
      if (e instanceof SaveError) return make(defaultSave(), 'newer-version', e.message);
      return make(defaultSave(), 'writable', 'Dữ liệu lưu hỏng, bắt đầu lại.');
    }
  }

  get readOnly(): boolean {
    return this.mode !== 'writable';
  }

  /** Không biết nội dung bản trên máy; tải lại trang để thử đọc, không tự ghi lại phiên tạm. */
  get readUnavailable(): boolean {
    return this.mode === 'read-unavailable';
  }

  private get readOnlyError(): string {
    return this.readUnavailable ? READ_UNAVAILABLE_ERROR : READ_ONLY_ERROR;
  }

  get data(): SaveData {
    return this.current;
  }

  /** Đã có lỗi ghi và bản hiện tại vẫn chưa xuống kho (kể cả khi một bản cũ vừa ghi xong). */
  get needsBackup(): boolean {
    return this.writeFailed && this.current !== this.persisted;
  }

  /**
   * Đổi bản lưu bằng một hàm thuần. Hàm trả lại đúng bản cũ (không có gì đổi) thì không ghi.
   * Trả về true nếu có thay đổi. `onWritten` chỉ chạy sau biên nhận ghi đúng bản này.
   */
  update(change: (save: SaveData) => SaveData, onWritten?: () => void): boolean {
    const next = change(this.current);
    if (next === this.current) return false;
    const written = this.commit(next, this.current.revision + 1);
    if (onWritten && !this.readOnly)
      void written.then((error) => {
        if (error === undefined) onWritten();
      });
    return true;
  }

  /**
   * Giao dịch nguyên tử (Shop, đặc tả Hub mục 4.2, 8): đổi bản lưu bằng một hàm thuần rồi **chờ
   * ghi xong**. Ghi lỗi thì trả bản trong bộ nhớ về như trước giao dịch (nếu chưa có thay đổi
   * nào khác chồng lên) và báo lỗi; người gọi chỉ báo "đã mua" khi `ok`.
   */
  async transact(change: (save: SaveData) => SaveData): Promise<TransactResult> {
    if (this.readOnly) return { ok: false, error: this.readOnlyError };
    const before = this.current;
    const next = change(before);
    if (next === before) return { ok: true, changed: false };
    return this.commitChecked(next, before.revision + 1);
  }

  /** Mã sao lưu của bản hiện tại. */
  exportCode(): string {
    return encodeSaveCode(this.current);
  }

  /** Nhập mã sao lưu; chỉ báo thành công sau khi ghi. Mã sai vẫn ném SaveError khi giải mã. */
  importCode(code: string): Promise<TransactResult> {
    if (this.readOnly) return Promise.resolve({ ok: false, error: this.readOnlyError });
    const decoded = decodeSaveCode(code);
    const fixed = this.normalize(decoded);
    return this.commitChecked(
      fixed.save,
      Math.max(decoded.revision, this.current.revision) + 1,
    ).then((result) => {
      if (result.ok) this.notice = fixed.notice;
      return result;
    });
  }

  /** Xóa tiến trình, về bản mới (revision vẫn tăng để cloud biết đây là bản mới hơn). */
  reset(): Promise<TransactResult> {
    if (this.readOnly) return Promise.resolve({ ok: false, error: this.readOnlyError });
    return this.commitChecked(defaultSave(), this.current.revision + 1).then((result) => {
      if (result.ok) this.notice = undefined;
      return result;
    });
  }

  /** Chờ mọi lần ghi đang xếp hàng xong (khi đóng trang, trong test). */
  flush(): Promise<void> {
    return this.chain;
  }

  private async commitChecked(next: SaveData, revision: number): Promise<TransactResult> {
    const before = this.current;
    const written = this.commit(next, revision);
    const attempted = this.current;
    const error = await written;
    if (error === undefined) return { ok: true, changed: true };
    if (this.current === attempted) this.current = before;
    return { ok: false, error };
  }

  /** Đặt bản mới và xếp hàng một lần ghi; trả lời hứa của đúng lần ghi đó (lỗi, hoặc undefined). */
  private commit(next: SaveData, revision: number): Promise<string | undefined> {
    const snapshot = {
      ...next,
      revision,
      savedAt: this.readUnavailable ? this.current.savedAt : this.now(),
    };
    this.current = snapshot;
    if (this.readOnly) return Promise.resolve(undefined);
    const text = JSON.stringify(snapshot);
    const done = this.chain
      .then(() => this.store.write(text))
      .then(
        () => {
          this.persisted = snapshot;
          if (this.current === snapshot) this.writeFailed = false;
          this.lastError = undefined;
          return undefined;
        },
        (e: unknown) => {
          this.writeFailed = true;
          this.lastError = `Không ghi được dữ liệu lưu: ${String(e)}`;
          return this.lastError;
        },
      );
    this.chain = done.then(() => undefined);
    return done;
  }
}
