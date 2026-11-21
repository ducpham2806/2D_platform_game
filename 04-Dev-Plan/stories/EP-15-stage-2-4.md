# EP-15: Stage 2–4 trước cổng

- **Mốc:** S10–S14 (`01-Ke-hoach-lam-viec.md`). Phần không đụng `player-physics` của `01-GDD/16-Dac-ta-Stage2-4-nhap.md` mục 10; danh sách Story, phụ thuộc và cỡ ở đó. ST-15-07, 08b, 11, 12 chờ cổng G1.
- **Không đụng bản thử G1:** code ở nhánh làm việc, chỉ merge vào `main` sau đợt thử G1.

| Mã        | Tên                                                                                                | Phụ thuộc                                              | Cỡ     | Trạng thái        |
| --------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------ | ----------------- |
| ST-15-14  | Boss an toàn: chống khóa choáng (QB-14), kẹp pha khi một đòn vượt hai ngưỡng (QB-31); áp cả Thorna | (01a chỉ để có boss Stage 2; phần luật làm trước được) | 1 ngày | DONE (15/11/2026) |
| ST-15-01a | Dữ liệu Stage 2 và khung kiểm tra chung                                                            | —                                                      | 1 ngày | DONE (15/11/2026) |
| ST-15-01b | Cấu hình Frost Shard, sàn trơn, bục băng vỡ và dòng chất làm mát                                  | 01a                                                    | 0,5 ngày | DONE (21/11/2026) |
| ST-15-01c | Cấu hình Gale Cutter, gió và bệ mây                                                             | 01a                                                    | 0,5 ngày | DONE (21/11/2026) |
| ST-15-02  | Laser, gương, cảm biến ánh sáng                                                                    | 01a                                                    | 2 ngày | DONE (21/11/2026) |
| ST-15-03  | Prism Beam phản xạ, xuyên địch và đốt rễ khô                                                       | 02                                                     | 1,5 ngày | DONE (21/11/2026) |
| ST-15-04  | Frost Shard, vô hiệu theo QB-19 và dòng làm mát đóng băng                                         | 01b                                                    | 2 ngày | DONE (21/11/2026) |

## ST-15-14: Boss an toàn (QB-14, QB-31)

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 (điều kiện của mọi vũ khí khắc chế Stage 2–4) · **Trạng thái:** DONE (15/11/2026) · **Phụ thuộc:** không (GDD 16 ghi 01a vì boss Stage 2; luật chung làm trước và áp cho Thorna)
- **Bằng chứng:** [x] Logic (`tests/boss-safety.test.ts`, 16 test mang mã QB) [x] Config (`bosses.json → rules`) [x] Visual (boss trắng lúc bất tử đổi pha, `04-Dev-Plan/qa/ST-15-14/`)

### 1. User Story

> **Là** người chơi cầm vũ khí khắc chế bắn nhanh, **tôi muốn** boss vẫn ra đòn giữa các lần choáng, **để** trận đấu không biến thành đứng bắn một chỗ; **và** khi một đòn rất mạnh làm boss tụt nhiều máu, **tôi muốn** vẫn thấy từng pha của boss, không bỏ qua pha nào.

### 2. Bối cảnh (nhúng)

- **QB-14:** trúng điểm yếu vẫn ×2,5 sát thương, nhưng sau khi hết choáng thì `weakStunCooldownSec` (1,5 s) không choáng lại được. Choáng không xóa hạt Hoa Nở đã thả.
- **QB-31:** một đòn vượt qua hai ngưỡng pha: máu kẹp ở ngưỡng kế tiếp; boss bất tử `phaseShiftSec` (0,6 s) để đổi pha và xóa đạn boss.
- GDD 16 mục 2.3, 3.7: hồi bắn 0,3–0,4 s ngắn hơn `weakStunSec` 0,5 s, nên bắn liên tục khóa choáng boss. Tham số chung ở `bosses.json` (`17-Quy-tac-bien.md` mục 16).
- GDD 12 (âm thanh): `boss.phase` phát một lần dù một đòn vượt hai ngưỡng; lớp nhạc theo pha sau khi kẹp.
- **Code hiện tại** (`logic/boss/boss.ts`): `takeHit` đặt `stun = max(stun, stunSec)`, nên mỗi phát trúng điểm yếu trong lúc choáng **làm mới** choáng; không có hồi choáng; không kẹp máu theo pha.

