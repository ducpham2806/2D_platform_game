import { describe, expect, it } from 'vitest';
import { parseGameConfig } from '@/core/game-config';
import { LANGS, parseStrings, placeholders, STRING_KEYS } from '@/core/strings-config';
import { Strings } from '@/logic/i18n';
import { GLYPH_TOKENS } from '@/logic/input/glyphs';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);
type Raw = { defaultLang: string; vi: Record<string, unknown>; en: Record<string, unknown> };
const raw = (): Raw => structuredClone(data.strings) as Raw;

describe('bảng chuỗi', () => {
  it('mọi ngôn ngữ có đủ mọi khóa, không rỗng', () => {
    for (const lang of LANGS)
      for (const key of STRING_KEYS)
        expect(config.strings.tables[lang][key].length, `${lang} ${key}`).toBeGreaterThan(0);
  });

  it('chỗ điền viết hoa đều là biểu tượng nút có thật', () => {
    for (const lang of LANGS)
      for (const key of STRING_KEYS)
        for (const name of placeholders(config.strings.tables[lang][key]))
          if (name !== name.toLowerCase())
            expect(Object.keys(GLYPH_TOKENS), `${lang} ${key} {${name}}`).toContain(name);
  });

  it('báo lỗi: thiếu khóa, khóa lạ, lệch chỗ điền giữa các ngôn ngữ, ngôn ngữ mặc định sai', () => {
    const bad = (patch: (r: Raw) => void, re: RegExp) => {
      const r = raw();
      patch(r);
      expect(() => parseStrings(r)).toThrow(re);
    };
    bad((r) => delete r.en['pause.title'], /strings\.en\["pause\.title"\]/);
    bad((r) => (r.vi['pause.moi'] = 'x'), /khóa lạ/);
    bad((r) => (r.en['hud.healed'] = '+{amount} HP'), /chỗ điền/);
    bad((r) => (r.en['hud.swapHint'] = 'Q/E to switch weapons'), /chỗ điền/);
    bad((r) => (r.defaultLang = 'fr'), /defaultLang/);
  });
});

describe('Strings.t', () => {
  const vi = new Strings(config.strings, 'vi');
  const en = new Strings(config.strings, 'en');

  it('điền tham số, giữ nguyên biểu tượng nút', () => {
    expect(vi.t('hud.healed', { n: 12 })).toBe('+12 máu');
    expect(en.t('hud.healed', { n: 12 })).toBe('+12 HP');
    expect(vi.t('result.secrets', { found: 2, total: 3 })).toBe('Bí mật 2/3');
    expect(vi.t('result.tryWeapon', { name: 'Vine Lash' })).toBe(
      'Chưa thử Vine Lash? Trong màn, {ĐỔI_VK} để đổi vũ khí.',
    );
    expect(en.t('hud.swapHint')).toContain('{ĐỔI_VK}');
  });

  it('thiếu tham số thì để nguyên chỗ điền (dễ thấy khi chạy thử)', () => {
    expect(vi.t('hud.healed')).toBe('+{n} máu');
    expect(vi.t('hud.healed', {})).toBe('+{n} máu');
  });
});
