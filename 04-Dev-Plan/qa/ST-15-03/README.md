# Kiểm thử Prism Beam (ST-15-03)

- Chromium trên PC và Pixel 7 giả lập. Mở **Phòng thử laser**, đổi sang Prism Beam bằng **E** hoặc **VK >**, rồi bắn. Một tia dội lên cảm biến làm cửa mở, thanh năng lượng về 25/28 và gương giữ góc cũ. Cả hai lần có 0 lỗi console.
- Trong phòng thử M7, dùng chế độ kiểm thử để trang bị Prism Beam và đặt Kai trước rễ khô. Một phát bắn mở lối tới Két giáp. Cố định khung hình ngay sau khi bắn để chụp được vệt tia ngắn.
- Kiểm thử tự động với khiên mặt trước, mặt sau và tia dội, giới hạn 3 lần phản xạ, tầm tổng, sát thương một lần, boss, tường và rễ khô. Chạy riêng bằng `npm test -- tests/prism-beam.test.ts` trong `game/`.

| Ảnh | Kết quả |
| --- | --- |
| [pc-tia-doi.png](pc-tia-doi.png) | Vệt Prism Beam màu lam dội lên cảm biến xanh. |
| [pixel7-tia-doi.png](pixel7-tia-doi.png) | Cảm biến mở cửa sau khi bắn bằng nút cảm ứng. |
| [pc-re-kho-truoc.png](pc-re-kho-truoc.png) | Rễ khô chắn lối. |
| [pc-re-kho-da-mo.png](pc-re-kho-da-mo.png) | Tia chạm mặt rễ và thông lối. |
