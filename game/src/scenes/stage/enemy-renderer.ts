import type Phaser from 'phaser';
import { Golem, ShieldCharger } from '../../logic/enemy/behaviors';
import type { Enemy } from '../../logic/enemy/enemy';

/** Màu giữ chỗ theo loại kẻ địch (chưa có sprite). */
const BODY_COLORS = {
  drone: 0xb0bec5,
  turret: 0x6b7c93,
  spikeTurret: 0x5fa35f,
  butterfly: 0xb48cff,
  shieldCharger: 0x9c7c4f,
  golem: 0x3f7f4f,
} as const;

function bodyColor(e: Enemy): number {
  const d = e.data;
  if (d.behavior === 'turret')
    return d.attack.count > 1 ? BODY_COLORS.spikeTurret : BODY_COLORS.turret;
  return BODY_COLORS[d.behavior];
}

/**
 * Vẽ kẻ địch bằng khối giữ chỗ, kèm báo trước đòn theo đặc tả mục 4: Drone nhấp nháy đỏ,
 * tháp pháo sáng lên, Tháp Gai co lại, Bướm Sắt phình ra, khiên Lính Kén sáng.
 */
export function drawEnemies(
  g: Phaser.GameObjects.Graphics,
  enemies: readonly Enemy[],
  timeMs: number,
): void {
  const blink = Math.floor(timeMs / 70) % 2 === 0;
  for (const e of enemies) {
    if (!e.alive) continue;
    const b = e.box;
    const d = e.data;
    let { x, y, w, h } = b;
    let color = bodyColor(e);
    if (e.telegraphing) {
      if (d.behavior === 'drone') color = blink ? 0xff6b6b : color;
      else if (d.behavior === 'turret' && d.attack.count > 1) {
        // Co lại trước khi bắn gai.
        x += 2;
        y += 3;
        w -= 4;
        h -= 3;
        color = 0x8fd18f;
      } else if (d.behavior === 'turret') color = blink ? 0xffd166 : 0xffe9a8;
      else if (d.behavior === 'butterfly') {
        x -= 2;
        y -= 2;
        w += 4;
        h += 4;
        color = 0xd2b4ff;
      }
    }
    if (e instanceof ShieldCharger && e.state === 'dash') color = 0xff8787;
    if (e instanceof Golem) {
      // Báo trước: nhấp nháy cam nhanh dần; lao: đỏ; pha 2: ánh đỏ ở ngực.
      if (e.telegraphing)
        color = Math.floor(timeMs / (140 - 90 * e.telegraphProgress)) % 2 === 0 ? 0xffa94d : color;
      if (e.state === 'dash') color = 0xff8787;
    }
    if (e.flash > 0) color = 0xffffff;
    g.fillStyle(color, e.harmless ? 0.6 : 1).fillRect(x, y, w, h);
    if (e.harmless) g.lineStyle(1, 0x7bd389, 1).strokeRect(x - 1, y - 1, w + 2, h + 2);

    // Chi tiết nhỏ để đọc hướng và loại.
    const front = e.facing > 0 ? b.x + b.w : b.x;
    if (d.behavior === 'drone') {
      g.fillStyle(0x0f1724, 1).fillRect(b.x + 2, b.y - 2, b.w - 4, 2);
      g.fillStyle(0x0f1724, 1).fillRect(e.facing > 0 ? b.x + b.w - 5 : b.x + 2, b.y + 4, 3, 3);
    } else if (d.behavior === 'turret') {
      g.fillStyle(0x0f1724, 1).fillRect(e.facing > 0 ? front : front - 5, b.y + 4, 5, 3);
    } else if (d.behavior === 'butterfly') {
      g.fillStyle(0x0f1724, 1).fillRect(b.x + b.w / 2 - 1, b.y + 2, 2, b.h - 4);
    }
    if (e instanceof Golem) {
      g.fillStyle(0x0f1724, 1).fillRect(e.facing > 0 ? b.x + b.w - 8 : b.x + 4, b.y + 6, 4, 4);
      g.fillStyle(e.phase === 2 ? 0xff6b6b : 0x7bd389, 1).fillRect(
        b.x + b.w / 2 - 3,
        b.y + 14,
        6,
        6,
      );
    }
    if (e instanceof ShieldCharger && e.shieldUp) {
      const sx = e.facing > 0 ? b.x + b.w : b.x - 3;
      const glow = e.telegraphing && blink;
      const strength = e.shieldLeft / Math.max(1, e.data.shieldHits);
      g.fillStyle(glow ? 0xffffff : 0x7fd1ff, 0.5 + 0.5 * strength).fillRect(
        sx,
        b.y + 1,
        3,
        b.h - 2,
      );
    }
  }
}
