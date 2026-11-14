# Đặc tả chi tiết: Hub Arkon & Shop

Hub Arkon là nơi người chơi chọn màn, chuẩn bị build và mua sắm. Tài liệu này đặc tả Hub, Shop và các màn hình liên quan. Tiền trong game gồm Core Bit và Data Chip (kiếm khi chơi) và Gem (tiền cao cấp, mua hoặc kiếm được; xem tab Kế hoạch kiếm tiền và Live-ops). Mọi con số đánh dấu `[PLACEHOLDER]` cần chỉnh sau playtest.

Quy tắc biên giao diện: xem `17-Quy-tac-bien.md` (Hub, Quầy, Xưởng: `QB-130`…`QB-134`; hộp chữ, nhập liệu, lưu: `QB-70`…`QB-100`). Việc cần Story từ rà soát 14/11/2026: mục 10.

## 1. Vai trò và nguyên tắc

Hub Arkon mở sau Prologue, là điểm trung chuyển giữa mọi màn: gặp Mira, mua sắm, chuẩn bị build, đọc truyện. Thời gian trung bình mỗi lần ở Hub: 1–3 phút `[PLACEHOLDER]`.

- Từ Hub vào màn tiếp theo trong tối đa 2 chạm.
- Đi bộ trong Hub là tùy chọn; menu nhanh truy cập mọi chức năng.
- Ưu đãi giới hạn thời gian được phép nhưng tối đa 1 popup mỗi phiên, không hiện trong màn chơi, luôn có nút đóng, không đếm ngược giả.
- Tính năng mở dần theo tiến trình để người mới không bị ngợp: mỗi lần về Hub mở tối đa 1 hệ thống mới + 1 nhịp truyện (`QB-87`; lịch ở mục 4.3, 5, 6 và `07-Kich-ban-huong-dan.md` mục 2).
- Mọi giao dịch có xác nhận rõ ràng; upgrade và kỹ năng hoàn lại được tại Hub.

## 2. Bố cục Hub và các khu vực

Hub rộng 3 màn hình (60 × 12 tile), đi bộ được bằng điều khiển thường. Mỗi khu là một điểm tương tác; đến gần hiện biểu tượng. Từ bản 0.4 thêm 3 khu: Cửa hàng Gem (lối tắt mở thẳng tab Premium của Quầy Mira, `QB-133`), Sự kiện (đăng nhập 30 ngày, 7 ngày tân thủ, vòng quay, Season Pass, nhiệm vụ ngày/tuần) và Vùng Eclipse (khóa đến khi hạ AEGIS). Chấm báo hiện khi có quà hoặc việc mới.

| Khu | Vị trí | Chức năng | Mở khi |
| --- | --- | --- | --- |
| Cổng Chiến dịch | Phải | Bản đồ 8 màn + Citadel, chọn màn | Sau Prologue |
| Quầy Mira (Shop) | Giữa | Bốn tab: Skin, Booster, Upgrade, Premium | Sau boss thứ 2 (Upgrade); Booster và Skin sau boss thứ 4 |
| Xưởng Lắp Ráp | Giữa-trái | Cây kỹ năng, module, Két giáp, loadout, tủ skin | Sau Stage 1 (tab mở dần, mục 5) |
| Bảng Nhiệm Vụ | Giữa-phải | Nhiệm vụ phụ | Sau boss thứ 3 |
| Phòng Hồ Sơ | Trái | Nhật ký, Memory Log, thành tựu, bảng xếp hạng, thống kê | Sau Prologue |
| Cài đặt | Trong menu | Điều khiển, đồ họa, âm thanh, tài khoản và cloud | Luôn có |

**Điều khiển trong Hub**

