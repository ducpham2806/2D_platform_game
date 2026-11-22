import { describe, expect, it } from 'vitest';
import { parseControls } from '@/core/controls-config';
import { remap } from '@/logic/input/bindings';
import { formatGlyphs, glyph } from '@/logic/input/glyphs';
import {
  CONTROL_SETTINGS_KEY,
  defaultControlSettings,
  loadControlSettings,
  MemoryStore,
  parseControlSettings,
  saveControlSettings,
} from '@/logic/input/settings';
import { loadData } from './helpers';

const defaults = () => {
  const c = parseControls(loadData().controls);
  return { keyboard: c.keyboard, gamepad: c.gamepad.buttons, touch: c.touch };
};

describe('lưu cài đặt điều khiển', () => {
  it('chưa lưu gì thì dùng mặc định', () => {
    const settings = loadControlSettings(new MemoryStore(), defaults());
    expect(settings).toEqual(defaultControlSettings(defaults()));
  });

  it('lưu rồi đọc lại giữ nguyên', () => {
    const store = new MemoryStore();
    const base = defaultControlSettings(defaults());
    const changed = {
      ...base,
      keyboard: remap(base.keyboard, 'jump', 'Space'),
      touch: {
        ...base.touch,
        sizePreset: 'large' as const,
        leftHanded: true,
        offsets: { jump: { x: 80, y: 90 } },
      },
    };
    saveControlSettings(store, changed);
    expect(loadControlSettings(store, defaults())).toEqual(changed);
  });

  it('bản lưu cũ nhận H/RT nếu trống và giữ phím đã gán cho hành động khác', () => {
    const base = defaultControlSettings(defaults());
    const keyboard: Partial<typeof base.keyboard> = { ...base.keyboard, jump: ['KeyH'] };
    const gamepad: Partial<typeof base.gamepad> = { ...base.gamepad };
    delete keyboard.heal;
    delete gamepad.heal;
    const migrated = parseControlSettings({ ...base, keyboard, gamepad }, defaults());
    expect(migrated.keyboard.jump).toEqual(['KeyH']);
    expect(migrated.keyboard.heal).toEqual([]);
    expect(migrated.gamepad.heal).toEqual([7]);
    keyboard.jump = ['Space'];
    expect(parseControlSettings({ ...base, keyboard }, defaults()).keyboard.heal).toEqual(['KeyH']);
    keyboard.heal = ['KeyN'];
    expect(parseControlSettings({ ...base, keyboard }, defaults()).keyboard.heal).toEqual(['KeyN']);
  });

  it('JSON hỏng hoặc sai phiên bản thì quay về mặc định', () => {
    const store = new MemoryStore();
    store.set(CONTROL_SETTINGS_KEY, '{không phải json');
    expect(loadControlSettings(store, defaults())).toEqual(defaultControlSettings(defaults()));
    store.set(CONTROL_SETTINGS_KEY, JSON.stringify({ version: 99 }));
    expect(loadControlSettings(store, defaults())).toEqual(defaultControlSettings(defaults()));
  });

  it('hỏng từng phần thì chỉ phần đó về mặc định', () => {
    const store = new MemoryStore();
    const base = defaultControlSettings(defaults());
    store.set(
      CONTROL_SETTINGS_KEY,
      JSON.stringify({
        ...base,
        keyboard: { jump: 'không phải mảng' },
        touch: {
          ...base.touch,
          opacity: 7,
          sizePreset: 'khổng lồ',
          vibration: false,
          offsets: { lạ: { x: 1, y: 1 } },
        },
      }),
    );
    const loaded = loadControlSettings(store, defaults());
    expect(loaded.keyboard).toEqual(base.keyboard);
    expect(loaded.touch.opacity).toBe(base.touch.opacity);
    expect(loaded.touch.sizePreset).toBe('medium');
    expect(loaded.touch.vibration).toBe(false);
    expect(loaded.touch.offsets).toEqual({});
  });

  it('bỏ cấu hình lưu nếu làm mất phím của hành động bắt buộc', () => {
    const store = new MemoryStore();
    const base = defaultControlSettings(defaults());
    store.set(
      CONTROL_SETTINGS_KEY,
      JSON.stringify({ ...base, keyboard: { ...base.keyboard, jump: [] } }),
    );
    expect(loadControlSettings(store, defaults()).keyboard.jump).toEqual(['KeyK']);
  });
});

describe('biểu tượng nút trong lời thoại (07 mục 8.1)', () => {
  const ctx = (device: 'keyboard' | 'gamepad' | 'touch') => {
    const d = defaults();
    return { device, keyboard: d.keyboard, gamepad: d.gamepad };
  };

  it('đổi theo thiết bị', () => {
    expect(glyph('NHẢY', ctx('keyboard'))).toBe('K');
    expect(glyph('NHẢY', ctx('gamepad'))).toBe('A');
    expect(glyph('NHẢY', ctx('touch'))).toBe('nút Nhảy');
    expect(glyph('ĐỔI_VK', ctx('keyboard'))).toBe('Q / E');
    expect(glyph('ĐỔI_VK', ctx('gamepad'))).toBe('LB / RB');
    expect(glyph('DI_CHUYỂN', ctx('keyboard'))).toBe('A/D hoặc ←/→');
  });

  it('thay mã trong câu thoại, giữ nguyên mã lạ', () => {
    expect(formatGlyphs('Thử bật lên xem: {NHẢY}.', ctx('keyboard'))).toBe('Thử bật lên xem: K.');
    expect(formatGlyphs('Giữ {BẮN} rồi thả. {LẠ}', ctx('touch'))).toBe('Giữ nút Bắn rồi thả. {LẠ}');
  });

  it('hiện phím mới sau khi người chơi đổi phím', () => {
    const c = ctx('keyboard');
    expect(glyph('NHẢY', { ...c, keyboard: remap(c.keyboard, 'jump', 'Space') })).toBe('Space');
  });
});
