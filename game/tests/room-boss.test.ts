import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { enemyProjectile } from '@/logic/boss/enemy-projectile';
import type { ProjectileSpec } from '@/logic/combat/projectiles';
import { buildHud } from '@/logic/hud/hud-model';
import { layoutFromTiled } from '@/logic/stage/tiled';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldEvents } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import map from '../maps/mini-boss-test.json';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const t = TILE_SIZE;
const dt = FIXED_STEP_MS / 1000;
const floor = 11 * t;

function world(difficultyId = 'normal') {
  const difficulty = config.difficulties.find((d) => d.id === difficultyId)!;
  return new StageWorld({
    layout: buildStageLayout(STAGE_DEFS.miniBossRoom, t),
    tileSize: t,
    stepSec: dt,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.gray!,
    roomBossData: difficulty.newAttackPatterns
      ? { ...config.bosses, ...config.bossesChallenge }
      : config.bosses,
    difficulty,
    seed: 9,
    enemies: config.enemies,
    mechanics: config.stages.mechanics,
    stageReward: { mul: { exp: 4, coreBit: 4 }, exempt: [] },
  });
}

function enter(w: StageWorld, index: number) {
  const room = w.rooms[index]!;
  w.player.respawn((room.spawn.first + 3.5) * t, floor);
  expect(w.step(IDLE_INPUT).roomLocked).toBe(true);
  return room.miniBoss!.boss;
}

function tick(w: StageWorld, n: number) {
  for (let i = 0; i < n; i += 1) w.step(IDLE_INPUT);
}

function until(w: StageWorld, done: (ev: WorldEvents) => boolean, steps = 600) {
  for (let i = 1; i <= steps; i += 1) {
    if (done(w.step(IDLE_INPUT))) return i;
  }
  throw new Error(`Không đạt sau ${steps} bước`);
}

function shot(w: StageWorld, x: number, y: number, patch: Partial<ProjectileSpec> = {}) {
  return w.pool.spawn({
    owner: 'player',
    kind: 'shot',
    x: x - 2,
    y: y - 2,
    w: 4,
    h: 4,
    vx: 0,
    vy: 0,
    damage: 3,
    weapon: 'Arc Cannon',
    kindMul: 1,
    pierceLeft: 0,
    breaksShield: false,
    maxDistance: 200,
    ttl: 1,
    attached: false,
    ...patch,
  });
}

