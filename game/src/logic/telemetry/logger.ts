/**
 * Bộ ghi sự kiện đo lường (logic thuần, ST-13-01; `01-GDD/13-Do-luong-MVP.md` mục 3, 5; duyệt
 * Technical Director 14/11/2026; QB-153, QB-155, QB-156).
 *
 * `log()` chạy được trong bước logic: làm tròn số, kiểm lược đồ, gán `n`, `JSON.stringify` một lần,
 * đưa vào bộ đệm. Không đụng localStorage, không gửi mạng (lớp nối ST-13-03, ST-13-04 làm việc đó
 * ngoài bước logic). Sự kiện sai lược đồ hoặc quá `maxEventBytes` bị bỏ cả, đếm `rejected`; chế độ
 * `strict` (bản DEV, test) ném lỗi để thấy ngay. Đồng hồ và id phiên truyền từ ngoài vào.
 */
import type { TelemetryConfig } from '../../core/telemetry-config';
import { makeExport, type BatchMeta, type TelemetryExport } from './batch';
import { TelemetryBuffer } from './buffer';
import {
  EVENT_SPECS,
  type Catalogs,
  type EventName,
  type Prop,
  type PropSpec,
  type Props,
  type TelemetryEvent,
} from './schema';
import { sanitizeErrorMessage } from './text';
import { validateEvent, type ValidateOptions } from './validate';

export type ClientErrorKind = 'error' | 'rejection' | 'config';

export interface TelemetryOptions {
  config: TelemetryConfig;
  catalogs: Catalogs;
  /** Id phiên: 8 ký tự base36 (`makeSid`). */
  sid: string;
  /** Đồng hồ máy, ms từ 1970. */
  now: () => number;
  /** Ném lỗi khi sự kiện sai lược đồ (bản DEV, test). */
  strict?: boolean;
}

function decimals(step: number): number {
  return (String(step).split('.')[1] ?? '').length;
}

function roundTo(v: number, step: number): number {
  return Number((Math.round(v / step) * step).toFixed(decimals(step)));
}

interface ErrorRecord {
  p: Props;
  /** Số lần lặp chưa ghi (QB-155). */
  unreported: number;
}

export class Telemetry {
  readonly buffer: TelemetryBuffer;
  /** Sự kiện bị bỏ vì sai lược đồ hoặc quá lớn (QB-153), và lỗi gần nhất. */
  rejected = 0;
  lastRejected: readonly string[] = [];
  private n = 0;
  private on = true;
  private errorRecords = 0;
  private readonly errors = new Map<string, ErrorRecord>();
  private readonly validate: ValidateOptions;

  constructor(private readonly opts: TelemetryOptions) {
    this.buffer = new TelemetryBuffer(opts.config.buffer);
    this.validate = { textMaxChars: opts.config.errorMsgMaxChars, catalogs: opts.catalogs };
  }

  get sid(): string {
    return this.opts.sid;
  }

  get enabled(): boolean {
    return this.on;
  }

  /** `n` của sự kiện tiếp theo (số sự kiện đã nhận trong phiên). */
  get count(): number {
    return this.n;
  }

  /**
   * Tắt gửi (QB-156): xóa bộ đệm, ngừng ghi, không ghi sự kiện nào về việc tắt. Bật lại là việc
   * của lớp nối: sinh `install` mới và tạo bộ ghi mới.
   */
  disable(): void {
    this.on = false;
    this.buffer.clear();
    this.errors.clear();
  }

  /** Ghi một sự kiện. Trả về sự kiện đã lưu, hoặc undefined nếu bị bỏ. */
  log(name: EventName, props: Props): TelemetryEvent | undefined {
    if (!this.on) return undefined;
    const ev: TelemetryEvent = {
      e: name,
      t: this.opts.now(),
      sid: this.opts.sid,
      n: this.n,
      p: this.rounded(name, props),
    };
    const errors = validateEvent(ev, this.validate);
    if (errors.length > 0) return this.reject(errors);
    const json = JSON.stringify(ev);
    if (json.length > this.opts.config.maxEventBytes)
      return this.reject([`${name}: ${json.length} byte > maxEventBytes`]);
    this.n += 1;
    return this.buffer.push(ev, json, this.opts.config.priority[name]) ? ev : undefined;
  }

  /**
   * Lỗi của trang (`window.onerror`, `unhandledrejection`, lỗi dữ liệu; QB-155). Thông báo được làm
   * sạch. Lần đầu ghi `count: 1`; các lần lặp chỉ đếm, `flushErrorCounts()` (khi trang ẩn, khi ghi
   * `stage_progress`) ghi thêm một bản mang số lần lặp. Quá `errorsPerSession` bản ghi thì chỉ đếm.
   */
  clientError(
    kind: ClientErrorKind,
    scene: string | undefined,
    fatal: boolean,
    rawMsg: string,
  ): void {
    if (!this.on) return;
    const msg = sanitizeErrorMessage(rawMsg, this.opts.config.errorMsgMaxChars) || 'unknown';
    const key = `${kind}|${msg}`;
    const rec = this.errors.get(key);
    if (rec) {
      rec.unreported += 1;
      return;
    }
    const p: Props = { kind, fatal, msg, count: 1, ...(scene ? { scene } : {}) };
    this.errors.set(key, { p, unreported: 0 });
    this.writeError(p);
  }

  /** Ghi bù số lần lặp của các lỗi (QB-155). */
  flushErrorCounts(): void {
    for (const rec of this.errors.values()) {
      if (rec.unreported === 0) continue;
      const count = rec.unreported;
      rec.unreported = 0;
      this.writeError({ ...rec.p, count });
    }
  }

  /** Gói xuất tay mọi sự kiện còn trong bộ đệm (đường dự phòng A). */
  exportAll(meta: BatchMeta): TelemetryExport {
    return makeExport(this.buffer.all(), meta, this.opts.config.batch, this.opts.now());
  }

  private writeError(p: Props): void {
    if (this.errorRecords >= this.opts.config.errorsPerSession) return;
    if (this.log('client_error', p)) this.errorRecords += 1;
  }

  private reject(errors: readonly string[]): undefined {
    this.rejected += 1;
    this.lastRejected = errors;
    if (this.opts.strict) throw new Error(`Sự kiện đo lường sai: ${errors.join('; ')}`);
    return undefined;
  }

  /** Làm tròn số theo đơn vị (`round.sec`, `round.ratio`); số không hữu hạn để kiểm lược đồ chặn. */
  private rounded(name: EventName, props: Props): Props {
    const specs: Readonly<Record<string, PropSpec>> = EVENT_SPECS[name].props;
    let out: Record<string, Prop> | undefined;
    for (const [k, v] of Object.entries(props)) {
      const s = specs[k];
      if (!s || s.kind !== 'num' || !s.unit || typeof v !== 'number' || !Number.isFinite(v))
        continue;
      out ??= { ...props };
      out[k] = roundTo(v, this.opts.config.round[s.unit]);
    }
    return out ?? props;
  }
}
