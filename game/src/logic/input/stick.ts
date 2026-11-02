/**
 * Cần ảo: đổi vị trí ngón tay so với tâm cần thành vector -1..1 (y dương là xuống).
 * Trong vùng chết trả về 0; ngoài vùng chết được co giãn lại để đi từ 0 tới 1 mượt.
 */
export function stickVector(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number,
  radius: number,
  deadzone: number,
): { x: number; y: number } {
  if (!(radius > 0)) throw new RangeError('radius phải dương');
  if (!(deadzone >= 0 && deadzone < 1)) throw new RangeError('deadzone phải trong [0, 1)');
  const dx = (pointerX - centerX) / radius;
  const dy = (pointerY - centerY) / radius;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude <= deadzone || magnitude === 0) return { x: 0, y: 0 };
  const clamped = Math.min(1, magnitude);
  const scaled = (clamped - deadzone) / (1 - deadzone);
  return { x: (dx / magnitude) * scaled, y: (dy / magnitude) * scaled };
}

/** Giữ núm cần trong bán kính (để vẽ). */
export function clampToRadius(
  centerX: number,
  centerY: number,
  pointerX: number,
  pointerY: number,
  radius: number,
): { x: number; y: number } {
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const d = Math.hypot(dx, dy);
  if (d <= radius || d === 0) return { x: pointerX, y: pointerY };
  return { x: centerX + (dx / d) * radius, y: centerY + (dy / d) * radius };
}

/** Áp vùng chết cho trục tay cầm (cần trái). */
export function applyDeadzone(x: number, y: number, deadzone: number): { x: number; y: number } {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= deadzone || magnitude === 0) return { x: 0, y: 0 };
  const clamped = Math.min(1, magnitude);
  const scaled = (clamped - deadzone) / (1 - deadzone);
  return { x: (x / magnitude) * scaled, y: (y / magnitude) * scaled };
}
