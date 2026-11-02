import { describe, expect, it, vi } from 'vitest';
import { InputAggregator } from '@/logic/input/aggregator';

describe('InputAggregator', () => {
  it('pressed chỉ đúng ở bước đầu tiên, held giữ đến khi nhả', () => {
    const agg = new InputAggregator();
    agg.press('keyboard', 'jump');
    const s1 = agg.step();
    expect(s1.pressed.jump).toBe(true);
    expect(s1.held.jump).toBe(true);
    const s2 = agg.step();
    expect(s2.pressed.jump).toBe(false);
    expect(s2.held.jump).toBe(true);
    agg.release('keyboard', 'jump');
    const s3 = agg.step();
    expect(s3.released.jump).toBe(true);
    expect(s3.held.jump).toBe(false);
  });

  it('không mất lần chạm bấm rồi nhả trong cùng một bước', () => {
    const agg = new InputAggregator();
    agg.press('touch', 'jump');
    agg.release('touch', 'jump');
    const s = agg.step();
    expect(s.pressed.jump).toBe(true);
    expect(s.released.jump).toBe(true);
    expect(s.held.jump).toBe(false);
    expect(agg.step().pressed.jump).toBe(false);
  });

  it('gộp nhiều nguồn: nhả một nguồn không nhả hành động nếu nguồn khác còn giữ', () => {
    const agg = new InputAggregator();
    agg.press('keyboard', 'shoot');
    agg.press('gamepad', 'shoot');
    agg.step();
    agg.release('keyboard', 'shoot');
    const s = agg.step();
    expect(s.held.shoot).toBe(true);
    expect(s.released.shoot).toBe(false);
  });

  it('moveX: cần analog thắng nút số; không có cần thì dùng trái/phải', () => {
    const agg = new InputAggregator();
    agg.press('keyboard', 'left');
    expect(agg.step().moveX).toBe(-1);
    agg.setAxis('gamepad', 0.5, 0);
    expect(agg.step().moveX).toBe(0.5);
    agg.setAxis('gamepad', 0, 0);
    agg.press('keyboard', 'right');
    expect(agg.step().moveX).toBe(0); // trái + phải triệt tiêu
  });

  it('kẹp trục về -1..1', () => {
    const agg = new InputAggregator();
    agg.setAxis('touch', 3, -2);
    const s = agg.step();
    expect(s.moveX).toBe(1);
    expect(s.moveY).toBe(-1);
  });

  it('theo dõi thiết bị dùng gần nhất và báo khi đổi', () => {
    const onChange = vi.fn();
    const agg = new InputAggregator('keyboard', onChange);
    agg.press('keyboard', 'jump');
    expect(onChange).not.toHaveBeenCalled();
    agg.press('touch', 'dash');
    expect(onChange).toHaveBeenCalledWith('touch');
    expect(agg.step().device).toBe('touch');
  });

  it('releaseAll nhả mọi phím của một nguồn (ví dụ khi cửa sổ mất focus)', () => {
    const agg = new InputAggregator();
    agg.press('keyboard', 'jump');
    agg.press('keyboard', 'right');
    agg.step();
    agg.releaseAll('keyboard');
    const s = agg.step();
    expect(s.held.jump).toBe(false);
    expect(s.held.right).toBe(false);
    expect(s.released.jump).toBe(true);
  });
});
