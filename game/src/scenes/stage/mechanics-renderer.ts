import type Phaser from 'phaser';
import type { StageWorld } from '../../logic/world/stage-world';
import { VINE_PLATFORM_THICKNESS } from '../../logic/world/stage-mechanics';

/** Ô thuộc vật chắn (vẽ động vì vỡ được), để bản đồ tĩnh bỏ qua. */
export function barrierCells(world: StageWorld): (col: number, row: number) => boolean {
  const spans = world.barriers.map((b) => b.spawn);
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
    g.fillStyle(0x7a5a3a, 1).fillRect(box.x, box.y, box.w, box.h);
    g.lineStyle(1, 0xc9a227, 1);
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
