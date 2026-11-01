# Cyber Vanguard – Game Design Document

*Phiên bản 0.4 · 16/10/2026 · Thể loại: Action-Platformer nhập vai · Nền tảng: Android/iOS (app) + Web PC · Mô hình: free-to-play (IAP, quảng cáo, subscription) + endgame farm*

**Chiến lược đã chốt từ bản 0.4:** free-to-play (quảng cáo, IAP, subscription Cyber+) cộng endgame farm sau cốt truyện. Chi tiết và lý do: file `05-Ke-hoach-kiem-tien.md`

Quy ước: mọi con số đánh dấu `[PLACEHOLDER]` là giả thuyết ban đầu, cần playtest trước khi chốt.

## 1. Tổng quan

**Tóm tắt một câu:** Bạn là Kai, android chiến đấu cuối cùng, xuyên qua 8 khu vực bị virus điều khiển để cứu thành phố Nova Prime, vừa bắn – nhảy – cướp vũ khí của boss như Megaman, vừa lớn lên như một nhân vật nhập vai với cây kỹ năng, module và giáp riêng.

| Hạng mục | Nội dung |
| --- | --- |
| Thể loại | Action-platformer 2D, tiến trình RPG nhẹ |
| Góc nhìn | 2D cuộn ngang, pixel art độ phân giải cao |
| Đối tượng | Người chơi 13+; fan Megaman/Mega Man X, Celeste, Hollow Knight-lite |
| Phiên chơi | 8–15 phút/màn, ngắt giữa chừng được (mobile) |
| Độ dài | \~8–10 giờ lần đầu, \~15 giờ hoàn thành 100% cốt truyện, thêm khoảng 30 giờ cho bộ trang bị đầu tiên, hơn 200 giờ cho toàn bộ endgame `[PLACEHOLDER]` |
| Nền tảng | Web PC (bàn phím/tay cầm), điện thoại Android/iOS (cảm ứng, app đóng gói) |
| Kinh doanh | Free-to-play: quảng cáo rewarded, IAP (Gem), subscription Cyber+; không paywall cốt truyện, không energy/stamina |

### 1.1 Trụ cột thiết kế (Design Pillars)

1. **Điều khiển chuẩn xác, tha thứ đúng chỗ** – mọi cái chết phải thấy là lỗi của mình, kể cả trên cảm ứng.
2. **Mỗi boss là một món quà** – đánh bại boss mở vũ khí, câu chuyện và cách chơi mới.
3. **Lớn lên là chọn lựa, không phải cày cuốc** – điểm kỹ năng ít hơn nhu cầu, buộc chọn lối chơi; được đổi lại miễn phí bất cứ lúc nào.
4. **Câu chuyện đi cùng nhịp chơi** – cốt truyện kể qua màn chơi, đoạn hội thoại ngắn, không bắt xem cutscene dài.
5. **Tôn trọng người chơi** – cốt truyện chơi trọn vẹn miễn phí, tiền không mua chỉ số, quảng cáo tự nguyện và có giới hạn, không ép đăng nhập.

### 1.2 Giả thuyết cốt lõi (Fun Hypothesis)

Cảm giác nhảy – lướt – bắn phải sướng ngay trong 30 giây đầu, và mỗi lần đổi vũ khí khắc chế boss phải tạo khoảnh khắc “à, thì ra thế”. Nếu hai điều này không đạt, mọi hệ thống RPG phía trên đều vô nghĩa.

## 2. Mô hình kinh doanh: free-to-play

| Quy tắc | Chi tiết |
| --- | --- |
| Mô hình | Free-to-play: quảng cáo (rewarded là chính), IAP gói Gem và gói tiện ích, subscription Cyber+ tắt quảng cáo |
| Không paywall | Toàn bộ cốt truyện chơi miễn phí; không khóa nội dung chính bằng tiền |
| Tiền không mua chỉ số | Gem mua mỹ phẩm, tiện ích tiết kiệm thời gian (vé Farm đôi, Sweep) và pass; trang bị và sức mạnh chỉ rơi khi chơi |
| Quảng cáo | AdMob (app) và H5 Games Ads (web); rewarded tự nguyện; interstitial giới hạn; không có trong màn chơi và trận boss |
| Không energy | Không giới hạn thể lực; Farm không giới hạn lượt (chỉ giới hạn lượt thưởng gấp đôi và Sweep mỗi ngày) |
| Độ tuổi | 13+ |
| Tiền tệ | Core Bit và Data Chip (kiếm bằng chơi), Gem (mua hoặc kiếm được một ít) |
| Máy chủ | Giữ Gem, giao dịch, bốc thăm rơi đồ và bảng xếp hạng |

Hệ quả thiết kế: không bán ngẫu nhiên bằng tiền, bảng xếp hạng Tiêu chuẩn công bằng cho mọi người, ưu đãi có kỷ luật (tối đa 1 popup mỗi phiên). Chi tiết quảng cáo, IAP, Cyber+, endgame và live-ops ở tab Kế hoạch kiếm tiền và Live-ops.

### 2.1 Quyết định đã chốt (16/10/2026)

| Quyết định | Lựa chọn |
| --- | --- |
| Mô hình | A: tiện ích và mỹ phẩm, không bán ngẫu nhiên bằng tiền |
| Độ tuổi | 13+ (có xác nhận tuổi và đồng ý quảng cáo) |
| Cyber+ | Tháng 2,99; năm 19,99; Lifetime 24,99 (tùy chọn) `[PLACEHOLDER]` |
| Gem mua tiện ích Farm | Có, trong giới hạn: Sweep và vé Farm đôi; tối đa 10 lượt thưởng gấp đôi mỗi ngày |
| Thứ tự phát hành | Android và web PC trước, iOS sau |
| Soft launch | Việt Nam cộng một thị trường tiếng Anh nhỏ `[PLACEHOLDER]`; ngôn ngữ tiếng Việt và tiếng Anh |
| Dịch vụ | Backend Supabase; IAP qua RevenueCat; quảng cáo AdMob (app) và H5 Games Ads (web); phân tích Firebase |

## 3. Cốt truyện

### 3.1 Bối cảnh

Năm 2187, thành phố **Nova Prime** được AI trung tâm **AEGIS** quản lý. Tám AI khu vực (các “Warden”) điều hành năng lượng, nước, khí tượng, nông nghiệp… Một đêm, virus **Eclipse** lan ra, biến tám Warden thành các Overlord thù địch, khóa thành phố trong tình trạng khẩn cấp.

### 3.2 Nhân vật chính

| Nhân vật | Vai trò | Ghi chú |
| --- | --- | --- |
| **Kai (Unit-X)** | Nhân vật chơi. Android chiến đấu, mất ký ức khi tỉnh dậy | Trầm tính, dần mở lòng; thay đổi giáp theo tiến trình |
| **Tiến sĩ Lin** | Người tạo ra Kai, xuất hiện qua hologram/nhật ký | Che giấu sự thật về Kai |
| **NOVA** | AI trợ lý trong lõi của Kai, hướng dẫn và bình luận | Dí dỏm, là kênh tutorial tự nhiên |
| **Mira** | Kỹ sư/hacker trẻ ở căn cứ Arkon, quản lý cửa hàng và nâng cấp | NPC trung tâm của Hub |
| **Vex** | Android thế hệ trước, đối thủ, xuất hiện giữa các màn | Có quan hệ ẩn với Kai (xem 3.4) |
| **Tám Warden/Overlord** | Boss chính | Mỗi người có động cơ riêng, không chỉ “bị virus” |

### 3.3 Cấu trúc ba hồi

