/**
 * Kiểm tra 03-Data/telemetry.json (đo lường đợt thử MVP, EP-13; `01-GDD/13-Do-luong-MVP.md`
 * mục 5, 6, 8; duyệt Technical Director 14/11/2026). Logic thuần. File này không bắt buộc: lỗi thì
 * `GameConfig.telemetry` là undefined (đo lường tắt), game vẫn chạy; test bắt lỗi dữ liệu.
 */
import { envelopeBytes, type BatchLimits } from '../logic/telemetry/batch';
import type { BufferLimits } from '../logic/telemetry/buffer';
import {
  EVENT_NAMES,
  type EventName,
  type Priority,
  TELEMETRY_SCHEMA,
} from '../logic/telemetry/schema';
import { ConfigError, num, obj } from './json-check';

export interface TelemetryConfig {
  schema: typeof TELEMETRY_SCHEMA;
  priority: Readonly<Record<EventName, Priority>>;
  /** Phiên ngắn hơn chừng này giây bị bỏ khỏi báo cáo. */
  minSessionSec: number;
  /** Ẩn tab lâu hơn chừng này phút thì quay lại là phiên mới (QB-154). */
  newSessionAfterHiddenMin: number;
  buffer: BufferLimits;
  maxEventBytes: number;
  batch: BatchLimits & { minPending: number; intervalSec: number };
  retry: { baseSec: number; maxSec: number; maxPerSession: number; jitter: number };
  persistDebounceSec: number;
  orphanMin: number;
  stageProgressSec: number;
  keepaliveMaxBytes: number;
  endpoint: { maxBatchBytes: number; maxBatchesPerInstall: number };
  failedSessionsNotice: number;
  errorsPerSession: number;
  errorMsgMaxChars: number;
  noticeSec: number;
  round: { screenPx: number; dpr: number; sec: number; ratio: number };
  frame: { slowMs: number; ignoreMs: number };
  /** Ngưỡng cổng MVP (mục 6.2). */
  gate: Readonly<Record<string, number>>;
  /** Dấu hiệu "hỏng" (mục 6.3). */
  broken: Readonly<Record<string, number>>;
}

/** Phần vỏ lô lớn nhất có thể (id dài nhất), để kiểm `maxEventBytes` vừa một lô. */
const WORST_META = {
  install: '00000000-0000-4000-8000-000000000000',
  wave: 'x'.repeat(16),
  build: 'f'.repeat(16),
  data: 'ffffffff',
};
const WORST_BATCH_ID = `${'z'.repeat(8)}-999999`;
const WORST_SENT_AT = 9_999_999_999_999;

const GATE_FRACTIONS = [
  'prologueClear',
  'stage1Clear',
  'allFourClear',
  'returnNextDay',
  'wantStage5',
  'weaknessUse',
  'weaknessDamageShare',
  'touchVsKeyboard',
  'answerShareMin',
] as const;
const GATE_COUNTS = ['weaknessBosses', 'minSample', 'minSampleSmall', 'minGroup'] as const;
const BROKEN_FRACTIONS = ['quitSameSection', 'bossTtkFrac'] as const;

function positive(value: unknown, path: string): number {
  const v = num(value, path);
  if (v <= 0) throw new ConfigError(`${path}: phải > 0 (đang là ${v})`);
  return v;
}

/** Số đếm: số nguyên ≥ 1. */
function count(value: unknown, path: string): number {
  const v = positive(value, path);
  if (!Number.isInteger(v)) throw new ConfigError(`${path}: cần số nguyên ≥ 1`);
  return v;
}

/** Phân số trong (0; 1]. */
function fraction(value: unknown, path: string): number {
  const v = num(value, path);
  if (v <= 0 || v > 1) throw new ConfigError(`${path}: phải trong (0; 1] (đang là ${v})`);
  return v;
}

