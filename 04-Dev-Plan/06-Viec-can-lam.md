# Việc chủ dự án cần làm

Những việc chỉ chủ dự án làm được (quyền GitHub, người thử thật, điện thoại thật, quyết định thiết kế, asset). Cập nhật 2026-11-02. Phần đã làm xong xem `01-Ke-hoach-lam-viec.md` mục 5.

Đánh dấu `[x]` khi xong.

## 1. Ngay bây giờ

- [ ] **Bật GitHub Pages:** trên GitHub, Settings → Pages → Build and deployment → Source chọn **GitHub Actions**. Sau đó vào tab Actions → **Pages** → Run workflow. Khi chạy xong, link chơi thử là https://ducpham2806.github.io/2D_platform_game/. Chưa bật thì workflow Pages báo lỗi mỗi lần merge (CI vẫn bình thường).
- [ ] **Mở link trên điện thoại thật** (cầm ngang), kiểm tra:
  - Nút cảm ứng dễ bấm, không bị che, nhảy/bắn không thấy trễ.
  - FPS: mở link có `?debug=1`, số FPS hiện ở góc dưới trái màn thử; mục tiêu khoảng 60 trên máy tầm trung (~3 GB RAM).
  - Ghi kết quả vào `05-Cong-Prototype.md` mục 2 (phần cần xác nhận trên máy thật).

## 2. Cổng Prototype (quyết định có sang Vertical slice không)

Quy trình đầy đủ ở `05-Cong-Prototype.md` mục 4–6.

- [ ] Tìm **5 người thử** chưa từng xem game, ít nhất 3 người chơi bằng điện thoại cảm ứng.
- [ ] Gửi link bản gốc (không có `?tune`), không giải thích cách chơi; quan sát chỗ dừng, chỗ chết, câu họ nói.
- [ ] Sau buổi thử, mỗi người vào **Kết quả chơi thử → Sao chép JSON** và gửi lại cho anh.
- [ ] Trên máy anh: **Kết quả chơi thử → Gộp nhật ký**, dán từng đoạn JSON; đọc bảng và các dòng cam ("hỏng").
- [ ] Ghi kết quả vào `05-Cong-Prototype.md` mục 7; lưu JSON đã gộp vào `04-Dev-Plan/playtest/`.
- [ ] **Quyết định:** qua cổng (điểm Nhảy/Lướt/Bắn ≥ 4/5 từ ít nhất 4 người, riêng cảm ứng và PC; không đoạn nào > 30% người bỏ cuộc; cảm ứng không chết nhiều hơn bàn phím quá 40%) hay sửa rồi thử đợt mới.
- [ ] Nếu cần chỉnh cảm giác: mở link có `?tune=1`, chỉnh thanh trượt, **Sao chép JSON** phần đã đổi, gửi cho người code để đưa vào `03-Data`.

## 3. Xác nhận cách hiểu đặc tả (kẻ địch M5)

Đặc tả chưa nói rõ nên đã chọn tạm như sau (ghi ở `01-GDD/02-Dac-ta-Prologue-Stage1.md` mục 4). Đồng ý thì đánh dấu, không thì ghi cách muốn:

- [ ] Lính Kén: "2 phát" là 2 phát **nạp đầy** làm vỡ khiên; bắn từ phía sau thì trúng ngay; đứng sau lưng nó quá 0,8 s thì nó quay lại.
- [ ] Drone Lính **bay lơ lửng** đi tuần và bắn nhắm vào người chơi (không đi dưới đất).
- [ ] Core Bit rơi thành vật phẩm **phải đi qua để nhặt**, biến mất sau 10 s (để module Magnet Core có ý nghĩa); EXP cộng ngay khi hạ.
- [ ] Người chơi chết thì **mọi kẻ địch dựng lại**; Core Bit và EXP đã nhặt vẫn giữ.
- [ ] Viên hồi máu hồi 20 máu (đặc tả chỉ ghi tỉ lệ rơi 8%).

## 4. Asset (đang là điểm nghẽn: game vẫn dùng khối màu giữ chỗ)

Theo `05-Assets/01-Huong-dan-asset.md` và `05-Assets/02-Prompt-asset.md`:

- [ ] Style bible, tờ thiết kế Kai, bảng màu (việc của Sprint 1 bên asset).
- [ ] **Nhóm P0:** Kai idle, run, nhảy, đáp; hiệu ứng Arc Cannon; nổ nhỏ; ô gạch xám. Chạy `05-Assets/tools/validate_assets.py` trước khi đưa vào `game/public/assets`.
- [ ] **Nhóm P1** (cần cho Vertical slice): toàn bộ Prologue và Stage 1, gồm 5 kẻ địch thường, Bramble Golem, Thorna, tileset phòng thí nghiệm và vườn, UI cơ bản.

## 5. Quyết định cho Vertical slice

- [ ] Ai dựng bản đồ Prologue và Stage 1 trong **Tiled** (M7): anh tự vẽ theo đặc tả, hay để người code dựng bản đầu rồi anh chỉnh.
- [ ] Merge các pull request của từng sprint khi CI xanh, và báo người code làm sprint tiếp theo (kế hoạch ở `01-Ke-hoach-lam-viec.md` mục 5.4).

## 6. Sau này (chưa cần bây giờ)

- [ ] Chỉnh các số `[PLACEHOLDER]` trong `03-Data` theo kết quả chơi thử (Prologue ≥ 90% hoàn thành, Stage 1 ≥ 70%).
- [ ] Trước giai đoạn 2: tư vấn pháp lý cho độ tuổi 13+, đồng ý quảng cáo (UMP/ATT), công bố tỷ lệ, subscription (GDD mục 18).
