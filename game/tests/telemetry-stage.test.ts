import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { telemetryCatalogs, weaponId } from '@/core/telemetry-catalogs';
import type { TelemetryConfig } from '@/core/telemetry-config';
import { layoutFromRows } from '@/logic/stage/layout';
import {
  detectBrowser,
  detectPlatform,
  langCode,
  sessionStartProps,
} from '@/logic/telemetry/device';
import { FrameStats } from '@/logic/telemetry/frame-stats';
import { Telemetry } from '@/logic/telemetry/logger';
import type { TelemetryEvent } from '@/logic/telemetry/schema';
import { buildSignature, StageTracker } from '@/logic/telemetry/stage-tracker';
import { validateEvent } from '@/logic/telemetry/validate';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, noWorldEvents, type WorldEvents } from '@/logic/world/world-types';
import { loadData } from './helpers';

const t = TILE_SIZE;
const DT = FIXED_STEP_MS / 1000;
const game = parseGameConfig(loadData());
const config = game.telemetry as TelemetryConfig;
const catalogs = telemetryCatalogs(game);

/**
 * Màn thử cho đo lường: đoạn A có gai (cột 6), checkpoint ở cột 12 (đoạn B), cửa cột 30 rồi đấu
 * trường Thorna (đoạn boss).
 */
const W = 60;
const GATE = 30;
const ROWS: string[] = [
  ...Array.from({ length: 8 }, () => `#${'.'.repeat(GATE - 1)}#${'.'.repeat(W - GATE - 2)}#`),
  `#${'.'.repeat(GATE - 1)}D${'...===....===....===....'.padEnd(W - GATE - 2, '.')}#`,
  `#${'.'.repeat(GATE - 1)}D${'.'.repeat(W - GATE - 2)}#`,
  `#..P..^.....C${'.'.repeat(GATE - 13)}D${'.'.repeat(24)}B...#`,
  '#'.repeat(W),
];
const SECTIONS = [
  { id: 'A', label: 'Đoạn A', fromCol: 0 },
  { id: 'B', label: 'Đoạn B', fromCol: 10 },
  { id: 'boss', label: 'Phòng boss', fromCol: GATE },
];

function setup() {
  const world = new StageWorld({
    layout: layoutFromRows(ROWS, t, {}, SECTIONS),
    tileSize: t,
    stepSec: DT,
    player: game.player,
    weapons: game.weapons,
    boss: game.bosses.thorna!,
    difficulty: game.difficulties.find((d) => d.id === 'normal')!,
    mechanics: game.stages.mechanics,
    seed: 3,
  });
  let clock = 1763599990000;
  const tel = new Telemetry({
    config,
    catalogs,
    sid: 'k9x2ab0c',
    now: () => (clock += 16),
    strict: true,
  });
  const tracker = new StageTracker(tel, world, {
    stage: 'verdant_gardens',
    tileSize: t,
    weaponId,
    progressSec: config.stageProgressSec,
    gameSpeed: 1,
  });
  const run = (input = IDLE_INPUT): WorldEvents => {
    const ev = world.step(input);
    tracker.step(ev, 'touch', DT);
    return ev;
  };
  const until = (
    pred: (ev: WorldEvents) => boolean,
    input = () => IDLE_INPUT,
    max = 6000,
  ): WorldEvents => {
    for (let i = 0; i < max; i += 1) {
      const ev = run(input());
      if (pred(ev)) return ev;
    }
    throw new Error('không tới điều kiện');
  };
  const events = (): TelemetryEvent[] => tel.buffer.all();
  return { world, tel, tracker, run, until, events };
}

const START = {
  room: 'thorna',
  difficulty: 'normal',
  difficultyDefault: 'normal',
  challengeOpen: false,
  run: 1,
  level: 1,
  effLevel: 1,
  skills: 'V0P0C0',
  coreBits: 0,
};
const EXTRA = {
  realSec: 95.04,
  expEarned: 120,
  coreBitsEarned: 80,
  balance: 80,
  fpsMedian: 59.6,
  slowFramePct: 1.234,
};

