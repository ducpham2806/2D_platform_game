/**
 * Kiểm tra 03-Data/shop.json: Upgrade và Booster (GDD 10.1). Các hệ số dùng trong công thức
 * build (01-GDD/10-He-thong-RPG-Xuong.md mục 3.1) là trường số bắt buộc; chuỗi `effect` chỉ để
 * hiện chữ. Logic thuần.
 */
import { arr, ConfigError, type Json, num, obj, str } from './json-check';

export interface UpgradeData {
  id: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  /** Chữ mô tả (chưa dùng trong công thức). */
  effectPerLevel: string;
  /** Sát thương gây ra cộng thêm mỗi cấp upgrade (arc_core). */
  damagePerLevel?: number;
  /** Sát thương nhận giảm mỗi cấp upgrade (armor_plating). */
  damageTakenPerLevel?: number;
}

export interface BoosterData {
  id: string;
  effect: string;
  cost: number;
  maxStock: number;
  /** Tốc độ nạp đầy cộng thêm (overcharge): thời gian nạp đầy chia (1 + chargeSpeed). */
  chargeSpeed?: number;
}

export interface ShopData {
  upgrades: Readonly<Record<string, UpgradeData>>;
  boosters: Readonly<Record<string, BoosterData>>;
}

/** Trường số mà công thức build cần (id → trường). */
const REQUIRED_NUMBERS = {
  upgrades: { arc_core: 'damagePerLevel', armor_plating: 'damageTakenPerLevel' },
  boosters: { overcharge: 'chargeSpeed' },
} as const;

function optFraction(o: Json, key: string, path: string): number | undefined {
  if (o[key] === undefined) return undefined;
  const v = num(o[key], `${path}.${key}`, { min: 0 });
  if (v >= 1) throw new ConfigError(`${path}.${key}: phải nhỏ hơn 1 (đang là ${v})`);
  return v;
}

export function parseShop(value: unknown): ShopData {
  const s = obj(value, 'shop');
  const upgrades: Record<string, UpgradeData> = {};
  arr(s.upgrades, 'shop.upgrades').forEach((item, i) => {
    const p = `shop.upgrades[${i}]`;
    const o = obj(item, p);
    const id = str(o.id, `${p}.id`);
    if (upgrades[id]) throw new ConfigError(`${p}.id: trùng "${id}"`);
    const maxLevel = num(o.maxLevel, `${p}.maxLevel`, { min: 1 });
    if (!Number.isInteger(maxLevel)) throw new ConfigError(`${p}.maxLevel: cần số nguyên`);
    const u: UpgradeData = {
      id,
      maxLevel,
      baseCost: num(o.baseCost, `${p}.baseCost`, { min: 0 }),
      costGrowth: num(o.costGrowth, `${p}.costGrowth`, { min: 1 }),
      effectPerLevel: str(o.effectPerLevel, `${p}.effectPerLevel`),
    };
    const dmg = optFraction(o, 'damagePerLevel', p);
    if (dmg !== undefined) u.damagePerLevel = dmg;
    const taken = optFraction(o, 'damageTakenPerLevel', p);
    if (taken !== undefined) {
      if (taken * maxLevel >= 1)
        throw new ConfigError(`${p}: damageTakenPerLevel × maxLevel phải nhỏ hơn 1`);
      u.damageTakenPerLevel = taken;
    }
    upgrades[id] = u;
  });
  const boosters: Record<string, BoosterData> = {};
  arr(s.boosters, 'shop.boosters').forEach((item, i) => {
    const p = `shop.boosters[${i}]`;
    const o = obj(item, p);
    const id = str(o.id, `${p}.id`);
    if (boosters[id]) throw new ConfigError(`${p}.id: trùng "${id}"`);
    const b: BoosterData = {
      id,
      effect: str(o.effect, `${p}.effect`),
      cost: num(o.cost, `${p}.cost`, { min: 0 }),
      maxStock: num(o.maxStock, `${p}.maxStock`, { min: 1 }),
    };
    if (o.chargeSpeed !== undefined)
      b.chargeSpeed = num(o.chargeSpeed, `${p}.chargeSpeed`, { min: 0 });
    boosters[id] = b;
  });
  for (const [id, field] of Object.entries(REQUIRED_NUMBERS.upgrades)) {
    const u = upgrades[id];
    if (u?.[field] === undefined)
      throw new ConfigError(`shop.upgrades ${id}: thiếu trường số ${field}`);
  }
  for (const [id, field] of Object.entries(REQUIRED_NUMBERS.boosters)) {
    const b = boosters[id];
    if (b?.[field] === undefined)
      throw new ConfigError(`shop.boosters ${id}: thiếu trường số ${field}`);
  }
  return { upgrades, boosters };
}
