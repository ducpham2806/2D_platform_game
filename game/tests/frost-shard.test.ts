import { describe, expect, it } from 'vitest';
import { FIXED_STEP_HZ, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { FROST_SHARD } from '@/logic/combat/loadout';
import type { ShieldCharger } from '@/logic/enemy/behaviors';
import { layoutFromRows, type StageLayout } from '@/logic/stage/layout';
import { layoutFromTiled } from '@/logic/stage/tiled';
import { Tile } from '@/logic/tilemap';
import { StageWorld, type WorldSetup } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldEvents, type WorldInput } from '@/logic/world/world-types';
import { FROST_ROOM } from '@/stages/frost-room';
import { buildStageLayout } from '@/stages/stage-def';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const t = TILE_SIZE;
const dt = 1 / FIXED_STEP_HZ;
const weapon = config.weapons.bossWeapons.find((w) => w.name === FROST_SHARD)!;
const shard = weapon.behavior!;
if (shard.type !== 'shard' || weapon.energyCost === null) throw new Error('Thiếu Frost Shard');
const cost = weapon.energyCost;
const stepsFor = (sec: number) => Math.round(sec / dt);
const ground = 10 * t;
const room = () => buildStageLayout(FROST_ROOM, t);
const emptyRoom = (): StageLayout => ({ ...room(), enemies: [] });

function makeWorld(layout: StageLayout = room(), overrides: Partial<WorldSetup> = {}): StageWorld {
  const w = new StageWorld({
    layout,
    tileSize: t,
    stepSec: dt,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.gray!,
    enemies: config.enemies,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    mechanics: config.stages.mechanics,
    seed: 2,
    ownedWeapons: [FROST_SHARD],
    ...overrides,
  });
  w.loadout.swap(1);
  return w;
}

function step(w: StageWorld, patch: Partial<WorldInput> = {}): WorldEvents {
  return w.step({ ...IDLE_INPUT, ...patch });
}

function idle(w: StageWorld, count: number): void {
  for (let i = 0; i < count; i += 1) step(w);
}

function until(w: StageWorld, event: (ev: WorldEvents) => boolean, limit = 180): WorldEvents {
  for (let i = 0; i < limit; i += 1) {
    const ev = step(w);
    if (event(ev)) return ev;
  }
  throw new Error('Chưa thấy sự kiện trong số bước giới hạn');
}

const fire = (w: StageWorld) => step(w, { shootPressed: true });

