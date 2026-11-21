import { describe, expect, it } from 'vitest';
import { FIXED_STEP_HZ, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { enemyProjectile } from '@/logic/boss/enemy-projectile';
import { GALE_CUTTER } from '@/logic/combat/loadout';
import { TrainingTarget } from '@/logic/combat/targets';
import type { StageLayout } from '@/logic/stage/layout';
import { Tile } from '@/logic/tilemap';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldEvents, type WorldInput } from '@/logic/world/world-types';
import { GALE_ROOM } from '@/stages/gale-room';
import { buildStageLayout } from '@/stages/stage-def';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const t = TILE_SIZE;
const dt = 1 / FIXED_STEP_HZ;
const ground = 10 * t;
const weapon = config.weapons.bossWeapons.find((w) => w.name === GALE_CUTTER)!;
const behavior = weapon.behavior;
if (behavior?.type !== 'boomerang' || weapon.energyCost === null)
  throw new Error('Thiếu Gale Cutter');
const gale = behavior;
const cost = weapon.energyCost;
const damage = config.weapons.arcCannon.damage * gale.damageMul;
const chest = 'armor_cache_arm_mk1';

function world(withTurret = false, edit?: (layout: StageLayout) => void): StageWorld {
  const layout = buildStageLayout(GALE_ROOM, t);
  if (!withTurret) layout.enemies.length = 0;
  edit?.(layout);
  const w = new StageWorld({
    layout,
    tileSize: t,
    stepSec: dt,
    player: config.player,
    weapons: config.weapons,
    boss: { ...config.bosses.gray!, weakness: GALE_CUTTER },
    enemies: config.enemies,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    mechanics: config.stages.mechanics,
    seed: 4,
    ownedWeapons: [GALE_CUTTER],
  });
  w.loadout.swap(1);
  return w;
}

function step(w: StageWorld, patch: Partial<WorldInput> = {}): WorldEvents {
  return w.step({ ...IDLE_INPUT, ...patch });
}

const fire = (w: StageWorld) => step(w, { shootPressed: true });
const blade = (w: StageWorld) => w.pool.all.find((p) => p.alive && p.kind === 'boomerang');

function until(w: StageWorld, done: (ev: WorldEvents) => boolean): WorldEvents {
  for (let i = 0; i < 180; i += 1) {
    const ev = step(w);
    if (done(ev)) return ev;
  }
  throw new Error('Chưa thấy sự kiện trong số bước giới hạn');
}

