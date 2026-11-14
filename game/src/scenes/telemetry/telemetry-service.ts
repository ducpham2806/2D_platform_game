/**
 * Dịch vụ đo lường gắn vào game (lớp nối, EP-13 ST-13-02b). Chỉ tạo khi bật cờ: hiện là
 * `?debug=1&telemetry=1` (chạy thử, ghi trong bộ nhớ, đọc qua `window.__cvTelemetry`); bản đợt thử
 * MVP bật bằng `?mvp=<mã đợt>` cùng kho và gửi ở ST-13-03, 04. Bản thường không tạo gì, không có
 * request nào. Lỗi trong đo lường bị nuốt: đo lường không được làm hỏng trò chơi (ADR-002 mục 4).
 */
import type Phaser from 'phaser';
import type { GameConfig } from '../../core/game-config';
import { currentLayout } from '../../core/phaser-scale';
import { telemetryCatalogs } from '../../core/telemetry-catalogs';
import { STAFF, TELEMETRY_DEBUG } from '../../debug/flags';
import { sessionStartProps } from '../../logic/telemetry/device';
import { Telemetry } from '../../logic/telemetry/logger';
import type { EventName, Props } from '../../logic/telemetry/schema';
import { makeSid } from '../../logic/telemetry/validate';

const KEY = 'cv.telemetry';

export interface TelemetryHandle {
  readonly tel: Telemetry;
  readonly config: GameConfig;
  /** Số lần vào từng màn trong phiên (`stage_start.run`; lưu qua phiên ở ST-13-03). */
  readonly runs: Map<string, number>;
  menuLogged: boolean;
  /** Ghi an toàn: lỗi trong đo lường không lan ra trò chơi. */
  log(name: EventName, props: Props): void;
}

/** Tạo dịch vụ (gọi một lần sau khi nạp cấu hình). Không bật cờ hoặc thiếu cấu hình: không làm gì. */
export function installTelemetry(game: Phaser.Game, config: GameConfig): void {
  if (!TELEMETRY_DEBUG || game.registry.get(KEY)) return;
  if (!config.telemetry) {
    console.warn(`Đo lường tắt: ${config.telemetryError ?? 'không có cấu hình'}`);
    return;
  }
  const tel = new Telemetry({
    config: config.telemetry,
    catalogs: telemetryCatalogs(config),
    sid: makeSid(Math.random),
    now: Date.now,
    strict: import.meta.env.DEV,
  });
  const handle: TelemetryHandle = {
    tel,
    config,
    runs: new Map(),
    menuLogged: false,
    log(name, props) {
      try {
        tel.log(name, props);
      } catch (e) {
        console.warn('Đo lường:', e);
      }
    },
  };
  game.registry.set(KEY, handle);
  (window as unknown as { __cvTelemetry?: Telemetry }).__cvTelemetry = tel;

  const t = config.telemetry;
  handle.log(
    'session_start',
    sessionStartProps(
      {
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints ?? 0,
        language: navigator.language,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        zoom: currentLayout().zoom,
        standalone: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
        now: new Date(),
        staff: STAFF,
      },
      t.round.screenPx,
      t.round.dpr,
    ),
  );
  const sceneKey = (): string | undefined =>
    game.scene.getScenes(true)[0]?.sys.settings.key.toLowerCase();
  window.addEventListener('error', (e) => {
    tel.clientError('error', sceneKey(), false, e.message || String(e.error ?? 'error'));
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r: unknown = e.reason;
    tel.clientError('rejection', sceneKey(), false, r instanceof Error ? r.message : String(r));
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) tel.flushErrorCounts();
  });
}

export function getTelemetry(scene: Phaser.Scene): TelemetryHandle | undefined {
  return scene.registry.get(KEY) as TelemetryHandle | undefined;
}

/** Menu vẽ xong lần đầu trong phiên: `boot_timing.msToMenu`. */
export function telemetryMenuReady(scene: Phaser.Scene): void {
  const h = getTelemetry(scene);
  if (!h || h.menuLogged) return;
  h.menuLogged = true;
  h.log('boot_timing', { msToMenu: Math.round(performance.now()) });
}
