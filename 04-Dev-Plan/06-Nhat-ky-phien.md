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

## 2026-11-13 (tiếp 6): Sửa lỗi hướng dẫn S10 hiện ngay đầu màn

- **Nhánh / commit:** `claude/peaceful-mccarthy-13m5ah` (dựng trên `ccr-0afa36c6-vbizeu`, vì `main` chưa có R01, S13 mới và `npm run smoke`).
- **Mục tiêu:** thẻ việc của người dùng: bước có `trigger.after` (S10) hiện ngay đầu màn khi bước đứng trước (S09) đã xong từ bản lưu.
- **Đã làm:** `TutorialManager` giữ thêm tập `doneThisRun` (bước xong trong lượt này, kể cả do `skipIfDone`/`cancelOn`); `trigger.after` xét theo tập này thay cho tập gồm cả bản lưu. Thêm 3 test, sửa 1 test cũ đang khẳng định hành vi lỗi.
- **File chính:** `game/src/logic/tutorial/tutorial-manager.ts`, `game/tests/tutorial.test.ts`, `game/src/core/tutorial-config.ts` (chú thích), `game/CONTEXT.md`.
- **Quyết định:** "lượt" = một lần tạo `TutorialManager` (một lần vào màn). Hệ quả chấp nhận: thoát giữa trận Thorna rồi đánh lại thì lượt đó không nhắc lại S09/S10 (S08 đã lưu nên chuỗi không khởi động lại). S13 (`on: weaponGranted`) và R01 (`on: start`) không có `after` nên không bị ảnh hưởng. Không đổi dữ liệu `tutorial.json`.
- **Lỗi tìm thấy / đã sửa:** lỗi S10 nói trên (đã sửa). Không tìm thấy lỗi mới.
- **Kiểm tra:** test mới thất bại trên mã cũ (S10 bắt đầu ngay bước đầu), đạt sau khi sửa. `npm test` 308 test, lint, format:check, build đều đạt; `npm run smoke` 10/10.
- **Còn dở:** nếu muốn S09/S10 hiện lại khi đánh lại boss sau khi thoát giữa trận, cần đổi dữ liệu (ví dụ S10 `on: bossPhase`, hoặc không lưu S08–S10 cho tới khi hạ boss); chưa làm, chờ ý người dùng.
- **Tiếp theo:** như mục trước: `08-Viec-cho-nguoi-dung.md` (duyệt đồ họa, merge, thử điện thoại thật, chơi thử 5 người); Claude tự làm được: đổi giao diện các màn còn lại, màn Cài đặt.

## 2026-11-13 (tiếp 5): Đồ họa đợt 3, đòn của boss và giao diện

- **Nhánh / commit:** `ccr-0afa36c6-vbizeu`.
- **Mục tiêu:** người dùng giao làm tiếp phần giao diện và hình cho đòn của boss.
- **Đã làm:** thêm 11 spritesheet + 4 ảnh (tổng 55 + 12): sóng chấn động, đạn rơi, hạt Hoa Nở, hạt nổ, đốt Rễ Trồi, đốt Dây Quất, roi Vine Lash, bí mật, bia tập bắn; logo, nền màn hình chính, khung HUD, khung máu boss, khung 9 mảnh, biểu tượng. Trong game: mọi loại đạn/đòn vẽ bằng hình (dải dài ghép từ đốt 16 px theo hộp trong dữ liệu); `NinePanel` cho hộp thoại, hộp hướng dẫn, tạm dừng, Kết quả; HUD có khung, số máu nằm trong thanh; màn hình chính có nền + logo; nút cảm ứng tô theo bảng màu.
- **File chính:** `05-Assets/tools/codeart/fx.py`, `ui.py`, `build.py`; `game/src/scenes/ui.ts` (`NinePanel`), `stage/stage-art.ts`, `stage/stage-renderer.ts`, `stage/mechanics-renderer.ts`, `stage/stage-hud.ts`, `stage/dialogue-box.ts`, `stage/tutorial-box.ts`, `stage/pause-menu.ts`, `result-scene.ts`, `menu-scene.ts`, `style.css`, `core/art-manifest.ts`, `tests/art.test.ts`.
- **Quyết định:** khung 9 mảnh tự ghép từ 9 hình thay vì `NineSlice` của Phaser (chỉ chạy trên WebGL). Thanh máu boss lệch phải (tâm x = 176) để không đè khung máu người chơi. Chữ vẫn dùng phông hệ thống (phông bitmap đủ dấu tiếng Việt là việc lớn, để sau).
- **Lỗi tìm thấy / đã sửa:** logo bị cắt hàng dưới (khung vẽ thấp hơn chữ); số máu và tên boss đè nhau; biểu tượng Core Bit đè số. **Tìm thấy, chưa sửa:** bước hướng dẫn có `after` (S10) hiện ngay đầu màn nếu bước trước đã xong ở lần chơi trước; đã tạo thẻ việc riêng cho người dùng.
- **Kiểm tra:** `npm test` 305 test, lint, format:check, build đều đạt; `npm run smoke` 10/10; `gate-check` đạt (60 FPS ở CPU chậm 6×, tải đầu 1,56 MB). Chromium, chụp đúng lúc có đòn: Gai Quạt, Dây Quất, Rễ Trồi, Hoa Nở, roi Vine Lash, hộp thoại, tạm dừng, màn hình chính đều hiện đúng, không lỗi console. Chưa chụp: đòn của Golem và boss xám (dùng chung hình sóng, hạt nổ, đạn rơi), màn Kết quả với khung mới, giao diện trên giả lập điện thoại. Chưa xem trên điện thoại thật.
- **Còn dở:** phông bitmap; hình riêng cho nút cảm ứng; các màn Điều khiển, Dữ liệu lưu, Hub, công cụ chơi thử chưa đổi giao diện; chỉ dẫn vị trí đòn boss và sợi dây leo vẫn vẽ bằng nét; `manifest.csv` chưa cập nhật.
- **Tiếp theo:** xem `08-Viec-cho-nguoi-dung.md` (duyệt hướng đồ họa, merge, thử điện thoại thật, chơi thử 5 người). Claude tự làm được: đổi giao diện các màn còn lại, màn Cài đặt, sửa lỗi hướng dẫn S10.

