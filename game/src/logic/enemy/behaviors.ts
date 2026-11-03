import type {
  ButterflyData,
  DroneData,
  EnemyData,
  GolemData,
  ShieldChargerData,
  TurretData,
} from '../../core/enemy-config';
import type { Projectile } from '../combat/projectiles';
import { spawnShockwaves } from '../boss/enemy-projectile';
import { Enemy, type EnemyContext, type EnemyHitResult } from './enemy';

const DEG = Math.PI / 180;

/**
 * Drone Lính: bay lơ lửng đi tuần. Người chơi trong tầm (đo từ tâm) và hết hồi chiêu thì dừng,
 * quay về phía người chơi, nhấp nháy telegraphSec rồi bắn một viên nhắm vào người chơi.
 */
export class Drone extends Enemy {
  declare readonly data: DroneData;
  private cooldown = 0;
  private windup = 0;

  protected override behave(ctx: EnemyContext, dt: number): void {
    const a = this.data.attack;
    const t = this.tileSize;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.telegraphing) {
      this.faceToward(ctx.playerX);
      this.windup -= dt;
      if (this.windup <= 1e-9) {
        const dx = ctx.playerX - this.centerX;
        const dy = ctx.playerY - this.centerY;
        const len = Math.hypot(dx, dy) || 1;
        this.fire(ctx, a.projectile, dx / len, dy / len);
        this.telegraphing = false;
        this.cooldown = a.cooldownSec;
      }
      return;
    }
    const dist = Math.hypot(ctx.playerX - this.centerX, ctx.playerY - this.centerY);
    if (this.cooldown <= 0 && dist <= a.rangeTiles * t) {
      this.telegraphing = true;
      this.windup = a.telegraphSec;
      this.faceToward(ctx.playerX);
      return;
    }
    this.patrol(ctx.map, this.data.moveSpeedTilesPerSec, this.data.patrolRangeTiles, dt);
  }

  protected override resetBehavior(): void {
    this.cooldown = 0;
    this.windup = 0;
  }
}

/**
 * Tháp pháo đứng yên (Tháp Pháo Tập Sự, Tháp Gai): nhịp cố định intervalSec, trong đó
 * telegraphSec cuối là báo trước; rồi bắn `count` viên xòe quạt `spreadDeg` về phía người chơi.
 */
export class Turret extends Enemy {
  declare readonly data: TurretData;
  /** Giây còn lại tới phát bắn kế tiếp. */
  private timer = 0;

  constructor(...args: ConstructorParameters<typeof Enemy>) {
    super(...args);
    this.resetBehavior();
  }

  protected override behave(ctx: EnemyContext, dt: number): void {
    const a = this.data.attack;
    this.faceToward(ctx.playerX);
    this.timer -= dt;
    this.telegraphing = this.timer <= a.telegraphSec + 1e-9;
    if (this.timer > 1e-9) return;
    for (let i = 0; i < a.count; i += 1) {
      const angle =
        a.count === 1 ? 0 : (-a.spreadDeg / 2 + (a.spreadDeg * i) / (a.count - 1)) * DEG;
      this.fire(ctx, a.projectile, this.facing * Math.cos(angle), Math.sin(angle));
    }
    this.timer = a.intervalSec;
    this.telegraphing = false;
  }

  protected override resetBehavior(): void {
    this.timer = this.data.attack.intervalSec;
  }
}

/**
 * Bướm Sắt: trôi qua lại quanh chỗ xuất hiện, nhấp nhô theo sóng sin; cứ intervalSec thì
 * phình ra telegraphSec rồi thả một hạt nổ rơi theo trọng lực.
 */
export class Butterfly extends Enemy {
  declare readonly data: ButterflyData;
  private time = 0;
  private timer = 0;

  constructor(...args: ConstructorParameters<typeof Enemy>) {
    super(...args);
    this.resetBehavior();
  }

  protected override behave(ctx: EnemyContext, dt: number): void {
    const t = this.tileSize;
    const { wave, attack } = this.data;
    this.time += dt;
    this.patrol(ctx.map, this.data.moveSpeedTilesPerSec, this.data.patrolRangeTiles, dt);
    this.box.y =
      this.home.y + wave.amplitudeTiles * t * Math.sin((2 * Math.PI * this.time) / wave.periodSec);
    this.timer -= dt;
    this.telegraphing = this.timer <= attack.telegraphSec + 1e-9;
    if (this.timer > 1e-9) return;
    this.fire(ctx, attack.projectile, 0, 1, 'bomb', attack.gravityTilesPerSec2 * t);
    this.timer = attack.intervalSec;
    this.telegraphing = false;
  }

