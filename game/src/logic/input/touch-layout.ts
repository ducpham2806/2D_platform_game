import type { Action } from './actions';

export type Anchor = 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
export type SizePreset = 'small' | 'medium' | 'large';
export type StickMode = 'floating' | 'fixed';

export interface TouchButtonConfig {
  id: string;
  action: Action;
  label: string;
  anchor: Anchor;
  /** Khoảng cách từ cạnh neo ngang tới tâm nút (px CSS = dp). */
  x: number;
  /** Khoảng cách từ cạnh neo dọc tới tâm nút. */
  y: number;
  sizeDp: number;
  /** Nút vuốt (biểu tượng vũ khí): chạm = vũ khí sau, vuốt trái/phải = trước/sau. */
  swipe?: boolean;
}

export interface TouchConfig {
  minButtonDp: number;
  /** Quãng vuốt ngang tối thiểu (dp) để tính là vuốt thay vì chạm. */
  swipeMinDp: number;
  sizePresets: Record<SizePreset, number>;
  defaultSizePreset: SizePreset;
  defaultOpacity: number;
  opacityRange: [number, number];
  stick: {
    radiusDp: number;
    deadzone: number;
    zoneWidthFraction: number;
    zoneTopFraction: number;
    fixedCenter: { left: number; bottom: number };
  };
  buttons: TouchButtonConfig[];
}

export interface TouchSettings {
  sizePreset: SizePreset;
  opacity: number;
  leftHanded: boolean;
  vibration: boolean;
  autoFire: boolean;
  aimAssist: boolean;
  stickMode: StickMode;
  /** Vị trí người chơi tự kéo, theo cùng hệ tọa độ với cấu hình (cạnh neo đã lật nếu thuận tay trái). */
  offsets: Record<string, { x: number; y: number }>;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface ResolvedButton {
  id: string;
  action: Action;
  label: string;
  cx: number;
  cy: number;
  size: number;
  swipe: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function mirrorAnchor(anchor: Anchor): Anchor {
  switch (anchor) {
    case 'bottom-right':
      return 'bottom-left';
    case 'bottom-left':
      return 'bottom-right';
    case 'top-right':
      return 'top-left';
    case 'top-left':
      return 'top-right';
  }
}

export function effectiveAnchor(anchor: Anchor, leftHanded: boolean): Anchor {
  return leftHanded ? mirrorAnchor(anchor) : anchor;
}

export function buttonSize(
  config: TouchConfig,
  button: TouchButtonConfig,
  preset: SizePreset,
): number {
  return Math.max(config.minButtonDp, Math.round(button.sizeDp * config.sizePresets[preset]));
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

/** Tọa độ tâm (px CSS trong viewport) từ khoảng cách tới cạnh neo. */
export function anchorToPoint(anchor: Anchor, x: number, y: number, viewport: Viewport) {
  const right = anchor.endsWith('right');
  const bottom = anchor.startsWith('bottom');
  return { cx: right ? viewport.width - x : x, cy: bottom ? viewport.height - y : y };
}

/** Ngược lại với anchorToPoint: dùng khi người chơi kéo nút trong chế độ chỉnh. */
export function pointToAnchor(anchor: Anchor, cx: number, cy: number, viewport: Viewport) {
  const right = anchor.endsWith('right');
  const bottom = anchor.startsWith('bottom');
  return { x: right ? viewport.width - cx : cx, y: bottom ? viewport.height - cy : cy };
}

/** Vị trí và kích thước thật của mọi nút cho viewport hiện tại; nút luôn nằm trọn trong màn hình. */
export function resolveButtons(
  viewport: Viewport,
  config: TouchConfig,
  settings: TouchSettings,
): ResolvedButton[] {
  const scale = config.sizePresets[settings.sizePreset];
  return config.buttons.map((button) => {
    const size = buttonSize(config, button, settings.sizePreset);
    const anchor = effectiveAnchor(button.anchor, settings.leftHanded);
    const custom = settings.offsets[button.id];
    // Vị trí mặc định giãn theo cỡ nút để nút to không chồng lên nhau.
    const x = custom ? custom.x : button.x * scale;
    const y = custom ? custom.y : button.y * scale;
    const point = anchorToPoint(anchor, x, y, viewport);
    const half = size / 2;
    return {
      id: button.id,
      action: button.action,
      label: button.label,
      cx: clamp(point.cx, half, viewport.width - half),
      cy: clamp(point.cy, half, viewport.height - half),
      size,
      swipe: button.swipe ?? false,
    };
  });
}

/** Nút gần nhất chứa điểm chạm (vùng bấm tối thiểu bằng minButtonDp). */
export function hitTest(
  buttons: readonly ResolvedButton[],
  x: number,
  y: number,
  minButtonDp: number,
): ResolvedButton | undefined {
  let best: ResolvedButton | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const button of buttons) {
    const radius = Math.max(button.size, minButtonDp) / 2;
    const distance = Math.hypot(x - button.cx, y - button.cy);
    if (distance <= radius && distance < bestDistance) {
      best = button;
      bestDistance = distance;
    }
  }
  return best;
}

/** Vùng chạm để hiện cần ảo nổi (nửa trái, hoặc nửa phải nếu thuận tay trái). */
export function stickZone(viewport: Viewport, config: TouchConfig, leftHanded: boolean): Rect {
  const width = viewport.width * config.stick.zoneWidthFraction;
  const top = viewport.height * config.stick.zoneTopFraction;
  return {
    x: leftHanded ? viewport.width - width : 0,
    y: top,
    width,
    height: viewport.height - top,
  };
}

export function fixedStickCenter(viewport: Viewport, config: TouchConfig, leftHanded: boolean) {
  const { left, bottom } = config.stick.fixedCenter;
  return {
    cx: leftHanded ? viewport.width - left : left,
    cy: viewport.height - bottom,
  };
}

export function inRect(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/** Hành động của một lần chạm/vuốt trên nút vuốt: vuốt trái = vũ khí trước, còn lại = vũ khí sau. */
export function swipeAction(dx: number, swipeMinDp: number): 'swapPrev' | 'swapNext' {
  return dx <= -swipeMinDp ? 'swapPrev' : 'swapNext';
}
