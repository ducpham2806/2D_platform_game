# ADR-001: Xưởng (và các bảng nhiều chữ) dựng bằng bảng HTML

- **Ngày tạo:** 2026-11-14
- **Trạng thái:** Accepted (14/11/2026, cùng `01-GDD/10-He-thong-RPG-Xuong.md`)
- **Người đề xuất:** Design Lead, Technical Director
- **Phân hệ ảnh hưởng:** UI (M10), Progression (M8)

## 1. Bối cảnh

Xưởng cần 9 nút kỹ năng kèm mô tả tiếng Việt, chấm bậc, SP còn lại, nút học, đặt lại nhánh; sau này thêm tab Module và Giáp. Khung logic của game chỉ 320 × 192 px. Nút trên điện thoại phải ≥ 48 dp. Dự án đã có tiền lệ bảng HTML: lớp nút cảm ứng, bảng "Dữ liệu lưu", bảng chơi thử và chỉnh cảm giác (`.cv-panel`).

## 2. Các phương án

| Tiêu chí | A: vẽ trong canvas Phaser | B: bảng HTML phủ lên canvas | C: scene Phaser riêng với độ phân giải cao |
| --- | --- | --- | --- |
| Cơ chế | Text, Rectangle trong khung 320 × 192 | DOM, CSS, `.cv-panel`; Phaser tắt `scene.input` khi bảng mở | Canvas thứ hai hoặc đổi độ phân giải khi vào Xưởng |
| Ưu | Một hệ vẽ; đồng nhất pixel art | Chữ nét ở mọi cỡ, cuộn tự nhiên, nút ≥ 48 dp dễ, có tiền lệ trong dự án, dễ tiếp cận | Giữ một hệ vẽ, chữ nét hơn A |
| Nhược | Không đủ chỗ cho mô tả; chữ nhỏ trên điện thoại (cả sau khi phóng theo px thiết bị) | Hai hệ giao diện; phải tự làm điều hướng bằng phím và tay cầm | Phức tạp, phá quyết định scale nguyên |
| Hiệu năng | Thấp | Thấp (chỉ dựng khi mở) | Vừa |

## 3. Quyết định

**Chọn B.** Lý do: đủ chỗ cho chữ, nút đạt 48 dp, cuộn được, cùng kiểu với các bảng đã có.

```text
logic/rpg/workshop-model.ts   (thuần)  trạng thái nút theo đặc tả mục 2.4, học, đặt lại → bản lưu mới
workshop/workshop-panel.ts    (HTML)   vẽ WorkshopModel, nhận chạm và phím, gọi hàm thuần, SaveManager.update
scenes/workshop-scene.ts      (Phaser) mở bảng từ menu; StageScene mở cùng bảng từ menu tạm dừng
```

## 4. Hệ quả và quy tắc bắt buộc

- Bảng HTML chỉ **vẽ** mô hình thuần; mọi luật (điều kiện mở, SP, đặt lại) nằm ở `logic/rpg/` và có test Vitest.
- Khi bảng mở: tắt `scene.input` (Phaser nghe thả chuột trên cả cửa sổ), ẩn lớp nút cảm ứng, phím gõ trong bảng không lọt xuống game (quy tắc `.cv-panel` hiện có).
- Điều hướng được bằng bàn phím và tay cầm qua `InputService` + `MenuNavigator` (bảng "Dữ liệu lưu" hiện chưa hỗ trợ tay cầm; Xưởng là bảng đầu tiên phải có).
- Bản lưu chỉ đọc (của phiên bản game mới hơn) thì bảng khóa, chỉ xem.
- Story có bảng HTML phải có bằng chứng chạy thử trên PC và điện thoại (giả lập Pixel 7 ngang) lưu ở `04-Dev-Plan/qa/<mã Story>/`.
