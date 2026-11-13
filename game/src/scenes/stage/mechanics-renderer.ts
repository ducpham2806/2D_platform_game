import type Phaser from 'phaser';
import type { StageWorld } from '../../logic/world/stage-world';
import { VINE_PLATFORM_THICKNESS } from '../../logic/world/stage-mechanics';

/** Ô thuộc vật chắn (vẽ động vì vỡ được), để bản đồ tĩnh bỏ qua. */
export function barrierCells(world: StageWorld): (col: number, row: number) => boolean {
  const spans = world.barriers.map((b) => b.spawn);
  return (c, r) => spans.some((s) => c >= s.first && c <= s.last && r >= s.top && r <= s.bottom);
}

/**
 * Vẽ cơ chế màn M7 chưa có sprite bằng khối giữ chỗ: dây leo đu, vật phẩm bí mật chưa nhặt.
 * Checkpoint, cửa phòng khóa và vật chắn đã vẽ bằng hình ở stage-art.ts.
 */
export function drawMechanics(
  g: Phaser.GameObjects.Graphics,
  world: StageWorld,
  timeMs: number,
): void {
  for (const v of world.vines) {
    const p = v.platform;
    g.lineStyle(2, 0x5fa35f, 1).lineBetween(v.pivotX, v.pivotY, p.x + p.w / 2, p.y);
    g.fillStyle(0x3d6b3d, 1).fillCircle(v.pivotX, v.pivotY + 2, 3);
    g.fillStyle(0x7bd389, 1).fillRect(p.x, p.y, p.w, VINE_PLATFORM_THICKNESS);
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
