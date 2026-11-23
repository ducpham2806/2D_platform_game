/** Kiểu và kiểm tra weapons.json (logic thuần). */
import {
  arr,
  ConfigError,
  type Json,
  num,
  obj,
  positiveNum,
  size,
  type SizePx,
  str,
} from './json-check';

export type { SizePx } from './json-check';

export interface ChargeLevelData {
  timeSec: number;
  damageMul: number;
  pierce: number;
  breaksShield: boolean;
  sizePx: SizePx;
}

export interface ArcCannonData {
  damage: number;
  maxOnScreen: number;
  fireIntervalSec: number;
  autoFireIntervalSec: number;
  projectile: { speedTilesPerSec: number; rangeTiles: number; sizePx: SizePx };
  muzzleOffsetPx: { x: number; y: number };
  midCharge: ChargeLevelData;
  charge: ChargeLevelData;
  chargeKeepAfterSwapSec: number;
}

export interface SweepBehavior {
  type: 'sweep';
  rangeTiles: number;
  heightPx: number;
  damageMul: number;
  activeSec: number;
  cooldownSec: number;
}

/**
 * Prism Beam (GDD 16 mục 3.7): tia tức thời theo `LaserPath`, xuyên mọi kẻ địch trên đường, phản xạ
 * ở gương tối đa `maxBounces`.
 */
export interface BeamBehavior {
  type: 'beam';
  rangeTiles: number;
  widthPx: number;
  damageMul: number;
  activeSec: number;
  cooldownSec: number;
  maxBounces: number;
}

/** Frost Shard (GDD 16 mục 4.7, QB-19); dùng từ ST-15-04. */
export interface ShardBehavior {
  type: 'shard';
  speedTilesPerSec: number;
  rangeTiles: number;
  sizePx: SizePx;
  damageMul: number;
  cooldownSec: number;
  freezeSec: number;
}

/** Cấu hình Gale Cutter (GDD 16 mục 5.7, Q4); hành vi trong ST-15-05. */
export interface BoomerangBehavior {
  type: 'boomerang';
  outTiles: number;
  speedTilesPerSec: number;
  sizePx: SizePx;
  damageMul: number;
  maxOnScreen: number;
  maxCancelsPerThrow: number;
  cancelKinds: readonly ('enemyShot' | 'bomb')[];
}

export type WeaponBehavior = SweepBehavior | BeamBehavior | ShardBehavior | BoomerangBehavior;

/**
 * Số lần trúng một mục tiêu mỗi lần dùng (ngân sách năng lượng, GDD 16 mục 2.3). Roi, tia và đạn
 * băng trúng mỗi mục tiêu một lần; Gale Cutter trúng ở cả chiều đi lẫn chiều về.
 */
export function hitsPerUse(b: WeaponBehavior): number {
  return b.type === 'boomerang' ? 2 : 1;
}

/** Ngưỡng cân bằng vũ khí (`weapons.json → balance`). */
export interface WeaponBalance {
  /** Sát thương mỗi thanh năng lượng (đơn vị phát Arc Cannon) mục tiêu và độ lệch cho phép. */
  budgetTarget: number;
  budgetTolerance: number;
  /** Sức mạnh khắc chế tối thiểu (sát thương/giây lên boss yếu). */
  minCounterPerSec: number;
}

export interface BossWeaponData {
  name: string;
  from: string;
  weakBoss: string[];
  damageVsWeak: number;
  weakStunSec: number;
  /** null nếu chưa có dữ liệu tiêu hao. */
  energyCost: number | null;
  behavior: WeaponBehavior | null;
}

export interface WeaponsData {
  energyMax: number;
  energyRegen: { perSec: number; afterNoFireSec: number };
  hitStopSteps: { charged: number; weakness: number };
  arcCannon: ArcCannonData;
  bossWeapons: BossWeaponData[];
  balance: WeaponBalance;
}

function bool(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new ConfigError(`${path}: cần true/false`);
  return value;
}

function chargeLevel(value: unknown, path: string): ChargeLevelData {
  const c = obj(value, path);
  return {
    timeSec: num(c.timeSec, `${path}.timeSec`, { min: 0 }),
    damageMul: num(c.damageMul, `${path}.damageMul`, { min: 1 }),
    pierce: num(c.pierce, `${path}.pierce`, { min: 0 }),
    breaksShield: bool(c.breaksShield, `${path}.breaksShield`),
    sizePx: size(c.sizePx, `${path}.sizePx`),
  };
}

