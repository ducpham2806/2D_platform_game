# ST-14-08: hộp chữ thuần (QB-70…72), chạy thử

- **Bản chạy:** build của nhánh `ccr-9de01342-2046rb` (14/11/2026), `vite preview`, Chromium 960 × 576, `?debug=1`, bản lưu mới.
- **Kịch bản:** `chay-thu.mjs` (gọi từ `game/`: `node ../04-Dev-Plan/qa/ST-14-08/chay-thu.mjs <thư mục ảnh>`). Vào phòng Thorna (có bản lưu nên có gợi ý chết), cho Kai chết 3 lần bằng hàm debug, mở menu tạm dừng 9 s, đóng menu, chờ hết giờ đọc. Kết quả: ĐẠT, 0 lỗi console.

| Ảnh                             | AC  | Nội dung                                                                                   |
| ------------------------------- | --- | ------------------------------------------------------------------------------------------ |
| `pc-1-goi-y-hien.png`           | 4   | Sau lần chết thứ 3: NOVA gợi ý chế độ Cốt truyện (còn 3,68 s)                              |
| `pc-2-tam-dung-9s-goi-y-an.png` | 4   | Menu tạm dừng mở 9 s: gợi ý ẩn, thời gian còn lại đứng yên (3,62 s lúc mở menu và sau 9 s) |
| `pc-3-dong-menu-van-con.png`    | 4   | Đóng menu: gợi ý hiện lại (trước ST-14-08 nó đã hết giờ trong lúc tạm dừng)                |
| `pc-4-het-gio.png`              | 4   | Hết thời gian đọc: hộp tự tắt                                                              |

Trường hợp hội thoại che gợi ý, hủy khi chờ quá 10 s, hủy khi vào đấu trường: kiểm bằng test thuần (`game/tests/text-boxes.test.ts`), vì trong phòng Thorna hiện tại thoại trước trận chỉ mở đúng lúc vào đấu trường, lúc đó gợi ý đã bị hủy.
