import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS } from '@/core/constants';
import { parseDialogue, sequenceLockSec } from '@/core/dialogue-config';
import { parseGameConfig } from '@/core/game-config';
import {
  BossDialogueDirector,
  bossDialogueScript,
  variantFor,
} from '@/logic/dialogue/boss-dialogue';
import { DialoguePlayer } from '@/logic/dialogue/dialogue-player';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const data = loadData();
const config = parseGameConfig(data);
const dialogue = config.dialogue;
const bossIds = config.stages.stages.map((s) => s.boss);
const NONE = { advance: false, skip: false };
const ADVANCE = { advance: true, skip: false };

type Raw = Record<string, Record<string, unknown>>;
function raw(): Raw {
  return structuredClone(data.dialogue_wardens) as Raw;
}

describe('dữ liệu thoại Warden', () => {
  it('hợp lệ: mỗi boss của 8 màn có thoại trước, sau trận và lời NOVA ở cả hai ngôn ngữ', () => {
    expect(bossIds).toHaveLength(8);
    for (const lang of ['vi', 'en'] as const)
      for (const boss of bossIds) {
        const s = bossDialogueScript(dialogue, boss, boss, 0, lang);
        expect(s.pre).toHaveLength(1);
        expect(s.post.map((l) => l.speaker)).toEqual([boss, 'NOVA']);
      }
  });

  it('không đoạn nào khóa điều khiển quá maxLockSec (GDD 3.6)', () => {
    for (const lang of ['vi', 'en'] as const)
      for (const boss of bossIds)
        for (const n of [0, 3, 6]) {
          const s = bossDialogueScript(dialogue, boss, boss, n, lang);
          for (const part of [s.pre, s.post])
            expect(
              sequenceLockSec(
                part.map((l) => l.text),
                dialogue.rules,
              ),
            ).toBeLessThanOrEqual(dialogue.rules.maxLockSec);
        }
  });

  it('báo lỗi: câu quá dài, khoảng biến thể hở, thiếu thoại của boss, đoạn khóa quá lâu', () => {
    const bad = (patch: (r: Raw) => void, re: RegExp) => {
      const r = raw();
      patch(r);
      expect(() => parseDialogue(r, bossIds)).toThrow(re);
    };
    bad((r) => (r.vi!['boss.thorna.early.pre'] = 'a'.repeat(141)), /tối đa 140/);
    bad((r) => (r.variantByBossesDefeated!.mid = [4, 5]), /nối liền/);
    bad((r) => (r.variantByBossesDefeated!.late = [6, 6]), /chưa phủ/);
    bad((r) => delete r.en!['boss.lumen.nova_after'], /thiếu/);
    bad((r) => delete r.vi!['boss.cryo.mid.post'], /cả pre và post|thiếu/);
    bad((r) => (r.rules!.maxLockSec = 3), /khóa điều khiển/);
    bad((r) => (r.rules!.charsPerSec = 0), /phải > 0/);
  });
});

describe('chọn biến thể theo số boss đã hạ', () => {
  it('0–2 sớm, 3–5 giữa, 6–7 muộn', () => {
    expect([0, 2, 3, 5, 6, 7].map((n) => variantFor(dialogue, n))).toEqual([
      'early',
      'early',
      'mid',
      'mid',
      'late',
      'late',
    ]);
  });

  it('Lumen đổi câu theo mốc; Thorna chỉ có biến thể sớm nên luôn dùng nó', () => {
    const vi = dialogue.lines.vi;
    const lumen = (n: number) => bossDialogueScript(dialogue, 'lumen', 'Lumen', n, 'vi').pre[0];
    expect(lumen(0)?.text).toBe(vi['boss.lumen.early.pre']);
    expect(lumen(4)?.text).toBe(vi['boss.lumen.mid.pre']);
    expect(lumen(7)?.text).toBe(vi['boss.lumen.late.pre']);
    const thorna = bossDialogueScript(dialogue, 'thorna', 'Thorna', 7, 'vi');
    expect(thorna.pre[0]).toEqual({ speaker: 'Thorna', text: vi['boss.thorna.early.pre'] });
    expect(thorna.post[1]?.text).toBe(vi['boss.thorna.nova_after']);
  });

  it('boss xám không có thoại', () => {
    const s = bossDialogueScript(dialogue, 'gray', 'Boss xám', 0, 'vi');
    expect(s.pre).toEqual([]);
    expect(s.post).toEqual([]);
  });
});

