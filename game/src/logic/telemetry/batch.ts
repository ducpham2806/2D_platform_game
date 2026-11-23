/**
 * Lô gửi và gói xuất JSON (logic thuần, ST-13-01; `01-GDD/13-Do-luong-MVP.md` mục 2, 5, 8).
 * Lô gửi lên điểm nhận và gói xuất tay dùng cùng định dạng lô, nên báo cáo đọc được cả hai. Báo
 * cáo khử trùng sự kiện theo (`install`, `sid`, `n`) (QB-152), nên một sự kiện vừa gửi vừa xuất,
 * hay gửi lại sau khi mất phản hồi, không bị đếm đôi. Byte = độ dài JSON (chỉ có ASCII).
 */
import { TELEMETRY_SCHEMA, type TelemetryEvent } from './schema';

/** Thông tin chung của mọi lô từ một máy. */
export interface BatchMeta {
  /** UUID v4 ngẫu nhiên của bản cài (mục 4). */
  install: string;
  /** Mã đợt từ `?mvp=`. */
  wave: string;
  /** Commit ngắn nhúng lúc build. */
  build: string;
  /** Dấu vân tay dữ liệu: FNV-1a 8 ký tự hex của `03-Data` (trừ `telemetry.json`). */
  data: string;
}

export interface TelemetryBatch extends BatchMeta {
  schema: typeof TELEMETRY_SCHEMA;
  /** `${sid của phiên gửi}-${số lô}`; duy nhất theo `install`. */
  batch: string;
  sentAt: number;
  events: TelemetryEvent[];
}

export interface BatchLimits {
  maxEvents: number;
  maxBytes: number;
}

export interface TelemetryExport {
  schema: typeof TELEMETRY_SCHEMA;
  kind: 'export';
  exportedAt: number;
  batches: TelemetryBatch[];
}

export function makeBatch(
  meta: BatchMeta,
  batch: string,
  sentAt: number,
  events: TelemetryEvent[],
): TelemetryBatch {
  return { schema: TELEMETRY_SCHEMA, ...meta, batch, sentAt, events };
}

/** Byte phần vỏ lô khi chưa có sự kiện (để cắt lô không vượt `maxBytes`). */
export function envelopeBytes(meta: BatchMeta, batch: string, sentAt: number): number {
  return JSON.stringify(makeBatch(meta, batch, sentAt, [])).length;
}

/**
 * Chia sự kiện thành lô ≤ `maxEvents` sự kiện và ≤ `maxBytes` byte (JSON của cả lô). Sự kiện một
 * mình đã quá `maxBytes` thì bỏ và trả về trong `skipped` (bộ ghi đã chặn sự kiện lớn hơn
 * `maxEventBytes`, nên chỉ xảy ra khi dữ liệu sai).
 */
export function makeBatches(
  events: readonly TelemetryEvent[],
  meta: BatchMeta,
  limits: BatchLimits,
  batchId: (index: number) => string,
  sentAt: number,
): { batches: TelemetryBatch[]; skipped: TelemetryEvent[] } {
  const batches: TelemetryBatch[] = [];
  const skipped: TelemetryEvent[] = [];
  let current: TelemetryEvent[] = [];
  let currentId = batchId(0);
  let used = envelopeBytes(meta, currentId, sentAt);
  const flush = (): void => {
    if (current.length === 0) return;
    batches.push(makeBatch(meta, currentId, sentAt, current));
    current = [];
    currentId = batchId(batches.length);
    used = envelopeBytes(meta, currentId, sentAt);
  };
  for (const ev of events) {
    const bytes = JSON.stringify(ev).length;
    if (envelopeBytes(meta, currentId, sentAt) + bytes > limits.maxBytes) {
      skipped.push(ev);
      continue;
    }
    if (
      current.length >= limits.maxEvents ||
      used + bytes + (current.length > 0 ? 1 : 0) > limits.maxBytes
    )
      flush();
    used += bytes + (current.length > 0 ? 1 : 0);
    current.push(ev);
  }
  flush();
  return { batches, skipped };
}

/** Gói xuất tay (đường dự phòng A, Cài đặt → Dữ liệu → Xuất JSON). */
export function makeExport(
  events: readonly TelemetryEvent[],
  meta: BatchMeta,
  limits: BatchLimits,
  exportedAt: number,
): TelemetryExport {
  const { batches } = makeBatches(
    events,
    meta,
    limits,
    (i) => `export-${exportedAt}-${i}`,
    exportedAt,
  );
  return { schema: TELEMETRY_SCHEMA, kind: 'export', exportedAt, batches };
}
