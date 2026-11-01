# Kịch bản hướng dẫn làm quen với game

Kịch bản hướng dẫn (tutorial/onboarding) cho người chơi mới của Cyber Vanguard: từ lần mở game đầu tiên đến endgame. Mỗi bước có mã, điều kiện kích hoạt, hành động yêu cầu, lời thoại, điều kiện hoàn thành và cách xử lý khi người chơi vướng. Prologue dùng các nhịp đã có ở tab Đặc tả Prologue & Stage 1. Mọi con số đánh dấu `[PLACEHOLDER]` cần chỉnh sau playtest.

## 1. Nguyên tắc, mục tiêu và KPI

**Nguyên tắc** (lời thoại theo `08-Giong-nhan-vat.md`: NOVA đang hiệu chỉnh cơ thể Kai, nên mỗi bước hướng dẫn là một bước hiệu chỉnh)

1. **Học bằng làm:** mỗi bước dạy một điều, trong một tình huống an toàn; lời thoại tối đa 2 dòng.
2. **Không khóa lâu:** cutscene và hội thoại bỏ qua được; không khóa điều khiển quá 10 giây.
3. **Thích ứng:** nếu người chơi đã làm đúng trước khi gợi ý hiện, bỏ qua bước; nếu vướng thì gợi ý rõ hơn (mục 7).
4. **Không bán hàng trong lúc học:** không quảng cáo, popup ưu đãi hay IAP ở Prologue và Stage 1; quảng cáo đầu tiên chỉ sau khi hạ boss Stage 1.
5. **Mở dần, mỗi lần về Hub tối đa một hệ thống mới:** chỉ giới thiệu hệ thống khi người chơi cần nó và có thể dùng ngay (ví dụ Shop chỉ mở khi đủ tiền mua món đầu tiên). Lịch ở mục 2.
7. **Chơi trước, cài đặt sau:** người chơi điều khiển Kai trong ≤ 15 giây kể từ lần mở đầu tiên; các màn cài đặt không cần cho việc chơi dời ra sau Prologue.
6. **Xem lại được:** mọi hướng dẫn có trong Trợ giúp (Menu tạm dừng) và Phòng Hồ Sơ.

**KPI `[PLACEHOLDER]`**

| Chỉ số | Mục tiêu |
| --- | --- |
| Hoàn thành Prologue | ≥ 90% |
| Thời lượng Prologue | 3–5 phút |
| Bỏ cuộc tại một bước | ≤ 3% mỗi bước |
| Người chọn "Bỏ qua hướng dẫn" | ≤ 15% |
| Hoàn thành Stage 1 ở phiên đầu | ≥ 70% |
| Mua món đầu tiên không cần chỉ dẫn thêm | ≥ 90% |
| Giữ chân ngày 1 | ≥ 35% |

## 2. Tổng quan các giai đoạn và mở dần tính năng

| Giai đoạn | Khi nào | Mục tiêu học | Mã bước | Thời lượng |
| --- | --- | --- | --- | --- |
| 0. Mở game lần đầu | Lần mở đầu tiên | Vào chơi ngay (ngôn ngữ tự nhận theo máy) | F01, F04 | ≤ 15 giây |
| 1. Prologue | Sau giai đoạn 0 | Chạy, nhảy, bắn, bắn nạp, lướt, né telegraph | P01–P13 | 3–5 phút |
| 2. Hub đầu tiên | Sau Prologue | Cài đặt còn lại (tuổi, đồng ý quảng cáo, cỡ nút), Menu nhanh, chọn màn | F02, F03, H01–H04 | 1–2 phút |
| 3. Stage 1 | Sau H04 | Bám tường, dây leo, gai, phòng khóa, khiên, boss, đổi vũ khí | S01–S13 | \~10 phút |
| 4. Mở dần theo số boss | Sau boss 1, 2, 3, 4 | Mỗi mốc một hệ thống: kỹ năng → Shop → nhiệm vụ và module → booster và skin | R01–R06 | 1–2 phút mỗi mốc |
| 5. Mở dần theo tình huống | Rải rác qua 8 màn | Thứ tự màn, điểm yếu, Két giáp, Nano Cell, gợi ý khi chết nhiều | D01–D10 | Theo tình huống |
| 6. Live-ops, quảng cáo, mua hàng | Từ ngày 2 và sau boss 2 | 7 ngày tân thủ, đăng nhập, vòng quay, quà, hồi sinh bằng quảng cáo, Starter Pack | L01–L08 | Theo tình huống |
| 7. Endgame | Sau khi hạ AEGIS | Vùng Eclipse, Farm, Chip Lõi, tỷ lệ rơi, nâng cấp, Sweep, Mastery | E01–E07 | \~10 phút |

