# Đồ họa vẽ bằng mã (code art)

Toàn bộ hình hiện có trong `game/public/assets/` do script Python vẽ (`05-Assets/tools/codeart/`), **không dùng mô hình sinh ảnh** và không dùng hình của bên thứ ba. Đây là bộ hình chạy được để chơi thử và làm mẫu chuẩn về kích thước, điểm neo, bảng màu; nét đơn giản hơn tranh vẽ tay. Khi có hình tốt hơn (vẽ tay hoặc theo quy trình ChatGPT ở `01-Huong-dan-asset.md`), đè file cùng tên, cùng cỡ khung là game dùng ngay.

## Dựng lại

```
python3 05-Assets/tools/codeart/build.py     # ghi game/public/assets/**/*.png và assets.json
```

Cần Python 3 + Pillow. `assets.json` là danh sách hình game nạp lúc tải; thiếu hình bắt buộc thì game dừng ở màn tải (`game/src/core/art-manifest.ts`), và `game/tests/art.test.ts` kiểm tra file tồn tại, đúng cỡ.

## Quy ước (art direction brief rút gọn)

| Hạng mục | Quy ước |
| --- | --- |
| Phong cách | Pixel art 16-bit, viền tối 1 px (`#0B0F1A`), mỗi chất liệu tối đa 3 sắc độ, không khử răng cưa |
| Ánh sáng | Từ trên-trái: cạnh trên/trái sáng, cạnh dưới/phải tối (`Layer.bevel`) |
| Màu | Chỉ 32 màu của `tools/palette.json`; script báo lỗi nếu lạc bảng hoặc alpha không nhị phân |
| Vai trò màu | Kai: thép xanh + cyan phát sáng + khăn trắng. Đạn người chơi: cyan/trắng. Đạn và mắt kẻ địch: đỏ/cam. Nguy hiểm (gai): đỏ/hồng. Thưởng: vàng. Hồi máu: xanh lá |
| Nền | Chỉ dùng các màu tối nhất để không tranh với tiền cảnh; 2 lớp parallax 640×192 lặp ngang (0,2 và 0,5) |
| Điểm neo | Kai: giữa hai chân, đáy khung 48×48. Kẻ địch/boss: đáy hình trùng đáy hộp va chạm, tâm ngang giữa khung, hình gốc nhìn sang **trái** |
| Hoạt ảnh | Kai dựng bằng khung xương tham số (`kai.py`) nên mọi khung cùng tỷ lệ. Kẻ địch: `idle` 4 khung + `attack` 4 khung (tư thế báo trước đòn) |

## Đã có (55 spritesheet, 12 ảnh)

| Nhóm | Nội dung |
| --- | --- |
| Kai | idle 4, run 8, jump_up 2, jump_fall 2, land 2, dash 3, wall_slide 2, wall_jump 2, hurt 2, death 6, respawn 6 |
| Đạn, hiệu ứng | đạn Arc Cannon thường/nạp vừa/nạp đầy, đạn kẻ địch, lóe nòng, tia trúng, nổ nhỏ, vòng nạp 2 mức, Core Bit, viên máu |
| Tileset | `ts_lab` (xám, màn Prototype), `ts_verdant` (Stage 1): khối đặc tự ghép viền 16 kiểu, bục một chiều, gai, cửa, vật chắn, cột checkpoint |
| Nền | lab và verdant, mỗi chủ đề 2 lớp |
| Kẻ địch | Drone Lính, Tháp Pháo Tập Sự, Bướm Sắt, Tháp Gai, Lính Kén (+ khiên) |
| Boss | Bramble Golem (64×64), boss xám, Thorna (idle, attack, stun, die, lõi 3 màu theo pha) |
| Đòn và vật thể | sóng chấn động, đạn rơi, hạt Hoa Nở, hạt nổ, cột Rễ Trồi và Dây Quất (ghép từ đốt 16 px theo kích thước trong dữ liệu), roi Vine Lash, vật phẩm bí mật, bia tập bắn |
| Giao diện | chân dung NOVA, Thorna, Kai, Warden chung (30×30); logo; nền màn hình chính; khung thanh máu/năng lượng; khung máu boss; khung 9 mảnh cho hộp thoại, tạm dừng, hướng dẫn, Kết quả; biểu tượng vũ khí và tạm dừng (chưa dùng) |

## Khác với manifest.csv và hướng dẫn cũ

- **Kai cao khoảng 28 px, rộng khoảng 16 px** thay vì 24×40: hộp va chạm trong `player.json` là 12×24, hình 40 px sẽ thò qua trần và tường. Khung vẫn 48×48.
- Kẻ địch không có dải `hit`: trúng đòn thì game nháy trắng bằng mã (đúng mẹo giảm công ở mục 4 của hướng dẫn).
- Tên file kẻ địch theo hành vi (`en_drone`, `en_turret`, `en_butterfly`, `en_spike_turret`, `en_cocoon`) thay vì tên tiếng Việt trong manifest; Drone Prologue dùng chung hình Drone Lính.
- Thorna chỉ có 4 dải (manifest ghi 9): các đòn dùng chung dải `attack`; chỉ dẫn vị trí đòn vẫn vẽ bằng mã.
- `manifest.csv` **chưa được cập nhật** theo các điểm trên; `validate_assets.py` vì vậy sẽ báo thiếu.

## Chưa có

Phông bitmap (chữ vẫn là phông hệ thống vì cần đủ dấu tiếng Việt); hình riêng cho nút cảm ứng (đang là nút HTML tô theo bảng màu); gai bắn ra dùng chung hình đạn kẻ địch; sợi dây của dây leo đu và chỉ dẫn vị trí đòn boss vẫn vẽ bằng nét; các màn Điều khiển, Dữ liệu lưu, Hub và công cụ chơi thử chưa đổi giao diện; Prologue; mọi thứ của Stage 2 trở đi.
