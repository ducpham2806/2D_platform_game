import type { Box } from '../player/collision';
import type { Projectile } from './projectiles';

export type TargetHitResult = 'hit' | 'destroyed' | 'blocked' | 'shieldBroken';

/**
 * Bia tập bắn trong màn xám. Bia có khiên (giống Lính Kén, đặc tả Stage 1) chặn đạn bay vào
 * mặt khiên; chỉ đạn phá khiên (nạp đầy) mới phá được. Bị phá thì tự dựng lại sau một lúc.
 */
export class TrainingTarget {
  hp: number;
  shieldUp: boolean;
  /** Hiệu ứng nháy khi trúng (giây còn lại), để vẽ. */
  flash = 0;
  private deadTimer = 0;

  constructor(
    readonly id: number,
    readonly box: Box,
    readonly maxHp: number,
    /** Mặt khiên: −1 trái, 1 phải, 0 không có khiên. */
    readonly shieldSide: -1 | 0 | 1,
    private readonly respawnSec: number,
  ) {
    this.hp = maxHp;
    this.shieldUp = shieldSide !== 0;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  /** Đạn có bay vào mặt khiên không (theo hướng bay, hoặc theo vị trí với roi đứng yên). */
  private fromShieldSide(p: Projectile): boolean {
    if (this.shieldSide === 0) return false;
    const fromLeft = p.vx !== 0 ? p.vx > 0 : p.x + p.w / 2 < this.box.x + this.box.w / 2;
    return this.shieldSide === -1 ? fromLeft : !fromLeft;
  }

  hit(p: Projectile, amount: number): TargetHitResult {
    if (this.shieldUp && this.fromShieldSide(p)) {
      if (p.breaksShield) {
        this.shieldUp = false;
        this.flash = 0.15;
        return 'shieldBroken';
      }
      return 'blocked';
    }
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 0.1;
    if (this.hp <= 0) {
      this.deadTimer = this.respawnSec;
      return 'destroyed';
    }
    return 'hit';
  }

  step(dt: number): void {
    this.flash = Math.max(0, this.flash - dt);
    if (this.hp > 0) return;
    this.deadTimer -= dt;
    if (this.deadTimer <= 1e-9) {
      this.hp = this.maxHp;
      this.shieldUp = this.shieldSide !== 0;
    }
  }
}
