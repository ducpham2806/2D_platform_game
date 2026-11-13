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

## 2026-11-13: Đánh giá kế hoạch bằng Game Studio Agent; hội thoại boss; sửa phóng hình trên điện thoại

- **Nhánh / commit:** `ccr-0afa36c6-vbizeu`.
- **Mục tiêu:** (1) người dùng yêu cầu dùng repo `Game_Studio_Agent` đánh giá lại kế hoạch; (2) sau đó hỏi đổi sang đồ họa 3D rồi quyết định **giữ pixel art, không đổi gì**; (3) giao làm tiếp theo kế hoạch → làm hộp hội thoại (việc "Tiếp theo" của phiên trước).
- **Đã làm:** bản đánh giá `04-Dev-Plan/07-Danh-gia-ke-hoach.md` (3 quyết định còn chờ người dùng). Hộp hội thoại P-UI-DIALOG: `core/dialogue-config.ts` kiểm tra `dialogue_wardens.json` (thêm khối `rules` qua script sinh), `logic/dialogue/` (`DialoguePlayer`, chọn biến thể theo số boss đã hạ, `BossDialogueDirector`), `scenes/stage/dialogue-box.ts`; thoại Thorna trước trận và Thorna + NOVA sau trận. Bỏ S11, S12 khỏi `tutorial.json` (trùng thoại sau trận), S13 kích hoạt bằng `weaponGranted`.
- **File chính:** các file trên, `game/src/scenes/stage-scene.ts`, `game/src/core/game-config.ts`, `game/src/logic/scale.ts`, `game/src/core/phaser-scale.ts`, `03-Data/dialogue_wardens.json`, `03-Data/tutorial.json`, `game/tests/dialogue.test.ts`.
- **Quyết định:** hộp thoại đặt phía trên (wireframe vẽ ở dưới, nhưng sẽ che Kai và boss); không tự chuyển câu, độ dài đoạn thoại bị chặn lúc nạp (≤ 10 s đọc bình thường); boss đã hạ thì không nghe lại; màn xám không có thoại nên số liệu chơi thử không đổi. Hệ số phóng nguyên tính theo điểm ảnh thật thay cho px CSS.
- **Lỗi tìm thấy / đã sửa:** (a) **có từ Sprint 1:** trên điện thoại cầm ngang trong trình duyệt (cao dưới 384 px CSS) game chỉ phóng 1×, chiếm khoảng 1/4 màn hình; đã sửa, giả lập Pixel 7 giờ phóng 4× điểm ảnh thật (cao 292/360 px CSS). (b) Thông báo "Nhận vũ khí" đè lên lời S13; giờ hiện lần lượt. (c) Bản đánh giá ghi sai "giả thuyết khắc chế chưa có prototype" (boss xám đấu lại đã yếu trước Vine Lash); đã sửa mục 1, 3.1, 4.
- **Kiểm tra:** `npm test` 271 test (thêm 16 ở `dialogue.test.ts`, 1 ở `scale.test.ts`), lint, format:check, build đều đạt. Chromium: thoại trước trận hiện khi vào phòng Thorna, máu boss và vị trí Kai đứng yên trong lúc thoại; hạ boss → Thorna → NOVA → "Nhận vũ khí" → S13; giả lập Pixel 7: chạm để hiện hết câu và sang câu, nút Bỏ qua, vào lại sau khi đã hạ thì không có thoại; không có lỗi console.
- **Còn dở:** chưa thử trên điện thoại thật (nhất là hệ số phóng mới: cần xem hình có nét không). ChoicePanel, chân dung, hộp thoại tự tiến, thoại Prologue/Hub chưa làm. Ba quyết định trong bản đánh giá chưa được chọn.
- **Tiếp theo:** màn Kết quả (việc code còn lại của Vertical slice không phụ thuộc bản đồ). Người dùng: mở bản Pages trên điện thoại kiểm tra kích thước hình, rồi chạy đợt chơi thử 5 người. Không bắt đầu M8 trước khi qua cổng Prototype.

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
