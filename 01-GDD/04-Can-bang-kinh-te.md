# Cân bằng kinh tế toàn game

Mô hình để kiểm tra Core Bit và Data Chip kiếm được có đủ trả cho Shop (skin, booster, upgrade) mà không bắt người chơi cày màn cũ. Tất cả là giả thuyết `[PLACEHOLDER]`, tính từ thông số đã có trong GDD và hai đặc tả trước. Phạm vi: chỉ phần cốt truyện (Core Bit, Data Chip); Gem, vật liệu và endgame cần mô hình riêng trước Alpha (GDD 0.4).

## 1. Mục tiêu và giả định

**Mục tiêu thiết kế**

- Người chơi chỉ chơi tiến trình bình thường vẫn mua đều đặn, không phải cày màn cũ.
- Hoàn thiện toàn bộ Shop (trừ booster, vốn là chi tiêu định kỳ) vào khoảng giữa lượt Overclock.
- Không có tiền tệ nào dư vô hạn quá sớm hoặc thiếu đến mức phải cày.

**Giả định của mô hình**

| Giả định | Giá trị `[PLACEHOLDER]` |
| --- | --- |
| Core Bit lượt chơi đầu (độ khó Thường) | 7.800 (8 màn + 3 màn Citadel + màn cuối) |
| Thời gian lượt đầu | 8–10 giờ, khoảng 780–975 Core Bit mỗi giờ |
| Hệ số thưởng theo độ khó | Thường ×1, Thử thách ×1,5, Ác mộng ×2, Huyền thoại ×3, Overclock ×4 |
| Cách chi (mô hình) | 60% upgrade, 20% skin, 20% booster; người chơi thật sẽ tự phân bổ khác |
| Giá upgrade cấp n | Giá cấp 1 × 1,8^(n − 1) |
| Hành vi | Mỗi độ khó được chơi hết một lượt theo thứ tự mở khóa |

## 2. Nguồn thu Core Bit

Thu theo màn tăng đều: Stage n thu `225 + 75 × (n − 1)` Core Bit ở độ khó Thường. Thu nhập không phụ thuộc thứ tự người chơi chọn màn. Stage 1 khớp ước tính \~225 trong đặc tả Prologue & Stage 1.

| Màn | Core Bit (Thường) | Tích lũy |
| --- | --- | --- |
| Stage 1 | 225 | 225 |
| Stage 2 | 300 | 525 |
| Stage 3 | 375 | 900 |
| Stage 4 | 450 | 1.350 |
| Stage 5 | 525 | 1.875 |
| Stage 6 | 600 | 2.475 |
| Stage 7 | 675 | 3.150 |
| Stage 8 | 750 | 3.900 |
| Citadel 1 | 800 | 4.700 |
| Citadel 2 | 900 | 5.600 |
| Citadel 3 | 1.000 | 6.600 |
| Màn cuối (AEGIS) | 1.200 | 7.800 |

| Độ khó | Hệ số | Thu của lượt chơi | Tích lũy sau lượt |
| --- | --- | --- | --- |
| Thường | ×1 | 7.800 | 7.800 |
| Thử thách | ×1,5 | 11.700 | 19.500 |
| Ác mộng | ×2 | 15.600 | 35.100 |
| Huyền thoại | ×3 | 23.400 | 58.500 |
| Overclock | ×4 | 31.200 | 89.700 |

## 3. Chi tiêu: tổng giá trị Shop

| Hạng mục | Chi tiết | Tổng Core Bit |
| --- | --- | --- |
| Upgrade | Buster Core 8.948; Armor Plating 8.948; Energy Cell 6.711; Sub-Tank Cap 5.936; Dash Coil 3.624; Magnet Range 1.510; Booster Slot 2.000 | **37.677** |
| Skin Thường | 12 món × \~550 | 6.600 |
| Skin Hiếm | 6 món × \~2.250 | 13.500 |
| Skin Sử thi | 6 món, trả bằng Data Chip (mục 5) | 0 |
| Skin Thành tựu | Không bán | 0 |
| **Cộng vĩnh viễn** |  | **57.777** |
| Booster | 6 loại, 100–400 mỗi cái, chi định kỳ theo ý người chơi | \~20% thu nhập |

Module không tính vào chi Core Bit vì nhận qua nhiệm vụ phụ (8 module, mục 7 của đặc tả Hub).

## 4. Mô hình tiến trình theo độ khó

