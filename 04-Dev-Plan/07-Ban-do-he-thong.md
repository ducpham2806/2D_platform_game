# Bản đồ hệ thống và tài liệu còn thiếu

Lập ngày 14/11/2026 theo bước `/map-systems` của Game Studio Agent (`game-gdd-architect`). Mục đích: biết mỗi hệ thống đã có tài liệu đủ để code chưa, cái gì còn thiếu, làm theo thứ tự nào. Cập nhật khi thêm tài liệu hoặc khi một hệ thống đổi trạng thái.

Quy ước "Tài liệu":

- **Đủ:** có đặc tả kèm số liệu, quy tắc, tiêu chí nghiệm thu; code được ngay.
- **Thiếu số liệu:** có mô tả trong GDD nhưng thiếu danh sách, con số hoặc quy tắc biên.
- **Chưa có:** chỉ có một dòng trong GDD hoặc wireframe.

## 1. Bản đồ hệ thống (MVP trước)

| ID | Hệ thống | Loại | Ưu tiên | Phụ thuộc | Tài liệu nguồn | Tài liệu | Code |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1–M4 | Khung, đầu vào, nhân vật, chiến đấu | Core | P0 | | GDD 5, DEV-HANDOFF, `player.json`, `weapons.json` | Đủ | Xong |
| M5 | Kẻ địch Prologue, Stage 1 | Gameplay | P0 | M4 | `02-Dac-ta-Prologue-Stage1.md` mục 4 | Đủ | Xong |
| M5 | Kẻ địch Stage 2–4 (12 loại + 3 mini-boss) | Gameplay | P0 | M4 | GDD 9.1 (chỉ có tên), wireframe `Stage2–4.html` | **Chưa có** | Chưa |
| M6 | Boss Thorna | Gameplay | P0 | M4, M5 | Đặc tả Stage 1 mục 5 | Đủ | Xong |
| M6 | Boss Lumen, Cryo, Aeris | Gameplay | P0 | M4, M5 | GDD 9 (quy tắc chung), thoại ở `09-Thoai-Warden.md` | **Chưa có** (pha, đòn, telegraph, sát thương) | Chưa |
| M7 | Màn Prologue, Stage 1 | Gameplay | P0 | M3, M5 | Đặc tả Stage 1 mục 2–3 | Đủ (chờ cổng Prototype mới chốt) | Khung xong |
| M7 | Màn Stage 2–4 và cơ chế môi trường (laser và gương, sàn trơn và băng vỡ, gió và bệ mây) | Gameplay | P0 | M3, M5 | GDD 8.2, wireframe `Stage2–4.html` | **Chưa có** | Chưa |
| M8 | Cấp, EXP, SP, đồng bộ cấp | Progression | P0 | M4 | GDD 6.1, `player.json`, `stages.json` | Đủ | Xong (Sprint 8) |
| M8 | Cây kỹ năng, module, Két giáp, Xưởng | Progression | P0 | M8 cấp, M11 | `01-GDD/10-He-thong-RPG-Xuong.md` (Approved) | **Đủ** (duyệt 14/11/2026) | Tab Kỹ năng và cả 9 nút có tác dụng trong trận (ST-08-01…08); âm thanh kỹ năng chờ M12; Module, Giáp bị chặn |
| M8 | Loadout, Tủ skin | Progression, Meta | P2 (Alpha) | M8, M9 | Đặc tả Hub mục 5, wireframe | Đủ cho Alpha | Chưa |
| M9 | Shop chỉ Upgrade | Economy | P0 | M8 | GDD 10.1, đặc tả Hub mục 4, `shop.json`, `04-Can-bang-kinh-te.md`, Epic `stories/EP-09-quay-upgrade.md` | Đủ (khoảng trống lấp trong EP-09) | **Xong** (14/11, Quầy Mira từ menu; Hub ở Alpha) |
| M9 | Booster | Economy | P1 (mở sau boss 4) | M9 | như trên | Đủ | Chưa |
| M10 | HUD, hội thoại, Kết quả | UI | P0 | | wireframe | Đủ | Xong |
| M10 | Hub dạng menu, màn Chuẩn bị (độ khó, booster) | UI | P0 | M8, M9 | Đặc tả Hub mục 2–3, `Prep.html` | Đủ (cần ghi rõ bản cắt MVP: Hub là menu) | Khung Hub |
| M10 | Cài đặt, tiếp cận (mù màu, giảm rung, phụ đề lớn, tự tiến thoại) | UI | P1 | | GDD 11, wireframe `Settings*`, `Access.html` | Thiếu số liệu (giá trị từng tùy chọn) | Chưa |
| — | Nhiệm vụ phụ Stage 1–4 (nguồn module) | Gameplay, Meta | P0 | M7 | Đặc tả Hub mục 7 (tên và mục tiêu) | Thiếu số liệu (vị trí, cách đếm, lưu) | Chưa |
| — | 3 độ khó, mẫu đòn Thử thách | Gameplay | P0 | M5, M6 | GDD 11, `difficulties.json` | Thiếu số liệu ("mỗi boss thêm 1 đòn" chưa có đòn cụ thể) | Hệ số có, mẫu đòn chưa |
| TUT | Hướng dẫn Prologue, Stage 1, Hub (R, D) | UI, Narrative | P0 | M7, M10 | `07-Kich-ban-huong-dan.md` | Đủ | Khung xong |
| M11 | Lưu cục bộ, mã sao lưu | Persistence | P0 | | Đặc tả Hub mục 8 | Đủ | Xong |
| M12 | Âm thanh (SFX, nhạc, cảnh báo đòn boss) | Audio | P1 (nên có trước đợt thử MVP 50 người) | M1 | GDD 14 (10 dòng) | **Chưa có** (danh sách âm, bus, quy tắc cảnh báo) | Chưa |
| M16 | Đo lường cho đợt thử MVP | Meta | P1 | | GDD 17, `04-Can-bang-kinh-te.md` mục 15 | Thiếu số liệu (danh sách sự kiện, ở MVP gửi đi đâu) | Nhật ký chơi thử cục bộ |
| M13–M17 | Live-ops, kiếm tiền, endgame, đóng gói | Meta | P3 (sau cổng MVP) | | `05-`, `06-`, `04-Can-bang-kinh-te.md` | Đủ cho mức hiện tại | Chưa |

