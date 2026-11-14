# EP-09: Kinh tế và Shop, bản MVP chỉ quầy Upgrade (M9)

- **Mốc:** MVP (lộ trình Sprint 10–17: "Shop chỉ Upgrade"). Booster và Skin mở sau boss 4, đúng lúc hết MVP, nên sang Alpha (đặc tả Hub mục 4.3, mục 5 bản MVP).
- **Tài liệu nguồn:** `01-GDD/03-Dac-ta-Hub-Shop.md` mục 4 (giao diện, hành vi mua, lịch mở hàng), mục 8 (lưu), mục 9 (nghiệm thu); `01-GDD/04-Can-bang-kinh-te.md` mục 1–4 (giá cấp n = giá cấp 1 × 1,25^(n−1)); `01-GDD/10-He-thong-RPG-Xuong.md` mục 3.1 (công thức áp Upgrade); wireframe `02-Wireframes/boards/Shop.html`; `03-Data/shop.json`, `economy.json`.
- **Đã có trước epic này:** Core Bit trong bản lưu (M11); `shop.json` có trường số `damagePerLevel`, `damageTakenPerLevel` (ST-08-01); trần sức mạnh đã tính Upgrade tối đa (ST-08-04); bảng HTML theo ADR-001 (Xưởng).
- **Quy ước Story:** như EP-08. Mỗi Story một commit; test, lint, format, build đạt; Story có hình ảnh lưu ảnh chạy thử ở `04-Dev-Plan/qa/<mã Story>/`.

| Mã | Tên | Phụ thuộc | Bị chặn | Cỡ |
| --- | --- | --- | --- | --- |
| ST-09-01 | Dữ liệu Upgrade: trường số, lịch mở theo boss, giá, mua/gỡ thuần | ST-08-01 | Không | 1 ngày |
| ST-09-02 | Bản lưu 3 (cấp Upgrade), chuẩn hóa, giao dịch nguyên tử | 01 | Không | 1 ngày |
| ST-09-03 | Áp Upgrade vào trận: công, giáp, năng lượng, nam châm | 01 | Không | 1 ngày |
| ST-09-04 | Quầy Mira (bảng HTML), tab Upgrade, lối vào từ menu | 01, 02 | Không | 1,5 ngày |

**Đã xong (14/11/2026):** ST-09-01 → ST-09-04. Còn ngoài epic này: Booster, Skin (Alpha), bước hướng dẫn R04 (giai đoạn Hub), tác dụng của Nano Cell Cap, Dash Coil, Booster Slot (khóa tới boss 5).

Thứ tự: 01 → (02 song song 03) → 04. Tổng khoảng 4,5 ngày làm việc.

## Khoảng trống của tài liệu và quyết định (lấp 14/11/2026, `[PLACEHOLDER]`, người dùng có thể đổi)

Tài liệu nguồn chưa nói rõ các điểm dưới đây. Không điểm nào ghi đè quyết định đã chốt; mọi số nằm trong dữ liệu.

1. **Lối vào khi chưa có Hub.** Hub là việc của Alpha. MVP mở Quầy Mira từ menu chính (phím Q), giống Xưởng. Không mở từ menu tạm dừng: đặc tả mục 1 chỉ cho mua và hoàn upgrade tại Hub.
2. **Cấp 3 mở khi nào.** Mục 4.3 chỉ ghi "cấp 1–2 sau 2 boss" và "cấp 4–5 sau 8 boss". Chọn: **cấp 3 mở sau 5 boss**, cùng đợt Nano Cell Cap, Dash Coil, Booster Slot. Mô hình kinh tế mục 4 (hết Stage 8 khoảng 7 cấp, cuối lượt đầu cấp 2–3) không bị ảnh hưởng. Lịch nằm trong `shop.json → unlockSchedule`.
3. **Energy Cell:** năng lượng tối đa của vũ khí boss = round(gốc × (1 + 0,1 × cấp)), tức 28 → 31 → 34. Tốc độ hồi giữ nguyên.
4. **Magnet Range:** Kai chưa có nam châm gốc, nên mỗi cấp hút Core Bit trong 1 ô, tính từ thân Kai (hộp va chạm). Nếu tính từ tâm thì cấp 1 gần như không khác nhặt tay, vì thân Kai đã rộng nửa ô. Viên trong tầm bay thẳng tới Kai với tốc độ 12 ô/s (`enemies.json → pickups.magnetSpeedTilesPerSec`). Chỉ hút Core Bit, không hút viên máu. Cộng dồn với module Magnet Core: quyết định ở ST-08-09.
5. **Giá và hoàn tiền:** giá mỗi cấp làm tròn tới số nguyên gần nhất. Tổng 5 cấp có thể lệch ±1 so với bảng kinh tế mục 3 (bảng làm tròn tổng). "Gỡ" hoàn đúng giá của cấp cao nhất theo dữ liệu hiện hành.
6. **Tab Booster và Skin** hiện khóa "mở sau boss 4". Quầy Premium (Gem, Cyber+) không hiện trong MVP.
7. **Upgrade chưa có tác dụng trong MVP** (Nano Cell Cap: chưa có bình máu phụ; Dash Coil; Booster Slot): vẫn hiện thẻ khóa "mở sau 5 boss". Tác dụng làm khi gỡ khóa (Alpha).
8. **Bước hướng dẫn R04** (Mira làm nổi upgrade cấp 1, thiếu tiền thì tặng 150 Core Bit một lần) làm cùng giai đoạn Hub của TutorialManager, như R02/R03.
9. **Thử khi chưa đủ 2 boss.** Bản hiện tại mới có Thorna. Tham số `?shop=1` mở quầy với lịch của mốc đầu tiên (2 boss) để chạy thử; không đổi bản lưu.
