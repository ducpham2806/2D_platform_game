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

## 2026-11-14: M9 Shop chỉ Upgrade (EP-09, Quầy Mira)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `8f5e0c2` (Epic + ST-09-01), `4bb7d80` (ST-09-02), `7d42fe6` (ST-09-03), `d4ee4f4` (ST-09-04), commit tài liệu.
- **Mục tiêu:** người dùng giao "làm tiếp game theo plan". Chơi thử cổng Prototype còn chờ người thật (PR #10 chưa merge), nên làm việc MVP kế tiếp không bị chặn: M9 Shop chỉ Upgrade.
- **Đã làm:**
  - Epic EP-09 + 4 Story; lấp 9 khoảng trống của đặc tả (mục "Khoảng trống" trong Epic).
  - **ST-09-01:** lịch mở theo boss trong `shop.json`, giá theo cấp, mua/gỡ thuần.
  - **ST-09-02:** bản lưu 3 (`inventory.upgrades`), chuẩn hóa, `SaveManager.transact`.
  - **ST-09-03:** Arc Core, Armor Plating, Energy Cell, Magnet Range có tác dụng trong trận.
  - **ST-09-04:** Quầy Mira (HTML) từ menu (phím Q, mở sau 2 boss), Mua → Xác nhận, Gỡ.
- **File chính:** `03-Data/{shop,enemies}.json`, `game/src/core/shop-config.ts`, `game/src/logic/shop/*`, `game/src/shop/shop-panel.ts`, `game/src/scenes/{shop,menu}-scene.ts`, `logic/save/save-{data,manager}.ts`, `logic/rpg/build.ts`, `logic/world/{pickups,stage-world}.ts`.
- **Quyết định (`[PLACEHOLDER]`, người dùng có thể đổi):** cấp 3 mở sau 5 boss; Energy Cell 28 → 31 → 34; nam châm tính từ thân Kai; MVP mở quầy từ menu; `?shop=1` để thử khi mới có 1 boss.
- **Lỗi tìm thấy / đã sửa:** trên Pixel 7 ngang bảng một cột cao hơn màn, nút Mua bị đẩy xuống dưới (đổi sang hai cột); dòng phím ở menu bị cắt hai đầu.
- **Kiểm tra:** 373 test (thêm 25), lint, format, build đạt; `gate-flow` đạt; chạy thử Chromium PC + Pixel 7, ảnh ở `04-Dev-Plan/qa/ST-09-04/`.
- **Còn dở:** chơi thử 5 người; PR #10 chưa merge (commit phiên này nằm cùng nhánh); R04; Booster, Skin (Alpha).
- **Tiếp theo:** 1. Merge PR #10, chạy đợt chơi thử 1. 2. "3 độ khó" của MVP: màn Chuẩn bị chọn độ khó (đặc tả Hub mục 3). 3. Tài liệu âm thanh và đo lường MVP.

## 2026-11-14: Cổng Prototype: chuẩn bị đợt chơi thử 1, cân bằng Thorna

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `55cf18f` (bản người thử), `5e82e50` (Thorna), commit tài liệu và `gate-flow`.
- **Mục tiêu:** người dùng đồng ý quyết định Hoa Nở xuyên khiên và giao "làm tiếp cổng Prototype". Phần chơi thử 5 người cần người thật, nên phiên này chuẩn bị mọi thứ trước đợt 1.
- **Đã làm:**
  - Đo tự động lại trên bản build sau M8 (`npm run gate-check`): mọi hạng mục đạt (tải 1,50 MB, vào game 2,51 s ở CPU 4×, FPS 59,5–60, trễ p95 13–23 ms).
  - Bản người thử `?gate=1`: menu chỉ còn Chơi, Điều khiển, Kết quả chơi thử; nút và menu tạm dừng ≥ 48 dp trên điện thoại.
  - `npm run gate-flow`: chạy thử trọn luồng người thử trên máy tính và Pixel 7, gộp nhật ký; đạt.
  - Thorna máu 100 → 250 theo mô phỏng; mẫu tin nhắn mời và phiếu quan sát trong `05-Cong-Prototype.md` mục 4.
- **File chính:** `game/src/scenes/{menu-scene,ui}.ts`, `stage/pause-menu.ts`, `debug/flags.ts`, `game/scripts/gate-flow.mjs`, `03-Data/bosses.json`, `game/tests/{power-cap,thorna,hud}.test.ts`, `04-Dev-Plan/05-Cong-Prototype.md`, đặc tả Stage 1 mục 5.
- **Quyết định:** Thorna 250 máu (`[PLACEHOLDER]`): 100 máu thì bot không né thắng sau 15 s; 250 thì bot không né thua ở cấp 4 kể cả build Core đủ bậc; người né được cần khoảng 45–65 s. Tiêu chí GDD 10 "phòng thủ không thay được né" đạt lại.
- **Lỗi tìm thấy / đã sửa:** người thử dễ vào nhầm phòng thử khác (chỉ màn xám ghi nhật ký); nút menu và menu tạm dừng chỉ cao 28–30 dp trên điện thoại. Không có lỗi mất phím khi nhấn nhả rất nhanh (đã thử).
- **Kiểm tra:** 348 test, lint, format, build đạt; `gate-check` và `gate-flow` đạt. Ảnh ở `04-Dev-Plan/qa/cong-prototype/`.
- **Còn dở:** chơi thử 5 người (≥ 3 cảm ứng) chưa làm. Đã mở PR #10 vào `main` (theo yêu cầu người dùng); merge xong thì GitHub Pages đăng bản mới.
- **Tiếp theo:** 1. Merge PR #10, kiểm tra link `?gate=1`, gửi người thử, tổng hợp vào mục 7. 2. Theo kết quả: chỉnh cảm giác, hoặc qua cổng rồi chốt bản đồ Prologue/Stage 1. 3. Tài liệu âm thanh và đo lường MVP.

## 2026-11-14: Sprint 8, EP-08 ST-08-06…08 (Phantom, Vanguard, khiên Core)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `e1001c0` (ST-08-06), `fcd59bc` (ST-08-07), `0af2359` (ST-08-08), commit tài liệu.
- **Mục tiêu:** người dùng giao "làm tiếp ST-08-06 đến 08": cơ chế tầng 2–3 của cây kỹ năng.
- **Đã làm:**
  - **ST-08-06 Phantom:** lượt lướt trên không (P1), ân hạn nhảy tường (P2 bậc 2), lướt xuyên đạn và sượt đạn (P3); đèn chân, bóng mờ.
  - **ST-08-07 Vanguard:** nổ lan (V2), Đòn Trừng Phạt khi mục tiêu hở (V3), lõi sáng boss; ba bậc phản hồi trong `ui.json`.
  - **ST-08-08 Core:** `BuildRuntime` trong StageWorld, `absorbHit`, khiên chặn một đòn rồi hồi; vòng hồi trên HUD, viền quanh Kai, mảnh kính khi vỡ.
- **File chính:** `game/src/logic/{player,world,rpg}/*`, `game/src/logic/enemy/{enemy,behaviors}.ts`, `boss.ts`, `stage-scene.ts`, `stage-hud.ts`, `stage-renderer.ts`, `03-Data/{skills,ui}.json`; test `phantom`, `vanguard`, `shield`.
- **Quyết định:**
  - Chu kỳ lướt đo được là 50 bước (không phải 51).
  - Hạt Hoa Nở xuyên khiên (`rules.shieldPierceKinds`): 12 hạt rơi cùng lúc, nên tiêu chí cũ "trúng sau khi khiên vỡ" không thể đạt.
  - Khiên không chặn đòn 0 máu. Màu đèn chân P1 đổi sang cam.
- **Lỗi tìm thấy / đã sửa:** rơi hố còn máu thì bước sau hồi sinh lần hai theo nhánh chết (hồi đầy máu, dựng lại boss). Nguyên nhân là đồng hồ còn dư sai số; có test hồi quy.
- **Kiểm tra:** 348 test (thêm 27), lint, format, build đạt. Chromium cả 3 Story, không lỗi console; ảnh ở `04-Dev-Plan/qa/ST-08-06`, `07`, `08`.
- **Còn dở:** âm thanh kỹ năng (M12); R02/R03; Booster `shield_cell` chưa chạy trong trận; tay cầm chưa thử máy thật; Thorna quá dễ (chờ cổng Prototype).
- **Tiếp theo:** 1. Chơi thử cổng Prototype, gồm cân bằng Thorna. 2. Tài liệu âm thanh và đo lường MVP. 3. Shop chỉ Upgrade (M9).
