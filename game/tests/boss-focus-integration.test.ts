import { describe, expect, it } from 'vitest';
import { bossMaxDamage, checkBossRules, parseBosses, type FocusAttack } from '@/core/boss-config';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parsePlayer } from '@/core/player-config';
import { Boss } from '@/logic/boss/boss';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { playerParams } from '@/logic/player/player-params';
import { NO_INPUT, PlayerPhysics } from '@/logic/player/player-physics';
import { createRng } from '@/logic/rng';
import { TileMap } from '@/logic/tilemap';
import { resolveEnemyHits } from '@/logic/world/hits';
import { noWorldEvents } from '@/logic/world/world-types';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const T = TILE_SIZE;
const FLOOR = 11 * T;
const ARENA = TileMap.fromRows(
  [...Array.from({ length: 11 }, () => '#......................#'), '########################'],
  T,
);

const FOCUS: FocusAttack = {
  telegraphSec: 0.7,
  count: 3,
  markIntervalSec: 0.6,
  trackSec: 0.9,
  lockSec: 0.6,
  activeSec: 0.3,
  radiusTiles: 1,
  damage: 15,
  recoverSec: 0.9,
};

function makeData(override: Partial<FocusAttack> = {}) {
  const raw = loadData().bosses as { rules: unknown; gray: object };
  return parseBosses({
    rules: raw.rules,
    test_focus: {
      ...raw.gray,
      idleSec: 0,
      attacks: { focus: { ...FOCUS, ...override } },
      phases: [
        { untilHpPct: 60, speedMul: 1, attacks: ['focus'] },
        { untilHpPct: 30, speedMul: 1, attacks: ['focus'] },
        { untilHpPct: 0, speedMul: 1.2, attacks: ['focus'] },
      ],
    },
  }).test_focus!;
}

function makeFight() {
  const boss = new Boss(makeData(), ARENA, 19 * T, FLOOR, { first: 1, last: 22 }, createRng(9));
  const pp = playerParams(parsePlayer(loadData().player), T, DT);
  const player = new PlayerPhysics(pp, ARENA, 4 * T, FLOOR, 100);
  const pool = new ProjectilePool();
  boss.activate();
  return { boss, player, pool };
}

function stepTo({ boss, player, pool }: ReturnType<typeof makeFight>, predicate: () => boolean) {
  for (let i = 0; i < 360; i += 1) {
    if (predicate()) return;
    boss.step({ playerX: player.centerX, playerY: player.box.y + player.box.h / 2 }, pool, DT);
  }
  throw new Error('Focus không tới trạng thái test sau 6 s');
}

describe('ST-15-10: tích hợp lõi Tiêu Điểm', () => {
  it('kiểm số vòng, bán kính và thời gian khóa kể cả pha cuối +20%', () => {
    expect(() => makeData({ count: 1.5 })).toThrow(/focus.count/);
    expect(() => makeData({ radiusTiles: 0 })).toThrow(/focus.radiusTiles/);
    expect(checkBossRules(makeData(), 100)).toEqual([]);
    expect(checkBossRules(makeData({ lockSec: 0.59 }), 100)).toEqual([
      expect.stringContaining('focus.lockSec'),
    ]);
    expect(bossMaxDamage(makeData({ damage: 25 }))).toBe(25);
  });

  it('chỉ gây sát thương sau báo và khóa, kể cả đang trên không, mỗi vòng một lần', () => {
    const fight = makeFight();
    const { boss, player, pool } = fight;
    player.box.y -= 4 * T;
    stepTo(fight, () => boss.state === 'telegraph' && boss.attack === 'focus');
    expect(boss.focus.marks).toHaveLength(0);
    stepTo(fight, () => boss.focus.marks.some((mark) => mark.phase === 'lock'));
    const locked = boss.focus.marks.find((mark) => mark.phase === 'lock')!;
    expect(locked.y).toBe(player.box.y + player.box.h / 2);
    const beforeBurn = noWorldEvents();
    resolveEnemyHits(pool, [], boss, player, 1, beforeBurn);
    expect(beforeBurn.playerHurt).toBe(false);
    expect(player.hp).toBe(100);
    stepTo(fight, () => boss.focus.pendingHit(player.box) !== undefined);
    player.absorbHit(DT / 2);
    resolveEnemyHits(pool, [], boss, player, 1, noWorldEvents());
    expect(boss.focus.pendingHit(player.box)).toBeDefined();
    player.step(NO_INPUT, DT);
    const burn = noWorldEvents();
    resolveEnemyHits(pool, [], boss, player, 1, burn);
    expect(player.hp).toBe(85);
    expect(burn.hurtBy).toBe('boss:focus');
    expect(boss.focus.pendingHit(player.box)).toBeUndefined();
  });

  it('QB-31: một đòn nhảy hai pha xóa vòng đang cháy trước khi xét sát thương', () => {
    const fight = makeFight();
    const { boss, player, pool } = fight;
    stepTo(fight, () => boss.focus.pendingHit(player.box) !== undefined);
    expect(boss.takeHit({ amount: 90, stunSec: 0, weak: false })).toBe(true);
    expect(boss.shifting).toBe(true);
    expect(boss.focus.marks).toHaveLength(0);
    const afterPhaseShift = noWorldEvents();
    resolveEnemyHits(pool, [], boss, player, 1, afterPhaseShift);
    expect(afterPhaseShift.playerHurt).toBe(false);
    expect(player.hp).toBe(100);
  });
});
