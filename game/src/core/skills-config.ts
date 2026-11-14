/**
 * Kiểm tra 03-Data/skills.json (cây kỹ năng MVP, 01-GDD/10-He-thong-RPG-Xuong.md mục 2.1).
 * Logic thuần.
 */
import { arr, ConfigError, type Json, num, obj, str } from './json-check';

/**
 * Hiệu ứng kỹ năng biết được: giá trị trung tính (khi chưa học), chiều "mạnh hơn", khoảng hợp lệ.
 * Giá trị ghi tương đối so với số gốc trong player.json / weapons.json.
 */
export const SKILL_EFFECTS = {
  fullChargeTimeMul: { neutral: 1, better: 'lower', min: 0.1, max: 1 },
  burstDamageMul: { neutral: 0, better: 'higher', min: 0, max: 2 },
  burstRadiusTiles: { neutral: 0, better: 'higher', min: 0, max: 6 },
  punishMul: { neutral: 1, better: 'higher', min: 1, max: 3 },
  airDashesPerAirborne: { neutral: 0, better: 'higher', min: 0, max: 3, integer: true },
  wallSlideMul: { neutral: 1, better: 'lower', min: 0.1, max: 1 },
  wallJumpGraceSec: { neutral: 0, better: 'higher', min: 0, max: 0.5 },
  projectileIFrameSteps: { neutral: 0, better: 'higher', min: 0, max: 30, integer: true },
  grazeChargeSec: { neutral: 0, better: 'higher', min: 0, max: 1 },
  maxHpMul: { neutral: 1, better: 'higher', min: 1, max: 2 },
  energyRegenMul: { neutral: 1, better: 'higher', min: 1, max: 4 },
  regenDelayMul: { neutral: 1, better: 'lower', min: 0.1, max: 1 },
  shieldRechargeSec: { neutral: Infinity, better: 'lower', min: 5, max: 600 },
} as const satisfies Record<
  string,
  { neutral: number; better: 'higher' | 'lower'; min: number; max: number; integer?: boolean }
>;
export type SkillEffect = keyof typeof SKILL_EFFECTS;
export type SkillEffects = Partial<Record<SkillEffect, number>>;

export function isSkillEffect(key: string): key is SkillEffect {
  return Object.hasOwn(SKILL_EFFECTS, key);
}

export interface SkillRank {
  effects: SkillEffects;
  /** Mô tả ngắn của bậc (hiện trong Xưởng). */
  text: string;
}

export interface SkillNode {
  id: string;
  branch: string;
  tier: number;
  name: string;
  desc: string;
  ranks: SkillRank[];
}

export interface SkillBranch {
  id: string;
  name: string;
  role: string;
  /** Theo tầng tăng dần. */
  nodes: SkillNode[];
}

export interface SkillRules {
  minFullChargeSec: number;
  minBuildDamageTakenMul: number;
  shieldIFrameSec: number;
}

export interface SkillsData {
  rules: SkillRules;
  branches: SkillBranch[];
  /** Tra nút theo id. */
  nodes: Readonly<Record<string, SkillNode>>;
  /** Tổng số bậc của cả cây (= SP cần để học hết). */
  totalRanks: number;
}

/**
 * Độ lớn phần thưởng của một hiệu ứng (0 = trung tính, càng lớn càng mạnh), để so các bậc.
 * Hiệu ứng có trung tính vô hạn (thời gian hồi khiên) dùng nghịch đảo.
 */
export function effectReward(effect: SkillEffect, value: number): number {
  const spec = SKILL_EFFECTS[effect];
  if (spec.better === 'higher') return value - spec.neutral;
  return Number.isFinite(spec.neutral) ? spec.neutral - value : 1 / value;
}

const EPS = 1e-9;
/** Mỗi bậc sau phải tăng phần thưởng của ít nhất một hiệu ứng thêm ≥ 20% (hoặc thêm hiệu ứng mới). */
const MIN_RANK_GROWTH = 1.2;
/** Bậc 1 của nút tầng ≥ 3 mang ≥ 60% hiệu lực tối đa của các hiệu ứng nó có. */
const MIN_FIRST_RANK_SHARE = 0.6;

function parseRank(value: unknown, path: string): SkillRank {
  const r: Json = obj(value, path);
  const effects: SkillEffects = {};
  for (const [key, raw] of Object.entries(r)) {
    if (key === 'text') continue;
    if (!isSkillEffect(key)) throw new ConfigError(`${path}.${key}: hiệu ứng không tồn tại`);
    const spec: { min: number; max: number; integer?: boolean } = SKILL_EFFECTS[key];
    const v = num(raw, `${path}.${key}`);
    if (v < spec.min || v > spec.max)
      throw new ConfigError(`${path}.${key}: phải trong [${spec.min}, ${spec.max}] (đang là ${v})`);
    if (spec.integer && !Number.isInteger(v))
      throw new ConfigError(`${path}.${key}: cần số nguyên`);
    effects[key] = v;
  }
  if (Object.keys(effects).length === 0) throw new ConfigError(`${path}: cần ít nhất một hiệu ứng`);
  return { effects, text: str(r.text, `${path}.text`) };
}

