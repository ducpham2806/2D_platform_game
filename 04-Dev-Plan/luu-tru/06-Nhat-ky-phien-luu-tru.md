# Nhật ký phiên: lưu trữ

Các mục cũ chuyển từ `04-Dev-Plan/06-Nhat-ky-phien.md`, mới nhất ở trên. Không cần đọc đầu phiên; chỉ tra khi cần lịch sử một quyết định hoặc lỗi.

---

## 2026-11-14: Sprint 8, EP-08 ST-08-01…05 (cây kỹ năng, Xưởng tab Kỹ năng)

- **Nhánh / commit:** `ccr-9de01342-2046rb`, 6 commit:
  - lan thay đổi thiết kế;
  - ST-08-01 đến ST-08-05, mỗi Story một commit.
- **Mục tiêu:** người dùng duyệt 5 quyết định của `01-GDD/10-He-thong-RPG-Xuong.md` và giao làm tiếp.
- **Đã làm:**
  - **Lan thay đổi sang tài liệu:** GDD 0.7 (6.1–6.4, 8.3, nhật ký), đặc tả Hub mục 5, hướng dẫn R03/D02, wireframe `Workshop.html`, `02-Module.md`.
  - **ST-08-01 (dữ liệu):** `skills.json` có kiểm tra luật bậc; trường số trong `shop.json`; công 0,2/cấp; trần mới.
  - **ST-08-02 (cây kỹ năng):** logic thuần; bản lưu 2; `normalizeBuild` trong `SaveManager`.
  - **ST-08-03 (build trong trận):** `computeBuild`/`applyBuild`/`statsFor`; StageWorld giữ dữ liệu gốc và bản đã áp build.
  - **ST-08-04 (trần sức mạnh):** `checkStoryPowerCap`; mô phỏng 4 lối bắn; bot không né.
  - **ST-08-05 (Xưởng):** bảng HTML từ menu, màn Kết quả, menu tạm dừng (áp khi hồi sinh).
- **Quyết định:** sàn nạp đầy nâng 0,75 → 0,8 s theo mô phỏng; phép thử giả định ≤ 1/3 phát nạp đầy trúng lúc boss hở; tiêu chí "bot phòng thủ thua Thorna" đổi thành "build Core không đổi số đòn trúng".
- **Lỗi tìm thấy / đã sửa:**
  - ↑/W trùng Lên và Tương tác, nên trong menu tạm dừng, màn Kết quả, Xưởng bấm ↑ là kích hoạt mục mới (sửa bằng `menuActivate`).
  - Nút Xưởng trên điện thoại 40 px (nâng lên 48).
  - **Chưa sửa (cổng Prototype):** bot không né thắng Thorna sau ~15 s, chỉ trúng 5–6 đòn (đặc tả 60–90 s).
- **Kiểm tra:**
  - `npm test` 321 test (thêm 34), lint, format, build đạt.
  - Chromium:
    - build vào trận đúng (cấp 3 + C1: máu 124, trượt tường ×0,6); màn xám không có build;
    - Xưởng: học bằng phím, chuột, chạm (Pixel 7); đặt lại 2 lần; Esc;
    - menu tạm dừng: học C1, máu đổi sau hồi sinh.
  - Không lỗi console. Ảnh ở `04-Dev-Plan/qa/ST-08-03`, `ST-08-05`.
- **Còn dở:** R02/R03 (chưa có giai đoạn Hub của hướng dẫn); tay cầm chưa thử bằng máy thật.
- **Tiếp theo:**
  1. ST-08-06 → 08 (Phantom, Vanguard, Core: cơ chế tầng 2–3).
  2. Tài liệu âm thanh và đo lường MVP.
  3. Chơi thử cổng Prototype, gồm cân bằng Thorna.

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

