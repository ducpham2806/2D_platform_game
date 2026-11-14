import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { WeaponLoadout } from '@/logic/combat/loadout';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { NO_INPUT, type PlayerInput, PlayerPhysics } from '@/logic/player/player-physics';
import { NO_PLAYER_MODS, type PlayerMods, playerParams } from '@/logic/player/player-params';
import { computeBuild, playerModsOf } from '@/logic/rpg/build';
import { TileMap } from '@/logic/tilemap';
import { resolveEnemyHits } from '@/logic/world/hits';
import { noWorldEvents } from '@/logic/world/world-types';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;
const T = TILE_SIZE;
const input = (patch: Partial<PlayerInput>): PlayerInput => ({ ...NO_INPUT, ...patch });
const mods = (ranks: Record<string, number>): PlayerMods =>
  playerModsOf(computeBuild(config.skills, ranks), DT);

function make(rows: string[], m: PlayerMods = NO_PLAYER_MODS): PlayerPhysics {
  const map = TileMap.fromRows(rows, T);
  const spawn = map.spawn!;
  return new PlayerPhysics(playerParams(config.player, T, DT, m), map, spawn.x, spawn.y, 100);
}

/** Phòng rộng, sàn ở dòng cuối. */
const OPEN = [
  ...Array.from({ length: 10 }, () => '#' + '.'.repeat(58) + '#'),
  '#P' + '.'.repeat(57) + '#',
  '#'.repeat(60),
];

/** Nhảy giữ nút tới đỉnh. */
function jumpToApex(pl: PlayerPhysics): void {
  for (let i = 0; i < 20; i += 1) pl.step(input({ jumpPressed: i === 0, jumpHeld: true }), DT);
}

describe('P1 Lướt Trên Không (GDD 10 mục 2.1)', () => {
  it('chưa học: không lướt được trên không', () => {
    const pl = make(OPEN);
    jumpToApex(pl);
    expect(pl.step(input({ dashPressed: true }), DT).dashed).toBe(false);
  });

  it('có P1: lướt trên không 1 lần; lần 2 không được; chạm đất thì hồi lượt', () => {
    // Bục cao, bên phải là khoảng trống sâu 20 ô để rơi lâu hơn thời gian hồi lướt.
    const tall = [
      '#' + '.'.repeat(28) + '#',
      '#P' + '.'.repeat(27) + '#',
      '#####' + '.'.repeat(24) + '#',
      ...Array.from({ length: 20 }, () => '#' + '.'.repeat(28) + '#'),
      '#'.repeat(30),
    ];
    const pl = make(tall, mods({ P1: 1 }));
    expect(pl.airDashMax).toBe(1);
    for (let i = 0; i < 120 && pl.grounded; i += 1) pl.step(input({ moveX: 1 }), DT);
    for (let i = 0; i < 10; i += 1) pl.step(NO_INPUT, DT); // hết thời gian coyote
    const first = pl.step(input({ dashPressed: true }), DT);
    expect(first.dashed && first.airDashed).toBe(true);
    expect(pl.airDashesLeft).toBe(0);
    for (let i = 0; i < 52; i += 1) pl.step(NO_INPUT, DT); // hết lướt và hồi chiêu
    expect(pl.grounded).toBe(false);
    expect(pl.step(input({ dashPressed: true }), DT).dashed).toBe(false);
    let restored = false;
    for (let i = 0; i < 240 && !pl.grounded; i += 1)
      restored ||= pl.step(NO_INPUT, DT).airDashRestored;
    expect(pl.grounded && restored && pl.airDashesLeft === 1).toBe(true);
  });

  it('có P1: lướt trong thời gian coyote tính là lướt đất, không tốn lượt', () => {
    const ledge = [
      ...Array.from({ length: 10 }, () => '#' + '.'.repeat(28) + '#'),
      '#P' + '.'.repeat(27) + '#',
      '#####' + '.'.repeat(25),
    ];
    const pl = make(ledge, mods({ P1: 1 }));
    let steps = 0;
    while (pl.grounded && steps < 120) {
      pl.step(input({ moveX: 1 }), DT);
      steps += 1;
    }
    const ev = pl.step(input({ moveX: 1, dashPressed: true }), DT);
    expect(ev.dashed).toBe(true);
    expect(ev.airDashed).toBe(false);
    expect(pl.airDashesLeft).toBe(1);
  });

  it('bám tường thì hồi lượt lướt trên không', () => {
    const pl = make(OPEN, mods({ P1: 1 }));
    // Cách tường trái khoảng 4 ô: nhảy, lướt trên không sang trái (3 ô), rồi giữ hướng vào tường.
    for (let i = 0; i < 40; i += 1) pl.step(input({ moveX: 1 }), DT);
    jumpToApex(pl);
    pl.step(input({ moveX: -1, dashPressed: true }), DT);
    expect(pl.airDashesLeft).toBe(0);
    let restored = false;
    for (let i = 0; i < 60 && pl.state !== 'wall_slide'; i += 1)
      restored ||= pl.step(input({ moveX: -1 }), DT).airDashRestored;
    expect(pl.state).toBe('wall_slide');
    expect(restored).toBe(true);
    expect(pl.airDashesLeft).toBe(1);
  });
});

