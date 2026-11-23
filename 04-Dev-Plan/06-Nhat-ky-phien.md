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

## 2026-11-23: Khởi động kế hoạch asset 3D

- **Nhánh:** `codex/asset-3d-plan` từ `main` ở `6eb3e41`.
- **Mục tiêu:** đánh giá hướng 3D platformer và chọn gói asset đầu tiên.
- **Đã làm:** đối chiếu demo Thorna, GDD và EP-22. Bổ sung đề xuất phòng thử có di chuyển theo chiều sâu vào mục 5 của ADR-003. Gói đầu gồm Kai có rig, kit địa hình, tia bắn và bóng chỉ điểm đáp.
- **Quyết định đề xuất:** thử camera bám góc 3/4 trên điện thoại thật và đo ngưỡng của ADR/GDD trước khi mở rộng asset. Kai và kit dùng được cho cả phòng thử 3D và demo 2.5D.
- **Kiểm tra:** 736 test, lint, format, build và docs-check đạt.
- **Tiếp theo:** dựng phòng thử chuyển động và làm bản Kai đầu tiên khi chốt phạm vi.

## 2026-11-22: Tích hợp nhánh phát triển vào main

- **Phạm vi:** Người dùng yêu cầu merge toàn bộ nhánh phát triển `ccr-9de01342-2046rb` đến `0d5d328` (ST-15-09). Mốc gốc của `main` trước khi tích hợp là `c458643`.
- **Nội dung:** Đo lường và báo cáo MVP, demo 2.5D, hộp chữ, luật biên và các Story Stage 2–4 đã xong. Giữ lộ trình chuyển từng phần của PR #9.
- **G1:** Tag `gate-r1` giữ mốc `eeb8ca1`. Liên kết Pages dựng theo `main`, nên khi ghi kết quả G1 phải ghi commit đã thử.
- **Kiểm tra:** 736 test, lint, build, docs-check và gate-flow đạt trên nhánh phát triển. CI của PR #12 phát hiện một bảng Markdown chưa qua Prettier trong `game/maps/README.md`. Đã chuẩn hóa bảng và chạy lại các kiểm tra.
- **Tiếp theo:** Thu kết quả chơi thử G1 và tiếp ST-15-10 (Lumen) theo kế hoạch.
