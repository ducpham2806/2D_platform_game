# ST-09-03: Áp Upgrade vào trận: công, giáp, năng lượng, nam châm

- **Thuộc Epic:** EP-09 · **Ưu tiên:** P1 · **Trạng thái:** DONE (14/11/2026)
- **Phụ thuộc:** ST-09-01 · **Bằng chứng:** [x] Logic [x] Visual (nam châm, chạy thử cùng ST-09-04)

## 1. User story

> **Là** người chơi, **tôi muốn** thấy món vừa mua có tác dụng ngay ở màn sau, **để** thấy Core Bit đáng tiền.

## 2. Bối cảnh (GDD 10 mục 3.1)

```text
damageDealt = base × atk(L)/atk(1) × (1 + arc_core.damagePerLevel × lvl) × [V3] × [Last Stand]
damageTaken = round(raw × difficulty.damageTaken × max(minBuildDamageTakenMul, (1 − plating × lvl) × ThânMkI)) ; ≥ 1 ; chỉ đòn kẻ địch và boss
envDamage   = round(raw × difficulty.damageTaken)   // gai, hố: không giảm
energyMax   = round(weapons.energyMax × (1 + energy_cell.energyMaxPerLevel × lvl))
magnet      = magnet_range.magnetTilesPerLevel × lvl ô (Core Bit, tính từ thân Kai), bay thẳng tới tâm Kai 12 ô/s
```

- Upgrade vào `BuildStats` (`damageMul`, `damageTakenMul`, `energyMaxMul`, `magnetTiles`) qua `computeBuild(skills, ranks, upgrades)`. Hồi sinh dựng lại build vẫn giữ Upgrade.
- `checkStoryPowerCap` tính bằng build có mọi kỹ năng và mọi Upgrade tối đa (một đường tính, không nhân riêng).

## 3. File

- `[Cập nhật]` `game/src/logic/rpg/build.ts`, `game/src/logic/world/{stage-world,enemy-field,pickups}.ts`, `game/src/core/game-config.ts`, `game/src/scenes/stage-scene.ts`
- `[Cập nhật]` test `game/tests/build.test.ts` hoặc `upgrades.test.ts`, `power-cap.test.ts`

## 4. Tiêu chí nghiệm thu

- [x] AC-1: Arc Core cấp 2: phát Arc Cannon gốc 1 vào bia/boss gây đúng 1 × 1,1 (theo cách làm tròn hiện có của `outgoingDamage`).
- [x] AC-2: Armor Plating cấp 2, độ khó Thường: Gai Quạt 12 → round(12 × 0,92) = 11; gai môi trường vẫn 30.
- [x] AC-3: Energy Cell cấp 2: năng lượng tối đa 34, HUD hiện x/34.
- [x] AC-4: Magnet Range cấp 1: viên Core Bit cách 0,9 ô bay tới và được nhặt; viên cách 1,5 ô nằm yên. Cấp 0: không viên nào bay. Viên máu không bị hút.
- [x] AC-5: Trần sức mạnh cho cùng kết quả như trước (Arc Core và Armor Plating tối đa); test cũ đạt.

- Test: `game/tests/upgrade-effects.test.ts` (6 test). Viên đã bị hút bay xuyên địa hình và không biến mất cho tới khi nhặt. Màn chơi thử (màn xám) vẫn dùng build trống, nên Upgrade không làm lệch số liệu chơi thử.
