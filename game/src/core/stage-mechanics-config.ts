import { ConfigError, num, obj } from './json-check';

/** Cơ chế màn chơi (M7), `stages.json` → `mechanics`. Xem ghi chú trong file dữ liệu. */
export interface StageMechanics {
  respawnSec: number;
  maxRespawnSec: number;
  pit: { damage: number; returnSec: number };
  spikes: { damage: number };
  vine: {
    periodSec: number;
    amplitudeTiles: number;
    lengthTiles: number;
    platformWidthTiles: number;
    jumpBonus: number;
  };
  minEnemySpawnTiles: number;
  /** EXP, Core Bit của mỗi kẻ địch chỉ nhận một lần mỗi lượt vào màn (kẻ địch dựng lại không cho lại). */
  enemyRewardOncePerRun: boolean;
  /** Mối nguy môi trường theo nhịp (laser) báo trước ít nhất chừng này giây (GDD 16 mục 3.12). */
  minTelegraphSec: number;
  /** Laser môi trường Stage 2 (GDD 16 mục 3.3; dùng từ ST-15-02). */
  laser: LaserMechanics;
  mirror: MirrorMechanics;
  sensor: { holdSec: number };
}

export interface LaserMechanics {
  damage: number;
  beamWidthPx: number;
  knockbackTilesPerSec: number;
  hitsPerActivation: number;
  hurtsEnemies: boolean;
  pulse: { periodSec: number; onSec: number; warnSec: number };
}

/** Mức nạp tối thiểu để đổi góc gương (`player`: đạn thường, nạp vừa, nạp đầy). */
export const MIRROR_CHARGES = ['shot', 'mid', 'charged'] as const;
export type MirrorCharge = (typeof MIRROR_CHARGES)[number];

export interface MirrorMechanics {
  toggleMinCharge: MirrorCharge;
  rotateSec: number;
  maxBounces: number;
}

function bool(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new ConfigError(`${path}: cần true/false`);
  return value;
}

function int(value: unknown, path: string, min: number): number {
  const n = num(value, path, { min });
  if (!Number.isInteger(n)) throw new ConfigError(`${path}: cần số nguyên`);
  return n;
}

function parseLaser(value: unknown, p: string, minWarnSec: number): LaserMechanics {
  const l = obj(value, p);
  const pulse = obj(l.pulse, `${p}.pulse`);
  const out: LaserMechanics = {
    damage: num(l.damage, `${p}.damage`, { min: 0 }),
    beamWidthPx: num(l.beamWidthPx, `${p}.beamWidthPx`, { min: 1 }),
    knockbackTilesPerSec: num(l.knockbackTilesPerSec, `${p}.knockbackTilesPerSec`, { min: 0 }),
    hitsPerActivation: int(l.hitsPerActivation, `${p}.hitsPerActivation`, 1),
    hurtsEnemies: bool(l.hurtsEnemies, `${p}.hurtsEnemies`),
    pulse: {
      periodSec: num(pulse.periodSec, `${p}.pulse.periodSec`, { min: 0.1 }),
      onSec: num(pulse.onSec, `${p}.pulse.onSec`, { min: 0.05 }),
      warnSec: num(pulse.warnSec, `${p}.pulse.warnSec`, { min: 0 }),
    },
  };
  const { periodSec, onSec, warnSec } = out.pulse;
  if (warnSec + 1e-9 < minWarnSec)
    throw new ConfigError(`${p}.pulse.warnSec: báo trước ${warnSec} s < ${minWarnSec} s`);
  // Phải còn khoảng tắt hẳn (không báo, không bật) để người chơi qua được.
  if (onSec + warnSec >= periodSec)
    throw new ConfigError(
      `${p}.pulse: bật ${onSec} s + báo ${warnSec} s phải ngắn hơn chu kỳ ${periodSec} s`,
    );
  return out;
}

