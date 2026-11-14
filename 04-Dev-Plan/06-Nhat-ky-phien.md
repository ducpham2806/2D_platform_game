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

## 2026-11-14: Hướng đồ họa 2.5D three.js: demo phòng Thorna (EP-22 ST-22-01)

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit demo 2.5D.
- **Mục tiêu:** người dùng chọn hướng đồ họa (c) 2.5D thời gian thực bằng three.js và xin demo.
- **Đã làm:** trang riêng `game/demo-25d.html` + `src/demo25d/`: dựng phòng boss Thorna từ `StageWorld` thật (logic, dữ liệu không đổi); khối ô có chiều sâu, rừng nhiều lớp, sương, bóng, bloom; Kai, Thorna dựng từ khối 3D có hoạt ảnh; đạn phát sáng, vùng cảnh báo đòn 3D, hạt; camera phối cảnh bám Kai, khóa đấu trường; nút chạm; `?q=low`; tự chơi và quay từng khung (`scripts/demo25d-video.mjs`). three.js 0.170; chunk demo 140 KB gzip, game Phaser không nạp.
- **Tài liệu:** ADR-003 (Proposed: hướng đã chọn, cách chuyển chờ duyệt và đo máy thật), Epic EP-22, `09` mục 3 ghi lựa chọn, GDD chính mục 14 ghi đang đổi, ST-21-05 bỏ, asset pixel art dừng.
- **Lỗi tìm thấy / đã sửa:** tường nền che rừng; rêu quá rộng làm chói; tự chơi kẹt (leo tường, quay lưng bắn, đứng trên bục bắn qua đầu boss): đã sửa.
- **Kiểm tra:** 456 test (thêm 3), typecheck, lint, format, build, docs-check đạt; chạy Chromium (CPU, không GPU) PC và Pixel 7: 0 lỗi trang; video 24 s, ảnh ở `qa/DEMO-25D/`. FPS máy thật chưa đo.
- **Tiếp theo:** người dùng xem video; sau đợt thử G1 đưa demo lên Pages để thử trên điện thoại (ST-22-02); duyệt ADR-003. Em: ST-13-05 báo cáo đo lường.

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