- Tương tác: PC phím W hoặc ↑ (E là đổi vũ khí, `controls.json`), tay cầm Y, cảm ứng chạm vào khu.
- **Menu nhanh:** nút ở góc trên phải mở lưới 10 ô (2 hàng), mỗi ô một chạm đến khu tương ứng, Kai tự chạy tới. PC: phím Tab rồi 1–9, 0 (ô 1–10); tay cầm: Start (ở Hub, Start mở Menu nhanh, không phải Tạm dừng; `QB-94`).
- Hub tải ≤ 4 MB và vào được trong ≤ 2 giây.

**Bản MVP: Hub dạng menu** (GDD mục 16; Hub đi bộ ở trên sang Alpha)

- Lần mở đầu tiên: Tải → Prologue → tuổi và đồng ý quảng cáo → cỡ nút → Hub (`07-Kich-ban-huong-dan.md` mục 3.1). Từ lần mở thứ hai: Tải → Menu chính (Tiếp tục) → Hub.
- Hub là một menu, mỗi mục là một nút ≥ 48 dp, chọn được bằng chạm, phím (lên/xuống + Nhảy hoặc Enter) và tay cầm.

| Mục | Mở khi | Phím tắt PC |
| --- | --- | --- |
| Cổng Chiến dịch → danh sách 4 màn MVP → màn Chuẩn bị | Sau Prologue (chỉ Stage 1; Stage 2–4 sau boss 1, thứ tự tự do) | Enter |
| Xưởng | Sau boss 1 | X |
| Quầy Mira (chỉ tab Upgrade) | Sau boss 2 | Q |
| Bảng Nhiệm Vụ | Sau boss 3 | N |
| Dữ liệu lưu | Luôn có | S |
| Cài đặt | Luôn có | C |

- Mục chưa mở hiện mờ, ghi điều kiện theo lời người chơi, ví dụ "Xưởng (sau boss 1)" (`QB-132`). Chấm báo khi có việc mới.
- Lần vào đầu tiên chạy H01–H04 (`07-Kich-ban-huong-dan.md` mục 4.1): Mira chào, làm nổi Cổng Chiến dịch, NOVA chỉ Stage 1, màn Chuẩn bị.
- Hiện trạng code (cần Story): Hub thử nghiệm chỉ có Cổng Chiến dịch dẫn vào màn xám và chỉ thoát được bằng phím Esc; các nút khác nằm ở menu thử nghiệm.

## 3. Màn hình chuẩn bị trước màn

Mở khi chọn một màn ở Cổng Chiến dịch. Bố cục ngang gồm ba cột.

| Cột | Thành phần |
| --- | --- |
| Trái: thông tin màn | Tên màn, cấp khuyến nghị, tiến độ thu thập (Két giáp, Memory Log, bí mật: x/y), vũ khí khắc chế boss (chỉ hiện khi cờ `weaknessKnown[boss]` đã bật, trước đó ghi "???") |
| Giữa: độ khó | Chọn một trong 3 độ khó (Cốt truyện, Thường, Thử thách; GDD 0.6); độ khó chưa mở hiện khóa kèm điều kiện; mặc định là độ khó đã chọn lần trước cho màn đó. Quy tắc chi tiết: `01-GDD/11-Do-kho.md` |
| Phải: chuẩn bị | 2 slot booster (3 sau upgrade), loadout hiện tại (đổi nhanh giữa 3 preset), thanh Sức mạnh so với mức khuyến nghị |