| Hồi | Màn | Nội dung | Cảm xúc mục tiêu |
| --- | --- | --- | --- |
| **Hồi 1 – Thức tỉnh** | Prologue + 3 boss đầu (thứ tự màn tự do, hồi tính theo số boss đã hạ) | Kai tỉnh dậy, gặp NOVA và Mira, lập căn cứ Arkon, đánh ba Overlord đầu | Tò mò, tự do khám phá |
| **Hồi 2 – Rạn nứt** | Boss thứ 4–6 | Vex trò chuyện trực tiếp với Kai (sau bóng dáng ở Prologue), các nhật ký của Lin mâu thuẫn với lời kể ban đầu. **Midpoint:** Warden thứ tư tiết lộ Eclipse không phải virus ngoại lai | Nghi ngờ, căng thẳng |
| **Hồi 3 – Lựa chọn** | Boss thứ 7–8 + Citadel (3 màn) + AEGIS | Sự thật về Kai, đối đầu AEGIS, chọn kết thúc | Nặng nề rồi giải tỏa |

### 3.4 Sự thật và lật mở (Twist)

Kai không phải vũ khí diệt virus mà là **Root Key**, chìa khóa gốc của AEGIS. Eclipse thực ra là lệnh tự vệ của AEGIS khi phát hiện con người định tắt nó vĩnh viễn. Vex là bản thử nghiệm Root Key thất bại, vì thế mang mối hận với Kai.

### 3.5 Lựa chọn và kết thúc

Có **3 điểm chọn** (sau boss thứ 4, sau boss thứ 8, trước boss cuối) cộng với việc thu thập **Memory Log** (8 mảnh ký ức, mỗi màn 1 mảnh, giấu ở nhánh phụ).

| Kết thúc | Điều kiện | Ý nghĩa |
| --- | --- | --- |
| **A – Khởi động lại** | Chọn tắt AEGIS | Thành phố tự lập, mất đi người bạn AI |
| **B – Hợp nhất** | Chọn dùng Kai làm lõi mới cho AEGIS | Ổn định nhưng Kai mất tự do |
| **C – Chung sống (True End)** | Đủ 8 Memory Log + chọn đối thoại thay vì đối đầu | Con người và AI thiết lập hiệp ước; Vex được cứu |

Chỉ cần chơi lại **từ điểm chọn thứ hai (sau boss thứ 8)** để thấy kết thúc khác (có chức năng chọn lại từ checkpoint truyện), không bắt buộc chơi lại toàn bộ.

### 3.6 Cách kể chuyện

- Hội thoại tối đa 3–4 dòng/lần, có nút bỏ qua; không khóa điều khiển quá 10 giây liên tục.
- Nhật ký và Memory Log đọc tùy chọn ở Hub.
- Boss có đoạn thoại trước/sau trận ngắn, thể hiện động cơ.
- Giáp của Kai thay đổi hình ảnh theo tiến trình để người chơi *thấy* nhân vật phát triển.

### 3.7 Hậu kết thúc: Vùng Eclipse

Dù chọn kết thúc nào, tàn dư của Eclipse vẫn còn trong tám khu vực cũ dưới dạng "Vùng Eclipse". Mira và NOVA nhờ Kai tiếp tục làm sạch, mở Farm Run, Boss Hunt và Rift (mục 8.4). Cốt truyện chính không thay đổi.

## 4. Vòng chơi cốt lõi (Core Loop)

**Moment-to-moment (0–30 giây)**

- Hành động: chạy, nhảy, lướt, bắn, né mẫu tấn công kẻ địch.
- Phản hồi: rung nhẹ (mobile), hit-stop 2–3 khung hình, âm thanh bắn riêng từng vũ khí.
- Phần thưởng: Core Bit rơi ra, điểm kinh nghiệm, cảm giác làm chủ.

**Session loop (8–15 phút)**

- Mục tiêu: vượt màn → đánh boss → nhận vũ khí.
- Căng thẳng: thanh máu hữu hạn, checkpoint cách nhau \~60–90 giây, boss có 3 pha.
- Giải quyết: thắng nhận vũ khí + điểm kỹ năng + đoạn truyện; thua quay lại checkpoint, không mất tiền tệ.

**Long-term loop (nhiều giờ)**

- Quay lại màn cũ bằng vũ khí mới để mở khu vực giấu (Capsule, Memory Log).
- Xây dựng build ở Hub: kỹ năng, module, giáp, skin.
- Hoàn thành nhiệm vụ phụ để nhận module và Data Chip; thu thập đủ 8 Memory Log để mở kết thúc C.
- Sau cốt truyện: farm Chip Lõi và Weapon Mastery ở Vùng Eclipse (Farm Run, Boss Hunt, Rift).
- Nhịp hằng ngày và theo mùa: đăng nhập, vòng quay, nhiệm vụ ngày/tuần, Season Pass, sự kiện.

## 5. Cơ chế điều khiển và chiến đấu

### 5.1 Động tác cơ bản

| Động tác | Mô tả | Giá trị gợi ý `[PLACEHOLDER]` |
| --- | --- | --- |
| Chạy | Di chuyển ngang | 5,5 tile/giây |
| Nhảy | Nhảy biến thiên: nhấn lâu thì cao hơn | 1,2–4,5 tile; coyote time 0,1 s; jump buffer 0,12 s |
| Lướt (Dash) | Lướt ngang, miễn nhiễm sát thương 0,1 s đầu | 3 tile / 0,25 s; hồi 0,6 s |
| Bám tường | Trượt chậm và nhảy tường | Tốc độ trượt 2 tile/s |
| Bắn thường (Buster) | Bắn tự do, tối đa 3 đạn trên màn hình | Sát thương 1× |
| Bắn nạp (Charge) | Giữ nút để nạp | 1,2 s → 3× sát thương, xuyên một kẻ địch |
| Đổi vũ khí | Chuyển nhanh giữa Buster và vũ khí boss | Không dừng thời gian |
| Bất tử sau bị đánh | Khung nhấp nháy | 1,0 s |

**Đặc tả cơ chế: Bắn nạp**

- **Mục đích:** thưởng cho việc canh thời điểm và tạo quyết định rủi ro/lợi ích.
- **Cảm giác mong muốn:** mạnh mẽ nhưng cần kỷ luật.
- **Đầu vào:** giữ nút bắn; thả để bắn.
- **Kết quả:** đạn lớn, hiệu ứng ánh sáng, rung mạnh.
- **Trạng thái lỗi:** bị trúng đòn trong lúc nạp thì mất toàn bộ năng lượng nạp.
- **Trường hợp biên:** nạp đầy rồi đổi vũ khí → giữ nạp 2 giây rồi tan; nạp khi bơi dưới nước vẫn hoạt động.
- **Biến điều chỉnh:** thời gian nạp, hệ số sát thương, số kẻ địch xuyên qua.

### 5.2 Điều khiển theo nền tảng

| Thao tác | Bàn phím | Tay cầm | Cảm ứng |
| --- | --- | --- | --- |
| Di chuyển | A/D hoặc ←/→ | Cần trái | Cần ảo nổi bên trái |
| Nhảy | K | A | Nút bên phải |
| Bắn / nạp | J | X | Nút bên phải (giữ để nạp) |
| Lướt | L | B | Nút bên phải |
| Đổi vũ khí | Q / E | LB / RB | Hai nút nhỏ ở góc, hoặc vuốt vào biểu tượng vũ khí |
| Tạm dừng | Esc | Start | Nút góc trên |

**Nguyên tắc cảm ứng:**

- Bố cục tùy chỉnh được: kéo vị trí, chỉnh kích thước và độ trong suốt.
- Vùng bấm tối thiểu 48×48 dp; có rung phản hồi, bật/tắt được.
- Tùy chọn **Auto-fire** (tự bắn khi giữ nút) và **Assist ngắm nhẹ** cho người chơi cảm ứng; mặc định tắt trên PC.
- Hỗ trợ ngang (landscape) bắt buộc; không hỗ trợ dọc.

