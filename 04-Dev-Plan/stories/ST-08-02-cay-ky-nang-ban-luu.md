# ST-08-02: Cây kỹ năng thuần, bản lưu 2, chuẩn hóa build

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P1 · **Trạng thái:** TODO
- **Phụ thuộc:** ST-08-01
- **Bằng chứng:** [x] Logic [x] Integration (bản lưu) [ ] Visual

## 1. User story

> **Là** người chơi, **tôi muốn** học kỹ năng từng bậc bằng SP và đặt lại miễn phí, **để** thử lối chơi khác mà không sợ mất công.

## 2. Bối cảnh (nhúng từ GDD)

- **SP còn lại** = `skillPoints(cấp, boss chiến dịch)` − Σ bậc đã học. `skillPoints` đã có ở `logic/rpg/progression.ts`: (cấp − 1) × 1 + số boss × 1. Không lưu SP còn lại.
- **Trạng thái nút:** Khóa (tầng trước chưa đủ bậc) / Học được (SP ≥ 1) / Thiếu SP / Đủ bậc.
- **Đặt lại:** theo nhánh hoặc tất cả, hoàn 100%, miễn phí, không giới hạn.
- **Bản lưu**, tăng `SAVE_VERSION` lên 2; bản 1 nâng lên với giá trị trống:
  - `character.skills: Record<nodeId, rank>`
  - `character.modules: { owned: string[] }`
  - `character.loadouts: [{ modules: string[]; armorOff: string[] }]` (MVP dùng phần tử 0)
  - `character.activeLoadout: number`
- **`normalizeBuild(save, config)`:**
  - Chạy sau `SaveManager.open` và sau khi nhập mã sao lưu.
  - Bỏ nút lạ; kẹp bậc về tối đa; bỏ nút mất điều kiện tầng trước. Nếu Σ bậc > SP thì đặt lại cả cây.
  - Ghi lại một lần, trả về thông báo để UI hiện một lần.
- **Kiến trúc:** hàm thuần nhận bản lưu cũ, trả bản mới, không đổi gì thì trả đúng bản cũ (quy ước M11). `logic/rpg/workshop-model.ts` dựng mô hình hiển thị (ADR-001).

## 3. File

- `[Tạo]` `game/src/logic/rpg/skill-tree.ts` (học, đặt lại, SP còn lại), `game/src/logic/rpg/workshop-model.ts`, `game/src/logic/rpg/normalize-build.ts`
- `[Cập nhật]` `game/src/logic/save/save-data.ts` (bản 2), `game/src/scenes/preload-scene.ts` (gọi `normalizeBuild`), `game/src/save/save-panel.ts` (sau khi nhập mã)
- `[Tạo]` `game/tests/skill-tree.test.ts`; `[Cập nhật]` `game/tests/save.test.ts`

## 4. Tiêu chí nghiệm thu

- [ ] AC-1: Học V1 tốn 1 SP; V2 khóa tới khi V1 đủ bậc; học V2 hai lần thì đủ bậc; hết SP thì "Thiếu SP".
- [ ] AC-2: Đặt lại nhánh hoàn đúng số bậc của nhánh; đặt lại tất cả hoàn hết.
- [ ] AC-3: Bản lưu 1 đọc lên thành bản 2 trống; bản 2 với Σ bậc > SP được đặt lại và có thông báo; nút lạ bị bỏ.
- [ ] AC-4: Bản lưu của phiên bản mới hơn vẫn chỉ đọc (không ghi đè mất kỹ năng).
