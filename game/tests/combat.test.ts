import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseWeapons } from '@/core/weapons-config';
import { incomingDamage, outgoingDamage } from '@/logic/combat/damage';
import {
  ARC_CANNON,
  type FireContext,
  type FireInput,
  WeaponLoadout,
} from '@/logic/combat/loadout';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { TileMap } from '@/logic/tilemap';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const weapons = parseWeapons(loadData().weapons);
const OPEN = TileMap.fromRows(['.'.repeat(60), '.'.repeat(60), '#'.repeat(60)], TILE_SIZE);
const ctx = (patch: Partial<FireContext> = {}): FireContext => ({
  centerX: 40,
  centerY: 20,
  top: 8,
  facing: 1,
  hurt: false,
  aimTargets: undefined,
  ...patch,
});
const fire = (patch: Partial<FireInput>): FireInput => ({
  pressed: false,
  held: false,
  released: false,
  autoFire: false,
  ...patch,
});

function setup() {
  return { loadout: new WeaponLoadout(weapons, TILE_SIZE), pool: new ProjectilePool() };
}

/** Giữ nút bắn đúng `steps` bước rồi thả. */
function holdAndRelease(l: WeaponLoadout, pool: ProjectilePool, steps: number) {
  l.step(fire({ pressed: true, held: true }), ctx(), pool, DT);
  for (let i = 1; i < steps; i += 1) l.step(fire({ held: true }), ctx(), pool, DT);
  return l.step(fire({ released: true }), ctx(), pool, DT);
}

describe('sát thương', () => {
  it('nhân hệ số nạp, công và điểm yếu 2,5 kèm choáng 0,5 giây', () => {
    const hit = outgoingDamage({
      base: 1,
      kindMul: 3,
      attackMul: 1,
      weapon: 'Vine Lash',
      targetWeakness: 'Vine Lash',
      weakMul: 2.5,
      weakStunSec: 0.5,
    });
    expect(hit).toEqual({ amount: 7.5, weak: true, stunSec: 0.5 });
    const normal = outgoingDamage({
      base: 1,
      kindMul: 1,
      attackMul: 1.2,
      weapon: ARC_CANNON,
      targetWeakness: 'Vine Lash',
      weakMul: 2.5,
      weakStunSec: 0.5,
    });
    expect(normal).toEqual({ amount: 1.2, weak: false, stunSec: 0 });
  });

  it('sát thương nhận vào theo độ khó, làm tròn, tối thiểu 1', () => {
    expect(incomingDamage(12, 1)).toBe(12);
    expect(incomingDamage(15, 0.5)).toBe(8);
    expect(incomingDamage(12, 1.5)).toBe(18);
    expect(incomingDamage(1, 0.1)).toBe(1);
    expect(incomingDamage(0, 2)).toBe(0);
  });
});

