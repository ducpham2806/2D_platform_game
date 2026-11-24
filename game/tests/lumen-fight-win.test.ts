import { expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { bossFor, parseGameConfig } from '@/core/game-config';
import { LUMEN_QA_LEVEL, LUMEN_QA_SEED } from '@/qa/lumen-qa';
import { ARC_CANNON } from '@/logic/combat/loadout';
import { laserBox } from '@/logic/stage/laser-path';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldInput } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;
const T = TILE_SIZE;
const FLOOR = 11 * T;
const NORMAL = config.difficulties.find((d) => d.id === 'normal')!;

/**
 * Control-only diagnostic, not a human playtest or a speedrun.
 * Uses the shipped room, default gear, and the intended level-5 balance profile.
 * No aim assist, charge shots, healing, damage edits, or direct player movement.
 */
function simulate(seed: number) {
  const world = new StageWorld({
    layout: buildStageLayout(STAGE_DEFS.lumen, T),
    tileSize: T,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: bossFor(config, 'lumen', NORMAL.newAttackPatterns)!,
    difficulty: NORMAL,
    mechanics: config.stages.mechanics,
    seed,
    level: LUMEN_QA_LEVEL,
  });
  for (let i = 0; world.phase === 'explore' && i < 300; i += 1)
    world.step({ ...IDLE_INPUT, moveX: 1 });
  expect(world.phase).toBe('boss');
  expect(world.boss?.hp).toBe(280);
  expect(world.loadout.slots.map((slot) => slot.name)).toEqual([ARC_CANNON]);

  const boss = world.boss!;
  const arena = world.arena!;
  let jumpUntil = -1;
  let rainX: number | undefined;
  const hits: Record<string, number> = {};
  const phases = new Set<number>();
  const attacks = new Set<string>();
  let duration = 0;
  let shots = 0;
  let connected = 0;
  let firedLastTick = false;
  let lastFire = -100;
  let dashLast = false;
  let jumpHeldLast = false;
  let reward: string | undefined;
  let died = false;
  for (let tick = 0; tick * DT < 120; tick += 1) {
    const p = world.player;
    duration = (tick + 1) * DT;
    phases.add(boss.phase);
    if (boss.state === 'active' && boss.attack) attacks.add(boss.attack);
    const anchor = boss.anchors!.current;
    const high = anchor.y < 8 * T;
    // Left perch's safe lip is outside; right perch's safe lip faces the middle.
    const side = high ? -1 : p.centerX < anchor.x ? -1 : 1;
    let targetX = anchor.x + side * (high ? 1.6 : 1.45) * T;
    const roots = boss.attack === 'roots' ? boss.rootXs : [];
    const nearRoot = (x: number) => roots.some((rootX) => Math.abs(x - rootX) < 0.9 * T);
    if (roots.length) {
      const spots = [p.centerX, p.centerX - T, p.centerX + T, p.centerX - 2 * T, p.centerX + 2 * T];
      targetX =
        spots.find(
          (x) => x > (arena.first + 0.5) * T && x < (arena.last + 0.5) * T && !nearRoot(x),
        ) ?? targetX;
    }
    if (boss.attack === 'rain' && (boss.state === 'telegraph' || boss.state === 'active')) {
      const safe: number[] = [];
      for (let col = arena.first; col <= arena.last - 1; col += 1)
        if (!boss.rainCols.includes(col) && !boss.rainCols.includes(col + 1))
          safe.push((col + 1) * T);
      rainX ??= safe.sort((a, b) => Math.abs(a - p.centerX) - Math.abs(b - p.centerX))[0];
      if (rainX !== undefined) targetX = rainX;
    } else rainX = undefined;

    const lines = [...boss.beam.warnings, ...boss.beam.pulses];
    const beamBoxes = lines.flatMap((line) => line.path.map((leg) => laserBox(leg, 6)));
    const beamAt = (x: number, y: number, h: number) =>
      beamBoxes.some(
        (b) =>
          b.x < x + p.box.w / 2 + 1 &&
          b.x + b.w > x - p.box.w / 2 - 1 &&
          b.y < y + h &&
          b.y + b.h > y,
      );
    let canEvadeBeamOnFloor = true;
    if (lines.length && beamAt(targetX, FLOOR - p.box.h, p.box.h)) {
      canEvadeBeamOnFloor = false;
      for (const delta of [T, -T, 2 * T, -2 * T, 3 * T, -3 * T]) {
        const spot = targetX + delta;
        if (
          spot > (arena.first + 0.5) * T &&
          spot < (arena.last + 0.5) * T &&
          !beamAt(spot, FLOOR - p.box.h, p.box.h)
        ) {
          canEvadeBeamOnFloor = true;
          targetX = spot;
          break;
        }
      }
    }
    const dx = targetX - p.centerX;
    const direction = Math.sign(dx);
    let moveX = Math.abs(dx) > 2 ? direction : 0;
    const lowOnGround = p.grounded && p.bottom > FLOOR - 6;
    const incoming = world.pool.all.filter(
      (s) =>
        s.alive &&
        s.owner === 'enemy' &&
        s.kind === 'enemyShot' &&
        Math.sign(s.vx) === Math.sign(p.centerX - s.x),
    );
    const lowShot = incoming.some(
      (s) => Math.abs(s.x - p.centerX) < 1.05 * T && s.y + s.h > p.box.y && s.y < p.bottom,
    );
    const jumpInShotLane =
      incoming.some((s) => Math.abs(s.x - p.centerX) < 7 * T && s.y < p.box.y - 2) ||
      (boss.attack === 'shot' &&
        (boss.state === 'telegraph' || boss.state === 'active') &&
        boss.shotLaneY < p.box.y - 2);
    const onPerch = p.grounded && p.bottom < FLOOR - 2 * T;
    const beamThreat = beamAt(p.centerX, p.box.y, p.box.h);
    const shotThreat =
      boss.attack === 'shot' &&
      boss.state === 'telegraph' &&
      Math.abs(boss.shotLaneY - (p.box.y + p.box.h / 2)) < p.box.h / 2;
    const crossing = Math.sign(p.centerX - boss.centerX) !== Math.sign(targetX - boss.centerX);
    const down = onPerch && (crossing || !high || beamThreat || shotThreat || rainX !== undefined);
    const horizontalBeam =
      lines.length &&
      !canEvadeBeamOnFloor &&
      beamThreat &&
      boss.state === 'telegraph' &&
      boss.telegraphProgress > 0.65;
    const dash = p.grounded && !p.dashing && !down && rainX === undefined && Math.abs(dx) > 4.2 * T;
    const dashPressed: boolean = dash && !dashLast;
    dashLast = dashPressed;
    const jump =
      down ||
      (lowOnGround && Boolean(horizontalBeam)) ||
      (lowOnGround &&
        rainX === undefined &&
        !lines.length &&
        ((lowShot && !crossing) ||
          (high &&
            Math.abs(dx) < 9 &&
            !crossing &&
            !roots.length &&
            !jumpInShotLane &&
            (boss.attack !== 'shot' || boss.state !== 'telegraph'))));
    // A new jump requires a release first, even when Kai lands early on a perch.
    if (jump) jumpUntil = jumpHeldLast ? tick : tick + (lowShot ? 12 : 26);
    const jumpHeld = tick < jumpUntil;
    const jumpPressed = jumpHeld && !jumpHeldLast;
    jumpHeldLast = jumpHeld;

    const facing = Math.sign(boss.centerX - p.centerX);
    if (moveX === 0 && p.facing !== facing && Math.abs(boss.centerX - p.centerX) > 2 * T)
      moveX = facing;
    const muzzleY = p.box.y + config.weapons.arcCannon.muzzleOffsetPx.y;
    // Fire as Kai lines up a jump, not only at exact box overlap. Misses use the real pool.
    const aimed =
      Math.abs(p.centerX - boss.centerX) < 14 * T &&
      muzzleY > boss.box.y - T &&
      muzzleY < boss.box.y + boss.box.h + T &&
      Math.sign((p.dashing ? 0 : moveX) || p.facing) === facing;
    const press: boolean = !firedLastTick && tick - lastFire >= 8 && aimed;
    const input: WorldInput = {
      ...IDLE_INPUT,
      moveX,
      dashPressed,
      downHeld: down && jumpPressed,
      jumpPressed,
      jumpHeld,
      shootPressed: press,
      shootHeld: press,
      shootReleased: firedLastTick,
    };
    firedLastTick = press;
    const ev = world.step(input);
    if (ev.fired) {
      expect(ev.fired).toBe('shot');
      shots += 1;
      lastFire = tick;
    }
    if (ev.hitBoss) connected += 1;
    if (ev.playerHurt && ev.hurtBy) hits[ev.hurtBy] = (hits[ev.hurtBy] ?? 0) + 1;
    reward ??= ev.weaponGranted;
    died ||= ev.playerDied;
    if (died || ev.bossDefeated) break;
  }
  return {
    outcome: world.phase === 'won' ? 'win' : died ? 'died' : 'timeout',
    duration,
    shots,
    shotRate: shots / duration,
    connected,
    hits,
    reward,
    phases: [...phases],
    attacks: [...attacks],
    hp: world.player.hp,
    bossHp: boss.hp,
    damage: Object.fromEntries(world.bossDamage),
    exp: world.exp,
    coreBits: world.coreBits,
  };
}

it.each([LUMEN_QA_SEED, 42, 257, 1234, 1013, 707, 179])(
  'wins the complete level-5 Normal fight with Arc Cannon and standard input only (seed %i)',
  (seed) => {
    const run = simulate(seed);
    console.info('Lumen Arc Cannon win:', JSON.stringify({ seed, ...run }));
    expect(run).toMatchObject({
      outcome: 'win',
      phases: [0, 1, 2],
      bossHp: 0,
      reward: 'Prism Beam',
      exp: 241,
      coreBits: 110,
    });
    expect(new Set(run.attacks)).toEqual(new Set(['shot', 'beam', 'roots', 'rain']));
    expect(Object.keys(run.damage)).toEqual([ARC_CANNON]);
    expect(run.duration).toBeGreaterThanOrEqual(60);
    expect(run.duration).toBeLessThanOrEqual(90);
    expect(run.shotRate / 7.5).toBeGreaterThanOrEqual(0.5);
    expect(run.shotRate / 7.5).toBeLessThanOrEqual(0.75);
    expect(run.hp).toBeGreaterThan(0);
  },
);
