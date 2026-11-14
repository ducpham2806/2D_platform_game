# ST-08-01: Dữ liệu kỹ năng, số hóa Upgrade/Booster, trần sức mạnh mới

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P1 (Vertical slice) · **Trạng thái:** READY
- **Phụ thuộc:** không (GDD đã duyệt 14/11/2026)
- **Bằng chứng:** [x] Logic [x] Config [ ] Visual

## 1. User story

> **Là** người thiết kế, **tôi muốn** mọi số của cây kỹ năng, Upgrade và trần sức mạnh nằm trong `03-Data` và được kiểm tra lúc nạp, **để** chỉnh cân bằng không phải sửa mã và dữ liệu sai thì game báo ngay.

## 2. Bối cảnh (nhúng từ GDD)

- **Cây:** 3 nhánh `vanguard`, `phantom`, `core`; mỗi nhánh 3 nút tầng 1–3 có 1 / 2 / 3 bậc; mỗi bậc 1 SP; tầng sau mở khi tầng trước đủ bậc. Tổng 18 bậc.
- **Giá trị từng bậc** (tương đối so với số gốc):
  - V1 `fullChargeTimeMul` [0.85].
  - V2 `burstDamageMul` [0.3, 0.5], `burstRadiusTiles` [1.0, 1.5].
  - V3 `punishMul` [1.3, 1.4, 1.5].
  - P1 `airDashesPerAirborne` [1].
  - P2 `wallSlideMul` [0.6, 0.6], `wallJumpGraceSec` [0, 0.1].
  - P3 `projectileIFrameSteps` [3, 4, 4], `grazeChargeSec` [0, 0, 0.25].
  - C1 `maxHpMul` [1.15].
  - C2 `energyRegenMul` [1.25, 1.5], `regenDelaySec` [3, 2].
  - C3 `shieldRechargeSec` [30, 25, 20], `shieldIFrameSec` 0.3.
- **Luật bậc** (kiểm lúc nạp): mỗi bậc sau tăng phần thưởng ≥ 20% hoặc thêm hiệu ứng mới (một tham số từ 0 thành khác 0). Bậc 1 nút tầng 3 ≥ 60% hiệu lực tối đa. Với tham số "càng nhỏ càng mạnh" (`*Mul` < 1, `shieldRechargeSec`), so phần thưởng là `1 − giá trị` hoặc `1 / giá trị`.
- **Quy tắc chung** (`skills.json` → `rules`): `minFullChargeSec = 0.75` (phải > `weapons.arcCannon.midCharge.timeSec`), `minBuildDamageTakenMul = 0.5`.
- **`shop.json`**, thêm trường số và kiểm tra ở `core/shop-config.ts`:
  - `arc_core.damagePerLevel = 0.05`
  - `armor_plating.damageTakenPerLevel = 0.04`
  - `overcharge.chargeSpeed = 0.3`
- **Trần** (`player.json`):
  - `level.atk = "10+0.2*(L-1)"`
  - `storyPowerCap` thêm `conditionalDamageMul = 2.6` và `effectiveHpMul = 3.75`
- **Kiến trúc:** `core/*-config.ts` thuần, ném `ConfigError` có đường dẫn khóa. `shop` và `skills` vào `REQUIRED_DATA_FILES` và `GameConfig` (hiện `shop` chỉ ở `raw`).

## 3. File

- `[Tạo]` `03-Data/skills.json`, `game/src/core/skills-config.ts`, `game/src/core/shop-config.ts`
- `[Cập nhật]` `03-Data/shop.json`, `03-Data/player.json`, `game/src/core/player-config.ts`, `game/src/core/game-config.ts`
- `[Tạo]` `game/tests/skills-config.test.ts`; `[Cập nhật]` `game/tests/rpg.test.ts` (công cấp 30 = 1,58)

## 4. Tiêu chí nghiệm thu

- [ ] AC-1: dữ liệu thật nạp được; `config.skills` có 3 nhánh, 9 nút, 18 bậc.
- [ ] AC-2: báo lỗi khi:
  - nút tầng 2 có bậc 1 yếu hơn nút tầng 1;
  - bậc 1 nút tầng 3 dưới 60% hiệu lực tối đa;
  - `minFullChargeSec` ≤ thời gian nạp vừa;
  - trường số Upgrade thiếu hoặc âm;
  - trường hợp có điều kiện vượt `conditionalDamageMul`.
- [ ] AC-3: `npm test`, lint, format, build đạt; không số gameplay nào trong mã.
