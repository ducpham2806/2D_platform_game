# Kiểm thử Frost Shard (ST-15-04)

- Mở **Phòng thử băng** bằng phím **I** trên PC hoặc chạm trong menu trên Pixel 7 giả lập. Đổi vũ khí bằng **E** hoặc **VK >**. Bắn phát đầu để đóng băng tháp pháo, phát thứ hai hạ nó, phát thứ ba làm dòng chảy thành ba bậc. Ba phát tốn 12 năng lượng. Phòng thử giữ phần thưởng trong lượt.
- Trên PC, di chuyển vào dòng đã đông, nhảy lên bậc giữa rồi lên bậc trên, đi sang gờ cao. Cả hai trình duyệt chạy 0 lỗi console.
- Bộ kiểm thử tự động xác nhận QB-19, khiên Lính Kén, miễn vô hiệu của boss và mini-boss, vật chắn, hồi sinh và từng bậc có thể đứng. Chạy riêng bằng `npm test -- tests/frost-shard.test.ts` trong `game/`.

| Ảnh | Kết quả |
| --- | --- |
| [pc-ke-dich-dong-bang.png](pc-ke-dich-dong-bang.png) | Tháp pháo đã đóng băng, dòng làm mát còn lỏng. |
| [pc-dong-lam-mat-da-dong.png](pc-dong-lam-mat-da-dong.png) | Dòng làm mát đông thành ba bậc. |
| [pc-kai-tren-go-cao.png](pc-kai-tren-go-cao.png) | Kai sang gờ cao sau khi leo qua các bậc. |
| [pixel7-dong-lam-mat-da-dong.png](pixel7-dong-lam-mat-da-dong.png) | Kết quả sau khi đổi vũ khí và bắn bằng cảm ứng. |
