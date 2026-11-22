import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { PRISM_BEAM, FROST_SHARD } from '@/logic/combat/loadout';
import { buildHud } from '@/logic/hud/hud-model';
import { computeBuild } from '@/logic/rpg/build';
import { recordSecret, defaultSave } from '@/logic/save/save-data';
import { claimedNanoCells } from '@/logic/save/stage-save';
import { layoutFromRows } from '@/logic/stage/layout';
import { PickupPool } from '@/logic/world/pickups';
import { StageWorld, type WorldSetup } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);
const t = TILE_SIZE;
const dt = FIXED_STEP_MS / 1000;
const rows = [
  ...Array.from({ length: 10 }, () => `#${'.'.repeat(28)}#`),
  `#..P........U${'.'.repeat(16)}#`,
  '#'.repeat(30),
];
const heal = { ...IDLE_INPUT, healPressed: true };

function makeWorld(extra: Partial<WorldSetup> = {}) {
  return new StageWorld({
    rows,
    tileSize: t,
    stepSec: dt,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.gray!,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    enemies: config.enemies,
    enemyMarkers: STAGE_DEFS.enemies.enemyMarkers,
    mechanics: config.stages.mechanics,
    seed: 3,
    ...extra,
  });
}

describe('Nano Cell (QB-50–54)', () => {
  it('kiểm dữ liệu Nano Cell, mốc đặt và giới hạn lượng hồi từ nâng cấp', () => {
    expect(config.player.nanoCell).toEqual({ max: 4, healPct: 0.4, useLockSec: 0.4 });
    expect(config.stages.stages.filter((s) => s.nanoCell).map((s) => s.index)).toEqual([
      1, 3, 5, 7,
    ]);
    const invalid = structuredClone(data);
    const player = invalid.player as { nanoCell: { refill: string } };
    player.nanoCell.refill = 'onDeath';
    expect(() => parseGameConfig(invalid)).toThrow('player.nanoCell.refill');
    const misplaced = structuredClone(data);
    (misplaced.stages as { stages: { nanoCell?: boolean }[] }).stages[1]!.nanoCell = true;
    expect(() => parseGameConfig(misplaced)).toThrow('stages.nanoCell');
  });

  it('đọc bí mật đã lưu từ phòng thử cũ và mỗi màn chiến dịch chỉ cấp một ô', () => {
    const stages = config.stages.stages;
    let save = defaultSave();
    expect(claimedNanoCells(save, stages).size).toBe(0);
    for (const id of ['mechanics', 'verdant_gardens', 'cryo_vault', 'prism_institute']) {
      save = recordSecret(save, id, 'nano_cell');
    }
    expect([...claimedNanoCells(save, stages)]).toEqual(['verdant_gardens', 'cryo_vault']);
    const world = makeWorld({ nanoCellCount: claimedNanoCells(save, stages).size });
    expect(buildHud(world).nanoCells).toEqual({ capacity: 2, remaining: 2 });
  });

  it('nhặt Nano Cell chỉ thêm ô mới, kể cả khi chạm nhiều bí mật trong một bước', () => {
    const layout = layoutFromRows(rows, t, STAGE_DEFS.enemies.enemyMarkers);
    layout.secrets.push(
      { ...layout.spawn, item: 'nano_cell', label: 'Nano Cell' },
      { ...layout.spawn, item: 'side_cache', label: 'Két' },
    );
    const world = makeWorld({ layout, nanoCellCount: 1 });
    world.player.hp = 20;
    expect(world.step(heal)).toMatchObject({
      nanoCellUsed: true,
      secretsFound: ['nano_cell', 'side_cache'],
    });
    expect(buildHud(world).nanoCells).toEqual({ capacity: 2, remaining: 1 });
    expect(world.step(IDLE_INPUT).secretsFound).toEqual([]);
    const capped = makeWorld({ layout, nanoCellCount: 99 });
    capped.step(IDLE_INPUT);
    expect(buildHud(capped).nanoCells).toEqual({ capacity: 4, remaining: 4 });
  });

  it('đầy máu không tốn ô, dùng được lúc choáng và khóa điều khiển đúng 0,4 s', () => {
    const world = makeWorld({ nanoCellCount: 2, ownedWeapons: [PRISM_BEAM] });
    expect(world.step(heal).nanoCellUsed).toBe(false);
    expect(world.nanoCells.remaining).toBe(2);
    expect(world.player.applyHit(55, world.player.centerX + 10)).toBe(true);
    const busy = { ...heal, moveX: 1, shootPressed: true, dashPressed: true, swapNext: true };
    expect(world.step(busy)).toMatchObject({
      healed: 40,
      nanoCellUsed: true,
      swapped: false,
      fired: undefined,
    });
    expect(world.player.state).toBe('hurt');
    expect(world.player.hp).toBe(85);
    for (let i = 1; i < 24; i += 1) {
      expect(world.step(busy)).toMatchObject({
        nanoCellUsed: false,
        swapped: false,
        fired: undefined,
      });
    }
    expect(world.nanoCells.remaining).toBe(1);
    expect(world.step({ ...busy, healPressed: false })).toMatchObject({
      swapped: true,
      fired: 'beam',
    });
    expect(world.step(heal)).toMatchObject({ nanoCellUsed: true, healed: 15 });
    world.player.hp = 30;
    expect(world.step(heal).nanoCellUsed).toBe(false);
    expect(world.nanoCells.remaining).toBe(0);
  });

  it('qua checkpoint, rơi hố và chết giữ số lượt đã dùng; vào lượt mới nạp đầy', () => {
    const layout = buildStageLayout(STAGE_DEFS.mechanics, t);
    const setup = { layout, nanoCellCount: 3 };
    const world = makeWorld(setup);
    world.player.hp = 30;
    expect(world.step(heal).nanoCellUsed).toBe(true);
    const cp = layout.checkpoints[0]!;
    world.player.respawn((cp.col + 0.5) * t, (cp.row + 1) * t, world.player.hp);
    expect(world.step(IDLE_INPUT).checkpoint).toBe(1);
    expect(world.nanoCells.remaining).toBe(2);
    world.player.box.y = world.map.heightPx + t;
    expect(world.step(IDLE_INPUT).fellInPit).toBe(true);
    for (let i = 0; i < 100; i += 1) world.step(IDLE_INPUT);
    expect(world.nanoCells.remaining).toBe(2);
    expect(world.player.applyHit(9999, world.player.centerX + 10)).toBe(true);
    expect(world.step(heal)).toMatchObject({ playerDied: true, nanoCellUsed: false });
    for (let i = 0; i < 100; i += 1) expect(world.step(heal).nanoCellUsed).toBe(false);
    expect(world.player.hp).toBe(world.player.maxHp);
    expect(world.nanoCells.remaining).toBe(2);
    expect(makeWorld(setup).nanoCells.remaining).toBe(3);
  });

  it.each([
    [1, 50],
    [2, 60],
    [3, 70],
    [4, 80],
    [9, 80],
  ])('Nano Cell Cap cấp %i hồi %i máu ở cấp 1', (level, healed) => {
    const build = computeBuild(
      config.skills,
      {},
      {
        shop: config.shop,
        levels: { nano_cell_cap: level },
      },
    );
    const world = makeWorld({ build, nanoCellCount: 1 });
    world.player.hp = 1;
    expect(world.step(heal).healed).toBe(healed);
  });
});

