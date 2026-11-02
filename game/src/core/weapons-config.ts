/** Kiểu và kiểm tra weapons.json (logic thuần). */
import { arr, ConfigError, type Json, num, obj, str } from './json-check';

export interface SizePx {
  w: number;
  h: number;
}

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

export interface BossWeaponData {
  name: string;
  from: string;
  weakBoss: string[];
  damageVsWeak: number;
  weakStunSec: number;
  /** null: vũ khí chưa được làm (chưa có hành vi). */
  energyCost: number | null;
  behavior: SweepBehavior | null;
}

export interface WeaponsData {
  energyMax: number;
  energyRegen: { perSec: number; afterNoFireSec: number };
  hitStopSteps: { charged: number; weakness: number };
  arcCannon: ArcCannonData;
  bossWeapons: BossWeaponData[];
}

function bool(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new ConfigError(`${path}: cần true/false`);
  return value;
}

function size(value: unknown, path: string): SizePx {
  const s = obj(value, path);
  return { w: num(s.w, `${path}.w`, { min: 1 }), h: num(s.h, `${path}.h`, { min: 1 }) };
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

function behavior(value: unknown, path: string): SweepBehavior | null {
  if (value === null || value === undefined) return null;
  const b: Json = obj(value, path);
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
    if (parsedBehavior && (typeof cost !== 'number' || cost <= 0 || cost > energyMax)) {
      throw new ConfigError(
        `${p}.energyCostOf28: vũ khí đã có hành vi thì cần mức tiêu hao trong (0, ${energyMax}]`,
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
  return {
    energyMax,
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
