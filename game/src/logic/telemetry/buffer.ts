/**
 * Bộ đệm sự kiện theo ưu tiên (logic thuần, ST-13-01; `01-GDD/13-Do-luong-MVP.md` mục 5, 8;
 * QB-150, QB-151).
 *
 * Mỗi mục giữ sự kiện, chuỗi JSON đã tính một lần (byte = độ dài, vì chỉ có ASCII), ưu tiên và
 * trạng thái: **chờ**, **đang gửi** trong lô `batch`, hoặc **đã nhận**. Giới hạn `maxBytes` và
 * `maxEvents` không bao giờ bị vượt. Khi một sự kiện mới làm vượt, bỏ lần lượt:
 * 1. mục **đã nhận** cũ nhất (mọi ưu tiên);
 * 2. mục chờ ưu tiên 2, cũ trước; 3. mục chờ ưu tiên 1, cũ trước.
 * Sự kiện mới cũng được xét như mọi mục khác. Mục đang gửi và mục chờ ưu tiên 0 không bị bỏ; nếu
 * chỉ còn chúng thì không lưu sự kiện mới và tăng `lost`.
 *
 * Lô đã cắt thì bất biến (QB-151): `cutBatch` trả lại đúng lô đang gửi cho tới khi `ack` (đã nhận,
 * kể cả 409) hoặc `discard` (điểm nhận từ chối hẳn). Giữ mục đã nhận để Xuất JSON có đủ dữ liệu.
 */
import type { Priority, TelemetryEvent } from './schema';

export interface BufferLimits {
  maxBytes: number;
  maxEvents: number;
}

/** Chờ: `undefined`; đang gửi: id lô; đã nhận: -1. */
type EntryState = undefined | string | -1;

interface Entry {
  ev: TelemetryEvent;
  json: string;
  priority: Priority;
  state: EntryState;
}

/** Dạng lưu của một sự kiện (`cv.telemetry.q.*`): `s` = id lô đang gửi, hoặc -1 nếu đã nhận. */
export type StoredEvent = TelemetryEvent & { s?: string | -1 };

export interface CutBatch {
  id: string;
  events: TelemetryEvent[];
}

const key = (ev: TelemetryEvent): string => `${ev.sid}:${ev.n}`;

export class TelemetryBuffer {
  private entries: Entry[] = [];
  private totalBytes = 0;
  /** Mục chờ bị bỏ (kể cả sự kiện mới) theo luật QB-150, theo ưu tiên. */
  readonly dropped: Record<Priority, number> = { 0: 0, 1: 0, 2: 0 };
  /** Sự kiện mới không lưu được vì chỉ còn mục không bỏ được. */
  lost = 0;

  constructor(private readonly limits: BufferLimits) {}

  get size(): number {
    return this.entries.length;
  }

  get bytes(): number {
    return this.totalBytes;
  }

  get pendingCount(): number {
    let n = 0;
    for (const en of this.entries) if (en.state === undefined) n += 1;
    return n;
  }

  /**
   * Thêm một sự kiện đã kiểm lược đồ; `json` là `JSON.stringify(ev)` (tính một lần ở bộ ghi).
   * Trả về false nếu không lưu được.
   */
  push(
    ev: TelemetryEvent,
    json: string,
    priority: Priority,
    state: EntryState = undefined,
  ): boolean {
    const entry: Entry = { ev, json, priority, state };
    this.entries.push(entry);
    this.totalBytes += json.length;
    while (this.over()) {
      const victim = this.pickVictim();
      if (victim < 0) {
        this.removeEntry(entry);
        this.lost += 1;
        return false;
      }
      const removed = this.entries[victim] as Entry;
      this.removeAt(victim);
      if (removed.state === undefined) this.dropped[removed.priority] += 1;
      // Sự kiện mới là mục chờ cũ nhất cùng ưu tiên: bỏ theo luật, không phải "lost".
      if (removed === entry) return false;
    }
    return true;
  }

  /** Sự kiện chờ gửi, theo thứ tự ghi. */
  pending(): TelemetryEvent[] {
    return this.entries.filter((en) => en.state === undefined).map((en) => en.ev);
  }

  /** Mọi sự kiện còn giữ (chờ, đang gửi, đã nhận), theo thứ tự ghi. */
  all(): TelemetryEvent[] {
    return this.entries.map((en) => en.ev);
  }