## 2026-11-03: Sprint 7, M11 lưu cục bộ

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng đồng ý làm M11 (lưu cục bộ của Vertical slice).
- **Đã làm:** `logic/save/` (thuần): `SaveData` (boss đã hạ, checkpoint + bí mật theo màn, EXP, vũ khí boss, Core Bit, thời gian chơi, revision, savedAt; hỏng từng phần về mặc định), mã sao lưu `CV1.<base64url>.<FNV-1a>`, `SaveManager` (ghi theo thứ tự, không ghi đè bản của phiên bản mới hơn), `StageSave` (nối sự kiện StageWorld với bản lưu). Kho IndexedDB, dự phòng localStorage. `StageWorld` nhận `ownedWeapons`, `takenSecrets`, `bossDefeated`. Màn mới "Dữ liệu lưu" (menu S): tóm tắt, sao chép/nhập mã, xóa tiến trình; menu hiện tóm tắt bản lưu.
- **File chính:** `game/src/logic/save/*.ts`, `game/src/save/*.ts`, `game/src/scenes/save-scene.ts`, `stage-scene.ts`, `menu-scene.ts`, `preload-scene.ts`, `game/src/logic/world/stage-world.ts`, `game/tests/save.test.ts`.
- **Quyết định:** ghi ngay khi qua checkpoint/nhặt bí mật/nhận vũ khí/hạ boss; EXP và Core Bit cộng phần chênh lệch cả khi thoát màn (không mất, không trùng). Hạ boss thì lần sau vào lại từ đầu màn. Vũ khí boss dùng được ở mọi màn. Màn xám (cổng Prototype) không đọc, không ghi bản lưu. Cài đặt điều khiển tạm giữ ở `cv.controls`, gộp vào bản lưu khi làm cloud.
- **Lỗi tìm thấy / đã sửa:** không có.
- **Kiểm tra:** `npm test` 231 test (thêm 15 ở `save.test.ts`), lint, format:check, build đều đạt. Chromium: qua checkpoint ở phòng thử màn chơi → Esc → tải lại trang → vào lại đúng checkpoint 1; bảng Dữ liệu lưu vừa màn 740 × 360, mã sai báo lỗi, gõ phím trong ô không lọt xuống menu; không có lỗi console.
- **Còn dở:** cloud save (Backend, xung đột hai thiết bị), các nhóm dữ liệu của module chưa làm (SP, kỹ năng, skin, nhiệm vụ, kỷ lục).
- **Tiếp theo:** (1) người dùng chơi thử Thorna/Golem và cổng Prototype 5 người; (2) code M10 HUD cơ bản, rồi TutorialManager.

## 2026-11-03: Hỏi đáp, việc tiếp theo trong kế hoạch

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng hỏi công việc tiếp theo trong kế hoạch.
- **Đã làm:** đọc mục nhật ký mới nhất và bảng lộ trình, trả lời. Không đổi code.
- **Kiểm tra:** không áp dụng (chỉ hỏi đáp).
- **Tiếp theo:** không đổi so với mục bên dưới: (1) người dùng chơi thử phòng Thorna/Golem và cổng Prototype 5 người; (2) code M11 lưu cục bộ, rồi M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Rút gọn kế hoạch, lưu trữ nhật ký cũ

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng yêu cầu rút gọn file kế hoạch và chuyển nhật ký cũ sang file lưu trữ để giảm token đầu phiên.
- **Đã làm:**
  - `01-Ke-hoach-lam-viec.md` rút từ khoảng 8,9 KB xuống khoảng 3,5 KB: giữ quy tắc chính và bảng lộ trình (cột trạng thái ngắn gọn); bỏ vòng lặp làm việc với ChatGPT, nhịp tuần, bảng rủi ro. Bản đầy đủ chuyển sang `luu-tru/01-Ke-hoach-lam-viec-ban-day-du.md`.
  - Nhật ký: 3 mục cũ (M6 Boss, hỏi đáp 2026-11-03, khung M7 2026-11-02) chuyển nguyên văn sang `luu-tru/06-Nhat-ky-phien-luu-tru.md`. File này thêm quy tắc giữ tối đa 3 mục, mỗi mục khoảng 15 dòng.
  - `CLAUDE.md`: thêm quy tắc lưu trữ, ghi rõ không đọc thư mục `luu-tru/` đầu phiên.
- **File chính:** `CLAUDE.md`, `04-Dev-Plan/01-Ke-hoach-lam-viec.md`, `04-Dev-Plan/06-Nhat-ky-phien.md`, `04-Dev-Plan/luu-tru/`.
- **Quyết định:** "plan.md" hiểu là `01-Ke-hoach-lam-viec.md` (repo không có file `plan.md`). Không đổi `game/CONTEXT.md` trong phiên này.
- **Kiểm tra:** chỉ đổi tài liệu, không đổi code; `npm run format:check` đạt.
- **Còn dở:** `game/CONTEXT.md` (khoảng 26 KB) là file lớn nhất được đọc đầu phiên, có thể rút gọn tiếp nếu người dùng muốn.
- **Tiếp theo** (giữ từ phiên M6):
  1. Người dùng: chơi thử phòng Thorna và Golem (phím B, G ở menu), ghi nhận xét để chỉnh `bosses.json`; chơi thử cổng Prototype với 5 người.
  2. Code: M11 lưu cục bộ (checkpoint, vật phẩm bí mật, Vine Lash đã nhận), M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Sprint 6, M6 Boss (Thorna + Bramble Golem)

