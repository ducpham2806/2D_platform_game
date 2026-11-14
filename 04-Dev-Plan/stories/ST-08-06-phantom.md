# ST-08-06: Phantom: lượt lướt trên không, ân hạn nhảy tường, lướt xuyên đạn

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P0 (MVP) · **Trạng thái:** TODO
- **Phụ thuộc:** ST-08-03
- **Bằng chứng:** [x] Logic [x] Visual

## 1. User story

> **Là** người chơi thích cơ động, **tôi muốn** lướt trên không một lần mỗi cú nhảy, bám tường dễ hơn và lướt xuyên đạn, **để** né bằng di chuyển thay vì chịu đòn.

## 2. Bối cảnh (nhúng từ GDD)

- **P1:**
  - `airDashesPerAirborne = 1`. Hiện cờ `abilities.airDash` chỉ bỏ điều kiện đứng đất (`player-physics.ts` ~dòng 237), nên lướt trên không là vô hạn và Kai lơ lửng được (lướt tắt trọng lực).
  - Thêm bộ đếm lượt: hồi khi `grounded` (gồm đứng trên dây leo), khi bám tường, khi hồi sinh.
  - Lướt trong thời gian coyote tính là lướt đất (không tốn lượt).
- **P2 bậc 2:** `wallJumpGraceSec = 0.1`. Rời tường không quá 0,1 s vẫn nhảy tường được. Không đổi lực đẩy nhảy tường.
- **P3:**
  - Bất tử **chỉ với đạn**, thêm +3 / +4 / +4 bước ở đầu cú lướt (gốc 6 bước). Phần thêm mất ngay khi cú lướt kết thúc hoặc bị hủy (nhảy, chạm tường).
  - Thân boss, roi, sóng đất, cột rễ vẫn trúng sau 6 bước gốc.
  - Bậc 3 có sượt đạn: đạn địch giao hộp Kai trong phần bất tử thêm thì cộng `grazeChargeSec = 0.25` vào thời gian nạp (mỗi viên một lần).
  - Không có đồng hồ ẩn.
- **Tín hiệu trên Kai:**
  - Đèn đẩy ở chân sáng khi còn lượt lướt trên không, chớp khi hồi lượt.
  - Bóng mờ lục lam suốt phần bất tử thêm.
  - Tia sáng và WorldEvent `graze` khi sượt đạn.
- **WorldEvents:** `airDash`, `graze`.

## 3. File

- `[Cập nhật]` `game/src/logic/player/player-physics.ts`, `game/src/logic/player/player-params.ts`, `game/src/logic/world/hits.ts` (phân biệt đạn và va chạm thân/đòn cận chiến), `game/src/logic/world/world-types.ts`, `game/src/scenes/stage-scene.ts` (tín hiệu)
- `[Cập nhật]` `game/tests/player-physics.test.ts`; `[Tạo]` test P3

## 4. Tiêu chí nghiệm thu

- [ ] AC-1: Có P1: nhảy, lướt trên không 1 lần; lần 2 không lướt; chạm đất hoặc bám tường thì lướt lại được.
- [ ] AC-2: Có P3 bậc 3: lướt đủ cú liên tục (0,25 s lướt + 0,6 s hồi), tỉ lệ thời gian bất tử với đạn là 10/51 ≈ 19,6% (≤ gốc 11,8% + 8 điểm); thân boss trúng ở bước 7.
- [ ] AC-3: Lướt bị hủy bằng nhảy ở bước 2 thì phần bất tử thêm mất ngay.
- [ ] AC-4: Ảnh tín hiệu đèn chân và bóng mờ ở `04-Dev-Plan/qa/ST-08-06/`.