| Độ khó | Thu của lượt chơi | Tích lũy khi bắt đầu | Upgrade khi bắt đầu → kết thúc |
| --- | --- | --- | --- |
| Thường | 7.800 | 0 | 0% → 12% |
| Thử thách | 11.700 | 7.800 | 12% → 31% |
| Ác mộng | 15.600 | 19.500 | 31% → 56% |
| Huyền thoại | 23.400 | 35.100 | 56% → 93% |
| Overclock | 31.200 | 58.500 | 93% → 100% (đạt 100% ở giữa lượt) |

(Phần trăm upgrade = 60% thu nhập tích lũy chia cho 37.677.)

**Hoàn thiện Shop:** nếu 20% thu nhập đi vào booster thì 80% còn lại dành cho vật phẩm vĩnh viễn, đủ 57.777 Core Bit khi tích lũy đạt khoảng 72.200, tức khoảng 44% lượt Overclock. Người chơi không bị buộc phải cày: mỗi độ khó đều thưởng nhiều hơn độ khó trước.

**Dòng mua điển hình ở lượt Thường đầu tiên** (theo mô hình 60/20/20):

| Tích lũy | Người chơi mua được khoảng |
| --- | --- |
| 225 (hết Stage 1) | Chưa đủ upgrade; 1 booster rẻ (Magnet Pulse 120) hoặc để dành |
| 900 (hết Stage 3) | 1 upgrade cấp 1 (400), 1 booster |
| 3.900 (hết Stage 8) | 4 upgrade cấp 1–2, 1 skin Thường, \~5 booster |
| 7.800 (hết lượt đầu) | Upgrade \~12% (cấp 2–3 ở 3 loại), \~3 skin Thường, \~10 booster |

Nếu người chơi dồn toàn bộ tiền vào upgrade thì sau Stage 2 (525) đã mua được upgrade cấp 1 (400): khớp mục tiêu "món lớn đầu tiên sau 1–2 màn".

## 5. Data Chip: nguồn và chi

Data Chip hữu hạn, chỉ nhận một lần cho mỗi nguồn, không mua được.

| Nguồn | Số lượng | Ghi chú |
| --- | --- | --- |
| Nhiệm vụ phụ | 8 | 1 mỗi màn |
| Phòng bí mật đầu tiên mỗi màn | 8 | 1 mỗi màn |
| Thành tựu nhỏ | \~10 | 1 mỗi thành tựu |
| Lần đầu phá đảo Thử thách, Ác mộng, Huyền thoại, Overclock | 12 | 3 mỗi độ khó |
| **Tổng cung** | **\~38** |  |

| Chi | Số lượng |
| --- | --- |
| 6 skin Sử thi × 3–6 Data Chip (trung bình 4,5) | \~27 |
| Dự phòng cho module hiếm và upgrade đặc biệt về sau | \~8 |
| **Tổng cầu** | **\~35** |

Cung vượt cầu khoảng 3 chip: đủ để mua mọi thứ nếu người chơi làm gần hết nhiệm vụ và thành tựu, nhưng không dư thừa.

## 6. Lạm phát, thiếu hụt và cách chỉnh

| Tín hiệu | Ngưỡng cảnh báo `[PLACEHOLDER]` | Cách xử lý |
| --- | --- | --- |
| Dư Core Bit | Tồn trên 5.000 mà không còn món muốn mua | Thêm skin hoặc booster mới trong bản cập nhật miễn phí; không thêm sink ép buộc |
| Thiếu Core Bit sớm | Hơn 30% người chơi chưa đủ tiền cho món đầu tiên sau Stage 2 | Tăng thu Stage 1–3 khoảng 15% hoặc giảm giá upgrade cấp 1 |
| Phải cày | Hơn 15% người chơi lặp lại màn đã xong chỉ để kiếm tiền trong 3 màn đầu | Tăng thu theo độ khó thay vì khuyến khích lặp màn cũ |
| Booster nuốt ngân sách | Booster chiếm hơn 40% chi tiêu | Giảm giá booster hoặc tăng booster tặng khi hoàn thành màn lần đầu |
| Upgrade lệch | Một loại upgrade chiếm hơn 40% tổng chi upgrade | Cân lại hiệu ứng mỗi cấp của loại đó |

Sau khi hoàn thiện Shop, Core Bit còn dư chỉ dùng cho booster và skin mới ở các bản cập nhật sau ra mắt (miễn phí).

## 7. Điều chỉnh đã áp dụng vào GDD

Mô hình phát hiện hai chỗ lệch với bản trước, đã sửa:

