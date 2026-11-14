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

## 2026-11-14: Tài liệu M8 (kỹ năng, module, Két giáp, Xưởng) theo quy trình Game Studio Agent

- **Nhánh / commit:** `ccr-9de01342-2046rb`.
- **Mục tiêu:** người dùng giao "dùng Game Studio Agent triển khai tiếp tài liệu còn thiếu, đề xuất phương án tốt nhất".
- **Đã làm:** đọc đầu vào bằng graphify. Theo bộ khung:
  - `/map-systems`: bản đồ hệ thống, tài liệu còn thiếu, tên chuẩn.
  - `/design-system`: GDD hệ thống theo mẫu 8 mục, so 5 phương án cây kỹ năng, chọn E.
  - Hai Director duyệt độc lập (agent con): Creative Director; Technical Director + Producer, có chạy mô phỏng DPS bằng code game. Cả hai "duyệt kèm sửa"; đã kiểm chứng trên code và sửa thành bản 2.
  - ADR-001 (Xưởng là bảng HTML); Epic EP-08 với 9 Story.
- **File chính:** `01-GDD/10-He-thong-RPG-Xuong.md`, `04-Dev-Plan/07-Ban-do-he-thong.md`, `04-Dev-Plan/adr/ADR-001-xuong-bang-html.md`, `04-Dev-Plan/stories/EP-08-xuong-rpg.md`, `ST-08-01…09`.
- **Quyết định đề xuất (chờ duyệt, GDD mục 10):**
  - Cây E: 3 × 3 nút có bậc, 18 SP.
  - Hạ công theo cấp 0,25 → 0,2.
  - Tab Kỹ năng làm ngay; Module, Giáp khi có nội dung Stage 2–4; skin, Loadout sang Alpha.
  - Chỉnh kỹ năng trong menu tạm dừng, áp khi hồi sinh.
  - Build không giảm sát thương gai/hố.
- **Lỗi tìm thấy:**
  - GDD 6.1 mâu thuẫn trần ×2,2: cấp 30 × Upgrade đã 2,16, Citadel không đồng bộ cấp.
  - Bản 1 tính sai: tăng tốc nạp áp cả nạp vừa nâng DPS tối đa khoảng 26–30% (`loadout.ts` bắn 1 phát khi bấm; mô phỏng 7,47 / 9,62).
  - P3 bất tử có đồng hồ ẩn, vượt 20%.
  - Cờ `airDash` cho lướt trên không vô hạn.
  - Kẻ địch chưa có trạng thái choáng (Phase Step).
- **Kiểm tra:** chỉ tài liệu, không đổi code; prettier đạt.
- **Còn dở:** chờ người dùng duyệt; lan thay đổi sang GDD chính, Hub, hướng dẫn, wireframe (GDD mục 9) sau khi duyệt.
- **Tiếp theo:**
  1. Duyệt mục 10, rồi làm ST-08-01 → 05 (Vertical slice).
  2. Tài liệu âm thanh MVP và đo lường MVP (bản đồ hệ thống mục 2).
  3. Đặc tả Stage 2–4 sau cổng Prototype.

## 2026-11-14: Sprint 8, phóng hình theo px thiết bị và M8 cấp/SP

- **Nhánh / commit:** `ccr-9de01342-2046rb` (2 commit: phóng hình; M8).
- **Mục tiêu:** người dùng đồng ý sửa hệ số phóng theo đề xuất rồi làm tiếp: chọn M8 RPG rút gọn (đọc GDD 6, P-M8, `player.json` bằng graphify).
- **Đã làm:** (1) `computeLayout` nhận `devicePixelRatio`, phóng nguyên theo px thật, tự căn giữa đúng biên px thật; chữ thông báo giữa màn hình neo dưới hộp hướng dẫn. (2) M8: `logic/rpg/progression.ts` (cấp từ EXP, SP, đồng bộ cấp, chỉ số theo cấp, LevelTracker); StageWorld nhận `level` và `setLevel()` thay cấp 1 cố định của Prototype; `StageDef.campaign`; lên cấp giữa màn; cấp ở HUD, màn Kết quả, menu, Dữ liệu lưu; kiểm tra trần sức mạnh cốt truyện lúc nạp.
- **File chính:** `game/src/logic/scale.ts`, `core/phaser-scale.ts`, `main.ts`, `style.css`, `scenes/stage/stage-hud.ts`; `game/src/logic/rpg/progression.ts`, `core/player-config.ts`, `core/game-config.ts`, `logic/world/stage-world.ts`, `logic/player/player-physics.ts`, `scenes/stage-scene.ts`, `logic/result/stage-result.ts`, `scenes/{menu,save}-scene.ts`, `save/save-panel.ts`, `game/tests/{scale,rpg}.test.ts`.
- **Quyết định:** cấp và SP suy ra từ EXP và boss đã hạ (không lưu riêng); lên cấp áp ngay giữa màn; màn xám luôn cấp 1; phòng thử Stage 1 đồng bộ cấp 1–6. Cây kỹ năng chưa làm vì chưa có danh sách kỹ năng (cần người dùng chốt).
- **Lỗi tìm thấy / đã sửa:** điện thoại ngang chỉ phóng ×1 theo px CSS (nay Pixel 7 ×4 px thật, iPhone 13 ×5). Chữ "Nhận vũ khí" bị hộp S13 che. Khi viết M8: boss hạ lần đầu suýt không được cộng SP vì cờ thoại đã đổi trước (sửa bằng cờ riêng). GDD ghi EXP 29→30 "~4.460", tính đúng là 4461.
- **Kiểm tra:** `npm test` 287 test (thêm 14: scale 2, rpg 12), lint, format:check, build đạt. Chromium: canvas Pixel 7 1280 × 768 px thật, iPhone 13 ×5, desktop ×3 không đổi, Windows 125% ×4, nhấp nút trong canvas trúng ở mọi cấu hình; Pixel 7 chạm hộp thoại/Bỏ qua/Kết quả vẫn đúng. M8: hạ Thorna ở cấp 1 → "Lên cấp 2! +1 SP", máu tối đa 100 → 104, Kết quả "+120 (cấp 1 → 2)", "+2 SP", menu "cấp 2 · SP 2". Không lỗi console.
- **Còn dở:** cây kỹ năng rút gọn, module và ô theo cấp, Két giáp, loadout, Xưởng.
- **Tiếp theo:** người dùng chọn phạm vi cây kỹ năng rút gọn (đề xuất 3 nhánh × 3 kỹ năng dùng cơ chế đã có), rồi làm Xưởng (kỹ năng, đặt lại miễn phí, lưu SP đã tiêu). Vẫn chờ kết quả cổng Prototype 5 người (nay bản điện thoại hiển thị to hơn).

