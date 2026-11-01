# Đặc tả chi tiết: Hub Arkon & Shop

Hub Arkon là nơi người chơi chọn màn, chuẩn bị build và mua sắm. Tài liệu này đặc tả Hub, Shop và các màn hình liên quan. Tiền trong game gồm Core Bit và Data Chip (kiếm khi chơi) và Gem (tiền cao cấp, mua hoặc kiếm được; xem tab Kế hoạch kiếm tiền và Live-ops). Mọi con số đánh dấu `[PLACEHOLDER]` cần chỉnh sau playtest.

## 1. Vai trò và nguyên tắc

Hub Arkon mở sau Prologue, là điểm trung chuyển giữa mọi màn: gặp Mira, mua sắm, chuẩn bị build, đọc truyện. Thời gian trung bình mỗi lần ở Hub: 1–3 phút `[PLACEHOLDER]`.

- Từ Hub vào màn tiếp theo trong tối đa 2 chạm.
- Đi bộ trong Hub là tùy chọn; menu nhanh truy cập mọi chức năng.
- Ưu đãi giới hạn thời gian được phép nhưng tối đa 1 popup mỗi phiên, không hiện trong màn chơi, luôn có nút đóng, không đếm ngược giả.
- Tính năng mở dần theo tiến trình để người mới không bị ngợp (lịch ở mục 4).
- Mọi giao dịch có xác nhận rõ ràng; upgrade và kỹ năng hoàn lại được tại Hub.

## 2. Bố cục Hub và các khu vực

Hub rộng 3 màn hình (60 × 12 tile), đi bộ được bằng điều khiển thường. Mỗi khu là một điểm tương tác; đến gần hiện biểu tượng. Từ bản 0.4 thêm 3 khu: Cửa hàng Gem (IAP), Sự kiện (đăng nhập 30 ngày, 7 ngày tân thủ, vòng quay, Season Pass, nhiệm vụ ngày/tuần) và Vùng Eclipse (khóa đến khi hạ AEGIS). Chấm báo hiện khi có quà hoặc việc mới.

| Khu | Vị trí | Chức năng | Mở khi |
| --- | --- | --- | --- |
| Cổng Chiến dịch | Phải | Bản đồ 8 màn + Citadel, chọn màn | Sau Prologue |
| Quầy Mira (Shop) | Giữa | Skin, booster, upgrade | Sau boss thứ 2 (Upgrade); Booster và Skin sau boss thứ 4 |
| Xưởng Lắp Ráp | Giữa-trái | Cây kỹ năng, module, Két giáp, loadout, tủ skin | Sau Stage 1 (tab mở dần, mục 5) |
| Bảng Nhiệm Vụ | Giữa-phải | Nhiệm vụ phụ | Sau boss thứ 3 |
| Phòng Hồ Sơ | Trái | Nhật ký, Memory Log, thành tựu, bảng xếp hạng, thống kê | Sau Prologue |
| Cài đặt | Trong menu | Điều khiển, đồ họa, âm thanh, tài khoản và cloud | Luôn có |

**Điều khiển trong Hub**

- Tương tác: PC phím E, tay cầm Y, cảm ứng chạm vào khu.
- **Menu nhanh:** nút ở góc trên phải mở lưới 10 ô (2 hàng), mỗi ô một chạm đến khu tương ứng, Kai tự chạy tới. PC: phím Tab rồi 1–6; tay cầm: nút Menu.
- Hub tải ≤ 4 MB và vào được trong ≤ 2 giây.

## 3. Màn hình chuẩn bị trước màn

Mở khi chọn một màn ở Cổng Chiến dịch. Bố cục ngang gồm ba cột.

| Cột | Thành phần |
| --- | --- |
| Trái: thông tin màn | Tên màn, cấp khuyến nghị, tiến độ thu thập (Két giáp, Memory Log, bí mật: x/y), vũ khí khắc chế boss (chỉ hiện sau khi đã gặp boss) |
| Giữa: độ khó | Chọn một trong 6 độ khó; độ khó chưa mở hiện khóa kèm điều kiện; mặc định là độ khó đã chọn lần trước cho màn đó |
| Phải: chuẩn bị | 2 slot booster (3 sau upgrade), loadout hiện tại (đổi nhanh giữa 3 preset), thanh Sức mạnh so với mức khuyến nghị |

