# Kế hoạch làm việc với ChatGPT

Giả định: 1 người làm, khoảng 20 giờ mỗi tuần, ChatGPT viết code và tạo hình. Mọi con số thời gian là ước lượng thô `[PLACEHOLDER]`, cần điều chỉnh sau 3 sprint đầu.

## 1. Cách làm việc

**Mỗi module một cuộc trò chuyện riêng** (hoặc một Project riêng trong ChatGPT). Không trộn nhiều module trong một cuộc trò chuyện, vì ChatGPT sẽ quên và sinh mã mâu thuẫn.

Vòng lặp cho mỗi tính năng nhỏ:

1. Dán **Prompt ngữ cảnh chung** (file `03-Prompt-code.md`, mục 1) và prompt của module.
2. Yêu cầu ChatGPT **nêu kế hoạch ngắn** (danh sách file sẽ tạo/sửa) rồi mới viết code.
3. Duyệt kế hoạch, sau đó cho viết **từng file một**, tối đa khoảng 300 dòng mỗi file.
4. Chạy thử. Nếu lỗi, dán **nguyên văn thông báo lỗi** và đoạn code liên quan, không mô tả bằng lời.
5. Khi chạy ổn: viết test cho phần logic thuần (công thức, kinh tế, lưu dữ liệu), rồi commit.

**Quy tắc vàng:**

- Dán **giao diện (type, hàm công khai)** của các module khác, không dán toàn bộ code.
- Mọi chỉ số đọc từ `03-Data/*.json`; không để ChatGPT viết cứng con số.
- Một thay đổi một commit; nhánh Git theo module; gắn tag ở cuối mỗi mốc.
- Giữ file `CONTEXT.md` ở gốc dự án: tóm tắt kiến trúc, quyết định đã chốt, danh sách module và trạng thái. Cập nhật sau mỗi sprint rồi dán vào cuộc trò chuyện mới.
- Khi cuộc trò chuyện quá dài và ChatGPT bắt đầu sai, mở cuộc mới với `CONTEXT.md` + file đang làm.

**Định nghĩa "xong" cho một module:** chạy được trên cả PC và điện thoại; qua tiêu chí nghiệm thu trong tài liệu đặc tả; có test cho phần logic; không lỗi console; được ghi vào `CONTEXT.md`.

## 2. Lộ trình theo sprint (1 sprint = 1 tuần)

| Sprint | Mốc | Module (xem `02-Module.md`) | Asset (xem `05-Assets`) |
|---|---|---|---|
| 1 | Khởi động | M0 Dự án, M1 Khung game | Style bible, tờ thiết kế Kai, bảng màu |
| 2–3 | **Prototype** | M2 Đầu vào, M3 Nhân vật | Kai: idle, run, nhảy, đáp (P0); ô gạch xám |
| 4–5 | | M4 Chiến đấu, M5 Kẻ địch, M7 Màn chơi | Hiệu ứng Buster, Drone Lính, tileset phòng thí nghiệm |
| 6–8 | **Vertical slice** | M6 Boss (Thorna), M10 HUD cơ bản, M11 lưu cục bộ | Toàn bộ Prologue và Stage 1 (nhóm P1) |
| 9–12 | **Alpha** | M8 RPG, M9 Shop, M10 Hub và Xưởng, Stage 2–4 | Nhóm P2 |
| 13–16 | **Beta** | Stage 5–8, Citadel, kết thúc, M12 Âm thanh | Nhóm P3 |
| 17–19 | Live-ops MVP | M13 Live-ops, M14 Kiếm tiền, M16 Phân tích, M11 cloud, M17 Đóng gói | UI Live-ops (P4) |
| 20–22 | Endgame MVP | M15 Endgame | Chip Lõi, biểu tượng (P4) |
| 23–28 | Soft launch | M18 QA, chỉnh bằng Remote Config | Ảnh cửa hàng (P5) |

Tổng khoảng 28 tuần (7 tháng). Nếu asset là điểm nghẽn (rất có thể), cho phép chạy asset song song **trước** code một sprint.

## 3. Nhịp mỗi tuần

| Ngày | Việc |
|---|---|
| Thứ 2 | Chọn mục tiêu tuần (1–3 tính năng), cập nhật `CONTEXT.md` |
| Thứ 3–5 | Viết và chạy thử theo vòng lặp mục 1; xử lý asset của tuần |
| Thứ 6 | Dựng bản chơi thử (build), cho 2–3 người chơi thử, ghi lại số lần chết và chỗ bỏ cuộc |
| Cuối tuần | Sửa lỗi, nợ kỹ thuật, ghi nhật ký |

## 4. Rủi ro khi dùng ChatGPT

| Rủi ro | Cách giảm |
|---|---|
| Code mâu thuẫn giữa các cuộc trò chuyện | `CONTEXT.md`, interface rõ, một module một cuộc trò chuyện |
| Mã chạy được nhưng sai thiết kế (ví dụ nhảy cứng) | Nghiệm thu bằng tiêu chí số trong GDD (coyote 0,1 s, jump buffer 0,12 s...) |
| Hình không nhất quán, sai lưới | Xem `05-Assets/01-Huong-dan-asset.md`: một tư thế một lần, có ảnh tham chiếu, xử lý bằng script |
| Phạm vi phình to | Chỉ làm P0, P1 rồi chơi thử trước khi sang P2; cắt tính năng, không cắt chất lượng cảm giác chơi |
| Mất thành quả | Git từ ngày đầu, sao lưu từ xa |