1. **Skin Sử thi:** giá đổi từ 5–10 Data Chip xuống **3–6 Data Chip**, vì nguồn Data Chip (\~38) không đủ cho 6 skin × 7,5 = 45.
2. **Mức upgrade dự kiến theo độ khó:** thay vì một con số mỗi độ khó, ghi rõ khoảng đầu → cuối lượt chơi (0 → 12%, 12 → 31%, 31 → 56%, 56 → 93%, 93 → 100%). Độ khó nên được cân quanh mức giữa khoảng đó.
3. **Data Chip mới:** lần đầu phá đảo Thử thách, Ác mộng, Huyền thoại, Overclock thưởng 3 Data Chip mỗi lần.

Giữ nguyên: hệ số giá upgrade 1,8, hệ số thưởng theo độ khó, giá booster và giá skin Thường/Hiếm.

## 8. Tham số tinh chỉnh và cách đo khi playtest

| Tham số | Giá trị hiện tại | Ảnh hưởng | Chỉnh khi |
| --- | --- | --- | --- |
| Thu Stage n | 225 + 75 × (n − 1) | Tốc độ kiếm tiền | Thiếu hoặc dư Core Bit |
| Hệ số thưởng độ khó | 1 / 1,5 / 2 / 3 / 4 | Tốc độ nâng cấp ở độ khó cao | Độ khó cao mà thiếu upgrade |
| Hệ số giá upgrade | 1,8 | Độ dốc chi phí | Cấp cuối quá đắt hoặc quá rẻ |
| Giá skin Thường / Hiếm | 300–800 / 1.500–3.000 | Sink thẩm mỹ | Skin không ai mua hoặc mua hết quá sớm |
| Giá booster | 100–400 | Chi định kỳ | Booster nuốt ngân sách |
| Data Chip thưởng | Nhiệm vụ 1, bí mật 1, độ khó 3 | Tốc độ mở skin Sử thi | Cung lệch cầu |

**Số liệu cần ghi khi playtest (ẩn danh):** Core Bit kiếm được mỗi màn và độ khó; số dư cuối mỗi màn; mỗi giao dịch (món, giá, số dư trước và sau); thời gian đến lần mua đầu tiên; số lần lặp lại màn đã hoàn thành; booster dùng mỗi màn; tỷ lệ chi theo loại.

**Mục tiêu đo `[PLACEHOLDER]`:**

- [ ] ≥ 70% người chơi đủ tiền cho món đầu tiên trước khi kết thúc Stage 2.
- [ ] Số dư cuối mỗi màn trung bình ≤ 1,5 lần thu của màn đó.
- [ ] Tỷ lệ chi: upgrade 50–70%, skin 10–30%, booster 10–30%.
- [ ] Mức upgrade ở đầu và cuối mỗi độ khó lệch ≤ 10 điểm phần trăm so với mô hình mục 4.
- [ ] Không ai phải lặp màn đã xong chỉ để kiếm tiền trong 3 màn đầu (dưới 15%).

# Phần B: Endgame, Gem và kiếm tiền (GDD 0.4)

Phần A ở trên chỉ tính cốt truyện. Phần B mô hình hóa endgame (Chip Lõi, Mastery), Gem và doanh thu, bằng mô phỏng Monte Carlo (4.000 lần mỗi mục tiêu). Mã mô phỏng nằm trong gói tải xuống (`04-Dev-Plan/tools/economy_sim.py`) để chạy lại khi chỉnh tham số. Mọi con số là `[PLACEHOLDER]`.

## 9. Giả định của phần B

| Giả định | Giá trị |
| --- | --- |
| Thời lượng một Farm Run hoặc Boss Hunt | \~5 phút |
| Chip rơi mỗi lượt | Farm Run 3 chip; Boss Hunt 2 chip (cùng bộ với boss) |
| Độ hiếm và pity | Legendary 1,9% (pity 80 chip), Mythic 0,1% (pity 600 chip) |
| Core Bit mỗi lượt | \~250 ở Mức Eclipse trung bình |
| Tinh thể mỗi lượt Boss Hunt | 4 |
| Mảnh vũ khí mỗi Farm Run | 6 (vũ khí của boss màn đó) |
| Chi phí nâng Chip lên cấp n | Core Bit `200 × 1,2^(n−1)`; Tinh thể `ceil(n/2)` |
| Chi phí Mastery cấp n | `6 × n` Mảnh vũ khí |
| Người chơi thường | 30 phút mỗi ngày (6 lượt thủ công) |

## 10. Kết quả mô phỏng rơi Chip Lõi

