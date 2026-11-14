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

## 2026-11-03: Sprint 7, TutorialManager

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng giao làm TutorialManager (việc code cuối của Vertical slice).
- **Đã làm:** `03-Data/tutorial.json` (13 bước Stage 1 S01–S13 theo kịch bản mục 4.2) + kiểm tra `core/tutorial-config.ts`. `logic/tutorial/` (thuần): `TutorialManager` (hàng đợi, `after`, `skipIfDone`, `cancelOn`, gợi ý theo giây/thất bại) và `TutorialSignals` (StageWorld → tín hiệu, thêm `LockedRoom.kinds`). Hộp lời thoại `TutorialBox`, nút cảm ứng nhấp nháy theo gợi ý, mục Bật/Tắt hướng dẫn ở menu tạm dừng, tiến độ lưu trong bản lưu (`tutorial.done/off`). Bật cho 4 phòng thử (`StageDef.tutorial: 'stage1'`).
- **File chính:** `03-Data/tutorial.json`, `game/src/core/tutorial-config.ts`, `game-config.ts`, `game/src/logic/tutorial/*.ts`, `game/src/scenes/stage/tutorial-box.ts`, `pause-menu.ts`, `stage-scene.ts`, `game/src/logic/save/save-data.ts`, `game/tests/tutorial.test.ts`.
- **Quyết định:** bước theo tín hiệu sự kiện, không theo tọa độ bản đồ (chưa được chốt màn trước cổng Prototype). Chưa làm Prologue P01–P13 và F01–F04 vì cần bản đồ Prologue. Màn xám không có hướng dẫn để giữ số liệu chơi thử. Lời thoại để thẳng tiếng Việt trong dữ liệu (khóa `tut.<ID>` và tiếng Anh làm khi có bản địa hóa).
- **Lỗi tìm thấy / đã sửa:** chạy thử thấy hạ boss khi lời S08 còn hiện thì S09/S10 vẫn hiện sau trận; thêm `cancelOn` (S08, S09) và `skipIfDone` (S10), có test.
- **Kiểm tra:** `npm test` 254 test (thêm 14 ở `tutorial.test.ts`), lint, format:check, build đều đạt. Chromium: chạm gai ở phòng thử màn chơi → S03, lưu `done: [S03]`; tắt hướng dẫn ở menu tạm dừng → lưu `off: true`; giả lập Pixel 7: hạ Thorna → S11, S12, S13 và nút VK > cùng nút vũ khí nhấp nháy; không có lỗi console.
- **Còn dở:** gợi ý bậc 3–4, minh họa bóng mờ, mục Trợ giúp, sự kiện đo lường; trên cảm ứng tên nút dài nên một số lời thoại thành 3 dòng.
- **Tiếp theo:** phần code Vertical slice đã đủ khung. Chờ người dùng báo kết quả chơi thử (Thorna/Golem, cổng Prototype 5 người). Trong lúc chờ, có thể làm: hộp hội thoại (thoại Thorna, cần cho S11), màn Kết quả, hoặc M8 RPG rút gọn của MVP (hỏi người dùng).

## 2026-11-03: Sprint 7, M10 HUD cơ bản

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng giao làm phần tiếp theo (M10 HUD cơ bản); phần chơi thử người dùng sẽ báo sau.
- **Đã làm:** `logic/hud/` (thuần): `buildHud` dựng mô hình HUD từ StageWorld, `MenuCursor`. HUD vẽ lại theo wireframe Main/HUDPC (máu kèm số, năng lượng, máu boss giữa trên, Core Bit gồm cả bản lưu, EXP, ô vũ khí PC, chừa chỗ nút II trên cảm ứng). Menu tạm dừng thay cho Esc về thẳng menu. Nút biểu tượng vũ khí cảm ứng (chạm = sau, vuốt trái = trước, nhãn là tên vũ khí): `controls.json` thêm nút `weapon` (`swipe: true`) và `swipeMinDp`, có kiểm tra.
- **File chính:** `game/src/logic/hud/*.ts`, `game/src/scenes/stage/stage-hud.ts`, `pause-menu.ts`, `stage-scene.ts`, `game/src/input/touch-overlay.ts`, `input-service.ts`, `game/src/core/controls-config.ts`, `03-Data/controls.json`, `game/tests/hud.test.ts`.
- **Quyết định:** HUD đọc mô hình thuần mỗi khung thay vì event bus (gợi ý trong P-UI-HUD), vì số liệu đổi mỗi bước. "Lắp module nhanh" và "Tùy chọn" hiện mờ tới khi có M8/Cài đặt. Thoát về menu (Hub mới là khung).
- **Lỗi tìm thấy / đã sửa:** ô vũ khí đè dòng hướng dẫn phím ở cạnh dưới (đã đẩy lên). Dòng M8–M18 trong bảng module của `CONTEXT.md` chưa được cập nhật ở phiên M11 (khoảng trắng đệm làm lệnh thay không khớp), đã sửa.
- **Kiểm tra:** `npm test` 240 test (thêm 9 ở `hud.test.ts`), lint, format:check, build đều đạt. Chromium: HUD trong trận Thorna, tạm dừng giữ trận đứng yên, thoát cần bấm hai lần, Esc tiếp tục; giả lập Pixel 7 ngang: chạm nút vũ khí đổi sang Vine Lash, nhãn đổi theo; không có lỗi console.
- **Còn dở:** safe-area tai thỏ, hội thoại, màn Kết quả, Cài đặt, bản đồ nhỏ (phần còn lại của M10).
- **Tiếp theo:** (1) người dùng chơi thử Thorna/Golem và cổng Prototype 5 người (sẽ báo); (2) code TutorialManager (`01-GDD/07-Kich-ban-huong-dan.md`).
