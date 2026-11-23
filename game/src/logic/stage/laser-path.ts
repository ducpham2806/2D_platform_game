import type { Box } from '../player/collision';
import type { TileMap } from '../tilemap';

export const LASER_DIRECTIONS = ['right', 'down', 'left', 'up'] as const;
export type LaserDirection = (typeof LASER_DIRECTIONS)[number];
export const MIRROR_ANGLES = [45, 135] as const;
export type MirrorAngle = (typeof MIRROR_ANGLES)[number];

interface Point {
  x: number;
  y: number;
}

export interface LaserSegment {
  from: Point;
  to: Point;
}

export type LaserPath = readonly LaserSegment[];

export function laserVector({ from, to }: LaserSegment): Point {
  return { x: Math.sign(to.x - from.x), y: Math.sign(to.y - from.y) };
}

const EPS = 1e-9;
const VECTOR: Readonly<Record<LaserDirection, Point>> = {
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  up: { x: 0, y: -1 },
};

/** Tâm ô dùng cho nguồn và cảm biến. Gương là đường chéo qua tâm, từ mép đến mép ô. */
export function opticalCenter(col: number, row: number, tileSize: number): Point {
  return { x: (col + 0.5) * tileSize, y: (row + 0.5) * tileSize };
}

function advance(point: Point, direction: Point, distance: number): Point {
  return { x: point.x + direction.x * distance, y: point.y + direction.y * distance };
}

/** Chọn ô bên tia đang tiến vào nếu điểm nằm đúng trên cạnh chung. */
function enteredCell(px: number, delta: number, t: number): number {
  return delta < 0 ? Math.ceil((px - EPS) / t) - 1 : Math.floor((px + EPS) / t);
}

/** Đường tia chung cho vạch báo, sát thương và cảm biến; tọa độ và tầm đều tính bằng px. */
export function traceLaser(
  map: TileMap,
  source: Point,
  direction: LaserDirection,
  mirrorAt: (col: number, row: number) => MirrorAngle | undefined,
  maxBounces: number,
  rangePx = Infinity,
): LaserPath {
  const result: LaserSegment[] = [];
  let from = source;
  let vector = VECTOR[direction];
  let remaining = rangePx;
  for (let bounces = 0; bounces <= maxBounces && remaining > EPS; bounces += 1) {
    const returning =
      bounces > 0 &&
      (vector.x !== 0 ? Math.abs(source.y - from.y) < EPS : Math.abs(source.x - from.x) < EPS);
    const toSource = (source.x - from.x) * vector.x + (source.y - from.y) * vector.y;
    const limit = returning && toSource > EPS ? Math.min(remaining, toSource) : remaining;
    const hit = traceLeg(map, from, vector, mirrorAt, limit);
    if (hit.distance <= EPS) break;
    const to = advance(from, vector, hit.distance);
    result.push({ from, to });
    if (hit.angle === undefined) break;
    remaining -= hit.distance;
    const sign = hit.angle === 45 ? -1 : 1;
    vector = { x: sign * vector.y, y: sign * vector.x };
    from = to;
  }
  return result;
}

function traceLeg(
  map: TileMap,
  from: Point,
  vector: Point,
  mirrorAt: (col: number, row: number) => MirrorAngle | undefined,
  limit: number,
): { distance: number; angle?: MirrorAngle } {
  const t = map.tileSize;
  let col = enteredCell(from.x, vector.x, t);
  let row = enteredCell(from.y, vector.y, t);
  let traveled = 0;
  let edge =
    vector.x !== 0
      ? ((col + (vector.x > 0 ? 1 : 0)) * t - from.x) * vector.x
      : ((row + (vector.y > 0 ? 1 : 0)) * t - from.y) * vector.y;

  while (col >= 0 && col < map.cols && row >= 0 && row < map.rows && !map.isSolid(col, row)) {
    const angle = mirrorAt(col, row);
    if (angle !== undefined) {
      const center = opticalCenter(col, row, t);
      const sign = angle === 45 ? 1 : -1;
      const distance =
        (center.x - from.x + sign * (center.y - from.y)) / (vector.x + sign * vector.y);
      // Không phản xạ lại ngay tại điểm vừa đổi hướng.
      if (
        distance > EPS &&
        distance >= traveled - EPS &&
        distance <= edge + EPS &&
        distance < limit - EPS
      )
        return { distance, angle };
    }
    if (edge >= limit) return { distance: limit };
    traveled = edge;
    edge += t;
    col += vector.x;
    row += vector.y;
  }
  return { distance: traveled };
}

/** Hình chữ nhật dùng chung khi vẽ và xét va chạm; tia kết thúc đúng ở đầu đoạn. */
export function laserBox({ from, to }: LaserSegment, width: number): Box {
  if (from.y === to.y)
    return {
      x: Math.min(from.x, to.x),
      y: from.y - width / 2,
      w: Math.abs(to.x - from.x),
      h: width,
    };
  return { x: from.x - width / 2, y: Math.min(from.y, to.y), w: width, h: Math.abs(to.y - from.y) };
}
