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

## 2026-11-14: CI đỏ trên PR #10; PR #9 song song; ST-21-01 chuỗi hướng dẫn (QB-88)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `76b9b62` (CI), `02008fe` (ghi chú PR #9), `b71a155` (EP-21), merge `eeb8ca1`, commit tài liệu sau merge.
- **Mục tiêu:** trả lời kế hoạch tiếp theo; kiểm tra CI đỏ người dùng báo; xử lý PR #9 theo cách A người dùng chọn (giữ bản thử G1, chuyển PR #9 từng phần).
- **CI:** lần #40–#42 đỏ ở `docs-check` vì commit tạm của agent có README trỏ tới `LOI-THOI.md` trước khi file được commit; #43 trở đi đạt. Nâng action lên bản Node 24 (checkout, setup-node v6; Pages v6/v5/v5). Mục EP-10 sang lưu trữ.
- **PR #9:** nhánh phiên 13/11, tách từ `main` song song, xung đột 31 file; có hình vẽ bằng mã, âm tổng hợp, smoke check, chuỗi vi/en. Epic `stories/EP-21-chuyen-PR9.md` (ST-21-01…06). Ảnh hình PR #9 so với hình khối: `qa/ST-21-05/`.
- **ST-21-01 (QB-88):** thoát giữa trận Thorna rồi vào lại thì câu S10 hiện ngay đầu màn tới khi hạ boss. Sửa: `after` nối theo bước xong trong lượt; bước đã lưu mà điều kiện xảy ra lại (vào lại phòng boss) thì nối chuỗi, không hiện lại lời (giữ gợi ý né đòn, khác bản sửa của PR #9). Không ảnh hưởng G1 (màn xám không có hướng dẫn).
- **Tìm lại:** yêu cầu 2.5D của người dùng (13/11) chỉ nằm trên nhánh PR #9; đã ghi vào `09-Quyet-dinh-cho-duyet.md` mục 3 (pixel art / 2.5D render sẵn / three.js; đề xuất pixel art cho MVP).
- **Lỗi tìm thấy:** commit tạm được đẩy khi chưa chạy docs-check (từ nay chạy đủ trước cả commit tạm).
- **Kiểm tra:** 425 test (thêm 2 QB-88, đỏ trên code cũ), lint, format, build, docs-check đạt; chạy thử Chromium trước/sau sửa (`qa/ST-21-01/`), 0 lỗi console.
- **Merge:** người dùng nhờ merge; PR #10 merge (merge commit `eeb8ca1`, CI #50 đạt). Pages #5 trên `main`: test, build đạt, dừng ở `configure-pages` vì repo riêng tư chưa bật Pages. Nhánh làm việc đưa lên ngang `main`. Người dùng chuyển repo sang công khai; Pages #6 (chạy tay) vẫn dừng ở `configure-pages`: chưa chọn Source "GitHub Actions" trong Settings → Pages. Người dùng bật Pages; lần #7 đăng thành công `eeb8ca1`. Môi trường chặn `github.io` nên em không tự mở link thật được.
- **Tag, merge tài liệu:** người dùng đồng ý tag `gate-r1`; đẩy tag từ môi trường bị proxy chặn (403), GitHub MCP không có lệnh tạo tag, nên người dùng tạo trên GitHub. Ba commit tài liệu sau merge đưa vào `main` bằng PR mới.
- **Tiếp theo:** người dùng mở link `?gate=1` trên điện thoại; tạo tag `gate-r1`, chơi thử 5 người, chọn hướng đồ họa. Em: EP-13 lõi đo lường; EP-21 ST-21-02 sau tag.

## 2026-11-14: ST-11-01 vùng an toàn cho nút cảm ứng, canvas, bảng HTML (bước đầu của G1)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; commit ST-11-01.
- **Mục tiêu:** người dùng đồng ý làm bước đầu tiên của `00-Bat-dau.md`: sửa vùng an toàn (QB-92) trước khi phát link chơi thử G1.
- **Đã làm:** Story `stories/EP-11-cong-prototype-dot-1.md`; `touch-layout.ts` (nút, cần ảo neo theo mép vùng an toàn), `scale.ts` (canvas tránh trái, phải, trên), `input/safe-area.ts` (đọc `env()` qua phần tử dò), `style.css` (bảng HTML trừ vùng an toàn).
- **Quyết định:** canvas không tránh thanh vuốt dưới (chỉ đè, không che hình; tránh thì iPhone 14 tụt ×6 → ×5); nút tránh cả 4 phía.
- **Kiểm tra:** 423 test (thêm 8), lint, format, build, docs-check đạt; `gate-flow` đạt; chạy thử iPhone 14 và Pixel 7 giả lập tai thỏ bằng CDP, 0 lỗi console (`qa/ST-11-01/`).
- **Còn dở:** kiểm trên máy thật có tai thỏ ở buổi chơi thử.
- **Tiếp theo:** người dùng merge và tag `gate-r1`, chơi thử 5 người; code tiếp (EP-13 lõi đo lường) ở nhánh mới.

## 2026-11-14: Rà soát toàn bộ tài liệu, quy tắc biên, tài liệu hệ thống còn thiếu, kế hoạch S9–S21

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `84ac8b2` (sửa code), `3ec2438` … commit đóng phiên (tài liệu).
- **Mục tiêu:** người dùng giao kiểm tra toàn bộ tài liệu (nhất là GDD), mô tả mọi ngóc ngách, bổ sung chỗ thiếu, kiểm mâu thuẫn và quy tắc, tối ưu đầu vào, kế hoạch chi tiết, theo quy trình Game Studio Agent.
- **Đã làm:**
  - Rà soát 4 nhóm (`/review-all-gdds`, `/consistency-check`): lõi, kinh tế, giao diện và lời thoại, quy trình. Sửa mâu thuẫn ở GDD chính (0.8), 02–11, JSON.
  - Tài liệu mới: 12 Âm thanh, 13 Đo lường MVP, 14 Cài đặt, 15 Nhiệm vụ phụ, 16 Stage 2–4 (nháp), 17 Quy tắc biên (92 luật QB), `08-Cong-MVP.md`, ADR-002, `02-Wireframes/LOI-THOI.md`.
  - Duyệt Creative Director và Technical Director + Producer: mọi file "duyệt kèm sửa", đã sửa.
  - Kế hoạch S9–S21, EP-11…EP-20, ba cổng G1/G2/G3. Đầu vào: `00-Bat-dau.md`, CLAUDE.md gọn, Story xong vào `stories/xong/`, `npm run docs-check` (CI).
- **Sửa code:** boss và Kai hết máu cùng bước thì thắng (QB-30); gợi ý NOVA hiện được giữa trận boss (QB-70…72, 82); chết để cày EXP, Core Bit bị chặn (QB-20); gợi ý thu nhập Quầy đúng màn và độ khó (QB-65); nhãn tab Xưởng (QB-132); `regenDelayMul` 0,6667.
- **Quyết định:** chốt theo ủy quyền, danh sách ở `09-Quyet-dinh-cho-duyet.md` (Thorna 45–65 s, Mk II thay Mk I, hết MVP cấp 10, Nano Cell, bỏ Data Chip khỏi live-ops, chỉ màn ngang…).
- **Lỗi tìm thấy / đã sửa:** 4 lỗi code ở trên; một commit tạm lọt 1 test đỏ (test hướng dẫn theo S08 6 s) và `__pycache__`, đã sửa ngay; 4 agent dừng vì giới hạn sử dụng, đã cho chạy tiếp.
- **Kiểm tra:** 415 test, lint, format, build, docs-check đạt; chạy thử trình duyệt: gợi ý NOVA trong trận boss, gợi ý Quầy, tab Xưởng (ảnh ở `qa/ST-09-04`, `qa/ST-08-05`).
- **Còn dở:** người dùng chọn kênh đo lường (ADR-002), xem `09-Quyet-dinh-cho-duyet.md`; tài liệu 12–14 còn Draft (duyệt khi mở EP-12/13/14); chưa test nào mang mã QB.
- **Tiếp theo:** 1. Safe-area (QB-92) rồi đóng băng bản thử G1 (`gate-r1`), chơi thử 5 người. 2. EP-13 lõi đo lường. 3. Test các luật QB đã code. 4. EP-15 ST-15-14, ST-15-01a. 5. EP-12 âm thanh.
