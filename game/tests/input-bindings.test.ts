import { describe, expect, it } from 'vitest';
import { parseControls } from '@/core/controls-config';
import {
  actionsFor,
  gamepadButtonLabel,
  keyLabel,
  missingRequired,
  parseKeyboardBindings,
  remap,
} from '@/logic/input/bindings';
import { loadData } from './helpers';

const controls = () => parseControls(loadData().controls);

describe('phím mặc định (GDD mục 5.2)', () => {
  it('khớp bảng điều khiển', () => {
    const { keyboard, gamepad } = controls();
    expect(keyboard.jump).toEqual(['KeyK']);
    expect(keyboard.shoot).toEqual(['KeyJ']);
    expect(keyboard.dash).toEqual(['KeyL']);
    expect(keyboard.swapPrev).toEqual(['KeyQ']);
    expect(keyboard.swapNext).toEqual(['KeyE']);
    expect(keyboard.left).toEqual(['KeyA', 'ArrowLeft']);
    expect(gamepad.buttons.jump).toEqual([0]);
    expect(gamepad.buttons.shoot).toEqual([2]);
    expect(gamepad.buttons.dash).toEqual([1]);
  });

  it('một phím có thể kích nhiều hành động được phép dùng chung (W: lên + tương tác)', () => {
    const { keyboard } = controls();
    expect(actionsFor(keyboard, 'KeyW').sort()).toEqual(['interact', 'up']);
    expect(actionsFor(keyboard, 'KeyE')).toEqual(['swapNext']);
  });
});

describe('remap', () => {
  it('gán phím mới làm phím chính, giữ phím phụ', () => {
    const { keyboard } = controls();
    const next = remap(keyboard, 'left', 'KeyZ');
    expect(next.left).toEqual(['KeyZ', 'KeyA']);
  });

  it('hoán đổi khi phím đang thuộc hành động khác, để không hành động nào trống', () => {
    const { keyboard } = controls();
    const next = remap(keyboard, 'jump', 'KeyJ'); // J đang là Bắn
    expect(next.jump[0]).toBe('KeyJ');
    expect(next.shoot).toEqual(['KeyK']);
    expect(missingRequired(next)).toEqual([]);
  });

  it('không lấy mất phím của cặp được dùng chung', () => {
    const { keyboard } = controls();
    const next = remap(keyboard, 'interact', 'KeyW');
    expect(next.up).toContain('KeyW');
  });

  it('không sửa bản gốc', () => {
    const { keyboard } = controls();
    const before = JSON.stringify(keyboard);
    remap(keyboard, 'dash', 'Space');
    expect(JSON.stringify(keyboard)).toBe(before);
  });

  it('chỉ giữ tối đa 2 phím mỗi hành động', () => {
    const { keyboard } = controls();
    let next = remap(keyboard, 'left', 'KeyZ');
    next = remap(next, 'left', 'KeyX');
    expect(next.left).toEqual(['KeyX', 'KeyZ']);
  });
});

describe('kiểm tra dữ liệu điều khiển', () => {
  it('báo hành động lạ', () => {
    expect(() => parseKeyboardBindings({ fly: ['KeyF'] })).toThrow(/fly: hành động không tồn tại/);
  });

  it('báo nút cảm ứng nhỏ hơn 48 dp', () => {
    const raw = structuredClone(loadData().controls) as {
      touch: { buttons: { sizeDp: number }[] };
    };
    raw.touch.buttons[0]!.sizeDp = 40;
    expect(() => parseControls(raw)).toThrow(/sizeDp/);
  });

  it('báo thiếu phím cho hành động bắt buộc', () => {
    const raw = structuredClone(loadData().controls) as { keyboard: Record<string, string[]> };
    raw.keyboard.jump = [];
    expect(() => parseControls(raw)).toThrow(/thiếu phím cho jump/);
  });
});

describe('tên phím và nút', () => {
  it('đổi mã phím thành tên dễ đọc', () => {
    expect(keyLabel('KeyK')).toBe('K');
    expect(keyLabel('ArrowLeft')).toBe('←');
    expect(keyLabel('Escape')).toBe('Esc');
    expect(keyLabel('Digit3')).toBe('3');
    expect(keyLabel('F13')).toBe('F13');
  });

  it('đổi chỉ số nút tay cầm thành tên', () => {
    expect(gamepadButtonLabel(0)).toBe('A');
    expect(gamepadButtonLabel(4)).toBe('LB');
    expect(gamepadButtonLabel(9)).toBe('Start');
    expect(gamepadButtonLabel(20)).toBe('Nút 20');
  });
});
