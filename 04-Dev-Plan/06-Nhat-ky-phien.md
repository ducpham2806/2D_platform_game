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

## 2026-11-24: Tích hợp cục bộ phòng thử 3D

- **Nhánh:** `codex/integrate-asset-3d`, từ `origin/main` ở `6b02afd` và nhánh 3D ở `cb8ab61`.
- **Phạm vi:** worktree tích hợp riêng. Giữ mốc G1, tình trạng EP-22 và việc chờ số đo ST-22-07.
- **Xung đột:** ghép nội dung trang bắt đầu và hợp nhất nhật ký. Nhật ký chính giữ ba mục mới nhất. Chuyển mục cũ vào lưu trữ, gồm mục kiểm tiến độ 21/11 từ phía main.
- **Kiểm tra chuẩn bị:** hai ref khớp SHA yêu cầu, lockfile trùng bản phụ thuộc đã cài. Dùng bộ test, lint, format, build và docs-check của game.
- **Còn lại:** ST-22-07 chờ đo trên điện thoại thật. Dấu xung đột có sẵn trong bảng kết quả G1 của `05-Cong-Prototype.md` cần xử lý riêng.

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