**Tính năng mở dần**

| Tính năng | Mở khi | Giới thiệu qua |
| --- | --- | --- |
| Chạy, nhảy, bắn | Ngay từ Prologue | P01–P05 |
| Bắn nạp, lướt | Giữa Prologue | P08, P09 |
| Bám tường | Stage 1 đoạn A | S01 |
| Đổi vũ khí, năng lượng vũ khí | Sau Thorna | S12, S13 |
| **Sau boss 1:** Xưởng (tab Kỹ năng), chọn thứ tự màn | Kết quả Stage 1 | R01–R03, D01 |
| **Sau boss 2:** Shop (quầy Upgrade), dùng vũ khí khắc chế | Lúc này đủ \~525 Core Bit cho upgrade đầu (400) | R04, D03 |
| **Sau boss 3:** Bảng Nhiệm Vụ, Xưởng (tab Module) | Nhiệm vụ của màn 1–3 hiện cùng lúc; nhiệm vụ màn 1 thưởng module đầu tiên | R05, D04 |
| **Sau boss 4:** Quầy Booster, Tủ skin, Loadout | Màn Chuẩn bị hiện ô booster từ đây | R06, D05 |
| Giáp (tab Giáp), Nano Cell | Khi nhận lần đầu | D02, D07 |
| Đăng nhập, vòng quay, 7 ngày tân thủ, quà 4 giờ | Từ ngày 2, hoặc sau boss 2 nếu chơi tiếp trong ngày 1 | L01–L03, L06 |
| Quảng cáo rewarded, Starter Pack | Rewarded sau boss 1; Starter Pack từ ngày 2 và sau boss 2 | L04, L05 |
| Vùng Eclipse, Chip Lõi | Sau AEGIS | E01–E07 |

Lý do: trước đây khoảng 12 hệ thống (EXP, Core Bit, Data Chip, Xưởng, SP, Shop, nhiệm vụ, booster, 7 ngày, vòng quay, quà, thứ tự màn) dồn vào 5 phút sau Stage 1. Mỗi mốc giờ chỉ có 1–2 thứ mới, và người chơi luôn dùng được ngay thứ vừa mở.

## 3. Giai đoạn 0 và 1: mở game lần đầu và Prologue

Biểu tượng nút (`{NHẢY}`, `{BẮN}`, `{LƯỚT}`, `{DI_CHUYỂN}`, `{ĐỔI_VK}`) tự đổi theo thiết bị đang dùng (mục 8).

### 3.1 Giai đoạn 0: mở game lần đầu

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| F01 | Lần mở đầu tiên | Không cần làm gì | Ngôn ngữ tự nhận theo máy (Tiếng Việt nếu máy dùng tiếng Việt, còn lại English); chỉ hỏi khi máy dùng ngôn ngữ khác hai thứ tiếng này. Đổi lại được ở Cài đặt | Tự động | Không cần xử lý |
| F02 | **Sau Prologue**, trước khi vào Hub | Xác nhận tuổi 13+ và đồng ý quảng cáo | Màn tuổi và đồng ý quảng cáo | Hoàn thành | Dưới 13 tuổi: dừng, giải thích |
| F03 | Thiết bị cảm ứng, **sau F02** | Chọn cỡ nút (nhỏ/vừa/lớn) và tay thuận | "Chọn cỡ nút cho vừa tay" kèm xem trước; trong Prologue dùng cỡ vừa mặc định | Xác nhận hoặc "Dùng mặc định" | Bỏ qua được; chỉnh lại ở Cài đặt |

**Ràng buộc khi dời F02:** Prologue chạy không cần mạng; trước F02 không khởi tạo SDK quảng cáo và không gửi dữ liệu phân tích có định danh. Sự kiện đo lường của Prologue lưu cục bộ, gửi đi sau khi người chơi đồng ý. Cần tư vấn pháp lý xác nhận cách làm này với từng thị trường soft launch `[PLACEHOLDER]`.
| F04 | Bắt đầu Prologue (ngay sau F01) | (Tùy chọn) bỏ qua phần hướng dẫn | Nút nhỏ "Tôi đã biết chơi, bỏ qua hướng dẫn" hiện sau 10 giây | Bấm hoặc không | Bỏ qua: mở khóa mọi nút, nhảy tới checkpoint P07 |

