/**
 * Kiểm lược đồ sự kiện và phong bì lô (logic thuần, ST-13-01; `01-GDD/13-Do-luong-MVP.md`
 * mục 3, 8, 10 ý 2). Trả về danh sách lỗi (rỗng là hợp lệ). Chặn: tên lạ, khóa lạ, thiếu khóa
 * bắt buộc, sai kiểu, số không hữu hạn hoặc ngoài khoảng, giá trị ngoài enum, chuỗi không phải id
 * hoặc ngoài danh mục (chuỗi tự do), chữ `text` dài quá, còn chữ số, URL hoặc ký tự ngoài ASCII.
 */
import type { BatchMeta } from './batch';
import {
  EVENT_SPECS,
  ID_PATTERN,
  isEventName,
  PATTERNS,
  SURVEY_ANSWERS,
  type Catalogs,
  type CatalogName,
  type PropSpec,
} from './schema';

export interface ValidateOptions {
  /** `telemetry.json → errorMsgMaxChars`. */
  textMaxChars: number;
  /** Danh mục id; thiếu danh mục nào thì chỉ kiểm khuôn id. */
  catalogs: Catalogs;
}

/** Dấu hiệu chữ chưa làm sạch: chữ số, URL, ký tự ngoài ASCII in được. */
const DIRTY_TEXT_RE = /\d|:\/\/|www\.|[^\x20-\x7e]/i;
const CAUSE_RE = /^(?:(?:enemy|boss):[A-Za-z0-9_.-]{1,40}|spike|pit|laser)$/;
/** Giới hạn khóa của `map`, độ dài `ids`: chặn ghi rác. */
const MAX_MAP_KEYS = 32;
const MAX_IDS = 32;

const WAVE_RE = /^[a-z0-9]{1,16}$/;
const BUILD_RE = /^[0-9a-f]{7,16}$/;
const DATA_RE = /^[0-9a-f]{8}$/;
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SID_RE = /^[0-9a-z]{8}$/;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function checkId(v: unknown, catalog: CatalogName | undefined, o: ValidateOptions): string {
  if (typeof v !== 'string' || !ID_PATTERN.test(v)) return 'cần id (chữ, số, _ . : -, ≤ 48 ký tự)';
  const set = catalog ? o.catalogs[catalog] : undefined;
  return set && !set.has(v) ? `"${v}" không có trong danh mục ${catalog}` : '';
}

function checkNumber(v: unknown, s: { min?: number; max?: number }, integer: boolean): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return 'cần số hữu hạn';
  if (integer && !Number.isInteger(v)) return 'cần số nguyên';
  if (s.min !== undefined && v < s.min) return `nhỏ hơn ${s.min}`;
  if (s.max !== undefined && v > s.max) return `lớn hơn ${s.max}`;
  return '';
}

/** Lỗi của một giá trị theo kiểu (chuỗi rỗng là hợp lệ). */
export function checkProp(v: unknown, s: PropSpec, o: ValidateOptions): string {
  switch (s.kind) {
    case 'int':
      return checkNumber(v, s, true);
    case 'num':
      return checkNumber(v, s, false);
    case 'bool':
      return typeof v === 'boolean' ? '' : 'cần boolean';
    case 'enum':
      return typeof v === 'string' && s.values.includes(v)
        ? ''
        : `ngoài enum (${s.values.join(', ')})`;
    case 'id':
      return checkId(v, s.catalog, o);
    case 'ids': {
      if (!Array.isArray(v)) return 'cần danh sách id';
      if (v.length > MAX_IDS) return `quá ${MAX_IDS} phần tử`;
      for (const x of v) {
        const err = checkId(x, s.catalog, o);
        if (err) return `phần tử: ${err}`;
      }
      return '';
    }
    case 'map': {
      if (!isPlainObject(v)) return 'cần bảng id → số';
      const entries = Object.entries(v);
      if (entries.length > MAX_MAP_KEYS) return `quá ${MAX_MAP_KEYS} khóa`;
      for (const [k, x] of entries) {
        const err = checkId(k, s.catalog, o);
        if (err) return `khóa "${k}": ${err}`;
        if (typeof x !== 'number' || !Number.isFinite(x)) return `giá trị của "${k}" cần số`;
      }
      return '';
    }
    case 'pattern':
      return typeof v === 'string' && PATTERNS[s.pattern].test(v) ? '' : `sai khuôn ${s.pattern}`;
    case 'cause': {
      if (typeof v !== 'string' || !CAUSE_RE.test(v))
        return 'cần enemy:<id>, boss:<đòn>, spike, pit hoặc laser';
      return v.startsWith('enemy:') ? checkId(v.slice(6), 'enemy', o) : '';
    }
    case 'scalar':
      if (typeof v === 'boolean') return '';
      return typeof v === 'number' && Number.isFinite(v) ? '' : 'cần số hữu hạn hoặc boolean';
    case 'text':
      if (typeof v !== 'string' || v.length === 0) return 'cần chữ';
      if (v.length > o.textMaxChars) return `dài quá ${o.textMaxChars} ký tự`;
      return DIRTY_TEXT_RE.test(v) ? 'còn chữ số, URL hoặc ký tự ngoài ASCII (chưa làm sạch)' : '';
  }
}

