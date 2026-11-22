# Đặc tả Stage 2–4 (bản nháp): Prism Institute, Cryo Vault, Cirrus Tower

- **Mã hệ thống:** M5 (12 kẻ địch thường, trong đó 6 loại mới; 3 mini-boss), M6 (boss Lumen, Cryo, Aeris), M7 (màn và cơ chế môi trường Stage 2–4), vũ khí Prism Beam, Frost Shard, Gale Cutter.
- **Phân loại:** Gameplay. **Ưu tiên:** MVP (P0).
- **Trạng thái:** **Bản 2, Approved (ủy quyền) 14/11/2026 sau duyệt Creative Director và Technical Director + Producer.** Người dùng giao toàn quyền; Q1–Q15 đã chốt ở mục 11, điểm duyệt và chỗ sửa ở mục 12. Phần `[SAU CỔNG]` vẫn chưa chốt số. Viết theo `04-Dev-Plan/07-Ban-do-he-thong.md` mục 2 dòng 5: cổng Prototype chưa qua nên chỉ viết phần không phụ thuộc cảm giác điều khiển. Cấu trúc theo `02-Dac-ta-Prologue-Stage1.md`, đầu mục theo mẫu `Game_Studio_Agent/templates/gdd-system-template.md`.
- **Vai trò viết:** Level Designer (`level-designer`, `level-design`, `platformer`), Systems/AI lead (`game-ai`), Creative Director giữ trụ cột (`game-designer`).
- **Phụ thuộc (upstream):** GDD chính mục 5.1, 7, 8, 9, 9.1; `11-Do-kho.md`; `10-He-thong-RPG-Xuong.md` mục 2.2–2.3; `03-Dac-ta-Hub-Shop.md` mục 7; `09-Thoai-Warden.md`; `08-Giong-nhan-vat.md`; `03-Data/{stages,bosses,enemies,weapons,player,difficulties,skills}.json`; wireframe `02-Wireframes/boards/Stage2.html`, `Stage3.html`, `Stage4.html`.
- **Bị ảnh hưởng (downstream):** `enemies.json`, `bosses.json`, `weapons.json`, `stages.json`, `skills.json`, `tutorial.json`; EP-15 và EP-17 (Story ở mục 10); ST-08-09 (tab Module, Giáp đang bị chặn vì thiếu nội dung Stage 2–4).

## 0. Ràng buộc cổng Prototype và quy ước

Cổng Prototype (`04-Dev-Plan/05-Cong-Prototype.md`) chưa có đợt người thử nào. Nếu cổng chỉnh độ cao nhảy, tốc độ chạy hay lướt, mọi khe nhảy, độ rộng khe né và bố cục ô sẽ đổi theo. Vì vậy tài liệu dùng hai nhãn:

| Nhãn | Nghĩa | Được làm trước cổng? |
| --- | --- | --- |
| `[PLACEHOLDER]` | Giả thuyết ban đầu, chỉnh sau chơi thử. **Mọi con số trong tài liệu này đều là `[PLACEHOLDER]`**, kể cả khi không ghi nhãn | Có: nạp vào dữ liệu, code và test dùng số này |
| `[SAU CỔNG]` | Phụ thuộc cảm giác điều khiển: khoảng cách và độ cao nhảy, độ rộng khe, độ cao bục, số màn hình mỗi đoạn, bố cục ô, thông số trượt băng và gió | Code cơ chế thì được; **không dựng bản đồ thật và không chốt số** trước khi qua cổng |

**Phần chốt được ngay (không phụ thuộc cảm giác):** chủ đề, nhịp đoạn và mục tiêu dạy, quy tắc cơ chế môi trường, vai trò và hành vi kẻ địch, khái niệm đòn boss, thoại, phần thưởng, Két giáp, tham chiếu nhiệm vụ phụ.

### 0.1 Đơn vị đo (metric) lấy từ `player.json`

Theo `level-design`: kích thước hình học đặt theo metric của nhân vật. Bảng dưới là **cung nhảy lý tưởng** tính từ dữ liệu hiện tại, chỉ để ước lượng; số thật phải đo bằng thang khe trong phòng thử sau cổng (mục 10, ST-17-01).

| Đại lượng | Công thức | Giá trị lý thuyết `[SAU CỔNG]` |
| --- | --- | --- |
| Trọng lực lên `g` | `2 × jump.maxTiles / apexSec²` | 56,25 ô/s² |
| Trọng lực rơi | `g × fallGravityMul` (1,6), kẹp `maxFallTilesPerSec` 15 | 90 ô/s² |
| Thời gian trên không (nhảy cao nhất, cùng độ cao) | lên 0,4 s + xuống 0,383 s | 0,783 s |
| Nhảy xa khi chạy `maxJumpDist` | `speedTilesPerSec × thời gian trên không` | 4,31 ô |
| Nhảy xa khi lướt-nhảy | `(dash.tiles / dash.durationSec) × thời gian trên không` | 9,4 ô |
| Khe đường chính `safeGapTiles` | `0,7 × maxJumpDist` | 3,0 ô |
| Khe chỉ cho phần thưởng tùy chọn `hardGapTiles` | `0,95 × maxJumpDist` | 4,1 ô |

Quy ước đo như Stage 1: 1 ô = 16 px, 1 màn hình = 20 × 12 ô, đấu trường boss 24 × 12 ô (wireframe ghi "Phòng 24 × 12 tile").

### 0.2 Luật chung kế thừa (không đổi)

- Telegraph kẻ địch ≥ `enemies.rules.minTelegraphSec` (0,4 s); boss ≥ `minTelegraphSec` (0,5 s) **sau khi chia `speedMul` của pha 3**, kể cả bản Thử thách (`11-Do-kho.md` mục 2.6).
- Không chết một đòn: đòn mạnh nhất (kẻ địch, boss, môi trường, cả bản Thử thách) × `damageTaken` lớn nhất (1,5) < 100 (máu cấp 1). Game kiểm tra lúc nạp.
- Kẻ địch xuất hiện cách điểm xuất phát/checkpoint ≥ `minSpawnDistanceTiles` (6 ô); chỉ hoạt động trong `activeRangeTiles` (12 ô ngang) và `activeRangeTilesY` (7 ô dọc), chỉ bắt đầu báo trước khi đã ở trong khung camera (`attackRequiresOnScreen`, `17-Quy-tac-bien.md` QB-23; quan trọng cho Stage 4 cuộn dọc); hồi sinh ở checkpoint thì dựng lại, giữ Core Bit và EXP.
- Luật duyệt màn (GDD 8.3): đường chính, Memory Log, bí mật và mục tiêu nhiệm vụ phụ tới được bằng **bộ động tác gốc + Arc Cannon**. Chỉ Két giáp cần vũ khí Warden. Lối chỉ lướt trên không (Phantom P1) mới tới thì thưởng tối đa là Core Bit.
- Vine Lash luôn có (Stage 1 phải xong trước Stage 2–8) nhưng **không dùng để chặn đường chính**: hành vi "kéo thùng, móc dây leo" của Vine Lash chưa có trong `weapons.json` (chỉ có `sweep`).
- Kẻ địch dùng lại (Drone Lính, Bướm Sắt, Lính Kén) giữ nguyên id và nguyên bản Thử thách đã có ở `11-Do-kho.md` mục 2.6.

## 1. Tổng quan ba màn

| Hạng mục | Stage 2: Prism Institute | Stage 3: Cryo Vault | Stage 4: Cirrus Tower |
| --- | --- | --- | --- |
| `id` (`stages.json`) | `prism_institute` | `cryo_vault` | `cirrus_tower` |
| Chủ đề | Viện quang học, bản tin, tín hiệu | Kho lạnh: hạt giống, thuốc, lương thực | Tháp khí tượng, máy gieo mây |
| Thời lượng (người chơi trung bình) | \~11 phút | \~11,5 phút | \~12 phút |
| Mục tiêu học | Tia đi thẳng, bị ô đặc chặn, phản xạ qua gương; canh nhịp laser | Quán tính trên sàn trơn; bục băng vỡ sau 1 s đứng | Bù lực gió ngang; gió đổi hướng có báo trước; bệ mây một chiều, trôi, tan |
| Cơ chế môi trường | Laser luôn bật và theo nhịp; gương 2 góc xoay bằng đạn nạp; cảm biến quang | Sàn trơn; băng vỡ; gai băng (luật gai Stage 1) | Vùng gió cố định và đổi hướng; bệ mây đứng yên, trôi, tan |
| Kẻ địch thường | Gương Quang, Tháp Laser, Bướm Sắt, Lính Kén | Người Tuyết Máy, Tháp Băng, Drone Lính, Lính Kén | Chim Cắt Gió, Cối Xoáy, Bướm Sắt, Lính Kén |
| Mini-boss | Prism Sentinel | Frost Titan | Gale Roc |
| Boss (yếu trước) | Lumen (Vine Lash) | Cryo (Prism Beam) | Aeris (Frost Shard) |
| Vũ khí nhận | Prism Beam | Frost Shard | Gale Cutter |
| Két giáp (cần) | Thân Mk I `body_mk1` (Frost Shard) | Tay Mk I `arm_mk1` (Gale Cutter) | Chân Mk I `leg_mk1` (Quake Drill, Stage 5, Alpha) |
| Memory Log | 2 | 3 | 4 |
| Nhiệm vụ phụ | `sq_prism_institute` Gương rối | `sq_cryo_vault` Băng vỡ | `sq_cirrus_tower` Gió mất hướng |
| Checkpoint (Thường) | 5 (CP1–CP4, CP3b) | 5 | 5 |
| Cấp khuyến nghị (đồng bộ cấp kẹp trong) | 4–7 (2–9) | 5–8 (3–10) | 7–10 (5–12) |
| Core Bit (Thường, `coreBitBase`) | 300 | 375 | 450 |
| EXP của màn (Thường, `expBudget`) | 660 | 1.101 | 1.602 |

Thứ tự chơi Stage 2–8 tự do. Đi theo khuyến nghị (2 → 3 → 4) thì luôn có vũ khí khắc chế ở lần đánh đầu: Vine Lash cho Lumen, Prism Beam cho Cryo, Frost Shard cho Aeris (GDD 7).

### 1.1 Trụ cột và MDA (Creative Director)

| Trụ cột | Cách ba màn phục vụ |
| --- | --- |
| 1. Điều khiển chuẩn xác, tha thứ đúng chỗ | Mỗi cơ chế có vạch báo hiện **đúng đường đi** của mối nguy: vạch ngắm laser vẽ cả đoạn sau gương; vết nứt băng 3 bậc; cờ gió quay 1,0 s trước khi đổi chiều. Bật lùi trên sàn trơn không trượt xa hơn sàn thường (mục 4.3). Lướt không bị gió đẩy |
| 2. Mỗi boss là một món quà | Vũ khí mới vừa là đòn đánh vừa là chìa khóa: Prism Beam phản xạ qua gương và đốt rễ khô Stage 1; Frost Shard đóng băng dòng chất làm mát Stage 2; Gale Cutter thổi tan sương lạnh Stage 3 |
| 4. Câu chuyện đi cùng nhịp chơi | Thoại Warden ≤ 2 câu; chuyện kể qua chi tiết môi trường (tầng "sâu", GDD 3.6), không thêm cutscene |
| 5. Tôn trọng người chơi | Thắng được mọi boss chỉ bằng Arc Cannon; Két giáp Stage 4 hiện rõ "cần Quake Drill" thay vì giấu |

| MDA | Stage 2 | Stage 3 | Stage 4 |
| --- | --- | --- | --- |
| Mechanics | Tia, gương, cảm biến, nhịp | Ma sát thấp, bục có hạn giờ | Lực ngoài ngang, bục một chiều |
| Dynamics | Đọc đường tia trước khi đi; tự đổi góc gương để mở đường hoặc dội tia của Prism Sentinel về chính nó | Lên kế hoạch điểm dừng; không đứng yên trên băng nứt | Đi ngược gió theo nhịp; chọn thời điểm nhảy khi gió đổi |
| Aesthetics | "À, thì ra thế" khi tia đi đúng đường | Căng thẳng có kiểm soát | Tự do, chóng mặt vừa phải |

## 2. Hệ thống dùng chung cho ba màn

### 2.1 Thưởng theo màn

EXP của mỗi màn lấy đúng **`expBudget`** (GDD 10 mục 0, độ khó Thường): mỗi màn +2 cấp, cấp cuối Stage 2 / 3 / 4 là 6 / 8 / 10, nằm trong cấp khuyến nghị của màn kế. Mốc EXP tích lũy theo `40 × L^1,4`, làm tròn từng cấp: cấp 4 tại 332, cấp 6 tại 992, cấp 8 tại 2.093, cấp 10 tại 3.695. Hết MVP có (10 − 1) + 4 boss = 13 SP.

| Sau màn | EXP của màn (`expBudget`) | EXP tích lũy (Thường) | Cấp | Cấp khuyến nghị màn kế |
| --- | --- | --- | --- | --- |
| Stage 1 (gồm Prologue) | 332 | 332 | 4 | Stage 2: 4–7 |
| Stage 2 | 660 | 992 | 6 | Stage 3: 5–8 |
| Stage 3 | 1.101 | 2.093 | 8 | Stage 4: 7–10 |
| Stage 4 | 1.602 | 3.695 | 10 | Stage 5: 8–12 |

Mốc tích lũy trùng đúng ngưỡng cấp: bỏ sót vài kẻ địch thì cuối màn thiếu vài EXP so với cấp mục tiêu; đồng bộ cấp (GDD chính 6.1) bù phần chênh.

Kẻ địch dùng lại giữ dữ liệu Stage 1, nên cần **hệ số thưởng theo màn**, tách EXP và Core Bit (trường mới `stages.json → enemyRewardMul: {exp, coreBit}`, Q2):

```text
thưởng kẻ địch = round(base × stage.enemyRewardMul.exp|coreBit × difficulty.rewardMul) ; base > 0 thì tối thiểu 1
  base                   : exp, coreBit trong enemies.json (bảng Stage 1 cùng bậc)
  enemyRewardMul.exp     : (expBudget − EXP mini-boss − EXP boss) / Σ base EXP kẻ địch đặt trên bản đồ, bước 0,05
                           Stage 1 = 1; Stage 2 = 309 / 172 → 1,8; Stage 3 = 528 / 176 = 3,0; Stage 4 = 768 / 192 = 4,0
  enemyRewardMul.coreBit : Stage 1 = 1; Stage 2 = 1,8; Stage 3 = 1,9; Stage 4 = 2,0 (như bản 1)
                           rương bù phần còn lại của coreBitBase
  Không nhân             : mini-boss, boss (thưởng ghi thẳng trong dữ liệu), rương
  Tính lại cả hai khi chốt bản đồ [SAU CỔNG] vì số kẻ địch đổi theo bố cục.
```

| Màn | Kẻ địch thường (`exp`) | Mini-boss | Boss | Tổng = `expBudget` |
| --- | --- | --- | --- | --- |
| Stage 2 | 309 (× 1,8) | Prism Sentinel 110 | Lumen 241 | 660 |
| Stage 3 | 528 (× 3,0) | Frost Titan 185 | Cryo 388 | 1.101 |
| Stage 4 | 768 (× 4,0) | Gale Roc 270 | Aeris 564 | 1.602 |

