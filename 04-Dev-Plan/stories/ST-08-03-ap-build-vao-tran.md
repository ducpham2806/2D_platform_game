# ST-08-03: Áp build vào trận: V1, P2 bậc 1, C1, C2

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P1 · **Trạng thái:** DONE (14/11/2026)
- **Phụ thuộc:** ST-08-02
- **Bằng chứng:** [x] Logic [x] Integration [x] Visual (chạy thử màn với build)

## 1. User story

> **Là** người chơi, **tôi muốn** kỹ năng đã học có tác dụng ngay khi vào màn, **để** cảm nhận được lựa chọn của mình.

## 2. Bối cảnh (nhúng từ GDD)

- **`applyBuild(player, weapons, build) → { player, weapons }`** biến đổi dữ liệu thuần:
  - V1: chỉ `arcCannon.charge.timeSec × fullChargeTimeMul`, kẹp ≥ `minFullChargeSec`. **Không** đổi `midCharge.timeSec`.
  - P2 bậc 1: `wallSlideTilesPerSec × wallSlideMul`.
  - C1: máu tối đa × `maxHpMul`.
  - C2: `energyRegen.perSec × energyRegenMul`, `afterNoFireSec = regenDelaySec`.
- **`statsFor(level, buildStats)`** dùng chung cho StageWorld và phép kiểm tra lúc nạp: `maxHp = round(hp(L) × maxHpMul)`, `attackMul = atk(L)/atk(1)`.
- **StageWorld:** `WorldSetup.build` (không có = build trống). Áp ở constructor, ở `setLevel()` (lên cấp giữa màn vẫn giữ C1) và ở `retune()` (bảng `?tune=1` không xóa build).
- **Màn xám** (cổng Prototype, `def.playtest`): build trống, như quy tắc cấp 1 hiện có.
- Nút chưa có cơ chế (V2, V3, P1, P3, C3, P2 bậc 2) học được nhưng chưa có tác dụng tới ST-08-06…08; mô tả ghi "(sắp có)".

## 3. File

- `[Tạo]` `game/src/logic/rpg/build.ts` (`computeBuild`, `applyBuild`, `statsFor`)
- `[Cập nhật]` `game/src/logic/world/stage-world.ts`, `game/src/scenes/stage-scene.ts`, `game/src/core/game-config.ts` (dùng `statsFor`)
- `[Tạo]` `game/tests/build.test.ts`

## 4. Tiêu chí nghiệm thu

- [x] AC-1: Có V1 thì nạp đầy 1,02 s, nạp vừa vẫn 0,5 s; hệ số quá nhỏ thì kẹp ở sàn (0,75 s lúc làm; ST-08-04 nâng lên 0,8 s) (`tests/build.test.ts`). (Overcharge áp khi có Booster, M9.)
- [x] AC-2: Có C1 ở cấp 4: máu tối đa 129; lên cấp 5 giữa màn: 133, máu hiện tại cộng phần chênh.
- [x] AC-3: `retune()` giữ build (dữ liệu chỉnh là dữ liệu gốc, `world.tuning` vẫn trả số gốc); màn xám bỏ qua build.
- [x] AC-4: Chạy thử Chromium với bản lưu cấp 3, P1 + P2 + C1:
  - Phòng thử màn chơi: cấp 3, máu tối đa 124 (108 × 1,15), trượt tường 19,2 px/s (2 × 0,6 ô/s).
  - Màn xám: build trống, máu 100, trượt tường 32 px/s.
  - Menu hiện "SP còn 0". Không lỗi console.
  - Ảnh HUD: `04-Dev-Plan/qa/ST-08-03/hud-c1-cap3.png`.
