import type { InputAggregator } from '../logic/input/aggregator';
import { clampToRadius, stickVector } from '../logic/input/stick';
import {
  effectiveAnchor,
  fixedStickCenter,
  hitTest,
  inRect,
  pointToAnchor,
  type ResolvedButton,
  resolveButtons,
  stickZone,
  type TouchConfig,
  type TouchSettings,
  type Viewport,
} from '../logic/input/touch-layout';

interface StickTouch {
  pointerId: number;
  cx: number;
  cy: number;
}

interface DragTouch {
  pointerId: number;
  buttonId: string;
  dx: number;
  dy: number;
}

/**
 * Lớp điều khiển cảm ứng bằng HTML phủ toàn màn hình (ngoài canvas, để dùng được cả vùng viền
 * đen và đo kích thước bằng px CSS = dp). Hai chế độ: chơi (bấm nút, cần ảo) và chỉnh (kéo thả).
 */
export class TouchOverlay {
  readonly root: HTMLDivElement;
  private readonly buttonEls = new Map<string, HTMLDivElement>();
  private readonly stickBase: HTMLDivElement;
  private readonly stickKnob: HTMLDivElement;
  private buttons: ResolvedButton[] = [];
  private readonly pointerButtons = new Map<number, ResolvedButton>();
  private stick: StickTouch | undefined;
  private drag: DragTouch | undefined;
  private mode: 'hidden' | 'play' | 'edit' = 'hidden';
  private readonly onResize = (): void => this.layout();

  constructor(
    private readonly config: TouchConfig,
    private settings: TouchSettings,
    private readonly aggregator: InputAggregator,
    /** Gọi khi người chơi kéo xong một nút trong chế độ chỉnh. */
    private readonly onMoved: (offsets: TouchSettings['offsets']) => void,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'touch-layer';
    this.root.dataset.mode = 'hidden';
    this.stickBase = document.createElement('div');
    this.stickBase.className = 'touch-stick-base';
    this.stickKnob = document.createElement('div');
    this.stickKnob.className = 'touch-stick-knob';
    this.root.append(this.stickBase, this.stickKnob);
    for (const button of config.buttons) {
      const el = document.createElement('div');
      el.className = 'touch-button';
      el.dataset.id = button.id;
      el.textContent = button.label;
      this.buttonEls.set(button.id, el);
      this.root.append(el);
    }
    this.root.addEventListener('pointerdown', (e) => this.onDown(e));
    this.root.addEventListener('pointermove', (e) => this.onMove(e));
    this.root.addEventListener('pointerup', (e) => this.onUp(e));
    this.root.addEventListener('pointercancel', (e) => this.onUp(e));
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', this.onResize);
    document.body.append(this.root);
    this.layout();
  }

  setMode(mode: 'hidden' | 'play' | 'edit'): void {
    if (mode === this.mode) return;
    this.releaseAll();
    this.mode = mode;
    this.root.dataset.mode = mode;
    this.layout();
  }

  get currentMode(): 'hidden' | 'play' | 'edit' {
    return this.mode;
  }

  setSettings(settings: TouchSettings): void {
    this.settings = settings;
    this.layout();
  }

  destroy(): void {
    this.releaseAll();
    window.removeEventListener('resize', this.onResize);
    this.root.remove();
  }

