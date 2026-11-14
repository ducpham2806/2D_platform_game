# Bản đồ hệ thống và tài liệu

Lập 14/11/2026 theo bước `/map-systems` của Game Studio Agent (`game-gdd-architect`); cập nhật cùng ngày sau rà soát toàn bộ tài liệu. Mục đích: biết mỗi hệ thống đã có tài liệu đủ để code chưa và nằm ở epic nào. **Trạng thái code** của từng module chỉ ghi ở bảng module trong `game/CONTEXT.md`; cột Code dưới đây chỉ tóm tắt.

Quy ước "Tài liệu":

- **Đủ:** đặc tả có số liệu, quy tắc, quy tắc biên, tiêu chí nghiệm thu; code được ngay.
- **Draft:** đã viết đủ khung, chưa qua duyệt Director; số `[PLACEHOLDER]` hoặc `[SAU CỔNG]`.
- **Thiếu số liệu:** có mô tả nhưng thiếu danh sách, con số hoặc quy tắc biên.

## 1. Bản đồ hệ thống (MVP trước)

| ID | Hệ thống | Ưu tiên | Tài liệu nguồn | Tài liệu | Code | Epic |
| --- | --- | --- | --- | --- | --- | --- |
| M1–M4 | Khung, đầu vào, nhân vật, chiến đấu | P0 | GDD 5, `player.json`, `weapons.json`, `17-Quy-tac-bien.md` mục 1–2 | Đủ | Xong | — |
| M5 | Kẻ địch Prologue, Stage 1 | P0 | `02-Dac-ta-Prologue-Stage1.md` mục 4 | Đủ | Xong | — |
| M5 | Kẻ địch Stage 2–4 (6 loại mới + 3 mini-boss) | P0 | `16-Dac-ta-Stage2-4-nhap.md` | Approved (ủy quyền) | Chưa | EP-15, EP-17 |
| M6 | Boss Thorna | P0 | Đặc tả Stage 1 mục 5, `17-…` mục 4 | Đủ | Xong | — |
| M6 | Boss Lumen, Cryo, Aeris | P0 | `16-…` mục 3–5 | Approved (ủy quyền) | Chưa | EP-15 |
| M7 | Màn Prologue, Stage 1 | P0 | Đặc tả Stage 1 mục 2–3 | Đủ (chốt sau cổng Prototype) | Khung | EP-16 |
| M7 | Màn Stage 2–4, cơ chế môi trường (laser, gương, băng, gió, bệ mây) | P0 | `16-…` mục 2–5 | Draft (bố cục `[SAU CỔNG]`) | Chưa | EP-15 (logic), EP-17 (bản đồ) |
| M8 | Cấp, EXP, SP, đồng bộ cấp | P0 | GDD 6.1, `10-He-thong-RPG-Xuong.md` | Đủ | Xong | — |
| M8 | Cây kỹ năng, Xưởng tab Kỹ năng | P0 | `10-…` (Approved) | Đủ | Xong | — |
| M8 | Module, Két giáp, Xưởng tab Module/Giáp | P0 | `10-…` mục 2.2–2.3 | Đủ (ST-08-09 tách 4 phần) | Chưa | EP-18 |
| M8 | Loadout, Tủ skin | P2 (Alpha) | Đặc tả Hub mục 5 | Đủ cho Alpha | Chưa | Alpha |
| M9 | Shop chỉ Upgrade | P0 | GDD 10.1, đặc tả Hub mục 4, `04-Can-bang-kinh-te.md`, EP-09 | Đủ | Xong | — |
| M9 | Booster, Skin, Premium | P1 (Alpha) | đặc tả Hub, `05-…` | Đủ | Chưa | Alpha |
| M10 | HUD, hội thoại boss, Kết quả, Chuẩn bị | P0 | wireframe, GDD 11, `17-…` mục 8–9 | Đủ | Xong (hộp chữ theo thứ tự ưu tiên) | — |
| M10 | Hub dạng menu MVP, Cài đặt, tiếp cận, hộp chữ, cỡ chữ, safe-area | P0 | `14-Cai-dat-Tiep-can.md`, `03-Dac-ta-Hub-Shop.md`, `07-Kich-ban-huong-dan.md` (H01–H04), `17-…` mục 8–11 | Draft (14) | Khung Hub | EP-14 |
| M10 | Bản địa hóa (vi, en) | P1 | `07-…` mục 8.3, `14-…` | Thiếu số liệu (danh sách chuỗi) | Chưa | EP-14 (nền) |
| — | Nhiệm vụ phụ Stage 1–4 | P0 | `15-Nhiem-vu-phu.md` | Approved (ủy quyền; vị trí trên bản đồ `[SAU CỔNG]`) | Chưa | EP-18 |
| — | 3 độ khó, mẫu đòn Thử thách | P0 | `11-Do-kho.md` (Approved), `difficulties.json` | Đủ cho Stage 1; Stage 2–4 trong `16-…` | Xong (Stage 1) | EP-10 (xong), EP-15 |
| TUT | Hướng dẫn Prologue, Stage 1, Hub | P0 | `07-…` | Đủ (lời chuẩn ở `tutorial.json`) | Khung | EP-14, EP-16 |
| M11 | Lưu cục bộ, mã sao lưu | P0 | Đặc tả Hub mục 8, `17-…` mục 11 | Đủ | Xong (bản lưu 4) | EP-14 (báo lỗi lưu), EP-18 (bản lưu kế tiếp) |
| M12 | Âm thanh MVP | P1 | `12-Am-thanh.md` | Draft | Chưa | EP-12 |
| M16 | Đo lường MVP | P1 | `13-Do-luong-MVP.md`, `adr/ADR-002-do-luong-mvp.md` | Draft; kênh gửi chờ người dùng | Nhật ký chơi thử cục bộ | EP-13 |
| QA | Cổng Prototype, Vertical slice, MVP | P0 | `05-Cong-Prototype.md`, `08-Cong-MVP.md`, `04-Test-va-Launch.md` | Đủ | Đo tự động cổng Prototype xong | EP-11, EP-19, EP-20 |
| M13–M17 | Live-ops, kiếm tiền, endgame, đóng gói | P3 (sau cổng MVP) | `05-`, `06-`, `04-…` | Đủ cho mức hiện tại (rà soát 14/11) | Chưa | Giai đoạn 2 |

