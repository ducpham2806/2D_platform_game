/**
 * Độ khó cốt truyện (01-GDD/11-Do-kho.md): mở khóa theo màn, độ khó mặc định ở màn Chuẩn bị,
 * làm tròn phần thưởng, lọc checkpoint theo độ khó. Logic thuần.
 */

/** Phần dữ liệu độ khó mà các quy tắc ở đây cần (difficulties.json). */
export interface DifficultyRule {
  id: string;
  /** null: có sẵn; danh sách: mở khi đã hạ boss của màn ở một trong các độ khó này. */
  unlockClearedOn: readonly string[] | null;
}

/** Tiến trình độ khó của một màn chiến dịch trong bản lưu. */
export interface StageDifficultyProgress {
  /** Độ khó chọn lần trước ở màn Chuẩn bị (bản lưu ghi null khi chưa chọn). */
  last: string | null | undefined;
  /** Các độ khó đã hạ boss của màn. */
  cleared: readonly string[];
}

export const NO_DIFFICULTY_PROGRESS: StageDifficultyProgress = { last: undefined, cleared: [] };

/** Độ khó mặc định khi chưa chọn bao giờ (GDD 11 mục 2.1). */
export const DEFAULT_DIFFICULTY = 'normal';

export function difficultyUnlocked(
  rule: DifficultyRule,
  progress: StageDifficultyProgress,
): boolean {
  const need = rule.unlockClearedOn;
  return need === null || need.some((id) => progress.cleared.includes(id));
}

/**
 * Độ khó chọn sẵn ở màn Chuẩn bị: lần trước của màn đó nếu còn mở; không thì Thường; không có
 * Thường thì độ khó mở đầu tiên.
 */
export function defaultDifficulty(
  rules: readonly DifficultyRule[],
  progress: StageDifficultyProgress,
): string {
  const open = rules.filter((r) => difficultyUnlocked(r, progress));
  const pick = (id: string | null | undefined) => open.find((r) => r.id === id)?.id;
  return pick(progress.last) ?? pick(DEFAULT_DIFFICULTY) ?? open[0]?.id ?? DEFAULT_DIFFICULTY;
}

/** Thưởng nhân hệ số độ khó, làm tròn; thưởng gốc > 0 thì ít nhất 1 (GDD 11 mục 3.1). */
export function scaleReward(base: number, mul: number): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * mul));
}

/** Checkpoint có ở độ khó này không (không ghi `difficulties` thì có ở mọi độ khó). */
export function checkpointActive(
  cp: { difficulties?: readonly string[] | undefined },
  difficultyId: string,
): boolean {
  return cp.difficulties === undefined || cp.difficulties.includes(difficultyId);
}

/**
 * Checkpoint xuất phát (số thứ tự từ 1 trên danh sách đầy đủ; 0 = đầu màn): checkpoint gần nhất
 * phía trước, tức chỉ số ≤ `saved`, có ở độ khó này (GDD 11 mục 2.4).
 */
export function startCheckpointFor(
  cps: readonly { difficulties?: readonly string[] | undefined }[],
  difficultyId: string,
  saved: number,
): number {
  for (let i = Math.min(saved, cps.length); i >= 1; i -= 1)
    if (checkpointActive(cps[i - 1]!, difficultyId)) return i;
  return 0;
}

/**
 * Câu gợi ý của NOVA sau `deaths` lần chết liên tiếp (GDD 11 mục 2.5). `counterWeapon`: tên vũ khí
 * khắc chế nên gợi ý thêm (đang ở phòng boss, đã có mà lúc chết không cầm); không có thì bỏ.
 */
export function difficultyHintText(
  hint: { lines: Readonly<Record<string, string>>; weapon: string },
  difficultyId: string,
  counterWeapon?: string,
  /** Xưởng chưa mở: dùng câu `<id>_early` nếu có (câu thường nhắc tới Xưởng, Quầy). */
  early = false,
): string {
  const line =
    (early ? hint.lines[`${difficultyId}_early`] : undefined) ?? hint.lines[difficultyId] ?? '';
  if (!counterWeapon) return line;
  return `${line} ${hint.weapon.replace('{weapon}', counterWeapon)}`.trim();
}

/**
 * Gợi ý chết hết ngữ cảnh trong bước này (QB-71): hạ boss, qua checkpoint, hoặc vào đấu trường
 * (GDD 11 mục 2.5 coi lúc vào đấu trường như checkpoint: đếm chết về 0). Câu đang chờ hay đang
 * hiện đều bỏ.
 */
export function deathHintExpired(ev: {
  bossDefeated: boolean;
  checkpoint?: unknown;
  gateClosed: boolean;
}): boolean {
  return ev.bossDefeated || ev.checkpoint !== undefined || ev.gateClosed;
}
