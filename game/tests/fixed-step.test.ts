import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, MAX_STEPS_PER_FRAME } from '@/core/constants';
import { FixedStep } from '@/logic/fixed-step';

describe('FixedStep', () => {
  it('chạy đúng 60 bước cho 1 giây dù khung hình 30, 60 hay 144 FPS', () => {
    for (const fps of [30, 60, 144]) {
      const stepper = new FixedStep(FIXED_STEP_MS, MAX_STEPS_PER_FRAME);
      let steps = 0;
      for (let i = 0; i < fps; i += 1) steps += stepper.advance(1000 / fps);
      expect(Math.abs(steps - 60)).toBeLessThanOrEqual(1);
    }
  });

  it('giữ phần lẻ giữa các khung', () => {
    const stepper = new FixedStep(10, 5);
    expect(stepper.advance(15)).toBe(1);
    expect(stepper.alpha).toBeCloseTo(0.5);
    expect(stepper.advance(5)).toBe(1);
    expect(stepper.alpha).toBeCloseTo(0);
  });

  it('giới hạn số bước khi khung bị treo lâu và bỏ phần dư', () => {
    const stepper = new FixedStep(10, 5);
    expect(stepper.advance(1000)).toBe(5);
    expect(stepper.alpha).toBe(0);
    expect(stepper.advance(10)).toBe(1);
  });

  it('bỏ qua delta không hợp lệ', () => {
    const stepper = new FixedStep(10, 5);
    expect(stepper.advance(0)).toBe(0);
    expect(stepper.advance(-5)).toBe(0);
    expect(stepper.advance(Number.NaN)).toBe(0);
    expect(stepper.totalSteps).toBe(0);
  });

  it('kiểm tra tham số khi tạo', () => {
    expect(() => new FixedStep(0, 5)).toThrow(RangeError);
    expect(() => new FixedStep(10, 0)).toThrow(RangeError);
  });
});