## 2. Tài liệu còn thiếu và thứ tự đề xuất

| Thứ tự | Tài liệu | Vì sao lúc này | Trạng thái |
| --- | --- | --- | --- |
| 1 | **Hệ thống RPG và Xưởng** (`01-GDD/10-He-thong-RPG-Xuong.md`) + ADR-001 (Xưởng dựng bằng bảng HTML) | Không phụ thuộc cổng Prototype, code M8 đã bắt đầu, wireframe đã có | **Bản 2 đã qua duyệt Creative Director và Technical Director + Producer (duyệt kèm sửa, đã sửa); chờ người dùng duyệt 5 quyết định ở mục 10** |
| 2 | **Story cho EP-08** (`04-Dev-Plan/stories/`) | Để code từng phần ≤ 1–2 ngày, mỗi Story chứa đủ số liệu | **Đã viết** 9 Story (ST-08-01…09; ST-08-09 bị chặn) theo bản 2 |
| 3 | Âm thanh MVP (M12): danh sách SFX tối thiểu, nhạc, bus, cảnh báo đòn boss | Không phụ thuộc cổng; đợt thử 50 người mà không có âm thanh thì điểm "vui" bị kéo xuống | Đề xuất làm tiếp |
| 4 | Đo lường MVP (M16 bản tối thiểu): danh sách sự kiện, cách gom dữ liệu khi chưa có máy chủ | Cổng MVP đo 50 người; cần biết đo gì trước khi làm màn | Đề xuất làm tiếp |
| 5 | **Đặc tả Stage 2–4** (bố cục, cơ chế môi trường, 12 kẻ địch, 3 mini-boss, boss Lumen, Cryo, Aeris kèm đòn Thử thách, nhiệm vụ phụ) theo mẫu `02-Dac-ta-Prologue-Stage1.md` | Khối lớn nhất của MVP, nhưng **phụ thuộc thông số cảm giác** (nhảy, lướt, nạp) mà cổng Prototype có thể đổi; cổng nói rõ không thêm hệ thống mới khi chưa qua | **Chờ kết quả cổng Prototype**. Trong lúc chờ có thể viết phần không phụ thuộc cảm giác: chủ đề, danh sách kẻ địch với vai trò, ý tưởng đòn boss (chưa có số) |
| 6 | Cài đặt và tiếp cận: giá trị từng tùy chọn | Cần trước bản web MVP, không gấp | Sau 3–4 |

