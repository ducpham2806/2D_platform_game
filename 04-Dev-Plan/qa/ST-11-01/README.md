# ST-11-01: vùng an toàn (QB-92)

- **Bản chạy:** `npm run build` + `vite preview`, Chromium 153 + Playwright, 14/11/2026 (commit ST-11-01).
- **Giả lập tai thỏ:** CDP `Emulation.setSafeAreaInsetsOverride`.
- **Thiết bị và kết quả (AC-4):**

| Ảnh | Thiết bị | Vùng an toàn (trên, phải, dưới, trái) | Kết quả |
| --- | --- | --- | --- |
| `iphone14-tran.png`, `iphone14-xuong.png` | iPhone 14 ngang 750 × 340, dpr 3 | 0, 47, 21, 47 | Canvas 108–642 (×6), không nút nào lọt vùng an toàn, bảng Xưởng 55–695 |
| `pixel7-tran.png`, `pixel7-xuong.png` | Pixel 7 ngang 863 × 360, dpr 2,625 | 0, 0, 16, 32 | Canvas dời sang phải, căn giữa phần còn lại; nút, bảng trong vùng an toàn |
| `pixel7-khong-tai-tho-*.png` | Pixel 7 ngang | 0, 0, 0, 0 | Như trước khi sửa (đối chứng) |

- **Lỗi console:** 0 ở cả 3 cấu hình.
- **Luồng người thử:** `npm run gate-flow` đạt cả PC và cảm ứng.
- **Chưa kiểm:** máy thật có tai thỏ (iPhone, Android đục lỗ) ở buổi chơi thử G1.
