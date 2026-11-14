# Hệ thống RPG và Xưởng: kỹ năng, module, Két giáp (bản MVP)

- **Mã hệ thống:** `SYS-08` (module M8 trong `04-Dev-Plan/02-Module.md`)
- **Phân loại:** Progression
- **Độ ưu tiên:** MVP (P0). Vertical slice chỉ cần tab Kỹ năng.
- **Trạng thái:** **Approved**, bản 2 (14/11/2026): qua duyệt của Creative Director và Technical Director + Producer (duyệt kèm sửa, đã sửa); người dùng duyệt 5 quyết định ở mục 10 ngày 14/11/2026; thay đổi ở mục 9 đã lan sang các tài liệu. Sửa theo rà soát 14/11/2026 (`/review-all-gdds`): cấp cuối màn theo ngân sách EXP, cấp cuối cốt truyện 22–24 (mục 0), Thân Mk II (mục 3.3), số và tên biến theo dữ liệu (mục 2.1, 2.2, 3.1, 4), rủi ro Dash Coil (mục 8). Phần Module và Két giáp (mục 2.2, 2.3) là **Draft, bị chặn** tới khi có nội dung Stage 2–4. Mọi số là `[PLACEHOLDER]`, chỉnh sau chơi thử.
- **Phụ thuộc (upstream):** M3 Nhân vật, M4 Chiến đấu, M8 cấp và SP (đã code: `game/src/logic/rpg/progression.ts`), M11 Lưu, M9 Upgrade và Booster (`shop.json`).
- **Bị ảnh hưởng (downstream):** M10 Xưởng, HUD, menu tạm dừng; M9 Power Score ở màn Chuẩn bị; nhiệm vụ phụ (nguồn module); M7 Két giáp và quy tắc duyệt màn; M12 âm thanh; M16 đo lường.
- **Nguồn:** GDD chính 6.1–6.4, 9, 10.1, 11; `03-Dac-ta-Hub-Shop.md` mục 5, 7, 8; `07-Kich-ban-huong-dan.md` mục 2, R02–R03, D02, D04; wireframe `Workshop.html`, `Module.html`, `Armor.html`; `player.json`, `modules.json`, `shop.json`, `weapons.json`, `bosses.json`.
- **Quy trình (Game Studio Agent):** Design Lead viết theo `game-gdd-architect` `/design-system` và `economy-designer`; Creative Director và Technical Director + Producer duyệt độc lập; `game-production-scrum` tách Story ở `04-Dev-Plan/stories/EP-08-xuong-rpg.md`; quyết định kỹ thuật ở `04-Dev-Plan/adr/ADR-001-xuong-bang-html.md`.

## 0. Phương án cây kỹ năng và đề xuất

**Câu hỏi:** cây kỹ năng MVP (Stage 1–4) gồm gì, tốn bao nhiêu SP, để người chơi **phải chọn** (GDD 6.2) mà không tốn quá nhiều công làm cơ chế mới.

**Nguồn SP trong MVP** (SP = (cấp − 1) + số boss; cấp cuối mỗi màn lấy theo ngân sách EXP ở bảng dưới, Stage 1 khớp đặc tả là cấp 4):

| Mốc | Cấp | Boss | SP có |
| --- | --- | --- | --- |
| Hết Stage 1 | 4 | 1 | 4 |
| Hết Stage 2 | 6 | 2 | 7 |
| Hết Stage 3 | 8 | 3 | 10 |
| Hết Stage 4 (cuối MVP) | 10 | 4 | 13 |
| Cuối cốt truyện (đối chiếu) | 22–24 | 8 (+2 sự kiện `[TBD-Alpha]`) | 31–33 |

Cuối cốt truyện có 31–33 SP; cây đầy đủ của Alpha (3 nhánh × 5 tầng, tầng k có k bậc) cần 45 SP, tỉ lệ khoảng 1,4. Bản cũ ghi cấp 30 và 39 SP, nhưng màn cuối khuyến nghị 22+ và cấp 30 cần 56.151 EXP (rà soát 14/11/2026).

**Ngân sách EXP theo màn (`expBudget`, độ khó Thường)** `[PLACEHOLDER]`. Cấp mục tiêu cuối màn 4, 6, 8, …, 18: mỗi màn đưa người chơi lên đúng 2 cấp (Stage 1: 3 cấp, tính cả Prologue), nằm trong cấp khuyến nghị (GDD chính 8.2). Bản cũ lấy cận trên cấp khuyến nghị (7 / 8 / 10 khi hết Stage 2 / 3 / 4) nên mỗi màn cho +1.151 / +610 / +1.602 EXP, lệch nhịp. EXP tính theo `40 × L^1,4`, làm tròn từng cấp như `progression.ts`. **Cần thêm vào `stages.json` khi làm Stage 2** (kèm kiểm tra ở `core/`).

| Màn | Cấp khuyến nghị | Cấp cuối màn | EXP của màn (`expBudget`) | EXP tích lũy cuối màn |
| --- | --- | --- | --- | --- |
| Prologue + Stage 1 | 1; 2–4 | 4 | 332 | 332 |
| Stage 2 | 4–7 | 6 | 660 | 992 |
| Stage 3 | 5–8 | 8 | 1.101 | 2.093 |
| Stage 4 | 7–10 | 10 | 1.602 | 3.695 |
| Stage 5 | 8–12 | 12 | 2.153 | 5.848 |
| Stage 6 | 10–14 | 14 | 2.748 | 8.596 |
| Stage 7 | 12–16 | 16 | 3.382 | 11.978 |
| Stage 8 | 14–18 | 18 | 4.052 | 16.030 |
| Citadel 1–3 + màn cuối | 20+; 22–24 | 22–24 | 10.247–16.502 | 26.277–32.532 |