### 3. Quyết định (sau duyệt Technical Director 15/11, "Duyệt kèm sửa", 8 điểm bắt buộc đã áp)

- Dữ liệu `bosses.json → rules { weakStunCooldownSec: 1.5 (≤ 5), phaseShiftSec: 0.6 (≤ 2) }`, dùng chung mọi boss (kể cả bản Thử thách, bản nhân máu theo độ khó). `parseBosses` bỏ qua khóa `rules` khi đọc boss và gắn `rules` vào từng `BossData`.
- **Choáng (QB-14):** chỉ bắt đầu choáng khi boss **không đang choáng** (cả choáng điểm yếu lẫn choáng sau Mưa đạn, Hoa Nở; duyệt điểm 1: trước đó trúng điểm yếu lúc choáng sau Hoa Nở kéo dài khoảng hở thêm 0,5 s) và hết hồi choáng. Trúng trong lúc choáng không làm mới choáng. Hết choáng thì đếm hồi choáng; hồi choáng chỉ trôi ở bước boss chạy bình thường. Sát thương ×2,5 giữ nguyên. Choáng không đụng tới đạn trong pool (hạt Hoa Nở đã thả vẫn rơi).
- **Kẹp pha (QB-31):** trong `takeHit`, so máu sau đòn với **pha đang chơi** (`this.phase`, chỉ đổi ở `step`). **Chết tính là pha sau pha cuối** (duyệt điểm 2), nên đòn chí mạng ở pha áp chót cũng kẹp; ở pha cuối thì chết bình thường. Rơi cách pha đang chơi từ 2 trở lên thì máu = min(máu hiện có, ngưỡng kết thúc pha đang chơi × (1 − 1e-12)): boss sang đúng pha kế, không bao giờ hồi máu. Hai đòn cùng bước 100 → 55 → 25: đòn sau gây 0 và kẹp (duyệt điểm 3). Khi kẹp: bất tử `phaseShiftSec`, đứng yên, vẽ trắng suốt (gợi ý duyệt: người chơi thấy vì sao đạn không vào), bỏ đòn đang dở (về `idle`; xóa vệt Rễ Đuổi, cột rễ, cột mưa). `StageWorld` xóa mọi đạn boss (`owner: 'enemy'` không có `source`) **ngay trong bước đó**, sau khi xử lý đạn Kai và trước khi xét đòn lên Kai. Vượt đúng một ngưỡng thì như cũ (không đổi cân bằng Thorna).
- Trong lúc bất tử, đạn của Kai trúng boss thì mất, phát **`ev.bossImmune`** (duyệt điểm 4: không dùng `blocked`, vì hướng dẫn S06 đếm `blocked` là thất bại ở khiên và âm "keng" dùng để dạy khiên), không sát thương, không choáng, không Trừng Phạt; nổ lan V2 không trừ máu boss.
- **Đo lường** (duyệt điểm 6): `dmg` của `boss_end` ghi máu boss thật bị trừ: đòn kẹp chỉ tính tới ngưỡng, phần thừa của đòn kết liễu không tính (trước đây có). Ghi ở GDD 13.
- **Bản thử G1** (duyệt điểm 7): bản sau thay đổi này khác `gate-r1` ở trận đấu lại boss xám bằng Vine Lash (hồi 0,35 s < choáng 0,5 s: trước đây khóa choáng mãi). Đợt thử dùng bản Pages = `gate-r1`; ghi ở `05-Cong-Prototype.md` mục 3.
- **Chưa làm** (gợi ý duyệt, để mô phỏng ST-15-10…12 quyết): hit-stop 3 bước và rung khi trúng điểm yếu vẫn chạy ở mọi phát trong lúc hồi choáng (vũ khí 0,3 s thì khoảng 17% thời gian dừng hình).

### 4. Tiêu chí nghiệm thu

