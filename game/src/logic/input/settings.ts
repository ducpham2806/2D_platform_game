/**
 * Cài đặt điều khiển của người chơi: phím đã đổi, nút tay cầm, bố cục cảm ứng.
 * Lưu dạng JSON qua một KeyValueStore (localStorage trên trình duyệt, bộ nhớ khi test).
 * Dữ liệu lưu hỏng từng phần thì phần đó quay về mặc định, phần còn lại giữ nguyên.
 */
import { ACTIONS, type Action } from './actions';
import {
  actionsFor,
  type GamepadBindings,
  type KeyboardBindings,
  missingRequired,
  parseGamepadBindings,
  parseKeyboardBindings,
} from './bindings';
import type { SizePreset, StickMode, TouchConfig, TouchSettings } from './touch-layout';

export const CONTROL_SETTINGS_KEY = 'cv.controls';
export const CONTROL_SETTINGS_VERSION = 1;

export interface ControlSettings {
  version: number;
  keyboard: KeyboardBindings;
  gamepad: GamepadBindings;
  touch: TouchSettings;
}

export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export class MemoryStore implements KeyValueStore {
  private readonly data = new Map<string, string>();
  get(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  set(key: string, value: string): void {
    this.data.set(key, value);
  }
}

export interface ControlDefaults {
  keyboard: KeyboardBindings;
  gamepad: GamepadBindings;
  touch: TouchConfig;
}

function copyBindings<T>(b: Record<Action, T[]>): Record<Action, T[]> {
  return Object.fromEntries(ACTIONS.map((a) => [a, [...b[a]]])) as Record<Action, T[]>;
}

export function defaultTouchSettings(touch: TouchConfig): TouchSettings {
  return {
    sizePreset: touch.defaultSizePreset,
    opacity: touch.defaultOpacity,
    leftHanded: false,
    vibration: true,
    autoFire: false,
    aimAssist: false,
    stickMode: 'floating',
    offsets: {},
  };
}

export function defaultControlSettings(defaults: ControlDefaults): ControlSettings {
  return {
    version: CONTROL_SETTINGS_VERSION,
    keyboard: copyBindings(defaults.keyboard),
    gamepad: copyBindings(defaults.gamepad),
    touch: defaultTouchSettings(defaults.touch),
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pick<T>(value: unknown, ok: (v: unknown) => v is T, fallback: T): T {
  return ok(value) ? value : fallback;
}

const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function parseTouch(value: unknown, touch: TouchConfig): TouchSettings {
  const fallback = defaultTouchSettings(touch);
  if (!isRecord(value)) return fallback;
  const [minOpacity, maxOpacity] = touch.opacityRange;
  const ids = new Set(touch.buttons.map((b) => b.id));
  const offsets: TouchSettings['offsets'] = {};
  if (isRecord(value.offsets)) {
    for (const [id, o] of Object.entries(value.offsets)) {
      if (!ids.has(id) || !isRecord(o)) continue;
      if (typeof o.x === 'number' && typeof o.y === 'number' && o.x >= 0 && o.y >= 0) {
        offsets[id] = { x: o.x, y: o.y };
      }
    }
  }
  return {
    sizePreset: pick(
      value.sizePreset,
      (v): v is SizePreset => v === 'small' || v === 'medium' || v === 'large',
      fallback.sizePreset,
    ),
    opacity: pick(
      value.opacity,
      (v): v is number => typeof v === 'number' && v >= minOpacity && v <= maxOpacity,
      fallback.opacity,
    ),
    leftHanded: pick(value.leftHanded, isBool, fallback.leftHanded),
    vibration: pick(value.vibration, isBool, fallback.vibration),
    autoFire: pick(value.autoFire, isBool, fallback.autoFire),
    aimAssist: pick(value.aimAssist, isBool, fallback.aimAssist),
    stickMode: pick(
      value.stickMode,
      (v): v is StickMode => v === 'floating' || v === 'fixed',
      fallback.stickMode,
    ),
    offsets,
  };
}

function parseOr<T>(
  raw: unknown,
  parse: (value: unknown) => Record<Action, T[]>,
  fallback: Record<Action, T[]>,
): Record<Action, T[]> {
  try {
    const parsed = parse(raw);
    // Bản lưu cũ chưa có Nano Cell. Giữ phím cũ nếu người chơi đã gán H/RT cho việc khác.
    if (isRecord(raw) && raw.heal === undefined)
      parsed.heal = fallback.heal.filter((button) => actionsFor(parsed, button).length === 0);
    return missingRequired(parsed).length === 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function parseControlSettings(raw: unknown, defaults: ControlDefaults): ControlSettings {
  const base = defaultControlSettings(defaults);
  if (!isRecord(raw) || raw.version !== CONTROL_SETTINGS_VERSION) return base;
  return {
    version: CONTROL_SETTINGS_VERSION,
    keyboard: parseOr(raw.keyboard, parseKeyboardBindings, base.keyboard),
    gamepad: parseOr(raw.gamepad, parseGamepadBindings, base.gamepad),
    touch: parseTouch(raw.touch, defaults.touch),
  };
}

export function loadControlSettings(
  store: KeyValueStore,
  defaults: ControlDefaults,
): ControlSettings {
  const text = store.get(CONTROL_SETTINGS_KEY);
  if (text === null) return defaultControlSettings(defaults);
  try {
    return parseControlSettings(JSON.parse(text), defaults);
  } catch {
    return defaultControlSettings(defaults);
  }
}

export function saveControlSettings(store: KeyValueStore, settings: ControlSettings): void {
  store.set(CONTROL_SETTINGS_KEY, JSON.stringify(settings));
}
