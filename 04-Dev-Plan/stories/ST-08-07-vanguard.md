# ST-08-07: Vanguard: đạn nạp nổ lan, Đòn Trừng Phạt, bậc phản hồi

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P0 (MVP) · **Trạng thái:** TODO
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

- [ ] AC-1: V2 bậc 2: đạn nạp đầy (3) trúng Drone, Drone khác cách 1,2 ô nhận 1,5; Drone cách 2 ô không nhận; Lính Kén có khiên nhận nhưng khiên không vỡ.
- [ ] AC-2: V3 bậc 3: đạn nạp đầy trúng Thorna ở `recover` gây 4,5; ở `idle` gây 3.
- [ ] AC-3: Mô phỏng 4 lối bắn của ST-08-04 vẫn đạt khi có V3.
- [ ] AC-4: Ảnh vòng nổ và lõi sáng của boss ở `04-Dev-Plan/qa/ST-08-07/`.
