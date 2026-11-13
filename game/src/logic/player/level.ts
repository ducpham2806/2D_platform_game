import { evaluateFormula } from '../formula';

/** Phần `player.json` → `level` mà phép tính cấp cần. */
export interface LevelCurve {
  max: number;
  /** EXP cần để từ cấp L lên L + 1 (GDD 6.1), ví dụ "40*L^1.4". */
  expFormula: string;
}

/** EXP tích lũy cần có để đạt cấp `level` (cấp 1 = 0). Làm tròn từng nấc như GDD 6.1. */
export function expForLevel(level: number, curve: LevelCurve): number {
  const target = Math.min(Math.max(1, Math.floor(level)), curve.max);
  let total = 0;
  for (let l = 1; l < target; l += 1) total += evaluateFormula(curve.expFormula, { L: l });
  return Math.round(total);
}

/** Cấp ứng với tổng EXP đã có (1 … max). */
export function levelForExp(exp: number, curve: LevelCurve): number {
  let level = 1;
  while (level < curve.max && exp >= expForLevel(level + 1, curve)) level += 1;
  return level;
}
