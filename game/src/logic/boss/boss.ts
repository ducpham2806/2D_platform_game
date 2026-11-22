import {
  attackOf,
  type BossAttackId,
  type BossData,
  type ThornsAttack,
} from '../../core/boss-config';
import type { OutgoingHit } from '../combat/damage';
import type { ProjectilePool } from '../combat/projectiles';
import { type Box, groundBelow, moveX, moveY } from '../player/collision';
import type { Rng } from '../rng';
import type { TileMap } from '../tilemap';
import { BossBeam } from './boss-beam';
import { BossFlight, type DiveLine, type RoomBossArena } from './boss-flight';
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
  readonly beam = new BossBeam();
  readonly source: string | undefined;
  private readonly flight: BossFlight | undefined;
  diveLine: DiveLine | undefined;
  gust: { direction: 1 | -1; pushTilesPerSec: number; remainingSec: number } | undefined;
  private diveFollowUpPending = false;
  private followUpWarning = false;
  private beamFollowUpPending = false;
  private fanAngle = 0;
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
  /** Hồi choáng còn lại (QB-14): hết choáng thì chừng này giây không choáng lại. */
  private stunCooldown = 0;
  /** Bất tử khi kẹp pha (QB-31), giây còn lại. */
  private shift = 0;
  /** Vừa kẹp pha: StageWorld cần xóa đạn boss (`takeShotClear`). */
  private shotClear = false;
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
    room?: RoomBossArena,
  ) {
    this.box = {
      x: spawnCenterX - data.sizePx.w / 2,
      y: spawnBottom - data.sizePx.h,
      w: data.sizePx.w,
      h: data.sizePx.h,
    };
    this.hp = data.hp;
    if (room && data.roomFlight) {
      this.flight = new BossFlight(data.roomFlight, room, map.tileSize);
      this.source = `boss:${data.id}`;
    }
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
    if (this.state === 'active' && this.attack === 'dive')
      return attackOf(this.data, 'dive').damage;
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

  /** Đang bất tử để đổi pha sau khi kẹp máu (QB-31): đạn của Kai bị chặn. */
  get shifting(): boolean {
    return this.shift > 0;
  }

  /** Giây hồi choáng còn lại (QB-14). */
  get stunCooldownSec(): number {
    return this.stunCooldown;
  }

  /** Trả true một lần sau khi kẹp pha: người gọi xóa đạn boss trong pool (QB-31). */
  takeShotClear(): boolean {
    const clear = this.shotClear;
    this.shotClear = false;
    return clear;
  }

  /** Bắt đầu trận (người chơi vào đấu trường). */
  activate(): void {
    if (this.state === 'waiting') this.enter('idle', this.data.idleSec);
  }

  /**
   * Hết máu thì chết ngay trong bước này (gọi sau khi xử lý đạn của Kai). Trả true nếu vừa chết.
   * Nếu không, boss chỉ bị đánh dấu chết ở bước sau, và đòn của nó trong bước này có thể giết Kai
   * rồi nhánh hồi sinh dựng lại boss đầy máu (người chơi mất trận thắng).
   */
  settleDefeat(): boolean {
    if (this.state === 'dead' || this.state === 'waiting' || this.hp > 0) return false;
    this.state = 'dead';
    this.vx = 0;
    this.beam.clear();
    this.gust = undefined;
    return true;
  }

  /**
   * Nhận một đòn. Trả false khi đòn không vào (chưa đấu, đã chết, đang bất tử đổi pha).
   * - QB-31: máu sau đòn rơi vào pha cách pha đang chơi từ 2 trở lên thì kẹp ở ngưỡng kết thúc pha
   *   đang chơi (không cao hơn máu hiện có), bất tử `phaseShiftSec`, bỏ đòn đang dở, xóa đạn boss.
   * - QB-14: choáng do điểm yếu chỉ bắt đầu khi không đang choáng và hết hồi choáng; trúng trong
   *   lúc choáng không làm mới choáng. Sát thương ×điểm yếu không đổi.
   */
  takeHit(hit: OutgoingHit): boolean {
    if (this.state === 'dead' || this.state === 'waiting' || this.shift > 0) return false;
    let hp = Math.max(0, this.hp - hit.amount);
    // Chết tính là "pha" sau pha cuối: một đòn từ pha áp chót xuống 0 cũng là bỏ qua pha cuối.
    const landing = hp <= 0 ? this.data.phases.length : this.phaseFor((hp / this.data.hp) * 100);
    const current = this.data.phases[this.phase];
    if (current && landing >= this.phase + 2) {
      // Nhích dưới ngưỡng một chút để số thực không làm boss kẹt lại pha cũ (ngưỡng như 33,3).
      const threshold = (current.untilHpPct / 100) * this.data.hp * (1 - 1e-12);
      hp = Math.min(this.hp, threshold);
      this.beginPhaseShift();
    }
    this.hp = hp;
    this.flash = 0.08;
    // Choáng mới chỉ khi không đang choáng (kể cả choáng sau Mưa đạn, Hoa Nở) và hết hồi choáng.
    if (hit.stunSec > 0 && !this.stunned && this.stunCooldown <= 0 && this.shift <= 0)
      this.stun = hit.stunSec;
    return true;
  }

  private beginPhaseShift(): void {
    this.shift = this.data.rules.phaseShiftSec;
    this.shotClear = true;
    this.stun = 0;
    this.vx = 0;
    this.attack = undefined;
    this.telegraphProgress = 0;
    this.rootXs = [];
    this.rainCols = [];
    this.stalkMarks = [];
    this.stalkPending = [];
    this.beam.clear();
    this.diveLine = undefined;
    this.diveFollowUpPending = this.followUpWarning = this.beamFollowUpPending = false;
    this.gust = undefined;
    if (this.flight) this.vy = 0;
    this.enter('idle', this.scaled(this.data.idleSec));
  }

  step(ctx: BossContext, pool: ProjectilePool, dt: number): BossEvents {
    const ev = noEvents();
    this.flash = Math.max(0, this.flash - dt);
    if (this.state === 'dead' || this.state === 'waiting') return ev;
    if (this.settleDefeat()) {
      ev.defeated = true;
      return ev;
    }
    if (this.data.attacks.beam) this.beam.step(dt);
    if (this.gust) {
      this.gust.remainingSec -= dt;
      if (this.gust.remainingSec <= 1e-9) this.gust = undefined;
    }
    const phase = this.phaseFor(this.hpPct);
    if (phase !== this.phase) {
      this.phase = phase;
      this.cursor = 0;
      ev.phaseChanged = true;
    }
    if (this.shift > 0) {
      // Đổi pha sau khi kẹp máu: đứng yên, mọi đồng hồ đòn dừng (QB-31).
      this.shift = Math.max(0, this.shift - dt);
      this.vx = 0;
      this.physics(dt, ev, pool);
      return ev;
    }
    if (this.stun > 0) {
      this.stun = Math.max(0, this.stun - dt);
      if (this.stun === 0) this.stunCooldown = this.data.rules.weakStunCooldownSec;
      this.vx = 0;
      this.physics(dt, ev, pool);
      return ev;
    }
    this.stunCooldown = Math.max(0, this.stunCooldown - dt);
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
    const allowed = ctx.attackAllowed !== false;
    const elapsed = this.timer <= (this.flight ? 1e-9 : 0);
    if (!allowed && this.state === 'telegraph') {
      if (!this.followUpWarning) this.cursor = Math.max(0, this.cursor - 1);
      this.diveFollowUpPending = this.followUpWarning = false;
      this.beam.cancelPending();
      this.diveLine = undefined;
      this.enter('idle', 0);
    }
    if (!allowed) this.diveFollowUpPending = false;
    switch (this.state) {
      case 'idle': {
        this.facing = ctx.playerX < this.centerX ? -1 : 1;
        this.vx = ctx.inRange === false ? 0 : this.walkVelocity(ctx);
        const atHeight =
          !this.flight || this.box.y + this.box.h / 2 <= this.flight.attackHeightY + 0.01;
        if (allowed && atHeight && elapsed) {
          if (this.diveFollowUpPending) {
            this.diveFollowUpPending = false;
            this.followUpWarning = true;
            const warn = attackOf(this.data, 'dive').followUpTelegraphSec;
            this.prepareDive(ctx);
            this.windUp('dive', this.scaled(warn), ev);
          } else this.startAttack(ctx, ev);
        }
        break;
      }
      case 'telegraph': {
        const retreat =
          this.attack === 'charge' ? this.data.attacks.charge?.retreatTiles : undefined;
        this.vx = retreat ? (-this.facing * retreat * this.map.tileSize) / this.telegraphTotal : 0;
        this.telegraphProgress = 1 - Math.max(0, this.timer) / this.telegraphTotal;
        if (this.attack === 'beam') this.beam.warn(attackOf(this.data, 'beam'));
        if (elapsed) this.beginActive(pool, ev);
        break;
      }
      case 'active':
        if (this.attack === 'stalk') this.runStalk(ctx, pool, dt);
        else this.runActive(pool, ev, allowed);
        break;
      case 'recover':
      case 'stunned':
        this.vx = 0;
        if (elapsed)
          this.enter('idle', this.diveFollowUpPending ? 0 : this.scaled(this.data.idleSec));
        break;
    }
  }

  private startAttack(ctx: BossContext, ev: BossEvents): void {
    const list = this.data.phases[this.phase]?.attacks ?? ['shot'];
    const id = list[this.cursor % list.length] ?? 'shot';
    this.cursor += 1;
    this.followUpWarning = false;
    this.windUp(id, this.telegraphFor(id), ev);
    if (id === 'dive') {
      this.diveFollowUpPending = this.phase > 0;
      this.prepareDive(ctx);
    }
    if (id === 'beam') {
      this.beam.begin(this.flight?.route(this.centerX));
      this.beam.warn(attackOf(this.data, id));
    }
    if (id === 'gust' || (id === 'thorns' && this.flight)) {
      this.shotLaneY = this.box.y + this.box.h / 2;
      this.fanAngle = Math.atan2(
        ctx.playerY - this.shotLaneY,
        Math.abs(ctx.playerX - this.centerX),
      );
    }
    if (id === 'shot') this.shotLaneY = ctx.playerY;
    if (id === 'slam') this.slamTargetX = ctx.playerX;
    if (id === 'thorns' && !this.flight) this.shotLaneY = this.laneNear(ctx.playerY);
    if (id === 'lash') this.lashReachPx = this.clearReach(attackOf(this.data, 'lash'));
    if (id === 'roots') this.rootXs = this.planRoots(ctx.playerX);
    if (id === 'rain') {
      const r = attackOf(this.data, 'rain');
      const { first, last } = this.arenaCols;
      this.rainCols = (
        r.count === undefined
          ? planRain(first, last, r.safeGaps, r.gapWidthTiles, this.rng)
          : planBloom(first, last, r.safeGaps, r.gapWidthTiles, r.count, this.rng)
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

  private windUp(id: BossAttackId, seconds: number, ev: BossEvents): void {
    if (this.flight) this.vx = 0;
    this.attack = id;
    this.telegraphTotal = seconds;
    this.telegraphProgress = 0;
    this.enter('telegraph', seconds);
    ev.attackStarted = id;
  }

  private prepareDive(ctx: BossContext): void {
    this.diveLine = this.flight?.planDive(this.box, ctx.playerX, ctx.playerY, this.arenaCols);
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

  private beginActive(pool: ProjectilePool, ev: BossEvents): void {
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
      case 'beam': {
        const a = attackOf(this.data, 'beam');
        this.beamFollowUpPending = a.pulseGapSec !== undefined;
        this.enter('active', a.pulseGapSec ?? a.activeSec);
        this.fireBeam(false, ev);
        break;
      }
      case 'dive': {
        const line = this.diveLine!;
        const dx = line.to.x - line.from.x;
        const dy = line.to.y - line.from.y;
        const speed = attackOf(this.data, 'dive').speedTilesPerSec * t * this.speedMul;
        const length = Math.hypot(dx, dy);
        this.vx = (dx * speed) / length;
        this.vy = (dy * speed) / length;
        this.enter('active', 0);
        break;
      }
      case 'gust': {
        const a = attackOf(this.data, 'gust');
        this.spawnFan(pool, a);
        this.gust = {
          direction: this.facing,
          pushTilesPerSec: a.pushTilesPerSec,
          remainingSec: a.activeSec,
        };
        this.enter('active', a.activeSec);
        break;
      }
      case 'rain':
        spawnRainDrops(
          pool,
          t,
          this.rainCols,
          attackOf(this.data, 'rain'),
          'drop',
          this.source,
          this.flight ? this.flight.arena.topY + t : undefined,
        );
        this.enter('active', attackOf(this.data, 'rain').activeSec);
        break;
      case 'thorns': {
        const a = attackOf(this.data, 'thorns');
        this.spawnFan(pool, a);
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

  private spawnFan(pool: ProjectilePool, a: ThornsAttack): void {
    const t = this.map.tileSize;
    for (let i = 0; i < a.count; i += 1) {
      const spread =
        a.count === 1 ? 0 : (-a.spreadDeg / 2 + (a.spreadDeg * i) / (a.count - 1)) * DEG;
      const angle = this.fanAngle + spread;
      const speed = a.speedTilesPerSec * t * this.speedMul;
      const projectile = enemyProjectile(
        t,
        'enemyShot',
        this.centerX + this.facing * (this.box.w / 2) - a.sizePx.w / 2,
        this.shotLaneY - a.sizePx.h / 2,
        a.sizePx,
        this.facing * Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        a.damage,
      );
      pool.spawn(this.source ? { ...projectile, source: this.source } : projectile);
    }
  }

  private fireBeam(alternate: boolean, ev: BossEvents): void {
    const a = attackOf(this.data, 'beam');
    if (
      this.beam.fire(a, alternate, this.box) &&
      this.takeHit({ amount: a.selfHitDamage, weak: false, stunSec: a.selfHitStunSec })
    ) {
      ev.reflected = true;
      this.beamFollowUpPending = false;
      this.beam.cancelPending();
      this.enter('recover', this.scaled(a.recoverSec));
    } else if (this.beamFollowUpPending) this.beam.warn(a, true);
    else this.beam.cancelPending();
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

  private runActive(pool: ProjectilePool, ev: BossEvents, allowed: boolean): void {
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
      case 'dive':
        break;
      case 'beam': {
        const a = attackOf(this.data, 'beam');
        if (this.beamFollowUpPending && !allowed) {
          this.beamFollowUpPending = false;
          this.beam.cancelPending();
        }
        if (this.beamFollowUpPending) {
          this.beam.warn(a, true);
          if (this.timer <= 1e-9) {
            this.beamFollowUpPending = false;
            this.timer = a.activeSec;
            this.fireBeam(true, ev);
          }
        } else if (this.timer <= 1e-9) this.enter('recover', this.scaled(a.recoverSec));
        break;
      }
      case 'gust':
        if (this.timer <= 1e-9)
          this.enter('recover', this.scaled(attackOf(this.data, 'gust').recoverSec));
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

  private fly(dt: number, ev: BossEvents, pool: ProjectilePool): void {
    if (!this.flight || this.shifting || this.stunned) return;
    const hitX = moveX(this.box, this.vx * dt, this.map);
    if (this.state === 'idle') {
      moveY(this.box, this.flight.rise(this.box, dt), this.map, false);
    } else if (this.state === 'active' && this.attack === 'charge' && hitX !== 0) {
      this.vx = 0;
      this.enter('recover', this.scaled(attackOf(this.data, 'charge').recoverSec));
    } else if (this.state === 'active' && this.attack === 'dive') {
      if (hitX !== 0) this.vx = 0;
      if (moveY(this.box, this.vy * dt, this.map, true) !== 1) return;
      const a = attackOf(this.data, 'dive');
      this.vx = this.vy = 0;
      this.diveLine = undefined;
      ev.landed = true;
      if (a.shockwave)
        spawnShockwaves(
          pool,
          this.map.tileSize,
          this.centerX,
          this.box.y + this.box.h,
          this.box.w / 2,
          a.shockwave,
          this.speedMul,
          this.source,
        );
      this.enter('recover', this.scaled(a.recoverSec));
    }
  }

  private physics(dt: number, ev: BossEvents, pool: ProjectilePool): void {
    if (this.flight) {
      this.fly(dt, ev, pool);
      return;
    }
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