function behavior(value: unknown, path: string): WeaponBehavior | null {
  if (value === null || value === undefined) return null;
  const b: Json = obj(value, path);
  if (b.type === 'beam') {
    const maxBounces = num(b.maxBounces, `${path}.maxBounces`, { min: 0 });
    if (!Number.isInteger(maxBounces)) throw new ConfigError(`${path}.maxBounces: cần số nguyên`);
    return {
      type: 'beam',
      rangeTiles: num(b.rangeTiles, `${path}.rangeTiles`, { min: 1 }),
      widthPx: num(b.widthPx, `${path}.widthPx`, { min: 1 }),
      damageMul: num(b.damageMul, `${path}.damageMul`, { min: 0 }),
      activeSec: num(b.activeSec, `${path}.activeSec`, { min: 0.02 }),
      cooldownSec: num(b.cooldownSec, `${path}.cooldownSec`, { min: 0.05 }),
      maxBounces,
    };
  }
  if (b.type === 'shard') {
    return {
      type: 'shard',
      speedTilesPerSec: num(b.speedTilesPerSec, `${path}.speedTilesPerSec`, { min: 1 }),
      rangeTiles: num(b.rangeTiles, `${path}.rangeTiles`, { min: 1 }),
      sizePx: size(b.sizePx, `${path}.sizePx`),
      damageMul: num(b.damageMul, `${path}.damageMul`, { min: 0 }),
      cooldownSec: num(b.cooldownSec, `${path}.cooldownSec`, { min: 0.05 }),
      freezeSec: positiveNum(b.freezeSec, `${path}.freezeSec`),
    };
  }
  if (b.type === 'boomerang') {
    const maxOnScreen = num(b.maxOnScreen, `${path}.maxOnScreen`, { min: 1 });
    const maxCancelsPerThrow = num(b.maxCancelsPerThrow, `${path}.maxCancelsPerThrow`, { min: 0 });
    if (!Number.isSafeInteger(maxOnScreen))
      throw new ConfigError(`${path}.maxOnScreen: cần số nguyên`);
    if (!Number.isSafeInteger(maxCancelsPerThrow))
      throw new ConfigError(`${path}.maxCancelsPerThrow: cần số nguyên`);
    const cancelKinds = arr(b.cancelKinds, `${path}.cancelKinds`).map((kind, i) => {
      if (kind === 'enemyShot' || kind === 'bomb') return kind;
      throw new ConfigError(`${path}.cancelKinds[${i}]: cần enemyShot hoặc bomb`);
    });
    if (new Set(cancelKinds).size !== cancelKinds.length)
      throw new ConfigError(`${path}.cancelKinds: loại đạn không được lặp`);
    return {
      type: 'boomerang',
      outTiles: positiveNum(b.outTiles, `${path}.outTiles`),
      speedTilesPerSec: positiveNum(b.speedTilesPerSec, `${path}.speedTilesPerSec`),
      sizePx: size(b.sizePx, `${path}.sizePx`),
      damageMul: num(b.damageMul, `${path}.damageMul`, { min: 0 }),
      maxOnScreen,
      maxCancelsPerThrow,
      cancelKinds,
    };
  }
  if (b.type !== 'sweep')
    throw new ConfigError(`${path}.type: hành vi "${String(b.type)}" chưa hỗ trợ`);
  return {
    type: 'sweep',
    rangeTiles: num(b.rangeTiles, `${path}.rangeTiles`, { min: 0.5 }),
    heightPx: num(b.heightPx, `${path}.heightPx`, { min: 1 }),
    damageMul: num(b.damageMul, `${path}.damageMul`, { min: 0 }),
    activeSec: num(b.activeSec, `${path}.activeSec`, { min: 0.02 }),
    cooldownSec: num(b.cooldownSec, `${path}.cooldownSec`, { min: 0 }),
  };
}