| Mục tiêu | Lượt trung bình | Trung vị | p90 | Giờ trung bình |
| --- | --- | --- | --- | --- |
| Chip Legendary đầu tiên | 13,5 | 12 | 27 | 1,1 |
| 4 trong 6 ô Legendary cùng bộ | 114 | 108 | 176 | 9,5 |
| Đủ 6 ô Legendary cùng bộ | 291 | 270 | 459 | 24,3 (p90: 38) |
| Chip Mythic đầu tiên | 151 | 200 | 200 | 12,6 (tối đa 16,7) |

Trung vị Mythic bằng 200 vì bảo hiểm xui (600 chip) chốt ở đó: người chơi chắc chắn có Mythic sau tối đa khoảng 17 giờ. Legendary đầu tiên đến nhanh (khoảng 1 giờ), giúp người chơi thấy tiến bộ ngay.

## 11. Chi phí nâng cấp và vật liệu

| Hạng mục | Số lượng | Ghi chú |
| --- | --- | --- |
| Core Bit nâng 1 Chip từ +0 lên +15 | 14.408 |  |
| Core Bit nâng 6 Chip | 86.448 | \~346 lượt ở 250 Core Bit mỗi lượt |
| Tinh thể nâng 6 Chip | 384 | \~96 lượt Boss Hunt; không phải nút thắt |
| Mảnh vũ khí để Mastery 10 cho 1 vũ khí | 330 | \~55 Farm Run (\~4,6 giờ) |
| Mảnh vũ khí cho cả 8 vũ khí | 2.640 | \~37 giờ nhưng chơi song song với farm Chip |

**Nút thắt là Core Bit** (346 lượt) chứ không phải rơi đồ (291 lượt), nên nâng cấp Chip là nơi tiêu Core Bit chính ở endgame như mong muốn. Một bộ Legendary đủ 6 ô và nâng +15 mất khoảng **29 giờ** (p90 khoảng 40 giờ); cả 8 bộ khoảng 230 giờ.

## 12. Gem: nguồn và chi

| Nguồn Gem (người chơi miễn phí) | Gem mỗi ngày | Ghi chú |
| --- | --- | --- |
| Đăng nhập 30 ngày | \~7 | (4×15 + 50 + 100) / 30 |
| Vòng quay | \~3 (không quảng cáo) / \~9 (3 lượt) | Giá trị kỳ vọng 3 Gem mỗi lượt |
| Nhiệm vụ ngày | \~10 | `[PLACEHOLDER]` |
| Nhiệm vụ tuần | \~7 | 50 Gem mỗi tuần |
| Làn Free Season Pass | \~3,5 | \~100 Gem mỗi mùa |
| Sự kiện, thành tựu | \~3 |  |
| **Tổng** | **\~34 (không quảng cáo), \~40 (có quảng cáo)** |  |

Một skin Premium (400–1.200 Gem) mất 12–35 ngày với người chơi miễn phí: đủ chậm để có lý do mua, đủ nhanh để không thấy vô vọng.

**Giá mỗi Gem theo gói (USD):** 0,0124 (gói 0,99), 0,0115, 0,0111, 0,0105, 0,0100, 0,0096, 0,0093 (gói 99,99).

**Kiểm tra Cyber+:** với +30 Gem mỗi ngày như bản trước, một tháng nhận 900 Gem cộng 90 Gem từ vòng quay, tương đương khoảng 11 USD theo giá gói 4,99 nhưng chỉ thu 2,99 USD, làm yếu doanh thu gói Gem. Đã giảm xuống **+10 Gem mỗi ngày**: 300 Gem + 90 Gem vòng quay ≈ 390 Gem ≈ 4,3 USD, cộng tắt quảng cáo và thêm Sweep.

### Chi Gem cho tiện ích (không bán sức mạnh)

| Tiện ích | Giá Gem | Giới hạn mỗi ngày | Tối đa Gem mỗi ngày |
| --- | --- | --- | --- |
| Vé Farm đôi | 20 | 5 | 100 |
| Sweep thêm | 10 | 5 | 50 |
| **Tổng** |  |  | **150 (\~4.500 mỗi tháng, \~50 USD)** |

### Tốc độ farm theo nhóm người chơi

Tính theo "lượt tương đương" mỗi ngày (6 lượt thủ công, mỗi Sweep = 0,5 lượt, mỗi lượt thưởng gấp đôi = +1 lượt):

| Nhóm | Sweep | Gấp đôi | Lượt tương đương mỗi ngày | Ngày để xong 1 bộ Legendary +15 (346 lượt) |
| --- | --- | --- | --- | --- |
| Miễn phí (có xem quảng cáo) | 7 | 5 | 14,5 | \~24 |
| Cyber+ | 12 | 5 | 17 | \~20 |
| Chi Gem tối đa | 17 | 10 | 24,5 | \~14 |

