# Hệ thống RPG và Xưởng: kỹ năng, module, Két giáp (bản MVP)

- **Mã hệ thống:** `SYS-08` (module M8 trong `04-Dev-Plan/02-Module.md`)
- **Phân loại:** Progression
- **Độ ưu tiên:** MVP (P0). Vertical slice chỉ cần tab Kỹ năng rút gọn.
- **Trạng thái:** Draft, đề xuất chờ người dùng duyệt (14/11/2026). Mọi số là `[PLACEHOLDER]`, chỉnh sau chơi thử.
- **Phụ thuộc (upstream):** M3 Nhân vật, M4 Chiến đấu, M8 cấp và SP (đã code: `game/src/logic/rpg/progression.ts`), M11 Lưu, M9 Upgrade và Booster (`shop.json`).
- **Bị ảnh hưởng (downstream):** M10 Xưởng và HUD, M9 Power Score ở màn Chuẩn bị, nhiệm vụ phụ (nguồn module), M7 Két giáp trong màn, M16 đo lường.
- **Nguồn:** GDD chính mục 6.1–6.4 và 10.1; `03-Dac-ta-Hub-Shop.md` mục 5, 7, 8; `07-Kich-ban-huong-dan.md` mục 2 và R02–R03, D02, D04; wireframe `Workshop.html`, `Module.html`, `Armor.html`, `Loadout.html`; `player.json` (`level`, `moduleSlots`), `modules.json`, `shop.json`, `weapons.json`.
- **Cách làm:** theo quy trình Game Studio Agent (`game-gdd-architect` `/design-system`, `economy-designer` cho đường cong và trần sức mạnh, `game-production-scrum` cho Story ở `04-Dev-Plan/stories/EP-08-xuong-rpg.md`).

Tài liệu này bổ sung phần còn thiếu của GDD mục 6: danh sách kỹ năng và số liệu, số liệu module và Két giáp, quy tắc cộng dồn, trần sức mạnh, dữ liệu lưu, giao diện Xưởng bản MVP. Không thay GDD chính; chỗ nào GDD cần sửa theo đề xuất được liệt kê ở mục 9.

## 0. Phương án cây kỹ năng và đề xuất

**Câu hỏi:** cây kỹ năng rút gọn của MVP (Stage 1–4) gồm gì, tốn bao nhiêu SP, để người chơi **phải chọn** (GDD 6.2: tổng SP ít hơn cây) mà không tốn quá nhiều công làm cơ chế mới.

**Nguồn SP trong MVP** (công thức đã code: SP = (cấp − 1) + số boss; cấp cuối mỗi màn lấy theo cận trên cấp khuyến nghị, Stage 1 khớp đặc tả là cấp 4):

| Mốc | Cấp | Boss | SP có |
| --- | --- | --- | --- |
| Hết Stage 1 | 4 | 1 | 4 |
| Hết Stage 2 | 7 | 2 | 8 |
| Hết Stage 3 | 8 | 3 | 10 |
| Hết Stage 4 (cuối MVP) | 10 | 4 | 13 |
| Cuối cốt truyện (để đối chiếu) | 30 | 8 (+2 sự kiện) | 39 |

GDD đặt tỉ lệ "cây cần / SP có" khoảng 50 / 39 ≈ 1,3 để buộc chọn.

| Phương án | Mô tả | Tổng SP cây | Tỉ lệ ở cuối MVP (13 SP) | Công làm | Đánh giá |
| --- | --- | --- | --- | --- | --- |
| A | 3 nhánh × 3 nút, mỗi nút 1 SP (đọc đúng nghĩa đen wireframe) | 9 | 0,69: học hết từ cuối Stage 3 | Thấp | Không còn lựa chọn, trái GDD 6.2 |
| B | 3 × 3 nút, giá theo tầng 1 / 2 / 3 SP | 18 | 1,38 | Thấp | Đủ lựa chọn, nhưng phải sửa wireframe, R03 ("mỗi kỹ năng tốn 1 điểm") và đặc tả Hub |
| C | 3 nhánh × 5 nút, mỗi nút 1 SP | 15 | 1,15 | Cao: 6 kỹ năng cần cơ chế mới | Nặng cho MVP, lựa chọn yếu |
| D | Làm module trước, cây sau | không áp dụng | không áp dụng | Bị chặn | Module nhận qua nhiệm vụ phụ, cần nội dung màn (sau cổng Prototype) |
| **E (đề xuất)** | **3 × 3 nút có bậc: tầng 1 một bậc, tầng 2 hai bậc, tầng 3 ba bậc; mỗi bậc 1 SP; tầng sau mở khi tầng trước đủ bậc** | **18** | **1,38** | **Thấp–vừa** | **Giữ "học tốn 1 SP" của wireframe và R03; đầu tư từng điểm đều thấy hiệu quả; Alpha mở rộng bằng tầng 4–5** |

