/** Tâm của một điểm neo cho Lumen, tính bằng px trong phòng. */
export interface BossAnchorPoint {
  readonly x: number;
  readonly y: number;
}

export interface BossAnchorWarning extends BossAnchorPoint {
  readonly progress: number;
}

const EPS = 1e-9;

/** Lịch dịch chuyển xác định. Vị trí chỉ đổi sau khi báo xong, đúng một lần. */
export class BossAnchors {
  private readonly points: readonly BossAnchorPoint[];
  private readonly warnSec: number;
  private index: number;
  private pending: { destination: number; elapsed: number } | undefined;

  constructor(points: readonly BossAnchorPoint[], startIndex: number, warnSec: number) {
    if (
      points.length !== 3 ||
      points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y)) ||
      points.some((point, i) => points.slice(0, i).some((p) => p.x === point.x && p.y === point.y))
    ) {
      throw new RangeError('Cần đúng ba điểm neo riêng biệt với tọa độ hữu hạn');
    }
    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= points.length)
      throw new RangeError('Chỉ số điểm neo đầu không hợp lệ');
    if (!Number.isFinite(warnSec) || warnSec <= 0)
      throw new RangeError('Thời gian báo dịch chuyển phải là số dương hữu hạn');

    this.points = points.map(({ x, y }) => ({ x, y }));
    this.index = startIndex;
    this.warnSec = warnSec;
  }

  get current(): BossAnchorPoint {
    return this.points[this.index]!;
  }

  get warning(): BossAnchorWarning | undefined {
    if (!this.pending) return undefined;
    const point = this.points[this.pending.destination]!;
    return { ...point, progress: Math.min(1, this.pending.elapsed / this.warnSec) };
  }

  begin(): void {
    this.pending ??= { destination: (this.index + 1) % this.points.length, elapsed: 0 };
  }

  step(dt: number): BossAnchorPoint | undefined {
    if (!Number.isFinite(dt) || dt < 0)
      throw new RangeError('Bước thời gian phải hữu hạn và không âm');
    if (!this.pending) return undefined;
    this.pending.elapsed += dt;
    if (this.pending.elapsed < this.warnSec - Math.min(EPS, this.warnSec * EPS)) return undefined;
    this.index = this.pending.destination;
    this.pending = undefined;
    return this.current;
  }

  cancel(): void {
    this.pending = undefined;
  }
}
