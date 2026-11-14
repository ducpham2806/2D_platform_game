# EP-10: Ba độ khó cốt truyện và màn Chuẩn bị

- **Mốc:** MVP (lộ trình Sprint 10–17: "3 độ khó").
- **GDD:** `01-GDD/11-Do-kho.md` (bản 2, Approved 14/11/2026 sau duyệt Creative Director và Technical Director + Producer; người dùng giao toàn quyền quyết định).
- **ADR:** ADR-001 (bảng HTML) cho màn Chuẩn bị.
- **Quy ước Story:** như EP-08, EP-09. Story viết gọn ngay trong file này (mỗi Story có bối cảnh, file, tiêu chí); mỗi Story một commit; Story có hình ảnh lưu ảnh chạy thử ở `04-Dev-Plan/qa/<mã Story>/`.
- **Cổng Prototype:** mẫu đòn Thử thách Stage 1 (ST-10-04, 05) là `[PLACEHOLDER]`, code song song, chốt số sau cổng. Đặt checkpoint theo độ khó lên bản đồ thật cũng sau cổng (ST-10-03 chỉ làm cơ chế).

Producer đề xuất 11 Story nhỏ. Gộp còn 6, vì một số phần (dữ liệu, máu boss, thưởng, bản lưu) đã làm cùng nhau trong ST-10-01 trước khi có kết quả duyệt; phần duyệt yêu cầu thêm nằm ở các Story sau.

| Mã | Tên | Phụ thuộc | Cỡ | Trạng thái |
| --- | --- | --- | --- | --- |
| ST-10-01 | Lõi: dữ liệu độ khó, máu boss × enemyHp, thưởng × rewardMul, bản lưu 4 | | 1,5 ngày | DONE |
| ST-10-02 | Màn Chuẩn bị (HTML), nối StageScene, Kết quả, menu tạm dừng; thưởng boss theo độ khó; nâng bản lưu 3 → 4; cờ `unlock` | 01 | 2 ngày | DONE |
| ST-10-03 | Checkpoint theo độ khó (Tiled `difficulties`, tiến độ theo độ khó); gợi ý NOVA sau 3 lần chết | 02 | 1,5 ngày | |
| ST-10-04 | Khung bản Thử thách (`challenge`, `dataFor`, kiểm tra); 4 kẻ địch Stage 1 và Golem; chấm báo nhịp; kiểm không chết một đòn | 01 | 2,5 ngày | |
| ST-10-05 | Thorna: đòn Rễ Đuổi (logic, kiểm tra telegraph, vẽ) | 04 | 1,5 ngày | |
| ST-10-06 | QA: bot không né ở 3 độ khó, `gate-flow`, chạy thử Chromium | tất cả | 0,5 ngày | |

Thứ tự: 01 → 02 → 03 → 04 → 05 → 06. Tổng khoảng 9,5 ngày.

**Hoãn khỏi MVP:** id checkpoint cố định (khi chốt bản đồ); Data Chip phá đảo Thử thách (cần boss cuối); âm thanh cảnh báo (M12); mẫu đòn Stage 2–4 (theo đặc tả các màn đó).

## ST-10-01: Lõi độ khó (DONE)

- `difficulties.json`: `name`, `desc`, `unlock.clearedOn`, `newAttackPatterns`; `parseDifficulties` kiểm tra id trùng, thiếu `normal`, id mở khóa lạ.
- Máu boss nhân `enemyHp` trong `makeBoss` (BossData mới); thưởng kẻ địch làm tròn theo từng kẻ địch; thưởng boss nhân `rewardMul`.
- Bản lưu 4: `progress.difficulty[campaign] = {last, cleared}`; StageSave ghi `cleared`.
- **Tiêu chí:** [x] Thorna 200/250/312,5; [x] thưởng Thorna 60+40 / 180+120; [x] bản lưu 3 đọc lên bản 4.

## ST-10-02: Màn Chuẩn bị, nối vào game (DONE)

- **Bối cảnh:** GDD 11 mục 2.1–2.3, 6.
- **File:** `game/src/prep/prep-panel.ts`, `game/src/scenes/prep-scene.ts`, `logic/difficulty/{difficulty,prep-model}.ts`, `scenes/{menu,stage}-scene.ts`, `logic/result/stage-result.ts`, `logic/world/stage-world.ts`, `logic/difficulty/normalize-difficulty.ts`, `debug/flags.ts`.
- **Tiêu chí:**
  - [x] AC-1: Menu → phòng chiến dịch (K, M, B, G) mở bảng Chuẩn bị; Thử thách khóa kèm điều kiện; mặc định Thường; Bắt đầu 1 chạm.
  - [x] AC-2: Chọn Cốt truyện: Thorna 200 máu; menu tạm dừng "· Cốt truyện"; vào lại thì chọn sẵn Cốt truyện.
  - [x] AC-3: Hạ Thorna ở Cốt truyện: Thử thách vẫn khóa; hạ ở Thường: Kết quả có "Độ khó: Thường" và "Đã mở Thử thách cho màn này"; thưởng boss nhận ở cả hai lượt (40 rồi 80 Core Bit), vũ khí chỉ lần đầu.
  - [x] AC-4: Hạ boss xám ở phòng Golem không ghi `cleared`.
  - [x] AC-5: Bản lưu 3 đã hạ Thorna mở thẳng Thử thách.
  - [x] AC-6: Nút "Chơi lại" giữ độ khó. `?debug=1&unlock=1` mở mọi độ khó.
  - [x] AC-7: Ảnh PC và Pixel 7 ngang ở `04-Dev-Plan/qa/ST-10-02/`; nút ≥ 48 px; không cuộn; không lỗi console; `gate-flow` đạt.
