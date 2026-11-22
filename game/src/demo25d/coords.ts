/**
 * Đổi tọa độ logic (px, trục y hướng xuống) sang không gian 3D của demo 2.5D (đơn vị = 1 ô,
 * trục y hướng lên, mặt chơi là z = 0). Logic thuần, có test.
 */
export interface BoxPx {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Tâm hộp (px) → tâm trong không gian 3D (ô). */
export function boxCenter(b: BoxPx, mapHeightPx: number, tile: number): Vec2 {
  return { x: (b.x + b.w / 2) / tile, y: (mapHeightPx - (b.y + b.h / 2)) / tile };
}

/** Đáy giữa hộp (chỗ chân đứng) → không gian 3D. */
export function boxFoot(b: BoxPx, mapHeightPx: number, tile: number): Vec2 {
  return { x: (b.x + b.w / 2) / tile, y: (mapHeightPx - (b.y + b.h)) / tile };
}

/** Tâm ô (cột, hàng) → không gian 3D. */
export function cellCenter(col: number, row: number, rows: number): Vec2 {
  return { x: col + 0.5, y: rows - row - 0.5 };
}

/** Camera bám theo x nhưng không ra ngoài bản đồ (nửa bề rộng nhìn thấy `halfView`). */
export function clampCameraX(targetX: number, halfView: number, cols: number): number {
  if (cols <= 2 * halfView) return cols / 2;
  return Math.min(cols - halfView, Math.max(halfView, targetX));
}

/** Tiến dần tới đích theo tốc độ `rate` (1/giây), không phụ thuộc tốc độ khung. */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * dt);
}
