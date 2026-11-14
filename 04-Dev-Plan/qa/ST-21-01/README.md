# ST-21-01: chuỗi hướng dẫn khi chơi lại (QB-88)

- **Bản chạy:** `npm run build` + `vite preview`, Chromium + Playwright, `?debug=1`, 14/11/2026.
- **Cách dựng tình huống:** bản lưu đã xong S01–S09 (như người chơi thoát giữa trận Thorna sau khi đổi pha), vào phòng Thorna qua màn Chuẩn bị, rồi đưa Kai vào đấu trường và bỏ qua thoại boss.

| Ảnh | Bản | Bước hướng dẫn đang hiện | Kết quả |
| --- | --- | --- | --- |
| `truoc-khi-sua-dau-man.png` | Code cũ | S10 ngay đầu màn ("Nó đang dồn sức…") | Lỗi: lời trận boss khi chưa thấy boss |
| `truoc-khi-sua-vao-lai-phong-boss.png` | Code cũ | S10 (vẫn là hộp từ đầu màn) | — |
| `sau-khi-sua-dau-man.png` | ST-21-01 | Không có | Đúng QB-88 |
| `sau-khi-sua-vao-lai-phong-boss.png` | ST-21-01 | S10 | Đúng: chuỗi chạy tiếp khi vào lại phòng boss |

- **Lỗi console:** 0 ở cả hai bản.
- **Bản thử G1:** không đổi; màn xám của link `?gate=1` không có hướng dẫn.