- **Bản MVP (Hub là menu, 14/11/2026):** bảng Chuẩn bị hiện khi vào màn chiến dịch từ menu, chỉ có thông tin màn, cấp và ba thẻ độ khó; ô booster, loadout, thanh Power Score sang Alpha (`01-GDD/11-Do-kho.md` mục 2.1).
- **Điểm yếu boss (`QB-83`, cần Story):** một cờ `weaknessKnown[boss]` cho mỗi boss, lưu trong bản lưu. Bật khi bước D03 hoặc D10 chạy (NOVA nói tên vũ khí khắc chế) hoặc khi hạ boss đó (`07-Kich-ban-huong-dan.md` mục 5.2). Màn Chuẩn bị và câu gợi ý vũ khí khắc chế khi chết nhiều (`ui.json → difficultyHint.weapon`) chỉ đọc cờ này.
- Nút **Bắt đầu** lớn ở góc dưới phải; từ lúc chọn màn tới khi vào chơi tối đa 2 chạm.
- Nếu cấp thấp hơn mức khuyến nghị quá 2 cấp, hiện gợi ý mềm (nâng cấp, dùng booster) nhưng không chặn.
- Gán booster bằng chạm vào slot rồi chọn; booster tiêu hao khi vào màn, hoàn lại nếu thoát trước checkpoint đầu tiên.
- Thanh Sức mạnh dựa trên Power Score (cấp + upgrade + module) và đổi màu: xanh đạt, vàng thấp hơn, đỏ thấp nhiều `[PLACEHOLDER]`.

## 4. Shop

### 4.1 Giao diện

Bốn tab ở trên cùng: **Skin**, **Booster**, **Upgrade**, **Premium** (Gem, Cyber+, Season Pass; xem tab Kế hoạch kiếm tiền và Live-ops). Khu Cửa hàng Gem ở Hub là lối tắt mở thẳng tab Premium, không phải một cửa hàng riêng (`QB-133`). Số dư Core Bit và Data Chip luôn hiện ở góc trên phải. Bên trái là lưới thẻ món hàng; bên phải là panel chi tiết (mô tả, xem trước Kai với skin, giá, nút Mua).

| Trạng thái thẻ | Hiển thị |
| --- | --- |
| Có thể mua | Giá nổi bật |
| Không đủ tiền | Giá màu xám, ghi số tiền còn thiếu |
| Khóa | Biểu tượng khóa kèm điều kiện mở (ví dụ: hạ boss thứ 3) |
| Đã sở hữu | Dấu tích; skin có nút Mặc, booster hiện số lượng trong kho |

### 4.2 Hành vi mua

- Chạm thẻ, xem chi tiết, bấm **Mua**, rồi bấm **Xác nhận** (một bước xác nhận, hiện giá).
- Giao dịch nguyên tử: trừ tiền và thêm món cùng lúc; nếu lưu lỗi thì hoàn tác và báo người chơi.
- Booster: chọn số lượng 1–9 bằng nút tăng giảm; kho tối đa 9 mỗi loại.
- Upgrade: hiện cấp hiện tại, cấp tiếp theo và giá. Nút **Gỡ** hoàn 100% cho cấp cao nhất đang có.
- Skin và booster đã mua không hoàn lại. Skin mua xong có nút "Mặc ngay".
- Khi không đủ tiền chỉ hiện gợi ý ("chơi màn X kiếm được khoảng N Core Bit"), không chặn, không đẩy mua.

### 4.3 Lịch mở hàng theo tiến trình

| Mốc | Hàng mở thêm |
| --- | --- |
| Sau 2 boss | **Quầy Upgrade mở.** Upgrade: Arc Core, Energy Cell, Armor Plating, Magnet Range (cấp 1–2) |
| Sau 4 boss | **Quầy Booster và quầy Skin mở.** Booster: Magnet Pulse, Shield Cell, Repair Kit, Boss Scanner. 6 skin Thường |
| Sau 5 boss | Booster: Overcharge, Second Chance. Skin Hiếm đợt 1. Upgrade: Nano Cell Cap, Dash Coil, Booster Slot; cấp 3 của Arc Core, Energy Cell, Armor Plating, Magnet Range |
| Sau 6 boss | Thêm 6 skin Thường. Skin Hiếm đợt 2 |
| Sau 8 boss | Skin Sử thi (trả bằng Data Chip). Upgrade cấp 4–5 |
| Theo thành tựu | Skin Thành tựu mở trực tiếp, không bán (mục 7) |

