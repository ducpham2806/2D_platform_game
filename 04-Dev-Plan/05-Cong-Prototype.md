# Cổng Prototype

Cổng này trả lời một câu hỏi trước khi làm Vertical slice: **nhảy, lướt, bắn có "sướng" trên cả máy tính và điện thoại cảm ứng không?** (GDD mục 16; cảm ứng là tiêu chí chính). Bản chơi thử là màn xám 96 ô và boss xám của Sprint 2–4.

Tài liệu gồm: tiêu chí, kết quả đo tự động, quy trình chơi thử với người thật, cách chỉnh cảm giác, và quy tắc quyết định. Kết quả các đợt thử ghi ở mục 7.

## 1. Tiêu chí

| Nhóm | Tiêu chí | Nguồn | Đo bằng |
|---|---|---|---|
| Cảm giác | Điểm Nhảy, Lướt, Bắn đều ≥ 4/5 từ ít nhất 4 trong 5 người thử; tính **riêng cho cảm ứng** và cho máy tính | GDD 16, `04-Test-va-Launch.md` mục 2 | Phiếu chấm trong game sau lần thắng boss đầu tiên |
| Bỏ cuộc | Không quá 30% phiên chưa thắng boss dừng ở cùng một đoạn | GDD 17 | Nhật ký chơi thử (đoạn cuối cùng của phiên) |
| Cân bằng điều khiển | Số lần chết mỗi phút trên cảm ứng không cao hơn bàn phím quá 40% | GDD 17 | Nhật ký chơi thử theo thiết bị chính |
| Boss | Thắng được chỉ bằng Arc Cannon; mọi đòn có báo trước ≥ 0,5 s; không đòn nào ≥ máu Kai cấp 1 | GDD 9 | Test tự động (`tests/boss.test.ts`, `tests/stage-world.test.ts`) và kiểm tra dữ liệu lúc nạp |
| Hiệu năng | 60 FPS trên điện thoại tầm trung (đo: ≥ 55 FPS khi CPU chậm 4×, trong phòng boss lúc có Mưa đạn) | GDD 15 | `npm run gate-check` |
| Độ trễ | Từ lúc bấm đến khung hình có phản hồi ≤ 50 ms | GDD 15 | `npm run gate-check` |
| Tải | Tải đầu ≤ 30 MB; vào game ≤ 3 s | GDD 15, 17 | `npm run gate-check` |

Nhật ký chỉ tính phiên dài ít nhất 10 giây. Các ngưỡng "hỏng" ở màn Kết quả chơi thử chỉ hiện khi đủ dữ liệu: ít nhất 3 phiên chưa thắng (bỏ cuộc), 3 lượt chấm mỗi thiết bị (điểm cảm giác).

## 2. Kết quả đo tự động

Chạy ngày 2026-11-02 bằng `npm run build && npm run gate-check` (Chromium không giao diện, khung 960 × 540).

| Hạng mục | Kết quả | Ngưỡng | Đánh giá |
|---|---|---|---|
| Tải đầu (`dist/`) | 1,35 MB (nén gzip 0,37 MB) | ≤ 30 MB | Đạt |
| Vào game: máy tính | 0,51 s | ≤ 3 s | Đạt |
| Vào game: CPU chậm 4× + mạng 4G ước tính | 2,28 s (1,30 s chạy + 0,98 s tải bản nén qua 4 Mbps) | ≤ 3 s | Đạt |
| FPS phòng boss (pha cuối, có Mưa đạn): máy tính | 60,0; khung > 22 ms: 0%; một bước logic 0,06 ms | ≥ 55 | Đạt |
| FPS phòng boss: CPU chậm 4× | 60,1; khung > 22 ms: 0%; bước logic 0,21 ms | ≥ 55 | Đạt |
| FPS phòng boss: CPU chậm 6× (máy yếu) | 60,0; khung > 22 ms: 0,2%; bước logic 0,28 ms | ≥ 55 | Đạt |
| Độ trễ phím: trang nhận sự kiện → khung hình có phản hồi | trung vị 10,0 ms, p95 13,9 ms (15 lần) | p95 ≤ 50 ms | Đạt |
| Độ trễ chạm (CPU chậm 4×): trang nhận sự kiện → khung hình | trung vị 11,2 ms, p95 13,8 ms (15 lần) | p95 ≤ 50 ms | Đạt |

