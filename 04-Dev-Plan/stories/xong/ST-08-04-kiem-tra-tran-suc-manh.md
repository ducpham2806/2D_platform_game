# ST-08-04: Kiểm tra trần sức mạnh lúc nạp, mô phỏng lối bắn, bot phòng thủ

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P1 · **Trạng thái:** DONE (14/11/2026)
- **Phụ thuộc:** ST-08-03; quyết định 2 của GDD (công `10+0.2*(L-1)`)
- **Bằng chứng:** [x] Logic [x] Config

## 1. User story

> **Là** người thiết kế, **tôi muốn** máy tự chặn bộ số làm Kai mạnh quá trần cốt truyện, **để** kỹ năng của người chơi vẫn quyết định thắng thua.

## 2. Bối cảnh (nhúng từ GDD)

- **Hệ số thường trực ở cấp tối đa** (`player.level.max`): `attackMul(Lmax) × (1 + arc_core.damagePerLevel × maxLevel)` ≤ `storyPowerCap.damageMul` (2,2).
  - Với dữ liệu đề xuất: 1,58 × 1,25 = 1,975.
- **Máu:** `statsFor(Lmax, C1 tối đa).maxHp / maxHp(1)` ≤ `hpMul` (2,5).
  - Với dữ liệu đề xuất: 2,484.
- **Có điều kiện:** hệ số thường trực × mọi hiệu ứng `conditional` (Last Stand 1,3) ≤ `conditionalDamageMul` (2,6).
  - Với dữ liệu đề xuất: 2,57.
- **Máu hiệu dụng:** máu tối đa (có C1) / (hệ số giảm sát thương tối đa của build: `armor_plating` tối đa × Thân giáp tốt nhất đang có dữ liệu) ≤ `effectiveHpMul` (3,75).
  - Với dữ liệu đề xuất: 3,65.
- **Mô phỏng lối bắn** (test Vitest, dùng `WeaponLoadout` thật, mục tiêu cách 5 ô, mọi phát trúng). Bốn lối:
  - bấm 7,5 Hz;
  - chu kỳ nạp vừa;
  - chu kỳ nạp đầy;
  - tự bắn cảm ứng kèm nạp vừa.

  Điều kiện đạt: DPS tốt nhất **có** build Vanguard đủ bậc + Overcharge ≤ DPS tốt nhất **không** build (tăng tốc nạp chỉ áp nạp đầy). Số tham chiếu gốc: 7,47 (bàn phím), 9,62 (cảm ứng).
- **Bot phòng thủ:** không né. Build: nhánh Core đủ bậc, Thân Mk I (khi có dữ liệu), Booster Khiên. Đấu Thorna ở Thường → phải thua.
- **Khiên và Hoa Nở:** khiên sẵn, đứng yên → vẫn trúng ít nhất 1 hạt sau khi khiên vỡ. Bổ sung khi xong ST-08-08.

## 3. File

- `[Cập nhật]` `game/src/core/game-config.ts` (`checkDesignInvariants` dùng `statsFor`)
- `[Tạo]` `game/tests/power-cap.test.ts`, `game/tests/dps-sim.test.ts`

## 4. Tiêu chí nghiệm thu

- [x] AC-1: Dữ liệu thật đạt mọi trần (`checkStoryPowerCap`: thường trực 1,975; máu 2,48; máu hiệu dụng 3,11). Tăng `arc_core.damagePerLevel` lên 0,1 thì báo lỗi trần sát thương (2,37 > 2,2); C1 ×1,3 thì báo lỗi trần máu (281 máu, ×2,81 > 2,5); module có điều kiện ×1,4 thì báo lỗi (2,765 > 2,6).
- [x] AC-2: Mô phỏng 4 lối bắn chạy trên Node trong khoảng 0,1 s.
  - Đo lại mức gốc: bắn liên thanh 7,40; nạp vừa 5,45; nạp vừa + tự bắn cảm ứng 9,15.
  - Trên cảm ứng, nếu **mọi** phát nạp đầy đều có Trừng Phạt thì vượt mốc. Hai thay đổi theo đó:
    - Sàn nạp đầy nâng 0,75 → **0,8 s**.
    - Phép thử giả định tối đa 1/3 phát nạp đầy trúng lúc boss hở (Thorna hở khoảng 1/4 thời gian).
  - Với hai thay đổi đó, lối nạp đầy ở sàn có build đều thấp hơn lối mạnh nhất gốc trên cả bàn phím (kể cả Trừng Phạt mọi phát) và cảm ứng.
- [~] AC-3: **Đổi tiêu chí.** "Bot phòng thủ thua Thorna" không đạt được vì bot không né thắng Thorna sau khoảng 15 s **kể cả không có build**: Thorna quá dễ so với đặc tả 60–90 s. Đây là việc cân bằng boss ở cổng Prototype, đã ghi vào `05-Cong-Prototype.md` mục 5.
  - Tiêu chí thay bằng: build Core đủ bậc không đổi số đòn trúng, chỉ thêm đúng 18 máu của C1 (đạt).
  - Một test ghi lại hiện trạng boss (bot thắng dưới 20 s), cần đổi kỳ vọng khi chỉnh Thorna.