Quảng cáo nhận booster (`AD_BOOSTER`) chỉ đưa booster đã mở theo lịch này; booster nhận trước khi mở (quà, sự kiện) vào kho, ô hiện khóa (`QB-134`). Lịch mở Upgrade nằm trong `shop.json → unlockSchedule` (chỉ đếm boss chiến dịch). Cấp 3 sau 5 boss là quyết định lấp khoảng trống ngày 14/11/2026 (`04-Dev-Plan/stories/EP-09-quay-upgrade.md`), `[PLACEHOLDER]`. **Bản MVP (Hub dạng menu, mục 2):** Quầy Mira mở từ menu, chỉ tab Upgrade; tab Booster và Skin hiện khóa "sau boss 4", không có quầy Premium.

### 4.4 Danh mục skin khi ra mắt

Giá theo hạng: Thường 300–800 Core Bit, Hiếm 1.500–3.000 Core Bit, Sử thi 3–6 Data Chip `[PLACEHOLDER]`.

| Bộ phận | Thường | Hiếm | Sử thi | Thành tựu |
| --- | --- | --- | --- | --- |
| Đầu | Visor Xanh, Mũ Kỹ Sư | Mặt Nạ Hồ Quang | Vương Miện Mạch | Mũ Huyền Thoại |
| Thân | Áo Khoác Lab, Giáp Xám | Áo Choàng Neon | Lõi Thủy Tinh | Giáp Overclock |
| Tay và Arc Cannon | Pháo Cổ, Đạn Xanh | Pháo Plasma | Pháo Tinh Vân | Pháo Vô Cực |
| Chân | Giày Trắng, Ủng Công Trường | Giày Lò Xo Neon | Giày Gió | Giày Tốc Độ |
| Lõi năng lượng | Lõi Lam, Lõi Lục | Lõi Tím Xung | Lõi Cầu Vồng | Lõi Hợp Nhất |
| Hiệu ứng lướt | Vệt Trắng, Vệt Xanh | Tàn Ảnh | Vệt Sao Băng | Vệt Vàng |

Tổng 30 skin: 12 Thường, 6 Hiếm, 6 Sử thi, 6 Thành tựu.

## 5. Xưởng Lắp Ráp

Mở sau Stage 1; các tab mở dần theo lịch hướng dẫn (`07-Kich-ban-huong-dan.md`, mục 2): Kỹ năng sau boss 1, Module khi nhận module đầu tiên (thưởng nhiệm vụ phụ, Bảng Nhiệm Vụ mở sau boss 3; `15-Nhiem-vu-phu.md`), Giáp khi nhận Két giáp đầu tiên, Tủ skin và Loadout sau boss 5. Trước khi Tủ skin mở, skin mua ở Quầy mặc bằng nút "Mặc ngay". Tab chưa mở ghi điều kiện theo lời người chơi, ví dụ "Module · nhận từ Bảng Nhiệm Vụ" (`QB-132`). Số liệu kỹ năng, module, giáp: `10-He-thong-RPG-Xuong.md`.

**Bản MVP (duyệt 14/11/2026):** tab Kỹ năng làm trước; tab Module và Giáp làm khi có nội dung Stage 2–4 (nhiệm vụ phụ, Két giáp); **Tủ skin và Loadout dời sang Alpha** (mở sau boss 5, sau khi hết MVP; Shop MVP không bán skin). Xưởng dựng bằng bảng HTML (ADR-001). Năm tab của bản đầy đủ:

