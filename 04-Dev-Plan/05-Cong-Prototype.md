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

Chạy lại ngày 2026-11-14 (sau M8: cây kỹ năng, Xưởng, khiên...) bằng `npm run build && npm run gate-check` (Chromium không giao diện, khung 960 × 540). Lần đo 02/11 cho kết quả tương tự (tải 1,35 MB, vào game 2,28 s ở CPU chậm 4×).

| Hạng mục | Kết quả | Ngưỡng | Đánh giá |
|---|---|---|---|
| Tải đầu (`dist/`) | 1,50 MB (nén gzip 0,42 MB) | ≤ 30 MB | Đạt |
| Vào game: máy tính | 0,81 s | ≤ 3 s | Đạt |
| Vào game: CPU chậm 4× + mạng 4G ước tính | 2,51 s (1,44 s chạy + 1,07 s tải bản nén qua 4 Mbps) | ≤ 3 s | Đạt |
| FPS phòng boss (pha cuối, có Mưa đạn): máy tính | 60,0; khung > 22 ms: 0,2%; một bước logic 0,08 ms | ≥ 55 | Đạt |
| FPS phòng boss: CPU chậm 4× | 60,1; khung > 22 ms: 0%; bước logic 0,32 ms | ≥ 55 | Đạt |
| FPS phòng boss: CPU chậm 6× (máy yếu) | 59,5; khung > 22 ms: 1,0%; bước logic 0,52 ms | ≥ 55 | Đạt |
| Độ trễ phím: trang nhận sự kiện → khung hình có phản hồi | trung vị 6,3 ms, p95 13,0 ms (15 lần) | p95 ≤ 50 ms | Đạt |
| Độ trễ chạm (CPU chậm 4×): trang nhận sự kiện → khung hình | trung vị 10,5 ms, p95 23,0 ms (15 lần) | p95 ≤ 50 ms | Đạt |

Hai giới hạn của bài đo, cần xác nhận trên máy thật ở buổi chơi thử:

- **Độ trễ chạm tính cả trình duyệt** là trung vị 50 ms, p95 74 ms (02/11: 43 ms, 56 ms). Khoảng 30 ms trong đó nằm trước khi trang nhận được sự kiện: đó là đường đi sự kiện chạm của Chromium không giao diện, game không kiểm soát được (phím chỉ mất dưới 1 ms ở chặng này). Phần của game là khoảng 11 ms (một khung hình). Trên điện thoại thật còn thêm độ trễ của màn hình cảm ứng; cần người thử nói có thấy "trễ" không.
- **FPS:** chế độ CPU chậm chỉ làm chậm phần JavaScript; phần vẽ chạy bằng WebGL phần mềm (SwiftShader) không bị làm chậm theo. Vì vậy phải xem FPS thật trên điện thoại: mở link với `?debug=1`, số FPS hiện ở góc dưới trái màn thử.

Phần logic còn rất dư: một bước logic tốn 0,5 ms ở CPU chậm 6×, so với 16,7 ms của một khung hình.

**Lưu ý bản build (02/11/2026, Sprint 6):** các bản trước Sprint 6 có lỗi chết lặp: sau lần chết đầu tiên, Kai hồi sinh rồi chết lại liên tục. Chỉ dùng bản build từ Sprint 6 trở đi cho đợt chơi thử. Từ Sprint 6, rơi hố theo đặc tả Stage 1 (mất 20 máu, về checkpoint, không chết nếu còn máu); nhật ký vẫn tính rơi hố là một lần hỏng ở đoạn đó.

## 3. Bản web để chơi thử

Workflow `.github/workflows/pages.yml` build và đăng `game/dist` lên GitHub Pages mỗi khi `main` có thay đổi (hoặc bấm chạy tay ở tab Actions). Nó chạy test trước, nên không đăng bản có dữ liệu `03-Data` lệch nhau.

**Bật một lần:** trên GitHub, vào Settings → Pages → Build and deployment → Source chọn **GitHub Actions**. Sau đó chạy workflow "Pages" (tab Actions → Pages → Run workflow) hoặc merge một PR vào `main`. Repo chuyển **công khai** ngày 14/11/2026 (gói Free chỉ có Pages cho repo công khai); chuyển công khai không tự bật Pages, vẫn phải chọn Source như trên.

