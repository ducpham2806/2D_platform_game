# Hướng dẫn tạo asset bằng ChatGPT

Kèm theo: `02-Prompt-asset.md` (prompt hình), `manifest.csv` (350 spritesheet cần có), `tools/` (script xử lý). Mọi con số là `[PLACEHOLDER]`.

## 1. Sự thật cần biết

| ChatGPT làm tốt | ChatGPT làm kém |
|---|---|
| Ý tưởng nhân vật, tờ thiết kế, chân dung, minh họa cutscene, ảnh nền, biểu tượng, logo, ảnh cửa hàng | Hoạt ảnh nhiều khung nhất quán, lưới chính xác từng điểm ảnh, pixel art "sạch", ô gạch lặp liền mạch |

Vì vậy dùng quy trình **"AI tạo bản thô, script xử lý, bạn chỉnh tay"**:

1. ChatGPT sinh ảnh to, nét "chunky pixel" (không cần chính xác từng điểm ảnh).
2. Script `process_sprites.py` xóa nền, cắt lưới, căn chân, thu nhỏ nguyên tỷ lệ, ép về bảng 32 màu.
3. Bạn chỉnh các khung xấu bằng Aseprite (trả phí) hoặc Piskel/LibreSprite (miễn phí).

Dự trù: **30–50% lượt tạo phải làm lại hoặc sửa tay**. Với 350 spritesheet, bắt đầu từ nhóm P0–P1 (94 sheet, ~310 khung) rồi mới tới nhóm sau.

## 2. Thông số chuẩn

| Hạng mục | Giá trị |
|---|---|
| Độ phân giải logic | 320×192 (20×12 ô), scale nguyên |
| Ô gạch | 16×16 |
| Kai | khung 48×48 (nhân vật hiển thị khoảng 24×40), chân ở giữa đáy |
| Kẻ địch thường | 32×32 |
| Mini-boss / Boss | 64×64 / 96×96 |
| Hiệu ứng | 16×16, 32×32, 48×48, 64×64 theo manifest |
| Chân dung | 64×64 (tạo ở 512×512 rồi thu nhỏ) |
| Tileset | 128×128 (lưới 8×8 ô 16×16) |
| Nền parallax | 640×192 mỗi lớp, lặp ngang |
| Biểu tượng | 32×32 |
| Cutscene | 640×384 |
| Bảng màu | 32 màu (`tools/palette.json`) |
| Định dạng | PNG, alpha nhị phân (không viền mờ), không khử răng cưa |
| Hướng mặc định | Nhìn sang phải (lật ngang trong game) |

**Đặt tên:** `{loại}_{tên}_{hoạt ảnh}.png` (ví dụ `kai_run.png`, `en_drone_linh_attack.png`); atlas xuất ra `public/assets/atlas/{nhóm}.png/.json`; tên khung trong atlas: `kai_run_0`, `kai_run_1`...

## 3. Quy trình 9 bước

1. **Bảng phong cách (Style bible):** chốt phong cách, bảng màu, ánh sáng (từ trên-trái), viền (tối, 1 điểm ảnh). Lưu ảnh tham chiếu.
2. **Tờ thiết kế nhân vật:** Kai (mặt trước/bên/sau, 3 biểu cảm). Duyệt rồi **khóa**: mọi lần sau đính kèm ảnh này.
3. **Tạo bản thô:** từng tư thế hoặc từng dải khung (mục 4).
4. **Xóa nền và cắt:** dùng nền `#FF00FF` rồi `process_sprites.py`.
5. **Chỉnh tay:** sửa khung lệch, màu lạc bảng, điểm ảnh lẻ.
6. **Gộp atlas:** `pack_atlas.py`.
7. **Kiểm tra:** `validate_assets.py manifest.csv public/assets`; xem ở 1× và 2× trên điện thoại.
8. **Đưa vào game:** nạp atlas, tạo hoạt ảnh từ JSON.
9. **Ghi nhật ký:** lưu prompt thành công vào một file để tái tạo đồng nhất.

Lệnh mẫu:

```
python tools/process_sprites.py kai_run_raw.png --cols 4 --rows 2 --cell 48x48 --name kai_run --fps 12 --out out/
python tools/pack_atlas.py out/ --name kai --size 1024
python tools/make_seamless.py bg_raw.png bg_verdant_l1.png --overlap 64 --height 192
python tools/validate_assets.py manifest.csv ../game/public/assets
```

## 4. Spritesheet nhân vật và kẻ địch