describe('đo lường một lượt màn (ST-13-02, GDD 13 mục 10 ý 1)', () => {
  it('chuỗi stage_start → section_enter → death → checkpoint → boss_start → boss_end → stage_end, đủ thuộc tính', () => {
    const { world, tracker, run, until, events } = setup();
    tracker.start(START, 'touch');

    // Chết vì gai ở đoạn A.
    world.player.hp = 1;
    const spike = until(
      (ev) => ev.playerDied,
      () => ({ ...IDLE_INPUT, moveX: 1 }),
    );
    expect(spike.deathCause).toBe('spike');
    until((ev) => ev.respawned);
    // Qua gai, chạm checkpoint ở đoạn B.
    world.player.respawn(8 * t, 10 * t);
    until(
      (ev) => ev.checkpoint !== undefined,
      () => ({ ...IDLE_INPUT, moveX: 1 }),
    );
    // Vào đấu trường, để Thorna hạ Kai (còn 1 máu).
    world.player.respawn((world.arena!.first + 3) * t, 10 * t);
    until((ev) => ev.gateClosed);
    world.player.hp = 1;
    const killed = until((ev) => ev.playerDied);
    expect(killed.deathCause).toMatch(/^boss:/);
    until((ev) => ev.respawned);
    // Lần hai: boss còn 1 máu, bắn tới khi hạ.
    world.boss!.hp = 1;
    let i = 0;
    until(
      (ev) => ev.bossDefeated,
      () => {
        i += 1;
        world.player.hp = world.player.maxHp;
        const dir = world.boss!.centerX > world.player.centerX ? 1 : -1;
        return {
          ...IDLE_INPUT,
          moveX: i % 30 === 0 ? dir : 0,
          shootPressed: i % 8 === 0,
          shootHeld: i % 8 === 0,
          shootReleased: i % 8 === 1,
        };
      },
    );
    for (let k = 0; k < 30; k += 1) run();
    tracker.end('clear', EXTRA, 'touch');

    const evs = events();
    expect(evs.map((ev) => ev.e)).toEqual([
      'stage_start',
      'section_enter',
      'death',
      'section_enter',
      'checkpoint',
      'section_enter',
      'boss_start',
      'death',
      'boss_end',
      'boss_start',
      'boss_end',
      'stage_end',
    ]);
    expect(evs.map((ev) => ev.n)).toEqual(evs.map((_, k) => k));
    const by = (e: string, k = 0) => evs.filter((ev) => ev.e === e)[k]!.p;
    expect(by('stage_start')).toMatchObject({ stage: 'verdant_gardens', device: 'touch', run: 1 });
    expect(by('section_enter', 0)).toMatchObject({ section: 'A' });
    expect(by('section_enter', 1)).toMatchObject({ section: 'B' });
    expect(by('section_enter', 2)).toMatchObject({ section: 'boss' });
    expect(by('death', 0)).toMatchObject({
      section: 'A',
      kind: 'death',
      cause: 'spike',
      device: 'touch',
      streak: 1,
    });
    expect(by('checkpoint')).toMatchObject({ index: 1 });
    expect(by('boss_start', 0)).toMatchObject({ boss: 'thorna', attempt: 1 });
    expect(by('death', 1)).toMatchObject({ section: 'boss', kind: 'death' });
    expect(by('boss_end', 0)).toMatchObject({ boss: 'thorna', outcome: 'death' });
    expect(by('boss_start', 1)).toMatchObject({ attempt: 2 });
    const win = by('boss_end', 1);
    expect(win).toMatchObject({ outcome: 'win', bossHpPct: 0, device: 'touch', gameSpeed: 1 });
    expect((win.dmg as Record<string, number>).arcCannon).toBeGreaterThan(0);
    expect(win.fightSec).toBeGreaterThan(0);
    const end = by('stage_end');
    expect(end).toMatchObject({
      stage: 'verdant_gardens',
      outcome: 'clear',
      deaths: 2,
      pits: 0,
      furthest: 'boss',
      last: 'boss',
      expEarned: 120,
      coreBitsEarned: 80,
      balance: 80,
      realSec: 95,
      fpsMedian: 60,
      slowFramePct: 1.234,
    });
    expect((end.deviceSec as Record<string, number>).touch).toBeGreaterThan(0);
  });

  it('thoát giữa trận boss: boss_end exit rồi stage_end quit; tiến độ định kỳ; gợi ý NOVA', () => {
    const { world, tel, tracker, run, until, events } = setup();
    tracker.start(START, 'keyboard');
    world.player.respawn((world.arena!.first + 3) * t, 10 * t);
    until((ev) => ev.gateClosed);
    for (let k = 0; k < Math.ceil(config.stageProgressSec / DT); k += 1) {
      world.player.hp = world.player.maxHp;
      run();
    }
    expect(tracker.progressDue()).toBe(true);
    tel.clientError('error', 'stage', false, 'lỗi lặp');
    tel.clientError('error', 'stage', false, 'lỗi lặp');
    tracker.progress(EXTRA);
    expect(tracker.progressDue()).toBe(false);
    tracker.hint('normal');
    tracker.end('quit', EXTRA, 'keyboard');
    tracker.end('quit', EXTRA, 'keyboard');
    expect(events().map((ev) => ev.e)).toEqual([
      'stage_start',
      'section_enter',
      'section_enter',
      'boss_start',
      'client_error',
      'client_error',
      'stage_progress',
      'difficulty_hint',
      'boss_end',
      'stage_end',
    ]);
    const exit = events().find((ev) => ev.e === 'boss_end')!.p;
    expect(exit).toMatchObject({ outcome: 'exit', device: 'keyboard' });
    expect(exit.bossHpPct).toBeGreaterThan(0);
    expect(events().at(-1)!.p).toMatchObject({ outcome: 'quit' });
    expect(tracker.ended).toBe(true);
  });

  it('rơi hố còn máu: death kind pit, cause pit; không tính vào deaths', () => {
    const { tracker, events } = setup();
    tracker.start(START, 'keyboard');
    tracker.step({ ...noWorldEvents(), fellInPit: true }, 'keyboard', DT);
    tracker.end('quit', EXTRA, 'keyboard');
    const pit = events().find((ev) => ev.e === 'death')!.p;
    expect(pit).toMatchObject({ kind: 'pit', cause: 'pit' });
    expect(events().at(-1)!.p).toMatchObject({ deaths: 0, pits: 1 });
  });
});

