# Kế hoạch làm việc

*Cập nhật 14/11/2026 theo rà soát toàn bộ tài liệu (Producer, `/sprint-plan`, `/gate-check`). Bản đầy đủ cũ (vòng lặp ChatGPT, nhịp tuần, rủi ro): `luu-tru/01-Ke-hoach-lam-viec-ban-day-du.md`, chỉ đọc khi cần lịch sử.*

## Quy tắc

- Mọi chỉ số đọc từ `03-Data/*.json`, có kiểm tra trong `game/src/core/*-config.ts`. Mỗi Story một commit; **tag git ở cuối mỗi mốc** (`gate-r1`, `vs`, `mvp`).
- Story viết theo mẫu `templates/story-template.md` trong repo Game Studio Agent: nhúng tóm tắt GDD/ADR và mã quy tắc biên `QB-xx` (`01-GDD/17-Quy-tac-bien.md`), danh sách file, AC có hot-path nếu chạm vòng lặp khung hình.
- "Xong" (DoD): test, lint, format, build đạt; chạy trên PC và Pixel 7 giả lập; Story có hình ảnh lưu ảnh ở `04-Dev-Plan/qa/<mã Story>/`; Story có giao diện chạy `npm run gate-flow`; thay đổi thiết kế lan sang Story, `game/CONTEXT.md`, file quyết định (`game/docs/quyet-dinh/`); ghi nhật ký. Mẫu kiểm: `.github/pull_request_template.md`.
- **Ước lượng:** việc code tính theo Story (thường ≤ 1 phiên). Việc của người (chơi thử, asset, âm thanh, duyệt) tính theo **ngày lịch**: đây là đường găng thật.
- **Không mở epic gameplay phụ thuộc cảm giác điều khiển trước quyết định G1** (cổng Prototype). Trước G1 chỉ làm việc không phụ thuộc cảm giác.
- Trạng thái module chỉ ghi một nơi: bảng module trong `game/CONTEXT.md`. File này và `07-Ban-do-he-thong.md` chỉ trỏ tới.

## Đã xong (Sprint 1–8, tới 14/11/2026)

| Sprint | Mốc | Kết quả |
| --- | --- | --- |
| 1–4 | Khởi động, Prototype | M0–M4, boss xám; đo tự động đạt; bản người thử `?gate=1`, `npm run gate-flow`. **Còn chơi thử 5 người** |
| 5–8 | Vertical slice (phần code) | M5, khung M7, M6 Thorna (250 máu), M10 HUD, hội thoại, Kết quả, M11 lưu cục bộ, khung hướng dẫn |
| 8 | MVP (phần không phụ thuộc cảm giác) | EP-08 Xưởng tab Kỹ năng + 9 kỹ năng; EP-09 Quầy Mira (Upgrade); EP-10 ba độ khó, màn Chuẩn bị, mẫu đòn Thử thách Stage 1 |
| 8 | Rà soát tài liệu | 4 báo cáo, sửa 7 lỗi code, `17-Quy-tac-bien.md`, tài liệu 12–16, kế hoạch này |

## Giai đoạn 1: chứng minh game vui (còn lại)

**Ba cổng quyết định:**

| Cổng | Khi nào | Tiêu chí | Không qua thì |
| --- | --- | --- | --- |
| **G1 Prototype** | Sau EP-11 | `05-Cong-Prototype.md` (cảm ứng là tiêu chí chính) | Sửa cảm giác theo mục 6 file đó, đợt 2 với 5 người mới; dừng epic gameplay mới |
| **G2 Vertical slice** | Sau EP-16 | 5 người: Prologue ≥ 90%, Stage 1 ≥ 70% (đo bằng lõi EP-13; tài liệu cổng viết ở EP-16) | Sửa Prologue, Stage 1; chưa làm Stage 2–4 trên bản đồ |
| **G3 MVP** | EP-20 (S19–S21) | GDD chính mục 16 + `08-Cong-MVP.md` | Sửa cảm giác và màn, **không** thêm hệ thống |

**Công suất `[PLACEHOLDER]`:** 1 sprint ≈ 1 tuần lịch ≈ 5 phiên code. "Ngày" ước lượng trong tài liệu hệ thống (12–16) tính là 1 phiên. Việc của người (chơi thử, asset, duyệt) không nằm trong công suất này và chạy song song.

**Lộ trình sprint** (duyệt Technical Director + Producer 14/11/2026, đã sửa theo duyệt):