**Đề xuất: phương án E.** Lý do:

1. **Buộc chọn đúng ý GDD:** cuối MVP có 13/18 SP, đủ hoàn thành khoảng 2 nhánh; hết Stage 1 có 4 SP, phải chọn giữa đi sâu một nhánh hay rải tầng 1. Tỉ lệ 1,38 gần mức 1,3 của GDD.
2. **Ít sửa tài liệu và wireframe:** "chạm nút, học (1 SP)" vẫn đúng; chỉ thêm chấm bậc trên nút.
3. **Năng lực (SDT, competence):** mỗi SP cho ngay một bước tiến nhỏ đo được, không phải dồn 3 SP mới thấy gì.
4. **Chi phí:** 6/9 kỹ năng chỉ đổi thông số đã có trong dữ liệu (thời gian nạp, lướt trên không, bám tường, bất tử khi lướt, máu, hồi năng lượng); 3 kỹ năng cần cơ chế nhỏ mới (nổ lan, nhịp chí mạng, khiên).
5. **Mở rộng cho Alpha:** thêm tầng 4 (4 bậc) và 5 (5 bậc) mỗi nhánh thì cây đạt 18 + 27 = 45 SP so với 39 SP (tỉ lệ 1,15); nếu muốn đúng 1,3 thì thêm 1 nút phụ mỗi nhánh. Quyết định ở Alpha.

**Phạm vi MVP đề xuất cho Xưởng** (theo `game-production-scrum` `/scope-check`): tab **Kỹ năng** (sau boss 1), **Module** (sau boss 3), **Giáp** (khi mở Két giáp đầu tiên). **Tủ skin và Loadout dời sang Alpha**: chúng mở sau boss 4, tức cuối MVP, nên không đóng góp vào cổng MVP; Shop MVP cũng chỉ có Upgrade (không bán skin).

## 1. Tổng quan và trụ cột

- **Mục tiêu:** lên cấp cho người chơi **lựa chọn lối chơi** (sát thương, cơ động, sống sót) thay vì chỉ tăng chỉ số; kỹ năng của người chơi vẫn quyết định thắng thua (trụ cột 1, GDD 6.1).
- **MDA:**
  - *Mechanics:* SP từ cấp và boss; học theo bậc; đặt lại miễn phí; module có tải; giáp bật/tắt.
  - *Dynamics:* người chơi thử bộ kỹ năng theo boss (Phantom cho boss đạn dày, Vanguard cho màn nhiều kẻ địch), đổi miễn phí giữa các lần thử.
  - *Aesthetics:* thử thách (challenge) và thể hiện bản thân (expression); không có cảm giác "chọn sai mất công".
- **Phản trụ cột (không bao giờ làm):** kỹ năng chặn tiến trình (GDD 6.2); kỹ năng hay module làm một đòn boss không cần né; mất SP khi đặt lại.

## 2. Cơ chế cốt lõi

### 2.1 Cây kỹ năng (phương án E)

Ký hiệu nút `<nhánh><tầng>`. Tầng 2 mở khi tầng 1 đủ bậc; tầng 3 mở khi tầng 2 đủ bậc. Chỉ học được trong Xưởng (ngoài màn chơi). Hiệu ứng áp dụng từ lần vào màn kế tiếp.

