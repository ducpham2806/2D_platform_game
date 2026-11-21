import type { Box } from '../player/collision';
import type { TileMap } from '../tilemap';

export interface FlightPoint {
  x: number;
  y: number;
}

export interface FlightLine {
  from: FlightPoint;
  to: FlightPoint;
}

export interface FlightHit {
  fraction: number;
  nx: number;
  ny: number;
}

export type ExtraSolid = (col: number, row: number) => boolean;
const EPS = 1e-9;

function axis(
  start: number,
  end: number,
  delta: number,
  low: number,
  high: number,
): { enter: number; exit: number } | undefined {
  if (delta > 0) return { enter: (low - end) / delta, exit: (high - start) / delta };
  if (delta < 0) return { enter: (high - start) / delta, exit: (low - end) / delta };
  if (start < high && end > low) return { enter: -Infinity, exit: Infinity };
  return undefined;
}

/** Điểm va chạm đầu tiên của cả hộp đạn, dùng chung cho mô phỏng và báo trước. */
export function firstFlightHit(
  map: TileMap,
  box: Box,
  dx: number,
  dy: number,
  platforms = false,
  extraSolid?: ExtraSolid,
): FlightHit | undefined {
  if (dx === 0 && dy === 0) return undefined;
  const t = map.tileSize;
  const right = box.x + box.w;
  const bottom = box.y + box.h;
  const c0 = Math.max(-1, Math.floor((box.x + Math.min(0, dx) - EPS) / t));
  const c1 = Math.min(map.cols, Math.floor((right + Math.max(0, dx) + EPS) / t));
  const r0 = Math.max(0, Math.floor((box.y + Math.min(0, dy) - EPS) / t));
  const r1 = Math.min(map.rows - 1, Math.floor((bottom + Math.max(0, dy) + EPS) / t));
  let hit: FlightHit | undefined;
  for (let row = r0; row <= r1; row += 1) {
    const y = row * t;
    for (let col = c0; col <= c1; col += 1) {
      const x = col * t;
      let fraction: number;
      let nx = 0;
      let ny = 0;
      if (map.isSolid(col, row) || extraSolid?.(col, row)) {
        const h = axis(box.x, right, dx, x, x + t);
        const v = axis(box.y, bottom, dy, y, y + t);
        if (!h || !v) continue;
        fraction = Math.max(h.enter, v.enter);
        if (Math.min(h.exit, v.exit) <= fraction + EPS) continue;
        if (h.enter >= v.enter - EPS) nx = -Math.sign(dx);
        if (v.enter >= h.enter - EPS) ny = -Math.sign(dy);
      } else if (platforms && dy > 0 && map.isOneWay(col, row)) {
        fraction = (y - bottom) / dy;
        if (box.x + dx * fraction >= x + t || right + dx * fraction <= x) continue;
        ny = -1;
      } else continue;
      if (fraction < -EPS || fraction > 1 + EPS) continue;
      if (!hit || fraction < hit.fraction - EPS)
        hit = { fraction: Math.min(1, Math.max(0, fraction)), nx, ny };
      else if (Math.abs(fraction - hit.fraction) <= EPS) {
        hit.nx ||= nx;
        hit.ny ||= ny;
      }
    }
  }
  return hit;
}

export function flightBox(center: FlightPoint, size: Pick<Box, 'w' | 'h'>): Box {
  return { x: center.x - size.w / 2, y: center.y - size.h / 2, w: size.w, h: size.h };
}

/** Dò mặt sàn ngay dưới cột, kể cả bục một chiều. */
export function floorAt(map: TileMap, x: number, fromY: number): number | undefined {
  const col = Math.floor(x / map.tileSize);
  if (col < 0 || col >= map.cols) return undefined;
  for (let row = Math.max(0, Math.ceil(fromY / map.tileSize)); row < map.rows; row += 1) {
    if (map.isSolid(col, row) || map.isOneWay(col, row)) return row * map.tileSize;
  }
  return undefined;
}