  protected override resetBehavior(): void {
    this.time = 0;
    this.timer = this.data.attack.intervalSec;
  }
}

type ChargerState = 'walk' | 'telegraph' | 'dash' | 'recover';

/**
 * Lính Kén: đi tuần trên sàn, khiên ở phía trước chặn đạn thường; phát phá khiên (nạp đầy)
 * làm mòn khiên, đủ shieldHits phát thì vỡ hẳn. Thấy người chơi phía trước trong tầm thì khiên
 * sáng (báo trước) rồi lao dashTiles ô. Người chơi đứng sau lưng quá turnDelaySec thì quay lại.
 */
export class ShieldCharger extends Enemy {
  declare readonly data: ShieldChargerData;
  shieldLeft = 0;
  state: ChargerState = 'walk';
  private timer = 0;
  private cooldown = 0;
  private dashed = 0;
  private behindFor = 0;

  constructor(...args: ConstructorParameters<typeof Enemy>) {
    super(...args);
    this.resetBehavior();
  }

  get shieldUp(): boolean {
    return this.shieldLeft > 0;
  }

  protected override shieldCheck(p: Projectile): EnemyHitResult | undefined {
    if (!this.shieldUp) return undefined;
    // Đạn bay vào mặt khiên: ngược hướng nhìn; roi đứng yên thì xét phía của nó.
    const fromFront =
      p.vx !== 0
        ? Math.sign(p.vx) === -this.facing
        : (p.x + p.w / 2 - this.centerX) * this.facing > 0;
    if (!fromFront) return undefined;
    if (!p.breaksShield) return 'blocked';
    this.shieldLeft -= 1;
    this.flash = 0.15;
    return this.shieldLeft > 0 ? 'shieldHit' : 'shieldBroken';
  }

  protected override behave(ctx: EnemyContext, dt: number): void {
    const a = this.data.attack;
    const t = this.tileSize;
    this.cooldown = Math.max(0, this.cooldown - dt);
    const dx = ctx.playerX - this.centerX;
    const sameLevel = Math.abs(ctx.playerY - this.centerY) <= 1.5 * t;
    const inRange = Math.abs(dx) <= a.rangeTiles * t && sameLevel;
    switch (this.state) {
      case 'walk': {
        const inFront = Math.sign(dx) === this.facing;
        this.behindFor = inRange && !inFront ? this.behindFor + dt : 0;
        if (this.behindFor >= a.turnDelaySec) {
          this.facing = this.facing === 1 ? -1 : 1;
          this.behindFor = 0;
        }
        if (inRange && inFront && this.cooldown <= 0) {
          this.enter('telegraph', a.telegraphSec);
          return;
        }
        this.patrol(ctx.map, this.data.moveSpeedTilesPerSec, this.data.patrolRangeTiles, dt);
        return;
      }
      case 'telegraph':
        this.timer -= dt;
        if (this.timer <= 1e-9) {
          this.dashed = 0;
          this.enter('dash', 0);
        }
        return;
      case 'dash': {
        const step = a.dashSpeedTilesPerSec * t * dt;
        const nextX = this.box.x + this.facing * step;
        if (this.blocked(ctx.map, nextX) || this.dashed >= a.dashTiles * t) {
          this.enter('recover', a.recoverSec);
          return;
        }
        this.box.x = nextX;
        this.dashed += step;
        return;
      }
      case 'recover':
        this.timer -= dt;
        if (this.timer <= 1e-9) {
          this.cooldown = a.cooldownSec;
          this.enter('walk', 0);
        }
        return;
    }
  }

  private enter(state: ChargerState, seconds: number): void {
    this.state = state;
    this.timer = seconds;
    this.telegraphing = state === 'telegraph';
  }

  protected override resetBehavior(): void {
    this.shieldLeft = this.data.shieldHits;
    this.state = 'walk';
    this.timer = 0;
    this.cooldown = 0;
    this.dashed = 0;
    this.behindFor = 0;
  }
}

type GolemState = 'walk' | 'slamTelegraph' | 'bombTelegraph' | 'dashTelegraph' | 'dash' | 'recover';

/**
 * Bramble Golem (mini-boss): đi chậm về phía người chơi. Pha 1: giậm đất (báo trước) rồi tung
 * hai sóng đất chạy ra hai bên. Pha 2 (máu ≤ phase2HpPct): báo trước, tung `count` hạt nổ lên
 * cao rơi quanh mình, báo trước lần nữa rồi lao `dashTiles` ô.
 */