**Hai cách tạo, ưu tiên cách B cho Kai và boss:**

| | A: Cả dải một lần | B: Từng tư thế một (khuyến nghị) |
|---|---|---|
| Cách làm | Yêu cầu một ảnh có N khung xếp lưới | Đưa ảnh khung đã duyệt, yêu cầu "cùng nhân vật, chỉ đổi tư thế" |
| Ưu | Nhanh, ít lượt | Nhân vật nhất quán hơn nhiều |
| Nhược | Khung thường lệch, khác chi tiết | Nhiều lượt hơn |
| Dùng cho | Hiệu ứng, kẻ địch đơn giản, vòng lặp ngắn | Kai, boss, mini-boss |

**Quy tắc bố cục khi yêu cầu dải:** N=2–4 khung: 1 hàng; N=6: 3 cột × 2 hàng; N=8: 4 × 2; N=10: 5 × 2. Mọi khung cùng kích thước, đặt chân cùng một đường nền, khoảng trống đều. Nền phẳng `#FF00FF`.

**Mẹo giảm công:**

- Kai luôn giơ pháo ở tư thế sẵn sàng, nên **không cần hoạt ảnh bắn riêng**; bắn chỉ cần hiệu ứng lóe nòng.
- Nạp năng lượng, nhấp nháy khi bị đánh, tàn ảnh lướt: làm bằng **mã** (đổi màu, lớp phủ), không vẽ thêm khung.
- Boss: 3 pha dùng chung bộ khung, chỉ đổi màu lõi.
- Biến thể kẻ địch cho các độ khó: đổi bảng màu bằng mã.

Số khung và tốc độ nằm trong `manifest.csv` (cột `frames`, `fps`, `loop`).

## 5. Skin theo bộ phận (rủi ro lớn nhất)

Đổi skin riêng đầu, thân, tay, chân, lõi, vệt lướt × mọi hoạt ảnh sẽ nhân số khung lên rất nhiều nếu vẽ đầy đủ. Đề xuất ba mức:

| Mức | Cách | Dùng cho | Chi phí |
|---|---|---|---|
| 1. Đổi bảng màu | Thiết kế Kai với "ô màu" (giáp chính, giáp phụ, kính, lõi sáng, viền); skin = bảng màu khác, đổi bằng mã | 12 skin Thường | Gần như 0 |
| 2. Phụ kiện lớp phủ | Mũ, tóc, họng pháo vẽ riêng, gắn vào điểm neo theo từng khung (file JSON điểm neo) | Skin Hiếm cho đầu, tay | Vừa |
| 3. Tách lớp đầy đủ | Mỗi bộ phận một lớp cho mọi khung | Chỉ khi cần cho Sử thi | Rất cao |

Làm mức 1 trước (P3), mức 2 sau, mức 3 chỉ khi thật cần. **Hitbox và khung hoạt ảnh không đổi theo skin.** Việc tách lớp nên làm trong Aseprite từ bản chính, không nhờ ChatGPT vẽ từng lớp.

Mẫu điểm neo:
```
{"kai_run_0": {"head": [24, 8], "arm": [34, 22]}, "kai_run_1": {"head": [24, 9], "arm": [34, 23]}}
```

## 6. Tileset và màn chơi

- Mỗi tileset 128×128, lưới 8×8 ô 16×16. Tối thiểu khoảng 24 ô: mặt đất (trái, giữa, phải), ruột đất, góc trong/ngoài, tường trái/phải, trần, bục một chiều (trái, giữa, phải), gai lên/xuống, cửa, vài ô trang trí, ô nền phía sau.
- ChatGPT thường tạo ô **không lặp liền mạch**. Cách xử lý: tạo mẫu hình để tham khảo, rồi vẽ hoặc chỉnh lại trong Aseprite; thử ghép lặp trong Tiled để phát hiện đường nối.
- Dựng màn trong **Tiled** (miễn phí), xuất JSON; đặt thuộc tính ô: `solid`, `hazard`, `oneway`.
- Tileset bản gốc nên giữ **tối giản** (xám) ở Prototype; chỉ làm đẹp từ Vertical slice.

## 7. Nền parallax

- 3 lớp mỗi màn: xa (tốc độ cuộn 0,2), giữa (0,5), gần (0,8).
- Tạo ảnh rộng (1536×1024), **cắt dải tỷ lệ 10:3**, rồi chạy `make_seamless.py` (hòa trộn mép) và thu nhỏ về chiều cao 192.
- Nền được phép dùng nhiều màu hơn, nhưng giữ tông trong bảng màu của màn.
- Lớp xa nên mờ và ít chi tiết để không cạnh tranh với vùng chơi.