1. [x] Test QB-14: bắn điểm yếu mỗi 0,3 s trong 6 s: có khoảng không choáng ≥ 1,5 s, boss vẫn ra đòn, máu trừ đủ; trúng lúc choáng không kéo dài; hồi choáng rồi choáng lại; ×`damageVsWeak`; hạt Hoa Nở còn; trúng điểm yếu lúc choáng sau Hoa Nở không kéo dài khoảng hở.
2. [x] Test QB-31: 100% → 20%: kẹp 60%, pha 2 báo một lần, bất tử đúng 0,6 s, hết thì nhận sát thương; vượt một ngưỡng: không kẹp; đòn chí mạng ở pha đầu, pha áp chót kẹp, pha cuối chết; hai đòn cùng bước; máu ×0,8 / ×1 / ×1,25; Thử thách đang đánh dấu Rễ Đuổi thì bỏ vệt; hồi choáng và bất tử không ảnh hưởng nhau; đạn Kai lúc bất tử: `bossImmune` không `blocked`, không Trừng Phạt, nổ lan V2 không trừ máu, đo lường = máu thật bị trừ; trong StageWorld: đạn boss đè lên Kai bị xóa ngay bước kẹp (Kai không mất máu), đạn kẻ địch thường còn, `bossPhaseChanged` một lần.
3. [x] `core/boss-config.ts` kiểm `rules`; test lỗi dữ liệu.
4. [x] Test cũ đạt, trừ một test cố ý dùng đòn từ pha đầu xuống 0 (`tests/boss.test.ts`, "hết máu"): sửa cho boss vào pha cuối trước. Mô phỏng DPS (`power-cap.test.ts`) và `gate-flow` đạt.
5. [x] Chạy thử Chromium: phòng Thorna, một đòn 80% máu: thanh máu dừng 60%, "pha 2", boss trắng 0,6 s rồi trở lại; 0 lỗi console.

### 5. File

- Sửa: `03-Data/bosses.json`, `game/src/core/boss-config.ts`, `game/src/logic/boss/boss.ts`, `game/src/logic/combat/projectiles.ts` (`removeWhere`), `game/src/logic/world/{hits,stage-world,world-types}.ts` (`bossImmune`), `game/src/scenes/stage/stage-renderer.ts` (trắng lúc bất tử), `game/tests/boss.test.ts`, `01-GDD/17-Quy-tac-bien.md` (QB-14, 31, mục 16), `01-GDD/16-Dac-ta-Stage2-4-nhap.md`, `01-GDD/13-Do-luong-MVP.md` (`dmg`), `04-Dev-Plan/05-Cong-Prototype.md`, `game/docs/quyet-dinh/ke-dich-boss.md`.
- Tạo: `game/tests/boss-safety.test.ts`, `04-Dev-Plan/qa/ST-15-14/`.

## ST-15-01a: Dữ liệu Stage 2 và khung kiểm tra chung

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 · **Trạng thái:** DONE (15/11/2026) · **Phụ thuộc:** không
- **Bằng chứng:** [x] Config (`stages.json`, `weapons.json`, `bosses.json → rules`, `core/*-config.ts`) [x] Logic (Vitest `tests/stage-data.test.ts`, 14 test) [x] Không có thay đổi người chơi thấy (Stage 1 có `enemyRewardMul` = 1; Prism Beam chưa cấp được); `gate-flow` đạt

### 1. User Story

> **Là** người làm game, **tôi muốn** số liệu Stage 2–4 dùng chung (thưởng theo màn, cơ chế laser, Prism Beam) được nạp và kiểm lúc mở game, **để** các Story Stage 2 sau đó chỉ việc dùng số đã kiểm, và một chỉnh số sai (vũ khí quá mạnh, đòn chết một phát, EXP lệch cấp) bị chặn ngay.

### 2. Bối cảnh (nhúng từ GDD 16 mục 2.1–2.3, 3.3, 3.7)

- **Thưởng theo màn:** `expBudget` Stage 1–4 = 332 / 660 / 1.101 / 1.602 (mỗi màn +2 cấp theo `40 × L^1,4`: cấp 4 / 6 / 8 / 10, nằm trong cấp khuyến nghị màn kế). `enemyRewardMul {exp, coreBit}` = {1, 1} / {1,8, 1,8} / {3,0, 1,9} / {4,0, 2,0}. Thưởng kẻ địch = round(base × `enemyRewardMul` × `difficulty.rewardMul`), base > 0 thì ≥ 1; mini-boss, boss, rương không nhân. Σ EXP Thường của màn = `expBudget` ± 5% (kiểm khi màn có bản đồ).
- **Boss:** đòn lớn nhất ≤ `18 + 2 × (n − 1)` (n là số màn): 18 / 20 / 22 / 24; Thử thách × 1,5 vẫn < 100.
- **Vũ khí:** ngân sách = floor(`energyMax` / `energyCostOf28`) × `damageMul` × trúng mỗi lần, mục tiêu 14 ± 15%. Sức mạnh khắc chế = `damageMul` × trúng mỗi lần × `damageVsWeak` / `cooldownSec` ≥ 12/s. Vine Lash: 14 và 14,3/s; Prism Beam: 13,5 và 12,5/s.
- **Cơ chế Stage 2:** `laser { damage 20, beamWidthPx 4, knockbackTilesPerSec 5, hitsPerActivation 1, hurtsEnemies false, pulse { periodSec 3, onSec 1,2, warnSec 0,5 } }`, `mirror { toggleMinCharge "mid", rotateSec 0,25, maxBounces 4 }`, `sensor { holdSec 0,3 }`.
- **Prism Beam:** `beam` (`rangeTiles 12`, `widthPx 4`, `activeSec 0,12`, `cooldownSec 0,3`, `damageMul 1,5`, `maxBounces 3`), `energyCostOf28 3`.

