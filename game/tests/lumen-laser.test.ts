import { describe, expect, it, vi } from 'vitest';
import type { BossBeamAttack } from '../src/core/boss-config';
import { BossBeam } from '../src/logic/boss/boss-beam';
import { laserBox } from '../src/logic/stage/laser-path';

const attack: BossBeamAttack = {
  telegraphSec: 0.8,
  activeSec: 0.5,
  widthPx: 6,
  maxBounces: 2,
  damage: 18,
  selfHitDamage: 10,
  selfHitStunSec: 1.5,
  recoverSec: 0.6,
};
const boss = { x: 27, y: 18, w: 6, h: 12 };
const pathAt = (x: number) => [
  { from: { x: 0, y: 10 }, to: { x, y: 10 } },
  { from: { x, y: 10 }, to: { x, y: 32 } },
];

describe('Lumen beam path lock', () => {
  it('snapshots both endpoints and uses exactly the advertised geometry to damage', () => {
    const beam = new BossBeam();
    const geometry = pathAt(30);
    let turns = 0;
    const trace = vi.fn(() => geometry);
    beam.begin({ x: 0, turns: () => turns, trace }, true);
    beam.warn(attack);
    const advertised = beam.warnings[0]!;
    expect(advertised.path).toEqual(pathAt(30));
    expect(trace).toHaveBeenCalledExactlyOnceWith(false, 2);
    geometry[0]!.from.y = 24;
    geometry[0]!.to.x = 40;
    geometry[1]!.from.x = 40;
    geometry[1]!.to.y = 70;
    turns += 1;
    beam.warn(attack);
    expect(beam.warnings[0]).toBe(advertised);
    expect(beam.fire(attack, false, boss)).toBe(false);
    expect(trace).toHaveBeenCalledTimes(1);
    expect(beam.pulses[0]!.path).toBe(advertised.path);
    expect(beam.pulses[0]!.boxes).toEqual(pathAt(30).map((leg) => laserBox(leg, attack.widthPx)));
    expect(beam.pulses[0]!.damage).toBe(18);
  });

  it('caches the warning variant independently and never fires an unannounced variant', () => {
    const beam = new BossBeam();
    let mirrorX = 30;
    const trace = vi.fn((alternate: boolean) => pathAt(mirrorX + (alternate ? 16 : 0)));
    beam.begin({ x: 0, turns: () => 0, trace }, true);
    expect(beam.fire(attack, false, boss)).toBe(false);
    expect(beam.pulses).toHaveLength(0);
    beam.warn(attack);
    expect(beam.fire(attack, true, boss)).toBe(false);
    expect(beam.pulses).toHaveLength(0);
    const double = { ...attack, pulseGapSec: 0.4 };
    beam.warn(double);
    expect(beam.warnings.map((line) => line.path)).toEqual([pathAt(30), pathAt(46)]);
    mirrorX = 100;
    beam.warn(double, true);
    expect(beam.warnings.map((line) => line.path)).toEqual([pathAt(46)]);
    beam.fire(double, true, boss);
    expect(trace).toHaveBeenCalledTimes(2);
    expect(beam.pulses[0]!.path).toEqual(pathAt(46));
  });

  it('clears canceled and superseded paths without changing an already-fired pulse', () => {
    const beam = new BossBeam();
    const route = (x: number) => ({ x, turns: () => 0, trace: () => pathAt(x) });
    beam.begin(route(30), true);
    beam.warn(attack);
    beam.fire(attack, false, boss);
    beam.begin(route(60), true);
    expect(beam.warnings).toHaveLength(0);
    expect(beam.fire(attack, false, boss)).toBe(false);
    expect(beam.pulses.map((pulse) => pulse.path)).toEqual([pathAt(30)]);
    beam.warn(attack);
    beam.cancelPending();
    expect(beam.fire(attack, false, boss)).toBe(false);
    expect(beam.pulses).toHaveLength(1);
    beam.clear();
    beam.warn(attack);
    expect(beam.warnings).toHaveLength(0);
    expect(beam.fire(attack, false, boss)).toBe(false);
    expect(beam.pulses).toHaveLength(0);
  });

  it('leaves the existing rotatable mirror trace and reflection counter dynamic', () => {
    const beam = new BossBeam();
    let turns = 0;
    const trace = vi.fn(() => pathAt(turns === 0 ? 10 : 30));
    beam.begin({ x: 0, turns: () => turns, trace });
    beam.warn(attack);
    expect(beam.warnings[0]!.path).toEqual(pathAt(10));
    turns += 1;
    beam.warn(attack);
    expect(beam.warnings[0]!.path).toEqual(pathAt(30));
    expect(beam.fire(attack, false, boss)).toBe(true);
    expect(beam.pulses[0]!.path).toEqual(pathAt(30));
    expect(beam.fire(attack, false, boss)).toBe(false);
    expect(trace).toHaveBeenCalledTimes(4);
  });
});
