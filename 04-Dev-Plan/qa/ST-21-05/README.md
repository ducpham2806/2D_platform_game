# ST-21-05: ảnh để người dùng duyệt hướng đồ họa (bộ hình vẽ bằng mã của PR #9)

- **Mục đích:** người dùng chọn hướng đồ họa (`09-Quyet-dinh-cho-duyet.md` mục 3) trước khi mở ST-21-05. Story chưa làm; ảnh chụp từ nhánh PR #9.
- **Bản chạy:** nhánh `claude/peaceful-mccarthy-13m5ah` (commit `bc49696`), `npm run build` + `vite preview`, Chromium + Playwright, 14/11/2026. `npm run smoke` của PR #9 đạt 10/10, 0 lỗi console.

| Ảnh | Nội dung |
| --- | --- |
| `so-sanh-hinh-khoi-va-pr9.png` | Phòng thử kẻ địch: trái là bản hiện tại (hình khối, bản chơi thử G1), phải là PR #9 |
| `ban-hien-tai-phong-ke-dich.png`, `pr9-phong-ke-dich.png` | Hai ảnh gốc của ảnh so sánh |
| `pr9-menu.png` | Màn hình chính: logo, nền thành phố |
| `pr9-man-choi.png` | Kai, tileset rừng, nền parallax, khung HUD |
| `pr9-thorna-tran-dau.png` | Trận Thorna: boss, thanh máu boss, hộp hướng dẫn khung 9 mảnh |
| `pr9-hoi-thoai-boss.png` | Hộp thoại boss có chân dung Thorna |
| `pr9-cam-ung-pixel7.png` | Pixel 7 ngang, nút cảm ứng theo bảng màu (PR #9 chưa có safe-area của ST-11-01) |

- **Ghi chú:** Kai cao 28 px (vừa hộp va chạm); chữ vẫn là phông hệ thống. Hình do Claude vẽ bằng mã Python (`05-Assets/tools/codeart/` trên nhánh PR #9), không phải hình vẽ tay.
