/**
 * Kiểu và kiểm tra bosses.json (logic thuần), kèm các nguyên tắc của GDD 9:
 * telegraph ≥ minTelegraphSec kể cả khi pha cuối tăng tốc, và không đòn nào gây chết ngay.
 */
import { arr, ConfigError, type Json, num, obj, str } from './json-check';
import type { SizePx } from './weapons-config';

export type BossAttackId = 'shot' | 'charge' | 'slam' | 'rain';
const ATTACK_IDS: readonly BossAttackId[] = ['shot', 'charge', 'slam', 'rain'];

export interface BossPhaseData {
  /** Pha này kéo dài tới khi máu còn dưới mức này (%); pha cuối là 0. */
  untilHpPct: number;
  speedMul: number;
  attacks: BossAttackId[];
}

export interface ShotAttack {
  telegraphSec: number;
  count: number;
  intervalSec: number;
  speedTilesPerSec: number;
  damage: number;
  recoverSec: number;
  sizePx: SizePx;
}

export interface ChargeAttack {
  telegraphSec: number;
  speedTilesPerSec: number;
  damage: number;
  recoverSec: number;
}

export interface SlamAttack {
  telegraphSec: number;
  airSec: number;
  damage: number;
  shockwave: { speedTilesPerSec: number; damage: number; sizePx: SizePx };
  recoverSec: number;
}

export interface RainAttack {
  telegraphSec: number;
  activeSec: number;
  fallSpeedTilesPerSec: number;
  damage: number;
  safeGaps: number;
  gapWidthTiles: number;
  stunAfterSec: number;
  sizePx: SizePx;
}

export interface BossData {
  id: string;
  name: string;
  hp: number;
  sizePx: SizePx;
  contactDamage: number;
  weakness: string;
  idleSec: number;
  minTelegraphSec: number;
  phases: BossPhaseData[];
  attacks: { shot: ShotAttack; charge: ChargeAttack; slam: SlamAttack; rain: RainAttack };
}

function size(value: unknown, path: string): SizePx {
  const s = obj(value, path);
  return { w: num(s.w, `${path}.w`, { min: 1 }), h: num(s.h, `${path}.h`, { min: 1 }) };
}

