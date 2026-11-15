/**
 * Dữ liệu Stage 2–4 dùng chung và khung kiểm tra (EP-15 ST-15-01a; 01-GDD/16-Dac-ta-Stage2-4-nhap.md
 * mục 2.1–2.3, 3.3, 3.7). Số lấy từ dữ liệu; số chỉ có trong GDD (kẻ địch Stage 2 chưa có dữ liệu)
 * ghi kèm mục.
 */
import { describe, expect, it } from 'vitest';
import { bossDamageCap, bossMaxDamage } from '@/core/boss-config';
import { checkDesignInvariants, parseGameConfig, parseStages } from '@/core/game-config';
import {
  checkWeaponBalance,
  counterPerSec,
  energyBudget,
  parseWeapons,
} from '@/core/weapons-config';
import { WeaponLoadout } from '@/logic/combat/loadout';
import { TILE_SIZE } from '@/core/constants';
import { levelForExp } from '@/logic/rpg/progression';
import type { PlayerPhysics } from '@/logic/player/player-physics';
import { EnemyField } from '@/logic/world/enemy-field';
import { TileMap } from '@/logic/tilemap';
import {
  checkStageExp,
  enemyReward,
  type StageReward,
  stageExpTotal,
} from '@/logic/stage/stage-exp';
import { loadData } from './helpers';

type Json = Record<string, unknown>;
const data = loadData() as Record<string, Json> & { stages: Json; weapons: Json };
const config = parseGameConfig(data);
const stage = (i: number) => config.stages.stages.find((s) => s.index === i)!;
const diff = (id: string) => config.difficulties.find((d) => d.id === id)!;
const weapon = (name: string) => config.weapons.bossWeapons.find((w) => w.name === name)!;
const MAP = TileMap.fromRows(
  [
    '#....................#',
    '#....................#',
    '#....................#',
    '#....................#',
    '######################',
  ],
  TILE_SIZE,
);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
/** Lỗi kiểm lúc nạp sau khi sửa một file dữ liệu. */
function invariantsWith(file: string, patch: (raw: Json) => void): string[] {
  const raw = clone(data);
  patch(raw[file] as Json);
  try {
    return checkDesignInvariants(parseGameConfig(raw));
  } catch (e) {
    return [(e as Error).message];
  }
}

