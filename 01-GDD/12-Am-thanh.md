# Âm thanh bản MVP (M12): SFX, nhạc, bus, cảnh báo đòn

- **Mã hệ thống:** `SYS-M12` · **Phân loại:** Audio · **Ưu tiên:** P1, phải xong trước đợt thử MVP khoảng 50 người (`04-Dev-Plan/07-Ban-do-he-thong.md`, dòng M12 và mục 2 thứ tự 3).
- **Trạng thái:** **Bản 1, Draft (14/11/2026).** Audio Lead viết (kỹ năng `audio-design`, `game-audio-engineer`). Chờ duyệt: Creative Director (cảm giác chơi, mệt tai), Technical Director (web, ngân sách tải và RAM). Quyết định đề xuất ở mục 9.
- **Quy trình:** Game Studio Agent `/design-system`, mẫu `templates/gdd-system-template.md`, quy tắc `rules/gdd-and-story-rules.md`.
- **Nguồn:**
  - GDD chính mục 11, 13, 14, 15, 16;
  - đặc tả Prologue & Stage 1 (mục 4, 5, 7);
  - GDD 10 mục 6; GDD 11 mục 2.6, 3.3, 6; kịch bản hướng dẫn (07) mục 3–5, 8.2;
  - `03-Data/{ui,bosses,enemies,weapons,skills,controls}.json`;
  - `game/src/logic/world/world-types.ts` (`WorldEvents`), `game/src/core/game-events.ts`, `game/CONTEXT.md`;
  - wireframe `Audio.html`, `Access.html`; `05-Assets/01-Huong-dan-asset.md` mục 9;
  - tài liệu viết song song: `14-Cai-dat-Tiep-can.md` (màn Cài đặt, `cv.settings`, rung tay cầm), `17-Quy-tac-bien.md` (QB-12, QB-23, QB-32, QB-90, QB-93), `13-Do-luong-MVP.md` (sự kiện đo).
- **Phụ thuộc (upstream):** M1 (event bus), M2 (cài đặt rung), M4–M6 (sự kiện chiến đấu, kẻ địch, boss), M10 (HUD, hội thoại, menu tạm dừng, bảng HTML), màn Cài đặt của `14-Cai-dat-Tiep-can.md`.
- **Bị ảnh hưởng (downstream):** M10 Cài đặt và tiếp cận; M16 (cờ âm thanh trong nhật ký chơi thử); M17 (bộ nhớ đệm PWA); đặc tả Stage 2–4 (mỗi đòn mới cần cue).
- **Phạm vi MVP:** màn xám và Prologue, Stage 1 (6 loại kẻ địch thường, Bramble Golem, Thorna gồm bản Thử thách), boss xám, menu và các bảng HTML, màn Kết quả. Stage 2–4 dùng cùng khung, thêm id khi có đặc tả.
- **Số liệu:** mọi số là `[PLACEHOLDER]` trừ khi ghi khác. Âm thanh không phụ thuộc cổng Prototype, nhưng độ dài cue bám thời gian báo trước, nên kiểm lại khi cổng đổi số (bộ kiểm tra mục 7.2 tự báo).
- **Story:** Epic đề xuất `04-Dev-Plan/stories/EP-12-am-thanh.md` (mục 12).

## 0. Hiện trạng trước tài liệu này

- **Chưa có âm thanh nào:** không có file âm, không scene nào gọi `sound`. Phaser 3.90 để mặc định (Web Audio, `pauseOnBlur` bật).
- **Đã có rung trên cảm ứng:** `navigator.vibrate(8)` khi chạm nút (`input/touch-overlay.ts`), tắt bằng `vibration` (mặc định bật, `logic/input/settings.ts`). Rung màn hình (camera shake) theo ba bậc ở `ui.json → feedback`.
- **`WorldEvents`** (35 trường) đủ cho phần lớn chiến đấu, nhặt đồ, màn chơi, kỹ năng. Phần thiếu cho âm thanh:
  - Có ở tầng dưới nhưng chưa chuyển lên `WorldEvents`: `PlayerEvents.jumped`, `wallJumped`, `landed`, `dashed`; `BossEvents.attackStarted` (boss bắt đầu báo trước một đòn).
  - Chỉ đọc được dạng trạng thái, chưa có sự kiện: kẻ địch bắt đầu báo trước (`enemy.telegraphing`, `beats`), mức nạp (`loadout.chargeLevel`), bám tường (`player.state = wall_slide`), dấu Rễ Đuổi (`boss.stalkMarks`).
  - Chưa có gì: kẻ địch bắn hoặc lao, boss ra đòn (hết báo trước), rễ trồi, hạt nổ chạm đất, boss vào choáng, Golem sang pha 2, id và vị trí kẻ địch bị hạ.
- **`GameEvents`** chỉ có cấu hình, cảnh, khung nhìn, thiết bị nhập, cài đặt điều khiển. Chưa có sự kiện cho âm giao diện.
- **Tải đầu** đo 14/11: 1,50 MB (nén 0,42 MB); vào game 2,51 s ở CPU chậm 4× + 4G; ngưỡng 3 s (`05-Cong-Prototype.md`). Còn khoảng 0,49 s cho mọi thứ thêm vào đường tải đầu.
- **Wireframe:** `Audio.html` có Tổng, Nhạc, Hiệu ứng, **Âm cảnh báo đòn boss**, "Tắt tiếng khi chuyển tab", "Nhạc theo nhịp pha boss". `Access.html` có "Cảnh báo bằng âm thanh cho đòn boss: BẬT".
- **Lịch:** kế hoạch làm việc (bản 14/11) đã đưa EP-12 vào sprint S9 của Giai đoạn 1, trước EP-14 (Cài đặt, S10 cần "EP-12 có âm lượng"). Dòng S9 ghi "3 thanh âm lượng"; tài liệu này có 5 thanh và Tắt tiếng (mục 6.1, lan sang ở mục 11).

## 1. Tổng quan, trụ cột và giới hạn MVP

**Mục tiêu:** người chơi **nghe được đòn sắp tới** trước khi kịp nhìn; thấy bắn, nạp, lướt "đã tay" ngay 30 giây đầu (GDD 1.2); chơi 10 phút Stage 1 mà không mỏi tai.

| Trụ cột âm thanh | Quy tắc đo được | Phục vụ |
| --- | --- | --- |
| **A1. Đọc đòn bằng tai** | Mỗi đòn có báo trước có một cue riêng, phát cùng bước logic với lúc báo trước bắt đầu, dài ≤ 75% báo trước ngắn nhất. Cue boss và mini-boss ở bus `alert`: không bị giảm (duck), không bị cắt, cao hơn tiếng bắn ≥ 6 dB ở mức mặc định | Trụ cột 1 của GDD; GDD 14 "âm báo đòn boss"; 07 mục 8.2 (báo trước không chỉ dùng màu) |
| **A2. Cảm giác bắn, nạp, lướt** | 3 mức bắn nghe khác nhau; nạp có tiếng ù tăng dần và "ding" khi đầy; trúng điểm yếu khác hẳn trúng thường; lướt đất khác lướt trên không | GDD 1.2, 5.1; GDD 10 mục 6 |
| **A3. Không mệt tai** | Âm lặp nhiều nhất (bắn, trúng) ≤ −8 dB, ≤ 0,1 s, ≥ 3 biến thể; ≤ 14 kênh cùng lúc; ≤ 20 lần phát trong 1 s; âm ưu tiên ≥ 3 không quá 6 lần trong 1 s; mức tổng −18 LUFS ± 2; không bước chân, không âm theo từng chữ thoại | Đợt thử 50 người, nhiều người chơi trên điện thoại |
| **A4. Không thông tin nào chỉ có ở âm** | Mọi cue có hình tương ứng (mục 6.3); tắt tiếng vẫn chơi trọn | Người khiếm thính; người để điện thoại im lặng |

- **MDA.**
  - *Mechanics:* cue theo từng đòn, tiếng ra đòn, lớp nhạc theo pha boss, nhạc nhỏ đi khi có cảnh báo, giới hạn kênh.
  - *Dynamics:* người chơi né theo nhịp nghe "cue → im → ra đòn"; nhận ra pha mới qua nhạc dày lên; nghe tiếng lệch trái phải để biết kẻ địch nào sắp đánh khi màn đông.
  - *Aesthetics:* thử thách công bằng, cảm giác làm chủ, "sướng tay" khi nạp đầy và trúng điểm yếu.
- **Phản trụ cột:** cue bị tiếng bắn đè; tiếng bắn giống hệt nhau kiểu súng máy; âm báo lệch nhịp với hình; âm báo dài hơn báo trước (chưa nghe hết đã trúng đòn); nhạc tự to lên sau khi đổi tab; thông tin chỉ có ở âm.
- **Giới hạn MVP (không làm):**
  - lồng tiếng (GDD 14);
  - âm nền môi trường (gió, lá), âm vị trí 3D, vang (reverb), bộ lọc;
  - bước chân;
  - nhạc riêng cho từng boss (MVP dùng chung một bản boss 3 lớp, mục 3);
  - nhạc đổi theo cường độ trong màn thường; gameplay đồng bộ theo nhịp nhạc;
  - âm cho vũ khí Stage 2–4 và đòn Lumen, Cryo, Aeris (thêm theo đặc tả các màn đó, cùng quy tắc);
  - công tắc "Nhạc theo nhịp pha boss" (mục 9).

## 2. Danh sách SFX tối thiểu cho MVP

### 2.1 Quy ước và quy tắc cue báo trước

**Cột của các bảng 2.2–2.10:**

- **Bus:** mục 4.1.
- **Ưu tiên:** 1–5; 5 = cảnh báo boss, mini-boss, không bao giờ bị cắt.
- **Biến thể:** số file; `alias` = dùng lại file của âm khác, đổi `rate` (tốc độ phát, kéo theo cao độ) hoặc mức.
- **Chồng:** `tối đa kênh cùng id · khoảng tối thiểu giữa hai lần phát`.
- **Sự kiện:** tên trường `WorldEvents` có thật; **(mới)** = cần thêm vào code (mục 2.11).
- **Ghi chú:** mức `volumeDb` gợi ý, độ dài. **(P1)** = cắt được nếu thiếu giờ; còn lại là P0 (cần trước đợt thử).

**Quy tắc cue báo trước** (kiểm lúc nạp hoặc bằng test, mục 7.2):

1. **Bao phủ:** mọi đòn có `telegraphSec` trong `enemies.json`, `bosses.json` (gồm khối `challenge` và boss xám) có đúng một cue. Thiếu cue là lỗi khi nạp dữ liệu.
2. **Cùng bước:** cue phát trong cùng bước logic với lúc báo trước bắt đầu (cùng một `WorldEvents`).
3. **Độ dài:** `cueSec ≤ 0,75 × telegraphMin`, với `telegraphMin = max(minTelegraphSec, telegraphSec / speedMul)` ở pha nhanh nhất có đòn đó (đúng cách `boss.ts` tính). Phần còn lại là khoảng lặng ngắn trước tiếng ra đòn.
4. **Tiếng ra đòn riêng** (`*.fire`, `*.swing`, `*.erupt`...) phát lúc đòn hết báo trước. Người chơi học nhịp "cue → im → ra đòn" bằng tai.
5. **Đòn nhiều nhịp** (bản Thử thách, `beats > 1`): thay cue bằng `beats` tiếng tích ngắn (0,05 s, cách nhau `beatTickGapSec` = 0,12 s), khớp số chấm sáng (GDD 11 mục 2.6). Hai nhịp dài 0,17 s.
6. **Phân biệt được:** 5 cue của Thorna khác nhau ở ít nhất 2 trong 3 chiều: cao độ (thấp, vừa, cao), nhịp (liền, rung, ngắt), chất liệu (điện, dây gỗ, đất, hơi thở). Bảng 2.8 ghi từng cue.
7. **Cue không lệch cao độ ngẫu nhiên** (`pitchJitterSemis = 0`) để giữ nhận dạng; cue boss không lệch trái phải.
8. **Kẻ địch thường:** bus `sfx`, ưu tiên 4, lệch trái phải theo vị trí (mục 4.2). Theo QB-23 (`17-Quy-tac-bien.md`, `attackRequiresOnScreen`), kẻ địch chỉ bắt đầu báo trước khi đã nằm trong khung camera thu vào 1 ô, nên cue kẻ địch luôn đi cùng hình. Khi QB-23 chưa code, cue ngoài khung (10–12 ô) vẫn phát, nhỏ dần theo `A(dx)`.

**Độ dài tối đa của cue** (quy tắc 3, số trong `enemies.json`, `bosses.json`):

| Đòn | Báo trước gốc (s) | Pha nhanh nhất | `telegraphMin` (s) | Cue tối đa |
| --- | --- | --- | --- | --- |
| Drone Lính (cả bản Prologue) | 0,4 | — | 0,4 | 0,30 s |
| Tháp Pháo Tập Sự | 0,8 | — | 0,8 | 0,60 s |
| Bướm Sắt | 0,5 | — | 0,5 | 0,375 s |
| Tháp Gai | 0,6 | — | 0,6 | 0,45 s |
| Lính Kén: lao 0,5; lao nối (Thử thách) 0,4 | 0,4 | — | 0,4 | 0,30 s |
| Golem: giậm, tung bom | 0,7 | — | 0,7 | 0,525 s |
| Golem: lao | 0,5 | — | 0,5 | 0,375 s |
| Thorna: Gai Quạt, Dây Quất | 0,6 | pha 3, ×1,2 | 0,5 | 0,375 s |
| Thorna: Rễ Trồi, Rễ Đuổi | 0,7 | pha 3, ×1,2 | 0,583 | 0,44 s |
| Thorna: Hoa Nở | 1,0 | pha 3, ×1,2 | 0,833 | 0,62 s |
| Boss xám: Bắn thẳng, Nhảy đập | 0,6 | pha 3, ×1,2 | 0,5 | 0,375 s |
| Boss xám: Lao ngang | 0,8 | pha 1–2, ×1 | 0,8 | 0,60 s |
| Boss xám: Mưa đạn | 1,0 | pha 3, ×1,2 | 0,833 | 0,62 s |