- **Nhánh / commit:** `ccr-b2db3ef4-uu41jr`.
- **Mục tiêu:** người dùng đồng ý làm M6: Thorna thật theo đặc tả Prologue & Stage 1 mục 5 và mini-boss Bramble Golem.
- **Đã làm:**
  - Đổi `GrayBoss` thành `Boss` (`src/logic/boss/boss.ts`), dùng chung cho boss xám và Thorna. `bosses.json` → `attacks` khai đòn nào dùng đòn đó; đòn có trong danh sách pha mà thiếu dữ liệu thì báo lỗi khi nạp.
  - **Thorna** (`03-Data/bosses.json`): HP 100, 3 pha tại 60% / 30%, pha 3 nhanh hơn 20%. Gai Quạt (5 gai xòe 60° ngang tầm người), Dây Quất (hộp ngang sát sàn dài 6 ô, cắt ngắn khi sát tường), Rễ Trồi (3 cột rễ mọc lần lượt trái → phải, vết nứt báo trước), Hoa Nở (12 hạt rơi, 3 khe an toàn, rồi choáng 2 s). Đi chậm về phía người chơi khi nghỉ.
  - Thưởng tách khỏi điểm yếu: `weakness` Ember Burst, `reward` Vine Lash, `rewardExp` 120, `rewardCoreBit` 80 (cộng một lần ở lần thắng đầu, đọc qua `world.exp` / `world.coreBits`; HUD hiện cả phần của boss).
  - **Bramble Golem** (`enemies.json`, `behavior: golem`): 60 máu, pha 1 giậm đất 0,7 s → 2 sóng đất 15 sát thương; từ ≤ 50% máu thì tung 3 hạt nổ (10 sát thương), báo trước 0,5 s rồi lao 4 ô. Chạy trong phòng khóa như kẻ địch thường; rơi 60 EXP và Core Bit.
  - Kiểm tra dữ liệu mới: `reward` phải bằng `weaponGranted` và `weakness` bằng `bossWeakness` của màn; `miniBoss` của màn đã làm phải có trong `enemies.json`; telegraph của mọi đòn Golem ≥ 0,4 s.
  - Phòng thử: `thorna-room.ts` (đấu trường 24 × 12 ô, 3 bục cao 3 ô, menu phím B) và `golem-room.ts` (phòng khóa 20 ô, phím G). `StageDef.boss` chọn boss; scene không còn cứng boss xám.
  - Hiển thị: Thorna màu xanh lục với báo trước riêng từng đòn (vạch gai, vạch dây sát sàn, vết nứt vàng, cột hạt); Golem nhấp nháy cam khi báo trước, đỏ khi lao.
  - Tài liệu: `game/README.md`, `game/CONTEXT.md`, bảng sprint trong `01-Ke-hoach-lam-viec.md`.
- **File chính:** `game/src/logic/boss/boss.ts`, `rain.ts`, `enemy-projectile.ts`; `game/src/core/boss-config.ts`, `enemy-config.ts`, `game-config.ts`; `game/src/logic/enemy/behaviors.ts`; `game/src/stages/thorna-room.ts`, `golem-room.ts`; `game/tests/thorna.test.ts`, `golem.test.ts`; `03-Data/bosses.json`, `enemies.json`.
- **Quyết định:**
  - Gai Quạt báo trước 0,6 s thay vì 0,5 s của đặc tả: pha 3 tăng tốc 20% sẽ còn 0,5 s, vẫn đạt luật "đòn boss ≥ 0,5 s". Số này là `[PLACEHOLDER]`, chỉnh sau playtest.
  - Rễ Trồi nhắm quanh chỗ người chơi đứng lúc bắt đầu báo trước (3 cột cách 3 ô); Hoa Nở thưa hạt (12 hạt) nên có thêm chỗ né ngoài 3 khe bắt buộc.
  - Bramble Golem làm thành kẻ địch (không dùng lớp Boss) để tái dùng phòng khóa, EXP và Core Bit có sẵn.
  - Đấu trường Thorna 24 ô rộng hơn khung 20 ô nên camera đi theo Kai trong đấu trường.
