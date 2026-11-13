/**
 * Cờ gỡ lỗi theo địa chỉ trang. Bản dev luôn bật; bản build thật bật bằng tham số:
 *   ?debug=1  gắn window.__cvGame / __cvWorld, phím T gây sát thương thử (dùng cho bài đo cổng).
 *   ?tune=1   hiện nút mở bảng chỉnh cảm giác (dùng khi chơi thử trên điện thoại).
 *   ?lang=en  chạy bằng ngôn ngữ khác ngôn ngữ mặc định (tới khi có màn Cài đặt).
 */
function hasParam(name: string): boolean {
  try {
    return new URLSearchParams(window.location.search).has(name);
  } catch {
    return false;
  }
}

/** Giá trị của tham số `name` trên địa chỉ trang (ví dụ ?lang=en), không có thì undefined. */
export function urlParam(name: string): string | undefined {
  try {
    return new URLSearchParams(window.location.search).get(name) ?? undefined;
  } catch {
    return undefined;
  }
}

export const DEBUG = import.meta.env.DEV || hasParam('debug');
export const TUNE = import.meta.env.DEV || hasParam('tune');