/** Luật bậc (GDD 10 mục 0): trả về danh sách lỗi của một nút. */
export function checkRankRules(node: SkillNode): string[] {
  const errors: string[] = [];
  const p = `skills: nút ${node.id}`;
  node.ranks.forEach((cur, k) => {
    if (k === 0) return;
    const prev = node.ranks[k - 1] as SkillRank;
    let grew = false;
    let added = false;
    for (const [key, v] of Object.entries(cur.effects) as [SkillEffect, number][]) {
      const before = prev.effects[key];
      if (before === undefined) {
        added = true;
        continue;
      }
      const a = effectReward(key, before);
      const b = effectReward(key, v);
      if (b < a - EPS) errors.push(`${p} bậc ${k + 1}: ${key} yếu hơn bậc ${k}`);
      if (b >= a * MIN_RANK_GROWTH - EPS && b > a + EPS) grew = true;
    }
    for (const key of Object.keys(prev.effects))
      if (!(key in cur.effects)) errors.push(`${p} bậc ${k + 1}: mất hiệu ứng ${key} của bậc ${k}`);
    if (!grew && !added)
      errors.push(`${p} bậc ${k + 1}: phải tăng phần thưởng ≥ 20% hoặc thêm hiệu ứng mới`);
  });
  const first = node.ranks[0];
  const last = node.ranks[node.ranks.length - 1];
  if (node.tier >= 3 && first && last) {
    for (const [key, v] of Object.entries(first.effects) as [SkillEffect, number][]) {
      const top = last.effects[key];
      if (top === undefined) continue;
      const share = effectReward(key, v) / effectReward(key, top);
      if (share < MIN_FIRST_RANK_SHARE - EPS)
        errors.push(
          `${p}: bậc 1 chỉ có ${Math.round(share * 100)}% hiệu lực tối đa của ${key} (cần ≥ 60%)`,
        );
    }
  }
  return errors;
}

export function parseSkills(value: unknown): SkillsData {
  const s = obj(value, 'skills');
  const r = obj(s.rules, 'skills.rules');
  const rules: SkillRules = {
    minFullChargeSec: num(r.minFullChargeSec, 'skills.rules.minFullChargeSec', { min: 0.05 }),
    minBuildDamageTakenMul: num(r.minBuildDamageTakenMul, 'skills.rules.minBuildDamageTakenMul', {
      min: 0.05,
    }),
    shieldIFrameSec: num(r.shieldIFrameSec, 'skills.rules.shieldIFrameSec', { min: 0 }),
  };
  if (rules.minBuildDamageTakenMul > 1)
    throw new ConfigError('skills.rules.minBuildDamageTakenMul: tối đa 1');
  const nodes: Record<string, SkillNode> = {};
  const branchIds = new Set<string>();
  let totalRanks = 0;
  const branches = arr(s.branches, 'skills.branches').map((item, i): SkillBranch => {
    const bp = `skills.branches[${i}]`;
    const b = obj(item, bp);
    const id = str(b.id, `${bp}.id`);
    if (branchIds.has(id)) throw new ConfigError(`${bp}.id: trùng "${id}"`);
    branchIds.add(id);
    const list = arr(b.nodes, `${bp}.nodes`).map((n, j): SkillNode => {
      const np = `${bp}.nodes[${j}]`;
      const o = obj(n, np);
      const nodeId = str(o.id, `${np}.id`);
      if (nodes[nodeId]) throw new ConfigError(`${np}.id: trùng "${nodeId}"`);
      const tier = num(o.tier, `${np}.tier`, { min: 1 });
      const ranks = arr(o.ranks, `${np}.ranks`).map((x, k) => parseRank(x, `${np}.ranks[${k}]`));
      // Nút tầng k có k bậc (GDD 10 mục 2.1).
      if (ranks.length !== tier)
        throw new ConfigError(
          `${np}.ranks: nút tầng ${tier} cần ${tier} bậc (đang có ${ranks.length})`,
        );
      const node: SkillNode = {
        id: nodeId,
        branch: id,
        tier,
        name: str(o.name, `${np}.name`),
        desc: str(o.desc, `${np}.desc`),
        ranks,
      };
      nodes[nodeId] = node;
      totalRanks += ranks.length;
      return node;
    });
    list.sort((x, y) => x.tier - y.tier);
    list.forEach((n, k) => {
      if (n.tier !== k + 1)
        throw new ConfigError(
          `${bp}: tầng phải liên tục từ 1, mỗi tầng một nút (gặp ${n.id} ở tầng ${n.tier})`,
        );
    });
    return { id, name: str(b.name, `${bp}.name`), role: str(b.role, `${bp}.role`), nodes: list };
  });
  if (branches.length === 0) throw new ConfigError('skills.branches: trống');
  const errors = Object.values(nodes).flatMap(checkRankRules);
  if (errors.length > 0) throw new ConfigError(errors.join('\n'));
  return { rules, branches, nodes, totalRanks };
}
