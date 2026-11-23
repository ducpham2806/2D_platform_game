# CONTEXT: Cyber Vanguard (mã nguồn game)

Kiến trúc, cấu trúc, lệnh và trạng thái module của mã nguồn. Đọc khi code. Quyết định chi tiết của từng module nằm ở `game/docs/quyet-dinh/` (chỉ đọc file của module đang làm). Trạng thái chỉ ghi ở mục "Module và trạng thái" bên dưới; file khác trỏ về đây.

## Kiến trúc

- **Công nghệ:** Phaser 3.90 + TypeScript 5.9 (strict, không `any`) + Vite 8; test Vitest 5; ESLint 10 + Prettier.
- **Độ phân giải logic:** 320 × 192 (20 × 12 ô, ô 16 px). Phóng to theo hệ số **nguyên** (tính theo px thiết bị) lớn nhất vừa màn hình, dư thì viền đen, `pixelArt: true`. Cầm dọc thì che game và nhắc xoay ngang.
- **Vòng lặp:** logic chạy theo bước cố định 60 Hz (`src/logic/fixed-step.ts`), tách khỏi FPS.
- **Dữ liệu:** nguồn duy nhất là `../03-Data/*.json`. `npm run sync-data` (tự chạy trước `dev`/`build`) chép sang `public/data/` (bị gitignore). Không sửa tay `public/data/`, không viết cứng chỉ số trong mã.
- **Kiểm tra dữ liệu:** `src/core/game-config.ts` kiểm tra kiểu từng file bắt buộc và các bất biến thiết kế giữa nhiều file (vòng khắc chế, Két giáp, cấp khuyến nghị, weapons khớp stages, hệ số thưởng khớp độ khó). Dữ liệu sai thì game dừng ở màn tải với thông báo lỗi, và test/CI báo đỏ.
- **Giao tiếp giữa module:** event bus có kiểu (`src/core/event-bus.ts`, danh sách sự kiện ở `src/core/game-events.ts`), không gọi chéo trực tiếp.
- **Logic thuần:** `src/logic/` và `src/core/` không import Phaser (ESLint chặn), trừ các file `src/core/phaser-*.ts`. Test chạy trên Node, không cần trình duyệt.
- **Thế giới màn chơi (M4):** `src/logic/world/stage-world.ts` gom Kai, vũ khí, đạn, bia, boss, cửa phòng boss, hồi sinh và hit-stop thành một bước logic thuần `world.step(WorldInput)` trả về `WorldEvents`. Scene chỉ đổi `InputSnapshot` → `WorldInput`, vẽ trạng thái và tạo hiệu ứng theo sự kiện. Nhờ vậy test mô phỏng được cả trận đánh boss.
- **Màn chơi (M7):** mọi màn đi qua `StageLayout` (`src/logic/stage/layout.ts`): lưới ô + danh sách đối tượng theo ô (xuất phát, kẻ địch, bia, boss, cửa, checkpoint, dây leo, phòng khóa, vật chắn, bí mật, các đoạn). Hai nguồn: bản đồ ASCII (`layoutFromRows`) và bản đồ Tiled JSON (`layoutFromTiled`, `src/logic/stage/tiled.ts`, quy ước ở `maps/README.md`). `StageWorld` nhận `layout` (hoặc `rows` cho test) và không biết màn đến từ đâu. Mỗi lần vào màn dựng bố cục mới vì lưới ô bị đổi khi chơi.
- **Đầu vào (M2):** gameplay chỉ đọc `InputSnapshot` (hành động trừu tượng: `held`/`pressed`/`released`, `moveX`/`moveY`, thiết bị gần nhất) bằng `getInput(scene).step()`, gọi **đúng một lần mỗi bước logic**. Không module nào đọc phím, nút hay chạm trực tiếp. Bấm rồi nhả trong cùng một bước vẫn có `pressed = true` (cần cho jump buffer ở M3). Bàn phím đọc theo `KeyboardEvent.code` nên không phụ thuộc bộ gõ tiếng Việt.

## Cấu trúc

