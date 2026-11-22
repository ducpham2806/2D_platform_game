import { describe, expect, it } from 'vitest';
import { FIXED_STEP_HZ, TILE_SIZE } from '@/core/constants';
import { checkEnemyRules, enemiesFor, parseEnemies } from '@/core/enemy-config';
import { parseGameConfig } from '@/core/game-config';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { createEnemy, type Golem } from '@/logic/enemy/behaviors';
import type { EnemyContext } from '@/logic/enemy/enemy';
import type { Box } from '@/logic/player/collision';
import { layoutFromRows } from '@/logic/stage/layout';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);
const t = TILE_SIZE;
const dt = 1 / FIXED_STEP_HZ;
const { rules } = config.enemies;
const floor = 18 * t;
const map = () =>
  layoutFromRows([...Array.from({ length: 18 }, () => `#${'.'.repeat(38)}#`), '#'.repeat(40)], t);

function context(): EnemyContext {
  return { map: map().map, playerX: 168, playerY: floor - 12, pool: new ProjectilePool() };
}

function world(enemy = 'thap_phao_tap_su'): StageWorld {
  const layout = map();
  layout.spawn = { col: 10, row: 17 };
  layout.enemies = [{ col: 13, row: 17, enemy, harmless: true }];
  return new StageWorld({
    layout,
    tileSize: t,
    stepSec: dt,
    player: config.player,
    weapons: config.weapons,
    mechanics: config.stages.mechanics,
    boss: config.bosses.gray!,
    enemies: config.enemies,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    seed: 1,
  });
}

function until(tick: () => void, ready: () => boolean, limit = 600): number {
  let steps = 0;
  while (steps < limit && !ready()) {
    tick();
    steps += 1;
  }
  expect(ready()).toBe(true);
  return steps;
}

describe('QB-21 báo trước của mini-boss', () => {
  it.each(['slam', 'bombs', 'dash'] as const)(
    'từ chối %s ngắn hơn 0,5 s, kể cả khối Thử thách',
    (attack) => {
      const raw = () =>
        structuredClone(data.enemies) as {
          enemies: Record<
            string,
            {
              attack: Record<string, { telegraphSec: number }>;
              challenge: { attack: Record<string, { telegraphSec?: number }> };
            }
          >;
        };
      const base = raw();
      base.enemies.frost_titan!.attack[attack]!.telegraphSec = 0.49;
      expect(checkEnemyRules(parseEnemies(base), 100)).toContain(
        'enemies.frost_titan: telegraph 0.49 s < 0.5 s',
      );
      const challenge = raw();
      const overrides = challenge.enemies.bramble_golem!.challenge.attack;
      overrides[attack] = { ...overrides[attack], telegraphSec: 0.49 };
      expect(checkEnemyRules(parseEnemies(challenge), 100)).toEqual([
        'enemies.bramble_golem.challenge: telegraph 0.49 s < 0.5 s',
      ]);
    },
  );

  it.each([
    ['bramble_golem', false],
    ['bramble_golem', true],
    ['frost_titan', false],
    ['frost_titan', true],
  ] as const)('%s báo đủ khi giậm, ném, lao và giậm nối, Thử thách = %s', (id, challenge) => {
    const variant = enemiesFor(config.enemies, challenge).enemies[id]!;
    function run(phase2: boolean): string[] {
      const ctx = context();
      const mini = createEnemy(1, variant, 210, floor, 1, false, t) as Golem;
      if (phase2) mini.hp /= 2;
      let ticks = 0;
      let beganAt = 0;
      const warnings: string[] = [];
      until(
        () => {
          ticks += 1;
          const before = mini.state;
          mini.step(ctx, dt);
          if (mini.state === before) return;
          if (before.endsWith('Telegraph')) {
            expect((ticks - beganAt) * dt + 1e-9).toBeGreaterThanOrEqual(
              rules.minMiniBossTelegraphSec,
            );
            warnings.push(before);
          }
          if (mini.state.endsWith('Telegraph')) beganAt = ticks;
        },
        () => mini.state === 'recover',
      );
      return warnings;
    }
    expect(run(false)).toEqual(['slamTelegraph']);
    const combo = ['bombTelegraph', 'dashTelegraph'];
    if (id === 'bramble_golem' && challenge) combo.push('slamTelegraph');
    expect(run(true)).toEqual(combo);
  });
});

