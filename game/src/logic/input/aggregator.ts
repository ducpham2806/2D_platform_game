import {
  ACTIONS,
  type Action,
  emptyActionRecord,
  type InputDevice,
  type InputSnapshot,
} from './actions';

interface AxisState {
  x: number;
  y: number;
}

/**
 * Gộp nhiều nguồn (bàn phím, tay cầm, cảm ứng) thành một InputSnapshot cho mỗi bước logic.
 * Nguồn báo press/release bất cứ lúc nào; step() chốt trạng thái một lần mỗi bước 60 Hz.
 */
export class InputAggregator {
  private readonly held = new Map<InputDevice, Set<Action>>();
  private readonly axes = new Map<InputDevice, AxisState>();
  private readonly pressLatch = new Set<Action>();
  private readonly releaseLatch = new Set<Action>();
  private previous = emptyActionRecord();
  private lastDevice: InputDevice;

  constructor(
    initialDevice: InputDevice = 'keyboard',
    private readonly onDeviceChange?: (device: InputDevice) => void,
  ) {
    this.lastDevice = initialDevice;
  }

  get device(): InputDevice {
    return this.lastDevice;
  }

  press(device: InputDevice, action: Action): void {
    const set = this.heldSet(device);
    if (set.has(action)) return;
    set.add(action);
    this.pressLatch.add(action);
    this.touchDevice(device);
  }

  release(device: InputDevice, action: Action): void {
    const set = this.heldSet(device);
    if (!set.delete(action)) return;
    if (!this.isHeldAnywhere(action)) this.releaseLatch.add(action);
  }

  /** Nhả mọi phím của một nguồn (mất focus, rút tay cầm, ẩn lớp cảm ứng). */
  releaseAll(device: InputDevice): void {
    for (const action of [...this.heldSet(device)]) this.release(device, action);
    this.axes.delete(device);
  }

  /** Trục analog (-1..1) đã qua vùng chết; (0, 0) nghĩa là không dùng trục. */
  setAxis(device: InputDevice, x: number, y: number): void {
    const clampedX = Math.max(-1, Math.min(1, x));
    const clampedY = Math.max(-1, Math.min(1, y));
    if (clampedX === 0 && clampedY === 0) {
      this.axes.delete(device);
      return;
    }
    this.axes.set(device, { x: clampedX, y: clampedY });
    this.touchDevice(device);
  }

  step(): InputSnapshot {
    const held = emptyActionRecord();
    const pressed = emptyActionRecord();
    const released = emptyActionRecord();
    for (const action of ACTIONS) {
      held[action] = this.isHeldAnywhere(action);
      pressed[action] = this.pressLatch.has(action) || (held[action] && !this.previous[action]);
      released[action] = this.releaseLatch.has(action) || (!held[action] && this.previous[action]);
    }
    this.pressLatch.clear();
    this.releaseLatch.clear();
    this.previous = held;
    const axis = this.strongestAxis();
    const digitalX = Number(held.right) - Number(held.left);
    const digitalY = Number(held.down) - Number(held.up);
    return {
      moveX: axis && axis.x !== 0 ? axis.x : digitalX,
      moveY: axis && axis.y !== 0 ? axis.y : digitalY,
      held,
      pressed,
      released,
      device: this.lastDevice,
    };
  }

  private heldSet(device: InputDevice): Set<Action> {
    let set = this.held.get(device);
    if (!set) {
      set = new Set();
      this.held.set(device, set);
    }
    return set;
  }

  private isHeldAnywhere(action: Action): boolean {
    for (const set of this.held.values()) if (set.has(action)) return true;
    return false;
  }

  private strongestAxis(): AxisState | undefined {
    let best: AxisState | undefined;
    for (const axis of this.axes.values()) {
      if (!best || Math.hypot(axis.x, axis.y) > Math.hypot(best.x, best.y)) best = axis;
    }
    return best;
  }

  private touchDevice(device: InputDevice): void {
    if (device === this.lastDevice) return;
    this.lastDevice = device;
    this.onDeviceChange?.(device);
  }
}