function parseBoss(id: string, value: unknown): BossData {
  const p = `bosses.${id}`;
  const b = obj(value, p);
  const a = obj(b.attacks, `${p}.attacks`);
  const shot: Json = obj(a.shot, `${p}.attacks.shot`);
  const charge: Json = obj(a.charge, `${p}.attacks.charge`);
  const slam: Json = obj(a.slam, `${p}.attacks.slam`);
  const wave: Json = obj(slam.shockwave, `${p}.attacks.slam.shockwave`);
  const rain: Json = obj(a.rain, `${p}.attacks.rain`);
  const phases = arr(b.phases, `${p}.phases`).map((item, i) => {
    const ph = obj(item, `${p}.phases[${i}]`);
    const attacks = arr(ph.attacks, `${p}.phases[${i}].attacks`).map((x, j) => {
      const name = str(x, `${p}.phases[${i}].attacks[${j}]`);
      if (!ATTACK_IDS.includes(name as BossAttackId)) {
        throw new ConfigError(`${p}.phases[${i}].attacks[${j}]: đòn "${name}" không tồn tại`);
      }
      return name as BossAttackId;
    });
    if (attacks.length === 0) throw new ConfigError(`${p}.phases[${i}]: cần ít nhất một đòn`);
    return {
      untilHpPct: num(ph.untilHpPct, `${p}.phases[${i}].untilHpPct`, { min: 0 }),
      speedMul: num(ph.speedMul, `${p}.phases[${i}].speedMul`, { min: 0.5 }),
      attacks,
    };
  });
  if (phases.length === 0) throw new ConfigError(`${p}.phases: cần ít nhất một pha`);
  return {
    id,
    name: str(b.name, `${p}.name`),
    hp: num(b.hp, `${p}.hp`, { min: 1 }),
    sizePx: size(b.sizePx, `${p}.sizePx`),
    contactDamage: num(b.contactDamage, `${p}.contactDamage`, { min: 0 }),
    weakness: str(b.weakness, `${p}.weakness`),
    idleSec: num(b.idleSec, `${p}.idleSec`, { min: 0 }),
    minTelegraphSec: num(b.minTelegraphSec, `${p}.minTelegraphSec`, { min: 0 }),
    phases,
    attacks: {
      shot: {
        telegraphSec: num(shot.telegraphSec, `${p}.attacks.shot.telegraphSec`, { min: 0 }),
        count: num(shot.count, `${p}.attacks.shot.count`, { min: 1 }),
        intervalSec: num(shot.intervalSec, `${p}.attacks.shot.intervalSec`, { min: 0.05 }),
        speedTilesPerSec: num(shot.speedTilesPerSec, `${p}.attacks.shot.speedTilesPerSec`, {
          min: 1,
        }),
        damage: num(shot.damage, `${p}.attacks.shot.damage`, { min: 0 }),
        recoverSec: num(shot.recoverSec, `${p}.attacks.shot.recoverSec`, { min: 0 }),
        sizePx: size(shot.sizePx, `${p}.attacks.shot.sizePx`),
      },
      charge: {
        telegraphSec: num(charge.telegraphSec, `${p}.attacks.charge.telegraphSec`, { min: 0 }),
        speedTilesPerSec: num(charge.speedTilesPerSec, `${p}.attacks.charge.speedTilesPerSec`, {
          min: 1,
        }),
        damage: num(charge.damage, `${p}.attacks.charge.damage`, { min: 0 }),
        recoverSec: num(charge.recoverSec, `${p}.attacks.charge.recoverSec`, { min: 0 }),
      },
      slam: {
        telegraphSec: num(slam.telegraphSec, `${p}.attacks.slam.telegraphSec`, { min: 0 }),
        airSec: num(slam.airSec, `${p}.attacks.slam.airSec`, { min: 0.2 }),
        damage: num(slam.damage, `${p}.attacks.slam.damage`, { min: 0 }),
        shockwave: {
          speedTilesPerSec: num(
            wave.speedTilesPerSec,
            `${p}.attacks.slam.shockwave.speedTilesPerSec`,
            {
              min: 1,
            },
          ),
          damage: num(wave.damage, `${p}.attacks.slam.shockwave.damage`, { min: 0 }),
          sizePx: size(wave.sizePx, `${p}.attacks.slam.shockwave.sizePx`),
        },
        recoverSec: num(slam.recoverSec, `${p}.attacks.slam.recoverSec`, { min: 0 }),
      },
      rain: {
        telegraphSec: num(rain.telegraphSec, `${p}.attacks.rain.telegraphSec`, { min: 0 }),
        activeSec: num(rain.activeSec, `${p}.attacks.rain.activeSec`, { min: 0.1 }),
        fallSpeedTilesPerSec: num(
          rain.fallSpeedTilesPerSec,
          `${p}.attacks.rain.fallSpeedTilesPerSec`,
          {
            min: 1,
          },
        ),
        damage: num(rain.damage, `${p}.attacks.rain.damage`, { min: 0 }),
        safeGaps: num(rain.safeGaps, `${p}.attacks.rain.safeGaps`, { min: 1 }),
        gapWidthTiles: num(rain.gapWidthTiles, `${p}.attacks.rain.gapWidthTiles`, { min: 1 }),
        stunAfterSec: num(rain.stunAfterSec, `${p}.attacks.rain.stunAfterSec`, { min: 0 }),
        sizePx: size(rain.sizePx, `${p}.attacks.rain.sizePx`),
      },
    },
  };
}

export function parseBosses(value: unknown): Record<string, BossData> {
  const root = obj(value, 'bosses');
  const out: Record<string, BossData> = {};
  for (const [id, boss] of Object.entries(root)) {
    if (id.startsWith('_')) continue;
    out[id] = parseBoss(id, boss);
  }
  return out;
}

/**
 * Nguyên tắc GDD 9 cho mọi boss: telegraph sau khi chia speedMul vẫn ≥ minTelegraphSec;
 * không đòn nào (kể cả va chạm) gây ≥ máu người chơi cấp 1 ở độ khó Thường.
 */
export function checkBossRules(boss: BossData, playerBaseHp: number): string[] {
  const errors: string[] = [];
  const maxSpeed = Math.max(...boss.phases.map((ph) => ph.speedMul));
  for (const id of ATTACK_IDS) {
    const telegraph = boss.attacks[id].telegraphSec / maxSpeed;
    if (telegraph + 1e-9 < boss.minTelegraphSec) {
      errors.push(
        `${boss.id}.${id}: telegraph ${telegraph.toFixed(2)} s sau tăng tốc < ${boss.minTelegraphSec} s`,
      );
    }
  }
  const damages = [
    boss.contactDamage,
    boss.attacks.shot.damage,
    boss.attacks.charge.damage,
    boss.attacks.slam.damage,
    boss.attacks.slam.shockwave.damage,
    boss.attacks.rain.damage,
  ];
  if (Math.max(...damages) >= playerBaseHp) {
    errors.push(`${boss.id}: có đòn gây ≥ ${playerBaseHp} sát thương (chết ngay một đòn)`);
  }
  const thresholds = boss.phases.map((ph) => ph.untilHpPct);
  for (let i = 1; i < thresholds.length; i += 1) {
    if ((thresholds[i] ?? 0) >= (thresholds[i - 1] ?? 0)) {
      errors.push(`${boss.id}.phases: ngưỡng máu phải giảm dần`);
    }
  }
  if (thresholds[thresholds.length - 1] !== 0)
    errors.push(`${boss.id}.phases: pha cuối phải có untilHpPct = 0`);
  return errors;
}
