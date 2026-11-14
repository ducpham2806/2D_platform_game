/**
 * Chuẩn hóa cấp Upgrade trong bản lưu theo dữ liệu hiện tại (ST-09-02): bỏ id lạ; cấp vượt
 * `maxLevel` thì kẹp lại và hoàn Core Bit phần dư theo giá hiện hành. Không kẹp theo lịch mở
 * (cấp đã mua hợp lệ lúc mua thì giữ). Chạy khi mở bản lưu và khi nhập mã sao lưu. Logic thuần.
 */
import type { ShopData } from '../../core/shop-config';
import { type SaveData, setInventory } from '../save/save-data';
import { upgradeCost } from './upgrades';

export function normalizeUpgrades(
  save: SaveData,
  shop: ShopData,
): { save: SaveData; notice: string | undefined } {
  const levels: Record<string, number> = {};
  let refund = 0;
  let dropped = false;
  for (const [id, level] of Object.entries(save.inventory.upgrades)) {
    const u = shop.upgrades[id];
    if (!u) {
      dropped = true;
      continue;
    }
    const kept = Math.min(level, u.maxLevel);
    for (let lv = kept + 1; lv <= level; lv += 1) refund += upgradeCost(u, lv);
    if (kept > 0) levels[id] = kept;
  }
  const next = setInventory(save, levels, save.inventory.coreBits + refund);
  if (next === save) return { save, notice: undefined };
  const parts: string[] = [];
  if (refund > 0) parts.push(`Một số Upgrade vượt cấp tối đa đã được gỡ, hoàn ${refund} Core Bit.`);
  if (dropped) parts.push('Upgrade không còn trong dữ liệu đã được bỏ.');
  return { save: next, notice: parts.join(' ') };
}

/** Hàm chuẩn hóa dùng cho SaveManager. */
export function upgradeNormalizer(
  shop: ShopData,
): (save: SaveData) => { save: SaveData; notice: string | undefined } {
  return (save) => normalizeUpgrades(save, shop);
}