- **Cách tính:** EXP kẻ địch làm tròn **từng con** rồi cộng (bảng 3.4, 4.4, 5.4). Stage 2: 172 × 1,8 = 309,6, nhưng làm tròn từng con (11, 18, 14, 25) ra 309, nên tổng khớp đúng 660. Stage 3, 4 không có số lẻ.
- Tỷ lệ gần Stage 1: boss khoảng 35–37%, mini-boss khoảng 17%, kẻ địch thường khoảng 47–48%.
- **Kiểm tra lúc nạp** (`core/`, cho màn đã có bản đồ): Σ EXP Thường của màn (kẻ địch trên bản đồ theo `enemyRewardMul.exp`, cộng mini-boss và boss) = `expBudget` ± 5%. Sai thì dừng ở màn tải như mọi lỗi dữ liệu.

Giá trị biên (Lính Kén, base 14 EXP / 6 Core Bit):

| Kịch bản | Đầu vào (EXP; Core Bit) | EXP / Core Bit | Ghi chú |
| --- | --- | --- | --- |
| Stage 1, Cốt truyện | 14 × 1 × 0,5; 6 × 1 × 0,5 | 7 / 3 | Như hiện nay |
| Stage 2, Thường | 14 × 1,8; 6 × 1,8 | 25 / 11 | |
| Stage 4, Thử thách | 14 × 4,0 × 1,5; 6 × 2,0 × 1,5 | 84 / 18 | Lớn nhất trong MVP; không tràn |

Bậc base của kẻ địch mới lấy theo kẻ địch Stage 1 cùng vai trò: bay nhỏ = Drone Lính (3 máu, 6 EXP, 2 Core Bit) hoặc Bướm Sắt (2 máu, 8, 3); tháp/bộ binh không khiên = Tháp Gai (6 máu, 10, 4).

### 2.2 Boss: máu, sát thương tối đa, kiểm chứng

| Thông số | Thorna (đã có) | Lumen | Cryo | Aeris | Quy tắc |
| --- | --- | --- | --- | --- | --- |
| `hp` (Thường) | 250 | 280 | 300 | 320 | Nhân `enemyHp`: Lumen 224 / 280 / 350; Cryo 240 / 300 / 375; Aeris 256 / 320 / 400 |
| Sát thương đòn lớn nhất `maxAttackDamage` | 18 | 20 | 22 | 24 | `18 + 2 × (n − 1)` với n là số màn (Q5). Thử thách × 1,5: 30 / 33 / 36 < 100 |
| Thưởng lần đầu (Thường) | 120 EXP, 80 Core Bit | 241, 110 | 388, 140 | 564, 160 | EXP theo `expBudget` (mục 2.1). Nhân `rewardMul` theo cặp (boss, độ khó); thêm 1 SP và vũ khí một lần mỗi boss |
| Thời gian thắng mục tiêu | 45–65 s (250 máu, `02` mục 5) | 60–90 s | 60–90 s | 75–105 s | Aeris bay, ít cửa sổ đứng yên hơn |

- **Kiểm chứng HP bằng mô phỏng, không tính tay** (như Thorna, `game/tests/power-cap.test.ts`): bot không né, bắn liên tục, **thua** ở cấp khuyến nghị cao (7 / 8 / 10) kể cả build Core đủ bậc; bot bắn 50–75% thời gian thắng trong khoảng mục tiêu. Ước lượng trước mô phỏng: Lumen 280 máu, cấp 5 (công ×1,08), Arc Cannon 7,5 phát/s, bắn 50–75% thời gian → 46–69 s chưa trừ lúc Lumen dịch chuyển.
- **Không chồng hai đòn ở pha 1.** Mọi đòn dùng ở pha 3 có `telegraphSec ≥ 0,6` để chia 1,2 vẫn ≥ 0,5 s.
- Thoại trước/sau trận lấy từ `03-Data/dialogue_wardens.json` (khóa `boss.<id>.<early|mid|late>.<pre|post>`, `boss.<id>.nova_after`). Trong MVP (4 màn), trước trận Stage 2–4 người chơi đã hạ 1–3 boss nên gặp biến thể **sớm** (0–2) hoặc **giữa** (3); biến thể muộn chỉ có từ Alpha.
- Gợi ý D03 (`07-Kich-ban-huong-dan.md`) khi vào phòng boss đang có vũ khí khắc chế: NOVA: "Lớp vỏ của nó phản ứng lạ với dữ liệu trong {vũ khí}. Thử xem."

### 2.3 Vũ khí Warden: ngân sách năng lượng

Vũ khí Warden dùng cùng **ngân sách sát thương mỗi thanh năng lượng**. `weapons.json` đã có cấu hình cho Vine Lash, Prism Beam, Frost Shard và Gale Cutter. Bộ kiểm cân bằng tính hai lượt trúng cho Gale Cutter từ ST-15-01c. Loadout sẽ cấp vũ khí khi ST-15-05 có hành vi ném và đón lưỡi.

```text
ngân sách = floor(energyMax / energyCostOf28) × damageMul × hitsPerUse        mục tiêu 14 ± 15%
  energyMax = 28 ; vs boss yếu: × damageVsWeak 2,5 (≈ 35 sát thương, 11–12,5% máu boss)
  trúng điểm yếu: choáng weakStunSec 0,5 s, rồi weakStunCooldownSec 1,5 s không choáng lại (QB-14)

sức mạnh khắc chế = damageMul × trúng mỗi lần × damageVsWeak (2,5) / cooldownSec ≥ 12 sát thương/s
  (≈ 1,6 × Arc Cannon 7,5 phát/s); kiểm lúc nạp cho vũ khí có cấu hình hành vi và hồi bắn > 0
```

| Vũ khí | `energyCostOf28` | Số lần / thanh | `damageMul` | Trúng / lần | Ngân sách | Vs boss yếu | `cooldownSec` → sức mạnh khắc chế |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Vine Lash (đã có) | 4 | 7 | 2 | 1 | 14 | 35 (Lumen 280: 12,5%) | 0,35 → 14,3/s |
| Prism Beam | 3 | 9 | 1,5 | 1 mỗi mục tiêu (xuyên) | 13,5 | 33,75 (Cryo 300: 11,3%) | **0,3** → 12,5/s (bản 1: 0,45 → 8,3/s, không đạt) |
| Frost Shard | 4 | 7 | 2 | 1 | 14 | 35 (Aeris 320: 10,9%) | 0,4 → 12,5/s |
| Gale Cutter | 4 | 7 | 1 | 2 (đi và về) | 14 | Terra (Alpha) | Không có `cooldownSec` (`maxOnScreen = 1`, một lượt ≈ 1,1 s → ≈ 4,6/s); kiểm khi làm Terra (Alpha) |

Thời gian hồi bắn 0,3–0,4 s ngắn hơn `weakStunSec` 0,5 s, nên bắn liên tục sẽ khóa choáng boss. Vì vậy `weakStunCooldownSec` (QB-14, ST-15-14) là điều kiện của mọi vũ khí khắc chế.

Giá trị biên: Weapon Mastery tối đa (endgame, ngoài MVP: +30% sát thương, −20% tiêu hao) → Prism Beam floor(28 / 2,4) × 1,95 = 21,5; không ảnh hưởng cốt truyện. Chi tiết hành vi từng vũ khí ở mục 3.7, 4.7, 5.7.

### 2.4 Checkpoint theo độ khó

Theo `11-Do-kho.md` mục 2.4 và QB-111 (khoảng giữa hai điểm hồi sinh: Cốt truyện ≤ 90 s, Thường ≤ 150 s, Thử thách ≤ 270 s chơi liên tục):

- **Thường:** CP1–CP4 (cuối A, cuối B, trước mini-boss, trước cửa boss) và **CP3b ở cửa ra phòng mini-boss** (`difficulties: "story,normal"`), ở cả ba màn. Không có CP3b thì CP3 → CP4 (mini-boss + D) dài 3,0–4,0 phút, vượt 150 s.
- **Thử thách:** bỏ CP1 và CP3b (cả hai `difficulties: "story,normal"`).
- **Cốt truyện:** thêm 1 checkpoint `difficulties: "story"` giữa mỗi đoạn dài > 90 s (sửa theo `11-Do-kho.md` mục 2.4 sau rà soát 14/11/2026): giữa B, C và D ở cả ba màn. Stage 2 thêm CP-S3 giữa D (D dài 2,0 phút).

Ràng buộc kiểm bằng test khi có bản đồ (`stages.json → checkpointMaxGapSec`, QB-111):

```text
khoảng(i) = thời lượng giữa hai điểm hồi sinh liền nhau ở độ khó đó (phút)
Thường ≤ 2,5 :   xuất phát→CP1 ; CP1→CP2 ; CP2→CP3 ; CP3→CP3b ; CP3b→CP4
  Stage 2:       1,5 ; 2,5 ; 2,0 ; 1,0 ; 2,0
  Stage 3:       1,5 ; 2,5 ; 2,0 ; 1,0 ; 2,5
  Stage 4:       1,5 ; 2,5 ; 1,5 ; 1,5 ; 2,5
Thử thách ≤ 4,5 : xuất phát→CP2 ; CP2→CP3 ; CP3→CP4
  Stage 2:       4,0 ; 2,0 ; 3,0 (mini-boss 1,0 + D 2,0)
  Stage 3:       4,0 ; 2,0 ; 3,5
  Stage 4:       4,0 ; 1,5 ; 4,0
```

- Đoạn B (cả ba màn) và D (Stage 3, 4) dài 2,5 phút, chạm đúng trần Thường: chơi thử làm dài hơn thì rút ngắn đoạn, không thêm checkpoint Thường giữa đoạn.
- Thời lượng đoạn là thời gian thiết kế, `[SAU CỔNG]` (Q15). Đợt thử MVP đo **trung vị thời gian thật** giữa hai điểm hồi sinh; khoảng nào vượt trần (Thử thách: 4,5 phút) thì rút ngắn A hoặc B, không thêm CP1 vào Thử thách.

### 2.5 Dùng lại code có sẵn

Hành vi kẻ địch có: `drone`, `turret`, `butterfly`, `shieldCharger`, `golem` (`game/src/logic/enemy/behaviors.ts`). Đòn boss có: `shot`, `charge`, `slam`, `rain`, `thorns`, `lash`, `roots`, `bloom`, `stalk` (`game/src/logic/boss/boss.ts`). Cơ chế màn có: dây leo đu (`Platform` có `dx`, `dy`), phòng khóa, vật chắn `requiresWeapon`, bí mật, gai, hố (`game/src/logic/world/stage-mechanics.ts`).

| Thứ mới | Dùng lại | Phần phải thêm | Cỡ |
| --- | --- | --- | --- |
| Gương Quang | `drone` | `projectile.bounces`, `attack.bankShot`, vạch ngắm | Nhỏ |
| Tháp Laser | nhịp của `turret` | hành vi `laserTurret` dùng `LaserPath` chung | Vừa |
| Người Tuyết Máy | `shieldCharger` với `shieldHits: 0` | Không (chỉ dữ liệu) | Dữ liệu |
| Tháp Băng | `turret` (nhịp, loạt) | kiểu đạn `lob` nhắm theo khoảng cách | Nhỏ |
| Chim Cắt Gió | tuần tra bay của `drone`, lao của `shieldCharger` | hành vi `diver` (lao theo vector chéo) | Vừa |
| Cối Xoáy | nhịp của `turret`, `WindZone` của màn | hành vi `fan` | Vừa |
| Drone Lính, Bướm Sắt, Lính Kén | nguyên id, nguyên bản Thử thách | Không | — |
| Frost Titan | `golem` | `bombs.landShockwave` (bản Thử thách) | Nhỏ |
| Prism Sentinel, Gale Roc | lớp `Boss` (2 pha), Q1 đã chốt | `beam`, `dive`, bộ chuyển để `LockedRoom` đếm được | Vừa |
| Lumen | `shot`, `roots`, `rain` | `beam`, `focus` (= `stalk` đánh dấu tại tâm Kai), dịch chuyển giữa điểm neo | Vừa |
| Cryo | `shot`, `charge`, `slam`, `bloom` | `slam.slickFloorSec`, `shatter` | Vừa |
| Aeris | `shot`, `charge`, `rain` | di chuyển bay, `shot.aim`, `gust`, `twister` (dựa trên sóng đất của `slam`), lực hút | Lớn |
| Laser môi trường, cảm biến | mẫu đóng/mở cửa của `LockedRoom` | `LaserEmitter`, `LaserPath`, `Mirror`, `LightSensor` | Vừa |
| Sàn trơn | — | vận tốc ngang hiện đổi tức thời (`vx = dir × speed`); thêm gia tốc/ma sát theo loại ô | Vừa |
| Băng vỡ, bệ mây tan | — | `CrumblePlatform` chung hai màn | Vừa |
| Bệ mây trôi | `Platform` có `dx`, `dy` (như dây leo) | đường đi hai điểm | Nhỏ |
| Gió | — | `WindZone` (lực ngoài ngang) | Vừa |
| Két Stage 2 | — | `CoolantFlow` (Frost Shard → bậc đứng) | Nhỏ |
| Két Stage 3, Stage 4 | `Barrier` (`requiresWeapon`) | Không | Dữ liệu |
| Đóng băng kẻ địch (Frost Shard) | — | trạng thái vô hiệu `disabledSec` cho mọi hành vi; **dùng chung** với choáng của module Phase Step (`10-He-thong-RPG-Xuong.md` mục 2.2 ghi "cần thêm trạng thái choáng, hiện chưa có") | Vừa |

## 3. Stage 2: Prism Institute

### 3.1 Tổng quan và chủ đề

Viện quang học từng phát bản tin cho cả Nova Prime, nay chìm trong ánh sáng trắng lạnh và tia đỏ. Lumen giữ mọi bản ghi nguyên vẹn. Màn dạy một ý: **ánh sáng đi thẳng, bị chặn bởi vật đặc, đổi hướng ở gương**. Bản dễ theo GDD 8.2: laser theo nhịp cố định, gương chỉ có 2 góc.

**Kể chuyện qua môi trường (tầng sâu, GDD 3.6; chỉ gợi, không xác nhận lật mở):** dãy màn hình phát lặp bản tin của Hale, cùng một giây hình bị nhiễu ở mọi màn hình (gợi "bản tin bị sửa", động cơ của Lumen); phòng điều khiển có một van nước khóa, biển "Khu 9 — tạm ngưng theo lệnh".

### 3.2 Nhịp đoạn