### 2.2 Di chuyển

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `kai.jump` | `jumped` (mới), không kèm `wallJumped` | sfx | 2 | 2 | 1 · 80 ms | −12 dB, ≤ 0,12 s |
| `kai.walljump` | `wallJumped` (mới) | sfx | 2 | 2 | 1 · 80 ms | −10 dB; thêm tiếng bật tường để khác `kai.jump` |
| `kai.land` | `landed` (mới, kèm tốc độ rơi) khi tốc độ ≥ `land.minTilesPerSec` = 6 ô/s | sfx | 2 | 2 | 1 · 100 ms | −14 dB ở 6 ô/s, −8 dB ở 15 ô/s (`maxFallTilesPerSec`), nội suy tuyến tính; đáp từ bậc thấp thì im |
| `kai.dash` | `dashed` (mới), không kèm `airDash` | sfx | 3 | 2 | 1 · 0 | −8 dB, ≤ 0,25 s (bằng thời gian lướt) |
| `kai.dash.air` | `airDash` | sfx | 3 | 1 | 1 · 0 | Lướt trên không (P1 Phantom): thêm tiếng phản lực, cao hơn lướt đất 3 cung (GDD 10 mục 6) |
| `kai.airdash.ready` | `airDashRestored` khi Kai còn trên không (như đèn chân) | sfx | 1 | alias `wpn.charge.mid`, rate 1,3 | 1 · 300 ms | −16 dB. (P1) |
| `kai.wallslide` | `wallSlide` = start, stop (mới) | sfx | 1 | 1, vòng lặp | 1 · 0 | −18 dB; vào 60 ms, tắt 80 ms; tắt khi hồi sinh, tạm dừng. (P1) |
| Bước chân | — | — | — | — | — | Không có ở MVP (mục 9) |

### 2.3 Bắn, nạp, vũ khí

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `wpn.arc.shot` | `fired` = `shot` | sfx | 1 | 4 | 3 · 60 ms | −10 dB, ≤ 0,1 s, lệch cao độ ±0,5 cung. Âm phát nhiều nhất game (khoảng 7,5 lần/s) nên nhỏ, ngắn, khô |
| `wpn.arc.mid` | `fired` = `mid` | sfx | 3 | 2 | 2 · 0 | −6 dB, dày hơn tiếng bắn thường |
| `wpn.arc.charged` | `fired` = `charged` | sfx | 4 | 1 | 2 · 0 | −3 dB, đuôi trầm 0,4 s; đi cùng dừng hình 3 bước |
| `wpn.charge.hum` | `charge` = `started` (mới); kêu sau `chargeHumDelaySec` = 0,2 s nếu vẫn giữ nút; tắt khi `fired`, `charge` = `lost`, chết, tạm dừng | sfx | 2 | 1, vòng lặp | 1 · 0 | −14 dB; `rate` tăng 1,0 → 1,12 tới mức vừa (0,5 s); từ mức đầy đổi sang nhịp đập 4 Hz, −10 dB. Trễ 0,2 s để bấm liên thanh không kêu ù |
| `wpn.charge.mid` | `charge` = `mid` (mới) | sfx | 2 | 1 | 1 · 0 | Tiếng tích −12 dB lúc 0,5 s |
| `wpn.charge.full` | `charge` = `full` (mới) | sfx | 4 | 1 | 1 · 0 | "Ding" −4 dB lúc 1,2 s (V1: 1,02 s) |
| `wpn.charge.lost` | `charge` = `lost` (mới): bị đánh khi đang nạp, hoặc hết 2 s giữ nạp sau khi đổi vũ khí | sfx | 3 | 1 | 1 · 0 | Tiếng xì tắt −8 dB; cho người chơi biết vì sao mất nạp (GDD 5.1) |
| `wpn.vinelash` | `fired` = `sweep` | sfx | 3 | 2 | 2 · 0 | −6 dB; tiếng roi, khác hẳn Arc (GDD 14 "mỗi vũ khí một âm sắc") |
| `wpn.swap` | `swapped` | sfx | 2 | 1 | 1 · 100 ms | −10 dB, tiếng chốt cơ khí |
| `wpn.empty` | `emptyWeapon` | sfx | 3 | 1 | 1 · 400 ms | −8 dB, tiếng "tạch" khô (QB-12); HUD đã có chữ, thanh năng lượng nháy |
| `wpn.get` | `weaponGranted`, phát lúc hiện báo "Nhận vũ khí" (sau hộp thoại) | ui | 4 | 1 | 1 · 0 | Jingle 1,5 s |

### 2.4 Trúng đích và kỹ năng

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `hit.enemy` | `hitEnemy`, bỏ khi cùng bước có `enemyKilled` | sfx | 2 | 3 | 2 · 50 ms | −9 dB |
| `hit.target` | `hitTarget` (bia tập bắn, màn xám) | sfx | 1 | alias `hit.enemy`, rate 0,9 | 2 · 50 ms | |
| `hit.boss` | `hitBoss`, không kèm `weakHit` | sfx | 2 | 3 | 2 · 70 ms | −8 dB; trầm, gỗ lẫn kim loại |
| `hit.weak` | `weakHit` | sfx | 4 | 1 | 1 · 100 ms | −3 dB; sáng, giòn, khác hẳn `hit.boss`: khoảnh khắc "à, thì ra thế" (GDD 1.2) |
| `hit.blocked` | `blocked` (đạn thường chạm khiên Lính Kén hoặc bia khiên) | sfx | 3 | 2 | 1 · 120 ms | −7 dB, "keng"; dạy "khiên chặn đạn thường" (S06) |
| `enemy.shield.crack` | `shieldHit` | sfx | 3 | 1 | 1 · 0 | −6 dB, tiếng nứt |
| `enemy.shield.break` | `shieldBroken` | sfx | 4 | 1 | 1 · 0 | −4 dB, tiếng vỡ |
| `enemy.die` | `enemyKilled` (mở rộng có id, x: mục 2.11), kẻ địch thường | sfx | 3 | 3 | 3 · 40 ms | −6 dB; lệch trái phải theo vị trí |
| `fx.burst` | `burst` (V2 Đạn Nạp Nổ Lan) | sfx | 3 | 1 | 2 · 60 ms | −7 dB; bậc phản hồi vừa |
| `hit.punish` | `punishHit` (V3 Đòn Trừng Phạt) | sfx | 4 | 1 | 1 · 100 ms | −4 dB, lớp trầm đè lên `hit.boss`; bậc phản hồi lớn |
| `kai.graze` | `graze` (P3 bậc 3) | sfx | 2 | 2 | 1 · 100 ms | −10 dB, tiếng "sượt" (GDD 10 mục 6). (P1) |

### 2.5 Kai bị đánh, chết, hồi sinh, rơi hố

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `kai.hurt` | `playerHurt`, trừ khi cùng bước có `playerDied`, `fellInPit` hoặc `spikeHit` | sfx | 4 | 2 | 1 · 200 ms | −4 dB; rung 40 ms (mục 6.4) |
| `kai.die` | `playerDied` | sfx | 4 | 1 | 1 · 0 | Stinger 0,8 s, −2 dB; nhạc giảm `kaiDeath` (mục 4.4); dừng vòng lặp nạp, bám tường |
| `kai.respawn` | `respawned` | sfx | 3 | 1 | 1 · 0 | Tiếng lắp ráp lại 0,5 s, −6 dB (hồi sinh ≤ 1 s) |
| `kai.fall` | `fellInPit` | sfx | 4 | 1 | 1 · 0 | Vút xuống rồi chạm, −4 dB; thay `kai.hurt` (mất 20 máu, về checkpoint) |
| `hazard.spike` | `spikeHit` | sfx | 4 | 1 | 1 · 300 ms | Gai đâm rồi tiếng kéo về chỗ an toàn, −4 dB; thay `kai.hurt` |
| `kai.shield.break` | `kaiShieldAbsorbed` (C3) | sfx | 4 | 1 | 1 · 0 | Kính vỡ, −3 dB; bậc vừa; người chơi biết mình vừa bị trúng |
| `kai.shield.ready` | `kaiShieldReady` (C3) | sfx | 1 | 1 | 1 · 0 | −14 dB; thêm −6 dB nếu boss đang báo trước (GDD 10 mục 6) |
| `kai.levelup` | Lên cấp giữa màn (StageScene đã biết qua LevelTracker; cần gửi `audio:play`) | ui | 3 | 1 | 1 · 0 | Jingle 1 s, khớp chữ "Lên cấp N!" |

### 2.6 Kẻ địch thường (Prologue, Stage 1)

"1 + tích" = một file cue và một marker tích cho đòn nhiều nhịp (quy tắc 5).

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `enemy.drone.tele` | `enemyTelegraph` (mới), id `drone_linh`, `drone_linh_prologue` | sfx | 4 | 1 + tích | 2 · 150 ms | Bíp đôi cao, điện tử, 0,25 s; khớp nhấp nháy đỏ. Thử thách bắn đôi: 2 tích |
| `enemy.shot` | `enemyAttack` (mới): Drone, tháp pháo bắn | sfx | 2 | 2 | 3 · 80 ms | −12 dB |
| `enemy.turret.tele` | `enemyTelegraph`, id `thap_phao_tap_su` | sfx | 4 | 1 | 2 · 150 ms | Tiếng rít tăng dần 0,55 s; dạy P10 "thấy sáng là né" |
| `enemy.butterfly.tele` | `enemyTelegraph`, id `buom_sat` | sfx | 4 | 1 + tích | 2 · 150 ms | Phồng "phù" đi lên, 0,3 s: kéo mắt nhìn lên. Thử thách thả kép: 2 tích |
| `enemy.drop` | `enemyAttack`: Bướm Sắt thả hạt | sfx | 2 | 1 | 2 · 0 | −12 dB, tiếng vút ngắn. (P1) |
| `hazard.pop` | `hazardPop` (mới): hạt của Bướm Sắt, bom của Golem chạm đất | sfx | 3 | 2 | 3 · 60 ms | −8 dB, nổ nhỏ |
| `enemy.spiketurret.tele` | `enemyTelegraph`, id `thap_gai` | sfx | 4 | 1 + tích | 2 · 150 ms | Gỗ co "kẽo kẹt", 0,4 s. Thử thách hai loạt: 2 tích |
| `enemy.spike.fire` | `enemyAttack`: Tháp Gai bắn (mỗi loạt một tiếng) | sfx | 2 | alias `thorna.thorns.fire`, rate 1,25, −4 dB | 2 · 80 ms | 3 gai một tiếng |
| `enemy.charger.tele` | `enemyTelegraph`, id `linh_ken` (gồm lao nối Thử thách) | sfx | 4 | 1 | 2 · 150 ms | Khiên ù lên, 0,28 s |
| `enemy.charger.dash` | `enemyAttack`: Lính Kén lao | sfx | 3 | alias `golem.dash`, rate 1,3 | 2 · 0 | |

### 2.7 Mini-boss Bramble Golem

Cue của Golem ở bus `alert` như boss (mini-boss là "kiểm tra cuối đoạn", GDD 9).

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `golem.slam.tele` | `enemyTelegraph`, `bramble_golem.slam` (gồm giậm cuối cú lao ở Thử thách, `dash.endSlam`) | alert | 5 | 1 | 1 · 0 | Gầm kèm đất rung: thấp, liền, đất; 0,5 s |
| `golem.shockwave` | `enemyAttack`: giậm ra sóng đất | sfx | 4 | 1 | 1 · 0 | −4 dB; sóng lan hai bên (lệch trái rồi phải) |
| `golem.bombs.tele` | `enemyTelegraph`, `bramble_golem.bombs` | alert | 5 | 1 | 1 · 0 | Hạt nảy "lách tách": vừa, ngắt; 0,45 s |
| `golem.bombs.throw` | `enemyAttack`: tung 3 hạt | sfx | 3 | alias `enemy.drop`, rate 0,8 | 1 · 0 | Hạt nổ dùng `hazard.pop`. (P1) |
| `golem.dash.tele` | `enemyTelegraph`, `bramble_golem.dash` | alert | 5 | 1 | 1 · 0 | Cào đất hai lần, 0,35 s |
| `golem.dash` | `enemyAttack`: Golem lao | sfx | 4 | 1 | 1 · 0 | −5 dB, bước nặng kèm gió |
| `golem.phase` | `golemPhase` (mới): xuống dưới `phase2HpPct` = 50% | alert | 5 | alias `boss.phase`, rate 1,2 | 1 · 0 | Báo sắp có đòn mới |
| `enemy.die.big` | `enemyKilled` của Golem | sfx | 4 | alias `boss.defeat`, rate 1,25 | 1 · 0 | |

### 2.8 Boss Thorna và boss xám

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `boss.gate` | `gateClosed` | sfx | 4 | 1 | 1 · 0 | Cửa sập, −3 dB; mở đầu khoảng lặng trước trận (mục 3.4) |
| `thorna.thorns.tele` | `bossTelegraph` = `thorns` (mới, lấy từ `BossEvents.attackStarted`) | alert | 5 | 1 | 1 · 0 | Cao, liền, điện xanh (khớp "thân sáng xanh"), đi lên; 0,35 s |
| `thorna.thorns.fire` | `bossAttack` = `thorns` (mới) | sfx | 4 | 1 | 1 · 0 | 5 gai một tiếng xòe, −5 dB |
| `thorna.lash.tele` | `bossTelegraph` = `lash` | alert | 5 | 1 | 1 · 0 | Thấp, rung (tremolo 8 Hz), dây gỗ (khớp "dây rung"); 0,35 s |
| `thorna.lash.swing` | `bossAttack` = `lash` | sfx | 4 | 1 | 1 · 0 | Roi quất, −4 dB |
| `thorna.roots.tele` | `bossTelegraph` = `roots` | alert | 5 | 1 | 1 · 0 | Thấp, liền, đất nứt (khớp vết nứt vàng); 0,4 s |
| `boss.root.erupt` | `bossRoot` (mới): mỗi cột rễ trồi, của cả Rễ Trồi và Rễ Đuổi | sfx | 4 | 3 | 3 · 0 | −5 dB; lệch trái phải theo cột rễ |
| `thorna.stalk.tele` | `bossTelegraph` = `stalk` (chỉ ở Thử thách) | alert | 5 | 1 | 1 · 0 | Cao, ngắt 3 nhịp, tiếng thì thầm tím; 0,4 s. Phải phân biệt được với `roots` khi nghe riêng (giả thuyết H2) |
| `thorna.stalk.mark` | `bossMark` (mới): dấu thứ k = 1…4 | alert | 5 | 1 | 2 · 0 | Tích −6 dB, cao độ +0, +2, +4, +5 cung theo k (nghe như "đuổi theo"); lệch theo vị trí dấu; từ dấu tới lúc rễ trồi 0,6 s (pha 3: 0,5 s) |
| `thorna.bloom.tele` | `bossTelegraph` = `bloom` | alert | 5 | 1 | 1 · 0 | Vừa, phồng dài, hơi thở hút vào (khớp "co lại"); 0,6 s |
| `thorna.bloom.burst` | `bossAttack` = `bloom` | sfx | 4 | 1 | 1 · 0 | Nở bung, hạt bay lên; −3 dB |
| `hazard.seed.land` | `hazardPop` loại `seed` | sfx | 2 | alias `hazard.pop`, rate 1,3, −4 dB | 4 · 30 ms | 12 hạt rơi gần nhau: tối đa 4 kênh để không ồn |
| `boss.stunned` | `bossStunned` (mới): sau Hoa Nở, Mưa đạn (2 s), trúng điểm yếu (0,5 s) | sfx | 4 | 1 | 1 · 500 ms | Sao xoay 0,6 s, −6 dB: báo cửa sổ tấn công (V3) |
| `boss.phase` | `bossPhaseChanged` | alert | 5 | 1 | 1 · 0 | Stinger 1 s; nhạc thêm lớp (mục 3.2) |
| `boss.defeat` | `bossDefeated` | sfx | 4 | 1 | 1 · 0 | Nổ lớn 1,5 s, 0 dB; trước đó dừng mọi kênh `alert` (50 ms) |
| `boss.land` | `bossLanded` (boss xám, Nhảy đập) | sfx | 4 | 1 | 1 · 0 | −3 dB |

