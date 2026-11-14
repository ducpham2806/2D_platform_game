# Kịch bản hướng dẫn làm quen với game

Kịch bản hướng dẫn (tutorial/onboarding) cho người chơi mới của Cyber Vanguard: từ lần mở game đầu tiên đến endgame. Mỗi bước có mã, điều kiện kích hoạt, hành động yêu cầu, lời thoại, điều kiện hoàn thành và cách xử lý khi người chơi vướng. Prologue dùng các nhịp đã có ở tab Đặc tả Prologue & Stage 1. Mọi con số đánh dấu `[PLACEHOLDER]` cần chỉnh sau playtest.

Quy tắc biên giao diện (thứ tự hộp chữ, thời gian đọc, bỏ qua thoại, app ẩn, đổi thiết bị nhập, safe-area): xem `17-Quy-tac-bien.md` (mã `QB-70`…`QB-94`). Việc cần Story phát sinh từ rà soát 14/11/2026: mục 12.

**Nguồn lời thoại (một chỗ cho mỗi câu):**

| Bước | Nguồn lời | File này ghi |
| --- | --- | --- |
| S01–S10, S13 | `03-Data/tutorial.json` (`text`, `hints`) | Mã bước và ý của câu |
| S11, S12 (thoại sau trận Thorna, câu NOVA khi nhận vũ khí) | `03-Data/dialogue_wardens.json` (`boss.thorna.early.post`, `boss.thorna.nova_after`) | Mã khóa |
| D06 (gợi ý khi chết nhiều lần) | `03-Data/ui.json → difficultyHint` | Luật hiện |
| R05 (câu thứ hai) | `03-Data/quests.json → introCache` (đề xuất ở `15-Nhiem-vu-phu.md` mục 3.3) | Ý của ba biến thể |
| P, F, H, R, D, L, E còn lại | Bảng trong file này (bản nháp). Khi bước được thêm vào `tutorial.json` thì JSON thành nguồn, bảng ở đây chỉ còn ý | Lời đầy đủ |

Wireframe không chép lời; chỉ ghi mã bước. Bảng lỗi thời so với file này: `02-Wireframes/LOI-THOI.md`.

## 1. Nguyên tắc, mục tiêu và KPI

**Nguyên tắc** (lời thoại theo `08-Giong-nhan-vat.md`: NOVA đang hiệu chỉnh cơ thể Kai, nên mỗi bước hướng dẫn là một bước hiệu chỉnh; NOVA và Mira gọi Kai là "cậu")

1. **Học bằng làm:** mỗi bước dạy một điều, trong một tình huống an toàn; lời thoại tối đa 2 dòng (đo bằng số dòng, `QB-73`).
2. **Không khóa lâu:** cutscene và hội thoại bỏ qua được; không khóa điều khiển quá 10 giây.
3. **Thích ứng:** nếu người chơi đã làm đúng trước khi gợi ý hiện, bỏ qua bước; nếu vướng thì gợi ý rõ hơn (mục 7).
4. **Không bán hàng trong lúc học:** không quảng cáo, popup ưu đãi hay IAP ở Prologue và Stage 1; quảng cáo đầu tiên chỉ sau khi hạ boss Stage 1.
5. **Mở dần, mỗi lần về Hub tối đa 1 hệ thống mới + 1 nhịp truyện** (`QB-87`): chỉ giới thiệu hệ thống khi người chơi cần nó và có thể dùng ngay (ví dụ Shop chỉ mở khi đủ tiền mua món đầu tiên). Nhịp truyện (cảnh Vex, midpoint, bản tin Hale) không tính là hệ thống. Lịch ở mục 2.
6. **Chơi trước, cài đặt sau:** người chơi điều khiển Kai trong ≤ 15 giây kể từ lần mở đầu tiên; lần mở đầu không qua Menu chính; các màn cài đặt không cần cho việc chơi dời ra sau Prologue.
7. **Xem lại được:** mọi hướng dẫn có trong Trợ giúp (Menu tạm dừng) và Phòng Hồ Sơ.

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
| 0. Mở game lần đầu | Lần mở đầu tiên: Tải → Prologue (không qua Menu chính) | Vào chơi ngay (ngôn ngữ tự nhận theo máy) | F01, F04 | ≤ 15 giây |
| 1. Prologue | Sau giai đoạn 0 | Chạy, nhảy, bắn, bắn nạp, lướt, né telegraph | P01–P13 | 3–5 phút |
| 2. Hub đầu tiên | Sau Prologue | Cài đặt còn lại (tuổi, đồng ý quảng cáo, cỡ nút), Hub dạng menu, Cổng Chiến dịch, màn Chuẩn bị | F02, F03, H01–H04 | 1–2 phút |
| 3. Stage 1 | Sau H04 | Bám tường, dây leo, gai, phòng khóa, khiên, boss, đổi vũ khí | S01–S13 | \~10 phút |
| 4. Mở dần theo số boss | Sau boss 1, 2, 3, 4 (5 ở Alpha) | Mỗi lần về Hub một hệ thống: kỹ năng → Shop → Bảng Nhiệm Vụ → Booster và Skin → Tủ skin và Loadout | R01–R06 | 1–2 phút mỗi mốc |
| 5. Mở dần theo tình huống | Rải rác qua 8 màn | Thứ tự màn, điểm yếu, Két giáp, module, Nano Cell, gợi ý khi chết nhiều | D01–D10 | Theo tình huống |
| 6. Live-ops, quảng cáo, mua hàng | Từ ngày 2 và sau boss 2 | 7 ngày tân thủ, đăng nhập, vòng quay, quà, hồi sinh bằng quảng cáo, Starter Pack | L01–L08 | Theo tình huống |
| 7. Endgame | Sau khi hạ AEGIS | Vùng Eclipse, Farm, Chip Lõi, tỷ lệ rơi, nâng cấp, Sweep, Mastery | E01–E07 | \~10 phút |

