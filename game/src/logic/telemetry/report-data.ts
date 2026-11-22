/**
 * Dữ liệu cho báo cáo cổng MVP (logic thuần, ST-13-05a; GDD 13 mục 6.1, 7.3; duyệt QA Lead
 * 14/11/2026): đọc lô từ file (gói xuất tay, bảng tải từ điểm nhận, mảng lô), kiểm lược đồ, khử
 * trùng theo (`install`, `sid`, `n`) (QB-152), lọc đợt, build, cửa sổ đo ở mức sự kiện, giữ một
 * nhóm `data`, loại `install` (staff, mọi phiên quá ngắn), rồi dựng người chơi và lượt vào màn
 * (QB-47, QB-154) từ chuỗi sự kiện.
 */
import type { TelemetryBatch } from './batch';
import {
  type Catalogs,
  DEVICES,
  type Prop,
  type Props,
  TELEMETRY_SCHEMA,
  type TelemetryEvent,
} from './schema';
import { validateBatchMeta, validateEvent } from './validate';

/** Sự kiện kèm thông tin lô. */
export interface Ev extends TelemetryEvent {
  install: string;
  build: string;
  wave: string;
  data: string;
}

export interface Dataset {
  /** Sự kiện giữ lại, sắp theo install, phiên (`t` nhỏ nhất của phiên, hòa thì `sid`), `n`. */
  events: Ev[];
  batches: number;
  rejectedBatches: number;
  /** Sự kiện sai lược đồ (bỏ). */
  rejected: number;
  duplicates: number;
  waves: string[];
  builds: string[];
  /** Nhóm dấu vân tay dữ liệu được báo cáo (mục 7.4). */
  data: string | undefined;
  /** Nhóm `data` khác, không vào báo cáo này (chạy lại với `--data`). */
  otherData: { data: string; events: number; installs: number }[];
  /** Sự kiện bỏ vì ngoài đợt, ngoài danh sách build, ngoài cửa sổ đo. */
  filtered: { wave: number; build: number; window: number };
  excluded: {
    staff: string[];
    /** Mọi phiên < `minSessionSec`. */
    short: string[];
    /** Trong số `short`, người đã vào Prologue (nhóm MV1 cần thấy). */
    shortWithPrologue: number;
    /** Không còn sự kiện nào sau khi lọc đợt, build, cửa sổ, nhóm `data`. */
    filtered: string[];
    /** Sự kiện mỗi giờ quá `spamRateMul` lần trung vị (ghi rác, mục 9). */
    spam: string[];
  };
  /** Install giữ lại chỉ có một phiên, ngắn hơn `shortSessionSec` (dấu hiệu tab ẩn danh, mục 9). */
  singleShortSession: number;
}

