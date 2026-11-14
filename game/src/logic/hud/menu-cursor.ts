/**
 * Con trỏ chọn mục cho menu điều khiển bằng bàn phím/tay cầm (menu tạm dừng...). Bỏ qua mục
 * bị khóa, đi vòng ở hai đầu. Logic thuần.
 */
export class MenuCursor {
  index: number;

  constructor(private readonly enabled: readonly boolean[]) {
    const first = enabled.indexOf(true);
    if (first < 0) throw new Error('Menu cần ít nhất một mục dùng được');
    this.index = first;
  }

  /** dir: -1 lên, 1 xuống. */
  move(dir: 1 | -1): number {
    const n = this.enabled.length;
    let i = this.index;
    for (let k = 0; k < n; k += 1) {
      i = (i + dir + n) % n;
      if (this.enabled[i]) {
        this.index = i;
        break;
      }
    }
    return this.index;
  }

  /** Chọn thẳng một mục (chạm/chuột); mục khóa thì không đổi. */
  select(i: number): boolean {
    if (!this.enabled[i]) return false;
    this.index = i;
    return true;
  }
}

/** Kéo cần quá mức này thì tính là một lần bấm hướng trong menu. */
export const MENU_STICK_STEP = 0.6;

export interface MenuNavResult {
  /** Con trỏ vừa đổi mục. */
  moved: boolean;
  /** Bấm chọn mục đang trỏ (Nhảy, Bắn, Tương tác). */
  activate: boolean;
}

/** Phần đầu vào menu cần đọc (khớp InputSnapshot). */
export interface MenuNavInput {
  moveX: number;
  moveY: number;
  pressed: Readonly<
    Record<'up' | 'down' | 'left' | 'right' | 'jump' | 'shoot' | 'interact', boolean>
  >;
}

/**
 * Điều hướng menu bằng nút hướng hoặc cần (mỗi lần kéo cần qua ngưỡng tính một bước) theo trục
 * dọc hoặc ngang, chọn bằng Nhảy/Bắn/Tương tác. Logic thuần.
 */
export class MenuNavigator {
  readonly cursor: MenuCursor;
  /** Cần đang kéo sẵn lúc mở menu thì phải thả về rồi mới tính lần kéo mới. */
  private stickHeld = true;

  constructor(
    enabled: readonly boolean[],
    private readonly axis: 'x' | 'y' = 'y',
  ) {
    this.cursor = new MenuCursor(enabled);
  }

  get index(): number {
    return this.cursor.index;
  }

  /** Mở lại menu: trỏ vào mục `index` (khóa thì giữ nguyên), chờ cần về giữa. */
  reset(index: number): void {
    this.cursor.select(index);
    this.stickHeld = true;
  }

  handle(snap: MenuNavInput): MenuNavResult {
    const [back, fwd, value] =
      this.axis === 'y'
        ? [snap.pressed.up, snap.pressed.down, snap.moveY]
        : [snap.pressed.left, snap.pressed.right, snap.moveX];
    let dir: 1 | -1 | 0 = back ? -1 : fwd ? 1 : 0;
    const stick = Math.abs(value) >= MENU_STICK_STEP;
    if (dir === 0 && stick && !this.stickHeld) dir = value < 0 ? -1 : 1;
    this.stickHeld = stick;
    const before = this.cursor.index;
    if (dir !== 0) this.cursor.move(dir);
    return {
      moved: this.cursor.index !== before,
      activate: snap.pressed.jump || snap.pressed.shoot || snap.pressed.interact,
    };
  }
}
