# ST-08-08: Core: Khiên Hấp Thụ, BuildRuntime, quy tắc hồi sinh

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P0 (MVP) · **Trạng thái:** DONE (14/11/2026)
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
- **Đổi khi làm Story (14/11/2026):** khiên không chặn hạt Hoa Nở (`skills.json → rules.shieldPierceKinds`), không chặn đòn 0 máu. Lý do ở AC-3.
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
- `[Tạo]` `game/tests/shield.test.ts`; `[Cập nhật]` `game/tests/power-cap.test.ts` (bot phòng thủ), `game/tests/stage-mechanics.test.ts` (hồi quy rơi hố), `03-Data/skills.json`, `game/src/core/skills-config.ts` (`shieldPierceKinds`), `game/src/logic/rpg/build.ts` (`ShieldStats`)

## 4. Tiêu chí nghiệm thu

- [x] AC-1: Khiên chặn Gai Quạt (12) (`tests/shield.test.ts`):
  - Máu giữ nguyên, không bật lùi, mức nạp giữ, dừng hình 2 bước.
  - Viên thứ hai cùng bước và trong 0,3 s không trúng; sau 0,3 s trúng bình thường (12 máu).
  - Thân kẻ địch cũng bị chặn; kẻ địch vô hại (0 máu) không làm vỡ khiên.
- [x] AC-2: Bậc 3 hồi đúng sau 2 bước dừng hình + 20 s × 60 bước tính từ lúc vỡ; mất máu giữa chừng không đặt lại. Chạm gai: khiên không chặn và không được làm mới. Rơi hố còn máu giữ đồng hồ; chết thì khiên sẵn. Đổi bậc khi đang hồi giữ thời gian đã hồi.
- [x] AC-3 (đổi tiêu chí): Hoa Nở rơi cả 12 hạt cùng lúc, nên Kai đứng yên chỉ trúng đúng một hạt. "Trúng sau khi khiên vỡ" không thể đạt, nên hạt Hoa Nở xuyên khiên:
  - Đứng yên dưới hạt: trúng 18 máu, khiên vẫn sẵn.
  - Bot không né (`power-cap.test.ts`): khiên chặn 1 đòn (≤ 1 + số lần hồi); tổng đòn chạm Kai lệch tối đa 1 so với không build; máu tối đa chỉ thêm phần C1. "Bot phòng thủ vẫn thua Thorna" không đạt vì Thorna đang quá dễ (cả bot không build cũng thắng sau 15 s); đã ghi ở cổng Prototype.
- [x] AC-4: Chạy thử Chromium (bản lưu C1 + C2 + C3, màn Thorna), ảnh ở `04-Dev-Plan/qa/ST-08-08/`, không lỗi console:
  - `khien-san.png`: viền tím nhạt quanh Kai, vòng HUD đầy.
  - `khien-vo.png`: máu giữ 138/138, mảnh kính bay ra.
  - `vong-hoi.png`: vòng HUD hồi 63%, Kai không còn viền.
- **Lỗi tìm thấy và đã sửa:** rơi hố còn máu thì bước sau hồi sinh lần hai theo nhánh chết. Đồng hồ chờ còn dư sai số > 0 nên Kai hồi đầy máu, kẻ địch dựng lại, boss tạo lại đầy máu. Đã sửa ở `StageWorld.step`, có test hồi quy trong `stage-mechanics.test.ts`.
- **Còn lại:** tiếng khiên vỡ và khiên sẵn làm ở M12 (chưa có âm thanh trong màn).