describe('thưởng theo màn (GDD 16 mục 2.1)', () => {
  it('expBudget, enemyRewardMul Stage 1–4 theo bảng', () => {
    expect([1, 2, 3, 4].map((i) => stage(i).expBudget)).toEqual([332, 660, 1101, 1602]);
    expect([1, 2, 3, 4].map((i) => stage(i).enemyRewardMul)).toEqual([
      { exp: 1, coreBit: 1 },
      { exp: 1.8, coreBit: 1.8 },
      { exp: 3, coreBit: 1.9 },
      { exp: 4, coreBit: 2 },
    ]);
    expect(stage(5).expBudget).toBeUndefined();
  });

  it('cộng dồn expBudget ra cấp 4 / 6 / 8 / 10, trong cấp khuyến nghị màn kế', () => {
    let total = 0;
    const levels = [1, 2, 3, 4].map((i) => {
      total += stage(i).expBudget!;
      return levelForExp(total, config.player.level).level;
    });
    expect(levels).toEqual([4, 6, 8, 10]);
    expect(checkDesignInvariants(config)).toEqual([]);
    // Stage 2 cho quá nhiều EXP: cộng dồn vượt cấp khuyến nghị Stage 3 (5–8).
    const errors = invariantsWith('stages', (s) => {
      ((s.stages as Json[])[1] as Json).expBudget = 3000;
    });
    expect(errors.join('\n')).toMatch(
      /prism_institute\.expBudget: cộng dồn .* ngoài cấp khuyến nghị màn 3/,
    );
  });

  it('thưởng kẻ địch: một lần làm tròn trên tích hệ số màn × độ khó, base > 0 thì ít nhất 1', () => {
    const ken = config.enemies.enemies.linh_ken!;
    expect([ken.exp, ken.coreBit]).toEqual([14, 6]);
    const s2 = stage(2).enemyRewardMul!;
    const s4 = stage(4).enemyRewardMul!;
    const s1 = stage(1).enemyRewardMul!;
    const story = diff('story').rewardMul;
    const normal = diff('normal').rewardMul;
    const challenge = diff('challenge').rewardMul;
    // Bảng giá trị biên mục 2.1.
    expect([
      enemyReward(ken.exp, s1.exp, story),
      enemyReward(ken.coreBit, s1.coreBit, story),
    ]).toEqual([7, 3]);
    expect([
      enemyReward(ken.exp, s2.exp, normal),
      enemyReward(ken.coreBit, s2.coreBit, normal),
    ]).toEqual([25, 11]);
    expect([
      enemyReward(ken.exp, s4.exp, challenge),
      enemyReward(ken.coreBit, s4.coreBit, challenge),
    ]).toEqual([84, 18]);
    expect(enemyReward(0, 4, 1.5)).toBe(0);
    expect(enemyReward(1, 1, 0.1)).toBe(1);
  });

  it('Σ EXP Stage 2 (bảng 3.4, làm tròn từng con) + Prism Sentinel 110 + Lumen 241 = expBudget 660', () => {
    const buom = config.enemies.enemies.buom_sat!.exp;
    const ken = config.enemies.enemies.linh_ken!.exp;
    // Gương Quang (6 EXP) và Tháp Laser (10) chưa có dữ liệu (ST-15-06, 07): số ở GDD 16 mục 3.4.
    const enemies = [
      { exp: 6, count: 8 },
      { exp: 10, count: 5 },
      { exp: buom, count: 4 },
      { exp: ken, count: 3 },
    ];
    const mul = stage(2).enemyRewardMul!.exp;
    expect(enemies.map((e) => enemyReward(e.exp, mul, 1))).toEqual([11, 18, 14, 25]);
    const total = stageExpTotal(enemies, mul, 110, 241);
    expect(total).toBe(660);
    expect(checkStageExp('prism_institute', total, stage(2).expBudget!)).toEqual([]);
    // Lệch > 5% (bỏ 3 Lính Kén) thì báo lỗi; trong 5% thì đạt.
    expect(checkStageExp('prism_institute', 660 - 75, 660)[0]).toMatch(/lệch expBudget 660 11\.4%/);
    expect(checkStageExp('prism_institute', 660 - 25, 660)).toEqual([]);
  });

  it('EnemyField nhân hệ số màn cho kẻ địch thường, mini-boss của màn không nhân', () => {
    expect(stage(1).enemyRewardMul).toEqual({ exp: 1, coreBit: 1 });
    const kill = (id: string, stageReward?: StageReward) => {
      const field = new EnemyField(
        config.enemies,
        MAP,
        [{ enemy: id, col: 10, row: 3, harmless: false }],
        1,
        () => 1,
        3,
        1,
        false,
        stageReward,
      );
      // onKilled chỉ đọc máu Kai (rơi viên máu khi chưa đầy).
      const player = { hp: 100, maxHp: 100 } as PlayerPhysics;
      field.onKilled(field.enemies, player);
      return field.exp;
    };
    const reward: StageReward = { mul: { exp: 3, coreBit: 1.9 }, exempt: ['bramble_golem'] };
    const ken = config.enemies.enemies.linh_ken!.exp;
    const golem = config.enemies.enemies.bramble_golem!.exp;
    expect(kill('linh_ken')).toBe(ken);
    expect(kill('linh_ken', reward)).toBe(ken * 3);
    expect(kill('bramble_golem', reward)).toBe(golem);
  });

  it('kiểm dữ liệu expBudget, enemyRewardMul', () => {
    const bad = (patch: Json) => {
      const raw = clone(data.stages);
      Object.assign((raw.stages as Json[])[1] as Json, patch);
      return () => parseStages(raw);
    };
    expect(bad({ expBudget: 0 })).toThrow(/expBudget/);
    expect(bad({ enemyRewardMul: { exp: 0, coreBit: 1 } })).toThrow(/enemyRewardMul\.exp/);
    expect(bad({ enemyRewardMul: { exp: 1 } })).toThrow(/enemyRewardMul\.coreBit/);
    // Màn sau có expBudget mà màn trước thiếu.
    const errors = invariantsWith('stages', (s) => {
      delete ((s.stages as Json[])[0] as Json).expBudget;
    });
    expect(errors.join('\n')).toMatch(/stages\.stages\[0\]: màn đã có đặc tả cần expBudget/);
    // Màn chưa có đặc tả (không `expectedMin`) mà màn sau đã có expBudget: báo thiếu.
    const gap = invariantsWith('stages', (s) => {
      const st = (s.stages as Json[])[4] as Json;
      st.expBudget = 2000;
      st.enemyRewardMul = { exp: 5, coreBit: 2 };
      delete ((s.stages as Json[])[3] as Json).expectedMin;
      delete ((s.stages as Json[])[3] as Json).expBudget;
    });
    expect(gap.join('\n')).toMatch(/cirrus_tower\.expBudget: thiếu|expBudget: thiếu/);
  });
});

