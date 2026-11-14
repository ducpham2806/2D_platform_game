# Quyết định đã chốt: Quầy Mira, Upgrade (M9, EP-09)

Giá, lịch mở, tác dụng, bản lưu, giao dịch. Tách từ `game/CONTEXT.md` ngày 15/11/2026 để giảm phần đọc đầu phiên; chỉ đọc khi làm việc với module này.

- **Quầy Mira, bản MVP chỉ Upgrade (EP-09, 14/11/2026).** Mở từ menu (phím Q) sau 2 boss chiến dịch, vì Hub là việc của Alpha; không mở từ menu tạm dừng.
  - Giá cấp n = round(gốc × 1,25^(n−1)). Gỡ hoàn 100% số đã trả cho cấp cao nhất (`inventory.upgradePaid`; bản lưu thiếu thì theo giá hiện hành). Lịch mở trong `shop.json → unlockSchedule`: 2 boss thì cấp 1–2 của 4 loại; 5 boss thì cấp 3 và Nano Cell Cap, Dash Coil, Booster Slot; 8 boss thì tối đa. Cấp 3 sau 5 boss là quyết định lấp khoảng trống `[PLACEHOLDER]`.
  - Tác dụng (GDD 10 mục 3.1) nằm trong `BuildStats`: Arc Core nhân công (qua `statsFor`); Armor Plating nhân sát thương đòn kẻ địch/boss (kẹp sàn 0,5, gai và hố không giảm); Energy Cell năng lượng tối đa round(28 × (1 + 0,15 × cấp)) (duyệt: 0,1 thì có cấp không thêm phát Vine Lash nào); Magnet Range hút Core Bit trong `cấp` ô tính từ thân Kai, bay 12 ô/s. Nano Cell Cap, Dash Coil, Booster Slot chưa có tác dụng nên chưa bán (thẻ "Sắp có", `upgradeHasEffect`).
  - Bản lưu 3: `inventory.upgrades`; bản 4 thêm `inventory.upgradePaid` (giá đã trả từng cấp, gỡ hoàn đúng số đó). Mua/gỡ qua `SaveManager.transact`: trừ tiền và tăng cấp trong một lần ghi, chờ ghi xong mới báo; ghi lỗi thì hoàn tác. `?shop=1` (cùng `?debug=1`) mở quầy khi chưa đủ boss để chạy thử; mua vẫn được lưu.
