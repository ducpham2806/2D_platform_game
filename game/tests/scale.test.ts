import { describe, expect, it } from 'vitest';
import { computeLayout, integerZoom, isPortrait } from '@/logic/scale';

describe('integerZoom', () => {
  it('chọn hệ số nguyên lớn nhất vừa màn hình', () => {
    expect(integerZoom(1920, 1080, 320, 192)).toBe(5); // 6× rộng, 5,6× cao → 5
    expect(integerZoom(1280, 720, 320, 192)).toBe(3); // 4× rộng, 3,75× cao → 3
    expect(integerZoom(844, 390, 320, 192)).toBe(2); // điện thoại ngang
  });

  it('khớp đúng thì dùng nguyên hệ số đó', () => {
    expect(integerZoom(640, 384, 320, 192)).toBe(2);
  });

  it('màn hình nhỏ hơn kích thước logic vẫn trả về 1', () => {
    expect(integerZoom(300, 150, 320, 192)).toBe(1);
    expect(integerZoom(0, 0, 320, 192)).toBe(1);
  });

  it('báo lỗi khi kích thước logic không dương', () => {
    expect(() => integerZoom(800, 600, 0, 192)).toThrow(RangeError);
  });
});

describe('computeLayout', () => {
  it('căn giữa và tính viền đen', () => {
    const layout = computeLayout(1280, 720, 320, 192);
    expect(layout).toEqual({
      zoom: 3,
      width: 960,
      height: 576,
      offsetX: 160,
      offsetY: 72,
      portrait: false,
    });
  });

  it('không bao giờ méo tỷ lệ 5:3', () => {
    for (const [w, h] of [
      [1920, 1080],
      [2340, 1080],
      [1366, 768],
      [800, 600],
    ] as const) {
      const layout = computeLayout(w, h, 320, 192);
      expect(layout.width / layout.height).toBeCloseTo(320 / 192, 10);
      expect(layout.width).toBeLessThanOrEqual(w);
      expect(layout.height).toBeLessThanOrEqual(h);
    }
  });

  it('nhận ra màn hình cầm dọc', () => {
    expect(isPortrait(390, 844)).toBe(true);
    expect(isPortrait(844, 390)).toBe(false);
    expect(computeLayout(390, 844, 320, 192).portrait).toBe(true);
  });
});
