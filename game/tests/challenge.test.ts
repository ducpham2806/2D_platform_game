import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { checkEnemyRules, type EnemyData, enemiesFor, parseEnemies } from '@/core/enemy-config';
import { checkBossRules } from '@/core/boss-config';
import { bossFor, parseGameConfig } from '@/core/game-config';
import { ProjectilePool, type Projectile } from '@/logic/combat/projectiles';
import { createEnemy, type Golem, type ShieldCharger } from '@/logic/enemy/behaviors';
import type { Enemy, EnemyContext } from '@/logic/enemy/enemy';
import { TileMap } from '@/logic/tilemap';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { STAGE_DEFS } from '@/stages';
import { THORNA_ROOM_ROWS } from '@/stages/thorna-room';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const data = loadData();
const config = parseGameConfig(data);
const base = config.enemies;
const hard = enemiesFor(base, true);

const FLAT = [
  ...Array.from({ length: 10 }, () => `#${'.'.repeat(38)}#`),
  `#${'.'.repeat(38)}#`,
  '#'.repeat(40),
];
const map = (): TileMap => TileMap.fromRows(FLAT, t);

function spawn(d: EnemyData, col: number, row = 10): Enemy {
  const flying = d.behavior === 'drone' || d.behavior === 'butterfly';
  return createEnemy(1, d, (col + 0.5) * t, flying ? (row + 0.5) * t : (row + 1) * t, 1, false, t);
}

/** Chạy kẻ địch `seconds` giây với người chơi đứng yên; trả thời điểm và đạn của từng phát. */
function run(e: Enemy, seconds: number, player: { x: number; y: number }) {
  const m = map();
  const pool = new ProjectilePool();
  const ctx: EnemyContext = { playerX: player.x, playerY: player.y, pool, map: m };
  const times: number[] = [];
  const shots: Projectile[] = [];
  let maxBeats = 1;
  for (let i = 0; i < Math.round(seconds / DT); i += 1) {
    const before = pool.all.length;
    e.step(ctx, DT);
    if (e.telegraphing) maxBeats = Math.max(maxBeats, e.beats);
    for (const p of pool.all.slice(before)) {
      times.push((i + 1) * DT);
      shots.push({ ...p });
    }
    pool.update(DT, m);
  }
  return { times, shots, maxBeats, pool };
}

type RawEnemies = { enemies: Record<string, Record<string, unknown>> };
const raw = (): RawEnemies => structuredClone(data.enemies) as RawEnemies;

