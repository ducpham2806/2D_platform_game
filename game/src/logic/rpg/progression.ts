/**
 * M8 (bản rút gọn): cấp từ EXP tích lũy, điểm kỹ năng (SP), đồng bộ cấp theo màn và chỉ số theo
 * cấp (GDD 6.1, 6.2; `player.json` → `level`, `stages.json` → `levelSync`). Logic thuần.
 *
 * Cấp và SP suy ra từ EXP và số boss đã hạ trong bản lưu, không lưu riêng, nên không thể lệch
 * nhau. SP đã tiêu (cây kỹ năng) sẽ lưu khi làm Xưởng.
 */
import type { LevelData } from '../../core/player-config';
import { evaluateFormula } from '../formula';

/** EXP cần để lên từ cấp `level` lên cấp kế (làm tròn); ở cấp tối đa thì không còn. */
export function expToNext(level: number, data: LevelData): number | undefined {
  if (level >= data.max) return undefined;
  return Math.max(1, Math.round(evaluateFormula(data.expFormula, { L: level })));
}

export interface LevelInfo {
  level: number;
  /** EXP đã có trong cấp hiện tại. */
  expInLevel: number;
  /** EXP cần để lên cấp kế; undefined ở cấp tối đa. */
  expToNext: number | undefined;
}

/** Cấp ứng với tổng EXP tích lũy (cấp 1 khi 0 EXP; GDD: cấp 2 tại 40, cấp 3 tại ~146). */
export function levelForExp(totalExp: number, data: LevelData): LevelInfo {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalExp));
  for (;;) {
    const need = expToNext(level, data);
    if (need === undefined || rest < need) return { level, expInLevel: rest, expToNext: need };
    rest -= need;
    level += 1;
  }
}

/** Tổng SP có được: `spPerLevelFrom2` mỗi cấp từ cấp 2 và `spPerBoss` mỗi boss đã hạ. */
export function skillPoints(level: number, bossesDefeated: number, data: LevelData): number {
  return Math.max(0, level - 1) * data.spPerLevelFrom2 + bossesDefeated * data.spPerBoss;
}

export interface LevelSync {
  enabled: boolean;
  belowMin: number;
  aboveMax: number;
}

/**
 * Cấp hiệu dụng khi tính máu và công: kẹp cấp thật trong [thấp − belowMin, cao + aboveMax] của
 * cấp khuyến nghị. Màn không thuộc chiến dịch (`range` undefined) hoặc tắt đồng bộ: cấp thật.
 */
export function syncLevel(
  level: number,
  range: readonly [number, number] | undefined,
  sync: LevelSync,
): number {
  if (!range || !sync.enabled) return level;
  const lo = Math.max(1, range[0] - sync.belowMin);
  const hi = Math.max(lo, range[1] + sync.aboveMax);
  return Math.min(hi, Math.max(lo, level));
}

export interface LevelStats {
  maxHp: number;
  /** Công theo cấp chia công cấp 1 (sát thương tính bằng phát Arc Cannon gốc). */
  attackMul: number;
}

export function levelStats(level: number, data: LevelData): LevelStats {
  const L = Math.max(1, Math.min(data.max, Math.floor(level)));
  return {
    maxHp: Math.round(evaluateFormula(data.hp, { L })),
    attackMul: evaluateFormula(data.atk, { L }) / evaluateFormula(data.atk, { L: 1 }),
  };
}

export interface LevelUp {
  from: number;
  to: number;
}

/** Theo dõi cấp trong một lượt chơi màn: EXP bản lưu lúc vào màn + EXP nhận trong lượt. */
export class LevelTracker {
  readonly startLevel: number;
  private current: LevelInfo;

  constructor(
    private readonly data: LevelData,
    private readonly savedExp: number,
  ) {
    this.current = levelForExp(savedExp, data);
    this.startLevel = this.current.level;
  }

  get info(): LevelInfo {
    return this.current;
  }

  /** Gọi sau mỗi bước với EXP của lượt; trả về lần lên cấp (có thể nhảy nhiều cấp) nếu có. */
  update(runExp: number): LevelUp | undefined {
    const next = levelForExp(this.savedExp + runExp, this.data);
    const from = this.current.level;
    this.current = next;
    return next.level > from ? { from, to: next.level } : undefined;
  }
}

export interface CharacterProgress {
  level: number;
  /** Tổng SP có được (chưa trừ SP đã tiêu: cây kỹ năng làm cùng Xưởng). */
  skillPoints: number;
}

/** Cấp và SP từ bản lưu: EXP tích lũy và boss chiến dịch đã hạ (`storyBosses`: boss của 8 màn). */
export function characterProgress(
  exp: number,
  bossesDefeated: readonly string[],
  storyBosses: ReadonlySet<string>,
  data: LevelData,
): CharacterProgress {
  const level = levelForExp(exp, data).level;
  const bosses = new Set(bossesDefeated.filter((id) => storyBosses.has(id))).size;
  return { level, skillPoints: skillPoints(level, bosses, data) };
}
