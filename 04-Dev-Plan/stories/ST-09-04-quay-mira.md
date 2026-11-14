# ST-09-04: Quầy Mira (bảng HTML), tab Upgrade, lối vào từ menu

- **Thuộc Epic:** EP-09 · **Ưu tiên:** P1 · **Trạng thái:** Ready
- **Phụ thuộc:** ST-09-01, ST-09-02 · **Bằng chứng:** [ ] Logic [ ] Visual/UI (PC và giả lập Pixel 7 ngang)

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
- `[Cập nhật]` `game/src/scenes/menu-scene.ts`, `game/src/main.ts`, `game/src/core/constants.ts` (`SceneKey.Shop`), `game/src/debug/flags.ts`, `game/src/style.css`
- `[Tạo]` test `game/tests/shop-model.test.ts`

## 4. Tiêu chí nghiệm thu

- [ ] AC-1: Bản lưu 2 boss, 525 Core Bit: Arc Core cấp 1 mua được 400 (Mua → Xác nhận), còn 125; thẻ Energy Cell (250) xám "thiếu 125".
- [ ] AC-2: Gỡ Arc Core cấp 1: bấm 2 lần, Core Bit về 525, cấp 0.
- [ ] AC-3: Bản lưu 1 boss: menu hiện "Quầy Mira (sau boss 2)", phím Q không mở.
- [ ] AC-4: Điều khiển bằng bàn phím (mũi tên, K/J chọn, Esc quay lại), chuột, chạm. Ảnh ở `04-Dev-Plan/qa/ST-09-04/` (PC, Pixel 7 ngang), không lỗi console, nút nhỏ nhất ≥ 48 px trên Pixel 7.
