/**
 * Kiểu và kiểm tra bosses.json (logic thuần), kèm các nguyên tắc của GDD 9:
 * telegraph ≥ minTelegraphSec kể cả khi pha cuối tăng tốc, và không đòn nào gây chết ngay.
 */
import { deepMerge } from './deep-merge';
import { arr, ConfigError, type Json, num, obj, size, type SizePx, str } from './json-check';

export type BossAttackId =
  'shot' | 'charge' | 'slam' | 'rain' | 'thorns' | 'lash' | 'roots' | 'bloom' | 'stalk';
const ATTACK_IDS: readonly BossAttackId[] = [
  'shot',
  'charge',
  'slam',
  'rain',
  'thorns',
  'lash',
  'roots',
  'bloom',
  'stalk',
];

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

/** Thorna — Gai Quạt: bắn `count` gai xòe quạt `spreadDeg` ngang tầm người chơi. */
export interface ThornsAttack {
  telegraphSec: number;
  count: number;
  spreadDeg: number;
  speedTilesPerSec: number;
  damage: number;
  recoverSec: number;
  sizePx: SizePx;
}

/** Thorna — Dây Quất: vung dây ngang mặt đất dài `reachTiles` ô, tồn tại `activeSec`. */
export interface LashAttack {
  telegraphSec: number;
  reachTiles: number;
  heightPx: number;
  activeSec: number;
  damage: number;
  recoverSec: number;
}

/** Thorna — Rễ Trồi: `count` cột rễ mọc từ sàn lần lượt trái sang phải, cách nhau `spacingTiles` ô. */
export interface RootsAttack {
  telegraphSec: number;
  count: number;
  spacingTiles: number;
  intervalSec: number;
  activeSec: number;
  damage: number;
  recoverSec: number;
  sizePx: SizePx;
}

/**
 * Thorna — Rễ Đuổi (chỉ bản Thử thách, 01-GDD/11-Do-kho.md mục 3.3): sau báo trước, cứ
 * `markIntervalSec` đánh dấu mặt Kai đang đứng (kể cả bục), `eruptDelaySec` sau thì rễ trồi ở đó.
 * Cả hai khoảng chia tốc độ pha; thời gian từ đánh dấu tới khi trồi không dưới minTelegraphSec.
 */
export interface StalkAttack {
  telegraphSec: number;
  count: number;
  markIntervalSec: number;
  eruptDelaySec: number;
  activeSec: number;
  damage: number;
  recoverSec: number;
  sizePx: SizePx;
}

/** Thorna — Hoa Nở (đòn đỉnh): `seeds` hạt rơi từ trần, chừa `safeGaps` khe an toàn, rồi choáng. */
export interface BloomAttack {
  telegraphSec: number;
  seeds: number;
  fallSpeedTilesPerSec: number;
  activeSec: number;
  damage: number;
  safeGaps: number;
  gapWidthTiles: number;
  stunAfterSec: number;
  sizePx: SizePx;
}

export interface BossAttacks {
  shot?: ShotAttack;
  charge?: ChargeAttack;
  slam?: SlamAttack;
  rain?: RainAttack;
  thorns?: ThornsAttack;
  lash?: LashAttack;
  roots?: RootsAttack;
  bloom?: BloomAttack;
  stalk?: StalkAttack;
}

export interface BossData {
  id: string;
  name: string;
  hp: number;
  sizePx: SizePx;
  contactDamage: number;
  /** Vũ khí gây 2,5× sát thương và choáng (GDD 1.2). */
  weakness: string;
  /** Vũ khí nhận được khi thắng lần đầu (Thorna: Vine Lash, còn điểm yếu là Ember Burst). */
  reward: string;
  /** EXP và Core Bit nhận ở lần thắng đầu. */
  rewardExp: number;
  rewardCoreBit: number;
  idleSec: number;
  minTelegraphSec: number;
  /** Boss đi chậm về phía người chơi khi nghỉ giữa các đòn; không có thì đứng yên. */
  walk?: { speedTilesPerSec: number; keepDistanceTiles: number };
  phases: BossPhaseData[];
  attacks: BossAttacks;
}

/** Dữ liệu một đòn; ném lỗi nếu đòn có trong danh sách pha mà thiếu dữ liệu. */
export function attackOf<K extends BossAttackId>(
  boss: Pick<BossData, 'id' | 'attacks'>,
  id: K,
): NonNullable<BossAttacks[K]> {
  const a = boss.attacks[id];
  if (!a) throw new ConfigError(`bosses.${boss.id}.attacks.${id}: thiếu dữ liệu đòn`);
  return a as NonNullable<BossAttacks[K]>;
}