Ghi chú: dãy 332, 660, 1.101, …, 4.052 là EXP **của từng màn** (hiệu hai mốc tích lũy), không phải EXP tích lũy; cột cuối mới là tích lũy. Cốt truyện nhận ×0,5 EXP nên tới màn sau ở cấp thấp hơn; đồng bộ cấp (GDD chính 6.1) bù phần chênh.

| Phương án | Mô tả | Tổng SP | Tỉ lệ cuối MVP | Công làm | Đánh giá |
| --- | --- | --- | --- | --- | --- |
| A | 3 nhánh × 3 nút, mỗi nút 1 SP | 9 | 0,69 | Thấp | Học hết từ cuối Stage 3, không còn lựa chọn |
| B | 3 × 3 nút, giá theo tầng 1 / 2 / 3 SP | 18 | 1,38 | Thấp | Tầng 3 thành một cục 3 SP; phải sửa wireframe và R03 |
| C | 3 nhánh × 5 nút, 1 SP mỗi nút | 15 | 1,15 | Cao | 6 cơ chế mới, nặng cho MVP, lựa chọn yếu |
| D | Làm module trước | không áp dụng | không áp dụng | Bị chặn | Module nhận qua nhiệm vụ phụ, cần nội dung màn |
| **E (chốt)** | **3 × 3 nút có bậc: tầng 1 một bậc, tầng 2 hai bậc, tầng 3 ba bậc; mỗi bậc 1 SP; tầng sau mở khi tầng trước đủ bậc** | **18** | **1,38** | **Vừa** | **Hai Director cùng chọn E** |

**Vì sao E:** cuối MVP có 13/18 SP, đủ khoảng 2 nhánh (tỉ lệ 1,38, gần mức 1,3 của GDD); "học tốn 1 SP" của wireframe vẫn đúng; Alpha mở rộng bằng tầng 4–5. Vì đặt lại miễn phí, **lựa chọn thật** ở cuối MVP là "mang 2 trong 3 nút tầng 3 nào vào trận boss này", nên phải đổi bộ kỹ năng nhanh được (mục 2.5).

**Luật thiết kế bậc** (kiểm tra lúc nạp ở `core/skills-config.ts`): mỗi bậc sau tăng phần thưởng ≥ 20% so với bậc trước, hoặc thêm một hiệu ứng mới; bậc 1 của nút tầng 3 mang ≥ 60% hiệu lực tối đa (không có bậc "ngõ cụt").

**Phạm vi Xưởng trong MVP** (`/scope-check`): tab **Kỹ năng** mở sau boss 1 (làm ngay, không bị chặn). Tab **Module** và **Giáp** làm khi có nội dung Stage 2–4 (nhiệm vụ phụ, Két giáp), tức sau cổng Prototype. **Tủ skin và Loadout dời sang Alpha** (mở sau boss 4, đúng lúc hết MVP; Shop MVP không bán skin).

## 1. Tổng quan và trụ cột

- **Mục tiêu:** lên cấp cho người chơi **chọn lối chơi** (Vanguard: chuyên nạp đầy và trừng phạt lúc boss hở; Phantom: cơ động và né đạn; Core: sống sót), không phải chỉ tăng chỉ số. Kỹ năng người chơi vẫn quyết định thắng thua (trụ cột 1).
- **MDA:** *Mechanics:* SP từ cấp và boss, học theo bậc, đặt lại miễn phí, chỉnh bộ kỹ năng ngay trong màn. *Dynamics:* thử bộ kỹ năng theo boss, học mẫu đòn để trừng phạt lúc boss hở. *Aesthetics:* thử thách và thể hiện bản thân, không có "chọn sai mất công".
- **Phản trụ cột:** kỹ năng chặn tiến trình; kỹ năng làm một đòn boss không cần né (kể cả đòn đỉnh); trạng thái sống còn mà người chơi không nhìn thấy; mất SP khi đặt lại.
- **Luật duyệt màn (thêm vào checklist M7):** mọi vật phẩm được lưu (Két giáp, Memory Log, bí mật, Data Chip, mục tiêu nhiệm vụ phụ) và đường chính đều tới được bằng **bộ động tác gốc** (lướt đất, lướt-nhảy, bám và nhảy tường). Lối chỉ lướt trên không mới tới là đường tắt, thưởng tối đa là Core Bit.

## 2. Cơ chế cốt lõi

### 2.1 Cây kỹ năng

Thời gian tính theo **bước logic 60 Hz** (1 bước = 1/60 s). Giá trị ghi **tương đối so với số gốc** trong dữ liệu (cổng Prototype còn có thể chỉnh số gốc).

