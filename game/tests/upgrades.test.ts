import { describe, expect, it } from 'vitest';
import { parseGameConfig } from '@/core/game-config';
import { parseEconomy, parseShop } from '@/core/shop-config';
import {
  bossesForLevel,
  buyUpgrade,
  levelCap,
  refundUpgrade,
  shopOpen,
  storyBossCount,
  upgradeCost,
} from '@/logic/shop/upgrades';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);
const shop = config.shop;
const arc = shop.upgrades.arc_core!;

type RawShop = {
  upgrades: Record<string, unknown>[];
  unlockSchedule: { afterBosses: number; maxLevel: Record<string, number> }[];
};
const raw = (): RawShop => structuredClone(data.shop) as RawShop;

describe('dữ liệu Upgrade (shop.json, ST-09-01)', () => {
  it('giá cấp n = round(gốc × 1,25^(n−1)); Arc Core 5 cấp tổng 3.283 (kinh tế mục 3)', () => {
    const costs = [1, 2, 3, 4, 5].map((n) => upgradeCost(arc, n));
    expect(costs).toEqual([400, 500, 625, 781, 977]);
    expect(costs.reduce((a, b) => a + b, 0)).toBe(3283);
  });

  it('trường số mới có và được đọc', () => {
    expect(shop.upgrades.energy_cell?.energyMaxPerLevel).toBe(0.1);
    expect(shop.upgrades.magnet_range?.magnetTilesPerLevel).toBe(1);
    expect(config.enemies.rules.pickups.magnetSpeedTilesPerSec).toBe(12);
    for (const [id, field] of [
      ['energy_cell', 'energyMaxPerLevel'],
      ['magnet_range', 'magnetTilesPerLevel'],
    ] as const) {
      const r = raw();
      delete r.upgrades.find((u) => u.id === id)![field];
      expect(() => parseShop(r)).toThrow(field);
    }
  });

  it('lịch hỏng bị từ chối khi nạp', () => {
    const cases: [string, (r: RawShop) => void][] = [
      ['lớn hơn mốc trước', (r) => (r.unlockSchedule[1]!.afterBosses = 2)],
      ['cần số nguyên từ 1 tới 3', (r) => (r.unlockSchedule[0]!.maxLevel.magnet_range = 4)],
      ['không được thấp hơn', (r) => (r.unlockSchedule[1]!.maxLevel.arc_core = 1)],
      ['Upgrade lạ', (r) => (r.unlockSchedule[0]!.maxLevel.laser = 1)],
      ['mốc cuối phải mở arc_core tới cấp 5', (r) => (r.unlockSchedule[2]!.maxLevel.arc_core = 4)],
      ['ít nhất một mốc', (r) => (r.unlockSchedule = [])],
    ];
    for (const [msg, edit] of cases) {
      const r = raw();
      edit(r);
      expect(() => parseShop(r), msg).toThrow(msg);
    }
  });

  it('công thức thu theo màn được kiểm tra', () => {
    expect(parseEconomy(data.economy).incomeFormula).toBe('225 + 75*(stage-1)');
    expect(() => parseEconomy({ incomeFormula: '225 + x' })).toThrow('incomeFormula');
    expect(() => parseEconomy({ incomeFormula: '-10*stage' })).toThrow('cần số ≥ 0');
  });
});

describe('mở hàng theo boss, mua, gỡ (ST-09-01)', () => {
  const story = new Set(config.stages.stages.map((s) => s.boss));

  it('chỉ đếm boss chiến dịch, không đếm trùng', () => {
    expect(storyBossCount(['thorna', 'bramble_golem', 'thorna', 'lumen'], story)).toBe(2);
  });

  it('quầy mở sau 2 boss; cấp mở: 2 boss → 2, 5 boss → 3, 8 boss → tối đa', () => {
    expect(shopOpen(shop, 1)).toBe(false);
    expect(shopOpen(shop, 2)).toBe(true);
    expect(levelCap(shop, 'arc_core', 1)).toBe(0);
    expect(levelCap(shop, 'arc_core', 2)).toBe(2);
    expect(levelCap(shop, 'arc_core', 4)).toBe(2);
    expect(levelCap(shop, 'arc_core', 5)).toBe(3);
    expect(levelCap(shop, 'arc_core', 8)).toBe(5);
    expect(levelCap(shop, 'dash_coil', 2)).toBe(0);
    expect(levelCap(shop, 'dash_coil', 5)).toBe(3);
    expect(levelCap(shop, 'nano_cell_cap', 8)).toBe(4);
    expect(bossesForLevel(shop, 'arc_core', 3)).toBe(5);
    expect(bossesForLevel(shop, 'arc_core', 4)).toBe(8);
    expect(bossesForLevel(shop, 'booster_slot', 1)).toBe(5);
    expect(bossesForLevel(shop, 'arc_core', 6)).toBeUndefined();
  });

  it('mua trừ đúng giá và tăng một cấp; từ chối khi thiếu tiền, khóa, đủ cấp, id lạ', () => {
    const first = buyUpgrade(shop, {}, 525, 'arc_core', 2);
    expect(first).toEqual({
      ok: true,
      levels: { arc_core: 1 },
      coreBits: 125,
      amount: 400,
      level: 1,
    });
    expect(buyUpgrade(shop, { arc_core: 1 }, 499, 'arc_core', 2)).toEqual({
      ok: false,
      reason: 'funds',
    });
    expect(buyUpgrade(shop, { arc_core: 2 }, 9999, 'arc_core', 2)).toEqual({
      ok: false,
      reason: 'locked',
    });
    expect(buyUpgrade(shop, {}, 9999, 'dash_coil', 4)).toEqual({ ok: false, reason: 'locked' });
    expect(buyUpgrade(shop, { arc_core: 5 }, 9999, 'arc_core', 8)).toEqual({
      ok: false,
      reason: 'maxed',
    });
    expect(buyUpgrade(shop, {}, 9999, 'laser', 8)).toEqual({ ok: false, reason: 'unknown' });
    // Đủ tiền đúng bằng giá thì mua được, còn 0.
    const exact = buyUpgrade(shop, { arc_core: 1 }, 500, 'arc_core', 2);
    expect(exact.ok && exact.coreBits).toBe(0);
  });

  it('gỡ hoàn 100% giá cấp cao nhất; mua rồi gỡ trả lại đúng như cũ', () => {
    const levels = { arc_core: 2, magnet_range: 1 };
    const back = refundUpgrade(shop, levels, 10, 'arc_core');
    expect(back).toEqual({
      ok: true,
      levels: { arc_core: 1, magnet_range: 1 },
      coreBits: 510,
      amount: 500,
      level: 1,
    });
    const gone = refundUpgrade(shop, { magnet_range: 1 }, 0, 'magnet_range');
    expect(gone.ok && gone.levels).toEqual({});
    expect(refundUpgrade(shop, {}, 0, 'arc_core')).toEqual({ ok: false, reason: 'none' });
    expect(refundUpgrade(shop, { laser: 1 }, 0, 'laser')).toEqual({
      ok: false,
      reason: 'unknown',
    });
    const bought = buyUpgrade(shop, {}, 777, 'energy_cell', 2);
    if (!bought.ok) throw new Error('phải mua được');
    expect(refundUpgrade(shop, bought.levels, bought.coreBits, 'energy_cell')).toMatchObject({
      levels: {},
      coreBits: 777,
    });
  });
});
