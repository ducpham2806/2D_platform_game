import { describe, expect, it } from 'vitest';
import { FIXED_STEP_HZ, TILE_SIZE } from '@/core/constants';
import { enemiesFor, parseEnemies, type EnemyData } from '@/core/enemy-config';
import { checkDesignInvariants, parseGameConfig } from '@/core/game-config';
import { enemyProjectile } from '@/logic/boss/enemy-projectile';
import { overlaps, ProjectilePool } from '@/logic/combat/projectiles';
import { createEnemy, type Golem, type ShieldCharger } from '@/logic/enemy/behaviors';
import type { EnemyContext } from '@/logic/enemy/enemy';
import { stageExpTotal } from '@/logic/stage/stage-exp';
import { Tile, TileMap } from '@/logic/tilemap';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { PRISM_FROST_ENEMIES } from '@/stages/prism-frost-enemies';
import { buildStageLayout } from '@/stages/stage-def';
import { loadData } from './helpers';

const game = parseGameConfig(loadData());
const t = TILE_SIZE;
const dt = 1 / FIXED_STEP_HZ;
const floor = 10 * t;
const sample = (name: string, challenge = false): EnemyData =>
  enemiesFor(game.enemies, challenge).enemies[name]!;

function flat(roof = true): TileMap {
  return TileMap.fromRows(
    [
      roof ? '#'.repeat(34) : '.'.repeat(34),
      ...Array.from({ length: 9 }, () => '#'.padEnd(33, '.') + '#'),
      '#'.repeat(34),
    ],
    t,
  );
}

function context(map = flat()): EnemyContext {
  return { map, pool: new ProjectilePool(), playerX: 56, playerY: floor - 12 };
}

function until(tick: () => void, ready: () => boolean): void {
  for (let i = 0; i < 600 && !ready(); i += 1) tick();
  expect(ready()).toBe(true);
}

const ids = ['guong_quang', 'nguoi_tuyet_may', 'thap_bang', 'frost_titan'];

describe('ST-15-06 dữ liệu và phòng thử', () => {
  it('nạp đủ bốn biến thể, đúng thưởng gốc và ngân sách Stage 3', () => {
    expect(checkDesignInvariants(game)).toEqual([]);
    expect(ids.map((id) => sample(id).exp)).toEqual([6, 10, 10, 185]);
    expect(ids.map((id) => sample(id).coreBit)).toEqual([2, 4, 4, 50]);
    expect(ids.map((id) => sample(id, true).behavior)).toEqual([
      'drone',
      'shieldCharger',
      'turret',
      'golem',
    ]);
    const stage = game.stages.stages.find((s) => s.index === 3)!;
    const field = stage.enemies.map((id, i) => ({ exp: sample(id).exp, count: [5, 4, 5, 4][i]! }));
    expect(stageExpTotal(field, stage.enemyRewardMul!.exp, sample(stage.miniBoss).exp, 388)).toBe(
      stage.expBudget,
    );
    const layout = buildStageLayout(PRISM_FROST_ENEMIES, t);
    expect(layout.enemies.map((e) => e.enemy)).toEqual(ids);
    expect(layout.rooms).toHaveLength(1);
  });

  it.each([
    ['guong_quang', ['attack', 'projectile', 'bounces'], 3, 'bounces'],
    ['guong_quang', ['attack', 'projectile', 'bounces'], 0, 'bankShot'],
    ['thap_bang', ['attack', 'lob', 'elevationDeg'], 90, 'elevationDeg'],
    [
      'frost_titan',
      ['challenge', 'attack', 'bombs', 'landShockwave', 'rangeTiles'],
      0,
      'rangeTiles',
    ],
  ] as const)('từ chối cấu hình sai ở %s, %j', (id, path, value, error) => {
    const raw = loadData().enemies as { enemies: Record<string, unknown> };
    let target = raw.enemies[id] as Record<string, unknown>;
    for (const key of path.slice(0, -1)) target = target[key] as Record<string, unknown>;
    target[path.at(-1)!] = value;
    expect(() => parseEnemies(raw)).toThrow(error);
  });
});

