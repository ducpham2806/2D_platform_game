/**
 * Kiểm tra 03-Data/dialogue_wardens.json (thoại trước/sau trận của Warden, sinh từ
 * 04-Dev-Plan/tools/dialogue/gen_warden_dialogue.py cùng 01-GDD/09-Thoai-Warden.md). Logic thuần.
 */
import { arr, ConfigError, num, obj, str } from './json-check';
import { LOCALES, type Locale } from './ui-config';

export interface DialogueVariant {
  id: string;
  /** Số boss đã hạ trước trận, từ `min` đến `max` (gồm cả hai đầu). */
  min: number;
  max: number;
}

export interface WardenDialogueData {
  /** Biến thể theo thứ tự số boss tăng dần; biến thể đầu là dự phòng khi thiếu câu. */
  variants: DialogueVariant[];
  /** Khóa chuỗi `boss.<id>.<biến thể>.<pre|post>` và `boss.<id>.nova_after`. */
  lines: Record<Locale, Record<string, string>>;
}

const KEY = /^boss\.([a-z0-9_]+)\.(?:([a-z]+)\.(pre|post)|nova_after)$/;

function int(v: unknown, path: string): number {
  const n = num(v, path, { min: 0 });
  if (!Number.isInteger(n)) throw new ConfigError(`${path}: cần số nguyên`);
  return n;
}

/** `maxChars`: độ dài tối đa mỗi câu theo ngôn ngữ (ui.json → dialogue.maxChars). */
export function parseWardenDialogue(
  value: unknown,
  maxChars: Readonly<Record<Locale, number>>,
): WardenDialogueData {
  const p = 'dialogue_wardens';
  const d = obj(value, p);
  const vb = obj(d.variantByBossesDefeated, `${p}.variantByBossesDefeated`);
  const variants = Object.entries(vb)
    .map(([id, range]): DialogueVariant => {
      const r = arr(range, `${p}.variantByBossesDefeated.${id}`);
      if (r.length !== 2)
        throw new ConfigError(`${p}.variantByBossesDefeated.${id}: cần [số đầu, số cuối]`);
      const min = int(r[0], `${p}.variantByBossesDefeated.${id}[0]`);
      const max = int(r[1], `${p}.variantByBossesDefeated.${id}[1]`);
      if (min > max)
        throw new ConfigError(`${p}.variantByBossesDefeated.${id}: số đầu lớn hơn số cuối`);
      return { id, min, max };
    })
    .sort((a, b) => a.min - b.min);
  if (variants.length === 0) throw new ConfigError(`${p}.variantByBossesDefeated: trống`);
  // Các khoảng nối liền từ 0, không chồng, không hở (mỗi số boss rơi vào đúng một biến thể).
  let next = 0;
  for (const v of variants) {
    if (v.min !== next)
      throw new ConfigError(
        `${p}.variantByBossesDefeated.${v.id}: phải bắt đầu từ ${next} (đang là ${v.min})`,
      );
    next = v.max + 1;
  }
  const variantIds = new Set(variants.map((v) => v.id));

  const lines = {} as Record<Locale, Record<string, string>>;
  for (const locale of LOCALES) {
    const table = obj(d[locale], `${p}.${locale}`);
    const out: Record<string, string> = {};
    for (const [key, text] of Object.entries(table)) {
      const kp = `${p}.${locale}["${key}"]`;
      const m = KEY.exec(key);
      if (!m) throw new ConfigError(`${kp}: khóa phải dạng boss.<id>.<biến thể>.<pre|post>`);
      if (m[2] !== undefined && !variantIds.has(m[2]))
        throw new ConfigError(`${kp}: biến thể "${m[2]}" không có trong variantByBossesDefeated`);
      const s = str(text, kp);
      if (s.length > maxChars[locale])
        throw new ConfigError(`${kp}: dài ${s.length} ký tự, tối đa ${maxChars[locale]}`);
      out[key] = s;
    }
    lines[locale] = out;
  }

  // Hai ngôn ngữ có cùng bộ khóa; mỗi Warden có câu trước/sau trận ở biến thể đầu và câu NOVA.
  const first = variants[0]?.id ?? '';
  for (const [a, b] of [
    ['vi', 'en'],
    ['en', 'vi'],
  ] as const) {
    for (const key of Object.keys(lines[a]))
      if (lines[b][key] === undefined)
        throw new ConfigError(`${p}.${b}: thiếu "${key}" (có ở ${a})`);
  }
  for (const id of wardenIds({ variants, lines })) {
    for (const key of [
      `boss.${id}.${first}.pre`,
      `boss.${id}.${first}.post`,
      `boss.${id}.nova_after`,
    ])
      if (lines.vi[key] === undefined) throw new ConfigError(`${p}.vi: thiếu "${key}"`);
  }
  return { variants, lines };
}

/** id các Warden có thoại. */
export function wardenIds(data: WardenDialogueData): Set<string> {
  const ids = new Set<string>();
  for (const key of Object.keys(data.lines.vi)) {
    const m = KEY.exec(key);
    if (m?.[1]) ids.add(m[1]);
  }
  return ids;
}
