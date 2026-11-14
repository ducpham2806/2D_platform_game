import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { parseTutorial, type TutorialData } from '@/core/tutorial-config';
import { defaultSave, parseSave, recordTutorialDone, setTutorialOff } from '@/logic/save/save-data';
import { TutorialManager } from '@/logic/tutorial/tutorial-manager';
import { TutorialSignals } from '@/logic/tutorial/tutorial-signals';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldInput } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const data = loadData();
const config = parseGameConfig(data);
const enemyIds = new Set(Object.keys(config.enemies.enemies));
const sig = (...s: string[]) => new Set(s);

/** Dữ liệu nhỏ để thử máy trạng thái. */
function tiny(steps: unknown[]): TutorialData {
  return parseTutorial({ rules: { showSec: 2, nearTiles: 8, maxTextChars: 120 }, steps }, enemyIds);
}

function raw(): { steps: Record<string, unknown>[] } {
  return structuredClone(data.tutorial) as { steps: Record<string, unknown>[] };
}

describe('dữ liệu hướng dẫn', () => {
  it('tutorial.json hợp lệ, có các bước S01–S13 của Stage 1 trừ S11, S12 (hộp hội thoại boss)', () => {
    const ids = config.tutorial.steps.filter((s) => s.stage === 'stage1').map((s) => s.id);
    const all = Array.from({ length: 13 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`);
    expect(ids).toEqual(all.filter((id) => id !== 'S11' && id !== 'S12'));
  });

  it('báo tín hiệu lạ, kẻ địch không có, bước "after" chưa khai báo, lời thoại quá dài', () => {
    const bad = (patch: (r: { steps: Record<string, unknown>[] }) => void, re: RegExp) => {
      const r = raw();
      patch(r);
      expect(() => parseTutorial(r, enemyIds)).toThrow(re);
    };
    bad((r) => (r.steps[0]!.trigger = { on: 'bay' }), /tín hiệu "bay"/);
    bad((r) => (r.steps[0]!.trigger = { on: 'near:rong_lua' }), /near:rong_lua/);
    bad((r) => (r.steps[0]!.trigger = { after: 'S13' }), /bước đứng trước/);
    bad((r) => (r.steps[0]!.text = 'a'.repeat(200)), /tối đa/);
    bad((r) => (r.steps[0]!.highlight = 'bay'), /hành động/);
    bad((r) => (r.steps[1]!.id = 'S01'), /trùng/);
    bad((r) => (r.steps[0]!.cancelOn = ['bay']), /cancelOn/);
  });
});

describe('TutorialManager', () => {
  const steps = [
    {
      id: 'A',
      stage: 'stage1',
      speaker: 'NOVA',
      trigger: { on: 'wallSlide' },
      require: { on: 'wallJump', count: 2 },
      text: 'gốc',
      fails: ['pit'],
      hints: [
        { afterSec: 1, text: 'gợi ý 1', highlight: 'jump' },
        { afterFails: 2, text: 'gợi ý 2' },
      ],
      skipIfDone: true,
    },
    { id: 'B', stage: 'stage1', speaker: 'NOVA', trigger: { on: 'spike' }, text: 'gai' },
    { id: 'C', stage: 'stage1', speaker: 'NOVA', trigger: { after: 'B' }, text: 'sau gai' },
    { id: 'P', stage: 'prologue', speaker: 'NOVA', trigger: { on: 'start' }, text: 'prologue' },
  ];

  it('kích hoạt, đếm tiến độ, xong thì lưu; chỉ chạy bước của giai đoạn màn', () => {
    const m = new TutorialManager(tiny(steps), 'stage1');
    expect(m.step(sig('start'), 0, DT).started).toBeUndefined();
    expect(m.step(sig('wallSlide'), 0, DT).started).toBe('A');
    expect(m.view).toMatchObject({ id: 'A', text: 'gốc', hintLevel: 0 });
    m.step(sig('wallJump'), 0, DT);
    expect(m.view?.id).toBe('A');
    expect(m.step(sig('wallJump'), 0, DT).completed).toEqual(['A']);
    expect(m.view).toBeUndefined();
    expect([...m.completed]).toEqual(['A']);
  });

  it('gợi ý bậc 1 sau N giây không tiến triển, bậc 2 sau N lần thất bại', () => {
    const m = new TutorialManager(tiny(steps), 'stage1');
    m.step(sig('wallSlide'), 0, DT);
    for (let i = 0; i < 60; i += 1) m.step(sig(), 0, DT);
    expect(m.view).toMatchObject({ text: 'gợi ý 1', highlight: 'jump', hintLevel: 1 });
    m.step(sig('pit'), 0, DT);
    m.step(sig('pit'), 0, DT);
    expect(m.view).toMatchObject({ text: 'gợi ý 2', highlight: 'jump', hintLevel: 2 });
  });

  it('đã làm được trước khi kích hoạt thì bỏ qua, không hiện lời', () => {
    const m = new TutorialManager(tiny(steps), 'stage1');
    m.step(sig('wallJump'), 0, DT);
    const r = m.step(sig('wallJump', 'wallSlide'), 0, DT);
    expect(r).toEqual({ started: undefined, completed: ['A'] });
  });

  it('bước chỉ có lời hiện showSec giây; bước "after" nối tiếp; kích hoạt khi đang bận thì xếp hàng', () => {
    const m = new TutorialManager(tiny(steps), 'stage1');
    m.step(sig('wallSlide'), 0, DT);
    m.step(sig('spike'), 0, DT);
    expect(m.view?.id).toBe('A');
    m.step(sig('wallJump'), 0, DT);
    expect(m.step(sig('wallJump'), 0, DT).started).toBe('B');
    let started: string | undefined;
    for (let i = 0; i < 2 / DT + 1 && !started; i += 1) started = m.step(sig(), 0, DT).started;
    expect(started).toBe('C');
  });

  it('bước đã xong (bản lưu) không chạy lại; tắt hướng dẫn thì không kích hoạt gì', () => {
    const m = new TutorialManager(tiny(steps), 'stage1', ['B']);
    expect(m.step(sig('spike'), 0, DT).started).toBe('C');
    const off = new TutorialManager(tiny(steps), 'stage1', [], false);
    expect(off.step(sig('wallSlide', 'spike'), 0, DT).started).toBeUndefined();
    off.setEnabled(true);
    expect(off.step(sig('spike'), 0, DT).started).toBe('B');
    off.setEnabled(false);
    expect(off.view).toBeUndefined();
    expect(off.completed.has('B')).toBe(false);
  });

  it('yêu cầu đi N ô chỉ tính quãng sang phải', () => {
    const m = new TutorialManager(
      tiny([
        {
          id: 'R',
          stage: 'stage1',
          speaker: 'NOVA',
          trigger: { on: 'start' },
          require: { moveTiles: 3 },
          text: 'chạy',
        },
      ]),
      'stage1',
    );
    m.step(sig('start'), 0, DT);
    m.step(sig(), -5, DT);
    m.step(sig(), 2, DT);
    expect(m.view?.id).toBe('R');
    expect(m.step(sig(), 1, DT).completed).toEqual(['R']);
  });
});

function world(stage: keyof typeof STAGE_DEFS): StageWorld {
  return new StageWorld({
    layout: buildStageLayout(STAGE_DEFS[stage], t),
    tileSize: t,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.gray!,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    seed: 1,
    enemies: config.enemies,
    mechanics: config.stages.mechanics,
  });
}

/** Chạy màn với dữ liệu thật; trả về các bước đã bắt đầu theo thứ tự. */
function play(w: StageWorld, input: (i: number) => WorldInput, steps: number): string[] {
  const m = new TutorialManager(config.tutorial, 'stage1');
  const s = new TutorialSignals(config.tutorial.rules.nearTiles);
  const started: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    w.player.hp = w.player.maxHp;
    const f = s.collect(w, w.step(input(i)));
    const r = m.step(f.signals, f.moveTiles, DT);
    if (r.started) started.push(r.started);
  }
  return started;
}

describe('chuỗi bước trận boss (dữ liệu thật)', () => {
  it('hạ boss khi lời S08 còn hiện: bỏ S08–S10, chỉ còn S13', () => {
    const m = new TutorialManager(config.tutorial, 'stage1');
    const started: string[] = [];
    const run = (s: Set<string>, n = 1) => {
      for (let i = 0; i < n; i += 1) {
        const r = m.step(i === 0 ? s : sig(), 0, DT);
        if (r.started) started.push(r.started);
      }
    };
    run(sig('bossGate'), 30);
    run(sig('bossDefeated', 'weaponGranted'), 60 * 10);
    expect(started).toEqual(['S08', 'S13']);
    expect(m.completed.has('S09') && m.completed.has('S10')).toBe(true);
  });

  it('trận bình thường: S08 → S09 → (đổi pha) S10 → (hạ boss, nhận vũ khí) S13', () => {
    const m = new TutorialManager(config.tutorial, 'stage1');
    const started: string[] = [];
    const run = (s: Set<string>, n = 1) => {
      for (let i = 0; i < n; i += 1) {
        const r = m.step(i === 0 ? s : sig(), 0, DT);
        if (r.started) started.push(r.started);
      }
    };
    // S08 hiện `showSec` (6 s, C14) rồi mới tới S09; đổi pha thật đến muộn hơn nhiều.
    const s08 = config.tutorial.steps.find((s) => s.id === 'S08');
    run(sig('bossGate'), Math.ceil(60 * ((s08?.showSec ?? 3) + 1)));
    run(sig('bossPhase'), 60);
    run(sig('bossDefeated', 'weaponGranted'), 60);
    expect(started).toEqual(['S08', 'S09', 'S10', 'S13']);
  });

  it('S13 còn dở thì nhắc lại ở màn Kết quả; làm xong hoặc tắt hướng dẫn thì không', () => {
    const m = new TutorialManager(config.tutorial, 'stage1', ['S08', 'S09', 'S10']);
    expect(m.reminders).toEqual([]);
    m.step(sig('bossDefeated', 'weaponGranted'), 0, DT);
    const s13 = config.tutorial.steps.find((s) => s.id === 'S13');
    expect(m.reminders).toEqual([s13?.text]);
    m.setEnabled(false);
    expect(m.reminders).toEqual([]);
    m.setEnabled(true);
    m.step(sig('weaponGranted'), 0, DT);
    m.step(sig('fireWarden'), 0, DT);
    expect(m.completed.has('S13')).toBe(true);
    expect(m.reminders).toEqual([]);
  });
});

describe('hướng dẫn trên màn thật', () => {
  it('phòng Golem: vào phòng khóa hiện S07 (không phải S05)', () => {
    const started = play(world('golem'), () => ({ ...IDLE_INPUT, moveX: 1 }), 60 * 8);
    expect(started).toContain('S07');
    expect(started).not.toContain('S05');
  });

  it('phòng thử màn chơi: chạm gai hiện S03', () => {
    const started = play(world('mechanics'), () => ({ ...IDLE_INPUT, moveX: 1 }), 60 * 6);
    expect(started[0]).toBe('S03');
  });

  it('tín hiệu nhảy, lướt, bắn, đoạn màn', () => {
    const w = world('enemies');
    const s = new TutorialSignals(8);
    const all = new Set<string>();
    for (let i = 0; i < 120; i += 1) {
      const f = s.collect(
        w,
        w.step({
          ...IDLE_INPUT,
          moveX: 1,
          jumpPressed: i === 10,
          jumpHeld: i >= 10 && i < 20,
          dashPressed: i === 60,
          shootPressed: i === 90,
          shootHeld: i === 90,
          shootReleased: i === 91,
        }),
      );
      for (const x of f.signals) all.add(x);
    }
    for (const x of ['start', 'jump', 'dash', 'fire', 'fire:shot', 'section:start'])
      expect(all, x).toContain(x);
  });
});

describe('tiến độ hướng dẫn trong bản lưu', () => {
  it('ghi bước đã xong không trùng, bật/tắt, đọc lại được; bản cũ không có thì mặc định', () => {
    let s = recordTutorialDone(defaultSave(), ['S01', 'S03']);
    expect(recordTutorialDone(s, ['S01'])).toBe(s);
    s = setTutorialOff(s, true);
    expect(parseSave(JSON.parse(JSON.stringify(s))).tutorial).toEqual({
      done: ['S01', 'S03'],
      off: true,
    });
    expect(parseSave({ version: 1 }).tutorial).toEqual({ done: [], off: false });
  });
});
