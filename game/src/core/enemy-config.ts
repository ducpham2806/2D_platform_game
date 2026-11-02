/**
 * Kiểu và kiểm tra enemies.json (logic thuần), kèm quy tắc của đặc tả Prologue & Stage 1
 * mục 4: mọi đòn có telegraph ≥ minTelegraphSec, không đòn nào gây chết ngay.
 */
import { ConfigError, type Json, num, obj, size, type SizePx, str } from './json-check';

export type EnemyBehavior = 'drone' | 'turret' | 'butterfly' | 'shieldCharger';
const BEHAVIORS: readonly EnemyBehavior[] = ['drone', 'turret', 'butterfly', 'shieldCharger'];

export interface EnemyProjectileData {
  speedTilesPerSec: number;
  damage: number;
  sizePx: SizePx;
}

interface EnemyCommon {
  id: string;
  name: string;
  /** Máu tính bằng phát Arc Cannon gốc (chưa nhân độ khó). */
  hp: number;
  sizePx: SizePx;
  contactDamage: number;
  exp: number;
  coreBit: number;
}

/** Drone Lính: bay lơ lửng đi tuần; người chơi trong tầm thì dừng, báo trước rồi bắn về phía họ. */
export interface DroneData extends EnemyCommon {
  behavior: 'drone';
  moveSpeedTilesPerSec: number;
  patrolRangeTiles: number;
  attack: {
    rangeTiles: number;
    telegraphSec: number;
    cooldownSec: number;
    projectile: EnemyProjectileData;
  };
}

/** Tháp pháo đứng yên, bắn theo nhịp cố định (1 viên, hoặc nhiều gai xòe quạt). */
export interface TurretData extends EnemyCommon {
  behavior: 'turret';
  attack: {
    intervalSec: number;
    telegraphSec: number;
    count: number;
    spreadDeg: number;
    projectile: EnemyProjectileData;
  };
}

/** Bướm Sắt: bay sóng sin, trôi qua lại, thả hạt nổ rơi theo trọng lực. */
export interface ButterflyData extends EnemyCommon {
  behavior: 'butterfly';
  moveSpeedTilesPerSec: number;
  patrolRangeTiles: number;
  wave: { amplitudeTiles: number; periodSec: number };
  attack: {
    intervalSec: number;
    telegraphSec: number;
    /** Hạt nổ rơi theo trọng lực này (ô/s²). */
    gravityTilesPerSec2: number;
    projectile: EnemyProjectileData;
  };
}

/** Lính Kén: đi bộ, khiên phía trước, thấy người chơi thì báo trước rồi lao tới. */
export interface ShieldChargerData extends EnemyCommon {
  behavior: 'shieldCharger';
  moveSpeedTilesPerSec: number;
  patrolRangeTiles: number;
  /** Số phát phá khiên (nạp đầy) cần để vỡ khiên. */
  shieldHits: number;
  attack: {
    rangeTiles: number;
    telegraphSec: number;
    dashTiles: number;
    dashSpeedTilesPerSec: number;
    recoverSec: number;
    cooldownSec: number;
    /** Người chơi ở sau lưng lâu chừng này thì quay lại. */
    turnDelaySec: number;
  };
}

export type EnemyData = DroneData | TurretData | ButterflyData | ShieldChargerData;

export interface PickupRules {
  /** Xác suất rơi viên hồi máu khi hạ kẻ địch (không rơi khi người chơi đầy máu). */
  healChance: number;
  heal: number;
  healLifetimeSec: number;
  coreBitLifetimeSec: number;
  /** Core Bit của một kẻ địch chia thành tối đa chừng này viên. */
  maxCoreBitPickups: number;
  gravityTilesPerSec2: number;
  sizePx: SizePx;
}

export interface EnemyRules {
  minTelegraphSec: number;
  /** Kẻ địch không được đặt gần điểm xuất phát/checkpoint hơn chừng này ô. */
  minSpawnDistanceTiles: number;
  /** Kẻ địch chỉ hoạt động khi người chơi cách trong chừng này ô (theo chiều ngang). */
  activeRangeTiles: number;
  pickups: PickupRules;
}

export interface EnemiesData {
  rules: EnemyRules;
  enemies: Record<string, EnemyData>;
}