### 3.2 Giai đoạn 1: Prologue (bám các nhịp trong tab Đặc tả Prologue & Stage 1)

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| P01 | 0:00 Kai tỉnh dậy | Chạy sang phải | NOVA: "Khởi động lại... xong. Kai, nghe rõ không? Tôi là NOVA. Chân cậu có điện rồi, đi về phía cửa." Biểu tượng `{DI_CHUYỂN}` nhấp nháy | Đi 8 ô | Đứng yên 8 giây: mũi tên chỉ hướng và nhắc "Dùng `{DI_CHUYỂN}` để chạy." |
| P02 | 0:20 Khe sàn | Nhảy qua khe 2 ô | NOVA: "Khe hở. Thử bật lên xem: `{NHẢY}`." | Qua khe | Rơi 3 lần: "Nhấn khi chạm mép khe rồi thả ra."; khe không gây chết |
| P03 | Bục thấp và cao | Nhảy cao hơn bằng giữ nút | NOVA: "Lực bật đang ở mức thấp. Giữ `{NHẢY}` lâu hơn để dồn lực." | Lên bục 3,5 ô | Thất bại 3 lần: hiện bóng mờ minh họa giữ nút |
| P04 | 0:45 Thùng phế liệu | Bắn | NOVA: "Pháo tay còn nguội. Bắn thử vào thùng kia: `{BẮN}`." | Phá thùng | Sau 6 giây: nhấp nháy nút `{BẮN}` |
| P05 | 1:10 Drone đầu tiên | Hạ Drone | NOVA: "Drone tuần tra. Bộ ngắm của nó hỏng rồi, không bắn trúng được đâu. Hạ nó đi." Drone chưa gây sát thương | Hạ Drone | Sau 10 giây: Drone tự lùi lại gần hơn |
| P06 | 1:50 Drone bay | Nhảy và bắn lên cao | NOVA: "Hai cái trên cao. Nhảy lên rồi bắn." | Hạ 2 Drone bay | Nhắc lại sau 3 lần trượt |
| P07 | Checkpoint 1 | Đi qua checkpoint | Cờ sáng. NOVA: "Tôi vừa lưu trạng thái của cậu ở đây. Có chuyện gì thì cậu tỉnh lại từ chỗ này." | Chạm checkpoint | Không cần xử lý |
| P08 | 2:20 Khối chắn cam | Bắn nạp | NOVA: "Khối này dày quá. Giữ `{BẮN}` cho Arc tích điện, rồi thả." Hiện thanh nạp | Phá khối | Sau 5 giây: hiện thanh nạp minh họa |
| P09 | 2:50 Hành lang đạn huấn luyện | Lướt qua khe đạn | NOVA: "Hành lang huấn luyện cũ, đạn tập không làm đau. Thử `{LƯỚT}` xuyên qua khe." Mở khóa nút lướt. Đạn huấn luyện chỉ đẩy lùi, **chưa gây sát thương** | Qua hành lang | Thất bại 3 lần: làm chậm đạn 20% |
| P10 | 3:05 Tháp pháo tập sự, sau một đoạn nghỉ ngắn | Né theo telegraph (dùng lướt vừa học) | NOVA: "Cái tháp này bắn thật đấy. Nó sáng lên trước khi khai hỏa, thấy sáng là né." Từ đây kẻ địch gây sát thương thật | Né 3 phát liên tiếp | Chết: về checkpoint P07, gợi ý "Quan sát ánh sáng báo trước" |
| P11 | Vật phẩm hồi máu | Nhặt | NOVA: "Gói sửa chữa màu xanh. Nhặt đi, cậu đang rò điện kìa." | Nhặt vật phẩm | Vật phẩm xuất hiện sau khi người chơi mất máu lần đầu |
| P12 | 3:20 Tiền sảnh | Xem cảnh Vex | Vex: "Unit-K... vậy là chúng vẫn chọn mày." Kai: "Ai vậy?" NOVA (ngập ngừng): "Tôi... không có dữ liệu về người này." | Xem hoặc "Bỏ qua" | Cảnh tối đa 8 giây, bỏ qua được |
| P13 | 3:50 Thoát ra | Ra khỏi phòng thí nghiệm | Tiêu đề màn; mở Hub Arkon | Qua cửa | Không cần xử lý |

