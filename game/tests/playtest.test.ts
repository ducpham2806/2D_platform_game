import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { MemoryStore } from '@/logic/input/settings';
import {
  type PlaytestSession,
  PlaytestRecorder,
  primaryDevice,
  sectionAt,
} from '@/logic/playtest/recorder';
import {
  loadSessions,
  makeExport,
  mergeSessions,
  parseExport,
  PLAYTEST_MAX_SESSIONS,
  saveSession,
  summarize,
} from '@/logic/playtest/summary';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { GRAY_BOX_ROWS, GRAY_BOX_SECTIONS } from '@/stages/gray-box';
import { loadData } from './helpers';

const ORDER = GRAY_BOX_SECTIONS.map((s) => s.id);
const DT = FIXED_STEP_MS / 1000;

function session(patch: Partial<PlaytestSession> & { id: string }): PlaytestSession {
  const r = new PlaytestRecorder(patch.id, 0, ORDER);
  return { ...r.session, durationSec: 120, deviceSec: { keyboard: 120 }, ...patch };
}

describe('ghi phiên chơi thử', () => {
  it('cộng thời gian theo thiết bị, đoạn xa nhất, chết theo đoạn, thời gian thắng boss', () => {
    const r = new PlaytestRecorder('a', 0, ORDER);
    for (let i = 0; i < 60; i += 1) r.step('touch', 'gap', DT);
    for (let i = 0; i < 30; i += 1) r.step('keyboard', 'steps', DT);
    r.death('steps');
    r.step('keyboard', 'start', DT);
    r.bossStart();
    for (let i = 0; i < 120; i += 1) r.step('touch', 'boss', DT);
    r.bossWin();
    const s = r.session;
    expect(primaryDevice(s)).toBe('touch');
    expect(s.furthestSection).toBe('boss');
    expect(s.deaths).toEqual({ steps: 1 });
    expect(s.bossAttempts).toBe(1);
    expect(s.bossWinSec).toEqual([2]);
  });

  it('chết trong phòng boss kết thúc lần đánh đó, không tính thời gian thắng', () => {
    const r = new PlaytestRecorder('b', 0, ORDER);
    r.bossStart();
    r.step('keyboard', 'boss', 5);
    r.death('boss');
    r.bossWin();
    expect(r.session.bossWinSec).toEqual([]);
  });
});

describe('tổng hợp và ngưỡng "hỏng" (GDD 17)', () => {
  it('báo khi hơn 30% phiên chưa thắng dừng ở cùng một đoạn', () => {
    const s = [
      session({ id: '1', lastSection: 'well' }),
      session({ id: '2', lastSection: 'well' }),
      session({ id: '3', lastSection: 'pit' }),
      session({ id: '4', lastSection: 'boss', bossWins: 1 }),
    ];
    const sum = summarize(s);
    expect(sum.quitBySection[0]).toEqual({ section: 'well', share: 2 / 3 });
    expect(sum.flags.join()).toMatch(/dừng ở đoạn "well"/);
  });

  it('báo khi cảm ứng chết nhiều hơn bàn phím quá 40%', () => {
    const s = [
      session({ id: 'k', deviceSec: { keyboard: 120 }, deaths: { gap: 2 } }),
      session({ id: 't', deviceSec: { touch: 120 }, deaths: { gap: 4 } }),
    ];
    expect(summarize(s).flags.join()).toMatch(/Cảm ứng chết/);
  });

  it('báo điểm cảm giác dưới 4 khi đã có ít nhất 3 lượt chấm', () => {
    const rated = (id: string) =>
      session({ id, bossWins: 1, ratings: { jump: 5, dash: 3, shoot: 4 } });
    const sum = summarize([rated('1'), rated('2'), rated('3')]);
    expect(sum.byDevice[0]?.ratings).toMatchObject({ jump: 5, dash: 3, shoot: 4, count: 3 });
    expect(sum.flags).toEqual(['Lướt trên keyboard: 3.0/5 (mục tiêu ≥ 4)']);
  });

  it('bỏ qua phiên quá ngắn', () => {
    expect(summarize([session({ id: 'x', durationSec: 3 })]).sessions).toBe(0);
  });
});

describe('lưu phiên', () => {
  it('cập nhật theo id và chỉ giữ số phiên tối đa', () => {
    const store = new MemoryStore();
    saveSession(store, session({ id: 'a', durationSec: 10 }));
    saveSession(store, session({ id: 'a', durationSec: 20 }));
    expect(loadSessions(store)).toHaveLength(1);
    expect(loadSessions(store)[0]?.durationSec).toBe(20);
    for (let i = 0; i < PLAYTEST_MAX_SESSIONS + 5; i += 1)
      saveSession(store, session({ id: `s${i}` }));
    expect(loadSessions(store)).toHaveLength(PLAYTEST_MAX_SESSIONS);
  });

  it('dữ liệu hỏng thì coi như chưa có phiên nào', () => {
    const store = new MemoryStore();
    store.set('cv.playtest', '{hỏng');
    expect(loadSessions(store)).toEqual([]);
    store.set('cv.playtest', JSON.stringify([{ id: 'x' }, session({ id: 'ok' })]));
    expect(loadSessions(store).map((s) => s.id)).toEqual(['ok']);
  });

  it('xuất rồi gộp nhật ký của người khác: đọc gói, mảng gói, mảng phiên; trùng id không nhân đôi', () => {
    const mine = new MemoryStore();
    saveSession(mine, session({ id: 'me', startedAt: 5 }));
    const pack = makeExport([session({ id: 'p1', startedAt: 1 })], new Date(0), 'test');
    expect(parseExport(JSON.stringify(pack))?.map((s) => s.id)).toEqual(['p1']);
    const several = JSON.stringify([pack, makeExport([session({ id: 'p2' })], new Date(0), 'x')]);
    expect(parseExport(several)?.map((s) => s.id)).toEqual(['p1', 'p2']);
    expect(parseExport(JSON.stringify([session({ id: 'raw' }), { id: 'bad' }]))).toHaveLength(1);
    expect(parseExport('không phải JSON')).toBeUndefined();

    expect(mergeSessions(mine, parseExport(several) ?? [])).toBe(2);
    expect(mergeSessions(mine, parseExport(several) ?? [])).toBe(0);
    // Xếp theo lúc bắt đầu: p2 (0), p1 (1), me (5).
    expect(loadSessions(mine).map((s) => s.id)).toEqual(['p2', 'p1', 'me']);
  });
});