| Nút | Tên | Bậc | Hiệu ứng theo bậc (biến dữ liệu) | Loại việc |
| --- | --- | --- | --- | --- |
| V1 | Nạp Nhanh | 1 | `chargeTimeMul = 0.85`: nạp vừa 0,5 → 0,425 s; nạp đầy 1,2 → 1,02 s | Thông số có sẵn |
| V2 | Đạn Nạp Nổ Lan | 2 | Đạn nạp đầy trúng mục tiêu thì nổ, gây `burstDamageMul` × sát thương đạn nạp cho **mục tiêu khác** trong `burstRadiusTiles`: bậc 1: 0,3 / 1,0 ô; bậc 2: 0,5 / 1,5 ô | Cơ chế mới (nhỏ) |
| V3 | Nhịp Chí Mạng | 3 | Phát Arc Cannon **thường** (không nạp) trúng đích liên tiếp lần thứ `critEveryHits = 5` gây `critMul`: 1,2 / 1,35 / 1,5. Một phát trượt (chạm tường, hết tầm) đặt lại bộ đếm | Cơ chế mới (nhỏ) |
| P1 | Lướt Trên Không | 1 | `airDash = true`, `airDashesPerAirborne = 1`, hồi khi chạm đất, bám tường hoặc đứng lên dây leo | Thông số có sẵn (`abilities.airDash`) |
| P2 | Bám Tường Bền | 2 | `wallSlideMul`: 0,75 / 0,5 (trượt tường 2 → 1,5 → 1 ô/s); bậc 2 thêm `wallJumpPushMul = 1.15` | Thông số có sẵn |
| P3 | Lướt Xuyên Đạn | 3 | Đầu cú lướt bất tử `dashIFrameSec`: 0,14 / 0,17 / 0,2 s (gốc 0,1 s), nhưng **chỉ một cú lướt mỗi** `longIFrameCooldownSec = 1.0` s được bất tử dài; các cú khác giữ 0,1 s | Thông số có sẵn + 1 đồng hồ |
| C1 | Khung Gia Cố | 1 | `maxHpMul = 1.1` | Thông số có sẵn |
| C2 | Tái Nạp | 2 | Năng lượng vũ khí Warden tự hồi `energyRegenMul`: 1,25 / 1,5 (1 → 1,25 → 1,5 đơn vị/giây); bậc 2 thêm `regenDelaySec` 3 → 2 s | Thông số có sẵn |
| C3 | Khiên Hấp Thụ | 3 | Chặn trọn một đòn của kẻ địch hoặc boss (0 sát thương, không bật lùi, vẫn bất tử 1 s như bị đánh). Hồi sau `shieldRechargeSec`: 30 / 25 / 20 s kể từ lần cuối khiên vỡ hoặc Kai mất máu. Không chặn gai và hố | Cơ chế mới (nhỏ) |

Tổng: 3 nhánh × (1 + 2 + 3) = 18 bậc = 18 SP.

### 2.2 Module (bản MVP)

- **Ô:** `slots(L) = moduleSlots.start + [L ≥ 10] + [L ≥ 20]` = 3 / 4 / 5 (`player.json`). **Tải tối đa** `loadCap = 2 × slots` = 6 / 8 / 10 (GDD 6.4).
- **Nguồn:** nhiệm vụ phụ theo vị trí màn (`03-Dac-ta-Hub-Shop.md` mục 7). MVP có 4 module của Stage 1–4. Tab Module mở sau boss 3 (D04).
- Không lắp được module khiến tổng tải vượt `loadCap` (nút lắp mờ, hiện "Vượt tải"); vì vậy không bao giờ lưu được cấu hình vượt tải.

| Module | Tải | Hiệu ứng (biến dữ liệu) | Ghi chú cân bằng |
| --- | --- | --- | --- |
| Magnet Core | 1 | Hút Core Bit và viên máu trong `magnetRadiusTiles = 3` ô với `pullTilesPerSec = 8` | Cộng với Upgrade `magnet_range` (+1 ô/cấp, tối đa +3) |
| Last Stand | 2 | Máu dưới `hpFrac = 0.2` thì mọi sát thương gây ra × `damageMul = 1.3` | Có điều kiện, không tính vào trần (mục 3.3) |
| Phase Step | 2 | Lướt để lại ảo ảnh tại điểm bắt đầu trong `lifeSec = 0.6` s; kẻ địch thường chạm vào bị choáng `stunSec = 0.3` (mỗi ảo ảnh một lần mỗi kẻ địch) | Boss và mini-boss miễn nhiễm |
| Energy Siphon | 1 | Hạ một kẻ địch hồi `energyPerKill = 2` đơn vị năng lượng vũ khí Warden (≈ 7% của 28) | **Đề xuất đổi** GDD "2%" (0,56 đơn vị, không cảm nhận được vì Vine Lash tốn 4) |