- **Kết quả chạy thử** (Chromium, bản build, PC 960×576 và Pixel 7 ngang):
  - Bảng Chuẩn bị đúng như AC-1 và AC-2.
  - Hạ Thorna ở Cốt truyện: +40 Core Bit, có Vine Lash, Thử thách vẫn khóa.
  - Hạ Thorna ở Thường: +80 (tổng 120), Kết quả ghi độ khó và "Đã mở Thử thách"; vào Thử thách thì máu 312,5.
  - Pixel 7: nút thấp nhất 56 px, bảng 306 px trong màn 360 px.
  - `?unlock=1` mở Thử thách. Không lỗi console; `gate-flow` đạt.
  - Ảnh: `04-Dev-Plan/qa/ST-10-02/`.

## ST-10-03: Checkpoint theo độ khó, gợi ý NOVA

- **Bối cảnh:** GDD 11 mục 2.4, 2.5.
- **File:** `logic/stage/{layout,tiled}.ts` (thuộc tính `difficulties`), `logic/world/stage-world.ts` (lọc, bộ đếm chết liên tiếp), `logic/save/{save-data,stage-save}.ts` (`checkpointBy`), `03-Data/ui.json` (`difficultyHint`), `core/ui-config.ts`, `scenes/stage-scene.ts` (hộp gợi ý riêng).
- **Tiêu chí:**
  - [ ] AC-1: Checkpoint `difficulties: "story,normal"` không có ở Thử thách: đi qua không ghi, không hồi sinh ở đó.
  - [ ] AC-2: Đạt CP3 ở Thường rồi vào Cốt truyện: xuất phát CP3; vào Thử thách: từ đầu màn (chưa đạt gì ở Thử thách). Đạt CP2 ở Thử thách rồi vào Thường: xuất phát CP2.
  - [ ] AC-3: Bản lưu 3 có `checkpoint: 2` thành `checkpointBy.normal = 2`.
  - [ ] AC-4: Chết 3 lần liên tiếp: một câu NOVA đúng độ khó, tự tắt sau 6 s; rơi hố không tính; chạm checkpoint hoặc cửa đấu trường đóng thì đếm lại; tắt hướng dẫn thì không hiện.

## ST-10-04: Bản Thử thách của kẻ địch Stage 1 và Golem

- **Bối cảnh:** GDD 11 mục 2.6, 3.1, 3.2.
- **File:** `core/deep-merge.ts`, `core/enemy-config.ts`, `core/boss-config.ts`, `core/game-config.ts` (`dataFor`, kiểm tra không chết một đòn), `logic/enemy/behaviors.ts`, `scenes/stage/enemy-renderer.ts` (chấm nhịp), `03-Data/enemies.json`.
- **Tiêu chí:**
  - [ ] AC-1: Khối `challenge` hỏng (ghi đè `behavior`, telegraph < 0,4 s, nhịp sai) bị từ chối khi nạp, đường dẫn lỗi ghi `enemies.<id>.challenge`.
  - [ ] AC-2: Drone Lính bắn 2 viên cách 0,25 s, viên 2 nhắm lại; Bướm Sắt thả 2 hạt cách 0,4 s; Tháp Gai 2 loạt lệch 7,5° và Kai nhảy đúng lúc thì không trúng; Lính Kén lao nối; Golem lao xong giậm ra sóng.
  - [ ] AC-3: Thường dùng bản gốc (test cũ giữ nguyên).
  - [ ] AC-4: Kiểm tra lúc nạp: đòn mạnh nhất × `damageTaken` lớn nhất < máu cấp 1.

## ST-10-05: Thorna, đòn Rễ Đuổi

- **Bối cảnh:** GDD 11 mục 3.3.
- **File:** `core/boss-config.ts` (`stalk`, kiểm telegraph), `logic/boss/boss.ts`, `scenes/stage/stage-renderer.ts`, `03-Data/bosses.json`.
- **Tiêu chí:**
  - [ ] AC-1: Pha 2 có Rễ Đuổi ở Thử thách, không có ở Thường.
  - [ ] AC-2: 4 rễ trồi ở mặt Kai đang đứng (cả trên bục) 0,6 s sau đánh dấu; pha 3 là 0,5 s.
  - [ ] AC-3: Kai đứng yên trúng; Kai chạy liên tục không trúng (test).
  - [ ] AC-4: Ảnh chạy thử vệt tím và tư thế.

## ST-10-06: QA độ khó

- [ ] Bot không né (cấp 4) thua Thorna ở Thường và Thử thách; Cốt truyện ghi lại kết quả (chủ đích có thể thắng).
- [ ] `gate-flow`, `gate-check` đạt; chạy thử Chromium 3 độ khó.
