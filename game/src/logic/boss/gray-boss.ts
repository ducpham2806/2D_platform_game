import type { BossAttackId, BossData } from '../../core/boss-config';
import type { OutgoingHit } from '../combat/damage';
import type { ProjectilePool } from '../combat/projectiles';
import { type Box, groundBelow, moveX, moveY } from '../player/collision';
import type { Rng } from '../rng';
import type { TileMap } from '../tilemap';
import { type BossContext, type BossEvents, type BossState, noEvents } from './boss-types';
import { enemyProjectile, spawnRainDrops, spawnShockwaves } from './enemy-projectile';

export type { BossContext, BossEvents, BossState } from './boss-types';
import { planRain } from './rain';

/** Trọng lực của boss (px/s²) chỉ dùng để rơi về sàn; đòn Nhảy đập tự tính quỹ đạo riêng. */
const BOSS_GRAVITY = 1400;

/**
 * Boss theo dữ liệu (GDD 9): chờ → báo trước (telegraph) → ra đòn → hồi, lặp theo danh sách đòn
 * của pha hiện tại. Pha đổi theo % máu; pha cuối nhanh hơn speedMul nhưng telegraph không ngắn
 * hơn minTelegraphSec. Trúng điểm yếu thì choáng, mọi đồng hồ đứng yên.
 */
export class GrayBoss {
  readonly box: Box;
  hp: number;
  state: BossState = 'waiting';
  attack: BossAttackId | undefined;
  facing: 1 | -1 = -1;
  phase = 0;
  /** Nháy trắng khi trúng đòn (giây còn lại). */
  flash = 0;
  /** Cho hình vẽ: làn bắn (y), điểm đáp của Nhảy đập (x), cột mưa đạn. */
  shotLaneY = 0;
  slamTargetX = 0;
  rainCols: number[] = [];
  /** Tiến độ telegraph 0..1 để vẽ hiệu ứng báo trước. */
  telegraphProgress = 0;

  private timer = 0;
  private telegraphTotal = 0;
  private stun = 0;
  private cursor = 0;
  private shotsLeft = 0;
  private vx = 0;
  private vy = 0;
  private airborne = false;

  constructor(
    readonly data: BossData,
    private readonly map: TileMap,
    spawnCenterX: number,
    spawnBottom: number,
    /** Cột ô đầu và cuối bên trong đấu trường (cho Mưa đạn). */
    private readonly arenaCols: { first: number; last: number },
    private readonly rng: Rng,
  ) {
    this.box = {
      x: spawnCenterX - data.sizePx.w / 2,
      y: spawnBottom - data.sizePx.h,
      w: data.sizePx.w,
      h: data.sizePx.h,
    };
    this.hp = data.hp;
  }

  get centerX(): number {
    return this.box.x + this.box.w / 2;
  }

  get hpPct(): number {
    return (this.hp / this.data.hp) * 100;
  }

  get speedMul(): number {
    return this.data.phases[this.phase]?.speedMul ?? 1;
  }

  /** Sát thương khi chạm vào boss: đòn lao/nhảy đập mạnh hơn va chạm thường. */
  get touchDamage(): number {
    if (this.state === 'active' && this.attack === 'charge') return this.data.attacks.charge.damage;
    if (this.state === 'active' && this.attack === 'slam') return this.data.attacks.slam.damage;
    return this.data.contactDamage;
  }

  get stunned(): boolean {
    return this.stun > 0 || this.state === 'stunned';
  }

  /** Bắt đầu trận (người chơi vào đấu trường). */
  activate(): void {
    if (this.state === 'waiting') this.enter('idle', this.data.idleSec);
  }

  takeHit(hit: OutgoingHit): boolean {
    if (this.state === 'dead' || this.state === 'waiting') return false;
    this.hp = Math.max(0, this.hp - hit.amount);
    this.flash = 0.08;
    if (hit.stunSec > 0) this.stun = Math.max(this.stun, hit.stunSec);
    return true;
  }

  step(ctx: BossContext, pool: ProjectilePool, dt: number): BossEvents {
    const ev = noEvents();
    this.flash = Math.max(0, this.flash - dt);
    if (this.state === 'dead' || this.state === 'waiting') return ev;
    if (this.hp <= 0) {
      this.state = 'dead';
      this.vx = 0;
      ev.defeated = true;
      return ev;
    }
    const phase = this.phaseFor(this.hpPct);
    if (phase !== this.phase) {
      this.phase = phase;
      this.cursor = 0;
      ev.phaseChanged = true;
    }
    if (this.stun > 0) {
      this.stun = Math.max(0, this.stun - dt);
      this.vx = 0;
      this.physics(dt, ev, pool);
      return ev;
    }
    this.timer -= dt;
    this.think(ctx, pool, ev);
    this.physics(dt, ev, pool);
    return ev;
  }

  private phaseFor(hpPct: number): number {
    const i = this.data.phases.findIndex((p) => hpPct > p.untilHpPct);
    return i === -1 ? this.data.phases.length - 1 : i;
  }

  private enter(state: BossState, seconds: number): void {
    this.state = state;
    this.timer = seconds;
  }

  private scaled(seconds: number): number {
    return seconds / this.speedMul;
  }

