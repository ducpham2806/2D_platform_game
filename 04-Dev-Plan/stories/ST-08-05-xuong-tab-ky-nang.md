# ST-08-05: Xưởng tab Kỹ năng (bảng HTML), lối vào, chỉnh trong menu tạm dừng

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P1 · **Trạng thái:** TODO
- **Phụ thuộc:** ST-08-02 (ST-08-03 để thấy hiệu ứng trong màn)
- **Bằng chứng:** [x] Logic [x] Visual/UI (PC và giả lập Pixel 7 ngang)

## 1. User story

> **Là** người chơi, **tôi muốn** mở Xưởng sau boss 1, xem từng kỹ năng, học bằng SP và đổi bộ kỹ năng cả khi đang kẹt ở boss, **để** thử cách chơi khác ngay.

## 2. Bối cảnh (nhúng từ GDD và ADR-001)

- **Dựng bằng bảng HTML** (`.cv-panel`), chỉ vẽ `WorkshopModel` thuần.
  - Khi mở: tắt `scene.input`, ẩn lớp nút cảm ứng, phím gõ trong bảng không lọt xuống game.
  - Điều hướng bằng phím và tay cầm qua `InputService` + `MenuNavigator`.
  - Bản lưu chỉ đọc thì khóa.
- **Bố cục** (`Workshop.html`):
  - Thanh trên: Core Bit, SP còn lại.
  - Các tab: Kỹ năng; Module, Giáp hiện khóa "sau khi có nội dung"; Tủ skin, Loadout hiện "Alpha".
  - 3 cột nhánh × 3 nút. Mỗi nút có chấm bậc (●●○) và viền theo trạng thái.
  - Chạm nút để xem mô tả và số liệu bậc kế. Nút "Học (1 SP)" riêng.
  - Có "Đặt lại nhánh" và "Đặt lại tất cả", đều có xác nhận.
- **Lối vào:**
  - menu chính → Xưởng (mở sau boss 1: có `thorna` trong `bossesDefeated`);
  - màn Kết quả: nút "Mở Xưởng" sáng khi SP còn > 0;
  - menu tạm dừng → mục "Kỹ năng".
- **Thay đổi trong màn** áp dụng **ở lần hồi sinh kế tiếp** hoặc lần vào màn sau. Ghi rõ dòng này trong bảng khi mở từ menu tạm dừng.
- **Hướng dẫn:**
  - R02: "Cậu về với cái chân cháy xém. Vào Xưởng, tôi xem nào." Nút Xưởng nhấp nháy.
  - R03: "Mỗi lần học tốn 1 điểm. Đặt lại lúc nào cũng được, miễn phí. Cứ thử đi." Làm nổi nút rẻ.
- **Nút** ≥ 48 dp trên cảm ứng.

## 3. File

- `[Tạo]` `game/src/workshop/workshop-panel.ts`, `game/src/scenes/workshop-scene.ts`
- `[Cập nhật]` `game/src/scenes/menu-scene.ts`, `game/src/scenes/stage/result-panel.ts`, `game/src/scenes/stage/pause-menu.ts`, `game/src/scenes/stage-scene.ts` (áp build khi hồi sinh), `game/src/main.ts`, `game/src/core/constants.ts` (`SceneKey.Workshop`), `03-Data/tutorial.json` (R02, R03 khi có giai đoạn Hub)
- `[Cập nhật]` `game/tests/` cho mô hình bảng (học, đặt lại, khóa khi chỉ đọc)

## 4. Tiêu chí nghiệm thu

- [ ] AC-1: Sau boss 1, vào Xưởng, học V1, thoát, vào màn: nạp đầy 1,02 s.
- [ ] AC-2: Đang ở boss, mở menu tạm dừng → Kỹ năng, đặt lại và học C1; chết; hồi sinh có máu ×1,15.
- [ ] AC-3: Điều khiển được toàn bộ bảng bằng bàn phím, tay cầm và chạm; không có cú chạm hay phím nào lọt xuống game.
- [ ] AC-4: Ảnh chạy thử trên PC và Pixel 7 ngang ở `04-Dev-Plan/qa/ST-08-05/`; không lỗi console.
