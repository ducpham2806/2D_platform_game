/**
 * Hộp chữ trên màn hình (01-GDD/17-Quy-tac-bien.md mục 8; EP-14 ST-14-08). Logic thuần.
 *
 * - QB-70: mỗi lúc một hộp, theo thứ tự `BOX_ORDER`; hộp thấp ẩn khi hộp cao hiện, rồi hiện lại.
 * - QB-71: hộp bị che liền quá `maxWaitSec` giây trận đang chạy thì hủy; mất ngữ cảnh thì người
 *   gọi `cancel()`.
 * - QB-72: thời gian đọc = max(tối thiểu, số ký tự / tốc độ đọc); không đếm khi tạm dừng, có hội
 *   thoại hay bị che.
 */

/** Thứ tự ưu tiên, cao trước (QB-70). */
export const BOX_ORDER = [
  'dialogue',
  'result',
  'deathHint',
  'tutorial',
  'questLine',
  'toast',
] as const;
export type BoxKind = (typeof BOX_ORDER)[number];

/** Hộp được hiện trong số các hộp đang muốn hiện; undefined khi không hộp nào muốn. */
export function topBox(wants: Partial<Record<BoxKind, boolean>>): BoxKind | undefined {
  return BOX_ORDER.find((k) => wants[k] === true);
}

/** Tốc độ đọc chung (`ui.json → reading`). */
export interface ReadingRules {
  /** Ký tự mỗi giây người chơi đọc (khác `ui.dialogue.charsPerSec`: tốc độ chữ hiện dần). */
  charsPerSec: number;
  /** Hộp hiện ít nhất chừng này giây. */
  minSec: number;
  /** Bị che liền quá chừng này giây thì hủy (QB-71). */
  maxWaitSec: number;
}

/**
 * Số giây hộp cần hiện để đọc hết `text`: max(minSec, số ký tự / charsPerSec). Ký tự đếm theo code
 * point sau khi chuẩn hóa NFC (chữ Việt dạng tách dấu không bị đếm gấp đôi).
 */
export function readingSec(text: string, minSec: number, charsPerSec: number): number {
  return Math.max(minSec, Array.from(text.normalize('NFC')).length / charsPerSec);
}

/**
 * Đồng hồ của một bước cố định:
 * - `frozen`: trận đứng yên (menu tạm dừng, bảng Kỹ năng, hội thoại, màn Kết quả): không đếm gì.
 *   Hộp có thể đang bị che (hội thoại) nhưng không có gì cũ đi nên không tính là chờ.
 * - `covered`: trận chạy nhưng hộp cao hơn đang hiện: không trừ thời gian đọc, cộng thời gian chờ.
 * - `free`: trận chạy và hộp được hiện: trừ thời gian đọc.
 */
export type BoxClock = 'frozen' | 'covered' | 'free';

/** Hộp tự tắt theo thời gian đọc (gợi ý chết; sau này Báo ngắn). Đồng hồ là thời gian trận. */
export class TimedBox {
  private current: string | undefined;
  private left = 0;
  private waited = 0;
  private seen = false;

  constructor(private readonly rules: ReadingRules) {}

  /** Đặt câu mới (thay câu cũ). `minSec`: mức tối thiểu riêng của hộp, mặc định `rules.minSec`. */
  post(text: string, minSec = this.rules.minSec): void {
    this.current = text;
    this.left = readingSec(text, minSec, this.rules.charsPerSec);
    this.waited = 0;
    this.seen = false;
  }

  /** Bỏ câu đang chờ hoặc đang hiện. */
  cancel(): void {
    this.current = undefined;
    this.left = 0;
    this.waited = 0;
    this.seen = false;
  }

  /** Còn hiệu lực (đang hiện hoặc đang chờ được hiện). */
  get active(): boolean {
    return this.current !== undefined;
  }

  get text(): string | undefined {
    return this.current;
  }

  /** Giây đọc còn lại. */
  get remainingSec(): number {
    return this.left;
  }

  /** Giây đã bị che liền tới giờ. */
  get waitedSec(): number {
    return this.waited;
  }

  /** Đếm một bước. Trả true ở bước đầu tiên câu hiện tới người chơi (để ghi đo lường). */
  step(dtSec: number, clock: BoxClock): boolean {
    if (this.current === undefined || clock === 'frozen' || dtSec <= 0) return false;
    if (clock === 'covered') {
      this.waited += dtSec;
      if (this.waited > this.rules.maxWaitSec) this.cancel();
      return false;
    }
    const first = !this.seen;
    this.seen = true;
    this.waited = 0;
    this.left -= dtSec;
    if (this.left <= 1e-9) this.cancel();
    return first;
  }
}
