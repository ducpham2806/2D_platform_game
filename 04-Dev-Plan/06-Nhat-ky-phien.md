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

## 2026-11-21: ST-15-01b dữ liệu Frost Shard và cơ chế băng

- **Nhánh:** `ccr-9de01342-2046rb`, từ `49394f1`. G1 tiếp tục trên `main`.
- **Đã làm:** Frost Shard có cấu hình `shard` (10 ô/s, tầm 10 ô, đạn 8 × 6 px, ×2 sát thương, hồi 0,4 s, đóng băng 2 s, tốn 4/28). Bộ kiểm cân bằng xác nhận 14 sát thương/thanh, 12,5/s khi khắc chế Aeris.
- **Dữ liệu cơ chế:** nạp `ice`, `crumble` (hai mốc nứt tăng dần và trước khi vỡ) và `coolant.frozenSteps` (3 bậc, số nguyên dương). Bộ kiểm báo đường dẫn trường sai.
- **File chính:** `03-Data/{weapons,stages}.json`, bộ kiểm cấu hình, `WeaponLoadout` và `game/tests/stage-data.test.ts`.
- **Quyết định:** cấp Frost Shard từ ST-15-04. Dữ liệu Người Tuyết Máy, Tháp Băng, Frost Titan đi cùng ST-15-06; dữ liệu Cryo đi cùng ST-15-11, sau khi phần thưởng Frost Shard hoạt động.
- **Kiểm tra:** 604 test, lint, format, build (typecheck), docs-check và gate-flow (PC, Pixel 7 giả lập, gộp nhật ký) đạt.
- **Tiếp theo:** ST-15-04 triển khai đạn Frost Shard, trạng thái vô hiệu QB-19 và dòng làm mát.

## 2026-11-21: ST-15-03 Prism Beam

- **Nhánh:** `ccr-9de01342-2046rb`, từ `995085b`. Bản chơi thử G1 ở `main`.
- **Đã làm:** Prism Beam dùng lại `LaserPath`; cắt tia theo khiên ở QB-16/18, xuyên mục tiêu đúng một lần, đốt rễ khô và dội vào cảm biến. Đo lường ghi sát thương boss thật và giữ luật QB-14/31.
- **File chính:** `WeaponLoadout`, `beam-hits.ts`, `StageWorld`, `StageOptics`, `Barrier`, renderer và `tests/prism-beam.test.ts`.
- **Quyết định:** một xung Prism Beam đủ mở cảm biến; nguồn môi trường vẫn dùng `sensor.holdSec`. Phòng thử laser cho mượn vũ khí trong lượt.
- **Kiểm tra:** 578 test; typecheck, lint, format, build, docs-check và gate-flow đạt. Chromium trên PC và Pixel 7 giả lập: mở cửa, tốn 3 năng lượng, 0 lỗi console; đốt rễ phòng M7 trên PC. Ảnh ở `qa/ST-15-03/`.
- **Còn dở:** nhận Prism Beam từ Lumen ở ST-15-10. Việc tiếp theo có thể là ST-15-01b, rồi ST-15-04 (Frost Shard, vô hiệu, dòng làm mát), hoặc ST-15-15/16.

## 2026-11-21: ST-15-02 laser, gương và cảm biến Stage 2

- **Nhánh:** `ccr-9de01342-2046rb`, từ `83f6d6b`. Giữ bản thử G1 trên `main`.
- **Đã làm:** đường tia phản xạ dùng chung, nguồn liên tục và theo nhịp, Arc Cannon nạp vừa/đầy xoay gương, cảm biến mở cửa trong lượt, hồi sinh đặt lại gương. Phòng thử mở từ menu bằng nút Phòng thử laser hoặc phím O.
- **File chính:** logic đường tia, `StageOptics`, `StageWorld`, Tiled, renderer và phòng thử. Cập nhật lược đồ nguồn sát thương `laser` và tài liệu EP-15.
- **Quyết định:** nguồn lệch pha bắt đầu ở lần báo trước đầy đủ kế tiếp. Bố trí bục bắn, gương và tia phản xạ ở phòng thử để có lối đi bên dưới sau khi mở cửa.
- **Kiểm tra:** 566 test, typecheck, lint, format, build, docs-check và gate-flow. Chạy thử PC và Pixel 7 giả lập, 0 lỗi console. Ảnh trong `qa/ST-15-02/`.
- **Tiếp theo:** ST-15-03 (Prism Beam). Bố cục và kiểm đường chính của Stage 2 ở ST-17-02 sau G1.