**Boss xám** (cổng Prototype) chỉ dùng alias, không có file mới. Đấu trường boss xám nạp kèm gói `verdant` và `thorna` (alias kéo theo gói của âm gốc).

| Đòn boss xám | Cue (alias, rate) | Độ dài hiệu dụng | Tiếng ra đòn |
| --- | --- | --- | --- |
| Bắn thẳng `shot` | `thorna.thorns.tele`, 1,1 | 0,32 s ≤ 0,375 | `enemy.shot` |
| Lao ngang `charge` | `golem.dash.tele`, 1,0 | 0,35 s ≤ 0,60 | `golem.dash` |
| Nhảy đập `slam` | `golem.slam.tele`, 1,4 | 0,36 s ≤ 0,375 | `boss.land`, `golem.shockwave` |
| Mưa đạn `rain` | `thorna.bloom.tele`, 1,0 | 0,60 s ≤ 0,62 | `hazard.seed.land` |

### 2.9 Màn chơi và nhặt đồ

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `pickup.corebit` | `coreBitGained` > 0 | sfx | 2 | 1, thang cao độ | 3 · 40 ms | −8 dB; mỗi viên nhặt trong 0,6 s cao thêm 1 cung, tối đa +5; im 0,6 s thì về 0 |
| `pickup.heal` | `healed` > 0 | sfx | 3 | 1 | 1 · 0 | −6 dB |
| `checkpoint` | `checkpoint` | sfx | 3 | 1 | 1 · 0 | Chuông 0,8 s, −5 dB; khớp chữ "Checkpoint N · đã lưu" |
| `secret.found` | `secretFound` | sfx | 4 | 1 | 1 · 0 | Jingle 1,2 s, −3 dB |
| `room.lock` | `roomLocked` | sfx | 4 | alias `boss.gate`, rate 1,15 | 1 · 0 | |
| `room.clear` | `roomCleared` | sfx | 3 | 1 | 1 · 0 | Cửa mở, −6 dB. (P1) |
| `barrier.break` | `barrierBroken` | sfx | 3 | alias `enemy.shield.break`, rate 0,8 | 1 · 0 | Rễ khô vỡ |
| `radar.ping` | Radar Đầu Mk I bắt được vật phẩm (khi có, ST-08-09) | sfx | 1 | 1 | 1 · 10 s | ≤ 1 lần mỗi 10 s (GDD 10). Bị chặn cùng Két giáp |
| `kai.laststand` | Last Stand bật (khi có module) | sfx | 1 | 1, vòng lặp | 1 · 0 | Nhịp tim −16 dB, tắt được (GDD 10). Bị chặn cùng module |

### 2.10 Giao diện và hội thoại

Phát bằng sự kiện `audio:play` (mới, mục 7.4), không nằm trong `WorldEvents`.

| id | Sự kiện kích hoạt | Bus | Ưu tiên | Biến thể | Chồng | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `ui.move` | Con trỏ menu di chuyển (`MenuNavigator`, bảng HTML) | ui | 1 | 1 | 1 · 40 ms | −14 dB, ≤ 0,05 s |
| `ui.confirm` | Chọn, Tiếp | ui | 2 | 1 | 1 · 60 ms | −8 dB |
| `ui.back` | Quay lại, đóng, Bỏ qua | ui | 2 | 1 | 1 · 60 ms | −9 dB, thấp hơn `ui.confirm` |
| `ui.buy` | Mua Upgrade thành công (Quầy Mira) | ui | 3 | 1 | 1 · 0 | −5 dB, tiếng tiền |
| `ui.learn` | Học một bậc kỹ năng (Xưởng) | ui | 3 | alias `ui.buy`, rate 1,2 | 1 · 0 | GDD 10 mục 6 "tiếng học kỹ năng" |
| `ui.error` | Thiếu Core Bit, thiếu SP, mục khóa, mục mờ | ui | 2 | 1 | 1 · 200 ms | −8 dB, hai nốt đi xuống |
| `ui.pause` | Mở menu tạm dừng | ui | 2 | alias `ui.confirm`, rate 0,8 | 1 · 0 | (P1) |
| `ui.unlock` | "Đã mở Thử thách cho màn này", vũ khí mới ở màn Kết quả | ui | 3 | alias `secret.found` | 1 · 0 | |
| `ui.result.tick` | Màn Kết quả đếm EXP, Core Bit | ui | 1 | alias `ui.move` | 1 · 50 ms | (P1) |
| `dlg.emote.nova` | Mỗi câu mới của NOVA: hộp hội thoại (`DialogueRunner`), hộp hướng dẫn (`TutorialBox`), hộp gợi ý độ khó | ui | 2 | 2 | 1 · 1,5 s | −8 dB (hộp hướng dẫn −10 dB vì trận vẫn chạy); điện tử, hai nốt đi lên |
| `dlg.emote.kai`, `.thorna`, `.mira` | Mỗi câu mới của Kai, Thorna, Mira (Vex khi làm cảnh Prologue) | ui | 2 | 2 mỗi người | 1 · 0 | Kai: bíp trầm ngắn; Thorna: gỗ trầm; Mira: cơ khí vui. Không phát theo từng chữ (mục 9). Kai, Mira: (P1) |
| `dlg.emote.default` | Người nói chưa có âm riêng (Warden Stage 2–4) | ui | 2 | 2 | 1 · 0 | Kiểm lúc nạp: mỗi người nói có âm riêng hoặc dùng bản này |

**Tổng:** 94 id (78 có file riêng, 14 alias, 2 bị chặn cùng ST-08-09), cộng 4 alias của boss xám; khoảng 105 marker kể cả biến thể và tiếng tích. P0 khoảng 72 id có file. `05-Assets` mục 9 ghi "khoảng 25 SFX", cần sửa (mục 11).

### 2.11 Sự kiện cần thêm vào code

| Trường mới | Kiểu | Lấy từ | Dùng cho |
| --- | --- | --- | --- |
| `jumped`, `wallJumped`, `dashed` | boolean | `PlayerEvents` (đã có, chỉ chuyển lên) | `kai.jump`, `kai.walljump`, `kai.dash` |
| `landed` | tốc độ rơi lúc đáp (ô/s) hoặc `undefined` | `PlayerEvents.landed` cộng `vy` ngay trước khi chạm | `kai.land` |
| `wallSlide` | `start`, `stop` hoặc `undefined` | đổi vào, ra trạng thái `wall_slide` | `kai.wallslide` |
| `charge` | `started`, `mid`, `full`, `lost` hoặc `undefined` | cạnh lên của `WeaponLoadout.chargeLevel`; mất nạp khi bị đánh hoặc hết thời gian giữ nạp | 4 âm nạp |
| `enemyTelegraph` | danh sách `{ id, move?, x, beats }` | cạnh lên của `telegraphing` (Golem: trạng thái `slamTelegraph`, `bombTelegraph`, `dashTelegraph`) | cue kẻ địch, Golem |
| `enemyAttack` | danh sách `{ id, move?, x }` | lúc kẻ địch bắn, thả, lao, giậm | tiếng ra đòn |
| `enemyKills` | danh sách `{ id, x }` (giữ `enemyKilled` boolean cũ) | mảng `killed` trong `StageWorld.step` | `enemy.die`, `enemy.die.big`, lệch trái phải |
| `golemPhase` | boolean | Golem qua `phase2HpPct` | `golem.phase` |
| `hazardPop` | danh sách `{ kind, x }`, kind: `drop`, `bomb`, `seed` | đạn rơi của kẻ địch, boss chạm đất | `hazard.pop`, `hazard.seed.land` |
| `bossTelegraph` | `BossAttackId` hoặc `undefined` | `BossEvents.attackStarted` (đã có) | cue boss |
| `bossAttack` | `BossAttackId` hoặc `undefined` | boss đổi từ `telegraph` sang `active` | tiếng ra đòn boss |
| `bossMark` | `{ k, x }` hoặc `undefined` | Rễ Đuổi đánh dấu (`runStalk`) | `thorna.stalk.mark` |
| `bossRoot` | danh sách x | cột rễ trồi (Rễ Trồi, Rễ Đuổi) | `boss.root.erupt` |
| `bossStunned` | boolean | boss vào `stunned`, hoặc bắt đầu choáng điểm yếu | `boss.stunned` |

- Danh sách dùng mảng dựng sẵn, xóa đầu mỗi bước (không cấp phát trong vòng lặp, `rules/core-and-ai-rules.md`).
- `x` là tâm ngang theo px thế giới; AudioService đổi ra ô so với tâm camera (mục 4.2).
- Sự kiện ở tầng scene (`GameEvents`): `audio:play`, `audio:settings-changed`, `audio:unlocked` (mới, mục 7.4).

## 3. Nhạc

### 3.1 Các bản

Độ dài vòng: `loopSec = bars × 4 × 60 / BPM` (nhịp 4/4).

| id | Dùng ở | BPM | Vòng lặp | Lớp | Tính chất |
| --- | --- | --- | --- | --- | --- |
| `music.menu` | Menu, Hub dạng menu, Xưởng, Quầy Mira, Chuẩn bị, Điều khiển, Dữ liệu lưu, Kết quả chơi thử | 100 | 16 ô nhịp = 38,4 s | 1, stereo | Chủ đề Nova Prime, nhẹ, neon. Đi giữa các màn menu thì chạy tiếp, không phát lại từ đầu |
| `music.prologue` | Màn xám (cổng Prototype); Prologue khi có | 90 | 24 ô = 64 s | 1 | Hồi hộp (đặc tả mục 7) |
| `music.stage1` | Verdant Gardens (đoạn A–D; phòng thử kẻ địch, màn chơi, Golem) | 120 | 32 ô = 64 s (A 16 + B 16) | 1 | Chiptune pha synth, xanh lục. Golem, phòng khóa không đổi bản |
| `music.boss` | Đấu trường mọi Warden MVP và boss xám | 140 | 24 ô = 41,1 s | 3 stem: `base` (stereo), `drive`, `peak` (mono) | Pha 1–3 thêm lớp (mục 3.2). Thorna có stinger mở đầu 2 ô nhịp riêng (P1) |
| `music.win` | Hạ boss | — | 4 s, không lặp | 1 | Jingle thắng |
| `music.result` | Màn Kết quả | 100 | 16 ô = 38,4 s | 1 | Phối nhẹ chủ đề menu |
| `music.stage2`…`4` | Prism, Cryo, Cirrus | theo đặc tả | ≤ 64 s | 1 | Thêm khi có đặc tả Stage 2–4 |

### 3.2 Lớp thích ứng theo pha boss (xếp lớp dọc)

| Pha boss | Ngưỡng máu (`phases[].untilHpPct`) | Lớp nghe | Ghi chú |
| --- | --- | --- | --- |
| 1 | 100–60% | `base` (trống, bass, giai điệu chính) | |
| 2 | 60–30% | + `drive` (trống dày, arpeggio) | Có đòn mới (Rễ Trồi; Thử thách thêm Rễ Đuổi) |
| 3 | dưới 30% | + `peak` (lead cao, dồn nhịp) | Boss nhanh hơn 20% |
| Boss choáng (2 s sau Hoa Nở, Mưa đạn) | | `peak` −6 dB trong lúc choáng | Báo cửa sổ tấn công. (P1) |
| Kai chết trong đấu trường | | giữ lớp; nhạc giảm `kaiDeath` | Hồi sinh: boss đầy máu, về pha 1 (QB-32), nên lớp về `base` trong 1.000 ms |

- Ba stem cùng độ dài, bắt đầu cùng lúc từ đầu trận và chạy suốt; chỉ đổi âm lượng. Đổi pha lúc nào cũng khớp nhịp, không cần chờ ô nhịp.
- Lớp vào và ra trong `fadeMs.layer` = 1.000 ms.
- Không đổi tốc độ nhạc ở pha 3 (đổi `rate` làm lệch giọng). Cảm giác "nhanh hơn" do lớp `peak` dồn nhịp.
- MusicDirector đọc pha boss **mỗi khung** (theo trạng thái), không chỉ nghe `bossPhaseChanged`. Nhờ vậy hồi sinh, đấu lại, boss đặt lại vẫn đúng lớp.
- Lớp theo `layersByPhase` trong dữ liệu; boss ít pha hơn (AEGIS 2 pha, sau MVP) dùng các phần tử đầu.

### 3.3 Máy trạng thái nhạc