describe('cơ chế laser, gương, cảm biến (GDD 16 mục 3.3)', () => {
  it('nạp đúng số', () => {
    const m = config.stages.mechanics;
    expect(m.laser).toMatchObject({
      damage: 20,
      beamWidthPx: 4,
      knockbackTilesPerSec: 5,
      hitsPerActivation: 1,
      hurtsEnemies: false,
      pulse: { periodSec: 3, onSec: 1.2, warnSec: 0.5 },
    });
    expect(m.mirror).toEqual({ toggleMinCharge: 'mid', rotateSec: 0.25, maxBounces: 4 });
    expect(m.sensor).toEqual({ holdSec: 0.3 });
  });

  it('kiểm dữ liệu: báo trước ≥ 0,5 s, còn khoảng tắt, đạn thường không đổi gương, laser không chết một đòn', () => {
    const bad = (path: string, value: unknown) => {
      const raw = clone(data.stages);
      const keys = path.split('.');
      let o = raw.mechanics as Json;
      for (const k of keys.slice(0, -1)) o = o[k] as Json;
      o[keys.at(-1)!] = value;
      return () => parseStages(raw);
    };
    expect(bad('laser.pulse.warnSec', 0.3)).toThrow(/báo trước 0.3 s < 0.5 s/);
    expect(bad('laser.pulse.onSec', 2.6)).toThrow(/phải ngắn hơn chu kỳ/);
    expect(bad('laser.hitsPerActivation', 1.5)).toThrow(/số nguyên/);
    expect(bad('laser.hurtsEnemies', 'no')).toThrow(/true\/false/);
    expect(bad('mirror.toggleMinCharge', 'shot')).toThrow(/đạn thường không được đổi góc gương/);
    expect(bad('mirror.toggleMinCharge', 'big')).toThrow(/cần một trong/);
    expect(bad('sensor.holdSec', -1)).toThrow(/sensor\.holdSec/);
    const errors = invariantsWith('stages', (s) => {
      ((s.mechanics as Json).laser as Json).damage = 100;
    });
    expect(errors.join('\n')).toMatch(/mechanics\.laser\.damage: 100 giết ngay/);
  });
});