Từ lần mở thứ hai: Tải → Menu chính (Tiếp tục) → Hub.

**Tính năng mở dần**

| Tính năng | Mở khi | Giới thiệu qua |
| --- | --- | --- |
| Chạy, nhảy, bắn | Ngay từ Prologue | P01–P05 |
| Bắn nạp, lướt | Giữa Prologue | P08, P09 |
| Bám tường | Stage 1 đoạn A | S01 |
| Đổi vũ khí, năng lượng vũ khí | Sau Thorna | S12, S13 |
| **Sau boss 1:** Xưởng (tab Kỹ năng), chọn thứ tự màn | Kết quả Stage 1 | R01–R03, D01 |
| **Sau boss 2:** Shop (quầy Upgrade), dùng vũ khí khắc chế | Thường \~525 Core Bit, Cốt truyện \~262; món rẻ nhất 200 (Magnet Range) | R04, D03 |
| **Sau boss 3:** Bảng Nhiệm Vụ | Nhiệm vụ của 3 màn đã qua hiện cùng lúc; nhiệm vụ màn 1 thưởng module đầu tiên. Nhịp truyện: cảnh Vex ở Hub | R05 |
| Xưởng (tab Module) | Khi nhận module đầu tiên (thưởng nhiệm vụ phụ), sớm nhất ở lần về Hub sau khi xong một nhiệm vụ | D04 |
| **Sau boss 4 (Alpha):** Quầy Mira thêm tab Booster và Skin; ô booster ở màn Chuẩn bị | Tính là một hệ thống (hai tab của cùng một quầy). Nhịp truyện: midpoint và Điểm chọn #1 | R06 |
| **Sau boss 5 (Alpha):** Xưởng (tab Tủ skin, Loadout) | Trước đó skin mua ở Quầy mặc bằng nút "Mặc ngay". Nhịp truyện: bản tin Hale | D05 |
| Giáp (tab Giáp), Nano Cell | Khi nhận lần đầu | D02, D07 |
| Đăng nhập, vòng quay, 7 ngày tân thủ, quà 4 giờ | Từ ngày 2, hoặc sau boss 2 nếu chơi tiếp trong ngày 1 | L01–L03, L06 |
| Quảng cáo rewarded, Starter Pack | Rewarded sau boss 1; Starter Pack từ ngày 2 và sau boss 2 | L04, L05 |
| Vùng Eclipse, Chip Lõi | Sau AEGIS | E01–E07 |

Lý do: trước đây khoảng 12 hệ thống (EXP, Core Bit, Data Chip, Xưởng, SP, Shop, nhiệm vụ, booster, 7 ngày, vòng quay, quà, thứ tự màn) dồn vào 5 phút sau Stage 1. Mỗi lần về Hub giờ chỉ có 1 hệ thống mới và tối đa 1 nhịp truyện, và người chơi luôn dùng được ngay thứ vừa mở. Bản MVP dừng ở boss 4, nên mốc sau boss 4 và 5 thuộc Alpha.

## 3. Giai đoạn 0 và 1: mở game lần đầu và Prologue

Biểu tượng nút (`{NHẢY}`, `{BẮN}`, `{LƯỚT}`, `{DI_CHUYỂN}`, `{ĐỔI_VK}`) tự đổi theo thiết bị đang dùng (mục 8).

### 3.1 Giai đoạn 0: mở game lần đầu

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| F01 | Lần mở đầu tiên, ngay sau màn Tải | Không cần làm gì | Ngôn ngữ tự nhận theo máy (Tiếng Việt nếu máy dùng tiếng Việt, còn lại English); chỉ hỏi khi máy dùng ngôn ngữ khác hai thứ tiếng này. Đổi lại được ở Cài đặt (`14-Cai-dat-Tiep-can.md` mục 3.5). Không hiện Menu chính | Tự động | Không cần xử lý |
| F02 | **Sau Prologue**, trước khi vào Hub | Xác nhận tuổi 13+ và đồng ý quảng cáo | Màn tuổi và đồng ý quảng cáo | Hoàn thành | Dưới 13 tuổi: dừng, giải thích |
| F03 | Thiết bị cảm ứng, **sau F02** | Chọn cỡ nút (nhỏ/vừa/lớn) và tay thuận | "Chọn cỡ nút cho vừa tay" kèm xem trước; trong Prologue dùng cỡ vừa mặc định. Đây là bước "thử bố cục nút trước khi bắt đầu" của GDD mục 12: trước Stage 1, không trước Prologue | Xác nhận hoặc "Dùng mặc định" | Bỏ qua được; chỉnh lại ở Cài đặt |
| F04 | Bắt đầu Prologue (ngay sau F01) | (Tùy chọn) bỏ qua phần hướng dẫn | Nút chữ "Tôi đã biết chơi, bỏ qua hướng dẫn" hiện sau 10 giây; ≥ 48 dp, đặt xa cụm nút bắn (`QB-81`) | Bấm hoặc không | Bỏ qua: tắt hướng dẫn, mở khóa mọi nút, nhảy tới checkpoint P07, Prologue chạy tiếp từ đó; thoại truyện (P12) vẫn giữ |

