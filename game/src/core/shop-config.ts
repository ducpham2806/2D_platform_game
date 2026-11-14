/**
 * Kiểm tra 03-Data/shop.json: Upgrade, lịch mở cấp theo boss và Booster (GDD 10.1, đặc tả Hub
 * mục 4.3). Các hệ số dùng trong công thức build (01-GDD/10-He-thong-RPG-Xuong.md mục 3.1) là
 * trường số bắt buộc; chuỗi `effect` chỉ để hiện chữ. Logic thuần.
 */
import { evaluateFormula } from '../logic/formula';
import { arr, ConfigError, type Json, num, obj, str } from './json-check';

export interface UpgradeData {
  id: string;
  /** Tên và mô tả hiện ở Quầy Mira. */
  name: string;
  desc: string;
  maxLevel: number;
  baseCost: number;
  costGrowth: number;
  /** Chữ mô tả (chưa dùng trong công thức). */
  effectPerLevel: string;
  /** Sát thương gây ra cộng thêm mỗi cấp upgrade (arc_core). */
  damagePerLevel?: number;
  /** Sát thương nhận giảm mỗi cấp upgrade (armor_plating). */
  damageTakenPerLevel?: number;
  /** Năng lượng tối đa của vũ khí boss cộng thêm mỗi cấp, theo tỷ lệ (energy_cell). */
  energyMaxPerLevel?: number;
  /** Tầm hút Core Bit mỗi cấp, ô (magnet_range). */
  magnetTilesPerLevel?: number;
}

/**
 * Upgrade có tác dụng trong game chưa (có ít nhất một trường số mà công thức build dùng). Chưa có
 * thì chưa bán dù đã tới mốc mở (duyệt EP-09: không bán món vô dụng).
 */
export function upgradeHasEffect(u: UpgradeData): boolean {
  return (
    u.damagePerLevel !== undefined ||
    u.damageTakenPerLevel !== undefined ||
    u.energyMaxPerLevel !== undefined ||
    u.magnetTilesPerLevel !== undefined
  );
}

/** Một mốc mở hàng: từ khi hạ `afterBosses` boss chiến dịch, mỗi Upgrade mua được tới cấp ghi ở đây. */
export interface UnlockTier {
  afterBosses: number;
  maxLevel: Readonly<Record<string, number>>;
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
  /** Mốc tăng dần theo số boss; Upgrade không có trong mốc nào đã đạt thì chưa mở. */
  unlockSchedule: readonly UnlockTier[];
  boosters: Readonly<Record<string, BoosterData>>;
}

/** Trường số mà công thức build cần (id → trường). */
const REQUIRED_NUMBERS = {
  upgrades: {
    arc_core: 'damagePerLevel',
    armor_plating: 'damageTakenPerLevel',
    energy_cell: 'energyMaxPerLevel',
    magnet_range: 'magnetTilesPerLevel',
  },
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
      name: str(o.name, `${p}.name`),
      desc: str(o.desc, `${p}.desc`),
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
    if (o.energyMaxPerLevel !== undefined)
      u.energyMaxPerLevel = num(o.energyMaxPerLevel, `${p}.energyMaxPerLevel`, { min: 0 });
    if (o.magnetTilesPerLevel !== undefined)
      u.magnetTilesPerLevel = num(o.magnetTilesPerLevel, `${p}.magnetTilesPerLevel`, { min: 0 });
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
  return { upgrades, unlockSchedule: parseSchedule(s.unlockSchedule, upgrades), boosters };
}

/**
 * Lịch mở: mốc tăng dần; cấp mỗi mốc là số nguyên trong [1, maxLevel] và không giảm ở mốc sau;
 * mốc cuối mở đủ mọi cấp của mọi Upgrade (không món nào khóa mãi).
 */
function parseSchedule(value: unknown, upgrades: Record<string, UpgradeData>): UnlockTier[] {
  const tiers: UnlockTier[] = [];
  const reached: Record<string, number> = {};
  arr(value, 'shop.unlockSchedule').forEach((item, i) => {
    const p = `shop.unlockSchedule[${i}]`;
    const o = obj(item, p);
    const afterBosses = num(o.afterBosses, `${p}.afterBosses`, { min: 0 });
    if (!Number.isInteger(afterBosses)) throw new ConfigError(`${p}.afterBosses: cần số nguyên`);
    const prev = tiers[tiers.length - 1];
    if (prev && afterBosses <= prev.afterBosses)
      throw new ConfigError(`${p}.afterBosses: phải lớn hơn mốc trước (${prev.afterBosses})`);
    const maxLevel: Record<string, number> = {};
    for (const [id, raw] of Object.entries(obj(o.maxLevel, `${p}.maxLevel`))) {
      const u = upgrades[id];
      if (!u) throw new ConfigError(`${p}.maxLevel: Upgrade lạ "${id}"`);
      const lv = num(raw, `${p}.maxLevel.${id}`, { min: 1 });
      if (!Number.isInteger(lv) || lv > u.maxLevel)
        throw new ConfigError(`${p}.maxLevel.${id}: cần số nguyên từ 1 tới ${u.maxLevel}`);
      if (lv < (reached[id] ?? 0))
        throw new ConfigError(
          `${p}.maxLevel.${id}: không được thấp hơn mốc trước (${reached[id]})`,
        );
      maxLevel[id] = lv;
    }
    for (const [id, lv] of Object.entries(reached))
      if (maxLevel[id] === undefined) maxLevel[id] = lv;
    Object.assign(reached, maxLevel);
    tiers.push({ afterBosses, maxLevel });
  });
  if (tiers.length === 0) throw new ConfigError('shop.unlockSchedule: cần ít nhất một mốc');
  for (const u of Object.values(upgrades))
    if ((reached[u.id] ?? 0) < u.maxLevel)
      throw new ConfigError(
        `shop.unlockSchedule: mốc cuối phải mở ${u.id} tới cấp ${u.maxLevel} (đang ${reached[u.id] ?? 0})`,
      );
  return tiers;
}

/** Phần của economy.json mà Shop dùng: thu Core Bit một lượt màn (kinh tế mục 2), để gợi ý khi thiếu tiền. */
export interface EconomyData {
  /** Core Bit một lượt màn thứ `stage` ở độ khó Thường; nhân `rewardMul` của độ khó. */
  incomeFormula: string;
}

export function parseEconomy(value: unknown): EconomyData {
  const e = obj(value, 'economy');
  const incomeFormula = str(e.incomeFormula, 'economy.incomeFormula');
  for (const stage of [1, 8]) {
    let v: number;
    try {
      v = evaluateFormula(incomeFormula, { stage });
    } catch (err) {
      throw new ConfigError(`economy.incomeFormula: ${String(err)}`);
    }
    if (!Number.isFinite(v) || v < 0)
      throw new ConfigError(`economy.incomeFormula: màn ${stage} cho ${v}, cần số ≥ 0`);
  }
  return { incomeFormula };
}
