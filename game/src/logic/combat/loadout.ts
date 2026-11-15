import {
  type ChargeLevelData,
  PLAYABLE_BEHAVIORS,
  type SweepBehavior,
  type WeaponsData,
} from '../../core/weapons-config';
import type { ProjectilePool, ProjectileSpec } from './projectiles';

export const ARC_CANNON = 'Arc Cannon';

/** Mức nạp: 0 chưa nạp, 1 nạp vừa, 2 nạp đầy. */
export type ChargeLevel = 0 | 1 | 2;

export interface WeaponSlot {
  name: string;
  kind: 'buster' | 'sweep';
  /** Năng lượng còn lại (thanh energyMax); Arc Cannon không tốn năng lượng. */
  energy: number;
  cost: number;
  behavior: SweepBehavior | null;
}

export interface FireInput {
  pressed: boolean;
  held: boolean;
  released: boolean;
  /** Tự bắn (cảm ứng): giữ nút thì vừa bắn liên tục vừa nạp. */
  autoFire: boolean;
}

export interface FireContext {
  /** Tâm người chơi theo trục X và mép trên hộp, px. */
  centerX: number;
  top: number;
  facing: 1 | -1;
  /** Người chơi vừa bị đánh trong bước này: mất năng lượng nạp (GDD 5.1). */
  hurt: boolean;
  /** Bật hỗ trợ ngắm nhẹ: mục tiêu (tâm) để nắn đạn thường về phía đó. */
  aimTargets: ReadonlyArray<{ x: number; y: number }> | undefined;
}

export interface FireEvents {
  fired: 'shot' | 'mid' | 'charged' | 'sweep' | undefined;
  /** Bấm vũ khí boss nhưng hết năng lượng. */
  empty: boolean;
}

/** Hỗ trợ ngắm chỉ nắn trong dải dọc này (px) và nghiêng tối đa tỉ lệ này của tốc độ đạn. */
const AIM_BAND_PX = 12;
const AIM_MAX_SLOPE = 0.25;

/**
 * Vũ khí của người chơi (GDD 5.1, 7): Arc Cannon với 3 mức nạp và tối đa N đạn trên màn,
 * vũ khí boss là dữ liệu có thanh năng lượng riêng. Đổi vũ khí tức thời, không dừng game.
 */
export class WeaponLoadout {
  readonly slots: WeaponSlot[];
  index = 0;
  private chargeTime = 0;
  private keepCharge = 0;
  private fireCooldown = 0;
  private autoTimer = 0;
  private sinceBossWeapon = 0;

  constructor(
    private data: WeaponsData,
    private readonly tileSize: number,
  ) {
    this.slots = [
      { name: ARC_CANNON, kind: 'buster', energy: data.energyMax, cost: 0, behavior: null },
    ];
  }

  /** Đổi dữ liệu vũ khí khi đang chơi (bảng chỉnh cảm giác). */
  setData(data: WeaponsData): void {
    this.data = data;
  }

  get energyMax(): number {
    return this.data.energyMax;
  }

  get current(): WeaponSlot {
    return this.slots[this.index] ?? (this.slots[0] as WeaponSlot);
  }

  /** Sượt đạn (P3 bậc 3): cộng thời gian nạp nếu đang giữ nút nạp Arc Cannon. */
  addCharge(sec: number): void {
    if (this.chargeTime > 0) this.chargeTime += sec;
  }

  get chargeLevel(): ChargeLevel {
    const arc = this.data.arcCannon;
    if (this.chargeTime >= arc.charge.timeSec - 1e-9) return 2;
    if (this.chargeTime >= arc.midCharge.timeSec - 1e-9) return 1;
    return 0;
  }

