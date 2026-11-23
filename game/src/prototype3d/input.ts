import { cameraMove } from '../logic/prototype3d/geometry';
import { type RoomInput } from '../logic/prototype3d/room';

const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const FRONT = ['KeyW', 'ArrowUp'];
const BACK = ['KeyS', 'ArrowDown'];
const DASH = ['ShiftLeft', 'ShiftRight'];
const CAPTURE = new Set([...LEFT, ...RIGHT, ...FRONT, ...BACK, ...DASH, 'Space', 'KeyJ']);

export class PrototypeInput {
  private readonly down = new Set<string>();
  private readonly puck: HTMLElement;
  private stickId: number | undefined;
  private shootId: number | undefined;
  private stickX = 0;
  private stickY = 0;
  private jump = false;
  private dash = false;
  private shoot = false;
  enabled = false;

  constructor(
    private readonly stick: HTMLElement,
    jump: HTMLElement,
    dash: HTMLElement,
    shoot: HTMLElement,
  ) {
    this.puck = stick.querySelector<HTMLElement>('.puck')!;
    window.addEventListener('keydown', (e) => {
      if (!this.enabled || !CAPTURE.has(e.code) || e.altKey || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      this.down.add(e.code);
      if (e.repeat) return;
      if (e.code === 'Space') this.jump = true;
      if (DASH.includes(e.code)) this.dash = true;
      if (e.code === 'KeyJ') this.shoot = true;
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    stick.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.stickId !== undefined) return;
      this.stickId = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      this.steer(e);
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.stickId) this.steer(e);
    });
    jump.addEventListener('pointerdown', () => {
      if (this.enabled) this.jump = true;
    });
    dash.addEventListener('pointerdown', () => {
      if (this.enabled) this.dash = true;
    });
    shoot.addEventListener('pointerdown', (e) => {
      if (!this.enabled || this.shootId !== undefined) return;
      this.shoot = true;
      this.shootId = e.pointerId;
      shoot.setPointerCapture(e.pointerId);
    });
    for (const end of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      stick.addEventListener(end, (e) => {
        if (e.pointerId !== this.stickId) return;
        this.stickId = undefined;
        this.setStick(0, 0);
      });
      shoot.addEventListener(end, (e) => {
        if (e.pointerId === this.shootId) this.shootId = undefined;
      });
    }
  }

  private steer(e: PointerEvent) {
    const f = this.stick.getBoundingClientRect();
    const radius = f.width * 0.34;
    const x = (e.clientX - (f.x + f.width / 2)) / radius;
    const y = (e.clientY - (f.y + f.height / 2)) / radius;
    const length = Math.hypot(x, y);
    this.setStick(
      length < 0.14 ? 0 : x / Math.max(length, 1),
      length < 0.14 ? 0 : y / Math.max(length, 1),
    );
  }

  private setStick(x: number, y: number) {
    this.stickX = x;
    this.stickY = y;
    this.puck.style.transform = `translate(${x * 25}px,${y * 25}px)`;
  }

  read(yaw: number): RoomInput {
    const pressed = (keys: string[]) => Number(keys.some((key) => this.down.has(key)));
    const x = this.stickId === undefined ? pressed(RIGHT) - pressed(LEFT) : this.stickX;
    const y = this.stickId === undefined ? pressed(FRONT) - pressed(BACK) : -this.stickY;
    const input = {
      ...cameraMove(x, y, yaw),
      jump: this.jump,
      dash: this.dash,
      shoot: this.shoot || this.shootId !== undefined || this.down.has('KeyJ'),
    };
    this.jump = this.dash = this.shoot = false;
    return input;
  }

  clear() {
    this.down.clear();
    this.stickId = this.shootId = undefined;
    this.jump = this.dash = this.shoot = false;
    this.setStick(0, 0);
  }
}
