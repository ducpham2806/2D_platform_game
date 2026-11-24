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
function simulate(level: number, seed: number, fireSlots: number) {
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
    level,
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
  let reward: string | undefined;
  let died = false;
  for (let tick = 0; tick * DT < 120; tick += 1) {
    const p = world.player;
    duration = (tick + 1) * DT;
    phases.add(boss.phase);
    if (boss.state === 'active' && boss.attack) attacks.add(boss.attack);
    const high = boss.anchors!.current.y < 8 * T;
    const side =
      boss.centerX < 27 * T ? -1 : boss.centerX > 28 * T ? 1 : p.centerX < boss.centerX ? -1 : 1;
    let targetX = boss.centerX + side * (high ? 1.45 : 2.2) * T;
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
    if (lines.length && beamAt(targetX, FLOOR - p.box.h, p.box.h)) {
      for (const delta of [T, -T, 2 * T, -2 * T, 3 * T, -3 * T]) {
        const spot = targetX + delta;
        if (
          spot > (arena.first + 0.5) * T &&
          spot < (arena.last + 0.5) * T &&
          !beamAt(spot, FLOOR - p.box.h, p.box.h)
        ) {
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
      (s) => Math.abs(s.x - p.centerX) < 1.6 * T && s.y + s.h > p.box.y && s.y < p.bottom,
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
    const jump =
      down ||
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
    if (jump) jumpUntil = tick + (lowShot ? 15 : 28);

    const wantFire = Math.floor(tick / 8) % 10 < fireSlots;
    const facing = Math.sign(boss.centerX - p.centerX);
    if (moveX === 0 && p.facing !== facing && Math.abs(boss.centerX - p.centerX) > 2 * T)
      moveX = facing;
    const muzzleY = p.box.y + config.weapons.arcCannon.muzzleOffsetPx.y;
    const inRange =
      Math.abs(p.centerX - boss.centerX) < 12 * T &&
      muzzleY > boss.box.y &&
      muzzleY < boss.box.y + boss.box.h;
    const press =
      (inRange || wantFire) && tick % 8 === 0 && Math.sign(moveX || p.facing) === facing;
    const input: WorldInput = {
      ...IDLE_INPUT,
      moveX,
      downHeld: down,
      jumpPressed: jump,
      jumpHeld: tick < jumpUntil,
      shootPressed: press,
      shootHeld: press,
      shootReleased: firedLastTick,
    };
    firedLastTick = press;
    const ev = world.step(input);
    if (ev.fired) shots += 1;
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

it.each([LUMEN_QA_SEED, 42])(
  'drives the full level-5 Arc Cannon attempt with input only (seed %i)',
  (seed) => {
    const run = simulate(LUMEN_QA_LEVEL, seed, 7);
    console.info('Lumen input-only timing:', JSON.stringify(run));
    expect(run.phases).toEqual([0, 1, 2]);
    expect(new Set(run.attacks)).toEqual(new Set(['shot', 'beam', 'roots', 'rain']));
    expect(Object.keys(run.damage)).toEqual([ARC_CANNON]);
    expect(run.connected).toBeGreaterThan(0);
    expect(run.shots).toBeGreaterThanOrEqual(run.connected);
    expect(run.duration).toBeGreaterThan(0);
    expect(run.outcome).not.toBe('timeout');
    if (run.outcome === 'win') {
      expect(run).toMatchObject({ bossHp: 0, reward: 'Prism Beam', exp: 241, coreBits: 110 });
    } else {
      expect(run).toMatchObject({ hp: 0, reward: undefined, exp: 0, coreBits: 0 });
      expect(run.bossHp).toBeGreaterThan(0);
    }
  },
);
