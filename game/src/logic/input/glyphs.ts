import type { Action, InputDevice } from './actions';
import {
  gamepadButtonLabel,
  type GamepadBindings,
  keyLabel,
  type KeyboardBindings,
} from './bindings';

/** Mã biểu tượng trong lời thoại hướng dẫn (07-Kich-ban-huong-dan.md mục 8.1). */
export const GLYPH_TOKENS = {
  DI_CHUYỂN: ['left', 'right'],
  NHẢY: ['jump'],
  BẮN: ['shoot'],
  LƯỚT: ['dash'],
  ĐỔI_VK: ['swapPrev', 'swapNext'],
  TẠM_DỪNG: ['pause'],
  TƯƠNG_TÁC: ['interact'],
} as const satisfies Record<string, readonly Action[]>;
export type GlyphToken = keyof typeof GLYPH_TOKENS;

const TOUCH_NAMES: Readonly<Record<GlyphToken, string>> = {
  DI_CHUYỂN: 'cần ảo',
  NHẢY: 'nút Nhảy',
  BẮN: 'nút Bắn',
  LƯỚT: 'nút Lướt',
  ĐỔI_VK: 'nút đổi vũ khí',
  TẠM_DỪNG: 'nút II',
  TƯƠNG_TÁC: 'chạm vào khu',
};

export interface GlyphContext {
  device: InputDevice;
  keyboard: KeyboardBindings;
  gamepad: GamepadBindings;
}

export function glyph(token: GlyphToken, ctx: GlyphContext): string {
  const actions = GLYPH_TOKENS[token];
  if (ctx.device === 'touch') return TOUCH_NAMES[token];
  if (ctx.device === 'gamepad') {
    if (token === 'DI_CHUYỂN') return 'cần trái';
    return actions
      .map((a) => ctx.gamepad[a][0])
      .filter((i): i is number => i !== undefined)
      .map(gamepadButtonLabel)
      .join(' / ');
  }
  if (token === 'DI_CHUYỂN') {
    const first = actions.map((a) => ctx.keyboard[a][0]).filter((c): c is string => !!c);
    const second = actions.map((a) => ctx.keyboard[a][1]).filter((c): c is string => !!c);
    const pair = (codes: string[]) => codes.map(keyLabel).join('/');
    return second.length === 2 ? `${pair(first)} hoặc ${pair(second)}` : pair(first);
  }
  return actions
    .map((a) => ctx.keyboard[a][0])
    .filter((c): c is string => c !== undefined)
    .map(keyLabel)
    .join(' / ');
}

/** Thay mọi {MÃ} trong câu thoại bằng tên phím/nút của thiết bị đang dùng. Mã lạ giữ nguyên. */
export function formatGlyphs(text: string, ctx: GlyphContext): string {
  return text.replace(
    /\{([A-ZĐÂĂÊÔƠƯÁÀẢÃẠẮẰẲẴẶẤẦẨẪẬÉÈẺẼẸẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌỐỒỔỖỘỚỜỞỠỢÚÙỦŨỤỨỪỬỮỰÝỲỶỸỴ_]+)\}/g,
    (match, token: string) => (token in GLYPH_TOKENS ? glyph(token as GlyphToken, ctx) : match),
  );
}
