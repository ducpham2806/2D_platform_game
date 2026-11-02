import { describe, expect, it } from 'vitest';
import { parseControls } from '@/core/controls-config';
import { defaultTouchSettings } from '@/logic/input/settings';
import { applyDeadzone, clampToRadius, stickVector } from '@/logic/input/stick';
import {
  anchorToPoint,
  hitTest,
  pointToAnchor,
  resolveButtons,
  stickZone,
} from '@/logic/input/touch-layout';
import { loadData } from './helpers';

const touch = () => parseControls(loadData().controls).touch;
const PHONE = { width: 844, height: 390 };

describe('cần ảo', () => {
  it('trong vùng chết trả về 0', () => {
    expect(stickVector(100, 100, 105, 100, 60, 0.2)).toEqual({ x: 0, y: 0 });
  });

  it('kéo hết bán kính hoặc xa hơn thì độ lớn là 1', () => {
    const v = stickVector(100, 100, 400, 100, 60, 0.2);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
  });

  it('tăng dần đều từ mép vùng chết', () => {
    const half = stickVector(0, 0, 36, 0, 60, 0.2); // 0,6 bán kính → (0,6-0,2)/0,8 = 0,5
    expect(half.x).toBeCloseTo(0.5);
  });

  it('giữ hướng chéo', () => {
    const v = stickVector(0, 0, 60, 60, 60, 0);
    expect(v.x).toBeCloseTo(Math.SQRT1_2);
    expect(v.y).toBeCloseTo(Math.SQRT1_2);
  });

  it('núm cần không ra ngoài bán kính', () => {
    expect(clampToRadius(0, 0, 300, 0, 60)).toEqual({ x: 60, y: 0 });
    expect(clampToRadius(0, 0, 10, 0, 60)).toEqual({ x: 10, y: 0 });
  });

  it('vùng chết của cần tay cầm', () => {
    expect(applyDeadzone(0.1, 0.1, 0.25)).toEqual({ x: 0, y: 0 });
    expect(applyDeadzone(1, 0, 0.25).x).toBeCloseTo(1);
  });
});

describe('bố cục nút cảm ứng', () => {
  it('mọi nút ≥ 48 dp ở mọi cỡ và nằm trọn trong màn hình', () => {
    const config = touch();
    for (const sizePreset of ['small', 'medium', 'large'] as const) {
      for (const viewport of [PHONE, { width: 667, height: 375 }, { width: 1280, height: 720 }]) {
        const buttons = resolveButtons(viewport, config, {
          ...defaultTouchSettings(config),
          sizePreset,
        });
        for (const b of buttons) {
          expect(b.size).toBeGreaterThanOrEqual(48);
          expect(b.cx - b.size / 2).toBeGreaterThanOrEqual(0);
          expect(b.cy - b.size / 2).toBeGreaterThanOrEqual(0);
          expect(b.cx + b.size / 2).toBeLessThanOrEqual(viewport.width);
          expect(b.cy + b.size / 2).toBeLessThanOrEqual(viewport.height);
        }
      }
    }
  });

  it('các nút hành động chính không chồng lên nhau ở cỡ Vừa', () => {
    const config = touch();
    const buttons = resolveButtons(PHONE, config, defaultTouchSettings(config));
    for (let i = 0; i < buttons.length; i += 1) {
      for (let j = i + 1; j < buttons.length; j += 1) {
        const a = buttons[i]!;
        const b = buttons[j]!;
        expect(Math.hypot(a.cx - b.cx, a.cy - b.cy), `${a.id} và ${b.id}`).toBeGreaterThanOrEqual(
          (a.size + b.size) / 2,
        );
      }
    }
  });

  it('khớp vị trí wireframe LayoutEdit ở màn 844×390', () => {
    const config = touch();
    const jump = resolveButtons(PHONE, config, defaultTouchSettings(config)).find(
      (b) => b.id === 'jump',
    )!;
    expect(jump.cx).toBe(778);
    expect(jump.cy).toBe(318);
  });

  it('thuận tay trái lật nút sang bên trái và cần ảo sang bên phải', () => {
    const config = touch();
    const settings = { ...defaultTouchSettings(config), leftHanded: true };
    const jump = resolveButtons(PHONE, config, settings).find((b) => b.id === 'jump')!;
    expect(jump.cx).toBe(66);
    const zone = stickZone(PHONE, config, true);
    expect(zone.x + zone.width).toBe(PHONE.width);
  });

  it('vị trí kéo tay được dùng thay mặc định', () => {
    const config = touch();
    const settings = { ...defaultTouchSettings(config), offsets: { jump: { x: 100, y: 100 } } };
    const jump = resolveButtons(PHONE, config, settings).find((b) => b.id === 'jump')!;
    expect(jump.cx).toBe(744);
    expect(jump.cy).toBe(290);
  });

  it('anchorToPoint và pointToAnchor là nghịch đảo', () => {
    for (const anchor of ['bottom-right', 'top-right', 'bottom-left', 'top-left'] as const) {
      const p = anchorToPoint(anchor, 30, 70, PHONE);
      expect(pointToAnchor(anchor, p.cx, p.cy, PHONE)).toEqual({ x: 30, y: 70 });
    }
  });

  it('hitTest chọn nút gần nhất và bỏ qua chỗ trống', () => {
    const config = touch();
    const buttons = resolveButtons(PHONE, config, defaultTouchSettings(config));
    expect(hitTest(buttons, 778, 318, 48)?.action).toBe('jump');
    expect(hitTest(buttons, 690, 330, 48)?.action).toBe('shoot');
    expect(hitTest(buttons, 400, 200, 48)).toBeUndefined();
  });
});
