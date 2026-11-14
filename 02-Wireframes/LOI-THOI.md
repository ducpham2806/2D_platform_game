# Wireframe lỗi thời

Rà soát giao diện ngày 14/11/2026 thấy nhiều bảng trong `boards/` lệch các quyết định mới. Không vẽ lại cả 97 bảng: bảng dưới ghi điểm lỗi thời của từng bảng và nguồn đúng. **Khi bảng và tài liệu khác nhau, tài liệu ở cột "Nguồn đúng" đúng.** Vẽ lại một bảng thì xóa dòng của nó ở đây.

- **Nhãn:** MVP = cần cho bản MVP (vẽ lại khi làm Story của màn đó); Alpha = mọi mốc sau cổng MVP (Alpha, Beta, Live-ops, Endgame; mốc cụ thể ghi trong ngoặc); lưu trữ = không dùng nữa, giữ để tra lịch sử.
- **Lời thoại:** wireframe không chép lời. Lời NOVA, Mira trên các bảng là bản cũ; nguồn lời ở `01-GDD/07-Kich-ban-huong-dan.md` (mục "Nguồn lời thoại").
- **Luật chung cho mọi bảng:** chỉ màn ngang (GDD 5.2, `QB-93`); chữ ≥ 16 sp, nút ≥ 48 dp, lề theo `env(safe-area-inset-*)` (`QB-74`, `QB-92`); Tương tác là W/↑, E là đổi vũ khí (`03-Data/controls.json`).
- **Bảng còn thiếu** (chưa vẽ): `07-Kich-ban-huong-dan.md` mục 11 (F03, F04, Hub dạng menu MVP, Cổng Chiến dịch 4 màn, làm nổi ở Xưởng và Quầy, thang gợi ý, menu tạm dừng có Trợ giúp, màn Cài đặt chung).

