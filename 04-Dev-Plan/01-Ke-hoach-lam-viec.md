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
- **Cuối mỗi phiên làm việc** (bắt buộc): tóm tắt và ghi lại những gì đã làm vào `04-Dev-Plan/06-Nhat-ky-phien.md` (xem quy tắc ở `CLAUDE.md`).

**Định nghĩa "xong" cho một module:** chạy được trên cả PC và điện thoại; qua tiêu chí nghiệm thu trong tài liệu đặc tả; có test cho phần logic; không lỗi console; được ghi vào `CONTEXT.md`.

## 2. Lộ trình theo sprint (1 sprint = 1 tuần)

Làm theo hai giai đoạn của GDD mục 16. **Giai đoạn 2 chỉ bắt đầu khi qua cổng MVP.**

**Giai đoạn 1: chứng minh game vui (khoảng 19 tuần)**

| Sprint | Mốc                                                                                                                                                                                                                                                                                                     | Module (xem `02-Module.md`)                                                                                          | Asset (xem `05-Assets`)                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 1      | Khởi động (**code xong**, xem `game/CONTEXT.md`)                                                                                                                                                                                                                                                        | M0 Dự án, M1 Khung game                                                                                              | Style bible, tờ thiết kế Kai, bảng màu     |
| 2–4    | **Prototype** (Sprint 2: **M2**, Sprint 3: **M3**, Sprint 4: **M4 + boss xám** code xong; công cụ cổng Prototype xong, đo tự động đạt; còn chơi thử với 5 người thật theo `05-Cong-Prototype.md`)                                                                                                       | M2 Đầu vào (cảm ứng ngay từ đầu), M3 Nhân vật, M4 Chiến đấu cơ bản, 1 boss xám                                       | Kai: idle, run, nhảy, đáp (P0); ô gạch xám |
| 5–9    | **Vertical slice** (Sprint 5: **M5** code xong, có phòng thử kẻ địch; Sprint 6: **khung M7** code xong: nạp bản đồ Tiled, checkpoint, hố, gai, dây leo đu, phòng khóa, vật chắn, bí mật, có phòng thử màn chơi; **M6 code xong**: boss Thorna 4 đòn + mini-boss Bramble Golem, có phòng thử cho cả hai) | M5 Kẻ địch, M7 Màn chơi, M6 Boss (Thorna, Bramble Golem), M10 HUD cơ bản, M11 lưu cục bộ, TutorialManager            | Toàn bộ Prologue và Stage 1 (nhóm P1)      |
| 10–17  | **MVP**                                                                                                                                                                                                                                                                                                 | Stage 2–4 (Prism, Cryo, Cirrus; khoảng 2,5 tuần mỗi màn), M8 RPG rút gọn, Xưởng, Shop chỉ Upgrade, 3 độ khó, bản web | Nhóm P2 (chỉ phần của Stage 2–4)           |
| 18–19  | **Cổng MVP**                                                                                                                                                                                                                                                                                            | Playtest \~50 người, sửa cảm giác chơi và màn                                                                        | Không thêm asset mới                       |

**Giai đoạn 2: mở rộng (ước lượng lại sau cổng MVP, dự kiến 30–40 tuần)**

| Mốc          | Module                                                   | Asset                     |
| ------------ | -------------------------------------------------------- | ------------------------- |
| Alpha        | Stage 5–8, M8 RPG đầy đủ, M9 Shop đầy đủ, M10 Hub        | Nhóm P3 (Stage 5–8)       |
| Beta         | Citadel, kết thúc, M12 Âm thanh, M11 cloud               | Nhóm P3 còn lại           |
| Live-ops MVP | M13 Live-ops, M14 Kiếm tiền, M16 Phân tích, M17 Đóng gói | UI Live-ops (P4)          |
| Endgame MVP  | M15 Endgame                                              | Chip Lõi, biểu tượng (P4) |
| Soft launch  | M18 QA, chỉnh bằng Remote Config                         | Ảnh cửa hàng (P5)         |

Nếu asset là điểm nghẽn (rất có thể), cho phép chạy asset song song **trước** code một sprint. Sau 3 sprint đầu, đo tốc độ thật rồi ước lượng lại toàn bộ bảng này.

## 3. Nhịp mỗi tuần

| Ngày      | Việc                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| Thứ 2     | Chọn mục tiêu tuần (1–3 tính năng), cập nhật `CONTEXT.md`                             |
| Thứ 3–5   | Viết và chạy thử theo vòng lặp mục 1; xử lý asset của tuần                            |
| Thứ 6     | Dựng bản chơi thử (build), cho 2–3 người chơi thử, ghi lại số lần chết và chỗ bỏ cuộc |
| Cuối tuần | Sửa lỗi, nợ kỹ thuật, ghi nhật ký                                                     |

## 4. Rủi ro khi dùng ChatGPT

| Rủi ro                                            | Cách giảm                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Code mâu thuẫn giữa các cuộc trò chuyện           | `CONTEXT.md`, interface rõ, một module một cuộc trò chuyện                                       |
| Mã chạy được nhưng sai thiết kế (ví dụ nhảy cứng) | Nghiệm thu bằng tiêu chí số trong GDD (coyote 0,1 s, jump buffer 0,12 s...)                      |
| Hình không nhất quán, sai lưới                    | Xem `05-Assets/01-Huong-dan-asset.md`: một tư thế một lần, có ảnh tham chiếu, xử lý bằng script  |
| Phạm vi phình to                                  | Chỉ làm P0, P1 rồi chơi thử trước khi sang P2; cắt tính năng, không cắt chất lượng cảm giác chơi |
| Mất thành quả                                     | Git từ ngày đầu, sao lưu từ xa                                                                   |
