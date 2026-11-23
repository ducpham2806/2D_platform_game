# EP-22: Đồ họa 2.5D thời gian thực (three.js)

- **Quyết định:** người dùng chọn cách c ngày 14/11/2026 (`09-Quyet-dinh-cho-duyet.md` mục 3). Kiến trúc và cách chuyển: `04-Dev-Plan/adr/ADR-003-do-hoa-25d-threejs.md` (Proposed).
- **Không đụng bản thử G1:** demo là trang riêng (`demo-25d.html`); game Phaser và `?gate=1` giữ nguyên.

| Mã | Tên | Phụ thuộc | Cỡ | Trạng thái |
| --- | --- | --- | --- | --- |
| ST-22-01 | Demo 2.5D: phòng Thorna bằng three.js trên StageWorld thật; tự chơi, quay video từng khung | — | 1 phiên | DONE (14/11/2026) |
| ST-22-02 | Đo demo trên máy thật (Android yếu, trung, iPhone): FPS cao/thấp, nhiệt, tải; mức chất lượng tự hạ | Demo lên Pages (sau đợt thử G1) | 0,5 phiên + người dùng | Chưa |
| ST-22-03 | Duyệt ADR-003 (Technical Director, Creative Director); lan sang GDD mục 14, `05-Assets` | 22-02 | 1 phiên | Chưa |
| ST-22-04 | Lớp vẽ three.js dùng chung cho mọi màn (tách từ demo), HUD và bảng HTML giữ nguyên | 22-03 | 2–3 phiên | Chưa |
| ST-22-05 | Pipeline model glTF (Kai, kẻ địch, boss), hoạt ảnh xương, ngân sách tam giác/kết cấu | 22-03 | chưa ước lượng | Chưa |

## ST-22-01: Demo 2.5D

- **Trạng thái:** DONE (14/11/2026) · **Bằng chứng:** [x] Visual (video 24 s, ảnh PC và Pixel 7 ở `qa/DEMO-25D/`) [x] Logic (`tests/demo25d.test.ts`: đổi tọa độ, camera)
- **Đã làm:** `game/demo-25d.html`, `game/src/demo25d/` (`coords.ts` thuần, `input.ts` bàn phím và nút chạm, `stage3d.ts` cảnh và ánh sáng, `actors.ts` Kai, Thorna, đạn, cảnh báo đòn, hạt, `main.ts` vòng chính, camera, bloom, HUD, tự chơi, quay từng khung), `game/scripts/demo25d-video.mjs`, trang thứ hai trong `vite.config.ts`, three.js 0.170 trong `package.json`.
- **Tiêu chí:** [x] chạy trên StageWorld thật, không đổi logic; [x] chơi được bằng bàn phím và nút chạm; [x] tự chơi hạ Thorna (chế độ quay video: Thorna bắt đầu ở 20% máu, Kai bất tử); [x] 0 lỗi trang; [x] game Phaser không nạp three.js; [ ] FPS trên máy thật (ST-22-02).
- **Cách mở:** `npm run dev` rồi `/demo-25d.html` (`?auto=1` tự chơi, `?q=low` chất lượng thấp); quay video: `npm run build && node scripts/demo25d-video.mjs <thư mục> 24 30`.