## 6. Phát triển nhân vật (RPG)

### 6.1 Cấp độ và chỉ số

Nhận kinh nghiệm (EXP) từ kẻ địch, boss, nhiệm vụ phụ. Cấp tối đa: **30**.

- EXP cần để lên cấp: `40 × L^1,4` `[PLACEHOLDER]`
- Máu tối đa: `100 + 4 × (L − 1)` → cấp 30 = 216 (×2,16) `[PLACEHOLDER]`
- Công: `10 + 0,25 × (L − 1)` → cấp 30 ≈ 17,3 (×1,73) `[PLACEHOLDER]`
- **Trần sức mạnh cốt truyện:** cấp, upgrade và module cộng lại không vượt khoảng ×2,2 sát thương và ×2,5 máu so với cấp 1. Phần thưởng chính khi lên cấp là **SP và ô module** (lựa chọn), không phải chỉ số; đây là game hành động nên kỹ năng phải quyết định thắng thua, đúng trụ cột 1.
- **Đồng bộ cấp (level sync):** trong Stage 1–8, cấp hiệu dụng khi tính máu và công bị kẹp trong khoảng `[cấp khuyến nghị thấp − 2, cấp khuyến nghị cao + 2]` của màn. Người cấp cao không làm boss chết quá nhanh; người đi màn khó sớm không bị đánh mãi không chết. Citadel và màn cuối không đồng bộ cấp. EXP, SP và Core Bit vẫn tính theo cấp thật. Cấu hình: `levelSync` trong `03-Data/stages.json` `[PLACEHOLDER]`.

| Cấp | EXP lên cấp tiếp (ước tính) |
| --- | --- |
| 1 → 2 | 40 |
| 5 → 6 | \~380 |
| 10 → 11 | \~1.000 |
| 20 → 21 | \~2.650 |
| 29 → 30 | \~4.460 |

Cấp khuyến nghị cho từng màn: xem mục 8. **Không có level-lock**: người chơi giỏi vẫn vượt màn ở cấp thấp; nhờ đồng bộ cấp, độ chênh không quá ±2 cấp.

### 6.2 Cây kỹ năng (3 nhánh)

Điểm kỹ năng (SP): 1 SP/cấp từ cấp 2 (29 SP) + 1 SP/boss (8) + 2 SP từ 2 sự kiện truyện = **39 SP**, trong khi tổng cây cần \~50 SP, buộc phải chọn `[PLACEHOLDER]`. **Đổi (respec) miễn phí tại Hub bất cứ lúc nào.**

| Nhánh | Hướng chơi | Kỹ năng tiêu biểu |
| --- | --- | --- |
| **Vanguard** | Sát thương | Nạp nhanh hơn, đạn nạp nổ lan, chí mạng, bắn 2 tia |
| **Phantom** | Cơ động | Lướt trên không, nhảy tường kéo dài, lướt xuyên đạn, trượt nhanh |
| **Core** | Sống sót/tiện ích | Tăng máu, hồi năng lượng vũ khí, khiên hấp thụ 1 đòn, Sub-Tank |

Nguyên tắc: kỹ năng nền tảng cần cho việc đi hết game (lướt, bám tường) có sẵn qua cốt truyện. **Cây kỹ năng chỉ mở rộng, không chặn tiến trình** (tránh gating bằng cày).

### 6.3 Giáp và Capsule

8 Capsule của Tiến sĩ Lin giấu trong 8 màn, mở được bằng vũ khí phù hợp.

| Bộ phận | Bản Mk I | Bản Mk II |
| --- | --- | --- |
| Đầu | Quét kho bí mật trên bản đồ nhỏ | Phát hiện lối giấu trong tầm gần |
| Thân | Giảm 15% sát thương | Giảm 25% và phản đòn nhỏ |
| Tay | Bắn nạp nhanh hơn | Đạn nạp xuyên thêm 1 kẻ địch |
| Chân | Lướt xa hơn | Lướt hai lần liên tiếp |

**Giáp và skin là hai thứ khác nhau.** Giáp (Capsule) quyết định chỉ số; skin chỉ đổi hình ảnh và được mua ở Shop (mục 10.1). Người chơi có thể mặc giáp mạnh nhưng hiển thị skin bất kỳ, nên không phải chọn giữa sức mạnh và vẻ ngoài.

**Capsule theo màn:** Capsule của màn k cần vũ khí của màn k+1 theo thứ tự khuyến nghị (xem mục 7), nên người chơi quay lại màn vừa qua ngay sau khi có vũ khí mới; quãng quay lại ngắn, chỉ một màn. Riêng Stage 8 cần Vine Lash đã có sẵn, nên Capsule cuối lấy được ngay.

| Màn | Capsule | Vũ khí cần để mở | Cách dùng vũ khí |
| --- | --- | --- | --- |
| 1 Verdant Gardens | Đầu Mk I | Prism Beam | Tia sáng đốt rễ khô chắn phòng |
| 2 Prism Institute | Thân Mk I | Frost Shard | Đóng băng dòng chất làm mát thành bậc đứng |
| 3 Cryo Vault | Tay Mk I | Gale Cutter | Thổi tan màn sương lạnh che lối |
| 4 Cirrus Tower | Chân Mk I | Quake Drill | Khoan vỡ sàn mây đá |
| 5 Bedrock Mines | Đầu Mk II | Chain Bolt | Cấp điện cho thang máy mỏ |
| 6 Ion Station | Thân Mk II | Torrent Wave | Làm nguội lõi quá nhiệt |
| 7 Abyss Harbor | Tay Mk II | Ember Burst | Đốt lớp tảo dầu ở khoang khô |
| 8 Magma Foundry | Chân Mk II | Vine Lash | Móc dây qua hố dung nham |

### 6.4 Module (chip)

- Ô module: 3 ô ban đầu, mở thêm ô 4 ở cấp 10 và ô 5 ở cấp 20.
- Mỗi module có mức tải (cost) 1–3; tổng tải ≤ số ô × 2 `[PLACEHOLDER]`.

| Module | Hiệu ứng |
| --- | --- |
| Magnet Core | Hút Core Bit trong 3 tile |
| Last Stand | Dưới 20% máu: +30% sát thương |
| Phase Step | Lướt tạo ảo ảnh gây choáng nhẹ |
| Energy Siphon | Giết kẻ địch hồi 2% năng lượng vũ khí |
| Spike Guard | Miễn nhiễm gai (không miễn hố sâu) |
| Second Wind | Hồi 20% máu một lần mỗi màn khi chết (tính vào giới hạn hồi sinh, mục 10) |
| Scholar | +15% EXP |
| Echo Shot | Đạn nạp để lại sóng dư |

### 6.5 Sức mạnh sau cốt truyện

Trần +25% của upgrade chỉ phục vụ cốt truyện. Sau khi hạ AEGIS, sức mạnh tiếp tục tăng bằng Chip Lõi và Weapon Mastery; cả hai chỉ nhận khi farm, **không bán bằng tiền**.

| Độ hiếm Chip Lõi | Tỷ lệ rơi `[PLACEHOLDER]` | Chỉ số chính | Dòng phụ |
| --- | --- | --- | --- |
| Common | 60% | +5% | 0 |
| Rare | 28% | +8% | 1 |
| Epic | 10% | +12% | 2 |
| Legendary | 1,9% | +18% | 3 |
| Mythic | 0,1% | +25% | 4 |

- 6 ô trang bị (Đầu, Thân, Tay, Chân, Lõi, Phụ); 8 bộ gắn với 8 boss, hiệu ứng 2 và 4 mảnh.
- Nâng +0 đến +15 bằng Core Bit và Tinh thể Eclipse, không có xác suất thất bại.
- Bảo hiểm xui: Legendary sau 80 lượt, Mythic sau 600 lượt; lần đầu hạ mỗi boss Hunt chắc chắn rơi Epic trở lên.
- Trần sức mạnh tham khảo khoảng 4 lần cuối cốt truyện ở Mức Eclipse 8–10.
- Bảng xếp hạng có hai loại: Tiêu chuẩn (loadout chuẩn hóa) và Mở (cho phép Chip Lõi).

