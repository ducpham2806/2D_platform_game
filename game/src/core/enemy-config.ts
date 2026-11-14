/**
 * Kiểu và kiểm tra enemies.json (logic thuần), kèm quy tắc của đặc tả Prologue & Stage 1
 * mục 4: mọi đòn có telegraph ≥ minTelegraphSec, không đòn nào gây chết ngay.
 */
import { deepMerge } from './deep-merge';
import { ConfigError, type Json, num, obj, size, type SizePx, str } from './json-check';

export type EnemyBehavior = 'drone' | 'turret' | 'butterfly' | 'shieldCharger' | 'golem';
const BEHAVIORS: readonly EnemyBehavior[] = [
  'drone',
  'turret',
  'butterfly',
  'shieldCharger',
  'golem',
];

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
    /** Số viên mỗi loạt (viên sau nhắm lại) và khoảng cách giữa các viên (Thử thách: bắn đôi). */
    burst: { count: number; gapSec: number };
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
    /** Số loạt mỗi nhịp, cách nhau `volleyGapSec`, loạt k lệch k × `volleyOffsetDeg` (Thử thách). */
    volleys: number;
    volleyGapSec: number;
    volleyOffsetDeg: number;
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
    /** Số hạt mỗi nhịp, cách nhau `dropGapSec` (Thử thách: thả kép). */
    drops: number;
    dropGapSec: number;
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
    /** Số lần lao nối sau lần lao đầu (quay lại, báo `chainTelegraphSec`, lao) (Thử thách). */
    chainDashes: number;
    chainTelegraphSec: number;
  };
}

/**
 * Bramble Golem (mini-boss): đi chậm về phía người chơi. Pha 1 giậm đất tạo sóng hai bên; khi máu
 * xuống dưới `phase2HpPct` thì tung hạt nổ rồi lao tới.
 */
export interface GolemData extends EnemyCommon {
  behavior: 'golem';
  moveSpeedTilesPerSec: number;
  /** Vào pha 2 khi máu còn không quá mức này (%). */
  phase2HpPct: number;
  attack: {
    cooldownSec: number;
    slam: {
      telegraphSec: number;
      recoverSec: number;
      shockwave: { speedTilesPerSec: number; damage: number; sizePx: SizePx };
    };
    bombs: {
      telegraphSec: number;
      count: number;
      spreadFactor: number;
      lobSpeedTilesPerSec: number;
      gravityTilesPerSec2: number;
      recoverSec: number;
      projectile: EnemyProjectileData;
    };
    dash: {
      telegraphSec: number;
      dashTiles: number;
      dashSpeedTilesPerSec: number;
      recoverSec: number;
      /** Dừng lao thì giậm đất tại chỗ (báo trước như giậm) (Thử thách). */
      endSlam: boolean;
    };
  };
}

export type EnemyData = DroneData | TurretData | ButterflyData | ShieldChargerData | GolemData;

export interface PickupRules {
  /** Xác suất rơi viên hồi máu khi hạ kẻ địch (không rơi khi người chơi đầy máu). */
  healChance: number;
  heal: number;
  healLifetimeSec: number;
  coreBitLifetimeSec: number;
  /** Core Bit của một kẻ địch chia thành tối đa chừng này viên. */
  maxCoreBitPickups: number;
  gravityTilesPerSec2: number;
  /** Tốc độ viên Core Bit bay tới Kai khi trong tầm hút (Upgrade Magnet Range, M9). */
  magnetSpeedTilesPerSec: number;
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
  /**
   * Bản Thử thách (01-GDD/11-Do-kho.md mục 2.6): khối `challenge` ghép sâu lên bản gốc rồi kiểm
   * tra lại. Chỉ có ở kẻ địch có khối này; chọn bằng `enemiesFor`.
   */
  challenge: Record<string, EnemyData>;
}