describe('bản Thử thách của kẻ địch (GDD 11 mục 2.6, ST-10-04)', () => {
  it('ghép đúng: chỉ khác trường của khối challenge; Thường dùng bản gốc', () => {
    expect(Object.keys(base.challenge).sort()).toEqual(
      ['bramble_golem', 'buom_sat', 'drone_linh', 'linh_ken', 'thap_gai'].sort(),
    );
    expect(enemiesFor(base, false)).toBe(base);
    const drone = hard.enemies.drone_linh!;
    expect(drone.behavior === 'drone' && drone.attack.burst).toEqual({ count: 2, gapSec: 0.25 });
    const baseDrone = base.enemies.drone_linh!;
    expect(baseDrone.behavior === 'drone' && baseDrone.attack.burst).toEqual({
      count: 1,
      gapSec: 0,
    });
    expect(drone.hp).toBe(baseDrone.hp);
    // Tháp Pháo Tập Sự (Prologue) không có bản Thử thách.
    expect(hard.enemies.thap_phao_tap_su).toBe(base.enemies.thap_phao_tap_su);
    expect(checkEnemyRules(base, 100, 1.5)).toEqual([]);
  });

  it('khối challenge hỏng bị từ chối, lỗi chỉ đúng chỗ', () => {
    const cases: [string, (r: RawEnemies) => void][] = [
      [
        'challenge.behavior',
        (r) => ((r.enemies.drone_linh!.challenge as Json).behavior = 'turret'),
      ],
      [
        'challenge.attack.burst.count',
        (r) => ((r.enemies.drone_linh!.challenge as Json).attack = { burst: { count: 1.5 } }),
      ],
    ];
    for (const [msg, edit] of cases) {
      const r = raw();
      edit(r);
      expect(() => parseEnemies(r), msg).toThrow(msg);
    }
    // Báo trước lao nối quá ngắn; cả loạt dài hơn nhịp bắn; chết một đòn ở Thử thách (×1,5).
    const r = raw();
    (r.enemies.linh_ken!.challenge as Json).attack = { chainDashes: 1, chainTelegraphSec: 0.2 };
    (r.enemies.thap_gai!.challenge as Json).attack = { volleys: 2, volleyGapSec: 2 };
    (r.enemies.buom_sat!.challenge as Json).attack = { projectile: { damage: 70 } };
    const errors = checkEnemyRules(parseEnemies(r), 100, 1.5);
    expect(errors.some((e) => e.includes('linh_ken.challenge: telegraph 0.2'))).toBe(true);
    expect(errors.some((e) => e.includes('thap_gai.challenge: telegraph và cả loạt'))).toBe(true);
    expect(errors.some((e) => e.includes('buom_sat.challenge: có đòn gây'))).toBe(true);
    expect(errors.some((e) => e.includes('enemies.buom_sat:'))).toBe(false);
  });

  it('Drone Lính: 2 viên cách 0,25 s, viên 2 nhắm lại; báo trước hiện 2 nhịp', () => {
    const e = spawn(hard.enemies.drone_linh!, 15, 8);
    const r = run(e, 1.2, { x: 12 * t, y: 10.5 * t });
    expect(r.times.length).toBe(2);
    expect(r.times[1]! - r.times[0]!).toBeCloseTo(0.25, 1);
    expect(r.maxBeats).toBe(2);
    const g = run(spawn(base.enemies.drone_linh!, 15, 8), 1.2, { x: 12 * t, y: 10.5 * t });
    expect([g.times.length, g.maxBeats]).toEqual([1, 1]);
  });

  it('Bướm Sắt: thả 2 hạt cách 0,4 s ở hai điểm khác nhau', () => {
    const r = run(spawn(hard.enemies.buom_sat!, 15, 4), 3, { x: 15 * t, y: 10 * t });
    expect(r.times.length).toBe(2);
    expect(r.times[1]! - r.times[0]!).toBeCloseTo(0.4, 1);
    expect(r.shots[0]!.x).not.toBeCloseTo(r.shots[1]!.x, 1);
    expect(r.maxBeats).toBe(2);
  });

  it('Tháp Gai: hai loạt so le (−15°, 0°, +15° rồi −7,5°, +7,5°, +22,5°)', () => {
    const r = run(spawn(hard.enemies.thap_gai!, 20), 3, { x: 10 * t, y: 10 * t });
    expect(r.shots.length).toBe(6);
    expect(r.times[3]! - r.times[0]!).toBeCloseTo(0.35, 1);
    const deg = r.shots.map(
      (p) => Math.round(((Math.atan2(p.vy, -p.vx) * 180) / Math.PI) * 10) / 10,
    );
    expect(deg.slice(0, 3).sort((a, b) => a - b)).toEqual([-15, 0, 15]);
    expect(deg.slice(3).sort((a, b) => a - b)).toEqual([-7.5, 7.5, 22.5]);
  });

  it('Lính Kén: lao, quay lại, báo 0,4 s, lao lần nữa', () => {
    const e = spawn(hard.enemies.linh_ken!, 14) as ShieldCharger;
    e.facing = -1;
    const m = map();
    const ctx: EnemyContext = {
      playerX: 11 * t,
      playerY: 10.5 * t,
      pool: new ProjectilePool(),
      map: m,
    };
    const states: string[] = [];
    for (let i = 0; i < Math.round(3 / DT); i += 1) {
      e.step(ctx, DT);
      if (states[states.length - 1] !== e.state) states.push(e.state);
    }
    expect(states.slice(0, 5)).toEqual(['telegraph', 'dash', 'telegraph', 'dash', 'recover']);
  });

  it('Golem pha 2: bom, lao, rồi giậm ra sóng đất tại chỗ dừng', () => {
    const e = spawn(hard.enemies.bramble_golem!, 20) as Golem;
    e.hp = e.maxHp * 0.4;
    const m = map();
    const pool = new ProjectilePool();
    const ctx: EnemyContext = { playerX: 12 * t, playerY: 10.5 * t, pool, map: m };
    const states: string[] = [];
    let waves = 0;
    for (let i = 0; i < Math.round(6 / DT); i += 1) {
      const before = pool.all.length;
      e.step(ctx, DT);
      if (states[states.length - 1] !== e.state) states.push(e.state);
      if (e.state === 'recover' && states.at(-2) === 'slamTelegraph')
        waves += pool.all.slice(before).filter((p) => p.kind === 'shockwave').length;
      pool.update(DT, m);
    }
    const i = states.indexOf('dash');
    expect(states.slice(i, i + 3)).toEqual(['dash', 'slamTelegraph', 'recover']);
    expect(waves).toBeGreaterThan(0);
  });

  it('Tháp Gai trong màn (cách 10 ô): đứng yên thì trúng; nhảy thấp đúng lúc qua loạt 1, đứng yên cho loạt 2 bay qua đầu', () => {
    const rows = [
      ...Array.from({ length: 10 }, () => `#${'.'.repeat(28)}#`),
      `#..P..............F${'.'.repeat(9)}#`,
      '#'.repeat(30),
    ];
    const challenge = config.difficulties.find((d) => d.id === 'challenge')!;
    const make = () =>
      new StageWorld({
        rows,
        tileSize: t,
        stepSec: DT,
        player: config.player,
        weapons: config.weapons,
        boss: config.bosses.gray!,
        difficulty: challenge,
        seed: 1,
        mechanics: config.stages.mechanics,
        enemies: hard,
        enemyMarkers: STAGE_DEFS.enemies.enemyMarkers,
      });
    /** Một nhịp bắn: nhảy thấp (bấm rồi nhả ngay) `delay` giây sau khi báo trước bắt đầu. */
    const hitsWith = (delay: number | undefined): number => {
      const w = make();
      w.player.box.x = 8 * t + 2;
      const turret = w.enemies[0]!;
      let hits = 0;
      let since = -1;
      for (let i = 0; i < Math.round(4 / DT); i += 1) {
        if (turret.telegraphing && since < 0) since = 0;
        const jump = delay !== undefined && since >= 0 && Math.abs(since - delay) < DT / 2;
        const ev = w.step({ ...IDLE_INPUT, jumpPressed: jump, jumpHeld: jump });
        if (since >= 0) since += DT;
        if (ev.playerHurt) hits += 1;
        if (since > 2.2) break;
      }
      return hits;
    };
    expect(hitsWith(undefined)).toBeGreaterThan(0);
    const delays = Array.from({ length: 40 }, (_, i) => i * 0.05);
    const safe = delays.filter((d) => hitsWith(d) === 0);
    expect(safe.length).toBeGreaterThan(0);
  });
});