| Sprint | Điều kiện bắt đầu | Epic | Nội dung chính | Tài liệu nguồn |
| --- | --- | --- | --- | --- |
| S9 | Ngay | EP-11 Cổng Prototype đợt 1 | **Trước khi phát link:** safe-area cho lớp nút cảm ứng và HUD (QB-92; cảm ứng là tiêu chí chính của G1), chạy thử Pixel 7 và iPhone giả lập. Rồi đóng băng bản thử (merge PR, tag `gate-r1`); code mới sau đó ở nhánh mới để không lẫn vào bản người thử. 5 người (≥ 3 cảm ứng); tổng hợp vào mục 7 file 05 | `05-Cong-Prototype.md` |
| S9–S13 (xen) | Sau tag `gate-r1`; ST-21-05 chờ người dùng chọn hướng đồ họa | EP-21 Chuyển PR #9 | PR #9 (phiên 13/11, song song, không merge): ST-21-01 chuỗi hướng dẫn QB-88 (xong); 02 smoke check; 03 âm tạm cho EP-12; 04 hạt, co giãn hình (sau G1); 05 đồ họa vẽ bằng mã (2–3 phiên); 06 chuỗi vi/en cho EP-14. Xong thì đóng PR #9 | `stories/EP-21-chuyen-PR9.md`, `09-Quyet-dinh-cho-duyet.md` mục 3 |
| S9–S13 (xen) | Người dùng chọn 2.5D (14/11) | EP-22 Đồ họa 2.5D three.js | ST-22-01 demo (xong 14/11); đo trên máy thật sau đợt thử G1; duyệt ADR-003; lớp vẽ chung; pipeline model glTF. Asset pixel art (P0, P1) dừng | `adr/ADR-003-do-hoa-25d-threejs.md`, `stories/EP-22-do-hoa-25d.md` |
| S9–S10 | Ngay | EP-13 Đo lường MVP, phần lõi | Logger thuần, bộ đệm, xuất JSON (ST-13-01, 02 **xong 14/11**; ST-13-05): không cần ADR-002, dùng được cho G2. Kênh gửi (ST-13-03, 04) theo ADR-002 khi người dùng chọn | `01-GDD/13-Do-luong-MVP.md`, `adr/ADR-002-do-luong-mvp.md` |
| S9–S10 | Ngay | EP-12 Âm thanh MVP (M12) | AudioService (dừng khi ẩn tab), SFX theo `WorldEvents`, cue âm cho mọi báo trước (bus `alert`), một bản nhạc boss chung 3 lớp theo pha, 5 thanh âm lượng và Tắt tiếng; chạy được với âm câm khi chưa có file (ST-12-01…08) | `01-GDD/12-Am-thanh.md` |
| S9–S10 | Ngay (người làm) | Asset P0 | 10 sheet nhóm P0; nạp atlas (M1) | `05-Assets/01-Huong-dan-asset.md` |
| S10–S14 (xen) | EP-12 có âm lượng | EP-14 Giao diện MVP | Cài đặt và tiếp cận (ST-14-01…07); rồi Hub dạng menu (Prologue + 4 màn, khóa theo tiến trình, ẩn phòng thử), hộp chữ, chữ ≥ 16 sp, nút ≥ 48 dp, tự tạm dừng, lỗi lưu, bỏ qua thoại, i18n nền, R02–R04, H01–H04 (ST-14-08 trở đi) | `14-Cai-dat-Tiep-can.md`, `17-Quy-tac-bien.md` mục 8–11, `07-Kich-ban-huong-dan.md` |
| S10–S14 (xen) | Ngay | EP-15 Stage 2–4 trước cổng | Phần không đụng `player-physics` của `16-Dac-ta-Stage2-4-nhap.md` mục 10: ST-15-01a/b/c (dữ liệu theo màn), 02 (gương, góc là tham số), 03–06, 08a, 09, 10, 13, 14 (boss an toàn QB-14, 31), 15 (kẻ địch QB-21, 23), 16 (Nano Cell, vật phẩm năng lượng). ST-15-07, 08b, 11, 12 chờ G1 | `16-…` mục 10; `17-…` |
| — | Sau EP-11 (ngày lịch) | **G1** | Quyết định cổng Prototype | — |
| S12–S13 | G1 qua, lõi EP-13 | EP-16 Vertical slice | Bản đồ Tiled Prologue và Stage 1; id checkpoint cố định theo độ khó; checkpoint vùng chữ nhật (QB-40); bước P01–P13, F01–F04; chốt số Thử thách Stage 1; camera, leo thang (QB-03…06, 15, 120); asset P1 (84 sheet); tài liệu cổng G2 theo khuôn file 05 | `02-Dac-ta-Prologue-Stage1.md`, `07-…` |
| — | Sau EP-16 | **G2** | Quyết định Vertical slice (đo bằng lõi EP-13) | — |
| S14–S17 | G1, G2, EP-15 | EP-17 Stage 2–4 trên bản đồ | ST-17-01…07: đo metric thật; bản đồ Tiled Stage 2, 3, 4 (Stage 4 cuộn dọc); bước NOVA; cân bằng; asset P2a; cùng ST-15-07, 08b, 11, 12 | `16-…` mục 10 |
| S14–S17 (xen) | ST-18-01…06: ngay khi có chỗ; ST-18-07, 08: bản đồ | EP-18 Module, Két giáp, Nhiệm vụ phụ | 4 nhiệm vụ phụ, bản lưu kế tiếp (`sideQuests`, `inventory.dataChips`, gộp `weaknessKnown`), Bảng Nhiệm Vụ, R05 (ST-18-01…09); tách ST-08-09 (dữ liệu ô/tải; hiệu ứng module; giáp và radar; Xưởng tab Module/Giáp) | `15-Nhiem-vu-phu.md` mục 10, `10-He-thong-RPG-Xuong.md` |
| S18 | Tất cả epic trên | EP-19 Bản web MVP + QA | Bản cho người chơi; `navigator.storage.persist` (không PWA, GDD chính mục 15); tải theo màn ≤ 8 MB; e2e toàn chiến dịch trong CI; soak 30 phút; máy thật (Android yếu, Android trung, Safari iOS); lỗi Chặn/Cao = 0 | `04-Test-va-Launch.md` |
| S19–S21 | EP-13 đủ, EP-19 | EP-20 Cổng MVP | 2 đợt × 25 người nối tiếp (đợt 1 → sửa → đợt 2), mỗi đợt 7 ngày + 2 ngày phân tích; quyết định G3 | `08-Cong-MVP.md` |

