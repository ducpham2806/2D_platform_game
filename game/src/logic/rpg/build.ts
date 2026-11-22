/**
 * Build của nhân vật (01-GDD/10-He-thong-RPG-Xuong.md mục 3.1, 4): gom hiệu ứng các bậc kỹ năng đã
 * học và cấp Upgrade đã mua (M9) thành hệ số, rồi biến đổi dữ liệu gốc (player.json, weapons.json)
 * thành dữ liệu dùng trong trận. Phần cơ chế đọc `effects` (lượt lướt, nổ lan) hoặc `shield` (khiên
 * C3, chạy trong BuildRuntime). Logic thuần.
 */
import type { PlayerData } from '../../core/player-config';
import type { ShopData } from '../../core/shop-config';
import type { SkillEffects, SkillsData } from '../../core/skills-config';
import type { WeaponsData } from '../../core/weapons-config';
import { NO_PLAYER_MODS, type PlayerMods } from '../player/player-params';
import { levelOf, type UpgradeLevels } from '../shop/upgrades';
import { levelStats, type LevelStats } from './progression';
import { rankOf, type SkillRanks } from './skill-tree';

/** Khiên C3 (GDD 10 mục 2.1, 5): thông số từ bậc đã học và skills.json → rules. */
export interface ShieldStats {
  /** Hồi sau chừng này giây tính từ lúc khiên vỡ. */
  rechargeSec: number;
  /** Bất tử sau khi khiên chặn một đòn. */
  iFrameSec: number;
  /** Dừng hình (bước) khi khiên vỡ. */
  hitStopSteps: number;
  /** Loại đòn khiên không chặn (đòn đỉnh). */
  pierceKinds: ReadonlySet<string>;
}

export interface BuildStats {
  /** Hiệu ứng gộp của mọi bậc đã học (hệ số `*Mul` nhân với nhau, thời gian hồi khiên lấy nhỏ nhất, còn lại cộng). */
  effects: Readonly<SkillEffects>;
  fullChargeTimeMul: number;
  /** Sàn thời gian nạp đầy (skills.json → rules). */
  minFullChargeSec: number;
  wallSlideMul: number;
  maxHpMul: number;
  energyRegenMul: number;
  regenDelayMul: number;
  /** Loại đòn tính là đạn (skills.json → rules.bulletKinds), cho P3. */
  bulletKinds: ReadonlySet<string>;
  /** Khiên C3; chưa học thì không có. */
  shield: ShieldStats | undefined;
  /** Upgrade Arc Core: sát thương gây ra nhân (1 + damagePerLevel × cấp). */
  damageMul: number;
  /**
   * Hệ số sát thương nhận của build (Armor Plating; sau này cả giáp Thân Mk I), đã kẹp ở sàn
   * `minBuildDamageTakenMul`. Chỉ áp đòn kẻ địch và boss, không áp gai, hố.
   */
  damageTakenMul: number;
  /** Upgrade Energy Cell: năng lượng tối đa vũ khí boss nhân hệ số này (làm tròn). */
  energyMaxMul: number;
  nanoCellHealMul: number;
  /** Upgrade Magnet Range: tầm hút Core Bit, ô (0 = không hút). */
  magnetTiles: number;
}

/** Cấp Upgrade đã mua cùng dữ liệu Shop, để `computeBuild` đổi ra hệ số. */
export interface UpgradeInput {
  shop: ShopData;
  levels: UpgradeLevels;
}

/** Build trống: không đổi gì (màn chơi thử, bản lưu chưa học kỹ năng). */
export const EMPTY_BUILD: BuildStats = {
  effects: {},
  fullChargeTimeMul: 1,
  minFullChargeSec: 0,
  wallSlideMul: 1,
  maxHpMul: 1,
  energyRegenMul: 1,
  regenDelayMul: 1,
  bulletKinds: new Set(),
  shield: undefined,
  damageMul: 1,
  damageTakenMul: 1,
  energyMaxMul: 1,
  nanoCellHealMul: 1,
  magnetTiles: 0,
};

function combine(effects: SkillEffects, key: keyof SkillEffects, value: number): void {
  const cur = effects[key];
  if (cur === undefined) effects[key] = value;
  else if (key.endsWith('Mul')) effects[key] = cur * value;
  else if (key === 'shieldRechargeSec') effects[key] = Math.min(cur, value);
  else effects[key] = cur + value;
}

/**
 * Gom hiệu ứng từ bậc đã học (bậc vượt tối đa bị kẹp; nút lạ bị bỏ) và từ cấp Upgrade (cấp vượt
 * tối đa bị kẹp; id lạ bị bỏ).
 */
