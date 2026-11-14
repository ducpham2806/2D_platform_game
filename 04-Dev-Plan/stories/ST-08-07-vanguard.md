# ST-08-07: Vanguard: đạn nạp nổ lan, Đòn Trừng Phạt, bậc phản hồi

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P0 (MVP) · **Trạng thái:** DONE (14/11/2026)
- **Phụ thuộc:** ST-08-03
- **Bằng chứng:** [x] Logic [x] Visual

## 1. User story

> **Là** người chơi thích nạp đầy, **tôi muốn** đạn nạp nổ lan và đánh mạnh hơn khi boss đang hở, **để** việc học mẫu đòn của boss được thưởng.

## 2. Bối cảnh (nhúng từ GDD)

- **V2:**
  - Đạn nạp đầy trúng mục tiêu thì nổ. Gây `burstDamageMul` (0,3 / 0,5) × sát thương đạn nạp cho mục tiêu khác trong `burstRadiusTiles` (1,0 / 1,5 ô).
  - Vụ nổ bỏ qua mục tiêu trong `p.hitIds` và thêm mục tiêu bị nổ vào đó. Đạn nạp đầy xuyên 1 mục tiêu nên có thể nổ 2 lần, nhưng mỗi mục tiêu chỉ nhận một lần.
  - Không phá khiên Lính Kén.
- **V3 Đòn Trừng Phạt:** đạn nạp đầy trúng mục tiêu **đang hở** thì sát thương × `punishMul` (1,3 / 1,4 / 1,5).
  - Đang hở với boss: trạng thái `recover`, hoặc `stunned` / `stun > 0` (đã có ở `logic/boss/boss.ts`).
  - Đang hở với mini-boss: trạng thái hồi tương đương (Golem: sau cú giậm).
  - Kẻ địch thường không tính.
  - Boss lộ **lõi sáng** khi đang hở.
- **Bậc phản hồi** (`ui.json` → `feedback`):

  | Bậc | Dừng hình | Rung | Dùng cho |
  | --- | --- | --- | --- |
  | Nhỏ | 0 | 0 | |
  | Vừa | 1–2 bước | trauma ≤ 0,2 | nổ lan (vòng tròn đúng bán kính, 0,2 s) |
  | Lớn | 3 bước | như hiện có | Đòn Trừng Phạt |

  Không thêm rung cho phát bắn thường.
- **WorldEvents:** `burstHit`, `punishHit`.

## 3. File

- `[Cập nhật]` `game/src/logic/world/hits.ts`, `game/src/logic/combat/projectiles.ts` (nếu cần vị trí nổ), `game/src/logic/boss/boss.ts` (`exposed`), `game/src/logic/enemy/` (Golem `exposed`), `03-Data/ui.json`, `game/src/core/ui-config.ts`, `game/src/scenes/stage/stage-renderer.ts`, `game/src/scenes/stage-scene.ts`
- `[Tạo]` `game/tests/vanguard.test.ts`

## 4. Tiêu chí nghiệm thu

- [x] AC-1: V2 bậc 2, đạn nạp đầy (3) trúng Drone (`tests/vanguard.test.ts`):
  - Drone khác cách 1,2 ô nhận 1,5; Drone cách 3 ô không nhận.
  - Lính Kén đang giơ khiên nhận 1,5 nhưng khiên không vỡ (`Enemy.applyBlast` bỏ qua khiên).
  - Mỗi mục tiêu nhận tối đa một lần từ mỗi viên (dùng `hitIds`). Chưa học V2 thì không nổ.
- [x] AC-2: V3 bậc 3: đạn nạp đầy trúng Thorna ở `recover` gây 4,5, lúc nghỉ gây 3. Boss đang choáng cũng tính là hở. Golem hở ở pha hồi; kẻ địch thường không bao giờ hở.
- [x] AC-3: Mô phỏng 4 lối bắn của ST-08-04 vẫn đạt (`power-cap.test.ts`).
- [x] AC-4: Chạy thử Chromium với bản lưu V1 + V2 + V3, ảnh ở `04-Dev-Plan/qa/ST-08-07/`:
  - Lõi sáng trắng viền vàng giữa thân Thorna lúc boss đang hở, chỉ hiện khi đã học V3.
  - Vòng nổ lan đúng bán kính 1,5 ô, mờ dần trong 0,2 s.
  - Bậc phản hồi ở `ui.json → feedback`, có kiểm tra bậc sau rung không nhẹ hơn bậc trước. Nổ lan rung bậc vừa, Đòn Trừng Phạt rung bậc lớn.
  - Không lỗi console.