describe('vũ khí Warden: ngân sách năng lượng, sức mạnh khắc chế (GDD 16 mục 2.3)', () => {
  it('Vine Lash 14 và 14,3/s; Prism Beam 13,5 và 12,5/s', () => {
    const max = config.weapons.energyMax;
    expect(energyBudget(weapon('Vine Lash'), max)).toBe(14);
    expect(counterPerSec(weapon('Vine Lash'))).toBeCloseTo(14.29, 2);
    expect(energyBudget(weapon('Prism Beam'), max)).toBe(13.5);
    expect(counterPerSec(weapon('Prism Beam'))).toBeCloseTo(12.5, 6);
    expect(energyBudget(weapon('Frost Shard'), max)).toBeUndefined();
    expect(checkWeaponBalance(config.weapons)).toEqual([]);
  });

  it('Prism Beam cooldownSec 0,45 (bản 1 của GDD) thì báo lỗi sức mạnh khắc chế', () => {
    const raw = clone(data.weapons);
    const beam = (raw.bossWeapons as Json[]).find((w) => w.name === 'Prism Beam')!;
    (beam.behavior as Json).cooldownSec = 0.45;
    expect(checkWeaponBalance(parseWeapons(raw)).join('\n')).toMatch(
      /Prism Beam: sức mạnh khắc chế 8\.3\/s < 12\/s/,
    );
    // Tiêu hao 2 (14 lần × 1,5 = 21): vượt ngân sách 14 ± 15%.
    (beam.behavior as Json).cooldownSec = 0.3;
    beam.energyCostOf28 = 2;
    expect(checkWeaponBalance(parseWeapons(raw)).join('\n')).toMatch(/Prism Beam: ngân sách 21/);
  });

  it('kiểm dữ liệu beam và balance', () => {
    const raw = clone(data.weapons);
    const beam = (raw.bossWeapons as Json[]).find((w) => w.name === 'Prism Beam')!;
    (beam.behavior as Json).maxBounces = 1.5;
    expect(() => parseWeapons(raw)).toThrow(/maxBounces: cần số nguyên/);
    const raw2 = clone(data.weapons);
    (raw2.balance as Json).budgetTolerance = 1.2;
    expect(() => parseWeapons(raw2)).toThrow(/budgetTolerance/);
    const raw3 = clone(data.weapons);
    delete raw3.balance;
    expect(() => parseWeapons(raw3)).toThrow(/weapons\.balance/);
  });

  it('Prism Beam chưa có hành vi (ST-15-03): Loadout không cấp; Vine Lash vẫn cấp', () => {
    const loadout = new WeaponLoadout(config.weapons, TILE_SIZE);
    expect(loadout.grant('Prism Beam')).toBe(false);
    expect(loadout.has('Prism Beam')).toBe(false);
    expect(loadout.grant('Vine Lash')).toBe(true);
  });
});

describe('trần sát thương boss theo màn (GDD 16 mục 2.2)', () => {
  it('18 / 20 / 22 / 24; Thorna (cả Thử thách) không quá 18', () => {
    const rules = config.bosses.thorna!.rules;
    expect([1, 2, 3, 4].map((i) => bossDamageCap(rules, i))).toEqual([18, 20, 22, 24]);
    expect(bossMaxDamage(config.bosses.thorna!)).toBeLessThanOrEqual(18);
    expect(bossMaxDamage(config.bossesChallenge.thorna!)).toBeLessThanOrEqual(18);
  });

  it('đòn Thorna 19 thì báo lỗi; bản Thử thách cũng bị kiểm', () => {
    const base = invariantsWith('bosses', (b) => {
      (((b.thorna as Json).attacks as Json).lash as Json).damage = 19;
    });
    expect(base.join('\n')).toMatch(/bosses\.thorna: đòn 19 vượt trần 18 của màn 1/);
    const challenge = invariantsWith('bosses', (b) => {
      (b.thorna as Json).challenge = {
        ...((b.thorna as Json).challenge as Json),
        contactDamage: 25,
      };
    });
    expect(challenge.join('\n')).toMatch(/bosses\.thorna\.challenge: đòn 25 vượt trần 18/);
  });
});