describe('DialoguePlayer', () => {
  const lines = [
    { speaker: 'A', text: '0123456789' },
    { speaker: 'B', text: 'xin chào' },
  ];

  it('chữ hiện dần theo charsPerSec', () => {
    const p = new DialoguePlayer(lines, 10);
    for (let i = 0; i < 30; i += 1) p.step(DT, NONE);
    expect(p.visibleChars).toBe(5);
    expect(p.lineComplete).toBe(false);
    for (let i = 0; i < 60; i += 1) p.step(DT, NONE);
    expect(p.visibleChars).toBe(10);
    expect(p.lineComplete).toBe(true);
    // Không tự sang câu sau: chờ người chơi.
    expect(p.index).toBe(0);
  });

  it('Tiếp khi đang gõ thì hiện hết câu; Tiếp lần nữa sang câu sau; hết câu cuối thì xong', () => {
    const p = new DialoguePlayer(lines, 10);
    p.step(DT, NONE);
    p.step(DT, ADVANCE);
    expect(p.lineComplete).toBe(true);
    expect(p.index).toBe(0);
    p.step(DT, ADVANCE);
    expect(p.index).toBe(1);
    expect(p.visibleChars).toBe(0);
    expect(p.line?.speaker).toBe('B');
    p.step(DT, ADVANCE);
    p.step(DT, ADVANCE);
    expect(p.finished).toBe(true);
    expect(p.line).toBeUndefined();
  });

  it('Bỏ qua kết thúc cả đoạn ngay', () => {
    const p = new DialoguePlayer(lines, 10);
    p.step(DT, { advance: false, skip: true });
    expect(p.finished).toBe(true);
  });

  it('đoạn rỗng thì xong ngay', () => {
    expect(new DialoguePlayer([], 10).finished).toBe(true);
  });
});

describe('BossDialogueDirector', () => {
  const script = bossDialogueScript(dialogue, 'thorna', 'Thorna', 0, 'vi');
  const rules = dialogue.rules;
  const quiet = { gateClosed: false, bossDefeated: false };
  const make = () => new BossDialogueDirector(script, rules);

  /** Bấm Tiếp tới khi đoạn đang hiện kết thúc; trả về số câu đã qua. */
  function finish(d: BossDialogueDirector): number {
    let seen = 0;
    for (let i = 0; i < 20 && d.active; i += 1) {
      const before = d.active.index;
      d.stepDialogue(DT, ADVANCE);
      if (!d.active || d.active.index !== before) seen += 1;
    }
    return seen;
  }

  it('cửa phòng boss đóng: chờ Kai chạm đất rồi mới hiện thoại trước trận', () => {
    const d = make();
    expect(d.afterWorldStep({ ...quiet, gateClosed: true }, false, DT)).toBe(false);
    expect(d.busy).toBe(true);
    expect(d.active).toBeUndefined();
    expect(d.afterWorldStep(quiet, true, DT)).toBe(true);
    expect(d.active?.line?.speaker).toBe('Thorna');
    expect(finish(d)).toBe(1);
    expect(d.busy).toBe(false);
  });

  it('Kai chưa chạm đất quá groundWaitSec thì vẫn hiện', () => {
    const d = make();
    d.afterWorldStep({ ...quiet, gateClosed: true }, false, DT);
    let started = false;
    const steps = Math.ceil(rules.groundWaitSec / DT) + 1;
    for (let i = 0; i < steps && !started; i += 1) started = d.afterWorldStep(quiet, false, DT);
    expect(started).toBe(true);
  });

  it('hạ boss: chờ postDelaySec, rồi Thorna nói, rồi NOVA', () => {
    const d = make();
    expect(d.afterWorldStep({ ...quiet, bossDefeated: true }, true, DT)).toBe(false);
    let steps = 1;
    while (!d.afterWorldStep(quiet, true, DT)) steps += 1;
    expect(steps * DT).toBeCloseTo(rules.postDelaySec, 1);
    expect(d.active?.line?.speaker).toBe('Thorna');
    d.stepDialogue(DT, ADVANCE);
    d.stepDialogue(DT, ADVANCE);
    expect(d.active?.line?.speaker).toBe('NOVA');
    expect(finish(d)).toBe(1);
  });

  it('mỗi đoạn chỉ hiện một lần mỗi lượt (chết rồi vào lại phòng không nghe lại)', () => {
    const d = make();
    d.afterWorldStep({ ...quiet, gateClosed: true }, true, DT);
    finish(d);
    expect(d.afterWorldStep({ ...quiet, gateClosed: true }, true, DT)).toBe(false);
    expect(d.busy).toBe(false);
  });

  it('Bỏ qua kết thúc đoạn thoại và trả điều khiển', () => {
    const d = make();
    d.afterWorldStep({ ...quiet, gateClosed: true }, true, DT);
    expect(d.stepDialogue(DT, { advance: false, skip: true })).toBe(true);
    expect(d.active).toBeUndefined();
  });

  it('boss không có thoại: không bao giờ bận', () => {
    const d = new BossDialogueDirector({ pre: [], post: [] }, rules);
    expect(d.afterWorldStep({ gateClosed: true, bossDefeated: true }, true, DT)).toBe(false);
    expect(d.busy).toBe(false);
  });
});
