# EP-13: Đo lường cho đợt thử MVP (M16 bản tối thiểu)

- **Mốc:** lõi (ST-13-01, 02, 05) làm trong lúc chờ cổng G1, dùng được cho G2; kênh gửi (ST-13-03, 04) chờ người dùng chọn ở ADR-002. Phải xong trước đợt thử 50 người (EP-20).
- **Thiết kế:** `01-GDD/13-Do-luong-MVP.md` bản 1.2 (phần lõi duyệt kèm sửa của Technical Director 14/11; mục 6, 7 duyệt kèm sửa của QA Lead 14/11; đã sửa); quyết định kênh gửi: `04-Dev-Plan/adr/ADR-002-do-luong-mvp.md` (Proposed). Luật biên: `17-Quy-tac-bien.md` mục 10.1 (QB-150…157).
- **Không đụng bản thử G1:** code ở nhánh làm việc, chỉ merge vào `main` sau đợt thử G1. Bản thường (không có `?mvp=`) không ghi gì.

| Mã | Tên | Phụ thuộc | Cỡ | Trạng thái |
| --- | --- | --- | --- | --- |
| ST-13-01 | Lõi `logic/telemetry/`: lược đồ, phong bì, kiểm lược đồ, bộ đệm theo ưu tiên, lô, xuất JSON; `telemetry.json` + `core/telemetry-config.ts` | — | 1 phiên | DONE (14/11/2026) |
| ST-13-02a | `StageWorld`: nguồn đòn (`hurtBy`, `deathCause`), sát thương lên boss theo vũ khí, cú trúng điểm yếu; `StageTracker` (sự kiện của một lượt màn), `FrameStats`, `buildSignature`; test chuỗi sự kiện bằng StageWorld | 01 | 1 phiên | DONE (14/11/2026) |
| ST-13-02b | Nối vào scene: dịch vụ đo lường (tạm bật bằng cờ `?debug=1&telemetry=1`, chỉ bộ nhớ), StageScene gọi `StageTracker`; sự kiện meta (session_start, boot_timing, Quầy, Xưởng, hướng dẫn, gợi ý NOVA, lỗi trang); chạy thử | 01, 02a | 1 phiên | DONE (14/11/2026) |
| ST-13-03 | Cờ `?mvp=`, `install`, kho `cv.telemetry*` (gộp hàng đợi mồ côi), `run` qua phiên; thông báo không chặn; Cài đặt → Dữ liệu; chuyển từ 02: mã lỗi `SaveManager` (`save_error`), phiên mới sau 30 phút ẩn (QB-154), `msToControl`; nối `dataFingerprint` vào build | 01, 02; khung Cài đặt EP-14; ADR-002 | 1,5 phiên | Chờ ADR-002 |
| ST-13-04 | Điểm nhận và Uploader | 01, 03; ADR-002 | 1,5 phiên | Chờ ADR-002 |
| ST-13-05a | Báo cáo cổng: MV1–MV7, H1–H4, Wilson, phễu, theo màn, thiết bị, F1; `npm run mvp-report`; bộ dữ liệu mẫu có đáp án | 01 | 1 phiên | DONE (14/11/2026) |
| ST-13-05b | Chỉ số phụ K1–K6, DK1–DK4, T1–T4, X1–X5, F1, S1 (đáp án thêm vào bộ mẫu) | 05a | 0,5 phiên | DONE (14/11/2026) |
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

## ST-13-02a: Dữ liệu StageWorld và bộ theo dõi lượt màn

- **Trạng thái:** DONE (14/11/2026) · **Phụ thuộc:** ST-13-01 · **Bằng chứng:** [x] Logic (`tests/telemetry-stage.test.ts`, 5 test) [ ] Visual (chưa nối vào scene)
- **Bối cảnh:** GDD 13 mục 3 (`death.cause`, `boss_end.dmg`, `stage_end`), mục 10 ý 1 (test chuỗi sự kiện bằng StageWorld); QB-47 (lượt), QB-98 (`stage_progress`), QB-157 (khung dài).
- **Đã làm:**
  - Đạn kẻ địch mang `source: enemy:<id>`; đạn boss tính theo loại (`boss:<kind>`); thân kẻ địch `enemy:<id>`, thân boss `boss:touch`, gai `spike`, hố hết máu `pit`. `WorldEvents.hurtBy`, `deathCause`; `StageWorld.lastHitCause`.
  - `StageWorld.bossDamage` (tên vũ khí → sát thương, đơn vị phát Arc Cannon, kể cả nổ lan V2), `bossWeakHits`.
  - `logic/telemetry/stage-tracker.ts`: `stage_start`, `section_enter` (lần đầu mỗi đoạn; phase boss → đoạn `boss`), `checkpoint`, `death` (kind death/pit, cause, streak), `boss_start` (cửa đóng hoặc hồi sinh trong phòng boss, `attempt`), `boss_end` (win/death/exit; `dmg` theo id vũ khí, `weakHits`, `swaps`, `bossHpPct`), `difficulty_hint`, `stage_progress` (theo `stageProgressSec`, gọi `flushErrorCounts`), `stage_end` (clear/quit; trận dở thì `boss_end` exit trước).
  - `frame-stats.ts` (biểu đồ cấp phát sẵn 0,5 ms; bỏ khung > `ignoreMs`), `buildSignature` (tổng bậc theo nhánh, `V2P1C0`).
