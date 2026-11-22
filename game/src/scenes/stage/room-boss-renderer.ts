import type Phaser from 'phaser';
import { laserBox } from '../../logic/stage/laser-path';
import type { LockedRoom } from '../../logic/world/stage-mechanics';

const PRIMARY_BEAM = 0xff787f;
const FOLLOW_UP_BEAM = 0xcb92ff;

export function drawRoomBoss(
  g: Phaser.GameObjects.Graphics,
  room: LockedRoom,
  tileSize: number,
  timeMs: number,
): void {
  const boss = room.miniBoss?.boss;
  if (!boss || boss.state === 'dead') return;
  const arena = room.inner(tileSize);
  for (const warning of boss.beam.warnings) {
    g.fillStyle(warning.alternate ? FOLLOW_UP_BEAM : PRIMARY_BEAM, 0.78);
    for (const leg of warning.path) {
      const b = laserBox(leg, 1);
      g.fillRect(b.x, b.y, b.w, b.h);
    }
  }
  for (const pulse of boss.beam.pulses) {
    g.fillStyle(pulse.alternate ? FOLLOW_UP_BEAM : PRIMARY_BEAM, 1);
    for (const b of pulse.boxes) g.fillRect(b.x, b.y, b.w, b.h);
  }
  const { x, y, w, h } = boss.box;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const prism = boss.data.id === 'prism_sentinel';
  const warning = boss.state === 'telegraph';
  if (warning && boss.attack === 'dive' && boss.diveLine) {
    const { from, to } = boss.diveLine;
    g.lineStyle(1, 0xffd166, 0.6 + boss.telegraphProgress * 0.4);
    g.lineBetween(from.x, from.y, to.x, to.y).strokeCircle(to.x, to.y, 4);
  }
  if (warning && boss.attack === 'charge') {
    g.lineStyle(2, 0xffd166, 0.7).lineBetween(
      cx,
      cy,
      boss.facing > 0 ? arena.x + arena.w : arena.x,
      cy,
    );
  }
  if (warning && boss.attack === 'rain') {
    g.fillStyle(0xffad70, 0.28);
    for (const col of boss.rainCols)
      g.fillRect(col * tileSize + 2, arena.y + tileSize, tileSize - 4, arena.h - tileSize);
  }
  if (boss.gust) {
    const sign = boss.gust.direction;
    const alpha = 0.25 + 0.25 * Math.abs(Math.sin(timeMs / 100));
    g.lineStyle(1, 0xc2f3ff, alpha);
    for (
      let start = arena.x + tileSize;
      start < arena.x + arena.w - tileSize;
      start += 2 * tileSize
    ) {
      const tip = start + 9 * sign;
      g.lineBetween(start, cy + 4, tip, cy + 4)
        .lineBetween(tip, cy + 4, tip - 3 * sign, cy + 1)
        .lineBetween(tip, cy + 4, tip - 3 * sign, cy + 7);
    }
  }
  const blink = warning && Math.floor(timeMs / (130 - 75 * boss.telegraphProgress)) % 2 === 0;
  const body =
    boss.shifting || boss.flash > 0 || blink
      ? 0xffffff
      : boss.stunned
        ? 0x9be7ff
        : prism
          ? 0x69beda
          : 0x8992ba;
  const core = boss.phase === 0 ? 0xffdd87 : 0xff8bca;
  if (prism) {
    g.fillStyle(body, 1)
      .fillTriangle(cx, y, x + w, cy, cx, y + h)
      .fillTriangle(cx, y, x, cy, cx, y + h);
    g.fillStyle(core, 1).fillRect(cx - 3, cy - 3, 6, 6);
  } else {
    const spread = warning && boss.attack === 'gust';
    const wingTip = spread ? y - 4 : cy + 3;
    g.fillStyle(body, 1)
      .fillTriangle(x, wingTip, cx, y + 4, cx, y + h)
      .fillTriangle(x + w, wingTip, cx, y + 4, cx, y + h);
    g.fillStyle(core, 1).fillTriangle(cx + 5, cy - 3, cx - 5, cy - 3, cx, y + h - 4);
  }
  if (boss.exposed) {
    g.lineStyle(1, 0xffd166, 1).strokeRect(cx - 5, cy - 5, 10, 10);
  }
}