Hai giới hạn của bài đo, cần xác nhận trên máy thật ở buổi chơi thử:

- **Độ trễ chạm tính cả trình duyệt** là trung vị 43 ms, p95 56 ms. Khoảng 30 ms trong đó nằm trước khi trang nhận được sự kiện: đó là đường đi sự kiện chạm của Chromium không giao diện, game không kiểm soát được (phím chỉ mất dưới 1 ms ở chặng này). Phần của game là khoảng 11 ms (một khung hình). Trên điện thoại thật còn thêm độ trễ của màn hình cảm ứng; cần người thử nói có thấy "trễ" không.
- **FPS:** chế độ CPU chậm chỉ làm chậm phần JavaScript; phần vẽ chạy bằng WebGL phần mềm (SwiftShader) không bị làm chậm theo. Vì vậy phải xem FPS thật trên điện thoại: mở link với `?debug=1`, số FPS hiện ở góc dưới trái màn thử.

Phần logic còn rất dư: một bước logic tốn 0,3 ms ở CPU chậm 6×, so với 16,7 ms của một khung hình.

**Lưu ý bản build (02/11/2026, Sprint 6):** các bản trước Sprint 6 có lỗi chết lặp: sau lần chết đầu tiên, Kai hồi sinh rồi chết lại liên tục. Chỉ dùng bản build từ Sprint 6 trở đi cho đợt chơi thử. Từ Sprint 6, rơi hố theo đặc tả Stage 1 (mất 20 máu, về checkpoint, không chết nếu còn máu); nhật ký vẫn tính rơi hố là một lần hỏng ở đoạn đó.

## 3. Bản web để chơi thử

Workflow `.github/workflows/pages.yml` build và đăng `game/dist` lên GitHub Pages mỗi khi `main` có thay đổi (hoặc bấm chạy tay ở tab Actions). Nó chạy test trước, nên không đăng bản có dữ liệu `03-Data` lệch nhau.

**Bật một lần:** trên GitHub, vào Settings → Pages → Build and deployment → Source chọn **GitHub Actions**. Sau đó chạy workflow "Pages" (tab Actions → Pages → Run workflow) hoặc merge một PR vào `main`.

| Link | Dùng cho |
|---|---|
| `https://ducpham2806.github.io/2D_platform_game/` | Người thử (bản gốc, không có công cụ) |
| `…/?debug=1` | Xem FPS và trạng thái trên máy thật |
| `…/?tune=1` | Người làm game chỉnh cảm giác (mục 5) |

## 4. Quy trình chơi thử với người thật

**Người thử:** 5 người mỗi đợt, chưa từng xem game, ngoài nhóm làm game (`04-Test-va-Launch.md` mục 2). Ít nhất 3 người chơi bằng **điện thoại cảm ứng** (cầm ngang), ít nhất 2 người chơi bằng bàn phím hoặc tay cầm trên máy tính.

**Trong buổi thử:**

1. Gửi link bản gốc. Không giải thích cách chơi; chỉ nói "chơi tới khi hạ được boss, tối đa 15 phút".
2. Quan sát hoặc quay màn hình. Ghi lại chỗ người thử dừng lại lâu, chỗ chết nhiều, câu họ tự nói ra.
3. Sau lần thắng boss đầu tiên, game tự hỏi phiếu chấm Nhảy / Lướt / Bắn (1 tệ – 5 rất sướng). Người thử chấm theo cảm giác, không cần nghĩ lâu.
4. Hỏi thêm 3 câu: Có lúc nào bấm mà nhân vật không làm theo không? Nút cảm ứng có chỗ nào khó với tới không? Muốn chơi tiếp màn thật không?
5. Người thử về màn hình chính (Esc hoặc nút II), chọn **Kết quả chơi thử → Sao chép JSON** và gửi đoạn chữ đó cho người tổng hợp (Zalo, email…). Nhật ký chỉ nằm trên máy người thử, game không tự gửi đi đâu.

**Tổng hợp:**