/** Dữ liệu kẻ địch dùng ở một độ khó: Thử thách thì thay bằng bản Thử thách khi có. */
export function enemiesFor(data: EnemiesData, newAttackPatterns: boolean): EnemiesData {
  if (!newAttackPatterns || Object.keys(data.challenge).length === 0) return data;
  return { ...data, enemies: { ...data.enemies, ...data.challenge } };
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

/** Số tùy chọn có mặc định (trường hành vi mới của bản Thử thách). */
function optNum(v: unknown, path: string, fallback: number, min: number): number {
  return v === undefined ? fallback : num(v, path, { min });
}

function optInt(v: unknown, path: string, fallback: number, min: number): number {
  const n = optNum(v, path, fallback, min);
  if (!Number.isInteger(n)) throw new ConfigError(`${path}: cần số nguyên`);
  return n;
}

function parseEnemy(id: string, value: unknown, p = `enemies.${id}`): EnemyData {
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
          burst: (() => {
            if (a.burst === undefined) return { count: 1, gapSec: 0 };
            const b = obj(a.burst, `${pa}.burst`);
            return {
              count: optInt(b.count, `${pa}.burst.count`, 1, 1),
              gapSec: optNum(b.gapSec, `${pa}.burst.gapSec`, 0, 0.05),
            };
          })(),
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
          volleys: optInt(a.volleys, `${pa}.volleys`, 1, 1),
          volleyGapSec: optNum(a.volleyGapSec, `${pa}.volleyGapSec`, 0, 0.05),
          volleyOffsetDeg: optNum(a.volleyOffsetDeg, `${pa}.volleyOffsetDeg`, 0, 0),
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
          drops: optInt(a.drops, `${pa}.drops`, 1, 1),
          dropGapSec: optNum(a.dropGapSec, `${pa}.dropGapSec`, 0, 0.05),
        },
      };
    }
    case 'golem': {
      const slam = obj(a.slam, `${pa}.slam`);
      const wave = obj(slam.shockwave, `${pa}.slam.shockwave`);
      const bombs = obj(a.bombs, `${pa}.bombs`);
      const dash = obj(a.dash, `${pa}.dash`);
      return {
        ...base,
        behavior: 'golem',
        moveSpeedTilesPerSec: num(e.moveSpeedTilesPerSec, `${p}.moveSpeedTilesPerSec`, { min: 0 }),
        phase2HpPct: num(e.phase2HpPct, `${p}.phase2HpPct`, { min: 1 }),
        attack: {
          cooldownSec: num(a.cooldownSec, `${pa}.cooldownSec`, { min: 0 }),
          slam: {
            telegraphSec: num(slam.telegraphSec, `${pa}.slam.telegraphSec`, { min: 0 }),
            recoverSec: num(slam.recoverSec, `${pa}.slam.recoverSec`, { min: 0 }),
            shockwave: {
              speedTilesPerSec: num(
                wave.speedTilesPerSec,
                `${pa}.slam.shockwave.speedTilesPerSec`,
                {
                  min: 1,
                },
              ),
              damage: num(wave.damage, `${pa}.slam.shockwave.damage`, { min: 0 }),
              sizePx: size(wave.sizePx, `${pa}.slam.shockwave.sizePx`),
            },
          },
          bombs: {
            telegraphSec: num(bombs.telegraphSec, `${pa}.bombs.telegraphSec`, { min: 0 }),
            count: num(bombs.count, `${pa}.bombs.count`, { min: 1 }),
            spreadFactor: num(bombs.spreadFactor, `${pa}.bombs.spreadFactor`, { min: 0 }),
            lobSpeedTilesPerSec: num(bombs.lobSpeedTilesPerSec, `${pa}.bombs.lobSpeedTilesPerSec`, {
              min: 0.5,
            }),
            gravityTilesPerSec2: num(bombs.gravityTilesPerSec2, `${pa}.bombs.gravityTilesPerSec2`, {
              min: 1,
            }),
            recoverSec: num(bombs.recoverSec, `${pa}.bombs.recoverSec`, { min: 0 }),
            projectile: projectile(bombs.projectile, `${pa}.bombs.projectile`),
          },
          dash: {
            telegraphSec: num(dash.telegraphSec, `${pa}.dash.telegraphSec`, { min: 0 }),
            dashTiles: num(dash.dashTiles, `${pa}.dash.dashTiles`, { min: 0.5 }),
            dashSpeedTilesPerSec: num(
              dash.dashSpeedTilesPerSec,
              `${pa}.dash.dashSpeedTilesPerSec`,
              {
                min: 1,
              },
            ),
            recoverSec: num(dash.recoverSec, `${pa}.dash.recoverSec`, { min: 0 }),
            endSlam: (() => {
              if (dash.endSlam === undefined) return false;
              if (typeof dash.endSlam !== 'boolean')
                throw new ConfigError(`${pa}.dash.endSlam: cần true/false`);
              return dash.endSlam;
            })(),
          },
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
          chainDashes: optInt(a.chainDashes, `${pa}.chainDashes`, 0, 0),
          chainTelegraphSec: optNum(a.chainTelegraphSec, `${pa}.chainTelegraphSec`, 0, 0),
        },
      };
  }
}