| Tab | Chức năng | Quy tắc |
| --- | --- | --- |
| Kỹ năng | 3 nhánh Vanguard, Phantom, Core; mỗi nút có 1–3 bậc (chấm bậc trên nút); chạm nút để xem mô tả, nút "Học (1 SP)" riêng để học một bậc | **Đặt lại miễn phí** mọi lúc (theo nhánh hoặc tất cả), hoàn toàn bộ SP, có bước xác nhận; cũng mở được từ menu tạm dừng, áp dụng ở lần hồi sinh kế tiếp |
| Module | 3 ô (4 ở cấp 10, 5 ở cấp 20); chạm để lắp/gỡ | Hiện tổng tải và cảnh báo khi vượt tải, không cho lưu cấu hình vượt tải |
| Giáp | 4 bộ phận, bản Mk I và Mk II, bật/tắt từng bộ phận | Hiện hiệu ứng chỉ số khi bật |
| Tủ skin | Chọn skin riêng cho 6 bộ phận, xem trước Kai khi đứng, chạy, lướt | Lưu được 3 bộ phối sẵn; skin phủ lên giáp |
| Loadout | 3 preset, mỗi preset lưu module, giáp bật/tắt và skin | Kỹ năng dùng chung mọi preset; đổi preset nhanh ở màn hình chuẩn bị |

- **Hitbox cố định:** mọi skin dùng cùng hitbox và khung hoạt ảnh gốc, nên không skin nào thay đổi cảm giác chơi hay độ khó.
- Skin hiển thị trong bảng xếp hạng và ảnh chụp thành tích.
- Thay đổi trong Xưởng áp dụng ngay, tự lưu, không cần nút Lưu.

## 6. NPC, Hub biến đổi theo cốt truyện, hội thoại

| NPC | Vai trò trong Hub |
| --- | --- |
| **Mira** | Quản lý Shop và Xưởng Lắp Ráp, giao nhiệm vụ phụ; đứng cạnh quầy |
| **NOVA** | Trợ lý trong menu: gợi ý build, nhắc cơ chế; xuất hiện bằng biểu tượng, không chặn thao tác |
| **Dr. Lin** | Hologram trong Phòng Hồ Sơ, đọc nhật ký mở theo Memory Log |
| **Vex** | Không ở Hub thường trực; chỉ xuất hiện tại các mốc cốt truyện |

Hub thay đổi theo tiến trình (đếm theo số boss đã hạ vì Stage 2–8 chọn thứ tự tự do):

| Mốc | Thay đổi Hub | Sự kiện |
| --- | --- | --- |
| Sau Prologue | Hub tối, hư hại, ít đèn | Mira giới thiệu căn cứ Arkon (H01). Quầy còn đóng, Mira chưa nhắc tới quầy |
| Sau Stage 1 | Mở Xưởng (tab Kỹ năng); đèn xanh lục sáng lên | Mira mở Xưởng |
| Sau boss thứ 2 | Quầy Upgrade của Mira mở | Mira mời mua nâng cấp đầu tiên |
| Sau boss thứ 3 | Thêm đèn, một góc cây xanh nhỏ; mở Bảng Nhiệm Vụ | Vex trò chuyện trực tiếp với Kai tại Hub (cảnh thoại ngắn, bỏ qua được; đã thấy bóng dáng ở Prologue). Mira giao nhiệm vụ của 3 màn đã qua (thứ tự màn tự do), gồm "Hạt giống thất lạc" |
| Sau boss thứ 4 (midpoint) | Hub tối lại, Mira nghi ngờ nhật ký của Lin; Quầy thêm tab Booster và Skin | Vex đưa Kai đoạn ghi cuộc bỏ phiếu của Hội đồng (lật mở lớp 1: Eclipse là AEGIS tự vệ). **Điểm chọn #1:** đưa nhật ký của Lin cho Vex hay giữ lại |
| Sau boss thứ 5 | Radio ở Hub phát bản tin mới của Hale; Xưởng mở Tủ skin và Loadout | Bản tin mâu thuẫn với đoạn ghi; Mira bắt đầu nghi Hội đồng |
| Sau boss thứ 6 | Hub sáng hơn, mở nhật ký Lin thứ hai | NOVA lỡ gọi Vex bằng mã hiệu cũ (gieo lật mở lớp 3) |
| Sau boss thứ 7 | Mira mở được bản thiết kế gốc của Kai | Lật mở lớp 2: Kai là Root Key |
| Sau boss thứ 8 | Mọi NPC tụ họp trước cổng Citadel | **Điểm chọn #2:** theo kế hoạch của Hale hay nhận lời mời của AEGIS |
| Citadel 3 | Không ở Hub | Lật mở lớp 3: NOVA là một mảnh của AEGIS |
| Sau kết thúc | Hub đổi theo kết thúc A, B hoặc C (GDD mục 3.7) | Cảnh kết trong Hub |

