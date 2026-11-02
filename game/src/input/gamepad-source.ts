import { ACTIONS, type Action } from '../logic/input/actions';
import type { InputAggregator } from '../logic/input/aggregator';
import type { GamepadBindings } from '../logic/input/bindings';
import { applyDeadzone } from '../logic/input/stick';

function firstPad(): Gamepad | undefined {
  const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
  for (const pad of pads) if (pad?.connected) return pad;
  return undefined;
}

function isDown(button: GamepadButton | undefined): boolean {
  return Boolean(button && (button.pressed || button.value > 0.5));
}

/** Tay cầm qua Gamepad API (bố cục standard). Gamepad API không có sự kiện nút nên phải poll mỗi bước. */
export class GamepadSource {
  private readonly held = new Set<Action>();
  private previousButtons: boolean[] = [];
  private capture: ((index: number) => void) | undefined;

  constructor(
    private readonly aggregator: InputAggregator,
    private bindings: GamepadBindings,
    private readonly deadzone: number,
  ) {}

  setBindings(bindings: GamepadBindings): void {
    this.aggregator.releaseAll('gamepad');
    this.held.clear();
    this.bindings = bindings;
  }

  captureNext(callback: (index: number) => void): void {
    this.capture = callback;
  }

  cancelCapture(): void {
    this.capture = undefined;
  }

  get connected(): boolean {
    return firstPad() !== undefined;
  }

  poll(): void {
    const pad = firstPad();
    if (!pad) {
      if (this.held.size > 0) this.aggregator.releaseAll('gamepad');
      this.held.clear();
      this.previousButtons = [];
      return;
    }
    const buttons = pad.buttons.map(isDown);
    if (this.capture) {
      const index = buttons.findIndex((down, i) => down && !this.previousButtons[i]);
      if (index >= 0) {
        const callback = this.capture;
        this.capture = undefined;
        callback(index);
      }
      this.previousButtons = buttons;
      return;
    }
    this.previousButtons = buttons;
    for (const action of ACTIONS) {
      const down = this.bindings[action].some((i) => buttons[i] === true);
      if (down && !this.held.has(action)) {
        this.held.add(action);
        this.aggregator.press('gamepad', action);
      } else if (!down && this.held.has(action)) {
        this.held.delete(action);
        this.aggregator.release('gamepad', action);
      }
    }
    const axis = applyDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0, this.deadzone);
    this.aggregator.setAxis('gamepad', axis.x, axis.y);
  }
}
