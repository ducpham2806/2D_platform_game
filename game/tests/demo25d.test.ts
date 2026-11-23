import { describe, expect, it } from 'vitest';
import { approach, boxCenter, boxFoot, cellCenter, clampCameraX } from '@/demo25d/coords';

describe('demo 2.5D: đổi tọa độ logic → 3D', () => {
  it('px (y xuống) → ô (y lên), mặt chơi z = 0', () => {
    // Bản đồ 12 hàng × 16 px: hộp 16×32 đứng trên sàn (đáy ở 176 px).
    const box = { x: 32, y: 144, w: 16, h: 32 };
    expect(boxFoot(box, 192, 16)).toEqual({ x: 2.5, y: 1 });
    expect(boxCenter(box, 192, 16)).toEqual({ x: 2.5, y: 2 });
    expect(cellCenter(0, 11, 12)).toEqual({ x: 0.5, y: 0.5 });
    expect(cellCenter(3, 0, 12)).toEqual({ x: 3.5, y: 11.5 });
  });

  it('camera không ra ngoài bản đồ; bản đồ hẹp hơn tầm nhìn thì đứng giữa', () => {
    expect(clampCameraX(1, 8, 40)).toBe(8);
    expect(clampCameraX(39, 8, 40)).toBe(32);
    expect(clampCameraX(20, 8, 40)).toBe(20);
    expect(clampCameraX(3, 12, 20)).toBe(10);
  });

  it('approach tiến dần tới đích, không phụ thuộc số khung', () => {
    const one = approach(0, 10, 4, 0.5);
    let many = 0;
    for (let i = 0; i < 50; i += 1) many = approach(many, 10, 4, 0.01);
    expect(one).toBeCloseTo(many, 6);
    expect(approach(3, 3, 4, 0.1)).toBe(3);
  });
});
