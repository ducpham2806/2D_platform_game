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

**Đã xong (14/11/2026):** ST-09-01 → ST-09-04; sửa theo duyệt cùng ngày (mục quyết định bên dưới). Còn ngoài epic này: Booster, Skin (Alpha), bước hướng dẫn R04 (giai đoạn Hub), tác dụng của Nano Cell Cap, Dash Coil, Booster Slot (khóa tới boss 5).

Thứ tự: 01 → (02 song song 03) → 04. Tổng khoảng 4,5 ngày làm việc.

## Khoảng trống của tài liệu và quyết định (chốt 14/11/2026 sau duyệt)

Tài liệu nguồn chưa nói rõ các điểm dưới đây. Ban đầu (bản lấp khoảng trống) không điểm nào ghi đè quyết định đã chốt; mọi số nằm trong dữ liệu. Người dùng giao toàn quyền quyết định. Creative Director (kèm economy-designer) duyệt độc lập theo quy trình Game Studio Agent: 4 điểm "duyệt", 5 điểm "duyệt kèm sửa"; đã sửa cả 5 (cột cuối). Số liệu vẫn là `[PLACEHOLDER]`.

| # | Quyết định | Duyệt | Bản chốt |
| --- | --- | --- | --- |
| 1 | **Lối vào khi chưa có Hub:** menu chính (phím Q), như Xưởng; không mở từ menu tạm dừng (đặc tả mục 1: mua, hoàn ở Hub) | Duyệt | Giữ |
| 2 | **Cấp 3 mở sau 5 boss** (mục 4.3 bỏ trống cấp 3), cùng đợt Nano Cell Cap, Dash Coil, Booster Slot. Lịch ở `shop.json → unlockSchedule` | Duyệt: mua hết cấp 1–2 của 4 loại cần 2.813 Core Bit, hết Stage 5 mới có 1.875; mô hình mục 4 không bị chặn | Giữ |
| 3 | **Energy Cell** +10%/cấp (28 → 31 → 34) | Duyệt kèm sửa: Vine Lash tốn 4 năng lượng nên 28 → 31 → 34 → 36 → 39 → 42 cho 7 → 7 → 8 → 9 → 9 → 10 phát; cấp 1 và cấp 4 không thêm phát nào | **+15%/cấp**: 28 → 32 → 36 → 41 → 45 → 50, mỗi cấp thêm 1 phát (sửa cả GDD chính). Thẻ Quầy hiện số thật ("28 năng lượng → 32 năng lượng") |
| 4 | **Magnet Range:** 1 ô mỗi cấp, tính từ thân Kai; bay 12 ô/s; chỉ hút Core Bit | Duyệt kèm sửa: ghi chú `shop.json` còn ghi "tâm Kai"; lý do "thân rộng nửa ô" sai | Sửa ghi chú. Lý do đúng: hộp va chạm của Kai 12 × 24 px (0,75 × 1,5 ô), tính từ tâm thì cấp 1 gần như không khác nhặt tay |
| 5 | **Giá, hoàn tiền:** làm tròn mỗi cấp; gỡ hoàn giá hiện hành | Duyệt kèm sửa: bảng kinh tế mục 3 sai tổng; giá là PLACEHOLDER nên hoàn theo giá hiện hành làm người chơi lời hoặc lỗ khi giá đổi | Sửa bảng kinh tế: Energy Cell 2.052, Magnet Range 763, tổng 14.593. **Bản lưu ghi giá đã trả từng cấp** (`inventory.upgradePaid`); gỡ và chuẩn hóa hoàn đúng số đó |
| 6 | **Tab Booster, Skin** khóa "sau boss 4"; không có Premium | Duyệt | Giữ |
| 7 | **Upgrade chưa có tác dụng** (Nano Cell Cap, Dash Coil, Booster Slot) vẫn hiện thẻ khóa "sau 5 boss" | Duyệt kèm sửa: không được bán món vô dụng | Upgrade không có trường tác dụng thì **không bán** dù tới mốc; thẻ ghi "Sắp có" (`upgradeHasEffect`) |
| 8 | **Bước R04** làm cùng giai đoạn Hub của hướng dẫn | Duyệt: người chơi Cốt truyện chỉ có khoảng 260 Core Bit sau 2 boss | Khi làm R04: làm nổi món mua được (200 hoặc 250 Core Bit) |
| 9 | `?shop=1` mở quầy khi chưa đủ boss, "không đổi bản lưu" | Duyệt kèm sửa: mua vẫn được ghi; cờ chạy cả ở bản build thật | `?shop=1` chỉ có tác dụng cùng `?debug=1` (hoặc bản dev); ghi rõ là mua vẫn được lưu |
