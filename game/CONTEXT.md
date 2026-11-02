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
  stages/gray-box.ts      màn xám Prototype (ASCII); bản đồ Tiled thật thuộc M7
  scenes/                 Boot → Preload → Menu, Hub, Stage, Controls
tests/                    Vitest cho phần thuần, đọc thẳng 03-Data
scripts/sync-data.mjs     chép dữ liệu 03-Data → public/data
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
- Phím T (chỉ bản dev) gây 10 sát thương thử để xem bật lùi và bất tử.

## Module và trạng thái

| ID     | Module           | Trạng thái                                                                                                                                                                                                                                                                                                                                              |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0     | Dự án và công cụ | **Xong** (Sprint 1): dev/build/test/lint/format, alias `@/`, CI GitHub Actions                                                                                                                                                                                                                                                                          |
| M1     | Khung game       | **Xong phần khung** (Sprint 1): Boot/Preload/Menu/Hub/Stage, scale nguyên, nhắc xoay ngang, nạp + kiểm tra JSON, event bus. Còn chờ: nạp atlas khi có asset; đo 60 FPS trên điện thoại tầm trung thật                                                                                                                                                   |
| M2     | Đầu vào          | **Xong** (Sprint 2): bàn phím, tay cầm, cảm ứng (cần ảo nổi/cố định, 6 nút, đa chạm, rung), đổi phím/nút có hoán đổi, chỉnh bố cục kéo thả + cỡ/độ trong suốt/thuận tay trái, lưu cài đặt, biểu tượng nút theo thiết bị. Tự bắn và hỗ trợ ngắm mới lưu cài đặt, có tác dụng từ M4. Chưa làm: vuốt vào biểu tượng vũ khí để đổi (GDD 5.2, cần HUD ở M10) |
| M3     | Nhân vật         | **Xong** (Sprint 3): chạy, nhảy biến thiên, coyote 0,1 s, jump buffer 0,12 s, lướt 3 ô/0,25 s (hồi 0,6 s, bất tử 0,1 s), dash-jump, bám và nhảy tường, bục một chiều (xuống + nhảy để xuyên), bị đánh (bật lùi, bất tử 1 s), chết, rơi hố, hồi sinh; màn xám thử cảm giác. Chưa: sprite và hoạt ảnh (chờ asset nhóm P0)                                 |
| M4–M18 |                  | Chưa làm                                                                                                                                                                                                                                                                                                                                                |

## Lệnh

```
npm install        # lần đầu
npm run dev        # chạy thử ở http://localhost:5173
npm test           # test logic thuần
npm run lint       # ESLint
npm run build      # typecheck + bản build trong dist/
```
