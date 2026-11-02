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
  scenes/                 Boot → Preload → Menu, Hub, Stage
tests/                    Vitest cho phần thuần, đọc thẳng 03-Data
scripts/sync-data.mjs     chép dữ liệu 03-Data → public/data
```

## Quyết định đã chốt

- Thư mục mã nguồn là `game/` (script `05-Assets/tools/validate_assets.py` mặc định trỏ `game/public/assets`).
- Scale tự tính (`Phaser.Scale.NONE` + `setZoom` nguyên) thay vì `Scale.FIT` (FIT cho hệ số lẻ, làm mờ pixel).
- Font tạm là font hệ thống sans-serif (đủ dấu tiếng Việt; font monospace trên một số máy thiếu glyph như "ử"); thay bằng bitmap font khi có asset.
- `minimatch` được ghim ≥ 11.0.1 qua `overrides` để vá lỗ hổng trong chuỗi ESLint (`npm audit`: 0 lỗ hổng).

## Module và trạng thái

| ID     | Module           | Trạng thái                                                                                                                                                                                            |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0     | Dự án và công cụ | **Xong** (Sprint 1): dev/build/test/lint/format, alias `@/`, CI GitHub Actions                                                                                                                        |
| M1     | Khung game       | **Xong phần khung** (Sprint 1): Boot/Preload/Menu/Hub/Stage, scale nguyên, nhắc xoay ngang, nạp + kiểm tra JSON, event bus. Còn chờ: nạp atlas khi có asset; đo 60 FPS trên điện thoại tầm trung thật |
| M2     | Đầu vào          | Chưa làm (Sprint 2–4). Stage hiện chỉ đọc phím ←/→, A/D trực tiếp để thử                                                                                                                              |
| M3–M18 |                  | Chưa làm                                                                                                                                                                                              |

## Lệnh

```
npm install        # lần đầu
npm run dev        # chạy thử ở http://localhost:5173
npm test           # test logic thuần
npm run lint       # ESLint
npm run build      # typecheck + bản build trong dist/
```