| Trạng thái | Điều kiện | Trạng thái sau | Chuyển |
| --- | --- | --- | --- |
| `none` | Menu hiện và `music.menu` tải xong | `menu` | vào 1.000 ms |
| `menu` | Vào StageScene | `stage` (bản theo màn) | menu ra 400 ms; bản màn vào 800 ms khi tải xong (chưa xong thì im, không chặn vào màn) |
| `stage` | `gateClosed` | `bossIntro` (im) | bản màn ra 500 ms; tiếng `boss.gate` |
| `bossIntro` | Hộp thoại trước trận đóng; hoặc 800 ms sau `gateClosed` nếu không có thoại (đấu lại) | `boss`, lớp theo pha | vào thẳng ở đầu bản, không fade (như stinger) |
| `boss` | Boss đổi pha | `boss` | lớp mới vào 1.000 ms |
| `boss` | `bossDefeated` | `victory` | 3 stem ra 600 ms; `music.win` sau 1.000 ms |
| `victory` | Màn Kết quả mở (`ui.result.delaySec` = 8 s sau khi hạ boss và thoại đã đóng) | `result` | vào 800 ms |
| `result` | Chơi lại | `stage` | ra 400 ms |
| `stage`, `boss`, `result` | Thoát về menu | `menu` | ra 300 ms; menu vào 800 ms |
| bất kỳ | Hộp thoại mở; menu tạm dừng hoặc bảng HTML đè lên màn | giữ nguyên | nhạc giảm `dialogue` −6 dB hoặc `pause` −8 dB (mục 4.4) |
| bất kỳ | Ẩn trang | giữ nguyên, AudioContext tạm ngưng | hiện lại: nhạc lên trong 300 ms từ đúng chỗ dừng |

Phòng thử Thorna bắt đầu ở `stage` (bản Stage 1) cho tới khi cửa đóng. Màn xám dùng `music.prologue`, boss xám dùng `music.boss`.

### 3.4 Im lặng có chủ đích

- **Trước trận boss:** từ `gateClosed` tới khi thoại trước trận đóng (hoặc 800 ms khi đấu lại), chỉ còn tiếng cửa sập và tiếng boss. Khoảng lặng làm bản boss vào "đập" hơn.
- **Sau khi hạ boss:** 1 s sau `boss.defeat` là jingle. Hết jingle tới khi màn Kết quả mở chỉ còn SFX (người chơi thử vũ khí mới trong `ui.result.delaySec` 8 s).
- **Đầu Prologue (0:00–0:20, Kai tỉnh dậy):** chỉ tiếng máy khởi động và NOVA; nhạc vào khi xong P01 (làm cùng Prologue).
- **Cảnh Vex (P12):** nhạc ra 500 ms, chỉ còn stinger của Vex (làm cùng Prologue).
- **Không im khi Kai chết ngoài đấu trường:** nhạc màn giảm `kaiDeath` rồi trở lại, không phát lại từ đầu. Stage 1 có 3–6 lần chết; nghe lại đoạn mở đầu mỗi lần sẽ nhàm.

### 3.5 Vòng lặp

- Độ dài file = `loopSec` ± 5 ms (script đóng gói kiểm). Vòng lặp là số nguyên ô nhịp; đuôi vang của ô cuối trộn sẵn vào đầu bản.
- Lặp theo điểm `loopStartSec`, `loopEndSec` trong dữ liệu (mặc định 0 và độ dài file), để cắt khoảng đệm đầu của AAC trên Safari (mục 5.4).
- Không khoảng hở ≥ 5 ms ở chỗ nối (đo trên Chrome và Safari).

## 4. Bus và trộn

### 4.1 Bus

| Bus | Chứa | Thanh mặc định s | Hệ số s² | dB | Bị giảm bởi |
| --- | --- | --- | --- | --- | --- |
| `master` | mọi thứ; cộng thêm `masterHeadroomDb` = −3 dB cố định | 1,0 | 1,0 | 0 | — |
| `music` | nhạc, jingle thắng | 0,7 | 0,49 | −6,2 | `bossAlert`, `dialogue`, `pause`, `kaiDeath` |
| `sfx` | âm gameplay, gồm cue kẻ địch thường | 0,9 | 0,81 | −1,8 | `bossAlert` |
| `alert` | cue boss và mini-boss, dấu Rễ Đuổi, đổi pha | 1,0 | 1,0 | 0 | **không bao giờ** |
| `ui` | menu, bảng HTML, âm biểu cảm hội thoại, jingle nhận vũ khí, lên cấp | 0,8 | 0,64 | −3,9 | — |

Không có bus giọng nói vì không lồng tiếng; âm biểu cảm hội thoại đi bus `ui`.

### 4.2 Công thức

```text
dbToGain(x) = 10^(x / 20)
busGain(s)  = s^sliderCurve           ; sliderCurve = 2, s ∈ [0, 1]; s = 0 → tắt hẳn (không tạo kênh)
busDb(s)    = 40 × log10(s)          ; khi sliderCurve = 2

gain = dbToGain(volumeDb + jitterDb + duckDb(bus, t) + masterHeadroomDb)
       × busGain(s_bus) × busGain(s_master) × A(dx)
  volumeDb ∈ [−40, 0]                   mức riêng của âm (audio.json)
  jitterDb ∈ [−volJitterDb, +volJitterDb], volJitterDb = 1; chỉ âm có variants ≥ 2
  duckDb(bus, t) = min các nguồn giảm đang chạy trên bus đó (≤ 0, không cộng dồn); alert luôn 0

rate = 2^(p / 12) × rateAlias
  p ∈ [−pitchJitterSemis, +pitchJitterSemis], mặc định 0,5 cung (±2,9%); cue báo trước p = 0

Chỉ âm có vị trí (kẻ địch bắn, bị hạ, hạt nổ, rễ, dấu Rễ Đuổi); dx = khoảng cách ngang (ô) tới tâm camera:
A(dx) = 1                                            nếu |dx| ≤ panFullTiles (10 = nửa khung 20 ô)
      = 1 − (1 − edgeGain) × (|dx| − 10) / (R − 10)   nếu 10 < |dx| ≤ R; edgeGain = 0,5
      = không phát                                   nếu |dx| > R
  R = enemies.json → rules.activeRangeTiles (12), đọc từ dữ liệu, không chép số
pan = clamp(dx / 10, −1, 1) × maxPan; maxPan = 0,6 (đeo tai nghe không bị dồn hẳn một bên)
```

### 4.3 Giá trị biên

| Kịch bản | Đầu vào | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Thanh bằng 0 | s = 0 | tắt hẳn | không tạo kênh, không tốn CPU |
| Thanh thấp | s = 0,1 | −40 dB | vẫn còn nghe |
| Thanh giữa | s = 0,5 | −12 dB | nửa thanh ≈ nửa độ to cảm nhận |
| Thanh tối đa | s = 1 | 0 dB | |
| Tiếng bắn to nhất khi Thorna đang báo đòn (mặc định) | −10 + 1 − 3 (giảm) − 1,8 (sfx) − 3 | −16,8 dB | Cue Gai Quạt: −2 + 0 + 0 − 3 = −5 dB, cao hơn tiếng bắn 11,8 dB (A1 cần ≥ 6) |
| Nhạc khi Thorna báo đòn | −2 − 4 − 6,2 − 3 | −15,2 dB | |
| Hai nguồn giảm cùng lúc (hội thoại −6, Kai chết −12) | min(−6, −12) | −12 dB | không thành −18 |
| Người chơi kéo Hiệu ứng lên 1, Cảnh báo xuống 0,5 | bắn −10 + 1 − 3 − 3 = −15; cue −2 − 12 − 3 = −17 | cue thấp hơn bắn 2 dB | Lựa chọn của người chơi; hình báo trước vẫn đủ (A4) |
| Kẻ địch bị hạ cách 11 ô | A = 1 − 0,5 × 1 / 2 | 0,75 (−2,5 dB), pan 0,6 | ngoài khung hình |
| Kẻ địch cách 13 ô | khoảng cách > R = 12 | không phát | kẻ địch không hoạt động |
| Nhặt 7 viên Core Bit liền | +0, +1, +2… | tối đa +5 cung | im 0,6 s thì về +0 |
| Đáp ở 4 / 6 / 15 ô/s | `land` | im / −14 dB / −8 dB | |

### 4.4 Giảm nhạc (ducking)

| Nguồn | Khi nào | Bus bị giảm | Mức | Vào / giữ / ra |
| --- | --- | --- | --- | --- |
| `bossAlert` | có kênh bus `alert` đang phát | music; sfx | −4 dB; −3 dB | 30 ms / suốt cue / 250 ms |
| `dialogue` | hộp hội thoại mở (trận đứng yên) | music | −6 dB | 200 ms / tới khi đóng / 400 ms |
| `pause` | menu tạm dừng, bảng HTML (Kỹ năng, Xưởng, Chuẩn bị...) đè lên màn | music | −8 dB | 150 ms / tới khi đóng / 300 ms |
| `kaiDeath` | `playerDied` | music | −12 dB | 50 ms / 900 ms / 600 ms |

- Giảm bằng hệ số riêng của từng bus, **không ghi đè thanh của người chơi** (lỗi hay gặp, `audio-design`).
- Nhiều nguồn cùng lúc: lấy mức sâu nhất, không cộng.
- Bus `alert` không có nguồn giảm nào; kiểm lúc nạp (mục 7.2).
- Cue Thorna khoảng 1 lần mỗi 2–3 s, nên nhạc giảm khoảng 1 s rồi lên lại. Ra 250 ms để không "thở dốc" (pumping). Chơi thử mà thấy nhạc nhấp nhô thì hạ `bossAlert.music` còn −2 dB trước khi đổi thời gian (mục 7.5).
- Khi trận đứng yên (hộp thoại, tạm dừng, bảng HTML): mọi kênh `sfx` và `alert` **tạm dừng** (không chỉ giảm), tiếp tục khi đóng. Bus `ui` vẫn phát.

### 4.5 Giới hạn kênh và ưu tiên cắt

- `maxVoices` = 14 kênh chung cho `sfx`, `alert`, `ui`; trong đó `reservedAlertVoices` = 2 chỉ cho ưu tiên 5. Nhạc riêng, tối đa 4 kênh (3 stem + jingle).
- Lý do 14: đủ cho trận Thorna dày nhất (đo ở mục 8.2); ít hơn thì tiếng trúng bị nuốt, nhiều hơn chỉ thêm ồn. Không phải giới hạn CPU.
- Thứ tự xét một yêu cầu phát `r` (id, ưu tiên p):
  1. Cùng khung hình đã có yêu cầu cùng id: gộp (bỏ `r`). Áp cả khi một khung chạy nhiều bước logic (bù sau khi giật).
  2. Chưa qua `cooldownMs` của id: bỏ.
  3. Id đã đủ `maxInstances`: cắt kênh cũ nhất của id (mờ dần `stealFadeMs` = 20 ms) rồi phát `r`. Âm lặp lại thì cái mới nhất thắng.
  4. Còn kênh trống: phát. Ưu tiên dưới 5 chỉ dùng 12 kênh thường.
  5. Hết kênh: tìm kênh ưu tiên thấp nhất (bằng nhau thì cũ nhất) có ưu tiên < p; có thì cắt (20 ms) rồi phát; không có thì bỏ `r`.
  6. p = 5 luôn phát: dùng kênh dành riêng; hết thì cắt kênh ưu tiên thấp nhất. Kênh ưu tiên 5 chỉ bị cắt bởi luật 3 (cùng id).
- Âm vòng lặp (ù nạp, bám tường, nhịp tim) giữ kênh suốt lúc phát, xét ưu tiên như âm khác.

### 4.6 Mức tổng

- Đích **−18 LUFS ± 2** (tích hợp, đo theo ITU-R BS.1770 trên bản ghi 3 phút ở mức mặc định), đỉnh thật ≤ −1 dBTP. Đây là mức khuyến nghị ASWG-R001 cho máy cầm tay; dùng cho cả PC vì bản web thường nghe bằng loa laptop hoặc tai nghe.
- Không đặt `DynamicsCompressorNode` làm bộ chặn trên master ở MVP: theo đặc tả Web Audio, nút này tự bù âm lượng (makeup gain), làm lệch mức đã trộn. Khoảng dư (headroom) có từ `masterHeadroomDb` −3 dB, mức từng âm và giới hạn kênh; đỉnh đo ở ST-12-08.

## 5. Kỹ thuật web

### 5.1 Cách dựng trên Phaser 3.90

- Dùng Web Audio của Phaser (mặc định). `AudioService` (thư mục `src/audio/`, phần nối Phaser) là chỗ duy nhất gọi `scene.sound`. Gameplay và UI chỉ phát sự kiện (`WorldEvents`, `audio:play`), không giữ đối tượng âm.
- **Bus là hệ số trong AudioService**, không chèn GainNode vào đồ thị âm của Phaser. Khi thanh hoặc mức giảm đổi, cập nhật `setVolume` của các kênh đang phát (≤ 18 kênh). Lý do: không đụng phần trong của Phaser; đổi sang GainNode thật nếu sau MVP cần lọc hay vang.
- **Pool:** lúc nạp gói, dựng sẵn `maxInstances` đối tượng âm cho mỗi id (`sound.addAudioSprite`); phát chỉ chọn marker trên đối tượng rảnh. Không gọi `sound.add` hay `play(key)` tạo mới mỗi lần phát (`rules/core-and-ai-rules.md`).
- Âm có vị trí: StageScene truyền `x` của sự kiện và tâm camera; AudioService tính `A(dx)`, `pan` (`setPan`).
- Đặt `sound.pauseOnBlur = false`; ẩn trang do AudioService tự xử lý (mục 5.3).

### 5.2 Mở khóa AudioContext

- Trình duyệt chỉ cho phát sau cử chỉ người dùng. Phaser tự mở khóa ở lần chạm hoặc bấm đầu. Thêm lớp `AudioUnlock` nghe `pointerup`, `touchend`, `keydown` trên `window` ở pha capture (nút cảm ứng là lớp HTML phủ trên canvas), gọi `context.resume()`, gỡ nghe khi `context.state = running`.
- Lần mở game đầu, người chơi điều khiển Kai trong ≤ 15 s (07, F01), nên **không** thêm màn "Chạm để bắt đầu". Âm phát khi chưa mở khóa thì bỏ qua, không xếp hàng phát bù (tránh một tràng âm cũ lúc mở khóa).
- **Tay cầm:** ở một số trình duyệt, bấm nút tay cầm không tính là cử chỉ mở khóa. Nếu thiết bị gần nhất là tay cầm và sau `unlockHintAfterSec` = 3 s context vẫn khóa, Menu hiện dòng nhỏ "Bấm phím bất kỳ hoặc chạm để bật âm thanh" (ẩn khi có `audio:unlocked`).
- **iOS:** AudioContext có thể sang `interrupted` (cuộc gọi, Siri, đổi app). Trang hiện lại thì gọi `resume()`; không được thì gắn lại lớp mở khóa cho cử chỉ kế tiếp.
- iPhone gạt sang im lặng thì Web Audio im: giữ đúng hành vi của máy, không ép phát (mục 9). Bảng Âm thanh trên iOS có một dòng mẹo.