  /** Thêm vũ khí boss (đầy năng lượng). Vũ khí chưa có hành vi trong dữ liệu thì bỏ qua. */
  grant(name: string): boolean {
    if (this.slots.some((s) => s.name === name)) return false;
    const weapon = this.data.bossWeapons.find((w) => w.name === name);
    // Chỉ hành vi đã có code (Prism Beam có dữ liệu `beam` từ ST-15-01a, hành vi ở ST-15-03).
    // `step()` chỉ biết roi (`sweep`); hành vi khác đi nhánh Arc Cannon nên phải chặn ở đây.
    const b = weapon?.behavior;
    if (
      !b ||
      b.type !== 'sweep' ||
      !PLAYABLE_BEHAVIORS.includes(b.type) ||
      weapon.energyCost === null
    )
      return false;
    this.slots.push({
      name,
      kind: b.type,
      energy: this.data.energyMax,
      cost: weapon.energyCost,
      behavior: b,
    });
    return true;
  }

  has(name: string): boolean {
    return this.slots.some((s) => s.name === name);
  }

  /** Đổi vũ khí (−1 trước, 1 sau). Đang nạp đầy thì giữ nạp thêm chargeKeepAfterSwapSec. */
  swap(dir: 1 | -1): void {
    if (this.slots.length < 2) return;
    const leavingBuster = this.current.kind === 'buster';
    if (leavingBuster) {
      if (this.chargeLevel === 2) this.keepCharge = this.data.arcCannon.chargeKeepAfterSwapSec;
      else this.chargeTime = 0;
    }
    this.index = (this.index + dir + this.slots.length) % this.slots.length;
  }

  refill(): void {
    for (const s of this.slots) s.energy = this.data.energyMax;
    this.chargeTime = 0;
    this.keepCharge = 0;
  }

  step(input: FireInput, ctx: FireContext, pool: ProjectilePool, dt: number): FireEvents {
    const events: FireEvents = { fired: undefined, empty: false };
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.sinceBossWeapon += dt;
    this.regen(dt);
    if (ctx.hurt) {
      this.chargeTime = 0;
      this.keepCharge = 0;
    }
    if (this.current.kind === 'sweep') {
      this.tickKeep(dt);
      if (input.pressed) this.fireSweep(ctx, pool, events);
      return events;
    }

    // Arc Cannon.
    const arc = this.data.arcCannon;
    if (input.pressed) {
      this.tryShot(ctx, pool, events);
      this.autoTimer = arc.autoFireIntervalSec;
    }
    if (input.held) {
      this.chargeTime += dt;
      this.keepCharge = 0;
      if (input.autoFire) {
        this.autoTimer -= dt;
        if (this.autoTimer <= 1e-9) {
          this.tryShot(ctx, pool, events);
          this.autoTimer = arc.autoFireIntervalSec;
        }
      }
    } else {
      this.tickKeep(dt);
    }
    if (input.released) {
      const level = this.chargeLevel;
      if (level > 0) {
        this.spawnCharged(level === 2 ? arc.charge : arc.midCharge, level === 2 ? 2 : 1, ctx, pool);
        events.fired = level === 2 ? 'charged' : 'mid';
      }
      this.chargeTime = 0;
      this.keepCharge = 0;
    }
    return events;
  }

  /** Nạp đầy rồi đổi vũ khí: giữ trong một lúc rồi tan; đổi lại kịp thì vẫn còn. */
  private tickKeep(dt: number): void {
    if (this.keepCharge > 0) {
      this.keepCharge = Math.max(0, this.keepCharge - dt);
      if (this.keepCharge <= 1e-9) this.chargeTime = 0;
    } else if (this.current.kind !== 'buster') {
      this.chargeTime = 0;
    }
  }

  private regen(dt: number): void {
    const { perSec, afterNoFireSec } = this.data.energyRegen;
    if (this.sinceBossWeapon < afterNoFireSec) return;
    for (const s of this.slots) {
      if (s.kind !== 'buster') s.energy = Math.min(this.data.energyMax, s.energy + perSec * dt);
    }
  }

  private muzzle(ctx: FireContext): { x: number; y: number } {
    const m = this.data.arcCannon.muzzleOffsetPx;
    return { x: ctx.centerX + ctx.facing * m.x, y: ctx.top + m.y };
  }

