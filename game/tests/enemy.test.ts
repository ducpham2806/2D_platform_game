import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import {
  checkEnemyRules,
  type EnemiesData,
  type EnemyData,
  parseEnemies,
} from '@/core/enemy-config';
import { parseGameConfig } from '@/core/game-config';
import { ProjectilePool, type Projectile } from '@/logic/combat/projectiles';
import { createEnemy, type ShieldCharger } from '@/logic/enemy/behaviors';
import type { Enemy, EnemyContext } from '@/logic/enemy/enemy';
import { TileMap } from '@/logic/tilemap';
import { spawnDistanceViolations } from '@/logic/world/enemy-field';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldInput } from '@/logic/world/world-types';
import { STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const data = loadData();
const config = parseGameConfig(data);
const enemies = config.enemies;

function enemy(id: string): EnemyData {
  const e = enemies.enemies[id];
  if (!e) throw new Error(`thiếu ${id}`);
  return e;
}

/** Sàn phẳng 40 ô, có một gờ cao (cột 30–34) để thử mép vực. */
const FLAT = [
  ...Array.from({ length: 8 }, () => `#${'.'.repeat(38)}#`),
  `#${'.'.repeat(29)}#####${'.'.repeat(4)}#`,
  `#${'.'.repeat(38)}#`,
  `#${'.'.repeat(38)}#`,
  '#'.repeat(40),
];
const map = (): TileMap => TileMap.fromRows(FLAT, t);

/** Tạo kẻ địch giữa ô (col, row) như EnemyField làm. */
function spawn(id: string, col: number, row: number, harmless = false): Enemy {
  const d = enemy(id);
  const flying = d.behavior === 'drone' || d.behavior === 'butterfly';
  return createEnemy(
    1,
    d,
    (col + 0.5) * t,
    flying ? (row + 0.5) * t : (row + 1) * t,
    1,
    harmless,
    t,
  );
}

interface Run {
  /** Giây kể từ lúc bắt đầu chạy tới mỗi lần có đạn mới. */
  shotTimes: number[];
  shots: Projectile[];
  /** Giây báo trước liên tục ngay trước mỗi phát bắn. */
  telegraphBefore: number[];
}

function run(e: Enemy, seconds: number, player: { x: number; y: number }, m = map()): Run {
  const pool = new ProjectilePool();
  const ctx: EnemyContext = { playerX: player.x, playerY: player.y, pool, map: m };
  const out: Run = { shotTimes: [], shots: [], telegraphBefore: [] };
  let telegraph = 0;
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i += 1) {
    const before = pool.all.length;
    e.step(ctx, DT);
    if (pool.all.length > before) {
      out.shotTimes.push((i + 1) * DT);
      out.shots.push(...pool.all.slice(before));
      out.telegraphBefore.push(telegraph);
    }
    telegraph = e.telegraphing ? telegraph + DT : 0;
    pool.update(DT, m);
  }
  return out;
}

describe('dữ liệu kẻ địch (enemies.json)', () => {
  it('đủ kẻ địch của Stage 1 và Prologue, đúng số của đặc tả mục 4', () => {
    for (const id of config.stages.stages[0]!.enemies) expect(enemies.enemies[id]).toBeDefined();
    const drone = enemy('drone_linh');
    expect([drone.hp, drone.contactDamage]).toEqual([3, 8]);
    expect(enemy('thap_phao_tap_su').behavior).toBe('turret');
    const spike = enemy('thap_gai');
    expect(spike.behavior === 'turret' && [spike.attack.count, spike.attack.spreadDeg]).toEqual([
      3, 30,
    ]);
    const ken = enemy('linh_ken');
    expect(ken.behavior === 'shieldCharger' && ken.shieldHits).toBe(2);
    expect(checkEnemyRules(enemies, 100)).toEqual([]);
  });

  it('bắt telegraph quá ngắn, telegraph dài hơn nhịp bắn, đòn chết ngay, hành vi lạ', () => {
    const raw = structuredClone(data.enemies) as {
      enemies: Record<string, Record<string, unknown>>;
    };
    const turret = raw.enemies.thap_phao_tap_su!;
    (turret.attack as Record<string, number>).telegraphSec = 0.2;
    raw.enemies.drone_linh!.contactDamage = 100;
    const bad: EnemiesData = parseEnemies(raw);
    const errors = checkEnemyRules(bad, 100);
    expect(errors.some((e) => e.includes('thap_phao_tap_su') && e.includes('telegraph'))).toBe(
      true,
    );
    expect(errors.some((e) => e.includes('drone_linh') && e.includes('chết ngay'))).toBe(true);

    (turret.attack as Record<string, number>).telegraphSec = 5;
    expect(checkEnemyRules(parseEnemies(raw), 100).some((e) => e.includes('nhịp bắn'))).toBe(true);

    raw.enemies.buom_sat!.behavior = 'teleport';
    expect(() => parseEnemies(raw)).toThrow(/teleport/);
  });

  it('màn có kẻ địch chưa có dữ liệu thì cả cấu hình báo lỗi', () => {
    const files = structuredClone(data) as Record<string, unknown>;
    const stages = files.stages as { stages: Array<{ enemies: string[] }> };
    stages.stages[0]!.enemies.push('ma_cay');
    expect(() => parseGameConfig(files)).toThrow(/ma_cay/);
  });
});