function projectile(value: unknown, path: string): EnemyProjectileData {
  const p = obj(value, path);
  return {
    speedTilesPerSec: num(p.speedTilesPerSec, `${path}.speedTilesPerSec`, { min: 0 }),
    damage: num(p.damage, `${path}.damage`, { min: 0 }),
    sizePx: size(p.sizePx, `${path}.sizePx`),
  };
}

function common(id: string, e: Json, p: string): EnemyCommon {
  return {
    id,
    name: str(e.name, `${p}.name`),
    hp: num(e.hp, `${p}.hp`, { min: 1 }),
    sizePx: size(e.sizePx, `${p}.sizePx`),
    contactDamage: num(e.contactDamage, `${p}.contactDamage`, { min: 0 }),
    exp: num(e.exp, `${p}.exp`, { min: 0 }),
    coreBit: num(e.coreBit, `${p}.coreBit`, { min: 0 }),
  };
}

function parseEnemy(id: string, value: unknown): EnemyData {
  const p = `enemies.${id}`;
  const e = obj(value, p);
  const behavior = str(e.behavior, `${p}.behavior`);
  if (!BEHAVIORS.includes(behavior as EnemyBehavior)) {
    throw new ConfigError(`${p}.behavior: hành vi "${behavior}" không tồn tại`);
  }
  const base = common(id, e, p);
  const a = obj(e.attack, `${p}.attack`);
  const pa = `${p}.attack`;
  const move = (): { moveSpeedTilesPerSec: number; patrolRangeTiles: number } => ({
    moveSpeedTilesPerSec: num(e.moveSpeedTilesPerSec, `${p}.moveSpeedTilesPerSec`, { min: 0 }),
    patrolRangeTiles: num(e.patrolRangeTiles, `${p}.patrolRangeTiles`, { min: 0 }),
  });
  switch (behavior as EnemyBehavior) {
    case 'drone':
      return {
        ...base,
        behavior: 'drone',
        ...move(),
        attack: {
          rangeTiles: num(a.rangeTiles, `${pa}.rangeTiles`, { min: 1 }),
          telegraphSec: num(a.telegraphSec, `${pa}.telegraphSec`, { min: 0 }),
          cooldownSec: num(a.cooldownSec, `${pa}.cooldownSec`, { min: 0 }),
          projectile: projectile(a.projectile, `${pa}.projectile`),
        },
      };
    case 'turret':
      return {
        ...base,
        behavior: 'turret',
        attack: {
          intervalSec: num(a.intervalSec, `${pa}.intervalSec`, { min: 0.1 }),
          telegraphSec: num(a.telegraphSec, `${pa}.telegraphSec`, { min: 0 }),
          count: num(a.count, `${pa}.count`, { min: 1 }),
          spreadDeg: num(a.spreadDeg, `${pa}.spreadDeg`, { min: 0 }),
          projectile: projectile(a.projectile, `${pa}.projectile`),
        },
      };
    case 'butterfly': {
      const w = obj(e.wave, `${p}.wave`);
      return {
        ...base,
        behavior: 'butterfly',
        ...move(),
        wave: {
          amplitudeTiles: num(w.amplitudeTiles, `${p}.wave.amplitudeTiles`, { min: 0 }),
          periodSec: num(w.periodSec, `${p}.wave.periodSec`, { min: 0.1 }),
        },
        attack: {
          intervalSec: num(a.intervalSec, `${pa}.intervalSec`, { min: 0.1 }),
          telegraphSec: num(a.telegraphSec, `${pa}.telegraphSec`, { min: 0 }),
          gravityTilesPerSec2: num(a.gravityTilesPerSec2, `${pa}.gravityTilesPerSec2`, {
            min: 1,
          }),
          projectile: projectile(a.projectile, `${pa}.projectile`),
        },
      };
    }
    case 'shieldCharger':
      return {
        ...base,
        behavior: 'shieldCharger',
        ...move(),
        shieldHits: num(e.shieldHits, `${p}.shieldHits`, { min: 0 }),
        attack: {
          rangeTiles: num(a.rangeTiles, `${pa}.rangeTiles`, { min: 1 }),
          telegraphSec: num(a.telegraphSec, `${pa}.telegraphSec`, { min: 0 }),
          dashTiles: num(a.dashTiles, `${pa}.dashTiles`, { min: 0.5 }),
          dashSpeedTilesPerSec: num(a.dashSpeedTilesPerSec, `${pa}.dashSpeedTilesPerSec`, {
            min: 1,
          }),
          recoverSec: num(a.recoverSec, `${pa}.recoverSec`, { min: 0 }),
          cooldownSec: num(a.cooldownSec, `${pa}.cooldownSec`, { min: 0 }),
          turnDelaySec: num(a.turnDelaySec, `${pa}.turnDelaySec`, { min: 0 }),
        },
      };
  }
}

