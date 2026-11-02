/** Hành động trừu tượng mà gameplay đọc; không module nào đọc phím hay nút trực tiếp. */
export const ACTIONS = [
  'left',
  'right',
  'up',
  'down',
  'jump',
  'shoot',
  'dash',
  'swapPrev',
  'swapNext',
  'pause',
  'interact',
] as const;
export type Action = (typeof ACTIONS)[number];

export type InputDevice = 'keyboard' | 'gamepad' | 'touch';

export function isAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}

/** Tên hiển thị tiếng Việt cho màn cài đặt. */
export const ACTION_LABELS: Readonly<Record<Action, string>> = {
  left: 'Sang trái',
  right: 'Sang phải',
  up: 'Lên',
  down: 'Xuống',
  jump: 'Nhảy',
  shoot: 'Bắn / nạp',
  dash: 'Lướt',
  swapPrev: 'Vũ khí trước',
  swapNext: 'Vũ khí sau',
  pause: 'Tạm dừng',
  interact: 'Tương tác',
};

/**
 * Trạng thái đầu vào của một bước logic (1/60 giây).
 * pressed/released là cạnh lên/xuống trong bước này; một lần chạm bấm rồi nhả trong
 * cùng một bước vẫn có pressed = true (không bị mất).
 */
export interface InputSnapshot {
  /** -1..1; ưu tiên cần analog nếu vượt vùng chết, nếu không thì từ nút trái/phải. */
  moveX: number;
  moveY: number;
  held: Readonly<Record<Action, boolean>>;
  pressed: Readonly<Record<Action, boolean>>;
  released: Readonly<Record<Action, boolean>>;
  /** Thiết bị dùng gần nhất, để đổi biểu tượng nút. */
  device: InputDevice;
}

export function emptyActionRecord(): Record<Action, boolean> {
  return Object.fromEntries(ACTIONS.map((a) => [a, false])) as Record<Action, boolean>;
}