**Trước đợt 1:** PR #10 đã merge vào `main` (`eeb8ca1`, 14/11/2026). Workflow Pages lần #5 trên `main`: test, build đạt; dừng ở `configure-pages` vì repo chưa bật Pages (lần #4 ngày 3/11 và lần #6 sau khi chuyển công khai cũng vậy). Người dùng bật Pages cùng ngày; lần #7 đăng thành công bản `eeb8ca1` lên `https://ducpham2806.github.io/2D_platform_game/`. Trước khi gửi link, mở `?gate=1` trên một điện thoại để chắc chắn trang đã cập nhật (menu chỉ còn 3 nút). Trong lúc người thử đang chơi, không merge gì vào `main` (Pages đăng lại mỗi lần `main` đổi).

**Bản dùng cho đợt 1:** đợt thử chơi trên bản Pages của `main` = tag `gate-r1` (`eeb8ca1`). Nhánh làm việc sau đó đổi luật boss ở ST-15-14 (15/11/2026, QB-14): boss xám đấu lại bằng Vine Lash (hồi 0,35 s, ngắn hơn choáng 0,5 s) **không còn bị khóa choáng mãi**, hết choáng có 1,5 s không choáng lại. Ghi bản nào đã dùng vào mục 7; đợt sau nếu dùng bản mới thì so kết quả đấu lại với lưu ý này.

| Link | Dùng cho |
|---|---|
| `https://ducpham2806.github.io/2D_platform_game/?gate=1` | **Gửi người thử.** Menu chỉ còn Chơi (màn xám), Điều khiển, Kết quả chơi thử, để người thử không vào nhầm phòng thử khác (chỉ màn xám ghi nhật ký). Nút menu và menu tạm dừng cao ≥ 48 dp trên điện thoại |
| `https://ducpham2806.github.io/2D_platform_game/` | Người làm game (menu đầy đủ, không có công cụ) |
| `…/?debug=1` | Xem FPS và trạng thái trên máy thật |
| `…/?tune=1` | Người làm game chỉnh cảm giác (mục 5) |

## 4. Quy trình chơi thử với người thật

**Người thử:** 5 người mỗi đợt, chưa từng xem game, ngoài nhóm làm game (`04-Test-va-Launch.md` mục 2). Ít nhất 3 người chơi bằng **điện thoại cảm ứng** (cầm ngang), ít nhất 2 người chơi bằng bàn phím hoặc tay cầm trên máy tính.

**Trong buổi thử:**

1. Gửi link `?gate=1` (mẫu tin nhắn bên dưới). Không giải thích cách chơi; chỉ nói "chơi tới khi hạ được boss, tối đa 15 phút".
2. Quan sát hoặc quay màn hình. Ghi lại chỗ người thử dừng lại lâu, chỗ chết nhiều, câu họ tự nói ra.
3. Sau lần thắng boss đầu tiên, game tự hỏi phiếu chấm Nhảy / Lướt / Bắn (1 tệ – 5 rất sướng). Người thử chấm theo cảm giác, không cần nghĩ lâu.
4. Hỏi thêm 3 câu: Có lúc nào bấm mà nhân vật không làm theo không? Nút cảm ứng có chỗ nào khó với tới không? Muốn chơi tiếp màn thật không?
5. Người thử về màn hình chính (Esc hoặc nút II), chọn **Kết quả chơi thử → Sao chép JSON** và gửi đoạn chữ đó cho người tổng hợp (Zalo, email…). Nhật ký chỉ nằm trên máy người thử, game không tự gửi đi đâu.

**Mẫu tin nhắn mời** (chép nguyên, đổi link nếu cần):

> Chào bạn, mình đang làm một game hành động 2D trên trình duyệt và cần người chơi thử khoảng 15 phút.
> Mở link này (điện thoại thì cầm ngang): https://ducpham2806.github.io/2D_platform_game/?gate=1
> Bấm **Chơi**, chơi tới khi hạ được boss ở cuối màn (tối đa 15 phút; chưa hạ được cũng không sao).
> Hạ boss xong game sẽ hỏi chấm điểm 3 câu, bạn chấm theo cảm giác.
> Xong thì bấm nút **II** (hoặc Esc) → Thoát về menu (bấm 2 lần) → **Kết quả chơi thử** → **Sao chép JSON** → **Sao chép**, rồi dán đoạn chữ đó gửi lại cho mình. Cảm ơn bạn!