- Nút **Bắt đầu** lớn ở góc dưới phải; từ lúc chọn màn tới khi vào chơi tối đa 2 chạm.
- Nếu cấp thấp hơn mức khuyến nghị quá 2 cấp, hiện gợi ý mềm (nâng cấp, dùng booster) nhưng không chặn.
- Gán booster bằng chạm vào slot rồi chọn; booster tiêu hao khi vào màn, hoàn lại nếu thoát trước checkpoint đầu tiên.
- Thanh Sức mạnh dựa trên Power Score (cấp + upgrade + module) và đổi màu: xanh đạt, vàng thấp hơn, đỏ thấp nhiều `[PLACEHOLDER]`.

## 4. Shop

### 4.1 Giao diện

Ba tab ở trên cùng: **Skin**, **Booster**, **Upgrade (cộng quầy Premium: Gem, Cyber+, Season Pass; xem tab Kế hoạch kiếm tiền và Live-ops)**. Số dư Core Bit và Data Chip luôn hiện ở góc trên phải. Bên trái là lưới thẻ món hàng; bên phải là panel chi tiết (mô tả, xem trước Kai với skin, giá, nút Mua).

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
| Sau 5 boss | Booster: Overcharge, Second Chance. Skin Hiếm đợt 1. Upgrade: Nano Cell Cap, Dash Coil, Booster Slot |
| Sau 6 boss | Thêm 6 skin Thường. Skin Hiếm đợt 2 |
| Sau 8 boss | Skin Sử thi (trả bằng Data Chip). Upgrade cấp 4–5 |
| Theo thành tựu | Skin Thành tựu mở trực tiếp, không bán (mục 7) |

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

Mở sau Stage 1; các tab mở dần theo lịch hướng dẫn (`07-Kich-ban-huong-dan.md`, mục 2): Kỹ năng sau boss 1, Module sau boss 3, Giáp khi nhận Két giáp đầu tiên, Tủ skin và Loadout sau boss 4. Năm tab:

| Tab | Chức năng | Quy tắc |
| --- | --- | --- |
| Kỹ năng | 3 nhánh Vanguard, Phantom, Core; chạm nút để xem mô tả và học (1 SP) | **Đặt lại miễn phí** mọi lúc, hoàn toàn bộ SP, có bước xác nhận |
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
| Sau Prologue | Hub tối, hư hại, ít đèn | Mira giới thiệu căn cứ Arkon (Shop còn đóng: "Quầy chưa có hàng, kiếm ít Core Bit đã") |
| Sau Stage 1 | Mở Xưởng (tab Kỹ năng); đèn xanh lục sáng lên | Mira mở Xưởng |
| Sau boss thứ 2 | Quầy Upgrade của Mira mở | Mira mời mua nâng cấp đầu tiên |
| Sau boss thứ 3 | Thêm đèn, một góc cây xanh nhỏ; mở Bảng Nhiệm Vụ | Vex trò chuyện trực tiếp với Kai tại Hub (cảnh thoại ngắn, bỏ qua được; đã thấy bóng dáng ở Prologue). Mira giao nhiệm vụ của màn 1–3, gồm "Hạt giống thất lạc" |
| Sau boss thứ 4 (midpoint) | Hub tối lại, Mira nghi ngờ nhật ký của Lin | Vex đưa Kai đoạn ghi cuộc bỏ phiếu của Hội đồng (lật mở lớp 1: Eclipse là AEGIS tự vệ). **Điểm chọn #1:** đưa nhật ký của Lin cho Vex hay giữ lại |
| Sau boss thứ 5 | Radio ở Hub phát bản tin mới của Hale | Bản tin mâu thuẫn với đoạn ghi; Mira bắt đầu nghi Hội đồng |
| Sau boss thứ 6 | Hub sáng hơn, mở nhật ký Lin thứ hai | NOVA lỡ gọi Vex bằng mã hiệu cũ (gieo lật mở lớp 3) |
| Sau boss thứ 7 | Mira mở được bản thiết kế gốc của Kai | Lật mở lớp 2: Kai là Root Key |
| Sau boss thứ 8 | Mọi NPC tụ họp trước cổng Citadel | **Điểm chọn #2:** theo kế hoạch của Hale hay nhận lời mời của AEGIS |
| Citadel 3 | Không ở Hub | Lật mở lớp 3: NOVA là một mảnh của AEGIS |
| Sau kết thúc | Hub đổi theo kết thúc A, B hoặc C (GDD mục 3.7) | Cảnh kết trong Hub |

