/**
 * Thông tin thiết bị cho `session_start` (logic thuần, ST-13-02b; GDD 13 mục 3, 4). Chỉ giữ nhóm
 * thô (nền tảng, trình duyệt) suy ra từ userAgent; **không** ghi userAgent đầy đủ, tên tay cầm hay
 * thông tin có thể dùng nhận dạng máy.
 */
import type { Props } from './schema';

export type Platform = 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other';
export type Browser = 'chrome' | 'safari' | 'firefox' | 'edge' | 'samsung' | 'other';

export function detectPlatform(ua: string, maxTouchPoints = 0): Platform {
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  // iPadOS 13+ tự nhận là Macintosh; phân biệt bằng màn cảm ứng.
  if (/Macintosh/i.test(ua)) return maxTouchPoints > 1 ? 'ios' : 'mac';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Linux|CrOS/i.test(ua)) return 'linux';
  return 'other';
}

export function detectBrowser(ua: string): Browser {
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/Edg\//i.test(ua)) return 'edge';
  if (/Firefox|FxiOS/i.test(ua)) return 'firefox';
  if (/Chrome|CriOS|Chromium/i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua)) return 'safari';
  return 'other';
}

/** Hai chữ cái đầu của ngôn ngữ trình duyệt ("vi-VN" → "vi"), lạ thì `other`. */
export function langCode(lang: string | undefined): string {
  const code = (lang ?? '').slice(0, 2).toLowerCase();
  return /^[a-z]{2}$/.test(code) ? code : 'other';
}

/** Ngày theo giờ máy, `YYYY-MM-DD`. */
export function localDay(date: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export interface DeviceInfo {
  userAgent: string;
  maxTouchPoints: number;
  language: string | undefined;
  /** px CSS. */
  width: number;
  height: number;
  devicePixelRatio: number;
  /** Hệ số phóng nguyên hiện tại của canvas. */
  zoom: number;
  standalone: boolean;
  now: Date;
  staff: boolean;
}

/** Thuộc tính `session_start` (làm tròn màn hình theo `screenPx`, dpr theo `dprStep`). */
export function sessionStartProps(d: DeviceInfo, screenPx: number, dprStep: number): Props {
  const r = (v: number, step: number): number => Math.round(v / step) * step;
  return {
    day: localDay(d.now),
    tzMin: -d.now.getTimezoneOffset(),
    platform: detectPlatform(d.userAgent, d.maxTouchPoints),
    browser: detectBrowser(d.userAgent),
    pwa: d.standalone,
    screen: `${r(d.width, screenPx)}x${r(d.height, screenPx)}`,
    dpr: r(d.devicePixelRatio, dprStep),
    scaleK: Math.max(0, Math.round(d.zoom)),
    touchCapable: d.maxTouchPoints > 0,
    lang: langCode(d.language),
    staff: d.staff,
  };
}
