/**
 * Cấu hình và chạy báo cáo cổng MVP (ST-13-05a; GDD 13 mục 6, 7.3; duyệt QA Lead 14/11/2026).
 * Đọc khối `report` của `telemetry.json` (game không đọc khối này, nên lỗi ở đây không tắt đo
 * lường), ghép với `stages.json` (boss, điểm yếu, đoạn, thời gian dự kiến) thành `ReportParams`.
 * Logic thuần: script `mvp-report.mjs` chỉ đọc file và ghi kết quả.
 */
import { arr, ConfigError, num, obj, str } from './json-check';
import { type GameConfig, parseGameConfig } from './game-config';
import { EXTRA_STAGE_IDS, telemetryCatalogs, weaponId } from './telemetry-catalogs';
import { addDays, buildDataset, collectBatches, dayStartMs } from '../logic/telemetry/report-data';
import type { SecondaryParams, SecondaryTargets } from '../logic/telemetry/report-extra';
import { evaluateFormula } from '../logic/formula';
import { levelCap, upgradeCost } from '../logic/shop/upgrades';
import {
  buildReport,
  type MvpReport,
  renderReport,
  type ReportParams,
  type ReportStage,
} from '../logic/telemetry/report';

export interface ReportSettings {
  /** Prologue rồi các màn của đợt (id `stages.json`), theo thứ tự. */
  stages: string[];
  tzMin: number;
  windowDays: number;
  upgradeBins: [number, number];
  skillTieMax: number;
  missingWeaknessMax: number;
  maxDayJump: number;
  shortSessionSec: number;
  spamRateMul: number;
  spamMinHours: number;
  maxInstalls: number;
  targets: SecondaryTargets;
}

const PROLOGUE = EXTRA_STAGE_IDS[0];

function int(value: unknown, path: string, min: number): number {
  const v = num(value, path, { min });
  if (!Number.isInteger(v)) throw new ConfigError(`${path}: cần số nguyên`);
  return v;
}

/** Kiểm khối `report` của `telemetry.json`. */
export function parseReportSettings(telemetryJson: unknown): ReportSettings {
  const r = obj(obj(telemetryJson, 'telemetry').report, 'telemetry.report');
  const p = 'telemetry.report';
  const stages = arr(r.stages, `${p}.stages`).map((s, i) => str(s, `${p}.stages[${i}]`));
  if (stages[0] !== PROLOGUE) throw new ConfigError(`${p}.stages: phải bắt đầu bằng ${PROLOGUE}`);
  if (stages.length < 2) throw new ConfigError(`${p}.stages: cần ít nhất một màn chiến dịch`);
  if (new Set(stages).size !== stages.length) throw new ConfigError(`${p}.stages: id trùng`);
  const bins = arr(r.upgradeBins, `${p}.upgradeBins`);
  if (bins.length !== 2) throw new ConfigError(`${p}.upgradeBins: cần [a, b]`);
  const a = int(bins[0], `${p}.upgradeBins[0]`, 0);
  const b = int(bins[1], `${p}.upgradeBins[1]`, a + 1);
  const tzMin = int(r.tzMin, `${p}.tzMin`, -720);
  if (tzMin > 840) throw new ConfigError(`${p}.tzMin: phải ≤ 840`);
  const missing = num(r.missingWeaknessMax, `${p}.missingWeaknessMax`, { min: 0 });
  if (missing >= 1) throw new ConfigError(`${p}.missingWeaknessMax: phải < 1`);
  return {
    stages,
    tzMin,
    windowDays: int(r.windowDays, `${p}.windowDays`, 1),
    upgradeBins: [a, b],
    skillTieMax: int(r.skillTieMax, `${p}.skillTieMax`, 0),
    missingWeaknessMax: missing,
    maxDayJump: int(r.maxDayJump, `${p}.maxDayJump`, 1),
    shortSessionSec: num(r.shortSessionSec, `${p}.shortSessionSec`, { min: 1 }),
    spamRateMul: num(r.spamRateMul, `${p}.spamRateMul`, { min: 1 }),
    spamMinHours: num(r.spamMinHours, `${p}.spamMinHours`, { min: 0.01 }),
    maxInstalls: int(r.maxInstalls, `${p}.maxInstalls`, 1),
    targets: parseTargets(r.targets, `${p}.targets`),
  };
}

function frac(value: unknown, path: string): number {
  const v = num(value, path, { min: 0 });
  if (v > 1) throw new ConfigError(`${path}: phải trong [0; 1]`);
  return v;
}

