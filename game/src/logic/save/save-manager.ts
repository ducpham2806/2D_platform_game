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

export class SaveManager {
  /** Lỗi đọc/ghi gần nhất (để hiện cho người chơi); undefined = ổn. */
  lastError: string | undefined;
  /** Thông báo cần hiện một lần (bản lưu được chuẩn hóa lại); người hiện xong thì xóa. */
  notice: string | undefined;
  /**
   * Bản trên máy thuộc phiên bản game mới hơn: chơi bằng bản mặc định nhưng không ghi đè,
   * tránh làm mất dữ liệu thật.
   */
  readonly readOnly: boolean;
  private current: SaveData;
  private chain: Promise<void> = Promise.resolve();

  private constructor(
    private readonly store: SaveStore,
    private readonly now: () => number,
    data: SaveData,
    readOnly: boolean,
    error: string | undefined,
    private readonly normalize: SaveNormalizer,
  ) {
    this.current = data;
    this.readOnly = readOnly;
    this.lastError = error;
    const fixed = normalize(data);
    if (fixed.save !== data) {
      this.notice = fixed.notice;
      this.commit(fixed.save, data.revision + 1);
    }
  }

  /**
   * Mở kho và đọc bản lưu. Không đọc được thì bắt đầu bản mới (và ghi lại lỗi). `normalize`
   * chạy ngay sau khi đọc (và sau mỗi lần nhập mã sao lưu); có sửa thì ghi lại một lần.
   */
  static async open(
    store: SaveStore,
    now: () => number = Date.now,
    normalize: SaveNormalizer = IDENTITY,
  ): Promise<SaveManager> {
    let text: string | null;
    const make = (data: SaveData, readOnly: boolean, error: string | undefined): SaveManager =>
      new SaveManager(store, now, data, readOnly, error, normalize);
    try {
      text = await store.read();
    } catch (e) {
      return make(defaultSave(), false, `Không đọc được dữ liệu lưu: ${e}`);
    }
    if (text === null) return make(defaultSave(), false, undefined);
    try {
      return make(parseSave(JSON.parse(text)), false, undefined);
    } catch (e) {
      if (e instanceof SaveError) return make(defaultSave(), true, e.message);
      return make(defaultSave(), false, 'Dữ liệu lưu hỏng, bắt đầu lại.');
    }
  }

  get data(): SaveData {
    return this.current;
  }

  /**
   * Đổi bản lưu bằng một hàm thuần. Hàm trả lại đúng bản cũ (không có gì đổi) thì không ghi.
   * Trả về true nếu có thay đổi.
   */
  update(change: (save: SaveData) => SaveData): boolean {
    const next = change(this.current);
    if (next === this.current) return false;
    this.commit(next, this.current.revision + 1);
    return true;
  }

  /** Mã sao lưu của bản hiện tại. */
  exportCode(): string {
    return encodeSaveCode(this.current);
  }

  /** Nhập mã sao lưu, thay hẳn bản hiện tại. Mã sai thì ném SaveError, bản hiện tại giữ nguyên. */
  importCode(code: string): void {
    const decoded = decodeSaveCode(code);
    const fixed = this.normalize(decoded);
    this.notice = fixed.notice;
    this.commit(fixed.save, Math.max(decoded.revision, this.current.revision) + 1);
  }

  /** Xóa tiến trình, về bản mới (revision vẫn tăng để cloud biết đây là bản mới hơn). */
  reset(): void {
    this.commit(defaultSave(), this.current.revision + 1);
  }

  /** Chờ mọi lần ghi đang xếp hàng xong (khi đóng trang, trong test). */
  flush(): Promise<void> {
    return this.chain;
  }

  private commit(next: SaveData, revision: number): void {
    this.current = { ...next, revision, savedAt: this.now() };
    if (this.readOnly) return;
    const text = JSON.stringify(this.current);
    this.chain = this.chain
      .then(() => this.store.write(text))
      .then(
        () => {
          this.lastError = undefined;
        },
        (e: unknown) => {
          this.lastError = `Không ghi được dữ liệu lưu: ${String(e)}`;
        },
      );
  }
}
