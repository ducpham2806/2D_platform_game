import { type ControlsConfig, parseControls } from './controls-config';
import { arr, ConfigError, isObject, num, obj, str } from './json-check';
import { parsePlayer, type PlayerData } from './player-config';
import { parseWeapons, type WeaponsData } from './weapons-config';
import { type BossData, checkBossRules, parseBosses } from './boss-config';
import { evaluateFormula } from '../logic/formula';

export { ConfigError } from './json-check';
export { parsePlayer, type PlayerData } from './player-config';
export { parseWeapons, type WeaponsData } from './weapons-config';

/**
 * Kiểu và kiểm tra dữ liệu cấu hình đọc từ public/data (nguồn: 03-Data).
 * Logic thuần, không phụ thuộc Phaser. Mọi chỉ số gameplay phải đi qua đây,
 * không viết cứng trong mã.
 */

export interface StageData {
  index: number;
  id: string;
  name: string;
  recommendedLevel: string;
  boss: string;
  weaponGranted: string;
  bossWeakness: string;
  armorCache: string;
  armorCacheRequiresWeapon: string;
  coreBitBase: number;
  checkpoints: number;
}

export interface LevelSyncData {
  enabled: boolean;
  belowMin: number;
  aboveMax: number;
}

export interface StagesData {
  stages: StageData[];
  levelSync: LevelSyncData;
}

export interface DifficultyData {
  id: string;
  damageTaken: number;
  enemyHp: number;
  rewardMul: number;
}

/** Các file bắt buộc phải có và hợp lệ thì game mới chạy. */
export const REQUIRED_DATA_FILES = [
  'player',
  'weapons',
  'stages',
  'difficulties',
  'shop',
  'economy',
  'modules',
  'controls',
  'bosses',
] as const;
export type RequiredDataFile = (typeof REQUIRED_DATA_FILES)[number];

export interface GameConfig {
  player: PlayerData;
  weapons: WeaponsData;
  stages: StagesData;
  difficulties: DifficultyData[];
  controls: ControlsConfig;
  bosses: Record<string, BossData>;
  /** Các file chưa có module dùng (shop, economy, modules, endgame…), giữ nguyên dạng thô. */
  raw: Readonly<Record<string, unknown>>;
}

export function parseStages(value: unknown): StagesData {
  const s = obj(value, 'stages');
  const stages = arr(s.stages, 'stages.stages').map((item, i) => {
    const p = `stages.stages[${i}]`;
    const st = obj(item, p);
    return {
      index: num(st.index, `${p}.index`, { min: 1 }),
      id: str(st.id, `${p}.id`),
      name: str(st.name, `${p}.name`),
      recommendedLevel: str(st.recommendedLevel, `${p}.recommendedLevel`),
      boss: str(st.boss, `${p}.boss`),
      weaponGranted: str(st.weaponGranted, `${p}.weaponGranted`),
      bossWeakness: str(st.bossWeakness, `${p}.bossWeakness`),
      armorCache: str(st.armorCache, `${p}.armorCache`),
      armorCacheRequiresWeapon: str(st.armorCacheRequiresWeapon, `${p}.armorCacheRequiresWeapon`),
      coreBitBase: num(st.coreBitBase, `${p}.coreBitBase`, { min: 0 }),
      checkpoints: num(st.checkpoints, `${p}.checkpoints`, { min: 1 }),
    };
  });
  const sync = obj(s.levelSync, 'stages.levelSync');
  if (typeof sync.enabled !== 'boolean')
    throw new ConfigError('stages.levelSync.enabled: cần boolean');
  return {
    stages,
    levelSync: {
      enabled: sync.enabled,
      belowMin: num(sync.belowMin, 'stages.levelSync.belowMin', { min: 0 }),
      aboveMax: num(sync.aboveMax, 'stages.levelSync.aboveMax', { min: 0 }),
    },
  };
}

export function parseDifficulties(value: unknown): DifficultyData[] {
  return arr(value, 'difficulties').map((item, i) => {
    const d = obj(item, `difficulties[${i}]`);
    return {
      id: str(d.id, `difficulties[${i}].id`),
      damageTaken: num(d.damageTaken, `difficulties[${i}].damageTaken`, { min: 0 }),
      enemyHp: num(d.enemyHp, `difficulties[${i}].enemyHp`, { min: 0 }),
      rewardMul: num(d.rewardMul, `difficulties[${i}].rewardMul`, { min: 0 }),
    };
  });
}

/** Phân tích "4-7" thành [4, 7]. */
export function parseLevelRange(range: string): [number, number] {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) throw new ConfigError(`recommendedLevel "${range}" không đúng dạng "a-b"`);
  const lo = Number(match[1]);
  const hi = Number(match[2]);
  if (lo > hi) throw new ConfigError(`recommendedLevel "${range}": số đầu lớn hơn số sau`);
  return [lo, hi];
}

