import { arr, ConfigError, num, obj, str } from './json-check';

/**
 * Kiểm tra 03-Data/dialogue_wardens.json (thoại Warden trước/sau trận boss, GDD 3.3 và 3.6).
 * File do `04-Dev-Plan/tools/dialogue/gen_warden_dialogue.py` sinh ra. Logic thuần.
 */

export const DIALOGUE_LANGS = ['vi', 'en'] as const;
export type DialogueLang = (typeof DIALOGUE_LANGS)[number];

export interface DialogueRules {
  /** Tốc độ hiện chữ. */
  charsPerSec: number;
  /** Thời gian đọc tối thiểu tính cho mỗi câu khi kiểm tra `maxLockSec`. */
  minReadSec: number;
  /** Một đoạn thoại không khóa điều khiển lâu hơn mức này (GDD 3.6: 10 giây). */
  maxLockSec: number;
  /** Độ dài tối đa một câu (để vừa 3–4 dòng trong hộp). */
  maxLineChars: number;
  /** Chờ sau khi hạ boss rồi mới hiện thoại (để thấy boss gục). */
  postDelaySec: number;
  /** Thoại đầu trận chờ Kai chạm đất, tối đa bấy nhiêu giây. */
  groundWaitSec: number;
}

export interface DialogueVariant {
  id: string;
  /** Số boss đã hạ trước trận, từ `min` tới `max`. */
  min: number;
  max: number;
}

export interface DialogueData {
  rules: DialogueRules;
  /** Xếp theo `min` tăng dần; phủ kín 0 … (số boss − 1). */
  variants: DialogueVariant[];
  /** Biến thể dùng khi boss thiếu biến thể của mốc hiện tại (biến thể đầu tiên). */
  fallbackVariant: string;
  lines: Record<DialogueLang, Record<string, string>>;
}

export function bossLineKey(bossId: string, variant: string, part: 'pre' | 'post'): string {
  return `boss.${bossId}.${variant}.${part}`;
}

export function novaAfterKey(bossId: string): string {
  return `boss.${bossId}.nova_after`;
}

/** Thời gian một đoạn thoại khóa điều khiển nếu người chơi đọc bình thường. */
export function sequenceLockSec(texts: readonly string[], rules: DialogueRules): number {
  let sec = 0;
  for (const t of texts) sec += t.length / rules.charsPerSec + rules.minReadSec;
  return sec;
}

function parseRules(value: unknown): DialogueRules {
  const p = 'dialogue_wardens.rules';
  const r = obj(value, p);
  const positive = (key: keyof DialogueRules): number => {
    const v = num(r[key], `${p}.${key}`);
    if (v <= 0) throw new ConfigError(`${p}.${key}: phải > 0 (đang là ${v})`);
    return v;
  };
  return {
    charsPerSec: positive('charsPerSec'),
    minReadSec: num(r.minReadSec, `${p}.minReadSec`, { min: 0 }),
    maxLockSec: positive('maxLockSec'),
    maxLineChars: positive('maxLineChars'),
    postDelaySec: num(r.postDelaySec, `${p}.postDelaySec`, { min: 0 }),
    groundWaitSec: num(r.groundWaitSec, `${p}.groundWaitSec`, { min: 0 }),
  };
}

function parseVariants(value: unknown, bossCount: number): DialogueVariant[] {
  const p = 'dialogue_wardens.variantByBossesDefeated';
  const variants = Object.entries(obj(value, p)).map(([id, range]) => {
    const pair = arr(range, `${p}.${id}`);
    return {
      id,
      min: num(pair[0], `${p}.${id}[0]`, { min: 0 }),
      max: num(pair[1], `${p}.${id}[1]`, { min: 0 }),
    };
  });
  variants.sort((a, b) => a.min - b.min);
  if (variants.length === 0) throw new ConfigError(`${p}: cần ít nhất một biến thể`);
  // Mọi số boss đã hạ trước trận (0 … bossCount − 1) phải rơi vào đúng một biến thể.
  let next = 0;
  for (const v of variants) {
    if (v.min !== next || v.max < v.min)
      throw new ConfigError(
        `${p}.${v.id}: các khoảng phải nối liền nhau từ 0 (cần bắt đầu ở ${next})`,
      );
    next = v.max + 1;
  }
  if (next < bossCount)
    throw new ConfigError(`${p}: chưa phủ tới ${bossCount - 1} boss đã hạ (mới tới ${next - 1})`);
  return variants;
}

/**
 * @param bossIds boss của các màn trong stages.json: mỗi boss phải có thoại trước, sau trận
 *   và lời NOVA ở biến thể dự phòng, trong mọi ngôn ngữ.
 */
export function parseDialogue(value: unknown, bossIds: readonly string[]): DialogueData {
  const d = obj(value, 'dialogue_wardens');
  const rules = parseRules(d.rules);
  const variants = parseVariants(d.variantByBossesDefeated, bossIds.length);
  const fallbackVariant = variants[0]!.id;
  const lines = {} as Record<DialogueLang, Record<string, string>>;
  for (const lang of DIALOGUE_LANGS) {
    const table: Record<string, string> = {};
    for (const [key, text] of Object.entries(obj(d[lang], `dialogue_wardens.${lang}`))) {
      const p = `dialogue_wardens.${lang}["${key}"]`;
      const line = str(text, p);
      if (line.length > rules.maxLineChars)
        throw new ConfigError(`${p}: dài ${line.length} ký tự, tối đa ${rules.maxLineChars}`);
      table[key] = line;
    }
    lines[lang] = table;
  }
  for (const lang of DIALOGUE_LANGS) {
    const table = lines[lang];
    const missing = Object.keys(lines.vi).filter((k) => table[k] === undefined);
    if (missing.length > 0)
      throw new ConfigError(`dialogue_wardens.${lang}: thiếu ${missing.join(', ')}`);
    for (const boss of bossIds) {
      const need = [
        bossLineKey(boss, fallbackVariant, 'pre'),
        bossLineKey(boss, fallbackVariant, 'post'),
        novaAfterKey(boss),
      ];
      for (const key of need)
        if (table[key] === undefined)
          throw new ConfigError(`dialogue_wardens.${lang}: boss "${boss}" thiếu "${key}"`);
      for (const v of variants) {
        const pre = table[bossLineKey(boss, v.id, 'pre')];
        const post = table[bossLineKey(boss, v.id, 'post')];
        if ((pre === undefined) !== (post === undefined))
          throw new ConfigError(
            `dialogue_wardens.${lang}: boss "${boss}" biến thể "${v.id}" phải có cả pre và post`,
          );
        if (pre === undefined || post === undefined) continue;
        // Đoạn sau trận gồm câu của boss và lời NOVA; đoạn trước trận chỉ có câu của boss.
        for (const [part, texts] of [
          ['pre', [pre]],
          ['post', [post, table[novaAfterKey(boss)] ?? '']],
        ] as const) {
          const sec = sequenceLockSec(texts, rules);
          if (sec > rules.maxLockSec)
            throw new ConfigError(
              `dialogue_wardens.${lang}: thoại ${part} của "${boss}" (${v.id}) khóa điều khiển ` +
                `${sec.toFixed(1)} s, quá ${rules.maxLockSec} s`,
            );
        }
      }
    }
  }
  return { rules, variants, fallbackVariant, lines };
}