describe('Gương Quang', () => {
  it.each([false, true])('dội qua trần và tới Kai khi bị che, Song Tia = %s', (challenge) => {
    const ctx = context();
    for (const row of [7, 8, 9]) ctx.map.set(6, row, Tile.Solid);
    const drone = createEnemy(1, sample('guong_quang', challenge), 152, 108, 1, false, t);
    const tick = () => {
      drone.step(ctx, dt);
      ctx.pool.update(dt, ctx.map);
    };
    tick();
    expect(drone.telegraphing).toBe(true);
    expect(drone.aimLines).toHaveLength(challenge ? 3 : 2);
    expect(drone.aimLines.at(-2)!.to.y).toBe(18);
    expect(drone.aimLines.at(-1)!.to).toEqual({ x: 56, y: 148 });
    expect(drone.beats).toBe(challenge ? 2 : 1);
    until(tick, () => ctx.pool.all.length > 0);
    expect(ctx.pool.all).toHaveLength(challenge ? 2 : 1);
    const shot = ctx.pool.all.find((p) => p.vy < 0)!;
    until(
      () => ctx.pool.update(dt, ctx.map),
      () => shot.bouncesLeft === 0,
    );
    expect(shot.vy).toBeGreaterThan(0);
    const kai = { x: 50, y: 136, w: 12, h: 24 };
    until(
      () => ctx.pool.update(dt, ctx.map),
      () => shot.alive && overlaps(shot, kai),
    );
  });

  it('đạn dội ở ô gương và tiêu hết lượt nảy khi gặp tường tiếp theo', () => {
    const ctx = context();
    ctx.map.set(3, 5, Tile.Solid);
    const p = ctx.pool.spawn({
      ...enemyProjectile(t, 'enemyShot', 84, 84, { w: 6, h: 4 }, 140, 0, 8),
      bouncesLeft: 1,
    });
    const mirror = (col: number, row: number) => col === 6 && row === 5;
    const tick = () => ctx.pool.update(dt, ctx.map, undefined, undefined, undefined, mirror);
    until(tick, () => p.bouncesLeft === 0);
    expect(p.alive).toBe(true);
    expect(p.vx).toBe(-140);
    expect(p.x + p.w).toBeLessThan(6 * t + 1e-6);
    until(tick, () => !p.alive);
  });
});

describe('Người Tuyết Máy', () => {
  it.each([false, true])('không khiên, dừng ở mép, Trượt Dội = %s', (challenge) => {
    const ctx = context();
    ctx.playerX = 146;
    for (let col = 1; col < 8; col += 1) ctx.map.set(col, 10, Tile.Empty);
    const snow = createEnemy(
      1,
      sample('nguoi_tuyet_may', challenge),
      180,
      floor,
      1,
      false,
      t,
    ) as ShieldCharger;
    expect(snow.shieldUp).toBe(false);
    expect(snow.takeHit({ x: 144, w: 5, vx: 100, breaksShield: false }, 1)).toBe('hit');
    let dashes = 0;
    until(
      () => {
        const was = snow.state;
        snow.step(ctx, dt);
        if (was !== 'dash' && snow.state === 'dash') dashes += 1;
        expect(snow.box.x).toBeGreaterThanOrEqual(8 * t);
      },
      () => snow.state === 'recover',
    );
    expect(dashes).toBe(challenge ? 3 : 1);
  });
});

describe('Tháp Băng', () => {
  it('dấu rơi theo vị trí khi hết báo, Thử thách nhắm lại sau 0,4 giây', () => {
    const ctx = context();
    ctx.playerX = 196;
    const turret = createEnemy(1, sample('thap_bang', true), 256, floor, 1, false, t);
    const tick = () => turret.step(ctx, dt);
    until(tick, () => turret.landingMarks.length === 2);
    expect(turret.landingMarks[0]!.x).toBeCloseTo(196, 0);
    ctx.playerX = 180;
    until(tick, () => ctx.pool.all.length === 2);
    const first = [...ctx.pool.all];
    ctx.playerX = 315;
    let followUpSteps = 0;
    until(
      () => {
        tick();
        followUpSteps += 1;
      },
      () => ctx.pool.all.length === 4,
    );
    expect(followUpSteps).toBe(24);
    const all = [...ctx.pool.all];
    expect(first.every((p) => p.vx < 0)).toBe(true);
    expect(all.slice(2).every((p) => p.vx > 0)).toBe(true);
    until(
      () => ctx.pool.update(dt, ctx.map),
      () => all.every((p) => !p.alive),
    );
    for (const [i, target] of [180, 148, 315, 347].entries()) {
      const p = all[i]!;
      expect(p.x + p.w / 2).toBeCloseTo(target, 0);
      expect(p.y + p.h).toBeCloseTo(floor);
    }
  });

  it('Thường chỉ có một loạt, cả hai mảnh trong tầm 9 ô', () => {
    const ctx = context();
    const turret = createEnemy(1, sample('thap_bang'), 256, floor, 1, false, t);
    until(
      () => turret.step(ctx, dt),
      () => ctx.pool.all.length > 0,
    );
    for (let i = 0; i < 35; i += 1) turret.step(ctx, dt);
    expect(ctx.pool.all).toHaveLength(2);
    const shots = [...ctx.pool.all];
    until(
      () => ctx.pool.update(dt, ctx.map),
      () => shots.every((p) => !p.alive),
    );
    expect(shots.every((p) => Math.abs(p.x + p.w / 2 - 256) <= 9 * t + 0.5)).toBe(true);
  });
});