Mọi nhịp ở bảng này tính theo **số boss đã hạ**, không theo boss cụ thể, và do NPC ở Hub đảm nhận (GDD mục 3.3). Mỗi lần về Hub có tối đa 1 hệ thống mới và 1 nhịp truyện; nếu một lần về Hub chạm hai mốc thì nhịp sau dời sang lần về Hub kế tiếp (`QB-87`).

**Hội thoại mẫu của Mira** (mỗi lần tối đa 3 dòng, có nút bỏ qua; giọng và câu chuẩn ở `08-Giong-nhan-vat.md` mục 3)

- Lần đầu gặp (H01): "Đừng đứng ngẩn ra đó. Tôi là Mira. Cái trạm đổ nát này là Arkon, từ giờ là nhà của cậu."
- Kai: "Tôi không có gì để trả." Mira: "Chưa cần. Quầy còn trống. Ra ngoài hạ vài con drone, Bit tự rơi ra."
- Quầy mở (R04): "Quầy mở rồi. Cậu đủ tiền cho một nâng cấp đấy. Đừng mua cái màu hồng."
- Khi mua: "Được rồi, lắp xong. Mang nó về nguyên vẹn, tôi không có đồ thay đâu."
- Không đủ tiền: "Thiếu Bit. Tôi không bán chịu, kể cả cho cậu."
- Mở Xưởng: "Giờ thì cậu tháo ra lắp lại được rồi. Đừng làm hỏng đồ của tôi."

Lời NPC ở Hub hiện nằm trong file này, `07-Kich-ban-huong-dan.md` và `15-Nhiem-vu-phu.md` mục 6.5. Khi có `03-Data/dialogue_hub.json` (cần Story, mục 10) thì file JSON là nguồn, với cùng luật kiểm tra như thoại Warden.

## 7. Nhiệm vụ phụ, nhật ký, thành tựu

**Bảng Nhiệm Vụ** (chi tiết bản MVP: `15-Nhiem-vu-phu.md`): mỗi màn có 1 nhiệm vụ phụ, giao qua Mira sau khi hạ boss màn đó; Bảng mở sau boss thứ 3, lúc đó nhiệm vụ của các màn đã qua hiện cùng lúc. Nhận nhiệm vụ và nhận thưởng đều ở Bảng; nhận thưởng là một lần ghi nguyên tử (module, Data Chip, trạng thái). Bản MVP mở Bảng từ menu (phím N). MVP chưa có bản đồ nhỏ, nên vật nhiệm vụ phát cột sáng nhìn thấy từ đường chính, HUD có bộ đếm theo đoạn, và radar Đầu Mk I chỉ cả vật của nhiệm vụ đang làm.

| Màn | Nhiệm vụ | Mục tiêu | Thưởng |
| --- | --- | --- | --- |
| 1 Verdant | Hạt giống thất lạc | Thu 5 Hạt Giống Phát Quang | 1 Data Chip + module Magnet Core |
| 2 Prism | Gương rối | Phá 6 Gương Rối (vật tĩnh nhiễm Eclipse, khác kẻ địch Gương Quang và gương của câu đố laser) | 1 Data Chip + module Last Stand |
| 3 Cryo | Băng vỡ | Mang thùng thuốc lạnh qua đoạn băng trượt, không rơi, không chết | 1 Data Chip + module Phase Step |
| 4 Cirrus | Gió mất hướng | Mang máy ghi gió qua đoạn gió, không chạm sàn | 1 Data Chip + module Energy Siphon |
| 5 Bedrock | Hầm sập | Thu 5 tinh thể | 1 Data Chip + module Spike Guard |
| 6 Ion | Bật lại trạm | Kích hoạt 4 công tắc trong một lần chơi | 1 Data Chip + module Second Wind |
| 7 Abyss | Tín hiệu mất tích | Tìm 3 phao tín hiệu | 1 Data Chip + module Scholar |
| 8 Foundry | Khuôn đúc kẹt | Phá 4 máy đúc bằng bắn nạp | 1 Data Chip + module Echo Shot |

