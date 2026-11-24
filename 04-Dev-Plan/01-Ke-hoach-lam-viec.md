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

Làm theo hai giai đoạn của GDD mục 16. **Giai đoạn 2 chỉ bắt đầu khi qua cổng MVP.**

**Giai đoạn 1: chứng minh game vui (khoảng 19 tuần)**

| Sprint | Mốc | Module (xem `02-Module.md`) | Asset (xem `05-Assets`) |
|---|---|---|---|
| 1 | Khởi động (**code xong**, xem `game/CONTEXT.md`) | M0 Dự án, M1 Khung game | Style bible, tờ thiết kế Kai, bảng màu |
| 2–4 | **Prototype** (Sprint 2: **M2**, Sprint 3: **M3**, Sprint 4: **M4 + boss xám** code xong; công cụ cổng Prototype xong, đo tự động đạt; còn chơi thử với 5 người thật theo `05-Cong-Prototype.md`) | M2 Đầu vào (cảm ứng ngay từ đầu), M3 Nhân vật, M4 Chiến đấu cơ bản, 1 boss xám | Kai: idle, run, nhảy, đáp (P0); ô gạch xám |
| 5–9 | **Vertical slice** (Sprint 5: **M5** code xong, có phòng thử kẻ địch) | M5 Kẻ địch, M7 Màn chơi, M6 Boss (Thorna), M10 HUD cơ bản, M11 lưu cục bộ, TutorialManager | Toàn bộ Prologue và Stage 1 (nhóm P1) |
| 10–17 | **MVP** | Stage 2–4 (Prism, Cryo, Cirrus; khoảng 2,5 tuần mỗi màn), M8 RPG rút gọn, Xưởng, Shop chỉ Upgrade, 3 độ khó, bản web | Nhóm P2 (chỉ phần của Stage 2–4) |
| 18–19 | **Cổng MVP** | Playtest \~50 người, sửa cảm giác chơi và màn | Không thêm asset mới |

**Giai đoạn 2: mở rộng (ước lượng lại sau cổng MVP, dự kiến 30–40 tuần)**

| Mốc | Module | Asset |
|---|---|---|
| Alpha | Stage 5–8, M8 RPG đầy đủ, M9 Shop đầy đủ, M10 Hub | Nhóm P3 (Stage 5–8) |
| Beta | Citadel, kết thúc, M12 Âm thanh, M11 cloud | Nhóm P3 còn lại |
| Live-ops MVP | M13 Live-ops, M14 Kiếm tiền, M16 Phân tích, M17 Đóng gói | UI Live-ops (P4) |
| Endgame MVP | M15 Endgame | Chip Lõi, biểu tượng (P4) |
| Soft launch | M18 QA, chỉnh bằng Remote Config | Ảnh cửa hàng (P5) |

Nếu asset là điểm nghẽn (rất có thể), cho phép chạy asset song song **trước** code một sprint. Sau 3 sprint đầu, đo tốc độ thật rồi ước lượng lại toàn bộ bảng này.

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

## 5. Đã làm (cập nhật 2026-11-02)

Phần này tóm tắt mọi việc đã xong để người làm sau đọc là nắm được. Chi tiết kỹ thuật (kiến trúc, quyết định, trạng thái từng module) ở `game/CONTEXT.md`; cách chạy ở `game/README.md`. **Việc chủ dự án cần tự làm** ở `06-Viec-can-lam.md`.

### 5.1 Rà soát và sửa thiết kế (GDD 0.4 → 0.6)

Nhập gói thiết kế v0.4, đánh giá cốt truyện, gameplay, đường cong học, rồi sửa theo thứ tự ưu tiên:

| Việc | Ở đâu |
|---|---|
| Thứ tự màn khuyến nghị khớp vòng khắc chế vũ khí | `01-GDD/01-GDD-chinh.md`, `03-Data/stages.json` |
| Nén tăng trưởng chỉ số RPG, thêm đồng bộ cấp (level sync), **1 lần hồi sinh tại chỗ mỗi lượt** cho mọi nguồn | GDD mục 6, 10; `player.json`, `stages.json` |
| Chia lộ trình thành **2 giai đoạn có cổng chặn** (MVP 4 màn, chưa máy chủ, chưa kiếm tiền) | GDD mục 16, mục 2 của file này |
| Mở hệ thống dần dần, người chơi điều khiển Kai trong 15 giây đầu | GDD, `07-Kich-ban-huong-dan.md` |
| Viết lại cấu trúc cốt truyện, đổi các tên quá giống Mega Man X | GDD, wireframe |
| Hướng dẫn giọng nhân vật; viết lại thoại hướng dẫn theo giọng | `08-Giong-nhan-vat.md`, `07-Kich-ban-huong-dan.md` |
| Trụ cột 3 và 5 khớp mô hình free-to-play (GDD 0.5) | GDD mục 1 |
| **Cắt độ khó cốt truyện từ 6 còn 3** (Cốt truyện, Thường, Thử thách); chiều sâu chuyển sang Mức Eclipse ở endgame | GDD, `difficulties.json`, `economy.json`, `endgame.json` |
| Thoại 3 biến thể cho 7 Warden còn lại, bản tiếng Anh, script sinh thoại | `09-Thoai-Warden.md`, `03-Data/dialogue_wardens.json`, `04-Dev-Plan/tools/dialogue/` |
| Tính lại doanh thu quảng cáo theo giới hạn 1 lần hồi sinh | `06-Ke-hoach-quang-cao.md` |
| Cập nhật wireframe theo thứ tự màn mới, mở khóa theo giai đoạn, Két giáp | `02-Wireframes/` |

