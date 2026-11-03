import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { checkEnemyRules, parseEnemies } from '@/core/enemy-config';
import { parseGameConfig } from '@/core/game-config';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { createEnemy, Golem } from '@/logic/enemy/behaviors';
import type { EnemyContext } from '@/logic/enemy/enemy';
import { layoutFromRows } from '@/logic/stage/layout';
import { TileMap } from '@/logic/tilemap';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldInput } from '@/logic/world/world-types';
import { GOLEM_ROOM, GOLEM_ROOM_ROWS } from '@/stages/golem-room';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const config = parseGameConfig(loadData());
const data = config.enemies.enemies.bramble_golem!;
if (data.behavior !== 'golem') throw new Error('bramble_golem phải có hành vi golem');

const FLAT = TileMap.fromRows(
  [
    ...Array.from({ length: 9 }, () => `#${'.'.repeat(38)}#`),
    `#${'.'.repeat(38)}#`,
    '#'.repeat(40),
  ],
  t,
);
const FLOOR = 10 * t;

function makeGolem(): Golem {
  const g = createEnemy(1, data, 30.5 * t, FLOOR, 1, false, t);
  if (!(g instanceof Golem)) throw new Error('không phải Golem');
  return g;
}

interface Sim {
  golem: Golem;
  pool: ProjectilePool;
  ctx: EnemyContext;
  states: string[];
}

function sim(playerX = 10 * t): Sim {
  const golem = makeGolem();
  const pool = new ProjectilePool();
  const ctx: EnemyContext = { playerX, playerY: FLOOR - 10, pool, map: FLAT };
  return { golem, pool, ctx, states: [] };
}

function run(s: Sim, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / DT); i += 1) {
    s.golem.step(s.ctx, DT);
    s.pool.update(DT, FLAT);
    if (s.states[s.states.length - 1] !== s.golem.state) s.states.push(s.golem.state);
  }
}

describe('Bramble Golem: dữ liệu theo đặc tả mục 4', () => {
  it('60 máu, 60 EXP, 30 Core Bit, đập 15, hạt nổ 10, telegraph ≥ 0,4 s', () => {
    expect([data.hp, data.exp, data.coreBit]).toEqual([60, 60, 30]);
    expect(data.attack.slam.shockwave.damage).toBe(15);
    expect(data.attack.bombs.projectile.damage).toBe(10);
    expect(data.attack.slam.telegraphSec).toBe(0.7);
    expect(data.attack.bombs.telegraphSec).toBe(0.7);
    expect(data.phase2HpPct).toBe(50);
    expect(checkEnemyRules(config.enemies, 100)).toEqual([]);
  });

  it('Stage 1 có đủ dữ liệu mini-boss', () => {
    const stage = config.stages.stages[0]!;
    expect(config.enemies.enemies[stage.miniBoss]).toBeDefined();
  });

  it('bắt telegraph của Golem quá ngắn', () => {
    const raw = structuredClone(loadData().enemies) as {
      enemies: Record<string, { attack: { dash: { telegraphSec: number } } }>;
    };
    raw.enemies.bramble_golem!.attack.dash.telegraphSec = 0.2;
    const errors = checkEnemyRules(parseEnemies(raw), 100);
    expect(errors.some((e) => e.includes('bramble_golem') && e.includes('telegraph'))).toBe(true);
  });
});