describe('Frost Shard', () => {
  it('QB-11–13: cấp từ danh sách đã mở, bắn thẳng và áp đúng năng lượng, hồi bắn, tầm', () => {
    const w = makeWorld(emptyRoom());
    w.player.facing = -1;
    expect(step(w, { shootReleased: true }).fired).toBeUndefined();
    expect(fire(w).fired).toBe('shard');
    expect(w.loadout.current.energy).toBe(config.weapons.energyMax - cost);
    expect(w.pool.all[0]).toMatchObject({
      owner: 'player',
      weapon: FROST_SHARD,
      kind: 'shard',
      w: shard.sizePx.w,
      h: shard.sizePx.h,
      vx: -shard.speedTilesPerSec * t,
      vy: 0,
      kindMul: shard.damageMul,
      maxDistance: shard.rangeTiles * t,
      freezeSec: shard.freezeSec,
      breaksShield: false,
      pierceLeft: 0,
    });
    expect(fire(w).fired).toBeUndefined();
    idle(w, stepsFor(shard.cooldownSec) - 2);
    expect(fire(w).fired).toBe('shard');
    expect(w.loadout.current.energy).toBe(config.weapons.energyMax - cost * 2);
    idle(w, stepsFor(shard.cooldownSec));
    w.loadout.current.energy = cost - 1;
    expect(fire(w)).toMatchObject({ emptyWeapon: true, fired: undefined });
    expect(w.loadout.current.name).toBe(FROST_SHARD);
  });

  it('chỉ địch còn sống mới đóng băng; viên đạn dừng sau một mục tiêu', () => {
    const w = makeWorld();
    expect(fire(w).fired).toBe('shard');
    expect(until(w, (ev) => ev.enemyFrozen)).toMatchObject({ hitEnemy: true, enemyKilled: false });
    const target = w.enemies[0]!;
    expect(target.hp).toBe(target.maxHp - shard.damageMul * config.weapons.arcCannon.damage);
    expect(target.disabledSec).toBe(shard.freezeSec);
    expect(target.frozen).toBe(true);
    expect(w.pool.count('player')).toBe(0);
    expect(w.coolant[0]!.frozen).toBe(false);
    expect(fire(w).fired).toBe('shard');
    expect(until(w, (ev) => ev.enemyKilled)).toMatchObject({
      enemyFrozen: false,
      enemyKilled: true,
    });
  });

  it.each([false, true])('khiên Lính Kén, bắn từ sau = %j', (rear) => {
    const layout = emptyRoom();
    layout.enemies.push({ col: 5, row: 9, enemy: 'linh_ken', harmless: true });
    const w = makeWorld(layout);
    const target = w.enemies[0] as ShieldCharger;
    w.player.respawn(target.box.x - 17, ground);
    target.facing = rear ? 1 : -1;
    const shield = target.shieldLeft;
    fire(w);
    const impact = until(w, (ev) => ev.blocked || ev.hitEnemy, 15);
    expect(impact).toMatchObject({ blocked: !rear, enemyFrozen: rear });
    expect(target.shieldLeft).toBe(shield);
    expect(target.hp).toBe(target.maxHp - (rear ? shard.damageMul : 0));
  });

  it('QB-19: Bramble Golem miễn vô hiệu nhưng nhận sát thương', () => {
    const layout = emptyRoom();
    layout.enemies.push({ col: 6, row: 9, enemy: 'bramble_golem', harmless: true });
    const w = makeWorld(layout);
    const mini = w.enemies[0]!;
    expect(mini.disable(0.3)).toBe(false);
    fire(w);
    expect(until(w, (ev) => ev.hitEnemy)).toMatchObject({ enemyFrozen: false });
    expect(mini.hp).toBe(mini.maxHp - shard.damageMul);
    expect(mini.disabledSec).toBe(0);
  });

  it('QB-14, QB-19: boss nhận đòn điểm yếu theo luật sẵn có, không đóng băng', () => {
    const rows = [
      '#...................#',
      '#...................#',
      '#P.D...B............#',
      '#####################',
    ];
    const layout = layoutFromRows(rows, t);
    const w = makeWorld(layout, { boss: { ...config.bosses.gray!, weakness: FROST_SHARD } });
    w.phase = 'boss';
    w.boss!.activate();
    fire(w);
    expect(until(w, (ev) => ev.hitBoss)).toMatchObject({
      hitBoss: true,
      weakHit: true,
      enemyFrozen: false,
    });
    expect(w.bossDamage.get(FROST_SHARD)).toBe(shard.damageMul * weapon.damageVsWeak);
    expect(w.boss!.stunned).toBe(true);
  });
});

describe('vô hiệu dùng chung (QB-19)', () => {
  it.each(['drone_linh', 'thap_phao_tap_su', 'buom_sat', 'linh_ken'])(
    '%s dừng AI và đòn tấn công tới hết hiệu lực',
    (enemy) => {
      const layout = emptyRoom();
      layout.enemies.push({ col: 7, row: 9, enemy, harmless: false });
      const w = makeWorld(layout);
      const target = w.enemies[0]!;
      const before = { ...target.box };
      expect(target.disable(3, 'freeze')).toBe(true);
      idle(w, stepsFor(3));
      expect(target.box).toEqual(before);
      expect(w.pool.count('enemy')).toBe(0);
      expect(target.disabledSec).toBe(0);
      expect(target.frozen).toBe(false);
      idle(w, stepsFor(2) + 15);
      expect(target.box.x !== before.x || w.pool.count('enemy') > 0).toBe(true);
    },
  );

  it('choáng rồi băng, hoặc băng rồi choáng, luôn lấy thời gian lớn hơn', () => {
    const w = makeWorld();
    const target = w.enemies[0]!;
    expect(target.disable(0.3)).toBe(true);
    expect(target.frozen).toBe(false);
    target.disable(2, 'freeze');
    expect(target.disabledSec).toBe(2);
    idle(w, stepsFor(0.5));
    target.disable(0.3);
    expect(target.disabledSec).toBeCloseTo(1.5);
    target.disable(2);
    idle(w, stepsFor(1.5));
    expect(target.frozen).toBe(false);
    expect(target.disabledSec).toBeCloseTo(0.5);
    target.reset();
    expect(target.disabledSec).toBe(0);
  });

  it('đồng hồ vẫn chạy ngoài tầm AI, địch vô hiệu không đẩy hoặc làm mất máu khi chạm', () => {
    const layout = emptyRoom();
    layout.enemies.push({ col: 18, row: 9, enemy: 'thap_phao_tap_su', harmless: false });
    const w = makeWorld(layout);
    const target = w.enemies[0]!;
    expect(w.field!.isActive(target, w.player)).toBe(false);
    target.disable(2, 'freeze');
    idle(w, stepsFor(0.5));
    expect(target.disabledSec).toBeCloseTo(1.5);
    w.player.respawn(target.centerX, ground);
    expect(step(w).playerHurt).toBe(false);
    expect(w.player.hp).toBe(w.player.maxHp);
  });
});

