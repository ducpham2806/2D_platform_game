# ST-09-02: Bản lưu 3 (cấp Upgrade), chuẩn hóa, giao dịch nguyên tử

- **Thuộc Epic:** EP-09 · **Ưu tiên:** P1 · **Trạng thái:** Ready
- **Phụ thuộc:** ST-09-01 · **Bằng chứng:** [ ] Logic

## 1. User story

> **Là** người chơi, **tôi muốn** mua xong là chắc chắn được lưu, lỗi lưu thì không mất tiền, **để** yên tâm tiêu Core Bit.

## 2. Bối cảnh

- Đặc tả Hub mục 8: nhóm Kho gồm Core Bit, số lượng booster, **cấp upgrade**. Giao dịch Shop nguyên tử: trừ tiền và thêm món trong cùng một lần ghi; lưu lỗi thì hoàn tác và báo người chơi.
- Bản lưu 3: thêm `inventory.upgrades: Record<id, cấp>`. Bản 2 đọc lên thành bản 3 với `upgrades` trống.
- Chuẩn hóa theo dữ liệu (chạy khi mở và khi nhập mã sao lưu): id lạ bỏ; cấp vượt `maxLevel` kẹp lại và hoàn Core Bit phần dư theo giá hiện hành; có thông báo một lần.
- `SaveManager.transact(change)`: đổi bản lưu rồi chờ ghi xong. Ghi lỗi thì trả bản trong bộ nhớ về trước giao dịch và báo lỗi.

## 3. File

- `[Cập nhật]` `game/src/logic/save/save-data.ts`, `save-manager.ts`, `game/src/main.ts` (ghép chuẩn hóa)
- `[Tạo]` `game/src/logic/shop/normalize-upgrades.ts`; test trong `game/tests/upgrades.test.ts`, `save.test.ts`

## 4. Tiêu chí nghiệm thu

- [ ] AC-1: Bản 2 có Core Bit 900 đọc lên: bản 3, `upgrades` = {}, Core Bit 900. Bản 4 (mới hơn game) thì chỉ đọc như cũ.
- [ ] AC-2: `{arc_core: 7}` (tối đa 5) thì kẹp về 5, hoàn giá cấp 6 và 7, có thông báo; `{laser: 2}` bị bỏ.
- [ ] AC-3: Kho ghi hỏng: `transact` trả lỗi, Core Bit và cấp trong bộ nhớ về như trước, `revision` không tăng. Kho ghi được: trả ổn, đọc lại kho thấy cả tiền đã trừ và cấp mới (một lần ghi).
- [ ] AC-4: Mã sao lưu (save-code) giữ cấp Upgrade qua xuất/nhập.
