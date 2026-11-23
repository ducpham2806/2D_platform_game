# ST-15-09 · Prism Sentinel và Gale Roc

Bản build của commit ST-15-09 trên nhánh phát triển, sau `f9a6d11`. Kiểm bằng Chromium qua Playwright với PC 960 × 576 và Pixel 7 ngang giả lập.

| Ảnh | Điều kiện kiểm |
| --- | --- |
| [PC 01](pc-01-prism-bao-tia.png), [PC 02](pc-02-prism-tia-doi.png) | Tia Phản Xạ ở Thường. Giữ và thả J để đạn nạp vừa xoay gương. Tia đổi hướng, gây 10 máu và làm Sentinel hở. |
| [PC 03](pc-03-roc-bao-bo-nhao.png), [PC 04](pc-04-roc-ho-sau-khi-dap.png) | Gale Roc báo hướng bổ nhào rồi hở trên sàn. |
| [Pixel 7 01](touch-01-prism-bao-hai-tia.png), [Pixel 7 02](touch-02-prism-hai-xung.png) | Tia Kép báo cả hai hướng. Xung thứ hai dùng góc đối diện và có màu tím. |
| [Pixel 7 03](touch-03-roc-bao-mua-long.png), [Pixel 7 04](touch-04-roc-mua-long.png) | Vạch các cột Mưa Lông Thép và tám lông rơi. |
| [Pixel 7 05](touch-05-roc-bao-bo-nhao.png), [Pixel 7 06](touch-06-roc-song-dat.png) | Hướng bổ nhào và hai sóng đất của Xoáy Lông khi đáp. |

Chạy `npm run build` rồi mở Vite preview với `?debug=1`. Chọn **Mini-boss S2–4** hoặc **Mini-boss Thử thách**. Kịch bản đi qua cửa bằng bàn phím hoặc cần ảo để kiểm khóa phòng và camera. Kịch bản đặt máu, vị trí tập và kết thúc trận Sentinel qua `__cvWorld` để lặp được các tình huống. Bắn đổi gương trên PC đi qua đầu vào và luồng đạn thật. Kiểm thời lượng báo, mở cửa, hồi sinh, thưởng và luật va chạm bằng `tests/room-boss.test.ts`. Mỗi phiên Chromium ghi 0 lỗi console.
