/**
 * Mô hình hiển thị Quầy Mira, tab Upgrade (M9, đặc tả Hub mục 4.1–4.2; ADR-001: bảng HTML chỉ vẽ
 * mô hình này). Logic thuần.
 */
import type { DifficultyData } from '../../core/game-config';
import type { EconomyData, ShopData } from '../../core/shop-config';
import { evaluateFormula } from '../formula';
import {
  bossesForLevel,
  levelCap,
  levelOf,
  shopOpen,
  upgradeCost,
  type UpgradeLevels,
} from './upgrades';

/**
 * Trạng thái thẻ (đặc tả Hub mục 4.1): mua được; không đủ tiền (giá xám, ghi số còn thiếu); khóa
 * (ghi điều kiện mở); đã đủ cấp.
 */
export type ShopCardState = 'buyable' | 'funds' | 'locked' | 'maxed';

export interface ShopCardView {
  id: string;
  name: string;
  desc: string;
  level: number;
  maxLevel: number;
  state: ShopCardState;
  /** Giá cấp kế (undefined khi đủ cấp). */
  nextCost: number | undefined;
  /** Core Bit còn thiếu cho cấp kế (0 khi đủ tiền). */
  missing: number;
  /** Số boss chiến dịch cần để mở cấp kế (khi khóa). */
  unlockAfterBosses: number | undefined;
  /** Gỡ cấp cao nhất hoàn chừng này Core Bit (undefined khi cấp 0). */
  refund: number | undefined;
}

export interface ShopModel {
  /** Quầy Upgrade đã mở (đủ số boss của mốc đầu). */
  open: boolean;
  openAfterBosses: number;
  bosses: number;
  coreBits: number;
  /** Bản lưu chỉ đọc (phiên bản game mới hơn): chỉ xem. */
  readOnly: boolean;
  cards: ShopCardView[];
  /** Gợi ý khi thiếu tiền: một lượt màn kế tiếp ở độ khó Thường cho khoảng bao nhiêu Core Bit. */
  income: { stage: number; name: string; coreBits: number };
}

export interface ShopSources {
  shop: ShopData;
  economy: EconomyData;
  stages: { stages: readonly { index: number; name: string }[] };
  difficulties: readonly DifficultyData[];
}

export interface ShopState {
  levels: UpgradeLevels;
  coreBits: number;
  /** Số boss chiến dịch đã hạ. */
  bosses: number;
  readOnly?: boolean;
}

/** Core Bit một lượt màn `stage` ở độ khó `difficultyId` (kinh tế mục 2), làm tròn. */
export function stageIncome(src: ShopSources, stage: number, difficultyId = 'normal'): number {
  const mul = src.difficulties.find((d) => d.id === difficultyId)?.rewardMul ?? 1;
  return Math.round(evaluateFormula(src.economy.incomeFormula, { stage }) * mul);
}

export function buildShop(src: ShopSources, state: ShopState): ShopModel {
  const { shop } = src;
  const stages = [...src.stages.stages].sort((a, b) => a.index - b.index);
  // Màn người chơi sẽ chơi tiếp: màn sau boss vừa hạ (kẹp ở màn cuối).
  const next = stages[Math.min(state.bosses, stages.length - 1)];
  const stage = next?.index ?? 1;
  const cards = Object.values(shop.upgrades).map((u): ShopCardView => {
    const level = Math.min(levelOf(state.levels, u.id), u.maxLevel);
    const maxed = level >= u.maxLevel;
    const nextCost = maxed ? undefined : upgradeCost(u, level + 1);
    const locked = !maxed && level + 1 > levelCap(shop, u.id, state.bosses);
    const missing = nextCost === undefined ? 0 : Math.max(0, nextCost - state.coreBits);
    let cardState: ShopCardState = 'buyable';
    if (maxed) cardState = 'maxed';
    else if (locked) cardState = 'locked';
    else if (missing > 0) cardState = 'funds';
    return {
      id: u.id,
      name: u.name,
      desc: u.desc,
      level,
      maxLevel: u.maxLevel,
      state: cardState,
      nextCost,
      missing,
      unlockAfterBosses: locked ? bossesForLevel(shop, u.id, level + 1) : undefined,
      refund: level > 0 ? upgradeCost(u, level) : undefined,
    };
  });
  return {
    open: shopOpen(shop, state.bosses),
    openAfterBosses: shop.unlockSchedule[0]?.afterBosses ?? 0,
    bosses: state.bosses,
    coreBits: state.coreBits,
    readOnly: state.readOnly ?? false,
    cards,
    income: { stage, name: next?.name ?? '', coreBits: stageIncome(src, stage) },
  };
}
