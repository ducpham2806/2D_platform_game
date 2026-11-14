# Quyết định đã chốt: Cổng Prototype và bản người thử

Nhật ký chơi thử, Pages, bản `?gate=1`. Tách từ `game/CONTEXT.md` ngày 15/11/2026 để giảm phần đọc đầu phiên; chỉ đọc khi làm việc với module này.

- **Cổng Prototype:** mỗi lần vào màn thử là một phiên nhật ký (thời gian theo thiết bị, chết theo đoạn, lượt đánh và thời gian thắng boss, điểm 1–5) lưu ở `localStorage` `cv.playtest` (tối đa 200 phiên, phiên < 10 s không lưu). Không gửi đi đâu: người thử sao chép JSON và gửi tay; người tổng hợp gộp ở màn Kết quả chơi thử. Bảng chỉnh cảm giác (`?tune=1`, F2) đổi thông số ngay qua `world.retune()`, lưu phần đã đổi ở `cv.tuning` và chỉ áp khi bật `?tune=1`. Khi bảng HTML mở thì trận dừng hẳn (không bù bước khi đóng), lớp cảm ứng ẩn, phím bấm trong bảng không lọt vào game (`KeyboardSource` bỏ qua phím có đích nằm trong `.cv-panel`).
- Bản web đăng lên GitHub Pages bằng `.github/workflows/pages.yml` mỗi khi `main` đổi (đường dẫn tương đối `base: './'` nên chạy được ở thư mục con của Pages).
- **Bản cho người thử (`?gate=1`, cổng Prototype).** Menu chỉ còn Chơi (màn xám), Điều khiển, Kết quả chơi thử; menu tạm dừng ẩn mục "chưa có" và hàng cao ≥ 48 dp. `npm run gate-flow` chạy thử trọn luồng người thử trên bản build (máy tính + Pixel 7): menu → hạ boss → phiếu chấm → xuất JSON → gộp. Chạy trước mỗi đợt thử.