### 3. Quyết định

- **Dời dữ liệu kẻ địch, mini-boss, boss Stage 2** (Gương Quang, Tháp Laser, Prism Sentinel, Lumen) sang Story làm hành vi của chúng (ST-15-06, 07, 09, 10). Lý do: `enemies.json`, `bosses.json` kiểm chặt hành vi và đòn (`laserTurret`, `beam`, `focus`, `bounces`, `bankShot` chưa có); thêm dữ liệu bây giờ buộc phải nới kiểm tra, trái quy tắc "dữ liệu mới phải có kiểm tra". Σ EXP Stage 2 vẫn kiểm được bằng hàm thuần với bảng 3.4 của GDD.
- `stages.json`: `expBudget`, `enemyRewardMul` cho màn đã có đặc tả (1–4; không bắt buộc với 5–8). `mechanics.laser`, `mirror`, `sensor` nạp và kiểm, chưa dùng (ST-15-02).
- `enemyRewardMul` nối luôn vào thưởng kẻ địch (`EnemyField`): một lần làm tròn trên tích `enemyRewardMul × rewardMul`. Stage 1 = 1 nên không đổi gì; phòng thử không thuộc màn chiến dịch dùng 1.
- `weapons.json`: Prism Beam có `energyCostOf28 3` và `behavior.type = "beam"`. Loadout chỉ cho cầm vũ khí có hành vi **đã làm** (`sweep`); `beam` coi như chưa làm (không cấp được) tới ST-15-03.
- Ngưỡng kiểm ở dữ liệu: `weapons.json → balance { budgetTarget 14, budgetTolerance 0.15, minCounterPerSec 12 }`; `bosses.json → rules.maxAttackDamage { base 18, perStage 2 }`.
- Kiểm thêm lúc nạp (`checkDesignInvariants`): ngân sách và sức mạnh khắc chế của mọi vũ khí có hành vi; đòn boss ≤ trần theo màn (boss đã có dữ liệu, cả Thử thách × hệ số độ khó khó nhất vẫn < máu cấp 1); laser, gai, hố không chết một đòn ở độ khó khó nhất; cấp sau khi cộng dồn `expBudget` tới màn k nằm trong cấp khuyến nghị màn k+1; báo trước của laser theo nhịp ≥ 0,5 s.
- Hàm thuần `stageExpTotal(enemies, mul, miniBossExp, bossExp)` và `checkStageExp` (± 5%), dùng khi màn có bản đồ (EP-17).

### 3b. Sửa theo duyệt Technical Director + Producer (15/11, "Duyệt kèm sửa", 8 điểm đã áp)

1. Mini-boss của màn không nhân `enemyRewardMul` (Golem, sau này Frost Titan đi qua `EnemyField`): `StageReward { mul, exempt: [campaign.miniBoss] }`; nếu không, Frost Titan cho 185 × 3,0 = 555 EXP.
2. Hệ số tách `{exp, coreBit}`, nhân hệ số độ khó trước rồi làm tròn một lần (`base × (màn × độ khó)`, thứ tự cố định); lấy từ `def.campaign`, không phụ thuộc bản lưu.
3. ST-15-10 (Lumen) thêm phụ thuộc 03: thắng Lumen khi Prism Beam chưa có hành vi thì không cấp được và bản lưu không ghi vũ khí.
4. Màn đã có đặc tả (`expectedMin`) bắt buộc có `expBudget`, `enemyRewardMul`.
5. `enemyRewardMul` ≥ 1 (GDD 16 mục 9).
6. Sức mạnh khắc chế chỉ kiểm vũ khí có `cooldownSec` > 0 (Gale Cutter kiểm khi làm Terra).
7. Báo trước tối thiểu của laser lấy từ dữ liệu (`mechanics.minTelegraphSec` 0,5), không viết cứng.
8. GDD 16 mục 10: dòng 01a ghi phạm vi mới; 06, 07, 09, 10 nhận phần dữ liệu dời sang.