## 4. Giai đoạn 2 và 3: Hub lần đầu và Stage 1

### 4.1 Giai đoạn 2: Hub lần đầu

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| H01 | Vào Hub lần đầu | Nói chuyện với Mira | Mira: "Đừng đứng ngẩn ra đó. Tôi là Mira, kỹ sư trạm Arkon." | Hết thoại | Bỏ qua được |
| H02 | Sau H01 | Mở Menu nhanh | Mira chỉ vào nút Menu: "Trạm rộng lắm, nhưng cậu không cần đi bộ đâu. Chạm Menu là tới đâu cũng được." | Mở menu | Sau 10 giây nút Menu nhấp nháy |
| H03 | Sau H02 | Chọn Cổng Chiến dịch | NOVA: "Tín hiệu Eclipse mạnh nhất ở Verdant Gardens. Bắt đầu từ đó." Chỉ Stage 1 được mở | Chọn Stage 1 | Chỉ có một lựa chọn |
| H04 | Màn Chuẩn bị lần đầu | Bắt đầu màn | NOVA: "Đây là nơi chọn độ khó. Lần này cứ để Thường rồi bấm Bắt đầu." (ô booster chưa hiện cho tới sau boss 4) | Bấm Bắt đầu | Các phần khác làm mờ |

### 4.2 Giai đoạn 3: Stage 1

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| S01 | Đoạn A, giếng cao | Bám tường và leo | NOVA: "Lớp bám ở lòng bàn tay vẫn chạy. Nhảy vào tường để bám, nhảy tiếp để leo." | Lên đỉnh giếng | Thất bại 3 lần: mũi tên trên tường và bóng mờ |
| S02 | Đoạn B, dây leo đu | Nhảy lên dây | NOVA: "Dây leo đang lắc. Đợi nó lại gần bờ rồi hẵng nhảy." | Qua đoạn dây | Rơi 3 lần: dây chậm lại 15% |
| S03 | Bẫy gai | Tránh gai | NOVA: "Gai kim loại. Không chết được, nhưng đau. Tôi kéo cậu về chỗ an toàn." (chỉ lần chạm đầu) | Qua gai | Không cần xử lý |
| S04 | Gần phòng bí mật | Khám phá (tùy chọn) | Biểu tượng "?" mờ; NOVA: "Tôi bắt được một tín hiệu yếu quanh đây... có thứ bị giấu." (một lần) | Tùy chọn | Không ép |
| S05 | Đoạn C, vào phòng khóa | Hạ hết kẻ địch | NOVA: "Cửa khóa từ. Khu này sạch kẻ địch thì nó mới mở." Hiện số còn lại | Cửa mở | Không cần xử lý |
| S06 | Lính Kén lần đầu | Bắn nạp phá khiên | NOVA: "Khiên đó chặn đạn thường. Đạn tích điện thì không." | Phá khiên | Bắn thường trúng khiên 5 lần: nhắc lại kèm biểu tượng nạp |
| S07 | Mini-boss Bramble Golem | Né sóng đất | NOVA: "Nó đập xuống là sóng đất lan ra. Nhảy qua." | Hạ mini-boss | Checkpoint CP3 ngay trước phòng |
| S08 | Cửa boss | Vào phòng boss | NOVA: "Năng lượng rất lớn sau cánh cửa này. Quan sát trước, rồi hẵng đánh." Hiện thanh máu boss | Vào phòng | Không cần xử lý |
| S09 | Thorna pha 1 | Né Gai Quạt và Dây Quất | Chữ nhỏ theo đòn đầu: "Sáng xanh: sắp bắn gai." / "Dây rung: nhảy lên bục." | Hạ pha 1 | Chết 3 lần: NOVA gợi ý đứng bục và đề nghị (không ép) độ khó Cốt truyện |
| S10 | Thorna pha 2 và 3 | Né Rễ Trồi và Hoa Nở | NOVA: "Nó đang dồn sức. Giữ nhịp né." | Hạ boss | Như S09 |
| S11 | Thorna bại | Xem thoại | Thorna: "Ngươi... không phải đến để chữa cho ta. Hãy hỏi AEGIS... ai đã ra lệnh." | Hết thoại | Bỏ qua được |
| S12 | Nhận vũ khí | Xem vũ khí mới | NOVA: "Vine Lash. Trong này còn mã của Thorna... lạ thật, tôi thấy nó quen." | Xác nhận | Không cần xử lý |
| S13 | Sau S12 | Đổi vũ khí và thử | NOVA: "`{ĐỔI_VK}` để đổi vũ khí. Vũ khí Warden ăn năng lượng riêng, xem thanh dưới thanh máu." | Đổi và bắn 1 lần | Nhắc lại ở màn Kết quả nếu chưa làm |