  /** Lô đang gửi (nếu có): thử lại phải gửi đúng lô này. */
  inFlight(): CutBatch | undefined {
    const first = this.entries.find((en) => typeof en.state === 'string');
    if (!first) return undefined;
    const id = first.state as string;
    return { id, events: this.entries.filter((en) => en.state === id).map((en) => en.ev) };
  }

  /**
   * Cắt lô tiếp theo: nếu còn lô đang gửi thì trả lại đúng lô đó; nếu không, lấy các mục chờ theo
   * thứ tự ghi cho tới `maxEvents` sự kiện và `maxBytes` byte JSON của cả lô (`envelopeBytes` là
   * byte phần vỏ lô khi chưa có sự kiện), gán id `id`. Không có gì chờ thì trả undefined.
   */
  cutBatch(
    id: string,
    maxEvents: number,
    maxBytes: number,
    envelopeBytes: number,
  ): CutBatch | undefined {
    const flying = this.inFlight();
    if (flying) return flying;
    const events: TelemetryEvent[] = [];
    let used = envelopeBytes;
    for (const en of this.entries) {
      if (en.state !== undefined) continue;
      const add = en.json.length + (events.length > 0 ? 1 : 0);
      if (events.length >= maxEvents || used + add > maxBytes) break;
      used += add;
      en.state = id;
      events.push(en.ev);
    }
    return events.length > 0 ? { id, events } : undefined;
  }

  /** Điểm nhận đã nhận lô (2xx hoặc 409 trùng). */
  ack(id: string): void {
    for (const en of this.entries) if (en.state === id) en.state = -1;
  }

  /** Điểm nhận từ chối hẳn lô (sai lược đồ, quá giới hạn): bỏ các mục của lô. */
  discard(id: string): void {
    for (let i = this.entries.length - 1; i >= 0; i -= 1)
      if ((this.entries[i] as Entry).state === id) this.removeAt(i);
  }

  clear(): void {
    this.entries = [];
    this.totalBytes = 0;
  }

  /** Dạng lưu: mảng JSON ghép từ các chuỗi đã cất (không stringify lại sự kiện). */
  serialize(): string {
    const parts = this.entries.map((en) =>
      en.state === undefined ? en.json : `${en.json.slice(0, -1)},"s":${JSON.stringify(en.state)}}`,
    );
    return `[${parts.join(',')}]`;
  }

  /**
   * Nạp lại từ dạng lưu (có thể gộp nhiều hàng đợi). Bỏ mục trùng (`sid` + `n`) đã có; mục vào
   * theo thứ tự cho sẵn và vẫn theo giới hạn. `priorityOf` lấy ưu tiên theo tên sự kiện.
   */
  restore(stored: readonly StoredEvent[], priorityOf: (ev: TelemetryEvent) => Priority): number {
    const seen = new Set(this.entries.map((en) => key(en.ev)));
    let added = 0;
    for (const item of stored) {
      const { s, ...ev } = item;
      if (seen.has(key(ev))) continue;
      seen.add(key(ev));
      if (this.push(ev, JSON.stringify(ev), priorityOf(ev), s)) added += 1;
    }
    return added;
  }

  private over(): boolean {
    return this.entries.length > this.limits.maxEvents || this.totalBytes > this.limits.maxBytes;
  }

  /** Chỉ số mục bỏ tiếp theo, hoặc -1 nếu không còn mục nào bỏ được. */
  private pickVictim(): number {
    let p2 = -1;
    let p1 = -1;
    for (let i = 0; i < this.entries.length; i += 1) {
      const en = this.entries[i] as Entry;
      if (en.state === -1) return i;
      if (en.state !== undefined) continue;
      if (en.priority === 2 && p2 < 0) p2 = i;
      else if (en.priority === 1 && p1 < 0) p1 = i;
    }
    return p2 >= 0 ? p2 : p1;
  }

  private removeEntry(entry: Entry): void {
    const i = this.entries.lastIndexOf(entry);
    if (i >= 0) this.removeAt(i);
  }

  private removeAt(i: number): void {
    const [en] = this.entries.splice(i, 1);
    if (en) this.totalBytes -= en.json.length;
  }
}
