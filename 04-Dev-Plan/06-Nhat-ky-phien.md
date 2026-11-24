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

## 2026-11-24: ST-22-07 Mở lại phiên đo trên Wi-Fi

- **Nhánh:** `codex/asset-3d-plan`, tiếp từ `18b8472`.
- **Mục tiêu:** tiếp tục phiên đo máy thật và xác nhận đường vào phòng.
- **Đã làm:** mở lại hai máy chủ thử bằng tiến trình tách khỏi lệnh khởi động. Giữ cùng địa chỉ, cổng và mã phiên Wi-Fi để gửi lại bản lưu trên điện thoại.
- **Kiểm tra:** cả hai địa chỉ trả HTTP 200 sau khi lệnh khởi động kết thúc. Bản hiện tại về đích sau 64,2 s bằng bàn phím và 66,1 s trên Pixel 7 ngang giả lập, cả hai có 0 lỗi console. [QA](qa/ST-22-07/README.md).
- **Còn lại:** phiên đo đang chờ báo cáo điện thoại thật để đối chiếu tải, FPS, hoạt ảnh chạy và điểm đáp.

## 2026-11-24: ST-22-07 Mở phòng thử qua HTTP

- **Nhánh:** `codex/asset-3d-plan`, tiếp từ `769a520`.
- **Lỗi:** ảnh người chơi cho thấy Chrome mở tệp nguồn `prototype-3d.html` qua `file://`. JavaScript và model cần máy chủ HTTP nên giao diện dừng ở thông báo đang nạp.
- **Đã làm:** mở bản preview Mac tại cổng 4186, kiểm bản đo Wi-Fi cổng 4187 và giữ cùng mã phiên. Tệp HTML mở trực tiếp hiện hướng dẫn và link sang bản Mac.
- **File chính:** `game/prototype-3d.html`, `game/README.md` và [ảnh QA](qa/ST-22-07/pc-05-huong-dan-mo-qua-http.png).
- **Kiểm tra:** 745 test, lint, format, build, docs-check đạt. Chromium xác nhận tệp nguồn và build đều hiện hướng dẫn, link Mac vào chơi và link Wi-Fi hiện cần cảm ứng trên Pixel 7 giả lập.
- **Còn lại:** chờ nhận số đo và nhận xét từ điện thoại thật.

## 2026-11-24: ST-22-07 Kiểm hoạt ảnh Kai và khôi phục báo cáo

- **Nhánh:** `codex/asset-3d-plan`, tiếp từ `f10bba9`.
- **Mục tiêu:** kiểm bản sửa hoạt ảnh và đọc số tải, FPS, điểm đáp của lượt điện thoại người chơi đã gửi.
- **Kết quả hoạt ảnh:** GLB đang phục vụ trên LAN trùng với bản sửa. Test three.js xác nhận Kai đổi chân qua ba vòng chạy liên tiếp.
- **Lỗi tìm thấy:** đường nhận trước đã dừng. Tệp phiên cũ trống và đã mở lại cùng đường nhận để có thể gửi lại từ tab điện thoại.
- **Đã làm:** báo cáo mới lưu bản sao trên trình duyệt trước khi gửi. Máy chủ dùng tệp theo mã phiên, giữ qua lần khởi động lại. Thêm mục nhận xét hoạt ảnh chạy.
- **File chính:** `game/src/prototype3d/measurement.ts`, `game/scripts/prototype3d-lan.mjs` và [QA](qa/ST-22-07/README.md).
- **Kiểm tra:** 745 test, lint, format, build và docs-check đạt. Pixel 7 giả lập kiểm lưu khi mất đường gửi, tải lại trang, gửi lại và mở lại máy chủ.
- **Còn lại:** cần báo cáo của lượt điện thoại để ghi số đo và nhận xét.