- Gợi ý đã làm: `grant` dùng `PLAYABLE_BEHAVIORS`; đổi tên `ChargeLevel` ở cấu hình gương thành `MirrorCharge` (trùng tên trong `loadout.ts`). Ghi lại: ngân sách năng lượng kiểm ở `energyMax` gốc (28), Energy Cell tăng thêm là chủ ý.

### 4. Tiêu chí nghiệm thu

1. [x] Dữ liệu nạp được; mỗi trường mới có test lỗi dữ liệu.
2. [x] Σ EXP Stage 2 theo bảng 3.4 (11, 18, 14, 25 mỗi con) + 110 + 241 = 660; lệch 11,4% thì báo lỗi, 3,8% thì đạt.
3. [x] Thưởng kẻ địch: Lính Kén Stage 1 Cốt truyện 7 / 3, Stage 2 Thường 25 / 11, Stage 4 Thử thách 84 / 18; `EnemyField` nhân hệ số màn, Golem (mini-boss) không nhân.
4. [x] Vine Lash 14 và 14,3/s, Prism Beam 13,5 và 12,5/s; `cooldownSec` 0,45 báo 8,3/s < 12; tiêu hao 2 báo vượt ngân sách.
5. [x] Cộng dồn ra cấp 4 / 6 / 8 / 10; Stage 2 cho 3.000 EXP thì báo lỗi; trần đòn boss 18 / 20 / 22 / 24, Thorna 19 hoặc bản Thử thách va chạm 25 thì báo lỗi; laser 100 thì báo lỗi.
6. [x] Prism Beam không cấp được; 541 test đạt, `gate-flow` đạt.

### 5. File

- Sửa: `03-Data/stages.json`, `03-Data/weapons.json`, `03-Data/bosses.json`, `game/src/core/game-config.ts` (`StageData`, kiểm tra), `game/src/core/stage-mechanics-config.ts`, `game/src/core/weapons-config.ts`, `game/src/core/boss-config.ts`, `game/src/logic/combat/loadout.ts`, `game/src/logic/world/{enemy-field,stage-world}.ts`, `game/src/scenes/stage-scene.ts` (truyền `stageReward`), `01-GDD/16-Dac-ta-Stage2-4-nhap.md` (bảng Story), `game/docs/quyet-dinh/man-choi.md`.
- Tạo: `game/src/logic/stage/stage-exp.ts`, `game/tests/stage-data.test.ts`.

## ST-15-02: Laser, gương và cảm biến ánh sáng

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 · **Trạng thái:** DONE (21/11/2026) · **Phụ thuộc:** ST-15-01a · **Engine:** Phaser 3.90.0.
- **Bằng chứng:** 25 test cho logic, dữ liệu Tiled và tích hợp StageWorld; ảnh và quy trình phòng thử trong [QA ST-15-02](../qa/ST-15-02/README.md).

### 1. User Story

> **Là** người chơi Stage 2, **tôi muốn** nhìn được đường đi của laser và xoay gương bằng Arc Cannon, **để** né tia và dẫn ánh sáng tới cảm biến mở cửa.

### 2. Bối cảnh