Hai mốc: trước cấp 10 có 3 ô / 6 tải, lắp được 3 trong 4 module (tổng tải cả 4 là 6 nhưng thiếu ô) nên phải chọn; từ cấp 10 (khoảng cuối MVP) lắp đủ cả 4.

### 2.3 Két giáp (bản MVP)

Két giáp màn k cần vũ khí màn k+1 (GDD 6.3). Trong MVP (Stage 1–4) mở được 3 két:

| Két | Màn, vũ khí cần | Bộ phận | Hiệu ứng MVP (biến dữ liệu) |
| --- | --- | --- | --- |
| 1 | Stage 1, Prism Beam | Đầu Mk I | **Radar bí mật:** khi còn bí mật, Memory Log hoặc Két giáp chưa lấy trong `scanRadiusTiles = 12` ô, HUD hiện mũi tên nhấp nháy ở mép màn hình chỉ hướng. GDD ghi "bản đồ nhỏ" nhưng MVP chưa có bản đồ nhỏ |
| 2 | Stage 2, Frost Shard | Thân Mk I | `damageTakenMul = 0.85` |
| 3 | Stage 3, Gale Cutter | Tay Mk I | `chargeTimeMul = 0.85` |

Chân Mk I (Stage 4, cần Quake Drill của Stage 5) và mọi bản Mk II: Alpha. Mở két thì Mira chế tạo ngay (MVP không có thời gian chờ); mỗi bộ phận bật/tắt riêng, mặc định bật.

### 2.4 Trạng thái nút kỹ năng

| Trạng thái | Điều kiện | Chạm / bấm |
| --- | --- | --- |
| Khóa | Tầng trước chưa đủ bậc | Hiện mô tả và điều kiện mở |
| Học được | Mở, chưa đủ bậc, SP còn ≥ 1 | Học 1 bậc (1 SP), áp dụng và tự lưu ngay |
| Thiếu SP | Mở, chưa đủ bậc, SP còn = 0 | Hiện mô tả, nút học mờ |
| Đủ bậc | Bậc = bậc tối đa | Hiện mô tả |

Đặt lại: một nút "Đặt lại" cho cả cây, có bước xác nhận, hoàn 100% SP, miễn phí, không giới hạn số lần. Không có gỡ từng bậc (giữ giao diện đơn giản, đặt lại đã miễn phí).

## 3. Công thức, cộng dồn và trần sức mạnh

### 3.1 Quy tắc cộng dồn

Mọi hệ số cùng loại **nhân với nhau**, rồi kẹp theo sàn hoặc trần trong dữ liệu:

```text
chargeTime   = base × V1 × TayMkI × (1 / (1 + overchargeBooster)) ; ≥ base × minChargeTimeMul (0.6)
damageTaken  = round(raw × difficulty.damageTaken × (1 − 0.04 × armor_plating) × ThânMkI) ; tổng hệ số ≥ minDamageTakenMul (0.5), kết quả ≥ 1
maxHp        = round(hp(L_hiệu_dụng) × C1)
damageDealt  = base × atk(L)/atk(1) × (1 + 0.05 × arc_core) × [crit V3] × [Last Stand]
khiên        : khiên kỹ năng C3 chặn trước, rồi mới tới Booster shield_cell
```

| Ví dụ thời gian nạp đầy (gốc 1,2 s) | Kết quả |
| --- | --- |
| Không gì | 1,2 s |
| V1 | 1,02 s |
| V1 + Tay Mk I | 0,867 s |
| V1 + Tay Mk I + Booster Overcharge (+30% tốc độ) | 0,667 s → kẹp **0,72 s** |

### 3.2 Giá trị biên

