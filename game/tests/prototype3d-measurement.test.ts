import { describe, expect, it } from 'vitest';
import { FrameStats } from '../src/logic/telemetry/frame-stats';
import { roomCapture, roomFrameMetrics } from '../src/prototype3d/measurement';

function metrics(...frames: number[]) {
  const stats = new FrameStats(1000 / 30, Infinity);
  for (const ms of frames) stats.add(ms);
  return roomFrameMetrics(stats);
}

describe('ST-22-07 3D report frame precision', () => {
  it('exports a bound rather than a false point estimate when the median is in the overflow bin', () => {
    expect(metrics(200, 200, 200)).toEqual({
      fpsAverage: 5,
      fpsMedian: null,
      fpsMedianUpperBound: 10,
      slowFramePct: 100,
      frames: 3,
      activeMs: 600,
    });
    expect(metrics(99.9, 100, 101).fpsMedianUpperBound).toBe(10);
  });

  it('keeps an in-range median even when some frames reach the overflow bin', () => {
    const reported = metrics(20, 20, 20, 200, 200);
    expect(reported).toEqual({
      fpsAverage: 10.9,
      fpsMedian: 49.4,
      fpsMedianUpperBound: null,
      slowFramePct: 40,
      frames: 5,
      activeMs: 460,
    });
    // Match FrameStats's existing lower-median convention for even sample counts.
    expect(metrics(20, 20, 200, 200).fpsMedianUpperBound).toBeNull();
  });

  it('distinguishes no samples from a censored median', () => {
    expect(metrics()).toEqual({
      fpsAverage: null,
      fpsMedian: null,
      fpsMedianUpperBound: null,
      slowFramePct: null,
      frames: 0,
      activeMs: 0,
    });
  });
});

describe('ST-22-07 exported capture metadata', () => {
  it('records device UTC and a valid artifact digest independently', () => {
    const expected = '2026-11-25T02:00:00.000Z';
    const now = new Date('2026-11-25T09:00:00+07:00');
    const artifact = 'a'.repeat(64);
    expect(roomCapture(now, artifact)).toEqual({
      capturedAtUtc: expected,
      artifactSha256: artifact,
    });
    expect(roomCapture(now, 'manual-label')).toEqual({ capturedAtUtc: expected });
    expect(roomCapture(new Date(NaN), artifact)).toEqual({ artifactSha256: artifact });
  });

  it('does not invent provenance when both inputs are unavailable', () => {
    expect(roomCapture(new Date(NaN), undefined)).toBeUndefined();
  });
});
