import type { Platform3, Position3, Wall3 } from '../../core/prototype3d-config';

export interface Bounds3 {
  min: Position3;
  max: Position3;
}

const EPS = 1e-6;

export function wallBounds(wall: Wall3): Bounds3 {
  const { x, y, z, width, depth, height } = wall;
  return {
    min: { x: x - width / 2, y, z: z - depth / 2 },
    max: { x: x + width / 2, y: y + height, z: z + depth / 2 },
  };
}

export function platformUnder(p: Position3, platforms: readonly Platform3[], radius = 0) {
  let best: Platform3 | undefined;
  for (const floor of platforms) {
    if (
      floor.y <= p.y + EPS &&
      Math.abs(p.x - floor.x) < floor.width / 2 + radius &&
      Math.abs(p.z - floor.z) < floor.depth / 2 + radius &&
      (!best || floor.y > best.y)
    )
      best = floor;
  }
  return best;
}

/** Khoảng [0,1] trên đoạn từ gốc tới đích khi tia chạm hộp lần đầu. */
export function segmentHit(from: Position3, to: Position3, bounds: Bounds3): number | undefined {
  let enter = 0,
    exit = 1;
  for (const axis of ['x', 'y', 'z'] as const) {
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < EPS) {
      if (from[axis] < bounds.min[axis] || from[axis] > bounds.max[axis]) return undefined;
      continue;
    }
    const a = (bounds.min[axis] - from[axis]) / delta;
    const b = (bounds.max[axis] - from[axis]) / delta;
    enter = Math.max(enter, Math.min(a, b));
    exit = Math.min(exit, Math.max(a, b));
    if (enter > exit) return undefined;
  }
  return enter;
}

export function cameraMove(x: number, forward: number, yaw: number) {
  const rightX = Math.cos(yaw),
    rightZ = -Math.sin(yaw);
  return { x: rightX * x + rightZ * forward, z: rightZ * x - rightX * forward };
}

/** Di chuyển hộp Kai theo một trục trong mặt phẳng XZ, chạm vách thì dừng ngay ở mặt vách. */
export function moveAxis(
  position: Position3,
  axis: 'x' | 'z',
  delta: number,
  radius: number,
  height: number,
  walls: readonly Bounds3[],
): number {
  const from = position[axis];
  let to = from + delta;
  const cross = axis === 'x' ? 'z' : 'x';
  for (const b of walls) {
    if (
      position.y >= b.max.y ||
      position.y + height <= b.min.y ||
      position[cross] + radius <= b.min[cross] ||
      position[cross] - radius >= b.max[cross]
    )
      continue;
    const low = b.min[axis] - radius;
    const high = b.max[axis] + radius;
    if (delta > 0 && from <= low + EPS && to > low) to = low;
    if (delta < 0 && from >= high - EPS && to < high) to = high;
  }
  position[axis] = to;
  return to - from;
}
