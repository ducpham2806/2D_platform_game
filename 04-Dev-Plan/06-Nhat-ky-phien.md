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

<<<<<<< HEAD
## 2026-11-21: Kiểm tra tiến độ Cyber Vanguard

- **Mốc kiểm:** `main` ở `c458643`, tag `gate-r1` trỏ tới `eeb8ca1`; CI #53 và Pages #8 đạt theo GitHub Actions.
- **Nhánh phát triển:** `ccr-9de01342-2046rb` ở `83f6d6b`, hơn `main` 13 commit. Có lõi đo lường và báo cáo MVP, demo 2.5D, hộp chữ, an toàn boss và dữ liệu nền Stage 2. PR #9 vẫn mở.
- **Kiểm tra:** nhật ký nhánh phát triển ghi 541 test, lint, format, typecheck, build và gate-flow đạt. Chưa thấy lượt GitHub Actions cho commit `83f6d6b`. Môi trường kiểm tra không mở trực tiếp được bản Pages.
- **Tài liệu:** cập nhật trang bắt đầu và dòng trạng thái G1, lưu mục nhật ký cũ vào lưu trữ.
- **Còn dở:** chưa thấy dữ liệu đợt thử G1 trong repo. Còn chọn kênh đo lường (ADR-002) và đo demo 2.5D trên thiết bị thật trước khi duyệt ADR-003.
- **Tiếp theo:** kiểm link trên điện thoại, chơi thử G1 với 5 người và tổng hợp kết quả. Việc code kế tiếp trên nhánh phát triển là ST-15-02 (laser, gương, cảm biến).

## 2026-11-14: CI đỏ trên PR #10; PR #9 song song; ST-21-01 chuỗi hướng dẫn (QB-88)
=======
## 2026-11-22: Tích hợp nhánh phát triển vào main
>>>>>>> 6eb3e419966f34e2a9b6b9bb046704b88ec1db68

- **Phạm vi:** Người dùng yêu cầu merge toàn bộ nhánh phát triển `ccr-9de01342-2046rb` đến `0d5d328` (ST-15-09). Mốc gốc của `main` trước khi tích hợp là `c458643`.
- **Nội dung:** Đo lường và báo cáo MVP, demo 2.5D, hộp chữ, luật biên và các Story Stage 2–4 đã xong. Giữ lộ trình chuyển từng phần của PR #9.
- **G1:** Tag `gate-r1` giữ mốc `eeb8ca1`. Liên kết Pages dựng theo `main`, nên khi ghi kết quả G1 phải ghi commit đã thử.
- **Kiểm tra:** 736 test, lint, build, docs-check và gate-flow đạt trên nhánh phát triển. CI của PR #12 phát hiện một bảng Markdown chưa qua Prettier trong `game/maps/README.md`. Đã chuẩn hóa bảng và chạy lại các kiểm tra.
- **Tiếp theo:** Thu kết quả chơi thử G1 và tiếp ST-15-10 (Lumen) theo kế hoạch.

## 2026-11-22: ST-15-09 Prism Sentinel và Gale Roc

<<<<<<< HEAD
- **Nhánh / commit:** `ccr-9de01342-2046rb`; commit ST-11-01.
- **Mục tiêu:** người dùng đồng ý làm bước đầu tiên của `00-Bat-dau.md`: sửa vùng an toàn (QB-92) trước khi phát link chơi thử G1.
- **Đã làm:** Story `stories/EP-11-cong-prototype-dot-1.md`; `touch-layout.ts` (nút, cần ảo neo theo mép vùng an toàn), `scale.ts` (canvas tránh trái, phải, trên), `input/safe-area.ts` (đọc `env()` qua phần tử dò), `style.css` (bảng HTML trừ vùng an toàn).
- **Quyết định:** canvas không tránh thanh vuốt dưới (chỉ đè, không che hình; tránh thì iPhone 14 tụt ×6 → ×5); nút tránh cả 4 phía.
- **Kiểm tra:** 423 test (thêm 8), lint, format, build, docs-check đạt; `gate-flow` đạt; chạy thử iPhone 14 và Pixel 7 giả lập tai thỏ bằng CDP, 0 lỗi console (`qa/ST-11-01/`).
- **Còn dở:** kiểm trên máy thật có tai thỏ ở buổi chơi thử.
- **Tiếp theo:** người dùng merge và tag `gate-r1`, chơi thử 5 người; code tiếp (EP-13 lõi đo lường) ở nhánh mới.
=======
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
>>>>>>> 6eb3e419966f34e2a9b6b9bb046704b88ec1db68