| Nút | Tên | Bậc | Hiệu ứng theo bậc (biến dữ liệu) | Loại việc |
| --- | --- | --- | --- | --- |
| V1 | Nạp Nhanh | 1 | Chỉ **nạp đầy**: `fullChargeTimeMul = 0.85` (1,2 → 1,02 s). Nạp vừa giữ nguyên 0,5 s | Thông số có sẵn |
| V2 | Đạn Nạp Nổ Lan | 2 | Đạn nạp đầy trúng mục tiêu thì nổ, gây `burstDamageMul` × sát thương đạn nạp cho mục tiêu **khác** trong `burstRadiusTiles`: bậc 1: 0,3 / 1,0 ô; bậc 2: 0,5 / 1,5 ô. Không phá khiên Lính Kén | Cơ chế nhỏ mới |
| V3 | Đòn Trừng Phạt | 3 | Đạn nạp đầy trúng mục tiêu **đang hở** gây × `punishMul`: 1,3 / 1,4 / 1,5. Đang hở: boss ở trạng thái `recover` hoặc bị choáng (điểm yếu 0,5 s, sau Hoa Nở 2 s); mini-boss ở trạng thái hồi tương đương. Kẻ địch thường không tính | Cơ chế nhỏ mới (boss đã có `recover`, `stunned`) |
| P1 | Lướt Trên Không | 1 | `airDashesPerAirborne = 1`; lượt hồi khi chạm đất (gồm đứng trên dây leo), khi bám tường, khi hồi sinh. Lướt trong thời gian coyote tính là lướt đất (không tốn lượt) | Cơ chế nhỏ mới (hiện cờ `airDash` cho lướt không giới hạn) |
| P2 | Bám Tường Bền | 2 | Bậc 1: `wallSlideMul = 0.6` (2 → 1,2 ô/s). Bậc 2 thêm **ân hạn nhảy tường** `wallJumpGraceSec = 0.1`: rời tường 0,1 s vẫn nhảy tường được. Không đổi quỹ đạo nhảy tường (giữ trí nhớ tay khi đặt lại) | Thông số có sẵn + cơ chế nhỏ |
| P3 | Lướt Xuyên Đạn | 3 | Thêm bất tử **chỉ với đạn** ở đầu cú lướt: +3 / +4 / +4 bước (gốc 6 bước = 0,1 s). Bậc 3 thêm **sượt đạn**: đạn đi xuyên trong phần bất tử thêm thì cộng `grazeChargeSec = 0.25` vào thời gian nạp. Phần thêm mất ngay khi cú lướt kết thúc hoặc bị hủy. Không có đồng hồ ẩn | Thông số có sẵn + cơ chế nhỏ |
| C1 | Khung Gia Cố | 1 | `maxHpMul = 1.15` (cấp 4: 112 → 129, chịu thêm khoảng 1 đòn boss) | Thông số có sẵn |
| C2 | Tái Nạp | 2 | Năng lượng vũ khí Warden tự hồi `energyRegenMul`: 1,25 / 1,5; bậc 2 thêm `regenDelayMul` (nhân thời gian chờ 3 s; dữ liệu 0,67 ra 2,01 s, nên đặt 0,6667 để ra đúng 2 s) | Thông số có sẵn |
| C3 | Khiên Hấp Thụ | 3 | Chặn trọn một đòn của kẻ địch hoặc boss: 0 sát thương, không bật lùi, **bất tử 0,3 s**, không mất mức nạp, không tính là "bị đánh". Hồi sau `shieldRechargeSec` 30 / 25 / 20 s **tính từ lúc khiên vỡ**. Không chặn gai, hố và hạt Hoa Nở (`skills.json → rules.shieldPierceKinds`, ST-08-08): đòn đi qua, khiên vẫn sẵn. Không chặn đòn 0 máu (kẻ địch vô hại ở Prologue) | Cơ chế nhỏ mới |

Kiểm luật bậc: V2 bậc 2 tăng 67% sát thương; V3 bậc 1 = 60% hiệu lực tối đa (0,3 / 0,5); P3 bậc 1 = 75% (+3 / +4 bước), bậc 3 thêm hiệu ứng sượt đạn; C2 bậc 2 tăng gấp đôi phần thưởng; C3 bậc 1 = 67% tốc độ hồi tối đa (1/30 so với 1/20).

### 2.2 Module (Draft, bị chặn: cần nhiệm vụ phụ Stage 1–4)

- **Ô theo cấp:** dữ liệu đổi sang dạng `moduleSlots: [{ fromLevel: 1, slots: 3 }, { fromLevel: 10, slots: 4 }, { fromLevel: 20, slots: 5 }]` (không viết cứng mốc 10, 20 trong mã). **Tải tối đa** `loadCap = moduleLoadPerSlot (2) × slots`.
- **Nguồn:** nhiệm vụ phụ theo `index` của màn (`quests.json`, `15-Nhiem-vu-phu.md`; đặc tả Hub mục 7). Tab Module của Xưởng mở khi nhận module đầu tiên. Không lắp được module làm tổng tải vượt `loadCap`.
- **Trạng thái vô hiệu dùng chung:** Phase Step (choáng) và Frost Shard (đóng băng) dùng cùng trạng thái `disabledSec` trên mọi hành vi kẻ địch; boss và mini-boss miễn (`16-Dac-ta-Stage2-4-nhap.md` ST-15-04).

| Module | Tải | Hiệu ứng (biến dữ liệu) | Ghi chú |
| --- | --- | --- | --- |
| Magnet Core | 1 | Hút Core Bit, viên máu trong `magnetRadiusTiles = 3` ô; vật phẩm bay tới 12 ô/s (`enemies.json → pickups.magnetSpeedTilesPerSec`, chung với Upgrade) | Cộng Upgrade `magnet_range` |
| Last Stand | **3** | Máu dưới `hpFrac = 0.2`: sát thương gây ra × `damageMul = 1.3` | Có điều kiện: `conditional: true` (mục 3.3) |
| Phase Step | **3** | Lướt để lại ảo ảnh `lifeSec = 0.6` s; kẻ địch thường chạm vào bị choáng `stunSec = 0.3` | Cần thêm trạng thái choáng cho mọi hành vi kẻ địch (hiện chưa có). Boss, mini-boss miễn nhiễm |
| Energy Siphon | 1 | Hạ một kẻ địch hồi `energyPerKill = 2` đơn vị (≈ 7% của 28) | Thay "2%" của GDD (0,56 đơn vị, không cảm nhận được). `modules.json` vẫn ghi "2%" bằng chữ: thêm trường số và `load` ở ST-08-09 |

