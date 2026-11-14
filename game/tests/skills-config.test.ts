import { describe, expect, it } from 'vitest';
import { parseGameConfig } from '@/core/game-config';
import { parseShop } from '@/core/shop-config';
import { checkRankRules, effectReward, parseSkills, type SkillNode } from '@/core/skills-config';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);

type RawNode = { id: string; tier: number; ranks: Record<string, unknown>[] };
type RawSkills = { rules: Record<string, unknown>; branches: { nodes: RawNode[] }[] };
const raw = (): RawSkills => structuredClone(data.skills) as RawSkills;
const node = (r: RawSkills, id: string): RawNode =>
  r.branches.flatMap((b) => b.nodes).find((n) => n.id === id)!;

describe('dữ liệu cây kỹ năng (skills.json)', () => {
  it('3 nhánh × 3 nút, tầng k có k bậc, tổng 18 bậc (GDD 10 mục 2.1)', () => {
    const s = config.skills;
    expect(s.branches.map((b) => b.id)).toEqual(['vanguard', 'phantom', 'core']);
    expect(s.branches.map((b) => b.nodes.map((n) => `${n.id}:${n.ranks.length}`))).toEqual([
      ['V1:1', 'V2:2', 'V3:3'],
      ['P1:1', 'P2:2', 'P3:3'],
      ['C1:1', 'C2:2', 'C3:3'],
    ]);
    expect(s.totalRanks).toBe(18);
    expect(s.nodes.V1?.ranks[0]?.effects).toEqual({ fullChargeTimeMul: 0.85 });
  });

  it('phần thưởng: càng nhỏ càng mạnh với hệ số thời gian; hồi khiên dùng nghịch đảo', () => {
    expect(effectReward('fullChargeTimeMul', 0.85)).toBeCloseTo(0.15, 9);
    expect(effectReward('punishMul', 1.3)).toBeCloseTo(0.3, 9);
    expect(effectReward('shieldRechargeSec', 20)).toBeCloseTo(0.05, 9);
  });

  it('luật bậc: bậc sau phải mạnh hơn ≥ 20% hoặc thêm hiệu ứng; bậc 1 tầng 3 ≥ 60%', () => {
    const mk = (tier: number, ranks: Record<string, number>[]): SkillNode => ({
      id: 'X',
      branch: 'b',
      tier,
      name: 'x',
      desc: 'x',
      ranks: ranks.map((effects) => ({ effects, text: 't' })),
    });
    expect(checkRankRules(mk(2, [{ punishMul: 1.3 }, { punishMul: 1.35 }]))).toEqual([
      'skills: nút X bậc 2: phải tăng phần thưởng ≥ 20% hoặc thêm hiệu ứng mới',
    ]);
    expect(
      checkRankRules(mk(2, [{ punishMul: 1.3 }, { punishMul: 1.3, grazeChargeSec: 0.1 }])),
    ).toEqual([]);
    expect(
      checkRankRules(mk(2, [{ punishMul: 1.5 }, { punishMul: 1.3, grazeChargeSec: 0.1 }]))[0],
    ).toMatch(/yếu hơn/);
    const weakFirst = checkRankRules(
      mk(3, [{ punishMul: 1.2 }, { punishMul: 1.4 }, { punishMul: 1.6 }]),
    );
    expect(weakFirst[0]).toMatch(/33% hiệu lực tối đa/);
  });

  it('dữ liệu sai thì báo lỗi lúc nạp', () => {
    const bad = (patch: (r: RawSkills) => void, re: RegExp) => {
      const r = raw();
      patch(r);
      expect(() => parseSkills(r)).toThrow(re);
    };
    bad((r) => (node(r, 'V1').ranks[0]!.bayCao = 1), /bayCao: hiệu ứng không tồn tại/);
    bad((r) => (node(r, 'V1').ranks[0]!.fullChargeTimeMul = 1.2), /phải trong \[0.1, 1\]/);
    bad((r) => node(r, 'V2').ranks.pop(), /nút tầng 2 cần 2 bậc/);
    bad((r) => (node(r, 'V3').ranks[0]!.punishMul = 1.1), /bậc 1 chỉ có 20%/);
    bad((r) => (node(r, 'P2').id = 'P1'), /trùng "P1"/);
    bad((r) => (node(r, 'P3').ranks[0]!.projectileIFrameSteps = 3.5), /số nguyên/);
  });

  it('sàn nạp đầy phải lớn hơn thời gian nạp vừa (kỹ năng không nâng DPS tối đa)', () => {
    const r = raw();
    r.rules.minFullChargeSec = 0.5;
    expect(() => parseGameConfig({ ...data, skills: r })).toThrow(/phải lớn hơn nạp vừa/);
  });
});

describe('shop.json: hệ số dùng trong công thức là trường số', () => {
  type RawShop = { upgrades: Record<string, unknown>[]; boosters: Record<string, unknown>[] };
  const shop = (): RawShop => structuredClone(data.shop) as RawShop;

  it('đọc được hệ số Upgrade và Booster', () => {
    expect(config.shop.upgrades.arc_core?.damagePerLevel).toBe(0.05);
    expect(config.shop.upgrades.armor_plating?.damageTakenPerLevel).toBe(0.04);
    expect(config.shop.boosters.overcharge?.chargeSpeed).toBe(0.3);
  });

  it('thiếu trường số mà công thức cần, hoặc giảm sát thương tới 100%, thì báo lỗi', () => {
    const a = shop();
    delete a.upgrades.find((u) => u.id === 'arc_core')!.damagePerLevel;
    expect(() => parseShop(a)).toThrow(/arc_core: thiếu trường số damagePerLevel/);
    const b = shop();
    b.upgrades.find((u) => u.id === 'armor_plating')!.damageTakenPerLevel = 0.2;
    expect(() => parseShop(b)).toThrow(/× maxLevel phải nhỏ hơn 1/);
    const c = shop();
    delete c.boosters.find((x) => x.id === 'overcharge')!.chargeSpeed;
    expect(() => parseShop(c)).toThrow(/overcharge: thiếu trường số chargeSpeed/);
  });
});