describe('P2 bậc 2: ân hạn nhảy tường', () => {
  /** Bám tường trái, rời ra `away` bước rồi bấm nhảy; trả về có nhảy tường không. */
  function wallJumpAfter(m: PlayerMods, away: number): boolean {
    const pl = make(OPEN, m);
    for (let i = 0; i < 30; i += 1) pl.step(input({ moveX: -1 }), DT);
    jumpToApex(pl);
    for (let i = 0; i < 40 && pl.state !== 'wall_slide'; i += 1) pl.step(input({ moveX: -1 }), DT);
    for (let i = 0; i < away; i += 1) pl.step(input({ moveX: 1 }), DT);
    return pl.step(input({ jumpPressed: true, jumpHeld: true }), DT).wallJumped;
  }

  it('rời tường 4 bước (0,067 s): có ân hạn 0,1 s thì vẫn nhảy tường, không có thì không', () => {
    expect(wallJumpAfter(mods({ P1: 1, P2: 2 }), 4)).toBe(true);
    expect(wallJumpAfter(mods({ P1: 1, P2: 1 }), 4)).toBe(false);
  });

  it('quá ân hạn (8 bước = 0,133 s) thì không nhảy tường', () => {
    expect(wallJumpAfter(mods({ P1: 1, P2: 2 }), 8)).toBe(false);
  });
});