export function parseEnemies(value: unknown): EnemiesData {
  const root = obj(value, 'enemies');
  const r = obj(root.rules, 'enemies.rules');
  const pk = obj(r.pickups, 'enemies.rules.pickups');
  const rules: EnemyRules = {
    minTelegraphSec: num(r.minTelegraphSec, 'enemies.rules.minTelegraphSec', { min: 0 }),
    minSpawnDistanceTiles: num(r.minSpawnDistanceTiles, 'enemies.rules.minSpawnDistanceTiles', {
      min: 0,
    }),
    activeRangeTiles: num(r.activeRangeTiles, 'enemies.rules.activeRangeTiles', { min: 1 }),
    pickups: {
      healChance: num(pk.healChance, 'enemies.rules.pickups.healChance', { min: 0 }),
      heal: num(pk.heal, 'enemies.rules.pickups.heal', { min: 0 }),
      healLifetimeSec: num(pk.healLifetimeSec, 'enemies.rules.pickups.healLifetimeSec', {
        min: 0.5,
      }),
      coreBitLifetimeSec: num(pk.coreBitLifetimeSec, 'enemies.rules.pickups.coreBitLifetimeSec', {
        min: 0.5,
      }),
      maxCoreBitPickups: num(pk.maxCoreBitPickups, 'enemies.rules.pickups.maxCoreBitPickups', {
        min: 1,
      }),
      gravityTilesPerSec2: num(
        pk.gravityTilesPerSec2,
        'enemies.rules.pickups.gravityTilesPerSec2',
        { min: 1 },
      ),
      sizePx: size(pk.sizePx, 'enemies.rules.pickups.sizePx'),
    },
  };
  if (rules.pickups.healChance > 1) {
    throw new ConfigError('enemies.rules.pickups.healChance: phải trong khoảng 0–1');
  }
  const list = obj(root.enemies, 'enemies.enemies');
  const enemies: Record<string, EnemyData> = {};
  for (const [id, e] of Object.entries(list)) {
    if (!id.startsWith('_')) enemies[id] = parseEnemy(id, e);
  }
  return { rules, enemies };
}

/** Telegraph và nhịp đòn của một kẻ địch (để kiểm tra quy tắc). */
function attackTiming(e: EnemyData): { telegraphSec: number; cycleSec: number } {
  switch (e.behavior) {
    case 'drone':
      return { telegraphSec: e.attack.telegraphSec, cycleSec: Infinity };
    case 'turret':
    case 'butterfly':
      return { telegraphSec: e.attack.telegraphSec, cycleSec: e.attack.intervalSec };
    case 'shieldCharger':
      return { telegraphSec: e.attack.telegraphSec, cycleSec: Infinity };
  }
}

function attackDamage(e: EnemyData): number {
  return e.behavior === 'shieldCharger' ? e.contactDamage : e.attack.projectile.damage;
}

/**
 * Quy tắc chung (đặc tả mục 4, GDD 9): mọi đòn có telegraph ≥ minTelegraphSec; nhịp bắn dài
 * hơn telegraph; không đòn nào (kể cả va chạm) gây ≥ máu người chơi cấp 1.
 */
export function checkEnemyRules(data: EnemiesData, playerBaseHp: number): string[] {
  const errors: string[] = [];
  for (const e of Object.values(data.enemies)) {
    const { telegraphSec, cycleSec } = attackTiming(e);
    if (telegraphSec + 1e-9 < data.rules.minTelegraphSec) {
      errors.push(`enemies.${e.id}: telegraph ${telegraphSec} s < ${data.rules.minTelegraphSec} s`);
    }
    if (telegraphSec >= cycleSec) {
      errors.push(`enemies.${e.id}: telegraph phải ngắn hơn nhịp bắn ${cycleSec} s`);
    }
    if (Math.max(e.contactDamage, attackDamage(e)) >= playerBaseHp) {
      errors.push(`enemies.${e.id}: có đòn gây ≥ ${playerBaseHp} sát thương (chết ngay một đòn)`);
    }
  }
  return errors;
}