- **Lỗi tìm thấy / đã sửa:** boss giữ vận tốc đi bộ của lúc nghỉ khi vào báo trước nên trượt trong lúc báo trước (test Dây Quất bắt được). Đã đặt vận tốc về 0 khi báo trước.
- **Kiểm tra:** `npm test` 216 test (thêm 24: `thorna.test.ts`, `golem.test.ts`), `npm run lint`, `npm run format:check`, `npm run build` đều đạt. Chạy bản build bằng Chromium: vào phòng Thorna (boss xanh, gai bay, thanh máu có vạch pha) và phòng Golem (cửa khóa, "Còn 1 kẻ địch"); không có lỗi console.
- **Còn dở / chưa làm:** thoại trước/sau trận của Thorna (cần hệ thống thoại), 1 SP (cần hệ thống cấp, M8), sprite, bản đồ thật phòng boss Stage 1 và đoạn C (làm bằng Tiled, chờ cổng Prototype), chưa chơi thử cảm giác với người thật (thời gian thắng 60–90 s mới đo bằng mô phỏng, chưa đo bằng người).
- **Tiếp theo:**
  1. Người dùng: chơi thử phòng Thorna và Golem (phím B, G ở menu) xem cảm giác khe né, thời gian báo trước, độ khó; ghi nhận xét để chỉnh `bosses.json`.
  2. Code: M11 lưu cục bộ (checkpoint, vật phẩm bí mật, Vine Lash đã nhận), M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Hỏi đáp, xác định việc tiếp theo

- **Nhánh / commit:** `ccr-b2db3ef4-uu41jr`.
- **Mục tiêu:** người dùng hỏi phần tiếp theo là gì.
- **Đã làm:** đọc mục nhật ký mới nhất (2026-11-02) và trả lời. Không đổi code.
- **Quyết định:** giữ nguyên lộ trình đã ghi ở mục "Tiếp theo" của phiên 2026-11-02.
- **Kiểm tra:** không áp dụng (không đổi code).
- **Tiếp theo:** (1) người dùng bật GitHub Pages và chơi thử cổng Prototype bằng bản build mới; (2) code M6 Thorna thật + Bramble Golem, rồi M11 lưu cục bộ, M10 HUD cơ bản, TutorialManager.

## 2026-11-02: Sprint 6, khung M7 Màn chơi

