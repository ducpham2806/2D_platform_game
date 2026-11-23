import type { EnemyProjectileData, LobData } from '../../core/enemy-config';
import {
  type FlightLine,
  type FlightPoint,
  firstFlightHit,
  flightBox,
  floorAt,
} from '../combat/flight';
import type { ProjectileSpec } from '../combat/projectiles';
import type { TileMap } from '../tilemap';
import type { EnemyContext } from './enemy';

export interface AimedShot {
  vx: number;
  vy: number;
  lines: FlightLine[];
}

function aimedShot(
  from: FlightPoint,
  to: FlightPoint,
  speed: number,
  lines: FlightLine[],
): AimedShot {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { vx: ((to.x - from.x) * speed) / length, vy: ((to.y - from.y) * speed) / length, lines };
}

/** Đường dội dùng ảnh gương của Kai qua mặt dưới trần, xét cả kích thước viên đạn. */
export function droneAim(
  ctx: EnemyContext,
  from: FlightPoint,
  shot: EnemyProjectileData,
  dual: boolean,
): AimedShot[] {
  const target = { x: ctx.playerX, y: ctx.playerY };
  const box = flightBox(from, shot.sizePx);
  const t = ctx.map.tileSize;
  const speed = shot.speedTilesPerSec * t;
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const hit = firstFlightHit(ctx.map, box, dx, dy, false, ctx.mirror);
  const fraction = hit?.fraction ?? 1;
  const direct = aimedShot(from, target, speed, [
    { from, to: { x: from.x + dx * fraction, y: from.y + dy * fraction } },
  ]);
  if (!hit && !dual) return [direct];

  for (let row = Math.floor(box.y / t) - 1; row >= 0; row -= 1) {
    const ceiling = (row + 1) * t + shot.sizePx.h / 2;
    if (ceiling >= Math.min(from.y, target.y)) continue;
    const reflectedY = 2 * ceiling - target.y;
    const bounceX = from.x + dx * ((ceiling - from.y) / (reflectedY - from.y));
    const bounce = { x: bounceX, y: ceiling };
    const first = firstFlightHit(
      ctx.map,
      box,
      bounce.x - from.x,
      bounce.y - from.y,
      false,
      ctx.mirror,
    );
    if (first?.ny !== 1 || first.nx !== 0 || first.fraction < 1 - 1e-8) continue;
    const rest = firstFlightHit(
      ctx.map,
      flightBox(bounce, shot.sizePx),
      target.x - bounce.x,
      target.y - bounce.y,
      false,
      ctx.mirror,
    );
    if (rest && rest.fraction < 1 - 1e-8) continue;
    const bank = aimedShot(from, bounce, speed, [
      { from, to: bounce },
      { from: bounce, to: target },
    ]);
    return dual ? [direct, bank] : [bank];
  }
  // Không có đường dội hợp lệ thì giữ hướng thẳng.
  return [direct];
}

/** Vận tốc để đạn chạm mặt sàn ở khoảng cách đã giới hạn, giữ góc ném. */
export function lobVelocities(
  ctx: EnemyContext,
  from: FlightPoint,
  projectile: EnemyProjectileData,
  lob: LobData,
  count: number,
): FlightPoint[] {
  const t = ctx.map.tileSize;
  const dx = ctx.playerX - from.x;
  const dir = Math.sign(dx) || 1;
  const maxRange = lob.maxRangeTiles * t;
  const g = lob.gravityTilesPerSec2 * t;
  const tan = Math.tan((lob.elevationDeg * Math.PI) / 180);
  return Array.from({ length: count }, (_, i) => {
    const distance = Math.min(maxRange, Math.abs(dx) + i * lob.spreadTiles * t);
    const landingX = from.x + dir * distance;
    const floor = floorAt(
      ctx.map,
      landingX,
      Math.max(from.y + projectile.sizePx.h / 2, ctx.playerY),
    );
    const drop = Math.max(0, (floor ?? ctx.map.heightPx) - projectile.sizePx.h / 2 - from.y);
    const time = Math.sqrt((2 * (drop + distance * tan)) / g);
    const speedX = time > 0 ? distance / time : 0;
    return { x: dir * speedX, y: -speedX * tan };
  });
}

/** Bóng ở chỗ đạn thật sẽ đáp, theo cùng bước cố định và cùng va chạm như ProjectilePool. */
export function landingMark(
  map: TileMap,
  shot: ProjectileSpec,
  dt: number,
): FlightPoint | undefined {
  const g = shot.gravity ?? 0;
  const box = { x: shot.x, y: shot.y, w: shot.w, h: shot.h };
  const dx = shot.vx * dt;
  let vy = shot.vy;
  let range = shot.maxDistance;
  for (let elapsed = dt; elapsed < shot.ttl; elapsed += dt) {
    const dy = (vy + (g * dt) / 2) * dt;
    const distance = Math.hypot(dx, dy);
    const scale = distance > range ? range / distance : 1;
    const hit = firstFlightHit(map, box, dx * scale, dy * scale, true);
    if (hit) {
      if (hit.ny < 0 && dy > 0)
        return {
          x: box.x + box.w / 2 + dx * scale * hit.fraction,
          y: box.y + box.h + dy * scale * hit.fraction,
        };
      return undefined;
    }
    if (scale < 1) return undefined;
    box.x += dx;
    box.y += dy;
    if (box.y > map.heightPx) return undefined;
    range -= distance;
    vy += g * dt;
  }
  return undefined;
}
