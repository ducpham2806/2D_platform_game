/**
 * Cây kỹ năng (01-GDD/10-He-thong-RPG-Xuong.md mục 2.1, 2.4): học từng bậc (1 SP), tầng sau mở
 * khi tầng trước của cùng nhánh đủ bậc, đặt lại theo nhánh hoặc tất cả (hoàn 100%, miễn phí).
 * Logic thuần: hàm nhận bậc đã học, trả bản mới, không sửa tại chỗ.
 */
import type { SkillNode, SkillsData } from '../../core/skills-config';

/** Bậc đã học theo id nút (nút chưa học không có khóa). */
export type SkillRanks = Readonly<Record<string, number>>;

export type NodeState = 'locked' | 'learnable' | 'noSp' | 'maxed';

/** SP mỗi lần học một bậc (GDD 6.2, wireframe Workshop.html). */
export const SP_PER_RANK = 1;

export function rankOf(skills: SkillRanks, id: string): number {
  return skills[id] ?? 0;
}

export function spentPoints(skills: SkillRanks): number {
  return Object.values(skills).reduce((sum, r) => sum + r * SP_PER_RANK, 0);
}

/** Nút tầng 1 luôn mở; nút tầng k mở khi nút tầng k − 1 của cùng nhánh đủ bậc. */
export function isUnlocked(data: SkillsData, skills: SkillRanks, node: SkillNode): boolean {
  if (node.tier <= 1) return true;
  const branch = data.branches.find((b) => b.id === node.branch);
  const prev = branch?.nodes.find((n) => n.tier === node.tier - 1);
  return prev !== undefined && rankOf(skills, prev.id) >= prev.ranks.length;
}

/** `available`: SP còn lại (tổng SP có được trừ SP đã học). */
export function nodeState(
  data: SkillsData,
  skills: SkillRanks,
  node: SkillNode,
  available: number,
): NodeState {
  if (rankOf(skills, node.id) >= node.ranks.length) return 'maxed';
  if (!isUnlocked(data, skills, node)) return 'locked';
  return available >= SP_PER_RANK ? 'learnable' : 'noSp';
}

/** Học một bậc của nút `id`. Không được phép (khóa, đủ bậc, thiếu SP, nút lạ) thì trả về undefined. */
export function learn(
  data: SkillsData,
  skills: SkillRanks,
  id: string,
  available: number,
): SkillRanks | undefined {
  const node = data.nodes[id];
  if (!node || nodeState(data, skills, node, available) !== 'learnable') return undefined;
  return { ...skills, [id]: rankOf(skills, id) + 1 };
}

/** Đặt lại một nhánh: bỏ mọi bậc của các nút thuộc nhánh đó. */
export function resetBranch(data: SkillsData, skills: SkillRanks, branchId: string): SkillRanks {
  const ids = new Set(data.branches.find((b) => b.id === branchId)?.nodes.map((n) => n.id));
  if (!Object.keys(skills).some((id) => ids.has(id))) return skills;
  return Object.fromEntries(Object.entries(skills).filter(([id]) => !ids.has(id)));
}

/** SP đã học trong một nhánh (hiện cạnh nút "Đặt lại nhánh"). */
export function branchSpent(data: SkillsData, skills: SkillRanks, branchId: string): number {
  const branch = data.branches.find((b) => b.id === branchId);
  return (branch?.nodes ?? []).reduce((sum, n) => sum + rankOf(skills, n.id) * SP_PER_RANK, 0);
}