describe('dòng làm mát', () => {
  it('dòng lỏng đi qua được; Frost Shard tạo đúng 3 bậc một chiều có thể đứng và nhảy lên', () => {
    const w = makeWorld(emptyRoom());
    const flow = w.coolant[0]!;
    const x = flow.box.x + flow.box.w / 2;
    w.player.respawn(x, 80);
    idle(w, 60);
    expect(w.player.hp).toBe(w.player.maxHp);
    expect(w.player.bottom).toBe(ground);
    w.player.respawn(w.layout.spawn.col * t + t / 2, ground);
    fire(w);
    expect(until(w, (ev) => ev.coolantFrozen).coolantFrozen).toBe(true);
    expect(w.pool.count('player')).toBe(0);
    expect(flow.stepRows).toEqual([3, 6, 9]);
    for (let row = flow.spawn.top; row <= flow.spawn.bottom; row += 1)
      expect(w.map.get(flow.spawn.first, row)).toBe(
        flow.stepRows.includes(row) ? Tile.OneWay : Tile.Empty,
      );
    w.player.respawn(x, ground);
    for (const landing of [6 * t, 3 * t]) {
      step(w, { jumpPressed: true, jumpHeld: true });
      for (let n = 0; n < 45; n += 1) step(w, { jumpHeld: true });
      expect(w.player.grounded).toBe(true);
      expect(w.player.bottom).toBe(landing);
    }
  });

  it('Arc Cannon đi qua dòng, tường chặn Frost Shard', () => {
    const w = makeWorld(emptyRoom());
    w.loadout.swap(1);
    expect(fire(w).fired).toBe('shot');
    idle(w, 42);
    expect(w.coolant[0]!.frozen).toBe(false);
    expect(w.pool.all[0]!.x).toBeGreaterThan(w.coolant[0]!.box.x);
    w.loadout.swap(1);
    w.map.set(10, 9, Tile.Solid);
    expect(fire(w).fired).toBe('shard');
    idle(w, 60);
    expect(w.coolant[0]!.frozen).toBe(false);
    expect(w.pool.count('player')).toBe(0);
  });

  it('giữ bậc qua hồi sinh, lượt mới lại có dòng lỏng', () => {
    const w = makeWorld(emptyRoom());
    fire(w);
    until(w, (ev) => ev.coolantFrozen);
    w.player.respawn(w.player.centerX, 500, 1);
    expect(step(w).playerDied).toBe(true);
    until(w, (ev) => ev.respawned);
    expect(w.coolant[0]!.frozen).toBe(true);
    expect(w.map.get(11, 6)).toBe(Tile.OneWay);
    const restarted = makeWorld(emptyRoom());
    expect(restarted.coolant[0]!.frozen).toBe(false);
    expect(restarted.map.get(11, 6)).toBe(Tile.Empty);
  });

  it('Tiled từ chối dòng đè lên ô đặc; thế giới từ chối vùng quá thấp', () => {
    const bad = structuredClone(FROST_ROOM.map) as {
      layers: { objects?: { type: string; x: number }[] }[];
    };
    bad.layers.flatMap((layer) => layer.objects ?? []).find((obj) => obj.type === 'coolant')!.x = 0;
    expect(() => layoutFromTiled(bad, t)).toThrow(/ô dòng làm mát/);
    const short = emptyRoom();
    short.coolant = [{ first: 11, last: 12, top: 5, bottom: 6 }];
    expect(() => makeWorld(short)).toThrow(/cần cao ít nhất 3 ô/);
  });
});
