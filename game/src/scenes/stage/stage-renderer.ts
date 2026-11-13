import type Phaser from 'phaser';
import type { Boss } from '../../logic/boss/boss';
import type { Projectile } from '../../logic/combat/projectiles';
import type { ParticlePool } from '../../logic/feel/particle-pool';
import type { TileMap } from '../../logic/tilemap';
import type { StageWorld } from '../../logic/world/stage-world';
import { drawEnemies } from './enemy-renderer';
import { projectileHasArt } from './stage-art';

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
  lash: 0x7bd389,
  root: 0x8b5e3c,
  seed: 0xb2f2bb,
};

/** Vẽ hạt hiệu ứng (gọi sau drawDynamic, không clear): mờ dần theo thời gian sống còn lại. */
export function drawParticles(g: Phaser.GameObjects.Graphics, pool: ParticlePool): void {
  for (const p of pool.all) {
    if (!p.alive) continue;
    g.fillStyle(p.color, Math.min(1, (p.life / p.total) * 1.5)).fillRect(
      Math.round(p.x - p.size / 2),
      Math.round(p.y - p.size / 2),
      p.size,
      p.size,
    );
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
  g.clear();
  const t = world.map.tileSize;
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
  for (const p of world.pool.all) {
    if (projectileHasArt(p.kind)) continue;
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
  boss: Boss,
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
    } else if (boss.attack === 'rain' || boss.attack === 'bloom') {
      // Cột cảnh báo mờ suốt chiều cao: chỗ không có cột là khe an toàn.
      for (const col of boss.rainCols)
        g.fillStyle(0xff6b6b, a * 0.35).fillRect(col * t + 1, t, t - 2, 10 * t);
    } else if (boss.attack === 'thorns') {
      for (let x = 0; x < 10; x += 1) {
        const dx = boss.facing * (b.w / 2 + 6 + x * 8);
        g.fillStyle(0xff8787, a).fillRect(b.x + b.w / 2 + dx, boss.shotLaneY - 1, 4, 2);
      }
    } else if (boss.attack === 'lash') {
      const left = boss.facing > 0 ? b.x + b.w : b.x - boss.lashReachPx;
      g.fillStyle(0xff8787, a * 0.6).fillRect(left, b.y + b.h - 4, boss.lashReachPx, 4);
    } else if (boss.attack === 'roots') {
      // Vết nứt trên sàn ở chỗ rễ sắp mọc.
      for (const x of boss.rootXs) g.fillStyle(0xffd166, a).fillRect(x - 6, b.y + b.h - 2, 12, 2);
    }
    const tint = boss.data.id === 'gray' ? 0x8a94a6 : 0x3f8f5a;
    g.fillStyle(blink ? 0xffa94d : tint, 1).fillRect(b.x, b.y, b.w, b.h);
  } else {
    const color =
      boss.flash > 0
        ? 0xffffff
        : boss.stunned
          ? 0x9be7ff
          : boss.state === 'active'
            ? 0xff6b6b
            : boss.data.id === 'gray'
              ? 0x8a94a6
              : 0x3f8f5a;
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