describe('dữ liệu và phòng khóa (Q1, QB-21, QB-24, QB-31)', () => {
  it('nạp đủ hai pha, thưởng gốc, hệ số máu và biến thể Thử thách', () => {
    for (const [index, id, hp, exp, bits] of [
      [0, 'prism_sentinel', 70, 110, 40],
      [1, 'gale_roc', 90, 270, 60],
    ] as const) {
      const data = config.bosses[id]!;
      expect([data.hp, data.rewardExp, data.rewardCoreBit]).toEqual([hp, exp, bits]);
      expect(data.phases.map((p) => p.untilHpPct)).toEqual([50, 0]);
      expect(world('story').rooms[index]!.miniBoss!.boss.hp).toBeCloseTo(hp * 0.8);
      expect(world('challenge').rooms[index]!.miniBoss!.boss.hp).toBeCloseTo(hp * 1.25);
    }
    expect(config.bossesChallenge.prism_sentinel!.attacks.beam!.pulseGapSec).toBe(0.4);
    expect(config.bossesChallenge.gale_roc!.attacks.dive!.shockwave!.damage).toBe(10);
  });

  it('từ chối báo đòn nối < 0,5 s và mini-boss thiếu sàn đặc', () => {
    const broken = loadData();
    const bosses = broken.bosses as {
      gale_roc: { attacks: { dive: { followUpTelegraphSec: number } } };
    };
    bosses.gale_roc.attacks.dive.followUpTelegraphSec = 0.49;
    expect(() => parseGameConfig(broken)).toThrow('dive.followUpTelegraphSec');
    const bad = structuredClone(map);
    bad.layers[0]!.data![11 * 49 + 33] = 0;
    expect(() => layoutFromTiled(bad, t)).toThrow('sàn đặc');
  });

  it('vào phòng mới kích hoạt; chết trước khi hạ thì dựng lại, đã hạ thì giữ cửa và không trả lần nữa', () => {
    const w = world();
    const r = w.rooms[0]!;
    const waiting = r.miniBoss!.boss;
    const stone = r.spawn.doors.at(-1)!;
    tick(w, 100);
    expect(waiting.state).toBe('waiting');
    expect(w.map.isSolid(stone.col, stone.row)).toBe(false);
    const active = enter(w, 0);
    expect(buildHud(w).boss?.name).toBe('Prism Sentinel');
    expect(w.map.isSolid(stone.col, stone.row)).toBe(true);
    expect(r.remaining).toBe(1);
    active.hp = 10;
    w.player.applyHit(999, w.player.centerX - t);
    until(w, (ev) => ev.respawned);
    expect(r.state).toBe('open');
    expect(r.miniBoss!.boss).not.toBe(active);
    expect(r.miniBoss!.boss.hp).toBe(70);
    const retry = enter(w, 0);
    retry.hp = 30;
    w.step(IDLE_INPUT);
    shot(w, retry.centerX, retry.box.y + 10, { damage: 100 });
    const defeat = w.step(IDLE_INPUT);
    expect(defeat).toMatchObject({ enemyKilled: true, roomCleared: true, bossDefeated: false });
    expect(w.phase).toBe('explore');
    expect(w.exp).toBe(110);
    expect(
      w.field!.pickups.all.filter((p) => p.kind === 'coreBit').reduce((n, p) => n + p.value, 0),
    ).toBe(40);
    expect(buildHud(w).boss).toBeUndefined();
    w.player.applyHit(999, w.player.centerX - t);
    until(w, (ev) => ev.respawned);
    expect(r.miniBoss!.boss).toBe(retry);
    expect(r.state).toBe('cleared');
    expect(w.map.isSolid(stone.col, stone.row)).toBe(false);
    expect(w.exp).toBe(110);
    expect(w.loadout.slots).toHaveLength(1);
  });

  it('Frost Shard gây sát thương nhưng không vô hiệu, kẹp pha chỉ xóa đạn của mini-boss', () => {
    const w = world();
    const boss = enter(w, 0);
    shot(w, boss.centerX, boss.box.y + 10, { kind: 'shard', weapon: 'Frost Shard', freezeSec: 2 });
    expect(w.step(IDLE_INPUT)).toMatchObject({ hitBoss: true, enemyFrozen: false });
    expect(boss.hp).toBe(67);
    expect(boss.stunned).toBe(false);
    const hostile = enemyProjectile(t, 'enemyShot', t * 8, t * 2, { w: 4, h: 4 }, 0, 0, 15);
    const own = w.pool.spawn({ ...hostile, source: boss.source! });
    const other = w.pool.spawn({ ...hostile, source: 'enemy:drone_linh' });
    shot(w, boss.centerX, boss.box.y + 10, { damage: 100 });
    w.step(IDLE_INPUT);
    expect(boss.hp).toBeCloseTo(35);
    expect(boss.shifting).toBe(true);
    expect(w.pool.all).not.toContain(own);
    expect(w.pool.all).toContain(other);
  });

  it('hạ mini-boss kịp xóa đạn của nó trước sát thương chí mạng cùng bước (QB-30)', () => {
    const w = world();
    const boss = enter(w, 0);
    boss.hp = 1;
    w.step(IDLE_INPUT);
    const pl = w.player;
    w.pool.spawn({
      ...enemyProjectile(t, 'enemyShot', pl.box.x + 2, pl.box.y + 2, { w: 4, h: 4 }, 0, 0, 999),
      source: boss.source!,
    });
    shot(w, boss.centerX, boss.box.y + 10);
    expect(w.step(IDLE_INPUT)).toMatchObject({ roomCleared: true, playerDied: false });
    expect(pl.hp).toBe(pl.maxHp);
  });
});