/**
 * Các bất biến thiết kế giữa nhiều file (GDD mục 6.3, 7, 11). Trả về danh sách lỗi;
 * rỗng nghĩa là dữ liệu nhất quán.
 */
export function checkDesignInvariants(config: GameConfig): string[] {
  const errors: string[] = [];
  const stages = [...config.stages.stages].sort((a, b) => a.index - b.index);

  stages.forEach((stage, i) => {
    if (stage.index !== i + 1) errors.push(`stages: index phải liên tục từ 1 (gặp ${stage.index})`);
  });

  // Vòng khắc chế: vũ khí của màn k là điểm yếu của boss màn k+1, màn cuối khép vòng về màn 1.
  stages.forEach((stage, i) => {
    const next = stages[(i + 1) % stages.length];
    if (next && next.bossWeakness !== stage.weaponGranted) {
      errors.push(
        `vòng khắc chế: ${stage.weaponGranted} (màn ${stage.index}) phải là điểm yếu của boss màn ${next.index}, đang là ${next.bossWeakness}`,
      );
    }
    // Két giáp màn k cần vũ khí của màn k+1.
    if (next && stage.armorCacheRequiresWeapon !== next.weaponGranted) {
      errors.push(
        `Két giáp màn ${stage.index}: cần ${next.weaponGranted}, đang là ${stage.armorCacheRequiresWeapon}`,
      );
    }
  });

  // Cấp khuyến nghị không giảm theo thứ tự màn.
  let prevLo = 0;
  for (const stage of stages) {
    try {
      const [lo] = parseLevelRange(stage.recommendedLevel);
      if (lo < prevLo) errors.push(`cấp khuyến nghị màn ${stage.index} thấp hơn màn trước`);
      prevLo = lo;
    } catch (e) {
      errors.push((e as Error).message);
    }
  }

  // weapons.json phải khớp stages.json.
  for (const stage of stages) {
    const weapon = config.weapons.bossWeapons.find((w) => w.name === stage.weaponGranted);
    if (!weapon) {
      errors.push(`weapons: thiếu vũ khí ${stage.weaponGranted}`);
      continue;
    }
    const weakBoss = stages.find((s) => s.bossWeakness === weapon.name)?.boss;
    if (weakBoss && !weapon.weakBoss.map((b) => b.toLowerCase()).includes(weakBoss)) {
      errors.push(`weapons: ${weapon.name}.weakBoss phải gồm ${weakBoss}`);
    }
  }

  // Hệ số thưởng trong economy.json phải khớp difficulties.json.
  const economy = config.raw.economy;
  if (isObject(economy) && isObject(economy.difficultyRewardMul)) {
    const muls = economy.difficultyRewardMul;
    const ids = config.difficulties.map((d) => d.id);
    for (const d of config.difficulties) {
      if (muls[d.id] !== d.rewardMul) {
        errors.push(
          `economy.difficultyRewardMul.${d.id} phải bằng ${d.rewardMul} (difficulties.json)`,
        );
      }
    }
    for (const key of Object.keys(muls)) {
      if (!ids.includes(key))
        errors.push(`economy.difficultyRewardMul.${key}: độ khó không tồn tại`);
    }
  } else {
    errors.push('economy.difficultyRewardMul: cần object theo id độ khó');
  }

  // Boss: telegraph, không chết ngay một đòn (GDD 9), điểm yếu là vũ khí có thật.
  const baseHp = evaluateFormula(config.player.level.hp, { L: 1 });
  for (const boss of Object.values(config.bosses)) {
    errors.push(...checkBossRules(boss, baseHp));
    if (!config.weapons.bossWeapons.some((w) => w.name === boss.weakness)) {
      errors.push(`bosses.${boss.id}.weakness: không có vũ khí ${boss.weakness}`);
    }
  }

  return errors;
}

/** Ghép các file JSON đã nạp thành GameConfig; ném ConfigError nếu thiếu hoặc sai. */
export function parseGameConfig(files: Readonly<Record<string, unknown>>): GameConfig {
  const missing = REQUIRED_DATA_FILES.filter((name) => files[name] === undefined);
  if (missing.length > 0) {
    throw new ConfigError(`Thiếu file dữ liệu: ${missing.join(', ')}`);
  }
  const config: GameConfig = {
    player: parsePlayer(files.player),
    weapons: parseWeapons(files.weapons),
    stages: parseStages(files.stages),
    difficulties: parseDifficulties(files.difficulties),
    controls: parseControls(files.controls),
    bosses: parseBosses(files.bosses),
    raw: { ...files },
  };
  const errors = checkDesignInvariants(config);
  if (errors.length > 0) {
    throw new ConfigError(`Dữ liệu không nhất quán:\n- ${errors.join('\n- ')}`);
  }
  return config;
}
