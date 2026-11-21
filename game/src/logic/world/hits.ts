import type { WeaponsData } from '../../core/weapons-config';
import type { Boss } from '../boss/boss';
import { incomingDamage, outgoingDamage, type OutgoingHit } from '../combat/damage';
import { overlaps, type Projectile, type ProjectilePool } from '../combat/projectiles';
import type { TrainingTarget } from '../combat/targets';
import type { Enemy } from '../enemy/enemy';
import type { PlayerPhysics } from '../player/player-physics';
import type { WorldEvents } from './world-types';

/** Đạn chạm mục tiêu: còn xuyên thì đi tiếp, hết thì biến mất. */
function consume(p: Projectile, targetId: number): void {
  p.hitIds.add(targetId);
  if (p.pierceLeft > 0) p.pierceLeft -= 1;
  else p.alive = false;
}

/** Lưỡi bay tiếp sau khi bị khiên chặn, mỗi chiều chỉ xét mục tiêu một lần. */
function block(p: Projectile, targetId: number): void {
  if (p.boomerang) p.hitIds.add(targetId);
  else p.alive = false;
}

/** Hệ số điểm yếu lấy từ chính vũ khí đang bắn (weapons.json). */
export function weaknessOf(
  weapons: WeaponsData,
  weapon: string,
): { weakMul: number; weakStunSec: number } {
  const w = weapons.bossWeapons.find((b) => b.name === weapon);
  return { weakMul: w?.damageVsWeak ?? 1, weakStunSec: w?.weakStunSec ?? 0 };
}

/** Boss có id âm để không trùng id bia/kẻ địch trong hitIds của đạn. */
const BOSS_ID = -1;

export type BossDamageObserver = (weapon: string, amount: number, weak: boolean) => void;

/** Ghi sát thương thật, kể cả đòn bị kẹp pha (QB-31). */
export function damageBoss(
  boss: Boss,
  hit: OutgoingHit,
  weapon: string,
  ev: WorldEvents,
  observer?: BossDamageObserver,
): boolean {
  const before = boss.hp;
  if (!boss.takeHit(hit)) return false;
  ev.hitBoss = true;
  if (hit.weak) ev.weakHit = true;
  observer?.(weapon, before - boss.hp, hit.weak);
  return true;
}

/** Hiệu ứng Vanguard của build (M8): nổ lan (V2) và Đòn Trừng Phạt (V3). */
export interface VanguardMods {
  /** Sát thương nổ = hệ số × sát thương đạn nạp đầy; 0 = không nổ. */
  burstDamageMul: number;
  burstRadiusPx: number;
  /** Nhân sát thương đạn nạp đầy khi mục tiêu đang hở; 1 = không có. */
  punishMul: number;
}

export const NO_VANGUARD: VanguardMods = { burstDamageMul: 0, burstRadiusPx: 0, punishMul: 1 };

