/**
 * Tính bố cục scale nguyên lần cho canvas logic (GDD mục 15: 320×192, scale nguyên,
 * không làm mờ, dư thì viền đen). Logic thuần để test được.
 */
export interface ViewportLayout {
  /**
   * Hệ số phóng tính bằng px CSS (= `deviceZoom` / tỉ lệ px thiết bị), có thể lẻ: trên điện thoại
   * 1 px CSS là 2–3 px thật nên phóng nguyên theo px thật to hơn nhiều mà vẫn nét.
   */
  zoom: number;
  /** Hệ số phóng nguyên tính bằng px thiết bị (≥ 1): mỗi px logic là deviceZoom × deviceZoom px thật. */
  deviceZoom: number;
  /** Kích thước canvas sau khi phóng, tính bằng px CSS. */
  width: number;
  height: number;
  /** Viền đen mỗi bên để căn giữa (px CSS, rơi đúng biên px thiết bị). */
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
 * Bố cục canvas: chọn hệ số nguyên lớn nhất theo px **thiết bị** (`pixelRatio` =
 * `devicePixelRatio`), rồi quy ra px CSS. Viền tính theo px thiết bị rồi mới chia, để canvas bắt
 * đầu đúng biên một px thật (lệch nửa px thật thì trình duyệt làm nhòe hoặc lệch cỡ px).
 */
export function computeLayout(
  viewWidth: number,
  viewHeight: number,
  logicWidth: number,
  logicHeight: number,
  pixelRatio = 1,
): ViewportLayout {
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  // Sai số dấu phẩy động (ví dụ 863 × 2,625) không được làm hụt mất một px thật.
  const devWidth = Math.floor(viewWidth * ratio + 1e-6);
  const devHeight = Math.floor(viewHeight * ratio + 1e-6);
  const deviceZoom = integerZoom(devWidth, devHeight, logicWidth, logicHeight);
  const zoom = deviceZoom / ratio;
  return {
    zoom,
    deviceZoom,
    width: logicWidth * zoom,
    height: logicHeight * zoom,
    offsetX: Math.max(0, Math.floor((devWidth - logicWidth * deviceZoom) / 2)) / ratio,
    offsetY: Math.max(0, Math.floor((devHeight - logicHeight * deviceZoom) / 2)) / ratio,
    portrait: isPortrait(viewWidth, viewHeight),
  };
}