Tải 4 module = 8 > 6 (3 ô) nên trước cấp 10 phải chọn tổ hợp; từ cấp 10 (4 ô, tải 8) lắp đủ. Đây là lựa chọn mỏng; nếu chơi thử thấy tab Module không ai cân nhắc thì ghi rõ module không thuộc phần đo ở cổng MVP.

### 2.3 Két giáp (Draft, bị chặn: cần Két giáp trong màn và vũ khí Stage 2–4)

`stages.json` đã có `armorCache` và `armorCacheRequiresWeapon` theo màn; `armor.json` chỉ giữ **bộ phận → hiệu ứng**, kèm bất biến "mỗi `armorCache` trong `stages.json` có trong `armor.json`". Két dựng bằng vật chắn `requiresWeapon` + bí mật (M7 đã có), nên **bộ phận đã có suy từ bí mật đã nhặt**, không lưu riêng.

| Két | Màn, vũ khí cần | Bộ phận | Hiệu ứng MVP |
| --- | --- | --- | --- |
| 1 | Stage 1, Prism Beam | Đầu Mk I | **Radar:** khi vật phẩm được lưu chưa lấy trong `scanRadiusTiles = 12` ô, mép màn hình hiện mũi tên **tĩnh** nhịp thở ≥ 1 s. Hai biểu tượng: "lấy được" và "cần [vũ khí X]". Ẩn trong đấu trường boss và khi có kẻ địch trong 6 ô. Tiếng ping 1 lần khi vào tầm (tối đa 1 lần mỗi 10 s). Tính cả vật của nhiệm vụ phụ đang làm (`15-…`) |
| 2 | Stage 2, Frost Shard | Thân Mk I | `damageTakenMul = 0.85` (chỉ đòn kẻ địch và boss) |
| 3 | Stage 3, Gale Cutter | Tay Mk I | **Đạn nạp vừa phá khiên** (`midChargeBreaksShield = true`). Không trùng V1 nữa |

Chân Mk I (cần Quake Drill, Stage 5) và mọi bản Mk II: Alpha. Mở két thì Mira chế tạo ngay; mỗi bộ phận bật/tắt riêng, mặc định bật.

### 2.4 Trạng thái nút kỹ năng

| Trạng thái | Điều kiện | Chạm / bấm |
| --- | --- | --- |
| Khóa | Tầng trước chưa đủ bậc | Mô tả và điều kiện mở |
| Học được | Mở, chưa đủ bậc, SP còn ≥ 1 | Nút "Học (1 SP)" riêng (tránh học nhầm) |
| Thiếu SP | Mở, chưa đủ bậc, SP còn 0 | Mô tả, nút học mờ |
| Đủ bậc | Bậc = tối đa | Mô tả |

Đặt lại: "Đặt lại nhánh" (từng nhánh) và "Đặt lại tất cả", có bước xác nhận, hoàn 100% SP, miễn phí, không giới hạn.

### 2.5 Chỉnh kỹ năng ngay trong màn

Menu tạm dừng có mục **Kỹ năng** mở cùng bảng tab Kỹ năng (học, đặt lại). Thay đổi **áp dụng ở lần hồi sinh kế tiếp** (checkpoint) hoặc lần vào màn sau, không áp giữa lúc đang sống (không đổi khiên lấy sát thương giữa một đòn boss). Nhờ vậy chết ở boss muốn đổi C3 lấy V3 không phải thoát màn rồi chơi lại 8–15 phút. GDD 6.2 "đổi tại Hub" mở rộng thành "tại Hub hoặc trong menu tạm dừng" (mục 9).

## 3. Công thức, cộng dồn và trần sức mạnh

### 3.1 Quy tắc cộng dồn

Hệ số cùng loại **nhân với nhau**, rồi kẹp theo sàn trong dữ liệu. Sàn chỉ áp lên **tích các hệ số của build** (kỹ năng, giáp, upgrade, booster), **không gồm hệ số độ khó**.

```text
fullChargeTime = base × V1 × (1 / (1 + overcharge.chargeSpeed)) ; ≥ minFullChargeSec (0.8 s) ; phải > midCharge.timeSec
midChargeTime  = base (không kỹ năng nào đổi)
damageTaken    = round(raw × difficulty.damageTaken × max(minBuildDamageTakenMul, (1 − plating × lvl) × ThânMkI)) ; ≥ 1 ; chỉ đòn kẻ địch và boss
envDamage      = round(raw × difficulty.damageTaken)   // gai, hố: build không giảm, để duyệt màn đoán trước được
maxHp          = round(hp(L hiệu dụng) × C1)
damageDealt    = base × atk(L)/atk(1) × (1 + arc_core.damagePerLevel × lvl) × [V3 khi đang hở] × [Last Stand]
energyMax      = round(weapons.energyMax × (1 + energy_cell.energyMaxPerLevel × lvl))   // 28 → 32 → 36 → 41 → 45 → 49 (EP-09, +15%/cấp; round(28 × 1,75) = 49)
magnet         = magnet_range.magnetTilesPerLevel × lvl ô, tính từ thân Kai; Core Bit bay tới 12 ô/s (EP-09)
khiên          : khiên C3 chặn trước, rồi Booster shield_cell
```

