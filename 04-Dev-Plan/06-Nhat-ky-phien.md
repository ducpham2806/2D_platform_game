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

## 2026-11-22: ST-15-09 Prism Sentinel và Gale Roc

- **Nhánh:** `ccr-9de01342-2046rb`, từ `f9a6d11`. G1 tiếp tục trên `main`.
- **Sentinel:** Tán Sắc và Lao Lăng Kính. Tia Phản Xạ ở pha hai dùng chung `LaserPath`; xoay gương trong lúc báo có thể trừ 10 máu và choáng 1,5 s. Tia Kép mở hai vạch, xung hai đảo góc sau 0,4 s.
- **Roc:** Bổ Nhào khóa hướng, đáp sàn hở 1 s, pha hai bổ nối báo 0,5 s và mưa tám lông chừa hai khe rộng hai ô. Thử thách có hai sóng đất. Vỗ Cánh bắn ba lông và phát trạng thái gió.
- **Phòng khóa:** hai mini-boss dùng `Boss` và `RoomBoss`. Dựng lại nếu chưa hạ, giữ cửa khi xong. Thưởng 110/40 và 270/60 gốc, nhân độ khó. Chặn bắn ngoài khung và chỉ dọn đạn của đúng mini-boss.
- **Quyết định:** Sentinel phát tia từ đầu dẫn phía trên gương để phản đòn bằng nhánh ngang. Tách số máu Kai khỏi tên mini-boss trên HUD sau khi xem ảnh.
- **Kiểm tra:** 736 test, lint, format, build, docs-check, gate-flow. Chromium PC và Pixel 7 ngang giả lập, 0 lỗi console. [Ảnh](qa/ST-15-09/README.md).
- **Còn lại:** Lực đẩy của Vỗ Cánh nối `WindZone` ở ST-15-08b. Phòng chiến dịch ở EP-17.
- **Tiếp theo:** ST-15-10 (Lumen) làm được trước G1.

## 2026-11-22: ST-15-16 Nano Cell và viên năng lượng

- **Nhánh:** `ccr-9de01342-2046rb`, từ `1771a0d`. G1 tiếp tục trên `main`.
- **Nano Cell:** Stage 1/3/5/7 cấp mỗi màn một ô. Đọc bí mật M7 cũ, ghi mới theo id màn chiến dịch. Vào lượt nạp đầy. Nhặt thêm chỉ nạp ô mới. Chết, rơi hố và qua checkpoint giữ số còn lại.
- **Hồi máu:** H/RT hồi 40% máu tối đa khi còn sống và thiếu máu, kể cả đang choáng. Khóa đầu vào 0,4 s, xóa đệm nhảy và nạp súng. Nano Cell Cap nâng dần lên 80% ở cấp 4.
- **Năng lượng:** 6% rơi ở lần đầu hạ địch trong lượt nếu còn thanh vũ khí boss chưa đầy. Khi cầm Arc Cannon, hồi +4 cho thanh thấp nhất. Kẹp theo thanh tối đa và giữ viên khi vũ khí đích đầy.
- **File chính:** `NanoCells`, `StageSave`, `WeaponLoadout`, `EnemyField`, HUD và `game/tests/nano-cell-energy.test.ts`.
- **Kiểm tra:** 723 test, lint, format, build (typecheck), docs-check và gate-flow đạt. Chromium PC/Pixel 7 ngang giả lập, 0 lỗi console. [Ảnh](qa/ST-15-16/README.md).
- **Còn lại:** Nút dùng Nano Cell trên cảm ứng thuộc EP-14. Đặt vật phẩm vào phòng bí mật tại các bản đồ chiến dịch.
- **Tiếp theo:** ST-15-09 (Prism Sentinel và Gale Roc) làm được trước G1.

## 2026-11-22: ST-15-15 báo đòn mini-boss và tầm hoạt động

- **Nhánh:** `ccr-9de01342-2046rb`, từ `93096ce`. G1 tiếp tục trên `main`.
- **QB-21:** kiểm ngưỡng 0,5 s của từng loại đòn mini-boss lúc nạp. Kiểm Bramble Golem và Frost Titan qua giậm, ném, lao, cả giậm nối Thử thách.
- **QB-23:** tầm tâm 12 ô ngang và 7 ô dọc. Cả hộp địch phải nằm trong khung camera đã vẽ, thu 1 ô mỗi cạnh, khi báo và tung đòn. Địch còn trong tầm vẫn tuần tra ngoài khung.
- **Quyết định:** ra khỏi vùng thì hủy đòn hoặc loạt chưa ra. Vào lại báo đủ trước khi tung đòn. Đạn và cú lao đã khởi phát đi tiếp theo cơ chế hiện có.
- **Kiểm tra:** 707 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Chromium PC/Pixel 7 giả lập xác nhận khóa báo ở mép, hủy giữa báo và Frost Titan đủ ngưỡng. [Ảnh](qa/ST-15-15/README.md).
- **Tiếp theo:** ST-15-16 (Nano Cell và vật phẩm năng lượng) làm được trước G1.
