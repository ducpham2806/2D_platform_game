import type Phaser from 'phaser';
import { GALE_CUTTER } from '../../logic/combat/loadout';
import { laserBox } from '../../logic/stage/laser-path';
import type { StageWorld } from '../../logic/world/stage-world';
import { VINE_PLATFORM_THICKNESS } from '../../logic/world/stage-mechanics';
import type { StageOptics } from '../../logic/world/stage-optics';

/** Ô của vật chắn và cửa thay đổi trong trận, để bản đồ tĩnh bỏ qua. */
export function dynamicSolidCells(world: StageWorld): (col: number, row: number) => boolean {
  const spans = [
    ...world.barriers.map((b) => b.spawn),
    ...(world.optics?.doors.map((d) => d.spawn) ?? []),
  ];
  return (c, r) => spans.some((s) => c >= s.first && c <= s.last && r >= s.top && r <= s.bottom);
}

/**
 * Vẽ cơ chế màn M7 bằng khối giữ chỗ (chưa có sprite): checkpoint (cờ xám, chạm rồi thì xanh),
 * dây leo đu, cửa phòng khóa đang đóng, vật chắn chưa vỡ, vật phẩm bí mật chưa nhặt.
 */
export function drawMechanics(
  g: Phaser.GameObjects.Graphics,
  world: StageWorld,
  timeMs: number,
): void {
  const t = world.map.tileSize;
  if (world.optics) drawOptics(g, world.optics, timeMs, t);
  for (const flow of world.coolant) {
    const b = flow.box;
    if (flow.frozen) {
      g.fillStyle(0x2d688a, 0.4).fillRect(b.x, b.y, b.w, b.h);
      for (const row of flow.stepRows) {
        g.fillStyle(0x82d9f3, 1).fillRect(b.x, row * t, b.w, 4);
        g.fillStyle(0xc2f3ff, 1).fillRect(b.x, row * t, b.w, 1);
      }
    } else {
      g.fillStyle(0x20678a, 0.65).fillRect(b.x, b.y, b.w, b.h);
      const offset = Math.floor(timeMs / 45) % t;
      g.fillStyle(0x58bfd9, 0.8);
      for (let y = offset; y < b.h; y += t)
        g.fillRect(b.x + b.w / 2 - 1, b.y + y, 2, Math.min(5, b.h - y));
    }
  }
  world.layout.checkpoints.forEach((cp, i) => {
    const reached = i < world.checkpointIndex;
    const x = cp.col * t + t / 2;
    const bottom = (cp.row + 1) * t;
    g.fillStyle(0x8a94a6, 1).fillRect(x - 1, bottom - 22, 2, 22);
    g.fillStyle(reached ? 0x7bd389 : 0x5a6577, 1).fillTriangle(
      x + 1,
      bottom - 22,
      x + 11,
      bottom - 18,
      x + 1,
      bottom - 14,
    );
  });

  for (const v of world.vines) {
    const p = v.platform;
    g.lineStyle(2, 0x5fa35f, 1).lineBetween(v.pivotX, v.pivotY, p.x + p.w / 2, p.y);
    g.fillStyle(0x3d6b3d, 1).fillCircle(v.pivotX, v.pivotY + 2, 3);
    g.fillStyle(0x7bd389, 1).fillRect(p.x, p.y, p.w, VINE_PLATFORM_THICKNESS);
  }

  for (const room of world.rooms) {
    if (room.state !== 'locked') continue;
    for (const d of room.spawn.doors) {
      g.fillStyle(0x6b7c93, 1).fillRect(d.col * t, d.row * t, t, t);
      g.fillStyle(0xff8787, 1).fillRect(d.col * t + 6, d.row * t, 4, t);
    }
  }

  for (const b of world.barriers) {
    if (b.broken) continue;
    const box = b.box();
    const mist = b.spawn.requiresWeapon === GALE_CUTTER;
    g.fillStyle(mist ? 0x8fb6d5 : 0x7a5a3a, mist ? 0.8 : 1).fillRect(box.x, box.y, box.w, box.h);
    g.lineStyle(1, mist ? 0xdbf0ff : 0xc9a227, 1);
    for (let y = box.y + 4; y < box.y + box.h; y += 8)
      g.lineBetween(box.x + 2, y, box.x + box.w - 2, y + 3);
  }

  const pulse = 0.6 + 0.4 * Math.sin(timeMs / 180);
  for (const s of world.secrets) {
    if (s.taken) continue;
    const { x, y, w, h } = s.box;
    const cx = x + w / 2;
    const cy = y + h / 2;
    g.fillStyle(0x4fd1ff, pulse).fillTriangle(cx, y, x + w, cy, cx, y + h);
    g.fillStyle(0x4fd1ff, pulse).fillTriangle(cx, y, x, cy, cx, y + h);
  }
}

function drawOptics(
  g: Phaser.GameObjects.Graphics,
  optics: StageOptics,
  timeMs: number,
  tileSize: number,
): void {
  const warning = 0.65 + 0.3 * Math.sin(timeMs / 45);
  for (const laser of optics.lasers) {
    if (laser.state === 'active') {
      g.fillStyle(0xff646e, 1);
      for (const b of laser.boxes) g.fillRect(b.x, b.y, b.w, b.h);
    } else if (laser.state === 'warning') {
      g.fillStyle(0xff8b65, warning);
      for (const segment of laser.path) {
        const b = laserBox(segment, 1);
        g.fillRect(b.x, b.y, b.w, b.h);
      }
    }
    const { x, y } = laser.center;
    g.fillStyle(0x263447, 1).fillRect(x - 5, y - 5, 10, 10);
    g.fillStyle(laser.state === 'off' ? 0x516076 : 0xff8b65, 1).fillCircle(x, y, 3);
  }
  for (const mirror of optics.mirrors) {
    const { x, y } = mirror.center;
    const half = tileSize / 2 - 1;
    const dy = mirror.angle === 45 ? half : -half;
    g.lineStyle(3, mirror.rotating ? 0xffffff : 0x85dcff, 1).lineBetween(
      x - half,
      y + dy,
      x + half,
      y - dy,
    );
  }
  for (const { box: b, progress, door } of optics.sensors) {
    const x = b.x + b.w / 2;
    const y = b.y + b.h / 2;
    const color = door.open ? 0x82e7a5 : 0xffcf73;
    g.lineStyle(2, color, 1).strokeCircle(x, y, 5);
    g.fillStyle(color, 1).fillCircle(x, y, 4 * progress);
  }
  for (const { box: b, open } of optics.doors) {
    if (!open) {
      g.fillStyle(0x30465f, 1).fillRect(b.x, b.y, b.w, b.h);
      g.fillStyle(0xffcf73, 1).fillRect(b.x + b.w / 2 - 1, b.y, 2, b.h);
    } else {
      g.lineStyle(1, 0x82e7a5, 1).lineBetween(b.x, b.y, b.x + b.w, b.y);
    }
  }
}
