import type { Scale2 } from '../../core/feedback-config';

/**
 * Co giãn hình nhân vật (squash & stretch): đặt một tỷ lệ lệch rồi trở về 1 theo ease-out trong
 * `recoverSec`. Chỉ đổi hình vẽ, không đổi hộp va chạm. Logic thuần.
 */
export class Squash {
  private fromX = 1;
  private fromY = 1;
  private left = 0;

  constructor(private readonly recoverSec: number) {}

  set(scale: Scale2): void {
    this.fromX = scale.x;
    this.fromY = scale.y;
    this.left = this.recoverSec;
  }

  update(dtSec: number): void {
    this.left = Math.max(0, this.left - dtSec);
  }

  reset(): void {
    this.left = 0;
  }

  get x(): number {
    return 1 + (this.fromX - 1) * this.remaining();
  }

  get y(): number {
    return 1 + (this.fromY - 1) * this.remaining();
  }

  /** 1 lúc vừa đặt → 0 khi đã về bình thường; giảm nhanh lúc đầu, chậm dần. */
  private remaining(): number {
    if (this.recoverSec <= 0) return 0;
    const t = this.left / this.recoverSec;
    return t * t;
  }
}
