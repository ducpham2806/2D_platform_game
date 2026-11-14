/**
 * Mô hình màn Chuẩn bị, bản cắt MVP (01-GDD/11-Do-kho.md mục 2.1, đặc tả Hub mục 3; ADR-001: bảng
 * HTML chỉ vẽ mô hình này): thông tin màn, cấp so với khuyến nghị, ba thẻ độ khó. Logic thuần.
 */
import {
  type DifficultyRule,
  defaultDifficulty,
  difficultyUnlocked,
  type StageDifficultyProgress,
} from './difficulty';

/** Phần dữ liệu một độ khó mà màn Chuẩn bị hiện. */
export interface PrepDifficulty extends DifficultyRule {
  name: string;
  desc: string;
  damageTaken: number;
  enemyHp: number;
  rewardMul: number;
}

export interface PrepOption {
  id: string;
  name: string;
  desc: string;
  /** Hệ số chính, ví dụ "Sát thương nhận ×1,5 · Máu kẻ địch ×1,25 · Thưởng ×1,5". */
  stats: string;
  locked: boolean;
  /** Điều kiện mở (khi khóa). */
  lockText: string | undefined;
}

export interface PrepModel {
  stageName: string;
  recommended: readonly [number, number];
  /** Cấp thật và cấp hiệu dụng (đã đồng bộ cấp theo màn). */
  level: number;
  effectiveLevel: number;
  /** Gợi ý mềm khi cấp thật thấp hơn mức khuyến nghị quá `belowMin` cấp; không chặn. */
  levelHint: string | undefined;
  options: PrepOption[];
  /** Độ khó chọn sẵn. */
  selected: string;
}

/** Số thập phân kiểu Việt Nam: 1,25; số nguyên giữ nguyên. */
function vn(x: number): string {
  return String(Math.round(x * 100) / 100).replace('.', ',');
}

export function difficultyStats(d: PrepDifficulty): string {
  return `Sát thương nhận ×${vn(d.damageTaken)} · Máu kẻ địch ×${vn(d.enemyHp)} · Thưởng ×${vn(d.rewardMul)}`;
}

export function buildPrep(input: {
  stageName: string;
  recommended: readonly [number, number];
  level: number;
  effectiveLevel: number;
  /** Cấp thật thấp hơn cấp khuyến nghị thấp nhất quá chừng này thì gợi ý (stages.json → levelSync.belowMin). */
  hintBelow: number;
  difficulties: readonly PrepDifficulty[];
  progress: StageDifficultyProgress;
}): PrepModel {
  const names = new Map(input.difficulties.map((d) => [d.id, d.name]));
  const options = input.difficulties.map((d): PrepOption => {
    const locked = !difficultyUnlocked(d, input.progress);
    const need = (d.unlockClearedOn ?? []).map((id) => names.get(id) ?? id);
    return {
      id: d.id,
      name: d.name,
      desc: d.desc,
      stats: difficultyStats(d),
      locked,
      lockText: locked ? `Mở khi xong màn này ở ${need.join(' hoặc ')}` : undefined,
    };
  });
  const low = input.level < input.recommended[0] - input.hintBelow;
  return {
    stageName: input.stageName,
    recommended: input.recommended,
    level: input.level,
    effectiveLevel: input.effectiveLevel,
    levelHint: low
      ? 'Cấp của cậu thấp hơn khuyến nghị. Có thể học kỹ năng ở Xưởng, mua Upgrade, hoặc chọn Cốt truyện.'
      : undefined,
    options,
    selected: defaultDifficulty(input.difficulties, input.progress),
  };
}
