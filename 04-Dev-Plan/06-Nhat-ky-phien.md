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

## 2026-11-22: ST-15-09 Prism Sentinel và Gale Roc

- **Nhánh:** `ccr-9de01342-2046rb`, từ `f9a6d11`. G1 tiếp tục trên `main`.
- **Sentinel:** Tán Sắc và Lao Lăng Kính. Tia Phản Xạ ở pha hai dùng chung `LaserPath`; xoay gương trong lúc báo có thể trừ 10 máu và choáng 1,5 s. Tia Kép mở hai vạch, xung hai đảo góc sau 0,4 s.
- **Roc:** Bổ Nhào khóa hướng, đáp sàn hở 1 s, pha hai bổ nối báo 0,5 s và mưa tám lông chừa hai khe rộng hai ô. Thử thách có hai sóng đất. Vỗ Cánh bắn ba lông và phát trạng thái gió.
- **Phòng khóa:** hai mini-boss dùng `Boss` và `RoomBoss`. Dựng lại nếu chưa hạ, giữ cửa khi xong. Thưởng 110/40 và 270/60 gốc, nhân độ khó. Chặn bắn ngoài khung và chỉ dọn đạn của đúng mini-boss.
- **Quyết định:** Sentinel phát tia từ đầu dẫn phía trên gương để phản đòn bằng nhánh ngang. Tách số máu Kai khỏi tên mini-boss trên HUD sau khi xem ảnh.
- **Kiểm tra:** 736 test, lint, format, build, docs-check, gate-flow. Chromium PC và Pixel 7 ngang giả lập, 0 lỗi console. [Ảnh](qa/ST-15-09/README.md).
- **Còn lại:** Lực đẩy của Vỗ Cánh nối `WindZone` ở ST-15-08b. Phòng chiến dịch ở EP-17.
- **Tiếp theo:** ST-15-10 (Lumen) làm được trước G1.
