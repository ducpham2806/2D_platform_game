import { describe, expect, it } from 'vitest';
import { parseGameConfig } from '@/core/game-config';
import { buildShop, stageIncome } from '@/logic/shop/shop-model';
import { buyUpgrade } from '@/logic/shop/upgrades';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const card = (m: ReturnType<typeof buildShop>, id: string) => m.cards.find((c) => c.id === id)!;

describe('mô hình Quầy Mira, tab Upgrade (ST-09-04)', () => {
  it('1 boss: quầy khóa, mọi thẻ khóa "sau 2 boss"', () => {
    const m = buildShop(config, { levels: {}, coreBits: 900, bosses: 1 });
    expect(m.open).toBe(false);
    expect(m.openAfterBosses).toBe(2);
    expect(m.cards.map((c) => c.state)).toEqual(Array(7).fill('locked'));
    expect(card(m, 'arc_core').unlockAfterBosses).toBe(2);
    expect(card(m, 'dash_coil').unlockAfterBosses).toBe(5);
  });

  it('2 boss: thẻ mua được, thiếu tiền (ghi số thiếu), khóa (Booster Slot sau 5 boss)', () => {
    const m = buildShop(config, { levels: {}, coreBits: 300, bosses: 2 });
    expect(m.open).toBe(true);
    expect(card(m, 'arc_core')).toMatchObject({ state: 'funds', nextCost: 400, missing: 100 });
    expect(card(m, 'energy_cell')).toMatchObject({ state: 'buyable', nextCost: 250, missing: 0 });
    expect(card(m, 'magnet_range')).toMatchObject({ state: 'buyable', nextCost: 200 });
    expect(card(m, 'booster_slot')).toMatchObject({ state: 'locked', unlockAfterBosses: 5 });
    const rich = buildShop(config, { levels: {}, coreBits: 525, bosses: 2 });
    expect(card(rich, 'arc_core').state).toBe('buyable');
  });

  it('sau khi mua Arc Core cấp 1 còn 125: Energy Cell (250) thiếu 125; gỡ hoàn 400', () => {
    const buy = buyUpgrade(config.shop, {}, 525, 'arc_core', 2);
    if (!buy.ok) throw new Error('phải mua được');
    const m = buildShop(config, { levels: buy.levels, coreBits: buy.coreBits, bosses: 2 });
    expect(m.coreBits).toBe(125);
    expect(card(m, 'arc_core')).toMatchObject({ level: 1, refund: 400, nextCost: 500 });
    expect(card(m, 'energy_cell')).toMatchObject({ state: 'funds', missing: 125 });
    expect(card(m, 'energy_cell').refund).toBeUndefined();
  });

  it('cấp 2 ở mốc 2 boss: thẻ khóa tới 5 boss; đủ cấp thì "maxed"', () => {
    const m = buildShop(config, {
      levels: { arc_core: 2, booster_slot: 1 },
      coreBits: 9999,
      bosses: 2,
    });
    expect(card(m, 'arc_core')).toMatchObject({ state: 'locked', unlockAfterBosses: 5 });
    expect(card(m, 'booster_slot')).toMatchObject({ state: 'maxed', nextCost: undefined });
  });

  it('gợi ý thu nhập theo màn kế tiếp, độ khó Thường (kinh tế mục 2)', () => {
    expect(stageIncome(config, 1)).toBe(225);
    expect(stageIncome(config, 3)).toBe(375);
    expect(stageIncome(config, 3, 'story')).toBe(188);
    const m = buildShop(config, { levels: {}, coreBits: 0, bosses: 2 });
    expect(m.income).toEqual({ stage: 3, name: config.stages.stages[2]!.name, coreBits: 375 });
    // Đã hạ cả 8 boss: gợi ý màn cuối.
    expect(buildShop(config, { levels: {}, coreBits: 0, bosses: 8 }).income.stage).toBe(8);
  });
});