  private viewport(): Viewport {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  private layout(): void {
    const viewport = this.viewport();
    this.buttons = resolveButtons(viewport, this.config, this.settings);
    this.root.style.setProperty('--touch-opacity', String(this.settings.opacity));
    for (const b of this.buttons) {
      const el = this.buttonEls.get(b.id);
      if (!el) continue;
      el.style.width = `${b.size}px`;
      el.style.height = `${b.size}px`;
      el.style.left = `${b.cx - b.size / 2}px`;
      el.style.top = `${b.cy - b.size / 2}px`;
    }
    const showFixed = this.mode === 'edit' || this.settings.stickMode === 'fixed';
    if (!this.stick) {
      const center = fixedStickCenter(viewport, this.config, this.settings.leftHanded);
      this.placeStick(center.cx, center.cy, center.cx, center.cy, showFixed);
    }
  }

  private placeStick(cx: number, cy: number, kx: number, ky: number, visible: boolean): void {
    const r = this.config.stick.radiusDp;
    this.stickBase.style.width = `${r * 2}px`;
    this.stickBase.style.height = `${r * 2}px`;
    this.stickBase.style.left = `${cx - r}px`;
    this.stickBase.style.top = `${cy - r}px`;
    const knob = r * 0.8;
    this.stickKnob.style.width = `${knob}px`;
    this.stickKnob.style.height = `${knob}px`;
    this.stickKnob.style.left = `${kx - knob / 2}px`;
    this.stickKnob.style.top = `${ky - knob / 2}px`;
    this.stickBase.hidden = !visible;
    this.stickKnob.hidden = !visible;
  }

  private onDown(e: PointerEvent): void {
    if (this.mode === 'hidden') return;
    e.preventDefault();
    this.root.setPointerCapture(e.pointerId);
    const hit = hitTest(this.buttons, e.clientX, e.clientY, this.config.minButtonDp);
    if (this.mode === 'edit') {
      if (hit)
        this.drag = {
          pointerId: e.pointerId,
          buttonId: hit.id,
          dx: hit.cx - e.clientX,
          dy: hit.cy - e.clientY,
        };
      return;
    }
    if (hit) {
      this.pointerButtons.set(e.pointerId, hit);
      this.buttonEls.get(hit.id)?.classList.add('active');
      this.aggregator.press('touch', hit.action);
      if (this.settings.vibration && typeof navigator.vibrate === 'function') navigator.vibrate(8);
      return;
    }
    if (this.stick) return;
    const viewport = this.viewport();
    if (this.settings.stickMode === 'fixed') {
      const c = fixedStickCenter(viewport, this.config, this.settings.leftHanded);
      if (Math.hypot(e.clientX - c.cx, e.clientY - c.cy) <= this.config.stick.radiusDp * 1.5) {
        this.stick = { pointerId: e.pointerId, cx: c.cx, cy: c.cy };
        this.updateStick(e.clientX, e.clientY);
      }
      return;
    }
    if (inRect(stickZone(viewport, this.config, this.settings.leftHanded), e.clientX, e.clientY)) {
      this.stick = { pointerId: e.pointerId, cx: e.clientX, cy: e.clientY };
      this.updateStick(e.clientX, e.clientY);
    }
  }

  private onMove(e: PointerEvent): void {
    if (this.drag && e.pointerId === this.drag.pointerId) {
      const el = this.buttonEls.get(this.drag.buttonId);
      const b = this.buttons.find((x) => x.id === this.drag?.buttonId);
      if (el && b) {
        b.cx = e.clientX + this.drag.dx;
        b.cy = e.clientY + this.drag.dy;
        el.style.left = `${b.cx - b.size / 2}px`;
        el.style.top = `${b.cy - b.size / 2}px`;
      }
      return;
    }
    if (this.stick && e.pointerId === this.stick.pointerId) this.updateStick(e.clientX, e.clientY);
  }

  private onUp(e: PointerEvent): void {
    if (this.drag && e.pointerId === this.drag.pointerId) {
      this.finishDrag();
      return;
    }
    const button = this.pointerButtons.get(e.pointerId);
    if (button) {
      this.pointerButtons.delete(e.pointerId);
      const stillHeld = [...this.pointerButtons.values()].some((b) => b.action === button.action);
      if (!stillHeld) {
        this.buttonEls.get(button.id)?.classList.remove('active');
        this.aggregator.release('touch', button.action);
      }
      return;
    }
    if (this.stick && e.pointerId === this.stick.pointerId) {
      this.stick = undefined;
      this.aggregator.setAxis('touch', 0, 0);
      this.layout();
    }
  }

  private updateStick(x: number, y: number): void {
    if (!this.stick) return;
    const { cx, cy } = this.stick;
    const r = this.config.stick.radiusDp;
    const v = stickVector(cx, cy, x, y, r, this.config.stick.deadzone);
    this.aggregator.setAxis('touch', v.x, v.y);
    const knob = clampToRadius(cx, cy, x, y, r);
    this.placeStick(cx, cy, knob.x, knob.y, true);
  }

  private finishDrag(): void {
    const drag = this.drag;
    this.drag = undefined;
    if (!drag) return;
    const config = this.config.buttons.find((b) => b.id === drag.buttonId);
    const b = this.buttons.find((x) => x.id === drag.buttonId);
    if (!config || !b) return;
    const anchor = effectiveAnchor(config.anchor, this.settings.leftHanded);
    const offset = pointToAnchor(anchor, b.cx, b.cy, this.viewport());
    const offsets = {
      ...this.settings.offsets,
      [drag.buttonId]: {
        x: Math.max(0, Math.round(offset.x)),
        y: Math.max(0, Math.round(offset.y)),
      },
    };
    this.onMoved(offsets);
  }

  private releaseAll(): void {
    this.pointerButtons.clear();
    this.stick = undefined;
    this.drag = undefined;
    for (const el of this.buttonEls.values()) el.classList.remove('active');
    this.aggregator.releaseAll('touch');
  }
}
