/**
 * Chọn thoại trước/sau trận của Warden (GDD mục 3.3, 01-GDD/09-Thoai-Warden.md mục 1): biến thể
 * theo số Warden đã hạ *trước* trận, thiếu biến thể thì dùng biến thể đầu. Logic thuần.
 */
import type { DialogueVariant, WardenDialogueData } from '../../core/dialogue-config';
import type { Locale } from '../../core/ui-config';

export interface DialogueLine {
  /** id người nói (`nova`, id boss), để chọn chân dung. */
  speakerId: string;
  /** Tên hiện trên hộp. */
  speaker: string;
  text: string;
}

export type BossDialogueMoment = 'pre' | 'post';

/** Biến thể cho `defeatedBefore` boss đã hạ; vượt quá khoảng cuối thì dùng biến thể cuối. */
export function variantFor(defeatedBefore: number, variants: readonly DialogueVariant[]): string {
  const n = Math.max(0, Math.floor(defeatedBefore));
  const found = variants.find((v) => n >= v.min && n <= v.max);
  return (found ?? variants[variants.length - 1])?.id ?? '';
}

/** Số Warden đã hạ trước trận với `current` (bỏ boss không phải Warden và chính boss này). */
export function wardensDefeatedBefore(
  defeated: readonly string[],
  wardens: ReadonlySet<string>,
  current: string,
): number {
  return new Set(defeated.filter((id) => id !== current && wardens.has(id))).size;
}

export interface BossDialogueRequest {
  bossId: string;
  /** Tên boss (bosses.json). */
  bossName: string;
  /** Tên người nói khác (ui.json → dialogue.speakers), cần `nova`. */
  speakers: Readonly<Record<string, string>>;
  defeatedBefore: number;
  moment: BossDialogueMoment;
  locale?: Locale;
}

/**
 * Các câu của một lần hội thoại: trước trận là câu của boss; sau trận là câu của boss rồi câu
 * của NOVA sau khi nhận vũ khí. Boss không có thoại (boss xám) thì trả về mảng rỗng.
 */
export function bossDialogue(data: WardenDialogueData, req: BossDialogueRequest): DialogueLine[] {
  const table = data.lines[req.locale ?? 'vi'];
  const variant = variantFor(req.defeatedBefore, data.variants);
  const first = data.variants[0]?.id ?? variant;
  const key = (v: string): string => `boss.${req.bossId}.${v}.${req.moment}`;
  const text = table[key(variant)] ?? table[key(first)];
  if (text === undefined) return [];
  const lines: DialogueLine[] = [{ speakerId: req.bossId, speaker: req.bossName, text }];
  const nova = table[`boss.${req.bossId}.nova_after`];
  if (req.moment === 'post' && nova !== undefined)
    lines.push({ speakerId: 'nova', speaker: req.speakers.nova ?? 'NOVA', text: nova });
  return lines;
}
