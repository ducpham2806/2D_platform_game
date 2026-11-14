/**
 * Mô hình hiển thị Quầy Mira, tab Upgrade (M9, đặc tả Hub mục 4.1–4.2; ADR-001: bảng HTML chỉ vẽ
 * mô hình này). Logic thuần.
 */
import type { DifficultyData } from '../../core/game-config';
import {
  type EconomyData,
  type ShopData,
  type UpgradeData,
  upgradeHasEffect,
} from '../../core/shop-config';
import { evaluateFormula } from '../formula';
import {
  bossesForLevel,
  levelCap,
  levelOf,
  refundAmount,
  shopOpen,
  upgradeCost,
  type UpgradeLevels,
  type UpgradePaid,
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
  /** Gỡ cấp cao nhất hoàn chừng này Core Bit (số đã trả; undefined khi cấp 0). */
  refund: number | undefined;
  /** Upgrade chưa có tác dụng trong bản này: chưa bán ("Sắp có"). */
  comingSoon: boolean;
  /** Tác dụng ở cấp hiện tại và cấp kế, bằng số thật (ví dụ "28 năng lượng" → "32 năng lượng"). */
  effectNow: string | undefined;
  effectNext: string | undefined;
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
  /** Gợi ý khi thiếu tiền: một lượt màn nên chơi tiếp cho khoảng bao nhiêu Core Bit. */
  income: ShopIncome;
}

/**
 * Gợi ý thu nhập (rà soát 14/11/2026, E02): chỉ gợi ý màn đã có trong bản build; độ khó là độ khó
 * chọn lần cuối ở màn đó (chưa chọn: Thường). Thưởng boss chỉ trả lần đầu hạ ở mỗi độ khó, nên
 * màn đã hạ boss ở độ khó đó chỉ tính phần kẻ địch (`replay`).
 */
export interface ShopIncome {
  stage: number;
  name: string;
  coreBits: number;
  /** Đã nhận thưởng boss của màn ở độ khó này: chỉ còn Core Bit của kẻ địch. */
  replay: boolean;
  difficultyName: string;
}

export interface ShopSources {
  shop: ShopData;
  economy: EconomyData;
  /** Năng lượng tối đa gốc của vũ khí boss (Energy Cell hiện số thật). */
  weapons: { energyMax: number };
  stages: { stages: readonly { index: number; id: string; name: string; boss: string }[] };
  difficulties: readonly DifficultyData[];
  /** Thưởng Core Bit lần đầu hạ boss (trừ ra khi chơi lại). */
  bosses: Readonly<Record<string, { rewardCoreBit: number }>>;
}

export interface ShopState {
  levels: UpgradeLevels;
  paid?: UpgradePaid;
  coreBits: number;
  /** Số boss chiến dịch đã hạ. */
  bosses: number;
  readOnly?: boolean;
  /** Số màn chiến dịch đã có trong bản build (mặc định: mọi màn). */
  playableStages?: number;
  /** Tiến trình độ khó theo id màn chiến dịch (bản lưu `progress.difficulty`). */
  difficultyBy?: Readonly<Record<string, { last: string | null; cleared: readonly string[] }>>;
}

/** Core Bit một lượt màn `stage` ở độ khó `difficultyId` (kinh tế mục 2), làm tròn. */
export function stageIncome(src: ShopSources, stage: number, difficultyId = 'normal'): number {
  const mul = src.difficulties.find((d) => d.id === difficultyId)?.rewardMul ?? 1;
  return Math.round(evaluateFormula(src.economy.incomeFormula, { stage }) * mul);
}

/** Core Bit một lượt chơi lại màn đã nhận thưởng boss ở độ khó này: bỏ phần thưởng boss. */
export function replayIncome(
  src: ShopSources,
  stage: number,
  bossReward: number,
  difficultyId = 'normal',
): number {
  const mul = src.difficulties.find((d) => d.id === difficultyId)?.rewardMul ?? 1;
  const base = evaluateFormula(src.economy.incomeFormula, { stage }) - bossReward;
  return Math.round(Math.max(0, base) * mul);
}

/** Màn nên gợi ý: màn kế tiếp nếu đã có trong bản build, không thì màn cuối đã có. */
export function shopIncome(src: ShopSources, state: ShopState): ShopIncome {
  const sorted = [...src.stages.stages].sort((a, b) => a.index - b.index);
  const playable = sorted.filter((s) => s.index <= (state.playableStages ?? Infinity));
  const built = playable.length > 0 ? playable : sorted.slice(0, 1);
  const target = built[Math.min(state.bosses, built.length - 1)];
  if (!target) return { stage: 1, name: '', coreBits: 0, replay: false, difficultyName: '' };
  const prog = state.difficultyBy?.[target.id];
  const known = src.difficulties.find((d) => d.id === prog?.last);
  const diff = known ?? src.difficulties.find((d) => d.id === 'normal');
  const diffId = diff?.id ?? 'normal';
  const replay = prog?.cleared.includes(diffId) ?? false;
  const reward = src.bosses[target.boss]?.rewardCoreBit ?? 0;
  return {
    stage: target.index,
    name: target.name,
    coreBits: replay
      ? replayIncome(src, target.index, reward, diffId)
      : stageIncome(src, target.index, diffId),
    replay,
    difficultyName: diff?.name ?? '',
  };
}

/** "12,5%" kiểu Việt Nam. */
function pct(x: number): string {
  return `${String(Math.round(x * 1000) / 10).replace('.', ',')}%`;
}

/** Tác dụng của Upgrade ở cấp `level` bằng số thật (GDD 10 mục 3.1); không có tác dụng: undefined. */
export function upgradeEffectText(
  u: UpgradeData,
  level: number,
  energyMax: number,
): string | undefined {
  if (u.damagePerLevel !== undefined) return `+${pct(u.damagePerLevel * level)} sát thương`;
  if (u.damageTakenPerLevel !== undefined)
    return `−${pct(u.damageTakenPerLevel * level)} sát thương nhận`;
  if (u.energyMaxPerLevel !== undefined)
    return `${Math.round(energyMax * (1 + u.energyMaxPerLevel * level))} năng lượng`;
  if (u.magnetTilesPerLevel !== undefined)
    return level === 0 ? 'không hút' : `hút trong ${u.magnetTilesPerLevel * level} ô`;
  return undefined;
}

export function buildShop(src: ShopSources, state: ShopState): ShopModel {
  const { shop } = src;
  const cards = Object.values(shop.upgrades).map((u): ShopCardView => {
    const level = Math.min(levelOf(state.levels, u.id), u.maxLevel);
    const maxed = level >= u.maxLevel;
    const nextCost = maxed ? undefined : upgradeCost(u, level + 1);
    const comingSoon = !upgradeHasEffect(u);
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
      unlockAfterBosses: locked && !comingSoon ? bossesForLevel(shop, u.id, level + 1) : undefined,
      refund: level > 0 ? refundAmount(u, level, state.paid) : undefined,
      comingSoon,
      effectNow: upgradeEffectText(u, level, src.weapons.energyMax),
      effectNext: maxed ? undefined : upgradeEffectText(u, level + 1, src.weapons.energyMax),
    };
  });
  return {
    open: shopOpen(shop, state.bosses),
    openAfterBosses: shop.unlockSchedule[0]?.afterBosses ?? 0,
    bosses: state.bosses,
    coreBits: state.coreBits,
    readOnly: state.readOnly ?? false,
    cards,
    income: shopIncome(src, state),
  };
}