describe('chữ ký build, thống kê khung (ST-13-02)', () => {
  it('buildSignature: tổng bậc theo nhánh', () => {
    expect(buildSignature({})).toBe('V0P0C0');
    expect(buildSignature({ V1: 1, V2: 2, P1: 1, C3: 0 })).toBe('V3P1C0');
  });

  it('FrameStats: trung vị, % khung chậm, bỏ khung > ignoreMs (QB-157)', () => {
    const f = new FrameStats(config.frame.slowMs, config.frame.ignoreMs);
    expect(f.fpsMedian).toBe(0);
    for (let i = 0; i < 90; i += 1) f.add(16.7);
    for (let i = 0; i < 10; i += 1) f.add(33.4);
    f.add(5000);
    expect(f.frames).toBe(100);
    expect(Math.round(f.fpsMedian)).toBe(60);
    expect(f.slowFramePct).toBeCloseTo(10, 5);
    expect(f.realMs).toBeCloseTo(90 * 16.7 + 10 * 33.4, 3);
  });
});

describe('thiết bị cho session_start (ST-13-02b)', () => {
  const UA = {
    android:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
    samsung:
      'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0 Mobile Safari/537.36',
    iphone:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36 Edg/120.0',
    firefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
  };

  it('nhóm thô nền tảng, trình duyệt; iPad tự nhận Mac thì nhận ra nhờ cảm ứng', () => {
    expect([detectPlatform(UA.android), detectBrowser(UA.android)]).toEqual(['android', 'chrome']);
    expect(detectBrowser(UA.samsung)).toBe('samsung');
    expect([detectPlatform(UA.iphone), detectBrowser(UA.iphone)]).toEqual(['ios', 'safari']);
    expect(detectPlatform(UA.ipad, 5)).toBe('ios');
    expect(detectPlatform(UA.ipad, 0)).toBe('mac');
    expect([detectPlatform(UA.edge), detectBrowser(UA.edge)]).toEqual(['windows', 'edge']);
    expect([detectPlatform(UA.firefox), detectBrowser(UA.firefox)]).toEqual(['linux', 'firefox']);
    expect([langCode('vi-VN'), langCode('EN'), langCode(''), langCode('x')]).toEqual([
      'vi',
      'en',
      'other',
      'other',
    ]);
  });

  it('thuộc tính session_start làm tròn màn hình, dpr; qua kiểm lược đồ; không có userAgent', () => {
    const p = sessionStartProps(
      {
        userAgent: UA.android,
        maxTouchPoints: 5,
        language: 'vi-VN',
        width: 863,
        height: 361,
        devicePixelRatio: 2.625,
        zoom: 2,
        standalone: false,
        now: new Date(2026, 10, 20, 9, 30),
        staff: false,
      },
      config.round.screenPx,
      config.round.dpr,
    );
    expect(p).toMatchObject({
      day: '2026-11-20',
      screen: '850x350',
      dpr: 2.75,
      platform: 'android',
      lang: 'vi',
    });
    expect(JSON.stringify(p)).not.toMatch(/Mozilla|Pixel/);
    const ev = { e: 'session_start', t: 1, sid: 'k9x2ab0c', n: 0, p };
    expect(validateEvent(ev, { textMaxChars: config.errorMsgMaxChars, catalogs })).toEqual([]);
  });
});
