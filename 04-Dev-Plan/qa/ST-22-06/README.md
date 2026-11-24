# Chạy thử ST-22-06 · Phòng thử 3D

Ảnh chụp từ bản build của commit chứa Story ST-22-06 trên `codex/asset-3d-plan`. Hai lượt chạy bằng đầu vào thật của trình duyệt. Đồng hồ trong phòng ghi thời gian mô phỏng, trừ thời gian tạm dừng.

| Lượt Chromium | Thời gian | Lần rơi | Phát bắn | Lỗi console |
| --- | ---: | ---: | ---: | ---: |
| Bàn phím, 960 × 576, chất lượng mặc định | 64,7 s | 0 | 1 | 0 |
| Pixel 7 ngang giả lập, cần và nút chạm, `?q=low` | 66,3 s | 1 | 1 | 0 |

- Camera 3/4, Kai GLB và kit xuất hiện ở [điểm xuất phát](pc-01-tram-phan-luc.png). Cùng tuyến trong [chế độ khối xám](pc-05-khoi-xam.png).
- Cả hai lượt nhảy hết hai dãy bục, bắn Arc Cannon mở cổng, lướt dọc cầu và qua hai checkpoint. [Nhảy trên PC](pc-02-nhay-lech-chieu-sau.png), [nhảy trên cảm ứng](touch-02-nhay-lech-chieu-sau.png), [cổng mở](touch-03-cong-da-mo.png).
- Lượt PC tạm dừng, đồng hồ đứng yên. Lượt cảm ứng chủ động rơi sau khi mở cổng và trở lại checkpoint với cổng vẫn mở. [Kết quả bàn phím](pc-04-ket-qua.png), [kết quả cảm ứng](touch-04-ket-qua.png).
- Còn đo tải, FPS và khả năng đọc điểm đáp với người chơi trên Android và iPhone thật theo [ADR-003](../../adr/ADR-003-do-hoa-25d-threejs.md#5-thử-3d-platformer-ngày-23112026).

Từ `game/`, dùng Playwright và Chromium đã cài. `CHROMIUM_PATH` có thể trỏ tới Chromium cài riêng.

```sh
npm run build
node ../04-Dev-Plan/qa/ST-22-06/chay-thu.mjs pc
node ../04-Dev-Plan/qa/ST-22-06/chay-thu.mjs touch
```