## 5. Giai đoạn 4 và 5: sau Stage 1 và mở dần

### 5.1 Giai đoạn 4: sau Stage 1

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| R01 | Màn Kết quả Stage 1 | Xem thưởng | NOVA: "EXP giúp lên cấp. Core Bit cứ giữ lại, sắp có chỗ tiêu." (Data Chip giới thiệu khi nhận lần đầu) | Bấm Tiếp | Không cần xử lý |
| R02 | Lên cấp | Vào Xưởng | Mira: "Cậu về với cái chân cháy xém. Vào Xưởng, tôi xem nào." Xưởng mở | Vào Xưởng | Nút Xưởng nhấp nháy |
| R03 | Xưởng, tab Kỹ năng | Học 1 kỹ năng | NOVA: "Mỗi kỹ năng tốn 1 điểm. Đặt lại lúc nào cũng được, miễn phí. Cứ thử đi." | Học 1 kỹ năng | Làm nổi một nút rẻ |
| R04 | **Sau boss 2**, Quầy Mira mở | Mua upgrade đầu tiên | Mira: "Quầy mở rồi. Cậu đủ tiền cho một nâng cấp đấy." Làm nổi một upgrade cấp 1 | Mua 1 món (có xác nhận) | Thiếu tiền: tặng 150 Core Bit một lần |
| R05 | **Sau boss 3**, Bảng Nhiệm Vụ mở | Nhận nhiệm vụ | Mira: "Giúp tôi tìm 5 hạt giống ở Verdant nhé. Tiện thể lấy luôn cái Két giáp cậu bỏ lại." (Két giáp Verdant cần Prism Beam từ boss 2) | Nhận nhiệm vụ | Không ép làm |
| R06 | **Sau boss 4**, màn Chuẩn bị của màn kế | Gán booster | NOVA: "Booster dùng một lần trong màn." Làm nổi ô booster; tặng sẵn 2 booster | Gán 1 booster | Bỏ qua được |

Mỗi bước R chỉ chạy ở lần đầu về Hub sau mốc tương ứng; nếu một lần về Hub có hai mốc (chơi liền hai màn), bước sau dời sang lần về Hub kế tiếp.