**Ràng buộc khi dời F02:** Prologue chạy không cần mạng; trước F02 không khởi tạo SDK quảng cáo và không gửi dữ liệu phân tích có định danh. Sự kiện đo lường của Prologue lưu cục bộ, gửi đi sau khi người chơi đồng ý. Cần tư vấn pháp lý xác nhận cách làm này với từng thị trường soft launch `[PLACEHOLDER]`.

### 3.2 Giai đoạn 1: Prologue (bám các nhịp trong tab Đặc tả Prologue & Stage 1)

Lời ở bảng này là bản nháp, chốt sau cổng Prototype (P01–P13 thêm vào `tutorial.json` khi có bản đồ Prologue). P01–P09 không mất máu; kẻ địch gây sát thương thật từ P10.

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| P01 | 0:00 Kai tỉnh dậy | Chạy sang phải | NOVA: "Khởi động lại... xong. Kai, nghe rõ không? Tôi là NOVA. Chân cậu có điện rồi, đi về phía cửa." Biểu tượng `{DI_CHUYỂN}` nhấp nháy | Đi 8 ô | Đứng yên 8 giây: mũi tên chỉ hướng và nhắc "Cửa ở phía trước. Chân cậu chạy được rồi: `{DI_CHUYỂN}`." |
| P02 | 0:20 Khe sàn | Nhảy qua khe 2 ô | NOVA: "Khe hở. Thử bật lên xem: `{NHẢY}`." | Qua khe | Rơi 3 lần: "Bật lên ngay ở mép khe. Sớm quá là rơi đấy."; khe không gây chết |
| P03 | Bục thấp và cao | Nhảy cao hơn bằng giữ nút | NOVA: "Lực bật đang ở mức thấp. Giữ `{NHẢY}` lâu hơn để dồn lực." | Lên bục 3,5 ô | Thất bại 3 lần: hiện bóng mờ minh họa giữ nút |
| P04 | 0:45 Thùng phế liệu | Bắn | NOVA: "Pháo tay còn nguội. Bắn thử vào thùng kia: `{BẮN}`." | Phá thùng | Sau 6 giây: nhấp nháy nút `{BẮN}` |
| P05 | 1:10 Drone đầu tiên | Hạ Drone | NOVA: "Drone tuần tra. Bộ ngắm của nó hỏng rồi, không bắn trúng được đâu. Hạ nó đi." Drone chưa gây sát thương | Hạ Drone | Sau 10 giây: Drone tự lùi lại gần hơn |
| P06 | 1:50 Drone bay | Nhảy và bắn lên cao | NOVA: "Hai cái trên cao. Nhảy lên rồi bắn." | Hạ 2 Drone bay | Nhắc lại sau 3 lần trượt |
| P07 | Checkpoint 1 | Đi qua checkpoint | Cờ sáng. NOVA: "Tôi vừa lưu trạng thái của cậu ở đây. Có chuyện gì thì cậu tỉnh lại từ chỗ này." | Chạm checkpoint | Không cần xử lý |
| P08 | 2:20 Khối chắn cam | Bắn nạp | NOVA: "Khối này dày quá. Giữ `{BẮN}` cho Arc tích điện, rồi thả." Hiện thanh nạp | Phá khối | Sau 5 giây: hiện thanh nạp minh họa |
| P09 | 2:50 Hành lang đạn huấn luyện | Lướt qua khe đạn | NOVA: "Hành lang huấn luyện cũ, đạn tập không làm đau. Thử `{LƯỚT}` xuyên qua khe." Mở khóa nút lướt. Đạn huấn luyện chỉ đẩy lùi, **chưa gây sát thương** | Qua hành lang | Thất bại 3 lần: bóng mờ minh họa lướt và nhắc "Đạn tập bay theo nhịp. Đếm nhịp, rồi `{LƯỚT}` đúng lúc khe mở."; thất bại 6 lần: làm chậm đạn 20% (bậc 3, mục 7) |
| P10 | 3:05 Tháp pháo tập sự, sau một đoạn nghỉ ngắn | Né theo telegraph (dùng lướt vừa học) | NOVA: "Cái tháp này bắn thật đấy. Nó sáng lên trước khi khai hỏa, thấy sáng là né." Từ đây kẻ địch gây sát thương thật | Né 3 phát liên tiếp | Chết: về checkpoint P07, gợi ý "Quan sát ánh sáng báo trước" |
| P11 | Vật phẩm hồi máu | Nhặt | NOVA: "Gói sửa chữa màu xanh. Nhặt đi, cậu đang rò điện kìa." | Nhặt vật phẩm | Vật phẩm xuất hiện sau khi người chơi mất máu lần đầu |
| P12 | 3:20 Tiền sảnh | Xem cảnh Vex | Vex: "Unit-K... vậy là chúng vẫn chọn mày." Kai: "Ai vậy?" NOVA (ngập ngừng): "Tôi... không có dữ liệu về người này." | Xem hoặc "Bỏ qua" | Cảnh tối đa 8 giây, bỏ qua được |
| P13 | 3:50 Thoát ra | Ra khỏi phòng thí nghiệm | Tiêu đề màn; sau đó F02, F03 rồi vào Hub Arkon | Qua cửa | Không cần xử lý |

## 4. Giai đoạn 2 và 3: Hub lần đầu và Stage 1

### 4.1 Giai đoạn 2: Hub lần đầu (Hub dạng menu, bản MVP)

