/**
 * Chạy một lần hội thoại (P-UI-DIALOG): chữ hiện dần theo `charsPerSec`; bấm Tiếp lần đầu hiện
 * hết câu, lần sau sang câu kế, hết câu thì đóng; Bỏ qua đóng ngay. Phím bấm trong
 * `inputGraceSec` đầu bị bỏ qua để bấm dồn (đang bắn boss) không lướt mất thoại. Không có hẹn
 * giờ tự đóng: người chơi luôn bỏ qua được nên không bị khóa điều khiển (GDD 3.6). Logic thuần.
 */
import type { DialogueLine } from './boss-dialogue';

export interface DialogueRules {
  charsPerSec: number;
  inputGraceSec: number;
}

export interface DialogueInput {
  /** Tiếp (Nhảy, Bắn, Tương tác, chạm vào hộp). */
  next: boolean;
  /** Bỏ qua cả đoạn. */
  skip: boolean;
}

export interface DialogueView {
  speakerId: string;
  speaker: string;
  /** Phần chữ đã hiện. */
  text: string;
  /** Câu đã hiện hết (nút Tiếp đổi nghĩa thành sang câu sau). */
  full: boolean;
  /** Thứ tự câu (từ 0) và tổng số câu. */
  index: number;
  count: number;
}

export interface DialogueStepResult {
  /** Vừa sang câu mới. */
  advanced: boolean;
  /** Vừa đóng (hết câu hoặc bỏ qua). */
  closed: boolean;
  skipped: boolean;
}

export class DialogueRunner {
  private index = 0;
  private shown = 0;
  private elapsed = 0;
  private closed = false;
  /** Câu tách theo điểm mã để không cắt đôi ký tự. */
  private readonly chars: string[][];

  constructor(
    private readonly lines: readonly DialogueLine[],
    private readonly rules: DialogueRules,
  ) {
    this.chars = lines.map((l) => Array.from(l.text));
    if (lines.length === 0) this.closed = true;
  }

  get done(): boolean {
    return this.closed;
  }

  get view(): DialogueView | undefined {
    const line = this.lines[this.index];
    const chars = this.chars[this.index];
    if (this.closed || !line || !chars) return undefined;
    const n = Math.min(chars.length, Math.floor(this.shown + 1e-9));
    return {
      speakerId: line.speakerId,
      speaker: line.speaker,
      text: n >= chars.length ? line.text : chars.slice(0, n).join(''),
      full: n >= chars.length,
      index: this.index,
      count: this.lines.length,
    };
  }

  step(input: DialogueInput, dt: number): DialogueStepResult {
    const result: DialogueStepResult = { advanced: false, closed: false, skipped: false };
    if (this.closed) return result;
    this.elapsed += dt;
    const accept = this.elapsed > this.rules.inputGraceSec;
    const chars = this.chars[this.index] ?? [];
    if (accept && input.skip) {
      this.close(result);
      result.skipped = true;
      return result;
    }
    if (accept && input.next) {
      if (this.shown < chars.length) {
        this.shown = chars.length;
      } else if (this.index + 1 < this.lines.length) {
        this.index += 1;
        this.shown = 0;
        result.advanced = true;
      } else {
        this.close(result);
        return result;
      }
      return result;
    }
    this.shown = Math.min(chars.length, this.shown + this.rules.charsPerSec * dt);
    return result;
  }

  private close(result: DialogueStepResult): void {
    this.closed = true;
    result.closed = true;
  }
}
