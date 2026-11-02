import { ACTIONS, type Action, isAction } from './actions';

export type KeyboardBindings = Record<Action, string[]>;
export type GamepadBindings = Record<Action, number[]>;

/** Các cặp hành động được phép dùng chung phím (W/↑ vừa là "lên" vừa là "tương tác"). */
const SHAREABLE: ReadonlyArray<readonly [Action, Action]> = [['up', 'interact']];

function canShare(a: Action, b: Action): boolean {
  return SHAREABLE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export class BindingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BindingError';
  }
}

function parseRecord<T>(
  value: unknown,
  path: string,
  item: (v: unknown, p: string) => T,
): Record<Action, T[]> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BindingError(`${path}: cần một object`);
  }
  const source = value as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    if (!isAction(key)) throw new BindingError(`${path}.${key}: hành động không tồn tại`);
  }
  const out = {} as Record<Action, T[]>;
  for (const action of ACTIONS) {
    const list = source[action];
    if (list === undefined) {
      out[action] = [];
      continue;
    }
    if (!Array.isArray(list)) throw new BindingError(`${path}.${action}: cần một mảng`);
    out[action] = list.map((v, i) => item(v, `${path}.${action}[${i}]`));
  }
  return out;
}

export function parseKeyboardBindings(value: unknown, path = 'keyboard'): KeyboardBindings {
  return parseRecord(value, path, (v, p) => {
    if (typeof v !== 'string' || v.length === 0) throw new BindingError(`${p}: cần mã phím`);
    return v;
  });
}

export function parseGamepadBindings(value: unknown, path = 'gamepad.buttons'): GamepadBindings {
  return parseRecord(value, path, (v, p) => {
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
      throw new BindingError(`${p}: cần chỉ số nút nguyên ≥ 0`);
    }
    return v;
  });
}

/** Mọi hành động gắn với một phím hoặc nút. */
export function actionsFor<T>(bindings: Record<Action, T[]>, input: T): Action[] {
  return ACTIONS.filter((action) => bindings[action].includes(input));
}

/**
 * Gán `input` làm phím chính của `action`. Hành động khác đang dùng phím đó sẽ mất phím
 * (trừ cặp được dùng chung); nếu hành động đó vì vậy không còn phím nào, nó nhận lại
 * phím chính cũ của `action` (hoán đổi), để không hành động nào bị bỏ trống.
 */
export function remap<T>(
  bindings: Record<Action, T[]>,
  action: Action,
  input: T,
): Record<Action, T[]> {
  const next = Object.fromEntries(ACTIONS.map((a) => [a, [...bindings[a]]])) as Record<Action, T[]>;
  const previousPrimary = next[action][0];
  for (const other of ACTIONS) {
    if (other === action || canShare(other, action)) continue;
    const list = next[other];
    if (!list.includes(input)) continue;
    next[other] = list.filter((x) => x !== input);
    if (next[other].length === 0 && previousPrimary !== undefined && previousPrimary !== input) {
      next[other] = [previousPrimary];
    }
  }
  next[action] = [input, ...next[action].filter((x) => x !== input)].slice(0, 2);
  return next;
}

/** Hành động gameplay bắt buộc phải có ít nhất một phím. */
export const REQUIRED_ACTIONS: readonly Action[] = [
  'left',
  'right',
  'jump',
  'shoot',
  'dash',
  'pause',
];

export function missingRequired<T>(bindings: Record<Action, T[]>): Action[] {
  return REQUIRED_ACTIONS.filter((a) => bindings[a].length === 0);
}

const KEY_NAMES: Readonly<Record<string, string>> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Escape: 'Esc',
  Space: 'Space',
  Enter: 'Enter',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift phải',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl phải',
  AltLeft: 'Alt',
  AltRight: 'Alt phải',
  Tab: 'Tab',
  Backspace: 'Backspace',
};

/** "KeyK" → "K", "Digit1" → "1", "ArrowLeft" → "←". */
export function keyLabel(code: string): string {
  const named = KEY_NAMES[code];
  if (named) return named;
  const key = /^Key([A-Z])$/.exec(code);
  if (key?.[1]) return key[1];
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (digit?.[1]) return digit[1];
  return code;
}

const PAD_NAMES = [
  'A',
  'B',
  'X',
  'Y',
  'LB',
  'RB',
  'LT',
  'RT',
  'Back',
  'Start',
  'L3',
  'R3',
  '↑',
  '↓',
  '←',
  '→',
];

/** Tên nút theo bố cục standard của Gamepad API (kiểu Xbox). */
export function gamepadButtonLabel(index: number): string {
  return PAD_NAMES[index] ?? `Nút ${index}`;
}
