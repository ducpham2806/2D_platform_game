# ST-15-14: boss an toàn (QB-14, QB-31), chạy thử

- **Bản chạy:** build nhánh `ccr-9de01342-2046rb` (15/11/2026), `vite preview`, Chromium 960 × 576, `?debug=1`, bản lưu mới. Kết quả: ĐẠT, 0 lỗi console.
- **Kịch bản:** `chay-thu.mjs` (gọi từ `game/` sau `npm run build`: `node ../04-Dev-Plan/qa/ST-15-14/chay-thu.mjs <thư mục ảnh>`). Vào phòng Thorna, vào đấu trường, bỏ qua thoại, đưa Kai lại gần boss, cho boss nhận một đòn 80% máu (hàm debug, vì vũ khí hiện có không đủ mạnh để vượt hai ngưỡng).

| Ảnh                       | Nội dung                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `pc-1-truoc-don.png`      | Trước đòn: pha 1, đầy máu                                                                   |
| `pc-2-kep-pha-bat-tu.png` | Sau đòn: thanh máu dừng ở 60% (không phải 20%), "pha 2", boss trắng suốt lúc bất tử đổi pha |
| `pc-3-het-bat-tu.png`     | Sau 0,6 s: boss trở lại màu thường, vẫn 60%                                                 |

QB-14 (chống khóa choáng) không có thay đổi hình riêng; kiểm bằng test `game/tests/boss-safety.test.ts`.
