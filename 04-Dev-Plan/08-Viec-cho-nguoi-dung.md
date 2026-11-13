# Việc chờ người dùng

Những việc chỉ người dùng làm được hoặc phải quyết định. Claude cập nhật file này mỗi phiên; làm xong việc nào thì báo để gạch đi. Xếp theo mức chặn tiến độ.

## Đang chặn tiến độ

1. **Merge nhánh `ccr-0afa36c6-vbizeu` vào `main`** (hoặc bảo Claude mở PR). Bản web trên GitHub Pages chỉ cập nhật khi `main` đổi; hiện bản Pages chưa có hội thoại, màn Kết quả, âm thanh, và chưa có bản sửa lỗi phóng hình trên điện thoại.
2. **Kiểm tra trên một điện thoại thật** (mở link Pages, cầm ngang, thêm `?debug=1` để xem FPS):
   - Khung game có chiếm gần hết chiều cao màn hình và hình có nét không (lỗi phóng 1× đã sửa ngày 13/11, mới thử trên giả lập).
   - Có nghe thấy âm thanh sau cú chạm đầu tiên không; âm lượng có chói không (iPhone ở chế độ im lặng sẽ không có tiếng).
   - FPS có giữ 60 trong phòng boss không; bấm nút có cảm giác trễ không.
3. **Chạy đợt chơi thử cổng Prototype với 5 người** theo `05-Cong-Prototype.md` mục 4 (ít nhất 3 người dùng điện thoại, 2 người dùng máy tính; chưa từng xem game). Gửi lại các đoạn JSON hoặc ghi kết quả vào mục 7 của file đó. Mọi việc về bản đồ thật Prologue/Stage 1 đang chờ kết quả này.

## Cần quyết định

4. **Ba quyết định trong `07-Danh-gia-ke-hoach.md` mục 4.** Tình trạng:
   - Quyết định 1 (làm gì trước đợt chơi thử): Claude đã làm theo phương án A khuyến nghị (âm thanh và hiệu ứng tối thiểu) vì người dùng giao tự làm tiếp. Nếu muốn thử bản không có âm thanh/hiệu ứng: tắt âm ở menu tạm dừng; hiệu ứng hạt chưa có nút tắt.
   - Quyết định 2 (phạm vi MVP: giữ 4 màn và ước lượng lại, hay cắt còn 3 màn): **chưa chọn**.
   - Quyết định 3 (việc kéo sớm: đo lường tối thiểu trước cổng MVP, thử đóng gói Android, bảng chuỗi đa ngôn ngữ, smoke check trong CI): **chưa chọn**.
5. **Duyệt các lựa chọn Claude tự quyết khi đặc tả không nói rõ** (đổi được dễ, đều nằm trong dữ liệu hoặc một file):
   - Màn tự kết thúc 2,5 giây sau khi hạ boss, chờ người chơi thử vũ khí mới tối đa 20 giây (`03-Data/stages.json` → `mechanics.result`).
   - Hộp hội thoại đặt phía trên thay vì phía dưới như wireframe (để không che nhân vật).
   - Nút "Tiếp tục" ở màn Kết quả về màn hình chính, chưa về Hub.
   - Toàn bộ âm thanh là âm tổng hợp tạm (`03-Data/feedback.json`), nghe kiểu chiptune thô; cần người nghe và chỉnh.

## Không gấp

6. **Asset:** làm tờ thiết kế Kai và một mẫu chuẩn trong game (Kai idle/run/jump/dash + 1 tileset Verdant + 1 kẻ địch) theo `05-Assets/01-Huong-dan-asset.md`, để biết sớm pipeline tạo hình có giữ được nhất quán không. Không phụ thuộc cổng Prototype.
7. **Bật GitHub Pages** nếu chưa bật: Settings → Pages → Source chọn GitHub Actions (`05-Cong-Prototype.md` mục 3).
