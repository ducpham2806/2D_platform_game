import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { checkStoryPowerCap, parseGameConfig } from '@/core/game-config';
import type { WeaponsData } from '@/core/weapons-config';
import { WeaponLoadout } from '@/logic/combat/loadout';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { applyBuild, computeBuild } from '@/logic/rpg/build';
import { TileMap } from '@/logic/tilemap';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);
const DT = FIXED_STEP_MS / 1000;
const T = TILE_SIZE;

describe('trần sức mạnh cốt truyện (GDD 10 mục 3.3)', () => {
  it('dữ liệu thật đạt mọi trần: thường trực 1,975; máu 2,48; máu hiệu dụng 3,11', () => {
    expect(checkStoryPowerCap(config)).toEqual([]);
  });

  const withData = (patch: (d: Record<string, unknown>) => void) => {
    const d = structuredClone(data);
    patch(d);
    return () => parseGameConfig(d);
  };
  type Up = { id: string; damagePerLevel?: number };

  it('Upgrade sát thương 10%/cấp → 1,58 × 1,5 = 2,37 vượt trần 2,2', () => {
    const run = withData((d) => {
      const up = (d.shop as { upgrades: Up[] }).upgrades.find((u) => u.id === 'arc_core')!;
      up.damagePerLevel = 0.1;
    });
    expect(run).toThrow(/trần sát thương: cấp 30 × upgrade tối đa = 2.370 lần cấp 1, trần 2.2/);
  });

  it('Khung Gia Cố ×1,3 → 216 × 1,3 = 281 máu (×2,81) vượt trần máu 2,5', () => {
    const run = withData((d) => {
      const c1 = (
        d.skills as { branches: { nodes: { id: string; ranks: { maxHpMul?: number }[] }[] }[] }
      ).branches
        .flatMap((b) => b.nodes)
        .find((n) => n.id === 'C1')!;
      c1.ranks[0]!.maxHpMul = 1.3;
    });
    expect(run).toThrow(/trần máu: cấp 30 với kỹ năng = 2.810/);
  });

  it('module có điều kiện ×1,4 → 1,975 × 1,4 = 2,77 vượt trần 2,6', () => {
    const run = withData((d) => {
      (d.modules as Record<string, unknown>[]).push({
        id: 'test',
        conditional: true,
        damageMul: 1.4,
      });
    });
    expect(run).toThrow(/trần có điều kiện: 2.765/);
  });
});

// ---------------------------------------------------------------------------------------------
// Mô phỏng lối bắn (GDD 10 mục 3.2): WeaponLoadout thật, mục tiêu cách 5 ô, mọi phát trúng.

const OPEN = TileMap.fromRows(['.'.repeat(40), '.'.repeat(40), '#'.repeat(40)], T);
type Press = { pressed: boolean; held: boolean; released: boolean; autoFire: boolean };
type Pattern = (step: number) => Press;

/** Bấm 7,5 lần/giây (bàn phím). */
const spam: Pattern = (i) => ({
  pressed: i % 8 === 0,
  held: i % 8 === 0,
  released: i % 8 === 1,
  autoFire: false,
});
/** Giữ đủ `sec` rồi thả, lặp lại; `auto`: tự bắn của cảm ứng trong lúc giữ. */
const cycle =
  (sec: number, auto: boolean): Pattern =>
  (i) => {
    const hold = Math.ceil(sec / DT) + 1;
    const k = i % (hold + 1);
    return { pressed: k === 0, held: k < hold, released: k === hold, autoFire: auto };
  };

/**
 * Sát thương mỗi giây (đơn vị: phát Arc Cannon gốc). `punish`: hệ số V3 cho đạn nạp đầy, áp cho
 * mỗi phát nạp đầy thứ `punishEvery` (giả định boss hở tối đa 1/3 số phát, GDD 10 mục 3.2).
 */
function dps(
  weapons: WeaponsData,
  pattern: Pattern,
  punish = 1,
  punishEvery = 3,
  seconds = 20,
): number {
  const loadout = new WeaponLoadout(weapons, T);
  const pool = new ProjectilePool();
  const ctx = { centerX: 2 * T, top: T, facing: 1 as const, hurt: false, aimTargets: undefined };
  const targetX = ctx.centerX + 5 * T;
  let dmg = 0;
  let charged = 0;
  for (let i = 0; i < Math.round(seconds / DT); i += 1) {
    loadout.step(pattern(i), ctx, pool, DT);
    pool.update(DT, OPEN);
    for (const p of pool.all) {
      if (!p.alive || p.owner !== 'player' || p.x + p.w < targetX) continue;
      if (p.kind === 'charged') charged += 1;
      const mul = p.kind === 'charged' && charged % punishEvery === 0 ? punish : 1;
      dmg += p.damage * p.kindMul * mul;
      p.alive = false;
    }
  }
  return dmg / seconds;
}