Các hệ số Upgrade và Booster dùng trong công thức (`arc_core.damagePerLevel = 0.05`, `armor_plating.damageTakenPerLevel = 0.04`, `overcharge.chargeSpeed = 0.3`) thêm thành **trường số** trong `shop.json` và được kiểm tra ở `core/shop-config.ts` (hiện chỉ là chuỗi chữ).

### 3.2 Đo DPS bằng mô phỏng, không tính tay

Technical Director chạy mô phỏng dùng chính `WeaponLoadout` và `PlayerPhysics` của game (mục tiêu cách 5 ô, phát nào cũng trúng), sát thương mỗi giây (đơn vị: phát Arc Cannon gốc):

| Lối bắn | Gốc | Tăng tốc nạp áp cả nạp vừa (bản 1, sai) | Tăng tốc chỉ áp nạp đầy (bản 2) |
| --- | --- | --- | --- |
| Bắn thường, bàn phím (giới hạn 0,12 s) | **7,47** | 7,47 | 7,47 |
| Chu kỳ nạp vừa, bàn phím | 5,77 | 9,42 | 5,77 |
| Chu kỳ nạp đầy, bàn phím (ở sàn) | | | 4,95 |
| Tự bắn + nạp vừa, cảm ứng | **9,62** | 12,55 | 9,62 |
| Tự bắn + nạp đầy, cảm ứng (ở sàn) | | | 8,68 |

Kết luận: khi tăng tốc nạp **chỉ áp nạp đầy** và sàn nạp đầy lớn hơn nạp vừa, lối nạp đầy luôn thấp hơn lối mạnh nhất. Mô phỏng của ST-08-04 (`tests/power-cap.test.ts`, đo lại: bắn liên thanh 7,40; nạp vừa + tự bắn cảm ứng 9,15) thấy trên cảm ứng, nếu **mọi** phát nạp đầy đều trúng lúc boss hở thì lối nạp đầy có Đòn Trừng Phạt vượt mốc (9,4 ở sàn 0,75 s). Vì vậy sàn nạp đầy nâng lên **0,8 s** (V1 + Overcharge = 0,785 s → 0,8 s), và phép thử giả định tối đa 1/3 số phát nạp đầy trúng lúc boss hở (dữ liệu Thorna: boss hở khoảng 1/4 thời gian; boss mới có pha hồi dài hơn thì phải chạy lại). Với giả định đó, lối nạp đầy có build vẫn thấp hơn lối mạnh nhất không build (bắn thường trên bàn phím, nạp vừa + tự bắn trên cảm ứng). Vì vậy V1, V3 (chỉ cho đạn nạp đầy) và Overcharge làm lối nạp đầy hấp dẫn hơn mà **không nâng DPS tối đa**. V2 chỉ đánh mục tiêu khác. Phép kiểm tra trần bằng mô phỏng theo bốn lối bắn trên là một test bắt buộc (Story ST-08-04).

### 3.3 Trần sức mạnh cốt truyện

GDD 6.1: cấp + upgrade + module ≤ ×2,2 sát thương, ≤ ×2,5 máu so với cấp 1. Bản 1 phát hiện: riêng cấp 30 × Upgrade tối đa đã là 1,725 × 1,25 = 2,156, và Citadel, màn cuối **không đồng bộ cấp**, chưa có cấp khuyến nghị trong dữ liệu, nên người cấp 30 vào Citadel với kỹ năng sẽ vượt trần.

| Cách sửa | Ưu | Nhược |
| --- | --- | --- |
| (a) Thêm cấp khuyến nghị cho Citadel, đồng bộ cấp (chỉ kẹp trên) cho Citadel và màn cuối, đo ở mốc suy từ dữ liệu | Giữ công thức công | Thêm luật mới, trái GDD 6.1 ("Citadel không đồng bộ"); phép kiểm tra phức tạp |
| **(b) Chốt: hạ công theo cấp `atk = "10+0.2*(L-1)"`, giữ phép đo ở cấp tối đa như code hiện có** | Đơn giản, không thêm luật; hợp GDD 6.1 ("phần thưởng chính khi lên cấp là SP và ô module, không phải chỉ số") | Đổi một công thức `[PLACEHOLDER]` của GDD |

Với (b), hệ số **thường trực** (đo ở cấp 30, đã gồm Upgrade tối đa): sát thương 1,58 × 1,25 = **1,975 ≤ 2,2**; máu 2,16 × 1,15 (C1) = **2,48 ≤ 2,5**. Kỹ năng Vanguard không nâng DPS tối đa (mục 3.2) nên không cộng vào hệ số này.

**Hai ràng buộc thêm, có trong dữ liệu `player.json` → `storyPowerCap` và kiểm tra lúc nạp:**

- `conditionalDamageMul = 2.6`: trường hợp xấu nhất có hiệu ứng `conditional` (Last Stand): 1,975 × 1,3 = 2,57 ≤ 2,6.
- `effectiveHpMul = 3.75`: máu hiệu dụng ở cấp 30 với C1, Upgrade `armor_plating` tối đa và Thân Mk I: 2,484 / (0,8 × 0,85) = 3,65 ≤ 3,75. **Thân Mk II (Alpha, chốt khi rà soát 14/11/2026):** Mk II **thay thế** Mk I, không cộng dồn: vẫn `damageTakenMul = 0.85`, thêm phản đòn 2 sát thương (`reflectDamage = 2`) `[PLACEHOLDER]`. Máu hiệu dụng giữ 3,65 ≤ 3,75 (bản cũ: Mk II −20% ra 3,88; GDD chính ghi −25% ra 4,14).