## 2. Danh sách tài liệu thiết kế

| File | Nội dung | Trạng thái |
| --- | --- | --- |
| `01-GDD/01-GDD-chinh.md` | Tầm nhìn, trụ cột, mọi hệ thống ở mức tổng | Bản 0.8 (rà soát 14/11) |
| `02-Dac-ta-Prologue-Stage1.md` | Prologue, Stage 1, Thorna | Đủ; chốt bố cục sau cổng |
| `03-Dac-ta-Hub-Shop.md` | Hub, Quầy, Chuẩn bị, Xưởng, nhiệm vụ, lưu | Đủ |
| `04-Can-bang-kinh-te.md` | Nguồn–chi Core Bit, Data Chip, giá | Đủ |
| `05-Ke-hoach-kiem-tien.md`, `06-Ke-hoach-quang-cao.md` | Kiếm tiền, live-ops, quảng cáo; quy tắc biên kiếm tiền | Đủ (sau cổng MVP) |
| `07-Kich-ban-huong-dan.md`, `08-Giong-nhan-vat.md`, `09-Thoai-Warden.md` | Hướng dẫn, giọng nhân vật, thoại boss | Đủ |
| `10-He-thong-RPG-Xuong.md` | Cấp, kỹ năng, module, giáp, Upgrade | Approved |
| `11-Do-kho.md` | Ba độ khó, bản Thử thách | Approved |
| `12-Am-thanh.md` | Âm thanh MVP | Draft (14/11) |
| `13-Do-luong-MVP.md` | Sự kiện đo lường cho cổng MVP | Draft (14/11) |
| `14-Cai-dat-Tiep-can.md` | Cài đặt, tiếp cận | Draft (14/11) |
| `15-Nhiem-vu-phu.md` | 4 nhiệm vụ phụ, bản lưu kế tiếp | Approved (ủy quyền, 14/11, sau duyệt Director) |
| `16-Dac-ta-Stage2-4-nhap.md` | Stage 2–4 (phần không phụ thuộc cảm giác) | Approved (ủy quyền, 14/11, sau duyệt Director); bố cục `[SAU CỔNG]` |
| `17-Quy-tac-bien.md` | 92 quy tắc biên, trạng thái code | Approved (ủy quyền, sau duyệt Director) |

Thứ tự đọc khi bắt đầu một loại việc: `04-Dev-Plan/00-Bat-dau.md`.

## 3. Danh mục tên chuẩn (entity registry rút gọn)

Tên dùng chung giữa tài liệu, dữ liệu và mã. Thêm tên mới ở đây trước khi dùng ở tài liệu khác. **Dữ liệu (`03-Data`) là chuẩn khi lệch.**

