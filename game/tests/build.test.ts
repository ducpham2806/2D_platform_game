import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { WeaponLoadout } from '@/logic/combat/loadout';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { applyBuild, computeBuild, EMPTY_BUILD, statsFor } from '@/logic/rpg/build';
import { StageWorld } from '@/logic/world/stage-world';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;
const full = computeBuild(config.skills, { V1: 1, P2: 1, C1: 1, C2: 2 });

describe('gom hiệu ứng build (GDD 10 mục 3.1)', () => {
  it('V1, P2 bậc 1, C1, C2 bậc 2', () => {
    expect(full.fullChargeTimeMul).toBe(0.85);
    expect(full.wallSlideMul).toBe(0.6);
    expect(full.maxHpMul).toBe(1.15);
    expect(full.energyRegenMul).toBe(1.5);
    expect(full.regenDelayMul).toBe(0.67);
    expect(full.minFullChargeSec).toBe(config.skills.rules.minFullChargeSec);
    expect(computeBuild(config.skills, {}).effects).toEqual({});
    // Bậc vượt tối đa bị kẹp, nút lạ bị bỏ.
    expect(computeBuild(config.skills, { C2: 9, X9: 1 }).energyRegenMul).toBe(1.5);
  });

  it('chỉ nạp đầy nhanh hơn, nạp vừa giữ nguyên; kẹp ở sàn; dữ liệu gốc không bị sửa', () => {
    const { player, weapons } = applyBuild(config.player, config.weapons, full);
    expect(weapons.arcCannon.charge.timeSec).toBeCloseTo(1.02, 9);
    expect(weapons.arcCannon.midCharge.timeSec).toBe(0.5);
    expect(player.wallSlideTilesPerSec).toBeCloseTo(1.2, 9);
    expect(weapons.energyRegen.perSec).toBe(1.5);
    expect(weapons.energyRegen.afterNoFireSec).toBeCloseTo(2.01, 9);
    expect(config.weapons.arcCannon.charge.timeSec).toBe(1.2);
    const floored = applyBuild(config.player, config.weapons, { ...full, fullChargeTimeMul: 0.3 });
    expect(floored.weapons.arcCannon.charge.timeSec).toBe(0.75);
    const same = applyBuild(config.player, config.weapons, EMPTY_BUILD);
    expect(same.weapons).toBe(config.weapons);
  });

  it('máu theo cấp với Khung Gia Cố: cấp 4 = 129, cấp 5 = 133', () => {
    expect(statsFor(4, config.player.level, full).maxHp).toBe(129);
    expect(statsFor(5, config.player.level, full).maxHp).toBe(133);
    expect(statsFor(4, config.player.level).maxHp).toBe(112);
  });

  it('vũ khí: với V1 giữ 1,02 s là nạp đầy; không có V1 thì 1,02 s mới là nạp vừa', () => {
    const level = (build = EMPTY_BUILD) => {
      const l = new WeaponLoadout(
        applyBuild(config.player, config.weapons, build).weapons,
        TILE_SIZE,
      );
      const pool = new ProjectilePool();
      const ctx = {
        centerX: 100,
        top: 100,
        facing: 1 as const,
        hurt: false,
        aimTargets: undefined,
      };
      const steps = Math.ceil(1.02 / DT);
      for (let i = 0; i < steps; i += 1)
        l.step({ pressed: i === 0, held: true, released: false, autoFire: false }, ctx, pool, DT);
      return l.chargeLevel;
    };
    expect(level(full)).toBe(2);
    expect(level()).toBe(1);
  });
});

describe('build trong trận', () => {
  const world = (level: number, build = full) =>
    new StageWorld({
      layout: buildStageLayout(STAGE_DEFS.thorna, TILE_SIZE),
      tileSize: TILE_SIZE,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.thorna!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      seed: 1,
      mechanics: config.stages.mechanics,
      level,
      build,
    });

  it('vào màn có C1: máu tối đa theo cấp × 1,15; lên cấp giữa màn vẫn giữ C1', () => {
    const w = world(4);
    expect(w.player.maxHp).toBe(129);
    w.player.hp = 100;
    w.setLevel(5);
    expect(w.player.maxHp).toBe(133);
    expect(w.player.hp).toBe(104);
  });

  it('bảng chỉnh cảm giác (retune) đổi số gốc mà không xóa build', () => {
    const w = world(1);
    w.retune({ weapons: config.weapons, player: config.player });
    expect(w.tuning.weapons.arcCannon.charge.timeSec).toBe(1.2);
    const pool = new ProjectilePool();
    const ctx = { centerX: 100, top: 100, facing: 1 as const, hurt: false, aimTargets: undefined };
    for (let i = 0; i < Math.ceil(1.02 / DT); i += 1)
      w.loadout.step(
        { pressed: i === 0, held: true, released: false, autoFire: false },
        ctx,
        pool,
        DT,
      );
    expect(w.loadout.chargeLevel).toBe(2);
  });
});