| Đoạn | Thời lượng / độ dài | Dạy gì | Kẻ địch | Cơ chế mới | Cường độ (0–1) | Checkpoint |
| --- | --- | --- | --- | --- | --- | --- |
| **A. Lối vào** | \~1,5 phút / 6 màn hình `[SAU CỔNG]` | Tia bị khối đặc chặn: nấp sau khối để qua tháp laser; laser luôn bật là "tường sáng" không đi xuyên. Sàn an toàn, không hố chết | Gương Quang ×2, Bướm Sắt ×2 | Laser luôn bật, khối chắn | 0,3 | CP1 cuối đoạn |
| **B. Phòng gương** | \~2,5 phút / 10 màn hình | Đổi góc gương bằng đạn nạp vừa để đưa tia vào cảm biến mở cửa; mỗi câu đố ≤ 2 gương, cả đường tia nằm gọn 1 màn hình | Tháp Laser ×3, Gương Quang ×2, Bướm Sắt ×1 | Gương 2 góc, cảm biến quang | 0,5 | CP2 cuối đoạn |
| **C. Phòng khóa** | \~3 phút (2 phút + mini-boss 1 phút) / 8 màn hình | Chiến đấu trong phòng có laser theo nhịp; mini-boss kiểm tra việc đọc tia phản xạ | Lính Kén ×2, Gương Quang ×2, Tháp Laser ×1, Prism Sentinel | Laser theo nhịp | 0,7 (mini-boss 0,8) | CP3 trước mini-boss; CP3b ở cửa ra phòng mini-boss |
| **D. Hành lang tổng hợp** | \~2 phút / 7 màn hình | Gương xoay + laser theo nhịp + kẻ địch; câu đố ≤ 3 gương | Gương Quang ×2, Tháp Laser ×1, Bướm Sắt ×1, Lính Kén ×1 | Không có cơ chế mới | 0,6 | CP4 trước cửa boss |
| **Phòng boss** | \~2 phút / 24 × 12 ô | Lumen | Lumen | Không | 1,0 | Hồi sinh trong phòng boss, kẻ địch phụ không hồi |

Sau mỗi checkpoint có một khoảng nghỉ 10–15 s không kẻ địch (cường độ ≤ 0,2), như mẫu `level-design` (răng cưa, không phẳng).

### 3.3 Cơ chế môi trường

**Đường tia (`LaserPath`, dùng chung cho laser môi trường, Tháp Laser, Prism Sentinel, Lumen và Prism Beam):** tia đi thẳng từ nguồn tới ô đặc, vật chắn hoặc mép bản đồ đầu tiên; gặp gương thì quay 90° theo góc gương; tối đa `maxBounces` lần phản xạ, quá thì tia dừng. Vạch báo trước và hộp sát thương tính từ **cùng một** đường tia trong cùng bước logic.

