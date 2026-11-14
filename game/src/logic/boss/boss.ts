import { attackOf, type BossAttackId, type BossData } from '../../core/boss-config';
import type { OutgoingHit } from '../combat/damage';
import type { ProjectilePool } from '../combat/projectiles';
import { type Box, groundBelow, moveX, moveY } from '../player/collision';
import type { Rng } from '../rng';
import type { TileMap } from '../tilemap';
import { type BossContext, type BossEvents, type BossState, noEvents } from './boss-types';
import { enemyProjectile, spawnRainDrops, spawnShockwaves } from './enemy-projectile';

export type { BossContext, BossEvents, BossState } from './boss-types';
import { planBloom, planRain } from './rain';

const DEG = Math.PI / 180;

/** Trọng lực của boss (px/s²) chỉ dùng để rơi về sàn; đòn Nhảy đập tự tính quỹ đạo riêng. */
const BOSS_GRAVITY = 1400;

/**
 * Boss theo dữ liệu (GDD 9): chờ → báo trước (telegraph) → ra đòn → hồi, lặp theo danh sách đòn
 * của pha hiện tại. Pha đổi theo % máu; pha cuối nhanh hơn speedMul nhưng telegraph không ngắn
 * hơn minTelegraphSec. Trúng điểm yếu thì choáng, mọi đồng hồ đứng yên.
 */
export class Boss {
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
  /** Thorna: tâm các cột Rễ Trồi (vết nứt trên sàn khi báo trước) và hướng/độ dài Dây Quất. */
  rootXs: number[] = [];
  lashReachPx = 0;
  /**
   * Rễ Đuổi (Thử thách): các vệt đã đánh dấu trên mặt Kai đứng (tâm x, mặt y), tiến độ 0..1 tới
   * khi trồi. Rễ trồi rồi thì vệt bị bỏ.
   */
  stalkMarks: { x: number; y: number; progress: number }[] = [];
  private stalkMarked = 0;
  private stalkPending: { x: number; y: number; left: number; total: number }[] = [];
  /** Tiến độ telegraph 0..1 để vẽ hiệu ứng báo trước. */
  telegraphProgress = 0;

