import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig, parseLevelRange } from '@/core/game-config';
import { buildStageResult } from '@/logic/result/stage-result';
import {
  characterProgress,
  expToNext,
  LevelTracker,
  levelForExp,
  levelStats,
  skillPoints,
  syncLevel,
} from '@/logic/rpg/progression';
import { StageWorld } from '@/logic/world/stage-world';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);
const lv = config.player.level;
const sync = config.stages.levelSync;
const stage1 = config.stages.stages.find((s) => s.index === 1)!;

describe('cấp và EXP (GDD 6.1)', () => {
  it('EXP lên cấp theo 40 × L^1,4, làm tròn; cấp tối đa thì không còn', () => {
    expect(expToNext(1, lv)).toBe(40);
    expect(expToNext(5, lv)).toBe(381);
    expect(expToNext(29, lv)).toBe(4461); // GDD ghi ~4.460 (40 × 29^1,4 ≈ 4460,6)
    expect(expToNext(30, lv)).toBeUndefined();
  });

  it('mốc tích lũy khớp đặc tả Stage 1: cấp 2 tại 40, cấp 3 tại ~146, cấp 4 tại ~333', () => {
    expect(levelForExp(0, lv)).toEqual({ level: 1, expInLevel: 0, expToNext: 40 });
    expect(levelForExp(39, lv).level).toBe(1);
    expect(levelForExp(40, lv)).toMatchObject({ level: 2, expInLevel: 0 });
    expect(levelForExp(145, lv).level).toBe(2);
    expect(levelForExp(146, lv).level).toBe(3);
    expect(levelForExp(333, lv).level).toBe(4);
    expect(levelForExp(10_000_000, lv)).toMatchObject({ level: 30, expToNext: undefined });
  });

  it('hết Prologue (~25 EXP) và Stage 1 (~350 EXP) thì chạm cấp 4 với 4 SP (đặc tả mục 6)', () => {
    const level = levelForExp(25 + 350, lv).level;
    expect(level).toBe(4);
    expect(skillPoints(level, 1, lv)).toBe(4);
  });

  it('chỉ số theo cấp: cấp 1 = 100 máu, công ×1; cấp 30 = 216 máu, công ×1,725', () => {
    expect(levelStats(1, lv)).toEqual({ maxHp: 100, attackMul: 1 });
    const top = levelStats(30, lv);
    expect(top.maxHp).toBe(216);
    expect(top.attackMul).toBeCloseTo(1.725, 9);
  });

  it('đồng bộ cấp: Stage 1 (khuyến nghị 2–4) kẹp trong 1–6; tắt hoặc ngoài chiến dịch thì cấp thật', () => {
    const range = parseLevelRange(stage1.recommendedLevel);
    expect([1, 3, 6, 9].map((l) => syncLevel(l, range, sync))).toEqual([1, 3, 6, 6]);
    expect(syncLevel(9, range, { ...sync, enabled: false })).toBe(9);
    expect(syncLevel(9, undefined, sync)).toBe(9);
    expect(syncLevel(1, [8, 12], sync)).toBe(6);
  });

  it('dữ liệu vượt trần sức mạnh cốt truyện hoặc EXP lên cấp không dương thì báo lỗi lúc nạp', () => {
    const player = (patch: (l: Record<string, unknown>) => void) => {
      const p = structuredClone(data.player) as { level: Record<string, unknown> };
      patch(p.level);
      return { ...data, player: p };
    };
    expect(() => parseGameConfig(player((l) => (l.hp = '100+10*(L-1)')))).toThrow(/trần 2.5/);
    expect(() => parseGameConfig(player((l) => (l.atk = '10+1*(L-1)')))).toThrow(/trần 2.2/);
    expect(() => parseGameConfig(player((l) => (l.expFormula = '40-2*L')))).toThrow(/phải ≥ 1/);
  });
});

describe('LevelTracker và SP', () => {
  it('báo lên cấp một lần, nhảy được nhiều cấp trong một bước', () => {
    const t = new LevelTracker(lv, 30);
    expect(t.startLevel).toBe(1);
    expect(t.update(5)).toBeUndefined();
    expect(t.update(10)).toEqual({ from: 1, to: 2 });
    expect(t.update(10)).toBeUndefined();
    expect(t.update(320)).toEqual({ from: 2, to: 4 });
    expect(t.info.level).toBe(4);
  });

  it('SP từ bản lưu: chỉ tính boss chiến dịch, không tính boss xám hay bản ghi trùng', () => {
    const story = new Set(config.stages.stages.map((s) => s.boss));
    expect(characterProgress(146, ['gray', 'thorna', 'thorna'], story, lv)).toEqual({
      level: 3,
      skillPoints: 3,
    });
  });
});

describe('cấp trong trận', () => {
  const world = (level?: number) =>
    new StageWorld({
      layout: buildStageLayout(STAGE_DEFS.thorna, TILE_SIZE),
      tileSize: TILE_SIZE,
      stepSec: FIXED_STEP_MS / 1000,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.thorna!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      seed: 1,
      mechanics: config.stages.mechanics,
      ...(level === undefined ? {} : { level }),
    });

  it('vào màn ở cấp hiệu dụng: máu tối đa theo cấp; không truyền cấp thì cấp 1', () => {
    expect(world().player.maxHp).toBe(100);
    expect(world(6).player.maxHp).toBe(120);
  });

  it('lên cấp giữa màn: máu tối đa và máu hiện tại cùng tăng phần chênh', () => {
    const w = world();
    w.player.hp = 50;
    w.setLevel(4);
    expect(w.level).toBe(4);
    expect(w.player.maxHp).toBe(112);
    expect(w.player.hp).toBe(62);
  });

  it('màn thử thuộc Stage 1 đều trỏ đúng id màn chiến dịch trong stages.json', () => {
    const ids = new Set(config.stages.stages.map((s) => s.id));
    for (const def of Object.values(STAGE_DEFS))
      if (def.campaign !== undefined) expect(ids.has(def.campaign)).toBe(true);
    expect(STAGE_DEFS.thorna.campaign).toBe(stage1.id);
    expect(STAGE_DEFS.gray.campaign).toBeUndefined();
  });
});

describe('màn Kết quả có lên cấp', () => {
  it('EXP kèm cấp cũ → mới, dòng Lên cấp kèm SP; chỉ SP (boss) khi không lên cấp', () => {
    const run = { elapsedSec: 90, deaths: 1, exp: 120, coreBits: 80, secrets: [] };
    const base = {
      stageName: 'Phòng boss',
      savedCoreBits: 0,
      newWeapon: 'Vine Lash',
      reminders: [],
    };
    const up = buildStageResult(run, { ...base, level: { from: 2, to: 3, spGained: 2 } });
    expect(up.stats[2]).toEqual({ label: 'EXP', value: '+120 (cấp 2 → 3)' });
    expect(up.rewards).toEqual(['Vũ khí mới: Vine Lash', 'Lên cấp 3! +2 SP']);
    const boss = buildStageResult(run, { ...base, level: { from: 3, to: 3, spGained: 1 } });
    expect(boss.stats[2]?.value).toBe('+120');
    expect(boss.rewards).toEqual(['Vũ khí mới: Vine Lash', '+1 SP']);
  });
});