| Bảng | Điểm lỗi thời | Nguồn đúng | Nhãn |
| --- | --- | --- | --- |
| `index.html` | Ghi "94 màn" trong khi có 97 bảng | Đã sửa số; trỏ tới file này | MVP |
| `Flow` | Lần mở đầu đặt Menu chính và tuổi, đồng ý quảng cáo trước Prologue; ghi "Cầm dọc: menu dùng được"; Cửa hàng Gem vẽ như cửa hàng riêng | Lần mở đầu: Tải → Prologue → F02 → F03 → Hub; Menu chính chỉ từ lần mở thứ hai (07 mục 2, 3.1). Chỉ ngang. Cửa hàng Gem là lối tắt tới tab Premium (`QB-133`) | MVP |
| `Menu` | Có Game mới, Bảng xếp hạng, Đăng nhập; hiện ở lần mở đầu | Menu chính chỉ từ lần mở thứ hai (Tiếp tục, Cài đặt); bảng xếp hạng, đăng nhập ở Beta (GDD 15, 16) | MVP |
| `Respawn` | "Sau 5 lần chết"; có nút "Đổi độ khó", "Tiếp tục thử" | 3 lần chết; hộp gợi ý không chặn, không nút; hồi sinh tự động sau 1 s; đổi độ khó chỉ ở màn Chuẩn bị, hoặc mục "Đổi độ khó" ở menu tạm dừng sau gợi ý (07 mục 5.2 D06; `11-Do-kho.md` mục 2.2, 2.5; `QB-84`) | MVP |
| `NovaWeakness` | Vẽ thành màn hồi sinh có nút "Thử lại", "Về Hub" | D10 dùng chung hộp gợi ý chết, không nút; bật cờ `weaknessKnown[boss]`; không chạy ở Stage 1 (07 mục 5.2; `QB-83`) | MVP |
| `Prep` | Ô booster, loadout, thanh Sức mạnh; vũ khí khắc chế "hiện sau khi gặp boss" | MVP: thông tin màn, cấp, 3 thẻ độ khó, dòng "Booster mở sau boss 4", dòng nhiệm vụ phụ; vũ khí khắc chế theo `weaknessKnown[boss]` (03 mục 3; `11-Do-kho.md` mục 2.1; `15-Nhiem-vu-phu.md` mục 6.3). Booster, loadout: Alpha | MVP |
| `Pause` | Có "Booster đang dùng", "Lắp module nhanh"; thiếu Kỹ năng, Bật/Tắt hướng dẫn, Trợ giúp, "Đổi độ khó" sau gợi ý, dòng nhiệm vụ; "Thoát về Hub" | Tiếp tục, Kỹ năng, Bật/Tắt hướng dẫn, Âm thanh Bật/Tắt (`12-Am-thanh.md` mục 11), Tùy chọn (mở Cài đặt), Trợ giúp, Thoát về menu (hộp xác nhận ghi rõ giữ checkpoint, Core Bit, EXP; mặc định Hủy) (GDD 13; 07 mục 7; `14-Cai-dat-Tiep-can.md`; `QB-64`, `QB-84`). Chia 2 cột nếu không đủ cao cho nút 48 dp | MVP |
| `Result` | "Data Chip +1" như phần thưởng của mọi màn; nút "Về Hub" | Data Chip chỉ hiện khi lượt chơi có trao (phòng bí mật đầu tiên, lần đầu phá đảo Thử thách; nhiệm vụ phụ nhận ở Bảng) (`04-Can-bang-kinh-te.md` mục 5); ba nút Chơi lại màn, Mở Xưởng, Về menu; dòng nhiệm vụ (`15-Nhiem-vu-phu.md` mục 6.3) | MVP |
| `Dialogue` | Bỏ qua và Tiếp chưa ghi cách giữ | Một lần bấm: hiện hết câu; đóng cả đoạn: nút Bỏ qua hoặc giữ Lướt 0,6 s (`QB-80`) | MVP |
| `Main`, `HUDPC` | Chưa có biểu tượng Nano Cell (nút `heal`); nút II, cần ảo chưa tính safe-area | Nano Cell dưới thanh máu (GDD 5.3); `QB-92` | MVP |
| `Campaign` | Vẽ 8 màn và Citadel | MVP: 4 màn (Verdant, Prism, Cryo, Cirrus); Stage 2–4 mở sau boss 1, thứ tự tự do (03 mục 2) | MVP |
| `ShopUpgrade` | Có tab Skin, Booster, Premium; giá theo hệ số 1,8; số cũ (Energy Cell +10%, giá 300; Arc Core 1.296; Magnet Range 450); bán Nano Cell Cap, Dash Coil, Booster Slot | MVP chỉ tab Upgrade, Booster và Skin khóa "sau boss 4", không Premium; giá cấp n = giá cấp 1 × 1,25^(n−1); số theo `shop.json` (Energy Cell +15%, 250; Magnet Range 200); món chưa có tác dụng ghi "Sắp có" (`QB-130`) (03 mục 4.3) | MVP |
| `Workshop`, `Module`, `Armor` | Tab Module, Giáp vẽ như đã mở | Tab Module mở khi nhận module đầu tiên; nhãn tab khóa theo lời người chơi (03 mục 5; `QB-87`, `QB-132`); MVP có 4 module (Stage 1–4) | MVP |
| `Quests` | Tên theo số màn cũ ("Stage 2 · Khuôn đúc kẹt"…); "Theo dõi (hiện trên bản đồ nhỏ)" | 4 nhiệm vụ MVP theo màn (Hạt giống thất lạc, Gương rối, Băng vỡ, Gió mất hướng); nút Nhận, Nhận thưởng; ô thoại Mira; MVP không có bản đồ nhỏ (`15-Nhiem-vu-phu.md` mục 2.2, 6.2; 03 mục 7) | MVP |
| `Stage2` | "Gương rối: phá 6 gương phản xạ" | Gương Rối là vật tĩnh nhiễm Eclipse, khác gương câu đố laser và kẻ địch Gương Quang (`15-Nhiem-vu-phu.md` mục 2.2) | MVP (sau cổng) |
| `Stage3`, `Stage4` | Nhiệm vụ ghi thiếu vật mang theo | Băng vỡ: mang thùng thuốc lạnh; Gió mất hướng: mang máy ghi gió (03 mục 7) | MVP (sau cổng) |
| `SettingsControls` | "Tương tác (Hub): E"; thiếu hàng Lên/Xuống; tên tab cũ | Tương tác W/↑ (`controls.json`); thêm Lên, Xuống; tab Điều khiển, Hiển thị, Âm thanh, Tiếp cận, Ngôn ngữ, Dữ liệu (`14-Cai-dat-Tiep-can.md` mục 2, 11) | MVP |
| `Gamepad`, `Touch` | Thiếu độ nhạy cần; tên tab cũ | `14-Cai-dat-Tiep-can.md` mục 11 | MVP |
| `Graphics` | "Rung màn hình" trùng với `Access`; có "Khóa màn hình ngang (mobile)" | Đổi tên thành Hiển thị; rung màn hình 3 mức chỉ ở Tiếp cận; bỏ khóa ngang vì chỉ hỗ trợ ngang (`14-Cai-dat-Tiep-can.md`) | MVP |
| `Access` | "Giảm rung màn hình" bật/tắt; "Phụ đề cỡ lớn"; "Cảnh báo bằng âm thanh cho đòn boss" là công tắc riêng | Đổi tên thành Tiếp cận; rung 3 mức; "Cỡ chữ hội thoại" (`14-Cai-dat-Tiep-can.md`); cảnh báo đòn boss là công tắc của bus `alert`, cùng trạng thái với thanh Cảnh báo (`12-Am-thanh.md` mục 11) | MVP |
| `Audio` | Thiếu thanh Giao diện, Tắt tiếng; có "Tắt tiếng khi chuyển tab", "Nhạc theo nhịp pha boss" | 5 thanh (Tổng, Nhạc, Hiệu ứng, Cảnh báo, Giao diện) và Tắt tiếng; bỏ hai công tắc cũ (`12-Am-thanh.md` mục 6.1, 11) | MVP |
| `Account` | Đăng nhập, cloud save | MVP: tab Dữ liệu (mã sao lưu, xóa bản lưu); cloud ở Beta | MVP |
| `Confirm` | Chỉ có hộp xác nhận mua | Cần thêm hộp xác nhận chung (thoát màn, đặt lại, nhập mã), nút mặc định Hủy (`QB-64`) | MVP |
| `TutRun`, `TutJump`, `TutCharge`, `TutWall` | Lời NOVA kiểu giao diện ("Hãy chạy về phía cửa", "Giữ nút bắn để nạp"), khác 07 và `tutorial.json` | Chỉ ghi mã bước: TutRun P01; TutJump P02–P03; TutCharge P08; TutWall S01. Lời: 07 mục 3.2 (P), `tutorial.json` (S) | MVP (Prologue sau cổng) |
| `TutDash` | Gộp hành lang đạn vô hại (P09) với Tháp pháo "từ đây gây sát thương thật" (P10); lời "Nhấn Lướt để…" | Tách 2 bảng: P09 (đạn tập chỉ đẩy lùi, không mất máu) và P10 (sát thương thật, né theo ánh sáng báo trước) (07 mục 3.2; `02-Dac-ta-Prologue-Stage1.md` mục 2) | MVP (sau cổng) |
| `TutKeys` | Chỉ có bộ ký hiệu tay cầm Xbox | Tay cầm PlayStation dùng ✕○□△ theo `gamepad.id` (`QB-91`) | MVP |
| `UnlockFlow` | Luật "tối đa 1 hệ thống"; sau boss 3 có "tab Module"; sau boss 4 có "Tủ skin, Loadout"; "nhiệm vụ màn 1–3" | Mỗi lần về Hub 1 hệ thống + 1 nhịp truyện; tab Module khi nhận module đầu tiên; Tủ skin và Loadout sau boss 5; nhiệm vụ của 3 màn đã qua (07 mục 2; `QB-87`) | MVP |
| `HubEarly` | Hub đi bộ; luật "tối đa 1 hệ thống" | MVP là Hub dạng menu (03 mục 2); luật "1 hệ thống + 1 nhịp truyện" | Alpha |
| `Hub` | Cửa hàng Gem vẽ như khu riêng | Lối tắt tới tab Premium của Quầy Mira (`QB-133`); phím tắt Menu nhanh 1–0, Start mở Menu nhanh (`QB-94`) | Alpha |
| `Shop` | Skin Hiếm "khóa: hạ boss thứ 3" | Quầy Skin mở sau boss 4, Skin Hiếm đợt 1 sau boss 5 (03 mục 4.3) | Alpha |
| `ShopBooster` | Overcharge, Second Chance bán cùng các booster mở sau boss 4 | Overcharge, Second Chance mở sau boss 5 (03 mục 4.3) | Alpha |
| `Wardrobe`, `Loadout` | Không ghi mốc mở | Mở sau boss 5 (03 mục 5) | Alpha |
| `AdMapPrep` | `AD_BOOSTER` đưa Overcharge (chưa mở) | Chỉ booster đã mở (`QB-134`) | Alpha (Live-ops) |
| `NAdRevive` | "Tối đa 2 lần mỗi màn" | 1 lần hồi sinh tại chỗ mỗi lượt vào màn, tính chung mọi nguồn; không có ở phòng boss (`06-Ke-hoach-quang-cao.md`; GDD 10; `QB-44`) | Alpha (Live-ops) |
| `NConsent` | "Lần mở đầu tiên" | Sau Prologue, trước khi vào Hub (F02, 07 mục 3.1) | Alpha (Live-ops) |
| `NStarterPopup`, `NStore`, `NWeeklyDeal` | Gói tiền thật có booster | Tiền thật không mua booster (GDD trụ cột 5, mục 2.1; `05-Ke-hoach-kiem-tien.md`) | Alpha (Live-ops) |
| `NNewPlayer7` | Thưởng booster (Shield Cell, Repair Kit) trước khi Quầy Booster mở | Booster nhận trước khi mở vào kho, ô hiện khóa (`QB-134`) | Alpha (Live-ops) |
| `PRotate` | "Menu, Shop, Xưởng, Cài đặt dùng được ở chế độ dọc"; nút "Xem menu (dọc)" | Chỉ ngang: lớp phủ "xoay ngang" che mọi scene và tự tạm dừng trận (`QB-93`; đã có `#rotate-overlay` trong code) | lưu trữ, không dùng |
| `PMenu`, `PHub`, `PPrep`, `PShop`, `PWorkshop`, `PCampaign`, `PSettings` | Bố cục cầm dọc | Không hỗ trợ cầm dọc (GDD 5.2) | lưu trữ, không dùng |