```
src/
  main.ts                 cấu hình Phaser.Game, danh sách scene
  core/constants.ts       kích thước logic, bước cố định, khóa scene, đường dẫn dữ liệu
  core/event-bus.ts       event bus có kiểu (thuần)
  core/game-events.ts     danh sách sự kiện toàn game
  core/game-config.ts     kiểu + kiểm tra dữ liệu cấu hình (thuần)
  core/phaser-services.ts bus và config trong registry của Phaser
  core/phaser-scale.ts    giữ canvas ở hệ số phóng nguyên khi đổi kích thước/xoay máy
  logic/scale.ts          tính bố cục phóng nguyên (thuần)
  logic/fixed-step.ts     bộ đếm bước cố định (thuần)
  logic/input/            hành động, gán phím + remap, gộp đầu vào theo bước, cần ảo,
                          bố cục nút cảm ứng, biểu tượng nút cho lời thoại, lưu cài đặt (thuần)
  core/controls-config.ts kiểm tra 03-Data/controls.json (thuần)
  input/                  nối với trình duyệt: bàn phím, tay cầm (Gamepad API), lớp nút cảm ứng
                          HTML + bảng chỉnh bố cục, InputService gom tất cả
  logic/tilemap.ts        lưới ô va chạm ('#' đặc, '=' bục một chiều, '^' gai, 'P' điểm xuất phát) (thuần)
  logic/stage/            StageLayout chung, dựng từ ASCII hoặc nạp bản đồ Tiled JSON (thuần)
  logic/player/           vật lý + máy trạng thái của Kai, va chạm AABB trên lưới ô (thuần)
  logic/combat/           sát thương, đạn (pool), bộ vũ khí (Arc Cannon 3 mức nạp, vũ khí boss
                          theo dữ liệu, năng lượng 28), bia tập bắn (thuần)
  logic/boss/             Boss theo dữ liệu (Warden và mini-boss bay), chọn khe
                          né Mưa đạn/Hoa Nở (thuần)
  logic/enemy/            kẻ địch thường (M5): lớp chung + Drone, Tháp pháo, Bướm Sắt, Lính Kén;
                          mini-boss Bramble Golem (M6) (thuần)
  logic/world/            StageWorld: ghép mọi thứ thành một bước logic; xử lý trúng đòn; EnemyField
                          (tầm hoạt động, EXP); vật phẩm Core Bit/máu/năng lượng; Nano Cell;
                          cơ chế màn M7 (dây leo đu, phòng khóa, vật chắn, bí mật) (thuần)
  core/stage-mechanics-config.ts  kiểm tra stages.json → mechanics (hồi sinh, hố, gai, dây leo)
  logic/formula.ts        tính công thức trong dữ liệu ("100+4*(L-1)") không dùng eval (thuần)
  logic/rng.ts            ngẫu nhiên có hạt giống (test lặp lại được)
  core/*-config.ts        kiểm tra từng file dữ liệu: player, weapons, bosses, enemies, controls (thuần)
  logic/playtest/         nhật ký chơi thử, tổng hợp theo ngưỡng "hỏng" GDD 17, xuất/gộp JSON,
                          danh sách thông số của bảng chỉnh cảm giác (thuần)
  logic/telemetry/        M16 đo lường MVP (EP-13): lược đồ sự kiện, kiểm lược đồ (id theo danh mục), bộ đệm theo
                          ưu tiên (lô bất biến, cutBatch/ack), lô và gói xuất JSON, bộ ghi Telemetry; báo cáo
                          cổng MVP (report-data: đọc, dựng lượt; report: MV, H, Markdown; report-extra: K, DK, T, X, F, S)
  logic/hash.ts           FNV-1a dùng chung (mã sao lưu, dấu vân tay 03-Data cho đo lường)
  core/telemetry-*.ts     kiểm tra 03-Data/telemetry.json (không bắt buộc: lỗi thì tắt đo lường); danh mục id
  core/mvp-report.ts      tham số báo cáo MVP (telemetry.json → report + stages.json), runMvpReport (thuần)
  stages/                 danh sách màn (StageDef: 'ascii' hoặc 'tiled'; `boss` chọn boss trong bosses.json):
                          màn xám Prototype, phòng thử kẻ địch, phòng boss Thorna, phòng Golem (ASCII),
                          phòng thử màn chơi M7 (Tiled)
  scenes/                 Boot → Preload → Menu, Hub, Stage, Controls, Playtest (kết quả chơi thử)
  demo25d/                demo 2.5D three.js (EP-22, ADR-003): trang riêng demo-25d.html dựng phòng Thorna từ StageWorld
                          thật (coords thuần có test, input, stage3d, actors, main: camera, bloom, tự chơi, quay từng khung)
  prototype3d/            phòng thử ST-22-06 (prototype-3d.html), camera 3/4 và GLB. Luật X/Z ở logic/prototype3d/.
  scenes/telemetry/       lớp nối đo lường (EP-13): telemetry-service (bật bằng ?debug=1&telemetry=1, session_start,
                          boot_timing, lỗi trang), stage-telemetry (StageTracker, FrameStats, hướng dẫn, gợi ý NOVA)
  scenes/stage/           vẽ màn chơi (renderer, kẻ địch, vật phẩm), HUD vẽ theo HudModel, menu tạm dừng,
                          hộp hội thoại, màn Kết quả, gắn công cụ chơi thử vào màn (stage-playtest.ts)
  logic/hud/              M10: mô hình HUD từ StageWorld (máu, năng lượng, vũ khí, máu boss, Core Bit, EXP,
                          phòng khóa), con trỏ menu, MenuNavigator, hộp chữ QB-70…72 (text-boxes) (thuần)
  logic/tutorial/         TutorialManager (máy trạng thái bước theo tutorial.json, hàng đợi, bỏ qua khi đã làm
                          được, gợi ý theo giây/thất bại, cancelOn, chuỗi `after` theo lượt QB-88) và TutorialSignals
                          (StageWorld → tín hiệu) (thuần)
  core/tutorial-config.ts kiểm tra 03-Data/tutorial.json (tín hiệu hợp lệ, after, lời thoại ≤ maxTextChars)
  core/ui-config.ts       kiểm tra 03-Data/ui.json (hộp hội thoại, màn Kết quả)
  core/dialogue-config.ts kiểm tra 03-Data/dialogue_wardens.json (khóa, biến thể nối liền từ 0, độ dài câu, vi/en khớp)
  logic/dialogue/         chọn thoại Warden theo số boss đã hạ trước trận; DialogueRunner (chữ hiện dần, Tiếp,
                          Bỏ qua, bỏ phím bấm dồn lúc mở) (thuần)
  logic/result/           mô hình màn Kết quả (thời gian, chết, EXP và lên cấp, Core Bit, vũ khí mới, SP, bí mật) (thuần)
  logic/rpg/              M8: cấp từ EXP, SP, đồng bộ cấp theo màn, chỉ số theo cấp, LevelTracker; cây kỹ năng, build, BuildRuntime
                          (học, đặt lại), build (computeBuild, applyBuild, statsFor), chuẩn hóa build theo dữ liệu,
                          mô hình Xưởng (thuần)
  core/skills-config.ts   kiểm tra 03-Data/skills.json (hiệu ứng, khoảng, luật bậc); core/shop-config.ts: shop.json
                          (Upgrade, lịch mở theo boss, Booster) và economy.incomeFormula
  workshop/               bảng HTML Xưởng tab Kỹ năng (ADR-001)
  logic/shop/             M9: giá Upgrade theo cấp, cấp mở theo số boss chiến dịch, mua/gỡ, chuẩn hóa cấp trong
                          bản lưu, mô hình Quầy Mira (thuần)
  shop/                   bảng HTML Quầy Mira tab Upgrade (ADR-001)
  logic/difficulty/       độ khó (01-GDD/11-Do-kho.md): mở Thử thách theo màn, độ khó mặc định, làm tròn thưởng,
                          checkpoint theo độ khó, câu gợi ý NOVA, mô hình màn Chuẩn bị, chuẩn hóa bản lưu (thuần)
  prep/                   bảng HTML màn Chuẩn bị (chọn độ khó; ADR-001)
  core/deep-merge.ts      ghép khối `challenge` (bản Thử thách) lên dữ liệu gốc
  logic/save/             M11: SaveData (tiến trình, nhân vật, kho; hỏng từng phần về mặc định), mã sao lưu
                          có checksum, SaveManager (ghi theo thứ tự, revision, giao dịch `transact` chờ ghi và
                          hoàn tác khi lỗi), StageSave nối màn với bản lưu (thuần)
  save/                   kho IndexedDB (dự phòng localStorage), bảng HTML "Dữ liệu lưu"
  playtest/               bảng HTML: phiếu chấm 1–5, bảng chỉnh cảm giác, kết quả, xuất JSON
  debug/flags.ts          cờ DEBUG (?debug=1) và TUNE (?tune=1), bản dev luôn bật; GATE (?gate=1), SHOP (?shop=1), TELEMETRY_DEBUG (?telemetry=1), STAFF
maps/                     bản đồ Tiled JSON + tileset xám; maps/src/ là bản phác ASCII; README quy ước
tests/                    Vitest cho phần thuần, đọc thẳng 03-Data
scripts/sync-data.mjs     chép dữ liệu 03-Data → public/data
scripts/ascii-to-tiled.mjs  dựng bản đồ Tiled JSON từ bản phác ASCII (bản đầu, rồi sửa bằng Tiled)
scripts/gate-check.mjs    đo cổng Prototype bằng Playwright: dung lượng, thời gian vào game, FPS khi
                          CPU chậm, độ trễ phím/chạm (xem 04-Dev-Plan/05-Cong-Prototype.md)
scripts/mvp-report.mjs    báo cáo cổng MVP từ lô đo lường (đọc file, ghi Markdown; tính ở core/mvp-report.ts)
```

