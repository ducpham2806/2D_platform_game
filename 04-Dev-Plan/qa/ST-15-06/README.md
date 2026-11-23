# Kiểm thử bốn kẻ địch Stage 2–3 (ST-15-06)

Ảnh từ bản build của commit `EP-15 ST-15-06: thêm kẻ địch Viện Quang và Kho Lạnh`, trên nền `35fca2b`. Chromium PC 960 × 576 chạy Thường, Pixel 7 cầm ngang giả lập chạy Thử thách. Cả hai lượt có 0 lỗi console.

Mở **Địch S2–3** hoặc **Thử thách S2–3** trong menu thường. Dùng vị trí thử để đưa Kai tới từng khu và đặt máu Frost Titan ở 50% sau khi kiểm cú giậm pha 1. Đường đạn, trượt, phòng khóa và tảng tạo sóng chạy theo logic game.

| Dấu hiệu hoặc đòn đánh | Thường | Thử thách |
| --- | --- | --- |
| Vạch dội trần của Gương Quang và đường thẳng thêm của Song Tia | [PC](pc-01-guong-quang-doi-tran.png) | [Pixel 7](touch-01-guong-quang-doi-tran.png) |
| Người Tuyết Máy co người. Trượt Dội báo ba nhịp | [PC](pc-02-nguoi-tuyet-bao-truot.png) | [Pixel 7](touch-02-nguoi-tuyet-bao-truot.png) |
| Hai điểm rơi của Tháp Băng. Loạt thứ hai đổi hướng khi Kai sang bên kia | [PC](pc-03-thap-bang-diem-roi.png) | [Pixel 7](touch-03-thap-bang-diem-roi.png) |
| Ba bóng tảng của Frost Titan. Bản Thử thách có sóng xanh sau khi đáp | [PC](pc-04-frost-titan-bong-tang.png) | [Bóng tảng](touch-04-frost-titan-bong-tang.png), [sóng](touch-05-tang-vo-tao-song.png) |

Chạy `npm test -- tests/prism-frost-enemies.test.ts` trong `game/` để kiểm va chạm, nhắm lại, miễn đóng băng, thưởng và mở phòng khóa.