### 5.3 Ẩn trang, đổi tab, mất focus (tiêu chí M12 "không giật khi đổi tab")

| Lúc | Việc |
| --- | --- |
| `visibilitychange` sang ẩn, hoặc `pagehide` (đổi tab, thu nhỏ, khóa màn hình, đổi app) | (1) Dừng mọi kênh `sfx`, `alert`, `ui` (20 ms), ghi lại vòng lặp nào đang bật; (2) ghi vị trí nhạc; (3) `context.suspend()`. Vòng lặp game của Phaser cũng ngủ (đã có), nên nhạc và trận dừng cùng lúc |
| Đang trong màn mà ẩn trang, mất tay cầm, hoặc cầm dọc | Trận mở menu tạm dừng (QB-90, QB-93; Story MVP ở `17-Quy-tac-bien.md`); âm theo luật tạm dừng (mục 4.4). Quay lại thì không bị đánh ngay |
| Ẩn sang hiện | `context.resume()`; nhạc lên từ 0 tới mức đích trong 300 ms, từ đúng vị trí cũ (đồng hồ context đứng yên nên các stem vẫn khớp); vòng lặp SFX (ù nạp, bám tường) dựng lại từ trạng thái ở bước kế tiếp; không phát lại âm một lần (one-shot) cũ |
| Bù bước sau khi ngủ | `FixedStep` đã bỏ phần dư (tối đa `maxStepsPerFrame` bước); âm các bước bù gộp theo khung (mục 4.5, luật 1), nên không có tràng âm |
| `blur` (cửa sổ mất focus nhưng vẫn hiện) | Không tắt tiếng: vòng lặp game vẫn chạy (Phaser chỉ ngủ khi ẩn trang), âm đi theo hình |

### 5.4 Định dạng và sprite âm thanh

- Mỗi âm có hai bản: **`.ogg` (Vorbis)** cho Chrome, Firefox, Edge, Android; **`.m4a` (AAC-LC)** dự phòng cho Safari, iOS. Phaser chọn định dạng đầu tiên trình duyệt phát được (`load.audio(key, [ogg, m4a])`).
- **Không dùng `.mp3`** cho nhạc: khoảng đệm của bộ mã hóa làm hở chỗ lặp.
- **SFX:** 44,1 kHz mono, Vorbis khoảng 64 kb/s (≈ 8 KB/s).
- **Nhạc:** 44,1 kHz; bản một lớp và stem `base` stereo khoảng 96 kb/s (≈ 12 KB/s); stem `drive`, `peak` mono 64 kb/s (≈ 8 KB/s). AAC cùng tốc độ.
- **Sprite âm thanh:** một file kèm JSON marker, định dạng của công cụ `audiosprite`, Phaser đọc bằng `load.audioSprite`.
  - 4 gói theo lúc dùng (mục 5.5); giữa hai marker có 0,25 s im.
  - Biến thể là marker `id_1`…`id_n`; tiếng tích của đòn nhiều nhịp là marker `id_tick`.
  - Vòng lặp SFX (ù nạp, bám tường) nằm trong sprite; nếu nghe tiếng "tách" ở chỗ nối thì tách ra file riêng.
- **Nhạc:** mỗi bản (mỗi stem) một file, không gộp sprite.
- **Thư mục:** file nguồn WAV ở `05-Assets/audio-src/` (không vào bản build); bản xuất ở `game/public/assets/audio/`.
- **Script** `game/scripts/build-audio.mjs` (gọi `ffmpeg` và `audiosprite`): xuất hai định dạng, ghi JSON marker, kiểm độ dài vòng lặp nhạc.

### 5.5 Ngân sách tải và nạp lười

| Gói | Nạp lúc | Dung lượng (một định dạng) | Chặn vào game? |
| --- | --- | --- | --- |
| `sfx-ui` (âm giao diện) | Preload | ≤ 30 KB | Có: +0,06 s ở 4 Mb/s, vào game 2,57 s ≤ 3 s |
| `music.menu` | Ngay khi Menu hiện (nền) | ≈ 460 KB | Không |
| `sfx-core` (Kai, vũ khí, trúng, nhặt, kẻ địch chung, hội thoại) | Menu, nền, sau `music.menu` | ≤ 200 KB | Không |
| `music.stage1` (hoặc `music.prologue`) + `sfx-verdant` | Khi mở màn Chuẩn bị hoặc chọn màn | ≤ 0,85 MB | Không: chưa xong thì chơi im, nhạc vào khi xong |
| `music.boss` (3 stem) + `sfx-thorna` | Ngay khi vào màn có boss, sau gói màn | ≤ 1,25 MB | Không (còn ≥ 1,5 phút trước cửa boss; phòng thử Thorna nạp từ màn Chuẩn bị) |
| `music.win` + `music.result` | Khi vào đấu trường | ≤ 0,52 MB | Không |

- Tải đầu tăng ≤ 30 KB: ngưỡng 30 MB và vào game ≤ 3 s vẫn đạt.
- **Âm riêng của Stage 1** (nhạc màn, bản boss, `sfx-verdant`, `sfx-thorna`) ≈ 2,1 MB ≤ 2,5 MB, nằm trong ngân sách 8 MB mỗi màn (GDD 15). Tổng âm một lượt Stage 1 từ lúc mở game ≈ 3,3 MB ≤ 3,5 MB.
- Cách tính: dung lượng ≈ thời lượng × tốc độ. Bản boss = 41,1 s × (12 + 8 + 8) KB/s ≈ 1,15 MB; Stage 1 = 64 s × 12 KB/s ≈ 0,77 MB; menu = 38,4 s × 12 KB/s ≈ 0,46 MB.
- Lỗi tải: im lặng, thử lại một lần sau `loadRetrySec` = 5 s, ghi một `console.warn` cho mỗi gói; không bao giờ chặn vào màn.
- Rời cảnh thì giải phóng gói không còn dùng (`cache.audio.remove`): vào màn bỏ `music.menu`; về menu bỏ gói màn và gói boss.
- Bộ nhớ đệm HTTP, sau này là PWA (M17), giữ file sau lần tải đầu.

### 5.6 Bộ nhớ (âm đã giải mã)

Web Audio giải mã cả file thành PCM float32 ở tần số của context (thường 48 kHz): stereo ≈ 384 KB/s, mono ≈ 192 KB/s.

```text
RAM = Σ (thời lượng × sampleRate × số kênh × 4 byte)
```

| Lúc | Đang giữ | RAM |
| --- | --- | --- |
| Menu | menu (38,4 s stereo) + `sfx-ui`, `sfx-core` (khoảng 25 s mono) | 14,7 + 4,8 ≈ 19,5 MB |
| Trong Stage 1, trước cửa boss (cao nhất) | Stage 1 (64 s stereo) + boss (41,1 s stereo + 2 × 41,1 s mono) + SFX (khoảng 32 s mono) | 24,6 + 31,6 + 6,1 ≈ 62 MB |
| Đấu trường (đã bỏ nhạc màn ở `bossIntro`) | boss + win, result (42,4 s stereo) + SFX | 31,6 + 16,3 + 6,1 ≈ 54 MB |

- Ngân sách **≤ 64 MB** lúc cao nhất (máy tầm trung khoảng 3 GB RAM, GDD 15). Bỏ `music.stage1` ngay khi vào `bossIntro`.
- Nếu đo trên máy thật mà vượt ngân sách, hoặc tab bị trình duyệt nạp lại:
  - (a) chỉ tải sẵn byte nén của bản boss, giải mã ở `bossIntro` sau khi bỏ nhạc màn (đỉnh còn khoảng 40 MB);
  - (b) tạo AudioContext 32 kHz (Phaser cho truyền `audio.context`).
- Không chuyển nhạc sang thẻ `<audio>`: lặp không liền, các stem không khớp nhau (mục 9).

### 5.7 Độ trễ và hiệu năng

- Độ trễ đầu ra (`baseLatency + outputLatency`, hiện ở lớp debug `?debug=1`): ≤ 50 ms trên Chrome PC, ≤ 150 ms trên Chrome Android. Với báo trước ngắn nhất 0,4 s, trễ 150 ms vẫn còn ≥ 0,25 s; hình vẫn là tín hiệu chính.
- Tai nghe Bluetooth trễ thêm khoảng 150–250 ms; trên web không bù được. Bảng Âm thanh ghi: "Âm báo có thể trễ với tai nghe Bluetooth, hình báo trước luôn đúng giờ."
- AudioService ≤ 0,5 ms mỗi khung trên máy tầm trung; không giải mã giữa trận (giải mã lúc nạp gói); bật âm mà FPS không thấp hơn ngưỡng cổng (60 FPS, `gate-check` CPU chậm 4×).
- Giảm tốc độ game (tùy chọn tiếp cận 70–100%): âm và nhạc giữ tốc độ gốc. Báo trước dài ra nên cue vẫn ngắn hơn báo trước.

### 5.8 Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| AudioContext chưa mở khóa | Bỏ yêu cầu phát, không xếp hàng; nhạc bắt đầu khi mở khóa (vào 1 s) |
| Gói chưa tải xong khi cần | Im lặng; nhạc vào khi xong (thời gian theo bảng 3.3) |
| Thiếu marker trong sprite | Lỗi ở test, CI; lúc chạy bỏ qua âm đó, ghi một cảnh báo |
| Kai chết đúng lúc boss báo đòn | Cue `alert` vẫn phát hết; nhạc giảm `kaiDeath` |
| Hạ boss khi cue đang phát | Dừng mọi kênh `alert` (50 ms) rồi phát `boss.defeat` |
| Hạ boss và Kai trúng đòn boss cùng bước (QB-30) | Thắng; đòn boss bước đó không tính nên không có `kai.hurt` |
| Boss đổi pha, bất tử 0,6 s và xóa đạn (QB-31) | `boss.phase` phát một lần dù một đòn vượt hai ngưỡng; lớp nhạc theo pha sau khi kẹp |
| Hồi sinh | Dừng vòng lặp ù nạp, bám tường; kẻ địch dựng lại nên cue của chúng dừng theo |
| Dừng hình (hit-stop 3 bước) | Âm không dừng |
| Hai trường loại trừ cùng bước (`playerHurt` với `fellInPit`, `spikeHit`, `playerDied`; `hitEnemy` với `enemyKilled`; `hitBoss` với `weakHit`) | Chỉ phát âm của trường mạnh hơn (bảng mục 2) |
| Nhiều bước logic trong một khung (bù sau giật) | Gộp theo id trong khung |
| Tự bắn (cảm ứng): giữ nút vừa bắn vừa nạp | Tiếng ù vẫn chạy (cho biết đang nạp); tiếng bắn theo `cooldownMs` như bắn tay |
| Prologue nhịp 1–3 (kẻ địch vô hại) | Cue và tiếng bắn vẫn có; không có `kai.hurt` vì không mất máu |
| Bảng HTML đè lên màn | Coi như tạm dừng (mục 4.4) |
| `cv.audio` hỏng | Từng trường hỏng về mặc định (như `cv.controls`) |
| Hai tab cùng mở game | Mỗi tab một context; tab bị ẩn tự tạm ngưng |

Các luật riêng của âm thanh ở bảng này đề xuất đưa vào `17-Quy-tac-bien.md` thành nhóm "Âm thanh" (mục 11); Story và test ghi mã luật khi đã có mã.

## 6. Cài đặt, tiếp cận, rung

### 6.1 Thanh âm lượng (tab Âm thanh của màn Cài đặt)

- EP-12 dựng bảng Âm thanh (HTML theo ADR-001, nút ≥ 48 dp, chữ ≥ 16 sp) trước; khi có màn Cài đặt của `14-Cai-dat-Tiep-can.md` (EP-14), bảng thành tab Âm thanh, là "chỗ đặt" ở mục 3.3 của 14. Tài liệu này quy định nội dung.
- Năm thanh: **Tổng**, **Nhạc**, **Hiệu ứng**, **Cảnh báo đòn boss** (bus `alert`), **Giao diện**. Bước `sliderStep` = 0,1 (11 nấc, số hiện 0–10). Điều khiển bằng phím ←/→, tay cầm, kéo chạm; vùng chạm ≥ 48 dp.
- Thả thanh thì phát âm mẫu: Hiệu ứng `wpn.arc.shot`, Cảnh báo `thorna.thorns.tele`, Giao diện `ui.confirm`. Nhạc đổi ngay trên bản đang chạy.
- Mở từ Menu chính và từ mục Tùy chọn của menu tạm dừng (hiện ghi "chưa có"); sau EP-14 thì qua Cài đặt → Âm thanh.
- Tab Tiếp cận có dòng "Âm cảnh báo đòn boss" (`Access.html`; 14 ghi là lối tắt sang Âm thanh). Nó điều khiển **cùng** bus `alert` (tắt = thanh 0, bật = trả mức trước đó), không phải cài đặt riêng.
- Bỏ hai dòng của wireframe: "Tắt tiếng khi chuyển tab", "Nhạc theo nhịp pha boss" (mục 9, quyết định 9, 10).

### 6.2 Tắt tiếng

- Công tắc **Tắt tiếng** trên bus `master`, giữ nguyên mức các thanh.
- Menu tạm dừng có mục nhanh "Âm thanh: Bật/Tắt".
- Không có phím tắt riêng ở MVP (không thêm hành động vào `controls.json`).

### 6.3 Hình thay âm (người khiếm thính, người chơi tắt tiếng)

