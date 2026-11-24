# ST-15-10 · Đo trận Lumen bằng Arc Cannon

## Đường chuẩn: bot ban đầu chưa thắng

Chạy từ thư mục `game` bằng Node 22:

```sh
npm test -- --silent=false tests/lumen-fight.test.ts
```

Bot đi từ điểm xuất phát qua cổng thật. Đồng hồ bắt đầu khi cổng đóng và dừng khi Kai chết hoặc Lumen bị hạ. Phòng thử nguyên trạng, độ khó Thường, cấp 5, không build, không hồi máu, không trợ ngắm. Bot dùng đạn Arc Cannon thường và né bằng di chuyển, nhảy hoặc rơi xuyên bục; không sửa máu, vị trí, pha hay kết quả va chạm. Cấp 5 theo phép đo của GDD 16 §2.2; phòng thử trên trình duyệt vẫn khởi đầu cấp 1.

| Seed | Kết quả | Thời gian | Đạn bắn / trúng | Máu Lumen còn |
| --- | --- | ---: | ---: | ---: |
| 2187 (scene) | Kai thua ở pha 3 | 101,0 s | 363 / 201 | 62,9 / 280 |
| 42 | Kai thua ở pha 3 | 101,0 s | 363 / 202 | 61,8 / 280 |

Cả hai lượt đi qua ba pha, thấy đủ bốn đòn Thường, và không cấp thưởng khi Kai thua. Nhịp bắn thực tế khoảng 3,59 phát/s, tương đương 48% mốc 7,5 phát/s, thấp hơn dải 50–75% dùng để thiết kế. Kai bị trúng 7 viên Chớp Tín Hiệu, 2 lần Tia Phản Xạ và 1 lần chạm boss ở mỗi lượt.

**Kết luận lượt chuẩn:** thất bại của cách né/bắn ban đầu không chứng minh trận quá khó. Giữ nguyên máu, đòn và bố cục; xem lượt thắng từ đầy máu bên dưới.

## Lượt thắng bằng điều khiển mô phỏng

```sh
npm test -- --silent=false tests/lumen-fight-win.test.ts
```

Dùng cùng phòng và cấu hình Thường cấp 5. Bot đi qua cổng, không đổi vị trí/HP trực tiếp, không hỗ trợ ngắm, không nạp, không hồi máu. Bot lướt khi đổi phía xa, đứng gần mép bục để bắn ngang, nhảy qua viên Chớp Tín Hiệu gần tới, và né theo tia/cột/khe đã báo. Cửa sổ ngắm rộng thêm một ô khi tầm bắn đang vào vị trí nên vẫn có đạn trượt.

| Seed | Trận thắng | Đạn bắn / trúng | Máu Kai còn |
| --- | ---: | ---: | ---: |
| 2187 (scene) | 76,22 s | 299 / 260 | 52 |
| 42 | 75,95 s | 299 / 260 | 42 |
| 257 | 78,18 s | 299 / 260 | 52 |
| 1234 | 79,87 s | 309 / 260 | 52 |
| 1013 | 80,88 s | 309 / 260 | 52 |
| 707 | 75,95 s | 299 / 260 | 42 |
| 179 | 77,73 s | 299 / 260 | 52 |

**7/7 thắng trong 75,95–80,88 s**, bắn thực tế 3,82–3,94 phát/s (50,9–52,5% mốc 7,5 phát/s). Cả bảy trận qua ba pha, thấy đủ bốn đòn Thường và nhận Prism Beam, 241 EXP, 110 Core Bit. Kiểm bot không né cấp 7/build Core vẫn thua được giữ nguyên.

Kết quả xác nhận mục tiêu trong mô phỏng; không suy ra người thật thắng trong cùng thời gian. Máy đọc vị trí/báo đòn đúng từng bước 60 Hz; tỷ lệ trúng 84–87% chưa được xác thực trên người. Không chỉnh cân bằng hay gói chơi thử từ số liệu này.

## Còn cần người chơi thật

- Từ bản cục bộ mở `/?debug=1&lumen=1` (không đặt `gate=1`). PC: A/D hoặc mũi tên, J bắn (giữ để nạp), K nhảy, L lướt, S+K để rơi xuyên bục. Trên Pixel 7 nằm ngang: cần trái và các nút Bắn/Nhảy/Lướt.
- Ghi cấp, độ khó, số lần thử, thời gian từ đóng cổng đến lúc thắng, vũ khí đã dùng và ảnh mốc vào phòng/chuyển pha/thắng. Phân biệt kết quả phòng thử cấp 1 với tiêu chí cân bằng cấp 5. Thử riêng Thử thách để kiểm Tiêu Điểm.
- Chưa có bằng chứng Chromium PC / Pixel 7 cho bản cục bộ; không đóng Story hoặc thay bản G1.

## Gói QA ngoại tuyến (cấp 5)

Gói riêng dùng Vite mode `lumen-qa`; URL không bật được mode này ở bản thường. Mở thẳng Lumen Thường, Arc Cannon là vũ khí duy nhất lúc bắt đầu. Không đăng ký menu chiến dịch, không mở bản lưu hay đo lường, cài đặt điều khiển chỉ ở bộ nhớ. Thêm `?challenge=1` để kiểm Tiêu Điểm riêng. Đồng hồ HUD đếm bước logic của từng trận; bảng kết quả hiện đúng thời gian lượt thắng. Khi tạm dừng hoặc đọc thoại, không có bước logic trận nên đồng hồ ngừng.

Dựng từ thư mục `game` với Node 22, sau khi áp các lớp vá:

```sh
npm ci
npm run sync-data
npx --no-install vite build --mode lumen-qa --outDir dist-lumen-qa
```

Phục vụ thư mục kết quả qua HTTP loopback; nếu dùng gói ZIP đi kèm thì xem `README-VI.txt`. Không đưa bản QA lên Pages hay thay thế build cổng G1.


## Hồi quy Arc Cannon khi tạm dừng hoặc có thoại

```sh
npm test -- tests/lumen-scene-input.test.ts
```

Ở bản trước, nhả Bắn trong menu tạm dừng có thể giữ lại đòn nạp; lần nhấn nhanh sau đó hoặc đóng menu ngay bằng chạm sẽ bắn nhầm đạn nạp. Thoại ở cổng cũng giữ lại nạp cũ. Hồi quy chạy `StageScene.update` và `StageWorld` thật: bỏ nạp nếu thao tác nhả bị giao diện giữ lại, không làm đồng hồ trận chạy; vẫn giữ nạp nếu phím Bắn còn giữ trên thiết bị khác hoặc nạp đã cất khi đổi sang Vine Lash. Không đổi thông số cân bằng.


## Hồi quy khi hệ thống hủy điểm chạm

```sh
npm test -- tests/lumen-scene-input.test.ts tests/input-aggregator.test.ts
```

`pointercancel` và `lostpointercapture` phải bỏ giữ, không bắn nhầm Arc Cannon đã nạp hay bỏ sót lần nhả của ngón/thiết bị khác. Cần ảo mất điểm chạm phải dừng ngay; cử chỉ vuốt hoặc kéo chỉnh bị hủy không được đổi vũ khí hay lưu vị trí. Chạm thật (kể cả nhanh, đa chạm và khi trình duyệt báo mất bắt chạm sau khi nhả) vẫn hoạt động. Kiểm bằng lớp nhận sự kiện của TouchOverlay, InputAggregator, StageScene và StageWorld; DOM dựng tối thiểu, không tính là nghiệm thu trình duyệt hoặc thiết bị. Tự tạm dừng toàn trang khi ẩn và mất tay cầm vẫn là QB-90.