Một hàm `statsFor(level, buildStats)` dùng chung cho StageWorld và phép kiểm tra lúc nạp, để số trong trận và số được kiểm tra không lệch.

### 3.4 Giá trị biên (với (b))

| Mốc | Máu (không C1 / có C1) | Công theo cấp | Ghi chú |
| --- | --- | --- | --- |
| Cấp 1 | 100 / 115 | 1,000 | |
| Cấp 4 (hết Stage 1) | 112 / 129 | 1,060 | C1 thêm khoảng 1 đòn boss (12–18) |
| Cấp 10 (cuối MVP) | 136 / 156 | 1,180 | |
| Cấp hiệu dụng 20 (Stage 8, đồng bộ) | 176 / 202 | 1,380 | |
| Cấp 30 | 216 / 248 | 1,580 | Thường trực × Upgrade 1,25 = 1,975 |

## 4. Giao tiếp hệ thống và dữ liệu

- **Build thuần, hai phần** (`logic/rpg/build.ts`):
  - `stats`: biến đổi dữ liệu thuần `applyBuild(player, weapons, build) → { player, weapons }` (thời gian nạp đầy, trượt tường, máu, hồi năng lượng, bất tử lướt với đạn). Dùng ở **constructor, `setLevel()` và `retune()`** của StageWorld, để lên cấp giữa màn hay bảng `?tune=1` không xóa mất hiệu ứng.
  - `mechanics`: cờ và thông số cơ chế (lượt lướt trên không, nổ lan, trừng phạt, khiên, sượt đạn, module), chạy trong `BuildRuntime` thuộc StageWorld.
- **`PlayerPhysics.absorbHit()`** cho khiên C3: bất tử 0,3 s, không bật lùi, không phát sự kiện `hurt` (không mất nạp, không kích tín hiệu `hurt` của hướng dẫn).
- **WorldEvents mới:** `kaiShieldAbsorbed`, `kaiShieldReady`, `airDash`, `graze`, `burst`, `punishHit` (tiền tố `kaiShield` để không lẫn với `shieldBroken`/`shieldHit` của khiên Lính Kén). HUD đọc trạng thái khiên qua `HudModel`, không qua event bus. Sự kiện event bus cho Xưởng (`skill:learned`...) chỉ thêm khi có nơi nghe (M16).
- **Bản lưu** (nâng `SAVE_VERSION` lên 2; bản 1 nâng lên với giá trị trống; build cũ gặp bản 2 thì chỉ đọc, không ghi đè mất kỹ năng):

```text
character.skills       : Record<nodeId, rank>
character.modules      : { owned: string[] }
character.loadouts     : [{ modules: string[]; armorOff: string[] }]   // MVP chỉ dùng phần tử 0; Alpha thêm preset không cần nâng bản lưu
character.activeLoadout: number
Bộ phận giáp đã có     : suy từ bí mật đã nhặt (không lưu)
SP còn lại             : skillPoints(cấp, boss) − Σ rank (không lưu)
```

- **`normalizeBuild(save, config)`** chạy sau `SaveManager.open` và sau khi nhập mã sao lưu (cần dữ liệu cấu hình nên không đặt trong `parseSave`), ghi lại một lần và báo một lần nếu có sửa (mục 5).

## 5. Trường hợp biên

| Tình huống | Xử lý |
| --- | --- |
| Σ bậc > SP có, bậc vượt tối đa, mất điều kiện tầng trước, nút lạ | `normalizeBuild`: đặt lại phần sai (cả cây nếu Σ bậc > SP), hoàn SP, báo một lần |
| Module lạ hoặc vượt tải sau khi đổi dữ liệu | Gỡ từ module lắp sau cùng tới khi vừa tải |
| Bản lưu chỉ đọc (của phiên bản mới hơn) | Xưởng khóa, chỉ xem |
| **Chết** | Khiên sẵn sàng, lượt lướt trên không hồi (trận boss chơi lại giống nhau). Thay đổi kỹ năng từ menu tạm dừng áp dụng tại đây |
| **Rơi hố còn máu** | Giữ trạng thái khiên và đồng hồ hồi |
| **Chạm gai** (về chỗ an toàn) | Không làm mới gì: trạng thái build nằm ở `BuildRuntime`, không trong `PlayerPhysics.respawn` |
| Hit-stop, chờ hồi sinh | Đồng hồ hồi khiên dừng (đếm sau cổng hit-stop và hồi sinh của `world.step`) |
| Khiên C3 và Booster Khiên cùng có | Khiên kỹ năng chặn trước (Booster `shield_cell` có trong `shop.json` nhưng chưa chạy trong trận; khi làm thì gọi sau khiên C3 trong `resolveEnemyHits`) |
| Hai đòn trúng cùng một bước | Khiên chặn đòn đầu; bất tử 0,3 s nên đòn sau cùng bước cũng không trúng |
| Đòn trúng đúng bước khiên hồi | Thứ tự trong bước: hồi khiên → xử lý trúng đòn |
| Đạn nạp đầy xuyên 1 mục tiêu nên nổ 2 lần | Vụ nổ bỏ qua mục tiêu trong `p.hitIds` và thêm mục tiêu bị nổ vào đó: mỗi mục tiêu nhận tối đa một lần sát thương từ mỗi viên |
| Nổ lan trúng Lính Kén có khiên | Không phá khiên (chỉ đạn nạp đầy trực tiếp phá) |
| Lướt trong thời gian coyote | Tính là lướt đất, không tốn lượt lướt trên không |
| Màn chơi thử cổng Prototype (màn xám) | Bỏ qua mọi kỹ năng, module, giáp; nhóm "Bộ kỹ năng" của bảng `?tune=1` tắt ở màn này |