### 5.2 Giai đoạn 5: mở dần

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| D01 | Hạ boss thứ nhất | Hiểu thứ tự màn tự do | NOVA: "Từ giờ bạn chọn thứ tự màn. Mỗi boss yếu trước vũ khí của một boss khác." | Xem | Không cần xử lý |
| D02 | Lần đầu thấy Két giáp khóa | Ghi nhớ quay lại | NOVA: "Két giáp này cần vũ khí bạn chưa có. Quay lại sau." | Xem | Biểu tượng khóa trên bản đồ nhỏ |
| D03 | Vào phòng boss lần đầu khi đang có vũ khí khắc chế | Thử điểm yếu | NOVA: "Lớp vỏ của nó phản ứng lạ với dữ liệu trong Vine Lash. Thử xem." (tên vũ khí đổi theo boss) | Xem | Không cần xử lý |
| D04 | Nhận module đầu tiên (sau boss 3) | Lắp module | Mira: "Module cho khả năng phụ. Lắp được 3 ô." | Lắp 1 module | Bỏ qua được |
| D05 | Sau boss 4 | Mở Tủ skin | Mira: "Muốn đổi diện mạo? Vào Tủ skin." | Xem | Tùy chọn |
| D06 | Chết 3 lần liên tiếp ở một đoạn | Nhận gợi ý | NOVA: "Ba lần rồi. Tôi không chê đâu, chỉ gợi ý: thử vũ khí khác, hoặc bật chế độ Cốt truyện." | Chọn hoặc đóng | Tối đa 1 lần mỗi màn |
| D07 | Nhặt Nano Cell lần đầu | Hồi máu tay | NOVA: "Nano Cell hồi máu khi bạn chạm vào biểu tượng." | Dùng 1 lần | Nhắc khi máu thấp |
| D08 | Điểm chọn cốt truyện đầu tiên | Hiểu lựa chọn | NOVA: "Lần này không quay lại được đâu. Cậu chắc chứ?" (điểm chọn #1 không chọn lại được; từ điểm chọn #2 có thể chọn lại ở checkpoint truyện) | Chọn | Không cần xử lý |
| D09 | Hoàn thành một màn ở Thường lần đầu | Biết có độ khó mới | Thông báo (một lần): "Mở khóa Thử thách cho màn này: đòn mới, ít checkpoint hơn, thưởng ×1,5." | Xem | Không cần xử lý |
| D10 | Thua một boss lần đầu mà chưa dùng vũ khí khắc chế | Biết điểm yếu | NOVA: "Tôi đã phân tích trận vừa rồi. Lớp vỏ đó sợ `{tên vũ khí}`." Điểm yếu hiện ở màn Chuẩn bị từ đây | Xem | Miễn phí; thay cho việc phải mua Boss Scanner mới biết điểm yếu |

## 6. Giai đoạn 6 và 7: live-ops, quảng cáo, mua hàng và endgame

**Quy tắc quảng cáo và mua hàng trong hướng dẫn:** không có quảng cáo hay popup mua hàng ở Prologue và Stage 1; quảng cáo rewarded đầu tiên chỉ hiện sau khi hạ boss Stage 1; interstitial bật từ ngày 2; tối đa 1 popup ưu đãi mỗi phiên; luôn có nút đóng.

### 6.1 Giai đoạn 6: live-ops, quảng cáo, mua hàng

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| L01 | Ngày 2, hoặc sau boss 2 nếu vẫn ở ngày 1 | Mở bảng 7 ngày tân thủ | Mira: "Mỗi ngày có quà. Làm nhiệm vụ để mở rương." | Mở bảng | Không bắt buộc |
| L02 | Đăng nhập ngày thứ 2 | Nhận quà đăng nhập | Lịch 30 ngày, tick ngày 2 | Nhận quà | Lỡ ngày không mất chuỗi |
| L03 | Cùng mốc với L01, ở lần về Hub kế tiếp | Quay vòng quay | Mira: "Quay miễn phí mỗi ngày một lần." Tỷ lệ luôn xem được | Quay 1 lần | Không bắt buộc |
| L04 | Lần chết đầu tiên (màn thường) sau khi qua Stage 1 | Làm quen hồi sinh bằng quảng cáo | Chú thích: "Tự nguyện: xem quảng cáo để hồi sinh tại chỗ. Về checkpoint vẫn miễn phí." | Chọn một lựa chọn | Không hiện nếu chưa qua Stage 1 |
| L05 | Ngày thứ 2 trở đi và đã hạ boss 2, lần vào Hub đầu | Gói khởi đầu | Popup một lần: "Gói khởi đầu" | Mua hoặc đóng | Tối đa 1 popup mỗi phiên |
| L06 | Lần đầu thấy Quà miễn phí ở Hub | Nhận quà | Chú thích: "Quà miễn phí mỗi 4 giờ." | Nhận | Cyber+ nhận không cần xem |
| L07 | Lần đầu mở Cửa hàng hoặc Cài đặt | Biết có Cyber+ | Chỉ hiện trong màn Cửa hàng/Cài đặt, không popup | Xem | Không ép |
| L08 | Lần đầu vào Nhiệm vụ ngày | Hiểu nhiệm vụ | Mira: "Làm nhiệm vụ để đầy thanh điểm và mở rương." | Xem | Không cần xử lý |

### 6.2 Giai đoạn 7: endgame

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| E01 | Hạ AEGIS (bất kỳ kết thúc) | Vào Vùng Eclipse | NOVA: "Eclipse vẫn còn trong các khu vực cũ. Vào Vùng Eclipse." | Vào Vùng Eclipse | Nút nhấp nháy |
| E02 | Farm Run lần đầu | Chọn màn và Mức Eclipse 1 | "Mỗi mức tăng độ khó và phần thưởng." | Hoàn thành 1 lượt | Mặc định Mức 1 |
| E03 | Nhận Chip đầu tiên | Lắp Chip | NOVA: "Chip Lõi tăng chỉ số. Lắp vào ô tương ứng." | Lắp 1 Chip | Nút Lắp nhấp nháy |
| E04 | Mở tỷ lệ rơi | Xem tỷ lệ và bảo hiểm xui | Chú thích: "Tỷ lệ luôn hiển thị. Nhiều lần không ra đồ hiếm sẽ có bảo hiểm." | Xem | Không cần xử lý |
| E05 | Đủ Core Bit | Nâng cấp Chip | NOVA: "Nâng cấp không có rủi ro thất bại." | Nâng +1 | Không cần xử lý |
| E06 | Có màn đạt 3 sao | Quét (Sweep) | NOVA: "Màn đạt 3 sao có thể quét để nhận thưởng nhanh." | Quét 1 lần | Hiện số lượt còn lại |
| E07 | Nhận Mảnh vũ khí | Weapon Mastery | Mira: "Mảnh vũ khí nâng Mastery cho từng vũ khí." | Nâng 1 cấp | Tùy chọn |

## 7. Quy tắc thích ứng và chống vướng

| Tình huống | Xử lý `[PLACEHOLDER]` |
| --- | --- |
| Người chơi làm đúng trước khi gợi ý hiện | Đánh dấu bước xong, bỏ qua lời thoại |
| **Bậc gợi ý 1:** không tiến triển sau 8–10 giây | Nhấp nháy nút hoặc mũi tên chỉ hướng |
| **Bậc gợi ý 2:** thất bại 3 lần | Hiện bóng mờ minh họa thao tác và nhắc lại lời thoại bằng câu khác |
| **Bậc gợi ý 3:** thất bại 6 lần (chỉ ở Prologue và Stage 1) | Giảm độ khó khu vực: đạn chậm 20%, dây leo chậm 15%, thêm checkpoint; hiện nút "Bỏ qua bước này" |
| **Bậc gợi ý 4:** chết nhiều ở boss | Đề nghị (không ép) độ khó Cốt truyện |
| Chết ở bước hướng dẫn | Hồi sinh ngay tại bước, không quay lại đầu màn |
| Người chơi có kinh nghiệm (5 bước liền hoàn thành trước gợi ý) | Hiện đề nghị rút gọn hướng dẫn |
| Bỏ qua hướng dẫn | Nút ở F04, hoặc giữ nút Bỏ qua 1,5 giây; đưa tới checkpoint P07 và hiện màn tóm tắt điều khiển |
| Thoát app giữa chừng | Lưu bước hiện tại; quay lại ở checkpoint hoặc bước gần nhất |
| Đổi thiết bị điều khiển | Biểu tượng nút đổi ngay |
| Xem lại | Menu tạm dừng, mục Trợ giúp: liệt kê các bước đã học, bấm để xem lại minh họa |

Không có bước nào bắt buộc người chơi thua hay mua hàng; không bước nào khóa quá 10 giây.

## 8. Biểu tượng nút, văn bản, trợ năng và bản địa hóa

### 8.1 Biểu tượng nút theo thiết bị

| Mã | Bàn phím | Tay cầm | Cảm ứng |
| --- | --- | --- | --- |
| `{DI_CHUYỂN}` | A/D hoặc mũi tên | Cần trái | Cần ảo nổi |
| `{NHẢY}` | K | A | Nút Nhảy |
| `{BẮN}` | J | X | Nút Bắn |
| `{LƯỚT}` | L | B | Nút Lướt |
| `{ĐỔI_VK}` | Q / E | LB / RB | Hai nút đổi vũ khí |
| `{TẠM_DỪNG}` | Esc | Start | Nút II |
| `{TƯƠNG_TÁC}` | E | Y | Chạm vào khu |

Biểu tượng cập nhật theo thiết bị được dùng gần nhất; nếu người chơi đổi phím thì hiện phím mới.

### 8.2 Văn bản và trợ năng

- Mỗi lời thoại tối đa 2 dòng, chữ ≥ 16 sp, độ tương phản cao; chạm để hiện hết dòng.
- Telegraph không chỉ dùng màu: kèm hình dạng và âm thanh để người mù màu nhận biết.
- Tùy chọn: chữ cỡ lớn, giảm hiệu ứng nhấp nháy, giảm rung, tự bắn, giảm tốc độ game 10–30%, hộp thoại tự tiến, cảnh báo âm thanh cho đòn boss.
- Không lồng tiếng: lời thoại bằng văn bản và âm thanh biểu cảm.

### 8.3 Bản địa hóa

- Khóa chuỗi: `tut.<ID>.text` và `tut.<ID>.hint2` (ví dụ `tut.P08.text`); hai ngôn ngữ ban đầu: tiếng Việt và tiếng Anh.
- Không ghép chuỗi bằng nối câu; dùng biến `{NHẢY}`, `{BẮN}`... trong cùng một chuỗi.
- Chừa chỗ cho tiếng Anh dài hơn tiếng Việt tới khoảng 30%; kiểm tra tràn chữ ở màn hình nhỏ.

## 9. Đo lường

| Sự kiện | Tham số |
| --- | --- |
| `tutorial_step_start` | id, phase |
| `tutorial_step_complete` | id, time\_sec, attempts |
| `tutorial_step_fail` | id, count |
| `tutorial_hint_shown` | id, level (1–4) |
| `tutorial_skip` | id, scope (step, prologue) |
| `tutorial_phase_complete` | phase, total\_time\_sec |

| Báo động `[PLACEHOLDER]` | Hành động |
| --- | --- |
| Bỏ cuộc tại một bước > 3% | Xem lại thiết kế bước đó (làm dễ, thêm gợi ý) |
| Gợi ý bậc 3 hiện ở > 15% người chơi tại một bước | Làm dễ khu vực hoặc đổi cách dạy |
| Thời gian một bước > gấp 2 lần dự kiến | Rút ngắn hoặc làm rõ lời thoại |
| Hơn 15% bỏ qua hướng dẫn | Xem lại độ dài và nhịp Prologue |
| Phễu: Prologue → Hub → Stage 1 → boss Stage 1 | Tỷ lệ qua mỗi mốc ≥ 90% / 85% / 70% |

## 10. Kỹ thuật và prompt

- **TutorialManager theo dữ liệu:** các bước nằm trong `03-Data/tutorial.json` (sinh từ các bảng ở trên); không viết cứng trong mã.
- **Máy trạng thái:** mỗi bước có kích hoạt (`trigger`), yêu cầu (`require`), giao diện (`ui`), bậc gợi ý (`hints`), cờ `skipIfDone`.
- **Lưu tiến độ:** danh sách bước đã xong lưu cục bộ và đồng bộ cloud; đổi thiết bị không học lại.
- **Công tắc:** mỗi bước bật/tắt bằng Remote Config để chỉnh sau soft launch.
- **Không phụ thuộc quảng cáo/IAP:** các bước L chỉ chạy khi điều kiện ở mục 6 đúng.

Mẫu một bước:

```json
{"id":"P08","phase":1,"trigger":{"event":"enter_zone","zone":"orange_block"},
 "require":{"action":"charge_shot_hit","target":"charge_block"},
 "ui":{"speaker":"NOVA","text":"tut.P08.text","highlight":["{BẮN}"],"overlay":"charge_bar_ghost"},
 "hints":[{"afterSec":5,"overlay":"charge_bar_ghost"},{"afterFails":3,"text":"tut.P08.hint2"}],
 "skipIfDone":true}
```

**Prompt ChatGPT**

- **P-TUT-01:** "Viết TutorialManager đọc 03-Data/tutorial.json: máy trạng thái bước, sự kiện kích hoạt và yêu cầu, lưu tiến độ, bật/tắt bằng Remote Config. Có test."
- **P-TUT-02:** "Viết lớp giao diện hướng dẫn: hộp thoại NOVA/Mira, làm nổi nút, mũi tên chỉ hướng, bóng mờ minh họa, làm mờ phần không liên quan; biểu tượng nút tự đổi theo thiết bị (mục 8.1)."
- **P-TUT-03:** "Viết bộ gợi ý thích ứng theo 4 bậc ở mục 7: phát hiện làm đúng trước, đếm thất bại, giảm độ khó khu vực, nút Bỏ qua bước. Có test cho từng bậc."
- **P-TUT-04:** "Viết test tự động chạy Prologue và Stage 1 bằng đầu vào giả lập, kiểm tra mọi bước hoàn thành và sự kiện đo lường gửi đúng."

## 11. Wireframe hướng dẫn

**Đã có từ trước:** TutKeys, TutRun, TutJump, TutCharge, TutDash, TutWall (Prologue và Stage 1).

**Vẽ thêm (6 màn):**

| Màn | Bước |
| --- | --- |
| Thiết lập nhanh nút cảm ứng | F03 |
| Hub: làm nổi Menu nhanh và Cổng Chiến dịch | H02, H03 |
| Xưởng: làm nổi kỹ năng và Shop | R03, R04 |
| Thang gợi ý 4 bậc | Mục 7 |
| Menu Trợ giúp (xem lại hướng dẫn) | Mục 7 |
| Xác nhận bỏ qua hướng dẫn và tóm tắt điều khiển | F04 |