- GDD 16 mục 3.3, 3.11, 3.12. Laser đi thẳng, dừng tại ô đặc, vật chắn, cửa đóng hoặc mép bản đồ. Gương `/` và `\` đổi hướng 90° từ cả hai mặt. Tia dội về nguồn hoặc vượt giới hạn phản xạ thì dừng. Vạch báo và sát thương dùng cùng đường tia.
- `stages.json → mechanics`: laser 20 máu ở Thường (nhân `damageTaken`), tia 4 px, bật lùi vuông góc 5 ô/s, một lần trúng mỗi xung. Chu kỳ 3 s, bật 1,2 s, báo trước 0,5 s, lệch pha 0–1 theo nguồn. Tia luôn bật trả Kai về chỗ an toàn. Laser thuộc nhóm mối nguy môi trường (QB-02, QB-22): bỏ qua bất tử của lướt và khiên C3, không tính sượt đạn, không hại kẻ địch.
- Đạn nạp vừa hoặc đầy đổi góc gương, đạn thường bị hấp thụ. Khóa đổi góc trong 0,25 s. Đường tia tính lại ở bước kế tiếp, cảm biến đang tích sáng đếm lại. Tối đa 4 lần phản xạ. Cảm biến nhận tia đang bật liên tục trong 0,3 s thì mở cửa trong cả lượt (QB-47). Hồi sinh đặt lại gương và tiến độ chưa đủ, cửa đã mở giữ nguyên (QB-42, QB-43).
- `WorldEvents`: `mirrorToggled`, `sensorActivated`, `laserHit` cho hiệu ứng và âm thanh về sau.

### 3. File và phạm vi

- `logic/stage/laser-path.ts`, `logic/world/stage-optics.ts`: đường tia và trạng thái nguồn, gương, cảm biến, cửa.
- `logic/stage/{layout,tiled}.ts`, `logic/world/{stage-world,world-types}.ts`, `logic/player/player-physics.ts`: khai báo Tiled, bước mô phỏng và sát thương môi trường.
- `stages/`, `scenes/stage/mechanics-renderer.ts`, `maps/`: phòng thử laser và hình khối gỡ lỗi.
- `tests/stage-optics.test.ts`: kiểm hình học, bảng thời gian, va chạm và luồng phòng thử.

### 4. Tiêu chí nghiệm thu

1. [x] Kiểm đường tia với 0, 1, 2, 4 phản xạ, vật chắn và vòng khép kín; hộp va chạm trùng đường báo.
2. [x] Kiểm chu kỳ, lệch pha và thời lượng báo; một cú trúng mỗi xung, bật lùi vuông góc; tia luôn bật trả Kai tới chỗ đứng an toàn.
3. [x] Kiểm đạn thường, tự bắn, đạn nạp và hai phát trong cùng bước; cảm biến cần đủ thời gian liên tục, cửa giữ mở sau hồi sinh.
4. [x] Chạy qua phòng thử từ menu trên máy tính và Pixel 7 giả lập, lưu ảnh. Chạy test, lint, format, typecheck, build, docs-check và gate-flow.

### 5. Ngoài phạm vi

- ST-15-03 thêm vũ khí Prism Beam. ST-15-06, 07, 09, 10 thêm đòn địch dùng phản xạ. EP-17 làm bản đồ Stage 2 và kiểm đường chính sau G1.

### 6. Đóng Story

- Tự rà soát thay đổi. Bố trí góc gương và vị trí nguồn trong phòng thử là tham số; bố cục Stage 2 chốt ở ST-17-02.
- Đã chơi thử Chromium trên PC và Pixel 7 giả lập. Bằng chứng chơi thử G1 với người thật được ghi ở cổng Prototype.

## ST-15-03: Prism Beam

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 · **Phụ thuộc:** ST-15-02 · **Engine:** Phaser 3.90.0.
- **Trạng thái:** DONE (21/11/2026) · **Bằng chứng:** 12 test và [ảnh phòng thử](../qa/ST-15-03/README.md).

### 1. User Story

> **Là** người chơi dùng Prism Beam, **tôi muốn** tia xuyên mục tiêu và dội qua gương, **để** đánh theo góc và mở lối bị chắn bằng ánh sáng.

### 2. Bối cảnh

- GDD 16 mục 3.7: dùng `LaserPath`, xuyên từng mục tiêu đúng một lần mỗi phát. Tầm tổng qua các đoạn 12 ô, rộng 4 px, vẽ 0,12 s, hồi 0,3 s, sát thương ×1,5, tối đa 3 lần phản xạ; số lấy từ `weapons.json`. Tốn 3/28 năng lượng (QB-11…13); điểm yếu Cryo ×2,5, choáng 0,5 s (QB-14, QB-31).
- Tia dừng ở mặt trước khiên Lính Kén, tính một lần `shieldHits` kể cả cú làm vỡ khiên. Đánh mặt sau xuyên tiếp (QB-16, QB-18). Tia phản xạ giữ nguyên góc gương và bỏ qua Kai.
- Cảm biến nhận một xung Prism Beam đủ để mở cửa trong lượt (QB-47). Chu kỳ 0,3 s và độ dài xung 0,12 s không thể đáp ứng thời gian sáng liên tục 0,3 s của laser môi trường. Rễ khô nhận tia khi đường tia tới mặt chắn và mở lối để lần sau bắn qua.

### 3. Phạm vi

- `WeaponLoadout`, `LaserPath`, xử lý trúng đòn, `StageWorld`, `StageOptics`, `Barrier`, renderer và phòng thử laser.
- Phòng thử cho mượn Prism Beam trong lượt. Việc nhận vũ khí từ Lumen và bố cục Stage 2 thuộc ST-15-10 và ST-17-02.

### 4. Tiêu chí nghiệm thu

- [x] Kiểm năng lượng, hồi bắn, bắn dội qua 1–3 gương, tổng tầm, mỗi mục tiêu một lần và tự dội về.
- [x] Kiểm khiên mặt trước/mặt sau, báo sát thương boss, tường, rễ khô và cảm biến sau gương.
- [x] Kiểm luồng bàn phím và Pixel 7 giả lập, chụp ảnh. Test, lint, format, build, docs-check và gate-flow đạt.

### 5. Đóng Story

- Tự rà soát và kiểm luồng trên Chromium. Vệt tia được giữ ở vị trí bắn để thể hiện đúng đường va chạm của phát đó.
- Prism Beam cho mượn ở phòng thử trong lượt. Mở khóa trong chiến dịch qua Lumen ở ST-15-10.

## ST-15-01b: Dữ liệu Frost Shard và cơ chế băng

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 · **Trạng thái:** DONE (21/11/2026) · **Phụ thuộc:** ST-15-01a · **Engine:** Phaser 3.90.0.
- **Bằng chứng:** kiểm thử dữ liệu và kiểm hồi quy Loadout trong `game/tests/stage-data.test.ts`.

### 1. User Story

> **Là** người phát triển ST-15-04, **tôi muốn** đọc cấu hình băng đã được kiểm tra khi nạp game, **để** triển khai Frost Shard và dòng chất làm mát từ dữ liệu chung.

### 2. Bối cảnh

- GDD 16 mục 2.3, 3.8, 4.3, 4.7. Frost Shard có hành vi dữ liệu `shard`: tốc độ 10 ô/s, tầm 10 ô, kích thước 8 × 6 px, sát thương ×2, hồi bắn 0,4 s, đóng băng 2 s, tiêu hao 4/28. Sức mạnh khắc chế Aeris ×2,5 và choáng 0,5 s. Ngân sách 14 sát thương/thanh và 12,5 sát thương/giây khi khắc chế.
- `ice` dùng gia tốc 12 và giảm tốc 6 ô/s², bị đánh dùng ma sát thường. `crumble` kích hoạt sau 1 s, mốc nứt 0,4 / 0,7 s, mọc lại 4 s. `coolant.frozenSteps = 3` (Két Thân Mk I, Stage 2).
- QB-19: ST-15-04 dùng `freezeSec` cho trạng thái `disabledSec`, lấy thời gian lớn hơn khi gặp Phase Step, boss và mini-boss miễn. ST-15-01b chỉ nạp và kiểm dữ liệu.

### 3. Phạm vi và nghiệm thu

- [x] Thêm cấu hình vào `03-Data/{weapons,stages}.json`, nối vào bộ kiểm tra khi nạp game. Mốc nứt theo thứ tự và nằm trước lúc vỡ; số bậc đông là số nguyên dương.
- [x] Frost Shard tham gia kiểm ngân sách và sức mạnh khắc chế. Loadout chỉ cấp vũ khí sau khi hành vi có mã chạy.
- [x] Dữ liệu Người Tuyết Máy, Tháp Băng và Frost Titan đi cùng ST-15-06 (hành vi và bản Thử thách); Cryo đi cùng ST-15-11 (`slickFloorSec`, `shatter` và mô phỏng). Giữ dữ liệu ứng viên trong đặc tả như ST-15-01a.

## ST-15-04: Frost Shard, vô hiệu và dòng làm mát

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 · **Trạng thái:** DONE (21/11/2026) · **Phụ thuộc:** ST-15-01b · **Engine:** Phaser 3.90.0.

### 1. User Story

> **Là** người chơi cầm Frost Shard, **tôi muốn** dùng một phát đạn để đóng băng kẻ địch hoặc dòng chất làm mát, **để** có thời gian đi qua và mở đường lên Két Thân Mk I.

### 2. Bối cảnh và quyết định

- GDD 16 mục 3.8, 4.7: bắn thẳng, một mục tiêu, ×2 sát thương, 10 ô/s, tầm 10 ô, 4 năng lượng, hồi 0,4 s. Trúng địch thường làm vô hiệu 2 s; khiên Lính Kén chặn phía trước, giữ cách tính đòn khắc chế boss hiện có.
- QB-19: `Enemy.disable` dùng `max(thời gian còn lại, thời gian mới)` cho đạn băng và choáng dùng chung. Kẻ địch thường dừng di chuyển, đếm nhịp tấn công và sát thương chạm thân trong lúc vô hiệu, vẫn nhận đòn; boss và mini-boss miễn. Đồng hồ hiệu lực tiếp tục khi ra khỏi tầm hoạt động. Hiệu ứng đóng băng có chỉ báo riêng để Phase Step dùng cùng API mà không hiện băng.
- Tiled `coolant` là vùng ô trống. Frost Shard chạm dòng lỏng thì viên đạn bị giữ lại, tạo `coolant.frozenSteps` mặt đứng một chiều trải đều từ trên xuống, tồn tại tới hết lượt (QB-47). Giữ bậc khi chết/hồi sinh; dựng màn mới thì về dạng lỏng.

### 3. Tiêu chí nghiệm thu

- [x] Đạn dùng thông số từ dữ liệu, trừ năng lượng đúng và kiểm đạn chạm khiên, địch thường, mini-boss, boss, tường.
- [x] Kiểm QB-19 theo cả hai thứ tự áp dụng, hiệu lực hết đúng thời gian, kẻ địch đóng băng không thành bục.
- [x] Dòng lỏng vô hại. Chỉ Frost Shard làm đông, bậc đứng được và tồn tại khi hồi sinh.
- [x] Tự rà soát và kiểm thử trên Chromium bằng bàn phím và Pixel 7 giả lập. Phòng thử cho mượn vũ khí và giữ tiến trình trong lượt. [Ảnh kiểm thử](../qa/ST-15-04/README.md)

Phase Step gọi chung API khi triển khai ST-08-09. Mở khóa vũ khí qua Cryo ở ST-15-11, đặt Két Thân Mk I ở ST-17-02.

## ST-15-01c: Dữ liệu Gale Cutter và cơ chế Stage 4

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 · **Trạng thái:** DONE (21/11/2026) · **Phụ thuộc:** ST-15-01a · **Engine:** Phaser 3.90.0.

### 1. User Story

> **Là** người phát triển ST-15-05, **tôi muốn** đọc dữ liệu Gale Cutter đã qua kiểm tra khi mở game, **để** triển khai đường bay, hủy đạn và mở màn sương lạnh từ cấu hình chung.

### 2. Bối cảnh

- GDD 16 mục 2.3 và 5.7, Q4. Gale Cutter `boomerang` tốn 4/28 năng lượng, bay ra 6 ô với tốc độ 11 ô/s, rộng 12 × 12 px, ×1 sát thương mỗi chiều và tối đa một lưỡi trên màn. Mỗi lượt có ngân sách 14 sát thương/thanh, tính cả chiều đi và về. Terra ở Alpha đo sức mạnh khắc chế theo chu kỳ đón lưỡi thực tế. Vũ khí chưa được cấp trước ST-15-05.
- Cấu hình hủy tối đa 2 viên mỗi lần ném, chỉ gồm `enemyShot` và `bomb`. ST-15-05 kiểm nguồn đạn thuộc kẻ địch thường (Q4) và dùng `Barrier` để phá sương lạnh ở Két Tay Mk I (Stage 3).
- GDD 16 mục 5.3, QB-07. Gió 2,5 ô/s, trên đất ×0,5, bỏ qua khi lướt, bám tường hoặc bị đánh. Đổi hướng theo chu kỳ 4 s, báo trước 1 s, đổi dần trong 0,3 s. Bệ mây một chiều, bệ trôi 1,5 ô/s. Bệ tan bắt đầu chìm sau 0,8 s, tốc độ 3 ô/s, mọc lại sau 4 s. Hai mốc báo nứt của `crumble` áp dụng cả vỡ và chìm.

### 3. Phạm vi và nghiệm thu

- [x] Nạp và kiểm cấu hình Gale Cutter, ngân sách hai chiều, loại đạn hợp lệ và mức tiêu hao. Loadout giữ điều kiện chỉ cấp hành vi đã chạy được.
- [x] Nạp và kiểm `wind`, `cloud` và `crumble.sink`. Thời lượng gió phải có chỗ cho báo trước và đổi dần, bệ mây là một chiều.
- [x] Ghi trong GDD rằng dữ liệu Chim Cắt Gió và Cối Xoáy đi cùng ST-15-07, Gale Roc cùng ST-15-09, Aeris cùng ST-15-12 để kiểm chung với hành vi tương ứng.