describe('hành vi kẻ địch', () => {
  it('mọi đòn có báo trước ≥ 0,4 giây (đo bằng mô phỏng)', () => {
    for (const id of ['drone_linh', 'drone_linh_prologue', 'thap_phao_tap_su', 'thap_gai']) {
      const r = run(spawn(id, 20, 9), 8, { x: 17 * t, y: 10 * t });
      expect(r.shots.length, id).toBeGreaterThan(1);
      for (const sec of r.telegraphBefore) expect(sec, id).toBeGreaterThanOrEqual(0.4 - 1e-6);
    }
    const r = run(spawn('buom_sat', 20, 4), 8, { x: 20 * t, y: 10 * t });
    expect(r.shots.length).toBeGreaterThan(1);
    for (const sec of r.telegraphBefore) expect(sec).toBeGreaterThanOrEqual(0.5 - 1e-6);
  });

  it('Drone Lính: đi tuần trong phạm vi, người chơi trong 6 ô thì bắn nhắm, hồi 1,5 giây', () => {
    const d = spawn('drone_linh', 20, 5);
    const home = d.box.x;
    const far = run(d, 4, { x: 2 * t, y: 10 * t });
    expect(far.shots).toHaveLength(0);
    expect(Math.abs(d.box.x - home)).toBeLessThanOrEqual(4 * t + 1e-6);

    const near = run(spawn('drone_linh', 20, 5), 6, { x: 16 * t, y: 10 * t });
    const shot = near.shots[0]!;
    // Bay về phía dưới bên trái, nơi người chơi đứng.
    expect(shot.vx).toBeLessThan(0);
    expect(shot.vy).toBeGreaterThan(0);
    expect(shot.damage).toBe(8);
    const gaps = near.shotTimes.slice(1).map((s, i) => s - near.shotTimes[i]!);
    for (const g of gaps) expect(g).toBeGreaterThanOrEqual(1.5 + 0.4 - 1e-6);
  });

  it('Drone vô hại (Prologue nhịp 1–3): đạn và thân không gây mất máu', () => {
    const d = spawn('drone_linh_prologue', 20, 9, true);
    const r = run(d, 4, { x: 17 * t, y: 10 * t });
    expect(r.shots.length).toBeGreaterThan(0);
    for (const s of r.shots) expect(s.damage).toBe(0);
    expect(d.contactDamage).toBe(0);
  });

  it('Tháp Pháo Tập Sự bắn 1 viên mỗi 2 giây; Tháp Gai bắn 3 gai xòe 30°', () => {
    const turret = run(spawn('thap_phao_tap_su', 20, 10), 6.1, { x: 12 * t, y: 10 * t });
    expect(turret.shotTimes.map((s) => Math.round(s * 10) / 10)).toEqual([2, 4, 6]);
    expect(turret.shots[0]!.vx).toBeLessThan(0);
    expect(turret.shots[0]!.vy).toBeCloseTo(0);

    const spike = run(spawn('thap_gai', 20, 10), 2.3, { x: 28 * t, y: 10 * t });
    expect(spike.shots).toHaveLength(3);
    const angles = spike.shots
      .map((s) => Math.round((Math.atan2(s.vy, s.vx) * 180) / Math.PI))
      .sort((a, b) => a - b);
    expect(angles).toEqual([-15, 0, 15]);
  });

  it('Bướm Sắt: nhấp nhô trong biên độ 2 ô, thả hạt nổ rơi nhanh dần', () => {
    const b = spawn('buom_sat', 20, 4);
    const homeY = b.box.y;
    const pool = new ProjectilePool();
    const m = map();
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < Math.round(2.6 / DT); i += 1) {
      b.step({ playerX: 20 * t, playerY: 10 * t, pool, map: m }, DT);
      minY = Math.min(minY, b.box.y);
      maxY = Math.max(maxY, b.box.y);
    }
    expect(maxY - homeY).toBeLessThanOrEqual(2 * t + 1e-6);
    expect(homeY - minY).toBeLessThanOrEqual(2 * t + 1e-6);
    const bomb = pool.all[0]!;
    expect(bomb.kind).toBe('bomb');
    const vy0 = bomb.vy;
    pool.update(0.1, m);
    expect(bomb.vy).toBeGreaterThan(vy0);
  });

  it('Lính Kén: khiên chặn đạn thường phía trước, 2 phát nạp đầy phá khiên, bắn sau lưng thì trúng', () => {
    const k = spawn('linh_ken', 20, 10) as ShieldCharger;
    k.facing = -1;
    const shot = (vx: number, breaksShield = false): Projectile =>
      ({ vx, x: k.box.x, w: 4, breaksShield }) as Projectile;
    expect(k.takeHit(shot(6 * t), 1)).toBe('blocked');
    expect(k.hp).toBe(8);
    expect(k.takeHit(shot(6 * t, true), 3)).toBe('shieldHit');
    expect(k.takeHit(shot(6 * t, true), 3)).toBe('shieldBroken');
    expect(k.takeHit(shot(6 * t), 1)).toBe('hit');
    const k2 = spawn('linh_ken', 20, 10) as ShieldCharger;
    k2.facing = -1;
    expect(
      k2.takeHit({ vx: -6 * t, x: k2.box.x, w: 4, breaksShield: false } as Projectile, 1),
    ).toBe('hit');
  });

  it('Lính Kén: báo trước 0,5 giây rồi lao khoảng 3 ô; người chơi ở sau lưng thì quay lại', () => {
    const k = spawn('linh_ken', 20, 10) as ShieldCharger;
    k.facing = -1;
    const pool = new ProjectilePool();
    const m = map();
    const ctx = { playerX: 16.5 * t, playerY: 10.5 * t, pool, map: m };
    let telegraph = 0;
    while (k.state !== 'dash') {
      k.step(ctx, DT);
      if (k.state === 'telegraph') telegraph += DT;
    }
    expect(telegraph).toBeGreaterThanOrEqual(0.5 - 1e-6);
    const startX = k.box.x;
    while (k.state === 'dash') k.step(ctx, DT);
    expect(startX - k.box.x).toBeGreaterThan(2.5 * t);
    expect(startX - k.box.x).toBeLessThanOrEqual(3.2 * t);

    const k2 = spawn('linh_ken', 20, 10) as ShieldCharger;
    k2.facing = -1;
    const behind = { playerX: 23.5 * t, playerY: 10.5 * t, pool, map: m };
    for (let i = 0; i < Math.round(1 / DT); i += 1) k2.step(behind, DT);
    expect(k2.facing).toBe(1);
  });

  it('kẻ địch đi bộ không bước khỏi mép gờ', () => {
    // Gờ cột 30–34, dòng 8: Lính Kén đứng trên gờ (đáy ở dòng 8).
    const k = spawn('linh_ken', 32, 7) as ShieldCharger;
    run(k, 10, { x: 2 * t, y: 2 * t });
    expect(k.box.x).toBeGreaterThanOrEqual(30 * t);
    expect(k.box.x + k.box.w).toBeLessThanOrEqual(35 * t);
  });
});

