# ST-13-02: nối đo lường vào game (chạy thử)

- **Bản chạy:** `npm run build` + `vite preview`, Chromium + Playwright, 14/11/2026. Cờ tạm `?debug=1&telemetry=1` (bộ ghi trong bộ nhớ, đọc qua `window.__cvTelemetry`); bản đợt thử MVP sẽ dùng `?mvp=<mã đợt>` (ST-13-03).
- **Không bật cờ (`?debug=1`):** `window.__cvTelemetry` không có; 0 request ra ngoài trang; 0 lỗi console.
- **Bật cờ, Pixel 7 ngang:** Menu → Chuẩn bị (Thorna, Thường) → vào đấu trường → để Thorna hạ Kai (còn 1 máu) → hạ Thorna → về menu.

| Kết quả | Giá trị |
| --- | --- |
| Chuỗi sự kiện | `session_start`, `boot_timing`, `stage_start`, `section_enter` ×2, `boss_start`, `tutorial_step_start`, `death`, `boss_end` (death), `boss_start`, hướng dẫn, `boss_end` (win), hướng dẫn, `stage_end` (clear) |
| Sự kiện sai lược đồ (`rejected`), không lưu được (`lost`) | 0, 0 |
| Lỗi console | 0 |
| Dung lượng | 17 sự kiện, khoảng 3 KB |

- `su-kien-mau.json`: toàn bộ sự kiện của lượt (dữ liệu giả lập, không có thông tin cá nhân). `pixel7-sau-luot.png`: màn hình sau lượt.
- Kịch bản bấm phím (K, J) nên `device` chuyển từ `touch` sang `keyboard` giữa lượt; `deviceSec` ghi đủ hai.
- `death.cause` của đòn boss hiện theo loại đạn (`boss:enemyShot`); tách theo tên đòn nếu báo cáo (ST-13-05) cần.