- **Tiêu chí:** [x] chuỗi `stage_start → section_enter → death → checkpoint → boss_start → death → boss_end → boss_start → boss_end → stage_end` trên StageWorld thật, chế độ `strict` (mọi sự kiện qua kiểm lược đồ); [x] thoát giữa trận: `boss_end exit` rồi `stage_end quit`, `end` gọi hai lần không ghi đôi; [x] rơi hố còn máu: `death` kind `pit`, không tính `deaths`; [x] `FrameStats`, `buildSignature`.

## ST-13-02b: Nối đo lường vào game

- **Trạng thái:** DONE (14/11/2026) · **Phụ thuộc:** ST-13-01, 02a · **Bằng chứng:** [x] Logic (`tests/telemetry-stage.test.ts`: thiết bị, `session_start`) [x] Integration (chạy thử Chromium, `qa/ST-13-02/`) [x] Bản thử G1 không đổi (`gate-flow` đạt)
- **Bối cảnh:** GDD 13 mục 3 (sự kiện meta), mục 4 (không userAgent đầy đủ), ADR-002 mục 4 (đo lường không làm hỏng game; không cấp phát mỗi khung). Cờ `?mvp=` và kho thuộc ST-13-03, nên tạm bật bằng `?debug=1&telemetry=1`, chỉ trong bộ nhớ.
- **Đã làm:** `src/scenes/telemetry/telemetry-service.ts` (dịch vụ, `session_start`, `boot_timing`, lỗi trang), `stage-telemetry.ts` (một lượt màn, `FrameStats`, hướng dẫn, gợi ý NOVA, `stage_progress` khi trang ẩn, `stage_end` khi scene tắt); `logic/telemetry/device.ts` (nhóm thô nền tảng, trình duyệt; ngày; làm tròn); Quầy, Xưởng báo giao dịch qua `onTelemetry`; cờ `TELEMETRY_DEBUG`, `STAFF`.
- **Tiêu chí:** [x] không bật cờ: không có bộ ghi, 0 request ra ngoài; [x] bật cờ: lượt Thorna sinh `session_start`, `boot_timing`, `stage_start`, `section_enter`, `boss_start`, `death`, `boss_end` (death, win), hướng dẫn, `stage_end` (clear); 0 sự kiện sai lược đồ, 0 lỗi console; [x] `session_start` không chứa userAgent (test); [x] `gate-flow` đạt.
- **Chuyển sang ST-13-03:** mã lỗi `SaveManager` (`save_error`), phiên mới sau 30 phút ẩn (QB-154), `msToControl`, `run` lưu qua phiên. `settings_change` chờ màn Cài đặt (EP-14). `death.cause` của boss theo loại đạn; tách theo tên đòn nếu ST-13-05 cần.

## ST-13-05a: Báo cáo cổng MVP