describe('Gale Cutter (ST-15-05, GDD 16 mục 5.7)', () => {
  it.each([1, -1] as const)('QB-11–13: hướng %d, đi đủ tầm, ném lại sau khi đón', (facing) => {
    const w = world();
    w.player.respawn(120, ground);
    w.player.facing = facing;
    expect(step(w, { shootHeld: true, shootReleased: true, autoFire: true }).fired).toBeUndefined();
    expect(fire(w).fired).toBe('boomerang');
    const p = blade(w)!;
    expect(p).toMatchObject({
      weapon: GALE_CUTTER,
      w: gale.sizePx.w,
      h: gale.sizePx.h,
      vx: facing * gale.speedTilesPerSec * t,
      vy: 0,
    });
    expect(w.loadout.current.energy).toBe(config.weapons.energyMax - cost);
    step(w, { swapNext: true });
    expect(step(w, { swapNext: true, shootPressed: true }).fired).toBeUndefined();
    expect(w.loadout.current.energy).toBe(config.weapons.energyMax - cost);
    until(w, () => p.boomerang?.phase === 'turn');
    expect(p.traveled).toBeCloseTo(gale.outTiles * t);
    expect(p.x + p.w / 2).toBeCloseTo(120 + facing * gale.outTiles * t);
    // Bỏ hướng ném cũ; chiều về đuổi theo Kai dù đã đổi vị trí cả hai trục.
    w.player.respawn(132, ground - 2 * t);
    step(w);
    expect(p.boomerang?.phase).toBe('return');
    expect(Math.sign(p.vx)).toBe(-facing);
    expect(p.vy).toBeLessThan(0);
    until(w, () => !blade(w));
    expect(fire(w).fired).toBe('boomerang');
    expect(w.loadout.current.energy).toBe(config.weapons.energyMax - cost * 2);
    until(w, () => !blade(w));
    w.loadout.current.energy = cost / 2;
    expect(fire(w)).toMatchObject({ emptyWeapon: true, fired: undefined });
    expect(w.loadout.current.energy).toBe(cost / 2);
  });

  it('xuyên qua địch và bia, mỗi mục tiêu trúng một lần mỗi chiều', () => {
    const w = world(true);
    w.player.respawn(120, ground);
    const turret = w.enemies[0]!;
    const target = new TrainingTarget(999, { x: 150, y: ground - 20, w: 12, h: 20 }, 3, 0, 2);
    w.targets.push(target);
    fire(w);
    until(w, () => blade(w)?.boomerang?.phase === 'turn');
    expect(target.hp).toBe(target.maxHp - damage);
    expect(turret.hp).toBe(turret.maxHp - damage);
    until(w, () => !blade(w));
    expect(target.hp).toBe(target.maxHp - 2 * damage);
    expect(turret.hp).toBe(turret.maxHp - 2 * damage);
  });

  it('QB-14: ghi sát thương điểm yếu cả hai chiều, giữ nhịp chống khóa choáng', () => {
    const w = world(false, (layout) => {
      layout.boss = { col: 6, row: 9 };
      layout.gate = { col: 1, rows: [8, 9] };
    });
    w.phase = 'boss';
    w.boss!.activate();
    fire(w);
    until(w, (ev) => ev.weakHit);
    expect(w.boss!.stunned).toBe(true);
    until(w, (ev) => ev.weakHit);
    expect(w.bossDamage.get(GALE_CUTTER)).toBe(2 * damage * weapon.damageVsWeak);
    expect(w.bossWeakHits).toBe(2);
  });

  it('QB-31: lưỡi tan khi trúng boss đang bất tử đổi pha', () => {
    const w = world(false, (layout) => {
      layout.boss = { col: 6, row: 9 };
      layout.gate = { col: 1, rows: [8, 9] };
    });
    w.phase = 'boss';
    const boss = w.boss!;
    boss.activate();
    boss.takeHit({ amount: boss.hp, weak: false, stunSec: 0 });
    expect(boss.shifting).toBe(true);
    const hp = boss.hp;
    fire(w);
    expect(until(w, (ev) => ev.bossImmune).hitBoss).toBe(false);
    expect(boss.hp).toBe(hp);
    expect(blade(w)).toBeUndefined();
  });

  it('khiên chặn mặt trước, chiều về đánh được mặt sau', () => {
    const w = world();
    const target = new TrainingTarget(1, { x: 80, y: ground - 20, w: 12, h: 20 }, 3, -1, 2);
    w.targets.push(target);
    fire(w);
    until(w, (ev) => ev.blocked);
    expect(blade(w)).toBeDefined();
    expect(target.hp).toBe(target.maxHp);
    until(w, () => !blade(w));
    expect(target.hp).toBe(target.maxHp - damage);
    expect(target.shieldUp).toBe(true);
  });

  it('tường chặn chiều đi, chiều về vẫn bắt được Kai qua địa hình', () => {
    const w = world();
    w.map.set(6, 9, Tile.Solid);
    fire(w);
    until(w, () => blade(w)?.boomerang?.phase === 'turn');
    expect(blade(w)!.x + blade(w)!.w).toBeLessThanOrEqual(6 * t);
    expect(blade(w)!.traveled).toBeLessThan(gale.outTiles * t);
    w.player.respawn(8 * t, ground);
    until(w, () => !blade(w));
    expect(fire(w).fired).toBe('boomerang');
  });

  it('Q4: cùng hạn mức trên hai chiều, hủy trước khi đạn gây sát thương cho Kai', () => {
    const w = world();
    const y = ground - 14;
    const shot = (
      kind: 'enemyShot' | 'bomb' | 'shockwave',
      x: number,
      fromRegularEnemy: boolean,
      source?: string,
    ) =>
      w.pool.spawn({
        ...enemyProjectile(t, kind, x, y, { w: 5, h: 6 }, 0, 0, 25),
        fromRegularEnemy,
        ...(source === undefined ? {} : { source }),
      });
    const first = shot('enemyShot', w.player.centerX + 2, true, 'enemy:thap_phao_tap_su');
    expect(fire(w).playerHurt).toBe(false);
    expect(first.alive).toBe(false);
    expect(w.player.hp).toBe(w.player.maxHp);
    const p = blade(w)!;
    expect(p.boomerang!.cancelsLeft).toBe(gale.maxCancelsPerThrow - 1);
    until(w, () => p.boomerang?.phase === 'turn');
    const boss = shot('enemyShot', p.x, false);
    const mini = shot('bomb', p.x, false, 'enemy:bramble_golem');
    const wave = shot('shockwave', p.x, true, 'enemy:thap_phao_tap_su');
    const second = shot('bomb', p.x, true, 'enemy:buom_sat');
    const third = shot('enemyShot', p.x, true, 'enemy:thap_phao_tap_su');
    step(w);
    expect(second.alive).toBe(false);
    expect(p.boomerang!.cancelsLeft).toBe(0);
    for (const protectedShot of [boss, mini, wave, third]) expect(protectedShot.alive).toBe(true);
    until(w, () => !blade(w));
    expect(fire(w).fired).toBe('boomerang');
    expect(blade(w)!.boomerang!.cancelsLeft).toBe(gale.maxCancelsPerThrow);
  });

  it('Q4: viên do tháp pháo bắn có nguồn địch thường và bị hủy trong phòng thử', () => {
    const w = world(true);
    w.player.respawn(116, ground);
    until(w, () => w.pool.count('enemy', ['enemyShot']) > 0);
    const shot = w.pool.all.find((p) => p.kind === 'enemyShot')!;
    expect(shot).toMatchObject({ source: 'enemy:thap_phao_tap_su', fromRegularEnemy: true });
    fire(w);
    until(w, () => !shot.alive || w.player.hp < w.player.maxHp);
    expect(shot.alive).toBe(false);
    expect(blade(w)!.boomerang!.cancelsLeft).toBe(gale.maxCancelsPerThrow - 1);
    expect(w.player.hp).toBe(w.player.maxHp);
  });

  it('Q4: bom thật của Golem có nhãn đo lường nhưng không mang nguồn địch thường', () => {
    const w = world(false, (layout) => {
      layout.enemies.push({ col: 10, row: 9, enemy: 'bramble_golem', harmless: true });
    });
    const mini = w.enemies[0]!;
    mini.hp = mini.maxHp / 4;
    const ctx = { playerX: w.player.centerX, playerY: ground, pool: w.pool, map: w.map };
    for (let i = 0; i < 180 && w.pool.count('enemy', ['bomb']) === 0; i += 1) mini.step(ctx, dt);
    expect(w.pool.all.find((p) => p.kind === 'bomb')).toMatchObject({
      source: 'enemy:bramble_golem',
      fromRegularEnemy: false,
    });
  });

  it('mở sương đúng vũ khí, giữ qua hồi sinh và đi qua nhặt được Két Tay Mk I', () => {
    const w = world();
    const mist = w.barriers[0]!;
    w.player.respawn(144, ground);
    w.loadout.swap(1);
    expect(fire(w).fired).toBe('shot');
    until(w, () => w.pool.count('player') === 0);
    expect(mist.broken).toBe(false);
    expect(w.map.get(14, 9)).toBe(Tile.Solid);
    w.loadout.swap(1);
    fire(w);
    until(w, (ev) => ev.barrierBroken);
    expect(mist.broken).toBe(true);
    for (let row = 7; row <= 9; row += 1) expect(w.map.get(14, row)).toBe(Tile.Empty);
    expect(blade(w)!.boomerang?.phase).toBe('turn');
    w.player.state = 'dead';
    expect(step(w).playerDied).toBe(true);
    expect(blade(w)).toBeUndefined();
    until(w, (ev) => ev.respawned);
    expect(mist.broken).toBe(true);
    for (let i = 0; i < 180 && !w.collected.includes(chest); i += 1) step(w, { moveX: 1 });
    expect(w.collected).toEqual([chest]);
    expect(w.secrets[0]!.taken).toBe(true);
    expect(world().barriers[0]!.broken).toBe(false);
  });
});
