/**
 * Thống kê khung hình cho đo lường (logic thuần, ST-13-02; GDD 13 mục 3 `stage_end`, QB-157).
 * Biểu đồ cấp phát sẵn (ô 0,5 ms, 0–100 ms): ghi mỗi khung không cấp phát. Khung dài hơn
 * `ignoreMs` (tab ẩn, dừng để gỡ lỗi) không tính.
 */
const BIN_MS = 0.5;
const MAX_MS = 100;
const BINS = MAX_MS / BIN_MS;

export class FrameStats {
  private readonly bins = new Uint32Array(BINS + 1);
  private total = 0;
  private slow = 0;
  /** Thời gian thật đã tính (ms), không gồm khung bị bỏ. */
  realMs = 0;

  constructor(
    private readonly slowMs: number,
    private readonly ignoreMs: number,
  ) {}

  /** Ghi một khung dài `ms`. */
  add(ms: number): void {
    if (!(ms > 0) || ms > this.ignoreMs) return;
    const i = Math.min(BINS, Math.floor(ms / BIN_MS));
    this.bins[i] = (this.bins[i] ?? 0) + 1;
    this.total += 1;
    this.realMs += ms;
    if (ms > this.slowMs) this.slow += 1;
  }

  get frames(): number {
    return this.total;
  }

  /** FPS trung vị (từ khung trung vị); 0 khi chưa có khung nào. */
  get fpsMedian(): number {
    if (this.total === 0) return 0;
    const half = this.total / 2;
    let seen = 0;
    for (let i = 0; i <= BINS; i += 1) {
      seen += this.bins[i] ?? 0;
      if (seen >= half) return 1000 / ((i + 0.5) * BIN_MS);
    }
    return 0;
  }

  /** Giới hạn trên nếu khung trung vị nằm trong ô tràn, null nếu không. */
  get fpsMedianUpperBound(): number | null {
    const framesInsideHistogram = this.total - (this.bins[BINS] ?? 0);
    return this.total > 0 && framesInsideHistogram < this.total / 2 ? 1000 / MAX_MS : null;
  }

  /** Phần trăm khung chậm hơn `slowMs` (0–100). */
  get slowFramePct(): number {
    return this.total === 0 ? 0 : (100 * this.slow) / this.total;
  }
}