## 8. Giao diện và biểu tượng

- Bảng biểu tượng: tạo lưới 4×4 hoặc 5×4 trên một ảnh, cắt từng ô 32×32. Mỗi bảng một chủ đề (booster, upgrade, module, vũ khí...).
- Panel và nút dạng 9-slice: tạo nhỏ (48×48), sửa tay các góc.
- Phông chữ: dùng phông pixel miễn phí có giấy phép mở (ví dụ Press Start 2P, Pixelify Sans); kiểm tra giấy phép trước khi dùng.
- Ảnh xem trước skin lấy bằng cách chụp sprite trong game, không vẽ riêng.

## 9. Âm thanh (ChatGPT không tạo âm thanh)

| Loại | Công cụ gợi ý |
|---|---|
| SFX (bắn, nạp, lướt, trúng, nhặt, mua...) | jsfxr/sfxr (miễn phí) |
| Nhạc chiptune | BeepBox hoặc Bosca Ceoil (miễn phí); hoặc gói nhạc có giấy phép rõ ràng |
| Nhạc/âm thanh dựng sẵn | Kenney (CC0), OpenGameArt (kiểm tra giấy phép từng file) |
| Công cụ nhạc AI | Chỉ dùng khi điều khoản cho phép sử dụng thương mại; lưu bằng chứng giấy phép |

Danh sách cần có: khoảng 25 SFX, và nhạc cho Prologue, 8 màn, Hub, Citadel, boss, boss cuối, kết thúc, menu, jingle thắng.

## 10. Kiểm tra chất lượng cho mỗi asset

- [ ] Đúng kích thước khung và số khung theo `manifest.csv`.
- [ ] Chân đặt cùng một đường nền ở mọi khung; không "nhảy" khi chuyển khung.
- [ ] Alpha nhị phân, không viền hồng còn sót.
- [ ] Màu nằm trong bảng 32 màu (trừ nền parallax).
- [ ] Nhìn rõ ở 1× trên màn hình điện thoại 6 inch.
- [ ] Hoạt ảnh chạy mượt ở fps ghi trong manifest.
- [ ] Đã lưu prompt thành công vào nhật ký.

## 11. Pháp lý và bản quyền

- **Không** dùng tên thương hiệu hay tên nhân vật có bản quyền trong prompt (ví dụ Mega Man, Capcom); không mô tả "theo phong cách của [họa sĩ còn sống]". Mô tả bằng đặc điểm hình ảnh.
- Quyền sở hữu và đăng ký bản quyền với hình do AI tạo còn khác nhau theo từng nước; kiểm tra điều khoản dịch vụ của công cụ bạn dùng và hỏi chuyên gia nếu cần cho phát hành thương mại.
- Giữ nhật ký prompt và các bản chỉnh tay để chứng minh quy trình sáng tạo; phần bạn chỉnh tay và thiết kế gốc (Kai, boss) là tài sản quan trọng.
- Phông chữ, âm thanh, thư viện: lưu giấy phép trong thư mục `licenses/`.

## 12. Thứ tự sản xuất

| Nhóm | Mốc | Số sheet | Số khung | Nội dung chính |
|---|---|---|---|---|
| P0 | Prototype | 10 | 38 | Kai (idle, run, nhảy, đáp), hiệu ứng Buster, nổ nhỏ |
| P1 | Vertical slice | 84 | 275 | Còn lại của Kai, Prologue, Stage 1, Thorna, giao diện lõi, chân dung đầu tiên, cutscene Prologue |
| P2 | Alpha | 94 | 406 | Stage 2–4, Hub, biểu tượng, kẻ địch, NPC |
| P3 | Beta | 155 | 670 | Stage 5–8, Citadel, boss còn lại, skin, kết thúc |
| P4 | Live-ops, Endgame | 4 | 27 | Biểu tượng Live-ops, Chip Lõi, khung độ hiếm |
| P5 | Ra mắt | 3 | 3 | Biểu tượng và ảnh cửa hàng |

**Cắt giảm nếu quá tải:** boss từ 9 xuống 6 hoạt ảnh (bỏ stun, move, một đòn), bỏ `kai_victory`, dùng chung nền xa giữa nhiều màn, dùng đổi màu cho các Mini-boss.
