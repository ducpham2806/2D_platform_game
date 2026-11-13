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

## 2026-11-13 (tiếp 3): Smoke check và bảng chuỗi đa ngôn ngữ

- **Nhánh / commit:** `ccr-0afa36c6-vbizeu`.
- **Mục tiêu:** người dùng giao tự làm tiếp → hai việc đã nêu ở mục trước: smoke check có ảnh chụp, bảng chuỗi.
- **Đã làm:** `scripts/smoke-check.mjs` + `npm run smoke` (10 bước, ảnh ở `smoke-shots/`), job CI `smoke` (chưa chặn merge). `03-Data/strings.json` (46 khóa, `vi` + `en`), `core/strings-config.ts`, `logic/i18n.ts`; HUD, menu tạm dừng, hộp hội thoại, màn Kết quả lấy chữ từ bảng chuỗi; `?lang=en` để thử; thoại boss theo cùng ngôn ngữ.
- **File chính:** các file trên, `game/src/scenes/stage-scene.ts`, `stage/stage-hud.ts`, `stage/pause-menu.ts`, `result-scene.ts`, `preload-scene.ts`, `debug/flags.ts`, `.github/workflows/ci.yml`, `game/tests/strings.test.ts`, `CLAUDE.md` (thêm hai nguyên tắc: chữ lấy từ bảng chuỗi, đổi hình thì chạy smoke).
- **Quyết định:** khóa chuỗi khai trong mã (`STRING_KEYS`) để sai khóa là lỗi biên dịch; dữ liệu thiếu/thừa khóa hoặc lệch chỗ điền giữa hai ngôn ngữ thì game dừng ở màn tải. Ảnh smoke không commit (CI lưu thành artifact).
- **Lỗi tìm thấy / đã sửa:** không có lỗi game. Ghi nhận hành vi: phím bấm cùng bước với cú Bỏ qua hội thoại bị hội thoại nhận (đúng thiết kế, kịch bản thử phải chờ).
- **Kiểm tra:** `npm test` 301 test (thêm 5 ở `strings.test.ts`), lint, format:check, build đều đạt; `npm run smoke` 10/10 bước đạt (chạy 4 lần). Chromium `?lang=en`: thoại Thorna, menu tạm dừng, màn Kết quả hiện tiếng Anh, không tràn khung. Job CI `smoke` **chưa được chạy trên GitHub**.
- **Còn dở:** chưa chuyển chuỗi của màn hình chính, Điều khiển, Dữ liệu lưu, công cụ chơi thử, tên màn, tên nút, lời hướng dẫn; chưa có chọn ngôn ngữ trong game.
- **Tiếp theo:** xem `08-Viec-cho-nguoi-dung.md`. Việc Claude tự làm được tiếp: màn Cài đặt (âm thanh, ngôn ngữ, tùy chọn tiếp cận: giảm rung, giảm hiệu ứng), safe-area tai thỏ, chuyển nốt chuỗi còn lại, tiếng Anh cho lời hướng dẫn.

## 2026-11-13 (tiếp 2): Âm thanh tổng hợp và hiệu ứng tối thiểu