### 5.2 Code (thư mục `game/`, Phaser 3 + TypeScript + Vite)

Mỗi sprint là một pull request đã merge vào `main` (PR #1–#5), CI xanh.

| Sprint | Kết quả | Có thể thử ở đâu |
|---|---|---|
| 1 (M0, M1) | Khung dự án: build/test/lint/format, CI; Boot → Preload → Menu/Hub/Stage; phóng to theo hệ số nguyên, nhắc xoay ngang; nạp và **kiểm tra chéo toàn bộ `03-Data`** (sai là game dừng ở màn tải và test đỏ) | `npm run dev` |
| 2 (M2) | Đầu vào: bàn phím, tay cầm, **cảm ứng** (cần ảo, 6 nút, đa chạm), đổi phím/nút, kéo thả bố cục nút cảm ứng, lưu cài đặt, biểu tượng nút theo thiết bị | Menu → Điều khiển |
| 3 (M3) | Kai: chạy, nhảy biến thiên, coyote 0,1 s, jump buffer 0,12 s, lướt, dash-jump, bám và nhảy tường, bục một chiều, bị đánh, chết, hồi sinh; màn xám 96 ô | Menu → Vào màn thử |
| 4 (M4 + boss xám) | Arc Cannon 3 mức nạp, vũ khí boss theo dữ liệu (Vine Lash), điểm yếu, choáng, hit-stop; boss xám 3 pha 4 đòn có báo trước, phòng boss khóa cửa, đấu lại | Màn thử → phòng boss |
| Cổng Prototype | Bản web trên GitHub Pages; nhật ký chơi thử + phiếu chấm 1–5 + màn Kết quả (có dấu hiệu "hỏng" GDD 17); bảng chỉnh cảm giác (`?tune=1`); bài đo tự động `npm run gate-check` (đạt mọi ngưỡng) | `05-Cong-Prototype.md` |
| 5 (M5) | 5 loại kẻ địch thường của Prologue và Stage 1 theo `03-Data/enemies.json`, telegraph ≥ 0,4 s, tầm hoạt động, rơi Core Bit (phải nhặt) và viên máu, EXP; phòng thử kẻ địch | Menu → Phòng thử kẻ địch |

Số liệu chốt: 172 test tự động; bản build 1,4 MB; 60 FPS khi CPU chậm 4–6×; độ trễ trong game p95 dưới 25 ms. Mọi đồ họa vẫn là **khối màu giữ chỗ** (chưa có sprite).

### 5.3 Cách làm tiếp (cho người làm sau)

1. Đọc `game/CONTEXT.md` (kiến trúc, quyết định đã chốt, bảng module), rồi `game/README.md`.
2. Mọi chỉ số nằm trong `03-Data/*.json`; không viết cứng trong mã. Logic thuần ở `game/src/logic` và `game/src/core` (không import Phaser, test chạy trên Node).
3. Trước khi đẩy code: `npm run lint && npm run format:check && npm run typecheck && npm test && npm run build` trong `game/`. CI chạy đúng các lệnh này.
4. Mỗi sprint một pull request; cập nhật `game/CONTEXT.md`, `game/README.md` và bảng mục 2 khi xong.

### 5.4 Việc code tiếp theo (Vertical slice, Sprint 6–9)

| Thứ tự | Việc | Ghi chú |
|---|---|---|
| Sprint 6 | **M6:** boss Thorna theo đặc tả Stage 1 mục 5 (Gai Quạt, Dây Quất, Rễ Trồi, Hoa Nở; pha 60%/30%) và mini-boss Bramble Golem | Mở rộng bộ máy boss theo dữ liệu đang có (`logic/boss/`); kiểm tra telegraph ≥ 0,5 s, không đòn > 18 |
| Sprint 7 | **M7:** nạp bản đồ Tiled cho Prologue và Stage 1 (4 checkpoint, phòng khóa, gai 30 sát thương, dây leo đu, hố rơi −20 máu, bí mật) | Đổ vào cùng cấu trúc `TileMap` + `StageDef`; giữ test "kẻ địch cách checkpoint ≥ 6 ô" |
| Sprint 8 | **M10** HUD cơ bản theo wireframe, **M11** lưu cục bộ + mã sao lưu, **TutorialManager** theo `07-Kich-ban-huong-dan.md` | Prologue nhịp 1–3 dùng cờ `harmless` đã có |
| Sprint 9 | Ghép Prologue → Hub → Stage 1, chơi thử Vertical slice | Tiêu chí: Prologue hoàn thành ≥ 90%, Stage 1 ≥ 70% |

**Không chốt thiết kế màn Prologue và Stage 1 trước khi qua cổng Prototype** (xem `05-Cong-Prototype.md` mục 6); phần mã ở trên làm song song được.
