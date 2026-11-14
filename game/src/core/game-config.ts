import { type ControlsConfig, parseControls } from './controls-config';
import { arr, ConfigError, isObject, num, obj, str } from './json-check';
import { parsePlayer, type PlayerData } from './player-config';
import { parseWeapons, type WeaponsData } from './weapons-config';
import { type BossData, checkBossRules, parseBosses } from './boss-config';
import { checkEnemyRules, type EnemiesData, parseEnemies } from './enemy-config';
import { evaluateFormula } from '../logic/formula';
import { computeBuild, statsFor } from '../logic/rpg/build';
import { parseStageMechanics, type StageMechanics } from './stage-mechanics-config';
import { parseTutorial, type TutorialData } from './tutorial-config';
import { parseUi, type UiData } from './ui-config';
import { parseSkills, type SkillsData } from './skills-config';
import { type EconomyData, parseEconomy, parseShop, type ShopData } from './shop-config';
import { parseWardenDialogue, type WardenDialogueData } from './dialogue-config';

export { ConfigError } from './json-check';
export { parsePlayer, type PlayerData } from './player-config';
export { parseWeapons, type WeaponsData } from './weapons-config';
export type { StageMechanics } from './stage-mechanics-config';

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
  /** id mini-boss (enemies.json khi màn đã làm; còn lại là tên dự kiến). */
  miniBoss: string;
  boss: string;
  weaponGranted: string;
  bossWeakness: string;
  armorCache: string;
  armorCacheRequiresWeapon: string;
  coreBitBase: number;
  checkpoints: number;
  /** id kẻ địch thường của màn (enemies.json). */
  enemies: string[];
}

export interface LevelSyncData {
  enabled: boolean;
  belowMin: number;
  aboveMax: number;
}

export interface StagesData {
  stages: StageData[];
  /** Cơ chế màn chơi (M7): hồi sinh, hố, gai, dây leo. */
  mechanics: StageMechanics;
  levelSync: LevelSyncData;
}

export interface DifficultyData {
  id: string;
  damageTaken: number;
  enemyHp: number;
  rewardMul: number;
}

/** Số màn (tính từ Stage 1) đã có dữ liệu kẻ địch trong enemies.json; tăng dần khi làm các màn sau. */
export const STAGES_WITH_ENEMY_DATA = 1;

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
  'enemies',
  'tutorial',
  'ui',
  'dialogue_wardens',
  'skills',
] as const;
export type RequiredDataFile = (typeof REQUIRED_DATA_FILES)[number];

