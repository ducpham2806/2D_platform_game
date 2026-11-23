# Kiểm thử bục băng và mây (ST-15-08a)

Ảnh Chromium từ bản build của commit `EP-15 ST-15-08a: thêm bục băng vỡ và bệ mây`, trên nền `d858814`. PC 960 × 576 dùng bàn phím. Pixel 7 cầm ngang giả lập dùng cần ảo và nút Nhảy. Cả hai lượt có 0 lỗi console.

1. Từ menu thường, chọn **Bục băng và mây** hoặc nhấn **P**. Đi tới dưới bục băng xanh, giữ Nhảy qua mặt bục từ dưới, rồi đáp trên bục. Quan sát bậc nứt cuối, mảnh vỡ rơi và bục mọc lại.
2. Đi sang bệ mây xám, nhảy lên và đứng yên. Bệ chở Kai khi chìm xuống sàn.
3. Canh bệ mây trắng đang trôi lên, nhảy lên rồi đứng yên. Kai giữ vị trí tương đối trên bệ khi bệ di chuyển và đổi chiều.

| Cơ chế | PC | Pixel 7 |
| --- | --- | --- |
| Băng báo nứt và vỡ | [Nứt](pc-01-bang-nut.png), [vỡ](pc-02-bang-vo.png) | [Nứt](touch-01-bang-nut.png), [vỡ](touch-02-bang-vo.png) |
| Mây chìm chở Kai | [Ảnh](pc-03-may-chim-cho-kai.png) | [Ảnh](touch-03-may-chim-cho-kai.png) |
| Mây trôi chở Kai | [Ảnh](pc-04-may-troi-cho-kai.png) | [Ảnh](touch-04-may-troi-cho-kai.png) |

Chạy `npm test -- tests/platforms.test.ts` trong `game/` để kiểm thêm thời điểm, vật cản ở chỗ mọc lại, rơi xuyên, quay lại checkpoint và thưởng khi địch rơi khỏi bản đồ.