Người chi tiền nhiều nhất nhanh hơn người miễn phí khoảng **1,7 lần** nhưng **cùng một trần sức mạnh**. Lợi thế ở bảng xếp hạng "Mở" chỉ kéo dài tới khi người khác cũng đủ bộ, và Rift reset mỗi mùa; bảng Tiêu chuẩn không bị ảnh hưởng.

## 13. Doanh thu (đã hiệu chỉnh)

Công thức: ARPDAU quảng cáo = (rewarded mỗi DAU × eCPM rewarded + interstitial mỗi DAU × eCPM interstitial) / 1.000; ARPDAU IAP = (% người trả tiền trong MAU × chi tiêu mỗi tháng) / 30 / (DAU/MAU, giả định 20%); ARPDAU subscription = % có sub trong DAU × giá mỗi ngày.

| Kịch bản | Quảng cáo | IAP | Subscription | Tổng ARPDAU | Doanh thu tháng (10.000 DAU, trước phí) |
| --- | --- | --- | --- | --- | --- |
| Thận trọng | 0,008 | 0,013 | 0,0004 | 0,022 | \~6.500 USD |
| Cơ sở | 0,023 | 0,038 | 0,0008 | 0,061 | \~18.200 USD |
| Lạc quan | 0,060 | 0,080 | 0,002 | 0,142 | \~42.600 USD |

Giả định: thận trọng 2 rewarded (eCPM 3 USD) + 1 interstitial (2 USD), 1% trả tiền × 8 USD/tháng, 0,5% có sub; cơ sở 3 rewarded (6 USD) + 1,5 interstitial (3 USD), 2,5% × 9 USD, 1% sub; lạc quan 4 rewarded (12 USD) + 2 interstitial (6 USD), 4% × 12 USD, 2,5% sub. eCPM thay đổi mạnh theo quốc gia.

**Điều chỉnh quan trọng:** bản trước ước tính ARPDAU subscription cao gấp khoảng 10 lần thực tế. Subscription chủ yếu để tắt quảng cáo và tăng giữ chân; **doanh thu chính đến từ IAP (Gem, Starter Pack, Season Pass) và quảng cáo rewarded**.

## 14. Điều chỉnh đã áp dụng vào GDD

1. Cyber+: **+30 Gem mỗi ngày → +10 Gem mỗi ngày** (GDD mục 10.1, tab kế hoạch kiếm tiền mục 5.3 và 8.2, `monetization.json`).
2. Mục tiêu thời gian endgame: từ 40–60 giờ xuống **khoảng 25–35 giờ cho một bộ Legendary +15**, hơn 200 giờ cho cả 8 bộ và Mythic (GDD mục 1, tab kế hoạch mục 7.4).
3. Bảng dự báo doanh thu: sửa dòng subscription và tổng (tab kế hoạch mục 9).
4. Ghi công thức chi phí vào `endgame.json`: nâng Chip `200 × 1,2^(n−1)` Core Bit và `ceil(n/2)` Tinh thể; Mastery `6 × n` Mảnh.

## 15. Chỉ số theo dõi khi playtest và soft launch

| Chỉ số | Mục tiêu | Chỉnh khi |
| --- | --- | --- |
| Giờ đến Legendary đầu tiên (trung vị) | ≤ 2 | Quá chậm: tăng tỷ lệ hoặc giảm pity |
| Giờ đến bộ Legendary đủ 6 ô (trung vị) | 20–30 | Lệch ±30%: chỉnh tỷ lệ, số chip mỗi lượt |
| Tồn Core Bit ở endgame | ≤ 2 lần chi phí nâng tiếp theo | Dư: tăng chi phí nâng; thiếu: tăng Core Bit mỗi lượt |
| Gem miễn phí mỗi ngày (trung vị) | 30–40 | Lệch: chỉnh nhiệm vụ và thưởng đăng nhập |
| Tỷ lệ dùng vé Farm đôi và Sweep mua bằng Gem | Theo dõi | Quá cao ở nhóm trả nhiều: xem lại giới hạn mỗi ngày |
| Khoảng cách tốc độ nhóm trả nhiều / miễn phí | ≤ 2× | Vượt: giảm giới hạn mỗi ngày |
| ARPDAU thực tế | So với bảng mục 13 | Thấp hơn kịch bản thận trọng: xem lại quảng cáo và gói IAP |
