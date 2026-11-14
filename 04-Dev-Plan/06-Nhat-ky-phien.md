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
