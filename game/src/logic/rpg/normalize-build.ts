/**
 * Chuẩn hóa build trong bản lưu theo dữ liệu hiện tại (01-GDD/10-He-thong-RPG-Xuong.md mục 5):
 * bỏ nút lạ, kẹp bậc về tối đa, bỏ nút mất điều kiện tầng trước, tổng bậc vượt SP có được thì
 * đặt lại cả cây. Cần dữ liệu cấu hình nên không đặt trong `parseSave`; chạy khi mở bản lưu và
 * khi nhập mã sao lưu. Logic thuần.
 */
import type { GameConfig } from '../../core/game-config';
import type { SkillsData } from '../../core/skills-config';
import { type SaveData, setSkills } from '../save/save-data';
import { characterProgress } from './progression';
import { rankOf, type SkillRanks, spentPoints } from './skill-tree';

export interface NormalizeResult {
  save: SaveData;
  /** Thông báo cho người chơi (một lần) khi có sửa. */
  notice: string | undefined;
}

/** Bậc hợp lệ theo dữ liệu (chưa xét SP). */
export function validRanks(data: SkillsData, skills: SkillRanks): Record<string, number> {
  const out: Record<string, number> = {};
  for (const branch of data.branches) {
    let prevMaxed = true;
    for (const node of branch.nodes) {
      const rank = Math.min(rankOf(skills, node.id), node.ranks.length);
      if (rank > 0 && prevMaxed) out[node.id] = rank;
      prevMaxed = prevMaxed && rank >= node.ranks.length;
    }
  }
  return out;
}

/** `totalPoints`: tổng SP có được của bản lưu (cấp và boss đã hạ). */
export function normalizeBuild(
  save: SaveData,
  data: SkillsData,
  totalPoints: number,
): NormalizeResult {
  const before = save.character.skills;
  let skills = validRanks(data, before);
  let notice: string | undefined;
  if (spentPoints(skills) > totalPoints) {
    skills = {};
    notice = `Kỹ năng đã được đặt lại do thay đổi dữ liệu (hoàn ${spentPoints(before)} SP).`;
  }
  const next = setSkills(save, skills);
  if (next !== save && !notice) notice = 'Một số kỹ năng không còn hợp lệ đã được gỡ và hoàn SP.';
  return { save: next, notice: next === save ? undefined : notice };
}

/** Hàm chuẩn hóa dùng cho SaveManager, tính tổng SP từ bản lưu theo dữ liệu cấu hình. */
export function buildNormalizer(
  config: Pick<GameConfig, 'skills' | 'stages' | 'player'>,
): (save: SaveData) => NormalizeResult {
  const storyBosses = new Set(config.stages.stages.map((s) => s.boss));
  return (save) =>
    normalizeBuild(
      save,
      config.skills,
      characterProgress(
        save.character.exp,
        save.progress.bossesDefeated,
        storyBosses,
        config.player.level,
      ).skillPoints,
    );
}
