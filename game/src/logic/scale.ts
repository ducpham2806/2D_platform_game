/**
 * Tính bố cục scale nguyên lần cho canvas logic (GDD mục 15: 320×192, scale nguyên,
 * không làm mờ, dư thì viền đen). Logic thuần để test được.
 */
export interface ViewportLayout {
  /**
   * Hệ số phóng tính bằng px CSS. Là số nguyên tính theo **điểm ảnh thật** của màn hình
   * (zoom × pixelRatio nguyên), nên trên màn mật độ cao có thể là số lẻ mà hình vẫn nét.
   */
  zoom: number;
  /** Kích thước canvas sau khi phóng, tính bằng px CSS. */
  width: number;
  height: number;
  /** Viền đen mỗi bên để căn giữa. */
  offsetX: number;
  offsetY: number;
  /** Màn hình đang cầm dọc: cần nhắc người chơi xoay ngang. */
  portrait: boolean;
}

export function isPortrait(viewWidth: number, viewHeight: number): boolean {
  return viewHeight > viewWidth;
}

/**
 * Hệ số phóng nguyên lớn nhất mà canvas logic vẫn nằm trọn trong vùng hiển thị.
 * Nhỏ hơn cả kích thước logic thì vẫn trả về 1 (ưu tiên nét hơn là vừa khít).
 */
export function integerZoom(
  viewWidth: number,
  viewHeight: number,
  logicWidth: number,
  logicHeight: number,
): number {
  if (logicWidth <= 0 || logicHeight <= 0) {
    throw new RangeError('Kích thước logic phải dương');
  }
  if (!(viewWidth > 0) || !(viewHeight > 0)) return 1;
  const fit = Math.min(viewWidth / logicWidth, viewHeight / logicHeight);
  return Math.max(1, Math.floor(fit));
}

/**
 * @param pixelRatio `devicePixelRatio` của màn hình. Hệ số phóng nguyên được tính trên điểm ảnh
 *   thật: điện thoại cầm ngang thường chỉ cao 340–410 px CSS (dưới 2 × 192) nhưng có 900–1100
 *   điểm ảnh thật, nên tính theo px CSS thì game chỉ phóng 1× và chiếm một góc màn hình.
 */
export function computeLayout(
  viewWidth: number,
  viewHeight: number,
  logicWidth: number,
  logicHeight: number,
  pixelRatio = 1,
): ViewportLayout {
  const ratio = pixelRatio > 0 && Number.isFinite(pixelRatio) ? pixelRatio : 1;
  const zoom = integerZoom(viewWidth * ratio, viewHeight * ratio, logicWidth, logicHeight) / ratio;
  const width = logicWidth * zoom;
  const height = logicHeight * zoom;
  return {
    zoom,
    width,
    height,
    offsetX: Math.max(0, Math.floor((viewWidth - width) / 2)),
    offsetY: Math.max(0, Math.floor((viewHeight - height) / 2)),
    portrait: isPortrait(viewWidth, viewHeight),
  };
}
