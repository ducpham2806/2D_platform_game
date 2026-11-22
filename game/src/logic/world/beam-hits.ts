import type { WeaponsData } from '../../core/weapons-config';
import type { Boss } from '../boss/boss';
import { outgoingDamage } from '../combat/damage';
import type { BeamShot } from '../combat/loadout';
import { overlaps } from '../combat/projectiles';
import type { TrainingTarget } from '../combat/targets';
import type { Enemy } from '../enemy/enemy';
import { laserBox, type LaserPath, type LaserSegment, laserVector } from '../stage/laser-path';
import { type BossDamageObserver, damageBoss, type HitTargets, weaknessOf } from './hits';
import type { WorldEvents } from './world-types';

type Receiver =
  | { kind: 'target'; entity: TrainingTarget }
  | { kind: 'enemy'; entity: Enemy }
  | { kind: 'boss'; entity: Boss };

/** Xét trúng theo thứ tự dọc tia. Kết quả cũng là đường dùng để vẽ và chiếu vào cảm biến. */
export function resolveBeamHits(
  path: LaserPath,
  shot: BeamShot,
  hitTargets: HitTargets,
  weapons: WeaponsData,
  attackMul: number,
  ev: WorldEvents,
  killed: Enemy[],
  observer?: BossDamageObserver,
): { path: LaserPath; hitStop: number; blocked: boolean } {
  const receivers: Receiver[] = [];
  for (const entity of hitTargets.targets)
    if (entity.alive) receivers.push({ kind: 'target', entity });
  for (const entity of hitTargets.enemies)
    if (entity.alive) receivers.push({ kind: 'enemy', entity });
  if (hitTargets.boss) receivers.push({ kind: 'boss', entity: hitTargets.boss });

  const seen = new Set<Receiver>();
  const reached: LaserSegment[] = [];
  const damage = {
    base: shot.damage,
    kindMul: shot.behavior.damageMul,
    attackMul,
    weapon: shot.weapon,
    ...weaknessOf(weapons, shot.weapon),
  };
  const amount = outgoingDamage({ ...damage, targetWeakness: undefined }).amount;
  let hitStop = 0;

  for (const leg of path) {
    const box = laserBox(leg, shot.behavior.widthPx);
    const direction = laserVector(leg);
    const contacts: { receiver: Receiver; distance: number }[] = [];
    for (const receiver of receivers) {
      const b = receiver.entity.box;
      if (seen.has(receiver) || !overlaps(box, b)) continue;
      const edge =
        direction.x > 0 ? b.x : direction.x < 0 ? b.x + b.w : direction.y > 0 ? b.y : b.y + b.h;
      const distance = direction.x
        ? (edge - leg.from.x) * direction.x
        : (edge - leg.from.y) * direction.y;
      contacts.push({ receiver, distance: Math.max(0, distance) });
    }
    contacts.sort((a, b) => a.distance - b.distance);

    for (const { receiver, distance } of contacts) {
      seen.add(receiver);
      const contact = {
        x: leg.from.x,
        w: 0,
        vx: direction.x,
        breaksShield: receiver.kind === 'enemy',
      };
      let blocked = false;
      if (receiver.kind === 'target') {
        blocked = receiver.entity.hit(contact, amount) === 'blocked';
        if (blocked) ev.blocked = true;
        else ev.hitTarget = true;
      } else if (receiver.kind === 'enemy') {
        const result = receiver.entity.takeHit(contact, amount);
        if (result === 'blocked' || result === 'shieldHit' || result === 'shieldBroken') {
          blocked = true;
          ev[result] = true;
        } else {
          ev.hitEnemy = true;
          if (result === 'killed') {
            ev.enemyKilled = true;
            killed.push(receiver.entity);
          }
        }
      } else if (receiver.entity.shifting) ev.bossImmune = true;
      else {
        const hit = outgoingDamage({ ...damage, targetWeakness: receiver.entity.data.weakness });
        if (damageBoss(receiver.entity, hit, shot.weapon, ev, observer) && hit.weak)
          hitStop = weapons.hitStopSteps.weakness;
      }
      if (blocked) {
        if (distance > 0)
          reached.push({
            from: leg.from,
            to: { x: leg.from.x + direction.x * distance, y: leg.from.y + direction.y * distance },
          });
        return { path: reached, hitStop, blocked };
      }
    }
    reached.push(leg);
  }
  return { path: reached, hitStop, blocked: false };
}
