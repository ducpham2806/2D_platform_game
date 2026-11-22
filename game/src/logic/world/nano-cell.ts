import type { NanoCellData } from '../../core/player-config';

export const NANO_CELL = 'nano_cell';

export class NanoCells {
  private owned: number;
  private available: number;
  private lockSec = 0;

  constructor(
    private readonly max: number,
    count: number,
  ) {
    this.owned = Math.max(0, Math.min(max, Math.floor(count)));
    this.available = this.owned;
  }

  get capacity(): number {
    return this.owned;
  }

  get remaining(): number {
    return this.available;
  }

  get locked(): boolean {
    return this.lockSec > 1e-9;
  }

  step(dt: number): void {
    this.lockSec = Math.max(0, this.lockSec - dt);
  }

  resetLock(): void {
    this.lockSec = 0;
  }

  /** Một ô mới đã nạp đầy. Các ô đã dùng trong lượt vẫn trống. */
  pickUp(): void {
    if (this.owned >= this.max) return;
    this.owned += 1;
    this.available += 1;
  }

  use(hp: number, maxHp: number, rules: NanoCellData, healMul: number): number {
    if (hp <= 0 || hp >= maxHp || this.available === 0 || this.locked) return 0;
    this.available -= 1;
    this.lockSec = rules.useLockSec;
    return Math.min(maxHp - hp, Math.max(1, Math.round(maxHp * rules.healPct * healMul)));
  }
}