describe('đoạn theo vị trí', () => {
  it('lấy đoạn cuối cùng có cột bắt đầu ≤ cột hiện tại', () => {
    expect(sectionAt(GRAY_BOX_SECTIONS, 0)).toBe('start');
    expect(sectionAt(GRAY_BOX_SECTIONS, 9)).toBe('gap');
    expect(sectionAt(GRAY_BOX_SECTIONS, 50)).toBe('well');
    expect(sectionAt(GRAY_BOX_SECTIONS, 95)).toBe('boss');
    expect(sectionAt(GRAY_BOX_SECTIONS, -3)).toBe('start');
  });
});

describe('chỉnh cảm giác khi đang chơi', () => {
  it('đổi tốc độ chạy có tác dụng ngay ở bước sau', () => {
    const config = parseGameConfig(loadData());
    const world = new StageWorld({
      rows: GRAY_BOX_ROWS,
      tileSize: TILE_SIZE,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.gray!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      mechanics: config.stages.mechanics,
      seed: 1,
    });
    world.step({ ...IDLE_INPUT, moveX: 1 });
    const slow = world.player.vx;
    world.retune({
      player: { ...config.player, speedTilesPerSec: config.player.speedTilesPerSec * 2 },
    });
    world.step({ ...IDLE_INPUT, moveX: 1 });
    expect(world.player.vx).toBeCloseTo(slow * 2);
    expect(world.tuning.player.speedTilesPerSec).toBe(config.player.speedTilesPerSec * 2);
  });

  it('các đoạn của màn xám xếp theo cột tăng dần và bao hết bản đồ', () => {
    const cols = GRAY_BOX_SECTIONS.map((s) => s.fromCol);
    expect(cols[0]).toBe(0);
    expect([...cols].sort((a, b) => a - b)).toEqual(cols);
    expect(cols[cols.length - 1]).toBeLessThan(GRAY_BOX_ROWS[0]!.length);
  });
});

describe('bảng chỉnh cảm giác', async () => {
  const { TUNING_FIELDS, applyField, applyStored, readField, toStored, tuningDiff } =
    await import('@/logic/playtest/tuning');
  const config = parseGameConfig(loadData());
  const base = { player: config.player, weapons: config.weapons, boss: config.bosses.gray! };
  const field = (path: string) => TUNING_FIELDS.find((f) => f.path === path)!;

  it('mọi thông số đọc được và giá trị hiện tại nằm trong khoảng chỉnh', () => {
    for (const f of TUNING_FIELDS) {
      const v = readField(base, f);
      expect(v, f.path).toBeGreaterThanOrEqual(f.min);
      expect(v, f.path).toBeLessThanOrEqual(f.max);
    }
  });

  it('kẹp theo khoảng, làm tròn theo bước, không sửa bản gốc', () => {
    const next = applyField(base, field('jump.apexSec'), 0.4567);
    expect(next.player.jump.apexSec).toBe(0.46);
    expect(base.player.jump.apexSec).toBe(0.4);
    expect(applyField(base, field('speedTilesPerSec'), 99).player.speedTilesPerSec).toBe(9);
  });

  it('giữ ràng buộc: nhảy thấp < nhảy cao, nạp vừa < nạp đầy', () => {
    expect(applyField(base, field('jump.minTiles'), 3).player.jump.minTiles).toBeLessThan(
      base.player.jump.maxTiles,
    );
    expect(
      applyField(base, field('arcCannon.midCharge.timeSec'), 1).weapons.arcCannon.midCharge.timeSec,
    ).toBeLessThan(base.weapons.arcCannon.charge.timeSec);
  });

  it('chỉ xuất phần đã đổi, gom theo file; lưu rồi áp lại ra đúng giá trị', () => {
    let cur = applyField(base, field('jump.apexSec'), 0.45);
    cur = applyField(cur, field('hp'), 120);
    expect(tuningDiff(base, cur)).toEqual({
      'player.json': { 'jump.apexSec': 0.45 },
      'bosses.json › gray': { hp: 120 },
    });
    const again = applyStored(base, toStored(base, cur));
    expect(again.player.jump.apexSec).toBe(0.45);
    expect(again.boss.hp).toBe(120);
  });
});
