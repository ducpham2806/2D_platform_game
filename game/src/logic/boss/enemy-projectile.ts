import type { RainAttack, SlamAttack } from '../../core/boss-config';
import type { ProjectilePool, ProjectileSpec } from '../combat/projectiles';

/** Tạo đạn của kẻ địch (bắn thẳng, sóng đất, mưa rơi). Sát thương tính bằng máu người chơi. */
export function enemyProjectile(
  tileSize: number,
  kind: 'enemyShot' | 'shockwave' | 'drop' | 'bomb' | 'lash' | 'root' | 'seed',
  x: number,
  y: number,
  size: { w: number; h: number },
  vx: number,
  vy: number,
  damage: number,
): ProjectileSpec {
  return {
    owner: 'enemy',
    kind,
    x,
    y,
    w: size.w,
    h: size.h,
    vx,
    vy,
    damage,
    kindMul: 1,
    pierceLeft: 0,
    breaksShield: false,
    weapon: 'boss',
    maxDistance: 40 * tileSize,
    ttl: 10,
    attached: false,
  };
}

/** Đòn Mưa đạn: mỗi cột trong danh sách thả một viên rơi từ dòng ô thứ 2. */
export function spawnRainDrops(
  pool: ProjectilePool,
  tileSize: number,
  cols: readonly number[],
  rain: Pick<RainAttack, 'fallSpeedTilesPerSec' | 'damage' | 'sizePx'>,
  kind: 'drop' | 'seed' = 'drop',
  source?: string,
  originY = tileSize,
): void {
  for (const col of cols) {
    pool.spawn({
      ...enemyProjectile(
        tileSize,
        kind,
        col * tileSize + (tileSize - rain.sizePx.w) / 2,
        originY,
        rain.sizePx,
        0,
        rain.fallSpeedTilesPerSec * tileSize,
        rain.damage,
      ),
      ...(source === undefined ? {} : { source }),
    });
  }
}

/** Đòn Nhảy đập: khi đáp, hai sóng đất chạy ra hai bên dọc theo sàn. */
export function spawnShockwaves(
  pool: ProjectilePool,
  tileSize: number,
  centerX: number,
  bottom: number,
  halfWidth: number,
  wave: SlamAttack['shockwave'] & { rangeTiles?: number },
  speedMul: number,
  source?: string,
): void {
  for (const dir of [-1, 1] as const) {
    const spec = enemyProjectile(
      tileSize,
      'shockwave',
      centerX - wave.sizePx.w / 2 + dir * halfWidth,
      bottom - wave.sizePx.h - 0.01,
      wave.sizePx,
      dir * wave.speedTilesPerSec * tileSize * speedMul,
      0,
      wave.damage,
    );
    pool.spawn({
      ...spec,
      ...(wave.rangeTiles === undefined ? {} : { maxDistance: wave.rangeTiles * tileSize }),
      ...(source === undefined ? {} : { source }),
    });
  }
}