## 2026-11-13 (tiếp 4): Đồ họa vẽ bằng mã

- **Nhánh / commit:** `ccr-0afa36c6-vbizeu`.
- **Mục tiêu:** người dùng giao làm phần đồ họa (UI, asset, animation, VFX), hiện chưa có gì.
- **Đã làm:** công cụ vẽ pixel bằng Python (`05-Assets/tools/codeart/`: `pix.py`, `kai.py`, `actors.py`, `tiles.py`, `bg.py`, `fx.py`, `ui.py`, `build.py`) sinh 44 spritesheet + 8 ảnh: Kai 11 hoạt ảnh, 5 kẻ địch, Golem, boss xám, Thorna, 2 tileset tự ghép viền, 4 lớp nền, đạn và hiệu ứng, 4 chân dung. Trong game: nạp `assets.json`, lớp ô Tilemap, nền parallax, `KaiView`, `SpritePool`, `FxLayer`; thay gần hết khối chữ nhật bằng hình.
- **File chính:** `05-Assets/tools/codeart/*`, `05-Assets/03-Do-hoa-ve-bang-ma.md`, `game/public/assets/**`, `game/src/core/art-manifest.ts`, `game/src/scenes/stage/stage-art.ts`, `stage-renderer.ts`, `mechanics-renderer.ts`, `dialogue-box.ts`, `stage-scene.ts`, `preload-scene.ts`, `game/src/stages/*` (thêm `theme`), `game/tests/art.test.ts`; xóa `enemy-renderer.ts`.
- **Quyết định:** không có công cụ sinh ảnh nên vẽ bằng mã, ghi rõ nguồn; file đặt đúng chỗ để sau này đè hình khác. Kai cao 28 px (không phải 40) để vừa hộp va chạm. Màn xám dùng tileset xám `lab`, phòng thử Stage 1 dùng `verdant`. Kẻ địch không có dải `hit` (nháy trắng bằng mã).
- **Lỗi tìm thấy / đã sửa:** không có lỗi game.
- **Kiểm tra:** `npm test` 305 test (thêm 4 ở `art.test.ts`), lint, format:check, build đều đạt; `npm run smoke` 10/10. Chromium: 4 phòng (kẻ địch, Thorna, Golem, màn xám) hiện đúng hình, không lỗi console. `gate-check` sau khi thêm hình: mọi hạng mục đạt (60 FPS ở CPU chậm 6×, tải đầu 1,55 MB). Chưa xem trên điện thoại thật.
- **Còn dở:** vẫn là khối màu: đạn/đòn của boss, roi Vine Lash, dây leo đu, bí mật, bia tập bắn; giao diện (HUD, panel, nút cảm ứng, phông, logo, nền menu) chưa có hình; `manifest.csv` chưa cập nhật theo bộ hình mới.
- **Tiếp theo:** đợt đồ họa 3: hình cho đòn của Thorna/Golem và Vine Lash, dây leo, bí mật; rồi giao diện (khung HUD, panel, nút, màn hình chính). Người dùng: xem và cho ý về hướng đồ họa (`08-Viec-cho-nguoi-dung.md` mục 6).