  private telegraphFor(id: BossAttackId): number {
    return Math.max(this.data.minTelegraphSec, this.scaled(this.data.attacks[id].telegraphSec));
  }

  private think(ctx: BossContext, pool: ProjectilePool, ev: BossEvents): void {
    switch (this.state) {
      case 'idle':
        this.vx = 0;
        this.facing = ctx.playerX < this.centerX ? -1 : 1;
        if (this.timer <= 0) this.startAttack(ctx, ev);
        break;
      case 'telegraph':
        this.telegraphProgress = 1 - Math.max(0, this.timer) / this.telegraphTotal;
        if (this.timer <= 0) this.beginActive(pool);
        break;
      case 'active':
        this.runActive(pool);
        break;
      case 'recover':
      case 'stunned':
        this.vx = 0;
        if (this.timer <= 0) this.enter('idle', this.scaled(this.data.idleSec));
        break;
    }
  }

  private startAttack(ctx: BossContext, ev: BossEvents): void {
    const list = this.data.phases[this.phase]?.attacks ?? ['shot'];
    const id = list[this.cursor % list.length] ?? 'shot';
    this.cursor += 1;
    this.attack = id;
    this.telegraphTotal = this.telegraphFor(id);
    this.telegraphProgress = 0;
    this.enter('telegraph', this.telegraphTotal);
    ev.attackStarted = id;
    if (id === 'shot') this.shotLaneY = ctx.playerY;
    if (id === 'slam') this.slamTargetX = ctx.playerX;
    if (id === 'rain') {
      const r = this.data.attacks.rain;
      this.rainCols = planRain(
        this.arenaCols.first,
        this.arenaCols.last,
        r.safeGaps,
        r.gapWidthTiles,
        this.rng,
      ).dropCols;
    }
  }

  private beginActive(pool: ProjectilePool): void {
    const a = this.data.attacks;
    const t = this.map.tileSize;
    switch (this.attack) {
      case 'shot':
        this.shotsLeft = a.shot.count;
        this.enter('active', 0);
        break;
      case 'charge':
        this.vx = this.facing * a.charge.speedTilesPerSec * t * this.speedMul;
        this.enter('active', 10);
        break;
      case 'slam': {
        const air = this.scaled(a.slam.airSec);
        this.vx = (this.slamTargetX - this.centerX) / air;
        this.vy = (-BOSS_GRAVITY * air) / 2;
        this.airborne = true;
        this.enter('active', air + 1);
        break;
      }
      case 'rain':
        spawnRainDrops(pool, this.map.tileSize, this.rainCols, this.data.attacks.rain);
        this.enter('active', a.rain.activeSec);
        break;
      default:
        this.enter('recover', 0.5);
    }
  }

  private runActive(pool: ProjectilePool): void {
    const a = this.data.attacks;
    const t = this.map.tileSize;
    switch (this.attack) {
      case 'shot':
        if (this.timer <= 0 && this.shotsLeft > 0) {
          const s = a.shot;
          pool.spawn(
            enemyProjectile(
              this.map.tileSize,
              'enemyShot',
              this.centerX + this.facing * (this.box.w / 2) - s.sizePx.w / 2,
              this.shotLaneY - s.sizePx.h / 2,
              s.sizePx,
              this.facing * s.speedTilesPerSec * t * this.speedMul,
              0,
              s.damage,
            ),
          );
          this.shotsLeft -= 1;
          this.timer = this.scaled(s.intervalSec);
        }
        if (this.shotsLeft <= 0 && this.timer <= 0)
          this.enter('recover', this.scaled(a.shot.recoverSec));
        break;
      case 'charge':
        // Dừng khi đụng tường (xử lý trong physics).
        if (this.timer <= 0) this.enter('recover', this.scaled(a.charge.recoverSec));
        break;
      case 'slam':
        break;
      case 'rain':
        if (this.timer <= 0) {
          this.rainCols = [];
          this.enter('stunned', a.rain.stunAfterSec);
        }
        break;
    }
  }

  private physics(dt: number, ev: BossEvents, pool: ProjectilePool): void {
    const a = this.data.attacks;
    if (this.airborne || groundBelow(this.box, this.map) === undefined)
      this.vy += BOSS_GRAVITY * dt;
    else this.vy = 0;
    const hitX = moveX(this.box, this.vx * dt, this.map);
    if (hitX !== 0) {
      this.vx = 0;
      if (this.state === 'active' && this.attack === 'charge')
        this.enter('recover', this.scaled(a.charge.recoverSec));
    }
    const hitY = moveY(this.box, this.vy * dt, this.map, true);
    if (hitY === 1) {
      this.vy = 0;
      if (this.airborne) {
        this.airborne = false;
        this.vx = 0;
        if (this.state === 'active' && this.attack === 'slam') {
          ev.landed = true;
          spawnShockwaves(
            pool,
            this.map.tileSize,
            this.centerX,
            this.box.y + this.box.h,
            this.box.w / 2,
            this.data.attacks.slam.shockwave,
            this.speedMul,
          );
          this.enter('recover', this.scaled(a.slam.recoverSec));
        }
      }
    }
  }
}