## 2026-11-14: Sprint 8, hội thoại boss và màn Kết quả (đọc đầu vào bằng graphify)

- **Nhánh / commit:** `ccr-9de01342-2046rb`.
- **Mục tiêu:** người dùng giao "làm tiếp plan", dùng graphify đọc dữ liệu đầu vào. Làm hai phần M10 còn thiếu của Vertical slice mà không cần bản đồ thật: hội thoại boss (thoại Thorna, cần cho S11) và màn Kết quả.
- **Đã làm:** cài `graphifyy`, dựng đồ thị repo (`graphify update .`, 1692 node, không cần khóa LLM), tra `graphify query/explain` để tìm P-UI-DIALOG, P-UI-PREP-RESULT, `09-Thoai-Warden.md`, đặc tả Thorna mục 5, kịch bản S11–S13, wireframe Dialogue/Result; tra thêm skill `dialogue-systems` trong đồ thị Game_Studio_Agent. Code: `03-Data/ui.json` + kiểm tra (`core/ui-config.ts`, `core/dialogue-config.ts`), `logic/dialogue/` (chọn biến thể theo số Warden đã hạ, DialogueRunner), `DialogueBox`, `logic/result/` + `ResultPanel`, `MenuNavigator` dùng chung (menu tạm dừng chuyển sang dùng), `world.elapsedSec`, `StageDef.result` (phòng Thorna), `remindOnResult` cho bước hướng dẫn.
- **File chính:** `03-Data/ui.json`, `03-Data/tutorial.json`, `game/src/core/{ui,dialogue,game}-config.ts`, `game/src/logic/{dialogue,result}/*`, `game/src/logic/hud/menu-cursor.ts`, `game/src/scenes/stage/{dialogue-box,result-panel,pause-menu}.ts`, `stage-scene.ts`, `game/tests/{dialogue,result,tutorial}.test.ts`.
- **Quyết định:** hộp mở thì trận đứng yên, không tự đóng (luôn bỏ qua được); S11/S12 chuyển thành hộp hội thoại (hiện cả khi tắt hướng dẫn), S13 kích hoạt khi nhận vũ khí; Kết quả mở sau 8 s kể từ khi thoại đóng; nút "Về menu" thay "Về Hub" tới khi Hub dùng được trên cảm ứng; `graphify-out/` vào `.gitignore` (sinh lại được).
- **Lỗi tìm thấy / đã sửa:** chạy thử thấy chữ HUD lờ mờ xuyên qua hộp thoại (nền đục lại), nút Bỏ qua nhỏ khi chạm (phóng to). **Chưa sửa, cần chốt:** điện thoại ngang ~360 px CSS chỉ được phóng ×1 (canvas 320 × 192 px CSS, khoảng 1/3 màn hình) vì hệ số nguyên tính theo px CSS.
- **Kiểm tra:** `npm test` 273 test (thêm 19), lint, format:check, build đạt. Chromium bàn phím: thoại trước trận (boss đứng yên), hạ Thorna → Thorna → NOVA → báo Vine Lash → S13 → Kết quả 8 s sau; Chơi lại thành trận đấu lại không thoại, Kết quả "Không có phần thưởng mới"; Về menu. Pixel 7 ngang: chạm hộp hiện hết/đóng, chạm Bỏ qua, lớp nút ẩn/hiện đúng, chạm Chơi lại màn. Không lỗi console.
- **Còn dở:** ChoicePanel, thoại NPC/Prologue, tự tiến, âm thanh biểu cảm, chân dung thật; Kết quả chưa có cấp/SP (M8), Data Chip, Memory Log/Két giáp, kỷ lục.
- **Tiếp theo:** (1) hỏi người dùng có sửa hệ số phóng theo px thiết bị trước đợt chơi thử 5 người không (ảnh hưởng trải nghiệm trên điện thoại); (2) chờ kết quả cổng Prototype; (3) trong lúc chờ: M8 RPG rút gọn (cấp, SP, Két giáp) để màn Kết quả có lên cấp.
