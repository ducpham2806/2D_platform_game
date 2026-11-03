import { describe, expect, it } from 'vitest';
import { type BossAttackId, checkBossRules, parseBosses } from '@/core/boss-config';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { Boss } from '@/logic/boss/boss';
import { planBloom } from '@/logic/boss/rain';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { createRng } from '@/logic/rng';
import { TileMap } from '@/logic/tilemap';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { StageWorld } from '@/logic/world/stage-world';
import { THORNA_ROOM_ROWS } from '@/stages/thorna-room';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const config = parseGameConfig(loadData());
const data = config.bosses.thorna!;
const ARENA_COLS = 24;
const ARENA = TileMap.fromRows(
  [...Array.from({ length: 11 }, () => `#${'.'.repeat(ARENA_COLS)}#`), '#'.repeat(ARENA_COLS + 2)],
  t,
);
const FLOOR = 11 * t;
const PLAYER = { playerX: 6 * t, playerY: FLOOR - 12 };

function makeBoss(seed = 1): { boss: Boss; pool: ProjectilePool } {
  const boss = new Boss(
    data,
    ARENA,
    20 * t,
    FLOOR,
    { first: 1, last: ARENA_COLS },
    createRng(seed),
  );
  return { boss, pool: new ProjectilePool() };
}

function runUntil(boss: Boss, pool: ProjectilePool, attack: BossAttackId, ctx = PLAYER): void {
  for (let i = 0; i < 60 * 60; i += 1) {
    const ev = boss.step(ctx, pool, DT);
    pool.update(DT, ARENA);
    if (ev.attackStarted === attack) return;
  }
  throw new Error(`không thấy đòn ${attack}`);
}

/** Chạy tới hết telegraph (đòn vừa ra) mà không cập nhật đạn, để đếm đạn vừa tạo. */
function finishTelegraph(boss: Boss, pool: ProjectilePool, ctx = PLAYER): void {
  while (boss.state === 'telegraph') boss.step(ctx, pool, DT);
}

describe('Thorna: dữ liệu theo đặc tả mục 5', () => {
  it('HP 100, 3 pha tại 60% và 30%, tốc độ +20% ở pha cuối', () => {
    expect(data.hp).toBe(100);
    expect(data.phases.map((p) => p.untilHpPct)).toEqual([60, 30, 0]);
    expect(data.phases.map((p) => p.speedMul)).toEqual([1, 1, 1.2]);
  });

  it('pha 1 có Gai Quạt và Dây Quất; pha 2 thêm Rễ Trồi; pha 3 thêm Hoa Nở', () => {
    const sets = data.phases.map((p) => new Set(p.attacks));
    expect([...(sets[0] ?? [])].sort()).toEqual(['lash', 'thorns']);
    expect([...(sets[1] ?? [])].sort()).toEqual(['lash', 'roots', 'thorns']);
    expect([...(sets[2] ?? [])].sort()).toEqual(['bloom', 'lash', 'roots', 'thorns']);
  });

  it('điểm yếu Ember Burst, thưởng Vine Lash + 120 EXP + 80 Core Bit', () => {
    expect(data.weakness).toBe('Ember Burst');
    expect(data.reward).toBe('Vine Lash');
    expect(data.rewardExp).toBe(120);
    expect(data.rewardCoreBit).toBe(80);
  });

  it('không đòn nào quá 18 sát thương, telegraph ≥ 0,5 s kể cả sau tăng tốc', () => {
    expect(checkBossRules(data, 100)).toEqual([]);
    const damages = Object.values(data.attacks).map((a) => a.damage);
    expect(Math.max(...damages, data.contactDamage)).toBeLessThanOrEqual(18);
  });

  it('thưởng và điểm yếu của boss phải khớp màn (stages.json)', () => {
    const files = structuredClone(loadData()) as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    files.bosses!.thorna!.reward = 'Prism Beam';
    expect(() => parseGameConfig(files)).toThrow(/thorna\.reward/);
  });

  it('thiếu dữ liệu của đòn có trong danh sách pha thì báo lỗi', () => {
    const raw = structuredClone(loadData().bosses) as Record<string, Record<string, unknown>>;
    delete (raw.thorna!.attacks as Record<string, unknown>).bloom;
    expect(() => parseBosses(raw)).toThrow(/bloom/);
  });
});