- **Nhánh:** `ccr-93d525c1-j97gfr` (từ `main` sau PR #5).
- **Mục tiêu:** đọc kế hoạch để chọn việc tiếp theo, rồi code Sprint 6 (tiếp Vertical slice), bắt đầu bằng M7 Màn chơi. Người dùng đặt quy tắc bắt buộc: mọi phiên phải tóm tắt và ghi lại những gì đã làm (đã đưa vào `CLAUDE.md` và file này).
- **Đọc kế hoạch:** Sprint 1–5 xong (M0–M5, boss xám, công cụ cổng Prototype, đo tự động đạt). Cổng Prototype **chưa** chơi thử với người thật (mục 7 của `05-Cong-Prototype.md` còn trống). Theo mục 6 của file đó, phần mã Vertical slice được làm song song; chỉ thiết kế màn Prologue/Stage 1 phải chờ qua cổng.
- **Đã làm:**
  - Bộ nạp bản đồ **Tiled JSON** (`src/logic/stage/tiled.ts`): lớp ô `ground`/`hazards`, thuộc tính ô `solid`/`oneway`/`hazard`, cờ lật trong gid, đối tượng theo Class (spawn, checkpoint, enemy, target, boss, gate, vine, room, secret, barrier, section), báo lỗi rõ ràng (tileset ngoài, base64, sai cỡ ô, thiếu spawn, Class lạ, thiếu thuộc tính).
  - `StageLayout` chung (`src/logic/stage/layout.ts`) cho cả ASCII và Tiled; `StageWorld` nhận `layout`; `EnemyField` nhận danh sách kẻ địch thay vì ký hiệu chữ.
  - Cơ chế màn (`src/logic/world/stage-mechanics.ts` + `stage-world.ts`): checkpoint (lưu khi đi qua, hồi sinh 1 s, giữ Core Bit/EXP, vào lại từ checkpoint đã lưu), **hố** (−20 máu, về checkpoint, hết máu mới tính chết), **gai** (−30 máu, về chỗ đứng an toàn, bất tử, Spike Guard miễn nhiễm), **dây leo đu** (con lắc 2,4 s, lệch 3 ô, bệ chở người, nhảy khỏi bệ +10%, Xuống + Nhảy rơi xuyên), **phòng khóa** (đóng cửa khi vào, đếm kẻ địch còn lại, mở khi hạ hết, chết thì mở lại), **vật chắn** chỉ vỡ bằng đúng vũ khí, **vật phẩm bí mật**.
  - Vật lý Kai: hỗ trợ bệ di động (`Platform`) và `hitHazard`.
  - Dữ liệu: `03-Data/stages.json` thêm `mechanics` (mọi con số M7), có kiểm tra: hồi sinh ≤ 1,5 s, gai/hố không giết ngay Kai cấp 1 ở độ khó nặng nhất, dây không ngắn hơn biên độ.
  - Hiển thị: vẽ gai, cờ checkpoint, dây leo, cửa phòng khóa, vật chắn, bí mật; HUD "Còn N kẻ địch"; thông báo checkpoint/nhặt đồ; camera khóa trong phòng khóa.
  - **Phòng thử màn chơi** (menu, phím M): bản đồ Tiled `game/maps/m7-test.json` sinh từ bản phác `maps/src/m7-test.map.json` bằng script mới `scripts/ascii-to-tiled.mjs` (tạo kèm tileset xám PNG).
  - Tài liệu: `game/maps/README.md` (quy ước làm bản đồ Tiled), `game/README.md`, `game/CONTEXT.md`, bảng sprint trong `01-Ke-hoach-lam-viec.md`, lưu ý bản build trong `05-Cong-Prototype.md`, `CLAUDE.md` (quy tắc phiên).
- **Quyết định:**
  - Rơi hố không còn là chết (theo đặc tả Stage 1 mục 3): `world.falls` đếm riêng; nhật ký chơi thử vẫn tính rơi hố là một lần hỏng ở đoạn đó để so sánh được với số liệu cũ.
  - Sát thương gai/hố nhân `damageTaken` của độ khó như đòn kẻ địch.
  - Bất tử khi lướt không cứu khỏi gai; đang bất tử sau cú đánh thì chạm gai chỉ bị đưa về, không mất máu.
  - Bản đồ Tiled phải nhúng tileset và lưu lớp ô dạng CSV (đơn giản, dễ đọc diff).
  - Thắng boss rồi ra khỏi phòng thì về checkpoint cuối, không về điểm xuất phát.
- **Lỗi tìm thấy / đã sửa:** **lỗi chết lặp có từ Sprint 3–5**: sau lần chết đầu tiên, sự kiện "chết" cũ còn trong `PlayerPhysics.events` nên Kai hồi sinh rồi chết lại mãi (đã tái hiện trên bản cũ: 7 lần chết trong 400 bước sau một cú đánh). Sửa: `respawn()` xóa sự kiện; thêm test. Bản build trên Pages trước bản này có lỗi đó, đã ghi chú trong `05-Cong-Prototype.md`.
- **Kiểm tra:** `npm test` 192/192 (thêm 20 test ở `tests/stage-mechanics.test.ts` và 1 test hồi sinh), `npm run lint`, `npm run format:check`, `npm run build` đều đạt. Chạy bản build bằng Chromium: vào phòng thử màn chơi, xem dây leo, phòng khóa (khóa cửa, khóa camera, đếm 2 kẻ địch), vật chắn và bí mật; không có lỗi console.
- **Còn dở / chưa làm của M7:** bản đồ thật Prologue và Stage 1 (chờ qua cổng Prototype), thang và dây leo đứng yên (cần leo trèo, thuộc M3), bệ dây di chuyển (đoạn B), lớp parallax, lưu checkpoint và vật phẩm bí mật (M11), Bramble Golem.
- **Tiếp theo:**
  1. Người dùng: bật GitHub Pages và chạy đợt chơi thử cổng Prototype với bản build mới (đã sửa lỗi chết lặp).
  2. Code: M6 Thorna thật (khung 3 pha đã có từ boss xám) + Bramble Golem, rồi M11 lưu cục bộ (checkpoint, vật phẩm bí mật), M10 HUD cơ bản, TutorialManager.
