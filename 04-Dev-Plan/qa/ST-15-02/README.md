# Kiểm thử phòng laser Stage 2 (ST-15-02)

Chạy bản build trên Chromium, màn hình máy tính 960 × 576 và Pixel 7 cầm ngang giả lập.

- PC mở phòng thử bằng phím O, Pixel 7 mở bằng nút **Phòng thử laser** trong menu. Giữ rồi thả Bắn khi Arc Cannon nạp vừa. Gương đổi hướng, cảm biến sáng màu xanh và cửa mở.
- Đặt Kai còn 1 máu vào tia luôn bật để kiểm nhanh hồi sinh. Sau khi hồi sinh, gương về góc đầu và cửa giữ mở. Cả hai lượt có 0 lỗi trang hoặc console.
- Kiểm thử tự động xác nhận Kai có thể đi bộ qua cửa đã mở và vùng dưới tia phản xạ mà không mất máu. Chạy riêng bằng `npm test -- tests/stage-optics.test.ts` trong `game/`.

| Ảnh | Trạng thái |
| --- | --- |
| [pc-vach-bao.png](pc-vach-bao.png) | Vạch mảnh bên phải báo xung sắp bật. Cửa còn đóng. |
| [pc-cua-mo.png](pc-cua-mo.png) | Tia đổi hướng lên cảm biến, ô cửa đã thông. |
| [pixel7-cua-mo.png](pixel7-cua-mo.png) | Cùng kết quả khi giữ và thả nút cảm ứng. |