describe('Thorna: từng đòn', () => {
  it('Gai Quạt: 5 gai xòe 60° quanh hướng ngang, ngang tầm người, sát thương 12', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    runUntil(boss, pool, 'thorns');
    finishTelegraph(boss, pool);
    boss.step(PLAYER, pool, DT);
    const thorns = pool.all.filter((p) => p.kind === 'enemyShot');
    expect(thorns).toHaveLength(5);
    const angles = thorns
      .map((p) => (Math.atan2(p.vy, -p.vx) * 180) / Math.PI)
      .sort((a, b) => a - b);
    expect(angles[0]).toBeCloseTo(-30, 0);
    expect(angles[4]).toBeCloseTo(30, 0);
    expect(thorns.every((p) => p.vx < 0 && p.damage === 12)).toBe(true);
    const lane = thorns[0]!.y + thorns[0]!.h / 2;
    expect(lane).toBeGreaterThanOrEqual(boss.box.y);
    expect(lane).toBeLessThanOrEqual(boss.box.y + boss.box.h);
  });

  it('Dây Quất: hộp ngang sát mặt đất dài 6 ô về phía người chơi, sát thương 15, tồn tại ngắn', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    runUntil(boss, pool, 'thorns');
    runUntil(boss, pool, 'lash');
    finishTelegraph(boss, pool);
    boss.step(PLAYER, pool, DT);
    const lash = pool.all.find((p) => p.kind === 'lash')!;
    expect(lash.w).toBe(6 * t);
    expect(lash.x + lash.w).toBeCloseTo(boss.box.x);
    expect(lash.y + lash.h).toBeCloseTo(FLOOR);
    expect(lash.damage).toBe(15);
    for (let i = 0; i < 40; i += 1) pool.update(DT, ARENA);
    expect(pool.count('enemy', ['lash'])).toBe(0);
  });

  it('Dây Quất bị cắt ngắn khi sát tường, không nằm trong ô đặc', () => {
    const { boss, pool } = makeBoss();
    boss.box.x = 2 * t;
    boss.activate();
    runUntil(boss, pool, 'thorns');
    runUntil(boss, pool, 'lash');
    finishTelegraph(boss, pool);
    boss.step(PLAYER, pool, DT);
    const lash = pool.all.find((p) => p.kind === 'lash');
    expect(lash).toBeDefined();
    expect(lash!.x).toBeGreaterThanOrEqual(t);
  });

  it('Rễ Trồi: 3 cột rễ mọc lần lượt từ trái sang phải, có vết nứt báo trước, sát thương 15', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    boss.hp = 50;
    runUntil(boss, pool, 'roots');
    expect(boss.rootXs).toHaveLength(3);
    expect(boss.rootXs[0]!).toBeLessThan(boss.rootXs[1]!);
    expect(boss.rootXs[1]!).toBeLessThan(boss.rootXs[2]!);
    finishTelegraph(boss, pool);
    const order: number[] = [];
    for (let i = 0; i < 120; i += 1) {
      boss.step(PLAYER, pool, DT);
      for (const p of pool.all) {
        if (p.kind === 'root' && !order.includes(p.x)) {
          order.push(p.x);
          expect(p.damage).toBe(15);
          expect(p.y + p.h).toBeCloseTo(FLOOR);
        }
      }
      pool.update(DT, ARENA);
    }
    expect(order).toHaveLength(3);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('Hoa Nở (pha 3): 12 hạt rơi chừa 3 khe an toàn, rồi Thorna choáng 2 giây', () => {
    const { boss, pool } = makeBoss();
    boss.hp = 20;
    boss.activate();
    runUntil(boss, pool, 'bloom');
    const cols = [...boss.rainCols];
    expect(cols).toHaveLength(12);
    finishTelegraph(boss, pool);
    expect(pool.count('enemy', ['seed'])).toBe(12);
    expect(pool.all.filter((p) => p.kind === 'seed').every((p) => p.damage === 18)).toBe(true);
    let stunned = 0;
    for (let i = 0; i < 60 * 6; i += 1) {
      boss.step(PLAYER, pool, DT);
      if (boss.state === 'stunned') stunned += 1;
    }
    expect(stunned * DT).toBeCloseTo(2, 1);
  });

  it('đi chậm về phía người chơi khi nghỉ, dừng ở khoảng giữ cách', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    const startX = boss.centerX;
    for (let i = 0; i < 30; i += 1) boss.step(PLAYER, pool, DT);
    expect(boss.centerX).toBeLessThan(startX);
    expect(startX - boss.centerX).toBeLessThan(2 * t);
  });
});

describe('Hoa Nở luôn có khe né', () => {
  it('500 hạt giống: 12 hạt, ≥ 3 khe rộng 2 ô không có hạt nào', () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const { dropCols, gapStarts } = planBloom(1, 24, 3, 2, 12, createRng(seed));
      expect(dropCols).toHaveLength(12);
      expect(gapStarts).toHaveLength(3);
      for (const g of gapStarts) {
        expect(dropCols).not.toContain(g);
        expect(dropCols).not.toContain(g + 1);
      }
    }
  });

  it('khi cột ít hơn số hạt thì rơi hết các cột không thuộc khe', () => {
    const { dropCols } = planBloom(1, 10, 2, 2, 12, createRng(3));
    expect(dropCols).toHaveLength(6);
  });
});

describe('Thorna: trong thế giới màn chơi', () => {
  function makeWorld(): StageWorld {
    return new StageWorld({
      rows: THORNA_ROOM_ROWS,
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: data,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      mechanics: config.stages.mechanics,
      seed: 7,
    });
  }

  it('phòng thử có boss ở bên phải, đấu trường 24 ô, 3 bục cao 3 ô', () => {
    const world = makeWorld();
    expect(world.arena!.last - world.arena!.first + 1).toBe(24);
    expect(world.boss!.centerX).toBeGreaterThan(world.map.widthPx / 2);
    let platforms = 0;
    for (let c = world.arena!.first; c <= world.arena!.last; c += 1)
      if (world.map.isOneWay(c, 8) && !world.map.isOneWay(c - 1, 8)) platforms += 1;
    expect(platforms).toBe(3);
  });

  it('chỉ bằng Arc Cannon hạ được Thorna; lần đầu nhận Vine Lash, 120 EXP, 80 Core Bit', () => {
    const world = makeWorld();
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    expect(world.phase).toBe('boss');
    let granted: string | undefined;
    let defeated = false;
    for (let i = 0; i < 60 * 180 && !defeated; i += 1) {
      world.player.hp = world.player.maxHp;
      const dir = world.boss!.centerX > world.player.centerX ? 1 : -1;
      const press = i % 8 === 0;
      const ev = world.step({
        ...IDLE_INPUT,
        moveX: i % 30 === 0 ? dir : 0,
        shootPressed: press,
        shootHeld: press,
        shootReleased: i % 8 === 1,
      });
      defeated = ev.bossDefeated;
      if (ev.weaponGranted) granted = ev.weaponGranted;
    }
    expect(defeated).toBe(true);
    expect(granted).toBe('Vine Lash');
    expect(world.exp).toBe(120);
    expect(world.coreBits).toBe(80);
  });
});
