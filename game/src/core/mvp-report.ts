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