const input = (patch: Partial<WorldInput>): WorldInput => ({ ...IDLE_INPUT, ...patch });

function roomWorld(rows: readonly string[], markers = STAGE_DEFS.enemies.enemyMarkers) {
  return new StageWorld({
    rows,
    tileSize: t,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.gray!,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    seed: 3,
    enemies: config.enemies,
    enemyMarkers: markers,
  });
}

describe('kẻ địch trong màn', () => {
  it('mọi màn dựng sẵn: kẻ địch cách điểm xuất phát ≥ 6 ô và có trong enemies.json', () => {
    for (const def of Object.values(STAGE_DEFS)) {
      const m = TileMap.fromRows(def.rows, t);
      expect(spawnDistanceViolations(m, def.enemyMarkers, 6), def.id).toEqual([]);
      for (const p of Object.values(def.enemyMarkers))
        expect(enemies.enemies[p.enemy], p.enemy).toBeDefined();
    }
  });

  it('phát hiện kẻ địch đặt sát điểm xuất phát', () => {
    const m = TileMap.fromRows(['#..P..R..#', '##########'], t);
    expect(spawnDistanceViolations(m, { R: { enemy: 'drone_linh' } }, 6)).toHaveLength(1);
  });

  it('hạ kẻ địch: cộng EXP, rơi Core Bit, đi qua thì nhặt; chết thì kẻ địch dựng lại', () => {
    // Tháp pháo cách 8 ô về bên phải; Kai bắn liên tục.
    const rows = [
      ...Array.from({ length: 10 }, () => `#${'.'.repeat(28)}#`),
      `#..P........U${'.'.repeat(16)}#`,
      '#'.repeat(30),
    ];
    const world = roomWorld(rows);
    const turret = world.enemies[0]!;
    expect(turret.data.id).toBe('thap_phao_tap_su');
    let killed = false;
    for (let i = 0; i < 600 && !killed; i += 1) {
      const press = i % 8 === 0;
      killed = world.step(input({ shootPressed: press, shootHeld: press })).enemyKilled;
    }
    expect(killed).toBe(true);
    expect(world.field!.exp).toBe(6);
    expect(world.field!.pickups.all.filter((p) => p.kind === 'coreBit')).toHaveLength(2);

    let gained = 0;
    for (let i = 0; i < 180; i += 1) gained += world.step(input({ moveX: 1 })).coreBitGained;
    expect(gained).toBe(2);
    expect(world.field!.coreBits).toBe(2);

    world.player.applyHit(1000, world.player.centerX + 1);
    for (let i = 0; i < 120; i += 1) world.step(IDLE_INPUT);
    expect(turret.alive).toBe(true);
    expect(turret.hp).toBe(turret.maxHp);
  });

  it('kẻ địch ngoài tầm hoạt động thì đứng yên, không bắn', () => {
    const rows = [
      ...Array.from({ length: 10 }, () => `#${'.'.repeat(58)}#`),
      `#..P${'.'.repeat(50)}U...#`,
      '#'.repeat(60),
    ];
    const world = roomWorld(rows);
    for (let i = 0; i < 300; i += 1) world.step(IDLE_INPUT);
    expect(world.pool.count('enemy')).toBe(0);
  });

  it('viên hồi máu chỉ rơi khi người chơi chưa đầy máu, nhặt thì hồi (không quá tối đa)', () => {
    const always = structuredClone(config.enemies);
    always.rules.pickups.healChance = 1;
    const rows = [
      ...Array.from({ length: 10 }, () => `#${'.'.repeat(28)}#`),
      `#..P........U${'.'.repeat(16)}#`,
      '#'.repeat(30),
    ];
    const world = new StageWorld({
      rows,
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.gray!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      seed: 3,
      enemies: always,
      enemyMarkers: STAGE_DEFS.enemies.enemyMarkers,
    });
    const field = world.field!;
    field.onKilled([world.enemies[0]!], world.player);
    expect(field.pickups.all.some((p) => p.kind === 'heal')).toBe(false);
    world.player.hp = 50;
    field.pickups.clear();
    field.onKilled([world.enemies[0]!], world.player);
    expect(field.pickups.all.some((p) => p.kind === 'heal')).toBe(true);
    // Đặt viên máu ngay dưới chân Kai.
    for (const p of field.pickups.all) {
      p.x = world.player.box.x;
      p.y = world.player.box.y + 4;
    }
    const ev = world.step(IDLE_INPUT);
    expect(ev.healed).toBe(20);
    expect(world.player.hp).toBe(70);
  });
});
