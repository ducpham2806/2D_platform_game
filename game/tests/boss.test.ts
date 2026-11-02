import { describe, expect, it } from 'vitest';
import { type BossAttackId, parseBosses } from '@/core/boss-config';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { TrainingTarget } from '@/logic/combat/targets';
import { GrayBoss } from '@/logic/boss/gray-boss';
import { planRain } from '@/logic/boss/rain';
import { createRng } from '@/logic/rng';
import { TileMap } from '@/logic/tilemap';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const data = parseBosses(loadData().bosses).gray!;
const ARENA = TileMap.fromRows(
  [...Array.from({ length: 11 }, () => '#..................#'), '####################'],
  TILE_SIZE,
);
const FLOOR = 11 * TILE_SIZE;
const PLAYER = { playerX: 4 * TILE_SIZE, playerY: FLOOR - 12 };

function makeBoss(seed = 1): { boss: GrayBoss; pool: ProjectilePool } {
  const boss = new GrayBoss(
    data,
    ARENA,
    16 * TILE_SIZE,
    FLOOR,
    { first: 1, last: 18 },
    createRng(seed),
  );
  return { boss, pool: new ProjectilePool() };
}

function setHpPct(boss: GrayBoss, pct: number): void {
  boss.hp = (data.hp * pct) / 100;
}

describe('boss xám: vòng đòn và pha (GDD 9)', () => {
  it('đứng chờ cho tới khi người chơi vào đấu trường', () => {
    const { boss, pool } = makeBoss();
    for (let i = 0; i < 120; i += 1) boss.step(PLAYER, pool, DT);
    expect(boss.state).toBe('waiting');
    expect(boss.takeHit({ amount: 5, weak: false, stunSec: 0 })).toBe(false);
  });

  it('pha 1 lặp đúng danh sách đòn trong dữ liệu', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    const seen: BossAttackId[] = [];
    for (let i = 0; i < 60 * 30 && seen.length < 4; i += 1) {
      const ev = boss.step(PLAYER, pool, DT);
      if (ev.attackStarted) seen.push(ev.attackStarted);
      pool.update(DT, ARENA);
    }
    expect(seen).toEqual(['shot', 'charge', 'shot', 'charge']);
  });

  it('đổi pha ở 60% và 30% máu', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    boss.step(PLAYER, pool, DT);
    expect(boss.phase).toBe(0);
    boss.takeHit({ amount: data.hp * 0.41, weak: false, stunSec: 0 });
    expect(boss.step(PLAYER, pool, DT).phaseChanged).toBe(true);
    expect(boss.phase).toBe(1);
    boss.takeHit({ amount: data.hp * 0.3, weak: false, stunSec: 0 });
    boss.step(PLAYER, pool, DT);
    expect(boss.phase).toBe(2);
    expect(boss.speedMul).toBe(1.2);
  });

  it.each([100, 50, 20])('ở %i%% máu, mọi telegraph kéo dài ≥ 0,5 giây', (pct) => {
    const { boss, pool } = makeBoss();
    setHpPct(boss, pct);
    boss.activate();
    let current = 0;
    const lengths: number[] = [];
    for (let i = 0; i < 60 * 40; i += 1) {
      boss.step(PLAYER, pool, DT);
      pool.update(DT, ARENA);
      if (boss.state === 'telegraph') current += 1;
      else if (current > 0) {
        lengths.push(current * DT);
        current = 0;
      }
    }
    expect(lengths.length).toBeGreaterThan(3);
    for (const l of lengths) expect(l).toBeGreaterThanOrEqual(data.minTelegraphSec - DT);
  });
});