describe('Bramble Golem: hành vi', () => {
  it('pha 1: đi về phía người chơi, báo trước 0,7 s rồi tạo sóng đất hai bên (15 sát thương)', () => {
    const s = sim();
    const x0 = s.golem.centerX;
    run(s, 0.9);
    expect(s.golem.centerX).toBeLessThan(x0);
    let telegraph = 0;
    let waves = 0;
    for (let i = 0; i < 60 * 6 && waves === 0; i += 1) {
      telegraph = s.golem.telegraphing ? telegraph + DT : telegraph;
      s.golem.step(s.ctx, DT);
      waves = s.pool.count('enemy', ['shockwave']);
      s.pool.update(DT, FLAT);
    }
    expect(waves).toBe(2);
    expect(telegraph).toBeGreaterThanOrEqual(0.7 - DT);
    const dirs = s.pool.all.map((p) => Math.sign(p.vx)).sort();
    expect(dirs).toEqual([-1, 1]);
    expect(s.pool.all.every((p) => p.damage === 15)).toBe(true);
    expect(s.golem.phase).toBe(1);
  });

  it('pha 2 (≤ 50% máu): tung 3 hạt nổ rồi báo trước và lao 4 ô', () => {
    const s = sim();
    s.golem.hp = s.golem.maxHp * 0.4;
    expect(s.golem.phase).toBe(2);
    run(s, 8);
    expect(s.states).toContain('bombTelegraph');
    const iBomb = s.states.indexOf('bombTelegraph');
    expect(s.states.slice(iBomb, iBomb + 3)).toEqual(['bombTelegraph', 'dashTelegraph', 'dash']);
    expect(s.states).not.toContain('slamTelegraph');
  });

  it('tung đúng 3 hạt nổ, sát thương 10, rơi xuống chứ không bay thẳng', () => {
    const s = sim();
    s.golem.hp = s.golem.maxHp * 0.4;
    let bombs = 0;
    for (let i = 0; i < 60 * 6 && bombs === 0; i += 1) {
      s.golem.step(s.ctx, DT);
      bombs = s.pool.count('enemy', ['bomb']);
    }
    expect(bombs).toBe(3);
    const list = s.pool.all.filter((p) => p.kind === 'bomb');
    expect(list.every((p) => p.damage === 10 && p.vy < 0 && (p.gravity ?? 0) > 0)).toBe(true);
    expect(new Set(list.map((p) => Math.sign(p.vx)))).toEqual(new Set([-1, 0, 1]));
  });

  it('lao tối đa 4 ô rồi nghỉ', () => {
    const s = sim(2 * t);
    s.golem.hp = s.golem.maxHp * 0.4;
    let startX = 0;
    let endX = 0;
    for (let i = 0; i < 60 * 10 && endX === 0; i += 1) {
      const before = s.golem.state;
      s.golem.step(s.ctx, DT);
      if (before !== 'dash' && s.golem.state === 'dash') startX = s.golem.box.x;
      if (before === 'dash' && s.golem.state === 'recover') endX = s.golem.box.x;
      s.pool.update(DT, FLAT);
    }
    expect(startX - endX).toBeGreaterThan(3.5 * t);
    expect(startX - endX).toBeLessThanOrEqual(4.5 * t);
  });
});

describe('Bramble Golem: phòng khóa trong phòng thử', () => {
  function makeWorld(): StageWorld {
    return new StageWorld({
      layout: layoutFromRows(GOLEM_ROOM_ROWS, t, GOLEM_ROOM.enemyMarkers),
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.gray!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      mechanics: config.stages.mechanics,
      enemies: config.enemies,
      seed: 5,
    });
  }
  const input = (patch: Partial<WorldInput>): WorldInput => ({ ...IDLE_INPUT, ...patch });

  it('vào phòng thì khóa; hạ Golem thì mở cửa, cộng 60 EXP và rơi Core Bit', () => {
    const world = makeWorld();
    expect(world.enemies).toHaveLength(1);
    let locked = false;
    for (let i = 0; i < 60 * 12 && !locked; i += 1)
      locked = world.step(input({ moveX: 1 })).roomLocked;
    expect(locked).toBe(true);
    expect(world.lockedRoom?.remaining).toBe(1);
    const golem = world.enemies[0]!;
    // Đặt thẳng máu thấp rồi bắn trúng.
    world.player.hp = world.player.maxHp;
    golem.hp = 0.5;
    world.player.respawn(golem.centerX - 5 * t, FLOOR + t);
    let cleared = false;
    for (let i = 0; i < 60 * 5 && !cleared; i += 1) {
      world.player.hp = world.player.maxHp;
      const press = i % 8 === 0;
      cleared = world.step(
        input({ shootPressed: press, shootHeld: press, shootReleased: i % 8 === 1 }),
      ).roomCleared;
    }
    expect(cleared).toBe(true);
    expect(world.exp).toBe(60);
    expect(world.rooms[0]!.state).toBe('cleared');
  });
});
