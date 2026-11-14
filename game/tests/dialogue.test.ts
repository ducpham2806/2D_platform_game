import { describe, expect, it } from 'vitest';
import { parseWardenDialogue, wardenIds } from '@/core/dialogue-config';
import { parseGameConfig } from '@/core/game-config';
import { parseUi } from '@/core/ui-config';
import { bossDialogue, variantFor, wardensDefeatedBefore } from '@/logic/dialogue/boss-dialogue';
import { DialogueRunner } from '@/logic/dialogue/dialogue-runner';
import { loadData } from './helpers';

const data = loadData();
const config = parseGameConfig(data);
const DT = 1 / 60;
const NONE = { next: false, skip: false };
const NEXT = { next: true, skip: false };
const SKIP = { next: false, skip: true };

type RawDialogue = {
  variantByBossesDefeated: Record<string, number[]>;
  vi: Record<string, string>;
  en: Record<string, string>;
};
function raw(): RawDialogue {
  return structuredClone(data.dialogue_wardens) as RawDialogue;
}
const maxChars = config.ui.dialogue.maxChars;

describe('dữ liệu thoại Warden', () => {
  it('dialogue_wardens.json hợp lệ: 8 Warden, biến thể phủ 0–7 boss đã hạ', () => {
    const ids = wardenIds(config.wardenDialogue);
    expect([...ids].sort()).toEqual(config.stages.stages.map((s) => s.boss).sort());
    expect(config.wardenDialogue.variants.map((v) => [v.id, v.min, v.max])).toEqual([
      ['early', 0, 2],
      ['mid', 3, 5],
      ['late', 6, 7],
    ]);
    expect(config.wardenDialogue.lines.vi['boss.thorna.early.pre']).toContain('Vườn của ta');
  });

  it('báo khoảng biến thể hở, biến thể lạ, câu quá dài, thiếu bản dịch, thiếu câu NOVA', () => {
    const bad = (patch: (r: RawDialogue) => void, re: RegExp) => {
      const r = raw();
      patch(r);
      expect(() => parseWardenDialogue(r, maxChars)).toThrow(re);
    };
    bad((r) => (r.variantByBossesDefeated.mid = [4, 5]), /bắt đầu từ 3/);
    bad((r) => (r.variantByBossesDefeated.late = [7, 6]), /số đầu lớn hơn/);
    bad((r) => (r.vi['boss.thorna.giua.pre'] = 'x'), /biến thể "giua"/);
    bad((r) => (r.vi['thorna.pre'] = 'x'), /khóa phải dạng/);
    bad((r) => (r.vi['boss.thorna.early.pre'] = 'a'.repeat(141)), /tối đa 140/);
    bad((r) => (r.en['boss.thorna.early.pre'] = 'a'.repeat(183)), /tối đa 182/);
    bad((r) => delete r.en['boss.lumen.mid.post'], /thiếu "boss.lumen.mid.post"/);
    bad((r) => {
      delete r.vi['boss.cryo.nova_after'];
      delete r.en['boss.cryo.nova_after'];
    }, /thiếu "boss.cryo.nova_after"/);
  });

  it('boss của màn đã có dữ liệu trận đánh mà chưa có thoại thì báo lỗi lúc nạp', () => {
    const r = raw();
    for (const table of [r.vi, r.en])
      for (const key of Object.keys(table)) if (key.startsWith('boss.thorna.')) delete table[key];
    expect(() => parseGameConfig({ ...data, dialogue_wardens: r })).toThrow(
      /boss thorna \(màn 1\) chưa có thoại/,
    );
  });

  it('ui.json: chặn bỏ qua phím quá 1 giây và thiếu tên NOVA', () => {
    const ui = () => structuredClone(data.ui) as { dialogue: Record<string, unknown> };
    const a = ui();
    a.dialogue.inputGraceSec = 2;
    expect(() => parseUi(a)).toThrow(/tối đa 1 giây/);
    const b = ui();
    b.dialogue.speakers = {};
    expect(() => parseUi(b)).toThrow(/nova/);
  });
});