function parseMirror(value: unknown, p: string): MirrorMechanics {
  const m = obj(value, p);
  const charge = m.toggleMinCharge;
  if (typeof charge !== 'string' || !MIRROR_CHARGES.includes(charge as MirrorCharge))
    throw new ConfigError(`${p}.toggleMinCharge: cần một trong ${MIRROR_CHARGES.join(', ')}`);
  // Đạn thường đổi được gương thì tự bắn trên cảm ứng xoay nhầm (GDD 16 mục 3.3).
  if (charge === 'shot')
    throw new ConfigError(`${p}.toggleMinCharge: đạn thường không được đổi góc gương`);
  return {
    toggleMinCharge: charge as MirrorCharge,
    rotateSec: num(m.rotateSec, `${p}.rotateSec`, { min: 0 }),
    maxBounces: int(m.maxBounces, `${p}.maxBounces`, 1),
  };
}

export function parseStageMechanics(value: unknown): StageMechanics {
  const p = 'stages.mechanics';
  const m = obj(value, p);
  const pit = obj(m.pit, `${p}.pit`);
  const spikes = obj(m.spikes, `${p}.spikes`);
  const vine = obj(m.vine, `${p}.vine`);
  const out: StageMechanics = {
    respawnSec: num(m.respawnSec, `${p}.respawnSec`, { min: 0 }),
    maxRespawnSec: num(m.maxRespawnSec, `${p}.maxRespawnSec`, { min: 0 }),
    pit: {
      damage: num(pit.damage, `${p}.pit.damage`, { min: 0 }),
      returnSec: num(pit.returnSec, `${p}.pit.returnSec`, { min: 0 }),
    },
    spikes: { damage: num(spikes.damage, `${p}.spikes.damage`, { min: 0 }) },
    vine: {
      periodSec: num(vine.periodSec, `${p}.vine.periodSec`, { min: 0.1 }),
      amplitudeTiles: num(vine.amplitudeTiles, `${p}.vine.amplitudeTiles`, { min: 0 }),
      lengthTiles: num(vine.lengthTiles, `${p}.vine.lengthTiles`, { min: 1 }),
      platformWidthTiles: num(vine.platformWidthTiles, `${p}.vine.platformWidthTiles`, { min: 1 }),
      jumpBonus: num(vine.jumpBonus, `${p}.vine.jumpBonus`, { min: 0 }),
    },
    minEnemySpawnTiles: num(m.minEnemySpawnTiles, `${p}.minEnemySpawnTiles`, { min: 0 }),
    minTelegraphSec: num(m.minTelegraphSec, `${p}.minTelegraphSec`, { min: 0 }),
    laser: parseLaser(
      m.laser,
      `${p}.laser`,
      num(m.minTelegraphSec, `${p}.minTelegraphSec`, { min: 0 }),
    ),
    mirror: parseMirror(m.mirror, `${p}.mirror`),
    sensor: {
      holdSec: num(obj(m.sensor, `${p}.sensor`).holdSec, `${p}.sensor.holdSec`, { min: 0 }),
    },
    enemyRewardOncePerRun: (() => {
      if (typeof m.enemyRewardOncePerRun !== 'boolean')
        throw new ConfigError(`${p}.enemyRewardOncePerRun: cần true/false`);
      return m.enemyRewardOncePerRun;
    })(),
  };
  if (out.respawnSec > out.maxRespawnSec)
    throw new ConfigError(
      `${p}.respawnSec: hồi sinh ${out.respawnSec} s chậm hơn giới hạn ${out.maxRespawnSec} s (đặc tả mục 8)`,
    );
  if (out.pit.returnSec > out.maxRespawnSec)
    throw new ConfigError(`${p}.pit.returnSec: chậm hơn giới hạn ${out.maxRespawnSec} s`);
  if (out.vine.lengthTiles < out.vine.amplitudeTiles)
    throw new ConfigError(`${p}.vine: dây ngắn hơn biên độ lắc thì không lắc đủ biên độ`);
  return out;
}