- **Nhánh / commit:** `ccr-0afa36c6-vbizeu`.
- **Mục tiêu:** người dùng giao tự làm tiếp, việc cần người dùng thì ghi lại → chọn phương án A của quyết định 1 trong bản đánh giá (lượt cảm giác tối thiểu trước đợt chơi thử). Tạo `08-Viec-cho-nguoi-dung.md`.
- **Đã làm:** `03-Data/feedback.json` (34 cue → âm tổng hợp, hạt, co giãn) + `core/feedback-config.ts`; `logic/feel/` (`CueCollector`, `ParticlePool`, `Squash`, cài đặt âm thanh); `audio/sfx-player.ts` (Web Audio); nối vào `StageScene`; mục Bật/Tắt âm thanh ở menu tạm dừng.
- **File chính:** các file trên, `game/src/scenes/stage-scene.ts`, `stage/stage-renderer.ts`, `stage/pause-menu.ts`, `preload-scene.ts`, `core/game-config.ts`, `core/phaser-services.ts`, `game/tests/feedback.test.ts`.
- **Quyết định:** âm thanh tổng hợp bằng mã, chưa dùng file (không phụ thuộc asset, 0 MB tải thêm); mọi thông số ở dữ liệu. Áp cho cả màn xám vì mục đích là để người thử chấm cảm giác có phản hồi. Chưa làm corner correction và apex hang (đổi vật lý Kai, nên chờ ý người dùng hoặc làm thành thông số mặc định tắt).
- **Lỗi tìm thấy / đã sửa:** không có.
- **Kiểm tra:** `npm test` 296 test (thêm 13 ở `feedback.test.ts`), lint, format:check, build đều đạt. `gate-check`: mọi hạng mục đạt (60 FPS ở CPU chậm 6×, tải đầu 1,48 MB). Chromium: nhảy, đáp, bắn, lướt đều tạo âm (đếm nút Web Audio) và hạt, hình Kai co giãn; tắt âm ở menu tạm dừng thì không còn âm mới và được lưu; không có lỗi console. **Chưa ai nghe bằng tai**: âm lượng và âm sắc cần người dùng nghe thử.
- **Còn dở:** nhạc, âm menu/hội thoại, hạt tại chỗ kẻ địch bị trúng, tùy chọn giảm hiệu ứng.
- **Tiếp theo:** xem `08-Viec-cho-nguoi-dung.md` (merge, thử điện thoại thật, chơi thử 5 người, 2 quyết định còn lại). Việc Claude tự làm được tiếp: smoke check Playwright có ảnh chụp trong CI; bảng chuỗi đa ngôn ngữ; corner correction/apex hang dạng thông số chỉnh được; phần còn lại của M10 (Cài đặt, safe-area).

## 2026-11-13 (tiếp): Màn Kết quả

- **Nhánh / commit:** `ccr-0afa36c6-vbizeu`.
- **Mục tiêu:** người dùng giao làm tiếp theo kế hoạch → màn Kết quả (việc "Tiếp theo" của mục trước).
- **Đã làm:** `ResultScene` theo wireframe Result.html; `logic/result/stage-result.ts` (số liệu, định dạng thời gian, `ResultGate`); `logic/player/level.ts` (cấp theo EXP); `stages.json` thêm `mechanics.result`; `tutorial.json` thêm R01 (giai đoạn `afterStage1`). Màn có bản lưu giờ kết thúc khi hạ boss và chuyển sang Kết quả; trước đây hạ boss xong người chơi phải tự thoát.
- **File chính:** `game/src/scenes/result-scene.ts`, `stage-scene.ts`, `game/src/logic/result/stage-result.ts`, `game/src/logic/player/level.ts`, `game/src/core/stage-mechanics-config.ts`, `tutorial-config.ts`, `03-Data/stages.json`, `03-Data/tutorial.json`, `game/tests/stage-result.test.ts`.
- **Quyết định:** đặc tả không nói màn kết thúc thế nào; chọn tự chuyển sau khi hạ boss 2,5 s, chờ người chơi thử vũ khí mới (S13) tối đa 20 s. "Tiếp tục" về màn hình chính vì Hub còn là khung. Thời gian chỉ tính lúc màn chạy (không tính tạm dừng, thoại) và dừng khi hạ boss. Màn xám giữ nguyên luồng phiếu chấm.
- **Lỗi tìm thấy / đã sửa:** không có.
- **Kiểm tra:** `npm test` 283 test (thêm 12 ở `stage-result.test.ts`), lint, format:check, build đều đạt. Chromium: hạ Thorna lần đầu, đổi và bắn Vine Lash → Kết quả (EXP +120, cấp 1 → 2, Core Bit +80, vũ khí mới, lời R01); Chơi lại màn → hạ lại → Kết quả sau 2,5 s ("Không có gì mới"); Tiếp tục → màn hình chính; không có lỗi console. Chưa thử màn Kết quả bằng cảm ứng.
- **Còn dở:** Data Chip, Memory Log, Két giáp, SP và nút Mở Xưởng (M8); Về Hub; màn Chuẩn bị.
- **Tiếp theo:** phần code Vertical slice không phụ thuộc bản đồ đã hết. Việc còn lại đều cần cổng Prototype (bản đồ Prologue/Stage 1, bước Prologue) hoặc asset P1. Người dùng: merge nhánh vào `main` để có bản Pages, xem kích thước hình trên điện thoại thật, chạy đợt chơi thử 5 người; và chọn 3 quyết định trong `07-Danh-gia-ke-hoach.md`.
