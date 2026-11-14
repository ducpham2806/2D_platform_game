/**
 * Chuẩn hóa phần độ khó của bản lưu theo dữ liệu (01-GDD/11-Do-kho.md mục 3.2, 5): bỏ id độ khó
 * lạ; boss chiến dịch đã hạ mà chưa ghi độ khó nào (bản lưu trước bản 4, khi game luôn chạy
 * Thường) thì ghi `cleared: ["normal"]`. Chạy khi mở bản lưu và khi nhập mã sao lưu. Logic thuần.
 */
import type { SaveData, StageDifficultySave } from '../save/save-data';
import { DEFAULT_DIFFICULTY } from './difficulty';

export function normalizeDifficulty(
  save: SaveData,
  config: {
    stages: { stages: readonly { id: string; boss: string }[] };
    difficulties: readonly { id: string }[];
  },
): { save: SaveData; notice: string | undefined } {
  const known = new Set(config.difficulties.map((d) => d.id));
  const next: Record<string, StageDifficultySave> = {};
  let changed = false;
  for (const [stage, d] of Object.entries(save.progress.difficulty)) {
    const cleared = d.cleared.filter((id) => known.has(id));
    const last = d.last !== null && known.has(d.last) ? d.last : null;
    if (cleared.length !== d.cleared.length || last !== d.last) changed = true;
    next[stage] = { last, cleared };
  }
  const defeated = new Set(save.progress.bossesDefeated);
  for (const s of config.stages.stages) {
    if (!defeated.has(s.boss)) continue;
    const cur = next[s.id] ?? { last: null, cleared: [] };
    if (cur.cleared.length > 0) continue;
    next[s.id] = { ...cur, cleared: [DEFAULT_DIFFICULTY] };
    changed = true;
  }
  if (!changed) return { save, notice: undefined };
  return { save: { ...save, progress: { ...save.progress, difficulty: next } }, notice: undefined };
}

/** Hàm chuẩn hóa dùng cho SaveManager. */
export function difficultyNormalizer(
  config: Parameters<typeof normalizeDifficulty>[1],
): (save: SaveData) => { save: SaveData; notice: string | undefined } {
  return (save) => normalizeDifficulty(save, config);
}
