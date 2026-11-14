import { describe, expect, it } from 'vitest';
import { attackOf } from '@/core/boss-config';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { checkStoryPowerCap, parseGameConfig } from '@/core/game-config';
import { enemyProjectile } from '@/logic/boss/enemy-projectile';
import { applyBuild, computeBuild, EMPTY_BUILD } from '@/logic/rpg/build';
import { createRng } from '@/logic/rng';
import type { UpgradeLevels } from '@/logic/shop/upgrades';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldEvents } from '@/logic/world/world-types';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;
const T = TILE_SIZE;
const THORNA = config.bosses.thorna!;

/** Phòng 30 ô: Kai ở cột 4, bia ở cột 12, gai ở cột 20. */
const ROOM = [
  ...Array.from({ length: 10 }, () => `#${'.'.repeat(28)}#`),
  `#${'.'.repeat(3)}P${'.'.repeat(7)}T${'.'.repeat(7)}^${'.'.repeat(8)}#`,
  '#'.repeat(30),
];

function makeWorld(levels: UpgradeLevels, ownedWeapons: string[] = []): StageWorld {
  const w = new StageWorld({
    rows: ROOM,
    tileSize: T,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: THORNA,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    seed: 1,
    mechanics: config.stages.mechanics,
    enemies: config.enemies,
    ownedWeapons,
    build: computeBuild(config.skills, {}, { shop: config.shop, levels }),
  });
  for (let i = 0; i < 10; i += 1) w.step(IDLE_INPUT);
  return w;
}

/** Bắn một phát Arc Cannon sang phải, trả máu bia đã mất. */
function shootTarget(w: StageWorld): number {
  const target = w.targets[0]!;
  const before = target.hp;
  w.step({ ...IDLE_INPUT, shootPressed: true, shootHeld: true });
  w.step({ ...IDLE_INPUT, shootReleased: true });
  for (let i = 0; i < 120 && target.hp === before; i += 1) w.step(IDLE_INPUT);
  return before - target.hp;
}

function walkRightUntil(w: StageWorld, until: (ev: WorldEvents) => boolean): void {
  for (let i = 0; i < 400; i += 1) if (until(w.step({ ...IDLE_INPUT, moveX: 1 }))) return;
  throw new Error('không tới nơi');
}

describe('áp Upgrade vào trận (ST-09-03, GDD 10 mục 3.1)', () => {
  it('Arc Core cấp 2: một phát Arc Cannon gốc gây 1 × 1,1', () => {
    expect(shootTarget(makeWorld({}))).toBeCloseTo(1, 9);
    expect(shootTarget(makeWorld({ arc_core: 2 }))).toBeCloseTo(1.1, 9);
  });

  it('Armor Plating cấp 2: Gai Quạt 12 → 11; gai môi trường vẫn đủ', () => {
    const w = makeWorld({ armor_plating: 2 });
    const hp = w.player.hp;
    const b = w.player.box;
    const thorns = attackOf(THORNA, 'thorns').damage;
    w.pool.spawn(enemyProjectile(T, 'enemyShot', b.x + 2, b.y + 6, { w: 8, h: 8 }, 0, 0, thorns));
    expect(w.step(IDLE_INPUT).playerHurt).toBe(true);
    expect(hp - w.player.hp).toBe(Math.round(thorns * 0.92));
    expect(hp - w.player.hp).toBe(11);
    for (let i = 0; i < 70; i += 1) w.step(IDLE_INPUT); // hết bất tử
    const beforeSpike = w.player.hp;
    walkRightUntil(w, (ev) => ev.spikeHit);
    expect(beforeSpike - w.player.hp).toBe(config.stages.mechanics.spikes.damage);
  });

  it('Energy Cell cấp 2: năng lượng tối đa 28 → 36 (+15%/cấp); vũ khí boss nhận đầy 36', () => {
    expect(config.weapons.energyMax).toBe(28);
    const w = makeWorld({ energy_cell: 2 }, ['Vine Lash']);
    expect(w.loadout.energyMax).toBe(36);
    expect(w.loadout.slots.find((s) => s.kind !== 'buster')?.energy).toBe(36);
    expect(makeWorld({ energy_cell: 1 }).loadout.energyMax).toBe(32);
    expect(applyBuild(config.player, config.weapons, EMPTY_BUILD).weapons.energyMax).toBe(28);
  });

  describe('Magnet Range', () => {
    /** Thả một viên Core Bit cách thân Kai `gapTiles` ô về bên phải, chạy `steps` bước. */
    function dropAndWait(levels: UpgradeLevels, gapTiles: number, kind: 'coreBit' | 'heal') {
      const w = makeWorld(levels);
      const field = w.field!;
      const b = w.player.box;
      field.pickups.drop(b.x + b.w + gapTiles * T, b.y + b.h - 4, 1, false, createRng(1));
      const item = field.pickups.all[0]!;
      item.kind = kind;
      const start = item.x;
      const bits = field.coreBits;
      const hp = w.player.hp;
      for (let i = 0; i < 30; i += 1) w.step(IDLE_INPUT);
      return { w, item, start, gained: field.coreBits - bits, left: field.pickups.all.length, hp };
    }

    it('cấp 1: viên cách 0,9 ô bay tới và được nhặt; viên cách 1,5 ô nằm yên', () => {
      const near = dropAndWait({ magnet_range: 1 }, 0.9, 'coreBit');
      expect(near.gained).toBe(1);
      expect(near.left).toBe(0);
      const far = dropAndWait({ magnet_range: 1 }, 1.5, 'coreBit');
      expect(far.gained).toBe(0);
      expect(far.item.x).toBeCloseTo(far.start, 6);
      expect(far.item.pulled).toBe(false);
    });

    it('cấp 2 hút viên cách 1,5 ô; không có Upgrade thì không hút; viên máu không bị hút', () => {
      expect(dropAndWait({ magnet_range: 2 }, 1.5, 'coreBit').gained).toBe(1);
      const none = dropAndWait({}, 0.9, 'coreBit');
      expect(none.gained).toBe(0);
      expect(none.item.pulled).toBe(false);
      const heal = dropAndWait({ magnet_range: 3 }, 0.9, 'heal');
      expect(heal.item.pulled).toBe(false);
      expect(heal.left).toBe(1);
    });
  });

  it('trần sức mạnh: build có mọi kỹ năng và mọi Upgrade tối đa vẫn trong trần', () => {
    const levels = Object.fromEntries(
      Object.values(config.shop.upgrades).map((u) => [u.id, u.maxLevel]),
    );
    const build = computeBuild(config.skills, {}, { shop: config.shop, levels });
    expect(build.damageMul).toBeCloseTo(1.25, 9);
    expect(build.damageTakenMul).toBeCloseTo(0.8, 9);
    expect(build.energyMaxMul).toBeCloseTo(1.75, 9);
    expect(build.magnetTiles).toBe(3);
    expect(checkStoryPowerCap(config)).toEqual([]);
    // Cấp vượt tối đa bị kẹp, id lạ bị bỏ.
    const over = computeBuild(
      config.skills,
      {},
      { shop: config.shop, levels: { arc_core: 9, x: 3 } },
    );
    expect(over.damageMul).toBeCloseTo(1.25, 9);
  });
});
