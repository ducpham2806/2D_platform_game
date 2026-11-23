# Nhật ký phiên làm việc

Quy tắc bắt buộc (xem `CLAUDE.md`): cuối mỗi phiên thêm một mục mới lên **đầu** danh sách bên dưới.

Để giảm token đầu phiên:

- File này chỉ giữ **tối đa 3 mục mới nhất**. Khi thêm mục mới mà vượt 3, chuyển mục cũ nhất lên đầu `04-Dev-Plan/luu-tru/06-Nhat-ky-phien-luu-tru.md` (không sửa nội dung).
- Mỗi mục ngắn gọn, khoảng 15 dòng: chi tiết kỹ thuật thuộc về commit và `game/CONTEXT.md`, không chép lại ở đây.
- Mục "Tiếp theo" của mục mới nhất là nơi phiên sau bắt đầu.

Mẫu:

```
## YYYY-MM-DD: <tiêu đề ngắn>
- Nhánh / commit:
- Mục tiêu:
- Đã làm:
- File chính:
- Quyết định:
- Lỗi tìm thấy / đã sửa:
- Kiểm tra: test, lint, format, build, chạy thử
- Còn dở / chưa làm:
- Tiếp theo:
```

---

## 2026-11-24: ST-22-07 Kiểm hoạt ảnh Kai và khôi phục báo cáo

- **Nhánh:** `codex/asset-3d-plan`, tiếp từ `f10bba9`.
- **Mục tiêu:** kiểm bản sửa hoạt ảnh và đọc số tải, FPS, điểm đáp của lượt điện thoại người chơi đã gửi.
- **Kết quả hoạt ảnh:** GLB đang phục vụ trên LAN trùng với bản sửa. Test three.js xác nhận Kai đổi chân qua ba vòng chạy liên tiếp.
- **Lỗi tìm thấy:** đường nhận trước đã dừng. Tệp phiên cũ trống và đã mở lại cùng đường nhận để có thể gửi lại từ tab điện thoại.
- **Đã làm:** báo cáo mới lưu bản sao trên trình duyệt trước khi gửi. Máy chủ dùng tệp theo mã phiên, giữ qua lần khởi động lại. Thêm mục nhận xét hoạt ảnh chạy.
- **File chính:** `game/src/prototype3d/measurement.ts`, `game/scripts/prototype3d-lan.mjs` và [QA](qa/ST-22-07/README.md).
- **Kiểm tra:** 745 test, lint, format, build và docs-check đạt. Pixel 7 giả lập kiểm lưu khi mất đường gửi, tải lại trang, gửi lại và mở lại máy chủ.
- **Còn lại:** cần báo cáo của lượt điện thoại để ghi số đo và nhận xét.

## 2026-11-23: ST-22-07 Đo phòng 3D trên điện thoại thật

- **Nhánh:** `codex/asset-3d-plan`, tiếp từ `027d7a5`.
- **Mục tiêu:** đo tải, FPS và độ dễ đọc điểm đáp khi chơi bằng điện thoại thật.
- **Đã làm:** đo tải đến khung 3D đầu tiên, lấy mẫu FPS khi chơi, đếm rơi theo đoạn. Biểu mẫu nhận mẫu máy, đoạn khó, điểm đáp và ghi chú.
- **File chính:** `game/src/prototype3d/measurement.ts`, `game/scripts/prototype3d-lan.mjs` và [quy trình QA](qa/ST-22-07/README.md).
- **Quyết định:** dùng bản build với `?measure=1` qua Wi-Fi. Số đo và trả lời lưu cục bộ. Lượt thử máy thật dùng chất lượng mặc định.
- **Lỗi đã sửa:** Kai giữ tư thế nhấc chân vì clip `Run` trong GLB bắt đầu ở 1,5 s. Xuất lại từ Blender với từng clip bắt đầu ở 0 s.
- **Kiểm tra:** 745 test, lint, format, build và docs-check đạt. Test three.js giữ chạy ba vòng, xác nhận hai chân đổi bên trong mỗi vòng. Pixel 7 giả lập xác nhận bấm giữ cần, về `Idle` và lưu báo cáo sau khi tạm dừng. Hồi quy G1 đạt trên bản thêm bộ đo.
- **Còn lại:** chờ người chơi gửi lượt điện thoại qua LAN.
- **Tiếp theo:** đối chiếu FPS và tải với ADR-003. Xem nhận xét điểm đáp cùng các lần rơi trước khi điều chỉnh camera.

## 2026-11-23: ST-22-06 Phòng thử 3D và bộ asset Kai

- **Nhánh:** `codex/asset-3d-plan`, tiếp từ `ac8b422`.
- **Mục tiêu:** thử gameplay 3D X/Z thật và camera bám góc 3/4 trong một tuyến 60–90 giây.
- **Đã làm:** hai dãy bục lệch trục, Arc Cannon bắn mở cổng, lướt, hai checkpoint, hồi sinh và thống kê lượt. Có cần cảm ứng, khối xám và chế độ chất lượng thấp.
- **Asset:** Kai low-poly 2.020 tam giác, rig 11 xương, bảy clip và điểm nòng. Kit có bốn mô-đun sàn, bục, mép và vách. Nguồn Blender và GLB ở [thư mục asset](../05-Assets/prototype-3d/README.md).
- **File chính:** `game/prototype-3d.html`, `03-Data/prototype3d.json`, `game/src/logic/prototype3d/` và `game/src/prototype3d/`.
- **Quyết định:** dùng trang riêng và tách luật di chuyển, va chạm khỏi model. Cổng G1 tiếp tục qua trang Phaser.
- **Lỗi đã sửa:** lượt bàn phím đầu chỉ dài 45 s, mở rộng vòng cầu cuối để thử đọc chiều sâu khi đổi hướng. Nâng nhẹ phần trang trí sàn để tránh chồng mặt.
- **Kiểm tra:** 744 test, lint, format, build, docs-check và gate-flow đạt. Chromium bàn phím 64,7 s, Pixel 7 ngang giả lập 66,3 s và một lần rơi chủ động. Cả hai lượt có 0 lỗi console. [Kịch bản và ảnh](qa/ST-22-06/README.md).
- **Còn lại:** cần người chơi thử và đo tải, FPS trên Android và iPhone thật theo ADR-003 mục 5.
- **Tiếp theo:** khi có kết quả máy thật, dùng số lần rơi và các đoạn khó đọc để chốt camera và phạm vi asset tiếp theo.