function parsePriority(value: unknown): Record<EventName, Priority> {
  const p = obj(value, 'telemetry.priority');
  const out = {} as Record<EventName, Priority>;
  for (const name of Object.keys(p)) {
    if (name.startsWith('_')) continue;
    if (!(EVENT_NAMES as string[]).includes(name))
      throw new ConfigError(`telemetry.priority: sự kiện lạ "${name}"`);
  }
  for (const name of EVENT_NAMES) {
    const v = p[name];
    if (v !== 0 && v !== 1 && v !== 2)
      throw new ConfigError(`telemetry.priority.${name}: cần 0, 1 hoặc 2`);
    out[name] = v;
  }
  return out;
}

export function parseTelemetry(value: unknown): TelemetryConfig {
  const t = obj(value, 'telemetry');
  if (t.schema !== TELEMETRY_SCHEMA)
    throw new ConfigError(
      `telemetry.schema: phải là ${TELEMETRY_SCHEMA} (đang là ${String(t.schema)})`,
    );
  const b = obj(t.buffer, 'telemetry.buffer');
  const buffer: BufferLimits = {
    maxBytes: count(b.maxBytes, 'telemetry.buffer.maxBytes'),
    maxEvents: count(b.maxEvents, 'telemetry.buffer.maxEvents'),
  };
  const e = obj(t.endpoint, 'telemetry.endpoint');
  const endpoint = {
    maxBatchBytes: count(e.maxBatchBytes, 'telemetry.endpoint.maxBatchBytes'),
    maxBatchesPerInstall: count(e.maxBatchesPerInstall, 'telemetry.endpoint.maxBatchesPerInstall'),
  };
  const l = obj(t.batch, 'telemetry.batch');
  const batch = {
    maxEvents: count(l.maxEvents, 'telemetry.batch.maxEvents'),
    maxBytes: count(l.maxBytes, 'telemetry.batch.maxBytes'),
    minPending: count(l.minPending, 'telemetry.batch.minPending'),
    intervalSec: positive(l.intervalSec, 'telemetry.batch.intervalSec'),
  };
  // jsonb::text của điểm nhận thêm dấu cách sau ":" và ",", nên chừa 20%.
  if (batch.maxBytes > 0.8 * endpoint.maxBatchBytes)
    throw new ConfigError(
      `telemetry.batch.maxBytes: phải ≤ 0,8 × endpoint.maxBatchBytes (${0.8 * endpoint.maxBatchBytes})`,
    );
  if (batch.maxBytes > buffer.maxBytes || batch.maxEvents > buffer.maxEvents)
    throw new ConfigError('telemetry.batch: lô không được lớn hơn bộ đệm');
  if (batch.minPending > batch.maxEvents)
    throw new ConfigError('telemetry.batch.minPending: phải ≤ maxEvents');
  const maxEventBytes = count(t.maxEventBytes, 'telemetry.maxEventBytes');
  if (maxEventBytes + envelopeBytes(WORST_META, WORST_BATCH_ID, WORST_SENT_AT) > batch.maxBytes)
    throw new ConfigError(
      'telemetry.maxEventBytes: một sự kiện lớn nhất cộng vỏ lô phải vừa batch.maxBytes',
    );
  const keepaliveMaxBytes = count(t.keepaliveMaxBytes, 'telemetry.keepaliveMaxBytes');
  if (keepaliveMaxBytes < batch.maxBytes)
    throw new ConfigError('telemetry.keepaliveMaxBytes: phải ≥ batch.maxBytes');
  const r = obj(t.retry, 'telemetry.retry');
  const retry = {
    baseSec: positive(r.baseSec, 'telemetry.retry.baseSec'),
    maxSec: positive(r.maxSec, 'telemetry.retry.maxSec'),
    maxPerSession: count(r.maxPerSession, 'telemetry.retry.maxPerSession'),
    jitter: num(r.jitter, 'telemetry.retry.jitter', { min: 0 }),
  };
  if (retry.maxSec < retry.baseSec) throw new ConfigError('telemetry.retry: maxSec phải ≥ baseSec');
  if (retry.jitter >= 1) throw new ConfigError('telemetry.retry.jitter: phải < 1');
  const rd = obj(t.round, 'telemetry.round');
  const round = {
    screenPx: count(rd.screenPx, 'telemetry.round.screenPx'),
    dpr: positive(rd.dpr, 'telemetry.round.dpr'),
    sec: positive(rd.sec, 'telemetry.round.sec'),
    ratio: positive(rd.ratio, 'telemetry.round.ratio'),
  };
  const fr = obj(t.frame, 'telemetry.frame');
  const frame = {
    slowMs: positive(fr.slowMs, 'telemetry.frame.slowMs'),
    ignoreMs: positive(fr.ignoreMs, 'telemetry.frame.ignoreMs'),
  };
  if (frame.ignoreMs <= frame.slowMs)
    throw new ConfigError('telemetry.frame.ignoreMs: phải > slowMs');
  const g = obj(t.gate, 'telemetry.gate');
  const gate: Record<string, number> = {};
  for (const k of GATE_FRACTIONS) gate[k] = fraction(g[k], `telemetry.gate.${k}`);
  for (const k of GATE_COUNTS) gate[k] = count(g[k], `telemetry.gate.${k}`);
  if ((gate.minSampleSmall as number) > (gate.minSample as number))
    throw new ConfigError('telemetry.gate.minSampleSmall: phải ≤ minSample');
  const br = obj(t.broken, 'telemetry.broken');
  const broken: Record<string, number> = {};
  for (const k of BROKEN_FRACTIONS) broken[k] = fraction(br[k], `telemetry.broken.${k}`);
  broken.buildMinGroup = count(br.buildMinGroup, 'telemetry.broken.buildMinGroup');
  broken.buildTimeRatio = num(br.buildTimeRatio, 'telemetry.broken.buildTimeRatio');
  if (broken.buildTimeRatio <= 1)
    throw new ConfigError('telemetry.broken.buildTimeRatio: phải > 1');
  return {
    schema: TELEMETRY_SCHEMA,
    priority: parsePriority(t.priority),
    minSessionSec: num(t.minSessionSec, 'telemetry.minSessionSec', { min: 0 }),
    newSessionAfterHiddenMin: positive(
      t.newSessionAfterHiddenMin,
      'telemetry.newSessionAfterHiddenMin',
    ),
    buffer,
    maxEventBytes,
    batch,
    retry,
    persistDebounceSec: positive(t.persistDebounceSec, 'telemetry.persistDebounceSec'),
    orphanMin: positive(t.orphanMin, 'telemetry.orphanMin'),
    stageProgressSec: positive(t.stageProgressSec, 'telemetry.stageProgressSec'),
    keepaliveMaxBytes,
    endpoint,
    failedSessionsNotice: count(t.failedSessionsNotice, 'telemetry.failedSessionsNotice'),
    errorsPerSession: count(t.errorsPerSession, 'telemetry.errorsPerSession'),
    errorMsgMaxChars: count(t.errorMsgMaxChars, 'telemetry.errorMsgMaxChars'),
    noticeSec: positive(t.noticeSec, 'telemetry.noticeSec'),
    round,
    frame,
    gate,
    broken,
  };
}

/** Đọc `telemetry.json` không bắt buộc: thiếu hoặc lỗi thì tắt đo lường và trả lý do. */
export function parseTelemetryOptional(value: unknown): {
  telemetry: TelemetryConfig | undefined;
  error: string | undefined;
} {
  if (value === undefined) return { telemetry: undefined, error: 'thiếu telemetry.json' };
  try {
    return { telemetry: parseTelemetry(value), error: undefined };
  } catch (e) {
    if (e instanceof ConfigError) return { telemetry: undefined, error: e.message };
    throw e;
  }
}
