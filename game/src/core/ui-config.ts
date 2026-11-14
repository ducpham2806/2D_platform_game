/** Kiểm tra 03-Data/ui.json (thông số giao diện M10: hộp hội thoại, màn Kết quả). Logic thuần. */
import { ConfigError, num, obj, str } from './json-check';

export const LOCALES = ['vi', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export interface DialogueUi {
  /** Tốc độ chữ hiện dần (ký tự/giây). */
  charsPerSec: number;
  /** Bỏ qua phím bấm trong chừng này giây đầu sau khi hộp mở. */
  inputGraceSec: number;
  /** Độ dài tối đa mỗi câu theo ngôn ngữ (09-Thoai-Warden.md mục 1). */
  maxChars: Record<Locale, number>;
  /** Tên hiện trên hộp của người nói không phải boss (`nova`...). */
  speakers: Record<string, string>;
}

export interface UiData {
  dialogue: DialogueUi;
  result: { delaySec: number };
}

export function parseUi(value: unknown): UiData {
  const u = obj(value, 'ui');
  const d = obj(u.dialogue, 'ui.dialogue');
  const mc = obj(d.maxChars, 'ui.dialogue.maxChars');
  const maxChars = {} as Record<Locale, number>;
  for (const l of LOCALES) maxChars[l] = num(mc[l], `ui.dialogue.maxChars.${l}`, { min: 20 });
  const sp = obj(d.speakers, 'ui.dialogue.speakers');
  const speakers: Record<string, string> = {};
  for (const [id, name] of Object.entries(sp))
    speakers[id] = str(name, `ui.dialogue.speakers.${id}`);
  if (!speakers.nova) throw new ConfigError('ui.dialogue.speakers.nova: cần tên của NOVA');
  const charsPerSec = num(d.charsPerSec, 'ui.dialogue.charsPerSec', { min: 1 });
  const inputGraceSec = num(d.inputGraceSec, 'ui.dialogue.inputGraceSec', { min: 0 });
  // Bỏ qua phím quá lâu thì người chơi tưởng game treo (GDD 3.6: không khóa điều khiển lâu).
  if (inputGraceSec > 1)
    throw new ConfigError(`ui.dialogue.inputGraceSec: tối đa 1 giây (đang là ${inputGraceSec})`);
  const r = obj(u.result, 'ui.result');
  return {
    dialogue: { charsPerSec, inputGraceSec, maxChars, speakers },
    result: { delaySec: num(r.delaySec, 'ui.result.delaySec', { min: 0 }) },
  };
}
