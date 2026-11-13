# Nhật ký phiên: lưu trữ

Các mục cũ chuyển từ `04-Dev-Plan/06-Nhat-ky-phien.md`, mới nhất ở trên. Không cần đọc đầu phiên; chỉ tra khi cần lịch sử một quyết định hoặc lỗi.

---

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
