/**
 * Mô hình hiển thị tab Kỹ năng của Xưởng (ADR-001: bảng HTML chỉ vẽ mô hình này). Logic thuần.
 */
import type { SkillsData } from '../../core/skills-config';
import {
  branchSpent,
  type NodeState,
  nodeState,
  rankOf,
  type SkillRanks,
  spentPoints,
} from './skill-tree';

export interface WorkshopNodeView {
  id: string;
  name: string;
  desc: string;
  tier: number;
  rank: number;
  maxRank: number;
  state: NodeState;
  /** Mô tả từng bậc (bậc đã học, bậc kế, các bậc sau). */
  rankTexts: string[];
  /** Mô tả bậc kế (undefined khi đủ bậc). */
  nextText: string | undefined;
  /** Nút tầng trước cần đủ bậc (khi khóa). */
  requires: string | undefined;
}

export interface WorkshopBranchView {
  id: string;
  name: string;
  role: string;
  spent: number;
  nodes: WorkshopNodeView[];
}

export interface WorkshopModel {
  /** SP còn lại = tổng − đã học (không âm). */
  available: number;
  total: number;
  spent: number;
  /** Bản lưu chỉ đọc (phiên bản game mới hơn): chỉ xem. */
  readOnly: boolean;
  branches: WorkshopBranchView[];
}

export function buildWorkshop(
  data: SkillsData,
  skills: SkillRanks,
  totalPoints: number,
  readOnly = false,
): WorkshopModel {
  const spent = spentPoints(skills);
  const available = Math.max(0, totalPoints - spent);
  return {
    available,
    total: totalPoints,
    spent,
    readOnly,
    branches: data.branches.map((b) => ({
      id: b.id,
      name: b.name,
      role: b.role,
      spent: branchSpent(data, skills, b.id),
      nodes: b.nodes.map((n) => {
        const rank = rankOf(skills, n.id);
        const prev = b.nodes.find((x) => x.tier === n.tier - 1);
        const state = nodeState(data, skills, n, readOnly ? 0 : available);
        return {
          id: n.id,
          name: n.name,
          desc: n.desc,
          tier: n.tier,
          rank,
          maxRank: n.ranks.length,
          state,
          rankTexts: n.ranks.map((r) => r.text),
          nextText: n.ranks[rank]?.text,
          requires:
            state === 'locked' && prev ? `${prev.name} đủ ${prev.ranks.length} bậc` : undefined,
        };
      }),
    })),
  };
}
