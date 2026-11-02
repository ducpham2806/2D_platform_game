import type { WeaponsData } from '../../core/weapons-config';
import type { GrayBoss } from '../boss/gray-boss';
import { incomingDamage, outgoingDamage } from '../combat/damage';
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

/** Hệ số điểm yếu lấy từ chính vũ khí đang bắn (weapons.json). */
function weaknessOf(
  weapons: WeaponsData,
  weapon: string,
): { weakMul: number; weakStunSec: number } {
  const w = weapons.bossWeapons.find((b) => b.name === weapon);
  return { weakMul: w?.damageVsWeak ?? 1, weakStunSec: w?.weakStunSec ?? 0 };
}

/** Boss có id âm để không trùng id bia/kẻ địch trong hitIds của đạn. */
const BOSS_ID = -1;

/** Những thứ đạn người chơi có thể trúng. Bia và kẻ địch dùng chung dãy id dương. */
export interface HitTargets {
  targets: readonly TrainingTarget[];
  enemies: readonly Enemy[];
  boss: GrayBoss | undefined;
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
): number {
  const { targets, enemies, boss } = hitTargets;
  let hitStop = 0;
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
        p.alive = false;
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
      const result = e.takeHit(p, amountOf(p));
      if (result === 'blocked' || result === 'shieldHit' || result === 'shieldBroken') {
        p.alive = false;
        ev[result] = true;
      } else {
        ev.hitEnemy = true;
        consume(p, e.id);
        if (result === 'killed') {
          ev.enemyKilled = true;
          killed.push(e);
        }
      }
      hitStop = Math.max(hitStop, chargedStop);
    }
    if (!p.alive || !boss || p.hitIds.has(BOSS_ID) || !overlaps(p, boss.box)) continue;
    const hit = outgoingDamage({
      base: p.damage,
      kindMul: p.kindMul,
      attackMul,
      weapon: p.weapon,
      targetWeakness: boss.data.weakness,
      ...weaknessOf(weapons, p.weapon),
    });
    if (boss.takeHit(hit)) {
      ev.hitBoss = true;
      if (hit.weak) {
        ev.weakHit = true;
        hitStop = Math.max(hitStop, weapons.hitStopSteps.weakness);
      }
      hitStop = Math.max(hitStop, chargedStop);
      consume(p, BOSS_ID);
    }
  }
  return hitStop;
}

/**
 * Đạn kẻ địch, thân kẻ địch đang hoạt động và thân boss trúng người chơi (đã nhân hệ số
 * độ khó). Kẻ địch "vô hại" (Prologue nhịp 1–3) gây 0 máu nhưng vẫn đẩy lùi.
 */
export function resolveEnemyHits(
  pool: ProjectilePool,
  enemies: readonly Enemy[],
  boss: GrayBoss | undefined,
  player: PlayerPhysics,
  damageTaken: number,
  ev: WorldEvents,
): void {
  if (player.state === 'dead') return;
  for (const p of pool.all) {
    if (!p.alive || p.owner !== 'enemy' || !overlaps(p, player.box)) continue;
    if (player.applyHit(incomingDamage(p.damage, damageTaken), p.x + p.w / 2)) {
      ev.playerHurt = true;
      p.alive = false;
    }
  }
  for (const e of enemies) {
    if (!e.alive || !overlaps(e.box, player.box)) continue;
    if (player.applyHit(incomingDamage(e.contactDamage, damageTaken), e.centerX))
      ev.playerHurt = true;
  }
  if (boss && boss.state !== 'dead' && boss.state !== 'waiting' && overlaps(boss.box, player.box)) {
    if (player.applyHit(incomingDamage(boss.touchDamage, damageTaken), boss.centerX))
      ev.playerHurt = true;
  }
}
