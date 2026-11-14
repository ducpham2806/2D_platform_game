# ST-09-04: Quầy Mira (bảng HTML), tab Upgrade, lối vào từ menu

- **Thuộc Epic:** EP-09 · **Ưu tiên:** P1 · **Trạng thái:** DONE (14/11/2026)
- **Phụ thuộc:** ST-09-01, ST-09-02 · **Bằng chứng:** [x] Logic [x] Visual/UI (PC và giả lập Pixel 7 ngang)

## 1. User story

> **Là** người chơi đã hạ 2 boss, **tôi muốn** mở Quầy Mira, xem giá và mua một Upgrade với một bước xác nhận, **để** mạnh hơn mà không sợ bấm nhầm.

## 2. Bối cảnh (đặc tả Hub mục 4.1, 4.2, wireframe `Shop.html`)

- Bảng HTML (ADR-001) chỉ vẽ `ShopModel` thuần; điều hướng như Xưởng (InputService, chạm, chuột), nút ≥ 48 dp.
- Thanh trên: Core Bit (Data Chip hiện khi có hàng dùng tới, MVP chưa), nút Quay lại.
- Tab: **Upgrade** (đang mở); Booster, Skin khóa "mở sau boss 4". Không có Premium.
- Thẻ có 4 trạng thái: mua được (giá nổi), thiếu tiền (giá xám, "thiếu N"), khóa ("mở khi hạ N boss"), đủ cấp (dấu tích). Mỗi thẻ có chấm cấp.
- Panel chi tiết: mô tả, cấp hiện tại → cấp kế, giá. Nút **Mua** đổi thành **Xác nhận (giá)**, bấm lần hai mới mua. Nút **Gỡ** (hoàn 100% cấp cao nhất) cũng cần bấm hai lần.
- Thiếu tiền: chỉ gợi ý "một lượt Stage k (Thường) cho khoảng M Core Bit" (`economy.json → incomeFormula`), không chặn, không đẩy mua.
- Trong lúc chờ ghi, các nút mua bị khóa; ghi lỗi thì báo "Không lưu được, chưa trừ tiền".
- Lối vào: menu chính → "Quầy Mira" (phím Q), mở sau 2 boss chiến dịch; trước đó hiện mờ "Quầy Mira (sau boss 2)". `?shop=1` mở để chạy thử.

## 3. File

- `[Tạo]` `game/src/logic/shop/shop-model.ts`, `game/src/shop/shop-panel.ts`, `game/src/scenes/shop-scene.ts`
- `[Cập nhật]` `game/src/scenes/menu-scene.ts`, `game/src/main.ts`, `game/src/core/constants.ts` (`SceneKey.Shop`), `game/src/debug/flags.ts`, `game/src/style.css`, `03-Data/shop.json` (`name`, `desc` của từng Upgrade)
- `[Tạo]` test `game/tests/shop-model.test.ts`

## 4. Tiêu chí nghiệm thu

- [x] AC-1: Bản lưu 2 boss, 525 Core Bit: Arc Core cấp 1 mua được 400 (Mua → Xác nhận), còn 125; thẻ Energy Cell (250) xám "thiếu 125".
- [x] AC-2: Gỡ Arc Core cấp 1: bấm 2 lần, Core Bit về 525, cấp 0.
- [x] AC-3: Bản lưu 1 boss: menu hiện "Quầy Mira (sau boss 2)", phím Q không mở.
- [x] AC-4: Điều khiển bằng bàn phím (mũi tên, K/J chọn, Esc quay lại), chuột, chạm. Ảnh ở `04-Dev-Plan/qa/ST-09-04/` (PC, Pixel 7 ngang), không lỗi console, nút nhỏ nhất ≥ 48 px trên Pixel 7.

## 5. Kết quả chạy thử (Chromium, bản build)

- PC 960×576 (bàn phím) và Pixel 7 ngang (chạm): bản lưu 2 boss, 525 Core Bit. Mua Arc Core: nút đổi thành "Xác nhận (400 Core Bit)", còn 125, bản lưu ghi `{arc_core: 1}`. Energy Cell hiện "250 · thiếu 125" và gợi ý "Một lượt Stage 3 Cryo Vault (Thường) cho khoảng 375 Core Bit". Gỡ 2 lần: về 525. Esc hoặc "Quay lại" về menu. Không lỗi console.
- Bản lưu 1 boss: menu hiện mờ "Quầy Mira (sau boss 2)", phím Q không mở.
- Pixel 7 ngang: 10 nút, thấp nhất 48 px; bảng cao 273 px trong màn 360 px, không cuộn ngang, không cuộn dọc.
- Nam châm (ST-09-03): Magnet Range cấp 3 trong phòng thử kẻ địch, 3 viên Core Bit rơi cách Kai 2,5 ô bay về và được nhặt hết.
- Ảnh: `04-Dev-Plan/qa/ST-09-04/` (pc-1…6, touch-3…5).
- **Lỗi tìm thấy khi chạy thử, đã sửa:**
  - Bố cục một cột cao hơn màn điện thoại ngang, nút Mua bị đẩy xuống dưới, phải cuộn mới thấy. Sửa bằng bố cục hai cột khi rộng ≥ 640 px (thẻ | chi tiết và nút).
  - Dòng phím cuối menu dài quá, bị cắt hai đầu sau khi thêm Q. Đã rút gọn.