/** Lỗi lược đồ của một sự kiện. */
export function validateEvent(ev: unknown, o: ValidateOptions): string[] {
  if (!isPlainObject(ev)) return ['sự kiện: cần object'];
  const errors: string[] = [];
  const name = typeof ev.e === 'string' ? ev.e : '';
  for (const key of Object.keys(ev)) {
    if (!['e', 't', 'sid', 'n', 'p'].includes(key)) errors.push(`phong bì: khóa lạ "${key}"`);
  }
  if (!isEventName(name)) return [...errors, `tên sự kiện lạ "${name}"`];
  if (typeof ev.t !== 'number' || !Number.isFinite(ev.t) || ev.t < 0)
    errors.push(`${name}.t: cần ms ≥ 0`);
  if (typeof ev.sid !== 'string' || !SID_RE.test(ev.sid))
    errors.push(`${name}.sid: cần 8 ký tự base36`);
  if (typeof ev.n !== 'number' || !Number.isInteger(ev.n) || ev.n < 0)
    errors.push(`${name}.n: cần số nguyên ≥ 0`);
  if (!isPlainObject(ev.p)) return [...errors, `${name}.p: cần object`];
  const spec = EVENT_SPECS[name];
  const props: Readonly<Record<string, PropSpec>> = spec.props;
  for (const [key, value] of Object.entries(ev.p)) {
    const ps = props[key];
    if (!ps) {
      errors.push(`${name}.p: khóa lạ "${key}"`);
      continue;
    }
    const err = checkProp(value, ps, o);
    if (err) errors.push(`${name}.p.${key}: ${err}`);
  }
  for (const key of spec.required) {
    if (ev.p[key] === undefined) errors.push(`${name}.p: thiếu "${key}"`);
  }
  if (name === 'survey_answer' && typeof ev.p.q === 'string' && typeof ev.p.a === 'string') {
    const allowed = SURVEY_ANSWERS[ev.p.q];
    if (allowed && !allowed.includes(ev.p.a))
      errors.push(`survey_answer.p.a: "${ev.p.a}" không hợp với câu ${ev.p.q}`);
  }
  return errors;
}

/** Lỗi phong bì lô (mục 8): `install` UUID v4, `wave`, `build`, `data` đúng khuôn. */
export function validateBatchMeta(meta: BatchMeta): string[] {
  const errors: string[] = [];
  if (!UUID_V4_RE.test(meta.install)) errors.push('install: cần UUID v4 (chữ thường)');
  if (!WAVE_RE.test(meta.wave)) errors.push('wave: cần 1–16 ký tự a-z0-9');
  if (!BUILD_RE.test(meta.build)) errors.push('build: cần 7–16 ký tự hex');
  if (!DATA_RE.test(meta.data)) errors.push('data: cần 8 ký tự hex');
  return errors;
}

/** Id phiên ngẫu nhiên đúng khuôn (8 ký tự base36) từ hàm ngẫu nhiên truyền vào. */
export function makeSid(random: () => number): string {
  let s = '';
  for (let i = 0; i < 8; i += 1) s += Math.floor(random() * 36).toString(36);
  return s;
}