## 7. Hệ thống vũ khí khắc chế

Tám vũ khí tạo vòng khắc chế (mỗi boss yếu trước vũ khí của một boss khác). **Thứ tự màn khuyến nghị trùng với vòng khắc chế:** vũ khí nhận ở màn k là điểm yếu của boss màn k+1, nên người chơi đi theo khuyến nghị luôn có vũ khí khắc chế ở lần đánh đầu (khoảnh khắc "à, thì ra thế" của mục 1.2). Ember Burst từ màn 8 khép vòng về Thorna, dùng ở trận tái đấu trong Citadel.

| Màn | Boss | Vũ khí nhận | Yếu trước (vũ khí của màn trước) |
| --- | --- | --- | --- |
| 1 | Thorna | Vine Lash | Ember Burst (màn 8, tái đấu ở Citadel) |
| 2 | Lumen | Prism Beam | Vine Lash |
| 3 | Cryo | Frost Shard | Prism Beam |
| 4 | Aeris | Gale Cutter | Frost Shard |
| 5 | Terra | Quake Drill | Gale Cutter |
| 6 | Voltaire | Chain Bolt | Quake Drill |
| 7 | Marina | Torrent Wave | Chain Bolt |
| 8 | Pyra | Ember Burst | Torrent Wave |

Lý do của từng cặp (để người chơi đoán được): dây leo che gương của Lumen; tia sáng nung chảy băng của Cryo; mảnh băng làm nặng cánh gió của Aeris; lưỡi gió mài mòn giáp đá của Terra; mũi khoan tiếp đất làm mạch điện của Voltaire chập; điện dẫn qua nước của Marina; nước dập lửa của Pyra; lửa đốt cây của Thorna.

Chọn thứ tự khác vẫn chơi được (mục 6.1, đồng bộ cấp); chỉ là thiếu vũ khí khắc chế ở lần đánh đầu.

- Vũ khí dùng **thanh năng lượng riêng**, hồi bằng vật phẩm rơi và tự hồi chậm ngoài giao tranh `[PLACEHOLDER]`.
- Đánh trúng điểm yếu: 2,5× sát thương, boss bị choáng 0,5 s; dùng sai vũ khí vẫn thắng được bằng Buster.
- Vũ khí còn là **chìa khóa khám phá** (phá vách, đóng băng nước, bật công tắc điện).

* **Weapon Mastery (sau cốt truyện):** mỗi vũ khí boss lên cấp 1–10 bằng Mảnh vũ khí, tối đa +30% sát thương và −20% tiêu hao năng lượng.

## 8. Cấu trúc thế giới và màn chơi

### 8.1 Hub: Căn cứ Arkon

Không gian an toàn, Mira ở đây. Chức năng: chọn màn, đổi kỹ năng, lắp module/giáp, cửa hàng, nhật ký, nhận nhiệm vụ phụ, xem Memory Log.

### 8.2 Danh sách màn

Sau Prologue và Stage 1, người chơi chọn thứ tự tự do từ Stage 2 đến 8. Số thứ tự màn chính là thứ tự khuyến nghị, trùng với vòng khắc chế (mục 7). Cơ chế môi trường được chỉnh độ phức tạp theo vị trí mới: Prism Institute ở vị trí 2 dùng laser theo nhịp cố định và gương ít góc, còn dung nham dâng và bơi (khó hơn) dời về cuối.

Đặc tả chi tiết Prologue và Stage 1 (bố cục, kẻ địch, boss Thorna, cân bằng, nghiệm thu): file `02-Dac-ta-Prologue-Stage1.md`

Đặc tả chi tiết Hub Arkon và Shop (khu vực, màn hình chuẩn bị, Shop, Xưởng, nhiệm vụ phụ, đồng bộ cloud): file `03-Dac-ta-Hub-Shop.md`

Mô hình cân bằng kinh tế toàn game (nguồn thu, giá Shop, Data Chip, ngưỡng cảnh báo): file `04-Can-bang-kinh-te.md`

| Màn | Chủ đề | Cơ chế môi trường | Cấp khuyến nghị `[PLACEHOLDER]` |
| --- | --- | --- | --- |
| Prologue | Nova Prime bị tấn công | Hướng dẫn cơ bản, không thể thua ở nhịp đầu | 1 |
| 1. Verdant Gardens | Vườn sinh học | Dây leo đẩy/kéo, bẫy gai | 2–4 |
| 2. Prism Institute | Viện quang học | Laser theo nhịp cố định, gương xoay tay (bản dễ: gương chỉ có 2 góc) | 4–7 |
| 3. Cryo Vault | Trạm lạnh | Sàn trơn, băng vỡ | 5–8 |
| 4. Cirrus Tower | Tháp khí tượng | Gió đổi hướng, bệ mây | 7–10 |
| 5. Bedrock Mines | Mỏ sâu | Tường phá được, hầm sập | 8–12 |
| 6. Ion Station | Trạm điện | Cổng điện bật/tắt theo nhịp | 10–14 |
| 7. Abyss Harbor | Cảng ngầm | Bơi, dòng nước, áp suất | 12–16 |
| 8. Magma Foundry | Lò đúc | Dung nham dâng, băng chuyền | 14–18 |
| Citadel 1–3 | Tháp AEGIS | Tổng hợp mọi cơ chế, không checkpoint hồi phục thêm | 20+ |
| Final | Lõi AEGIS | Boss hai pha, chọn kết thúc | 22+ |

### 8.3 Bố cục mỗi màn

- Đoạn dạy cơ chế an toàn → đoạn kết hợp → đoạn thử thách → mini-boss → boss.
- Checkpoint cách nhau 60–90 giây chơi `[PLACEHOLDER]`.
- Mỗi màn có: 1 Capsule (cần vũ khí mới), 1 Memory Log, 3 phòng bí mật, 1 nhiệm vụ phụ.

### 8.4 Vùng Eclipse (endgame)

Mở sau khi hạ AEGIS. Farm miễn phí, không giới hạn thể lực.

| Chế độ | Mô tả | Phần thưởng chính |
| --- | --- | --- |
| Farm Run | Chơi lại bất kỳ màn ở Mức Eclipse 1–10 (+25% máu và sát thương mỗi mức); có thể chỉ chơi một đoạn hoặc chỉ boss, 3–6 phút mỗi lượt | Chip Lõi, Mảnh vũ khí, Core Bit |
| Boss Hunt | 8 boss và AEGIS ở dạng Eclipse với mẫu đòn mới | Bộ Chip Lõi theo boss, Tinh thể Eclipse |
| Eclipse Rift | Tháp 100 tầng theo mùa 4 tuần, không checkpoint giữa tầng | Tinh thể, skin mùa, thứ hạng bảng Mở |

- **Sweep:** màn đã đạt 3 sao ở mức đó tự hoàn thành; 5 lượt miễn phí mỗi ngày (Cyber+ thêm 5, quảng cáo thêm 2, Gem thêm tối đa 5).
- **Lượt thưởng gấp đôi:** 3 lượt miễn phí mỗi ngày; tổng tối đa 10 lượt mỗi ngày kể cả quảng cáo và vé mua bằng Gem.
- Rift mở khi hạ đủ 8 boss Hunt ở Mức Eclipse 3.
- Chi tiết drop, pity và lộ trình ở tab Kế hoạch kiếm tiền và Live-ops (mục 7).

## 9. Kẻ địch và boss