export function parseWeapons(value: unknown): WeaponsData {
  const w = obj(value, 'weapons');
  const arc = obj(w.arcCannon, 'weapons.arcCannon');
  const projectile = obj(arc.projectile, 'weapons.arcCannon.projectile');
  const muzzle = obj(arc.muzzleOffsetPx, 'weapons.arcCannon.muzzleOffsetPx');
  const regen = obj(w.energyRegen, 'weapons.energyRegen');
  const hitStop = obj(w.hitStopSteps, 'weapons.hitStopSteps');
  const energyMax = num(w.energyMax, 'weapons.energyMax', { min: 1 });
  const midCharge = chargeLevel(arc.midCharge, 'weapons.arcCannon.midCharge');
  const charge = chargeLevel(arc.charge, 'weapons.arcCannon.charge');
  if (midCharge.timeSec >= charge.timeSec) {
    throw new ConfigError('weapons.arcCannon: midCharge.timeSec phải nhỏ hơn charge.timeSec');
  }
  const bossWeapons = arr(w.bossWeapons, 'weapons.bossWeapons').map((item, i) => {
    const p = `weapons.bossWeapons[${i}]`;
    const b = obj(item, p);
    const cost = b.energyCostOf28;
    const parsedBehavior = behavior(b.behavior, `${p}.behavior`);
    if (
      parsedBehavior &&
      (typeof cost !== 'number' || !Number.isFinite(cost) || cost <= 0 || cost > energyMax)
    ) {
      throw new ConfigError(
        `${p}.energyCostOf28: vũ khí có cấu hình hành vi cần mức tiêu hao trong (0, ${energyMax}]`,
      );
    }
    return {
      name: str(b.name, `${p}.name`),
      from: str(b.from, `${p}.from`),
      weakBoss: arr(b.weakBoss, `${p}.weakBoss`).map((x, j) => str(x, `${p}.weakBoss[${j}]`)),
      damageVsWeak: num(b.damageVsWeak, `${p}.damageVsWeak`, { min: 1 }),
      weakStunSec: num(b.weakStunSec, `${p}.weakStunSec`, { min: 0 }),
      energyCost: typeof cost === 'number' ? cost : null,
      behavior: parsedBehavior,
    };
  });
  const bal = obj(w.balance, 'weapons.balance');
  const balance: WeaponBalance = {
    budgetTarget: num(bal.budgetTarget, 'weapons.balance.budgetTarget', { min: 1 }),
    budgetTolerance: num(bal.budgetTolerance, 'weapons.balance.budgetTolerance', { min: 0 }),
    minCounterPerSec: num(bal.minCounterPerSec, 'weapons.balance.minCounterPerSec', { min: 0 }),
  };
  if (balance.budgetTolerance >= 1)
    throw new ConfigError('weapons.balance.budgetTolerance: cần < 1 (tỷ lệ, 0,15 = ±15%)');
  return {
    energyMax,
    balance,
    energyRegen: {
      perSec: num(regen.perSec, 'weapons.energyRegen.perSec', { min: 0 }),
      afterNoFireSec: num(regen.afterNoFireSec, 'weapons.energyRegen.afterNoFireSec', { min: 0 }),
    },
    hitStopSteps: {
      charged: num(hitStop.charged, 'weapons.hitStopSteps.charged', { min: 0 }),
      weakness: num(hitStop.weakness, 'weapons.hitStopSteps.weakness', { min: 0 }),
    },
    arcCannon: {
      damage: num(arc.damage, 'weapons.arcCannon.damage', { min: 0 }),
      maxOnScreen: num(arc.maxOnScreen, 'weapons.arcCannon.maxOnScreen', { min: 1 }),
      fireIntervalSec: num(arc.fireIntervalSec, 'weapons.arcCannon.fireIntervalSec', { min: 0 }),
      autoFireIntervalSec: num(arc.autoFireIntervalSec, 'weapons.arcCannon.autoFireIntervalSec', {
        min: 0.05,
      }),
      projectile: {
        speedTilesPerSec: num(
          projectile.speedTilesPerSec,
          'weapons.arcCannon.projectile.speedTilesPerSec',
          {
            min: 1,
          },
        ),
        rangeTiles: num(projectile.rangeTiles, 'weapons.arcCannon.projectile.rangeTiles', {
          min: 1,
        }),
        sizePx: size(projectile.sizePx, 'weapons.arcCannon.projectile.sizePx'),
      },
      muzzleOffsetPx: {
        x: num(muzzle.x, 'weapons.arcCannon.muzzleOffsetPx.x'),
        y: num(muzzle.y, 'weapons.arcCannon.muzzleOffsetPx.y'),
      },
      midCharge,
      charge,
      chargeKeepAfterSwapSec: num(
        arc.chargeKeepAfterSwapSec,
        'weapons.arcCannon.chargeKeepAfterSwapSec',
        {
          min: 0,
        },
      ),
    },
    bossWeapons,
  };
}

/** Sát thương mỗi thanh năng lượng: floor(energyMax / tiêu hao) × damageMul × trúng mỗi lần. */
export function energyBudget(w: BossWeaponData, energyMax: number): number | undefined {
  if (!w.behavior || w.energyCost === null) return undefined;
  return Math.floor(energyMax / w.energyCost) * w.behavior.damageMul * hitsPerUse(w.behavior);
}

/** Sức mạnh khắc chế theo cooldownSec. Gale Cutter cần đo chu kỳ đón lưỡi khi đấu Terra. */
export function counterPerSec(w: BossWeaponData): number | undefined {
  const b = w.behavior;
  if (!b || b.type === 'boomerang' || b.cooldownSec <= 0) return undefined;
  return (b.damageMul * hitsPerUse(b) * w.damageVsWeak) / b.cooldownSec;
}

/**
 * Ngân sách năng lượng 14 ± 15% cho vũ khí đã có cấu hình hành vi và sức mạnh khắc chế
 * ≥ 12/s cho vũ khí dùng cooldownSec (GDD 16 mục 2.3).
 */
export function checkWeaponBalance(data: WeaponsData): string[] {
  const errors: string[] = [];
  const { budgetTarget, budgetTolerance, minCounterPerSec } = data.balance;
  for (const w of data.bossWeapons) {
    const budget = energyBudget(w, data.energyMax);
    if (
      budget !== undefined &&
      Math.abs(budget - budgetTarget) > budgetTarget * budgetTolerance + 1e-9
    )
      errors.push(
        `weapons.${w.name}: ngân sách ${budget} mỗi thanh lệch mục tiêu ${budgetTarget} quá ${budgetTolerance * 100}%`,
      );
    const counter = counterPerSec(w);
    if (counter !== undefined && counter + 1e-9 < minCounterPerSec)
      errors.push(
        `weapons.${w.name}: sức mạnh khắc chế ${counter.toFixed(1)}/s < ${minCounterPerSec}/s`,
      );
  }
  return errors;
}