describe('QB-23 tầm hoạt động và khung camera', () => {
  it.each([
    ['minMiniBossTelegraphSec', 0.4],
    ['activeRangeTilesY', 0],
    ['attackRequiresOnScreen', 'true'],
    ['attackScreenInsetTiles', 6],
  ])('từ chối %s = %j', (key, value) => {
    const raw = structuredClone(data.enemies) as { rules: Record<string, unknown> };
    raw.rules[key as string] = value;
    expect(() => parseEnemies(raw)).toThrow(String(key));
  });

  it('tầm tâm 12 ô ngang, 7 ô dọc, kể cả đúng mép', () => {
    const w = world();
    const e = w.enemies[0]!;
    const place = (dx: number, dy: number) =>
      w.player.respawn(e.centerX + dx, e.centerY + dy + w.player.box.h / 2);
    for (const direction of [-1, 1]) {
      place(12 * t * direction, 7 * t * direction);
      expect(w.field!.isActive(e, w.player)).toBe(true);
      place(12 * t * direction, (7 * t + 1) * direction);
      expect(w.field!.isActive(e, w.player)).toBe(false);
      place((12 * t + 1) * direction, 7 * t * direction);
      expect(w.field!.isActive(e, w.player)).toBe(false);
    }
  });

  it('Drone tuần tra ngoài khung khi còn trong tầm, dừng khi cách Kai hơn 7 ô dọc', () => {
    const w = world('drone_linh');
    const drone = w.enemies[0]!;
    const view = { x: 280, y: 112, w: 320, h: 192 };
    const x = drone.centerX;
    for (let i = 0; i < 30; i += 1) w.step(IDLE_INPUT, view);
    expect(drone.centerX).not.toBe(x);
    expect(drone.telegraphing).toBe(false);
    const stoppedX = drone.centerX;
    drone.box.y = 100;
    for (let i = 0; i < 30; i += 1) w.step(IDLE_INPUT, view);
    expect(drone.centerX).toBe(stoppedX);
    expect(w.pool.count('enemy')).toBe(0);
  });

  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'chừa đúng 1 ô cho cả hộp địch ở mép %s',
    (side) => {
      const w = world();
      const enemy = w.enemies[0]!;
      const b = enemy.box;
      const base = { x: b.x - 50, y: b.y - 50, w: 320, h: 192 };
      const view = {
        ...base,
        ...{
          left: { x: b.x - t },
          right: { x: b.x + b.w + t - base.w },
          top: { y: b.y - t },
          bottom: { y: b.y + b.h + t - base.h },
        }[side],
      };
      const outside = { ...view };
      outside[side === 'left' || side === 'right' ? 'x' : 'y'] +=
        side === 'left' || side === 'top' ? 1 : -1;
      const tick = (box: Box): void => {
        w.field!.step(w.player, w.pool, dt, undefined, box);
      };
      for (let i = 0; i < 180; i += 1) tick(outside);
      expect(w.field!.isActive(enemy, w.player)).toBe(true);
      expect(enemy.telegraphing).toBe(false);
      expect(w.pool.count('enemy')).toBe(0);
      tick(view);
      expect(enemy.telegraphing).toBe(true);
      const duration =
        until(
          () => tick(view),
          () => w.pool.count('enemy') > 0,
        ) * dt;
      expect(duration).toBeCloseTo(0.8);
    },
  );

  it('StageWorld chuyển khung camera và hủy báo gần lúc khai hỏa', () => {
    const w = world();
    const e = w.enemies[0]!;
    const inside = { x: 0, y: floor + t - 192, w: 320, h: 192 };
    const outside = { ...inside, y: inside.y - 1 };
    const tick = (view: Box) => w.step(IDLE_INPUT, view);
    until(
      () => tick(inside),
      () => e.telegraphing,
    );
    for (let i = 0; i < 40; i += 1) tick(inside);
    expect(e.telegraphing).toBe(true);
    for (let i = 0; i < 60; i += 1) tick(outside);
    expect(e.telegraphing).toBe(false);
    expect(w.pool.count('enemy')).toBe(0);
    tick(inside);
    expect(e.telegraphing).toBe(true);
    const steps = until(
      () => tick(inside),
      () => w.pool.count('enemy') > 0,
    );
    expect(steps * dt).toBeCloseTo(0.8);
  });

  it.each(['drone_linh', 'thap_gai', 'buom_sat', 'thap_bang'])(
    '%s hủy nhịp Thử thách còn chờ khi rời khung',
    (id) => {
      const ctx = context();
      const enemy = createEnemy(
        1,
        enemiesFor(config.enemies, true).enemies[id]!,
        212,
        floor - (id === 'drone_linh' || id === 'buom_sat' ? 16 : 0),
        1,
        false,
        t,
      );
      let visible = true;
      ctx.attackAllowed = () => visible;
      const tick = () => enemy.step(ctx, dt);
      until(tick, () => ctx.pool.count('enemy') !== 0);
      const shots = ctx.pool.all.length;
      visible = false;
      for (let i = 0; i < 240; i += 1) tick();
      expect(enemy.telegraphing).toBe(false);
      expect(enemy.aimLines).toHaveLength(0);
      expect(enemy.landingMarks).toHaveLength(0);
      expect(ctx.pool.all).toHaveLength(shots);
      visible = true;
      expect(until(tick, () => ctx.pool.all.length > shots) * dt).toBeGreaterThanOrEqual(
        rules.minTelegraphSec,
      );
    },
  );

  it('Golem phải báo lại đủ sau khi rời khung trước cú giậm', () => {
    const ctx = context();
    let visible = true;
    ctx.attackAllowed = () => visible;
    const mini = createEnemy(
      1,
      config.enemies.enemies.bramble_golem!,
      210,
      floor,
      1,
      false,
      t,
    ) as Golem;
    const tick = () => mini.step(ctx, dt);
    until(tick, () => mini.telegraphing);
    for (let i = 0; i < 36; i += 1) tick();
    visible = false;
    for (let i = 0; i < 90; i += 1) tick();
    expect(mini.state).toBe('walk');
    expect(ctx.pool.all).toHaveLength(0);
    visible = true;
    until(tick, () => mini.telegraphing);
    expect(until(tick, () => ctx.pool.all.length > 0) * dt).toBeCloseTo(0.7);
  });

  it('Golem Thử thách đi hết cú lao đã bắt đầu nhưng bỏ cú giậm nối ngoài khung', () => {
    const ctx = context();
    let visible = true;
    ctx.attackAllowed = () => visible;
    const mini = createEnemy(
      1,
      config.enemies.challenge.bramble_golem!,
      210,
      floor,
      1,
      false,
      t,
    ) as Golem;
    mini.hp /= 2;
    const tick = () => mini.step(ctx, dt);
    until(tick, () => mini.state === 'dash');
    const beforeDash = mini.centerX;
    const bombs = ctx.pool.all.length;
    visible = false;
    until(tick, () => mini.state === 'recover');
    expect(mini.centerX).toBeLessThan(beforeDash);
    expect(mini.telegraphing).toBe(false);
    expect(ctx.pool.all).toHaveLength(bombs);
  });
});