Module thưởng gắn theo **`index` của màn** trong `stages.json` (ghi ở `quests.json`), không theo thứ tự hoàn thành.

**Phòng Hồ Sơ gồm bốn mục:** Nhật ký Dr. Lin (mở theo 8 Memory Log), Hồ sơ boss (mở sau khi hạ), Từ điển kẻ địch (mở khi gặp), Thống kê (thời gian chơi, số lần chết, tỷ lệ hoàn thành).

**Thành tựu mở skin:**

| Skin | Thành tựu |
| --- | --- |
| Mũ Huyền Thoại | Hạ cả 8 boss Hunt ở Mức Eclipse 6 |
| Giáp Overclock | Hoàn thành mọi màn ở Mức Eclipse 10 |
| Pháo Vô Cực | Hạ cả 8 boss bằng vũ khí điểm yếu |
| Giày Tốc Độ | Hoàn thành cả 8 màn dưới thời gian mục tiêu |
| Lõi Hợp Nhất | Đạt kết thúc C (True End) |
| Vệt Vàng | Thu thập 100% (Két giáp, Memory Log, Nano Cell, nhiệm vụ phụ) |

Thành tựu nhỏ khác (ví dụ hạ boss không bị đánh trúng) thưởng thêm Core Bit hoặc Data Chip với lượng nhỏ `[PLACEHOLDER]`.

## 8. Dữ liệu lưu và đồng bộ cloud

| Nhóm dữ liệu | Nội dung |
| --- | --- |
| Tiến trình | Boss đã hạ, màn đã mở, độ khó đã mở, Memory Log, lựa chọn cốt truyện |
| Nhân vật | Cấp, EXP, SP, kỹ năng đã học, module sở hữu, Két giáp |
| Kho | Core Bit, Data Chip (`inventory.dataChips`, bản lưu kế tiếp), số lượng booster, cấp upgrade |
| Cosmetic | Skin sở hữu, 3 bộ phối, 3 loadout |
| Nhiệm vụ và thành tựu | Trạng thái, tiến độ (nhiệm vụ phụ: nhóm `sideQuests`, bản lưu kế tiếp) |
| Cài đặt | Bố cục nút, độ nhạy, trợ năng |
| Kỷ lục | Thành tích tốt nhất theo màn và độ khó |

**Quy tắc đồng bộ**

- Lưu cục bộ trước, luôn chơi được khi mất mạng, kể cả mua hàng trong Shop; đồng bộ lên cloud khi có mạng và đã đăng nhập.
- Thời điểm ghi lên cloud (thưa, theo mốc): sau mỗi giao dịch Shop, sau khi hoàn thành hoặc thoát màn, khi đóng ứng dụng.
- Mỗi bản lưu có số revision tăng dần và thời điểm lưu.
- **Xung đột giữa hai thiết bị:** không tự động gộp (tránh nhân đôi tiền). Hiện màn hình chọn "Giữ bản trên máy này" hoặc "Dùng bản cloud", kèm tóm tắt từng bản (cấp, số boss đã hạ, thời gian chơi, lần lưu cuối).
- Giao dịch Shop nguyên tử: trừ tiền và thêm món trong cùng một lần ghi.
- Bảng xếp hạng **không tin dữ liệu từ client**: điểm được server kiểm tra bằng seed và chuỗi input (mục 15 GDD chính); dữ liệu kho tiền không liên quan bảng xếp hạng.
- Xuất/nhập mã sao lưu có checksum cho người không dùng tài khoản.
- Xóa tài khoản sẽ xóa toàn bộ cloud save; chỉ lưu dữ liệu game và định danh đăng nhập.

