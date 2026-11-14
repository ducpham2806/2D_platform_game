# Bằng chứng chạy thử (Look rule)

Mỗi Story có thay đổi người chơi nhìn thấy có một thư mục `04-Dev-Plan/qa/<mã Story>/` (tương ứng `production/qa/evidence/` của Game Studio Agent).

Quy ước:

- Tên ảnh: `<thiết bị>-<số thứ tự>-<nội dung>.png`; thiết bị `pc` (960 × 576, tỉ lệ 2) hoặc `touch` (Pixel 7 ngang giả lập).
- Mỗi thư mục mới có `README.md` ngắn: commit, thiết bị, AC nào ứng với ảnh nào, số lỗi console, lệnh hoặc kịch bản đã chạy.
- Chạy thử bằng Chromium + Playwright trên bản build (`npm run build`, `vite preview`). Máy thật (Android yếu, Android trung, Safari iOS) kiểm ở mỗi cổng (`05-Cong-Prototype.md`, `08-Cong-MVP.md`).
- Thư mục trước ngày 15/11/2026 chưa có README; thông tin tương ứng nằm ở mục "Kết quả chạy thử" của Story.
