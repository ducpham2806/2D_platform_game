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

## 2026-11-22: ST-15-08a bục băng vỡ và bệ mây

- **Nhánh:** `ccr-9de01342-2046rb`, từ `d858814`. G1 tiếp tục trên `main`.
- **Đã làm:** Kai đặt chân thì nứt theo ba mốc 0 / 0,4 / 0,7 s. Băng vỡ sau 1 s, mây chìm sau 0,8 s ở 3 ô/s. Rời bục không đặt lại đồng hồ. Tính 4 s từ lúc vỡ hoặc bắt đầu chìm và đợi chỗ cũ trống.
- **Bệ trôi:** hai điểm Tiled, 1,5 ô/s, chở Kai theo cả hai trục và dùng Xuống + Nhảy. Bệ chìm chở Kai đến nền hoặc hết bản đồ. Hồi sinh ở checkpoint dựng lại bục và đưa bệ trôi về đầu.
- **Luật biên:** QB-40 loại bục vỡ và bệ di động khỏi kích hoạt checkpoint. Địch đất rơi khi băng dưới chân vỡ. Rơi khỏi bản đồ trả EXP một lần theo QB-20, mất Core Bit.
- **File chính:** `CrumblePlatform`, `CloudDrift`, `StageWorld`, `EnemyField`, bộ nạp Tiled và 14 bài trong `game/tests/platforms.test.ts`.
- **Kiểm tra:** 683 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Phòng **Bục băng và mây** chơi qua bằng bàn phím và Pixel 7 giả lập, 0 lỗi console. [Ảnh](qa/ST-15-08a/README.md).
- **Tiếp theo:** ST-15-15/16 làm được trước G1. Sàn trơn và gió thuộc ST-15-08b, Nứt Bục của Cryo ở ST-15-11, bố trí bệ chiến dịch ở EP-17.

## 2026-11-22: ST-15-06 bốn kẻ địch Viện Quang và Kho Lạnh

- **Nhánh:** `ccr-9de01342-2046rb`, từ `35fca2b`. G1 tiếp tục trên `main`.
- **Đã làm:** Gương Quang dội trần khi bị che và vẽ hướng ngắm. Song Tia thêm viên thẳng nếu có đường dội. Người Tuyết Máy dùng 0 khiên, dừng ở mép và thêm hai cú Trượt Dội ở Thử thách.
- **Địch Kho Lạnh:** Tháp Băng dùng góc ném 50°, có hai điểm rơi và nhắm lại ở loạt hai. Frost Titan giậm, ném ba tảng, húc và miễn vô hiệu. Tảng Vỡ sinh hai sóng khi đáp sàn hoặc bục một chiều. Hạ Titan mở phòng khóa và trả 185 EXP/50 Core Bit theo dữ liệu gốc.
- **Quyết định:** dùng đường va chạm quét cho vạch dội và bóng đổ. Sửa vị trí phóng bom trong hành vi `golem` để bom không chạm sàn ngay lúc bắn. Mở hai chế độ phòng thử ở menu thường.
- **Kiểm tra:** 669 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Chromium PC Thường và Pixel 7 giả lập Thử thách, 0 lỗi console. [Ảnh](qa/ST-15-06/README.md).
- **Tiếp theo:** ST-15-08a hoặc ST-15-15/16. Đặt địch trong bản đồ chiến dịch ở EP-17. QB-21 và QB-23 thống nhất ở ST-15-15.

## 2026-11-21: ST-15-05 Gale Cutter và sương lạnh Két Tay Mk I

- **Nhánh:** `ccr-9de01342-2046rb`, từ `2ed9412`. G1 tiếp tục trên `main`.
- **Đã làm:** Gale Cutter bay ngang tối đa 6 ô, quay đầu ở vật chắn hoặc hết tầm. Chiều về hướng tới Kai và xuyên địa hình. Mỗi mục tiêu trúng tối đa một lần mỗi chiều. Mỗi lượt ném tốn 4 năng lượng, đổi vũ khí vẫn giữ lưỡi.
- **Q4:** hủy tối đa hai viên `enemyShot` hoặc `bomb` có nguồn địch thường, tính cả hai chiều và xử lý trước sát thương lên Kai. Khiên còn chặn sát thương. Lưỡi tan khi chạm boss bất tử đổi pha (QB-31).
- **Sương lạnh:** dùng `Barrier`, giữ lối mở qua hồi sinh. Phòng thử mượn Gale Cutter, có tháp pháo và Két Tay Mk I. Dùng phím V để mở phòng, tránh phát bắn ngoài ý muốn từ phím J.
- **File chính:** `WeaponLoadout`, `ProjectilePool`, va chạm vũ khí, bản đồ Tiled `gale-test.json` và 11 bài trong `game/tests/gale-cutter.test.ts`.
- **Kiểm tra:** 653 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Bàn phím và Pixel 7 giả lập hủy đạn, phá sương, nhặt Két, 0 lỗi console. [Ảnh](qa/ST-15-05/README.md).
- **Tiếp theo:** ST-15-06 hoặc ST-15-15/16 trước G1. Aeris chính thức cấp vũ khí ở ST-15-12, đặt Két ở kho hạt giống trong ST-17-03.
