# EP-14: Giao diện MVP

- **Mốc:** S10–S14 (`01-Ke-hoach-lam-viec.md`). ST-14-01…07 (Cài đặt và tiếp cận) ở `01-GDD/14-Cai-dat-Tiep-can.md` mục 10. Từ ST-14-08 trở đi: hộp chữ, Hub dạng menu, cỡ chữ và nút, tự tạm dừng, báo lỗi lưu, bỏ qua thoại.
- **Luật biên:** `01-GDD/17-Quy-tac-bien.md` mục 8 (QB-70…74), mục 10 (QB-90…100).
- **Không đụng bản thử G1:** code ở nhánh làm việc, chỉ merge vào `main` sau đợt thử G1.

| Mã          | Tên                                                                                                                         | Phụ thuộc          | Cỡ        | Trạng thái |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------- | ---------- |
| ST-14-01…07 | Cài đặt và tiếp cận                                                                                                         | Xem GDD 14 mục 10  | —         | Chưa       |
| ST-14-08    | Hộp chữ thuần: thứ tự ưu tiên, hiện lại sau khi bị che, hủy khi chờ quá lâu, thời gian đọc chung, dừng đồng hồ khi tạm dừng | —                  | 0,5 phiên | Đang làm   |
| ST-14-09    | Câu NOVA nhiệm vụ phụ và Báo ngắn (Nhận vũ khí, Lên cấp, Nhiệm vụ xong) dùng hàng đợi của ST-14-08                          | 08; EP-18 ST-18-06 | 0,5 phiên | Chưa       |

## ST-14-08: Hộp chữ thuần (QB-70, QB-71, QB-72)

- **Thuộc Epic:** EP-14 · **Ưu tiên:** P1 (sửa lỗi đã biết) · **Trạng thái:** DONE (14/11/2026) · **Phụ thuộc:** không
- **Bằng chứng:** [x] Logic (Vitest `tests/text-boxes.test.ts`) [x] Config (`ui.json → reading`) [x] Visual (`04-Dev-Plan/qa/ST-14-08/`)

### 1. User Story

> **Là** người chơi chết nhiều lần ở trận boss, **tôi muốn** câu gợi ý của NOVA không biến mất khi tôi mở menu tạm dừng hay khi hội thoại chen vào, **để** tôi kịp đọc lời khuyên đổi độ khó hoặc đổi vũ khí.

### 2. Bối cảnh (nhúng)

- **QB-70:** mỗi lúc một hộp. Thứ tự: Hội thoại > Kết quả > Gợi ý chết > Hướng dẫn > Câu NOVA nhiệm vụ phụ > Báo ngắn. Hộp thấp hơn ẩn khi hộp cao hơn hiện, **rồi hiện lại nếu còn hiệu lực**.
- **QB-71:** gợi ý chết hủy khi hạ boss hoặc qua checkpoint. Hộp chờ quá 10 s cũng hủy.
- **QB-72:** hộp tự tắt sau max(3 s, số ký tự / 15). Gợi ý chết: max(`showSec`, số ký tự / 15). **Không đếm giờ khi tạm dừng hoặc có hội thoại.**
- GDD 14 mục 9 (bảng lan thay đổi): `difficultyHint.charsPerSecRead` chuyển thành tốc độ đọc chung `ui.json → reading.charsPerSec`, để tự tiến thoại (ST-14-05) và hộp tự tắt dùng một số.
- **Lỗi hiện tại** (`stage-scene.ts`, `drawDeathHint`): đồng hồ tính bằng giờ thật của khung hình, nên menu tạm dừng, bảng Kỹ năng hay hội thoại vẫn làm gợi ý hết giờ. Khi hội thoại hoặc màn Kết quả hiện, gợi ý bị tắt hẳn chứ không hiện lại. Hạ boss hoặc qua checkpoint chỉ hủy câu đang chờ, không hủy câu đang hiện.

### 3. Quyết định (sau duyệt Technical Director 14/11, "Duyệt kèm sửa", 7 điểm bắt buộc đã áp)

- Logic thuần `src/logic/hud/text-boxes.ts`:
  - `BOX_ORDER` và `topBox(wants)`: chọn hộp được hiện theo thứ tự QB-70.
  - `readingSec(text, minSec, charsPerSec)`: đếm ký tự theo code point sau khi chuẩn hóa NFC.
  - `TimedBox`: hộp có hạn giờ (gợi ý chết; sau này Báo ngắn). `step(dt, clock)` trả true ở bước đầu câu hiện tới người chơi. Ba trạng thái đồng hồ:
    - `frozen` (trận đứng yên: menu tạm dừng, bảng Kỹ năng, **hội thoại**, Kết quả): không đếm gì; không cộng thời gian chờ, vì không có gì cũ đi (duyệt, điểm 2: Báo ngắn "Nhận vũ khí" ở ST-14-09 phải sống qua thoại sau trận dài);
    - `covered` (trận chạy nhưng hộp cao hơn hiện): không trừ thời gian đọc, cộng thời gian chờ; chờ liền quá `maxWaitSec` thì hủy;
    - `free`: trừ thời gian đọc, đặt lại thời gian chờ.