## 6. Giao diện và phản hồi

- **Xưởng:** bảng HTML (ADR-001), tab Kỹ năng theo `Workshop.html`; tab Module, Giáp hiện khóa kèm điều kiện. Thanh trên: Core Bit, **SP còn lại**. Nút có chấm bậc (●●○). Thay đổi tự lưu. Điều hướng bằng chạm, bàn phím, tay cầm.
- **Lối vào:** menu (Hub dạng menu của MVP) → Xưởng; nút **Mở Xưởng** ở màn Kết quả sáng khi còn SP; menu tạm dừng → Kỹ năng (mục 2.5); hướng dẫn R02–R03 sau boss 1.
- **Trạng thái sống còn hiện trên người Kai**, không chỉ ở góc HUD, và không chỉ bằng màu (chế độ mù màu, GDD 11):

| Kỹ năng, module | Tín hiệu |
| --- | --- |
| P1 | Đèn đẩy ở chân sáng khi còn lượt lướt trên không; chớp một lần khi hồi lượt |
| P3 | Bóng mờ màu lục lam suốt phần bất tử thêm; tia sáng và tiếng "sượt" khi đạn đi xuyên |
| C3 | Viền khiên tím nhạt quanh Kai (chớp trắng lúc vừa hồi); biểu tượng HUD dạng vòng đếm hồi dưới thanh năng lượng; khiên vỡ: 8 mảnh kính bay ra, rung bậc vừa, dừng hình 2 bước (người chơi biết mình đã bị trúng); tiếng riêng làm ở M12 |
| V3 | Boss lộ lõi sáng khi đang hở |
| Last Stand | Viền đỏ quanh Kai, đạn ánh đỏ |
| Energy Siphon | Thanh năng lượng nháy "+2" |

- **Ba bậc phản hồi** (đặt trong `ui.json`, không chồng lên nhau):

| Bậc | Dừng hình | Rung | Dùng cho |
| --- | --- | --- | --- |
| Nhỏ | 0 | 0 | Sượt đạn, Siphon, ping radar |
| Vừa | 1–2 bước | trauma ≤ 0,2 | Nổ lan V2 (vòng tròn đúng bán kính, 0,2 s), khiên vỡ |
| Lớn | 3 bước (như hiện có) | như hiện có | Nạp đầy, điểm yếu, Đòn Trừng Phạt |

- **Âm thanh (M12):** tiếng lướt trên không khác lướt đất; tiếng sượt đạn; khiên vỡ, khiên sẵn (hạ âm lượng khi boss đang báo đòn); nhịp tim khi Last Stand bật (tắt được); ping radar ≤ 1 lần mỗi 10 s; tiếng học kỹ năng. Id theo `12-Am-thanh.md`: `kai.dash.air`, `kai.graze`, `kai.shield.break`, `kai.shield.ready`, `fx.burst`, `hit.punish`, `ui.learn`, `kai.laststand`, `radar.ping`.
- **Phụ thuộc chưa có:** tùy chọn "giảm rung, giảm nhấp nháy" (mục Tùy chọn của menu tạm dừng còn mờ); khi làm phải áp lên ba bậc phản hồi trên.

## 7. Nút tinh chỉnh

Mọi số ở mục 2–3 nằm trong `skills.json`, `modules.json`, `armor.json`, `player.json` (`level`, `moduleSlots`, `storyPowerCap`), `shop.json` (trường số mới), `ui.json` (bậc phản hồi). Bảng chỉnh cảm giác (`?tune=1`) thêm nhóm "Bộ kỹ năng" để bật/tắt từng nút khi chơi thử (tắt ở màn xám).

## 8. Tiêu chí kiểm thử và giả thuyết

| Giả thuyết | Đo bằng | Đạt khi |
| --- | --- | --- |
| Có lựa chọn thật | Build ghi lại khi vào màn và khi qua cửa boss (M16 hoặc nhật ký chơi thử) | Không nút tầng 3 nào bị bỏ ở hơn 60% người chơi |
| Người chơi tự quay lại Xưởng | Số lần mở Xưởng không do hướng dẫn nhắc | ≥ 50% người chơi tự mở lại trước cuối MVP |
| SP được dùng | SP còn lại khi vào Stage 2 | ≥ 70% người chơi tiêu hết SP trước Stage 2 |
| Không phá trần | Test logic: hệ số thường trực ở cấp tối đa, trường hợp có điều kiện, máu hiệu dụng; mô phỏng 4 lối bắn (mục 3.2) | ≤ `storyPowerCap` trong dữ liệu; lối nạp đầy có build thấp hơn lối mạnh nhất không build |
| Phòng thủ không thay được né | Mô phỏng: bot không né, có và không có nhánh Core đủ bậc, đấu Thorna ở Thường | Ở cấp 4 (cấp dự kiến cuối Stage 1), bot không né **thua** Thorna, kể cả build Core đủ bậc (6 SP, nhiều hơn số SP có trước khi hạ Thorna); khiên chặn tối đa một đòn mỗi lần hồi; máu tối đa chỉ thêm đúng phần C1. Đạt từ 14/11/2026 sau khi nâng máu Thorna 100 → 250: với 100 máu, bot không né thắng sau khoảng 15 s (mục tiêu cũ 60–90 s; nay 45–65 s với người né được, đặc tả Stage 1 mục 5) |
| P3 không thành bất tử liên tục | Test logic, mẫu lướt đủ cú liên tục (chu kỳ đo được 50 bước: 15 bước lướt + 36 bước hồi tính từ bước lướt kết thúc) | Tỉ lệ thời gian bất tử với đạn ≤ gốc + 8 điểm % (gốc 6/50 = 12%; bậc 3: 10/50 = 20%) |
| Khiên không "ăn" được đòn đỉnh | Mô phỏng Hoa Nở với khiên sẵn, Kai đứng yên dưới một hạt | Vẫn trúng hạt (18 máu ở Thường), khiên vẫn sẵn. Đổi ở ST-08-08: Hoa Nở rơi cả 12 hạt cùng lúc nên Kai đứng yên chỉ trúng đúng một hạt; tiêu chí cũ "trúng sau khi khiên vỡ" không thể đạt, nên hạt Hoa Nở xuyên khiên |