## Quyết định đã chốt (theo module)

| File                                                     | Nội dung                                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `docs/quyet-dinh/nen-tang-dau-vao-nhan-vat-chien-dau.md` | Khung, scale, font, nút cảm ứng HTML, đổi phím, vật lý Kai, chiến đấu, hit-stop, phím Lên trùng Tương tác |
| `docs/quyet-dinh/ke-dich-boss.md`                        | Hành vi kẻ địch, boss theo danh sách pha, Thorna, Golem, cân bằng Thorna                                  |
| `docs/quyet-dinh/man-choi.md`                            | Hố, gai, checkpoint, dây leo, phòng khóa, vật chắn, bí mật, bản đồ ASCII, lỗi hồi sinh đã sửa             |
| `docs/quyet-dinh/giao-dien-huong-dan-hoi-thoai.md`       | HUD, menu tạm dừng, TutorialManager, hội thoại boss, màn Kết quả                                          |
| `docs/quyet-dinh/luu.md`                                 | IndexedDB, mã sao lưu, phiên bản bản lưu                                                                  |
| `docs/quyet-dinh/rpg-xuong.md`                           | Cấp, SP, cây kỹ năng, build, Phantom, Vanguard, Core, trần sức mạnh, Xưởng                                |
| `docs/quyet-dinh/shop.md`                                | Quầy Mira, giá, lịch mở, tác dụng Upgrade, giao dịch                                                      |
| `docs/quyet-dinh/do-kho.md`                              | Ba độ khó, màn Chuẩn bị, checkpoint theo độ khó, bản Thử thách                                            |
| `docs/quyet-dinh/cong-prototype.md`                      | Nhật ký chơi thử, Pages, bản `?gate=1`                                                                    |
| `docs/quyet-dinh/do-luong.md`                            | Đo lường MVP (M16): lược đồ, bộ đệm, lô, làm sạch lỗi, dấu vân tay dữ liệu, báo cáo cổng                  |