export class Golem extends Enemy {
  declare readonly data: GolemData;
  state: GolemState = 'walk';
  /** Tiến độ báo trước 0..1 để vẽ. */
  telegraphProgress = 0;
  private timer = 0;
  private cooldown = 0;
  private dashed = 0;
  private telegraphTotal = 1;

  constructor(...args: ConstructorParameters<typeof Enemy>) {
    super(...args);
    this.resetBehavior();
  }

  get phase(): 1 | 2 {
    return this.hp / this.maxHp <= this.data.phase2HpPct / 100 ? 2 : 1;
  }

  protected override behave(ctx: EnemyContext, dt: number): void {
    const a = this.data.attack;
    const t = this.tileSize;
    this.cooldown = Math.max(0, this.cooldown - dt);
    switch (this.state) {
      case 'walk': {
        this.faceToward(ctx.playerX);
        const next = this.box.x + this.facing * this.data.moveSpeedTilesPerSec * t * dt;
        if (Math.abs(ctx.playerX - this.centerX) > 3 * t && !this.blocked(ctx.map, next))
          this.box.x = next;
        if (this.cooldown <= 0) this.enter(this.phase === 1 ? 'slamTelegraph' : 'bombTelegraph');
        return;
      }
      case 'slamTelegraph':
      case 'bombTelegraph':
      case 'dashTelegraph':
        this.timer -= dt;
        this.telegraphProgress = 1 - Math.max(0, this.timer) / this.telegraphTotal;
        if (this.timer > 1e-9) return;
        if (this.state === 'slamTelegraph') this.doSlam(ctx);
        else if (this.state === 'bombTelegraph') this.doBombs(ctx);
        else {
          this.dashed = 0;
          this.enter('dash');
        }
        return;
      case 'dash': {
        const step = a.dash.dashSpeedTilesPerSec * t * dt;
        const nextX = this.box.x + this.facing * step;
        if (this.blocked(ctx.map, nextX) || this.dashed >= a.dash.dashTiles * t) {
          this.enter('recover', a.dash.recoverSec);
          return;
        }
        this.box.x = nextX;
        this.dashed += step;
        return;
      }
      case 'recover':
        this.timer -= dt;
        if (this.timer <= 1e-9) {
          this.cooldown = a.cooldownSec;
          this.enter('walk');
        }
        return;
    }
  }

  private doSlam(ctx: EnemyContext): void {
    const s = this.data.attack.slam;
    const wave = this.harmless ? { ...s.shockwave, damage: 0 } : s.shockwave;
    spawnShockwaves(
      ctx.pool,
      this.tileSize,
      this.centerX,
      this.box.y + this.box.h,
      this.box.w / 2,
      wave,
      1,
    );
    this.enter('recover', s.recoverSec);
  }

  private doBombs(ctx: EnemyContext): void {
    const b = this.data.attack.bombs;
    for (let i = 0; i < b.count; i += 1) {
      const dirX = (i - (b.count - 1) / 2) * b.spreadFactor;
      this.fire(
        ctx,
        b.projectile,
        dirX,
        -b.lobSpeedTilesPerSec,
        'bomb',
        b.gravityTilesPerSec2 * this.tileSize,
      );
    }
    this.faceToward(ctx.playerX);
    this.enter('dashTelegraph');
  }

  private enter(state: GolemState, seconds?: number): void {
    const a = this.data.attack;
    this.state = state;
    if (state === 'slamTelegraph') this.telegraphTotal = a.slam.telegraphSec;
    if (state === 'bombTelegraph') this.telegraphTotal = a.bombs.telegraphSec;
    if (state === 'dashTelegraph') this.telegraphTotal = a.dash.telegraphSec;
    this.timer = seconds ?? this.telegraphTotal;
    this.telegraphProgress = 0;
    this.telegraphing =
      state === 'slamTelegraph' || state === 'bombTelegraph' || state === 'dashTelegraph';
  }

  protected override resetBehavior(): void {
    this.state = 'walk';
    this.timer = 0;
    this.cooldown = this.data.attack.cooldownSec;
    this.dashed = 0;
    this.telegraphProgress = 0;
  }
}

/** Tạo kẻ địch đúng loại theo `behavior` trong dữ liệu. */
export function createEnemy(
  id: number,
  data: EnemyData,
  x: number,
  y: number,
  hpMul: number,
  harmless: boolean,
  tileSize: number,
): Enemy {
  const args = [id, data, x, y, hpMul, harmless, tileSize] as const;
  switch (data.behavior) {
    case 'drone':
      return new Drone(...args);
    case 'turret':
      return new Turret(...args);
    case 'butterfly':
      return new Butterfly(...args);
    case 'shieldCharger':
      return new ShieldCharger(...args);
    case 'golem':
      return new Golem(...args);
  }
}