  private timer = 0;
  private telegraphTotal = 0;
  private stun = 0;
  private cursor = 0;
  private shotsLeft = 0;
  private rootsSpawned = 0;
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
    if (this.state === 'active' && this.attack === 'charge')
      return attackOf(this.data, 'charge').damage;
    if (this.state === 'active' && this.attack === 'slam')
      return attackOf(this.data, 'slam').damage;
    return this.data.contactDamage;
  }

  /** Đang hở (Đòn Trừng Phạt, V3): pha hồi sau đòn hoặc đang choáng. */
  get exposed(): boolean {
    return this.state === 'recover' || this.stunned;
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
    this.think(ctx, pool, ev, dt);
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
    return Math.max(this.data.minTelegraphSec, this.scaled(attackOf(this.data, id).telegraphSec));
  }

  private think(ctx: BossContext, pool: ProjectilePool, ev: BossEvents, dt: number): void {
    switch (this.state) {
      case 'idle':
        this.facing = ctx.playerX < this.centerX ? -1 : 1;
        this.vx = this.walkVelocity(ctx);
        if (this.timer <= 0) this.startAttack(ctx, ev);
        break;
      case 'telegraph':
        this.vx = 0;
        this.telegraphProgress = 1 - Math.max(0, this.timer) / this.telegraphTotal;
        if (this.timer <= 0) this.beginActive(pool);
        break;
      case 'active':
        if (this.attack === 'stalk') this.runStalk(ctx, pool, dt);
        else this.runActive(pool);
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
    if (id === 'thorns') this.shotLaneY = this.laneNear(ctx.playerY);
    if (id === 'lash') this.lashReachPx = this.clearReach(attackOf(this.data, 'lash'));
    if (id === 'roots') this.rootXs = this.planRoots(ctx.playerX);
    if (id === 'rain') {
      const r = attackOf(this.data, 'rain');
      this.rainCols = planRain(
        this.arenaCols.first,
        this.arenaCols.last,
        r.safeGaps,
        r.gapWidthTiles,
        this.rng,
      ).dropCols;
    }
    if (id === 'bloom') {
      const b = attackOf(this.data, 'bloom');
      this.rainCols = planBloom(
        this.arenaCols.first,
        this.arenaCols.last,
        b.safeGaps,
        b.gapWidthTiles,
        b.seeds,
        this.rng,
      ).dropCols;
    }
  }

  /** Boss đi chậm về phía người chơi khi nghỉ, dừng khi đã đủ gần. */
  private walkVelocity(ctx: BossContext): number {
    const walk = this.data.walk;
    if (!walk) return 0;
    const t = this.map.tileSize;
    const dx = ctx.playerX - this.centerX;
    if (Math.abs(dx) <= walk.keepDistanceTiles * t) return 0;
    return Math.sign(dx) * walk.speedTilesPerSec * t * this.speedMul;
  }

  /** Làn bắn gai: ngang tầm người chơi nhưng nằm trong thân boss. */
  private laneNear(playerY: number): number {
    const margin = 6;
    return Math.min(Math.max(playerY, this.box.y + margin), this.box.y + this.box.h - margin);
  }

  /** Tầm Dây Quất thật sự (px) trước khi chạm tường, để hộp đòn không nằm trong ô đặc. */
  private clearReach(lash: { reachTiles: number; heightPx: number }): number {
    const t = this.map.tileSize;
    const top = Math.floor((this.box.y + this.box.h - lash.heightPx) / t);
    const bottom = Math.floor((this.box.y + this.box.h - 1e-6) / t);
    let tiles = 0;
    let col =
      this.facing > 0
        ? Math.floor((this.box.x + this.box.w) / t)
        : Math.floor((this.box.x - 1e-6) / t);
    while (tiles < lash.reachTiles) {
      let blocked = false;
      for (let row = top; row <= bottom; row += 1) if (this.map.isSolid(col, row)) blocked = true;
      if (blocked) break;
      tiles += 1;
      col += this.facing;
    }
    return tiles * t;
  }

  /** Tâm các cột rễ, từ trái sang phải, quanh chỗ người chơi đang đứng, trong đấu trường. */
  private planRoots(playerX: number): number[] {
    const r = attackOf(this.data, 'roots');
    const t = this.map.tileSize;
    const lo = this.arenaCols.first * t + r.sizePx.w / 2;
    const hi = (this.arenaCols.last + 1) * t - r.sizePx.w / 2;
    const xs: number[] = [];
    for (let i = 0; i < r.count; i += 1) {
      const x = playerX + (i - (r.count - 1) / 2) * r.spacingTiles * t;
      xs.push(Math.min(Math.max(x, lo), hi));
    }
    return xs;
  }

  private beginActive(pool: ProjectilePool): void {
    const t = this.map.tileSize;
    switch (this.attack) {
      case 'shot':
        this.shotsLeft = attackOf(this.data, 'shot').count;
        this.enter('active', 0);
        break;
      case 'charge':
        this.vx = this.facing * attackOf(this.data, 'charge').speedTilesPerSec * t * this.speedMul;
        this.enter('active', 10);
        break;
      case 'slam': {
        const air = this.scaled(attackOf(this.data, 'slam').airSec);
        this.vx = (this.slamTargetX - this.centerX) / air;
        this.vy = (-BOSS_GRAVITY * air) / 2;
        this.airborne = true;
        this.enter('active', air + 1);
        break;
      }
      case 'rain':
        spawnRainDrops(pool, t, this.rainCols, attackOf(this.data, 'rain'));
        this.enter('active', attackOf(this.data, 'rain').activeSec);
        break;
      case 'thorns': {
        const a = attackOf(this.data, 'thorns');
        for (let i = 0; i < a.count; i += 1) {
          const angle =
            a.count === 1 ? 0 : (-a.spreadDeg / 2 + (a.spreadDeg * i) / (a.count - 1)) * DEG;
          const speed = a.speedTilesPerSec * t * this.speedMul;
          pool.spawn(
            enemyProjectile(
              t,
              'enemyShot',
              this.centerX + this.facing * (this.box.w / 2) - a.sizePx.w / 2,
              this.shotLaneY - a.sizePx.h / 2,
              a.sizePx,
              this.facing * Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              a.damage,
            ),
          );
        }
        this.enter('recover', this.scaled(a.recoverSec));
        break;
      }
      case 'lash': {
        const a = attackOf(this.data, 'lash');
        const reach = this.lashReachPx;
        if (reach > 0) {
          const x = this.facing > 0 ? this.box.x + this.box.w : this.box.x - reach;
          const spec = enemyProjectile(
            t,
            'lash',
            x,
            this.box.y + this.box.h - a.heightPx,
            { w: reach, h: a.heightPx },
            0,
            0,
            a.damage,
          );
          pool.spawn({ ...spec, ttl: a.activeSec });
        }
        this.enter('active', a.activeSec);
        break;
      }
      case 'roots':
        this.rootsSpawned = 0;
        this.enter('active', 0);
        break;
      case 'bloom': {
        const b = attackOf(this.data, 'bloom');
        spawnRainDrops(pool, t, this.rainCols, { ...b, sizePx: b.sizePx }, 'seed');
        this.enter('active', b.activeSec);
        break;
      }
      case 'stalk':
        // Đánh dấu ngay vệt đầu tiên.
        this.stalkMarked = 0;
        this.stalkPending = [];
        this.stalkMarks = [];
        this.enter('active', 0);
        break;
      default:
        this.enter('recover', 0.5);
    }
  }

  /** Mặt đứng (y của đỉnh ô đặc hoặc bục) ngay dưới điểm (x, y); không có thì đáy boss. */
  private surfaceBelow(x: number, y: number): number {
    const t = this.map.tileSize;
    const col = Math.floor(x / t);
    for (let row = Math.max(0, Math.floor(y / t)); row < this.map.rows; row += 1)
      if (this.map.isSolid(col, row) || this.map.isOneWay(col, row)) return row * t;
    return this.box.y + this.box.h;
  }

  /**
   * Rễ Đuổi (GDD 11 mục 3.3): cứ `markIntervalSec` (chia tốc độ pha) đánh dấu mặt Kai đang đứng,
   * kể cả bục; `eruptDelaySec` sau (chia tốc độ pha, không dưới minTelegraphSec) rễ trồi ở đó.
   */
  private runStalk(ctx: BossContext, pool: ProjectilePool, dt: number): void {
    const a = attackOf(this.data, 'stalk');
    const t = this.map.tileSize;
    if (this.timer <= 0 && this.stalkMarked < a.count) {
      const lo = this.arenaCols.first * t + a.sizePx.w / 2;
      const hi = (this.arenaCols.last + 1) * t - a.sizePx.w / 2;
      const x = Math.min(Math.max(ctx.playerX, lo), hi);
      const total = Math.max(this.data.minTelegraphSec, this.scaled(a.eruptDelaySec));
      this.stalkPending.push({ x, y: this.surfaceBelow(x, ctx.playerY), left: total, total });
      this.stalkMarked += 1;
      this.timer = this.scaled(a.markIntervalSec);
    }
    for (const m of this.stalkPending) {
      m.left -= dt;
      if (m.left <= 1e-9) {
        const spec = enemyProjectile(
          t,
          'root',
          m.x - a.sizePx.w / 2,
          m.y - a.sizePx.h,
          a.sizePx,
          0,
          0,
          a.damage,
        );
        pool.spawn({ ...spec, ttl: a.activeSec });
      }
    }
    this.stalkPending = this.stalkPending.filter((m) => m.left > 1e-9);
    this.stalkMarks = this.stalkPending.map((m) => ({
      x: m.x,
      y: m.y,
      progress: 1 - m.left / m.total,
    }));
    if (this.stalkMarked >= a.count && this.stalkPending.length === 0)
      this.enter('recover', this.scaled(a.recoverSec));
  }

  private runActive(pool: ProjectilePool): void {
    const t = this.map.tileSize;
    switch (this.attack) {
      case 'shot': {
        const s = attackOf(this.data, 'shot');
        if (this.timer <= 0 && this.shotsLeft > 0) {
          pool.spawn(
            enemyProjectile(
              t,
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
          this.enter('recover', this.scaled(s.recoverSec));
        break;
      }
      case 'charge':
        // Dừng khi đụng tường (xử lý trong physics).
        if (this.timer <= 0)
          this.enter('recover', this.scaled(attackOf(this.data, 'charge').recoverSec));
        break;
      case 'slam':
        break;
      case 'rain':
        if (this.timer <= 0) {
          this.rainCols = [];
          this.enter('stunned', attackOf(this.data, 'rain').stunAfterSec);
        }
        break;
      case 'lash':
        if (this.timer <= 0)
          this.enter('recover', this.scaled(attackOf(this.data, 'lash').recoverSec));
        break;
      case 'roots': {
        const r = attackOf(this.data, 'roots');
        const x = this.rootXs[this.rootsSpawned];
        if (this.timer <= 0 && x !== undefined) {
          const floor = this.box.y + this.box.h;
          const spec = enemyProjectile(
            t,
            'root',
            x - r.sizePx.w / 2,
            floor - r.sizePx.h,
            r.sizePx,
            0,
            0,
            r.damage,
          );
          pool.spawn({ ...spec, ttl: r.activeSec });
          this.rootsSpawned += 1;
          this.timer = this.scaled(r.intervalSec);
        }
        if (this.rootsSpawned >= this.rootXs.length && this.timer <= 0) {
          this.rootXs = [];
          this.enter('recover', this.scaled(r.recoverSec));
        }
        break;
      }
      case 'bloom':
        if (this.timer <= 0) {
          this.rainCols = [];
          this.enter('stunned', attackOf(this.data, 'bloom').stunAfterSec);
        }
        break;
    }
  }

  private physics(dt: number, ev: BossEvents, pool: ProjectilePool): void {
    if (this.airborne || groundBelow(this.box, this.map) === undefined)
      this.vy += BOSS_GRAVITY * dt;
    else this.vy = 0;
    const hitX = moveX(this.box, this.vx * dt, this.map);
    if (hitX !== 0) {
      this.vx = 0;
      if (this.state === 'active' && this.attack === 'charge')
        this.enter('recover', this.scaled(attackOf(this.data, 'charge').recoverSec));
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
            attackOf(this.data, 'slam').shockwave,
            this.speedMul,
          );
          this.enter('recover', this.scaled(attackOf(this.data, 'slam').recoverSec));
        }
      }
    }
  }
}
