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

## 2026-11-25: QB-100 bảo vệ bản lưu khi chưa đọc được kho

- **Nhánh:** bản vá cục bộ sau gói kiểm ST-22/QB-72/biên nhận lưu trên `85f7e53`; không đổi G1, Lumen hay Pages.
- **Lỗi:** đọc kho lỗi có thể mở phiên mới cho phép ghi đè bản còn tồn tại; mở IndexedDB lỗi cũng có thể chuyển sang và sửa bản khác trong localStorage.
- **Sửa:** phiên tạm chỉ đổi trong RAM, thấy cảnh báo và có thể xuất mã trước khi tải lại; không tự ghi/nhập/xóa khi chưa đọc được. Ô trống thật vẫn lưu.
- **Kiểm tra:** 830 test; luồng mở game, Menu > Dữ liệu lưu thật với kho/lớp vẽ/DOM giả lập kiểm bản cũ còn nguyên, cấm ghi, mở lại, mã phiên tạm và ô trống.
- **Còn lại:** chưa thử trên trình duyệt/Safari/điện thoại thật, chưa hợp nhất. [Quyết định lưu](../game/docs/quyet-dinh/luu.md).

## 2026-11-25: QB-100 biên nhận lưu checkpoint trong HUD

- **Nhánh:** bản vá cục bộ sau lớp kiểm ST-22, QB-72 và biên nhận Dữ liệu lưu; không đổi Pages, G1 hay Lumen.
- **Sửa:** Hiện mốc ngay, «đã lưu» chỉ khi kho xác nhận đúng lần ghi và lượt/mốc còn hiện hành. Ghi lỗi giữ tiến trình và nhắc sao lưu tới khi kho bắt kịp.
- **Kiểm tra:** 824 test tích hợp, lint, format, build và docs-check; StageScene thật với lớp vẽ/kho giả lập kiểm chờ, lỗi, phục hồi, biên nhận cũ và chế độ chỉ đọc/không lưu.
- **Còn lại:** Không thử IndexedDB/Safari/điện thoại thật; chưa có dải báo khi mở game hoặc đổi chế độ đọc kho. Chưa hợp nhất. [Quyết định lưu](../game/docs/quyet-dinh/luu.md).

## 2026-11-25: QB-100/101 chờ biên nhận khi nhập hoặc xóa dữ liệu lưu

- **Nhánh:** bản vá cục bộ từ `85f7e53`; không đổi G1, Lumen, ST-22 hay Pages.
- **Lỗi:** Dữ liệu lưu báo thành công và xóa mã đã dán trước khi trình duyệt ghi. Kho từ chối có thể làm người chơi tưởng tiến trình đã được lưu.
- **Sửa:** Chờ lần ghi, báo lỗi hữu ích, giữ mã và bản cũ khi ghi thất bại; khóa hai thao tác khi đang ghi hoặc bản lưu chỉ đọc.
- **Kiểm tra:** 807 test, lint, format, build và docs-check trên bản riêng; bản xếp chồng kiểm áp dụng và tài liệu; click bảng thật với DOM/kho giả lập, kiểm chậm, lỗi, thử lại và bản chỉ đọc. [Lưu cục bộ](../game/docs/quyet-dinh/luu.md).
- **Còn lại:** Không đổi auto-save hoặc dải cảnh báo toàn game theo QB-100; chưa kiểm trình duyệt thật hoặc hợp nhất.