export function computeBuild(
  data: SkillsData,
  skills: SkillRanks,
  upgrades?: UpgradeInput,
): BuildStats {
  const effects: SkillEffects = {};
  for (const node of Object.values(data.nodes)) {
    const rank = Math.min(rankOf(skills, node.id), node.ranks.length);
    const r = node.ranks[rank - 1];
    if (!r) continue;
    for (const [key, v] of Object.entries(r.effects) as [keyof SkillEffects, number][])
      combine(effects, key, v);
  }
  const up = (
    id: string,
    field:
      | 'damagePerLevel'
      | 'damageTakenPerLevel'
      | 'energyMaxPerLevel'
      | 'magnetTilesPerLevel'
      | 'nanoCellHealPerLevel',
  ): number => {
    const u = upgrades?.shop.upgrades[id];
    if (!u || !upgrades) return 0;
    return (u[field] ?? 0) * Math.min(levelOf(upgrades.levels, id), u.maxLevel);
  };
  return {
    effects,
    fullChargeTimeMul: effects.fullChargeTimeMul ?? 1,
    minFullChargeSec: data.rules.minFullChargeSec,
    wallSlideMul: effects.wallSlideMul ?? 1,
    maxHpMul: effects.maxHpMul ?? 1,
    energyRegenMul: effects.energyRegenMul ?? 1,
    regenDelayMul: effects.regenDelayMul ?? 1,
    bulletKinds: data.rules.bulletKinds,
    shield:
      effects.shieldRechargeSec === undefined
        ? undefined
        : {
            rechargeSec: effects.shieldRechargeSec,
            iFrameSec: data.rules.shieldIFrameSec,
            hitStopSteps: data.rules.shieldBreakHitStopSteps,
            pierceKinds: data.rules.shieldPierceKinds,
          },
    damageMul: 1 + up('arc_core', 'damagePerLevel'),
    damageTakenMul: Math.max(
      data.rules.minBuildDamageTakenMul,
      1 - up('armor_plating', 'damageTakenPerLevel'),
    ),
    energyMaxMul: 1 + up('energy_cell', 'energyMaxPerLevel'),
    nanoCellHealMul: 1 + up('nano_cell_cap', 'nanoCellHealPerLevel'),
    magnetTiles: up('magnet_range', 'magnetTilesPerLevel'),
  };
}

/**
 * Dữ liệu dùng trong trận = dữ liệu gốc đã áp build. Kỹ năng chỉ giảm thời gian **nạp đầy**
 * (không đổi nạp vừa), kẹp ở sàn nhưng không bao giờ dài hơn gốc. Build trống trả lại đúng đối
 * tượng gốc.
 */
export function applyBuild(
  player: PlayerData,
  weapons: WeaponsData,
  build: BuildStats,
): { player: PlayerData; weapons: WeaponsData } {
  if (build === EMPTY_BUILD) return { player, weapons };
  const base = weapons.arcCannon.charge.timeSec;
  const chargeTime = Math.min(
    base,
    Math.max(build.minFullChargeSec, base * build.fullChargeTimeMul),
  );
  return {
    player:
      build.wallSlideMul === 1
        ? player
        : { ...player, wallSlideTilesPerSec: player.wallSlideTilesPerSec * build.wallSlideMul },
    weapons: {
      ...weapons,
      energyMax: Math.round(weapons.energyMax * build.energyMaxMul),
      arcCannon: {
        ...weapons.arcCannon,
        charge: { ...weapons.arcCannon.charge, timeSec: chargeTime },
      },
      energyRegen: {
        ...weapons.energyRegen,
        perSec: weapons.energyRegen.perSec * build.energyRegenMul,
        afterNoFireSec: weapons.energyRegen.afterNoFireSec * build.regenDelayMul,
      },
    },
  };
}

/** Thông số vật lý do build quyết định (P1, P2 bậc 2, P3); `stepSec` đổi số bước ra giây. */
export function playerModsOf(build: BuildStats, stepSec: number): PlayerMods {
  const e = build.effects;
  if (build === EMPTY_BUILD) return NO_PLAYER_MODS;
  return {
    airDashes: e.airDashesPerAirborne ?? 0,
    wallJumpGraceSec: e.wallJumpGraceSec ?? 0,
    bulletIFrameExtraSec: (e.projectileIFrameSteps ?? 0) * stepSec,
  };
}

/** Hiệu ứng Vanguard (V2 nổ lan, V3 Đòn Trừng Phạt) theo px. */
export function vanguardOf(
  build: BuildStats,
  tileSize: number,
): { burstDamageMul: number; burstRadiusPx: number; punishMul: number } {
  const e = build.effects;
  return {
    burstDamageMul: e.burstDamageMul ?? 0,
    burstRadiusPx: (e.burstRadiusTiles ?? 0) * tileSize,
    punishMul: e.punishMul ?? 1,
  };
}

/**
 * Máu tối đa và hệ số công ở cấp hiệu dụng `level` với build (kỹ năng C1, Upgrade Arc Core); dùng
 * chung cho trận và kiểm tra trần sức mạnh.
 */
export function statsFor(
  level: number,
  data: PlayerData['level'],
  build: BuildStats = EMPTY_BUILD,
): LevelStats {
  const base = levelStats(level, data);
  if (build.maxHpMul === 1 && build.damageMul === 1) return base;
  return {
    ...base,
    maxHp: Math.round(base.maxHp * build.maxHpMul),
    attackMul: base.attackMul * build.damageMul,
  };
}