export interface DatasetOptions {
  textMaxChars: number;
  catalogs: Catalogs;
  minSessionSec: number;
  /** Chỉ giữ các đợt, build này (thiếu hoặc rỗng: giữ hết). */
  waves?: readonly string[];
  builds?: readonly string[];
  /** Nhóm `data` cần báo cáo; thiếu thì lấy nhóm của sự kiện sớm nhất (nhóm chứa ngày 0). */
  data?: string;
  /** Cửa sổ đo [từ; tới) theo `t` (ms). */
  windowMs?: readonly [number, number];
  shortSessionSec: number;
  spamRateMul: number;
  /** Giờ chơi tối thiểu khi tính sự kiện mỗi giờ (phiên ngắn không bị coi là ghi rác). */
  spamMinHours: number;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Lấy lô từ nội dung một file: gói xuất (`{kind: 'export', batches}`), mảng lô, mảng dòng bảng tải
 * từ điểm nhận (`{payload}`), hoặc một lô.
 */
export function collectBatches(json: unknown): unknown[] {
  if (Array.isArray(json))
    return json.flatMap((x) => (isObj(x) && 'payload' in x ? [x.payload] : [x]));
  if (isObj(json) && Array.isArray(json.batches)) return json.batches;
  return [json];
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const num = (v: Prop | undefined, d = 0): number => (typeof v === 'number' ? v : d);
const sessionKey = (e: { install: string; sid: string }): string => `${e.install}|${e.sid}`;

/** Đọc, kiểm, khử trùng, lọc, loại `install`. */
export function buildDataset(rawBatches: readonly unknown[], o: DatasetOptions): Dataset {
  const v = { textMaxChars: o.textMaxChars, catalogs: o.catalogs };
  const seen = new Set<string>();
  const all: Ev[] = [];
  let rejected = 0;
  let rejectedBatches = 0;
  let duplicates = 0;
  let batches = 0;
  for (const raw of rawBatches) {
    const b = raw as TelemetryBatch;
    if (
      !isObj(raw) ||
      b.schema !== TELEMETRY_SCHEMA ||
      !Array.isArray(b.events) ||
      validateBatchMeta(b).length > 0
    ) {
      rejectedBatches += 1;
      continue;
    }
    batches += 1;
    for (const ev of b.events) {
      if (validateEvent(ev, v).length > 0) {
        rejected += 1;
        continue;
      }
      const key = `${b.install}|${ev.sid}|${ev.n}`;
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      seen.add(key);
      all.push({ ...ev, install: b.install, build: b.build, wave: b.wave, data: b.data });
    }
  }
  const staff = new Set(
    all.filter((e) => e.e === 'session_start' && e.p.staff === true).map((e) => e.install),
  );
  const installsBefore = new Set(all.filter((e) => !staff.has(e.install)).map((e) => e.install));

  // Lọc ở mức sự kiện (duyệt QA Lead): install chỉ mất khi không còn sự kiện nào.
  const filtered = { wave: 0, build: 0, window: 0 };
  const dropReason = (e: Ev): keyof typeof filtered | undefined => {
    if (o.waves?.length && !o.waves.includes(e.wave)) return 'wave';
    if (o.builds?.length && !o.builds.includes(e.build)) return 'build';
    if (o.windowMs && (e.t < o.windowMs[0] || e.t >= o.windowMs[1])) return 'window';
    return undefined;
  };
  let kept: Ev[] = [];
  for (const e of all) {
    if (staff.has(e.install)) continue;
    const why = dropReason(e);
    if (why) filtered[why] += 1;
    else kept.push(e);
  }

  // Nhóm dữ liệu: mặc định nhóm của sự kiện sớm nhất.
  const groups = new Map<string, { events: number; installs: Set<string> }>();
  let earliest: Ev | undefined;
  for (const e of kept) {
    const g = groups.get(e.data) ?? { events: 0, installs: new Set<string>() };
    g.events += 1;
    g.installs.add(e.install);
    groups.set(e.data, g);
    if (!earliest || e.t < earliest.t) earliest = e;
  }
  const data = o.data ?? earliest?.data;
  const otherData = [...groups.entries()]
    .filter(([d]) => d !== data)
    .map(([d, g]) => ({ data: d, events: g.events, installs: g.installs.size }))
    .sort((a, b) => b.events - a.events);
  kept = kept.filter((e) => e.data === data);

  // Loại install khi mọi phiên đều ngắn hơn minSessionSec.
  const span = new Map<string, { min: number; max: number; real: number }>();
  for (const e of kept) {
    const k = sessionKey(e);
    const s = span.get(k) ?? { min: e.t, max: e.t, real: 0 };
    s.min = Math.min(s.min, e.t);
    s.max = Math.max(s.max, e.t);
    if (e.e === 'stage_end' || e.e === 'stage_progress')
      s.real = Math.max(s.real, num(e.p.realSec));
    span.set(k, s);
  }
  const longest = new Map<string, number>();
  const total = new Map<string, { sec: number; sessions: number }>();
  for (const [k, s] of span) {
    const install = k.slice(0, k.indexOf('|'));
    const sec = Math.max(Math.max(0, s.max - s.min) / 1000, s.real);
    longest.set(install, Math.max(longest.get(install) ?? 0, sec));
    const tot = total.get(install) ?? { sec: 0, sessions: 0 };
    tot.sec += sec;
    tot.sessions += 1;
    total.set(install, tot);
  }
  const short = [...longest.entries()]
    .filter(([, sec]) => sec < o.minSessionSec)
    .map(([install]) => install)
    .sort();
  const shortSet = new Set(short);
  const shortWithPrologue = new Set(
    kept
      .filter((e) => shortSet.has(e.install) && e.e === 'stage_start' && e.p.stage === 'prologue')
      .map((e) => e.install),
  ).size;
  kept = kept.filter((e) => !shortSet.has(e.install));

  // Ghi rác: sự kiện mỗi giờ chơi quá spamRateMul lần trung vị.
  const count = new Map<string, number>();
  for (const e of kept) count.set(e.install, (count.get(e.install) ?? 0) + 1);
  const rate = new Map<string, number>();
  for (const [install, c] of count)
    rate.set(install, c / Math.max((total.get(install)?.sec ?? 0) / 3600, o.spamMinHours));
  const mid = median([...rate.values()]);
  const spam = [...rate.entries()]
    .filter(([, r]) => r > o.spamRateMul * mid)
    .map(([install]) => install)
    .sort();
  const spamSet = new Set(spam);
  kept = kept.filter((e) => !spamSet.has(e.install));
  let singleShortSession = 0;
  for (const install of new Set(kept.map((e) => e.install))) {
    const tot = total.get(install);
    if (tot && tot.sessions === 1 && tot.sec < o.shortSessionSec) singleShortSession += 1;
  }

  const left = new Set(kept.map((e) => e.install));
  const lostByFilter = [...installsBefore]
    .filter((i) => !left.has(i) && !shortSet.has(i) && !spamSet.has(i))
    .sort();
  const start = new Map<string, number>();
  for (const [k, s] of span) start.set(k, s.min);
  const events = kept.sort(
    (a, b) =>
      cmp(a.install, b.install) ||
      (start.get(sessionKey(a)) ?? 0) - (start.get(sessionKey(b)) ?? 0) ||
      cmp(a.sid, b.sid) ||
      a.n - b.n,
  );
  return {
    events,
    batches,
    rejectedBatches,
    rejected,
    duplicates,
    waves: [...new Set(events.map((e) => e.wave))].sort(),
    builds: [...new Set(events.map((e) => e.build))].sort(),
    data,
    otherData,
    filtered,
    excluded: {
      staff: [...staff].sort(),
      short,
      shortWithPrologue,
      filtered: lostByFilter,
      spam,
    },
    singleShortSession,
  };
}

// ───────────────────────── Người chơi và lượt ─────────────────────────

export type Device = (typeof DEVICES)[number];

/** Một lượt vào màn (QB-47): từ `stage_start` tới `stage_end` hoặc `stage_start` kế; còn lại là bỏ dở. */
export interface Run {
  install: string;
  sid: string;
  stage: string;
  start: Props;
  /** Sự kiện trong lượt (sau `stage_start`), theo thứ tự. */
  events: Ev[];
  outcome: 'clear' | 'quit' | 'abandon';
  /**
   * Xong màn: có `boss_end{win}` của boss chiến dịch trong lượt; màn không có boss (Prologue) thì
   * `stage_end{clear}` (duyệt QA Lead: `stage_end.outcome` không cho biết đã hạ boss).
   */
  cleared: boolean;
  /** `stage_end{clear}` ở màn có boss mà không có `boss_end{win}` đúng boss: không tính là xong. */
  anomaly: boolean;
  /** Thuộc tính cuối: `stage_end`, không thì `stage_progress` cuối. */
  final: Props | undefined;
  runSec: number;
  device: Device;
  /** Lượt có giảm tốc (`gameSpeedMin` < 1): loại khỏi MV7, H3, H4. */
  slowed: boolean;
  /** Chết, gồm cả rơi hố còn máu (như nhật ký Prototype). */
  deaths: number;
  /** Chỉ `kind: death`. */
  kills: number;
  /** Lần đầu vào từng đoạn (giây trong lượt). */
  sections: Map<string, number>;
  /** `furthest` ở thuộc tính cuối. */
  furthest: string | undefined;
}

export interface Player {
  install: string;
  /** Ngày (`session_start.day`, giờ máy) theo thứ tự xuất hiện. */
  days: string[];
  runs: Run[];
  /** Sự kiện ngoài lượt (phiên, phiếu, Quầy, lỗi…). */
  meta: Ev[];
  /** Thiết bị nhiều giây chơi nhất qua mọi lượt. */
  device: Device;
}

const RUN_EVENTS = new Set([
  'section_enter',
  'checkpoint',
  'death',
  'difficulty_hint',
  'boss_start',
  'boss_end',
  'stage_progress',
  'stage_end',
]);

function isDevice(v: unknown): v is Device {
  return (DEVICES as readonly unknown[]).includes(v);
}

/** Khóa lớn nhất của `deviceSec`, hòa thì theo thứ tự `DEVICES`; không có thì `fallback`. */
export function primaryDevice(deviceSec: Prop | undefined, fallback: Prop | undefined): Device {
  if (deviceSec && typeof deviceSec === 'object' && !Array.isArray(deviceSec)) {
    const sec = deviceSec as Record<string, number>;
    let best: Device | undefined;
    for (const d of DEVICES)
      if ((sec[d] ?? 0) > 0 && (!best || (sec[d] ?? 0) > (sec[best] ?? 0))) best = d;
    if (best) return best;
  }
  return isDevice(fallback) ? fallback : 'keyboard';
}

/**
 * Dựng người chơi và lượt. `bossOfStage`: boss chiến dịch theo id màn. Lượt mở giữ qua phiên mới
 * (QB-154: ẩn tab lâu rồi quay lại vẫn trong lượt), đóng ở `stage_end` hoặc `stage_start` kế.
 */
export function buildPlayers(
  ds: Dataset,
  bossOfStage: ReadonlyMap<string, string>,
): { players: Player[]; anomalies: number } {
  const players = new Map<string, Player>();
  let cur: Run | undefined;
  let curInstall = '';
  let anomalies = 0;
  const close = (): void => {
    if (!cur) return;
    finishRun(cur);
    if (cur.anomaly) anomalies += 1;
    cur = undefined;
  };
  for (const e of ds.events) {
    if (e.install !== curInstall) {
      close();
      curInstall = e.install;
    }
    let pl = players.get(e.install);
    if (!pl) {
      pl = { install: e.install, days: [], runs: [], meta: [], device: 'keyboard' };
      players.set(e.install, pl);
    }
    if (e.e === 'stage_start') {
      close();
      cur = {
        install: e.install,
        sid: e.sid,
        stage: String(e.p.stage),
        start: e.p,
        events: [],
        outcome: 'abandon',
        cleared: false,
        anomaly: false,
        final: undefined,
        runSec: 0,
        device: primaryDevice(undefined, e.p.device),
        slowed: num(e.p.gameSpeed, 1) < 1,
        deaths: 0,
        kills: 0,
        sections: new Map(),
        furthest: undefined,
      };
      pl.runs.push(cur);
      continue;
    }
    if (e.e === 'session_start' && typeof e.p.day === 'string') pl.days.push(e.p.day);
    if (!cur || !RUN_EVENTS.has(e.e)) {
      pl.meta.push(e);
      continue;
    }
    cur.events.push(e);
    const boss = bossOfStage.get(cur.stage);
    if (
      e.e === 'section_enter' &&
      typeof e.p.section === 'string' &&
      !cur.sections.has(e.p.section)
    )
      cur.sections.set(e.p.section, num(e.p.tRun));
    if (e.e === 'boss_end' && e.p.outcome === 'win' && boss !== undefined && e.p.boss === boss)
      cur.cleared = true;
    if (e.e === 'stage_progress') cur.final = e.p;
    if (e.e === 'stage_end') {
      cur.final = e.p;
      cur.outcome = e.p.outcome === 'clear' ? 'clear' : 'quit';
      if (e.p.outcome === 'clear') {
        if (boss === undefined) cur.cleared = true;
        else if (!cur.cleared) cur.anomaly = true;
      }
      close();
    }
  }
  close();
  for (const pl of players.values()) {
    const secs: Record<string, number> = {};
    for (const r of pl.runs) secs[r.device] = (secs[r.device] ?? 0) + Math.max(r.runSec, 1e-6);
    pl.device = primaryDevice(secs, pl.runs[0]?.device);
  }
  return { players: [...players.values()], anomalies };
}

/** Số liệu cuối của lượt: lấy max của thuộc tính cuối và số đếm từ sự kiện (sự kiện có thể mất). */
function finishRun(r: Run): void {
  const f = r.final;
  let lastT = 0;
  let kills = 0;
  let pits = 0;
  for (const e of r.events) {
    lastT = Math.max(lastT, num(e.p.tRun));
    if (e.e === 'death') {
      if (e.p.kind === 'pit') pits += 1;
      else kills += 1;
    }
  }
  r.runSec = Math.max(num(f?.runSec), lastT);
  r.kills = Math.max(num(f?.deaths), kills);
  r.deaths = r.kills + Math.max(num(f?.pits), pits);
  r.device = primaryDevice(f?.deviceSec, r.start.device);
  if (num(f?.gameSpeedMin, 1) < 1) r.slowed = true;
  if (typeof f?.furthest === 'string') r.furthest = f.furthest;
}

// ───────────────────────── Thống kê ─────────────────────────

/** Khoảng tin cậy 95% Wilson cho tỷ lệ `p` trên `n` (GDD 13 mục 6.5), cắt về [0; 1]. */
export function wilson(p: number, n: number, z = 1.96): [number, number] {
  if (n <= 0) return [0, 1];
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

export function median(xs: readonly number[]): number {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

/** Ngày `YYYY-MM-DD` cộng `k` ngày theo lịch. */
export function addDays(day: string, k: number): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d) + k * 86_400_000).toISOString().slice(0, 10);
}

/** Mốc 00:00 của ngày `day` ở múi giờ `tzMin` (phút lệch UTC, dương ở phía đông), ms. */
export function dayStartMs(day: string, tzMin: number): number {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d) - tzMin * 60_000;
}
