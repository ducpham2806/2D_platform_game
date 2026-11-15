/**
 * EXP và Core Bit theo màn (01-GDD/16-Dac-ta-Stage2-4-nhap.md mục 2.1; EP-15 ST-15-01a). Logic thuần.
 *
 * thưởng kẻ địch = round(base × enemyRewardMul × difficulty.rewardMul); base > 0 thì ít nhất 1.
 * Mini-boss, boss, rương không nhân enemyRewardMul (thưởng ghi thẳng trong dữ liệu).
 */

/** Thưởng một kẻ địch thường: nhân hai hệ số trước, rồi một lần làm tròn (thứ tự cố định). */
export function enemyReward(base: number, stageMul: number, difficultyMul: number): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * (stageMul * difficultyMul)));
}

/** Hệ số thưởng của màn cho EnemyField: `mul` cho kẻ địch thường, `exempt` (mini-boss) không nhân. */
export interface StageReward {
  mul: { exp: number; coreBit: number };
  exempt: readonly string[];
}

export const NO_STAGE_REWARD: StageReward = { mul: { exp: 1, coreBit: 1 }, exempt: [] };

/** Một loại kẻ địch đặt trên bản đồ: EXP gốc và số con. */
export interface EnemyCount {
  exp: number;
  count: number;
}

/**
 * Σ EXP Thường của màn: kẻ địch thường làm tròn **từng con** theo `enemyRewardMul.exp` rồi cộng,
 * cộng EXP mini-boss và boss (không nhân).
 */
export function stageExpTotal(
  enemies: readonly EnemyCount[],
  expMul: number,
  miniBossExp: number,
  bossExp: number,
): number {
  const field = enemies.reduce((sum, e) => sum + enemyReward(e.exp, expMul, 1) * e.count, 0);
  return field + miniBossExp + bossExp;
}

/** Lệch tối đa cho phép giữa Σ EXP và `expBudget` (± 5%). */
export const EXP_BUDGET_TOLERANCE = 0.05;

/** Lỗi khi Σ EXP lệch `expBudget` quá ± 5%; rỗng khi đạt. Dùng khi màn đã có bản đồ (EP-17). */
export function checkStageExp(stageId: string, total: number, expBudget: number): string[] {
  const off = Math.abs(total - expBudget) / expBudget;
  if (off <= EXP_BUDGET_TOLERANCE + 1e-9) return [];
  return [
    `${stageId}: Σ EXP ${total} lệch expBudget ${expBudget} ${(off * 100).toFixed(1)}% (> ${EXP_BUDGET_TOLERANCE * 100}%)`,
  ];
}
