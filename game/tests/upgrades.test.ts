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
import { decodeSaveCode, encodeSaveCode } from '@/logic/save/save-code';
import {
  addRewards,
  defaultSave,
  parseSave,
  SAVE_VERSION,
  setInventory,
} from '@/logic/save/save-data';
import {
  chainNormalizers,
  MemorySaveStore,
  SaveManager,
  type SaveStore,
} from '@/logic/save/save-manager';
import { normalizeUpgrades, upgradeNormalizer } from '@/logic/shop/normalize-upgrades';
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

describe('bản lưu 3, chuẩn hóa, giao dịch nguyên tử (ST-09-02)', () => {
  it('bản 2 đọc lên thành bản 3: upgrades trống, giữ Core Bit; cấp sai kiểu bị bỏ', () => {
    const s = parseSave({ version: 2, inventory: { coreBits: 900 } });
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.inventory).toEqual({ coreBits: 900, upgrades: {} });
    const bad = parseSave({
      version: 3,
      inventory: { coreBits: 5, upgrades: { arc_core: 2, energy_cell: -1, x: 'a' } },
    });
    expect(bad.inventory.upgrades).toEqual({ arc_core: 2 });
  });

  it('chuẩn hóa: kẹp cấp vượt tối đa và hoàn tiền phần dư; bỏ id lạ; hợp lệ thì giữ nguyên', () => {
    const save = setInventory(defaultSave(), { arc_core: 7, laser: 2, magnet_range: 1 }, 10);
    const r = normalizeUpgrades(save, shop);
    // Cấp 6, 7 theo công thức giá: round(400 × 1,25^5) + round(400 × 1,25^6).
    expect(r.save.inventory).toEqual({
      coreBits: 10 + 1221 + 1526,
      upgrades: { arc_core: 5, magnet_range: 1 },
    });
    expect(r.notice).toMatch(/hoàn 2747 Core Bit/);
    expect(r.notice).toMatch(/không còn trong dữ liệu/);
    expect(normalizeUpgrades(r.save, shop)).toEqual({ save: r.save, notice: undefined });
    const combined = chainNormalizers(upgradeNormalizer(shop), (s) => ({ save: s, notice: 'B.' }));
    expect(combined(save).notice).toMatch(/Core Bit\..* B\.$/);
  });

  it('mã sao lưu giữ cấp Upgrade', () => {
    const s = setInventory(defaultSave(), { arc_core: 2, energy_cell: 1 }, 125);
    expect(decodeSaveCode(encodeSaveCode(s)).inventory).toEqual(s.inventory);
  });

  it('ghi được: tiền đã trừ và cấp mới nằm trong cùng một lần ghi', async () => {
    const store = new MemorySaveStore();
    const m = await SaveManager.open(store, () => 5);
    m.update((s) => addRewards(s, { coreBits: 525 }));
    await m.flush();
    const writes = store.writes;
    const buy = buyUpgrade(
      shop,
      m.data.inventory.upgrades,
      m.data.inventory.coreBits,
      'arc_core',
      2,
    );
    if (!buy.ok) throw new Error('phải mua được');
    const r = await m.transact((s) => setInventory(s, buy.levels, buy.coreBits));
    expect(r).toEqual({ ok: true, changed: true });
    expect(store.writes).toBe(writes + 1);
    expect(JSON.parse(store.text!).inventory).toEqual({ coreBits: 125, upgrades: { arc_core: 1 } });
    expect(await m.transact((s) => s)).toEqual({ ok: true, changed: false });
  });

  it('ghi lỗi: báo lỗi, hoàn tác tiền và cấp trong bộ nhớ, revision không tăng', async () => {
    let fail = false;
    let text: string | null = null;
    const store: SaveStore = {
      read: () => Promise.resolve(text),
      write: (t) => {
        if (fail) return Promise.reject(new Error('mất kết nối kho'));
        text = t;
        return Promise.resolve();
      },
    };
    const m = await SaveManager.open(store);
    m.update((s) => addRewards(s, { coreBits: 525 }));
    await m.flush();
    const before = m.data;
    fail = true;
    const r = await m.transact((s) => setInventory(s, { arc_core: 1 }, 125));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/mất kết nối kho/);
    expect(m.data).toBe(before);
    expect(m.data.inventory).toEqual({ coreBits: 525, upgrades: {} });
    expect(JSON.parse(text!).inventory.coreBits).toBe(525);
    // Kho chạy lại: mua lại được, revision tiếp nối bản đã ghi.
    fail = false;
    expect(await m.transact((s) => setInventory(s, { arc_core: 1 }, 125))).toEqual({
      ok: true,
      changed: true,
    });
    expect(m.data.revision).toBe(before.revision + 1);
  });

  it('bản lưu chỉ đọc: giao dịch bị từ chối', async () => {
    const m = await SaveManager.open(new MemorySaveStore(JSON.stringify({ version: 99 })));
    const r = await m.transact((s) => setInventory(s, { arc_core: 1 }, 0));
    expect(r.ok).toBe(false);
  });
});
