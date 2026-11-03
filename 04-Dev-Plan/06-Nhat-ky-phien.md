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
