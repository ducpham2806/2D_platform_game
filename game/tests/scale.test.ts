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
      deviceZoom: 3,
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

  it('điện thoại: phóng nguyên theo px thiết bị, to hơn nhiều so với theo px CSS', () => {
    // Pixel 7 ngang: 863 × 360 px CSS, 2,625 px thật mỗi px CSS (theo px CSS chỉ được ×1).
    const pixel = computeLayout(863, 360, 320, 192, 2.625);
    expect(pixel.deviceZoom).toBe(4);
    expect(pixel.width * 2.625).toBeCloseTo(1280, 9);
    expect(pixel.height * 2.625).toBeCloseTo(768, 9);
    expect(pixel.height).toBeLessThanOrEqual(360);
    // iPhone 13 ngang: 750 × 342 px CSS, tỉ lệ 3.
    expect(computeLayout(750, 342, 320, 192, 3).deviceZoom).toBe(5);
    // Laptop Windows phóng 125%.
    expect(computeLayout(1536, 730, 320, 192, 1.25).deviceZoom).toBe(4);
  });

  it('viền rơi đúng biên px thiết bị; tỉ lệ px sai thì coi là 1', () => {
    for (const [w, h, r] of [
      [863, 360, 2.625],
      [915, 412, 2.625],
      [1536, 730, 1.25],
      [851, 393, 2.75],
    ] as const) {
      const l = computeLayout(w, h, 320, 192, r);
      expect(Number.isInteger(Math.round(l.offsetX * r * 1e6) / 1e6)).toBe(true);
      expect(Number.isInteger(Math.round(l.offsetY * r * 1e6) / 1e6)).toBe(true);
      expect(l.offsetX * 2 + l.width).toBeLessThanOrEqual(w + 1e-9);
    }
    expect(computeLayout(1280, 720, 320, 192, Number.NaN).deviceZoom).toBe(3);
    expect(computeLayout(1280, 720, 320, 192, 0).zoom).toBe(3);
  });

  it('nhận ra màn hình cầm dọc', () => {
    expect(isPortrait(390, 844)).toBe(true);
    expect(isPortrait(844, 390)).toBe(false);
    expect(computeLayout(390, 844, 320, 192).portrait).toBe(true);
  });
});