describe('Prism Sentinel (GDD 16 mục 3.5, QB-23)', () => {
  it('chỉ báo Tán Sắc khi ở trong khung, hủy khi ra và báo lại đủ 0,7 s', () => {
    const w = world();
    const boss = enter(w, 0);
    const out = { x: boss.box.x + 2, y: 0, w: 20 * t, h: 12 * t };
    const inRoom = { x: 5 * t, y: 0, w: 20 * t, h: 12 * t };
    for (let i = 0; i < 80; i += 1) w.step(IDLE_INPUT, out);
    expect(boss.state).toBe('idle');
    w.step(IDLE_INPUT, inRoom);
    expect(boss.state).toBe('telegraph');
    for (let i = 0; i < 18; i += 1) w.step(IDLE_INPUT, inRoom);
    w.step(IDLE_INPUT, out);
    expect(boss.state).toBe('idle');
    w.step(IDLE_INPUT, inRoom);
    for (let i = 0; i < 41; i += 1) w.step(IDLE_INPUT, inRoom);
    expect(w.pool.count('enemy')).toBe(0);
    w.step(IDLE_INPUT, inRoom);
    const fan = w.pool.all.filter((p) => p.source === boss.source);
    expect(fan).toHaveLength(3);
    expect(Math.hypot(fan[0]!.vx, fan[0]!.vy)).toBeCloseTo(7 * t);
    expect(fan.every((p) => !p.fromRegularEnemy)).toBe(true);
    until(w, () => boss.attack === 'charge' && boss.state === 'telegraph');
    const x = boss.centerX;
    const facing = boss.facing;
    tick(w, 10);
    expect((boss.centerX - x) * facing).toBeLessThan(0);
    until(w, () => boss.state === 'active');
    expect(boss.touchDamage).toBe(15);
  });

  it('gương xoay bằng đạn nạp vừa đổi vạch và làm tia dội trừ 10, choáng 1,5 s', () => {
    const w = world();
    const boss = enter(w, 0);
    boss.hp = 35;
    until(w, () => boss.beam.warnings.length === 1);
    const before = boss.beam.warnings[0]!.path;
    const emissionX = before[0]!.from.x;
    const mirror = w.optics!.mirrors.find((m) => m.center.x === emissionX)!;
    shot(w, mirror.center.x, mirror.center.y, { kind: 'mid' });
    expect(w.step(IDLE_INPUT).mirrorToggled).toBe(true);
    const after = boss.beam.warnings[0]!.path;
    expect(after).not.toEqual(before);
    expect(after).toHaveLength(2);
    until(w, (ev) => ev.bossReflected);
    expect(boss.beam.pulses[0]!.path).toEqual(after);
    expect(boss.hp).toBe(25);
    expect(boss.stunned).toBe(true);
    tick(w, 89);
    expect(boss.stunned).toBe(true);
    tick(w, 2);
    expect(boss.stunned).toBe(false);
    expect(boss.hp).toBe(25);
  });

  it('Tia Kép báo hai đường, xung sau dùng góc đối diện và cách 0,4 s', () => {
    const w = world('challenge');
    const boss = enter(w, 0);
    boss.hp = boss.data.hp / 2;
    until(w, () => boss.beam.warnings.length === 2);
    const lines = boss.beam.warnings.map((a) => a.path);
    expect(lines[0]).not.toEqual(lines[1]);
    until(w, () => boss.beam.pulses.length === 1);
    expect(boss.beam.pulses[0]!.path).toEqual(lines[0]);
    tick(w, 23);
    expect(boss.beam.pulses.length).toBe(1);
    tick(w, 1);
    expect(boss.beam.pulses.length).toBe(2);
    expect(boss.beam.pulses[1]!.path).toEqual(lines[1]);
    expect(boss.hp).toBe(boss.data.hp / 2);
  });

  it('Tia Kép đổi chỗ hai vạch khi xoay, rời khung giữ xung đã bắn và hủy xung chờ', () => {
    const w = world('challenge');
    const boss = enter(w, 0);
    boss.hp = boss.data.hp / 2;
    until(w, () => boss.beam.warnings.length === 2);
    const lines = boss.beam.warnings.map((a) => a.path);
    const mirror = w.optics!.mirrors.find((m) => m.center.x === lines[0]![0]!.from.x)!;
    shot(w, mirror.center.x, mirror.center.y, { kind: 'mid' });
    w.step(IDLE_INPUT);
    expect(boss.beam.warnings.map((a) => a.path)).toEqual([lines[1], lines[0]]);
    // Xoay lại trước khi khai hỏa, giữ xung đầu theo đường đi ra xa Sentinel.
    tick(w, 16);
    shot(w, mirror.center.x, mirror.center.y, { kind: 'mid' });
    w.step(IDLE_INPUT);
    until(w, () => boss.beam.pulses.length === 1);
    expect(boss.beam.pulses[0]!.path).toEqual(lines[0]);
    const view = { x: boss.box.x, y: 0, w: 20 * t, h: 12 * t };
    for (let i = 0; i < 24; i += 1) w.step(IDLE_INPUT, view);
    expect(boss.beam.pulses).toHaveLength(1);
    expect(boss.beam.warnings).toHaveLength(0);
  });

  it('mỗi xung trúng Kai nhiều nhất một lần và tắt đúng thời lượng', () => {
    const w = world();
    const boss = enter(w, 0);
    boss.hp = 35;
    until(w, () => boss.beam.pulses.length === 1);
    const pulse = boss.beam.pulses[0]!;
    const x = pulse.path[0]!.from.x;
    const targetY = 5 * t;
    w.player.respawn(x, targetY);
    expect(w.step(IDLE_INPUT)).toMatchObject({ playerHurt: true, hurtBy: boss.source });
    expect(w.player.hp).toBe(85);
    w.player.respawn(x, targetY, 85);
    expect(w.step(IDLE_INPUT).playerHurt).toBe(false);
    expect(w.player.hp).toBe(85);
    tick(w, 28);
    expect(boss.beam.pulses).toHaveLength(0);
  });
});