Bản MVP không có Hub đi bộ: Hub là một menu (đặc tả Hub mục 2, "Bản MVP: Hub dạng menu"). Mục chưa mở hiện mờ kèm điều kiện theo lời người chơi, ví dụ "Xưởng (sau boss 1)" (`QB-132`). Hộp thoại của Mira và NOVA hiện ở menu, không khóa điều khiển.

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| H01 | Vào Hub lần đầu (sau F02, F03) | Đọc lời chào | Mira: "Đừng đứng ngẩn ra đó. Tôi là Mira. Cái trạm đổ nát này là Arkon, từ giờ là nhà của cậu." | Hết thoại | Bỏ qua được |
| H02 | Sau H01 | Chọn Cổng Chiến dịch | Làm nổi mục Cổng Chiến dịch; các mục khác mờ kèm mốc mở. Mira: "Muốn ra ngoài thì qua Cổng Chiến dịch. Mấy cửa kia tôi còn đang sửa." | Chọn Cổng Chiến dịch | Sau 10 giây mục Cổng Chiến dịch nhấp nháy |
| H03 | Mở Cổng Chiến dịch lần đầu | Chọn Stage 1 | Danh sách 4 màn của MVP, chỉ Stage 1 mở; ba màn kia khóa "Mở khi hạ boss Stage 1". NOVA: "Tín hiệu Eclipse mạnh nhất ở Verdant Gardens. Bắt đầu từ đó." | Chọn Stage 1 | Chỉ có một lựa chọn |
| H04 | Màn Chuẩn bị Stage 1 lần đầu | Bắt đầu màn | Ba thẻ độ khó, con trỏ ở nút Bắt đầu (`11-Do-kho.md` mục 2.1). NOVA: "Trước khi ra ngoài, tôi chỉnh mức chịu đòn của cậu. Lần đầu cứ để Thường." | Bấm Bắt đầu | Các phần khác làm mờ |

**Bản Alpha (Hub đi bộ):** H02 thành bước mở Menu nhanh. Mira chỉ vào nút Menu: "Trạm rộng lắm, nhưng cậu không cần đi bộ đâu. Mở menu là tới đâu cũng được." Phím tắt ở mục 2 đặc tả Hub.

### 4.2 Giai đoạn 3: Stage 1

Lời của S01–S10 và S13 ở `03-Data/tutorial.json`; bảng dưới chỉ ghi ý. Viết lại lời thì sửa JSON (≤ 2 dòng, `maxTextChars` 120), không sửa ở đây.

| ID | Kích hoạt | Người chơi làm | Ý lời thoại và hiển thị | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| S01 | Đoạn A, giếng cao | Bám tường và leo | Lớp bám ở lòng bàn tay còn chạy; nhảy vào tường để bám, `{NHẢY}` tiếp để leo | Lên đỉnh giếng | Sau 10 giây: nhắc cách bật sang bức đối diện; thất bại 3 lần: câu gợi ý khác, mũi tên trên tường và bóng mờ |
| S02 | Đoạn B, dây leo đu | Nhảy lên dây | Dây đang lắc, đợi nó lại gần bờ | Qua đoạn dây | Rơi 3 lần: câu gợi ý khác (bậc 2); rơi 6 lần: dây chậm lại 15% (bậc 3, mục 7) |
| S03 | Bẫy gai | Tránh gai | Gai không giết, nhưng đau; NOVA kéo Kai về chỗ an toàn (chỉ lần chạm đầu) | Qua gai | Không cần xử lý |
| S04 | Gần phòng bí mật | Khám phá (tùy chọn) | Biểu tượng "?" mờ; NOVA bắt được tín hiệu yếu, có thứ bị giấu (một lần) | Tùy chọn | Không ép |
| S05 | Đoạn C, vào phòng khóa | Hạ hết kẻ địch | Cửa khóa từ, sạch kẻ địch mới mở; hiện số còn lại | Cửa mở | Không cần xử lý |
| S06 | Lính Kén lần đầu | Bắn nạp phá khiên | Khiên chặn đạn thường; giữ `{BẮN}` để tích điện, hoặc bắn sau lưng | Phá khiên | Bắn thường trúng khiên 5 lần: nhắc lại kèm biểu tượng nạp |
| S07 | Mini-boss Bramble Golem | Né sóng đất | Nó đập xuống là sóng đất lan ra, nhảy qua | Hạ mini-boss | Chết 3 lần: nhắc dấu hiệu sắp giậm đất. Checkpoint CP3 ngay trước phòng |
| S08 | Cửa đấu trường boss đóng (sau thoại trước trận) | Vào trận | Cửa đã khóa sau lưng; năng lượng đo được rất lớn; quan sát trước rồi hẵng đánh. Hiện 6 giây (`showSec`). Hiện thanh máu boss | Hết giờ hiện | Không cần xử lý |
| S09 | Thorna pha 1 | Né Gai Quạt và Dây Quất | Chữ ngắn theo đòn đầu: dấu hiệu của gai và của dây | Hạ pha 1 | Chết 3 lần: gợi ý chết D06 hiện trước (`QB-70`), sau đó hộp hướng dẫn hiện câu gợi ý bậc 2 (đứng bục) |
| S10 | Thorna pha 2 và 3 | Né Rễ Trồi và Hoa Nở | Nó đang dồn sức, giữ nhịp né | Hạ boss | Như S09 |
| S11 | Thorna bại | Xem thoại | `boss.thorna.early.post` (`dialogue_wardens.json`) | Hết thoại | Bỏ qua được |
| S12 | Nhận vũ khí | Xem vũ khí mới | `boss.thorna.nova_after` (`dialogue_wardens.json`) | Xác nhận | Không cần xử lý |
| S13 | Sau S12 | Đổi vũ khí và thử | Vine Lash đã nạp và ăn năng lượng riêng; cầm nó bằng `{ĐỔI_VK}`, rồi `{BẮN}` thử | Đổi và bắn 1 lần | Sau 8 giây: chỉ thanh năng lượng dưới thanh máu. Nhắc lại ở màn Kết quả nếu chưa làm |