## Module và trạng thái

Mỗi module một dòng; chi tiết ở file quyết định và Epic.

- **M0 Dự án và công cụ:** Xong. dev/build/test/lint/format, alias `@/`, CI (lint, format, typecheck, test, build), Pages tự đăng khi `main` đổi.
- **M1 Khung game:** Xong phần khung. Scale nguyên, nhắc xoay ngang, nạp + kiểm tra JSON, event bus; 60 FPS ở CPU chậm 4–6× (`gate-check`). Còn: nạp atlas khi có asset; đo trên điện thoại thật.
- **M2 Đầu vào:** Xong. Vùng an toàn tai thỏ cho nút cảm ứng, canvas, bảng HTML (ST-11-01, QB-92). Bàn phím, tay cầm, cảm ứng (cần ảo, 6 nút, đa chạm, rung), đổi phím, chỉnh bố cục, tự bắn, hỗ trợ ngắm. Còn: thử tay cầm thật.
- **M3 Nhân vật:** Xong logic. Chạy, nhảy biến thiên, coyote, buffer, lướt, dash-jump, bám/nhảy tường, bục một chiều, bị đánh, chết, rơi hố. Còn: sprite, hoạt ảnh (asset P0); leo thang (đặc tả 02 đoạn A, B).
- **M4 Chiến đấu:** Arc Cannon, Vine Lash, Prism Beam, Frost Shard (QB-19), Gale Cutter (Q4). Còn: Lumen, Cryo, Aeris cấp vũ khí.
- **M5 Kẻ địch:** Prologue, Stage 1 và bốn địch ST-15-06 đã chạy. QB-17, 20, 21, 23 đã áp dụng. Còn: địch Stage 2/4, sprite.
- **M6 Boss:** Boss xám, Thorna, Bramble Golem, Prism Sentinel và Gale Roc. Hai mini-boss bay dùng `Boss` trong phòng khóa (Q1). QB-14/21/23/24/30/31 đã có. Còn Lumen, Cryo, Aeris, lực gió Vỗ Cánh và bản đồ chiến dịch.
- **M7 Màn chơi:** Tiled, checkpoint, hố, gai, dây leo, cửa và bí mật. Phòng thử laser, băng, Gale Cutter và bục băng/mây (ST-15-08a). Nano Cell (QB-50…54) dùng H/RT, đọc bí mật theo màn từ bản lưu. Còn: bản đồ chiến dịch, sàn trơn/gió, thang, parallax.
- **M8 Hệ thống RPG:** Xong cấp, SP, cây kỹ năng 3 × 3 có hiệu ứng trong trận, Xưởng tab Kỹ năng, trần sức mạnh. Còn: Module, Két giáp (ST-08-09, bị chặn), âm thanh kỹ năng, loadout (Alpha).
- **M9 Kinh tế và Shop:** Xong bản MVP chỉ Upgrade (Quầy Mira, giao dịch nguyên tử, hoàn số đã trả, gợi ý thu nhập, Nano Cell Cap). Còn: Booster, Skin, Premium (Alpha).
- **M10 Giao diện:** Xong HUD, menu tạm dừng, hội thoại boss, màn Kết quả, Xưởng, Quầy, màn Chuẩn bị; hộp chữ thuần (QB-70…72, ST-14-08: hiện lại, hủy, đồng hồ trận). Còn (EP-14): Hub dạng menu MVP, Cài đặt (`14-Cai-dat-Tiep-can.md`), chữ ≥ 16 sp và nút ≥ 48 dp, safe-area, tự tạm dừng, báo lỗi lưu, nút Nano Cell, bỏ qua thoại giữ 0,6 s, i18n; ChoicePanel, thoại NPC, bản đồ nhỏ (Alpha).
- **TUT Hướng dẫn:** Khung xong, 11 bước Stage 1. Còn: Prologue (sau cổng), giai đoạn Hub (R01–R06), gợi ý bậc 3–4.
- **ĐK Ba độ khó:** Xong cho Stage 1 (EP-10). Còn: checkpoint theo độ khó trên bản đồ thật, chốt số mẫu đòn (sau cổng), Stage 2–4.
- **M11 Lưu:** Xong lưu cục bộ, bản lưu 4, mã sao lưu. Còn: cloud (Beta).
- **M12 Âm thanh:** Chưa làm; tài liệu Draft (`01-GDD/12-Am-thanh.md`); EP-12 làm được ngay.
- **M16 Đo lường MVP:** xong lõi (ST-13-01), nối vào game (ST-13-02a/b: nguồn đòn, sát thương boss theo vũ khí, `StageTracker`, sự kiện meta; tạm bật `?debug=1&telemetry=1`, chỉ bộ nhớ), báo cáo cổng đủ chỉ số (ST-13-05a/b, `npm run mvp-report`). Còn: `?mvp=`, kho, mã lỗi lưu, QB-154 (ST-13-03), gửi (ST-13-04, chờ ADR-002). Bản thường không ghi gì.
- **M13–M15, M17, M18:** Chưa làm (sau cổng MVP).
- **Cổng Prototype:** Công cụ xong (`?gate=1`, `gate-check`, `gate-flow`). Còn: chơi thử 5 người thật.