1. Người tổng hợp mở link trên máy mình → **Kết quả chơi thử → Gộp nhật ký**, dán từng đoạn JSON rồi bấm Gộp (dán trùng không bị tính hai lần).
2. Màn Kết quả hiện: số phiên, bảng theo thiết bị (phút chơi, chết mỗi phút, số lần thắng boss, thời gian thắng trung vị, điểm Nhảy/Lướt/Bắn), số lần chết theo đoạn, đoạn mà các phiên chưa thắng dừng lại. Dấu hiệu "hỏng" theo GDD 17 hiện màu cam ở đầu bảng.
3. Ghi kết quả vào mục 7. Lưu đoạn JSON đã gộp (Sao chép JSON trên máy người tổng hợp) vào `04-Dev-Plan/playtest/` để so sánh giữa các đợt.

Các đoạn của màn xám: Xuất phát + bia, Khe 2 ô, Bậc + bia khiên, Bục một chiều, Giếng nhảy tường, Hành lang thấp, Hố lướt + nhảy, Phòng boss (`game/src/stages/gray-box.ts`).

## 5. Chỉnh cảm giác

Mở link có `?tune=1` (bản dev `npm run dev` luôn bật), vào màn thử rồi bấm nút **Chỉnh** ở giữa trên cùng hoặc phím F2. Trận dừng lại; mỗi thông số là một thanh trượt: tốc độ chạy, nhảy cao/thấp, thời gian lên đỉnh, rơi, coyote time, jump buffer, lướt, bám và nhảy tường, Arc Cannon (nhịp bắn, tốc độ đạn, thời gian nạp), máu và nhịp nghỉ của boss xám.

- **Chơi tiếp:** áp ngay cho Kai và vũ khí; thông số boss áp từ trận sau (hồi sinh hoặc ra rồi vào lại phòng boss). Phần đã chỉnh lưu trên máy đó và chỉ có tác dụng khi mở bằng `?tune=1`, nên người thử dùng link gốc vẫn chơi bản gốc.
- **Sao chép JSON:** chỉ xuất phần đã đổi, gom theo file (`player`, `weapons`, `boss` = boss `gray` trong `bosses.json`). Dán giá trị vào `03-Data` qua một PR; test sẽ báo nếu giá trị phá ràng buộc thiết kế.
- **Đặt lại:** về dữ liệu gốc.

## 6. Quy tắc quyết định

- **Qua cổng** khi mọi tiêu chí ở mục 1 đạt ở cùng một bản build, với một đợt 5 người mới. Khi đó tiếp tục Vertical slice với thông số đã chốt.
- **Chưa qua:** sửa theo thứ tự, không thêm hệ thống mới:
  1. Điều khiển cảm ứng: vị trí, kích thước nút, Assist (tự bắn, hỗ trợ ngắm), độ nhạy cần ảo.
  2. Thông số cảm giác qua bảng chỉnh (mục 5), rồi đưa vào `03-Data`.
  3. Thiết kế đoạn có nhiều người bỏ cuộc: nới khe né, thêm checkpoint, trước khi chỉnh chỉ số kẻ địch hay boss.
  4. Thử lại với một đợt người thử mới (người cũ đã quen tay).
- Vertical slice có thể bắt đầu song song về phần mã (kẻ địch, Tiled, lưu cục bộ) vì không phụ thuộc thông số cảm giác; nhưng **không chốt thiết kế màn Prologue và Stage 1** trước khi qua cổng.

## 7. Kết quả các đợt thử

| Đợt | Ngày | Bản build (commit) | Người thử (cảm ứng / PC) | Điểm N / L / B cảm ứng | Điểm N / L / B PC | Dấu hiệu hỏng | Quyết định |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |

## 8. Chạy lại bài đo

```
cd game
npm run build
npm run gate-check              # in bảng kết quả, mã thoát 1 nếu có hạng mục chưa đạt
npm run gate-check -- --json gate.json
```

Cần Playwright và Chromium (`npm i -g playwright && npx playwright install chromium`, hoặc đặt `CHROMIUM_PATH` tới một Chrome có sẵn). Script tự chạy `vite preview` ở cổng 4179 rồi tắt khi xong.
