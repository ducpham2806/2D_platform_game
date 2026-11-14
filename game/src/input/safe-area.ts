/**
 * Đọc vùng an toàn của màn hình (tai thỏ, góc bo, vùng vuốt hệ thống) từ CSS
 * `env(safe-area-inset-*)` (QB-92, ST-11-01). JavaScript không đọc thẳng được `env()`, nên dùng
 * một phần tử dò ẩn có `padding` bằng các giá trị đó rồi đọc `getComputedStyle`. Chỉ gọi khi đổi
 * kích thước hoặc xoay máy, không gọi mỗi khung.
 *
 * Cần `viewport-fit=cover` trong `index.html` (đã có); máy không có tai thỏ trả 0 cả bốn phía.
 */
import type { Insets } from '../logic/input/touch-layout';

let probe: HTMLDivElement | undefined;

function ensureProbe(): HTMLDivElement {
  if (probe?.isConnected) return probe;
  probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:0',
    'height:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top,0px)',
    'padding-right:env(safe-area-inset-right,0px)',
    'padding-bottom:env(safe-area-inset-bottom,0px)',
    'padding-left:env(safe-area-inset-left,0px)',
  ].join(';');
  document.body.append(probe);
  return probe;
}

function px(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Vùng an toàn hiện tại (px CSS). */
export function readSafeAreaInsets(): Insets {
  if (typeof document === 'undefined' || !document.body)
    return { top: 0, right: 0, bottom: 0, left: 0 };
  const style = getComputedStyle(ensureProbe());
  return {
    top: px(style.paddingTop),
    right: px(style.paddingRight),
    bottom: px(style.paddingBottom),
    left: px(style.paddingLeft),
  };
}