| Thông tin có ở âm | Hình tương ứng | Trạng thái |
| --- | --- | --- |
| Kẻ địch, boss báo trước trong khung hình | nhấp nháy, phình, co, tư thế, vệt nứt, vệt tím | Có |
| Đòn nhiều nhịp | chấm sáng theo số nhịp | Có (EP-10) |
| Kẻ địch ngoài khung hình báo trước | Không xảy ra: QB-23 chỉ cho báo trước khi đã trong khung hình | Theo QB-23 (Story MVP). Nếu QB-23 bị hoãn: dấu "!" ở mép màn phía kẻ địch, 0,4 s, hình theo loại (P1) |
| Nạp vừa, nạp đầy | ánh nạp quanh Kai (`chargeGlowColor`) | Có |
| Mất nạp | ánh nạp tắt kèm chớp xám 0,15 s | **Cần thêm** (nhỏ) |
| Hết năng lượng vũ khí | chữ HUD | Có |
| Khiên sẵn, khiên vỡ (C3) | viền chớp trắng; 8 mảnh kính | Có |
| Lượt lướt trên không hồi (P1) | đèn chân chớp | Có |
| Boss đổi pha | camera chớp | Có |
| Boss choáng (cửa sổ tấn công) | màu choáng, sao trên đầu | Có |
| Ai đang nói (âm biểu cảm) | tên, chân dung trên hộp | Có |
| Checkpoint, bí mật, phòng khóa | chữ HUD | Có |

- Nhờ QB-23, mọi cue đều có hình ngay trên màn, nên **không cần** thêm tùy chọn "chỉ báo âm thanh bằng hình". Nhiều người chơi điện thoại để im lặng vẫn đủ thông tin.
- Giảm nhấp nháy (`a11y.reduceFlash`, 14 mục 4.3) thêm thanh tiến độ báo trước; cue âm không đổi.
- Phụ đề: không có lời nói nên không cần phụ đề lời. MVP không làm phụ đề tiếng động bằng chữ; bảng trên đã che hết phần thông tin chỉ nghe được.

### 6.4 Rung thiết bị

- Dùng `navigator.vibrate` (Chrome Android). Safari iOS không có API này nên web iOS không rung (14 cho dòng cài đặt mờ "Máy này không hỗ trợ"); bản app Capacitor dùng plugin rung sau. Chỉ rung khi thiết bị gần nhất là cảm ứng và `touch.vibration` bật (đã có, mặc định bật).
- Rung tay cầm (`gamepad.vibration`, mẫu `dual-rumble`) do `14-Cai-dat-Tiep-can.md` quy định, đặt cạnh mẫu rung điện thoại dưới đây, cùng tên sự kiện để hai bên khớp nhau.
- Mẫu rung điện thoại (dữ liệu ở `ui.json → feedback`, mục 11):

| Sự kiện | Rung |
| --- | --- |
| Chạm nút cảm ứng | 8 ms (đã có) |
| Bậc phản hồi nhỏ / vừa / lớn | 0 / 20 / 35 ms |
| Kai bị đánh | 40 ms |
| Kai chết | 60 ms, nghỉ 40 ms, 60 ms |
| Nạp đầy | 12 ms |

- Tổng rung ≤ 300 ms trong 1 s bất kỳ.
- Không rung theo cue báo trước: khoảng 2 s một lần gây mỏi tay, và đã có âm, hình.
- Rung màn hình (camera shake) thuộc `a11y.screenShake` (14 mục 4.2), không thuộc M12.

### 6.5 Lưu cài đặt

- `localStorage` khóa riêng **`cv.audio`** (14 mục 3.3, 6 đã ghi theo khóa này): `{ version: 1, master, music, sfx, alert, ui, muted }` (số 0–1 bước 0,1; `muted` boolean). Mặc định lấy từ `audio.json → buses.*.default`.
- Đọc đồng bộ ở Boot (trước âm đầu tiên); hỏng từng trường thì trường đó về mặc định. Không vào bản lưu M11 (cùng lý do 14 nêu cho `cv.settings`: cần trước khung hình đầu, theo từng thiết bị, "Xóa bản lưu" không đụng cài đặt). "Đặt lại cài đặt" của 14 đặt lại cả `cv.audio`.
- Đổi cài đặt phát `audio:settings-changed` (cùng kiểu `input:settings-changed` của điều khiển); AudioService nghe và áp ngay.

## 7. Dữ liệu và code

### 7.1 `03-Data/audio.json` (đề xuất)

Rút gọn, mỗi nhóm một ví dụ; bản đủ có mọi id ở mục 2.

```json
{
  "_note": "Âm thanh MVP (01-GDD/12-Am-thanh.md). Mọi số là [PLACEHOLDER].",
  "buses": {
    "master": { "default": 1.0 },
    "music": { "default": 0.7 },
    "sfx": { "default": 0.9 },
    "alert": { "default": 1.0 },
    "ui": { "default": 0.8 }
  },
  "mix": {
    "sliderCurve": 2, "sliderStep": 0.1, "masterHeadroomDb": -3,
    "maxVoices": 14, "reservedAlertVoices": 2, "stealFadeMs": 20,
    "volJitterDb": 1, "pitchJitterSemis": 0.5,
    "panFullTiles": 10, "maxPan": 0.6, "edgeGain": 0.5,
    "cueMaxFractionOfTelegraph": 0.75, "beatTickGapSec": 0.12,
    "chargeHumDelaySec": 0.2,
    "land": { "minTilesPerSec": 6, "minDb": -14, "maxDb": -8 },
    "coreBitLadder": { "stepSemis": 1, "maxSteps": 5, "resetSec": 0.6 },
    "unlockHintAfterSec": 3, "loadRetrySec": 5
  },
  "ducking": {
    "bossAlert": { "music": -4, "sfx": -3, "attackMs": 30, "holdMs": 0, "releaseMs": 250 },
    "dialogue": { "music": -6, "attackMs": 200, "holdMs": 0, "releaseMs": 400 },
    "pause": { "music": -8, "attackMs": 150, "holdMs": 0, "releaseMs": 300 },
    "kaiDeath": { "music": -12, "attackMs": 50, "holdMs": 900, "releaseMs": 600 }
  },
  "packs": {
    "ui": { "sprite": "audio/sfx-ui", "load": "preload" },
    "core": { "sprite": "audio/sfx-core", "load": "menu" },
    "verdant": { "sprite": "audio/sfx-verdant", "load": "campaign:verdant_gardens" },
    "thorna": { "sprite": "audio/sfx-thorna", "load": "boss:thorna" }
  },
  "music": {
    "fadeMs": {
      "firstIn": 1000, "menuOut": 400, "stageIn": 800, "toBossOut": 500, "bossIntro": 800,
      "layer": 1000, "bossOut": 600, "winDelay": 1000, "resultIn": 800, "quitOut": 300, "resumeIn": 300
    },
    "tracks": {
      "menu": { "file": "audio/music-menu", "bpm": 100, "bars": 16, "volumeDb": -2 },
      "prologue": { "file": "audio/music-prologue", "bpm": 90, "bars": 24, "volumeDb": -2 },
      "stage1": { "file": "audio/music-stage1", "bpm": 120, "bars": 32, "volumeDb": -2 },
      "boss": {
        "stems": { "base": "audio/music-boss-base", "drive": "audio/music-boss-drive", "peak": "audio/music-boss-peak" },
        "bpm": 140, "bars": 24, "volumeDb": -2,
        "layersByPhase": [["base"], ["base", "drive"], ["base", "drive", "peak"]],
        "stunnedStemDb": { "peak": -6 }
      },
      "win": { "file": "audio/music-win", "loop": false, "volumeDb": -1 },
      "result": { "file": "audio/music-result", "bpm": 100, "bars": 16, "volumeDb": -4 }
    },
    "stageTrack": { "default": "prologue", "verdant_gardens": "stage1" },
    "bossTrack": { "default": "boss" }
  },
  "sounds": {
    "wpn.arc.shot": {
      "pack": "core", "bus": "sfx", "on": ["fired:shot"], "variants": 4,
      "volumeDb": -10, "priority": 1, "maxInstances": 3, "cooldownMs": 60
    },
    "wpn.charge.hum": {
      "pack": "core", "bus": "sfx", "on": ["charge:started"], "loop": true,
      "volumeDb": -14, "priority": 2, "maxInstances": 1, "cooldownMs": 0, "rateRange": [1.0, 1.12]
    },
    "enemy.drone.tele": {
      "pack": "core", "bus": "sfx", "on": ["enemyTelegraph:drone_linh", "enemyTelegraph:drone_linh_prologue"],
      "variants": 1, "tick": true, "pitchJitterSemis": 0, "positional": true,
      "volumeDb": -4, "priority": 4, "maxInstances": 2, "cooldownMs": 150
    },
    "thorna.thorns.tele": {
      "pack": "thorna", "bus": "alert", "on": ["bossTelegraph:thorna.thorns"], "variants": 1,
      "pitchJitterSemis": 0, "volumeDb": -2, "priority": 5, "maxInstances": 1, "cooldownMs": 0
    },
    "thorna.stalk.mark": {
      "pack": "thorna", "bus": "alert", "on": ["bossMark:thorna"], "positional": true,
      "pitchBySemis": [0, 2, 4, 5], "volumeDb": -6, "priority": 5, "maxInstances": 2, "cooldownMs": 0
    },
    "gray.shot.tele": { "alias": "thorna.thorns.tele", "rate": 1.1, "on": ["bossTelegraph:gray.shot"] },
    "dlg.emote.nova": {
      "pack": "core", "bus": "ui", "variants": 2,
      "volumeDb": -8, "priority": 2, "maxInstances": 1, "cooldownMs": 1500
    }
  }
}
```

- `on`: danh sách trigger `<loại>:<tham số>`. Loại là danh sách cố định xuất từ `logic/audio/triggers.ts` (`fired`, `charge`, `jumped`, `enemyTelegraph`, `bossTelegraph`, `bossMark`...); tham số phải có thật trong dữ liệu (id kẻ địch, `boss.đòn`). Âm phát bằng `audio:play` (giao diện, hội thoại) để trống `on`.
- `alias`: dùng file của âm gốc; ghi đè được `rate`, `volumeDb`, `on`, `priority`, `bus`. Không alias lồng nhau.

### 7.2 Kiểm tra trong `core/audio-config.ts`

**Kiểu và khoảng:**

- `buses` có đúng 5 id; `default` ∈ [0, 1] và là bội của `sliderStep`.
- Mỗi âm: `pack` có trong `packs` (hoặc `alias` trỏ âm có thật); `bus` hợp lệ; `volumeDb` ∈ [−40, 0]; `variants` nguyên ≥ 1; `priority` nguyên 1–5; `maxInstances` ≥ 1; `cooldownMs` ≥ 0; `pitchJitterSemis` ∈ [0, 2]; `rate` ∈ [0,5; 2]; mỗi phần tử `on` là trigger đã biết với tham số có thật.
- Nhạc: `bpm` > 0, `bars` nguyên > 0; `layersByPhase` chỉ dùng stem đã khai, phần tử đầu không rỗng, lớp sau chứa đủ lớp trước (chỉ thêm, không bớt).
- `ducking`: mức ∈ [−24, 0], thời gian ≥ 0, không nhắm bus `alert`.
- `mix`: `reservedAlertVoices` < `maxVoices`; `cueMaxFractionOfTelegraph` ∈ (0, 1]; `coreBitLadder.stepSemis × maxSteps` ≤ 12.

**Bất biến giữa các file** (thêm vào `checkDesignInvariants`):

- **Bao phủ báo trước** (quy tắc 1): mọi kẻ địch trong `enemies.json` có `attack.telegraphSec` (Golem: `slam`, `bombs`, `dash`) và mọi đòn trong `phases` của mọi boss (bản gốc và `challenge`) có ít nhất một âm với `on` là `enemyTelegraph:<id>[.<move>]` hoặc `bossTelegraph:<boss>.<đòn>`.
- Cue boss và Golem ở bus `alert`, ưu tiên 5; ưu tiên 5 chỉ có ở bus `alert`; cue báo trước có `pitchJitterSemis = 0`.
- Mỗi người nói (`ui.json → dialogue.speakers`, mỗi boss có thoại trong `dialogue_wardens.json`) có `dlg.emote.<id>`, hoặc có `dlg.emote.default`.
- `stageTrack` chỉ chứa `default` và campaign có trong `stages.json`; boss của mỗi màn có bản trong `bossTrack` (hoặc `default`); số pha của boss ≤ số phần tử `layersByPhase`.

**Kiểm với JSON sprite** (test đọc `game/public/assets/audio/*.json`; Preload kiểm lại khi nạp gói):

- Marker `id_1`…`id_n` (và `id_tick` nếu `tick`) có trong sprite của gói.
- **Độ dài cue** (quy tắc 3): `markerSec / rate` (đòn nhiều nhịp: `(beats − 1) × beatTickGapSec + tickSec`) ≤ `cueMaxFractionOfTelegraph × telegraphMin`, với `telegraphMin` tính từ `bosses.json`, `enemies.json` như bảng 2.1. Đổi số báo trước sau cổng Prototype mà cue quá dài thì test đỏ.
- Nhạc: độ dài file = `bars × 4 × 60 / bpm` ± 5 ms; các stem cùng độ dài.

### 7.3 Logic thuần (`src/logic/audio/`, không import Phaser) và test

| File | Việc | Test chính |
| --- | --- | --- |
| `volume.ts` | thanh ↔ hệ số ↔ dB (mục 4.2) | s = 0 → tắt; 0,1 → −40 dB; 0,5 → −12 dB; 0,7 → −6,2 dB; 1 → 0 dB |
| `triggers.ts` | danh sách trigger; đổi `WorldEvents` thành yêu cầu `{ id, x? }` (ghi vào mảng dùng lại); luật loại trừ | mỗi trường `WorldEvents` có trigger hoặc ghi rõ "không âm"; `fellInPit` thay `kai.hurt`; `enemyKilled` thay `hitEnemy`; gộp theo khung |
| `variant-picker.ts` | chọn biến thể không lặp liền (túi xáo, `logic/rng.ts` có hạt giống); lệch cao độ, âm lượng | 1.000 lần không có hai lần liền giống (variants ≥ 2); 4 biến thể mỗi cái 25% ± 5% |
| `voice-limiter.ts` | thuật toán mục 4.5 | 20 yêu cầu cùng khung → ≤ 14 kênh; ưu tiên 5 luôn phát kể cả khi đầy; cooldown; đủ `maxInstances` thì cắt cái cũ nhất; ưu tiên thấp bị cắt trước |
| `ducking.ts` | đường bao vào, giữ, ra; lấy min | hai nguồn → mức sâu nhất; `alert` luôn 0; ra đúng `releaseMs` |
| `charge-hum.ts`, `pitch-ladder.ts`, `land.ts` | trễ ù 0,2 s; thang Core Bit; mức tiếng đáp theo tốc độ | giữ 0,15 s không ù; viên thứ 7 trong 0,6 s vẫn +5; đáp 4 / 6 / 15 ô/s → im / −14 / −8 dB |
| `music-director.ts` | máy trạng thái 3.3: vào (cảnh, màn, đấu trường, trạng thái và pha boss, hộp thoại, tạm dừng, Kai chết, Kết quả, ẩn trang) → bản, hệ số từng stem, mức giảm | từng dòng bảng 3.3; hồi sinh trong đấu trường giữ đúng lớp; boss đặt lại về pha 1 thì bỏ lớp |
| `audio-settings.ts` | `parseAudioSettings`: đọc, ghi, chuẩn hóa `cv.audio` | hỏng từng trường về mặc định; giá trị lệch bước 0,1 thì làm tròn; phiên bản lạ về mặc định; thiếu khóa thì lấy `buses.*.default` |
| `core/audio-config.ts` | kiểm tra mục 7.2 | dữ liệu thật qua; mỗi luật có một ca hỏng |

