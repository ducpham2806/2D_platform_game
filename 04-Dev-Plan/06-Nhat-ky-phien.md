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

## 2026-11-14: EP-10 ba độ khó; chốt EP-09 theo duyệt Game Studio Agent

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `8fc56bb` (bản nháp), `a22fd10`, `6677f97`, `6d98fdc`, `b48a892`, `930bdb6` (ST-10-01…05), `36f7499` (EP-09 sửa theo duyệt), commit ST-10-06 và tài liệu.
- **Mục tiêu:** người dùng giao "làm tiếp 3 độ khó", tự dùng Game Studio Agent bổ sung mọi chỗ còn thiếu, toàn quyền quyết định.
- **Đã làm:**
  - GDD `01-GDD/11-Do-kho.md` theo mẫu `/design-system`, qua 2 agent duyệt độc lập (Creative Director; Technical Director + Producer), sửa thành bản 2 Approved. Epic EP-10.
  - ST-10-01…06: màn Chuẩn bị; hệ số độ khó (cả máu boss); mở Thử thách theo màn; bản lưu 4; checkpoint theo độ khó; gợi ý NOVA sau 3 lần chết; bản Thử thách của 4 kẻ địch Stage 1, Golem và Thorna (đòn Rễ Đuổi).
  - Chốt 9 quyết định EP-09 theo duyệt: Energy Cell +15%/cấp; hoàn đúng giá đã trả; món chưa có tác dụng không bán; thẻ Quầy hiện số thật.
- **File chính:** `game/src/logic/difficulty/*`, `game/src/prep/`, `scenes/{prep,stage,menu}-scene.ts`, `core/{enemy,boss,shop}-config.ts`, `core/deep-merge.ts`, `logic/enemy/behaviors.ts`, `logic/boss/boss.ts`, `logic/save/*`, `03-Data/{difficulties,enemies,bosses,ui,shop}.json`.
- **Quyết định:** xem GDD 11 mục 9 và EP-09 (bảng quyết định). Chính:
  - thưởng boss một lần mỗi cặp (boss, độ khó);
  - không mang checkpoint từ độ khó dễ sang khó;
  - 3 lần chết (thống nhất với kịch bản hướng dẫn);
  - mẫu đòn Stage 1 là `[PLACEHOLDER]` tới cổng Prototype.
- **Lỗi tìm thấy / đã sửa:**
  - Máu boss không nhân hệ số độ khó.
  - Đã hạ boss xám ở phòng thử mà vẫn mở được Thử thách.
  - Bản lưu 3 sẽ khóa Thử thách của người đã hạ Thorna.
  - Tháp Gai lệch 15° trùng gai cũ.
  - Rễ chỉ mọc ở sàn nên đứng bục là miễn nhiễm.
  - Quầy trên Pixel 7 bị cắt nút khi hiện gợi ý.
- **Kiểm tra:**
  - 412 test, lint, format, build, `gate-flow`, `gate-check` đều đạt.
  - Chạy thử Chromium PC và Pixel 7; ảnh ở `04-Dev-Plan/qa/ST-10-02…05`, `ST-09-04`.
- **Còn dở:**
  - Chơi thử 5 người; PR #10 chưa merge (commit phiên này nằm cùng nhánh).
  - Đặt checkpoint theo độ khó lên bản đồ thật, chốt số mẫu đòn (sau cổng).
- **Tiếp theo:** 1. Merge PR #10, chạy đợt chơi thử 1. 2. Tài liệu âm thanh MVP (M12) và đo lường MVP (M16). 3. Sau cổng: đặc tả Stage 2–4 kèm mẫu đòn Thử thách.

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