function parseShot(v: Json, p: string): ShotAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    count: num(v.count, `${p}.count`, { min: 1 }),
    intervalSec: num(v.intervalSec, `${p}.intervalSec`, { min: 0.05 }),
    speedTilesPerSec: num(v.speedTilesPerSec, `${p}.speedTilesPerSec`, { min: 1 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    recoverSec: num(v.recoverSec, `${p}.recoverSec`, { min: 0 }),
    sizePx: size(v.sizePx, `${p}.sizePx`),
  };
}

function parseCharge(v: Json, p: string): ChargeAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    speedTilesPerSec: num(v.speedTilesPerSec, `${p}.speedTilesPerSec`, { min: 1 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    recoverSec: num(v.recoverSec, `${p}.recoverSec`, { min: 0 }),
  };
}

function parseSlam(v: Json, p: string): SlamAttack {
  const wave = obj(v.shockwave, `${p}.shockwave`);
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    airSec: num(v.airSec, `${p}.airSec`, { min: 0.2 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    shockwave: {
      speedTilesPerSec: num(wave.speedTilesPerSec, `${p}.shockwave.speedTilesPerSec`, { min: 1 }),
      damage: num(wave.damage, `${p}.shockwave.damage`, { min: 0 }),
      sizePx: size(wave.sizePx, `${p}.shockwave.sizePx`),
    },
    recoverSec: num(v.recoverSec, `${p}.recoverSec`, { min: 0 }),
  };
}

function parseRain(v: Json, p: string): RainAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    activeSec: num(v.activeSec, `${p}.activeSec`, { min: 0.1 }),
    fallSpeedTilesPerSec: num(v.fallSpeedTilesPerSec, `${p}.fallSpeedTilesPerSec`, { min: 1 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    safeGaps: num(v.safeGaps, `${p}.safeGaps`, { min: 1 }),
    gapWidthTiles: num(v.gapWidthTiles, `${p}.gapWidthTiles`, { min: 1 }),
    stunAfterSec: num(v.stunAfterSec, `${p}.stunAfterSec`, { min: 0 }),
    sizePx: size(v.sizePx, `${p}.sizePx`),
  };
}

function parseThorns(v: Json, p: string): ThornsAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    count: num(v.count, `${p}.count`, { min: 1 }),
    spreadDeg: num(v.spreadDeg, `${p}.spreadDeg`, { min: 0 }),
    speedTilesPerSec: num(v.speedTilesPerSec, `${p}.speedTilesPerSec`, { min: 1 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    recoverSec: num(v.recoverSec, `${p}.recoverSec`, { min: 0 }),
    sizePx: size(v.sizePx, `${p}.sizePx`),
  };
}

function parseLash(v: Json, p: string): LashAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    reachTiles: num(v.reachTiles, `${p}.reachTiles`, { min: 1 }),
    heightPx: num(v.heightPx, `${p}.heightPx`, { min: 1 }),
    activeSec: num(v.activeSec, `${p}.activeSec`, { min: 0.05 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    recoverSec: num(v.recoverSec, `${p}.recoverSec`, { min: 0 }),
  };
}

function parseRoots(v: Json, p: string): RootsAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    count: num(v.count, `${p}.count`, { min: 1 }),
    spacingTiles: num(v.spacingTiles, `${p}.spacingTiles`, { min: 1 }),
    intervalSec: num(v.intervalSec, `${p}.intervalSec`, { min: 0.05 }),
    activeSec: num(v.activeSec, `${p}.activeSec`, { min: 0.05 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    recoverSec: num(v.recoverSec, `${p}.recoverSec`, { min: 0 }),
    sizePx: size(v.sizePx, `${p}.sizePx`),
  };
}

function parseBloom(v: Json, p: string): BloomAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    seeds: num(v.seeds, `${p}.seeds`, { min: 1 }),
    fallSpeedTilesPerSec: num(v.fallSpeedTilesPerSec, `${p}.fallSpeedTilesPerSec`, { min: 1 }),
    activeSec: num(v.activeSec, `${p}.activeSec`, { min: 0.1 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    safeGaps: num(v.safeGaps, `${p}.safeGaps`, { min: 1 }),
    gapWidthTiles: num(v.gapWidthTiles, `${p}.gapWidthTiles`, { min: 1 }),
    stunAfterSec: num(v.stunAfterSec, `${p}.stunAfterSec`, { min: 0 }),
    sizePx: size(v.sizePx, `${p}.sizePx`),
  };
}

function parseStalk(v: Json, p: string): StalkAttack {
  return {
    telegraphSec: num(v.telegraphSec, `${p}.telegraphSec`, { min: 0 }),
    count: num(v.count, `${p}.count`, { min: 1 }),
    markIntervalSec: num(v.markIntervalSec, `${p}.markIntervalSec`, { min: 0.1 }),
    eruptDelaySec: num(v.eruptDelaySec, `${p}.eruptDelaySec`, { min: 0 }),
    activeSec: num(v.activeSec, `${p}.activeSec`, { min: 0.1 }),
    damage: num(v.damage, `${p}.damage`, { min: 0 }),
    recoverSec: num(v.recoverSec, `${p}.recoverSec`, { min: 0 }),
    sizePx: size(v.sizePx, `${p}.sizePx`),
  };
}

function parseBoss(id: string, value: unknown, p = `bosses.${id}`): BossData {
  const b = obj(value, p);
  const raw = obj(b.attacks, `${p}.attacks`);
  const attacks: BossAttacks = {};
  const take = <T>(key: BossAttackId, parse: (v: Json, path: string) => T): T | undefined =>
    raw[key] === undefined
      ? undefined
      : parse(obj(raw[key], `${p}.attacks.${key}`), `${p}.attacks.${key}`);
  for (const key of Object.keys(raw)) {
    if (!ATTACK_IDS.includes(key as BossAttackId))
      throw new ConfigError(`${p}.attacks.${key}: đòn "${key}" không tồn tại`);
  }
  const shot = take('shot', parseShot);
  const charge = take('charge', parseCharge);
  const slam = take('slam', parseSlam);
  const rain = take('rain', parseRain);
  const thorns = take('thorns', parseThorns);
  const lash = take('lash', parseLash);
  const roots = take('roots', parseRoots);
  const bloom = take('bloom', parseBloom);
  const stalk = take('stalk', parseStalk);
  if (shot) attacks.shot = shot;
  if (charge) attacks.charge = charge;
  if (slam) attacks.slam = slam;
  if (rain) attacks.rain = rain;
  if (thorns) attacks.thorns = thorns;
  if (lash) attacks.lash = lash;
  if (roots) attacks.roots = roots;
  if (bloom) attacks.bloom = bloom;
  if (stalk) attacks.stalk = stalk;
  const phases = arr(b.phases, `${p}.phases`).map((item, i) => {
    const ph = obj(item, `${p}.phases[${i}]`);
    const list = arr(ph.attacks, `${p}.phases[${i}].attacks`).map((x, j) => {
      const name = str(x, `${p}.phases[${i}].attacks[${j}]`);
      if (!ATTACK_IDS.includes(name as BossAttackId)) {
        throw new ConfigError(`${p}.phases[${i}].attacks[${j}]: đòn "${name}" không tồn tại`);
      }
      if (attacks[name as BossAttackId] === undefined) {
        throw new ConfigError(`${p}.phases[${i}].attacks[${j}]: thiếu dữ liệu đòn "${name}"`);
      }
      return name as BossAttackId;
    });
    if (list.length === 0) throw new ConfigError(`${p}.phases[${i}]: cần ít nhất một đòn`);
    return {
      untilHpPct: num(ph.untilHpPct, `${p}.phases[${i}].untilHpPct`, { min: 0 }),
      speedMul: num(ph.speedMul, `${p}.phases[${i}].speedMul`, { min: 0.5 }),
      attacks: list,
    };
  });
  if (phases.length === 0) throw new ConfigError(`${p}.phases: cần ít nhất một pha`);
  const out: BossData = {
    id,
    name: str(b.name, `${p}.name`),
    hp: num(b.hp, `${p}.hp`, { min: 1 }),
    sizePx: size(b.sizePx, `${p}.sizePx`),
    contactDamage: num(b.contactDamage, `${p}.contactDamage`, { min: 0 }),
    weakness: str(b.weakness, `${p}.weakness`),
    reward: str(b.reward, `${p}.reward`),
    rewardExp: num(b.rewardExp, `${p}.rewardExp`, { min: 0 }),
    rewardCoreBit: num(b.rewardCoreBit, `${p}.rewardCoreBit`, { min: 0 }),
    idleSec: num(b.idleSec, `${p}.idleSec`, { min: 0 }),
    minTelegraphSec: num(b.minTelegraphSec, `${p}.minTelegraphSec`, { min: 0 }),
    phases,
    attacks,
  };
  if (b.walk !== undefined) {
    const w = obj(b.walk, `${p}.walk`);
    out.walk = {
      speedTilesPerSec: num(w.speedTilesPerSec, `${p}.walk.speedTilesPerSec`, { min: 0 }),
      keepDistanceTiles: num(w.keepDistanceTiles, `${p}.walk.keepDistanceTiles`, { min: 0 }),
    };
  }
  return out;
}

/**
 * Bản Thử thách của boss (khối `challenge`, 01-GDD/11-Do-kho.md mục 2.6): ghép sâu lên bản gốc
 * (mảng như `phases` thay cả), cấm đổi `id`, kiểm tra như bản gốc. Chỉ boss có khối này.
 */
export function parseBossChallenges(value: unknown): Record<string, BossData> {
  const root = obj(value, 'bosses');
  const out: Record<string, BossData> = {};
  for (const [id, boss] of Object.entries(root)) {
    if (id.startsWith('_')) continue;
    const raw = obj(boss, `bosses.${id}`);
    if (raw.challenge === undefined) continue;
    const p = `bosses.${id}.challenge`;
    const patch = obj(raw.challenge, p);
    if ('id' in patch) throw new ConfigError(`${p}.id: bản Thử thách không được đổi id`);
    const base: Json = { ...raw };
    delete base.challenge;
    out[id] = parseBoss(id, deepMerge(base, patch), p);
  }
  return out;
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

/** Sát thương lớn nhất của từng đòn (kể cả sóng đất) để kiểm tra quy tắc. */
function attackDamages(boss: BossData): number[] {
  const a = boss.attacks;
  return [
    a.shot?.damage,
    a.charge?.damage,
    a.slam?.damage,
    a.slam?.shockwave.damage,
    a.rain?.damage,
    a.thorns?.damage,
    a.lash?.damage,
    a.roots?.damage,
    a.bloom?.damage,
    a.stalk?.damage,
  ].filter((d): d is number => d !== undefined);
}

/**
 * Nguyên tắc GDD 9 cho mọi boss: telegraph sau khi chia speedMul vẫn ≥ minTelegraphSec;
 * không đòn nào (kể cả va chạm) gây ≥ máu người chơi cấp 1 ở độ khó Thường; đòn đỉnh có khe né
 * và Thorna (đặc tả mục 5) không có đòn nào quá 18 sát thương.
 */
export function checkBossRules(boss: BossData, playerBaseHp: number, damageMul = 1): string[] {
  const errors: string[] = [];
  const maxSpeed = Math.max(...boss.phases.map((ph) => ph.speedMul));
  // Rễ Đuổi: thời gian từ đánh dấu tới khi trồi cũng là báo trước (GDD 11 mục 3.3).
  const stalk = boss.attacks.stalk;
  if (stalk && stalk.eruptDelaySec / maxSpeed + 1e-9 < boss.minTelegraphSec)
    errors.push(
      `${boss.id}.stalk: đánh dấu tới khi trồi ${(stalk.eruptDelaySec / maxSpeed).toFixed(2)} s sau tăng tốc < ${boss.minTelegraphSec} s`,
    );
  for (const id of ATTACK_IDS) {
    const attack = boss.attacks[id];
    if (!attack) continue;
    const telegraph = attack.telegraphSec / maxSpeed;
    if (telegraph + 1e-9 < boss.minTelegraphSec) {
      errors.push(
        `${boss.id}.${id}: telegraph ${telegraph.toFixed(2)} s sau tăng tốc < ${boss.minTelegraphSec} s`,
      );
    }
  }
  if (Math.max(boss.contactDamage, ...attackDamages(boss)) * damageMul >= playerBaseHp) {
    errors.push(`${boss.id}: có đòn gây ≥ ${playerBaseHp} sát thương (chết ngay một đòn)`);
  }
  for (const id of ['rain', 'bloom'] as const) {
    const gaps = boss.attacks[id]?.safeGaps;
    if (gaps !== undefined && gaps < 1)
      errors.push(`${boss.id}.${id}: phải có ít nhất một khe an toàn`);
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
