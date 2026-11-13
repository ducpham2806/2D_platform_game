import {
  bossLineKey,
  type DialogueData,
  type DialogueLang,
  type DialogueRules,
  novaAfterKey,
} from '../../core/dialogue-config';
import { type DialogueInput, type DialogueLine, DialoguePlayer } from './dialogue-player';

/** Người dẫn đường của Kai; nói câu cuối của đoạn thoại sau trận. */
export const NOVA_SPEAKER = 'NOVA';

export interface BossDialogueScript {
  pre: DialogueLine[];
  post: DialogueLine[];
}

/** Biến thể thoại theo số boss đã hạ TRƯỚC trận (GDD 3.3: sớm, giữa, muộn). */
export function variantFor(data: DialogueData, bossesDefeatedBefore: number): string {
  const n = Math.max(0, bossesDefeatedBefore);
  const hit = data.variants.find((v) => n >= v.min && n <= v.max);
  return hit?.id ?? data.variants[data.variants.length - 1]?.id ?? data.fallbackVariant;
}

/**
 * Thoại trước và sau trận của một boss. Boss thiếu biến thể của mốc hiện tại thì dùng biến thể
 * dự phòng; boss không có thoại (boss xám) thì cả hai đoạn rỗng.
 */
export function bossDialogueScript(
  data: DialogueData,
  bossId: string,
  bossName: string,
  bossesDefeatedBefore: number,
  lang: DialogueLang,
): BossDialogueScript {
  const table = data.lines[lang];
  const wanted = variantFor(data, bossesDefeatedBefore);
  const variant =
    table[bossLineKey(bossId, wanted, 'pre')] !== undefined ? wanted : data.fallbackVariant;
  const pre = table[bossLineKey(bossId, variant, 'pre')];
  const post = table[bossLineKey(bossId, variant, 'post')];
  const nova = table[novaAfterKey(bossId)];
  return {
    pre: pre ? [{ speaker: bossName, text: pre }] : [],
    post: [
      ...(post ? [{ speaker: bossName, text: post }] : []),
      ...(post && nova ? [{ speaker: NOVA_SPEAKER, text: nova }] : []),
    ],
  };
}

/** Phần của sự kiện màn chơi mà thoại boss cần. */
export interface BossDialogueEvents {
  gateClosed: boolean;
  bossDefeated: boolean;
}

/**
 * Quyết định lúc nào hiện thoại boss trong một lượt vào màn:
 * - cửa phòng boss đóng → thoại trước trận, chờ Kai chạm đất (tối đa `groundWaitSec`);
 * - hạ boss → chờ `postDelaySec` rồi hiện thoại sau trận.
 * Mỗi đoạn chỉ hiện một lần mỗi lượt (chết rồi đánh lại không nghe lại). Trong lúc `active`
 * khác `undefined`, màn chơi đứng yên và đầu vào chỉ dùng cho hội thoại.
 */
export class BossDialogueDirector {
  private player: DialoguePlayer | undefined;
  private waiting: { part: 'pre' | 'post'; sec: number } | undefined;
  private readonly played = { pre: false, post: false };

  constructor(
    private readonly script: BossDialogueScript,
    private readonly rules: DialogueRules,
  ) {}

  /** Đoạn đang hiện. */
  get active(): DialoguePlayer | undefined {
    return this.player;
  }

  /** Đang hiện hoặc sắp hiện thoại (ẩn lời hướng dẫn và thông báo khác). */
  get busy(): boolean {
    return this.player !== undefined || this.waiting !== undefined;
  }

  /**
   * Gọi sau mỗi bước của màn chơi. Trả về `true` nếu một đoạn thoại vừa bắt đầu.
   * @param grounded Kai đang đứng trên nền.
   */
  afterWorldStep(ev: BossDialogueEvents, grounded: boolean, dtSec: number): boolean {
    if (this.player) return false;
    if (ev.bossDefeated) this.queue('post', this.rules.postDelaySec);
    else if (ev.gateClosed) this.queue('pre', this.rules.groundWaitSec);
    const w = this.waiting;
    if (!w) return false;
    w.sec -= dtSec;
    const ready = w.part === 'pre' ? grounded || w.sec <= 0 : w.sec <= 0;
    if (!ready) return false;
    this.waiting = undefined;
    this.player = new DialoguePlayer(this.script[w.part], this.rules.charsPerSec);
    return true;
  }

  /** Gọi mỗi bước khi đang hiện thoại. Trả về `true` nếu đoạn thoại vừa kết thúc. */
  stepDialogue(dtSec: number, input: DialogueInput): boolean {
    const p = this.player;
    if (!p) return false;
    p.step(dtSec, input);
    if (!p.finished) return false;
    this.player = undefined;
    return true;
  }

  private queue(part: 'pre' | 'post', delaySec: number): void {
    if (this.played[part] || this.script[part].length === 0) return;
    this.played[part] = true;
    // Hạ boss trước khi thoại đầu trận kịp hiện thì bỏ thoại đầu trận.
    this.waiting = { part, sec: delaySec };
  }
}