describe('Arc Cannon', () => {
  it('tối đa 3 đạn thường trên màn hình', () => {
    const { loadout, pool } = setup();
    let fired = 0;
    for (let i = 0; i < 40; i += 1) {
      const press = i % 2 === 0;
      if (
        loadout.step(fire({ pressed: press, released: !press }), ctx(), pool, DT).fired === 'shot'
      )
        fired += 1;
      expect(pool.count('player', ['shot'])).toBeLessThanOrEqual(3);
    }
    expect(fired).toBe(3);
  });

  it('đạn bay hết tầm thì biến mất, bắn tiếp được', () => {
    const { loadout, pool } = setup();
    loadout.step(fire({ pressed: true }), ctx(), pool, DT);
    const rangeSec =
      weapons.arcCannon.projectile.rangeTiles / weapons.arcCannon.projectile.speedTilesPerSec;
    for (let i = 0; i < Math.ceil(rangeSec / DT) + 2; i += 1) pool.update(DT, OPEN);
    expect(pool.count('player')).toBe(0);
  });

  it('đạn đụng tường thì biến mất', () => {
    const map = TileMap.fromRows(['....#', '....#', '#####'], TILE_SIZE);
    const { loadout, pool } = setup();
    loadout.step(fire({ pressed: true }), ctx({ centerX: 8 }), pool, DT);
    for (let i = 0; i < 30; i += 1) pool.update(DT, map);
    expect(pool.count('player')).toBe(0);
  });

  it.each([
    [0.3, undefined],
    [0.6, 'mid'],
    [1.25, 'charged'],
  ])('giữ %f giây rồi thả → %s', (sec, expected) => {
    const { loadout, pool } = setup();
    const ev = holdAndRelease(loadout, pool, Math.round(sec / DT));
    expect(ev.fired).toBe(expected);
  });

  it('đạn nạp đầy: ×3 sát thương, xuyên 1 mục tiêu, phá khiên', () => {
    const { loadout, pool } = setup();
    holdAndRelease(loadout, pool, Math.round(1.25 / DT));
    const charged = pool.all.find((p) => p.kind === 'charged')!;
    expect(charged.kindMul).toBe(3);
    expect(charged.pierceLeft).toBe(1);
    expect(charged.breaksShield).toBe(true);
  });

  it('đạn nạp luôn bắn được khi đã có 3 đạn thường trên màn', () => {
    const { loadout, pool } = setup();
    for (let i = 0; i < 6; i += 2) {
      loadout.step(fire({ pressed: true }), ctx(), pool, DT);
      loadout.step(fire({ released: true }), ctx(), pool, DT);
      loadout.step(fire({}), ctx(), pool, DT);
      loadout.step(fire({}), ctx(), pool, DT);
      loadout.step(fire({}), ctx(), pool, DT);
      loadout.step(fire({}), ctx(), pool, DT);
      loadout.step(fire({}), ctx(), pool, DT);
      loadout.step(fire({}), ctx(), pool, DT);
    }
    expect(pool.count('player', ['shot'])).toBe(3);
    expect(holdAndRelease(loadout, pool, Math.round(1.25 / DT)).fired).toBe('charged');
  });

  it('bị trúng đòn khi đang nạp thì mất hết năng lượng nạp (GDD 5.1)', () => {
    const { loadout, pool } = setup();
    loadout.step(fire({ pressed: true, held: true }), ctx(), pool, DT);
    for (let i = 0; i < 60; i += 1) loadout.step(fire({ held: true }), ctx(), pool, DT);
    expect(loadout.chargeLevel).toBe(1);
    loadout.step(fire({ held: true }), ctx({ hurt: true }), pool, DT);
    expect(loadout.chargeLevel).toBe(0);
  });

  it('tự bắn: giữ nút thì bắn liên tục và vẫn nạp', () => {
    const { loadout, pool } = setup();
    // Tường gần để đạn biến mất nhanh, không chạm giới hạn 3 đạn.
    const near = TileMap.fromRows(['......#', '......#', '#######'], TILE_SIZE);
    let shots = 0;
    if (
      loadout.step(fire({ pressed: true, held: true, autoFire: true }), ctx(), pool, DT).fired ===
      'shot'
    )
      shots += 1;
    for (let i = 0; i < 60; i += 1) {
      if (loadout.step(fire({ held: true, autoFire: true }), ctx(), pool, DT).fired === 'shot')
        shots += 1;
      pool.update(DT, near);
    }
    expect(shots).toBe(6); // 0; 0,2; 0,4; 0,6; 0,8; 1,0 giây
    expect(loadout.chargeLevel).toBe(1);
  });

  it('hỗ trợ ngắm nắn đạn về mục tiêu gần trong dải dọc hẹp, bỏ qua mục tiêu phía sau', () => {
    const { loadout, pool } = setup();
    loadout.step(
      fire({ pressed: true }),
      ctx({
        aimTargets: [
          { x: 120, y: 25 },
          { x: 0, y: 17 },
        ],
      }),
      pool,
      DT,
    );
    expect(pool.all[0]!.vy).toBeGreaterThan(0);
    const other = setup();
    other.loadout.step(
      fire({ pressed: true }),
      ctx({ aimTargets: [{ x: 120, y: 60 }] }),
      other.pool,
      DT,
    );
    expect(other.pool.all[0]!.vy).toBe(0);
  });
});

describe('vũ khí boss và đổi vũ khí', () => {
  it('Vine Lash: roi quét 4 ô, ×2, tốn 4/28 → 7 lần thì hết', () => {
    const { loadout, pool } = setup();
    expect(loadout.grant('Vine Lash')).toBe(true);
    loadout.swap(1);
    expect(loadout.current.name).toBe('Vine Lash');
    let uses = 0;
    for (let i = 0; i < 400; i += 1) {
      const ev = loadout.step(fire({ pressed: i % 30 === 0 }), ctx(), pool, DT);
      if (ev.fired === 'sweep') uses += 1;
      pool.update(DT, OPEN);
    }
    expect(uses).toBe(7);
    const sweep = setup();
    sweep.loadout.grant('Vine Lash');
    sweep.loadout.swap(1);
    sweep.loadout.step(fire({ pressed: true }), ctx(), sweep.pool, DT);
    const p = sweep.pool.all[0]!;
    expect(p.w).toBe(4 * TILE_SIZE);
    expect(p.kindMul).toBe(2);
  });

  it('vũ khí chưa có hành vi thì không thêm được', () => {
    const { loadout } = setup();
    expect(loadout.grant('Ember Burst')).toBe(false);
    expect(loadout.slots).toHaveLength(1);
  });

  it('nạp đầy rồi đổi vũ khí: giữ nạp 2 giây, quá thì tan', () => {
    for (const [awaySec, kept] of [
      [1.5, true],
      [2.5, false],
    ] as const) {
      const { loadout, pool } = setup();
      loadout.grant('Vine Lash');
      loadout.step(fire({ pressed: true, held: true }), ctx(), pool, DT);
      for (let i = 0; i < 80; i += 1) loadout.step(fire({ held: true }), ctx(), pool, DT);
      expect(loadout.chargeLevel).toBe(2);
      loadout.swap(1);
      for (let i = 0; i < Math.round(awaySec / DT); i += 1)
        loadout.step(fire({ held: true }), ctx(), pool, DT);
      loadout.swap(-1);
      expect(loadout.chargeLevel === 2).toBe(kept);
    }
  });

  it('năng lượng tự hồi khi không dùng vũ khí boss một lúc', () => {
    const { loadout, pool } = setup();
    loadout.grant('Vine Lash');
    loadout.swap(1);
    loadout.step(fire({ pressed: true }), ctx(), pool, DT);
    const after = loadout.current.energy;
    for (let i = 0; i < Math.round((weapons.energyRegen.afterNoFireSec + 2) / DT); i += 1) {
      loadout.step(fire({}), ctx(), pool, DT);
    }
    expect(loadout.current.energy).toBeGreaterThan(after);
    expect(loadout.current.energy).toBeLessThanOrEqual(weapons.energyMax);
  });
});