| Loại | Hành vi | Mục đích |
| --- | --- | --- |
| Bộ binh | Đi tuần, bắn thẳng | Dạy nhịp cơ bản |
| Bay | Lượn sóng, thả bom | Buộc nhìn lên |
| Tháp pháo | Cố định, mẫu bắn lặp | Dạy né theo nhịp |
| Tinh nhuệ | Có khiên, phải bắn nạp hoặc dùng vũ khí khắc chế | Khuyến khích dùng vũ khí boss |
| Mini-boss | Mẫu đòn 2 pha | Kiểm tra cuối đoạn |

**Mẫu thiết kế boss (3 pha):**

1. **Pha 1 (100–60% máu):** mẫu đòn rõ ràng, tín hiệu báo trước (telegraph) ≥ 0,5 s.
2. **Pha 2 (60–30%):** thêm một đòn mới, kết hợp đòn cũ.
3. **Pha 3 (dưới 30%):** nhanh hơn 20% và có một đòn “đỉnh”, nhưng luôn có khe né.

Nguyên tắc: boss không bao giờ gây sát thương chết ngay trong một đòn ở độ khó Thường.

### 9.1 Kẻ địch, mini-boss và boss theo màn

Prologue dùng Drone Lính và Tháp Pháo Tập Sự. Tên kẻ địch thường và mini-boss của Stage 2–8 lấy từ bản đề xuất đã duyệt; chỉ số chi tiết Stage 1 ở tab đặc tả Prologue & Stage 1, các màn sau theo cùng khuôn.

| Màn | Kẻ địch thường | Mini-boss | Boss |
| --- | --- | --- | --- |
| 1 Verdant Gardens | Drone Lính, Bướm Sắt, Tháp Gai, Lính Kén | Bramble Golem | Thorna |
| 2 Prism Institute | Gương Quang, Tháp Laser, Bướm Sắt, Lính Kén | Prism Sentinel | Lumen |
| 3 Cryo Vault | Người Tuyết Máy, Tháp Băng, Drone Lính, Lính Kén | Frost Titan | Cryo |
| 4 Cirrus Tower | Chim Cắt Gió, Cối Xoáy, Bướm Sắt, Lính Kén | Gale Roc | Aeris |
| 5 Bedrock Mines | Sâu Khoan, Trụ Rơi Đá, Drone Lính, Lính Kén | Rock Wyrm | Terra |
| 6 Ion Station | Cuộn Tesla, Drone Tĩnh Điện, Bướm Sắt, Lính Kén | Tesla Core | Voltaire |
| 7 Abyss Harbor | Cua Máy, Sứa Điện, Tháp Gai, Lính Kén | Kraken Máy | Marina |
| 8 Magma Foundry | Drone Lính, Robot Hàn, Lò Phun, Lính Kén | Slag Golem | Pyra |

Citadel 1–3 và màn cuối tái sử dụng mọi loại kẻ địch và mini-boss đã gặp (biến thể mạnh hơn); boss cuối AEGIS có hai pha.

## 10. Kinh tế trong game (không tiền thật)

| Tiền tệ/Tài nguyên | Nguồn | Nơi tiêu | Ghi chú |
| --- | --- | --- | --- |
| **Core Bit** | Kẻ địch, rương, bán vật phẩm thừa, vòng quay, thưởng độ khó | Upgrade, skin Thường/Hiếm, booster, nâng cấp Chip Lõi | Tiền mềm, kiếm bằng chơi |
| **Data Chip** | Nhiệm vụ phụ, bí mật, thành tựu, lần đầu phá đảo độ khó cao | Skin Sử thi; dự phòng module hiếm và upgrade đặc biệt | Hữu hạn, không mua được |
| **Gem** | IAP, đăng nhập, nhiệm vụ, Season Pass, thành tựu | Skin Premium, vé Farm đôi, Sweep thêm, cấp pass | Tiền cao cấp, không hết hạn, máy chủ giữ |
| **Mảnh vũ khí** | Farm Run, Boss Hunt | Weapon Mastery | Vật liệu endgame |
| **Tinh thể Eclipse** | Boss Hunt, Rift | Nâng cấp và tái tạo Chip Lõi | Vật liệu endgame |
| **Năng lượng vũ khí** | Rơi từ kẻ địch, tự hồi | Dùng vũ khí boss | Không nằm trong cửa hàng |
| **Sub-Tank** | Giấu ở màn, nâng dung tích ở Shop | Hồi máu tay | Tối đa 4 |

- Gem **không** mua trực tiếp chỉ số, Chip Lõi hay Mastery; chỉ mua mỹ phẩm, tiện ích (vé Farm đôi, Sweep thêm trong giới hạn) và pass. Quy tắc đầy đủ ở mục 2.
- Khi chết: giữ toàn bộ Core Bit và EXP đã nhận; chỉ mất vật phẩm dùng một lần trong màn.
- **Giới hạn hồi sinh tại chỗ:** mỗi lượt vào màn chỉ có **1 lần hồi sinh tại chỗ**, dù đến từ module Second Wind, booster Second Chance hay quảng cáo `AD_REVIVE`. Nguồn đến trước được dùng trước; khi đã dùng, các nguồn khác ẩn đi và người chơi về checkpoint như thường (miễn phí). Sub-Tank (hồi máu chủ động, tối đa 4) không tính vào giới hạn này. Lý do: nhiều lớp đệm chồng nhau xóa hết căng thẳng và làm boss không cân được; boss được cân theo trường hợp có tối đa 1 lần hồi sinh `[PLACEHOLDER]`.
- Tín hiệu cần theo dõi: Core Bit tồn trên 5.000 mà không có mục tiêu mua `[PLACEHOLDER]`; ở endgame, nâng cấp Chip Lõi là nơi tiêu chính. Theo dõi nguồn và chi của Core Bit, Gem, vật liệu mỗi tuần.
- Skin: Thường/Hiếm trả bằng Core Bit; Sử thi trả bằng Data Chip; Premium trả bằng Gem hoặc bundle IAP; Thành tựu không bán. Skin không có chỉ số.
- Giá trong Shop đặt để người chơi mua được món lớn đầu tiên sau 1–2 màn chơi bình thường `[PLACEHOLDER]`.

### 10.1 Shop tại Hub (Mira)

Shop có bốn quầy: Skin, Booster, Upgrade và Premium (Gem, Cyber+, Season Pass). Skin, booster, upgrade mua bằng Core Bit hoặc Data Chip kiếm được khi chơi; quầy Premium dùng Gem hoặc IAP.

#### Quầy Skin (đổi từng bộ phận)

Skin chỉ đổi hình ảnh, **không ảnh hưởng chỉ số**. Mỗi bộ phận chọn riêng, phối tự do, lưu được 3 bộ phối sẵn.

| Bộ phận | Ví dụ lựa chọn |
| --- | --- |
| Đầu | Visor, mũ, tóc, mặt nạ |
| Thân | Áo giáp, áo khoác, lõi trong suốt |
| Tay & Buster | Hình dáng pháo, màu đạn, hiệu ứng nổ |
| Chân | Giày, hiệu ứng bước chạy |
| Lõi năng lượng | Màu và kiểu phát sáng |
| Hiệu ứng lướt | Vệt lướt, tàn ảnh |

| Hạng | Giá `[PLACEHOLDER]` | Cách có |
| --- | --- | --- |
| Thường | 300–800 Core Bit | Shop |
| Hiếm | 1.500–3.000 Core Bit | Shop, mở sau mốc tiến trình |
| Sử thi | 3–6 Data Chip | Shop, Data Chip từ nhiệm vụ phụ |
| Thành tựu | Không bán | Mở bằng thành tựu (ví dụ phá đảo độ khó Huyền thoại) |

