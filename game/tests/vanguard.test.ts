import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig, type WeaponsData } from '@/core/game-config';
import { Boss } from '@/logic/boss/boss';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { createEnemy, type ShieldCharger } from '@/logic/enemy/behaviors';
import type { Enemy } from '@/logic/enemy/enemy';
import { computeBuild, vanguardOf } from '@/logic/rpg/build';
import { createRng } from '@/logic/rng';
import { TileMap } from '@/logic/tilemap';
import { resolvePlayerHits } from '@/logic/world/hits';
import { noWorldEvents } from '@/logic/world/world-types';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const weapons: WeaponsData = config.weapons;
const vanguard = (ranks: Record<string, number>) =>
  vanguardOf(computeBuild(config.skills, ranks), t);

/** Kẻ địch đứng yên tại tâm (x, y) px. */
function enemyAt(id: string, x: number, y: number, nextId: number): Enemy {
  const d = config.enemies.enemies[id]!;
  return createEnemy(nextId, d, x, y, 1, false, t);
}

/** Một viên đạn nạp đầy (3 phát gốc) ở tâm (x, y). */
function chargedAt(pool: ProjectilePool, x: number, y: number) {
  return pool.spawn({
    owner: 'player',
    kind: 'charged',
    x: x - 8,
    y: y - 6,
    w: 16,
    h: 12,
    vx: 200,
    vy: 0,
    damage: weapons.arcCannon.damage,
    kindMul: weapons.arcCannon.charge.damageMul,
    pierceLeft: 0,
    breaksShield: true,
    weapon: 'Arc Cannon',
    maxDistance: 999,
    ttl: 5,
    attached: false,
  });
}

describe('V2 Đạn Nạp Nổ Lan', () => {
  it('bậc 2: nổ 50% (1,5) trong 1,5 ô; ngoài tầm không nhận; mục tiêu chính chỉ nhận đòn chính', () => {
    const y = 5 * t;
    const main = enemyAt('drone_linh', 10 * t, y, 1);
    const near = enemyAt('drone_linh', 10 * t + 1.2 * t + main.box.w / 2, y, 2);
    const far = enemyAt('drone_linh', 10 * t + 3 * t, y, 3);
    const hp = [main.hp, near.hp, far.hp];
    const pool = new ProjectilePool();
    chargedAt(pool, main.centerX, y);
    const ev = noWorldEvents();
    resolvePlayerHits(
      pool,
      { targets: [], enemies: [main, near, far], boss: undefined },
      weapons,
      1,
      ev,
      [],
      vanguard({ V1: 1, V2: 2 }),
    );
    expect(hp[0]! - main.hp).toBeCloseTo(3, 9);
    expect(hp[1]! - near.hp).toBeCloseTo(1.5, 9);
    expect(far.hp).toBe(hp[2]);
    expect(ev.burst?.r).toBeCloseTo(1.5 * t, 9);
  });

  it('nổ lan trúng Lính Kén đang giơ khiên: mất máu nhưng khiên không vỡ', () => {
    const y = 10 * t;
    const main = enemyAt('drone_linh', 10 * t, y - t, 1);
    const knight = enemyAt('linh_ken', 10 * t + t, y, 2) as ShieldCharger;
    knight.shieldLeft = 2;
    const before = { hp: knight.hp, shield: knight.shieldLeft };
    const pool = new ProjectilePool();
    chargedAt(pool, main.centerX, main.centerY);
    resolvePlayerHits(
      pool,
      { targets: [], enemies: [main, knight], boss: undefined },
      weapons,
      1,
      noWorldEvents(),
      [],
      vanguard({ V1: 1, V2: 2 }),
    );
    expect(before.hp - knight.hp).toBeCloseTo(1.5, 9);
    expect(knight.shieldLeft).toBe(before.shield);
  });

  it('chưa học V2 thì không nổ', () => {
    const y = 5 * t;
    const main = enemyAt('drone_linh', 10 * t, y, 1);
    const near = enemyAt('drone_linh', 11 * t, y, 2);
    const hp = near.hp;
    const pool = new ProjectilePool();
    chargedAt(pool, main.centerX, y);
    const ev = noWorldEvents();
    resolvePlayerHits(
      pool,
      { targets: [], enemies: [main, near], boss: undefined },
      weapons,
      1,
      ev,
      [],
      vanguard({ V1: 1 }),
    );
    expect(near.hp).toBe(hp);
    expect(ev.burst).toBeUndefined();
  });
});

describe('V3 Đòn Trừng Phạt', () => {
  const ARENA = TileMap.fromRows(
    [...Array.from({ length: 11 }, () => `#${'.'.repeat(24)}#`), '#'.repeat(26)],
    t,
  );
  const makeBoss = () => {
    const boss = new Boss(
      config.bosses.thorna!,
      ARENA,
      20 * t,
      11 * t,
      { first: 1, last: 24 },
      createRng(1),
    );
    boss.activate();
    return boss;
  };
  /** Bắn một viên nạp đầy vào tâm boss; trả về máu mất. */
  const hitBoss = (boss: Boss, ranks: Record<string, number>) => {
    const before = boss.hp;
    const pool = new ProjectilePool();
    chargedAt(pool, boss.centerX, boss.box.y + boss.box.h / 2);
    const ev = noWorldEvents();
    resolvePlayerHits(
      pool,
      { targets: [], enemies: [], boss },
      weapons,
      1,
      ev,
      [],
      vanguard(ranks),
    );
    return { dmg: before - boss.hp, punish: ev.punishHit };
  };
  const full = { V1: 1, V2: 2, V3: 3 };

  it('bậc 3: boss ở pha hồi nhận 4,5 (×1,5); lúc nghỉ nhận 3', () => {
    const idle = makeBoss();
    expect(idle.exposed).toBe(false);
    expect(hitBoss(idle, full)).toEqual({ dmg: 3, punish: false });
    const rec = makeBoss();
    // Chạy tới khi boss vào pha hồi sau đòn.
    const pool = new ProjectilePool();
    for (let i = 0; i < 60 * 30 && rec.state !== 'recover'; i += 1)
      rec.step({ playerX: 6 * t, playerY: 10 * t }, pool, DT);
    expect(rec.state).toBe('recover');
    expect(rec.exposed).toBe(true);
    const r = hitBoss(rec, full);
    expect(r.dmg).toBeCloseTo(4.5, 9);
    expect(r.punish).toBe(true);
  });

  it('boss đang choáng cũng tính là hở; chưa học V3 thì không nhân', () => {
    const boss = makeBoss();
    boss.takeHit({ amount: 0, weak: true, stunSec: 0.5 });
    expect(boss.exposed).toBe(true);
    expect(hitBoss(boss, { V1: 1, V2: 2 }).dmg).toBe(3);
  });

  it('Golem (mini-boss) hở ở pha hồi; kẻ địch thường không bao giờ hở', () => {
    const drone = enemyAt('drone_linh', 5 * t, 5 * t, 1);
    expect(drone.exposed).toBe(false);
    const golem = enemyAt('bramble_golem', 10 * t, 11 * t, 2) as Enemy & { state: string };
    golem.state = 'recover';
    expect(golem.exposed).toBe(true);
  });
});
