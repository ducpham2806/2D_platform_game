# Tóm tắt kỹ thuật (lưu trữ 14/11/2026)

> Đã chuyển vào lưu trữ: kiến trúc và quyết định kỹ thuật hiện hành nằm ở `game/CONTEXT.md` và GDD chính mục 15. Các "quyết định còn mở" bên dưới đã chốt ở `01-GDD/05-Ke-hoach-kiem-tien.md` mục 13.

Chi tiết nằm trong `04-Dev-Plan/`. Phần này chỉ giữ các quyết định kỹ thuật cốt lõi.

- **Công nghệ đề xuất:** Phaser 3 + TypeScript + Vite; Vitest cho test; Capacitor để đóng gói Android/iOS; bản web riêng.
- **Độ phân giải logic:** 320×192, ô 16×16, scale nguyên, chỉ chơi ngang.
- **Dữ liệu:** mọi chỉ số đọc từ `03-Data/*.json`, không viết cứng.
- **Máy chủ:** giữ Gem, giao dịch, bốc thăm rơi đồ và bảng xếp hạng; client chỉ hiển thị. Cloud save không tự gộp khi xung đột.
- **Quảng cáo và thanh toán:** AdMob và IAP trong app gốc; H5 Games Ads và cổng thanh toán web cho bản web. Remote Config để chỉnh tần suất và tỷ lệ.
- **Quyết định còn mở:** nhà cung cấp backend, giá cuối của Shop, ngôn ngữ phụ đề, mô hình kiếm tiền A hay B, độ tuổi 13+, thứ tự phát hành (xem mục 13 trong `01-GDD/05-Ke-hoach-kiem-tien.md`).
