/** Một câu thoại: người nói và nội dung (đã chọn ngôn ngữ). */
export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface DialogueInput {
  /** Bấm Tiếp (hoặc chạm vào hộp): hiện hết câu đang gõ, hoặc sang câu sau. */
  advance: boolean;
  /** Bấm Bỏ qua: kết thúc cả đoạn. */
  skip: boolean;
}

/**
 * Chạy một đoạn hội thoại (P-UI-DIALOG): chữ hiện dần theo `charsPerSec`, bấm Tiếp khi chữ
 * đang hiện thì hiện hết câu, bấm lần nữa thì sang câu sau, Bỏ qua thì kết thúc ngay.
 * Logic thuần; hộp vẽ ở `scenes/stage/dialogue-box.ts`.
 */
export class DialoguePlayer {
  private i = 0;
  private shown = 0;
  private done: boolean;

  constructor(
    private readonly lines: readonly DialogueLine[],
    private readonly charsPerSec: number,
  ) {
    this.done = lines.length === 0;
  }

  get finished(): boolean {
    return this.done;
  }

  /** Câu đang hiện; `undefined` khi đã hết đoạn. */
  get line(): DialogueLine | undefined {
    return this.done ? undefined : this.lines[this.i];
  }

  get index(): number {
    return this.i;
  }

  get isLastLine(): boolean {
    return this.i >= this.lines.length - 1;
  }

  /** Số ký tự của câu đang hiện đã lộ ra. */
  get visibleChars(): number {
    const total = this.line?.text.length ?? 0;
    return Math.min(total, Math.floor(this.shown));
  }

  get lineComplete(): boolean {
    return this.visibleChars >= (this.line?.text.length ?? 0);
  }

  step(dtSec: number, input: DialogueInput): void {
    if (this.done) return;
    if (input.skip) {
      this.done = true;
      return;
    }
    if (input.advance) {
      if (!this.lineComplete) {
        this.shown = this.line?.text.length ?? 0;
      } else if (this.isLastLine) {
        this.done = true;
      } else {
        this.i += 1;
        this.shown = 0;
      }
      return;
    }
    this.shown += this.charsPerSec * dtSec;
  }
}