describe('từng đòn', () => {
  function runUntil(boss: GrayBoss, pool: ProjectilePool, attack: BossAttackId, ctx = PLAYER) {
    for (let i = 0; i < 60 * 40; i += 1) {
      const ev = boss.step(ctx, pool, DT);
      pool.update(DT, ARENA);
      if (ev.attackStarted === attack) return;
    }
    throw new Error(`không thấy đòn ${attack}`);
  }

  it('Bắn thẳng: 3 viên theo làn ngang người chơi lúc báo trước, sát thương 12', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    runUntil(boss, pool, 'shot');
    let maxShots = 0;
    for (let i = 0; i < 120; i += 1) {
      boss.step(PLAYER, pool, DT);
      maxShots = Math.max(maxShots, pool.count('enemy', ['enemyShot']));
    }
    expect(maxShots).toBe(3);
    const shot = pool.all.find((p) => p.kind === 'enemyShot')!;
    expect(shot.y + shot.h / 2).toBeCloseTo(PLAYER.playerY);
    expect(shot.vx).toBeLessThan(0);
    expect(shot.damage).toBe(12);
  });

  it('Lao ngang: chạy về phía người chơi, dừng ở tường rồi hồi', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    runUntil(boss, pool, 'charge');
    let touched = false;
    for (let i = 0; i < 180; i += 1) {
      boss.step(PLAYER, pool, DT);
      if (boss.box.x <= TILE_SIZE + 0.01) touched = true;
      if (boss.state === 'active') expect(boss.touchDamage).toBe(data.attacks.charge.damage);
    }
    expect(touched).toBe(true);
    expect(['recover', 'idle', 'telegraph']).toContain(boss.state);
  });

  it('Nhảy đập: đáp gần chỗ người chơi đứng lúc báo trước, tung 2 sóng đất', () => {
    const { boss, pool } = makeBoss();
    setHpPct(boss, 50);
    boss.activate();
    runUntil(boss, pool, 'slam');
    let landed = false;
    for (let i = 0; i < 180 && !landed; i += 1) landed = boss.step(PLAYER, pool, DT).landed;
    expect(landed).toBe(true);
    expect(Math.abs(boss.centerX - PLAYER.playerX)).toBeLessThan(TILE_SIZE);
    expect(pool.count('enemy', ['shockwave'])).toBe(2);
    const dirs = pool.all.filter((p) => p.kind === 'shockwave').map((p) => Math.sign(p.vx));
    expect(dirs.sort()).toEqual([-1, 1]);
  });

  it('Mưa đạn (đòn đỉnh, pha 3): đạn rơi trừ các khe an toàn, sau đó boss choáng 2 giây', () => {
    const { boss, pool } = makeBoss();
    setHpPct(boss, 20);
    boss.activate();
    runUntil(boss, pool, 'rain');
    const cols = [...boss.rainCols];
    expect(cols.length).toBe(18 - data.attacks.rain.safeGaps * data.attacks.rain.gapWidthTiles);
    while (boss.state === 'telegraph') boss.step(PLAYER, pool, DT);
    expect(pool.count('enemy', ['drop'])).toBe(cols.length);
    let stunnedSteps = 0;
    for (let i = 0; i < 60 * 5; i += 1) {
      boss.step(PLAYER, pool, DT);
      if (boss.state === 'stunned') stunnedSteps += 1;
    }
    expect(stunnedSteps * DT).toBeCloseTo(data.attacks.rain.stunAfterSec, 1);
  });
});

describe('Mưa đạn luôn có khe né', () => {
  it('500 hạt giống: đủ 3 khe, mỗi khe rộng 2 ô, không cột đạn nào trong khe, khe không dính nhau', () => {
    for (let seed = 0; seed < 500; seed += 1) {
      const { dropCols, gapStarts } = planRain(1, 18, 3, 2, createRng(seed));
      expect(gapStarts).toHaveLength(3);
      for (const g of gapStarts) {
        expect(dropCols).not.toContain(g);
        expect(dropCols).not.toContain(g + 1);
        expect(g).toBeGreaterThanOrEqual(1);
        expect(g + 1).toBeLessThanOrEqual(18);
      }
      for (let i = 1; i < gapStarts.length; i += 1) {
        expect(gapStarts[i]! - gapStarts[i - 1]!).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('khe rộng 2 ô vừa người Kai (12 px) có dư', () => {
    expect(2 * TILE_SIZE - data.attacks.rain.sizePx.w).toBeGreaterThan(12);
  });

  it('báo lỗi khi đấu trường quá hẹp', () => {
    expect(() => planRain(1, 5, 3, 2, createRng(1))).toThrow(RangeError);
  });
});

describe('điểm yếu và hạ boss', () => {
  it('trúng điểm yếu: choáng 0,5 giây, mọi đồng hồ đứng yên', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    boss.step(PLAYER, pool, DT);
    const before = boss.state;
    boss.takeHit({ amount: 2.5, weak: true, stunSec: 0.5 });
    for (let i = 0; i < 29; i += 1) {
      boss.step(PLAYER, pool, DT);
      expect(boss.state).toBe(before);
      expect(boss.stunned).toBe(true);
    }
  });

  it('hết máu: báo hạ boss đúng một lần rồi đứng yên', () => {
    const { boss, pool } = makeBoss();
    boss.activate();
    boss.takeHit({ amount: data.hp, weak: false, stunSec: 0 });
    expect(boss.step(PLAYER, pool, DT).defeated).toBe(true);
    for (let i = 0; i < 30; i += 1) expect(boss.step(PLAYER, pool, DT).defeated).toBe(false);
    expect(boss.state).toBe('dead');
  });
});

describe('bia tập bắn', () => {
  const shot = (vx: number, breaksShield = false) =>
    ({ vx, x: 0, w: 4, breaksShield }) as Parameters<TrainingTarget['hit']>[0];

  it('bia thường: trúng, vỡ, tự dựng lại', () => {
    const t = new TrainingTarget(1, { x: 100, y: 0, w: 12, h: 24 }, 3, 0, 2);
    expect(t.hit(shot(1), 1)).toBe('hit');
    expect(t.hit(shot(1), 2)).toBe('destroyed');
    expect(t.alive).toBe(false);
    for (let i = 0; i < 125; i += 1) t.step(DT);
    expect(t.alive).toBe(true);
    expect(t.hp).toBe(3);
  });

  it('bia có khiên mặt trái: chặn đạn thường bay từ trái, nạp đầy phá khiên, đánh sau lưng được', () => {
    const t = new TrainingTarget(2, { x: 100, y: 0, w: 12, h: 24 }, 3, -1, 2);
    expect(t.hit(shot(1), 1)).toBe('blocked');
    expect(t.hp).toBe(3);
    expect(t.hit(shot(-1), 1)).toBe('hit');
    expect(t.hit(shot(1, true), 3)).toBe('shieldBroken');
    expect(t.hit(shot(1), 1)).toBe('hit');
  });
});