Mọi nhịp ở bảng này tính theo **số boss đã hạ**, không theo boss cụ thể, và do NPC ở Hub đảm nhận (GDD mục 3.3).

**Hội thoại mẫu của Mira** (mỗi lần tối đa 3 dòng, có nút bỏ qua)

- Lần đầu gặp: "Đừng đứng ngẩn ra đó. Tôi là Mira, kỹ sư trạm Arkon. Có Core Bit thì vào quầy xem hàng."
- Kai: "Tôi không có gì để trả." Mira: "Hạ vài con drone là rơi ra Bit. Ở đây không ai tính tiền thật, Core Bit là đủ."
- Khi mua: "Hàng tốt đấy. Lần sau nhớ quay lại."
- Không đủ tiền: "Chưa đủ Bit. Ra ngoài kiếm thêm rồi quay lại."
- Mở Xưởng: "Giờ thì cậu tháo ra lắp lại được rồi. Đừng làm hỏng đồ của tôi."

## 7. Nhiệm vụ phụ, nhật ký, thành tựu

**Bảng Nhiệm Vụ:** mỗi màn có 1 nhiệm vụ phụ, giao qua Mira sau khi hạ boss màn đó; Bảng mở sau boss thứ 3, lúc đó nhiệm vụ của các màn đã qua hiện cùng lúc. Mục tiêu hiện trên bản đồ nhỏ khi vào màn.

| Màn | Nhiệm vụ | Mục tiêu | Thưởng |
| --- | --- | --- | --- |
| 1 Verdant | Hạt giống thất lạc | Thu 5 Hạt Giống Phát Quang | 1 Data Chip + module Magnet Core |
| 2 Prism | Gương rối | Phá 6 gương phản xạ | 1 Data Chip + module Last Stand |
| 3 Cryo | Băng vỡ | Qua đoạn trượt không rơi | 1 Data Chip + module Phase Step |
| 4 Cirrus | Gió mất hướng | Qua đoạn gió mà không chạm sàn | 1 Data Chip + module Energy Siphon |
| 5 Bedrock | Hầm sập | Thu 5 tinh thể | 1 Data Chip + module Spike Guard |
| 6 Ion | Bật lại trạm | Kích hoạt 4 công tắc trong một lần chơi | 1 Data Chip + module Second Wind |
| 7 Abyss | Tín hiệu mất tích | Tìm 3 phao tín hiệu | 1 Data Chip + module Scholar |
| 8 Foundry | Khuôn đúc kẹt | Phá 4 máy đúc bằng bắn nạp | 1 Data Chip + module Echo Shot |

Module thưởng gắn theo **vị trí màn** (không theo chủ đề) để đường sức mạnh giữ nguyên khi thứ tự màn đổi.

**Phòng Hồ Sơ gồm bốn mục:** Nhật ký Dr. Lin (mở theo 8 Memory Log), Hồ sơ boss (mở sau khi hạ), Từ điển kẻ địch (mở khi gặp), Thống kê (thời gian chơi, số lần chết, tỷ lệ hoàn thành).

**Thành tựu mở skin:**

| Skin | Thành tựu |
| --- | --- |
| Mũ Huyền Thoại | Phá đảo độ khó Huyền thoại |
| Giáp Overclock | Phá đảo độ khó Overclock |
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
| Kho | Core Bit, Data Chip, số lượng booster, cấp upgrade |
| Cosmetic | Skin sở hữu, 3 bộ phối, 3 loadout |
| Nhiệm vụ và thành tựu | Trạng thái, tiến độ |
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
- [ ] Không có popup quảng bá, đồng hồ đếm ngược hay đường dẫn mua bằng tiền thật (kiểm tra cả mã nguồn).
- [ ] Chữ ≥ 16 sp, nút ≥ 48 dp; điều khiển Hub được bằng bàn phím, tay cầm và cảm ứng.
- [ ] Với 10 playtester: ≥ 90% mua được món đầu tiên không cần hướng dẫn; thời gian ở Hub trung bình 1–3 phút.