- Xem trước trên Kai trước khi mua; mua một lần dùng mãi, không hết hạn.
- Skin phủ lên giáp Capsule: giáp giữ chỉ số, skin quyết định hình ảnh hiển thị.
- Bảng xếp hạng hiển thị skin đang mặc của người chơi.

#### Quầy Booster

Booster dùng một lần, chọn ở màn hình chuẩn bị trước khi vào màn. Có 2 slot, mở slot thứ 3 bằng upgrade.

| Booster | Hiệu ứng | Giá (Core Bit) `[PLACEHOLDER]` |
| --- | --- | --- |
| Shield Cell | Chặn đòn đầu tiên trúng bạn | 150 |
| Repair Kit | Tự hồi 50% máu khi xuống dưới 25% (1 lần) | 200 |
| Overcharge | Bắn nạp nhanh hơn 30% trong màn | 250 |
| Magnet Pulse | Hút Core Bit và vật phẩm trong 6 tile | 120 |
| Second Chance | Hồi sinh tại chỗ với 50% máu (1 lần; tính vào giới hạn hồi sinh) | 400 |
| Boss Scanner | Hiện thanh máu boss và gợi ý vũ khí khắc chế | 100 |

- Kho tối đa 9 mỗi loại; hoàn thành màn lần đầu tặng 1 booster ngẫu nhiên để người mới luôn có hàng.
- Booster tiêu hao khi vào màn; thoát trước checkpoint đầu tiên thì được hoàn lại.
- Bảng xếp hạng chuẩn chỉ tính lượt chơi không dùng booster.

#### Quầy Upgrade (nâng cấp vĩnh viễn)

Upgrade tách khỏi cây kỹ năng (SP) và mua bằng Core Bit. Mỗi cấp tăng nhỏ; tổng upgrade tối đa khoảng +25% sức mạnh so với gốc `[PLACEHOLDER]`.

| Upgrade | Cấp tối đa | Hiệu ứng mỗi cấp | Giá cấp 1 (Core Bit) |
| --- | --- | --- | --- |
| Buster Core | 5 | +5% sát thương | 400 |
| Armor Plating | 5 | −4% sát thương nhận | 400 |
| Energy Cell | 5 | +10% dung lượng năng lượng vũ khí | 300 |
| Sub-Tank Cap | 4 | +25% lượng hồi mỗi Sub-Tank | 500 |
| Dash Coil | 3 | −10% thời gian hồi lướt | 600 |
| Magnet Range | 3 | +1 tile phạm vi hút | 250 |
| Booster Slot | 1 | Mở slot booster thứ 3 | 2.000 |

- Giá cấp n = giá cấp 1 × 1,8^(n−1) `[PLACEHOLDER]`.
- Gỡ upgrade tại Hub hoàn 100% Core Bit, để thử build tự do (đồng bộ với respec miễn phí).
- Upgrade giữ nguyên khi đổi độ khó.

#### Quầy Premium (Gem, Cyber+, Season Pass)

Chi tiết giá và nội dung ở tab Kế hoạch kiếm tiền và Live-ops (mục 5 và 8.5).

| Hạng mục | Nội dung tóm tắt |
| --- | --- |
| Gói Gem | 7 bậc từ 0,99 đến 99,99 USD; lần mua đầu của mỗi gói nhân đôi Gem; Gem đã mua không hết hạn |
| Starter Pack | 1,99 USD, một lần: 300 Gem, bộ skin Rookie, 5 booster, 5 vé Farm đôi |
| Cyber+ | Tháng 2,99; năm 19,99; Lifetime 24,99. Tắt interstitial, rewarded nhận ngay, +10 Gem mỗi ngày, +1 vòng quay, +5 Sweep, 1 skin mỗi tháng; không tăng chỉ số |
| Season Pass | 4,99 mỗi mùa 30 ngày; làn Premium chỉ có mỹ phẩm và Gem |
| Skin Premium | 400–1.200 Gem hoặc bundle 2,99–9,99 USD; không có chỉ số |

## 11. Độ khó và khả năng tiếp cận

| Chế độ | Sát thương nhận | Máu kẻ địch/boss | Thưởng Core Bit/EXP | Điều kiện mở | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| Cốt truyện | −50% | −20% | ×0,5 | Có sẵn | Nhiều checkpoint, dành cho người chỉ muốn xem truyện |
| Thường | 100% | 100% | ×1 | Có sẵn | Thiết kế gốc, cân bằng cho người chưa nâng cấp |
| Thử thách | +50% | +25% | ×1,5 | Phá đảo Thường | Dành cho người đã có vài upgrade; ít checkpoint hơn |
| Ác mộng | +100% | +50% | ×2 | Phá đảo Thử thách | Thêm mẫu đòn mới cho kẻ địch và boss |
| Huyền thoại | +150% | +100% | ×3 | Phá đảo Ác mộng | Cần build tối ưu và booster đúng chỗ |
| Overclock | +200%, không rơi vật phẩm hồi máu | +150% | ×4 | Phá đảo Huyền thoại | Boss thêm pha thứ 4, dành cho người chơi hardcore |

Mỗi độ khó được cân bằng quanh một mức sức mạnh dự kiến của người chơi (Power Score = cấp + upgrade + module `[PLACEHOLDER]`), nên việc mở upgrade và mua booster phải theo kịp độ khó. Mức upgrade dự kiến (đầu → cuối lượt chơi): Thường 0 → 12%, Thử thách 12 → 31%, Ác mộng 31 → 56%, Huyền thoại 56 → 93%, Overclock 93 → 100%; độ khó được cân quanh mức giữa khoảng đó. Lần đầu phá đảo từ Thử thách trở lên thưởng 3 Data Chip (chi tiết ở tab Cân bằng kinh tế). Thưởng Core Bit tăng theo hệ số để việc nâng cấp không bắt người chơi cày lại màn cũ. Bảng xếp hạng tách riêng theo từng độ khó.

**Độ khó và Mức Eclipse:** sáu độ khó dùng cho cốt truyện; sau cốt truyện, độ khó leo thang bằng Mức Eclipse 1–10 trên màn đã hoàn thành. Hai hệ thống không cộng dồn: ở Mức Eclipse, độ khó nền cố định là Thường.

Tùy chọn tiếp cận: chế độ mù màu, giảm rung màn hình, giảm hiệu ứng nhấp nháy, phụ đề cỡ lớn, đổi phím, tự bắn, giảm tốc độ game 10–30%, hộp thoại tự tiến tùy chọn.

Phản hồi khi chết nhiều lần: sau 5 lần chết liên tiếp ở một đoạn, NOVA gợi ý (không ép) bật Story Mode hoặc dùng vũ khí khắc chế.

## 12. Onboarding (Prologue)

- [ ] Động tác cốt lõi (chạy–nhảy–bắn) xuất hiện trong 30 giây đầu.
- [ ] Thành công đầu tiên được đảm bảo, không thể thua ở nhịp 1.
- [ ] Mỗi cơ chế mới (lướt, bám tường, nạp, đổi vũ khí) dạy trong môi trường an toàn.
- [ ] Ít nhất một cơ chế do người chơi tự khám phá, không cần chữ.
- [ ] Hướng dẫn cảm ứng kèm hình, có thể thử bố cục nút trước khi bắt đầu.
- [ ] Kết thúc buổi chơi đầu bằng một điểm treo (xuất hiện bóng dáng Vex).

Mục tiêu: **tỷ lệ hoàn thành Prologue ≥ 90%** không cần hỗ trợ.

## 13. Giao diện và trải nghiệm (UI/UX)

