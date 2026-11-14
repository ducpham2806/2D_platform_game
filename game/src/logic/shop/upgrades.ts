/**
 * Upgrade của Quầy Mira (M9, đặc tả Hub mục 4.2–4.3, kinh tế mục 1): giá theo cấp, cấp mở theo
 * số boss chiến dịch đã hạ, mua và gỡ. Hàm thuần: nhận cấp và Core Bit, trả bản mới, không sửa
 * tại chỗ. Bản lưu ghi kết quả trong một lần (giao dịch nguyên tử, ST-09-02).
 */
import type { ShopData, UpgradeData } from '../../core/shop-config';

/** Cấp đã mua theo id Upgrade (không có = cấp 0). */
export type UpgradeLevels = Readonly<Record<string, number>>;

export function levelOf(levels: UpgradeLevels, id: string): number {
  return levels[id] ?? 0;
}

/** Giá để lên `level` (từ 1): round(baseCost × costGrowth^(level − 1)). */
export function upgradeCost(u: UpgradeData, level: number): number {
  return Math.round(u.baseCost * u.costGrowth ** (level - 1));
}

/** Số boss chiến dịch đã hạ (mini-boss và boss phòng thử không tính). */
export function storyBossCount(
  defeated: readonly string[],
  storyBosses: ReadonlySet<string>,
): number {
  return new Set(defeated.filter((id) => storyBosses.has(id))).size;
}

/** Quầy Upgrade mở từ mốc đầu tiên của lịch (2 boss). */
export function shopOpen(shop: ShopData, bosses: number): boolean {
  const first = shop.unlockSchedule[0];
  return first !== undefined && bosses >= first.afterBosses;
}

/** Cấp cao nhất mua được lúc này (0 = chưa mở). */
export function levelCap(shop: ShopData, id: string, bosses: number): number {
  let cap = 0;
  for (const tier of shop.unlockSchedule) {
    if (tier.afterBosses > bosses) break;
    cap = tier.maxLevel[id] ?? 0;
  }
  return cap;
}

/** Số boss cần để mua được cấp `level`; undefined nếu lịch không bao giờ mở cấp đó. */
export function bossesForLevel(shop: ShopData, id: string, level: number): number | undefined {
  return shop.unlockSchedule.find((t) => (t.maxLevel[id] ?? 0) >= level)?.afterBosses;
}

export type ShopRefusal = 'unknown' | 'maxed' | 'locked' | 'funds' | 'none';

export type ShopResult =
  | { ok: true; levels: UpgradeLevels; coreBits: number; amount: number; level: number }
  | { ok: false; reason: ShopRefusal };

/** Mua cấp kế của `id`: trừ giá và tăng một cấp cùng lúc. */
export function buyUpgrade(
  shop: ShopData,
  levels: UpgradeLevels,
  coreBits: number,
  id: string,
  bosses: number,
): ShopResult {
  const u = shop.upgrades[id];
  if (!u) return { ok: false, reason: 'unknown' };
  const level = levelOf(levels, id) + 1;
  if (level > u.maxLevel) return { ok: false, reason: 'maxed' };
  if (level > levelCap(shop, id, bosses)) return { ok: false, reason: 'locked' };
  const amount = upgradeCost(u, level);
  if (amount > coreBits) return { ok: false, reason: 'funds' };
  return {
    ok: true,
    levels: { ...levels, [id]: level },
    coreBits: coreBits - amount,
    amount,
    level,
  };
}

/** Gỡ cấp cao nhất của `id`, hoàn 100% giá cấp đó (đặc tả Hub mục 4.2). */
export function refundUpgrade(
  shop: ShopData,
  levels: UpgradeLevels,
  coreBits: number,
  id: string,
): ShopResult {
  const u = shop.upgrades[id];
  if (!u) return { ok: false, reason: 'unknown' };
  const level = levelOf(levels, id);
  if (level <= 0) return { ok: false, reason: 'none' };
  const amount = upgradeCost(u, level);
  const next: Record<string, number> = { ...levels };
  if (level === 1) delete next[id];
  else next[id] = level - 1;
  return { ok: true, levels: next, coreBits: coreBits + amount, amount, level: level - 1 };
}