function range(value: unknown, path: string, unit = false): [number, number] {
  const r = arr(value, path);
  if (r.length !== 2) throw new ConfigError(`${path}: cần [thấp, cao]`);
  const lo = unit ? frac(r[0], `${path}[0]`) : num(r[0], `${path}[0]`, { min: 0 });
  const hi = unit ? frac(r[1], `${path}[1]`) : num(r[1], `${path}[1]`, { min: lo });
  if (hi < lo) throw new ConfigError(`${path}: cao phải ≥ thấp`);
  return [lo, hi];
}

/** Mục tiêu chỉ số phụ (GDD 13 mục 6.4). */
export function parseTargets(value: unknown, p: string): SecondaryTargets {
  const t = obj(value, p);
  const t4 = arr(t.t4, `${p}.t4`);
  if (t4.length !== 3) throw new ConfigError(`${p}.t4: cần 3 mốc`);
  const settings = obj(t.s1Settings, `${p}.s1Settings`);
  const s1Settings: Record<string, number | boolean> = {};
  for (const [id, def] of Object.entries(settings)) {
    if (typeof def !== 'number' && typeof def !== 'boolean')
      throw new ConfigError(`${p}.s1Settings.${id}: cần số hoặc boolean`);
    s1Settings[id] = def;
  }
  return {
    k1: frac(t.k1, `${p}.k1`),
    k2Max: num(t.k2Max, `${p}.k2Max`, { min: 0 }),
    k3SpendShare: frac(t.k3SpendShare, `${p}.k3SpendShare`),
    k3MaxGap: frac(t.k3MaxGap, `${p}.k3MaxGap`),
    k4Max: frac(t.k4Max, `${p}.k4Max`),
    k6: range(t.k6, `${p}.k6`),
    dk1: range(t.dk1, `${p}.dk1`, true),
    dk2Max: num(t.dk2Max, `${p}.dk2Max`, { min: 0 }),
    dk3: frac(t.dk3, `${p}.dk3`),
    dk4ChallengeQuit: frac(t.dk4ChallengeQuit, `${p}.dk4ChallengeQuit`),
    dk4StoryDeaths: int(t.dk4StoryDeaths, `${p}.dk4StoryDeaths`, 1),
    t1Min: range(t.t1Min, `${p}.t1Min`),
    t2Max: frac(t.t2Max, `${p}.t2Max`),
    t3Max: frac(t.t3Max, `${p}.t3Max`),
    t4: [frac(t4[0], `${p}.t4[0]`), frac(t4[1], `${p}.t4[1]`), frac(t4[2], `${p}.t4[2]`)],
    x1: frac(t.x1, `${p}.x1`),
    x2Ms: num(t.x2Ms, `${p}.x2Ms`, { min: 1 }),
    x3Ms: num(t.x3Ms, `${p}.x3Ms`, { min: 1 }),
    x4Fps: num(t.x4Fps, `${p}.x4Fps`, { min: 1 }),
    x4Share: frac(t.x4Share, `${p}.x4Share`),
    x5Max: int(t.x5Max, `${p}.x5Max`, 0),
    f1: num(t.f1, `${p}.f1`, { min: 1 }),
    s1SlowStageMax: frac(t.s1SlowStageMax, `${p}.s1SlowStageMax`),
    s1Settings,
  };
}

