import { describe, expect, it } from 'vitest';
import { BossAnchors } from '@/logic/boss/boss-anchors';

const POINTS = [
  { x: 64, y: 64 },
  { x: 192, y: 144 },
  { x: 320, y: 64 },
] as const;
const WARN = 0.3;

describe('ST-15-10: điểm neo dịch chuyển của Lumen', () => {
  it('báo ở chỗ đến nhưng giữ nguyên chỗ đi tới khi đủ thời gian', () => {
    const anchors = new BossAnchors(POINTS, 1, WARN);
    expect(anchors.current).toEqual(POINTS[1]);
    expect(anchors.warning).toBeUndefined();
    expect(anchors.step(0.5)).toBeUndefined();

    anchors.begin();
    expect(anchors.warning).toEqual({ ...POINTS[2], progress: 0 });
    expect(anchors.step(0.299)).toBeUndefined();
    expect(anchors.warning?.progress).toBeCloseTo(0.299 / WARN, 10);
    expect(anchors.current).toEqual(POINTS[1]);

    expect(anchors.step(0.001)).toEqual(POINTS[2]);
    expect(anchors.warning).toBeUndefined();
    expect(anchors.current).toEqual(POINTS[2]);
    expect(anchors.step(0.3)).toBeUndefined();
  });

  it('không đặt lại thời gian báo khi gọi begin lặp và đi theo vòng xác định', () => {
    const anchors = new BossAnchors(POINTS, 0, WARN);
    anchors.begin();
    expect(anchors.step(0.1)).toBeUndefined();
    anchors.begin();
    expect(anchors.warning?.progress).toBeCloseTo(1 / 3, 10);
    expect(anchors.step(0.1)).toBeUndefined();
    expect(anchors.step(0.1)).toEqual(POINTS[1]);

    anchors.begin();
    expect(anchors.step(1)).toEqual(POINTS[2]);
    expect(anchors.step(1)).toBeUndefined();
    anchors.begin();
    expect(anchors.step(0.3)).toEqual(POINTS[0]);
  });

  it('hủy đích đang báo mà không đổi chỗ hoặc cộng dồn thời gian vào lượt kế', () => {
    const anchors = new BossAnchors(POINTS, 2, WARN);
    anchors.begin();
    anchors.step(0.29);
    anchors.cancel();
    expect(anchors.current).toEqual(POINTS[2]);
    expect(anchors.warning).toBeUndefined();
    expect(anchors.step(0.3)).toBeUndefined();

    anchors.begin();
    expect(anchors.warning).toEqual({ ...POINTS[0], progress: 0 });
    expect(anchors.step(0.01)).toBeUndefined();
    expect(anchors.step(0.29)).toEqual(POINTS[0]);
  });

  it('tách tọa độ neo khỏi dữ liệu đầu vào có thể bị sửa', () => {
    const authored: { x: number; y: number }[] = POINTS.map(({ x, y }) => ({ x, y }));
    const anchors = new BossAnchors(authored, 0, WARN);
    authored[1]!.x = 1;
    authored.reverse();

    anchors.begin();
    expect(anchors.warning).toEqual({ ...POINTS[1], progress: 0 });
    expect(anchors.step(0.3)).toEqual(POINTS[1]);
  });

  it('từ chối cấu hình không hợp lệ và không làm đồng hồ chạy lùi', () => {
    expect(() => new BossAnchors(POINTS.slice(0, 2), 0, WARN)).toThrow(RangeError);
    expect(() => new BossAnchors([POINTS[0], POINTS[0], POINTS[2]], 0, WARN)).toThrow(RangeError);
    expect(() => new BossAnchors([POINTS[0], POINTS[1], { x: 0, y: Infinity }], 0, WARN)).toThrow(
      RangeError,
    );
    expect(() => new BossAnchors(POINTS, 3, WARN)).toThrow(RangeError);
    expect(() => new BossAnchors(POINTS, 0.5, WARN)).toThrow(RangeError);
    expect(() => new BossAnchors(POINTS, 0, 0)).toThrow(RangeError);
    expect(() => new BossAnchors(POINTS, 0, Infinity)).toThrow(RangeError);

    const anchors = new BossAnchors(POINTS, 0, WARN);
    anchors.begin();
    expect(() => anchors.step(-1)).toThrow(RangeError);
    expect(() => anchors.step(NaN)).toThrow(RangeError);
    expect(anchors.warning?.progress).toBe(0);
  });
});