describe('Gale Roc (GDD 16 mục 5.5)', () => {
  it('Bổ Nhào khóa vạch, xuyên bệ một chiều rồi hở đúng 1 s trên sàn', () => {
    const w = world();
    const boss = enter(w, 1);
    const n = until(w, () => boss.attack === 'dive' && boss.state === 'telegraph');
    expect(n).toBeGreaterThan(0);
    const plan = boss.diveLine!;
    w.player.respawn(43 * t, floor);
    tick(w, 41);
    expect(boss.state).toBe('telegraph');
    expect(boss.diveLine).toEqual(plan);
    w.step(IDLE_INPUT);
    expect(boss.state).toBe('active');
    expect(boss.touchDamage).toBe(15);
    until(w, (ev) => ev.bossLanded);
    expect(boss.box.y + boss.box.h).toBeCloseTo(floor);
    expect(boss.centerX).toBeCloseTo(plan.to.x, -1);
    expect(boss.exposed).toBe(true);
    tick(w, 59);
    expect(boss.exposed).toBe(true);
    tick(w, 1);
    expect(boss.exposed).toBe(false);
  });

  it('Vỗ Cánh mở gió 1,2 s và bắn 3 lông, dữ liệu lực đẩy chờ nối WindZone', () => {
    const w = world();
    const boss = enter(w, 1);
    until(w, () => boss.gust !== undefined);
    expect(boss.gust).toMatchObject({ pushTilesPerSec: 4, remainingSec: 1.2 });
    expect(
      w.pool.all.filter((p) => p.kind === 'enemyShot' && p.source === boss.source),
    ).toHaveLength(3);
    tick(w, 71);
    expect(boss.gust).toBeDefined();
    tick(w, 1);
    expect(boss.gust).toBeUndefined();
  });

  it('Thử thách có mưa 8 lông, đủ hai khe và sau đó bổ nối với báo 0,5 s, tạo sóng đất', () => {
    const w = world('challenge');
    const boss = enter(w, 1);
    boss.hp = boss.data.hp / 2;
    until(w, () => boss.attack === 'rain' && boss.state === 'telegraph');
    expect(boss.rainCols).toHaveLength(8);
    const safe: number[] = [];
    for (let col = 28; col < 46; col += 1) {
      if (!boss.rainCols.includes(col) && !boss.rainCols.includes(col + 1)) {
        safe.push(col);
        col += 1;
      }
    }
    expect(safe.length).toBeGreaterThanOrEqual(2);
    until(w, () => boss.state === 'active');
    expect(w.pool.all.filter((p) => p.kind === 'drop')).toHaveLength(8);
    until(w, () => boss.stunned);
    tick(w, 59);
    expect(boss.stunned).toBe(true);
    until(w, () => boss.attack === 'dive' && boss.state === 'active');
    until(w, (ev) => ev.bossLanded);
    const waves = w.pool.all.filter((p) => p.kind === 'shockwave');
    expect(waves.map((p) => p.vx)).toEqual([-6 * t, 6 * t]);
    expect(waves.every((p) => p.damage === 10 && p.source === boss.source)).toBe(true);
    until(w, () => boss.attack === 'dive' && boss.state === 'telegraph');
    tick(w, 29);
    expect(boss.state).toBe('telegraph');
    tick(w, 1);
    expect(boss.state).toBe('active');
  });
});
