/**
 * Đầu vào của demo 2.5D: bàn phím và nút chạm → `WorldInput` cho mỗi bước logic. Lần bấm ngắn giữa
 * hai bước vẫn được tính (hàng đợi "vừa bấm", "vừa nhả").
 */
import { IDLE_INPUT, type WorldInput } from '../logic/world/world-types';

type Btn = 'left' | 'right' | 'up' | 'down' | 'jump' | 'shoot' | 'dash' | 'swapPrev' | 'swapNext';

const KEYS: Readonly<Record<string, Btn>> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
  KeyK: 'jump',
  KeyJ: 'shoot',
  KeyL: 'dash',
  ShiftLeft: 'dash',
  KeyQ: 'swapPrev',
  KeyE: 'swapNext',
};

export class DemoInput {
  private readonly held = new Set<Btn>();
  private readonly pressed = new Set<Btn>();
  private readonly released = new Set<Btn>();
  device: 'keyboard' | 'touch' = 'keyboard';

  constructor() {
    window.addEventListener('keydown', (e) => {
      const b = KEYS[e.code];
      if (!b) return;
      e.preventDefault();
      this.device = 'keyboard';
      if (!e.repeat) this.down(b);
    });
    window.addEventListener('keyup', (e) => {
      const b = KEYS[e.code];
      if (b) this.up(b);
    });
    window.addEventListener('blur', () => {
      for (const b of [...this.held]) this.up(b);
    });
  }

  down(b: Btn): void {
    if (!this.held.has(b)) this.pressed.add(b);
    this.held.add(b);
  }

  up(b: Btn): void {
    if (this.held.delete(b)) this.released.add(b);
  }

  /** Gắn nút chạm (`data-btn` = tên nút). */
  bindTouch(root: HTMLElement): void {
    for (const el of root.querySelectorAll<HTMLElement>('[data-btn]')) {
      const b = el.dataset.btn as Btn;
      const on = (e: PointerEvent): void => {
        e.preventDefault();
        this.device = 'touch';
        el.classList.add('on');
        el.setPointerCapture(e.pointerId);
        this.down(b);
      };
      const off = (): void => {
        el.classList.remove('on');
        this.up(b);
      };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
    }
  }

  /** Đầu vào của một bước logic; xóa hàng đợi bấm/nhả. */
  step(): WorldInput {
    const h = (b: Btn): boolean => this.held.has(b);
    const p = (b: Btn): boolean => this.pressed.has(b);
    const input: WorldInput = {
      ...IDLE_INPUT,
      moveX: (h('right') ? 1 : 0) - (h('left') ? 1 : 0),
      moveY: (h('down') ? 1 : 0) - (h('up') ? 1 : 0),
      jumpPressed: p('jump'),
      jumpHeld: h('jump'),
      dashPressed: p('dash'),
      downHeld: h('down'),
      shootPressed: p('shoot'),
      shootHeld: h('shoot'),
      shootReleased: this.released.has('shoot'),
      swapPrev: p('swapPrev'),
      swapNext: p('swapNext'),
    };
    this.pressed.clear();
    this.released.clear();
    return input;
  }
}