## 9. Tiêu chí nghiệm thu

- [ ] Từ màn hình chuẩn bị vào chơi tối đa 2 chạm; menu nhanh đến mọi khu chỉ 1 chạm.
- [ ] Hub tải ≤ 2 giây, ≤ 4 MB, 60 FPS trên điện thoại tầm trung.
- [ ] Mua skin, booster, upgrade trừ đúng tiền, giao dịch nguyên tử, mất mạng giữa chừng không mất tiền và không mua trùng.
- [ ] Gỡ upgrade hoàn đúng 100%; đặt lại kỹ năng hoàn đủ SP.
- [ ] Không lưu được loadout vượt tải module.
- [ ] Hitbox và khung hoạt ảnh không đổi giữa mọi skin (kiểm tra tự động).
- [ ] Hàng mở đúng lịch mục 4.3; hàng khóa hiện đúng điều kiện mở.
- [ ] Booster tiêu hao khi vào màn và hoàn lại nếu thoát trước checkpoint đầu tiên.
- [ ] Cloud: đăng nhập/đăng xuất, xung đột hai thiết bị hiện màn hình chọn, đồng bộ không nhân đôi tiền.
- [ ] Popup ưu đãi tối đa 1 mỗi phiên, không hiện trong màn chơi, luôn có nút đóng; đồng hồ đếm ngược chỉ khi hạn là thật (kiểm tra cả mã nguồn).
- [ ] Chữ ≥ 16 sp (chữ canvas ≥ 11 px logic, hoặc lớp HTML), nút ≥ 48 dp, lề theo `env(safe-area-inset-*)` (`QB-74`, `QB-92`); điều khiển Hub được bằng bàn phím, tay cầm và cảm ứng.
- [ ] Với 10 playtester: ≥ 90% mua được món đầu tiên không cần hướng dẫn; thời gian ở Hub trung bình 1–3 phút.

## 10. Việc cần Story (rà soát 14/11/2026)

Đưa vào EP-14 (Hub, Cài đặt). Mọi số là `[PLACEHOLDER]`.

| Mã rà soát | Yêu cầu | Luật |
| --- | --- | --- |
| L03 | Hub dạng menu theo mục 2: Cổng Chiến dịch → danh sách 4 màn → màn Chuẩn bị; nút ≥ 48 dp cho chạm và tay cầm; H01–H04 | `07` mục 4.1 |
| C05 | Cờ `weaknessKnown[boss]` (mục 3), màn Chuẩn bị đọc cờ | `QB-83` |
| C06 | Tab Module mở khi nhận module đầu tiên; Tủ skin và Loadout sau boss 5; nhãn tab khóa theo lời người chơi | `QB-87`, `QB-132` |
| E23 | Quầy Premium là tab 4 của Quầy Mira, khu Cửa hàng Gem là lối tắt; `AD_BOOSTER` chỉ đưa booster đã mở; phím tắt Menu nhanh 1–0, Start ở Hub mở Menu nhanh | `QB-94`, `QB-133`, `QB-134` |
| N01, N03 | Chữ canvas ≥ 11 px logic hoặc lớp HTML (ADR-001); nút ≥ 48 dp; safe-area cho bảng HTML và lề HUD | `QB-74`, `QB-92` |
| T02 | `03-Data/dialogue_hub.json`: lời Mira, Vex, Hale, NOVA ở Hub (mục 6), cùng luật kiểm tra với thoại Warden (≤ 140 ký tự vi, ≤ 182 en; xưng hô; không viết tắt tiếng Anh) | `07` mục 12 |