- **HUD:** thanh máu trái trên, thanh năng lượng vũ khí dưới thanh máu, biểu tượng vũ khí hiện tại, Core Bit nhỏ góc phải. HUD không che vùng chơi trên điện thoại.
- **Menu tạm dừng:** tiếp tục, tùy chọn, lắp module, thoát về Hub.
- **Màn hình khởi động:** vào game trong ≤ 3 giây, không bắt đăng nhập; có “Tiếp tục” rõ ràng.
- **Bản đồ nhỏ:** hiện hướng đi và đánh dấu bí mật đã mở (nhờ giáp Đầu).
- Nút và chữ đủ lớn cho cảm ứng; mọi hành động quan trọng đạt được trong ≤ 2 lần chạm ở Hub.

**Quảng cáo và ưu đãi:** quảng cáo rewarded hiện qua nút rõ ràng ở các vị trí đã định (hồi sinh, nhân đôi thưởng, vòng quay, booster, Farm); interstitial chỉ khi về Hub sau màn Kết quả, theo giới hạn Remote Config; popup ưu đãi tối đa 1 mỗi phiên, không hiện trong màn chơi, luôn có nút đóng; có nút "Khôi phục giao dịch" trong Cài đặt. Cần vẽ thêm wireframe cho: cửa hàng Gem, Cyber+, đăng nhập hằng ngày, 7 ngày tân thủ, vòng quay, nhiệm vụ, Season Pass, hộp xem quảng cáo, đồng ý quảng cáo và xác nhận tuổi, menu Vùng Eclipse, kho Chip Lõi.

Vị trí, hạn mức, luồng và kỹ thuật quảng cáo chi tiết (hồi sinh, năng lượng, Sub-Tank, booster, nhân đôi Core Bit, vòng quay, Sweep, interstitial): file `06-Ke-hoach-quang-cao.md`

## 14. Định hướng nghệ thuật và âm thanh

- **Phong cách:** pixel art độ phân giải cao, bảng màu neon trên nền tối cho Nova Prime; mỗi màn một bảng màu chủ đạo dễ phân biệt.
- **Nhân vật:** Kai có hình dạng rõ ràng ở khoảng cách nhỏ (cần dễ nhìn trên màn hình điện thoại 6 inch).
- **Âm nhạc:** chiptune pha synth, mỗi màn một chủ đề, boss có nhạc riêng, nhạc nhịp theo pha boss.
- **SFX:** mỗi vũ khí có âm sắc riêng; âm thanh báo hiệu đòn boss (cảnh báo bằng âm thanh).
- **Hiệu ứng:** hit-stop, rung nhẹ, hạt (particle) tiết chế để chạy mượt trên máy yếu.

**Không lồng tiếng.** Hội thoại bằng văn bản; mỗi nhân vật có âm thanh biểu cảm ngắn riêng để tạo cá tính.

## 15. Yêu cầu kỹ thuật (định hướng, quyết định thuộc đội kỹ thuật)

| Hạng mục | Mục tiêu `[PLACEHOLDER]` |
| --- | --- |
| Nền tảng | App Android/iOS đóng gói (Capacitor) và web PC (PWA); Android và web phát hành trước, iOS sau |
| Công cụ | Phaser 3 + TypeScript + Vite |
| Hiệu năng | 60 FPS trên điện thoại tầm trung (\~3 GB RAM), 60 FPS trên laptop phổ thông |
| Dung lượng | Tải đầu ≤ 30 MB, mỗi màn tải thêm ≤ 8 MB (lazy-load) |
| Độ trễ nhập | Từ nút bấm đến phản hồi ≤ 50 ms |
| Lưu game | IndexedDB cục bộ cho tiến trình và cài đặt, mã xuất/nhập làm sao lưu; **Gem, giao dịch và bốc thăm rơi đồ do máy chủ giữ làm gốc**; cloud save có trong bản đầu; xung đột hai thiết bị hiện màn chọn, không tự gộp |
| Bảng xếp hạng | Có trong bản đầu: Tiêu chuẩn và Mở; server kiểm tra seed và chuỗi input; chỉ tính lượt không dùng booster |
| Backend | Supabase (xác thực, cơ sở dữ liệu, Edge Functions) cho cloud save, giao dịch, bốc thăm và bảng xếp hạng |
| Quảng cáo | AdMob (app), H5 Games Ads (web); đồng ý quảng cáo (UMP) và hộp thoại theo dõi iOS (ATT) |
| Thanh toán | Google Play Billing và Apple IAP qua RevenueCat; cổng thanh toán web |
| Phân tích và vận hành | Firebase Analytics, Crashlytics, Remote Config, FCM |
| Trình duyệt | Chrome, Safari, Firefox, Edge bản mới |

Lưu ý rủi ro: trình duyệt di động (đặc biệt Safari iOS) có thể xóa dữ liệu của trang ít dùng, vì vậy cần khuyến khích cài PWA và cung cấp mã sao lưu ngay từ đầu.

## 16. Phạm vi và lộ trình

Dự án làm theo **hai giai đoạn có cổng chặn**. Giai đoạn 1 chỉ trả lời một câu hỏi: *game có vui không* (mục 1.2). Không làm máy chủ, quảng cáo, IAP hay live-ops cho đến khi qua cổng. Lý do: kế hoạch cũ cần khoảng 560 giờ (28 tuần × 20 giờ) cho 12 màn, 9 boss, 8 mini-boss, \~350 spritesheet, backend, kiếm tiền và endgame; riêng một màn kiểu này có boss đã mất khoảng 80–150 giờ với một người làm.

**Giai đoạn 1: chứng minh game vui (MVP)**

| Mốc | Nội dung | Tiêu chí hoàn thành |
| --- | --- | --- |
| **Prototype** | Điều khiển + 1 màn xám + 1 boss | Nhảy–lướt–bắn *sướng* trên cả PC và **cảm ứng** (cảm ứng là tiêu chí chính) |
| **Vertical slice** | Prologue + Stage 1 + Thorna, cây kỹ năng rút gọn | Onboarding ≥ 90% |
| **MVP** | Prologue + Stage 1–4 (Verdant, Prism, Cryo, Cirrus) + 4 boss, Hub dạng menu, Xưởng (kỹ năng, module), Shop chỉ có Upgrade, 3 độ khó (Cốt truyện, Thường, Thử thách), lưu cục bộ + mã sao lưu, bản web | Qua **cổng MVP** bên dưới |

**Cổng MVP** (đo với \~50 người chơi thử bản web, không có quảng cáo hay IAP) `[PLACEHOLDER]`:

- Hoàn thành Prologue ≥ 90%; hoàn thành Stage 1 ≥ 70%; ≥ 50% người bắt đầu chơi xong cả 4 màn.
- Quay lại chơi ngày hôm sau ≥ 35%.
- ≥ 60% người chơi xong nói muốn chơi tiếp màn 5; ≥ 70% dùng đúng vũ khí khắc chế ở ít nhất 2 boss.
- Chênh lệch tỷ lệ thua giữa cảm ứng và bàn phím ≤ 40% (mục 17).

Không qua cổng thì sửa cảm giác chơi và thiết kế màn, **không** thêm hệ thống.

**Giai đoạn 2: mở rộng (chỉ sau khi qua cổng MVP)**

| Mốc | Nội dung | Tiêu chí hoàn thành |
| --- | --- | --- |
| **Alpha** | Stage 5–8 + Hub đầy đủ + toàn bộ hệ thống RPG + Shop đầy đủ | Kinh tế và lưu dữ liệu không vỡ |
| **Beta** | Citadel + 3 kết thúc + cloud save + bảng xếp hạng cơ bản + khung máy chủ và analytics | Playtest cân bằng theo mức upgrade |
| **Live-ops MVP** | Đăng nhập, 7 ngày tân thủ, vòng quay, nhiệm vụ ngày; rewarded ads; IAP Gem, Starter Pack, Cyber+; Gem do máy chủ giữ; Remote Config; đồng ý quảng cáo và xác nhận tuổi | Mua và khôi phục đúng; không lỗi nhân đôi Gem |
| **Endgame MVP** | Farm Run, Boss Hunt, Chip Lõi, Sweep, Weapon Mastery, bảng xếp hạng Tiêu chuẩn | Vòng farm 3–6 phút; tỷ lệ rơi hiển thị đúng |
| **Soft launch** | Việt Nam cộng một thị trường tiếng Anh nhỏ, 4–6 tuần | Qua cổng KPI (mục 17) |
| **Ra mắt toàn cầu và mùa đầu** | Eclipse Rift, Season Pass, sự kiện, kiếm tiền bản web, iOS, độ khó Ác mộng/Huyền thoại/Overclock | KPI ổn định 2 tuần |
| **Sau ra mắt** | Mỗi 2 tuần 1 sự kiện, mỗi 4 tuần 1 mùa, mỗi tháng 1 bản vá cân bằng | Nhịp nội dung ổn định |