| Mốc | Máu (không C1 / có C1) | Hệ số sát thương bắn thường tối đa* | Ghi chú |
| --- | --- | --- | --- |
| Cấp 1 | 100 / 110 | 1 × 1,25 × 1,10 = 1,375 | Upgrade chưa có ở đầu game (mở sau boss 2) |
| Cấp 10 (cuối MVP) | 136 / 150 | 1,225 × 1,25 × 1,10 = 1,684 | |
| Cấp hiệu dụng 20 (Stage 8 có đồng bộ, tối đa 18 + 2) | 176 / 194 | 1,475 × 1,25 × 1,10 = **2,028** | Dưới trần 2,2 |
| Cấp 24 (Citadel và màn cuối, khuyến nghị 22+ cộng 2) | 192 / 211 | 1,575 × 1,25 × 1,10 = **2,166** | Dưới trần 2,2 |
| Cấp 30 | 216 / 238 | 1,725 × 1,25 × 1,10 = 2,372 | Chỉ khi vượt khuyến nghị nhiều hoặc hậu cốt truyện (mục 3.3) |

\* Upgrade `arc_core` tối đa (+25%), V3 bậc 3 với chính xác tuyệt đối (trung bình +10%: một phát ×1,5 mỗi 5 phát).

### 3.3 Trần sức mạnh cốt truyện: phát hiện mâu thuẫn và cách đo đề xuất

GDD 6.1: "cấp, upgrade và module cộng lại không vượt khoảng ×2,2 sát thương và ×2,5 máu so với cấp 1". **Mâu thuẫn:** riêng cấp 30 × Upgrade tối đa đã là 1,725 × 1,25 = 2,156, nên kỹ năng Vanguard (GDD 6.2 có "chí mạng") gần như không còn chỗ.

**Đề xuất cách đo** (để code kiểm tra lúc nạp, mở rộng phép kiểm tra đã có ở `game-config.ts`):

1. Đo **ở cấp hiệu dụng cao nhất của nội dung cốt truyện**, không ở cấp 30: cấp 20 (Stage 1–8 có đồng bộ cấp) và cấp 24 (Citadel và màn cuối). Lý do: đồng bộ cấp đã chặn người cấp cao trong Stage 1–8; Citadel cân theo cấp khuyến nghị 22+. Cả hai mốc đều ≤ 2,2 (bảng 3.2).
2. Đo **sát thương trung bình bền vững** (gồm crit trung bình V3), **không tính hiệu ứng có điều kiện rủi ro cao** (Last Stand dưới 20% máu) và booster dùng một lần.
3. **Kỹ năng tăng tốc nạp không được nâng DPS tối đa:** DPS của chỉ bắn nạp đầy ở sàn 0,72 s là 3 / 0,72 = 4,17 phát/giây, thấp hơn DPS bắn thường cơ bản khoảng 4,35 phát/giây (boss 100 máu, bắn liên tục khoảng 23 s theo test mô phỏng). Vì vậy V1, Tay Mk I và Overcharge chỉ làm lối bắn nạp dễ chịu hơn, không vượt lối mạnh nhất.
4. **Máu:** cấp 24 × C1 = 1,92 × 1,1 = 2,11 ≤ 2,5. **Máu hiệu dụng** (tính cả giảm sát thương) cấp 20: 1,936 / (0,8 × 0,85) = 2,85. Đề xuất hướng dẫn ≤ 3,0 cho MVP. Lưu ý cho Alpha: Thân Mk II −25% sẽ đẩy lên 3,23, nên chọn −20% kèm phản đòn hoặc chấp nhận.

### 3.4 Biến cấu hình (dữ liệu, không viết cứng)

`03-Data/skills.json` (mới): `rules.minChargeTimeMul = 0.6`, `rules.minDamageTakenMul = 0.5`, `rules.longIFrameCooldownSec = 1.0`, `rules.critEveryHits = 5`, danh sách nhánh → nút → bậc với hiệu ứng như bảng 2.1. `03-Data/modules.json` (mở rộng): `cost`, tham số từng module, `source` (nhiệm vụ màn nào). `03-Data/armor.json` (mới): bộ phận, Mk, Két giáp ở màn nào, hiệu ứng. `player.json`: dùng `moduleSlots` có sẵn, thêm `moduleLoadPerSlot = 2`.

## 4. Giao tiếp hệ thống và dữ liệu

