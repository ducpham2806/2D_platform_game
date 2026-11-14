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