## Lệnh

Chạy trong `game/`.

```
npm install           # lần đầu
npm run dev           # chạy thử ở http://localhost:5173 (tự chạy sync-data)
npm run sync-data     # chép 03-Data/*.json sang public/data
npm test              # Vitest (logic thuần)
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run format:check  # Prettier (kiểm); npm run format để sửa
npm run build         # typecheck + bản build trong dist/ (tự chạy sync-data)
npm run gate-check    # đo cổng Prototype trên bản build (Playwright + Chromium)
npm run gate-flow     # chạy thử trọn luồng người thử ?gate=1 (máy tính + Pixel 7)
npm run mvp-report -- --day0 2026-11-20 --wave d1 <file.json>...   # báo cáo cổng MVP (GDD 13 mục 7.3)
node scripts/demo25d-video.mjs <thư mục> 24 30   # quay video demo 2.5D từng khung (cần npm run build; mở demo: /demo-25d.html)
npm run docs-check    # kiểm nhật ký ≤ 3 mục, ngân sách file đầu phiên, đường dẫn trong file chỉ mục (CI)
```

Kiểm tra trước commit: `npm test && npm run lint && npm run format:check && npm run build`.

Cờ địa chỉ (bản build cần `?debug=1` cho các cờ chạy thử): `?debug=1` (gắn `window.__cvGame`, `__cvWorld`), `?tune=1` (bảng chỉnh cảm giác), `?gate=1` (bản người thử), `?shop=1` (mở Quầy khi chưa đủ boss), `?unlock=1` (mở mọi độ khó), `?telemetry=1` (đo lường trong bộ nhớ, đọc `window.__cvTelemetry`), `?staff=1` (đánh dấu người làm game).
