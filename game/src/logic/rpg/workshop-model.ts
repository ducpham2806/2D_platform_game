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

/** Tab của Xưởng; `lockedHint` là điều kiện mở theo lời người chơi (QB-132), tab đã mở thì không có. */
export interface WorkshopTab {
  id: 'skills' | 'module' | 'armor' | 'skins' | 'loadout';
  name: string;
  lockedHint: string | undefined;
}

/** MVP chỉ có tab Kỹ năng; các tab khác hiện khóa kèm điều kiện mở (chuyển sang chuỗi khi làm i18n). */
export const WORKSHOP_TABS: readonly WorkshopTab[] = [
  { id: 'skills', name: 'Kỹ năng', lockedHint: undefined },
  { id: 'module', name: 'Module', lockedHint: 'khi nhận module đầu tiên' },
  { id: 'armor', name: 'Giáp', lockedHint: 'khi có Két giáp' },
  { id: 'skins', name: 'Tủ skin', lockedHint: 'mở sau boss 5' },
  { id: 'loadout', name: 'Loadout', lockedHint: 'mở sau boss 5' },
];

/** Nhãn tab: tên, kèm điều kiện mở nếu còn khóa. */
export function workshopTabLabel(tab: WorkshopTab): string {
  return tab.lockedHint === undefined ? tab.name : `${tab.name} · ${tab.lockedHint}`;
}

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
