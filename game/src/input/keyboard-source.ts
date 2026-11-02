import { actionsFor, type KeyboardBindings } from '../logic/input/bindings';
import type { InputAggregator } from '../logic/input/aggregator';

/** Đọc bàn phím theo KeyboardEvent.code (không phụ thuộc kiểu bàn phím hay bộ gõ tiếng Việt). */
export class KeyboardSource {
  private capture: ((code: string) => void) | undefined;
  private readonly onDown = (e: KeyboardEvent): void => this.handleDown(e);
  private readonly onUp = (e: KeyboardEvent): void => this.handleUp(e);
  private readonly onBlur = (): void => this.aggregator.releaseAll('keyboard');

  constructor(
    private readonly aggregator: InputAggregator,
    private bindings: KeyboardBindings,
  ) {
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onBlur);
  }

  setBindings(bindings: KeyboardBindings): void {
    this.aggregator.releaseAll('keyboard');
    this.bindings = bindings;
  }

  /** Phím kế tiếp được giao cho callback thay vì điều khiển game (dùng khi đổi phím). */
  captureNext(callback: (code: string) => void): void {
    this.aggregator.releaseAll('keyboard');
    this.capture = callback;
  }

  cancelCapture(): void {
    this.capture = undefined;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onBlur);
  }

  private handleDown(e: KeyboardEvent): void {
    if (this.capture) {
      if (e.repeat) return;
      e.preventDefault();
      const callback = this.capture;
      this.capture = undefined;
      callback(e.code);
      return;
    }
    const actions = actionsFor(this.bindings, e.code);
    if (actions.length === 0) return;
    // Chặn cuộn trang bằng mũi tên/Space khi phím đó là phím game.
    e.preventDefault();
    if (e.repeat) return;
    for (const action of actions) this.aggregator.press('keyboard', action);
  }

  private handleUp(e: KeyboardEvent): void {
    for (const action of actionsFor(this.bindings, e.code)) {
      this.aggregator.release('keyboard', action);
    }
  }
}
