# EP-13: Đo lường cho đợt thử MVP (M16 bản tối thiểu)

- **Mốc:** lõi (ST-13-01, 02, 05) làm trong lúc chờ cổng G1, dùng được cho G2; kênh gửi (ST-13-03, 04) chờ người dùng chọn ở ADR-002. Phải xong trước đợt thử 50 người (EP-20).
- **Thiết kế:** `01-GDD/13-Do-luong-MVP.md` bản 1.1 (phần lõi duyệt kèm sửa của Technical Director 14/11, đã sửa); quyết định kênh gửi: `04-Dev-Plan/adr/ADR-002-do-luong-mvp.md` (Proposed). Luật biên: `17-Quy-tac-bien.md` mục 10.1 (QB-150…157).
- **Không đụng bản thử G1:** code ở nhánh làm việc, chỉ merge vào `main` sau đợt thử G1. Bản thường (không có `?mvp=`) không ghi gì.

| Mã | Tên | Phụ thuộc | Cỡ | Trạng thái |
| --- | --- | --- | --- | --- |
| ST-13-01 | Lõi `logic/telemetry/`: lược đồ, phong bì, kiểm lược đồ, bộ đệm theo ưu tiên, lô, xuất JSON; `telemetry.json` + `core/telemetry-config.ts` | — | 1 phiên | DONE (14/11/2026) |
| ST-13-02 | Nối sự kiện: Boot, Menu, StageScene, Chuẩn bị, Quầy, Xưởng, TutorialManager; `StageWorld` thêm sát thương theo vũ khí, nguồn cú đánh cuối, chữ ký build | 01 | 2 phiên | Chưa |
| ST-13-03 | Cờ `?mvp=`, `staff`, `install`; thông báo không chặn; Cài đặt → Dữ liệu | 01; khung Cài đặt EP-14; ADR-002 | 1 phiên | Chờ ADR-002 |
| ST-13-04 | Điểm nhận và Uploader | 01, 03; ADR-002 | 1,5 phiên | Chờ ADR-002 |
| ST-13-05 | Báo cáo `logic/telemetry/report.ts` + `npm run mvp-report`, bộ dữ liệu mẫu có đáp án | 01 | 1,5 phiên | Chưa |
| ST-13-06 | Phiếu trong game, `npm run mvp-flow` | 02–05 | 1 phiên | Chưa |

## ST-13-01: Lõi đo lường thuần

- **Thuộc Epic:** EP-13 · **Ưu tiên:** P0 (MVP) · **Trạng thái:** DONE (14/11/2026) · **Phụ thuộc:** không
- **Bằng chứng:** [x] Logic (Vitest `tests/telemetry.test.ts`, 21 test) [ ] Integration (ST-13-02) [ ] Visual (không có thay đổi người chơi thấy) [x] Config (`telemetry.json`)

### 1. User Story

> **Là** người tổ chức đợt thử MVP, **tôi muốn** game ghi sự kiện đúng lược đồ, gọn và không bao giờ làm hỏng trò chơi, **để** báo cáo cổng MVP tính được phễu, quay lại ngày sau và đoạn bỏ cuộc mà không thu thứ người chơi tự gõ.

### 2. Bối cảnh (nhúng từ GDD 13, ADR-002, duyệt Technical Director)

- **Phong bì:** `e`, `t` (ms), `sid` (8 ký tự base36), `n` (gán sau khi qua kiểm lược đồ), `p`. 26 sự kiện ở GDD 13 mục 3; ưu tiên 0/1/2 ở `telemetry.json → priority`.
- **Không chuỗi tự do:** chuỗi chỉ là enum, id thuộc danh mục lấy từ dữ liệu game, khuôn (`day`, `screen`, `skills`, `lang`) hoặc `msg` đã làm sạch (≤ 120 ký tự ASCII). Bỏ `audio` lồng nhau, thay bằng `audioMaster`, `audioSfx`, `audioAlert`, `audioMuted`.
- **Byte** = độ dài JSON (chỉ ASCII). Bộ đệm ≤ 256 KB, ≤ 2.000 sự kiện, không bao giờ vượt (QB-150). Một sự kiện ≤ 2 KB. Lô ≤ 100 sự kiện, ≤ 24 KB (≤ 0,8 × 32 KB của điểm nhận).
- **Lô bất biến** (QB-151): thử lại gửi đúng lô cũ; 409 coi là đã nhận. Giữ mục đã nhận để Xuất JSON đủ dữ liệu.
- **Sai lược đồ** (QB-153): bỏ cả sự kiện, đếm; DEV ném lỗi. **Lỗi lặp** (QB-155): ghi lần đầu, đếm, ghi bù. **Tắt gửi** (QB-156): xóa, ngừng, không ghi `consent: off`.
- **ADR-002 mục 4:** lõi thuần, có test; không cấp phát mỗi khung; không đụng localStorage hay mạng trong bước logic.
- **`telemetry.json` không bắt buộc:** lỗi thì tắt đo lường, game vẫn chạy.