export interface GameConfig {
  player: PlayerData;
  weapons: WeaponsData;
  stages: StagesData;
  difficulties: DifficultyData[];
  controls: ControlsConfig;
  bosses: Record<string, BossData>;
  enemies: EnemiesData;
  tutorial: TutorialData;
  /** Thông số giao diện M10 (hộp hội thoại, màn Kết quả). */
  ui: UiData;
  /** Thoại trước/sau trận của Warden (dialogue_wardens.json). */
  wardenDialogue: WardenDialogueData;
  /** Cây kỹ năng (M8, skills.json). */
  skills: SkillsData;
  /** Upgrade và Booster (M9, shop.json). */
  shop: ShopData;
  /** Thu Core Bit theo màn (M9, economy.json; phần còn lại vẫn ở `raw`). */
  economy: EconomyData;
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
      miniBoss: str(st.miniBoss, `${p}.miniBoss`),
      boss: str(st.boss, `${p}.boss`),
      weaponGranted: str(st.weaponGranted, `${p}.weaponGranted`),
      bossWeakness: str(st.bossWeakness, `${p}.bossWeakness`),
      armorCache: str(st.armorCache, `${p}.armorCache`),
      armorCacheRequiresWeapon: str(st.armorCacheRequiresWeapon, `${p}.armorCacheRequiresWeapon`),
      coreBitBase: num(st.coreBitBase, `${p}.coreBitBase`, { min: 0 }),
      checkpoints: num(st.checkpoints, `${p}.checkpoints`, { min: 1 }),
      enemies: arr(st.enemies, `${p}.enemies`).map((e, j) => str(e, `${p}.enemies[${j}]`)),
    };
  });
  const sync = obj(s.levelSync, 'stages.levelSync');
  if (typeof sync.enabled !== 'boolean')
    throw new ConfigError('stages.levelSync.enabled: cần boolean');
  return {
    stages,
    mechanics: parseStageMechanics(s.mechanics),
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

/** Hệ số sát thương lớn nhất của các module có điều kiện (`conditional: true`, `damageMul`). */
function conditionalDamageMul(modules: unknown): number {
  if (!Array.isArray(modules)) return 1;
  return modules.reduce<number>((best, m) => {
    if (!isObject(m) || m.conditional !== true || typeof m.damageMul !== 'number') return best;
    return Math.max(best, m.damageMul);
  }, 1);
}

/**
 * Trần sức mạnh cốt truyện (GDD 6.1, 01-GDD/10-He-thong-RPG-Xuong.md mục 3.3), đo ở cấp tối đa
 * với build có mọi nút kỹ năng đủ bậc và Upgrade tối đa:
 * - thường trực: công theo cấp × upgrade sát thương ≤ `damageMul`;
 * - máu: máu (có kỹ năng) / máu cấp 1 ≤ `hpMul`;
 * - có điều kiện: thường trực × module có điều kiện ≤ `conditionalDamageMul`;
 * - máu hiệu dụng: máu / giảm sát thương tốt nhất của build ≤ `effectiveHpMul`.
 * Kỹ năng tăng tốc nạp không vào đây: chỉ áp nạp đầy nên không nâng DPS tối đa (test mô phỏng).
 */
export function checkStoryPowerCap(config: GameConfig): string[] {
  const errors: string[] = [];
  const lv = config.player.level;
  const cap = lv.storyPowerCap;
  const maxRanks = Object.fromEntries(
    Object.values(config.skills.nodes).map((n) => [n.id, n.ranks.length]),
  );
  const maxUpgrades = Object.fromEntries(
    Object.values(config.shop.upgrades).map((u) => [u.id, u.maxLevel]),
  );
  const build = computeBuild(config.skills, maxRanks, { shop: config.shop, levels: maxUpgrades });
  const top = statsFor(lv.max, lv, build);
  const base = statsFor(1, lv);
  // Công đã gồm Upgrade Arc Core (statsFor nhân build.damageMul).
  const damage = top.attackMul;
  const hp = top.maxHp / base.maxHp;
  const fmt = (x: number): string => x.toFixed(3);
  if (damage > cap.damageMul + 1e-9)
    errors.push(
      `trần sát thương: cấp ${lv.max} × upgrade tối đa = ${fmt(damage)} lần cấp 1, trần ${cap.damageMul}`,
    );
  if (hp > cap.hpMul + 1e-9)
    errors.push(`trần máu: cấp ${lv.max} với kỹ năng = ${fmt(hp)} lần cấp 1, trần ${cap.hpMul}`);
  const conditional = damage * conditionalDamageMul(config.raw.modules);
  if (conditional > cap.conditionalDamageMul + 1e-9)
    errors.push(
      `trần có điều kiện: ${fmt(conditional)} lần cấp 1, trần ${cap.conditionalDamageMul}`,
    );
  // Giáp (armor.json) cộng vào khi làm Két giáp (ST-08-09); build đã kẹp ở sàn.
  const reduction = build.damageTakenMul;
  const ehp = hp / reduction;
  if (ehp > cap.effectiveHpMul + 1e-9)
    errors.push(`trần máu hiệu dụng: ${fmt(ehp)} lần cấp 1, trần ${cap.effectiveHpMul}`);
  return errors;
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

  // Boss đã có dữ liệu phải khớp màn: thưởng là vũ khí của màn, điểm yếu là vũ khí của màn trước.
  for (const stage of stages) {
    const bossData = config.bosses[stage.boss];
    if (!bossData) continue;
    if (bossData.reward !== stage.weaponGranted) {
      errors.push(
        `bosses.${bossData.id}.reward: ${bossData.reward} phải là weaponGranted của màn ${stage.index} (${stage.weaponGranted})`,
      );
    }
    if (bossData.weakness !== stage.bossWeakness) {
      errors.push(
        `bosses.${bossData.id}.weakness: ${bossData.weakness} phải là bossWeakness của màn ${stage.index} (${stage.bossWeakness})`,
      );
    }
  }

  // Kẻ địch: telegraph ≥ 0,4 s, không chết ngay một đòn; các màn đã làm có đủ dữ liệu kẻ địch.
  errors.push(...checkEnemyRules(config.enemies, baseHp));
  for (const stage of stages.filter((s) => s.index <= STAGES_WITH_ENEMY_DATA)) {
    if (!config.enemies.enemies[stage.miniBoss]) {
      errors.push(`stages.${stage.id}.miniBoss: "${stage.miniBoss}" chưa có trong enemies.json`);
    }
    for (const id of stage.enemies) {
      if (!config.enemies.enemies[id]) {
        errors.push(`stages.${stage.id}.enemies: kẻ địch "${id}" chưa có trong enemies.json`);
      }
    }
  }

  // Gai và hố không giết ngay Kai cấp 1 đầy máu, kể cả ở độ khó khó nhất (đặc tả mục 3).
  const mech = config.stages.mechanics;
  const worstTaken = Math.max(...config.difficulties.map((d) => d.damageTaken));
  for (const [name, damage] of [
    ['spikes', mech.spikes.damage],
    ['pit', mech.pit.damage],
  ] as const) {
    if (Math.round(damage * worstTaken) >= baseHp)
      errors.push(`stages.mechanics.${name}.damage: ${damage} giết ngay Kai cấp 1 (${baseHp} máu)`);
  }

  // Cấp (GDD 6.1): EXP lên cấp dương ở mọi cấp.
  const lv = config.player.level;
  for (let L = 1; L < lv.max; L += 1) {
    const need = evaluateFormula(lv.expFormula, { L });
    if (!(need >= 1)) errors.push(`player.level.expFormula: cấp ${L} cần ${need} EXP (phải ≥ 1)`);
  }
  errors.push(...checkStoryPowerCap(config));

  // Kỹ năng chỉ giảm thời gian nạp đầy; sàn nạp đầy phải lớn hơn nạp vừa để lối nạp đầy không
  // vượt lối mạnh nhất (01-GDD/10-He-thong-RPG-Xuong.md mục 3.2).
  const arc = config.weapons.arcCannon;
  const minFull = config.skills.rules.minFullChargeSec;
  if (minFull <= arc.midCharge.timeSec || minFull > arc.charge.timeSec)
    errors.push(
      `skills.rules.minFullChargeSec: ${minFull} phải lớn hơn nạp vừa (${arc.midCharge.timeSec} s) và không quá nạp đầy gốc (${arc.charge.timeSec} s)`,
    );

  // Thoại Warden: biến thể phủ hết số boss có thể đã hạ trước trận (0 đến số màn − 1);
  // boss của màn đã có dữ liệu trận đánh thì phải có thoại (GDD 3.6: boss có thoại trước/sau trận).
  const dlg = config.wardenDialogue;
  const lastVariant = dlg.variants[dlg.variants.length - 1];
  if (lastVariant && lastVariant.max < stages.length - 1)
    errors.push(
      `dialogue_wardens.variantByBossesDefeated: chỉ phủ tới ${lastVariant.max} boss, cần tới ${stages.length - 1}`,
    );
  const first = dlg.variants[0]?.id ?? '';
  for (const stage of stages) {
    if (config.bosses[stage.boss] && dlg.lines.vi[`boss.${stage.boss}.${first}.pre`] === undefined)
      errors.push(`dialogue_wardens: boss ${stage.boss} (màn ${stage.index}) chưa có thoại`);
  }

  return errors;
}

/** Ghép các file JSON đã nạp thành GameConfig; ném ConfigError nếu thiếu hoặc sai. */
export function parseGameConfig(files: Readonly<Record<string, unknown>>): GameConfig {
  const missing = REQUIRED_DATA_FILES.filter((name) => files[name] === undefined);
  if (missing.length > 0) {
    throw new ConfigError(`Thiếu file dữ liệu: ${missing.join(', ')}`);
  }
  const enemies = parseEnemies(files.enemies);
  const ui = parseUi(files.ui);
  const config: GameConfig = {
    player: parsePlayer(files.player),
    weapons: parseWeapons(files.weapons),
    stages: parseStages(files.stages),
    difficulties: parseDifficulties(files.difficulties),
    controls: parseControls(files.controls),
    bosses: parseBosses(files.bosses),
    enemies,
    tutorial: parseTutorial(files.tutorial, new Set(Object.keys(enemies.enemies))),
    ui,
    wardenDialogue: parseWardenDialogue(files.dialogue_wardens, ui.dialogue.maxChars),
    skills: parseSkills(files.skills),
    shop: parseShop(files.shop),
    economy: parseEconomy(files.economy),
    raw: { ...files },
  };
  const errors = checkDesignInvariants(config);
  if (errors.length > 0) {
    throw new ConfigError(`Dữ liệu không nhất quán:\n- ${errors.join('\n- ')}`);
  }
  return config;
}