## 5. Giai đoạn 4 và 5: sau Stage 1 và mở dần

### 5.1 Giai đoạn 4: sau Stage 1

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| R01 | Màn Kết quả Stage 1 | Xem thưởng | NOVA: "EXP giúp lên cấp. Core Bit cứ giữ lại, sắp có chỗ tiêu." (Data Chip giới thiệu khi nhận lần đầu) | Bấm Tiếp | Không cần xử lý |
| R02 | Lên cấp | Vào Xưởng | Mira: "Cậu về với cái chân cháy xém. Vào Xưởng, tôi xem nào." Xưởng mở | Vào Xưởng | Nút Xưởng nhấp nháy |
| R03 | Xưởng, tab Kỹ năng | Học 1 kỹ năng | NOVA: "Mỗi lần học tốn 1 điểm. Đặt lại lúc nào cũng được, miễn phí. Cứ thử đi." | Học 1 bậc kỹ năng | Làm nổi một nút rẻ |
| R04 | **Sau boss 2**, Quầy Mira mở | Mua upgrade đầu tiên | Mira: "Quầy mở rồi. Cậu đủ tiền cho một nâng cấp đấy. Đừng mua cái màu hồng." Làm nổi **món rẻ nhất mua được** (dữ liệu hiện tại: Magnet Range 200; Cốt truyện có \~262 Core Bit sau 2 boss) (`QB-86`) | Mua 1 món (có xác nhận) | Không đủ cho món rẻ nhất: tặng 150 Core Bit một lần, trước câu thoại |
| R05 | **Sau boss 3**, lần đầu mở Bảng Nhiệm Vụ | Nhận nhiệm vụ | Mira: "Được rồi, có việc cho cậu. Việc lặt vặt, nhưng tôi trả công." Câu thứ hai theo Két giáp Verdant (`introCache`, `QB-86`): đã có Prism Beam mà chưa lấy Két ("Tiện thể lấy luôn cái Két giáp cậu bỏ lại"); chưa có Prism Beam ("đợi có Prism Beam đã"); đã lấy Két (chỉ "Bắt đầu từ Verdant") | Nhận nhiệm vụ | Không ép làm |
| R06 | **Sau boss 4 (Alpha)**, màn Chuẩn bị của màn kế | Gán booster | NOVA: "Booster dùng một lần trong màn." Làm nổi ô booster; tặng sẵn 2 booster | Gán 1 booster | Bỏ qua được |

Mỗi bước R chỉ chạy ở lần đầu về Hub sau mốc tương ứng; nếu một lần về Hub có hai mốc (chơi liền hai màn), bước sau dời sang lần về Hub kế tiếp (`QB-87`). Câu NOVA của từng nhiệm vụ phụ trong màn: `15-Nhiem-vu-phu.md` mục 6.5.