**Đường găng là việc của người.** Danh sách cập nhật ở `00-Bat-dau.md`, mục "Chờ người dùng". Thứ tự ảnh hưởng tiến độ: merge PR và chơi thử G1 → asset P0, P1 → chọn kênh đo lường (ADR-002) → tuyển 50 người cho G3 → asset P2a và âm thanh.

**Rủi ro chính:**

| Rủi ro | Giảm thiểu |
| --- | --- |
| G1 đổi thông số nhảy, lướt sau khi đã làm EP-15 | EP-15 chỉ làm logic không đụng `player-physics`, thử trên phòng thử; số đo theo metric `player.json`; Story đụng vật lý chờ G1 |
| Code mới lẫn vào bản người thử G1 | Đóng băng bản thử bằng tag `gate-r1` trước khi code tiếp; code mới ở nhánh mới |
| Khối lượng EP-15/17/18 (khoảng 50 phiên) | Ưu tiên Stage 2 làm trọn trước; cắt Stage 4 nếu G3 trễ quá 4 tuần (quyết định với người dùng) |
| Asset không kịp (P1 84 sheet, P2a) | Màn chơi được với hình khối; asset là việc song song, không chặn code |
| Không tuyển đủ người thử | Bắt đầu tuyển từ S13; đợt G3 chia 2 × 25 |
| Pháp lý dữ liệu khi đo lường | ADR-002 chọn phương án không gửi dữ liệu cá nhân, có đồng ý; người dùng xác nhận |
| Số `[PLACEHOLDER]` sai sau chơi thử | Mọi số trong JSON, có kiểm tra bất biến lúc nạp; chỉnh không cần sửa code |

## Giai đoạn 2: mở rộng (ước lượng lại sau cổng MVP)

| Mốc | Module | Asset |
| --- | --- | --- |
| Alpha | Stage 5–8, M8 RPG đầy đủ (Loadout, Tủ skin), M9 Shop đầy đủ (Booster, Skin, tác dụng Nano Cell Cap, Dash Coil, Booster Slot), M10 Hub đi bộ | P2b (Hub, NPC), P3 (Stage 5–8) |
| Beta | Citadel, kết thúc, M11 cloud, bảng xếp hạng cơ bản, khung máy chủ, M12 đầy đủ (nhạc riêng từng boss, Stage 5–8, Citadel) | P3 còn lại |
| Live-ops MVP | M13 Live-ops, M14 Kiếm tiền, M16 Phân tích đầy đủ và Remote Config, M17 Đóng gói | UI Live-ops (P4) |
| Endgame MVP | M15 Endgame | Chip Lõi (P4) |
| Soft launch | M18 QA, chỉnh bằng Remote Config | Ảnh cửa hàng (P5) |

M12 (âm thanh) và M16 (đo lường) đã chuyển một phần vào Giai đoạn 1 (EP-12, EP-13) vì cổng MVP cần đo được và cần âm thanh.
