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

## 2026-11-14: EP-13 ST-13-05a báo cáo cổng MVP (MV1–MV7, H1–H4)

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit ST-13-05a.
- **Mục tiêu:** làm tiếp kế hoạch: bộ báo cáo cổng MVP (`npm run mvp-report`), có bộ dữ liệu mẫu có đáp án.
- **Đã làm:** `logic/telemetry/report-data.ts` (đọc gói xuất, bảng tải, mảng lô; kiểm, khử trùng QB-152; lọc đợt, build, cửa sổ đo; loại staff, phiên ngắn, ghi rác; dựng lượt qua phiên QB-154), `report.ts` (MV1–MV7 kèm Wilson, H1–H4 ba trạng thái, phễu, theo màn, thiết bị, F1, việc đề xuất theo 7.4, Markdown), `core/mvp-report.ts`, `scripts/mvp-report.mjs` (Vite `runnerImport`). `boss_start`/`boss_end` ghi `weaknessOwned` (MV6 trước đây luôn n = 0); danh mục boss gồm Lumen, Cryo, Aeris; `stages.json` thêm `expectedMin`, `bossFightSec`; khối `report` trong `telemetry.json`.
- **Duyệt:** QA Lead duyệt GDD 13 mục 6–7 kèm sửa: áp hết 10 sửa bắt buộc vào GDD 13 bản 1.2 (xong màn theo `boss_end{win}` đúng boss; sắp phiên theo `t`; đoạn theo `segments`; MV6 không suy từ `dmg`; ngày 0 bắt buộc; Chưa kết luận khi còn Biên/Thiếu dữ liệu).
- **File chính:** `game/src/logic/telemetry/report*.ts`, `game/src/core/mvp-report.ts`, `game/scripts/mvp-report.mjs`, `game/tests/mvp-{sample,report}.ts`, `03-Data/{stages,telemetry}.json`, `01-GDD/13-Do-luong-MVP.md`, `stories/EP-13-do-luong.md`, `qa/ST-13-05/`.
- **Quyết định:** khối `report` game không đọc (lỗi không tắt đo lường); thời gian dự kiến, thời gian thắng boss ở `stages.json` (không thêm boss rỗng vào `bosses.json`); giờ chơi tối thiểu khi tính ghi rác 15 phút (1 giờ làm người chơi nhiều bị loại nhầm).
- **Lỗi tìm thấy / đã sửa:** bản nháp tính "xong màn" theo `stage_end`, sắp phiên theo `sid`, loại install theo tổng phiên (QA Lead chỉ ra, đã sửa trước commit).
- **Kiểm tra:** 476 test (thêm 20), typecheck, lint, format, build, docs-check đạt; chạy `npm run mvp-report` thật trên bộ mẫu, báo cáo ở `qa/ST-13-05/`.
- **Còn dở:** ST-13-05b (K, DK, T, X, S). Prologue chưa ghi `stage_end{clear}` (chưa có Prologue); bản đồ thật phải dùng id đoạn `A`–`D`, `boss`.
- **Tiếp theo:** người dùng: chơi thử G1, chọn ADR-002. Em: ST-13-05b, rồi test khóa luật QB (mục 3 của `00-Bat-dau.md`).

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