**Rủi ro P3 với Dash Coil (rà soát 14/11/2026):** test P3 đo ở chu kỳ 50 bước, tức chưa có Dash Coil. Khi Dash Coil tối đa (−30% hồi lướt: 36 → 25 bước, chu kỳ 40 bước), gốc thành 6/40 = 15% và P3 bậc 3 thành 10/40 = 25%, tức +10 điểm, vượt ngưỡng +8. **Chốt:** trước khi bán Dash Coil (Story làm tác dụng Dash Coil), đo lại test này ở Dash Coil tối đa và nâng ngưỡng lên **+10 điểm %**. Không giảm Dash Coil.

Nghiệm thu: test logic cho `applyBuild`, `BuildRuntime`, cộng dồn, sàn, trần, `normalizeBuild`, bản lưu 2; chạy thử trên PC và điện thoại theo quy tắc nhìn tận mắt.

## 9. Thay đổi cần lan sang tài liệu khác (`/propagate-design-change`)

Đã áp dụng ngày 14/11/2026 (riêng dữ liệu `player.json`, `shop.json` áp trong Story ST-08-01; `moduleSlots` trong ST-08-09):

| Tài liệu | Thay đổi |
| --- | --- |
| GDD chính 6.1 | Công: `10 + 0,2 × (L − 1)` (cấp 30 ≈ 15,8, ×1,58); trần đo ở cấp tối đa với hệ số thường trực, thêm hai ràng buộc có điều kiện và máu hiệu dụng |
| GDD chính 6.2 | Trỏ tài liệu này cho danh sách kỹ năng; Vanguard: "nạp nhanh, nổ lan, trừng phạt lúc boss hở" (thay "chí mạng"); đặt lại "tại Hub hoặc trong menu tạm dừng, áp dụng khi hồi sinh" |
| GDD chính 6.3 | Tay Mk I MVP: đạn nạp vừa phá khiên (thay "bắn nạp nhanh hơn", trùng V1) |
| GDD chính 6.4 | Energy Siphon 2 đơn vị năng lượng mỗi lần hạ; Last Stand và Phase Step tải 3 |
| `player.json` | `level.atk`, `storyPowerCap.conditionalDamageMul`, `storyPowerCap.effectiveHpMul`, `moduleSlots` dạng mốc cấp, `moduleLoadPerSlot` |
| `shop.json` | Trường số cho `arc_core`, `armor_plating`, `overcharge` |
| `03-Dac-ta-Hub-Shop.md` mục 5 | MVP: tab Kỹ năng trước, Module và Giáp khi có nội dung Stage 2–4; Tủ skin, Loadout sang Alpha; nút có nhiều bậc, mỗi bậc 1 SP; đặt lại theo nhánh |
| `07-Kich-ban-huong-dan.md` | R03: "Mỗi lần học tốn 1 điểm"; D02: bỏ "biểu tượng khóa trên bản đồ nhỏ", thay bằng biểu tượng "cần [vũ khí X]" của radar Đầu Mk I |
| Checklist duyệt màn (M7) | Luật "vật phẩm được lưu tới được bằng bộ động tác gốc" (mục 1) |
| Wireframe `Workshop.html` | Chấm bậc, nút đặt lại nhánh; Tủ skin, Loadout hiện "Alpha" |
| `04-Dev-Plan/02-Module.md` M8 | Nguồn thêm tài liệu này |

## 10. Quyết định cần người dùng duyệt

1. **Cây kỹ năng phương án E** và danh sách 9 nút ở mục 2.1 (đã đổi V3 thành Đòn Trừng Phạt, P3 chỉ bất tử với đạn, C3 bất tử 0,3 s, C1 +15% máu).
2. **Hạ công theo cấp** từ 0,25 xuống 0,2 mỗi cấp (mục 3.3, cách (b)), thay vì thêm đồng bộ cấp cho Citadel.
3. **Phạm vi:** tab Kỹ năng làm ngay; Module, Giáp làm khi có nội dung Stage 2–4; Tủ skin, Loadout sang Alpha.
4. **Chỉnh kỹ năng trong menu tạm dừng**, áp dụng khi hồi sinh (mục 2.5).
5. **Gai và hố không bị build giảm sát thương** (mục 3.1), để giữ phép kiểm tra "gai/hố không giết ngay Kai cấp 1" và để duyệt màn đoán trước được.
