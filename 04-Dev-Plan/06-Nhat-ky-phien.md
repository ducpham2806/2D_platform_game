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

## 2026-11-22: ST-15-08a bục băng vỡ và bệ mây

- **Nhánh:** `ccr-9de01342-2046rb`, từ `d858814`. G1 tiếp tục trên `main`.
- **Đã làm:** Kai đặt chân thì nứt theo ba mốc 0 / 0,4 / 0,7 s. Băng vỡ sau 1 s, mây chìm sau 0,8 s ở 3 ô/s. Rời bục không đặt lại đồng hồ. Tính 4 s từ lúc vỡ hoặc bắt đầu chìm và đợi chỗ cũ trống.
- **Bệ trôi:** hai điểm Tiled, 1,5 ô/s, chở Kai theo cả hai trục và dùng Xuống + Nhảy. Bệ chìm chở Kai đến nền hoặc hết bản đồ. Hồi sinh ở checkpoint dựng lại bục và đưa bệ trôi về đầu.
- **Luật biên:** QB-40 loại bục vỡ và bệ di động khỏi kích hoạt checkpoint. Địch đất rơi khi băng dưới chân vỡ. Rơi khỏi bản đồ trả EXP một lần theo QB-20, mất Core Bit.
- **File chính:** `CrumblePlatform`, `CloudDrift`, `StageWorld`, `EnemyField`, bộ nạp Tiled và 14 bài trong `game/tests/platforms.test.ts`.
- **Kiểm tra:** 683 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Phòng **Bục băng và mây** chơi qua bằng bàn phím và Pixel 7 giả lập, 0 lỗi console. [Ảnh](qa/ST-15-08a/README.md).
- **Tiếp theo:** ST-15-15/16 làm được trước G1. Sàn trơn và gió thuộc ST-15-08b, Nứt Bục của Cryo ở ST-15-11, bố trí bệ chiến dịch ở EP-17.
