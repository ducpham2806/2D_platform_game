/**
 * Bộ đếm bước cố định: tách logic/vật lý (60 Hz) khỏi tốc độ khung hình.
 * Gọi advance(delta) mỗi khung; nó trả về số bước logic cần chạy.
 */
export class FixedStep {
  private accumulator = 0;
  private total = 0;

  constructor(
    readonly stepMs: number,
    readonly maxStepsPerFrame: number,
  ) {
    if (!(stepMs > 0)) throw new RangeError('stepMs phải dương');
    if (!Number.isInteger(maxStepsPerFrame) || maxStepsPerFrame < 1) {
      throw new RangeError('maxStepsPerFrame phải là số nguyên ≥ 1');
    }
  }

  /** Cộng thời gian khung vừa qua (ms), trả về số bước cần chạy (≤ maxStepsPerFrame). */
  advance(deltaMs: number): number {
    if (!(deltaMs > 0)) return 0;
    this.accumulator += deltaMs;
    let steps = Math.floor(this.accumulator / this.stepMs);
    if (steps > this.maxStepsPerFrame) {
      // Tab bị treo hoặc máy quá chậm: bỏ phần dư thay vì cố đuổi kịp.
      steps = this.maxStepsPerFrame;
      this.accumulator = 0;
    } else {
      this.accumulator -= steps * this.stepMs;
    }
    this.total += steps;
    return steps;
  }

  /** Phần lẻ của bước tiếp theo (0..1), dùng để nội suy khi vẽ. */
  get alpha(): number {
    return this.accumulator / this.stepMs;
  }

  /** Tổng số bước đã chạy từ lúc tạo hoặc reset. */
  get totalSteps(): number {
    return this.total;
  }

  reset(): void {
    this.accumulator = 0;
    this.total = 0;
  }
}