**Test mô phỏng** (`tests/audio-coverage.test.ts`): bot đánh Thorna 120 s ở Thường và Thử thách, bắn liên tục, đi qua `triggers` và `voice-limiter`.

- Mỗi `bossTelegraph` sinh đúng một cue, không bị bỏ hay cắt.
- ≤ 20 lần phát trong 1 s bất kỳ, trung bình ≤ 15/s; âm ưu tiên ≥ 3 không quá 6 lần trong 1 s bất kỳ.
- Ở mức mặc định, cue cao hơn tiếng bắn ≥ 6 dB theo công thức 4.2.

### 7.4 Giao tiếp sự kiện

- **Nghe:**
  - `WorldEvents` mỗi bước: `StageScene.react()` chuyển cho AudioDirector, kèm tâm camera.
  - Trạng thái đọc mỗi khung cho MusicDirector: `world.phase`, `world.boss.state`, pha boss, `player.state`.
  - `GameEvents`: `scene:changed`, `input:device-changed` (đã có; dùng cho dòng nhắc mở khóa khi dùng tay cầm); `audio:play { id }`, `audio:settings-changed { settings }` (mới).
- **Phát:** `audio:unlocked` (mới).
- AudioService chỉ quan sát: không đọc phím, không giữ máu hay tiền (`rules/ui-and-data-rules.md`).
- Nối StageScene: một lời gọi trong `react()` và một lời gọi mỗi khung cho MusicDirector; không đổi luồng logic của trận.

### 7.5 Nút tinh chỉnh

Mọi thứ nằm trong `audio.json`, chỉnh không cần sửa code:

- Từng âm: `volumeDb`, `variants`, `pitchJitterSemis`, `priority`, `maxInstances`, `cooldownMs`, `on`, `alias` và `rate`.
- Trộn: mức mặc định 5 bus, `masterHeadroomDb`, `maxVoices`, `reservedAlertVoices`, `panFullTiles`, `maxPan`, `edgeGain`.
- Giảm nhạc: mức, vào, giữ, ra của từng nguồn.
- Nhạc: thời gian chuyển (`fadeMs`), `layersByPhase`, `stunnedStemDb`, mức từng bản.
- Cue: `cueMaxFractionOfTelegraph`, `beatTickGapSec`. Nạp: `chargeHumDelaySec`. Đáp: `land`. Core Bit: `coreBitLadder`.
- **Quy tắc chỉnh sau chơi thử:**
  - Người thử nói "ồn": hạ `wpn.arc.shot` và các `hit.*` 2 dB trước khi giảm số kênh.
  - Cue bị nói "khó nghe": cho `bossAlert.sfx` sâu tới −6 dB trước khi tăng mức cue (giữ khoảng dư).
  - Nhạc "nhấp nhô" khi boss đánh: hạ `bossAlert.music` còn −2 dB.

## 8. Nguồn âm, nghiệm thu, giả thuyết

### 8.1 Nguồn và giấy phép

| Loại | Nguồn | Giấy phép | Ghi chú |
| --- | --- | --- | --- |
| SFX (phần lớn) | Tự làm bằng jsfxr/sfxr | Tự làm | Lưu chuỗi tham số jsfxr cạnh file WAV để làm lại, chỉnh lại |
| SFX chất liệu thật (kính vỡ, cửa, đất, gỗ) | Gói âm Kenney | CC0 | Ghi tên gói, URL |
| SFX khác | Freesound, OpenGameArt | Chỉ **CC0**; CC-BY khi thật cần (ghi công ở màn Credits) | Không dùng CC-BY-NC (cấm thương mại), CC-BY-SA, GPL |
| Nhạc | Tự soạn bằng BeepBox hoặc Bosca Ceoil | Tự làm (đọc lại điều khoản công cụ lúc dùng) | Xuất WAV rồi chạy `build-audio.mjs` |
| Nhạc, âm làm bằng công cụ AI | Chỉ khi điều khoản cho dùng thương mại | Lưu bằng chứng điều khoản | Như `05-Assets/01-Huong-dan-asset.md` mục 9 |

- Mỗi file một dòng ở `05-Assets/licenses/audio.csv`: `id, file, nguồn, tác giả, giấy phép, URL, ngày lấy, đã chỉnh gì`. Story không được DONE nếu file chưa có dòng giấy phép.
- Không dùng âm hay nhạc trích từ game khác; không mô tả "theo phong cách" của một nhạc sĩ còn sống khi dùng công cụ AI.
- Âm sắc chung: chiptune pha synth (GDD 14). Thorna thêm chất liệu gỗ, đất cho khớp chủ đề cây.

### 8.2 Tiêu chí nghiệm thu

- [ ] **Bao phủ báo trước:** 100% đòn có báo trước của 6 loại kẻ địch thường (gồm Tháp Pháo Tập Sự và Drone Prologue), Golem, Thorna và boss xám, cả bản Thử thách, có cue (kiểm lúc nạp và test mô phỏng).
- [ ] Cue phát cùng bước logic với lúc báo trước bắt đầu; dài ≤ 75% báo trước ngắn nhất (bảng 2.1).
- [ ] Trận Thorna mô phỏng 120 s (Thường, Thử thách), bắn liên tục: 0 cue `alert` bị bỏ hoặc cắt; ≤ 20 lần phát trong 1 s bất kỳ, trung bình ≤ 15/s; âm ưu tiên ≥ 3 không quá 6 lần trong 1 s.
- [ ] Ở mức mặc định, cue boss cao hơn tiếng bắn ≥ 6 dB (theo công thức 4.2 là 11,8 dB).
- [ ] **Mức tổng:** bản ghi 3 phút (phòng thử kẻ địch rồi Thorna) ở mặc định: −18 LUFS ± 2; đỉnh thật ≤ −1 dBTP.
- [ ] **Đổi tab** (Chrome PC, Chrome Android; Safari nếu có máy), 10 lần liền:
  - ẩn trang thì im trong ≤ 100 ms (`context.state = suspended`);
  - hiện lại thì nhạc tiếp từ chỗ cũ (lệch ≤ 50 ms), lên trong 300 ms; ≤ 2 SFX trong 500 ms đầu;
  - không có khung > 50 ms do âm thanh; đang trong màn thì menu tạm dừng đang mở.
- [ ] **Mở khóa:** có âm ngay từ thao tác đầu tiên (chạm nút cảm ứng, phím, chuột) trên Chrome, Firefox, Edge PC và Chrome Android; chỉ dùng tay cầm thì hiện dòng nhắc sau 3 s.
- [ ] **Tải:** `gate-check` vẫn đạt vào game ≤ 3 s; âm chặn tải đầu ≤ 30 KB; âm riêng Stage 1 ≤ 2,5 MB; tổng âm một lượt Stage 1 ≤ 3,5 MB.
- [ ] **RAM** âm đã giải mã ≤ 64 MB lúc cao nhất (tổng `length × numberOfChannels × 4` của các AudioBuffer, hiện ở lớp debug).
- [ ] **Độ trễ** đầu ra ≤ 50 ms Chrome PC, ≤ 150 ms Chrome Android (lớp debug).
- [ ] **Vòng lặp nhạc** không hở ≥ 5 ms ở chỗ nối (Chrome, Safari); đổi pha boss không làm lệch nhịp giữa các stem.
- [ ] **Cài đặt:** thanh 0 thì im hẳn; Tắt tiếng giữ mức các thanh; tải lại trang vẫn giữ cài đặt; Cảnh báo = 0 thì không có cue boss nhưng hình báo trước vẫn đủ; dòng "Âm cảnh báo đòn boss" ở tab Tiếp cận và thanh Cảnh báo luôn cùng trạng thái.
- [ ] Không thông tin nào chỉ có ở âm: bảng 6.3 toàn "Có".
- [ ] Bật âm mà FPS không thấp hơn ngưỡng cổng (`gate-check` CPU chậm 4×); không lỗi console; `npm test && npm run lint && npm run format:check && npm run build` đạt.
- [ ] Mỗi file âm có dòng giấy phép.
- [ ] Bằng chứng nghe thử (bản ghi, ảnh lớp debug, kết quả đo) ở `04-Dev-Plan/qa/ST-12-08/`. Quy tắc "The Look Rule" áp cả cho âm: kiểm tra cú pháp không thay được việc nghe thật.

### 8.3 Giả thuyết chơi thử

| Mã | Giả thuyết | Cách đo | Ngưỡng `[PLACEHOLDER]` | Nếu sai |
| --- | --- | --- | --- | --- |
| H1 | Âm báo giúp né | Nhật ký chơi thử ghi thêm cài đặt âm; so số lần chết ở Thorna giữa lượt có âm và lượt tắt tiếng (hoặc Cảnh báo = 0) | Có âm chết ít hơn ≥ 15% | Làm cue rõ hơn, khác nhau hơn; kiểm độ trễ trên máy người thử |
| H2 | Nghe ra đòn | Bài nghe 10 cue (5 đòn Thorna × 2 lượt, xáo thứ tự) sau một lần chơi, che màn hình | ≥ 70% người thử gọi đúng ≥ 8/10 | Làm lại cue bị nhầm nhiều nhất (dễ là Rễ Trồi với Rễ Đuổi) |
| H3 | Âm làm bắn "sướng" hơn | Phiếu chấm "Bắn" (1–5) có âm và không âm, 5 người, mỗi người thử cả hai | Có âm ≥ không âm + 0,5, và ≥ 4 (ngưỡng phiếu hiện có) | Chỉnh `wpn.arc.*`, `hit.*` trước khi đổi thông số bắn |
| H4 | Không mệt tai | Cài đặt lúc hết phiên; câu hỏi "Âm thanh có làm khó chịu?" (1–5) | ≤ 20% hạ Nhạc hoặc Hiệu ứng dưới 5/10; ≤ 10% tắt tiếng trên PC; điểm khó chịu trung bình ≤ 2 | Hạ các âm lặp nhiều nhất; giảm `maxVoices` còn 12 |
| H5 | Nhạc Stage 1 không nhàm | Câu hỏi sau Stage 1 | ≤ 25% nói "lặp, nhàm" | Kéo vòng lên 48 ô nhịp (96 s, thêm khoảng 0,4 MB) trước khi viết bản mới |

## 9. Quyết định của bản 1 (chờ duyệt)

| # | Vấn đề | Phương án | Chọn | Lý do |
| --- | --- | --- | --- | --- |
| 1 | Nhạc boss ở MVP | (a) 4 bản riêng; (b) 1 bản chung 3 lớp, stinger riêng | (b) | 4 bản là 4 lần soạn và khoảng 4,6 MB; một người làm, ưu tiên P1. Bản riêng từ Alpha; GDD 14 "boss có nhạc riêng" ghi lại thành đích sau MVP |
| 2 | Nhạc theo pha | (a) xếp lớp dọc (stem); (b) đổi đoạn ngang ở ranh ô nhịp | (a) | Pha đổi bất kỳ lúc nào; stem không cần chờ ô nhịp, không cần logic lượng tử hóa; 3 stem nhẹ hơn 3 đoạn riêng có chuyển tiếp |
| 3 | Cách phát nhạc | (a) Web Audio giải mã hết; (b) thẻ `<audio>` phát luồng | (a) | Lặp liền, stem khớp từng mẫu; cái giá là RAM (≤ 64 MB, có phương án giảm ở 5.6) |
| 4 | Cách làm bus | (a) hệ số trong AudioService; (b) GainNode chèn vào Phaser | (a) | Không đụng phần trong của Phaser; cập nhật ≤ 18 kênh rất rẻ |
| 5 | Kiểu cue báo trước | (a) cue ngắn ở đầu báo trước, rồi tiếng ra đòn; (b) tiếng kéo dài đúng bằng báo trước | (a) | Báo trước co theo `speedMul` và độ khó; (b) phải đổi tốc độ phát nên lệch giọng; (a) dạy nhịp "cue → im → ra đòn" |
| 6 | Cảnh báo boss có bus riêng | (a) bus `alert` có thanh riêng, không bị giảm; (b) chung `sfx`, ưu tiên cao | (a) | `Audio.html` đã có thanh riêng; bảo đảm không bao giờ bị giảm hay cắt |
| 7 | Bước chân | (a) có; (b) không ở MVP | (b) | Chạy 5,5 ô/s ≈ 6 bước/s: thêm ồn, ít thông tin |
| 8 | Âm hội thoại | (a) mỗi chữ một tiếng; (b) mỗi câu một âm biểu cảm | (b) | Chữ hiện 40 ký tự/s, mỗi chữ một tiếng rất mệt; GDD 14 chỉ cần "âm biểu cảm ngắn" |
| 9 | "Tắt tiếng khi chuyển tab" (wireframe) | (a) giữ tùy chọn; (b) luôn tạm ngưng khi ẩn trang, không tắt khi chỉ mất focus | (b) | Ẩn trang thì trận đã ngủ, nhạc chạy tiếp là sai; mất focus mà vẫn thấy game thì âm phải theo hình |
| 10 | "Nhạc theo nhịp pha boss" (wireframe) | (a) có công tắc; (b) bỏ ở MVP | (b) | Ít người cần, bớt một nhánh test; xem lại nếu chơi thử có người kêu |
| 11 | Định dạng | ogg + m4a; ogg + mp3; chỉ mp3 | ogg + m4a | mp3 hở chỗ lặp; Safari cần bản dự phòng; m4a lặp theo `loopStartSec` |
| 12 | Âm trong tải đầu | (a) không chặn gì; (b) chặn `sfx-ui` ≤ 30 KB; (c) chặn cả `sfx-core` | (b) | Cú chạm đầu có tiếng; chỉ thêm 0,06 s (còn dư 0,43 s) |
| 13 | Ẩn trang khi đang trong màn | (a) chỉ tạm ngưng âm; (b) mở thêm menu tạm dừng | (b), đã là luật QB-90 | Quay lại không bị đánh ngay; khớp trụ cột "mọi cái chết là lỗi của mình". M12 chỉ làm phần âm; mở menu thuộc Story của QB-90 |
| 14 | iPhone gạt im lặng | (a) tôn trọng; (b) ép phát bằng Audio Session API | (a) | Đúng thói quen người dùng iOS; app iOS làm sau |
| 15 | Mức tổng | −14 / −18 / −24 LUFS | −18 | Nghe trên điện thoại, loa laptop; −14 là mức nhạc stream, không phải mức game |
| 16 | Rung theo cue báo trước | có; không | không | Khoảng 2 s một lần gây mỏi; đã có âm và hình |
| 17 | Chỗ lưu cài đặt âm | (a) khóa riêng `cv.audio`; (b) nhánh `audio` của `cv.settings` | (a) | 14 đã chốt theo (a); AudioService đọc một khóa nhỏ, không phụ thuộc lõi `logic/settings/` của EP-14 nên làm trước được. "Đặt lại cài đặt" của 14 phải xóa cả `cv.audio` |
| 18 | Tùy chọn "chỉ báo âm thanh bằng hình" cho kẻ địch ngoài khung | (a) thêm tùy chọn và dấu "!"; (b) dựa vào QB-23 | (b) | QB-23 chỉ cho kẻ địch báo trước khi đã trên màn, nên không còn cue thiếu hình; bớt một tùy chọn. Dấu "!" làm (P1) chỉ khi QB-23 bị hoãn |

