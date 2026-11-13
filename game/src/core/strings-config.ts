import { ConfigError, obj, str } from './json-check';
import { DIALOGUE_LANGS, type DialogueLang } from './dialogue-config';

/**
 * Kiểm tra 03-Data/strings.json: bảng chuỗi giao diện theo ngôn ngữ. Logic thuần.
 * Thêm chuỗi mới: thêm khóa vào STRING_KEYS và vào mọi ngôn ngữ trong file dữ liệu.
 */

export const STRING_KEYS = [
  'hud.resumeCheckpoint',
  'hud.controlsHint',
  'hud.bossDefeated',
  'hud.weaponGranted',
  'hud.swapHint',
  'hud.weaponEmpty',
  'hud.healed',
  'hud.checkpoint',
  'hud.checkpointSaved',
  'hud.roomLocked',
  'hud.roomCleared',
  'hud.secretFound',
  'hud.bossPhase',
  'hud.roomRemaining',
  'hud.weapon',
  'hud.weaponSwap',
  'difficulty.normal',
  'dialogue.next',
  'dialogue.skip',
  'pause.title',
  'pause.resume',
  'pause.quickModule',
  'pause.options',
  'pause.quit',
  'pause.quitConfirm',
  'pause.tutorialOff',
  'pause.tutorialOn',
  'pause.soundOff',
  'pause.soundOn',
  'result.title',
  'result.section',
  'result.time',
  'result.deaths',
  'result.exp',
  'result.coreBit',
  'result.levelUp',
  'result.level',
  'result.rewards',
  'result.newWeapon',
  'result.secrets',
  'result.leveledUp',
  'result.nothingNew',
  'result.tryWeapon',
  'result.continue',
  'result.replay',
  'result.workshop',
] as const;
export type StringKey = (typeof STRING_KEYS)[number];

/** Ngôn ngữ của game (dùng chung với thoại). */
export const LANGS = DIALOGUE_LANGS;
export type Lang = DialogueLang;

export interface StringsData {
  defaultLang: Lang;
  tables: Record<Lang, Record<StringKey, string>>;
}

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** Các chỗ điền trong một chuỗi: {tham_số} và {BIỂU_TƯỢNG_NÚT}, xếp theo tên. */
export function placeholders(text: string): string[] {
  return [...text.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1] ?? '').sort();
}

export function parseStrings(value: unknown): StringsData {
  const s = obj(value, 'strings');
  const defaultLang = str(s.defaultLang, 'strings.defaultLang');
  if (!isLang(defaultLang))
    throw new ConfigError(`strings.defaultLang: "${defaultLang}" không có (${LANGS.join(', ')})`);
  const tables = {} as Record<Lang, Record<StringKey, string>>;
  for (const lang of LANGS) {
    const raw = obj(s[lang], `strings.${lang}`);
    const unknown = Object.keys(raw).filter((k) => !(STRING_KEYS as readonly string[]).includes(k));
    if (unknown.length > 0)
      throw new ConfigError(
        `strings.${lang}: khóa lạ (chưa có trong STRING_KEYS): ${unknown.join(', ')}`,
      );
    const table = {} as Record<StringKey, string>;
    for (const key of STRING_KEYS) table[key] = str(raw[key], `strings.${lang}["${key}"]`);
    tables[lang] = table;
  }
  // Mọi ngôn ngữ phải có cùng chỗ điền với ngôn ngữ mặc định, không thì giá trị hoặc nút bị mất.
  const base = tables[defaultLang];
  for (const lang of LANGS) {
    for (const key of STRING_KEYS) {
      const want = placeholders(base[key]).join(',');
      const got = placeholders(tables[lang][key]).join(',');
      if (want !== got)
        throw new ConfigError(
          `strings.${lang}["${key}"]: chỗ điền {${got}} khác bản ${defaultLang} {${want}}`,
        );
    }
  }
  return { defaultLang, tables };
}
