# ST-15-16 · Nano Cell và viên năng lượng

Bản build của commit ST-15-16 trên nhánh phát triển, sau `1771a0d`. Chromium qua Playwright với PC 960 × 576 và Pixel 7 ngang giả lập. Cả hai phiên ghi 0 lỗi console.

| Ảnh | Điều kiện kiểm |
| --- | --- |
| [PC 01](pc-01-nhat-nano-cell.png), [Pixel 7 01](touch-01-nhat-nano-cell.png) | Nhặt Nano Cell của phòng thử M7. HUD hiện 1/1. Chơi lại giữ bí mật đã ghi và nạp 1 lượt. |
| [PC 02](pc-02-hoi-mau-phim-h.png) | Bấm H khi có 30/100 máu. Kai lên 70/100, HUD còn 0/1. Sau khi chơi lại, nút RT của tay cầm giả lập cho cùng kết quả. |
| [PC 03](pc-03-vien-nang-luong.png), [Pixel 7 02](touch-02-vien-nang-luong.png) | Viên năng lượng xanh lam nằm trên sàn. |
| [PC 04](pc-04-nap-nang-luong.png), [Pixel 7 03](touch-03-nap-nang-luong.png) | Nhặt khi cầm Arc Cannon. Frost Shard lên từ 0 đến 4, Prism Beam giữ nguyên 28. |

Chạy `npm run build` rồi mở Vite preview với `?debug=1`. Vào **Phòng thử màn chơi**. Kịch bản dùng `__cvWorld` để đặt Kai cạnh bí mật đã có trong bản đồ, tạo viên năng lượng với lần rơi xác định và đặt sẵn năng lượng hai vũ khí để kiểm. Cơ chế nhặt, lưu, nạp và hiển thị đi qua bước chơi thật. Xác suất tại ngưỡng 6%, rơi từ lần đầu hạ địch và giới hạn lượng nạp có bài Vitest riêng. Nút cảm ứng dùng Nano Cell thuộc EP-14.
