# ST-08-08: Core: Khiên Hấp Thụ, BuildRuntime, quy tắc hồi sinh

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P0 (MVP) · **Trạng thái:** TODO
- **Phụ thuộc:** ST-08-03
- **Bằng chứng:** [x] Logic [x] Visual

## 1. User story

> **Là** người chơi chọn sống sót, **tôi muốn** một lớp khiên chặn trọn một đòn rồi hồi lại, **để** có chỗ sai mà vẫn phải học né.

## 2. Bối cảnh (nhúng từ GDD)

- **Khi khiên chặn một đòn** của kẻ địch hoặc boss:
  - 0 sát thương, không bật lùi;
  - bất tử `shieldIFrameSec = 0.3` s;
  - không mất mức nạp;
  - không phát sự kiện `hurt` (không kích tín hiệu `hurt` của hướng dẫn).

  Làm qua `PlayerPhysics.absorbHit()`.
- **Hồi khiên:** sau `shieldRechargeSec` (30 / 25 / 20 s) **tính từ lúc khiên vỡ**. Không chặn gai và hố.
- **`BuildRuntime`** nằm trong StageWorld, không trong `PlayerPhysics`. Nhờ vậy `hitHazard()` gọi `respawn` (chạm gai) không làm mới trạng thái.
  - Đồng hồ hồi đếm sau cổng hit-stop và chờ hồi sinh của `world.step`.
- **Thứ tự trong một bước:** hồi khiên → xử lý trúng đòn.
- **Chết:** khiên sẵn sàng (trận boss chơi lại giống nhau). **Rơi hố còn máu:** giữ nguyên. Khiên kỹ năng chặn trước Booster Khiên.
- **Tín hiệu:**
  - Viền khiên quanh Kai khi sẵn.
  - Biểu tượng HUD dạng vòng đếm hồi, đọc qua `HudModel`, không qua event bus.
  - Khiên vỡ: hiệu ứng vỡ kính, tiếng riêng, dừng hình 2 bước (bậc phản hồi "Vừa").
- **WorldEvents:** `kaiShieldAbsorbed`, `kaiShieldReady`.

## 3. File

- `[Tạo]` `game/src/logic/rpg/build-runtime.ts`
- `[Cập nhật]` `game/src/logic/player/player-physics.ts` (`absorbHit`), `game/src/logic/world/stage-world.ts`, `game/src/logic/world/hits.ts`, `game/src/logic/world/world-types.ts`, `game/src/logic/hud/hud-model.ts`, `game/src/scenes/stage/stage-hud.ts`, `game/src/scenes/stage-scene.ts`
- `[Tạo]` `game/tests/shield.test.ts`; `[Cập nhật]` `game/tests/power-cap.test.ts` (Hoa Nở với khiên, bot phòng thủ)

## 4. Tiêu chí nghiệm thu

- [ ] AC-1: Khiên chặn Gai Quạt (12): máu giữ nguyên, không bật lùi, mức nạp giữ; đòn thứ hai trong 0,3 s không trúng, sau 0,3 s trúng bình thường.
- [ ] AC-2: Bậc 3 hồi sau 20 s tính từ lúc vỡ (không reset khi mất máu); chạm gai không làm mới khiên; chết thì khiên sẵn.
- [ ] AC-3: Hoa Nở với khiên sẵn, đứng yên: vẫn trúng ít nhất 1 hạt; bot phòng thủ vẫn thua Thorna.
- [ ] AC-4: Ảnh viền khiên và vòng hồi ở `04-Dev-Plan/qa/ST-08-08/`.
