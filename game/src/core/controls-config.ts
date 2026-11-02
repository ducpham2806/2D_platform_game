/** Kiểm tra 03-Data/controls.json (logic thuần). */
import { isAction } from '../logic/input/actions';
import {
  type GamepadBindings,
  type KeyboardBindings,
  missingRequired,
  parseGamepadBindings,
  parseKeyboardBindings,
} from '../logic/input/bindings';
import type {
  Anchor,
  SizePreset,
  TouchButtonConfig,
  TouchConfig,
} from '../logic/input/touch-layout';

export interface ControlsConfig {
  keyboard: KeyboardBindings;
  gamepad: { buttons: GamepadBindings; stickDeadzone: number };
  touch: TouchConfig;
}

export class ControlsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ControlsConfigError';
  }
}

type Json = Record<string, unknown>;

function obj(value: unknown, path: string): Json {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ControlsConfigError(`${path}: cần một object`);
  }
  return value as Json;
}

function num(value: unknown, path: string, min = Number.NEGATIVE_INFINITY, max = Infinity): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new ControlsConfigError(`${path}: cần số trong [${min}, ${max}]`);
  }
  return value;
}

const ANCHORS: readonly Anchor[] = ['bottom-right', 'top-right', 'bottom-left', 'top-left'];
const PRESETS: readonly SizePreset[] = ['small', 'medium', 'large'];

function parseButton(value: unknown, i: number, minDp: number): TouchButtonConfig {
  const p = `controls.touch.buttons[${i}]`;
  const b = obj(value, p);
  if (typeof b.id !== 'string' || b.id.length === 0)
    throw new ControlsConfigError(`${p}.id: cần chuỗi`);
  if (typeof b.action !== 'string' || !isAction(b.action)) {
    throw new ControlsConfigError(`${p}.action: hành động không tồn tại`);
  }
  if (typeof b.label !== 'string') throw new ControlsConfigError(`${p}.label: cần chuỗi`);
  if (typeof b.anchor !== 'string' || !ANCHORS.includes(b.anchor as Anchor)) {
    throw new ControlsConfigError(`${p}.anchor: phải là một trong ${ANCHORS.join(', ')}`);
  }
  return {
    id: b.id,
    action: b.action,
    label: b.label,
    anchor: b.anchor as Anchor,
    x: num(b.x, `${p}.x`, 0),
    y: num(b.y, `${p}.y`, 0),
    // GDD mục 5.2: vùng bấm tối thiểu 48 dp, không có ngoại lệ.
    sizeDp: num(b.sizeDp, `${p}.sizeDp`, minDp),
  };
}

export function parseControls(value: unknown): ControlsConfig {
  const c = obj(value, 'controls');
  const keyboard = parseKeyboardBindings(c.keyboard, 'controls.keyboard');
  const gamepad = obj(c.gamepad, 'controls.gamepad');
  const buttons = parseGamepadBindings(gamepad.buttons, 'controls.gamepad.buttons');
  const missingKeys = missingRequired(keyboard);
  if (missingKeys.length > 0) {
    throw new ControlsConfigError(`controls.keyboard: thiếu phím cho ${missingKeys.join(', ')}`);
  }

  const t = obj(c.touch, 'controls.touch');
  const minButtonDp = num(t.minButtonDp, 'controls.touch.minButtonDp', 48);
  const presetsRaw = obj(t.sizePresets, 'controls.touch.sizePresets');
  const sizePresets = Object.fromEntries(
    PRESETS.map((k) => [k, num(presetsRaw[k], `controls.touch.sizePresets.${k}`, 0.5, 2)]),
  ) as Record<SizePreset, number>;
  if (
    typeof t.defaultSizePreset !== 'string' ||
    !PRESETS.includes(t.defaultSizePreset as SizePreset)
  ) {
    throw new ControlsConfigError('controls.touch.defaultSizePreset: không hợp lệ');
  }
  const range = t.opacityRange;
  if (!Array.isArray(range) || range.length !== 2) {
    throw new ControlsConfigError('controls.touch.opacityRange: cần [min, max]');
  }
  const opacityRange: [number, number] = [
    num(range[0], 'controls.touch.opacityRange[0]', 0, 1),
    num(range[1], 'controls.touch.opacityRange[1]', 0, 1),
  ];
  const stick = obj(t.stick, 'controls.touch.stick');
  const fixed = obj(stick.fixedCenter, 'controls.touch.stick.fixedCenter');
  if (!Array.isArray(t.buttons)) throw new ControlsConfigError('controls.touch.buttons: cần mảng');
  const touchButtons = t.buttons.map((b, i) => parseButton(b, i, minButtonDp));
  const ids = new Set<string>();
  for (const b of touchButtons) {
    if (ids.has(b.id)) throw new ControlsConfigError(`controls.touch.buttons: trùng id ${b.id}`);
    ids.add(b.id);
  }
  for (const action of ['jump', 'shoot', 'dash', 'pause'] as const) {
    if (!touchButtons.some((b) => b.action === action)) {
      throw new ControlsConfigError(`controls.touch.buttons: thiếu nút cho ${action}`);
    }
  }

  return {
    keyboard,
    gamepad: {
      buttons,
      stickDeadzone: num(gamepad.stickDeadzone, 'controls.gamepad.stickDeadzone', 0, 0.9),
    },
    touch: {
      minButtonDp,
      sizePresets,
      defaultSizePreset: t.defaultSizePreset as SizePreset,
      defaultOpacity: num(
        t.defaultOpacity,
        'controls.touch.defaultOpacity',
        opacityRange[0],
        opacityRange[1],
      ),
      opacityRange,
      stick: {
        radiusDp: num(stick.radiusDp, 'controls.touch.stick.radiusDp', 24),
        deadzone: num(stick.deadzone, 'controls.touch.stick.deadzone', 0, 0.9),
        zoneWidthFraction: num(
          stick.zoneWidthFraction,
          'controls.touch.stick.zoneWidthFraction',
          0.1,
          0.9,
        ),
        zoneTopFraction: num(stick.zoneTopFraction, 'controls.touch.stick.zoneTopFraction', 0, 0.9),
        fixedCenter: {
          left: num(fixed.left, 'controls.touch.stick.fixedCenter.left', 0),
          bottom: num(fixed.bottom, 'controls.touch.stick.fixedCenter.bottom', 0),
        },
      },
      buttons: touchButtons,
    },
  };
}