/** Khoảng cách từ điểm tới hộp (0 nếu điểm nằm trong hộp). */
function distToBox(
  x: number,
  y: number,
  b: { x: number; y: number; w: number; h: number },
): number {
  const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
  const dy = Math.max(b.y - y, 0, y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

/** Những thứ đạn người chơi có thể trúng. Bia và kẻ địch dùng chung dãy id dương. */
export interface HitTargets {
  targets: readonly TrainingTarget[];
  enemies: readonly Enemy[];
  boss: Boss | undefined;
}

/**
 * Đạn người chơi trúng bia, kẻ địch và boss. Kẻ địch bị hạ được thêm vào `killed`.
 * Trả về số bước hit-stop cần dừng hình (đạn nạp đầy hoặc trúng điểm yếu, GDD 4).
 */
export function resolvePlayerHits(
  pool: ProjectilePool,
  hitTargets: HitTargets,
  weapons: WeaponsData,
  attackMul: number,
  ev: WorldEvents,
  killed: Enemy[],
  vanguard: VanguardMods = NO_VANGUARD,
  /** Đo lường: sát thương lên boss theo vũ khí (đơn vị phát Arc Cannon), có trúng điểm yếu. */
  onBossDamage?: BossDamageObserver,
): number {
  const { targets, enemies, boss } = hitTargets;
  let hitStop = 0;
  /**
   * V2: đạn nạp đầy trúng mục tiêu thì nổ ở tâm đạn, gây sát thương cho mục tiêu khác trong bán
   * kính. Mỗi mục tiêu nhận tối đa một lần từ mỗi viên (kể cả mục tiêu chính): dùng `hitIds`.
   */
  const explode = (p: Projectile, base: number): void => {
    if (p.kind !== 'charged' || vanguard.burstDamageMul <= 0) return;
    const x = p.x + p.w / 2;
    const y = p.y + p.h / 2;
    const r = vanguard.burstRadiusPx;
    const amount = base * vanguard.burstDamageMul;
    ev.burst = { x, y, r };
    for (const e of enemies) {
      if (!e.alive || p.hitIds.has(e.id) || distToBox(x, y, e.box) > r) continue;
      p.hitIds.add(e.id);
      ev.hitEnemy = true;
      if (e.applyBlast(amount) === 'killed') {
        ev.enemyKilled = true;
        killed.push(e);
      }
    }
    if (
      boss &&
      !p.hitIds.has(BOSS_ID) &&
      distToBox(x, y, boss.box) <= r &&
      damageBoss(boss, { amount, weak: false, stunSec: 0 }, p.weapon, ev, onBossDamage)
    )
      p.hitIds.add(BOSS_ID);
  };
  /** V3: hệ số Đòn Trừng Phạt cho đạn nạp đầy trúng mục tiêu đang hở. */
  const punish = (p: Projectile, exposed: boolean): number => {
    if (p.kind !== 'charged' || !exposed || vanguard.punishMul <= 1) return 1;
    ev.punishHit = true;
    return vanguard.punishMul;
  };
  const amountOf = (p: Projectile): number =>
    outgoingDamage({
      base: p.damage,
      kindMul: p.kindMul,
      attackMul,
      weapon: p.weapon,
      targetWeakness: undefined,
      ...weaknessOf(weapons, p.weapon),
    }).amount;
  for (const p of pool.all) {
    if (!p.alive || p.owner !== 'player') continue;
    const chargedStop = p.kind === 'charged' ? weapons.hitStopSteps.charged : 0;
    for (const t of targets) {
      if (!p.alive || !t.alive || p.hitIds.has(t.id) || !overlaps(p, t.box)) continue;
      const result = t.hit(p, amountOf(p));
      if (result === 'blocked' || result === 'shieldBroken') {
        block(p, t.id);
        if (result === 'blocked') ev.blocked = true;
        else ev.shieldBroken = true;
      } else {
        ev.hitTarget = true;
        consume(p, t.id);
      }
      hitStop = Math.max(hitStop, chargedStop);
    }
    for (const e of enemies) {
      if (!p.alive || !e.alive || p.hitIds.has(e.id) || !overlaps(p, e.box)) continue;
      const result = e.takeHit(p, amountOf(p) * punish(p, e.exposed));
      if (result === 'blocked' || result === 'shieldHit' || result === 'shieldBroken') {
        block(p, e.id);
        ev[result] = true;
      } else {
        ev.hitEnemy = true;
        consume(p, e.id);
        if (result === 'killed') {
          ev.enemyKilled = true;
          killed.push(e);
        } else if (p.freezeSec !== undefined && e.disable(p.freezeSec, 'freeze'))
          ev.enemyFrozen = true;
        explode(p, amountOf(p));
      }
      hitStop = Math.max(hitStop, chargedStop);
    }
    if (!p.alive || !boss || p.hitIds.has(BOSS_ID) || !overlaps(p, boss.box)) continue;
    if (boss.shifting) {
      // Boss bất tử để đổi pha (QB-31): đạn mất, không sát thương, không choáng, không Trừng Phạt.
      p.alive = false;
      ev.bossImmune = true;
      continue;
    }
    const raw = outgoingDamage({
      base: p.damage,
      kindMul: p.kindMul,
      attackMul,
      weapon: p.weapon,
      targetWeakness: boss.data.weakness,
      ...weaknessOf(weapons, p.weapon),
    });
    const hit = { ...raw, amount: raw.amount * punish(p, boss.exposed) };
    if (damageBoss(boss, hit, p.weapon, ev, onBossDamage)) {
      if (hit.weak) hitStop = Math.max(hitStop, weapons.hitStopSteps.weakness);
      hitStop = Math.max(hitStop, chargedStop);
      consume(p, BOSS_ID);
      explode(p, amountOf(p));
    }
  }
  return hitStop;
}

/** id giả trong `hitIds` của đạn địch: đã tính sượt đạn với viên này. */
const GRAZE_ID = -2;

/** Khiên C3 (BuildRuntime của StageWorld). */
export interface KaiShield {
  readonly shieldReady: boolean;
  readonly shieldIFrameSec: number;
  /** Loại đòn khiên không chặn (đòn đỉnh). */
  readonly shieldPierceKinds: ReadonlySet<string>;
  breakShield(): void;
}

/** Phòng thủ của Kai từ build (M8). */
export interface KaiDefense {
  /** Loại đòn tính là đạn (P3 chỉ bất tử thêm với các loại này). */
  bulletKinds: ReadonlySet<string>;
  /** Có sượt đạn (P3 bậc 3): gọi khi một viên đạn đi xuyên trong phần bất tử thêm. */
  onGraze: (() => void) | undefined;
  /** Khiên C3; chưa học thì không có. */
  shield: KaiShield | undefined;
}

export const NO_DEFENSE: KaiDefense = {
  bulletKinds: new Set(),
  onGraze: undefined,
  shield: undefined,
};

/**
 * Đạn kẻ địch, thân kẻ địch đang hoạt động và thân boss trúng người chơi (đã nhân hệ số
 * độ khó). Kẻ địch "vô hại" (Prologue nhịp 1–3) gây 0 máu nhưng vẫn đẩy lùi.
 * Đang lướt với P3: đạn (theo `bulletKinds`) đi xuyên qua; sượt đạn trong phần bất tử thêm.
 * Khiên C3 sẵn: chặn trọn đòn có sát thương đầu tiên (trừ `shieldPierceKinds`), không mất máu,
 * không bật lùi, không phát `hurt`; bất tử ngắn sau đó nên đòn cùng bước cũng không trúng.
 */
export function resolveEnemyHits(
  pool: ProjectilePool,
  enemies: readonly Enemy[],
  boss: Boss | undefined,
  player: PlayerPhysics,
  damageTaken: number,
  ev: WorldEvents,
  defense: KaiDefense = NO_DEFENSE,
): void {
  if (player.state === 'dead') return;
  /** Khiên chặn đòn này (gây `amount` máu, loại `kind`; thân kẻ địch/boss không có loại)? */
  const absorbed = (amount: number, kind?: string): boolean => {
    const s = defense.shield;
    if (!s?.shieldReady || amount <= 0 || player.invulnerable) return false;
    if (kind !== undefined && s.shieldPierceKinds.has(kind)) return false;
    s.breakShield();
    player.absorbHit(s.shieldIFrameSec);
    ev.kaiShieldAbsorbed = true;
    return true;
  };
  for (const p of pool.all) {
    if (!p.alive || p.owner !== 'enemy' || !overlaps(p, player.box)) continue;
    if (player.bulletGuard && defense.bulletKinds.has(p.kind)) {
      if (player.bulletGuardExtended && defense.onGraze && !p.hitIds.has(GRAZE_ID)) {
        p.hitIds.add(GRAZE_ID);
        ev.graze = true;
        defense.onGraze();
      }
      continue;
    }
    const amount = incomingDamage(p.damage, damageTaken);
    if (absorbed(amount, p.kind)) {
      p.alive = false;
      continue;
    }
    if (player.applyHit(amount, p.x + p.w / 2)) {
      ev.playerHurt = true;
      ev.hurtBy = p.source ?? `boss:${p.kind}`;
      p.alive = false;
    }
  }
  for (const e of enemies) {
    if (!e.alive || e.disabledSec > 0 || !overlaps(e.box, player.box)) continue;
    const amount = incomingDamage(e.contactDamage, damageTaken);
    if (absorbed(amount)) continue;
    if (player.applyHit(amount, e.centerX)) {
      ev.playerHurt = true;
      ev.hurtBy = `enemy:${e.data.id}`;
    }
  }
  if (boss && boss.state !== 'dead' && boss.state !== 'waiting' && overlaps(boss.box, player.box)) {
    const amount = incomingDamage(boss.touchDamage, damageTaken);
    if (absorbed(amount)) return;
    if (player.applyHit(amount, boss.centerX)) {
      ev.playerHurt = true;
      ev.hurtBy = 'boss:touch';
    }
  }
}
