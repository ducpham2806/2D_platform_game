import type { InputDevice } from '../input/actions';
import type { KeyValueStore } from '../input/settings';
import { primaryDevice, type PlaytestSession } from './recorder';

export const PLAYTEST_KEY = 'cv.playtest';
/** Giữ tối đa chừng này phiên gần nhất trên máy (đủ cho gộp nhật ký của nhiều người thử). */
export const PLAYTEST_MAX_SESSIONS = 200;
/** Phiên ngắn hơn chừng này giây (vào rồi thoát ngay) không tính. */
export const PLAYTEST_MIN_SEC = 10;

export interface DeviceSummary {
  device: InputDevice;
  sessions: number;
  minutes: number;
  deathsPerMinute: number;
  bossAttempts: number;
  bossWins: number;
  medianBossWinSec: number | undefined;
  /** Điểm trung bình (1–5) của các phiên có chấm điểm. */
  ratings: { jump: number; dash: number; shoot: number; count: number } | undefined;
}

export interface PlaytestSummary {
  sessions: number;
  byDevice: DeviceSummary[];
  /** Số lần chết theo đoạn, giảm dần. */
  deathsBySection: Array<{ section: string; deaths: number }>;
  /** Đoạn mà phiên chưa thắng boss dừng lại, giảm dần (tỷ lệ trên số phiên chưa thắng). */
  quitBySection: Array<{ section: string; share: number }>;
  /** Các dấu hiệu "hỏng" theo GDD 17 tính được từ nhật ký. */
  flags: string[];
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function summarize(all: readonly PlaytestSession[]): PlaytestSummary {
  const sessions = all.filter((s) => s.durationSec >= PLAYTEST_MIN_SEC);
  const byDevice: DeviceSummary[] = [];
  for (const device of ['keyboard', 'gamepad', 'touch'] as const) {
    const mine = sessions.filter((s) => primaryDevice(s) === device);
    if (mine.length === 0) continue;
    const minutes = mine.reduce((a, s) => a + s.durationSec, 0) / 60;
    const deaths = mine.reduce((a, s) => a + Object.values(s.deaths).reduce((x, y) => x + y, 0), 0);
    const rated = mine.filter((s) => s.ratings);
    byDevice.push({
      device,
      sessions: mine.length,
      minutes,
      deathsPerMinute: minutes > 0 ? deaths / minutes : 0,
      bossAttempts: mine.reduce((a, s) => a + s.bossAttempts, 0),
      bossWins: mine.reduce((a, s) => a + s.bossWins, 0),
      medianBossWinSec: median(mine.flatMap((s) => s.bossWinSec)),
      ratings:
        rated.length === 0
          ? undefined
          : {
              jump: rated.reduce((a, s) => a + (s.ratings?.jump ?? 0), 0) / rated.length,
              dash: rated.reduce((a, s) => a + (s.ratings?.dash ?? 0), 0) / rated.length,
              shoot: rated.reduce((a, s) => a + (s.ratings?.shoot ?? 0), 0) / rated.length,
              count: rated.length,
            },
    });
  }

  const deathMap = new Map<string, number>();
  for (const s of sessions)
    for (const [k, v] of Object.entries(s.deaths)) deathMap.set(k, (deathMap.get(k) ?? 0) + v);
  const deathsBySection = [...deathMap]
    .map(([section, deaths]) => ({ section, deaths }))
    .sort((a, b) => b.deaths - a.deaths);

  const unfinished = sessions.filter((s) => s.bossWins === 0);
  const quitMap = new Map<string, number>();
  for (const s of unfinished) quitMap.set(s.lastSection, (quitMap.get(s.lastSection) ?? 0) + 1);
  const quitBySection = [...quitMap]
    .map(([section, n]) => ({ section, share: n / Math.max(1, unfinished.length) }))
    .sort((a, b) => b.share - a.share);

  const flags: string[] = [];
  const worstQuit = quitBySection[0];
  if (worstQuit && unfinished.length >= 3 && worstQuit.share > 0.3) {
    flags.push(
      `${Math.round(worstQuit.share * 100)}% phiên chưa thắng dừng ở đoạn "${worstQuit.section}" (ngưỡng hỏng 30%)`,
    );
  }
  const touch = byDevice.find((d) => d.device === 'touch');
  const keyboard = byDevice.find((d) => d.device === 'keyboard');
  if (
    touch &&
    keyboard &&
    keyboard.deathsPerMinute > 0 &&
    touch.deathsPerMinute > keyboard.deathsPerMinute * 1.4
  ) {
    flags.push(
      `Cảm ứng chết ${touch.deathsPerMinute.toFixed(2)}/phút so với bàn phím ${keyboard.deathsPerMinute.toFixed(2)}/phút (lệch > 40%)`,
    );
  }
  for (const d of byDevice) {
    if (d.ratings && d.ratings.count >= 3) {
      for (const [k, label] of [
        ['jump', 'Nhảy'],
        ['dash', 'Lướt'],
        ['shoot', 'Bắn'],
      ] as const) {
        if (d.ratings[k] < 4)
          flags.push(`${label} trên ${d.device}: ${d.ratings[k].toFixed(1)}/5 (mục tiêu ≥ 4)`);
      }
    }
  }
  return { sessions: sessions.length, byDevice, deathsBySection, quitBySection, flags };
}

function isSession(value: unknown): value is PlaytestSession {
  const s = value as Partial<PlaytestSession> | null;
  return (
    typeof s === 'object' &&
    s !== null &&
    typeof s.id === 'string' &&
    typeof s.durationSec === 'number' &&
    typeof s.deaths === 'object' &&
    typeof s.deviceSec === 'object' &&
    typeof s.lastSection === 'string' &&
    typeof s.bossWins === 'number' &&
    Array.isArray(s.bossWinSec)
  );
}

export function loadSessions(store: KeyValueStore): PlaytestSession[] {
  try {
    const raw: unknown = JSON.parse(store.get(PLAYTEST_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter(isSession) : [];
  } catch {
    return [];
  }
}

/** Gói xuất nhật ký để người thử gửi lại (sao chép JSON). */
export interface PlaytestExport {
  version: 1;
  exportedAt: string;
  userAgent: string;
  sessions: PlaytestSession[];
}

export function makeExport(
  sessions: PlaytestSession[],
  now: Date,
  userAgent: string,
): PlaytestExport {
  return { version: 1, exportedAt: now.toISOString(), userAgent, sessions };
}

/**
 * Đọc chữ dán vào (một gói xuất, một mảng phiên, hoặc nhiều gói nối nhau trong một mảng).
 * Phiên sai dạng bị bỏ; trả về undefined nếu không đọc được JSON.
 */
export function parseExport(text: string): PlaytestSession[] | undefined {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return undefined;
  }
  const items = Array.isArray(raw) ? raw : [raw];
  const out: PlaytestSession[] = [];
  for (const item of items) {
    const sessions = (item as Partial<PlaytestExport> | null)?.sessions;
    if (Array.isArray(sessions)) out.push(...sessions.filter(isSession));
    else if (isSession(item)) out.push(item);
  }
  return out;
}

/** Gộp phiên của người khác vào máy này (trùng id thì giữ bản mới). Trả về số phiên mới thêm. */
export function mergeSessions(store: KeyValueStore, incoming: readonly PlaytestSession[]): number {
  const byId = new Map(loadSessions(store).map((s) => [s.id, s]));
  let added = 0;
  for (const s of incoming) {
    if (!byId.has(s.id)) added += 1;
    byId.set(s.id, s);
  }
  const all = [...byId.values()].sort((a, b) => a.startedAt - b.startedAt);
  store.set(PLAYTEST_KEY, JSON.stringify(all.slice(-PLAYTEST_MAX_SESSIONS)));
  return added;
}

/** Ghi (hoặc cập nhật theo id) một phiên, chỉ giữ PLAYTEST_MAX_SESSIONS phiên gần nhất. */
export function saveSession(store: KeyValueStore, session: PlaytestSession): void {
  const sessions = loadSessions(store).filter((s) => s.id !== session.id);
  sessions.push(session);
  store.set(PLAYTEST_KEY, JSON.stringify(sessions.slice(-PLAYTEST_MAX_SESSIONS)));
}

export function clearSessions(store: KeyValueStore): void {
  store.set(PLAYTEST_KEY, '[]');
}
