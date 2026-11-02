import type { WeaponsData } from '../../core/weapons-config';
import type { GrayBoss } from '../boss/gray-boss';
import { incomingDamage, outgoingDamage } from '../combat/damage';
import { overlaps, type Projectile, type ProjectilePool } from '../combat/projectiles';
import type { TrainingTarget } from '../combat/targets';
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

/** Boss có id âm để không trùng id bia trong hitIds của đạn. */
const BOSS_ID = -1;

/**
 * Đạn người chơi trúng bia và boss. Trả về số bước hit-stop cần dừng hình
 * (đạn nạp đầy hoặc trúng điểm yếu, GDD 4).
 */
export function resolvePlayerHits(
  pool: ProjectilePool,
  targets: readonly TrainingTarget[],
  boss: GrayBoss | undefined,
  weapons: WeaponsData,
  attackMul: number,
  ev: WorldEvents,
): number {
  let hitStop = 0;
  for (const p of pool.all) {
    if (!p.alive || p.owner !== 'player') continue;
    for (const t of targets) {
      if (!p.alive || !t.alive || p.hitIds.has(t.id) || !overlaps(p, t.box)) continue;
      const hit = outgoingDamage({
        base: p.damage,
        kindMul: p.kindMul,
        attackMul,
        weapon: p.weapon,
        targetWeakness: undefined,
        ...weaknessOf(weapons, p.weapon),
      });
      const result = t.hit(p, hit.amount);
      if (result === 'blocked' || result === 'shieldBroken') {
        p.alive = false;
        if (result === 'blocked') ev.blocked = true;
        else ev.shieldBroken = true;
      } else {
        ev.hitTarget = true;
        consume(p, t.id);
      }
      if (p.kind === 'charged') hitStop = Math.max(hitStop, weapons.hitStopSteps.charged);
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
      if (p.kind === 'charged') hitStop = Math.max(hitStop, weapons.hitStopSteps.charged);
      consume(p, BOSS_ID);
    }
  }
  return hitStop;
}

/** Đạn kẻ địch và thân boss trúng người chơi (đã nhân hệ số độ khó). */
export function resolveEnemyHits(
  pool: ProjectilePool,
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
  if (boss && boss.state !== 'dead' && boss.state !== 'waiting' && overlaps(boss.box, player.box)) {
    if (player.applyHit(incomingDamage(boss.touchDamage, damageTaken), boss.centerX))
      ev.playerHurt = true;
  }
}
