import type Phaser from 'phaser';
import type { GrayBoss } from '../../logic/boss/gray-boss';
import type { Projectile } from '../../logic/combat/projectiles';
import { Tile, type TileMap } from '../../logic/tilemap';
import type { StageWorld } from '../../logic/world/stage-world';
import { drawEnemies, drawPickups } from './enemy-renderer';

/** Màu khối giữ chỗ (chưa có sprite). Mỗi loại đạn một màu để dễ đọc khi chơi thử. */
const PROJECTILE_COLORS: Readonly<Record<Projectile['kind'], number>> = {
  shot: 0x9be7ff,
  mid: 0x4fd1ff,
  charged: 0xffffff,
  sweep: 0x7bd389,
  enemyShot: 0xff8787,
  shockwave: 0xffa94d,
  drop: 0xff6b6b,
  bomb: 0xd99cff,
};

/** Vẽ phần tĩnh của bản đồ một lần (nền, lưới, khối đặc, bục một chiều). */
export function drawStaticMap(
  g: Phaser.GameObjects.Graphics,
  map: TileMap,
  skipCol?: number,
): void {
  const t = map.tileSize;
  g.fillStyle(0x0f1724, 1).fillRect(0, 0, map.widthPx, map.heightPx);
  g.lineStyle(1, 0x172234, 1);
  for (let c = 0; c <= map.cols; c += 1) g.lineBetween(c * t, 0, c * t, map.heightPx);
  for (let r = 0; r <= map.rows; r += 1) g.lineBetween(0, r * t, map.widthPx, r * t);
  for (let r = 0; r < map.rows; r += 1) {
    for (let c = 0; c < map.cols; c += 1) {
      if (c === skipCol && map.get(c, r) !== Tile.Solid) continue;
      const tile = map.get(c, r);
      if (tile === Tile.Solid) {
        g.fillStyle(0x4a5568, 1).fillRect(c * t, r * t, t, t);
        if (map.get(c, r - 1) !== Tile.Solid) g.fillStyle(0x8193ad, 1).fillRect(c * t, r * t, t, 2);
      } else if (tile === Tile.OneWay) {
        g.fillStyle(0x8fa3bf, 1).fillRect(c * t, r * t, t, 4);
      }
    }
  }
}

/**
 * Vẽ mọi thứ thay đổi theo bước: cửa, bia, boss và telegraph, kẻ địch, vật phẩm, đạn.
 * Gọi mỗi khung, sau clear().
 */
export function drawDynamic(
  g: Phaser.GameObjects.Graphics,
  world: StageWorld,
  timeMs: number,
): void {
  const t = world.map.tileSize;
  g.clear();
  if (world.gateCol !== undefined) {
    for (const r of world.gateRows) {
      if (!world.map.isSolid(world.gateCol, r)) continue;
      g.fillStyle(0x6b7c93, 1).fillRect(world.gateCol * t, r * t, t, t);
      g.fillStyle(0xffd166, 1).fillRect(world.gateCol * t + 6, r * t, 4, t);
    }
  }
  for (const target of world.targets) {
    const b = target.box;
    if (!target.alive) {
      g.lineStyle(1, 0x5a6577, 1).strokeRect(b.x, b.y, b.w, b.h);
      continue;
    }
    g.fillStyle(target.flash > 0 ? 0xffffff : 0xc9a227, 1).fillRect(b.x, b.y, b.w, b.h);
    g.fillStyle(0x0f1724, 1).fillRect(b.x + 3, b.y + 4, b.w - 6, 2);
    if (target.shieldUp) g.fillStyle(0x7fd1ff, 1).fillRect(b.x - 4, b.y + 2, 3, b.h - 4);
  }
  if (world.boss) drawBoss(g, world.boss, t, world.map, timeMs);
  drawEnemies(g, world.enemies, timeMs);
  if (world.field) drawPickups(g, world.field.pickups.all, timeMs);
  for (const p of world.pool.all) {
    g.fillStyle(PROJECTILE_COLORS[p.kind], p.kind === 'sweep' ? 0.6 : 1).fillRect(
      p.x,
      p.y,
      p.w,
      p.h,
    );
    if (p.kind === 'charged')
      g.lineStyle(1, 0x4fd1ff, 1).strokeRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2);
  }
}

function drawBoss(
  g: Phaser.GameObjects.Graphics,
  boss: GrayBoss,
  t: number,
  map: TileMap,
  timeMs: number,
): void {
  const b = boss.box;
  if (boss.state === 'dead') {
    g.fillStyle(0x2a3344, 1).fillRect(b.x, b.y + b.h / 2, b.w, b.h / 2);
    return;
  }
  // Telegraph: nhấp nháy cam nhanh dần khi sắp ra đòn, kèm chỉ dẫn vị trí đòn.
  if (boss.state === 'telegraph') {
    const blink = Math.floor(timeMs / (140 - 90 * boss.telegraphProgress)) % 2 === 0;
    const a = 0.25 + 0.5 * boss.telegraphProgress;
    if (boss.attack === 'shot') {
      for (let x = 0; x < map.widthPx; x += 8)
        g.fillStyle(0xff8787, a).fillRect(x, boss.shotLaneY - 1, 4, 2);
    } else if (boss.attack === 'slam') {
      g.fillStyle(0xffa94d, a).fillTriangle(
        boss.slamTargetX - 8,
        11 * t,
        boss.slamTargetX + 8,
        11 * t,
        boss.slamTargetX,
        11 * t - 8,
      );
    } else if (boss.attack === 'rain') {
      // Cột cảnh báo mờ suốt chiều cao: chỗ không có cột là khe an toàn.
      for (const col of boss.rainCols)
        g.fillStyle(0xff6b6b, a * 0.35).fillRect(col * t + 1, t, t - 2, 10 * t);
    }
    g.fillStyle(blink ? 0xffa94d : 0x8a94a6, 1).fillRect(b.x, b.y, b.w, b.h);
  } else {
    const color =
      boss.flash > 0
        ? 0xffffff
        : boss.stunned
          ? 0x9be7ff
          : boss.state === 'active'
            ? 0xff6b6b
            : 0x8a94a6;
    g.fillStyle(color, 1).fillRect(b.x, b.y, b.w, b.h);
  }
  // Mắt chỉ hướng.
  const eyeX = boss.facing > 0 ? b.x + b.w - 8 : b.x + 4;
  g.fillStyle(0x0f1724, 1).fillRect(eyeX, b.y + 7, 4, 4);
  if (boss.stunned && Math.floor(timeMs / 120) % 2 === 0) {
    g.fillStyle(0xffd166, 1)
      .fillRect(b.x + b.w / 2 - 6, b.y - 6, 3, 3)
      .fillRect(b.x + b.w / 2 + 3, b.y - 8, 3, 3);
  }
}

/** Quầng sáng quanh Kai theo mức nạp: xanh khi nạp vừa, nhấp nháy vàng trắng khi nạp đầy. */
export function chargeGlowColor(level: 0 | 1 | 2, timeMs: number): number | undefined {
  if (level === 1) return 0x4fd1ff;
  if (level === 2) return Math.floor(timeMs / 70) % 2 === 0 ? 0xffffff : 0xffd166;
  return undefined;
}
