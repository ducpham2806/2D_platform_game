import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { parseStageMechanics } from '@/core/stage-mechanics-config';
import { expForLevel, levelForExp } from '@/logic/player/level';
import { buildStageResult, formatRunTime, ResultGate } from '@/logic/result/stage-result';
import { TutorialManager } from '@/logic/tutorial/tutorial-manager';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const data = loadData();
const config = parseGameConfig(data);
const curve = config.player.level;

describe('cấp theo EXP (GDD 6.1)', () => {
  it('mốc tích lũy: cấp 2 tại 40, cấp 3 khoảng 145, cấp 4 khoảng 331', () => {
    expect(expForLevel(1, curve)).toBe(0);
    expect(expForLevel(2, curve)).toBe(40);
    expect(Math.abs(expForLevel(3, curve) - 145)).toBeLessThanOrEqual(1);
    expect(Math.abs(expForLevel(4, curve) - 331)).toBeLessThanOrEqual(1);
  });

  it('levelForExp: đúng ở hai bên mỗi mốc, không vượt cấp tối đa', () => {
    expect(levelForExp(0, curve)).toBe(1);
    expect(levelForExp(39, curve)).toBe(1);
    expect(levelForExp(40, curve)).toBe(2);
    expect(levelForExp(expForLevel(4, curve) - 1, curve)).toBe(3);
    expect(levelForExp(expForLevel(4, curve), curve)).toBe(4);
    expect(levelForExp(1e9, curve)).toBe(curve.max);
  });

  it('mốc tăng dần tới cấp tối đa', () => {
    for (let l = 2; l <= curve.max; l += 1)
      expect(expForLevel(l, curve)).toBeGreaterThan(expForLevel(l - 1, curve));
  });
});

describe('số liệu màn Kết quả', () => {
  it('Stage 1 theo đặc tả: 350 EXP từ cấp 1 thì lên cấp 4', () => {
    const r = buildStageResult(
      {
        stageName: 'Verdant Gardens',
        timeSec: 582.4,
        deaths: 4,
        expAtStart: 0,
        expGained: 350,
        coreBitsGained: 225,
        weapon: 'Vine Lash',
        secretsFound: 2,
        secretsTotal: 3,
      },
      curve,
    );
    expect(r.levelBefore).toBe(1);
    expect(r.levelAfter).toBe(4);
    expect(r.weapon).toBe('Vine Lash');
    expect(formatRunTime(r.timeSec)).toBe('09:42');
  });

  it('formatRunTime', () => {
    expect(formatRunTime(0)).toBe('00:00');
    expect(formatRunTime(59.9)).toBe('00:59');
    expect(formatRunTime(3723)).toBe('1:02:03');
    expect(formatRunTime(-5)).toBe('00:00');
  });
});

describe('ResultGate', () => {
  const rules = config.stages.mechanics.result;
  const idle = { won: true, busy: false, tutorialPending: false };
  const run = (gate: ResultGate, state: typeof idle, sec: number): boolean => {
    let fired = false;
    for (let i = 0; i < Math.round(sec / DT); i += 1) fired = gate.step(DT, state) || fired;
    return fired;
  };

  it('chưa hạ boss thì không bao giờ hiện', () => {
    expect(run(new ResultGate(rules), { ...idle, won: false }, 60)).toBe(false);
  });

  it('hạ boss: hiện sau delaySec, và chỉ một lần', () => {
    const g = new ResultGate(rules);
    expect(run(g, idle, rules.delaySec - 0.2)).toBe(false);
    expect(run(g, idle, 0.4)).toBe(true);
    expect(run(g, idle, 5)).toBe(false);
  });

  it('đang thoại hoặc có thông báo thì không tính giờ', () => {
    const g = new ResultGate(rules);
    expect(run(g, { ...idle, busy: true }, 30)).toBe(false);
    expect(run(g, idle, rules.delaySec - 0.2)).toBe(false);
    expect(run(g, idle, 0.4)).toBe(true);
  });

  it('còn bước hướng dẫn: chờ người chơi làm xong rồi mới tính delaySec', () => {
    const g = new ResultGate(rules);
    expect(run(g, { ...idle, tutorialPending: true }, rules.tutorialWaitSec - 1)).toBe(false);
    expect(run(g, idle, rules.delaySec - 0.2)).toBe(false);
    expect(run(g, idle, 0.4)).toBe(true);
  });

  it('bước hướng dẫn không được làm: vẫn hiện sau tutorialWaitSec', () => {
    const g = new ResultGate(rules);
    expect(run(g, { ...idle, tutorialPending: true }, rules.tutorialWaitSec + 0.2)).toBe(true);
  });
});

describe('dữ liệu', () => {
  it('stages.mechanics.result bắt buộc và không âm', () => {
    const raw = structuredClone((data.stages as { mechanics: Record<string, unknown> }).mechanics);
    expect(() => parseStageMechanics({ ...raw, result: undefined })).toThrow(/result/);
    expect(() =>
      parseStageMechanics({ ...raw, result: { delaySec: -1, tutorialWaitSec: 5 } }),
    ).toThrow(/delaySec/);
  });

  it('R01 hiện khi mở màn Kết quả rồi tự xong', () => {
    const m = new TutorialManager(config.tutorial, 'afterStage1');
    const first = m.step(new Set(['start']), 0, DT);
    expect(first.started).toBe('R01');
    expect(m.view?.speaker).toBe('NOVA');
    let completed: string[] = [];
    for (let i = 0; i < 60 * 8; i += 1)
      completed = completed.concat(m.step(new Set(), 0, DT).completed);
    expect(completed).toEqual(['R01']);
    expect(m.view).toBeUndefined();
  });
});