- **Mô hình thuần** `logic/rpg/build.ts`: `computeBuild(save, data) → PlayerModifiers` (mọi hệ số ở mục 3.1 cộng với cờ cơ chế: `airDash`, `burst`, `critRhythm`, `shield`, `magnet`, `lastStand`, `phaseStep`, `siphon`, `scan`). StageWorld nhận `modifiers` trong `WorldSetup`, áp lên thông số Kai, vũ khí, sát thương; không đọc bản lưu.
- **Sự kiện (event bus, cho HUD, âm thanh, đo lường M16):** `build:changed { modifiers }`, `skill:learned { node, rank }`, `skill:reset { refunded }`, `module:equipped { id }`, `module:unequipped { id }`, `armor:toggled { part, on }`.
- **WorldEvents mới (trong màn):** `critHit`, `burstHit`, `shieldAbsorbed`, `shieldReady`, `airDash`, `phaseStun`, `scanPing`.
- **Bản lưu (M11, nâng `SAVE_VERSION` lên 2, bản 1 nâng lên với giá trị trống):**

```text
character.skills   : Record<nodeId, rank>       // bậc đã học
character.modules  : { owned: string[]; equipped: string[] }
character.armor    : { owned: string[]; off: string[] }   // bộ phận đã có; bộ phận đang tắt
SP còn lại = skillPoints(cấp, boss) − Σ rank   // không lưu SP còn lại
```

## 5. Trường hợp biên

| Tình huống | Xử lý |
| --- | --- |
| Tổng bậc đã học lớn hơn SP có (dữ liệu đổi giá, nhập mã sao lưu cũ) | Tự đặt lại cả cây, hoàn SP, báo "Kỹ năng đã được đặt lại do thay đổi dữ liệu" |
| Nút trong bản lưu không còn trong dữ liệu | Bỏ nút đó (SP tự hoàn) |
| Module trong bản lưu không còn, hoặc lắp vượt tải sau khi đổi dữ liệu | Gỡ từ module lắp sau cùng tới khi vừa tải |
| Bản lưu của phiên bản mới hơn | Không đọc, không ghi (quy tắc M11 hiện có) |
| Khiên C3 và Booster Khiên cùng có | Khiên kỹ năng chặn trước; booster còn nguyên |
| Đòn trúng đúng bước khiên hồi | Khiên hồi trước, chặn đòn đó (thứ tự trong bước: hồi khiên → xử lý trúng đòn) |
| Lướt trên không ngay khi rời dây leo | Được (dây leo tính như chạm đất để hồi lượt lướt trên không) |
| Nhịp chí mạng khi đổi vũ khí | Đổi vũ khí không đặt lại bộ đếm; chỉ phát trượt mới đặt lại |
| Nổ lan V2 trúng boss khi mục tiêu chính là kẻ địch thường | Có tính (boss là "mục tiêu khác"); mỗi vụ nổ trúng mỗi mục tiêu tối đa 1 lần |
| Mở Xưởng giữa màn | Không cho (Xưởng ở Hub; menu tạm dừng chỉ có "Lắp module nhanh" từ Alpha) |
| Màn chơi thử cổng Prototype | Bỏ qua mọi kỹ năng, module, giáp (giống quy tắc cấp 1 hiện có) |

## 6. Giao diện và phản hồi

- **Xưởng (MVP):** 3 tab Kỹ năng, Module, Giáp theo `Workshop.html`, `Module.html`, `Armor.html`; tab chưa mở hiện khóa kèm điều kiện. Thanh trên: Core Bit, **SP còn lại**. Thay đổi áp dụng ngay, tự lưu.
- **Đề xuất kỹ thuật (cần Technical Director chốt bằng ADR):** dựng Xưởng bằng **bảng HTML** như bảng "Dữ liệu lưu" và "Điều khiển" (nhiều chữ, cần nút ≥ 48 dp và cuộn trên điện thoại), không vẽ trong canvas.
- **Nút kỹ năng:** biểu tượng, tên, chấm bậc (ví dụ ●●○), viền theo trạng thái (mục 2.4); chạm lần 1 xem mô tả và số liệu bậc kế, nút "Học (1 SP)" riêng để tránh học nhầm.
- **Lối vào:** menu (Hub dạng menu của MVP) → Xưởng; nút **Mở Xưởng** ở màn Kết quả sáng lên khi còn SP (nay đang mờ); hướng dẫn R02–R03 sau boss 1.
- **Trong màn:** khiên C3 hiện biểu tượng nhỏ cạnh thanh máu (sáng khi sẵn, mờ khi đang hồi); crit V3 có số sát thương vàng và rung nhẹ; nổ lan V2 có vòng tròn 0,15 s; radar Đầu Mk I là mũi tên ở mép màn hình. Mọi hiệu ứng tôn trọng tùy chọn "giảm rung, giảm nhấp nháy" (GDD 11).
- **Âm thanh (M12):** tiếng học kỹ năng, tiếng khiên vỡ và khiên hồi khác nhau, tiếng crit.

