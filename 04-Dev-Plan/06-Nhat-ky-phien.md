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

## 2026-11-21: ST-15-01c dữ liệu Gale Cutter và cơ chế Stage 4

- **Nhánh:** `ccr-9de01342-2046rb`, từ `654c31a`. Bản thử G1 tiếp tục trên `main`.
- **Đã làm:** Gale Cutter có dữ liệu `boomerang`, tốn 4/28 năng lượng, trúng cả đi và về với ngân sách 14 sát thương/thanh. Mỗi lần ném hủy tối đa 2 viên thuộc `cancelKinds`. Loadout cấp vũ khí từ ST-15-05.
- **Dữ liệu cơ chế:** `wind` gồm ngoại lệ QB-07 và kiểm thời lượng báo trước, `cloud` bắt buộc một chiều, `crumble.sink` dùng hai mốc nứt của băng vỡ.
- **File chính:** `03-Data/{weapons,stages}.json`, bộ kiểm cấu hình, `WeaponLoadout` và `game/tests/stage-data.test.ts`.
- **Quyết định:** dữ liệu Chim Cắt Gió và Cối Xoáy đi cùng ST-15-07, Gale Roc cùng ST-15-09, Aeris cùng ST-15-12. Đo khắc chế Terra khi có hành vi ở Alpha.
- **Kiểm tra:** 642 test, build (typecheck), lint, format, docs-check và gate-flow (PC, Pixel 7 giả lập, gộp nhật ký) đạt.
- **Tiếp theo:** ST-15-05 ném và đón Gale Cutter, hủy đạn theo Q4 và mở sương lạnh ở Két Tay Mk I. Bệ mây ở ST-15-08a, gió ở ST-15-08b sau G1.

## 2026-11-21: ST-15-04 Frost Shard, vô hiệu QB-19 và dòng làm mát

- **Nhánh:** `ccr-9de01342-2046rb`, từ `850e7b2`. Bản thử G1 trên `main`.
- **Đã làm:** cấp Frost Shard, đạn theo dữ liệu. `Enemy.disable` lấy thời gian còn lại hoặc thời gian mới lớn hơn (QB-19); vô hiệu dừng nhịp AI và sát thương chạm thân. Khiên Lính Kén vẫn chặn mặt trước. Boss và mini-boss miễn vô hiệu.
- **Dòng làm mát:** class Tiled `coolant` chuyển thành ba bậc một chiều. Dòng lỏng vô hại, giữ viên Frost Shard lúc đông. Bậc tồn tại qua hồi sinh, đặt lại khi chơi lại.
- **Phòng thử:** phím I hoặc chọn từ menu, mượn Frost Shard, tiến trình ở trong lượt. PC leo tới gờ thật. Ảnh PC và Pixel 7 giả lập ở `qa/ST-15-04/`.
- **File chính:** `WeaponLoadout`, `Enemy`, `hits.ts`, `CoolantFlow`, map và renderer; 16 bài trong `game/tests/frost-shard.test.ts`.
- **Kiểm tra:** 620 test, build (typecheck), lint, format, docs-check, gate-flow. Luồng phòng băng trên Chromium PC và Pixel 7 giả lập, 0 lỗi console.
- **Tiếp theo:** Phase Step gọi API vô hiệu ở ST-08-09. Cryo cấp vũ khí ở ST-15-11, đặt Két Thân Mk I ở ST-17-02.

## 2026-11-21: ST-15-01b dữ liệu Frost Shard và cơ chế băng

- **Nhánh:** `ccr-9de01342-2046rb`, từ `49394f1`. G1 tiếp tục trên `main`.
- **Đã làm:** Frost Shard có cấu hình `shard` (10 ô/s, tầm 10 ô, đạn 8 × 6 px, ×2 sát thương, hồi 0,4 s, đóng băng 2 s, tốn 4/28). Bộ kiểm cân bằng xác nhận 14 sát thương/thanh, 12,5/s khi khắc chế Aeris.
- **Dữ liệu cơ chế:** nạp `ice`, `crumble` (hai mốc nứt tăng dần và trước khi vỡ) và `coolant.frozenSteps` (3 bậc, số nguyên dương). Bộ kiểm báo đường dẫn trường sai.
- **File chính:** `03-Data/{weapons,stages}.json`, bộ kiểm cấu hình, `WeaponLoadout` và `game/tests/stage-data.test.ts`.
- **Quyết định:** cấp Frost Shard từ ST-15-04. Dữ liệu Người Tuyết Máy, Tháp Băng, Frost Titan đi cùng ST-15-06; dữ liệu Cryo đi cùng ST-15-11, sau khi phần thưởng Frost Shard hoạt động.
- **Kiểm tra:** 604 test, lint, format, build (typecheck), docs-check và gate-flow (PC, Pixel 7 giả lập, gộp nhật ký) đạt.
- **Tiếp theo:** ST-15-04 triển khai đạn Frost Shard, trạng thái vô hiệu QB-19 và dòng làm mát.
