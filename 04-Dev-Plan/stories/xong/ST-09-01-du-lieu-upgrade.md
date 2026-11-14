# ST-09-01: Dữ liệu Upgrade, lịch mở theo boss, giá, mua và gỡ (logic thuần)

- **Thuộc Epic:** EP-09 · **Ưu tiên:** P1 · **Trạng thái:** DONE (14/11/2026)
- **Phụ thuộc:** ST-08-01 · **Bằng chứng:** [x] Logic

## 1. User story

> **Là** người chơi, **tôi muốn** biết mỗi Upgrade giá bao nhiêu, đang cấp mấy, khi nào mở cấp tiếp, **để** để dành Core Bit cho đúng món.

## 2. Bối cảnh

- Giá cấp n = round(baseCost × costGrowth^(n−1)) (kinh tế mục 1). Arc Core: 400, 500, 625, 781, 977.
- Lịch mở (đặc tả Hub 4.3, Epic quyết định 2), chỉ đếm boss chiến dịch (`stages.json → stages[].boss`):
  - 2 boss: Arc Core, Energy Cell, Armor Plating, Magnet Range đến cấp 2;
  - 5 boss: các loại trên đến cấp 3; Nano Cell Cap, Dash Coil đến cấp 3; Booster Slot cấp 1;
  - 8 boss: mọi loại đến cấp tối đa.
- Gỡ: chỉ cấp cao nhất đang có, hoàn 100% giá cấp đó.
- Trường số mới: `energy_cell.energyMaxPerLevel = 0.15` (bản đầu 0,1; đổi theo duyệt EP-09 quyết định 3), `magnet_range.magnetTilesPerLevel = 1`.

## 3. File

- `[Cập nhật]` `03-Data/shop.json` (trường số, `unlockSchedule`), `03-Data/enemies.json` (`pickups.magnetSpeedTilesPerSec`)
- `[Cập nhật]` `game/src/core/shop-config.ts`, `game/src/core/enemy-config.ts`
- `[Tạo]` `game/src/logic/shop/upgrades.ts`; test `game/tests/upgrades.test.ts`

## 4. Tiêu chí nghiệm thu

- [x] AC-1: `upgradeCost(arc_core, n)` cho 400/500/625/781/977; tổng 5 cấp 3.283.
- [x] AC-2: Lịch hỏng bị từ chối khi nạp: mốc không tăng dần; cấp vượt `maxLevel`; cấp giảm ở mốc sau; id lạ; mốc cuối chưa mở đủ mọi cấp.
- [x] AC-3: `levelCap(levels, bosses)`: 1 boss thì 0 (quầy khóa); 2 boss thì 2; 5 boss thì 3; 8 boss thì tối đa. Mốc mở cấp kế được trả về để hiện "Mở khi hạ N boss".
- [x] AC-4: `buyUpgrade` từ chối khi thiếu tiền, đã tới cấp mở hoặc cấp tối đa, id lạ; thành công thì trừ đúng giá và tăng 1 cấp trong một kết quả. `refundUpgrade` hoàn đúng giá cấp cao nhất; cấp 0 thì từ chối.
- [x] AC-5: Thiếu trường số `energyMaxPerLevel`, `magnetTilesPerLevel` hoặc `magnetSpeedTilesPerSec` thì báo lỗi khi nạp.

- Test: `game/tests/upgrades.test.ts` (8 test). Thêm `core/shop-config.ts → parseEconomy` (công thức thu theo màn, dùng cho gợi ý khi thiếu tiền ở ST-09-04).
