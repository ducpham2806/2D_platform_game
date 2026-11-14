import type { EnemyData, EnemyProjectileData } from '../../core/enemy-config';
import type { Projectile, ProjectilePool } from '../combat/projectiles';
import { enemyProjectile } from '../boss/enemy-projectile';
import type { Box } from '../player/collision';
import type { TileMap } from '../tilemap';

/** Những gì kẻ địch cần biết mỗi bước. Tọa độ px. */
export interface EnemyContext {
  /** Tâm người chơi. */
  playerX: number;
  playerY: number;
  pool: ProjectilePool;
  map: TileMap;
}

export type EnemyHitResult = 'hit' | 'killed' | 'blocked' | 'shieldHit' | 'shieldBroken';

/** Kẻ địch bay (đặt giữa ô đánh dấu) hay đứng trên sàn (đáy ô đánh dấu). */
export function isFlying(data: EnemyData): boolean {
  return data.behavior === 'drone' || data.behavior === 'butterfly';
}

const HIT_FLASH_SEC = 0.1;

/**
 * Phần chung của mọi kẻ địch thường (M5): máu, hộp va chạm, hướng nhìn, báo trước đòn,
 * nhận đòn, dựng lại khi người chơi hồi sinh. Hành vi riêng nằm ở lớp con.
 */
export abstract class Enemy {
  readonly box: Box;
  readonly maxHp: number;
  hp: number;
  facing: 1 | -1 = -1;
  /** Giây còn lại của nháy trắng khi trúng đòn (để vẽ). */
  flash = 0;
  /** Đang báo trước đòn (telegraph): scene vẽ nhấp nháy/phình/co theo loại. */
  telegraphing = false;
  /**
   * Số nhịp của đòn đang báo trước (viên, loạt, hạt, cú lao); > 1 thì scene vẽ một chấm mỗi nhịp
   * (bản Thử thách, GDD 11 mục 2.6).
   */
  beats = 1;
  /** Vị trí góc trên trái lúc xuất hiện. */
  protected readonly home: { x: number; y: number };

  constructor(
    readonly id: number,
    readonly data: EnemyData,
    /** Tâm ô đánh dấu theo X và đáy (kẻ địch đứng) hoặc tâm (kẻ địch bay) theo Y, px. */
    x: number,
    y: number,
    hpMul: number,
    /** Prologue nhịp 1–3: chỉ đẩy lùi, không mất máu. */
    readonly harmless: boolean,
    protected readonly tileSize: number,
  ) {
    const { w, h } = data.sizePx;
    this.home = { x: x - w / 2, y: isFlying(data) ? y - h / 2 : y - h };
    this.box = { x: this.home.x, y: this.home.y, w, h };
    this.maxHp = data.hp * hpMul;
    this.hp = this.maxHp;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  get centerX(): number {
    return this.box.x + this.box.w / 2;
  }

  get centerY(): number {
    return this.box.y + this.box.h / 2;
  }

  get contactDamage(): number {
    return this.harmless ? 0 : this.data.contactDamage;
  }

  /** Về trạng thái ban đầu (người chơi hồi sinh ở checkpoint). */
  reset(): void {
    this.box.x = this.home.x;
    this.box.y = this.home.y;
    this.hp = this.maxHp;
    this.flash = 0;
    this.telegraphing = false;
    this.beats = 1;
    this.facing = -1;
    this.resetBehavior();
  }

  /** Đạn hoặc roi của người chơi trúng. Lớp có khiên ghi đè `shieldCheck`. */
  takeHit(p: Projectile, amount: number): EnemyHitResult {
    const shield = this.shieldCheck(p);
    if (shield) return shield;
    this.hp = Math.max(0, this.hp - amount);
    this.flash = HIT_FLASH_SEC;
    return this.hp <= 0 ? 'killed' : 'hit';
  }

  /** Đang hở cho Đòn Trừng Phạt (V3): chỉ mini-boss (Golem ghi đè); kẻ địch thường không. */
  get exposed(): boolean {
    return false;
  }

  /** Sát thương nổ lan (V2): bỏ qua khiên, không làm vỡ khiên. */
  applyBlast(amount: number): 'hit' | 'killed' {
    this.hp = Math.max(0, this.hp - amount);
    this.flash = HIT_FLASH_SEC;
    return this.hp <= 0 ? 'killed' : 'hit';
  }

  step(ctx: EnemyContext, dt: number): void {
    this.flash = Math.max(0, this.flash - dt);
    if (this.alive) this.behave(ctx, dt);
  }

  protected abstract behave(ctx: EnemyContext, dt: number): void;
  protected abstract resetBehavior(): void;

  protected shieldCheck(_p: Projectile): EnemyHitResult | undefined {
    return undefined;
  }

  protected faceToward(x: number): void {
    if (Math.abs(x - this.centerX) > 1) this.facing = x > this.centerX ? 1 : -1;
  }

  /** Bắn một viên từ tâm theo hướng (dx, dy) đã chuẩn hóa. */
  protected fire(
    ctx: EnemyContext,
    data: EnemyProjectileData,
    dirX: number,
    dirY: number,
    kind: 'enemyShot' | 'bomb' = 'enemyShot',
    gravity = 0,
  ): void {
    const t = this.tileSize;
    const { w, h } = data.sizePx;
    const speed = data.speedTilesPerSec * t;
    const startX = kind === 'bomb' ? this.centerX : this.centerX + dirX * (this.box.w / 2);
    const startY = kind === 'bomb' ? this.box.y + this.box.h : this.centerY;
    const spec = enemyProjectile(
      t,
      kind,
      startX - w / 2,
      startY - h / 2,
      data.sizePx,
      dirX * speed,
      dirY * speed,
      this.harmless ? 0 : data.damage,
    );
    ctx.pool.spawn(gravity > 0 ? { ...spec, gravity } : spec);
  }

  /**
   * Đi tuần ngang quanh chỗ xuất hiện trong ±range ô; quay đầu ở biên, ở tường, và (với kẻ địch
   * đi bộ) ở mép vực.
   */
  protected patrol(map: TileMap, speedTilesPerSec: number, rangeTiles: number, dt: number): void {
    const t = this.tileSize;
    const step = this.facing * speedTilesPerSec * t * dt;
    const nextX = this.box.x + step;
    const minX = this.home.x - rangeTiles * t;
    const maxX = this.home.x + rangeTiles * t;
    if (nextX < minX || nextX > maxX || this.blocked(map, nextX)) {
      this.facing = this.facing === 1 ? -1 : 1;
      return;
    }
    this.box.x = nextX;
  }

  /** Có tường ở phía trước (hoặc hết sàn với kẻ địch đi bộ) nếu dời tới x không. */
  protected blocked(map: TileMap, nextX: number): boolean {
    const t = this.tileSize;
    const edge = this.facing > 0 ? nextX + this.box.w - 1e-6 : nextX;
    const col = Math.floor(edge / t);
    const top = Math.floor(this.box.y / t);
    const bottom = Math.floor((this.box.y + this.box.h - 1e-6) / t);
    for (let row = top; row <= bottom; row += 1) if (map.isSolid(col, row)) return true;
    if (isFlying(this.data)) return false;
    const below = Math.floor((this.box.y + this.box.h + 1) / t);
    return !map.isSolid(col, below) && !map.isOneWay(col, below);
  }
}
