import type Phaser from 'phaser';
import type { StageWorld } from '../../logic/world/stage-world';

/** Ô thuộc vật chắn (vẽ động vì vỡ được), để bản đồ tĩnh bỏ qua. */
export function barrierCells(world: StageWorld): (col: number, row: number) => boolean {
  const spans = world.barriers.map((b) => b.spawn);
  return (c, r) => spans.some((s) => c >= s.first && c <= s.last && r >= s.top && r <= s.bottom);
}

/**
 * Vẽ cơ chế màn M7 chưa có sprite bằng khối giữ chỗ: dây leo đu, vật phẩm bí mật chưa nhặt.
 * Checkpoint, cửa phòng khóa và vật chắn đã vẽ bằng hình ở stage-art.ts.
 */
export function drawMechanics(g: Phaser.GameObjects.Graphics, world: StageWorld): void {
  for (const v of world.vines) {
    const p = v.platform;
    g.lineStyle(2, 0x2e7d32, 1).lineBetween(v.pivotX, v.pivotY, p.x + p.w / 2, p.y);
    g.fillStyle(0x14472b, 1).fillCircle(v.pivotX, v.pivotY + 2, 3);
  }
}