| Cơ chế | Quy tắc | Tham số (dữ liệu `stages.json → mechanics`) |
| --- | --- | --- |
| Laser luôn bật | Không bao giờ là lối bắt buộc phải đi xuyên. Dùng làm tường sáng hoặc nguồn cho câu đố gương | `laser.damage = 20`, `laser.beamWidthPx = 4`, `laser.knockbackTilesPerSec = 5` |
| Laser theo nhịp | Chu kỳ `periodSec`, bật `onSec`; trước khi bật, vạch mảnh 1 px nhấp nháy `warnSec`. `phase` (0–1) ghi trên bản đồ để so le nhiều nguồn | `laser.pulse.periodSec = 3,0`, `onSec = 1,2`, `warnSec = 0,5` (cửa sổ qua = 1,3 s, độ rộng tia cần qua `[SAU CỔNG]`) |
| Trúng laser | Mất `laser.damage` × `damageTaken`, bất tử 1,0 s như bị đánh. **Tia theo nhịp:** bật lùi vuông góc ra khỏi tia, mỗi lần bật trúng mỗi mục tiêu tối đa 1 lần (`laser.hitsPerActivation = 1`). **Tia luôn bật:** xử lý như gai, đưa về ô an toàn gần nhất (Kai không thể bị kẹt trong tia) | Thường 20, Thử thách 30, Cốt truyện 10 |
| Laser và kẻ địch | Laser môi trường **không** gây sát thương kẻ địch (Q6, cho đơn giản ở MVP); tia đi xuyên kẻ địch như không có | `laser.hurtsEnemies = false` |
| Gương | 2 góc (45° "/", 135° "\"), phản xạ cả hai mặt. **Đổi góc bằng đạn nạp vừa trở lên** của Kai (giữ bắn ≥ 0,5 s); đạn thường bị gương hấp thụ, không đổi góc, để tự bắn trên cảm ứng không xoay nhầm. Prism Beam phản xạ, không đổi góc | `mirror.toggleMinCharge = "mid"`, `mirror.rotateSec = 0,25`, `mirror.maxBounces = 4` |
| Vị trí gương | Đặt ở độ cao Kai bắn tới được khi đứng hoặc nhảy (Arc Cannon bắn ngang) | `[SAU CỔNG]` |
| Cảm biến quang | Nhận tia liên tục `holdSec` thì mở cửa liên kết **vĩnh viễn trong lượt chơi** (không đóng lại, tránh kẹt). Hồi sinh ở checkpoint: gương về góc ban đầu, cửa đã mở vẫn mở | `sensor.holdSec = 0,3` |
| Độ khó câu đố | Đường chính: B ≤ 2 gương, D ≤ 3 gương; không câu nào cần canh thời gian ngắn hơn `onSec`. Câu đố > 3 gương chỉ cho Core Bit | |

Tương tác hệ thống: laser môi trường là **mối nguy môi trường** (như gai): khiên C3 không chặn, không được tính "sượt đạn" của P3. Tia của Tháp Laser là **đòn kẻ địch**: khiên C3 chặn được.

### 3.4 Kẻ địch thường

HP tính bằng phát Arc Cannon gốc; sát thương tính bằng máu (100 ở cấp 1). EXP và Core Bit ghi base (bậc Stage 1) và giá trị Thường sau `enemyRewardMul = {exp: 1,8, coreBit: 1,8}`.

| Kẻ địch (`id`) | Vai trò | HP | Sát thương | Hành vi | Telegraph | EXP base → Thường | Core Bit base → Thường | Bản Thử thách |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Gương Quang (`guong_quang`) | Bay, dạy phản xạ | 3 | 8 | `drone`: bay tuần 2 ô/s, tầm 7 ô, hồi 1,8 s; đạn sáng 7 ô/s nảy tường `bounces = 1`. Bị khối che thì bắn dội trần (nhắm ảnh gương của Kai qua mặt trần gần nhất, `bankShot = true`) | Mặt gương lóe 0,5 s, vạch ngắm vẽ cả điểm nảy | 6 → 11 | 2 → 4 | **Song Tia:** bắn cùng lúc 1 viên thẳng và 1 viên dội trần; vạch ngắm hiện cả hai đường trong 0,5 s. Nấp sau khối không còn đủ |
| Tháp Laser (`thap_laser`) | Tháp, dạy canh nhịp | 6 | 10 | `laserTurret`: hướng đặt trên bản đồ (trái/phải/lên/xuống), chu kỳ 2,4 s, tia bật 0,5 s, phản xạ qua gương (`maxBounces = 2`) | Vạch đỏ mảnh dọc cả đường tia 0,6 s | 10 → 18 | 4 → 7 | **Nhịp Kép:** 2 xung cách `pulseGapSec = 0,35` s (2 chấm báo nhịp); bước lại vào làn ngay sau xung 1 thì trúng xung 2 |
| Bướm Sắt (`buom_sat`) | Bay, buộc nhìn lên | 2 | 6 | Như Stage 1 | Phình 0,5 s | 8 → 14 | 3 → 5 | Thả kép (đã có) |
| Lính Kén (`linh_ken`) | Tinh nhuệ có khiên | 8 | 12 | Như Stage 1 | Khiên sáng 0,5 s | 14 → 25 | 6 → 11 | Lao nối (đã có) |

Tổng: 20 kẻ địch thường (Gương Quang 8, Tháp Laser 5, Bướm Sắt 4, Lính Kén 3) → 309 EXP, 120 Core Bit ở Thường `[SAU CỔNG]` (số lượng theo bố cục).

### 3.5 Mini-boss: Prism Sentinel (`prism_sentinel`)

Lăng kính hộ vệ lơ lửng cao 3 ô `[SAU CỔNG]` trong phòng khóa 20 × 12 ô có 2 gương tường cố định. Đi ngang 0,8 ô/s, giữ cách 5 ô.

| Thông số | Giá trị |
| --- | --- |
| HP | 70 (Cốt truyện 56, Thử thách 87,5) |
| Va chạm | 12 |
| Thưởng | 110 EXP, 40 Core Bit (không nhân `enemyRewardMul`) |
| Pha 2 | Máu ≤ 50% |

| Pha | Đòn | Telegraph | Sát thương | Cách né |
| --- | --- | --- | --- | --- |
| 1 | **Tán Sắc:** 3 tia sáng xòe 30°, 7 ô/s | Lăng kính quay, chuyển trắng 0,7 s | 10 | Nhảy qua hoặc lướt |
| 1 | **Lao Lăng Kính:** lao ngang ở độ cao lơ lửng, 9 ô/s | Viền sáng, lùi lại 0,7 s | 15 | Đứng sàn (dưới làn lao); trên bục thì nhảy xuống |
| 2 | Giữ Tán Sắc, thêm **Tia Phản Xạ:** tia vào một gương tường, dội xuống chéo phòng; tồn tại 0,5 s, `maxBounces = 1` | Vạch mảnh vẽ cả đường 0,8 s | 15 | Đứng ngoài vạch |
| 2 | **Cơ hội phản đòn:** trong lúc báo trước Tia Phản Xạ, Kai đổi góc gương (đạn nạp vừa) làm tia dội về Sentinel: Sentinel mất `selfHitDamage = 10` và choáng `selfHitStunSec = 1,5` | Vạch cập nhật ngay khi gương xoay | — | Không bắt buộc để thắng; đây là bài kiểm tra kiến thức đoạn B |

**Bản Thử thách — Tia Kép:** Tia Phản Xạ bắn 2 lần cách 0,4 s; lần 2 đi theo góc gương còn lại. Cả hai đường hiện trong lúc báo trước (đường 2 màu tím). Đổi gương thì hai đường đổi chỗ cho nhau.

### 3.6 Boss: Lumen (`lumen`)

**Chủ đề:** Warden của Ánh sáng và Tín hiệu, một khối lăng kính lơ lửng có lõi mắt. Đấu trường 24 × 12 ô, 2 bục cao 3 ô `[SAU CỔNG]`, 4 gương cố định ở tường và trần (2 góc). Lumen không đi bộ: sau mỗi đòn **dịch chuyển** giữa 3 điểm neo (trái cao, giữa thấp, phải cao), điểm đến lóe sáng 0,3 s trước (không gây sát thương). Trong pha hồi `recoverSec`, Lumen ở điểm neo có độ cao Vine Lash với tới được từ sàn hoặc bục `[SAU CỔNG]`.

| Thông số | Giá trị |
| --- | --- |
| HP | 280 (mục 2.2) |
| Va chạm | 10 |
| `idleSec` | 0,9 |
| Điểm yếu | **Vine Lash:** 2,5× sát thương, choáng 0,5 s ("dây leo che gương") |
| Thắng chỉ bằng Arc Cannon | Có, 60–90 s |
| Phần thưởng | Prism Beam, 241 EXP, 110 Core Bit, 1 SP |

| Pha | Ngưỡng | Đòn (`id`) | Dùng lại | Telegraph | Sát thương | Cách né |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 100–60% | **Chớp Tín Hiệu** (`shot`): 3 viên, cách 0,35 s, 9 ô/s, ngang tầm Kai lúc báo trước | `shot` | Lăng kính sáng trắng 0,6 s | 12 | Nhảy qua, lướt |
| 1 | 100–60% | **Tia Phản Xạ** (`beam`, mới): tia vào một gương đấu trường, dội qua phía Kai; đường cố định từ lúc bắt đầu báo trước (không bám), dày 6 px, tồn tại 0,5 s, `maxBounces = 1` | `LaserPath` | Vạch mảnh vẽ cả đường 0,8 s | 18 | Đứng ngoài vạch |
| 2 | 60–30% | Giữ hai đòn trên, thêm **Cột Sáng** (`roots`): 3 cột sáng cao kín đấu trường, lần lượt trái sang phải, cách 3 ô, mỗi cột 0,4 s | `roots`, `sizePx.h` = chiều cao đấu trường | Vệt sáng trên sàn 0,7 s | 15 | Đứng giữa hai cột (khe giữa cột `[SAU CỔNG]`) |
| 3 | Dưới 30% | Tốc độ +20% (`speedMul = 1,2`); Tia Phản Xạ `maxBounces = 2`; thêm **Quang Phổ Toàn Phần** (`rain`, đòn đỉnh): tia rơi từ lăng kính trên trần, chừa 3 khe rộng 2 ô, rồi Lumen quá nhiệt choáng 2 s | `rain` | Lăng kính trần sáng dần 1,0 s, khe an toàn hiện vệt tối | 20 | Vào khe; sau đòn là cửa sổ tấn công 2 s |

Danh sách pha: pha 1 `shot, beam`; pha 2 `shot, beam, roots`; pha 3 `beam, roots, shot, rain`. Telegraph pha 3: 0,5 / 0,67 / 0,58 / 0,83 s ≥ 0,5 s.

**Đòn Thử thách thêm — Tiêu Điểm** (`focus`, mới; logic của `stalk` với `markAt: "player"`, đánh dấu tại tâm Kai, kể cả khi đang nhảy):

| Thông số | Giá trị | Ghi chú |
| --- | --- | --- |
| Báo trước toàn đòn | 0,7 s | Lumen giơ lăng kính, sáng **tím** (khác trắng của Chớp Tín Hiệu) |
| Số vòng | 3 | Vòng kế bắt đầu bám khi vòng trước khóa (`markIntervalSec = 0,6`) |
| Bám | Vòng sáng bám tâm Kai `trackSec = 0,9` | |
| Khóa tới khi cháy | `lockSec = 0,6`; pha 3 = max(0,5; 0,6 / 1,2) = 0,5 s (suy ra) | Vòng chuyển trắng đặc; bộ kiểm telegraph kiểm trường này |
| Vùng cháy | Bán kính 1 ô, tồn tại 0,3 s | |
| Sát thương | 15 | |
| Hồi sau đòn | 0,9 s | |

Pha 2 Thử thách: `shot, beam, focus, roots`. Pha 3 Thử thách: `beam, focus, roots, shot, rain`. Người chơi phải làm khác: không đứng yên trong bất kỳ khe nào quá 0,9 s; đứng trên bục cũng bị bám.

**Quy tắc thiết kế:** không đòn nào quá 20; luôn có khe né; chết thì hồi sinh trong phòng boss sau 1 s, máu đầy. Đòn đỉnh Quang Phổ Toàn Phần thêm vào `skills.json → rules.shieldPierceKinds` (lý do như Hoa Nở: khiên chặn được thì đòn đỉnh mất tác dụng).

**Thoại** (`09-Thoai-Warden.md`, không sửa ở đây): biến thể sớm, trước trận `boss.lumen.early.pre`: "Ta thấy ngươi từ lúc ngươi bước vào. Mọi tấm gương ở đây đều là mắt của ta." Sau trận `boss.lumen.early.post`: "Ngươi che được gương... nhưng không che được thứ chúng đã ghi lại. Hãy hỏi xem ai đã sửa bản tin." Biến thể giữa dùng khi đã hạ 3 boss. NOVA sau khi nhận vũ khí (`boss.lumen.nova_after`): "Viện Quang học... ngày xưa nơi này sáng hơn. Ý tôi là, theo tài liệu."

### 3.7 Vũ khí nhận: Prism Beam

| Mục | Đề xuất `[PLACEHOLDER]` |
| --- | --- |
| `behavior.type` | `beam` (mới): tia tức thời đi theo `LaserPath` |
| Thông số | `rangeTiles = 12` (tổng chiều dài kể cả đoạn sau gương), `widthPx = 4`, `activeSec = 0,12`, `cooldownSec = 0,3`, `damageMul = 1,5`, xuyên mọi kẻ địch trên đường (mỗi mục tiêu trúng 1 lần mỗi tia), `maxBounces = 3` |
| Gặp khiên | Trúng mặt trước khiên Lính Kén thì tia **dừng** ở khiên, tính 1 lần `shieldHits`, không xuyên (QB-16, QB-18). Trúng từ sau lưng thì xuyên như thường |
| Năng lượng | `energyCostOf28 = 3` (9 lần mỗi thanh) |
| Điểm yếu | Cryo (`damageVsWeak = 2,5`, `weakStunSec = 0,5`): "tia sáng nung chảy băng". Sức mạnh khắc chế 1,5 × 1 × 2,5 / 0,3 = 12,5/s ≥ 12 (mục 2.3). Hồi bắn 0,3 s ngắn hơn `weakStunSec`, nên cần `weakStunCooldownSec` (QB-14) |
| Khám phá | Đốt rễ khô chắn Két giáp Stage 1 (`Barrier` cần nhận tia, không chỉ đạn); dội qua gương Stage 2 vào cảm biến đặt ngoài tầm Arc Cannon (lối tắt Core Bit khi quay lại). Một xung Prism Beam kích hoạt cảm biến ngay. Nguồn laser môi trường chiếu đủ `sensor.holdSec` mới kích hoạt |
| Không làm | Không đổi góc gương; tia không gây sát thương cho Kai khi dội về |

### 3.8 Két giáp, bí mật, nhiệm vụ phụ

| Mục | Vị trí | Cách mở |
| --- | --- | --- |
| Két giáp: Thân Mk I (`body_mk1`, `damageTakenMul = 0,85`) | Phòng máy làm lạnh, đoạn D | Cần **Frost Shard** (Stage 3): bắn vào dòng chất làm mát chảy dọc (`CoolantFlow`, không có va chạm, vô hại) thì đông thành 3 bậc đứng được (`coolant.frozenSteps = 3`) trong lượt chơi đó. Chưa có Frost Shard: biểu tượng khóa trên két, gợi ý D02 |
| Memory Log 2 | Nhánh phụ đoạn B | Câu đố 2 gương phụ, chỉ cần Arc Cannon |
| Rương Core Bit (+30, tính trong 30 Core Bit rương của màn) | Đoạn A | Lướt qua khe laser theo nhịp |
| Nhiệm vụ phụ "Gương rối" (`sq_prism_institute`) | 6 **Gương Rối** (`questTarget`, `hp = 2`): **A 1, B 2, C 2, D 1**, không gương nào trong phòng mini-boss; tím, nứt, không xoay được, **không nằm trên đường tia của câu đố** | Chỉ tham chiếu `15-Nhiem-vu-phu.md` (bản 2, Approved, mục 2–3): phá 6 gương bằng bộ động tác gốc + Arc Cannon → 1 Data Chip + module Last Stand; đếm tích lũy theo id gương đã phá, lưu như bí mật |

### 3.9 Checkpoint theo độ khó

| Checkpoint | Vị trí | Cốt truyện | Thường | Thử thách | Thuộc tính `difficulties` |
| --- | --- | --- | --- | --- | --- |
| CP1 | Cuối A | Có | Có | Không | `"story,normal"` |
| CP-S1 | Giữa B (\~1,2 phút) | Có | Không | Không | `"story"` |
| CP2 | Cuối B | Có | Có | Có | (không ghi) |
| CP-S2 | Giữa C, trước phòng khóa 1 (\~1 phút) | Có | Không | Không | `"story"` |
| CP3 | Trước mini-boss | Có | Có | Có | (không ghi) |
| CP3b | Cửa ra phòng mini-boss | Có | Có | Không | `"story,normal"` |
| CP-S3 | Giữa D (\~1 phút) | Có | Không | Không | `"story"` |
| CP4 | Trước cửa boss | Có | Có | Có | (không ghi) |

### 3.10 Lời NOVA dạy cơ chế (nháp, vào `tutorial.json` sau cổng)

Giọng NOVA (`08-Giong-nhan-vat.md`): thuật ngữ hệ thống trộn đùa, ≤ 2 dòng, không "nhấn nút X", không ghi con số có thể đổi.

| Tín hiệu (mới) | Lời |
| --- | --- |
| `laser` (lần đầu thấy tia luôn bật) | NOVA: "Tia này cắt được thép. Khối đặc thì nó chịu thua, nên cậu cứ nấp sau khối." |
| `mirror` (lần đầu tới gần gương) | NOVA: "Gương xoay được. Giữ `{BẮN}` cho đạn nạp một chút rồi bắn vào nó, tia sẽ đổi đường." |
| `laserPulse` | NOVA: "Laser ở đây chạy theo nhịp. Vạch mảnh hiện lên nghĩa là nó sắp bắn thật." |

### 3.11 Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| Kai đứng trong làn tia theo nhịp đúng lúc tia bật | Trúng một lần trong lần bật đó (`hitsPerActivation = 1`), bật lùi vuông góc ra khỏi tia, bất tử 1,0 s; không trúng lại dù tia còn bật 0,2 s sau khi hết bất tử |
| Hai đạn nạp trúng gương cùng bước | Đổi góc một lần; gương bỏ qua đạn trong lúc xoay `rotateSec` |
| Gương xoay khi tia đang bật | Đường tia tính lại ở bước logic kế; cảm biến đang giữ thì đếm lại từ 0 |
| Tia dội về chính nguồn | Dừng tại nguồn, không gây sát thương cho nguồn |
| Vòng phản xạ khép kín | Dừng ở `maxBounces` |
| Kai đổi gương làm tia chắn lối duy nhất | Không xảy ra trên đường chính: tia chắn lối luôn là loại theo nhịp (bật ≤ 40% chu kỳ); test đồ thị đường chính chạy với mọi tổ hợp góc gương |
| Đạn Gương Quang gặp gương | Coi gương như tường: nảy theo `bounces`, không đổi góc gương |
| Phá Gương Rối trước khi nhận nhiệm vụ | Theo `15-Nhiem-vu-phu.md` (không xử lý ở đây) |
| Prism Beam xuyên trúng Gương Rối | Gương nhận đòn như mọi đạn trực tiếp; tia không dội khỏi Gương Rối (không phải gương câu đố) |
| Người chơi tới Stage 2 trước khi có Frost Shard | Két khóa, gợi ý D02 một lần; radar Đầu Mk I (nếu có) hiện "cần Frost Shard" |

### 3.12 Tiêu chí nghiệm thu

- [x] `LaserPath`: vạch báo trước và hộp sát thương dùng chung đường tia (kiểm 0, 1, 2, 4 lần phản xạ, ô đặc, vật chắn, vòng khép kín).
- [x] Laser theo nhịp báo trước đủ 0,5 s, kể cả xung đầu với `phase` lệch.
- [ ] Laser luôn bật không chặn đường chính (kiểm đồ thị bản đồ trong ST-17-02).
- [x] Gương chỉ đổi góc bằng đạn nạp vừa trở lên; tự bắn trên cảm ứng không xoay gương.
- [x] Cảm biến mở cửa sau 0,3 s nhận tia, cửa không đóng lại; hồi sinh trả gương về góc đầu.
- [ ] 4 kẻ địch thường và bản Thử thách chạy đúng; telegraph ≥ 0,4 s; vạch ngắm Gương Quang vẽ đúng điểm nảy.
- [ ] Prism Sentinel đổi pha ở 50%; phản đòn bằng gương gây 10 và choáng 1,5 s.
- [ ] Lumen đổi pha ở 60% và 30%; Vine Lash 2,5× và choáng 0,5 s; bot không né thua ở cấp 7; Tiêu Điểm khóa ≥ 0,5 s ở pha 3.
- [ ] Nhận Prism Beam; Prism Beam đốt rễ khô Két Stage 1; Két Thân Mk I chỉ mở khi có Frost Shard.
- [ ] Checkpoint đúng bảng 3.9 ở cả ba độ khó.

## 4. Stage 3: Cryo Vault

### 4.1 Tổng quan và chủ đề

Trạm lạnh chứa hạt giống, thuốc và lương thực dự trữ của thành phố, phủ băng xanh nhạt, hơi lạnh mờ. Cryo đóng băng mọi thứ "trước khi bị tắt". Màn dạy: **không dừng được ngay trên băng, và băng không chịu được lâu**.

**Kể chuyện qua môi trường:** kệ thuốc dán nhãn "Phân phối: khu ngoại ô — TẠM GIỮ"; đồng hồ đếm ngày bảo quản dừng ở cùng một ngày trên mọi kệ; ống nước dẫn ra ngoại ô đông cứng tại một van khóa.

### 4.2 Nhịp đoạn

| Đoạn | Thời lượng / độ dài | Dạy gì | Kẻ địch | Cơ chế mới | Cường độ | Checkpoint |
| --- | --- | --- | --- | --- | --- | --- |
| **A. Lối vào** | \~1,5 phút / 6 màn hình `[SAU CỔNG]` | Sàn trơn: tăng tốc và dừng chậm; nhảy từ băng giữ đà ngang. Hố chỉ sâu 1 tầng có sàn đỡ, không hố chết | Người Tuyết Máy ×2, Drone Lính ×2 | Sàn trơn | 0,3 | CP1 cuối đoạn |
| **B. Kho đông** | \~2,5 phút / 9 màn hình | Băng vỡ sau 1 s đứng: chuỗi bục không được dừng; gai băng dưới chuỗi bục | Tháp Băng ×2, Drone Lính ×2, Người Tuyết Máy ×1 | Băng vỡ, gai băng | 0,5 | CP2 cuối đoạn |
| **C. Phòng khóa** | \~3 phút (2 + mini-boss 1) / 8 màn hình | Mở đầu bằng đoạn trượt (đoạn thử nhiệm vụ "Băng vỡ", ngay sau CP2); rồi chiến đấu trên nền trơn một phần | Lính Kén ×2, Người Tuyết Máy ×1, Tháp Băng ×1, Frost Titan | Không | 0,7 (0,8) | CP3 trước mini-boss; CP3b ở cửa ra phòng mini-boss |
| **D. Đường trượt** | \~2,5 phút / 9 màn hình | Trơn + băng vỡ + lướt | Người Tuyết Máy ×1, Tháp Băng ×1, Drone Lính ×1, Lính Kén ×2 | Không có cơ chế mới | 0,6 | CP4 trước cửa boss |
| **Phòng boss** | \~2 phút / 24 × 12 ô | Cryo | Cryo | Không | 1,0 | Trong phòng boss |

### 4.3 Cơ chế môi trường

| Cơ chế | Quy tắc | Tham số (`stages.json → mechanics`) |
| --- | --- | --- |
| Sàn trơn (ô `ice`) | Khi đứng trên ô băng, vận tốc ngang tiến dần tới `dir × speedTilesPerSec` với gia tốc `iceAccel`, nhả nút thì giảm với `iceDecel` (quãng dừng từ tốc độ tối đa = 5,5² / (2 × 6) = 2,5 ô). Trên không giữ đà ngang lúc rời băng. Lướt giữ tốc độ lướt như thường; hết lướt thì trượt tiếp theo `iceDecel` | `ice.accelTilesPerSec2 = 12`, `ice.decelTilesPerSec2 = 6` `[SAU CỔNG]` |
| Bị đánh trên băng | Bật lùi và quãng trượt sau bật lùi **bằng sàn thường** (`ice.hurtUsesNormalFriction = true`): không trượt xuống hố vì bị đánh | |
| Nhảy tường | Tường băng bám như tường thường | |
| Băng vỡ (`CrumblePlatform`, `mode: "break"`) | Bắt đầu đếm khi Kai đứng lên lần đầu, **không dừng** khi Kai rời đi (không lách bằng nhảy nhấp nhô). Vết nứt 3 bậc tại 0 / 0,4 / 0,7 s, rung 0,3 s cuối rồi vỡ, rơi. Mọc lại sau `respawnSec` khi không có gì đè lên. Kẻ địch không kích hoạt | `crumble.triggerSec = 1,0` (wireframe: "sau khi đứng 1 giây"), `crumble.warnAtSec = [0,4; 0,7]`, `crumble.respawnSec = 4` |
| Gai băng | Luật gai Stage 1 (30 sát thương, về ô an toàn, bất tử 1 s; Spike Guard miễn nhiễm) | `mechanics.spikes` (có sẵn) |
| Hồi sinh ở checkpoint | Mọi bục băng vỡ dựng lại | |

### 4.4 Kẻ địch thường

`enemyRewardMul = {exp: 3,0, coreBit: 1,9}`.

| Kẻ địch (`id`) | Vai trò | HP | Sát thương | Hành vi | Telegraph | EXP base → Thường | Core Bit base → Thường | Bản Thử thách |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Người Tuyết Máy (`nguoi_tuyet_may`) | Bộ binh, dạy nhảy qua khi không dừng được | 6 | 12 | `shieldCharger` với `shieldHits = 0`: tuần 0,8 ô/s, thấy Kai cùng tầng trong 6 ô thì **trượt bụng** 5 ô với 8 ô/s, hồi 1,2 s, không trượt khỏi mép | Co người, phả hơi 0,5 s | 10 → 30 | 4 → 8 | **Trượt Dội:** `chainDashes = 2`, báo trước mỗi lần dội 0,45 s (3 chấm báo nhịp) |
| Tháp Băng (`thap_bang`) | Tháp, dạy đứng ngoài điểm rơi | 6 | 10 | `turret` (chu kỳ 2,6 s, 2 mảnh) với đạn `lob`: bắn chếch lên 50°, rơi theo trọng lực 20 ô/s², **nhắm theo khoảng cách** để mảnh 1 rơi đúng chỗ Kai lúc hết báo trước, mảnh 2 xa hơn 2 ô; tầm tối đa 9 ô. Mảnh vỡ khi chạm sàn | Tháp đóng băng, sáng xanh 0,6 s; vệt đổ bóng ở 2 điểm rơi | 10 → 30 | 4 → 8 | **Loạt Nhắm Lại:** `volleys = 2`, `volleyGapSec = 0,4`; loạt 2 nhắm lại chỗ Kai mới (trường có sẵn) |
| Drone Lính (`drone_linh`) | Bay, bắn nhắm | 3 | 8 | Như Stage 1 | 0,4 s | 6 → 18 | 2 → 4 | Bắn đôi (đã có) |
| Lính Kén (`linh_ken`) | Tinh nhuệ có khiên | 8 | 12 | Như Stage 1; lao trên băng giữ 3 ô (kẻ địch không bị sàn trơn) | 0,5 s | 14 → 42 | 6 → 11 | Lao nối (đã có) |

Tổng: 18 kẻ địch (Người Tuyết Máy 5, Tháp Băng 4, Drone Lính 5, Lính Kén 4) → 528 EXP (150 + 120 + 90 + 168), 136 Core Bit `[SAU CỔNG]`.

Lưu ý thiết kế: Người Tuyết Máy và Lính Kén cùng nền `shieldCharger` nên đặt ở hai độ cao hoặc hai phòng khác nhau trong đoạn C và D để người chơi phân biệt được bằng hình dáng và khiên, không chỉ bằng màu.

### 4.5 Mini-boss: Frost Titan (`frost_titan`)

Người khổng lồ băng, hành vi `golem` (dùng lại toàn bộ: giậm đất → sóng, tảng ném, lao). Phòng khóa 20 × 12 ô, 10 ô giữa là sàn trơn `[SAU CỔNG]`.

| Thông số | Giá trị |
| --- | --- |
| HP | 80 (Cốt truyện 64, Thử thách 100) |
| Va chạm | 12; đi 0,7 ô/s; hồi giữa đòn 1,4 s |
| Thưởng | 185 EXP, 50 Core Bit (không nhân `enemyRewardMul`) |
| Pha 2 | Máu ≤ 50% |

| Pha | Đòn | Telegraph | Sát thương | Cách né |
| --- | --- | --- | --- | --- |
| 1 | **Giậm Băng:** sóng băng chạy ra hai bên 6 ô/s | 0,8 s | 15 | Nhảy qua sóng |
| 2 | **Ném Tảng Băng:** 3 tảng rơi quanh Titan | 0,7 s | 12 | Đứng ngoài bóng đổ |
| 2 | **Trượt Húc:** lao 5 ô, 9 ô/s | 0,5 s | 15 | Nhảy qua; Titan hở 1,2 s sau đó |

**Bản Thử thách — Tảng Vỡ** (`bombs.landShockwave`, mới nhỏ, dùng `spawnShockwaves`): mỗi tảng chạm sàn tách 2 sóng băng nhỏ chạy ngang 1,5 ô, 5 ô/s, 8 sát thương. Đứng ngoài bóng đổ chưa đủ, phải nhảy sóng.

### 4.6 Boss: Cryo (`cryo`)

**Chủ đề:** Warden của Kho Lạnh, một khối máy làm lạnh hình người, cử động có dấu lặng. Đấu trường 24 × 12 ô: 12 ô giữa là sàn trơn, hai bên sàn thường, 3 bục băng cao 3 ô `[SAU CỔNG]` (bục thường ở Thường; vỡ được chỉ bằng đòn Thử thách). Cryo đi 0,6 ô/s, giữ cách 5 ô.

| Thông số | Giá trị |
| --- | --- |
| HP | 300 |
| Va chạm | 10 |
| `idleSec` | 1,2 (Thorna 1,0: Cryo nghỉ lâu hơn giữa các đòn, hợp giọng "rất chậm, nhiều dấu lặng") |
| Điểm yếu | **Prism Beam:** 2,5×, choáng 0,5 s ("tia sáng nung chảy băng") |
| Thắng chỉ bằng Arc Cannon | Có, 60–90 s |
| Phần thưởng | Frost Shard, 388 EXP, 140 Core Bit, 1 SP |

| Pha | Ngưỡng | Đòn | Dùng lại | Telegraph | Sát thương | Cách né |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 100–60% | **Mũi Băng:** 3 mũi, cách 0,45 s, 6 ô/s, ngang tầm Kai | `shot` | Hơi lạnh tụ ở tay 0,7 s | 14 | Nhảy qua, lướt |
| 1 | 100–60% | **Trượt Băng:** trượt ngang tới tường, 8 ô/s; sau đó ngồi thở (hồi 1,0 s, hở) | `charge` | Cúi người, vệt sương trên sàn 0,9 s | 18 | Nhảy qua, đứng bục |
| 2 | 60–30% | Giữ hai đòn trên, thêm **Dậm Băng:** nhảy đập, sóng 5 ô/s ra hai bên; sau đòn **toàn bộ sàn** đấu trường hóa trơn trong `slickFloorSec = 4` s (bình thường chỉ 12 ô giữa; trường mới của `slam`) | `slam` | Giơ hai tay 0,7 s | 18 (đập), 14 (sóng) | Nhảy sóng; sau đó tránh đứng sát mép khi Trượt Băng tới |
| 3 | Dưới 30% | Tốc độ +20%; thêm **Giữ Lại** (đòn đỉnh): 12 hạt băng bay lên rồi rơi, chừa 3 khe rộng 2 ô; sau đòn Cryo choáng 2,5 s | `bloom` | Co người 1,2 s, hạt bay lên trước | 22 | Vào khe; cửa sổ tấn công 2,5 s |

Danh sách pha: pha 1 `shot, charge`; pha 2 `shot, slam, charge`; pha 3 `slam, shot, bloom, charge`. Telegraph pha 3: 0,58 / 0,58 / 1,0 / 0,75 s.

**Đòn Thử thách thêm — Nứt Bục** (`shatter`, mới; dùng `CrumblePlatform` của màn):

| Thông số | Giá trị | Ghi chú |
| --- | --- | --- |
| Mục tiêu | Bục Kai đang đứng; Kai ở sàn thì bục gần Kai nhất | |
| Báo trước | 0,8 s (pha 3: 0,67 s) | Vết nứt và rung trên bục, Cryo chỉ tay về bục (tư thế riêng) |
| Kết quả | Bục vỡ, mảnh rơi ngay dưới bục (rộng bằng bục) | Sát thương mảnh rơi 14 |
| Bục mọc lại | 4 s | |
| Hồi sau đòn | 0,6 s | |

Pha 2 Thử thách: `shot, shatter, slam, charge`. Pha 3 Thử thách: `slam, shatter, shot, bloom, charge`. Người chơi phải làm khác: không dùng bục làm chỗ trú cố định khi Trượt Băng tới; phải đọc bục nào còn.

**Quy tắc thiết kế:** không đòn nào quá 22; Trượt Băng không xuất hiện ngay sau Dậm Băng trong 0,5 s đầu sàn mới trơn (thêm `minGapAfterSec = 0,5` giữa hai đòn này) để người chơi kịp đọc sàn.

**Thoại:** trước trận `boss.cryo.early.pre`: "Ở đây... không gì hỏng đi. Hạt giống, thuốc, ký ức. Ta giữ lại hết." Sau trận `boss.cryo.early.post`: "Ngươi làm tan băng rồi... Đừng để những gì ta giữ bị lãng phí." NOVA (`boss.cryo.nova_after`): "Tôi biết mật mã cửa kho này. Đừng hỏi tôi vì sao."

### 4.7 Vũ khí nhận: Frost Shard

| Mục | Đề xuất `[PLACEHOLDER]` |
| --- | --- |
| `behavior.type` | `shard` (mới): đạn băng bay thẳng |
| Thông số | `speedTilesPerSec = 10`, `rangeTiles = 10`, `sizePx = 8 × 6`, `damageMul = 2`, `cooldownSec = 0,4` |
| Đóng băng | Trúng kẻ địch thường thì vô hiệu `freezeSec = 2`. Trong thời gian đó địch đứng yên, dừng nhịp tấn công và sát thương chạm thân, vẫn nhận đòn. Khiên Lính Kén chặn mặt trước. Mini-boss và boss miễn đóng băng. Dùng chung `disabledSec` với Phase Step theo QB-19 |
| Năng lượng | `energyCostOf28 = 4` (7 lần mỗi thanh) |
| Điểm yếu | Aeris: "mảnh băng làm nặng cánh gió" |
| Khám phá | Đông dòng chất làm mát thành bậc ở Két giáp Stage 2 |
| Không làm (MVP) | Kẻ địch đóng băng không thành bục đứng được (Q12) |

### 4.8 Két giáp, bí mật, nhiệm vụ phụ

| Mục | Vị trí | Cách mở |
| --- | --- | --- |
| Két giáp: Tay Mk I (`arm_mk1`, đạn nạp vừa phá khiên) | Lối vào kho hạt giống, đoạn B | Cần **Gale Cutter** (Stage 4): màn sương lạnh dày chắn lối là `Barrier` với `requiresWeapon: "Gale Cutter"` (dùng lại nguyên vật chắn) |
| Memory Log 3 | Nhánh phụ đoạn C | Nhảy tường trên tường băng, không cần vũ khí |
| Nano Cell | Phòng bí mật đoạn D (wireframe Stage 3) | Chuỗi băng vỡ không có chỗ dừng |
| Nhiệm vụ phụ "Băng vỡ" (`sq_cryo_vault`) | Đoạn thử `questZone` (sàn trơn + băng vỡ, có hố bên dưới) trên đường chính, **ngay sau CP2, đầu đoạn C**, vào từ cạnh bên. CP2 có ở cả ba độ khó và cách mép vào **≤ 20 ô** (`zoneCheckpointMaxTiles`, Q9); CP-S2 nằm **sau mép đích** (không checkpoint nào trong vùng, QB-40) | Chỉ tham chiếu `15-Nhiem-vu-phu.md`: mang thùng thuốc lạnh qua đoạn không rơi hố, không chết → 1 Data Chip + module Phase Step |

### 4.9 Checkpoint theo độ khó

| Checkpoint | Vị trí | Cốt truyện | Thường | Thử thách | `difficulties` |
| --- | --- | --- | --- | --- | --- |
| CP1 | Cuối A | Có | Có | Không | `"story,normal"` |
| CP-S1 | Giữa B | Có | Không | Không | `"story"` |
| CP2 | Cuối B, cách mép vào đoạn thử "Băng vỡ" ≤ 20 ô | Có | Có | Có | |
| CP-S2 | Giữa C, sau mép đích đoạn thử | Có | Không | Không | `"story"` |
| CP3 | Trước mini-boss | Có | Có | Có | |
| CP3b | Cửa ra phòng mini-boss | Có | Có | Không | `"story,normal"` |
| CP-S3 | Giữa D | Có | Không | Không | `"story"` |
| CP4 | Trước cửa boss | Có | Có | Có | |

### 4.10 Lời NOVA dạy cơ chế (nháp)

| Tín hiệu | Lời |
| --- | --- |
| `ice` | NOVA: "Ma sát gần bằng không. Muốn dừng thì nhả nút sớm, hoặc nhảy." |
| `crumble` | NOVA: "Băng này nứt khi có trọng lượng. Đừng đứng ngắm cảnh." |

### 4.11 Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| Băng vỡ dưới chân kẻ địch (Kai kích hoạt) | Kẻ địch rơi; rơi khỏi bản đồ thì tính hạ: EXP cộng ngay, Core Bit rơi theo nên mất |
| Bục băng mọc lại khi Kai đứng trong chỗ đó | Chờ tới khi không còn đè rồi mới mọc |
| Kai lướt từ băng ra sàn thường | Ra khỏi ô băng thì dùng vận tốc sàn thường ngay bước đó |
| Dậm Băng làm sàn trơn khi Kai đang lướt | Lướt kết thúc như thường, sau đó trượt theo `iceDecel` |
| Hồi sinh trong phòng boss | Sàn về trạng thái đầu (hết `slickFloorSec`), bục vỡ mọc lại |
| Người Tuyết Máy trượt trúng gai băng | Kẻ địch không nhận sát thương gai (như Stage 1) |
| Tới Stage 3 trước Stage 2 (chưa có Prism Beam) | Đánh Cryo bằng Arc Cannon; gợi ý D10 sau lần thua đầu |

### 4.12 Tiêu chí nghiệm thu

- [ ] Sàn trơn: quãng dừng từ tốc độ tối đa = 5,5² / (2 × `iceDecel`) ± 1 bước logic; bật lùi trên băng bằng sàn thường.
- [ ] Băng vỡ đúng `triggerSec` kể cả khi Kai rời đi; 3 bậc nứt hiện đúng thời điểm; mọc lại sau 4 s.
- [ ] Người Tuyết Máy chạy chỉ bằng dữ liệu (`shieldCharger`, `shieldHits = 0`); Tháp Băng rơi đúng chỗ Kai lúc hết báo trước (± 0,5 ô).
- [ ] Frost Titan và bản Thử thách Tảng Vỡ chạy đúng.
- [ ] Cryo đổi pha ở 60% và 30%; Prism Beam 2,5× và choáng 0,5 s; bot không né thua ở cấp 8; Nứt Bục báo trước ≥ 0,5 s ở pha 3.
- [ ] Nhận Frost Shard; Frost Shard đông dòng chất làm mát ở Két Stage 2; Két Tay Mk I chỉ mở khi có Gale Cutter.
- [ ] Checkpoint đúng bảng 4.9.

## 5. Stage 4: Cirrus Tower

### 5.1 Tổng quan và chủ đề

Tháp khí tượng cao vượt mây, nền trời sáng, gió có hình (vệt mây, cờ). Màn đi **lên** theo chiều dọc. Aeris muốn làm mưa cho khu ngoại ô nhưng bị cấm. Màn dạy: **gió là lực ngang đọc được trước; bệ mây là bục một chiều có ba loại**.

**Kể chuyện qua môi trường:** máy gieo mây dán niêm phong "Lệnh của Hội đồng: cấm gieo mây ngoài khu trung tâm"; bản đồ lượng mưa trên tường, các khu ngoại ô tô xám; một bồn nước trên tầng thượng khóa van.

### 5.2 Nhịp đoạn

| Đoạn | Thời lượng / độ dài | Dạy gì | Kẻ địch | Cơ chế mới | Cường độ | Checkpoint |
| --- | --- | --- | --- | --- | --- | --- |
| **A. Chân tháp** | \~1,5 phút / 6 màn hình `[SAU CỔNG]` | Gió đẩy ngang cố định: đi ngược gió, nhảy xuôi gió. Có sàn đỡ dưới mọi khe (lưới an toàn), không hố chết | Chim Cắt Gió ×2, Bướm Sắt ×2 | Gió cố định, bệ mây đứng yên | 0,3 | CP1 cuối đoạn |
| **B. Trục gió** | \~2,5 phút / 10 màn hình (dọc) | Gió đổi hướng theo chu kỳ có báo trước; bệ mây trôi | Cối Xoáy ×2, Chim Cắt Gió ×2, Bướm Sắt ×1 | Gió đổi hướng, bệ mây trôi | 0,5 | CP2 cuối đoạn |
| **C. Phòng khóa trên không** | \~3 phút (1,5 + mini-boss 1,5) / 7 màn hình | Mở đầu bằng trục gió ngắn (đoạn thử nhiệm vụ "Gió mất hướng", ngay sau CP2); rồi chiến đấu trên bệ mây; phòng khóa có **sàn mây đặc** ở đáy (không hố chết trong phòng khóa) | Lính Kén ×2, Chim Cắt Gió ×2, Bướm Sắt ×1, Gale Roc | Không | 0,7 (0,8) | CP3 trước mini-boss; CP3b ở cửa ra phòng mini-boss |
| **D. Đỉnh tháp** | \~2,5 phút / 9 màn hình | Gió + bệ mây tan | Chim Cắt Gió ×1, Cối Xoáy ×2, Bướm Sắt ×1, Lính Kén ×2 | Bệ mây tan | 0,6 | CP4 trước cửa boss |
| **Phòng boss** | \~2,5 phút / 24 × 12 ô | Aeris | Aeris | Không | 1,0 | Trong phòng boss |

Ghi chú: wireframe Stage 4 ghi bệ mây rơi ở D là "cơ chế" của đoạn tổng hợp; tài liệu này coi bệ mây tan là biến thể cuối của bệ mây (dạy ở đầu D bằng một bục tan đặt trên sàn an toàn).

### 5.3 Cơ chế môi trường

| Cơ chế | Quy tắc | Tham số (`stages.json → mechanics`) |
| --- | --- | --- |
| Vùng gió (`WindZone`) | Hình chữ nhật trên bản đồ; cộng lực ngang `force` vào vận tốc ngang của Kai; trên mặt đất nhân `groundMul`. Chỉ tác động lên Kai (không lên đạn, kẻ địch, bệ mây) | `wind.forceTilesPerSec = 2,5` (≈ 45% tốc độ chạy), `wind.groundMul = 0,5` `[SAU CỔNG]` |
| Ngoại lệ | Lướt bỏ qua gió (giữ chuẩn xác); bám tường không bị gió kéo khỏi tường; bị đánh thì gió không đẩy Kai trong `hurt.stunSec` (0,3 s), để không rơi hố chỉ vì bị đánh (QB-07) | `wind.dashIgnores = true`, `wind.wallSlideIgnores = true`, `wind.hurtIgnores = true` |
| Gió đổi hướng | Chu kỳ `cycleSec`; trước khi đổi `warnSec`: cờ quay, mũi tên ở mép màn hình đổi chiều; lực đổi dần trong `rampSec` | `wind.cycleSec = 4`, `wind.warnSec = 1,0`, `wind.rampSec = 0,3` |
| Bệ mây | Bục một chiều (đứng từ trên, đi xuyên từ dưới, xuống bằng xuống + nhảy như bục một chiều có sẵn) | `cloud.oneWay = true` |
| Bệ mây trôi | Đi qua lại giữa 2 điểm ghi trên bản đồ, chở Kai bằng `dx`, `dy` như dây leo | `cloud.drift.speedTilesPerSec = 1,5` |
| Bệ mây tan (`CrumblePlatform`, `mode: "sink"`) | Dùng hai mốc báo nứt `crumble.warnAtSec` của băng vỡ, sau đó chìm xuống với tốc độ `sinkTilesPerSec`. Màu xám để phân biệt mây trắng | `crumble.sink.triggerSec = 0,8`, `sinkTilesPerSec = 3`, `respawnSec = 4` |
| Hố | Luật hố Stage 1 (20 sát thương, về checkpoint, không chết nếu còn máu) | `mechanics.pit` (có sẵn) |

Kai trên không đi ngược gió còn 5,5 − 2,5 = 3,0 ô/s, xuôi gió 8,0 ô/s. Vì vậy khe nhảy ngược gió phải đo riêng sau cổng `[SAU CỔNG]`; luật thiết kế: khe đường chính ngược gió ≤ `safeGapTiles` đo **khi có gió ngược**.

### 5.4 Kẻ địch thường

`enemyRewardMul = {exp: 4,0, coreBit: 2,0}`.

| Kẻ địch (`id`) | Vai trò | HP | Sát thương | Hành vi | Telegraph | EXP base → Thường | Core Bit base → Thường | Bản Thử thách |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chim Cắt Gió (`chim_cat_gio`) | Bay, bổ nhào | 3 | 8 (va chạm), 10 (bổ nhào) | `diver` (mới): bay tuần cao 4 ô; Kai trong 7 ô thì khóa hướng tới vị trí Kai lúc bắt đầu báo trước, lao thẳng 10 ô/s tối đa 8 ô, chạm đất/tường thì dừng, hở 0,8 s rồi bay lên 3 ô/s | Dang cánh, kêu, vạch mờ chỉ hướng lao 0,5 s | 8 → 32 | 3 → 6 | **Bổ Nhào Nối:** sau cú lao nhắm lại, báo trước 0,4 s, lao lần nữa (2 chấm báo nhịp) |
| Cối Xoáy (`coi_xoay`) | Tháp điều khiển vị trí | 6 | 10 (va chạm cánh) | `fan` (mới): gắn tường/sàn, chu kỳ 3,0 s; thổi vùng gió dài 6 ô, cao 3 ô, 4 ô/s trong 1,2 s; gió không gây sát thương, đẩy Kai về phía hố/gai. Phá hủy thì gió tắt hẳn trong lượt | Cánh quay tăng dần, lá gió bay ra 0,6 s | 10 → 40 | 4 → 8 | **Đẩy rồi Hút:** sau 1,2 s thổi là 1,0 s hút về phía cánh (2 chấm báo nhịp) |
| Bướm Sắt (`buom_sat`) | Bay | 2 | 6 | Như Stage 1; hạt nổ không bị gió | 0,5 s | 8 → 32 | 3 → 6 | Thả kép (đã có) |
| Lính Kén (`linh_ken`) | Tinh nhuệ | 8 | 12 | Như Stage 1; đặt trên bệ mây đứng yên rộng ≥ 6 ô `[SAU CỔNG]` | 0,5 s | 14 → 56 | 6 → 12 | Lao nối (đã có) |

Tổng: 20 kẻ địch (Chim Cắt Gió 7, Cối Xoáy 4, Bướm Sắt 5, Lính Kén 4) → 768 EXP (224 + 160 + 160 + 224), 152 Core Bit `[SAU CỔNG]`.

Gió đẩy của Cối Xoáy không gây sát thương nhưng có thể đẩy rơi hố (20 máu), nên vẫn tuân luật telegraph ≥ 0,4 s và không đặt Cối Xoáy thổi thẳng vào hố ở đoạn A–B.

### 5.5 Mini-boss: Gale Roc (`gale_roc`)

Chim máy khổng lồ trong phòng khóa trên không 20 × 12 ô: 4 bệ mây đứng yên và sàn mây đặc ở đáy. Bay giữa độ cao 4–6 ô.

| Thông số | Giá trị |
| --- | --- |
| HP | 90 (Cốt truyện 72, Thử thách 112,5) |
| Va chạm | 12 |
| Thưởng | 270 EXP, 60 Core Bit (không nhân `enemyRewardMul`) |
| Pha 2 | Máu ≤ 50% |

| Pha | Đòn | Telegraph | Sát thương | Cách né |
| --- | --- | --- | --- | --- |
| 1 | **Bổ Nhào:** khóa vị trí Kai lúc bắt đầu báo trước, lao 11 ô/s; chạm sàn thì hở 1,0 s | Rít, vạch mờ chỉ hướng 0,7 s | 15 | Lướt ngang khỏi vạch |
| 1 | **Vỗ Cánh:** gió đẩy ngang 4 ô/s trong 1,2 s kèm 3 lông thép xòe 30° | Cánh giương rộng 0,7 s | 10 (lông) | Bám tường hoặc lướt (lướt bỏ qua gió) |
| 2 | **Mưa Lông Thép:** 8 lông rơi từ trên, chừa 2 khe rộng 2 ô; Roc choáng 1,0 s sau đó | 0,8 s | 12 | Vào khe |
| 2 | Bổ Nhào nối 2 lần | 0,7 s rồi 0,5 s | 15 | |

**Bản Thử thách — Xoáy Lông:** cú Bổ Nhào chạm sàn tạo 2 sóng lông chạy ngang 6 ô/s (10 sát thương, dùng `spawnShockwaves`). Lướt khỏi cú lao rồi phải nhảy sóng.

### 5.6 Boss: Aeris (`aeris`)

**Chủ đề:** Warden Khí tượng, hình dáng nửa chim nửa chong chóng, nói nhanh và cười "Ha!". Đấu trường 24 × 12 ô trên đỉnh tháp: sàn đặc, 3 bệ mây đứng yên (một chiều) cao 3 ô `[SAU CỔNG]`, gió toàn đấu trường tắt ở pha 1. Aeris **bay**: giữa độ cao 3–6 ô so với sàn (Q14), trôi ngang 1,5 ô/s, giữ cách 6 ô. Độ cao bay là tham số, chốt sau cổng (ST-17-01).

| Thông số | Giá trị |
| --- | --- |
| HP | 320 |
| Va chạm | 10 |
| `idleSec` | 0,7 (ngắn hơn Thorna 1,0, hợp giọng "nhanh, vui") |
| Điểm yếu | **Frost Shard:** 2,5×, choáng 0,5 s; khi choáng Aeris rơi 2 ô ("mảnh băng làm nặng cánh gió") |
| Thắng chỉ bằng Arc Cannon | Có, 75–105 s (Arc Cannon bắn ngang: trúng Aeris khi Aeris ở độ cao Kai đứng hoặc nhảy tới, và trong mọi pha hồi khi Aeris đậu xuống) |
| Phần thưởng | Gale Cutter, 564 EXP, 160 Core Bit, 1 SP |

| Pha | Ngưỡng | Đòn | Dùng lại | Telegraph | Sát thương | Cách né |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 100–60% | **Lưỡi Gió:** 4 lưỡi, cách 0,25 s, 10 ô/s, nhắm chéo vào Kai lúc báo trước (`shot.aim = true`, mới nhỏ) | `shot` | Cánh khép, xoáy nhỏ trước ngực 0,6 s | 12 | Lướt cắt ngang làn, nhảy |
| 1 | 100–60% | **Lốc Ngang:** sà xuống làn sát sàn rồi lao ngang 12 ô/s; sau đó đậu trên sàn 0,8 s (hở) | `charge` | Vút lên rồi chúc xuống, vệt gió quét trên sàn 0,8 s | 18 | Đứng trên bệ mây; khi Aeris đậu là cửa sổ tấn công |
| 2 | 60–30% | Giữ hai đòn trên, thêm **Đổi Gió** (`gust`, mới): gió toàn đấu trường bật hoặc đổi chiều, 3 ô/s trong 3 s; đòn kế tiếp đến ngay sau | — | Cờ gió quay, mũi tên mép màn đổi chiều 0,8 s | 0 | Đi ngược gió, bám tường, lướt (lướt bỏ qua gió) |
| 3 | Dưới 30% | Tốc độ +20%; thêm **Mắt Bão** (đòn đỉnh): Aeris lên giữa trần, gió hút về giữa 1,5 ô/s, mảnh mây đá rơi chừa 3 khe rộng 2 ô; sau đòn Aeris rơi xuống sàn choáng 2 s | `rain` + lực hút (mới) | Mây xoáy 1,0 s | 24 | Vào khe, chống lực hút; cửa sổ tấn công 2 s trên sàn |

Danh sách pha: pha 1 `shot, charge`; pha 2 `shot, gust, charge`; pha 3 `gust, shot, rain, charge`. Telegraph pha 3: 0,67 / 0,5 / 0,83 / 0,67 s.

**Đòn Thử thách thêm — Lốc Xoáy** (`twister`, mới; dựa trên sóng đất của `slam`, một chiều, cao):

| Thông số | Giá trị | Ghi chú |
| --- | --- | --- |
| Báo trước | 0,8 s (pha 3: 0,67 s) | Phễu gió hình thành ở mép đấu trường phía Aeris, có tiếng hú riêng |
| Lốc | 16 × 40 px (cao **≤ 2,5 ô**), chạy dọc sàn sang mép bên kia 4 ô/s | Cao ≤ 2,5 ô (Q14), thấp hơn hẳn nhảy tối đa 4,5 ô; độ cao phải nhảy qua `[SAU CỔNG]` |
| Sát thương | 16 | |
| Kết hợp | Aeris bắn Lưỡi Gió sau khi lốc đã chạy 0,5 s (không ra đòn cùng lúc báo trước) | |
| Hồi sau đòn | 0,6 s | |

Pha 2 Thử thách: `shot, gust, twister, charge`. Pha 3 Thử thách: `gust, twister, shot, rain, charge`. Người chơi phải làm khác: vừa lên bệ mây hoặc nhảy qua lốc vừa đọc Lưỡi Gió nhắm chéo, trong lúc gió có thể đang đẩy.

**Quy tắc thiết kế:** không đòn nào quá 24; Đổi Gió không bao giờ xảy ra trong lúc Mắt Bão; Mắt Bão và hạt mây đá thêm vào `shieldPierceKinds`.

**Thoại:** trước trận `boss.aeris.early.pre`: "Ha! Khách! Lâu lắm rồi mới có thứ gì bay lên được tới đây!" Sau trận `boss.aeris.early.post`: "Gió đổi hướng rồi... Lần sau ta thổi ngươi bay khỏi tháp đấy." NOVA (`boss.aeris.nova_after`): "Tầng 40 của tháp có một quán trà. À... tôi đọc ở đâu đó thôi."

### 5.7 Vũ khí nhận: Gale Cutter

| Mục | Đề xuất `[PLACEHOLDER]` |
| --- | --- |
| `behavior.type` | `boomerang` (mới): lưỡi gió bay ra rồi quay về Kai |
| Thông số | `outTiles = 6`, `speedTilesPerSec = 11`, `sizePx = 12 × 12`, `damageMul = 1` mỗi lượt (đi và về, mỗi mục tiêu tối đa 1 lần mỗi lượt), `maxOnScreen = 1` |
| Hủy đạn | Lưỡi chạm đạn của **kẻ địch thường** thuộc `cancelKinds` (`enemyShot`, `bomb`) thì hủy, tối đa `maxCancelsPerThrow = 2` mỗi lần ném. Không hủy đạn của mini-boss và boss, tia, sóng, đòn đỉnh (Q4) |
| Năng lượng | `energyCostOf28 = 4` |
| Điểm yếu | Terra (Stage 5, Alpha): "lưỡi gió mài mòn giáp đá" |
| Khám phá | Thổi tan sương lạnh ở Két giáp Stage 3 (`Barrier`, `requiresWeapon: "Gale Cutter"`) |

### 5.8 Két giáp, bí mật, nhiệm vụ phụ

| Mục | Vị trí | Cách mở |
| --- | --- | --- |
| Két giáp: Chân Mk I (`leg_mk1`, Q8) | Dưới sàn mây đá, cạnh phòng khóa đoạn C | Cần **Quake Drill** (Stage 5, **Alpha**): sàn mây đá là `Barrier` ngang với `requiresWeapon: "Quake Drill"`. Trong MVP két **hiện nhưng không mở được**: biểu tượng khóa, gợi ý D02, radar Đầu Mk I ghi "cần Quake Drill". Không tính vào tỷ lệ thu thập ở MVP |
| Memory Log 4 | Nhánh phụ đoạn D | Bệ mây trôi + nhảy tường, không cần vũ khí |
| Rương Core Bit (+40, tính trong 78 Core Bit rương của màn) | Đoạn B | Đi ngược gió đổi hướng tới bệ mây cao |
| Nhiệm vụ phụ "Gió mất hướng" (`sq_cirrus_tower`) | Đoạn thử `questZone` (gió đổi hướng + bệ mây, 2–3 màn hình dọc) **ngay sau CP2, đầu đoạn C**, trước phòng khóa: kiểm tra điều đoạn B vừa dạy. **Vào từ cạnh bên** (từ gờ đặc nằm ngoài vùng), ra ở mép trên. **Sàn đặc an toàn bên dưới** nằm trong vùng: không hố, không gai. CP2 cách mép vào **≤ 20 ô** (Q9); CP-S2 nằm **sau mép đích** | Chỉ tham chiếu `15-Nhiem-vu-phu.md`: mang máy ghi gió qua đoạn không đứng trên ô đặc, không rơi hố, không chết → 1 Data Chip + module Energy Siphon. Bệ mây và bám tường không tính là chạm sàn |

### 5.9 Checkpoint theo độ khó

| Checkpoint | Vị trí | Cốt truyện | Thường | Thử thách | `difficulties` |
| --- | --- | --- | --- | --- | --- |
| CP1 | Cuối A | Có | Có | Không | `"story,normal"` |
| CP-S1 | Giữa B | Có | Không | Không | `"story"` |
| CP2 | Cuối B, cách mép vào đoạn thử "Gió mất hướng" ≤ 20 ô | Có | Có | Có | |
| CP-S2 | Giữa C, sau mép đích đoạn thử | Có | Không | Không | `"story"` |
| CP3 | Trước mini-boss | Có | Có | Có | |
| CP3b | Cửa ra phòng mini-boss | Có | Có | Không | `"story,normal"` |
| CP-S3 | Giữa D | Có | Không | Không | `"story"` |
| CP4 | Trước cửa boss | Có | Có | Có | |

Màn dọc: mọi checkpoint Stage 4 là vùng chữ nhật trên Tiled, xét theo thứ tự (QB-40).

### 5.10 Lời NOVA dạy cơ chế (nháp)

| Tín hiệu | Lời |
| --- | --- |
| `wind` | NOVA: "Cảm biến gió: đẩy ngang, đều. Cờ trên cột chỉ hướng, tôi khuyên cậu nhìn nó." |
| `windShift` | NOVA: "Cờ đang quay. Gió sắp đổi chiều, tôi chỉ thấy trước cậu chút xíu thôi." |
| `cloud` | NOVA: "Mây trắng đứng được. Mây xám thì... đừng tin nó lâu." |

### 5.11 Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| Gió đổi chiều giữa cú nhảy | Có báo trước 1,0 s và đổi dần 0,3 s; lực tính lại mỗi bước logic |
| Kai đứng yên trên bệ mây trong gió | Trôi `force × groundMul` = 1,25 ô/s; bục rộng 2 ô thì 1,6 s mới trôi khỏi mép (`[SAU CỔNG]`) |
| Gió đẩy Kai vào tường lúc bám | Bám tường bỏ qua gió, không bị kéo ra |
| Bị đánh khi đứng trong vùng gió | Gió không đẩy trong `hurt.stunSec` 0,3 s (`wind.hurtIgnores`, QB-07); bật lùi như sàn thường |
| Rơi hố trong phòng khóa trên không | Không xảy ra: phòng khóa có sàn mây đặc |
| Cối Xoáy bị phá khi đang thổi | Gió tắt ngay bước đó |
| Bệ mây tan đang chìm thì Kai nhảy lên lại | Bục vẫn chìm tiếp, không đếm lại |
| Frost Shard đóng băng Chim Cắt Gió đang lao | Dừng tại chỗ, rơi xuống đất, vẫn trúng đòn |
| Két Chân Mk I trong MVP | Không bao giờ mở được trong MVP; không chặn 100% vì MVP chưa tính thành tựu Vệt Vàng |

### 5.12 Tiêu chí nghiệm thu

- [ ] Gió: lực ngang đúng `force`, trên đất × `groundMul`; lướt và bám tường bỏ qua gió; báo trước đổi chiều 1,0 s.
- [ ] Bệ mây: một chiều, trôi chở Kai đúng `dx`, `dy`, tan đúng `triggerSec` và mọc lại sau 4 s.
- [ ] Chim Cắt Gió và Cối Xoáy cùng bản Thử thách chạy đúng; telegraph ≥ 0,4 s; Cối Xoáy bị phá thì gió tắt.
- [ ] Gale Roc đổi pha ở 50%; phòng khóa không có hố.
- [ ] Aeris đổi pha ở 60% và 30%; Frost Shard 2,5× và choáng 0,5 s; bot không né thua ở cấp 10; Lốc Xoáy báo trước ≥ 0,5 s ở pha 3; Đổi Gió không chồng Mắt Bão.
- [ ] Nhận Gale Cutter; Gale Cutter phá sương lạnh Két Stage 3; Két Chân Mk I hiện khóa "cần Quake Drill".
- [ ] Checkpoint đúng bảng 5.9.

## 6. Cân bằng tổng hợp

| Chỉ số | Stage 2 | Stage 3 | Stage 4 |
| --- | --- | --- | --- |
| EXP (kẻ địch + mini-boss + boss) | 309 + 110 + 241 = 660 | 528 + 185 + 388 = 1.101 | 768 + 270 + 564 = 1.602 (= `expBudget`) |
| Core Bit (kẻ địch + mini-boss + boss + rương) | 120 + 40 + 110 + 30 = 300 | 136 + 50 + 140 + 49 = 375 | 152 + 60 + 160 + 78 = 450 |
| SP | 1 (boss) + cấp đạt được (4 → 6: +2) | 1 + (6 → 8: +2) | 1 + (8 → 10: +2); hết MVP 13 SP |
| Số lần chết trung bình | 4–7; Lumen 1–3 lần thử đầu | 4–7; Cryo 1–3 | 5–8; Aeris 2–4 |
| Thời lượng | \~11 phút | \~11,5 phút | \~12 phút |
| Tỷ lệ hoàn thành ở phiên đầu | ≥ 70% | ≥ 70% | ≥ 65% |
| Sát thương nhận trung bình mỗi đoạn | ≤ 40% thanh máu | ≤ 40% | ≤ 45% |

Quy tắc điều chỉnh (như Stage 1): quá 30% người thử chết ở cùng một điểm thì nới khe né hoặc thêm checkpoint trước khi chỉnh chỉ số kẻ địch. Ở Stage 4, đếm riêng rơi hố do gió; nếu rơi hố do gió chiếm > 50% số lần hỏng của một đoạn thì giảm `wind.forceTilesPerSec` trước.

## 7. Tài nguyên cần dựng (nhóm P2)

| Loại | Danh sách | Ghi chú |
| --- | --- | --- |
| Kẻ địch mới | Gương Quang, Tháp Laser, Người Tuyết Máy, Tháp Băng, Chim Cắt Gió, Cối Xoáy (đứng, di chuyển, báo trước, tấn công, trúng, chết; Gương Quang thêm vạch ngắm) | Bản Thử thách dùng chung sprite, thêm chấm báo nhịp |
| Mini-boss | Prism Sentinel, Frost Titan, Gale Roc | 2 pha dùng chung sprite, đổi màu lõi |
| Boss | Lumen (dịch chuyển, tư thế tím Tiêu Điểm), Cryo (tư thế chỉ tay Nứt Bục), Aeris (bay, đậu, choáng rơi) | 3 pha đổi màu lõi như Thorna |
| Tile và nền | Viện quang học (gương 2 góc, cảm biến, khối chắn, dòng chất làm mát); trạm lạnh (ô băng, băng vỡ 3 bậc nứt, gai băng, sương lạnh); tháp mây (mây trắng, mây xám, sàn mây đá, cờ gió, vệt gió) | Mỗi màn ≤ 8 MB như Stage 1 |
| Vũ khí | Prism Beam (tia, điểm dội), Frost Shard (đạn, khối băng bọc kẻ địch), Gale Cutter (lưỡi xoay) | Mỗi vũ khí một âm sắc |
| UI | Mũi tên hướng gió ở mép màn, biểu tượng khóa "cần [vũ khí]" | Không che vùng nút cảm ứng |
| SFX | Laser báo trước và bắn, gương xoay, cảm biến mở, băng nứt và vỡ, gió đổi, lốc hú, cảnh báo đòn boss | M12 |
| Nhạc | Stage 2, 3, 4 và ba nhạc boss | |

## 8. Giao tiếp hệ thống và tín hiệu

- **Tín hiệu hướng dẫn mới** (`core/tutorial-config.ts`): `laser`, `laserPulse`, `mirror`, `sensor`, `ice`, `crumble`, `wind`, `windShift`, `cloud`. Dùng lại: `near:<kẻ địch>`, `section:<đoạn>`, `roomLocked`, `bossGate`, `bossPhase`, `bossDefeated`, `weaponGranted`.
- **Sự kiện thế giới đề xuất** (`WorldEvents`, để Scene vẽ hiệu ứng và phát âm thanh, gameplay không gọi UI): `mirrorToggled`, `sensorActivated`, `laserHit`, `platformCracked`, `platformBroken`, `windChanged`, `enemyFrozen`, `coolantFrozen`, `barrierBroken` (có sẵn cho vật chắn).
- **Bản lưu:** không thêm trường cho cơ chế (gương, băng, gió đặt lại mỗi lượt). Két giáp suy ra từ bí mật đã nhặt (`10-He-thong-RPG-Xuong.md` mục 2.3). Tiến độ nhiệm vụ phụ: `15-Nhiem-vu-phu.md` mục 4 (`sideQuests` ở bản lưu kế tiếp).

## 9. Thay đổi cần lan sang tài liệu khác

| Tài liệu / dữ liệu | Thay đổi | Kiểm tra cần thêm (`game/src/core/*-config.ts`) |
| --- | --- | --- |
| `03-Data/enemies.json` | Thêm `guong_quang`, `thap_laser`, `nguoi_tuyet_may`, `thap_bang`, `chim_cat_gio`, `coi_xoay`, `prism_sentinel`, `frost_titan`, `gale_roc`, mỗi loại có khối `challenge`. Trường mới: `projectile.bounces`, `attack.bankShot`, `attack.lob {aimAtPlayer, elevationDeg, gravityTilesPerSec2, spreadTiles, maxRangeTiles}`, `attack.pulses`, `attack.pulseGapSec`, `bombs.landShockwave`; hành vi mới `laserTurret`, `diver`, `fan`. Luật chung: `minTelegraphSec` cho mini-boss 0,5 (QB-21), `rules.activeRangeTilesY` 7 và `attackRequiresOnScreen` (QB-23) ở ST-15-15; `pickups.energyChance`, `pickups.energy` (QB-17) ở ST-15-16 | Telegraph ≥ 0,4 s cho cả `pulse.warnSec`, báo trước lao nối; mini-boss ≥ 0,5 s; `bounces ≤ 2`; không chết một đòn ×1,5; mọi `miniBoss` của màn đã làm có dữ liệu |
| `03-Data/bosses.json` | Thêm `lumen`, `cryo`, `aeris` (máu, pha, đòn, `challenge`, `weakness`, `reward`, `rewardExp`, `rewardCoreBit`). Đòn mới: `beam`, `focus`, `shatter`, `gust`, `twister`; trường mới `slam.slickFloorSec`, `shot.aim`, `rain.pullTilesPerSec`, `minGapAfterSec`; di chuyển `teleport {anchors}`, `hover {minTiles, maxTiles, speedTilesPerSec}` (Aeris 3–6 ô). Trường chung `weakStunCooldownSec` 1,5 (QB-14), `phaseShiftSec` 0,6 (QB-31) ở ST-15-14. `rewardExp` theo mục 2.1 (241 / 388 / 564; mini-boss 110 / 185 / 270) | Telegraph pha 3 ≥ 0,5 s cho `focus.lockSec`, `shatter`, `twister`; sát thương ≤ `maxAttackDamage` theo màn; `reward` = `weaponGranted`, `weakness` = `bossWeakness` (có sẵn) |
| `03-Data/weapons.json` | `behavior` và `energyCostOf28` cho Prism Beam (`beam`, `cooldownSec` 0,3), Frost Shard (`shard`), Gale Cutter (`boomerang`, `maxCancelsPerThrow` 2) | Ngân sách năng lượng 14 ± 15%; sức mạnh khắc chế ≥ 12 (mục 2.3) |
| `03-Data/stages.json` | `expBudget` (660 / 1.101 / 1.602, GDD 10 mục 0); `enemyRewardMul {exp, coreBit}` mỗi màn (Stage 1 {1; 1}, Stage 2 {1,8; 1,8}, Stage 3 {3,0; 1,9}, Stage 4 {4,0; 2,0}); `checkpoints` 4 → 5 (CP3b); `checkpointMaxGapSec` (QB-111); `mechanics.laser` (`hurtsEnemies = false`, bỏ `enemyDamage`), `mirror`, `sensor`, `ice`, `crumble`, `wind` (thêm `hurtIgnores`), `cloud`, `coolant` | `exp`, `coreBit` ≥ 1; Σ EXP Thường của màn = `expBudget` ± 5% (mục 2.1); khoảng checkpoint theo mục 2.4; `laser.damage × 1,5 < 100`; `laser.pulse.onSec + warnSec < periodSec`; `crumble.triggerSec ≥ 0,5` |
| `03-Data/skills.json` | `rules.shieldPierceKinds` thêm loại đạn đòn đỉnh của Lumen và Aeris; `bulletKinds` không thêm tia (`beam`) | |
| `03-Data/tutorial.json` | Bước NOVA cho Stage 2–4 (mục 3.10, 4.10, 5.10) | Tín hiệu có trong `tutorial-config.ts` |
| `03-Data/ui.json` | Chữ "cần {vũ khí}" của Két khóa (nếu chưa có) | |
| `03-Data/player.json` | `nanoCell {max, healPct, useLockSec, refill}` (QB-50…54, ST-15-16); vị trí Nano Cell ở `stages.json` | Theo `17-Quy-tac-bien.md` mục 16 |
| `01-GDD/01-GDD-chinh.md` | Mục 8.2 và 9.1: trỏ tới tài liệu này | |
| `01-GDD/11-Do-kho.md` | Mục 2.6: bảng bản Thử thách Stage 2–4 (hoặc trỏ tới mục 3.4–3.6, 4.4–4.6, 5.4–5.6) | |
| `01-GDD/10-He-thong-RPG-Xuong.md` | Mục 2.2: trạng thái vô hiệu dùng chung Phase Step và Frost Shard; mục 2.3: Két Stage 2–4 như mục 3.8, 4.8, 5.8 | |
| `01-GDD/15-Nhiem-vu-phu.md` (bản 2, Approved) | Đã áp ở bản 2: đoạn thử Stage 3, 4 ở đầu đoạn C ngay sau CP2; Cirrus vào từ cạnh bên, ra mép trên, sàn an toàn trong vùng; Gương Rối A 1, B 2, C 2, D 1. Còn chờ: câu `hint` của nhiệm vụ `reach` viết theo cơ chế trượt (mục 4.3) và gió (mục 5.3) ở ST-18-08 | |
| `01-GDD/04-Can-bang-kinh-te.md` | Thêm mục EXP theo màn (mục 2.1 của tài liệu này: `expBudget`, `enemyRewardMul {exp, coreBit}`) | |
| `04-Dev-Plan/07-Ban-do-he-thong.md` | Dòng M5/M6/M7 Stage 2–4: "Approved (16-…), bản đồ `[SAU CỔNG]`"; danh mục tên chuẩn thêm id kẻ địch, đòn boss, cơ chế mới | |
| `05-Assets` | Danh sách P2 theo mục 7 | |

## 10. Story đề xuất (EP-15: Stage 2–4 trước cổng; EP-17: Stage 2–4 trên bản đồ)

Quy ước như EP-08 đến EP-10: Story ≤ 1–2 ngày, mỗi Story nhúng số liệu cần thiết và mã QB liên quan, Story có hình ảnh lưu ảnh chạy thử ở `04-Dev-Plan/qa/<mã Story>/` (Look Rule). Phòng thử dùng bản đồ ASCII (`layoutFromRows`) như 4 phòng thử Stage 1, **không phải bản đồ thật**. Story nào sửa `player-physics` (sàn trơn, gió) thì chờ cổng: thông số nhảy và lướt còn có thể đổi.

**Làm được trước cổng** (logic thuần, dữ liệu `[PLACEHOLDER]`, test Vitest; không đụng `player-physics`):

| Mã | Tên | Phụ thuộc | Cỡ |
| --- | --- | --- | --- |
| ST-15-01a | Dữ liệu Stage 2 và khung kiểm tra chung: `enemies`, `bosses`, `weapons` (Prism Beam), `stages` (`expBudget`, `enemyRewardMul {exp, coreBit}`), `mechanics.laser`, `mirror`, `sensor`; ngân sách năng lượng, sức mạnh khắc chế ≥ 12, telegraph, không chết một đòn, Σ EXP = `expBudget` ± 5%. **Xong 15/11/2026, phạm vi đổi theo duyệt:** dữ liệu kẻ địch, mini-boss, boss Stage 2 (`enemies`, `bosses`) dời sang Story làm hành vi của chúng (06, 07, 09, 10), vì bộ kiểm dữ liệu từ chối hành vi, đòn chưa có; có `stages` (`expBudget`, `enemyRewardMul`, nối vào thưởng, mini-boss không nhân), `mechanics.laser/mirror/sensor`, Prism Beam (`beam`, chưa cấp được tới 03), kiểm ngân sách, sức mạnh khắc chế, trần đòn boss theo màn, laser không chết một đòn, EXP cộng dồn theo cấp khuyến nghị; Σ EXP ± 5% là hàm thuần (`logic/stage/stage-exp.ts`) dùng khi có bản đồ | | 1 ngày |
| ST-15-01b | **Xong 21/11/2026.** Cấu hình và kiểm Frost Shard, `ice`, `crumble`, `coolant`. Người Tuyết Máy, Tháp Băng và Frost Titan đi cùng ST-15-06; dữ liệu Cryo đi cùng ST-15-11 để kiểm cùng hành vi | 01a | 0,5 ngày |
| ST-15-01c | Dữ liệu Gale Cutter, `wind`, `cloud`, `crumble.sink` (xong 21/11/2026) | 01a | 0,5 ngày |
| ST-15-02 | `LaserPath`, `LaserEmitter`, gương 2 góc, cảm biến mở cửa, dữ liệu Tiled và phòng thử laser. Đường tia dùng chung cho báo trước và sát thương. Góc ban đầu và vị trí gương khai báo theo bản đồ, chốt bố cục Stage 2 sau G1 (ST-17-01) | 01a | 2 ngày |
| ST-15-03 | Prism Beam (`beam`): bắn, phản xạ, xuyên, dừng ở khiên Lính Kén (QB-16, QB-18); `Barrier` nhận tia (rễ khô Két Stage 1) | 02 | 1,5 ngày |
| ST-15-04 | **Xong 21/11/2026.** API vô hiệu QB-19, Frost Shard `shard` và `CoolantFlow`. Phòng thử băng cho mượn vũ khí, dùng ba bậc một chiều để lên gờ. **Điều kiện của Phase Step (ST-08-09)** | 01b | 2 ngày |
| ST-15-05 | Gale Cutter (`boomerang`, hủy tối đa 2 đạn kẻ địch thường mỗi lần ném); sương lạnh = `Barrier` (Két Stage 3) | 01c | 1,5 ngày |
| ST-15-06 | Kẻ địch dùng lại hành vi: Gương Quang (`drone` + `bounces`, `bankShot`), Người Tuyết Máy (dữ liệu), Tháp Băng (`turret` + `lob`), Frost Titan (`golem` + `landShockwave`), kèm bản Thử thách Thêm dữ liệu và bản Thử thách của các kẻ địch này (dời từ 01a) | 01a, 01b | 2 ngày |
| ST-15-08a | `CrumblePlatform` (break, sink) và bệ mây trôi (đường hai điểm): phần cơ chế **không** đụng `player-physics` | 01b, 01c | 1 ngày |
| ST-15-09 | Mini-boss Prism Sentinel và Gale Roc dùng lớp `Boss` và bộ chuyển cho `LockedRoom` (Q1). Gió đẩy của Vỗ Cánh nối vào `WindZone` ở ST-15-08b. Thêm dữ liệu Prism Sentinel (từ 01a) và Gale Roc (từ 01c) | 01c, 02, 14, 15 | 2,5 ngày |
| ST-15-10 | Boss Lumen: `beam`, dịch chuyển, `focus` (Thử thách); mô phỏng bot; thêm dữ liệu Lumen (dời từ 01a). Phụ thuộc 03: thắng Lumen trước khi Prism Beam có hành vi thì Loadout không cấp và bản lưu không ghi vũ khí | 02, 03, 14 | 2 ngày |
| ST-15-13 | Phòng thử ASCII cho phần trước cổng (kẻ địch, cơ chế, mini-boss, Lumen), nối màn Chuẩn bị và hội thoại boss; tín hiệu hướng dẫn mới. Phòng của 07, 08b, 11, 12 thêm trong chính các Story đó | 02–06, 08a, 09, 10 | 1,5 ngày |
| ST-15-14 | **Boss an toàn:** `weakStunCooldownSec` 1,5 s chống khóa choáng (QB-14), `phaseShiftSec` 0,6 s khi một đòn vượt hai ngưỡng pha (QB-31); áp cả Thorna. **Xong 15/11/2026** (làm trước 01a: luật chung, `stories/EP-15-stage-2-4.md`) | 01a | 1 ngày |
| ST-15-15 | **Kẻ địch:** mini-boss báo trước ≥ 0,5 s (QB-21); tầm hoạt động dọc 7 ô, chỉ báo trước và bắn khi đã trên màn (QB-23) | 01a | 1 ngày |
| ST-15-16 | **Nano Cell và vật phẩm năng lượng** (QB-17, QB-50…54): dữ liệu và logic thuần; nút cảm ứng ở EP-14 | 01a | 1 ngày |

**Phải chờ cổng** (phụ thuộc cảm giác điều khiển hoặc `player-physics`):

| Mã | Tên | Phụ thuộc | Cỡ |
| --- | --- | --- | --- |
| ST-15-08b | Sàn trơn (gia tốc, ma sát theo loại ô) và `WindZone` trong `player-physics`, kèm `wind.hurtIgnores` (QB-07) | Qua cổng, 01b, 01c | 1,5 ngày |
| ST-15-07 | Thêm dữ liệu và hành vi Tháp Laser (`laserTurret`, từ 01a), Chim Cắt Gió (`diver`, từ 01c), Cối Xoáy (`fan`, từ 01c), kèm bản Thử thách. Có thể tách Tháp Laser làm sớm vì chỉ cần ST-15-02 | 02, 08b, 01c | 2,5 ngày |
| ST-15-11 | Boss Cryo: dữ liệu Cryo, `slam.slickFloorSec`, `shatter` (Thử thách); mô phỏng bot | 04, 08a, 08b, 14 | 2 ngày |
| ST-15-12 | Dữ liệu Aeris (từ 01c), hành vi bay, `shot.aim`, `gust`, `rain` + hút, `twister` (Thử thách) và mô phỏng bot. Cần ST-15-05 để cấp Gale Cutter khi thắng. Tầm với Aeris (độ cao bay 3–6 ô, lốc ≤ 2,5 ô) chốt ở ST-17-01 | 05, 08b, 14 | 2,5 ngày |
| ST-17-01 | Đo metric thật bằng thang khe trong phòng thử (có và không có gió, trên băng); chốt `ice.*`, `wind.*`, `crumble.triggerSec`, góc gương, độ cao bay và lốc Aeris, khe né đòn boss | Qua cổng, ST-15-08b, ST-15-13 | 1 ngày |
| ST-17-02 | Bản đồ Tiled Stage 2 (A–D, phòng boss, checkpoint theo độ khó gồm CP3b, CP-S3, bí mật, Két, Gương Rối); test đồ thị đường chính chỉ cần bộ động tác gốc + Arc Cannon | ST-17-01; EP-16 (Tiled, camera QB-120); Story checkpoint vùng chữ nhật (QB-40); tài liệu truyện Memory Log 2–4 (Q10) | 2 ngày |
| ST-17-03 | Bản đồ Tiled Stage 3 | Như ST-17-02; ST-15-11 | 2 ngày |
| ST-17-04 | Bản đồ Tiled Stage 4 (cuộn dọc, checkpoint vùng chữ nhật) | Như ST-17-02; ST-15-07, ST-15-12 | 2 ngày |
| ST-17-05 | Bước hướng dẫn NOVA Stage 2–4 trên bản đồ thật | ST-17-02…04 | 1 ngày |
| ST-17-06 | Cân bằng: tính lại `enemyRewardMul {exp, coreBit}` theo số kẻ địch thật (giữ Σ EXP = `expBudget` ± 5%); chốt máu boss bằng mô phỏng; chốt số bản Thử thách | ST-17-02…04 | 1 ngày |
| ST-17-07 | QA: chạy thử Chromium và Pixel 7 giả lập, ảnh Look Rule, nghiệm thu mục 3.12, 4.12, 5.12 | tất cả | 1 ngày |

**Tổng:** khoảng 21 ngày trước cổng (15 Story của EP-15) và 18,5 ngày chờ cổng (ST-15-07, 08b, 11, 12: 8,5 ngày; EP-17: 10 ngày), cộng 39,5 ngày. Bản 1 ghi 26 + 10 ngày: phần trước cổng giảm vì 4 Story dời sang chờ cổng, dù thêm ST-15-14…16 và tách ST-15-01.

- **Thứ tự trước cổng:** 01a → (01b, 01c) → 02 → (14, 15, 16) → (03, 04, 05, 06, 08a song song theo sức) → 09 → 10 → 13.
- **Thứ tự sau cổng:** 08b → 17-01 → 07 → 11 → 12 → (17-02, 17-03, 17-04) → 17-05 → 17-06 → 17-07.

## 11. Quyết định (chốt 14/11/2026, ủy quyền)

1. **Mini-boss chạy bằng lớp nào?** Chốt: Prism Sentinel và Gale Roc dùng lớp `Boss` (pha, hàng đợi đòn, kiểm telegraph, `exposed`), chạy trong phòng khóa qua bộ chuyển để `LockedRoom` đếm được. Frost Titan dùng hành vi `golem` (ST-15-06, ST-15-09).
2. **Thưởng kẻ địch theo màn.** Chốt: `stages.json → enemyRewardMul` tách `{exp, coreBit}`; EXP của màn khớp `expBudget` (mục 2.1).
3. **Lumen: Vine Lash phủ gương.** Chốt: không làm ở MVP.
4. **Gale Cutter hủy đạn.** Chốt: hủy `enemyShot`, `bomb` của kẻ địch thường, tối đa **2** mỗi lần ném; không hủy đạn mini-boss, boss (mục 5.7).
5. **Sát thương boss theo màn.** Chốt: 18 → 20 → 22 → 24 (mục 2.2).
6. **Laser môi trường gây sát thương kẻ địch?** Chốt: không, `laser.hurtsEnemies = false` (mục 3.3).
7. **Két Chân Mk I trong MVP.** Chốt: hiện, khóa, ghi "cần Quake Drill" (mục 5.8).
8. **Tên giáp.** Chốt: `leg_mk1` (như `stages.json`).
9. **Nhiệm vụ phụ.** Chốt: đếm, lưu, hiển thị theo `15-Nhiem-vu-phu.md` (bản 2). Đoạn thử Stage 3, 4 ở đầu đoạn C; CP2 cách mép vào ≤ 20 ô, khớp `zoneCheckpointMaxTiles`; CP-S2 sau mép đích (mục 4.8, 5.8).
10. **Nội dung Memory Log 2–4.** Chốt: viết tài liệu truyện riêng trước ST-17-02.
11. **Đổi góc gương.** Chốt: bằng đạn nạp vừa (mục 3.3).
12. **Frost Shard đóng băng kẻ địch thành bục?** Chốt: không ở MVP.
13. **Gió tác động đạn kẻ địch?** Chốt: không (mục 5.3).
14. **Đấu trường Aeris.** Chốt: giữ 24 × 12; Aeris bay ở độ cao 3–6 ô, Lốc Xoáy cao ≤ 2,5 ô (mục 5.6); kiểm ở phòng thử ST-15-12, chốt số ở ST-17-01.
15. **Khoảng Thử thách ở ranh giới.** Chốt: thiết kế theo thời gian thiết kế; đợt MVP đo trung vị thời gian thật; khoảng nào vượt 4,5 phút thì rút ngắn đoạn (mục 2.4).

### 11.1 Rủi ro còn lại

- **Vòng khắc chế mỏng:** vũ khí khắc chế chỉ mạnh khoảng 1,6 × Arc Cannon và bị `weakStunCooldownSec` cắt bớt choáng. Đo bằng mô phỏng ở ST-15-10…12.
- **Stage 4 dồn rủi ro cảm ứng:** gió, bệ mây, cuộn dọc, Aeris bay và Chim Cắt Gió bổ nhào cùng một màn. Đo riêng số lần hỏng trên cảm ứng ở đợt MVP.
- **Khối lượng:** EP-15/17/18 khoảng 50 ngày (39,5 ở mục 10 + 10,5 của EP-18; bản 1 ước 46 ngày, trước khi thêm ST-15-14…16). Cổng đổi thông số nhảy hoặc lướt thì phải làm lại EP-17.

## 12. Kết quả duyệt

Duyệt độc lập 14/11/2026, người dùng giao toàn quyền nên trạng thái là "Approved (ủy quyền)".

| Người duyệt | Điểm | Đã sửa |
| --- | --- | --- |
| Creative Director | EXP theo "cấp khuyến nghị thấp của màn kế" lệch `expBudget` (GDD 10 mục 0); một hệ số cho cả EXP và Core Bit không khớp được cả hai | Mục 1, 2.1, 2.2, 3.4–3.6, 4.4–4.6, 5.4–5.6, 6, 9: tách `{exp, coreBit}`, EXP mỗi màn 660 / 1.101 / 1.602, kiểm ± 5% lúc nạp |
| Creative Director | Vòng khắc chế mỏng: Prism Beam 0,45 s chỉ 8,3/s khi đánh Cryo | Mục 2.3, 3.7: bất biến ≥ 12/s, `cooldownSec` 0,3; trỏ QB-14 |
| Creative Director | Lốc Xoáy cao 3 ô chật trong đấu trường 12 ô; Aeris bay tới 7 ô khó với | Mục 5.6: Aeris 3–6 ô, lốc ≤ 2,5 ô |
| Creative Director | Đoạn thử Cirrus cần vào từ cạnh bên, sàn an toàn; CP2 phải gần mép vào | Mục 4.8, 4.9, 5.8, 5.9 |
| Technical Director + Producer | Khoảng CP3 → CP4 ở Thường 3,0–4,0 phút, vượt 150 s (QB-111); Stage 2 thiếu checkpoint Cốt truyện giữa D | Mục 1, 2.4, 3.2, 3.9, 4.2, 4.9, 5.2, 5.9: CP3b, CP-S3 Stage 2, "> 90 s" |
| Technical Director + Producer | Prism Beam gặp khiên chưa có luật; gió đẩy Kai khi bị đánh | Mục 3.7 (QB-16, QB-18); mục 5.3, 5.11 (`wind.hurtIgnores`, QB-07) |
| Technical Director + Producer | Dọn dẹp: laser hại kẻ địch thêm cơ chế; trỏ cũ về nhiệm vụ phụ; dòng "Tên giáp lệch"; Thorna 60–90 s | Mục 3.3 (`hurtsEnemies = false`), 1.1, 8, 9, 2.2 (45–65 s) |
| Technical Director + Producer | Story: ST-15-08 sửa `player-physics` trước cổng; phụ thuộc ghi bằng số trơn; thiếu Story cho QB-14, 21, 23, 31, 17, 50…54 | Mục 10: tách 01a–c và 08a/b; 07, 08b, 11, 12 chờ cổng; thêm ST-15-14…16; phụ thuộc EP-16, QB-40, Memory Log |