describe('P3 Lướt Xuyên Đạn', () => {
  it('bậc 1/2/3 thêm 3/4/4 bước bất tử với đạn sau 6 bước gốc', () => {
    expect(mods({ P1: 1, P2: 2, P3: 1 }).bulletIFrameExtraSec).toBeCloseTo(3 * DT, 9);
    expect(mods({ P1: 1, P2: 2, P3: 3 }).bulletIFrameExtraSec).toBeCloseTo(4 * DT, 9);
  });

  /** Lướt đủ cú liên tục (bấm ngay khi hồi chiêu xong), đổi hướng mỗi cú; đếm trên 20 chu kỳ trọn. */
  function dashUptime(m: PlayerMods): { base: number; bullet: number; cycle: number } {
    const pl = make(OPEN, m);
    for (let i = 0; i < 400; i += 1) pl.step(input({ moveX: 1 }), DT);
    let dir = -1;
    let base = 0;
    let bullet = 0;
    let dashes = 0;
    let steps = 0;
    for (let i = 0; i < 5000; i += 1) {
      const ev = pl.step(input({ moveX: 0, dashPressed: true }), DT);
      if (ev.dashed) {
        dashes += 1;
        if (dashes === 21) break;
        dir = -dir;
      }
      if (dashes === 0) continue;
      pl.facing = dir as 1 | -1;
      steps += 1;
      if (pl.invulnerable) base += 1;
      if (pl.bulletGuard) bullet += 1;
    }
    return { base: base / steps, bullet: bullet / steps, cycle: steps / 20 };
  }

  it('lướt liên tục (chu kỳ 50 bước): gốc 12%; bậc 3 bất tử với đạn 20% (gốc + 8 điểm %)', () => {
    const plain = dashUptime(NO_PLAYER_MODS);
    const p3 = dashUptime(mods({ P1: 1, P2: 2, P3: 3 }));
    expect(plain.cycle).toBe(50);
    expect(plain.base).toBeCloseTo(6 / 50, 9);
    expect(p3.bullet).toBeCloseTo(10 / 50, 9);
    expect(p3.bullet - plain.base).toBeLessThanOrEqual(0.08 + 1e-9);
  });

  it('nhảy hủy cú lướt ở bước 2 thì phần thêm mất ngay', () => {
    const m = mods({ P1: 1, P2: 2, P3: 3 });
    const pl = make(OPEN, m);
    pl.step(input({ dashPressed: true }), DT);
    pl.step(NO_INPUT, DT);
    pl.step(input({ jumpPressed: true, jumpHeld: true }), DT);
    for (let i = 0; i < 4; i += 1) pl.step(input({ jumpHeld: true }), DT);
    expect(pl.bulletGuard).toBe(false);
    const full = make(OPEN, m);
    full.step(input({ dashPressed: true }), DT);
    for (let i = 0; i < 6; i += 1) full.step(NO_INPUT, DT);
    expect(full.bulletGuardExtended).toBe(true);
  });

  it('phần thêm chỉ với đạn: viên đạn đi xuyên (sượt đạn 1 lần), sóng đất vẫn trúng', () => {
    const pl = make(OPEN, mods({ P1: 1, P2: 2, P3: 3 }));
    pl.step(input({ dashPressed: true }), DT);
    for (let i = 0; i < 7; i += 1) pl.step(NO_INPUT, DT);
    expect(pl.bulletGuardExtended).toBe(true);
    const pool = new ProjectilePool();
    const spec = (kind: 'enemyShot' | 'shockwave') => ({
      owner: 'enemy' as const,
      kind,
      x: pl.box.x,
      y: pl.box.y,
      w: 8,
      h: 8,
      vx: 0,
      vy: 0,
      damage: 10,
      kindMul: 1,
      pierceLeft: 0,
      breaksShield: false,
      weapon: 'test',
      maxDistance: 999,
      ttl: 9,
      attached: false,
      gravity: 0,
    });
    pool.spawn(spec('enemyShot'));
    let grazes = 0;
    const defense = {
      bulletKinds: config.skills.rules.bulletKinds,
      onGraze: () => (grazes += 1),
      shield: undefined,
    };
    const ev = noWorldEvents();
    resolveEnemyHits(pool, [], undefined, pl, 1, ev, defense);
    resolveEnemyHits(pool, [], undefined, pl, 1, noWorldEvents(), defense);
    expect(ev.playerHurt).toBe(false);
    expect(ev.graze).toBe(true);
    expect(grazes).toBe(1);
    expect(pl.hp).toBe(100);
    pool.spawn(spec('shockwave'));
    const ev2 = noWorldEvents();
    resolveEnemyHits(pool, [], undefined, pl, 1, ev2, defense);
    expect(ev2.playerHurt).toBe(true);
    expect(pl.hp).toBe(90);
  });

  it('sượt đạn cộng 0,25 s nạp khi đang giữ nút nạp', () => {
    const l = new WeaponLoadout(config.weapons, T);
    const pool = new ProjectilePool();
    const ctx = { centerX: 100, top: 100, facing: 1 as const, hurt: false, aimTargets: undefined };
    for (let i = 0; i < 20; i += 1)
      l.step({ pressed: i === 0, held: true, released: false, autoFire: false }, ctx, pool, DT);
    expect(l.chargeLevel).toBe(0);
    l.addCharge(0.25);
    expect(l.chargeLevel).toBe(1);
  });
});