describe('chọn thoại boss', () => {
  const variants = config.wardenDialogue.variants;

  it('biến thể theo số boss đã hạ trước trận; vượt khoảng cuối dùng biến thể cuối', () => {
    expect([0, 2, 3, 5, 6, 7, 12].map((n) => variantFor(n, variants))).toEqual([
      'early',
      'early',
      'mid',
      'mid',
      'late',
      'late',
      'late',
    ]);
  });

  it('chỉ đếm Warden khác đã hạ, không đếm boss xám, chính boss này hay bản ghi trùng', () => {
    const wardens = wardenIds(config.wardenDialogue);
    expect(
      wardensDefeatedBefore(['gray', 'thorna', 'lumen', 'lumen', 'cryo'], wardens, 'cryo'),
    ).toBe(2);
  });

  const req = {
    bossName: 'Thorna',
    speakers: config.ui.dialogue.speakers,
  };

  it('Thorna: trước trận 1 câu; sau trận câu của Thorna rồi câu NOVA; thiếu biến thể dùng sớm', () => {
    const pre = bossDialogue(config.wardenDialogue, {
      ...req,
      bossId: 'thorna',
      defeatedBefore: 0,
      moment: 'pre',
    });
    expect(pre).toEqual([
      {
        speakerId: 'thorna',
        speaker: 'Thorna',
        text: config.wardenDialogue.lines.vi['boss.thorna.early.pre'],
      },
    ]);
    const post = bossDialogue(config.wardenDialogue, {
      ...req,
      bossId: 'thorna',
      defeatedBefore: 5,
      moment: 'post',
    });
    expect(post.map((l) => l.speaker)).toEqual(['Thorna', 'NOVA']);
    expect(post[0]?.text).toContain('ai đã ra lệnh');
    expect(post[1]?.text).toContain('mã của Thorna');
  });

  it('Lumen sau 3 boss dùng biến thể giữa; tiếng Anh; boss xám không có thoại', () => {
    const mid = bossDialogue(config.wardenDialogue, {
      ...req,
      bossId: 'lumen',
      bossName: 'Lumen',
      defeatedBefore: 3,
      moment: 'pre',
    });
    expect(mid[0]?.text).toBe(config.wardenDialogue.lines.vi['boss.lumen.mid.pre']);
    const en = bossDialogue(config.wardenDialogue, {
      ...req,
      bossId: 'thorna',
      defeatedBefore: 0,
      moment: 'pre',
      locale: 'en',
    });
    expect(en[0]?.text).toMatch(/^My garden is thirsty/);
    expect(
      bossDialogue(config.wardenDialogue, {
        ...req,
        bossId: 'gray',
        defeatedBefore: 0,
        moment: 'pre',
      }),
    ).toEqual([]);
  });
});

describe('DialogueRunner', () => {
  const rules = { charsPerSec: 40, inputGraceSec: 0.3 };
  const lines = [
    { speakerId: 'thorna', speaker: 'Thorna', text: 'Vườn của ta đang khát.' },
    { speakerId: 'nova', speaker: 'NOVA', text: 'Lạ thật.' },
  ];
  const run = (r: DialogueRunner, sec: number) => {
    for (let i = 0; i < Math.round(sec * 60); i += 1) r.step(NONE, DT);
  };

  it('chữ hiện dần theo charsPerSec, không cắt đôi chữ có dấu', () => {
    const r = new DialogueRunner(lines, rules);
    run(r, 0.25);
    expect(r.view?.text).toBe('Vườn của t');
    expect(r.view?.full).toBe(false);
    run(r, 1);
    expect(r.view?.text).toBe(lines[0]?.text);
    expect(r.view?.full).toBe(true);
  });

  it('Tiếp: lần đầu hiện hết câu, lần sau sang câu kế, câu cuối thì đóng', () => {
    const r = new DialogueRunner(lines, rules);
    run(r, 0.4);
    r.step(NEXT, DT);
    expect(r.view).toMatchObject({ index: 0, full: true });
    expect(r.step(NEXT, DT).advanced).toBe(true);
    expect(r.view).toMatchObject({ index: 1, speaker: 'NOVA', text: '' });
    r.step(NEXT, DT);
    const end = r.step(NEXT, DT);
    expect(end.closed).toBe(true);
    expect(r.done).toBe(true);
    expect(r.view).toBeUndefined();
  });

  it('bấm trong inputGraceSec đầu bị bỏ qua (bấm dồn lúc hạ boss); Bỏ qua đóng ngay', () => {
    const r = new DialogueRunner(lines, rules);
    for (let i = 0; i < 12; i += 1) r.step(SKIP, DT);
    expect(r.done).toBe(false);
    run(r, 0.2);
    const res = r.step(SKIP, DT);
    expect(res).toMatchObject({ closed: true, skipped: true });
  });

  it('không có câu nào thì đóng sẵn', () => {
    expect(new DialogueRunner([], rules).done).toBe(true);
  });
});
