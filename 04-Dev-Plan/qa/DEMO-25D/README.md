# Demo 2.5D three.js (ST-22-01)

- **Bản chạy:** `npm run build` + `vite preview`, Chromium + Playwright, 14/11/2026. Máy ảo không có GPU: WebGL chạy bằng CPU (SwiftShader), nên FPS ở đây không phản ánh điện thoại thật; video quay từng khung (`?capture=1`, mỗi khung tiến đúng 1/30 s) nên vẫn mượt.
- **Chế độ tự chơi** (`?auto=1`): Kai bất tử, Thorna bắt đầu ở 20% máu để video có đoạn hạ boss; thắng xong 5 s thì chơi lại.

| File | Nội dung |
| --- | --- |
| `demo-25d.mp4` | 24 s, 1280 × 720, 30 khung/s: vào phòng, cửa đóng, Thorna ra đòn (cảnh báo đỏ, hạt hồng, đạn lửa), Kai bắn và nạp đầy, Thorna bị hạ chìm xuống, chơi lại |
| `pc-q-cao.png` | Máy tính, chất lượng cao (bóng, bloom) |
| `pc-q-low.png` | Máy tính, `?q=low` (không bóng, không bloom, pixel ratio 1) |
| `pixel7.png` | Pixel 7 ngang, nút chạm |

- **Lỗi trang:** 0 ở cả ba cấu hình.
- **Chưa đo:** FPS, nhiệt trên điện thoại thật (ST-22-02).
