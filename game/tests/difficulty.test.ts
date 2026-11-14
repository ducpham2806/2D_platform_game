import { describe, expect, it } from 'vitest';
import { deepMerge } from '@/core/deep-merge';
import {
  checkpointActive,
  defaultDifficulty,
  type DifficultyRule,
  difficultyUnlocked,
  NO_DIFFICULTY_PROGRESS,
  scaleReward,
  startCheckpointFor,
} from '@/logic/difficulty/difficulty';
import { buildPrep, difficultyStats, type PrepDifficulty } from '@/logic/difficulty/prep-model';

const RULES: DifficultyRule[] = [
  { id: 'story', unlockClearedOn: null },
  { id: 'normal', unlockClearedOn: null },
  { id: 'challenge', unlockClearedOn: ['normal', 'challenge'] },
];

describe('quy tắc độ khó (GDD 11 mục 2–3)', () => {
  it('Thử thách mở khi đã hạ boss màn đó ở Thường hoặc Thử thách; Cốt truyện không mở', () => {
    const challenge = RULES[2]!;
    expect(difficultyUnlocked(challenge, NO_DIFFICULTY_PROGRESS)).toBe(false);
    expect(difficultyUnlocked(challenge, { last: 'story', cleared: ['story'] })).toBe(false);
    expect(difficultyUnlocked(challenge, { last: 'normal', cleared: ['normal'] })).toBe(true);
    expect(difficultyUnlocked(RULES[0]!, NO_DIFFICULTY_PROGRESS)).toBe(true);
  });

  it('mặc định: lần trước nếu còn mở; chưa chọn hoặc lần trước bị khóa thì Thường', () => {
    expect(defaultDifficulty(RULES, NO_DIFFICULTY_PROGRESS)).toBe('normal');
    expect(defaultDifficulty(RULES, { last: 'story', cleared: [] })).toBe('story');
    expect(defaultDifficulty(RULES, { last: 'challenge', cleared: [] })).toBe('normal');
    expect(defaultDifficulty(RULES, { last: 'challenge', cleared: ['normal'] })).toBe('challenge');
    expect(defaultDifficulty(RULES, { last: 'laser', cleared: [] })).toBe('normal');
  });

  it('thưởng nhân hệ số, làm tròn; gốc > 0 thì ít nhất 1', () => {
    // Drone Lính: 2 Core Bit, 6 EXP.
    expect([0.5, 1, 1.5].map((m) => scaleReward(2, m))).toEqual([1, 2, 3]);
    expect([0.5, 1, 1.5].map((m) => scaleReward(6, m))).toEqual([3, 6, 9]);
    expect(scaleReward(1, 0.5)).toBe(1);
    expect(scaleReward(0, 1.5)).toBe(0);
    expect(scaleReward(80, 0.5)).toBe(40);
    expect(scaleReward(120, 1.5)).toBe(180);
  });

  it('checkpoint lọc theo độ khó; vào lại chọn checkpoint gần nhất phía trước', () => {
    const cps = [{}, { difficulties: ['story'] }, { difficulties: ['story', 'normal'] }, {}];
    expect(cps.map((c) => checkpointActive(c, 'challenge'))).toEqual([true, false, false, true]);
    expect(startCheckpointFor(cps, 'challenge', 3)).toBe(1);
    expect(startCheckpointFor(cps, 'normal', 3)).toBe(3);
    expect(startCheckpointFor(cps, 'normal', 2)).toBe(1);
    expect(startCheckpointFor(cps, 'story', 2)).toBe(2);
    expect(startCheckpointFor(cps, 'challenge', 4)).toBe(4);
    expect(startCheckpointFor(cps, 'challenge', 0)).toBe(0);
    expect(startCheckpointFor([{ difficulties: ['story'] }], 'normal', 1)).toBe(0);
    // Chỉ số lưu vượt số checkpoint (bản đồ đổi) thì kẹp.
    expect(startCheckpointFor(cps, 'normal', 9)).toBe(4);
  });

  it('ghép sâu bản Thử thách: đối tượng ghép từng khóa, mảng thay cả, không sửa đầu vào', () => {
    const base = { hp: 3, attack: { cooldownSec: 1.5, projectile: { damage: 8 } }, tags: [1, 2] };
    const merged = deepMerge(base, { attack: { burst: { count: 2 } }, tags: [9] });
    expect(merged).toEqual({
      hp: 3,
      attack: { cooldownSec: 1.5, projectile: { damage: 8 }, burst: { count: 2 } },
      tags: [9],
    });
    expect(base.attack).toEqual({ cooldownSec: 1.5, projectile: { damage: 8 } });
  });
});

describe('mô hình màn Chuẩn bị (GDD 11 mục 2.1)', () => {
  const DIFFS: PrepDifficulty[] = [
    { ...RULES[0]!, name: 'Cốt truyện', desc: 'a', damageTaken: 0.5, enemyHp: 0.8, rewardMul: 0.5 },
    { ...RULES[1]!, name: 'Thường', desc: 'b', damageTaken: 1, enemyHp: 1, rewardMul: 1 },
    { ...RULES[2]!, name: 'Thử thách', desc: 'c', damageTaken: 1.5, enemyHp: 1.25, rewardMul: 1.5 },
  ];
  const prep = (level: number, cleared: string[] = [], recommended: [number, number] = [2, 4]) =>
    buildPrep({
      stageName: 'Stage 1',
      recommended,
      level,
      effectiveLevel: Math.max(level, 2),
      hintBelow: 2,
      difficulties: DIFFS,
      progress: { last: undefined, cleared },
    });

  it('Thử thách khóa kèm điều kiện bằng tên độ khó; mặc định Thường', () => {
    const m = prep(2);
    expect(m.selected).toBe('normal');
    expect(m.options.map((o) => o.locked)).toEqual([false, false, true]);
    expect(m.options[2]!.lockText).toBe('Mở khi xong màn này ở Thường hoặc Thử thách');
    expect(prep(2, ['normal']).options[2]!.locked).toBe(false);
  });

  it('hệ số hiện kiểu số Việt Nam', () => {
    expect(difficultyStats(DIFFS[2]!)).toBe(
      'Sát thương nhận ×1,5 · Máu kẻ địch ×1,25 · Thưởng ×1,5',
    );
  });

  it('gợi ý mềm khi cấp thật thấp hơn khuyến nghị quá 2 cấp (Stage 3 khuyến nghị 6–8)', () => {
    expect(prep(1).levelHint).toBeUndefined();
    expect(prep(4, [], [6, 8]).levelHint).toBeUndefined();
    expect(prep(3, [], [6, 8]).levelHint).toMatch(/Cốt truyện/);
  });
});