describe('viên năng lượng (QB-17, QB-20)', () => {
  it('ngưỡng 6% và giá trị +4 theo dữ liệu', () => {
    const { pickups } = config.enemies.rules;
    expect([pickups.energyChance, pickups.energy]).toEqual([0.06, 4]);
    const pool = new PickupPool(pickups, t);
    pool.dropEnergy(50, 50, () => 0.06);
    expect(pool.all).toHaveLength(0);
    pool.dropEnergy(50, 50, () => 0.059);
    expect(pool.all).toMatchObject([{ kind: 'energy', value: 4 }]);
    const invalid = structuredClone(data);
    const enemies = invalid.enemies as { rules: { pickups: { energyChance: number } } };
    enemies.rules.pickups.energyChance = 1.01;
    expect(() => parseGameConfig(invalid)).toThrow('enemies.rules.pickups.energyChance');
  });

  it('chỉ rơi khi có vũ khí boss thiếu năng lượng và địch chưa trả thưởng', () => {
    const enemies = structuredClone(config.enemies);
    enemies.rules.pickups.energyChance = 1;
    const world = makeWorld({ enemies, ownedWeapons: [PRISM_BEAM] });
    const field = world.field!;
    const kill = () => field.onKilled(field.enemies, world.player, world.loadout);
    const capsules = () => field.pickups.all.filter((p) => p.kind === 'energy');
    kill();
    expect(capsules()).toHaveLength(0);
    field.reset();
    world.loadout.slots[1]!.energy = 0;
    kill();
    expect(capsules()).toHaveLength(0);
    const fresh = makeWorld({ enemies, ownedWeapons: [PRISM_BEAM] });
    fresh.loadout.slots[1]!.energy = 0;
    fresh.field!.onKilled(fresh.enemies, fresh.player, fresh.loadout);
    expect(fresh.field!.pickups.all.filter((p) => p.kind === 'energy')).toHaveLength(1);
  });

  it('ưu tiên vũ khí đang cầm; Arc Cannon chọn thanh thấp nhất và kẹp mức tối đa', () => {
    const { loadout } = makeWorld({ ownedWeapons: [PRISM_BEAM, FROST_SHARD] });
    expect(loadout.restoreEnergy(4)).toBe(0);
    const prism = loadout.slots[1]!;
    const frost = loadout.slots[2]!;
    prism.energy = 24;
    frost.energy = 8;
    expect(loadout.restoreEnergy(4)).toBe(4);
    expect(frost.energy).toBe(12);
    expect(prism.energy).toBe(24);
    loadout.swap(1);
    prism.energy = 27;
    expect(loadout.restoreEnergy(4)).toBe(1);
    expect(prism.energy).toBe(28);
    expect(loadout.restoreEnergy(4)).toBe(0);
    expect(frost.energy).toBe(12);
  });

  it('trong StageWorld chỉ tiêu viên năng lượng khi vũ khí đích thực sự được nạp', () => {
    const enemies = structuredClone(config.enemies);
    enemies.rules.pickups.energyChance = 1;
    const world = makeWorld({ enemies, ownedWeapons: [PRISM_BEAM, FROST_SHARD] });
    const field = world.field!;
    const frost = world.loadout.slots[2]!;
    frost.energy = 12;
    world.loadout.swap(1);
    const { x, y, w } = world.player.box;
    field.pickups.dropEnergy(x + w / 2, y + 10, () => 0);
    expect(world.step(IDLE_INPUT).energyGained).toBe(0);
    expect(field.pickups.all).toHaveLength(1);
    expect(world.step({ ...IDLE_INPUT, swapPrev: true }).energyGained).toBeCloseTo(4);
    expect(frost.energy).toBeCloseTo(16);
    expect(field.pickups.all).toHaveLength(0);
  });
});