## 7. Nút tinh chỉnh

Toàn bộ số ở mục 2–3 nằm trong `skills.json`, `modules.json`, `armor.json`, `player.json`; bảng chỉnh cảm giác (`?tune=1`) nên có thêm nhóm "Bộ kỹ năng" để bật/tắt từng nút khi chơi thử. Nguồn SP và EXP không đổi ở đây (đã ở `player.json` → `level`).

## 8. Tiêu chí kiểm thử và giả thuyết

| Giả thuyết | Đo bằng | Đạt khi |
| --- | --- | --- |
| Người chơi dùng cây kỹ năng | Sự kiện `skill:learned` (M16) hoặc phiếu chơi thử | ≥ 80% học ít nhất 1 bậc trong lần đầu vào Xưởng sau boss 1 |
| Có lựa chọn thật | Nhánh được dồn SP nhiều nhất ở cuối MVP | Không nhánh nào chiếm > 60% số người chơi |
| Đặt lại miễn phí khuyến khích thử | Số lần `skill:reset` | ≥ 25% người chơi đặt lại ít nhất 1 lần trước cuối MVP |
| Không phá trần | Test logic: hệ số ở cấp 20 và 24 (mục 3.2) | ≤ 2,2 sát thương, ≤ 2,5 máu |
| Không có bộ kỹ năng làm boss tầm thường | Mô phỏng Thorna với Vanguard đủ + Upgrade tối đa ở cấp hiệu dụng 6 | Thời gian hạ boss ≥ 60% thời gian gốc; mọi đòn vẫn cần né (khiên chỉ chặn 1 đòn mỗi 20 s) |
| P3 không thành bất tử liên tục | Test logic | Tỉ lệ thời gian bất tử do lướt ≤ 20% khi lướt liên tục |

Nghiệm thu: test logic cho `computeBuild`, cộng dồn, sàn và trần, lưu bản 2 và nâng bản 1; chạy thử trên PC và điện thoại (Xưởng, học, đặt lại, vào màn thấy hiệu ứng) theo quy tắc nhìn tận mắt.

## 9. Thay đổi cần lan sang tài liệu khác (`/propagate-design-change`)

Chỉ áp dụng sau khi người dùng duyệt tài liệu này:

| Tài liệu | Thay đổi |
| --- | --- |
| GDD chính 6.1 | Ghi rõ cách đo trần sức mạnh (mục 3.3): đo ở cấp hiệu dụng 20 và 24, sát thương trung bình bền vững, không tính Last Stand và booster |
| GDD chính 6.2 | Trỏ tới tài liệu này cho danh sách kỹ năng MVP; "chí mạng" là nhịp chí mạng có quy luật (không ngẫu nhiên) |
| GDD chính 6.4 | Energy Siphon: 2 đơn vị năng lượng mỗi lần hạ (thay "2%") |
| `03-Dac-ta-Hub-Shop.md` mục 5 | Bản MVP có 3 tab; Tủ skin và Loadout dời sang Alpha; nút kỹ năng có nhiều bậc, mỗi bậc 1 SP |
| `07-Kich-ban-huong-dan.md` R03 | Lời giữ nguyên ("Mỗi kỹ năng tốn 1 điểm") đổi thành "Mỗi lần học tốn 1 điểm" |
| Wireframe `Workshop.html` | Thêm chấm bậc trên nút; tab Tủ skin và Loadout hiện khóa "Alpha" |
| `04-Dev-Plan/02-Module.md` M8 | Nguồn thêm tài liệu này |