### 5.2 Giai đoạn 5: mở dần

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| D01 | Hạ boss thứ nhất | Hiểu thứ tự màn tự do | NOVA: "Từ giờ cậu chọn đi đâu trước. Mỗi Warden sợ mã của một Warden khác." | Xem | Không cần xử lý |
| D02 | Lần đầu thấy Két giáp khóa | Ghi nhớ quay lại | NOVA: "Két này khóa bằng mã Warden mà cậu chưa có. Tôi ghi lại chỗ này rồi." | Xem | Biểu tượng khóa ngay trên két (MVP chưa có bản đồ nhỏ); có Đầu Mk I thì radar hiện mũi tên "cần [vũ khí X]" |
| D03 | Vào phòng boss lần đầu khi đang có vũ khí khắc chế | Thử điểm yếu | NOVA: "Lớp vỏ của nó phản ứng lạ với dữ liệu trong Vine Lash. Thử xem." (tên vũ khí đổi theo boss) | Xem | Không cần xử lý |
| D04 | Nhận thưởng nhiệm vụ phụ đầu tiên (module đầu tiên); tab Module mở cùng lúc | Lắp module | Mira: "Có module rồi đấy. Lõi cậu còn ba khe trống, lắp vào đi. Quá tải là tôi gỡ ra." | Lắp 1 module | Bỏ qua được |
| D05 | Sau boss 5 (Alpha) | Mở Tủ skin | Mira: "Tủ đồ của trạm sửa xong rồi. Thay vỏ thì tùy cậu, đừng đụng vào khớp của tôi." | Xem | Tùy chọn |
| D06 | Chết 3 lần liên tiếp ở một đoạn | Nhận gợi ý | Lời ở `ui.json → difficultyHint` (luật dưới bảng) | Tự tắt | Tối đa 1 lần mỗi lượt vào màn |
| D07 | Nhặt Nano Cell lần đầu | Hồi máu chủ động | NOVA: "Nano Cell nạp đầy. Rò điện nặng thì `{HỒI_MÁU}`, tôi vá cho cậu ngay." Làm nổi biểu tượng Nano Cell dưới thanh máu | Dùng 1 lần | Nhắc khi máu thấp |
| D08 | Điểm chọn cốt truyện đầu tiên | Hiểu lựa chọn | NOVA: "Lần này không quay lại được đâu. Cậu chắc chứ?" (điểm chọn #1 không chọn lại được; từ điểm chọn #2 có thể chọn lại ở checkpoint truyện) | Chọn | Không cần xử lý |
| D09 | Hoàn thành một màn ở Thường lần đầu | Biết có độ khó mới | Thông báo (một lần): "Mở khóa Thử thách cho màn này: đòn mới, ít checkpoint hơn, thưởng ×1,5." | Xem | Không cần xử lý |
| D10 | Kai chết lần đầu trong đấu trường một boss, mà trong trận chưa trúng boss bằng vũ khí khắc chế | Biết điểm yếu | Hộp gợi ý chết (như D06). NOVA: "Tôi đã phân tích trận vừa rồi. Lớp vỏ đó sợ `{tên vũ khí}`." Bật cờ `weaknessKnown[boss]` (luật dưới bảng) | Tự tắt | Miễn phí; thay cho việc phải mua Boss Scanner mới biết điểm yếu |

**Luật hộp gợi ý chết (D06, D10; `QB-70`…`QB-72`, `QB-82`):**

- Hộp không chặn, không có nút, không dừng trận. Kai tự hồi sinh sau 1 giây như thường; không có màn hồi sinh có nút "Thử lại" hay "Đổi độ khó" (độ khó chỉ đổi ở màn Chuẩn bị, `11-Do-kho.md` mục 2.2).
- Gợi ý chết được ưu tiên hơn hộp hướng dẫn: hướng dẫn tạm ẩn trong lúc gợi ý hiện, rồi hiện lại. Hội thoại và màn Kết quả được ưu tiên hơn gợi ý chết.
- Câu đang chờ bị hủy khi hạ boss hoặc khi qua checkpoint.
- D06 chọn câu theo độ khó đang chơi. Ở Cốt truyện khi Xưởng còn khóa dùng câu `story_early` (không nhắc Xưởng hay Quầy).
- D06 thêm câu vũ khí (`difficultyHint.weapon`) khi đang ở đấu trường boss, `weaknessKnown[boss]` đã bật, đã có vũ khí khắc chế mà lúc chết không cầm nó. Câu ghép với tên vũ khí dài nhất ≤ 140 ký tự (kiểm lúc nạp dữ liệu).
- Thời gian hiện = max(`showSec`, số ký tự / `charsPerSecRead`), với `showSec` 6 và `charsPerSecRead` 15.
- Tắt hướng dẫn ở menu tạm dừng thì không hiện. Sau khi D06 hiện, menu tạm dừng có thêm mục "Đổi độ khó" (`QB-84`).

**Cờ `weaknessKnown[boss]` (`QB-83`, cần Story):** một cờ cho mỗi boss, lưu trong bản lưu. Bật khi D10 chạy (lần chết đầu trong đấu trường boss đó), hoặc khi hạ boss đó (Hồ sơ boss mở). Màn Chuẩn bị (ô "vũ khí khắc chế") và câu vũ khí của D06 chỉ đọc cờ này. D10 không chạy ở Stage 1: Thorna luôn là boss đầu, người chơi chưa thể có vũ khí khắc chế (Ember Burst), và S09/D06 đã lo phần gợi ý.

## 6. Giai đoạn 6 và 7: live-ops, quảng cáo, mua hàng và endgame

**Quy tắc quảng cáo và mua hàng trong hướng dẫn:** không có quảng cáo hay popup mua hàng ở Prologue và Stage 1; quảng cáo rewarded đầu tiên chỉ hiện sau khi hạ boss Stage 1; interstitial bật từ ngày 2; tối đa 1 popup ưu đãi mỗi phiên, không hiện trong màn chơi; đếm ngược chỉ khi hạn là thật; luôn có nút đóng.

### 6.1 Giai đoạn 6: live-ops, quảng cáo, mua hàng

| ID | Kích hoạt | Người chơi làm | Hiển thị và lời thoại | Hoàn thành khi | Nếu vướng |
| --- | --- | --- | --- | --- | --- |
| L01 | Ngày 2, hoặc sau boss 2 nếu vẫn ở ngày 1 | Mở bảng 7 ngày tân thủ | Mira: "Trạm nhận hàng tiếp tế mỗi ngày. Làm vài việc vặt là tôi mở rương cho cậu." | Mở bảng | Không bắt buộc |
| L02 | Đăng nhập ngày thứ 2 | Nhận quà đăng nhập | Lịch 30 ngày, tick ngày 2 | Nhận quà | Lỡ ngày không mất chuỗi |
| L03 | Cùng mốc với L01, ở lần về Hub kế tiếp | Quay vòng quay | Mira: "Con Xúc Xắc, máy quay số tôi nhặt ở chợ trời, cho quay miễn phí mỗi ngày một lần. Tỷ lệ dán ngay bên cạnh." Tỷ lệ luôn xem được | Quay 1 lần | Không bắt buộc |
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
| E03 | Nhận Chip đầu tiên | Lắp Chip | NOVA: "Chip Lõi còn ấm. Lắp vào khe cùng loại, tôi tính lại chỉ số cho cậu." | Lắp 1 Chip | Nút Lắp nhấp nháy |
| E04 | Mở tỷ lệ rơi | Xem tỷ lệ và bảo hiểm xui | Chú thích: "Tỷ lệ luôn hiển thị. Nhiều lần không ra đồ hiếm sẽ có bảo hiểm." | Xem | Không cần xử lý |
| E05 | Đủ Core Bit | Nâng cấp Chip | NOVA: "Nâng Chip không bao giờ thất bại. Tôi kiểm rồi, kiểm hai lần." | Nâng +1 | Không cần xử lý |
| E06 | Có màn đạt 3 sao | Quét (Sweep) | NOVA: "Màn đạt 3 sao có thể quét để nhận thưởng nhanh." | Quét 1 lần | Hiện số lượt còn lại |
| E07 | Nhận Mảnh vũ khí | Weapon Mastery | Mira: "Mảnh vũ khí nâng Mastery cho từng vũ khí." | Nâng 1 cấp | Tùy chọn |

## 7. Quy tắc thích ứng và chống vướng

| Tình huống | Xử lý `[PLACEHOLDER]` |
| --- | --- |
| Người chơi làm đúng trước khi gợi ý hiện | Đánh dấu bước xong, bỏ qua lời thoại |
| **Bậc gợi ý 1:** không tiến triển sau 8–10 giây | Nhấp nháy nút hoặc mũi tên chỉ hướng |
| **Bậc gợi ý 2:** thất bại 3 lần | Hiện bóng mờ minh họa thao tác và nhắc lại lời thoại bằng câu khác |
| **Bậc gợi ý 3:** thất bại 6 lần (chỉ ở Prologue và Stage 1) | Giảm độ khó khu vực: đạn chậm 20%, dây leo chậm 15%, thêm checkpoint; hiện nút "Bỏ qua bước này" |
| **Bậc gợi ý 4:** chết 3 lần liên tiếp | Gợi ý chết D06: đề nghị (không ép) độ khó dễ hơn hoặc vũ khí khắc chế (mục 5.2) |
| Gợi ý chết và hộp hướng dẫn cùng muốn hiện | Gợi ý chết hiện trước, hướng dẫn tạm ẩn rồi hiện lại (`QB-70`) |
| Chết ở bước hướng dẫn | Hồi sinh ngay tại bước, không quay lại đầu màn |
| Người chơi có kinh nghiệm (5 bước liền hoàn thành trước gợi ý) | Hiện đề nghị rút gọn hướng dẫn |
| Bỏ qua hướng dẫn | Nút ở F04, hoặc giữ nút Bỏ qua 1,5 giây; đưa tới checkpoint P07 và hiện màn tóm tắt điều khiển (`QB-81`) |
| Thoát app giữa chừng | Lưu bước hiện tại; quay lại ở checkpoint hoặc bước gần nhất. App ẩn hoặc mất tay cầm thì tự mở menu tạm dừng (`QB-90`) |
| Đổi thiết bị điều khiển | Biểu tượng nút đổi ngay (`QB-91`) |
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
| `{TƯƠNG_TÁC}` | W / ↑ (E dành cho đổi vũ khí, GDD 5.2) | Y | Chạm vào khu |
| `{HỒI_MÁU}` (cần Story: chưa có trong `glyphs.ts`) | H | RT | Chạm biểu tượng Nano Cell (GDD 5.3) |

Biểu tượng cập nhật theo thiết bị được dùng gần nhất; nếu người chơi đổi phím thì hiện phím mới. Tay cầm PlayStation dùng ✕○□△ (`QB-91`).

### 8.2 Văn bản và trợ năng

- Mỗi lời thoại tối đa 2 dòng, đo bằng số dòng theo phông thật sau khi thay mã nút, ở thiết bị có tên nút dài nhất (cảm ứng) (`QB-73`). Chữ ≥ 16 sp, độ tương phản cao; chạm để hiện hết dòng.
- Telegraph và câu gợi ý không chỉ dùng màu: câu nhắc màu phải kèm hình dạng, tư thế hoặc âm thanh (`QB-85`).
- Tùy chọn: chữ cỡ lớn, giảm hiệu ứng nhấp nháy, giảm rung, tự bắn, giảm tốc độ game 10–30%, hộp thoại tự tiến, cảnh báo âm thanh cho đòn boss.
- Không lồng tiếng: lời thoại bằng văn bản và âm thanh biểu cảm.

### 8.3 Bản địa hóa

- Khóa chuỗi: `tut.<ID>.text` và `tut.<ID>.hint2` (ví dụ `tut.P08.text`); hai ngôn ngữ ban đầu: tiếng Việt và tiếng Anh. Hiện `tutorial.json` còn ghi thẳng câu tiếng Việt; chuyển sang khóa khi có module bản địa hóa (mục 12).
- Không ghép chuỗi bằng nối câu; dùng biến `{NHẢY}`, `{BẮN}`... trong cùng một chuỗi.
- Tiếng Anh dài hơn tiếng Việt tới 30%: giới hạn bản en = 1,3 × giới hạn bản vi; kiểm tra tràn chữ ở màn hình nhỏ bằng số dòng.

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

- **TutorialManager theo dữ liệu:** các bước nằm trong `03-Data/tutorial.json`, là nguồn lời của các bước đã có; bảng ở trên ghi mã bước và ý. Không viết cứng trong mã.
- **Máy trạng thái:** mỗi bước có kích hoạt (`trigger`), yêu cầu (`require`), giao diện (`ui`), bậc gợi ý (`hints`), cờ `skipIfDone`.
- **Lưu tiến độ:** danh sách bước đã xong lưu cục bộ và đồng bộ cloud; đổi thiết bị không học lại.
- **Công tắc:** mỗi bước bật/tắt bằng Remote Config để chỉnh sau soft launch.
- **Không phụ thuộc quảng cáo/IAP:** các bước L chỉ chạy khi điều kiện ở mục 6 đúng.

Mẫu một bước (dạng đích khi có module bản địa hóa; hiện `text` là chuỗi tiếng Việt):

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

**Đã có từ trước:** TutKeys, TutRun, TutJump, TutCharge, TutDash, TutWall (Prologue và Stage 1). Lời NOVA trên các bảng này là bản cũ; nguồn lời là mục "Nguồn lời thoại" ở đầu file. TutDash gộp P09 và P10, cần tách hai bảng. Chi tiết: `02-Wireframes/LOI-THOI.md`.

**Đã vẽ thêm từ GDD 0.6:** HubEarly (Hub sau Stage 1, khu chưa mở có mốc mở), UnlockFlow (lịch mở dần), NovaWeakness (bước D10). Respawn và NovaWeakness lỗi thời: D06 và D10 là hộp không chặn, không có nút (mục 5.2).

**Vẽ thêm (8 màn):**

| Màn | Bước |
| --- | --- |
| Thiết lập nhanh nút cảm ứng | F03 |
| Xác nhận bỏ qua hướng dẫn và tóm tắt điều khiển | F04 |
| Hub dạng menu (MVP): mục khóa có mốc mở, làm nổi Cổng Chiến dịch | H01–H03 |
| Cổng Chiến dịch bản 4 màn và màn Chuẩn bị bản MVP | H03, H04 |
| Xưởng và Quầy: làm nổi kỹ năng và món rẻ nhất | R03, R04 |
| Thang gợi ý 4 bậc, kèm hộp gợi ý chết không chặn | Mục 7, D06, D10 |
| Menu tạm dừng có mục Trợ giúp (xem lại hướng dẫn) và "Đổi độ khó" sau gợi ý | Mục 7, `QB-84` |
| Màn Cài đặt chung (Ngôn ngữ, bật/tắt hướng dẫn) | F01, `14-Cai-dat-Tiep-can.md` |

## 12. Việc cần Story (rà soát 14/11/2026)

Các yêu cầu dưới đây chưa có trong code hoặc dữ liệu. Đưa vào EP-14 (Hub, Cài đặt) và module bản địa hóa. Mọi số là `[PLACEHOLDER]`.

| Mã rà soát | Yêu cầu | Số cụ thể | Luật |
| --- | --- | --- | --- |
| C05 | Cờ `weaknessKnown[boss]` trong bản lưu; màn Chuẩn bị và câu vũ khí của D06 đọc cờ; D10 hiện ở hộp gợi ý chết | Bật ở lần chết đầu trong đấu trường hoặc khi hạ boss; không chạy ở Stage 1 | `QB-83` |
| L03 | Hub dạng menu: Cổng Chiến dịch mở danh sách màn MVP rồi màn Chuẩn bị Stage 1 (hiện dẫn vào màn xám); thoát và chọn được bằng chạm, tay cầm, không chỉ phím Esc; chạy H01–H04 | 4 màn; từ Hub vào chơi ≤ 2 chạm sau màn Chuẩn bị | Đặc tả Hub mục 2 |
| N01 | Chữ vẽ trong canvas ≥ 11 px logic (≈ 16 dp trên Pixel 7), hoặc chuyển hộp hướng dẫn, hộp hội thoại, menu tạm dừng, màn Kết quả sang lớp HTML (ADR-001). Mọi nút ≥ 48 dp; menu tạm dừng chia 2 cột và ẩn mục "chưa có" | Hiện chữ 8–9 px (12–14 dp), nút 27–35 dp | `QB-74` |
| N02 | Kiểm tra lúc nạp theo **số dòng** (≤ 2 dòng ở hộp hướng dẫn, đo theo phông thật sau khi thay mã nút, ở thiết bị có tên nút dài nhất) thay cho `maxTextChars` 120 | 120 ký tự + "NOVA: " đã ra 3 dòng trong hộp 196 px | `QB-73` |
| N03 | Lớp nút cảm ứng, bảng HTML và lề HUD cộng `env(safe-area-inset-*)` | Nút II neo 32 dp, cần ảo cố định 90 dp tính từ mép an toàn | `QB-92` |
| T01 | Module bản địa hóa: `03-Data/strings.vi.json`, `strings.en.json`; khóa `tut.<ID>.text`; mã nút ASCII (`{JUMP}`, `{SHOOT}`, `{DASH}`, `{MOVE}`, `{SWAP}`, `{PAUSE}`, `{INTERACT}`, `{HEAL}`) thay mã có dấu; chuỗi trong `ui.json`, `controls.json`, `glyphs.ts` và bảng HTML chuyển vào bảng chuỗi; mục Ngôn ngữ ở Cài đặt | Giới hạn bản en = 1,3 × bản vi (hướng dẫn 120 → 156 ký tự, thoại 140 → 182) | `14-Cai-dat-Tiep-can.md` mục 3.5 |
| T02 | `03-Data/dialogue_hub.json` (chỉ ghi yêu cầu, chưa tạo): lời Mira, Vex, Hale, NOVA ở Hub, midpoint, Điểm chọn #1; cùng luật kiểm tra với thoại Warden (≤ 140 vi / 182 en, xưng hô, không viết tắt). Thêm vào `tutorial.json` các bước F, H, R, D không phụ thuộc bản đồ; tín hiệu mới `bossesDefeated:n`, `levelUp`; `ui.json → dialogue.speakers.mira` | | Đặc tả Hub mục 6 |
| T03 | Vẽ 8 bảng ở mục 11 | | `02-Wireframes/LOI-THOI.md` |
| QB-91 | Lời S13 đã viết lại để không lặp trên cảm ứng ("nút đổi vũ khí… đổi vũ khí"). Thêm test: mọi lời trong `tutorial.json` sau khi thay mã nút ở cả ba thiết bị không lặp tên hành động và vẫn ≤ 2 dòng | | `QB-91` |
| QB-85 | Câu gợi ý S07, S09, S10 nhắc màu (cam, xanh, vàng, đỏ): kèm hình dạng hoặc tư thế | | `QB-85` |