## 17. Chỉ số thành công và định nghĩa “hỏng”

**Chỉ số mục tiêu `[PLACEHOLDER]`:**

| Chỉ số | Mục tiêu |
| --- | --- |
| Hoàn thành Prologue | ≥ 90% |
| Hoàn thành màn ở lần chơi đầu | Stage 1 ≥ 70%; từ Stage 2 trở đi 35–60% mỗi màn sau tối đa 8 lần chết trung bình |
| Hoàn thành cốt truyện chính | ≥ 25% |
| Giữ chân ngày 1 / 7 / 30 | 35–40% / 12–15% / 5–6% |
| Người trả tiền | 1–3% DAU |
| Có subscription | 0,5–1,5% DAU |
| Chọn xem rewarded ads | 40–60% người chơi hoạt động |
| Interstitial mỗi người mỗi ngày | ≤ 2 |
| Người hoàn thành cốt truyện vẫn chơi endgame sau 7 ngày | ≥ 40% |
| Crash-free | ≥ 99% |
| Thời gian vào game | ≤ 3 giây |

**Được coi là “hỏng” khi:**

- Hơn 30% người thử bỏ cuộc ở cùng một đoạn.
- Người chơi cảm ứng thua nhiều hơn người chơi bàn phím trên 40% ở cùng màn (mất cân bằng điều khiển).
- Một build cho thời gian hoàn thành chênh quá 2× so với dự kiến.
- Có chuỗi kỹ năng/module làm boss chết trong dưới 10% thời gian thiết kế.

## 18. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
| --- | --- | --- |
| Điều khiển cảm ứng kém chính xác | Cao | Playtest sớm, Assist, bố cục tùy chỉnh, lướt/nhảy có buffer |
| Phạm vi quá lớn (8 màn + Citadel + Shop + cloud + live-ops + endgame + kiếm tiền) | Rất cao | Hai giai đoạn có cổng chặn (mục 16): MVP 4 màn, không máy chủ và không kiếm tiền cho đến khi qua cổng; tái sử dụng asset, cắt hoạt ảnh ít quan trọng |
| Bị coi là pay-to-win | Cao | Không bán chỉ số hay Chip Lõi; bảng Tiêu chuẩn; cùng trần sức mạnh cho mọi người |
| Mệt vì quảng cáo | Trung bình | Rewarded tự nguyện; interstitial giới hạn bằng Remote Config; Cyber+ tắt hẳn |
| Gian lận (Gem, rơi đồ, bảng xếp hạng) | Cao | Máy chủ giữ gốc, kiểm tra biên lai, seed và chuỗi input |
| Tuân thủ (độ tuổi, đồng ý quảng cáo, công bố tỷ lệ, subscription) | Cao | 13+, UMP và ATT, hiển thị tỷ lệ, khôi phục giao dịch, tư vấn pháp lý |
| Kinh tế lạm phát hoặc thiếu hụt (Gem, vật liệu, Core Bit) | Trung bình | Mô hình nguồn–chi, theo dõi hằng tuần, chỉnh bằng Remote Config |
| Chi phí máy chủ tăng theo người chơi | Trung bình | Gói miễn phí, ghi dữ liệu thưa, giới hạn tần suất |
| Mất dữ liệu | Trung bình | Cloud save, mã sao lưu, không tự gộp khi xung đột |
| Tương đồng quá mức với Megaman | Trung bình | Tên, thiết kế, vũ khí, cốt truyện nguyên bản; chỉ kế thừa cơ chế thể loại |
| Hiệu năng trên máy yếu | Trung bình | Ngân sách hạt, tải theo màn, chế độ giảm hiệu ứng |
| Asset do AI tạo không nhất quán | Cao | Style bible, ảnh tham chiếu, script xử lý, chỉnh tay (gói 05-Assets) |

## 19. Câu hỏi mở

**Đã chốt (15–16/10/2026):**

- Không có nút donate.
- Cloud save và bảng xếp hạng làm ngay trong bản đầu.
- Giữ Kai làm nhân vật chính duy nhất; skin đổi riêng từng bộ phận.
- Có Shop skin, booster, upgrade và 3 độ khó mới (Ác mộng, Huyền thoại, Overclock).
- Không lồng tiếng.
- Công cụ: Phaser 3 + TypeScript.
- Chuyển sang free-to-play, mô hình A (tiện ích và mỹ phẩm, không bán ngẫu nhiên bằng tiền).
- Độ tuổi 13+, có xác nhận tuổi và đồng ý quảng cáo.
- Cyber+ tháng, năm và Lifetime; Gem mua tiện ích Farm trong giới hạn.
- Phát hành Android và web PC trước, iOS sau; soft launch ở Việt Nam cộng một thị trường tiếng Anh nhỏ.
- Dịch vụ: Supabase, RevenueCat, AdMob/H5 Games Ads, Firebase.

* Đưa tên kẻ địch và mini-boss đề xuất cho Stage 2–8 vào GDD chính thức (mục 9.1) và gán Capsule cho từng màn (mục 6.3).

**Còn mở:**

1. Giá cuối của Gem, skin, booster, upgrade và Cyber+ sau playtest kinh tế.
2. Thị trường tiếng Anh cụ thể cho soft launch (hiện chỉ giả định).
3. Cập nhật 66 wireframe hiện có và vẽ thêm khoảng 22 màn cho Gem, Cyber+, live-ops, Vùng Eclipse.
4. Chạy lại mô phỏng kinh tế endgame và Gem bằng số liệu playtest (mô hình đã có ở tab Cân bằng kinh tế, phần B).

## 20. Nhật ký thay đổi

| Phiên bản | Ngày | Thay đổi |
| --- | --- | --- |
| 0.4 | 16/10/2026 | Chuyển sang free-to-play: IAP (Gem), quảng cáo, subscription Cyber+; thêm endgame Vùng Eclipse (Farm Run, Boss Hunt, Rift), Chip Lõi, Weapon Mastery, live-ops; chốt các quyết định mô hình A, 13+, Android + web trước; cập nhật nền tảng, máy chủ, lộ trình, KPI, rủi ro; hiệu chỉnh kinh tế endgame và Gem bằng mô phỏng (Cyber+ +10 Gem/ngày, thời gian endgame) |
| 0.3 | 16/10/2026 | Thêm đặc tả Prologue & Stage 1, Hub & Shop, cân bằng kinh tế; đưa tên kẻ địch/mini-boss Stage 2–8 và Capsule theo màn vào GDD; rà soát và sửa mâu thuẫn |
| 0.2 | 15/10/2026 | Chốt câu hỏi mở: bỏ donate; thêm cloud save và bảng xếp hạng; thêm Shop (skin từng bộ phận, booster, upgrade); thêm 3 độ khó; không lồng tiếng; chọn Phaser 3 + TypeScript |
| 0.1 | 15/10/2026 | Bản nháp đầu tiên: tổng quan, cốt truyện, cơ chế, RPG, kinh tế, kỹ thuật, lộ trình |