**Phiếu quan sát cho người tổ chức** (mỗi người thử một phiếu):

| Mục | Ghi |
|---|---|
| Người thử, thiết bị (máy, trình duyệt, cảm ứng/bàn phím/tay cầm) | |
| Chỗ dừng lâu hoặc chết nhiều (đoạn nào, làm gì) | |
| Câu người thử tự nói ra | |
| Có lúc bấm mà nhân vật không làm theo? | |
| Nút cảm ứng có chỗ khó với tới? | |
| Muốn chơi tiếp màn thật không? | |
| Đã gửi JSON chưa | |

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

**Thorna (đã chỉnh ngày 14/11/2026, không thuộc đợt thử màn xám):** mô phỏng `game/tests/power-cap.test.ts` cho thấy bot không né, chỉ bắn liên tục (7,5 phát/giây), thắng Thorna 100 máu sau khoảng 15 s; đặc tả Stage 1 mục 5 dự kiến 60–90 s. Đã nâng máu lên 250: bot không né thua ở cấp 4 sau 22–30 s, kể cả build Core đủ bậc; người chơi né được (bắn 50–75% thời gian) cần khoảng 45–65 s. Khi có người chơi thật đánh Thorna (Vertical slice), xem thời gian thắng và số lần thua (đặc tả: 1–3 lần thử đầu) rồi chỉnh tiếp.

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
<<<<<<< HEAD
| 1 | Bản thử đã đăng | `gate-r1` (`eeb8ca1`) | | | | | Chờ ghi nhận kết quả chơi thử |
=======
| 1 | Bản thử đã đăng 14/11/2026 | `gate-r1` (`eeb8ca1`) | | | | | Chờ ghi nhận kết quả chơi thử |
>>>>>>> 6eb3e419966f34e2a9b6b9bb046704b88ec1db68

**Chạy thử trọn luồng trước đợt 1 (14/11/2026, Chromium máy tính và Pixel 7 giả lập, link `?gate=1`; chạy lại bằng `npm run gate-flow`, mục 8):**

- Đạt trên cả hai thiết bị, không lỗi console: vào màn xám từ menu, di chuyển bằng phím và cần ảo, hạ boss bằng phím và nút Bắn, phiếu chấm hiện và lưu điểm, thoát về menu qua menu tạm dừng, Kết quả chơi thử xuất JSON (phiên ghi đúng thiết bị `keyboard`/`touch`).
- Phía người tổng hợp: gộp hai gói thì bảng hiện đủ hai thiết bị; dán trùng một gói không bị tính hai lần.
- Đã sửa trước khi gửi người thử: menu có nhiều phòng thử khác (người thử dễ vào nhầm, phiên không được ghi), nên thêm `?gate=1`. Nút menu và mục menu tạm dừng chỉ cao 28–30 dp trên điện thoại, nay ≥ 48 dp.
- Nhấn nhả phím tức thì (trong cùng một khung hình) vẫn bắn và nhảy đủ 10/10 lần.
- Ảnh ở `04-Dev-Plan/qa/cong-prototype/`.

## 8. Chạy lại bài đo

```
cd game
npm run build
npm run gate-check              # in bảng kết quả, mã thoát 1 nếu có hạng mục chưa đạt
npm run gate-check -- --json gate.json
npm run gate-flow               # chạy thử trọn luồng người thử (máy tính + Pixel 7), mã thoát 1 nếu hỏng
npm run gate-flow -- --shots ../04-Dev-Plan/qa/cong-prototype
```

Chạy `gate-flow` trước mỗi đợt thử: nó mở bản build với `?gate=1&debug=1`, đi từ menu tới phiếu chấm, xuất JSON trên máy tính và điện thoại, rồi gộp hai gói như người tổng hợp.

Cần Playwright và Chromium (`npm i -g playwright && npx playwright install chromium`, hoặc đặt `CHROMIUM_PATH` tới một Chrome có sẵn). Script tự chạy `vite preview` ở cổng 4179 rồi tắt khi xong.
