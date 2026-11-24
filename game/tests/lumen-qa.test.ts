import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildStageResult } from '@/logic/result/stage-result';
import { FIXED_STEP_HZ } from '@/core/constants';
import { LumenAttemptClock, LUMEN_QA_LEVEL } from '@/qa/lumen-qa';

const idle = { gateClosed: false, respawned: false, playerDied: false, bossDefeated: false };

describe('bản QA Lumen cục bộ', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('chỉ bật gói QA khi build cho QA; gate vẫn ưu tiên ở build thường', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubGlobal('window', { location: { search: '?lumen-qa=1&lumen=1&debug=1&gate=1' } });
    const flags = await import('@/debug/flags');
    expect(flags).toMatchObject({ LUMEN_QA: false, GATE: true, LUMEN_PRACTICE: false });
  });

  it.each([
    ['', false],
    ['?challenge=1&gate=1&tune=1&debug=1&telemetry=1&shop=1&unlock=1', true],
  ])('QA vào thẳng Lumen, chặn cờ khác (%s)', async (search, challenge) => {
    vi.stubEnv('MODE', 'lumen-qa');
    vi.stubGlobal('window', { location: { search } });
    const flags = await import('@/debug/flags');
    expect(flags).toMatchObject({
      LUMEN_QA: true,
      LUMEN_PRACTICE: true,
      LUMEN_CHALLENGE: challenge,
      DEBUG: false,
      GATE: false,
      TUNE: false,
      SHOP: false,
      UNLOCK_ALL: false,
      TELEMETRY_DEBUG: false,
    });
    expect(LUMEN_QA_LEVEL).toBe(5);
  });

  it('đồng hồ chỉ đo bước trận và tách lần hồi sinh khỏi lượt vừa thua', () => {
    const clock = new LumenAttemptClock();
    const run = (seconds: number, inFight: boolean) => {
      for (let frame = 0; frame < seconds * FIXED_STEP_HZ; frame += 1) clock.step(idle, inFight);
    };
    run(12, false);
    clock.step({ ...idle, respawned: true }, false);
    expect(clock.seconds).toBeUndefined();
    clock.step({ ...idle, gateClosed: true }, true);
    expect(clock.seconds).toBe(0);
    run(17, true);
    clock.step({ ...idle, playerDied: true }, true);
    expect(clock.last).toEqual({ sec: 17 + 1 / FIXED_STEP_HZ, won: false });
    run(3, true);
    expect(clock.label()).toBe('Thua: 17.0 s');
    clock.step({ ...idle, respawned: true }, true);
    expect(clock.label()).toBe('Trận: 0.0 s · Trước: Thua: 17.0 s');
    run(65, true);
    clock.step({ ...idle, bossDefeated: true }, false);
    run(1, false);
    expect(clock.label()).toBe('Thắng: 65.0 s');
  });
  it('bảng kết quả QA ghi đúng lượt thắng, build thường giữ tổng thời gian màn', () => {
    const world = { elapsedSec: 212, deaths: 2, exp: 241, coreBits: 110, secrets: [] };
    const info = { stageName: 'Lumen', savedCoreBits: 0, newWeapon: 'Prism Beam', reminders: [] };
    expect(buildStageResult(world, info).stats).toContainEqual({
      label: 'Thời gian',
      value: '03:32',
    });
    const result = buildStageResult(world, { ...info, attemptSec: 65.1 });
    expect(result.stats).toContainEqual({ label: 'Trận thắng', value: '65.1 s' });
    expect(result.rewards).toContain('Vũ khí mới: Prism Beam');
  });
});