  private tryShot(ctx: FireContext, pool: ProjectilePool, events: FireEvents): void {
    const arc = this.data.arcCannon;
    if (this.fireCooldown > 0) return;
    if (pool.count('player', ['shot']) >= arc.maxOnScreen) return;
    const { w, h } = arc.projectile.sizePx;
    const speed = arc.projectile.speedTilesPerSec * this.tileSize;
    const m = this.muzzle(ctx);
    pool.spawn({
      ...this.baseSpec(ARC_CANNON),
      kind: 'shot',
      x: m.x - w / 2,
      y: m.y - h / 2,
      w,
      h,
      vx: ctx.facing * speed,
      vy: this.aimVy(m, ctx, speed),
      kindMul: 1,
      pierceLeft: 0,
      breaksShield: false,
    });
    this.fireCooldown = arc.fireIntervalSec;
    events.fired = 'shot';
  }

  /** Đạn nạp luôn bắn được khi thả nút (không tính vào giới hạn đạn thường). */
  private spawnCharged(
    level: ChargeLevelData,
    kind: 1 | 2,
    ctx: FireContext,
    pool: ProjectilePool,
  ): void {
    const arc = this.data.arcCannon;
    const { w, h } = level.sizePx;
    const m = this.muzzle(ctx);
    pool.spawn({
      ...this.baseSpec(ARC_CANNON),
      kind: kind === 2 ? 'charged' : 'mid',
      x: m.x - w / 2,
      y: m.y - h / 2,
      w,
      h,
      vx: ctx.facing * arc.projectile.speedTilesPerSec * this.tileSize,
      vy: 0,
      kindMul: level.damageMul,
      pierceLeft: level.pierce,
      breaksShield: level.breaksShield,
    });
  }

  private fireSweep(ctx: FireContext, pool: ProjectilePool, events: FireEvents): void {
    const slot = this.current;
    const b = slot.behavior;
    if (!b || this.fireCooldown > 0) return;
    if (slot.energy + 1e-9 < slot.cost) {
      events.empty = true;
      return;
    }
    slot.energy -= slot.cost;
    this.sinceBossWeapon = 0;
    this.fireCooldown = b.cooldownSec;
    const width = b.rangeTiles * this.tileSize;
    const m = this.muzzle(ctx);
    pool.spawn({
      ...this.baseSpec(slot.name),
      kind: 'sweep',
      x: ctx.facing > 0 ? ctx.centerX : ctx.centerX - width,
      y: m.y - b.heightPx / 2,
      w: width,
      h: b.heightPx,
      vx: 0,
      vy: 0,
      kindMul: b.damageMul,
      pierceLeft: Number.POSITIVE_INFINITY,
      breaksShield: false,
      ttl: b.activeSec,
      attached: true,
    });
    events.fired = 'sweep';
  }

  private baseSpec(
    weapon: string,
  ): Omit<
    ProjectileSpec,
    'kind' | 'x' | 'y' | 'w' | 'h' | 'vx' | 'vy' | 'kindMul' | 'pierceLeft' | 'breaksShield'
  > {
    const arc = this.data.arcCannon;
    return {
      owner: 'player',
      damage: arc.damage,
      weapon,
      maxDistance: arc.projectile.rangeTiles * this.tileSize,
      ttl: 10,
      attached: false,
    };
  }

  /** Hỗ trợ ngắm nhẹ: nghiêng đạn thường về mục tiêu gần nhất phía trước trong dải dọc hẹp. */
  private aimVy(m: { x: number; y: number }, ctx: FireContext, speed: number): number {
    if (!ctx.aimTargets) return 0;
    let best: { x: number; y: number } | undefined;
    for (const t of ctx.aimTargets) {
      const dx = (t.x - m.x) * ctx.facing;
      if (dx <= 0 || Math.abs(t.y - m.y) > AIM_BAND_PX) continue;
      if (!best || dx < (best.x - m.x) * ctx.facing) best = t;
    }
    if (!best) return 0;
    const time = Math.abs(best.x - m.x) / speed;
    const vy = (best.y - m.y) / time;
    return Math.max(-speed * AIM_MAX_SLOPE, Math.min(speed * AIM_MAX_SLOPE, vy));
  }
}