### 3. File

- Tạo: `game/src/logic/telemetry/{schema,validate,text,buffer,batch,logger}.ts`, `game/src/logic/hash.ts`, `game/src/core/telemetry-config.ts`, `game/src/core/telemetry-catalogs.ts`, `03-Data/telemetry.json`, `game/tests/telemetry.test.ts`, `game/docs/quyet-dinh/do-luong.md`.
- Sửa: `game/src/core/game-config.ts` (`telemetry`, `telemetryError`), `game/src/logic/save/save-code.ts` (dùng `logic/hash.ts`), `game/scripts/docs-check.mjs`, `01-GDD/13-Do-luong-MVP.md` (bản 1.1), `01-GDD/17-Quy-tac-bien.md` (QB-150…157).

### 4. Tiêu chí nghiệm thu

- [x] **AC-1 (lược đồ):** mọi sự kiện trong danh mục, đủ thuộc tính hoặc chỉ khóa bắt buộc, đều hợp lệ; kiểm lược đồ chặn khóa lạ, chuỗi tự do, id ngoài danh mục, ngoài enum, NaN, số lẻ ở thuộc tính nguyên, thiếu khóa, tên lạ, khóa lạ ở phong bì, `sid` sai khuôn, câu trả lời phiếu không hợp câu hỏi (GDD 13 mục 10 ý 2).
- [x] **AC-2 (làm sạch lỗi):** `msg` không còn chuỗi trong nháy, URL, đường dẫn, chữ số, dấu; chỉ ASCII; ≤ 120 ký tự; qua được kiểm lược đồ.
- [x] **AC-3 (bộ đệm, QB-150):** đổ 10.000 sự kiện (300 ưu tiên 0): không lúc nào vượt 256 KB / 2.000 sự kiện, không mất sự kiện ưu tiên 0; toàn ưu tiên 0 thì dừng lưu và đếm `lost`; đúng thứ tự bỏ; mục đang gửi không bị bỏ (GDD 13 mục 10 ý 3).
- [x] **AC-4 (lô, QB-151):** lô ≤ 100 sự kiện, ≤ 24 KB; chưa `ack` thì cắt lại trả đúng lô cũ dù có sự kiện mới; lưu rồi nạp lại giữ trạng thái; gộp hàng đợi trùng không nhân đôi.
- [x] **AC-5 (bộ ghi):** `n` tăng dần, sự kiện bị bỏ không tốn `n`; `strict` ném lỗi; làm tròn giây 0,1, tỉ lệ 0,001; sự kiện > 2 KB bị bỏ; tắt gửi xóa sạch và ngừng; lỗi lặp ghi bù và giới hạn 20 bản ghi; gói xuất hợp lệ, chỉ ASCII.
- [x] **AC-6 (dữ liệu):** `telemetry.json` hợp lệ, ưu tiên đủ mọi sự kiện; bộ kiểm báo lỗi cho phân số ngoài (0; 1], lô quá lớn, ưu tiên thiếu/lạ/sai, schema, `buildTimeRatio`, sự kiện lớn nhất không vừa lô; file lỗi hoặc thiếu thì game vẫn nạp được.
- [x] **AC-7 (hiệu năng):** `log()` stringify một lần, cộng dồn byte, không đụng kho; bản thường chưa gọi lõi nên không đổi gì lúc chạy (`npm run gate-flow` đạt).

### 5. Ghi chú cho Story sau

- ST-13-02: chữ ký build `skills` = tổng bậc đã học theo nhánh (`V2P1C0`); `SaveManager` cần mã lỗi (`read`, `write`, `corrupt`, `newer`, `import_invalid`); FPS, `slowFramePct` dùng bộ đếm cấp phát sẵn (QB-157); gọi `flushErrorCounts()` khi trang ẩn và lúc ghi `stage_progress`.
- ST-13-03: kho cần `get/set/remove/keys(prefix)`; gộp hàng đợi mồ côi (`orphanMin`); `TelemetryLocal` có `wave`, `staff`; nối `dataFingerprint` và commit vào build (Vite `define`).