type Json = Record<string, unknown>;

describe('Thorna: Rễ Đuổi ở Thử thách (GDD 11 mục 3.3, ST-10-05)', () => {
  const thornaHard = bossFor(config, 'thorna', true)!;
  const challenge = config.difficulties.find((d) => d.id === 'challenge')!;

  it('chỉ bản Thử thách có Rễ Đuổi, ở pha 2 và 3; ngưỡng pha khớp bản gốc', () => {
    expect(bossFor(config, 'thorna', false)).toBe(config.bosses.thorna);
    expect(config.bosses.thorna!.attacks.stalk).toBeUndefined();
    expect(thornaHard.phases.map((p) => p.attacks.includes('stalk'))).toEqual([false, true, true]);
    expect(thornaHard.phases.map((p) => [p.untilHpPct, p.speedMul])).toEqual(
      config.bosses.thorna!.phases.map((p) => [p.untilHpPct, p.speedMul]),
    );
    expect(thornaHard.hp).toBe(config.bosses.thorna!.hp);
    expect(checkBossRules(thornaHard, 100, 1.5)).toEqual([]);
  });

  it('kiểm tra lúc nạp: đánh dấu tới khi trồi dưới 0,5 s sau tăng tốc 1,2 thì báo lỗi; pha lệch bản gốc thì báo lỗi', () => {
    const fast = {
      ...thornaHard,
      attacks: {
        ...thornaHard.attacks,
        stalk: { ...thornaHard.attacks.stalk!, eruptDelaySec: 0.55 },
      },
    };
    expect(checkBossRules(fast, 100).some((e) => e.includes('stalk: đánh dấu tới khi trồi'))).toBe(
      true,
    );
    const r = structuredClone(data) as Record<string, Record<string, Record<string, unknown>>>;
    const ch = r.bosses!.thorna!.challenge as { phases: { untilHpPct: number }[] };
    ch.phases[1]!.untilHpPct = 25;
    expect(() => parseGameConfig(r)).toThrow('challenge.phases: ngưỡng máu và speedMul phải khớp');
  });

  /** Thorna chỉ dùng Rễ Đuổi, tốc độ pha `speed`; Kai vào đấu trường rồi đặt ở (x, đáy). */
  function arena(speed = 1) {
    const boss = {
      ...thornaHard,
      phases: [{ untilHpPct: 0, speedMul: speed, attacks: ['stalk' as const] }],
    };
    const w = new StageWorld({
      rows: THORNA_ROOM_ROWS,
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss,
      difficulty: challenge,
      mechanics: config.stages.mechanics,
      seed: 3,
    });
    w.player.respawn((w.arena!.first + 3) * t, 11 * t);
    w.step(IDLE_INPUT);
    expect(w.phase).toBe('boss');
    return w;
  }

  it('Kai đứng yên trên bục: rễ trồi từ mặt bục và trúng', () => {
    const w = arena();
    w.player.respawn(20.5 * t, 8 * t);
    let hurt = false;
    let rootBottom = -1;
    for (let i = 0; i < Math.round(4 / DT) && !hurt; i += 1) {
      w.player.hp = w.player.maxHp;
      hurt = w.step(IDLE_INPUT).playerHurt;
      const root = w.pool.all.find((p) => p.kind === 'root');
      if (root) rootBottom = root.y + root.h;
    }
    expect(hurt).toBe(true);
    expect(rootBottom).toBe(8 * t);
  });

  it('Kai chạy liên tục: cả 4 rễ trồi sau lưng, không trúng', () => {
    const w = arena();
    w.player.respawn((w.arena!.first + 14) * t, 11 * t);
    // Đứng chờ tới khi Thorna báo trước Rễ Đuổi rồi mới chạy (đúng cách người chơi phản ứng).
    for (let i = 0; i < Math.round(3 / DT) && w.boss!.state !== 'telegraph'; i += 1)
      w.step(IDLE_INPUT);
    expect(w.boss!.attack).toBe('stalk');
    let hurt = 0;
    // Đạn dùng pool (đối tượng được dùng lại): đếm rễ mới trồi theo thời gian còn lại gần đầy.
    const active = thornaHard.attacks.stalk!.activeSec;
    let roots = 0;
    for (let i = 0; i < Math.round(4 / DT); i += 1) {
      const ev = w.step({ ...IDLE_INPUT, moveX: -1 });
      if (ev.playerHurt) hurt += 1;
      roots += w.pool.all.filter((p) => p.kind === 'root' && p.ttl > active - 1.5 * DT).length;
      if (w.boss!.state === 'recover') break;
    }
    expect(roots).toBe(4);
    expect(hurt).toBe(0);
  });

  it('pha 3 (tốc độ 1,2): từ đánh dấu tới khi trồi đúng 0,5 s', () => {
    const w = arena(1.2);
    w.player.respawn((w.arena!.first + 6) * t, 11 * t);
    let markedAt = -1;
    let eruptedAt = -1;
    for (let i = 0; i < Math.round(4 / DT) && eruptedAt < 0; i += 1) {
      w.player.hp = w.player.maxHp;
      w.step(IDLE_INPUT);
      if (markedAt < 0 && w.boss!.stalkMarks.length > 0) markedAt = i;
      if (w.pool.all.some((p) => p.kind === 'root')) eruptedAt = i;
    }
    expect((eruptedAt - markedAt) * DT).toBeCloseTo(0.5, 1);
  });
});