| Nhóm | Tên chuẩn | Ghi chú |
| --- | --- | --- |
| Màn | `prologue` (chưa có trong `stages.json`), `verdant_gardens`, `prism_institute`, `cryo_vault`, `cirrus_tower`, `bedrock_mines`, `ion_station`, `abyss_harbor`, `magma_foundry` | `stages.json → id` |
| Boss | `thorna`, `lumen`, `cryo`, `aeris`, `terra`, `voltaire`, `marina`, `pyra`; `gray` (boss xám, chỉ để thử) | `bosses.json`, `dialogue_wardens.json` |
| Kẻ địch Stage 2–4 | `guong_quang`, `thap_laser`, `nguoi_tuyet_may`, `thap_bang`, `chim_cat_gio`, `coi_xoay`; mini-boss `prism_sentinel`, `frost_titan`, `gale_roc` | `16-…` mục 9 |
| Đòn boss mới | `beam`, `focus`, `shatter`, `gust`, `twister` | `16-…` mục 9 |
| Cơ chế màn | `laser`, `mirror`, `sensor`, `ice`, `crumble`, `wind`, `cloud`, `coolant` | `stages.json → mechanics` (chưa có) |
| Vũ khí | `Arc Cannon`, `Vine Lash`, `Prism Beam`, `Frost Shard`, `Gale Cutter`, `Quake Drill`, `Chain Bolt`, `Torrent Wave`, `Ember Burst` | Tên hiển thị dùng làm khóa trong `weapons.json` |
| Tiền tệ | `core_bit`, `data_chip`, `gem` | Khóa trong `economy.json`; bản lưu `inventory.coreBits`, `inventory.dataChips` (bản lưu kế tiếp). Gem do máy chủ giữ (sau cổng MVP) |
| Chỉ số nhân vật | `level`, `exp`, `skillPoints`, `maxHp`, `attackMul`, `damageTakenMul`, `chargeTimeMul` | "Cấp hiệu dụng" là cấp sau đồng bộ cấp |
| Kỹ năng | `V1`–`V3`, `P1`–`P3`, `C1`–`C3` | `10-…` mục 2.1 |
| Module | `magnet_core`, `last_stand`, `phase_step`, `energy_siphon`, `spike_guard`, `second_wind`, `scholar`, `echo_shot` | `modules.json` |
| Giáp | `head_mk1`, `body_mk1`, `arm_mk1`, `leg_mk1`, và `_mk2` tương ứng | `stages.json → armorCache`; `armor.json` chưa có (EP-18). Sửa 14/11: trước ghi nhầm `legs_mk1` |
| Upgrade | `arc_core`, `armor_plating`, `energy_cell`, `nano_cell_cap`, `dash_coil`, `magnet_range`, `booster_slot` | `shop.json` |
| Booster | `shield_cell`, `repair_kit`, `overcharge`, `magnet_pulse`, `second_chance`, `boss_scanner` | `shop.json` |
| Độ khó | `story`, `normal`, `challenge` (Cốt truyện, Thường, Thử thách) | `difficulties.json` |
| Nhiệm vụ phụ | `sq_*` (một nhiệm vụ mỗi màn Stage 1–4); vật `seed_1…5`, `mirror_1…6`; class Tiled `questItem`, `questTarget`, `questZone`; bản lưu `sideQuests` | `15-…` mục 3; `quests.json` chưa có |
| Quy tắc biên | `QB-01` … `QB-146` (92 luật, số có khoảng trống theo nhóm) | `17-Quy-tac-bien.md` |
| Âm thanh (Draft) | 5 bus `master`, `music`, `sfx`, `alert`, `ui`; id âm dạng `nhóm.tên` (`kai.dash.air`, `thorna.stalk.tele`, `ui.confirm`); cài đặt ở `cv.audio` | `12-Am-thanh.md`; `audio.json` chưa có |
| Cài đặt (Draft) | `cv.settings` (bản 1), `cv.controls` (bản 2), `cv.audio`; id tùy chọn theo `14-Cai-dat-Tiep-can.md` mục 3 | `ui.json → settings` chưa có |
| Sự kiện đo lường (Draft) | 24 sự kiện dạng `snake_case` (`stage_start`, `stage_end`, `survey_answer`…); lược đồ 2, khóa `cv.telemetry` | `13-Do-luong-MVP.md` mục 3; `telemetry.json` chưa có |