- **Trạng thái:** DONE (14/11/2026) · **Phụ thuộc:** ST-13-01 · **Bằng chứng:** [x] Logic (`tests/mvp-report.test.ts`, 20 test, bộ mẫu `tests/mvp-sample.ts`) [x] Chạy thật (`npm run mvp-report`, `qa/ST-13-05/`) [ ] Visual (không có thay đổi người chơi thấy)
- **Bối cảnh:** GDD 13 mục 6.1–6.5 (chỉ số, ngưỡng, Wilson), 7.3 (báo cáo), 7.4 (quyết định), 9 (trường hợp biên), 10 ý 7. Duyệt QA Lead 14/11 (kèm sửa, đã áp vào GDD 13 bản 1.2): "xong màn" theo `boss_end{win}` đúng boss, không theo `stage_end`; sắp phiên theo `t`, không theo `sid`; lượt nối qua phiên mới (QB-154); đoạn theo `stages.json` `segments` rồi `boss`; MV6 lấy `weaknessOwned` từ `boss_end` rồi `boss_start`, gộp sát thương theo boss, cấm suy từ `dmg`; ngày 0 là tham số bắt buộc; H có ba trạng thái; "Chưa kết luận" khi còn Biên hoặc Thiếu dữ liệu.
- **Đã làm:**
  - `logic/telemetry/report-data.ts`: đọc gói xuất, bảng tải (`{payload}`), mảng lô; kiểm phong bì và lược đồ; khử trùng (`install`, `sid`, `n`); lọc đợt, build, cửa sổ đo ở mức sự kiện; nhóm `data`; loại staff, install mà mọi phiên < 10 s, ghi rác; dựng người chơi và lượt; Wilson.
  - `logic/telemetry/report.ts`: MV1–MV7, H1–H4, phễu, bảng theo màn (đoạn × người tới, chết, kẹt; 5 nguyên nhân chết), thiết bị (chết/phút, hạ Thorna, F1), việc đề xuất theo thứ tự 7.4; in Markdown.
  - `core/mvp-report.ts`: khối `report` của `telemetry.json` (game không đọc, lỗi không tắt đo lường) + `stages.json` → tham số; `runMvpReport`. `scripts/mvp-report.mjs` (Vite `runnerImport`, không thêm thư viện).
  - Dữ liệu: `stages.json` thêm `expectedMin`, `bossFightSec` cho Stage 1–4; danh mục `boss` gồm boss chiến dịch của `stages.json`; `boss_start` ghi `weaknessOwned`, `weaponsOwned`; `boss_end` ghi `weaknessOwned` (ưu tiên 0).
- **Tiêu chí:** [x] bộ mẫu 20 người + 4 install biên cho đúng đáp án MV1–MV7, H1–H4, phễu, bảng đoạn; [x] khoảng Wilson khớp bảng mục 6.5 tới 0,01; [x] phán quyết Đạt / Biên / Không / Thiếu dữ liệu, so x/n không làm tròn; [x] các trường hợp mục 9 (xem `qa/ST-13-05/README.md`); [x] ngưỡng thật với 20 người: MV1–MV6 Thiếu dữ liệu; [x] thiếu `--day0`: MV4 Thiếu dữ liệu; [x] chỉ có Thiếu dữ liệu: Chưa kết luận; [x] script ghi Markdown (test gọi thật).
- **Cần ở Story khác:** Prologue ghi `stage_end{prologue, clear}` lúc chạm lối ra và có danh sách đoạn (EP Prologue; chưa có thì MV1, T1–T4 là Thiếu dữ liệu). Bản đồ thật Stage 1–4 dùng đúng id đoạn `segments` (`A`–`D`, `boss`), thêm test dữ liệu khi có bản đồ (phòng thử hiện dùng `spikes`, `pit`, `vines`…). `received_at` của điểm nhận giữ lại để phát hiện đồng hồ máy sai (ST-13-04).
- **Góp ý chưa làm (không bắt buộc):** H4 nhân ngưỡng theo `enemyHp` của độ khó; H1 thêm cột "vào màn trước ngày 7"; MV7 thêm trung vị theo người.

## ST-13-05b: Chỉ số phụ của báo cáo

- **Trạng thái:** DONE (14/11/2026) · **Phụ thuộc:** ST-13-05a · **Bằng chứng:** [x] Logic (`tests/mvp-report.test.ts`, thêm 6 test) [x] Chạy thật (`qa/ST-13-05/`, mục 7 của báo cáo)
- **Bối cảnh:** GDD 13 mục 6.4 (K1–K6 từ `04-Can-bang-kinh-te.md`, DK1–DK4 từ `11-Do-kho.md`, T1–T4 từ `07-Kich-ban-huong-dan.md`, X1–X5 từ GDD 15, 17, F1 cổng Prototype, S1 từ `14-Cai-dat-Tiep-can.md` mục 10). Không chặn cổng.
- **Đã làm:** `logic/telemetry/report-extra.ts` (chỉ số, bảng mục 7); `core/mvp-report.ts` thêm `parseTargets`, `secondaryParams` (giá rẻ nhất lúc Quầy mở và tổng giá Upgrade tính từ `shop.json`, thu theo màn từ `economy.incomeFormula`, `rewardMul`, thứ tự độ khó); `telemetry.json → report.targets`. Cách tính chốt ở GDD 13 mục 6.4.
- **Tiêu chí:** [x] bộ mẫu cho đúng đáp án K1–K6, DK1–DK4, T1–T4, X1–X5, F1, S1; [x] số liệu game khớp `04` (giá rẻ nhất 200, tổng 14.593, thu 225/300/375/450); [x] mục tiêu sai bị chặn.
- **Cần ở Story khác:** `boot_timing.msToControl` (X3, ST-13-03); EP-14 ghi `settings_change` cho tùy chọn dạng danh sách bằng chỉ số (0 = mặc định); id đổi cỡ nút, tay thuận (`14` mục 10 ý 3) thêm vào `s1Settings` khi EP-14 chốt id.

