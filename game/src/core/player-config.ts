/** Kiểu và kiểm tra player.json (logic thuần). */
import { ConfigError, num, obj, str } from './json-check';

export interface PlayerData {
  speedTilesPerSec: number;
  hitboxPx: { width: number; height: number };
  jump: {
    minTiles: number;
    maxTiles: number;
    coyoteSec: number;
    bufferSec: number;
    apexSec: number;
    fallGravityMul: number;
    maxFallTilesPerSec: number;
  };
  dash: { tiles: number; durationSec: number; cooldownSec: number; iFrameSec: number };
  wallSlideTilesPerSec: number;
  wallJump: { pushTilesPerSec: number; lockSec: number };
  iFramesAfterHitSec: number;
  hurt: { stunSec: number; knockbackTilesPerSec: { x: number; y: number } };
  abilities: { airDash: boolean; wallJump: boolean; dashJump: boolean };
  level: LevelData;
  inPlaceRevivePerStage: { max: number };
  moduleSlots: { start: number; at10: number; at20: number };
}

/** Cấp và chỉ số (GDD 6.1, 6.2): công thức theo biến L, SP mỗi cấp/boss, trần sức mạnh cốt truyện. */
export interface LevelData {
  max: number;
  /** EXP cần để lên từ cấp L lên L+1. */
  expFormula: string;
  hp: string;
  atk: string;
  spPerLevelFrom2: number;
  spPerBoss: number;
  /** Trần so với cấp 1 của cấp + upgrade + module trong cốt truyện (GDD 6.1). */
  storyPowerCap: {
    damageMul: number;
    hpMul: number;
    /** Thường trực × hiệu ứng có điều kiện (Last Stand). */
    conditionalDamageMul: number;
    /** Máu tối đa / hệ số giảm sát thương tốt nhất của build. */
    effectiveHpMul: number;
  };
}

export function parsePlayer(value: unknown): PlayerData {
  const p = obj(value, 'player');
  const jump = obj(p.jump, 'player.jump');
  const dash = obj(p.dash, 'player.dash');
  const level = obj(p.level, 'player.level');
  const cap = obj(level.storyPowerCap, 'player.level.storyPowerCap');
  const revive = obj(p.inPlaceRevivePerStage, 'player.inPlaceRevivePerStage');
  const slots = obj(p.moduleSlots, 'player.moduleSlots');
  const hitbox = obj(p.hitboxPx, 'player.hitboxPx');
  const wallJump = obj(p.wallJump, 'player.wallJump');
  const hurt = obj(p.hurt, 'player.hurt');
  const knockback = obj(hurt.knockbackTilesPerSec, 'player.hurt.knockbackTilesPerSec');
  const abilities = obj(p.abilities, 'player.abilities');
  const bool = (v: unknown, path: string): boolean => {
    if (typeof v !== 'boolean') throw new ConfigError(`${path}: cần true/false`);
    return v;
  };
  const minTiles = num(jump.minTiles, 'player.jump.minTiles', { min: 0 });
  const maxTiles = num(jump.maxTiles, 'player.jump.maxTiles', { min: 0 });
  if (minTiles > maxTiles) throw new ConfigError('player.jump: minTiles lớn hơn maxTiles');
  return {
    speedTilesPerSec: num(p.speedTilesPerSec, 'player.speedTilesPerSec', { min: 0 }),
    hitboxPx: {
      width: num(hitbox.width, 'player.hitboxPx.width', { min: 1 }),
      height: num(hitbox.height, 'player.hitboxPx.height', { min: 1 }),
    },
    jump: {
      minTiles,
      maxTiles,
      coyoteSec: num(jump.coyoteSec, 'player.jump.coyoteSec', { min: 0 }),
      bufferSec: num(jump.bufferSec, 'player.jump.bufferSec', { min: 0 }),
      apexSec: num(jump.apexSec, 'player.jump.apexSec', { min: 0.05 }),
      fallGravityMul: num(jump.fallGravityMul, 'player.jump.fallGravityMul', { min: 0.1 }),
      maxFallTilesPerSec: num(jump.maxFallTilesPerSec, 'player.jump.maxFallTilesPerSec', {
        min: 1,
      }),
    },
    dash: {
      tiles: num(dash.tiles, 'player.dash.tiles', { min: 0 }),
      durationSec: num(dash.durationSec, 'player.dash.durationSec', { min: 0 }),
      cooldownSec: num(dash.cooldownSec, 'player.dash.cooldownSec', { min: 0 }),
      iFrameSec: num(dash.iFrameSec, 'player.dash.iFrameSec', { min: 0 }),
    },
    wallSlideTilesPerSec: num(p.wallSlideTilesPerSec, 'player.wallSlideTilesPerSec', { min: 0 }),
    wallJump: {
      pushTilesPerSec: num(wallJump.pushTilesPerSec, 'player.wallJump.pushTilesPerSec', { min: 0 }),
      lockSec: num(wallJump.lockSec, 'player.wallJump.lockSec', { min: 0 }),
    },
    iFramesAfterHitSec: num(p.iFramesAfterHitSec, 'player.iFramesAfterHitSec', { min: 0 }),
    hurt: {
      stunSec: num(hurt.stunSec, 'player.hurt.stunSec', { min: 0 }),
      knockbackTilesPerSec: {
        x: num(knockback.x, 'player.hurt.knockbackTilesPerSec.x', { min: 0 }),
        y: num(knockback.y, 'player.hurt.knockbackTilesPerSec.y', { min: 0 }),
      },
    },
    abilities: {
      airDash: bool(abilities.airDash, 'player.abilities.airDash'),
      wallJump: bool(abilities.wallJump, 'player.abilities.wallJump'),
      dashJump: bool(abilities.dashJump, 'player.abilities.dashJump'),
    },
    level: {
      max: num(level.max, 'player.level.max', { min: 1 }),
      expFormula: str(level.expFormula, 'player.level.expFormula'),
      hp: str(level.hp, 'player.level.hp'),
      atk: str(level.atk, 'player.level.atk'),
      spPerLevelFrom2: num(level.spPerLevelFrom2, 'player.level.spPerLevelFrom2', { min: 0 }),
      spPerBoss: num(level.spPerBoss, 'player.level.spPerBoss', { min: 0 }),
      storyPowerCap: {
        damageMul: num(cap.damageMul, 'player.level.storyPowerCap.damageMul', { min: 1 }),
        hpMul: num(cap.hpMul, 'player.level.storyPowerCap.hpMul', { min: 1 }),
        conditionalDamageMul: num(
          cap.conditionalDamageMul,
          'player.level.storyPowerCap.conditionalDamageMul',
          { min: 1 },
        ),
        effectiveHpMul: num(cap.effectiveHpMul, 'player.level.storyPowerCap.effectiveHpMul', {
          min: 1,
        }),
      },
    },
    inPlaceRevivePerStage: { max: num(revive.max, 'player.inPlaceRevivePerStage.max', { min: 0 }) },
    moduleSlots: {
      start: num(slots.start, 'player.moduleSlots.start', { min: 0 }),
      at10: num(slots.at10, 'player.moduleSlots.at10', { min: 0 }),
      at20: num(slots.at20, 'player.moduleSlots.at20', { min: 0 }),
    },
  };
}
