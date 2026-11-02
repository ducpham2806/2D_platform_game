# CONTEXT: Cyber Vanguard (mã nguồn game)

Tóm tắt để dán vào đầu mỗi phiên làm việc mới (theo `04-Dev-Plan/01-Ke-hoach-lam-viec.md`). Cập nhật sau mỗi sprint.

## Kiến trúc

- **Công nghệ:** Phaser 3.90 + TypeScript 5.9 (strict, không `any`) + Vite 8; test Vitest 5; ESLint 10 + Prettier.
- **Độ phân giải logic:** 320 × 192 (20 × 12 ô, ô 16 px). Phóng to theo hệ số **nguyên** lớn nhất vừa màn hình, dư thì viền đen, `pixelArt: true`. Cầm dọc thì che game và nhắc xoay ngang.
- **Vòng lặp:** logic chạy theo bước cố định 60 Hz (`src/logic/fixed-step.ts`), tách khỏi FPS.
- **Dữ liệu:** nguồn duy nhất là `../03-Data/*.json`. `npm run sync-data` (tự chạy trước `dev`/`build`) chép sang `public/data/` (bị gitignore). Không sửa tay `public/data/`, không viết cứng chỉ số trong mã.
- **Kiểm tra dữ liệu:** `src/core/game-config.ts` kiểm tra kiểu từng file bắt buộc và các bất biến thiết kế giữa nhiều file (vòng khắc chế, Két giáp, cấp khuyến nghị, weapons khớp stages, hệ số thưởng khớp độ khó). Dữ liệu sai thì game dừng ở màn tải với thông báo lỗi, và test/CI báo đỏ.
- **Giao tiếp giữa module:** event bus có kiểu (`src/core/event-bus.ts`, danh sách sự kiện ở `src/core/game-events.ts`), không gọi chéo trực tiếp.
- **Logic thuần:** `src/logic/` và `src/core/` không import Phaser (ESLint chặn), trừ các file `src/core/phaser-*.ts`. Test chạy trên Node, không cần trình duyệt.
- **Thế giới màn chơi (M4):** `src/logic/world/stage-world.ts` gom Kai, vũ khí, đạn, bia, boss, cửa phòng boss, hồi sinh và hit-stop thành một bước logic thuần `world.step(WorldInput)` trả về `WorldEvents`. Scene chỉ đổi `InputSnapshot` → `WorldInput`, vẽ trạng thái và tạo hiệu ứng theo sự kiện. Nhờ vậy test mô phỏng được cả trận đánh boss.
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
  logic/tilemap.ts        lưới ô va chạm ('#' đặc, '=' bục một chiều, 'P' điểm xuất phát) (thuần)
  logic/player/           vật lý + máy trạng thái của Kai, va chạm AABB trên lưới ô (thuần)
  logic/combat/           sát thương, đạn (pool), bộ vũ khí (Arc Cannon 3 mức nạp, vũ khí boss
                          theo dữ liệu, năng lượng 28), bia tập bắn (thuần)
  logic/boss/             boss theo dữ liệu (máy trạng thái 3 pha), chọn khe né Mưa đạn (thuần)
  logic/enemy/            kẻ địch thường (M5): lớp chung + Drone, Tháp pháo, Bướm Sắt, Lính Kén (thuần)
  logic/world/            StageWorld: ghép mọi thứ thành một bước logic; xử lý trúng đòn; EnemyField
                          (kẻ địch của màn, tầm hoạt động, EXP); vật phẩm rơi Core Bit/máu (thuần)
  logic/formula.ts        tính công thức trong dữ liệu ("100+4*(L-1)") không dùng eval (thuần)
  logic/rng.ts            ngẫu nhiên có hạt giống (test lặp lại được)
  core/*-config.ts        kiểm tra từng file dữ liệu: player, weapons, bosses, enemies, controls (thuần)
  logic/playtest/         nhật ký chơi thử, tổng hợp theo ngưỡng "hỏng" GDD 17, xuất/gộp JSON,
                          danh sách thông số của bảng chỉnh cảm giác (thuần)
  stages/                 màn dựng bằng ASCII theo StageDef: màn xám Prototype, phòng thử kẻ địch;
                          bản đồ Tiled thật thuộc M7
  scenes/                 Boot → Preload → Menu, Hub, Stage, Controls, Playtest (kết quả chơi thử)
  scenes/stage/           vẽ màn chơi (renderer, kẻ địch, vật phẩm), HUD (máu, năng lượng, vũ khí,
                          máu boss, Core Bit/EXP),
                          gắn công cụ chơi thử vào màn (stage-playtest.ts)
  playtest/               bảng HTML: phiếu chấm 1–5, bảng chỉnh cảm giác, kết quả, xuất JSON
  debug/flags.ts          cờ DEBUG (?debug=1) và TUNE (?tune=1); bản dev luôn bật
tests/                    Vitest cho phần thuần, đọc thẳng 03-Data
scripts/sync-data.mjs     chép dữ liệu 03-Data → public/data
scripts/gate-check.mjs    đo cổng Prototype bằng Playwright: dung lượng, thời gian vào game, FPS khi
                          CPU chậm, độ trễ phím/chạm (xem 04-Dev-Plan/05-Cong-Prototype.md)
```

## Quyết định đã chốt

- Thư mục mã nguồn là `game/` (script `05-Assets/tools/validate_assets.py` mặc định trỏ `game/public/assets`).
- Scale tự tính (`Phaser.Scale.NONE` + `setZoom` nguyên) thay vì `Scale.FIT` (FIT cho hệ số lẻ, làm mờ pixel).
- Font tạm là font hệ thống sans-serif (đủ dấu tiếng Việt; font monospace trên một số máy thiếu glyph như "ử"); thay bằng bitmap font khi có asset.
- `minimatch` được ghim ≥ 11.0.1 qua `overrides` để vá lỗ hổng trong chuỗi ESLint (`npm audit`: 0 lỗ hổng).
- **Nút cảm ứng là lớp HTML phủ toàn màn hình**, không vẽ trong canvas: dùng được cả vùng viền đen, kích thước tính bằng px CSS = dp nên bảo đảm ≥ 48 dp, đa chạm bằng Pointer Events. Lớp chỉ hiện khi đang chơi và thiết bị dùng gần nhất là cảm ứng. Khi mở bảng HTML đè lên một màn Phaser có nút, tắt `scene.input.enabled` (Phaser nghe sự kiện thả trên cả cửa sổ nên cú bấm có thể xuyên xuống).
- Màn có đổi phím đọc `keydown` thẳng từ `window` (không qua hàng đợi phím của Phaser) để thứ tự sự kiện khớp với lớp bắt phím của InputService.
- Phím tương tác là **W / ↑** (E dành cho đổi vũ khí theo GDD 5.2); W/↑ được phép dùng chung giữa "lên" và "tương tác". Đổi phím sang phím đang thuộc hành động khác thì hoán đổi, không để hành động bắt buộc trống.
- Cài đặt điều khiển lưu ở `localStorage` (khóa `cv.controls`, có số phiên bản; hỏng từng phần thì phần đó về mặc định). Khi làm M11 (lưu game) sẽ chuyển vào hệ thống lưu chung và cloud.
- Hai nút đổi vũ khí trên wireframe LayoutEdit chỉ 44 px; dữ liệu nâng lên 48 dp theo GDD.
- **Vật lý Kai (M3):** trọng lực và vận tốc nhảy suy ra từ `jump.maxTiles` và `jump.apexSec`, nên độ cao nhảy luôn đúng GDD 5.1 khi chỉnh cảm giác; rơi nặng hơn lên (`fallGravityMul`). Vị trí dời theo vận tốc trung bình của bước để quỹ đạo khớp công thức. Coyote trừ giờ _sau_ khi xét nhảy (đủ 6 bước = 0,1 s). Đồng hồ còn dưới 1 µs coi như hết (tránh sai số dấu phẩy động). Va chạm trục X rồi Y, chia quãng đi tối đa nửa ô mỗi lần nên không xuyên tường. Ngoài cạnh trái/phải bản đồ là tường, dưới đáy là hố.
- Lướt trên không tắt mặc định (`abilities.airDash`), vì GDD 6.2 xếp nó vào nhánh Phantom. Nhảy khi đang lướt giữ tốc độ lướt trên không tới khi đáp (dash-jump). Nhảy tường khóa điều khiển ngang `wallJump.lockSec` để không dính lại tường.
- Phím T gây 10 sát thương thử để xem bật lùi và bất tử; `window.__cvGame`/`__cvWorld` để thử và đo bằng trình duyệt. Cả hai chỉ có ở bản dev hoặc khi mở bằng `?debug=1` (bản build trên Pages).
- **Cổng Prototype:** mỗi lần vào màn thử là một phiên nhật ký (thời gian theo thiết bị, chết theo đoạn, lượt đánh và thời gian thắng boss, điểm 1–5) lưu ở `localStorage` `cv.playtest` (tối đa 200 phiên, phiên < 10 s không lưu). Không gửi đi đâu: người thử sao chép JSON và gửi tay; người tổng hợp gộp ở màn Kết quả chơi thử. Bảng chỉnh cảm giác (`?tune=1`, F2) đổi thông số ngay qua `world.retune()`, lưu phần đã đổi ở `cv.tuning` và chỉ áp khi bật `?tune=1`. Khi bảng HTML mở thì trận dừng hẳn (không bù bước khi đóng), lớp cảm ứng ẩn, phím bấm trong bảng không lọt vào game (`KeyboardSource` bỏ qua phím có đích nằm trong `.cv-panel`).
- Bản web đăng lên GitHub Pages bằng `.github/workflows/pages.yml` mỗi khi `main` đổi (đường dẫn tương đối `base: './'` nên chạy được ở thư mục con của Pages).
- **Chiến đấu (M4):** sát thương gây ra tính bằng "phát Arc Cannon gốc" (= 1), máu kẻ địch/boss cùng đơn vị; sát thương nhận vào tính bằng máu người chơi, nhân `damageTaken` của độ khó, làm tròn, tối thiểu 1. Hệ số công = công(cấp)/công(cấp 1) tính bằng công thức trong `player.json`. Điểm yếu (×2,5, choáng 0,5 s) lấy từ chính vũ khí đang bắn. Mỗi viên chỉ trúng một mục tiêu một lần; đạn nạp đầy xuyên 1 mục tiêu; roi Vine Lash trúng mọi mục tiêu trong tầm một lần.
- Đạn nạp (vừa/đầy) luôn bắn được khi thả nút, không tính vào giới hạn 3 đạn thường. Bị trúng đòn khi đang nạp thì mất hết (GDD 5.1). Tự bắn và hỗ trợ ngắm chỉ có tác dụng khi thiết bị gần nhất là cảm ứng.
- Hit-stop 3 bước khi trúng bằng đạn nạp đầy hoặc trúng điểm yếu (`weapons.json` `hitStopSteps`), làm ở StageWorld nên mọi thứ cùng dừng.
- **Boss:** đòn lặp theo danh sách của pha (dễ học, không ngẫu nhiên), trừ vị trí khe né Mưa đạn (ngẫu nhiên có hạt giống). Telegraph sau khi chia `speedMul` không ngắn hơn `minTelegraphSec`; dữ liệu boss vi phạm GDD 9 (telegraph ngắn, đòn chết ngay) bị chặn ngay lúc nạp. Chết trong phòng boss thì hồi sinh trong phòng, boss đầy máu lại. Boss xám máu 100 như Thorna; bắn liên tục không né mất khoảng 23 giây (test mô phỏng).
- **Kẻ địch thường (M5):** dữ liệu ở `03-Data/enemies.json`, mỗi loại một `behavior` (`drone`, `turret`, `butterfly`, `shieldCharger`); Tháp Pháo Tập Sự và Tháp Gai cùng hành vi `turret`, khác số viên và góc xòe. Lúc nạp, game chặn telegraph < 0,4 s, telegraph dài hơn nhịp bắn, đòn chết ngay, và màn đã làm (Stage 1) thiếu dữ liệu kẻ địch. Test chặn kẻ địch đặt gần điểm xuất phát/checkpoint dưới 6 ô. Kẻ địch chỉ chạy khi người chơi trong `activeRangeTiles` (12 ô ngang); người chơi hồi sinh thì mọi kẻ địch dựng lại, Core Bit và EXP giữ nguyên. Máu nhân `enemyHp` của độ khó. Cờ `harmless` trên bản đồ (Prologue nhịp 1–3) làm đạn và thân gây 0 máu nhưng vẫn đẩy lùi. Core Bit là vật phẩm phải nhặt; EXP cộng ngay. Hạt giống ngẫu nhiên của rơi đồ tách khỏi của boss để thêm kẻ địch không đổi khe né Mưa đạn.
- Bản đồ ASCII: mọi chữ hoa là ký hiệu đặt đối tượng; `StageDef.enemyMarkers` của từng màn quy định chữ nào là kẻ địch nào. Màn chọn bằng `scene.start(SceneKey.Stage, { stage })`; chỉ màn xám ghi nhật ký chơi thử.

## Module và trạng thái

| ID     | Module           | Trạng thái                                                                                                                                                                                                                                                                                                                             |
| ------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0     | Dự án và công cụ | **Xong** (Sprint 1): dev/build/test/lint/format, alias `@/`, CI GitHub Actions                                                                                                                                                                                                                                                         |
| M1     | Khung game       | **Xong phần khung** (Sprint 1): Boot/Preload/Menu/Hub/Stage, scale nguyên, nhắc xoay ngang, nạp + kiểm tra JSON, event bus. Đo tự động: 60 FPS khi CPU chậm 4–6× (`npm run gate-check`). Còn chờ: nạp atlas khi có asset; xác nhận 60 FPS trên điện thoại thật                                                                         |
| M2     | Đầu vào          | **Xong** (Sprint 2): bàn phím, tay cầm, cảm ứng (cần ảo nổi/cố định, 6 nút, đa chạm, rung), đổi phím/nút có hoán đổi, chỉnh bố cục kéo thả + cỡ/độ trong suốt/thuận tay trái, lưu cài đặt, biểu tượng nút theo thiết bị. Tự bắn và hỗ trợ ngắm có tác dụng từ M4. Chưa làm: vuốt vào biểu tượng vũ khí để đổi (GDD 5.2, cần HUD ở M10) |
| M3     | Nhân vật         | **Xong** (Sprint 3): chạy, nhảy biến thiên, coyote 0,1 s, jump buffer 0,12 s, lướt 3 ô/0,25 s (hồi 0,6 s, bất tử 0,1 s), dash-jump, bám và nhảy tường, bục một chiều (xuống + nhảy để xuyên), bị đánh (bật lùi, bất tử 1 s), chết, rơi hố, hồi sinh; màn xám thử cảm giác. Chưa: sprite và hoạt ảnh (chờ asset nhóm P0)                |
| M4     | Chiến đấu        | **Xong** (Sprint 4): Arc Cannon tối đa 3 đạn, 3 mức nạp, bị trúng mất nạp, giữ nạp 2 s khi đổi vũ khí, tự bắn, hỗ trợ ngắm nhẹ; sát thương, điểm yếu, choáng, độ khó; vũ khí boss theo dữ liệu với năng lượng 28 và tự hồi (Vine Lash làm thật); hit-stop                                                                              |
| M6     | Boss             | **Khung xong** (Sprint 4): boss xám theo dữ liệu, 3 pha, 4 đòn (bắn thẳng, lao ngang, nhảy đập + sóng đất, mưa đạn có khe né rồi choáng), phòng boss khóa cửa, thưởng vũ khí, đấu lại. Còn: Thorna thật theo đặc tả Stage 1 (Vertical slice)                                                                                           |
| Cổng   | Cổng Prototype   | **Công cụ xong**: bản web trên Pages, nhật ký + phiếu chấm + màn Kết quả, bảng chỉnh cảm giác, đo tự động đạt mọi ngưỡng. Còn: chơi thử với 5 người thật (`04-Dev-Plan/05-Cong-Prototype.md`)                                                                                                                                          |
| M5     | Kẻ địch          | **Xong** (Sprint 5): 5 loại thường của Prologue và Stage 1 (Drone Lính và bản Prologue vô hại, Tháp Pháo Tập Sự, Bướm Sắt, Tháp Gai, Lính Kén có khiên) theo dữ liệu, telegraph ≥ 0,4 s, tầm hoạt động, rơi Core Bit/viên máu, EXP; phòng thử kẻ địch. Chưa: sprite, mini-boss Bramble Golem (làm cùng M6)                             |
| M7–M18 |                  | Chưa làm (M6 Thorna + Bramble Golem, M7 màn chơi Tiled là phần tiếp của Vertical slice)                                                                                                                                                                                                                                                |

## Lệnh

```
npm install        # lần đầu
npm run dev        # chạy thử ở http://localhost:5173
npm test           # test logic thuần
npm run lint       # ESLint
npm run build      # typecheck + bản build trong dist/
npm run gate-check # đo cổng Prototype trên bản build (cần Playwright + Chromium)
```
