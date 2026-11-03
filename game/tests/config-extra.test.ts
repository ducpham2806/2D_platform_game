import { describe, expect, it } from 'vitest';
import { checkBossRules, parseBosses } from '@/core/boss-config';
import { parseGameConfig } from '@/core/game-config';
import { parseWeapons } from '@/core/weapons-config';
import { evaluateFormula, FormulaError } from '@/logic/formula';
import { loadData } from './helpers';

describe('công thức trong dữ liệu', () => {
  it('tính đúng các công thức của player.json', () => {
    expect(evaluateFormula('100+4*(L-1)', { L: 1 })).toBe(100);
    expect(evaluateFormula('100+4*(L-1)', { L: 30 })).toBe(216);
    expect(evaluateFormula('10+0.25*(L-1)', { L: 5 })).toBe(11);
    expect(evaluateFormula('40*L^1.4', { L: 2 })).toBeCloseTo(40 * 2 ** 1.4);
    expect(evaluateFormula('2^3^2', {})).toBe(512);
    expect(evaluateFormula('-2*-3', {})).toBe(6);
  });

  it('báo lỗi công thức sai hoặc thiếu biến, không chạy mã lạ', () => {
    expect(() => evaluateFormula('L+', { L: 1 })).toThrow(FormulaError);
    expect(() => evaluateFormula('X*2', {})).toThrow(/Biến "X"/);
    expect(() => evaluateFormula('alert(1)', {})).toThrow(FormulaError);
    expect(() => evaluateFormula('(1+2', {})).toThrow(/Thiếu dấu/);
  });
});

describe('boss xám (GDD 9)', () => {
  const boss = parseBosses(loadData().bosses).gray!;

  it('qua mọi nguyên tắc: telegraph ≥ 0,5 s sau tăng tốc, không đòn nào chết ngay', () => {
    expect(checkBossRules(boss, 100)).toEqual([]);
  });

  it('3 pha ở ngưỡng 60% và 30%, pha cuối nhanh hơn 20%', () => {
    expect(boss.phases.map((p) => p.untilHpPct)).toEqual([60, 30, 0]);
    expect(boss.phases[2]!.speedMul).toBe(1.2);
  });

  it('phát hiện telegraph quá ngắn và đòn chết ngay', () => {
    const fast = structuredClone(boss);
    fast.attacks.charge!.telegraphSec = 0.55;
    fast.attacks.rain!.damage = 120;
    const errors = checkBossRules(fast, 100).join('\n');
    expect(errors).toMatch(/charge: telegraph/);
    expect(errors).toMatch(/chết ngay/);
  });

  it('cả cấu hình game kiểm tra điểm yếu boss là vũ khí có thật', () => {
    const files = loadData();
    const bosses = structuredClone(files.bosses) as { gray: { weakness: string } };
    bosses.gray.weakness = 'Súng nước';
    expect(() => parseGameConfig({ ...files, bosses })).toThrow(/không có vũ khí Súng nước/);
  });
});

describe('weapons.json', () => {
  it('vũ khí đã có hành vi phải có mức tiêu hao hợp lệ', () => {
    const raw = structuredClone(loadData().weapons) as {
      bossWeapons: { energyCostOf28: unknown }[];
    };
    raw.bossWeapons[0]!.energyCostOf28 = null;
    expect(() => parseWeapons(raw)).toThrow(/energyCostOf28/);
  });

  it('mức nạp vừa phải ngắn hơn nạp đầy', () => {
    const raw = structuredClone(loadData().weapons) as {
      arcCannon: { midCharge: { timeSec: number } };
    };
    raw.arcCannon.midCharge.timeSec = 2;
    expect(() => parseWeapons(raw)).toThrow(/midCharge/);
  });
});
