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

## 2026-11-15: EP-14 ST-14-08 hộp chữ thuần (QB-70…72) và ST-QB-01 test khóa luật biên

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit ST-14-08 + ST-QB-01.
- **Mục tiêu:** mục 3 của `00-Bat-dau.md`: sửa QB-72 (tạm dừng vẫn làm gợi ý chết hết giờ), QB-70 (bị che thì mất hẳn), test khóa các luật đã code.
- **Đã làm:** `logic/hud/text-boxes.ts` (`BOX_ORDER`, `topBox`, `readingSec` NFC, `TimedBox` đồng hồ trận frozen/covered/free); Scene đếm gợi ý mỗi bước trận chạy, ẩn khi tạm dừng rồi hiện lại, hủy khi hạ boss, checkpoint, vào đấu trường, tắt hướng dẫn; đo lường `difficulty_hint` lúc câu thật sự hiện. `ui.json → reading {15, 3, 10}` thay `difficultyHint.charsPerSecRead`. Agent viết `tests/qb-rules.test.ts` (18 test: QB-02, 11, 12, 13, 22, 24, 33, 41, 61, 121, 132); tách `logic/stage/camera-bounds.ts`, nhãn tab Xưởng vào `workshop-model.ts`.
- **File chính:** `game/src/logic/hud/text-boxes.ts`, `game/src/scenes/stage-scene.ts`, `game/src/core/ui-config.ts`, `game/src/logic/world/{stage-world,enemy-field,stage-mechanics}.ts`, `game/tests/{text-boxes,qb-rules}.test.ts`, `03-Data/ui.json`, GDD 07, 11, 14, 17, `stories/EP-14-giao-dien-mvp.md` (mới), `stories/QB-khoa-luat.md` (mới), `qa/ST-14-08/`, `qa/QB-khoa-luat/`.
- **Duyệt:** Technical Director duyệt ST-14-08 "kèm sửa", 7 điểm bắt buộc đã áp (ẩn khi tạm dừng; hội thoại không tính là chờ; hủy khi vào đấu trường, khi tắt hướng dẫn; đếm từng bước; GDD 14 tự tiến thoại dùng `reading`, không dùng `maxWaitSec`; GDD 11).
- **Lỗi tìm thấy / đã sửa:** QB-24: hạ Golem xong mà Kai chết thì Golem dựng lại đầy máu trong phòng đã mở; sửa: kẻ địch của phòng khóa đã xong không dựng lại (luật mở rộng ghi ở QB-24). Chữ tab Module "khi có" → "khi nhận module đầu tiên" (QB-87).
- **Kiểm tra:** 511 test (thêm 29), typecheck, lint, format, build, docs-check đạt; chạy thử Chromium ST-14-08 đạt (tạm dừng 9 s, thời gian còn lại đứng yên, 0 lỗi console); `npm run gate-flow` đạt (máy tính, Pixel 7).
- **Còn dở:** Báo ngắn, câu NOVA nhiệm vụ (ST-14-09); bước hướng dẫn chỉ có lời vẫn đếm giờ khi bị gợi ý chết che; QB-33 đấu lại có thể bắt đầu lúc màn Kết quả mở (hiếm); QB-13 riêng từng vũ khí chờ vũ khí boss thứ hai.
- **Tiếp theo:** người dùng: chơi thử G1, chọn ADR-002. Em: EP-15 ST-15-14 (QB-14, QB-31), rồi ST-15-01a, ST-15-02 (mục 4 của `00-Bat-dau.md`).

## 2026-11-14: EP-13 ST-13-05b chỉ số phụ của báo cáo cổng MVP

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit ST-13-05b.
- **Mục tiêu:** làm tiếp kế hoạch: mục 7 của báo cáo (GDD 13 mục 6.4), đóng ST-13-05.
- **Đã làm:** `logic/telemetry/report-extra.ts`: K1–K6 (kinh tế), DK1–DK4 (độ khó, kèm cờ chỉnh), T1–T4 (hướng dẫn), X1–X5 (kỹ thuật, p75 nội suy), F1 theo thiết bị, S1 (tự bắn, hỗ trợ ngắm, giảm tốc, mù màu, cỡ chữ). `core/mvp-report.ts` tính số liệu game từ dữ liệu (giá rẻ nhất lúc Quầy mở 200, tổng giá Upgrade 14.593, thu theo màn, `rewardMul`); mục tiêu ở `telemetry.json → report.targets`. Bộ mẫu thêm sự kiện Quầy, độ khó, hướng dẫn, lỗi, cài đặt.
- **File chính:** `game/src/logic/telemetry/report-extra.ts`, `report.ts`, `game/src/core/mvp-report.ts`, `game/tests/mvp-{sample,report}.ts`, `03-Data/telemetry.json`, `01-GDD/13-Do-luong-MVP.md` (cách tính mục 6.4), `stories/EP-13-do-luong.md`, `qa/ST-13-05/`.
- **Quyết định:** chỉ số phụ không chặn cổng (Đúng mục tiêu, Lệch, Theo dõi, Thiếu dữ liệu); số liệu kinh tế tính từ dữ liệu game, không chép vào `telemetry.json`; tùy chọn dạng danh sách ghi `settings_change.value` bằng chỉ số (0 = mặc định) vì `value` chỉ nhận số hoặc boolean.
- **Lỗi tìm thấy / đã sửa:** đáp án DK2 em đếm tay sai (52 lượt Thường, đúng là 51 vì P06 chơi Stage 3 ở Cốt truyện); báo cáo đúng.
- **Kiểm tra:** 482 test (thêm 6), typecheck, lint, format, build, docs-check đạt; chạy `npm run mvp-report` thật, báo cáo mẫu cập nhật ở `qa/ST-13-05/`.
- **Còn dở:** X3 chờ `msToControl` (ST-13-03); id đổi cỡ nút, tay thuận chờ EP-14.
- **Tiếp theo:** người dùng: chơi thử G1, chọn ADR-002. Em: test khóa luật QB đã code nhưng chưa test, sửa QB-72, QB-70 (mục 3 của `00-Bat-dau.md`).

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