/** Ghép khối `challenge` lên bản gốc (cấm đổi id, hành vi) rồi kiểm tra như bản gốc. */
function parseChallenge(id: string, raw: Json): EnemyData | undefined {
  if (raw.challenge === undefined) return undefined;
  const p = `enemies.${id}.challenge`;
  const patch = obj(raw.challenge, p);
  for (const key of ['id', 'behavior'])
    if (key in patch) throw new ConfigError(`${p}.${key}: bản Thử thách không được đổi ${key}`);
  const base: Json = { ...raw };
  delete base.challenge;
  return parseEnemy(id, deepMerge(base, patch), p);
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
      magnetSpeedTilesPerSec: num(
        pk.magnetSpeedTilesPerSec,
        'enemies.rules.pickups.magnetSpeedTilesPerSec',
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
  const challenge: Record<string, EnemyData> = {};
  for (const [id, e] of Object.entries(list)) {
    if (id.startsWith('_')) continue;
    enemies[id] = parseEnemy(id, e);
    const c = parseChallenge(id, obj(e, `enemies.${id}`));
    if (c) challenge[id] = c;
  }
  return { rules, enemies, challenge };
}

/**
 * Telegraph và nhịp đòn của một kẻ địch (để kiểm tra quy tắc). Báo trước tính cho cả loạt: các
 * nhịp sau (viên 2, loạt 2, hạt 2) nằm trong `busySec`, phải xong trước nhịp kế (GDD 11 mục 2.6).
 */
function attackTiming(e: EnemyData): { telegraphSec: number; busySec: number; cycleSec: number } {
  switch (e.behavior) {
    case 'drone': {
      const b = e.attack.burst;
      const busySec = e.attack.telegraphSec + (b.count - 1) * b.gapSec;
      return { telegraphSec: e.attack.telegraphSec, busySec, cycleSec: Infinity };
    }
    case 'turret': {
      const a = e.attack;
      const busySec = a.telegraphSec + (a.volleys - 1) * a.volleyGapSec;
      return { telegraphSec: a.telegraphSec, busySec, cycleSec: a.intervalSec };
    }
    case 'butterfly': {
      const a = e.attack;
      const busySec = a.telegraphSec + (a.drops - 1) * a.dropGapSec;
      return { telegraphSec: a.telegraphSec, busySec, cycleSec: a.intervalSec };
    }
    case 'shieldCharger': {
      const a = e.attack;
      const telegraphSec =
        a.chainDashes > 0 ? Math.min(a.telegraphSec, a.chainTelegraphSec) : a.telegraphSec;
      return { telegraphSec, busySec: telegraphSec, cycleSec: Infinity };
    }
    case 'golem': {
      const telegraphSec = Math.min(
        e.attack.slam.telegraphSec,
        e.attack.bombs.telegraphSec,
        e.attack.dash.telegraphSec,
      );
      return { telegraphSec, busySec: telegraphSec, cycleSec: Infinity };
    }
  }
}

function attackDamage(e: EnemyData): number {
  switch (e.behavior) {
    case 'shieldCharger':
      return e.contactDamage;
    case 'golem':
      return Math.max(e.attack.slam.shockwave.damage, e.attack.bombs.projectile.damage);
    default:
      return e.attack.projectile.damage;
  }
}

/**
 * Quy tắc chung (đặc tả mục 4, GDD 9; GDD 11 mục 3.1): mọi đòn có telegraph ≥ minTelegraphSec;
 * cả loạt xong trước nhịp kế; không đòn nào (kể cả va chạm), nhân `damageMul` (hệ số sát thương
 * nhận lớn nhất của các độ khó), gây ≥ máu người chơi cấp 1. Kiểm cả bản Thử thách.
 */
export function checkEnemyRules(data: EnemiesData, playerBaseHp: number, damageMul = 1): string[] {
  const errors: string[] = [];
  const all = [
    ...Object.values(data.enemies).map((e) => ({ e, p: `enemies.${e.id}` })),
    ...Object.values(data.challenge).map((e) => ({ e, p: `enemies.${e.id}.challenge` })),
  ];
  for (const { e, p } of all) {
    const { telegraphSec, busySec, cycleSec } = attackTiming(e);
    if (telegraphSec + 1e-9 < data.rules.minTelegraphSec) {
      errors.push(`${p}: telegraph ${telegraphSec} s < ${data.rules.minTelegraphSec} s`);
    }
    if (busySec >= cycleSec) {
      errors.push(`${p}: telegraph và cả loạt (${busySec} s) phải ngắn hơn nhịp bắn ${cycleSec} s`);
    }
    if (Math.max(e.contactDamage, attackDamage(e)) * damageMul >= playerBaseHp) {
      errors.push(`${p}: có đòn gây ≥ ${playerBaseHp} sát thương (chết ngay một đòn)`);
    }
  }
  return errors;
}