**Phương án đề xuất (tốt nhất cho tiến độ một người, khoảng 20 giờ/tuần):** làm theo thứ tự 1 → 2 → code EP-08 (phần không bị chặn) → 3 → 4, song song chờ cổng Prototype; khi qua cổng thì viết 5 rồi làm màn. Lý do: mọi việc trước 5 đều không bị thông số cảm giác ảnh hưởng, nên không phải làm lại; còn Stage 2–4 viết sớm thì mỗi lần chỉnh độ cao nhảy hay tốc độ lướt sẽ phải sửa khe nhảy, khe né trong cả ba đặc tả.

## 3. Danh mục tên chuẩn (entity registry rút gọn)

Tên dùng chung giữa tài liệu, dữ liệu và mã. Thêm tên mới ở đây trước khi dùng ở tài liệu khác.

| Nhóm | Tên chuẩn | Ghi chú |
| --- | --- | --- |
| Màn | `prologue` (giai đoạn hướng dẫn, chưa có trong `stages.json`), `verdant_gardens`, `prism_institute`, `cryo_vault`, `cirrus_tower`, `bedrock_mines`, `ion_station`, `abyss_harbor`, `magma_foundry` | `stages.json` → `id` |
| Boss | `thorna`, `lumen`, `cryo`, `aeris`, `terra`, `voltaire`, `marina`, `pyra`; `gray` (boss xám, chỉ để thử) | `bosses.json`, `dialogue_wardens.json` |
| Vũ khí | `Arc Cannon`, `Vine Lash`, `Prism Beam`, `Frost Shard`, `Gale Cutter`, `Quake Drill`, `Chain Bolt`, `Torrent Wave`, `Ember Burst` | Tên hiển thị dùng làm khóa trong `weapons.json` |
| Tiền tệ | `core_bit`, `data_chip`, `gem` | Khóa trong `economy.json`; trong bản lưu là `inventory.coreBits` (camelCase). Gem do máy chủ giữ (sau cổng MVP) |
| Chỉ số nhân vật | `level`, `exp`, `skillPoints`, `maxHp`, `attackMul`, `damageTakenMul`, `chargeTimeMul` | Cấp hiệu dụng sau đồng bộ cấp gọi là "cấp hiệu dụng" |
| Kỹ năng | `V1`–`V3` (Vanguard), `P1`–`P3` (Phantom), `C1`–`C3` (Core) | `10-He-thong-RPG-Xuong.md` mục 2.1 |
| Module | `magnet_core`, `last_stand`, `phase_step`, `energy_siphon`, `spike_guard`, `second_wind`, `scholar`, `echo_shot` | `modules.json` |
| Giáp | `head_mk1`, `body_mk1`, `arm_mk1`, `legs_mk1`, và `_mk2` tương ứng | `armor.json` (mới) |
| Upgrade | `arc_core`, `armor_plating`, `energy_cell`, `nano_cell_cap`, `dash_coil`, `magnet_range`, `booster_slot` | `shop.json` |
| Booster | `shield_cell`, `repair_kit`, `overcharge`, `magnet_pulse`, `second_chance`, `boss_scanner` | `shop.json` |
| Độ khó | `story`, `normal`, `challenge` (hiển thị: Cốt truyện, Thường, Thử thách) | `difficulties.json` |