## 10. Rủi ro

| Rủi ro | Dấu hiệu | Cách giảm |
| --- | --- | --- |
| RAM âm trên máy 3 GB | Tab bị nạp lại, giật lúc vào đấu trường | Đo ở ST-12-08; phương án (a), (b) ở 5.6 |
| Safari lặp AAC bị hở | Tiếng "hụt" ở chỗ nối | `loopStartSec`, `loopEndSec`; nghe thử trên Safari |
| Cue khó phân biệt (Rễ Trồi với Rễ Đuổi) | H2 dưới ngưỡng | Quy tắc 6 mục 2.1; làm lại cue bị nhầm trước khi thêm âm mới |
| Quá nhiều âm, mệt tai | H4 dưới ngưỡng | Nút tinh chỉnh 7.5; cắt các dòng (P1) |
| Khối lượng làm âm (khoảng 70 id P0) | ST-12-05 trễ | Dùng alias nhiều hơn; ưu tiên cue báo trước và bắn, nạp, trúng |

## 11. Thay đổi cần lan sang tài liệu khác

| File | Sửa gì |
| --- | --- |
| `01-GDD/01-GDD-chinh.md` | Mục 14: trỏ tới `12-Am-thanh.md`; "boss có nhạc riêng" thành "MVP: một bản boss chung 3 lớp theo pha; nhạc riêng từng boss từ Alpha". Mục 11: "cảnh báo âm thanh cho đòn boss" trỏ bus `alert`; ghi "mọi cue có hình tương ứng" (mục 6.3). Mục 15: thêm dòng âm thanh (chặn tải đầu ≤ 30 KB, âm riêng mỗi màn ≤ 2,5 MB, RAM âm ≤ 64 MB, −18 LUFS). Mục 20: dòng nhật ký thay đổi |
| `01-GDD/02-Dac-ta-Prologue-Stage1.md` | Mục 7, dòng SFX và Nhạc: trỏ mục 2, 3 tài liệu này; "boss Thorna (~140 BPM)" thành bản boss chung 140 BPM. Mục 8: thêm tiêu chí "mọi telegraph có âm báo" |
| `01-GDD/10-He-thong-RPG-Xuong.md` | Mục 6, dòng "Âm thanh (M12)": ghi id `kai.dash.air`, `kai.graze`, `kai.shield.break`, `kai.shield.ready`, `fx.burst`, `hit.punish`, `ui.learn`, `kai.laststand`, `radar.ping` |
| `01-GDD/11-Do-kho.md` | Mục 6: "âm cảnh báo đòn boss (M12, chưa làm)" thành `thorna.stalk.tele`, `thorna.stalk.mark`; đòn nhiều nhịp có tiếng tích theo số nhịp |
| `01-GDD/07-Kich-ban-huong-dan.md` | Mục 8.2: "cảnh báo âm thanh cho đòn boss" là thanh Cảnh báo. P10 có thể đổi thành "Nó sáng lên và rít trước khi khai hỏa" (tùy biên kịch) |
| `01-GDD/08-Giong-nhan-vat.md` | Thêm một dòng âm biểu cảm cho NOVA, Kai, Mira, Thorna, Vex (bảng 2.10) |
| `02-Wireframes/boards/Audio.html` | Thêm thanh Giao diện, công tắc Tắt tiếng, dòng mẹo iOS, dòng Bluetooth; bỏ "Tắt tiếng khi chuyển tab" và "Nhạc theo nhịp pha boss" |
| `02-Wireframes/boards/Access.html` | "Cảnh báo bằng âm thanh cho đòn boss" là công tắc của bus `alert` (cùng trạng thái với thanh Cảnh báo) |
| `02-Wireframes/boards/Pause.html` | Thêm mục "Âm thanh: Bật/Tắt" |
| `03-Data/audio.json` | Tạo mới (mục 7.1) |
| `03-Data/ui.json` | `feedback.small/medium/large.vibrateMs` (0, 20, 35); `feedback.haptics` (`hurtMs` 40, `diedPattern` [60, 40, 60], `chargeFullMs` 12, `maxMsPerSec` 300); mẫu rung tay cầm của 14 đặt cạnh; kiểm tra ở `core/ui-config.ts` |
| `01-GDD/14-Cai-dat-Tiep-can.md` | Mục 3.3, 3.4 (dòng 104): **bỏ** "Chỉ báo âm thanh bằng hình" (không cần nhờ QB-23, quyết định 18); "Âm cảnh báo đòn boss" là công tắc bus `alert`; ghi rõ tab Âm thanh bỏ "Tắt tiếng khi chuyển tab", "Nhạc theo nhịp pha boss", thêm thanh Giao diện và Tắt tiếng. Mục 3: `settings.reset` đặt lại cả `cv.audio`. Mục 12: Story EP-14 gộp bảng Âm thanh của ST-12-07 thành tab và thêm dòng Tiếp cận |
| `01-GDD/13-Do-luong-MVP.md` | `stage_start` thêm `audio` (`master`, `sfx`, `alert`, `muted`) cho H1; `survey_answer` thêm câu `audio_annoy` (1–5) sau lần đầu hạ Thorna cho H4; `settings_change` đã bao các id âm |
| `01-GDD/17-Quy-tac-bien.md` | Thêm nhóm "Âm thanh" (đề xuất mã QB-140…QB-146): gộp âm theo khung khi bù bước; âm loại trừ cùng bước (mục 5.8); hạ boss khi cue đang phát; hồi sinh dừng vòng lặp; trận đứng yên thì tạm dừng `sfx`, `alert`; chưa mở khóa thì bỏ, không xếp hàng; tốc độ game không đổi tốc độ âm. Ghi chú QB-23: cue kẻ địch dựa vào luật này |
| `game/src/logic/world/world-types.ts` và nơi phát (`stage-world.ts`, `logic/player`, `logic/enemy`, `logic/boss`, `logic/combat/loadout.ts`) | Trường mới mục 2.11 |
| `game/src/core/game-events.ts` | `audio:play`, `audio:settings-changed`, `audio:unlocked` |
| `game/src/logic/playtest/` | Ghi cài đặt âm (5 mức, Tắt tiếng) vào phiên chơi thử cục bộ; thêm câu hỏi "Âm thanh có làm khó chịu?" (H1, H4), cùng tên với `13` |
| `game/scripts/gate-check.mjs`, `04-Dev-Plan/05-Cong-Prototype.md` | Đo thêm âm chặn tải đầu và đổi tab (mục 8.2) |
| `game/CONTEXT.md` | Khi code: kiến trúc âm (AudioService, pool, bus là hệ số, MusicDirector), trạng thái M12 |
| `04-Dev-Plan/07-Ban-do-he-thong.md` | Dòng M12: đổi Draft thành "Đủ" sau duyệt; danh mục tên chuẩn thêm nhóm "Âm thanh" (5 bus, quy ước id `nhóm.tên`) |
| `04-Dev-Plan/01-Ke-hoach-lam-viec.md` | Dòng S9 (EP-12): "3 thanh âm lượng" thành "5 thanh (Tổng, Nhạc, Hiệu ứng, Cảnh báo, Giao diện) và Tắt tiếng"; thêm "cue cho mọi báo trước". Mốc Beta chỉ còn M12 đầy đủ (nhạc riêng từng boss, Stage 5–8, Citadel) |
| `04-Dev-Plan/02-Module.md` | Dòng M12: thay "Không giật khi đổi tab" bằng tiêu chí đo được ở mục 8.2 |
| `04-Dev-Plan/stories/EP-12-am-thanh.md` | Tạo Epic theo mục 12 |
| `05-Assets/01-Huong-dan-asset.md` | Mục 9: "khoảng 25 SFX" thành danh sách mục 2 (94 id, 78 có file riêng); quy cách file (mục 5.4); thư mục `audio-src/`; giấy phép `licenses/audio.csv` |
| `05-Assets/manifest.csv` (hoặc `audio-manifest.csv` mới) | Danh sách âm, gói, trạng thái làm |

## 12. Story đề xuất (EP-12)

Quy ước như EP-08 đến EP-10: Story viết gọn trong file Epic, mỗi Story một commit, Story có phần nghe hoặc nhìn thì lưu bằng chứng ở `04-Dev-Plan/qa/<mã Story>/`.

| Mã | Tên | Nội dung | Phụ thuộc | Cỡ |
| --- | --- | --- | --- | --- |
| ST-12-01 | Dữ liệu và kiểm tra | `03-Data/audio.json` (đủ id mục 2, nhạc, bus, giảm nhạc); `core/audio-config.ts` (mục 7.2 trừ phần sprite); danh sách trigger ở `logic/audio/triggers.ts`; test | — | 1 ngày |
| ST-12-02 | Logic trộn | `volume`, `variant-picker`, `voice-limiter`, `ducking`, `charge-hum`, `pitch-ladder`, `land`; test mục 7.3 | 01 | 1,5 ngày |
| ST-12-03 | Sự kiện âm thanh | Trường mới mục 2.11 trong logic; `triggers` đổi `WorldEvents` thành yêu cầu, luật loại trừ, gộp theo khung; test mô phỏng Thorna (bao phủ, mật độ, chênh mức) | 01, 02 | 2 ngày |
| ST-12-04 | AudioService | Nạp gói sprite (Preload, nền, theo màn), pool theo id, bus hệ số, `pan`, mở khóa, ẩn trang (phần âm; mở menu tạm dừng thuộc QB-90), giải phóng gói, lớp debug (kênh, độ trễ, RAM); mục nhanh "Âm thanh: Bật/Tắt" ở menu tạm dừng; nối StageScene, menu Phaser, bảng HTML qua `audio:play` | 02, 03 | 2 ngày |
| ST-12-05 | Âm tạm | Làm bằng jsfxr các id P0 (khoảng 70); đóng sprite, xuất 2 định dạng bằng `scripts/build-audio.mjs`; kiểm marker, độ dài cue; ghi giấy phép | 01 | 2 ngày |
| ST-12-06 | Nhạc | `music-director` (mục 3.3) và test; nối các scene; 6 bản (menu, prologue, stage1, boss 3 stem, win, result) bằng BeepBox; kiểm độ dài vòng | 02, 04 | 2 ngày |
| ST-12-07 | Âm lượng và tiếp cận | Bảng Âm thanh (HTML, ADR-001; 5 thanh, Tắt tiếng, âm mẫu, dòng mẹo iOS và Bluetooth) mở từ Menu chính và mục Tùy chọn của menu tạm dừng; `cv.audio` (`parseAudioSettings`); chớp mất nạp; rung điện thoại (`ui.json → feedback`). EP-14 sau đó chuyển bảng này thành tab Âm thanh và thêm dòng Tiếp cận nối bus `alert` | 04 | 1,5 ngày |
| ST-12-08 | QA | `gate-check` (tải, đổi tab); đo LUFS và đỉnh, RAM, độ trễ trên PC và Pixel 7; nghe thử 3 người (bài nghe H2 bản nhỏ); bằng chứng `04-Dev-Plan/qa/ST-12-08/` | tất cả | 1 ngày |

- **Thứ tự:** 01 → 02 và 05 song song → 03 → 04 → 06 → 07 → 08. Tổng khoảng 13 ngày công.
- **Cắt được nếu thiếu giờ:** các dòng (P1) ở mục 2; `peak` giảm lúc boss choáng; stinger riêng của Thorna; rung điện thoại theo sự kiện (giữ thanh âm lượng và Tắt tiếng).
- **Quan hệ với EP-14 (Cài đặt, `14-Cai-dat-Tiep-can.md`):** EP-12 làm trước (kế hoạch S9, S10) và tự có bảng Âm thanh; EP-14 gộp bảng đó vào màn Cài đặt chung (cây mục, điều hướng, cỡ theo 14 mục 5), không đổi `cv.audio`. Cue kẻ địch luôn có hình nhờ QB-23 (Story ghi ở `17-Quy-tac-bien.md`); nếu QB-23 hoãn thì làm dấu "!" ngoài khung (P1).
- **Hoãn khỏi MVP:** nhạc riêng từng boss; âm Stage 2–4 (theo đặc tả các màn); âm nền môi trường; bước chân; phím tắt Tắt tiếng; Last Stand và radar (bị chặn cùng ST-08-09).
