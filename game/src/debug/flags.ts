/**
 * Cờ gỡ lỗi theo địa chỉ trang. Bản dev luôn bật; bản build thật bật bằng tham số:
 *   ?debug=1  gắn window.__cvGame / __cvWorld, phím T gây sát thương thử (dùng cho bài đo cổng).
 *   ?tune=1   hiện nút mở bảng chỉnh cảm giác (dùng khi chơi thử trên điện thoại).
 *   ?gate=1   bản cho người thử cổng Prototype: menu chỉ còn Chơi (màn xám), Điều khiển và Kết
 *             quả chơi thử, để người thử không vào nhầm phòng thử khác (chỉ màn xám ghi nhật ký).
 *   ?shop=1   mở Quầy Mira khi chưa đủ boss (tính như đã hạ đủ số boss của mốc mở đầu tiên),
 *             để chạy thử Shop trước khi có Stage 2. Chỉ có tác dụng cùng DEBUG; mua vẫn được ghi.
 *   ?unlock=1 mở mọi độ khó ở màn Chuẩn bị (chạy thử Thử thách). Chỉ có tác dụng cùng DEBUG;
 *             không ghi gì vào bản lưu.
 *   ?telemetry=1 bật đo lường trong bộ nhớ (EP-13, ST-13-02b) để chạy thử: không lưu, không gửi,
 *             đọc qua window.__cvTelemetry. Chỉ có tác dụng cùng DEBUG. Bản đợt thử MVP sẽ bật bằng
 *             ?mvp=<mã đợt> (ST-13-03).
 *   ?staff=1  đánh dấu người làm game trong `session_start` (báo cáo loại ra).
 */
function hasParam(name: string): boolean {
  try {
    return new URLSearchParams(window.location.search).has(name);
  } catch {
    return false;
  }
}

export const DEBUG = import.meta.env.DEV || hasParam('debug');
export const TUNE = import.meta.env.DEV || hasParam('tune');
export const GATE = hasParam('gate');
export const SHOP = DEBUG && hasParam('shop');
export const UNLOCK_ALL = DEBUG && hasParam('unlock');
export const TELEMETRY_DEBUG = DEBUG && hasParam('telemetry');
export const STAFF = hasParam('staff');
