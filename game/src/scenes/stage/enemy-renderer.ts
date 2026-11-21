import type Phaser from 'phaser';
import { Golem, ShieldCharger } from '../../logic/enemy/behaviors';
import type { Enemy } from '../../logic/enemy/enemy';
import type { Pickup } from '../../logic/world/pickups';

/** Màu giữ chỗ theo loại kẻ địch (chưa có sprite). */
const BODY_COLORS = {
  drone: 0xb0bec5,
  turret: 0x6b7c93,
  spikeTurret: 0x5fa35f,
  butterfly: 0xb48cff,
  shieldCharger: 0x9c7c4f,
  golem: 0x3f7f4f,
} as const;

/** Vật phẩm sắp biến mất thì nhấp nháy trong chừng này giây cuối. */
const PICKUP_BLINK_SEC = 2;

function bodyColor(e: Enemy): number {
  const d = e.data;
  switch (d.id) {
    case 'guong_quang':
      return 0x97dfe5;
    case 'nguoi_tuyet_may':
      return 0xb2d7f0;
    case 'thap_bang':
      return 0x4593bd;
    case 'frost_titan':
      return 0x396aa6;
  }
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
    const telegraphing = e.disabledSec === 0 && e.telegraphing;
    let { x, y, w, h } = b;
    let color = bodyColor(e);
    if (telegraphing) {
      if (d.behavior === 'drone') color = blink ? (d.attack.bankShot ? 0xe5ffff : 0xff6b6b) : color;
      else if (d.behavior === 'turret' && d.attack.lob) color = blink ? 0xb1f2ff : color;
      else if (d.id === 'nguoi_tuyet_may') {
        y += 3;
        h -= 3;
        color = blink ? 0xe5ffff : color;
      } else if (d.behavior === 'turret' && d.attack.count > 1) {
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
    if (e.disabledSec === 0 && e instanceof ShieldCharger && e.state === 'dash') color = 0xff8787;
    if (e instanceof Golem) {
      // Báo trước: nhấp nháy cam nhanh dần; lao: đỏ; pha 2: ánh đỏ ở ngực.
      if (telegraphing)
        color = Math.floor(timeMs / (140 - 90 * e.telegraphProgress)) % 2 === 0 ? 0xffa94d : color;
      if (e.state === 'dash') color = 0xff8787;
    }
    if (telegraphing) {
      g.lineStyle(1, 0xb8f9ff, blink ? 0.85 : 0.5);
      for (const { from, to } of e.aimLines) g.lineBetween(from.x, from.y, to.x, to.y);
      for (const { x: markX, y: markY } of e.landingMarks)
        g.fillStyle(0x71d7ff, blink ? 0.9 : 0.55).fillRect(markX - 5, markY - 2, 10, 2);
    }
    if (e.flash > 0) color = 0xffffff;
    g.fillStyle(color, e.harmless ? 0.6 : 1).fillRect(x, y, w, h);
    if (e.harmless) g.lineStyle(1, 0x7bd389, 1).strokeRect(x - 1, y - 1, w + 2, h + 2);
    if (e.frozen) {
      g.fillStyle(0x7fdcfa, 0.65).fillRect(x, y, w, h);
      g.lineStyle(2, 0xc2f3ff, 1).strokeRect(x - 1, y - 1, w + 2, h + 2);
    }

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
    // Báo trước đòn nhiều nhịp (bản Thử thách): một chấm sáng mỗi nhịp trên đầu kẻ địch.
    if (telegraphing && e.beats > 1) {
      const gap = 4;
      const left = b.x + b.w / 2 - ((e.beats - 1) * gap) / 2;
      for (let i = 0; i < e.beats; i += 1)
        g.fillStyle(0xffd166, blink ? 1 : 0.6).fillRect(left + i * gap - 1, b.y - 6, 2, 2);
    }
    if (e instanceof ShieldCharger && e.shieldUp) {
      const sx = e.facing > 0 ? b.x + b.w : b.x - 3;
      const glow = telegraphing && blink;
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

/** Core Bit: viên vàng; viên máu: ô trắng chữ thập xanh. Nhấp nháy khi sắp biến mất. */
export function drawPickups(
  g: Phaser.GameObjects.Graphics,
  pickups: readonly Pickup[],
  timeMs: number,
): void {
  for (const p of pickups) {
    if (p.ttl < PICKUP_BLINK_SEC && Math.floor(timeMs / 100) % 2 === 0) continue;
    if (p.kind === 'coreBit') {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      g.fillStyle(0xffd166, 1)
        .fillTriangle(cx, p.y, p.x + p.w, cy, cx, p.y + p.h)
        .fillTriangle(cx, p.y, p.x, cy, cx, p.y + p.h);
    } else {
      g.fillStyle(0xffffff, 1).fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle(0x7bd389, 1)
        .fillRect(p.x + p.w / 2 - 1, p.y + 1, 2, p.h - 2)
        .fillRect(p.x + 1, p.y + p.h / 2 - 1, p.w - 2, 2);
    }
  }
}
