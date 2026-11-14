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

export interface FeedbackTier {
  shakeMs: number;
  shakeIntensity: number;
}

/** Gợi ý của NOVA khi chết liên tiếp (01-GDD/11-Do-kho.md mục 2.5). */
export interface DifficultyHintUi {
  deaths: number;
  /** Hiện ít nhất chừng này giây; câu dài thì max(showSec, số ký tự / charsPerSecRead). */
  showSec: number;
  charsPerSecRead: number;
  /** Câu theo id độ khó đang chơi. */
  lines: Readonly<Record<string, string>>;
  /** Câu thêm về vũ khí khắc chế; `{weapon}` là tên vũ khí. */
  weapon: string;
}

export interface UiData {
  dialogue: DialogueUi;
  difficultyHint: DifficultyHintUi;
  result: { delaySec: number };
  /** Ba bậc phản hồi (GDD 10 mục 6). */
  feedback: {
    small: FeedbackTier;
    medium: FeedbackTier;
    large: FeedbackTier;
    burstRingSec: number;
  };
}

function tier(value: unknown, path: string): FeedbackTier {
  const t = obj(value, path);
  return {
    shakeMs: num(t.shakeMs, `${path}.shakeMs`, { min: 0 }),
    shakeIntensity: num(t.shakeIntensity, `${path}.shakeIntensity`, { min: 0 }),
  };
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
  const f = obj(u.feedback, 'ui.feedback');
  const feedback = {
    small: tier(f.small, 'ui.feedback.small'),
    medium: tier(f.medium, 'ui.feedback.medium'),
    large: tier(f.large, 'ui.feedback.large'),
    burstRingSec: num(f.burstRingSec, 'ui.feedback.burstRingSec', { min: 0 }),
  };
  // Bậc sau không được nhẹ hơn bậc trước (người chơi đọc độ quan trọng qua độ rung).
  if (
    feedback.medium.shakeIntensity < feedback.small.shakeIntensity ||
    feedback.large.shakeIntensity < feedback.medium.shakeIntensity
  )
    throw new ConfigError('ui.feedback: bậc lớn hơn phải rung mạnh hơn hoặc bằng bậc nhỏ hơn');
  const h = obj(u.difficultyHint, 'ui.difficultyHint');
  const deaths = num(h.deaths, 'ui.difficultyHint.deaths', { min: 1 });
  if (!Number.isInteger(deaths)) throw new ConfigError('ui.difficultyHint.deaths: cần số nguyên');
  const linesRaw = obj(h.lines, 'ui.difficultyHint.lines');
  const lines: Record<string, string> = {};
  for (const [id, text] of Object.entries(linesRaw)) {
    lines[id] = str(text, `ui.difficultyHint.lines.${id}`);
    if (lines[id].length > maxChars.vi)
      throw new ConfigError(`ui.difficultyHint.lines.${id}: dài quá ${maxChars.vi} ký tự`);
  }
  const weapon = str(h.weapon, 'ui.difficultyHint.weapon');
  if (!weapon.includes('{weapon}'))
    throw new ConfigError('ui.difficultyHint.weapon: cần chỗ {weapon}');
  return {
    feedback,
    difficultyHint: {
      deaths,
      showSec: num(h.showSec, 'ui.difficultyHint.showSec', { min: 1 }),
      charsPerSecRead: num(h.charsPerSecRead, 'ui.difficultyHint.charsPerSecRead', { min: 5 }),
      lines,
      weapon,
    },
    dialogue: { charsPerSec, inputGraceSec, maxChars, speakers },
    result: { delaySec: num(r.delaySec, 'ui.result.delaySec', { min: 0 }) },
  };
}
