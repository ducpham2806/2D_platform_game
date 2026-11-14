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

## 2026-11-14: EP-13 ST-13-02 nối đo lường vào game

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); `8ba4609` (02a), commit 02b.
- **Mục tiêu:** người dùng giao "làm tiếp": ST-13-02 nối sự kiện đo lường vào game; tách 02a (logic thuần) và 02b (scene).
- **02a:** đạn kẻ địch mang `source`; `WorldEvents.hurtBy`, `deathCause` (`enemy:<id>`, `boss:<loại đạn>`, `spike`, `pit`); `StageWorld.bossDamage` theo vũ khí, `bossWeakHits`; `StageTracker` (một lượt màn: stage_start…stage_end, boss_end win/death/exit), `FrameStats`, `buildSignature`. Test chuỗi sự kiện trên StageWorld thật (GDD 13 mục 10 ý 1).
- **02b:** `src/scenes/telemetry/` (dịch vụ: session_start, boot_timing, lỗi trang; một lượt màn: FrameStats, hướng dẫn, gợi ý NOVA, trang ẩn, rời màn); `logic/telemetry/device.ts`; Quầy, Xưởng báo giao dịch qua `onTelemetry`; cờ tạm `?debug=1&telemetry=1` (bộ nhớ), `?staff=1`.
- **Quyết định:** chỉ màn chiến dịch mới ghi; lớp nối nằm trong `src/scenes/` vì luật lint chỉ cho scene import Phaser; mã lỗi lưu, phiên mới sau 30 phút ẩn, `msToControl` chuyển sang ST-13-03.
- **Kiểm tra:** 453 test (thêm 7), typecheck, lint, format, build, docs-check đạt; chạy thử Chromium Pixel 7: không cờ thì 0 bộ ghi, 0 request; có cờ thì 17 sự kiện đúng chuỗi, 0 sai lược đồ, 0 lỗi console (`qa/ST-13-02/`); `gate-flow` đạt.
- **Tiếp theo:** ST-13-05 báo cáo (`report.ts`, `npm run mvp-report`). Người dùng: chơi thử G1, chọn hướng đồ họa, chọn kênh gửi (ADR-002).

## 2026-11-14: EP-13 ST-13-01 lõi đo lường (duyệt Technical Director GDD 13)

- **Nhánh / commit:** `ccr-9de01342-2046rb` (sau merge PR #10, #11; không merge vào `main` trong đợt thử G1); commit ST-13-01.
- **Mục tiêu:** người dùng giao "làm tiếp theo plan": việc code số 2 của `00-Bat-dau.md`, EP-13 lõi đo lường.
- **Quy trình:** agent Technical Director duyệt GDD 13 trước khi code: "duyệt kèm sửa", 12 điểm (byte = độ dài JSON ASCII; lô bất biến; bộ đệm không bao giờ vượt; khử trùng theo install+sid+n; id theo danh mục; làm phẳng `audio`; enum còn thiếu; làm sạch lỗi; tắt gửi không ghi `consent: off`; `telemetry.json` thêm trường, không bắt buộc; dấu vân tay `data` trừ `telemetry.json`; hiệu năng). Đã sửa hết vào GDD 13 bản 1.1 và code.
- **Code:** `logic/telemetry/` (schema 26 sự kiện, validate, text, buffer, batch, logger), `logic/hash.ts`, `core/telemetry-config.ts`, `core/telemetry-catalogs.ts`, `03-Data/telemetry.json`. Bản thường chưa gọi lõi.
- **Tài liệu:** Epic `stories/EP-13-do-luong.md` (Story ST-13-01 theo mẫu), `17-Quy-tac-bien.md` bản 1.4 (mục 10.1, QB-150…157, 101 luật), `game/docs/quyet-dinh/do-luong.md`, CONTEXT, bản đồ hệ thống.
- **Lỗi tìm thấy / đã sửa:** bản nháp đầu đếm sự kiện bị bỏ đúng luật vào `lost`; sửa (chỉ đếm `lost` khi không còn gì bỏ được).
- **Kiểm tra:** 446 test (thêm 21), typecheck, lint, format, build, docs-check đạt; `gate-flow` đạt (PC, cảm ứng).
- **Tiếp theo:** ST-13-02 nối sự kiện (StageWorld: sát thương theo vũ khí, nguồn cú đánh cuối, chữ ký build; mã lỗi SaveManager), ST-13-05 báo cáo. Người dùng: chơi thử G1, chọn hướng đồ họa, chọn kênh gửi (ADR-002).

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
- **Tag, merge tài liệu:** người dùng đồng ý tag `gate-r1`; đẩy tag từ môi trường bị proxy chặn (403), GitHub MCP không có lệnh tạo tag, người dùng tạo trên GitHub (`gate-r1` → `eeb8ca1`, đã kiểm). Tài liệu sau merge vào `main` bằng PR #11 (`c458643`); Pages #8 đăng lại đạt, code game không đổi.
- **Tiếp theo:** người dùng mở link `?gate=1` trên điện thoại rồi phát cho 5 người; không merge vào `main` trong đợt thử; chọn hướng đồ họa. Em: EP-13 lõi đo lường; EP-21 ST-21-02 sau tag.
