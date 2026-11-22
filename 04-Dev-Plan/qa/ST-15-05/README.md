# Kiểm thử Gale Cutter (ST-15-05)

Chụp bằng Chromium trên bản build của commit `EP-15 ST-15-05: triển khai Gale Cutter và sương lạnh`, từ `2ed9412`. Dùng bàn phím trên PC 960 × 576 và điều khiển cảm ứng trên Pixel 7 cầm ngang giả lập. Cả hai lượt có 0 lỗi console.

1. Trong menu thường, chọn **Phòng thử Gale Cutter** hoặc nhấn **V**. Nhấn **E** hoặc **VK >** để chọn vũ khí mượn.
2. Tiến lên giữa phòng, đợi tháp pháo bắn, rồi nhấn **J** hoặc **Bắn**. Lưỡi hủy viên đạn, đánh trúng tháp pháo ở cả hai chiều, phá sương và về tay. Năng lượng giảm từ 28 xuống 24.
3. Ném thêm lần nữa để hạ tháp pháo, sau đó đi qua lối vừa mở và nhặt Két Tay Mk I. Két và vũ khí mượn thuộc lượt chơi phòng thử.

| Ảnh | Kết quả |
| --- | --- |
| [pc-01-luoi-di-huy-dan.png](pc-01-luoi-di-huy-dan.png) | Lưỡi ở chiều đi sau khi hủy viên đạn của tháp pháo. |
| [pc-02-luoi-ve-qua-suong.png](pc-02-luoi-ve-qua-suong.png) | Lưỡi đang quay về khi sương đã tan. |
| [pc-03-nhat-ket-tay.png](pc-03-nhat-ket-tay.png) | Kai vào được kho và nhặt Két bằng bàn phím. |
| [touch-01-luoi-ve-qua-suong.png](touch-01-luoi-ve-qua-suong.png) | Lưỡi quay về sau khi phá sương bằng nút Bắn. |
| [touch-02-nhat-ket-tay.png](touch-02-nhat-ket-tay.png) | Kai vào được kho và nhặt Két bằng cần ảo. |

Chạy `npm test -- tests/gale-cutter.test.ts` trong `game/` để kiểm Q4 trên cả hai chiều, đạn boss và mini-boss, khiên, bất tử đổi pha, năng lượng và hồi sinh sau khi phá sương.
