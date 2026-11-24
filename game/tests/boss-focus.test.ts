import { describe, expect, it } from 'vitest';
import type { FocusAttack } from '../src/core/boss-config';
import { BossFocus } from '../src/logic/boss/boss-focus';

const focus: FocusAttack = {
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

const tileSize = 16;
const box = (x: number, y: number) => ({ x, y, w: 3, h: 3 });

describe('Lumen Tiêu Điểm', () => {
  it('stages three overlapping circles without moving a previously locked airborne point', () => {
    const attack = new BossFocus();
    attack.begin(focus, tileSize, 1, 0.5);
    expect(attack.marks).toHaveLength(0);
    attack.step(30, 50, 0);
    expect(attack.marks).toMatchObject([{ x: 30, y: 50, radius: 16, phase: 'track' }]);
    attack.step(45, 25, 0.599);
    expect(attack.marks).toMatchObject([{ x: 45, y: 25, phase: 'track' }]);
    attack.step(50, 20, 0.001);
    expect(attack.marks.map((mark) => mark.phase)).toEqual(['track', 'track']);
    attack.step(60, 12, 0.3);
    expect(attack.marks).toMatchObject([
      { x: 60, y: 12, phase: 'lock' },
      { x: 60, y: 12, phase: 'track' },
    ]);
    attack.step(101, 90, 0.3);
    expect(attack.marks).toMatchObject([
      { x: 60, y: 12, phase: 'lock' },
      { x: 101, y: 90, phase: 'track' },
      { x: 101, y: 90, phase: 'track' },
    ]);
    expect(attack.hit(box(60, 12))).toBe(false);
    attack.step(120, 101, 0.3);
    expect(attack.marks).toMatchObject([
      { x: 60, y: 12, phase: 'burn' },
      { x: 120, y: 101, phase: 'lock' },
      { x: 120, y: 101, phase: 'track' },
    ]);
    expect(attack.hit(box(60, 12))).toBe(true);
    expect(attack.hit(box(120, 101))).toBe(false);
  });

  it('uses circle geometry rather than damaging the corners of its bounding square', () => {
    const attack = new BossFocus();
    attack.begin({ ...focus, count: 1 }, tileSize, 1, 0.5);
    attack.step(100, 78, 1.5);
    expect(attack.hit(box(112, 90))).toBe(false);
    expect(attack.hit(box(111, 89))).toBe(true);
    expect(attack.hit(box(116, 78))).toBe(false);
    expect(attack.hit(box(115, 78))).toBe(true);
  });

  it('does not burn early at phase speed, or shorten a timed burn', () => {
    const attack = new BossFocus();
    attack.begin({ ...focus, count: 1 }, tileSize, 1.2, 0.5);
    attack.step(55, 55, 0.75);
    expect(attack.marks[0]?.phase).toBe('lock');
    attack.step(65, 65, 0.499);
    expect(attack.hit(box(55, 55))).toBe(false);
    attack.step(65, 65, 0.001);
    expect(attack.hit(box(55, 55))).toBe(true);
    attack.step(65, 65, 0.299);
    expect(attack.hit(box(55, 55))).toBe(true);
    expect(attack.done).toBe(false);
    attack.step(65, 65, 0.001);
    expect(attack.hit(box(55, 55))).toBe(false);
    expect(attack.done).toBe(true);
    expect(attack.marks).toHaveLength(0);
  });

  it('clears burned and queued marks on reset without changing a restarted encounter', () => {
    const attack = new BossFocus();
    attack.begin(focus, tileSize, 1, 0.5);
    attack.step(70, 70, 1.5);
    expect(attack.hit(box(70, 70))).toBe(true);
    attack.clear();
    attack.step(70, 70, 1);
    expect(attack.done).toBe(true);
    expect(attack.hit(box(70, 70))).toBe(false);
    expect(attack.marks).toHaveLength(0);
    attack.begin(focus, tileSize, 1, 0.5);
    expect(attack.done).toBe(false);
    attack.step(20, 15, 0);
    expect(attack.marks).toMatchObject([{ x: 20, y: 15, phase: 'track' }]);
  });

  it('consumes only a successful hit, once per mark even while burning circles overlap', () => {
    const attack = new BossFocus();
    const target = box(70, 70);
    attack.begin({ ...focus, count: 2, markIntervalSec: 0.1 }, tileSize, 1, 0.5);
    attack.step(70, 70, 1.5);
    const hit = attack.pendingHit(target);
    expect(hit).toMatchObject({ id: 0, x: 70 });
    // A failed damage attempt must leave the first mark available.
    expect(attack.pendingHit(target)).toBe(hit);
    attack.step(70, 70, 0.15);
    attack.consumeHit(0);
    expect(attack.pendingHit(target)).toMatchObject({ id: 1, x: 70 });
    attack.consumeHit(1);
    expect(attack.pendingHit(target)).toBeUndefined();
    expect(attack.hit(target)).toBe(true);
    expect(attack.marks.map((mark) => mark.phase)).toEqual(['burn', 'burn']);
  });

  it('waits for the final scheduled burn even if the active list is temporarily empty', () => {
    const attack = new BossFocus();
    attack.begin({ ...focus, count: 2, markIntervalSec: 3 }, tileSize, 1, 0.5);
    attack.step(50, 50, 2);
    expect(attack.marks).toHaveLength(0);
    expect(attack.done).toBe(false);
    attack.step(75, 40, 1);
    expect(attack.marks).toMatchObject([{ x: 75, y: 40, phase: 'track' }]);
    attack.step(100, 20, 1.8);
    expect(attack.done).toBe(true);
  });
});