- Scene gọi `step` **mỗi bước cố định mà trận chạy** (`stepDeathHint` sau `world.step`); các nhánh trận đứng yên không gọi (tương đương `frozen`). Bảng chơi thử mở thì scene không bước. Vẽ sau vòng lặp theo `topBox` (duyệt, điểm 5).
- Gợi ý **ẩn khi menu tạm dừng hay bảng Kỹ năng mở** (hộp nằm dưới lớp mờ của menu, lộ từng dải), đóng thì hiện lại với thời gian còn lại (điểm 1).
- Hủy cả câu đang chờ lẫn đang hiện khi hạ boss, qua checkpoint, **vào đấu trường** (`deathHintExpired`; GDD 11 mục 2.5 coi như checkpoint, tránh gợi ý chen đòn đầu; điểm 3), và khi **tắt hướng dẫn** ở menu tạm dừng (điểm 4).
- Đo lường `difficulty_hint` ghi ở bước đầu câu thật sự hiện (GDD 13: "hiện"), không ghi lúc chuẩn bị câu.
- Dữ liệu `ui.json → reading { charsPerSec: 15, minSec: 3, maxWaitSec: 10 }`; bỏ `difficultyHint.charsPerSecRead`. `difficultyHint.showSec` (6) là mức tối thiểu riêng của gợi ý chết, kiểm ≥ `reading.minSec` lúc nạp. GDD 14 mục 4.5, 9: tự tiến thoại dùng `reading.charsPerSec`, `reading.minSec`, không dùng `maxWaitSec` (điểm 6).
- Hộp hướng dẫn không đổi: thời gian của từng bước do `TutorialManager` đếm theo bước trận. Còn hở (ghi ở file quyết định): bước chỉ có lời vẫn đếm giờ khi gợi ý chết che nó.

### 4. Tiêu chí nghiệm thu

1. [x] Test (tên mang mã luật, `tests/text-boxes.test.ts`, 11 test): QB-70 thứ tự; gợi ý hiện 2 s bị che rồi hiện lại với thời gian còn lại; QB-71 che liền quá 10 s thì hủy, che ngắn không cộng dồn, `frozen` không cộng chờ, `cancel()` hủy cả khi đang hiện, `deathHintExpired` (hạ boss, checkpoint, đấu trường); QB-72 thời gian đọc, NFC, `frozen`/`covered` không trừ thời gian đọc; bước đầu câu hiện.
2. [x] `core/ui-config.ts` kiểm `reading` (`charsPerSec` ≥ 5, `minSec` ≥ 1, `maxWaitSec` ≥ `minSec`) và `difficultyHint.showSec` ≥ `reading.minSec`; test lỗi dữ liệu.
3. [x] Scene dùng `TimedBox` và `topBox`; không còn dùng `time` của khung hình cho hộp chữ.
4. [x] Chạy thử Chromium: chết 3 lần ở phòng Thorna, gợi ý hiện; mở menu tạm dừng 9 s (quá `showSec`): gợi ý ẩn, thời gian còn lại đứng yên; đóng menu thì gợi ý hiện lại với cùng thời gian còn lại rồi tự tắt đúng hạn. Ảnh ở `04-Dev-Plan/qa/ST-14-08/`; 0 lỗi console.

### 5. File

- Tạo: `game/src/logic/hud/text-boxes.ts`, `game/tests/text-boxes.test.ts`, `04-Dev-Plan/qa/ST-14-08/`.
- Sửa: `03-Data/ui.json`, `game/src/core/ui-config.ts`, `game/src/logic/difficulty/difficulty.ts` (`deathHintExpired`), `game/src/scenes/stage-scene.ts`, `01-GDD/17-Quy-tac-bien.md` (QB-70…72), `01-GDD/07-Kich-ban-huong-dan.md`, `01-GDD/11-Do-kho.md` mục 2.5, `01-GDD/14-Cai-dat-Tiep-can.md` mục 4.5, 9, `game/docs/quyet-dinh/giao-dien-huong-dan-hoi-thoai.md`, `game/CONTEXT.md`, nhật ký phiên.