describe('kỹ năng tăng tốc nạp không nâng DPS tối đa (GDD 10 mục 3.2)', () => {
  const base = config.weapons;
  // Trường hợp xấu nhất dữ liệu cho phép: nạp đầy kẹp ở sàn; V3 bậc 3.
  const floor = applyBuild(config.player, base, {
    ...computeBuild(config.skills, { V1: 1, V2: 2, V3: 3 }),
    fullChargeTimeMul: 0,
  }).weapons;
  const floorSec = floor.arcCannon.charge.timeSec;
  const punish = config.skills.nodes.V3!.ranks[2]!.effects.punishMul ?? 1;

  it('số đo gốc: bắn liên thanh 7,4; nạp vừa 5,45; nạp vừa + tự bắn cảm ứng 9,15', () => {
    expect(dps(base, spam)).toBeCloseTo(7.4, 1);
    expect(dps(base, cycle(0.5, false))).toBeCloseTo(5.45, 1);
    expect(dps(base, cycle(0.5, true))).toBeCloseTo(9.15, 1);
    expect(floorSec).toBe(config.skills.rules.minFullChargeSec);
  });

  it('bàn phím: nạp đầy ở sàn, kể cả Trừng Phạt ở MỌI phát, vẫn thấp hơn lối mạnh nhất gốc', () => {
    const bestBase = Math.max(dps(base, spam), dps(base, cycle(0.5, false)));
    expect(dps(floor, cycle(floorSec, false), punish, 1)).toBeLessThan(bestBase);
  });

  it('cảm ứng (tự bắn): nạp đầy ở sàn với Trừng Phạt 1/3 số phát vẫn thấp hơn lối mạnh nhất gốc', () => {
    const bestBase = Math.max(dps(base, cycle(0.5, true)), dps(base, cycle(1.2, true)));
    expect(dps(floor, cycle(floorSec, true))).toBeLessThan(bestBase);
    expect(dps(floor, cycle(floorSec, true), punish)).toBeLessThan(bestBase);
  });
});

/** Bot không né (bám boss trong `keepTiles` ô, bắn liên tục) đấu Thorna; trả về kết cục. */
function noDodgeFight(build: ReturnType<typeof computeBuild>, keepTiles: number) {
  const world = new StageWorld({
    layout: buildStageLayout(STAGE_DEFS.thorna, T),
    tileSize: T,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.thorna!,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    seed: 3,
    mechanics: config.stages.mechanics,
    level: 6,
    build,
  });
  world.player.respawn((world.arena!.first + 3) * T, 11 * T);
  world.step(IDLE_INPUT);
  let hits = 0;
  for (let i = 0; i < 60 * 120; i += 1) {
    const gap = world.boss!.centerX - world.player.centerX;
    const press = i % 8 === 0;
    const ev = world.step({
      ...IDLE_INPUT,
      moveX: Math.abs(gap) > keepTiles * T ? Math.sign(gap) : 0,
      shootPressed: press,
      shootHeld: press,
      shootReleased: i % 8 === 1,
    });
    if (ev.playerHurt) hits += 1;
    if (ev.playerDied || ev.bossDefeated)
      return {
        won: ev.bossDefeated,
        hits,
        hp: world.player.hp,
        maxHp: world.player.maxHp,
        sec: i * DT,
      };
  }
  return { won: false, hits, hp: world.player.hp, maxHp: world.player.maxHp, sec: 120 };
}

describe('phòng thủ không thay được né (GDD 10 mục 8)', () => {
  it('build Core không đổi số đòn trúng, chỉ thêm đúng phần máu của C1', () => {
    for (const keep of [3, 8]) {
      const plain = noDodgeFight(computeBuild(config.skills, {}), keep);
      const core = noDodgeFight(computeBuild(config.skills, { C1: 1, C2: 2, C3: 3 }), keep);
      expect(core.hits).toBe(plain.hits);
      expect(core.maxHp - plain.maxHp).toBe(18);
      expect(core.hp - plain.hp).toBe(18);
    }
  });

  it('ghi nhận cân bằng boss (cho cổng Prototype): bot không né thắng Thorna dưới 20 s', () => {
    // Đặc tả Stage 1 dự kiến 60–90 s. Test này ghi lại hiện trạng để thấy ngay khi chỉnh Thorna;
    // khi Thorna được cân bằng lại ở cổng Prototype thì đổi kỳ vọng.
    const r = noDodgeFight(computeBuild(config.skills, {}), 3);
    expect(r.won).toBe(true);
    expect(r.sec).toBeLessThan(20);
  });
});
