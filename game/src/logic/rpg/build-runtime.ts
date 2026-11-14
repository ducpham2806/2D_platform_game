/**
 * Trạng thái build trong trận (01-GDD/10-He-thong-RPG-Xuong.md mục 5): khiên C3 đang sẵn hay
 * đang hồi. Nằm trong StageWorld, không trong PlayerPhysics, để chạm gai (đưa Kai về chỗ an
 * toàn bằng `PlayerPhysics.respawn`) không làm mới khiên. Logic thuần.
 */
import type { ShieldStats } from './build';

export class BuildRuntime {
  private shield: ShieldStats | undefined;
  /** Khiên đang sẵn (luôn false khi chưa học C3). */
  shieldReady: boolean;
  /** Giây đã hồi kể từ lúc khiên vỡ. */
  private sinceBreak = 0;

  constructor(shield: ShieldStats | undefined) {
    this.shield = shield;
    this.shieldReady = shield !== undefined;
  }

  get hasShield(): boolean {
    return this.shield !== undefined;
  }

  /** Tiến độ hồi khiên 0..1 (1 khi sẵn; 0 khi chưa học). */
  get shieldProgress(): number {
    const s = this.shield;
    if (!s) return 0;
    if (this.shieldReady) return 1;
    return Math.min(1, this.sinceBreak / s.rechargeSec);
  }

  get shieldIFrameSec(): number {
    return this.shield?.iFrameSec ?? 0;
  }

  get shieldPierceKinds(): ReadonlySet<string> {
    return this.shield?.pierceKinds ?? NO_KINDS;
  }

  /**
   * Đếm hồi một bước. StageWorld gọi sau cổng hit-stop và chờ hồi sinh, trước khi xử lý trúng
   * đòn (đòn trúng đúng bước khiên hồi thì khiên chặn). Trả về true ở bước khiên vừa sẵn.
   */
  step(dt: number): boolean {
    const s = this.shield;
    if (!s || this.shieldReady) return false;
    this.sinceBreak += dt;
    if (this.sinceBreak < s.rechargeSec - 1e-9) return false;
    this.shieldReady = true;
    return true;
  }

  /** Khiên chặn một đòn và vỡ; đồng hồ hồi bắt đầu từ đây (mất máu sau đó không đặt lại). */
  breakShield(): void {
    if (!this.shieldReady) return;
    this.shieldReady = false;
    this.sinceBreak = 0;
  }

  /** Chết rồi hồi sinh: khiên sẵn, để trận boss chơi lại giống nhau. Rơi hố còn máu không gọi. */
  resetOnDeath(): void {
    this.shieldReady = this.shield !== undefined;
    this.sinceBreak = 0;
  }

  /**
   * Đổi build (áp ở lần hồi sinh): mới học C3 thì khiên sẵn ngay; bỏ C3 thì mất khiên; đổi bậc
   * thì giữ thời gian đã hồi, tính theo thời gian hồi mới.
   */
  setShield(shield: ShieldStats | undefined): void {
    const had = this.shield !== undefined;
    this.shield = shield;
    if (!shield) this.shieldReady = false;
    else if (!had) this.resetOnDeath();
    else if (!this.shieldReady && this.sinceBreak >= shield.rechargeSec - 1e-9)
      this.shieldReady = true;
  }
}

const NO_KINDS: ReadonlySet<string> = new Set();