describe('Frost Titan', () => {
  it('hạ Titan mở phòng khóa và trả thưởng gốc Stage 3', () => {
    const w = new StageWorld({
      layout: buildStageLayout(PRISM_FROST_ENEMIES, t),
      tileSize: t,
      stepSec: dt,
      weapons: game.weapons,
      player: game.player,
      mechanics: game.stages.mechanics,
      boss: game.bosses.gray!,
      seed: 1,
      difficulty: game.difficulties.find((d) => d.id === 'normal')!,
      enemies: game.enemies,
      stageReward: { mul: { exp: 3, coreBit: 1.9 }, exempt: ['frost_titan'] },
    });
    const titan = w.enemies.find((e) => e.data.id === 'frost_titan')!;
    w.player.respawn(800, floor);
    w.step(IDLE_INPUT);
    expect(w.lockedRoom).toBeDefined();
    titan.hp = 1;
    w.step({ ...IDLE_INPUT, shootPressed: true });
    until(
      () => w.step(IDLE_INPUT),
      () => !titan.alive,
    );
    expect(w.rooms[0]!.state).toBe('cleared');
    expect(w.exp).toBe(185);
    expect(
      w.field!.pickups.all.reduce((sum, p) => sum + (p.kind === 'coreBit' ? p.value : 0), 0),
    ).toBe(50);
  });

  it.each([false, true])('ba tảng đáp thật, Tảng Vỡ = %s', (challenge) => {
    const ctx = context();
    ctx.playerX = 230;
    const titan = createEnemy(
      1,
      sample('frost_titan', challenge),
      260,
      floor,
      1,
      false,
      t,
    ) as Golem;
    expect(titan.disable(2, 'freeze')).toBe(false);
    expect(titan.phase).toBe(1);
    titan.hp /= 2;
    expect(titan.phase).toBe(2);
    const tick = () => titan.step(ctx, dt);
    until(tick, () => titan.landingMarks.length === 3);
    const marks = titan.landingMarks;
    until(tick, () => ctx.pool.all.length === 3);
    const bombs = [...ctx.pool.all];
    expect(bombs.every((p) => p.kind === 'bomb' && !p.fromRegularEnemy)).toBe(true);
    const waves = new Set<number>();
    until(
      () => {
        ctx.pool.update(dt, ctx.map);
        for (const p of ctx.pool.all) {
          if (p.kind !== 'shockwave') continue;
          expect(p).toMatchObject({ damage: 8, maxDistance: 1.5 * t, source: 'enemy:frost_titan' });
          expect(Math.abs(p.vx)).toBe(5 * t);
          waves.add(p.id);
        }
      },
      () => bombs.every((p) => !p.alive),
    );
    expect(waves.size).toBe(challenge ? 6 : 0);
    bombs.forEach((p, i) => {
      expect(p.y + p.h).toBeCloseTo(floor);
      expect(p.x + p.w / 2).toBeCloseTo(marks[i]!.x);
    });
    until(tick, () => titan.state === 'dash');
    expect(titan.contactDamage).toBe(15);
  });

  it('không tạo sóng ở mặt dưới trần, nhưng đáp lên bục một chiều', () => {
    const ctx = context();
    ctx.map.set(7, 4, Tile.Solid);
    ctx.map.set(7, 7, Tile.OneWay);
    let landed = 0;
    const arc = {
      onLand: () => {
        landed += 1;
      },
    };
    const spawn = (vy: number) =>
      ctx.pool.spawn({
        ...enemyProjectile(t, 'bomb', 116, 90, { w: 8, h: 8 }, 0, vy, 12),
        arc,
        gravity: 320,
      });
    const up = spawn(-180);
    const down = spawn(80);
    until(
      () => ctx.pool.update(dt, ctx.map),
      () => !up.alive && !down.alive,
    );
    expect(landed).toBe(1);
    expect(down.y + down.h).toBeCloseTo(7 * t);
  });
});
