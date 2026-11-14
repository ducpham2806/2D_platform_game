# Kế hoạch làm việc (bản rút gọn)

Bản đầy đủ (vòng lặp làm việc với ChatGPT, nhịp tuần, rủi ro): `04-Dev-Plan/luu-tru/01-Ke-hoach-lam-viec-ban-day-du.md`. Chỉ đọc khi cần.

Giả định: 1 người, khoảng 20 giờ/tuần, 1 sprint = 1 tuần. Thời gian là ước lượng thô `[PLACEHOLDER]`.

## Quy tắc

- Mọi chỉ số đọc từ `03-Data/*.json`. Một thay đổi một commit, tag ở cuối mỗi mốc.
- Chỉ đưa giao diện (type, hàm công khai) của module khác vào ngữ cảnh, không đưa toàn bộ code.
- "Xong" một module: chạy trên PC và điện thoại, qua tiêu chí nghiệm thu của đặc tả, có test logic, không lỗi console, đã ghi vào `game/CONTEXT.md`.
- Cuối mỗi phiên: ghi nhật ký vào `06-Nhat-ky-phien.md` (xem `CLAUDE.md`).

## Lộ trình

Giai đoạn 2 chỉ bắt đầu khi qua cổng MVP. Chi tiết từng module ở `game/CONTEXT.md`.

**Giai đoạn 1: chứng minh game vui (khoảng 19 tuần)**

| Sprint | Mốc            | Module                                                                            | Trạng thái                                                                                                                                                                                           |
| ------ | -------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Khởi động      | M0, M1                                                                            | Code xong                                                                                                                                                                                            |
| 2–4    | Prototype      | M2 Đầu vào, M3 Nhân vật, M4 Chiến đấu, boss xám                                   | Code xong, đo tự động đạt; **còn chơi thử 5 người** (`05-Cong-Prototype.md`)                                                                                                                         |
| 5–9    | Vertical slice | M5 Kẻ địch, M7 Màn chơi, M6 Boss, M10 HUD cơ bản, M11 lưu cục bộ, TutorialManager | Code xong (Sprint 5–8): M5, khung M7, M6, M11 lưu cục bộ, M10 HUD cơ bản + hội thoại boss + màn Kết quả, khung TutorialManager. **Còn:** bản đồ thật + asset P1 + bước Prologue (chờ cổng Prototype) |
| 10–17  | MVP            | Stage 2–4, M8 RPG rút gọn, Xưởng, Shop chỉ Upgrade, 3 độ khó, bản web             | Bắt đầu: M8 cấp/SP/đồng bộ cấp (Sprint 8); phóng hình theo px thiết bị; tài liệu M8 + EP-08 (9 Story) chờ duyệt                                                                                      |
| 18–19  | Cổng MVP       | Playtest khoảng 50 người, sửa cảm giác chơi và màn                                | Chưa                                                                                                                                                                                                 |

Asset theo mốc (xem `05-Assets`): Sprint 1 style bible, Kai, bảng màu; Prototype nhóm P0; Vertical slice Prologue và Stage 1 (P1); MVP nhóm P2 phần Stage 2–4.

**Giai đoạn 2: mở rộng (ước lượng lại sau cổng MVP, dự kiến 30–40 tuần)**

| Mốc          | Module                                                   | Asset             |
| ------------ | -------------------------------------------------------- | ----------------- |
| Alpha        | Stage 5–8, M8 RPG đầy đủ, M9 Shop đầy đủ, M10 Hub        | P3 (Stage 5–8)    |
| Beta         | Citadel, kết thúc, M12 Âm thanh, M11 cloud               | P3 còn lại        |
| Live-ops MVP | M13 Live-ops, M14 Kiếm tiền, M16 Phân tích, M17 Đóng gói | UI Live-ops (P4)  |
| Endgame MVP  | M15 Endgame                                              | Chip Lõi (P4)     |
| Soft launch  | M18 QA, chỉnh bằng Remote Config                         | Ảnh cửa hàng (P5) |