/** Số liệu game cho chỉ số phụ: giá rẻ nhất lúc Quầy mở, tổng giá Upgrade, thu theo màn. */
export function secondaryParams(
  config: GameConfig,
  stageIds: readonly string[],
  targets: SecondaryTargets,
): SecondaryParams {
  const shop = config.shop;
  const first = shop.unlockSchedule[0];
  if (!first) throw new ConfigError('shop.unlockSchedule: cần ít nhất một mốc');
  const prices = Object.values(shop.upgrades)
    .filter((u) => levelCap(shop, u.id, first.afterBosses) >= 1)
    .map((u) => upgradeCost(u, 1));
  if (prices.length === 0) throw new ConfigError('shop: không món nào bán được lúc Quầy mở');
  let total = 0;
  for (const u of Object.values(shop.upgrades))
    for (let lv = 1; lv <= u.maxLevel; lv += 1) total += upgradeCost(u, lv);
  const income: Record<string, number> = {};
  for (const id of stageIds) {
    const st = config.stages.stages.find((s) => s.id === id);
    if (st)
      income[id] = Math.round(evaluateFormula(config.economy.incomeFormula, { stage: st.index }));
  }
  const rewardMul: Record<string, number> = {};
  for (const d of config.difficulties) rewardMul[d.id] = d.rewardMul;
  return {
    targets,
    shopOpenBosses: first.afterBosses,
    cheapestPrice: Math.min(...prices),
    totalUpgradeCost: total,
    income,
    rewardMul,
    difficultyOrder: config.difficulties.map((d) => d.id),
  };
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Ngày `YYYY-MM-DD` có thật. */
export function isDay(day: string): boolean {
  return DAY.test(day) && addDays(day, 0) === day;
}

/**
 * Tham số báo cáo từ dữ liệu game. Điểm yếu của boss chỉ tính khi một màn trong đợt trao vũ khí đó
 * (6.1: Thorna khắc chế bằng Ember Burst của Stage 8 nên không vào MV6).
 */
export function mvpReportParams(
  config: GameConfig,
  settings: ReportSettings,
  day0?: string,
): ReportParams {
  const tel = config.telemetry;
  if (!tel) throw new ConfigError(`telemetry.json lỗi: ${config.telemetryError ?? 'thiếu'}`);
  if (day0 !== undefined && !isDay(day0))
    throw new ConfigError(`ngày 0 "${day0}": cần YYYY-MM-DD có thật`);
  const campaign = settings.stages.slice(1).map((id) => {
    const st = config.stages.stages.find((s) => s.id === id);
    if (!st) throw new ConfigError(`telemetry.report.stages: không có màn ${id} trong stages.json`);
    return st;
  });
  const granted = new Set(campaign.map((s) => s.weaponGranted));
  const stages: ReportStage[] = campaign.map((st) => ({
    id: st.id,
    name: st.name,
    boss: st.boss,
    ...(granted.has(st.bossWeakness) ? { weakness: weaponId(st.bossWeakness) } : {}),
    sections: [...st.segments, 'boss'],
    ...(st.expectedMin !== undefined ? { expectedMin: st.expectedMin } : {}),
    ...(st.bossFightSec ? { designFightSec: st.bossFightSec } : {}),
  }));
  return {
    gate: tel.gate,
    broken: tel.broken,
    // Prologue chưa có bản đồ: chưa có danh sách đoạn (H1 của Prologue Thiếu dữ liệu nếu có đoạn).
    prologue: { id: PROLOGUE, name: 'Prologue', sections: [] },
    stages,
    ...(day0 !== undefined ? { day0 } : {}),
    windowDays: settings.windowDays,
    upgradeBins: settings.upgradeBins,
    skillTieMax: settings.skillTieMax,
    missingWeaknessMax: settings.missingWeaknessMax,
    maxDayJump: settings.maxDayJump,
    maxInstalls: settings.maxInstalls,
    secondary: secondaryParams(
      config,
      stages.map((s) => s.id),
      settings.targets,
    ),
  };
}

export interface MvpReportOptions {
  /** Ngày 0 (gửi link), `YYYY-MM-DD`; thiếu thì không cắt cửa sổ và MV4 Thiếu dữ liệu. */
  day0?: string;
  waves?: readonly string[];
  builds?: readonly string[];
  data?: string;
  /** Múi giờ cắt cửa sổ (phút lệch UTC); mặc định `telemetry.report.tzMin`. */
  tzMin?: number;
  title?: string;
}

/** Chạy trọn báo cáo: `files` là nội dung `03-Data/*.json` theo tên (không đuôi). */
export function runMvpReport(
  files: Readonly<Record<string, unknown>>,
  inputs: readonly unknown[],
  o: MvpReportOptions = {},
): { report: MvpReport; markdown: string } {
  const config = parseGameConfig(files);
  const settings = parseReportSettings(files.telemetry);
  const params = mvpReportParams(config, settings, o.day0);
  const tel = config.telemetry as NonNullable<GameConfig['telemetry']>;
  const tz = o.tzMin ?? settings.tzMin;
  const windowMs =
    o.day0 !== undefined
      ? ([
          dayStartMs(o.day0, tz),
          dayStartMs(addDays(o.day0, settings.windowDays + 1), tz),
        ] as const)
      : undefined;
  const ds = buildDataset(inputs.flatMap(collectBatches), {
    textMaxChars: tel.errorMsgMaxChars,
    catalogs: telemetryCatalogs(config),
    minSessionSec: tel.minSessionSec,
    shortSessionSec: settings.shortSessionSec,
    spamRateMul: settings.spamRateMul,
    spamMinHours: settings.spamMinHours,
    ...(o.waves ? { waves: o.waves } : {}),
    ...(o.builds ? { builds: o.builds } : {}),
    ...(o.data ? { data: o.data } : {}),
    ...(windowMs ? { windowMs } : {}),
  });
  const report = buildReport(ds, params);
  const title =
    o.title ?? `Báo cáo cổng MVP${o.waves?.length ? `: đợt ${o.waves.join(', ')}` : ''}`;
  return { report, markdown: renderReport(report, title) };
}
