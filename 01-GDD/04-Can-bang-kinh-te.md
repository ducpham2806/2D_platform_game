# Cân bằng kinh tế toàn game

Mô hình để kiểm tra Core Bit và Data Chip kiếm được có đủ trả cho Shop (skin, booster, upgrade) mà không bắt người chơi cày màn cũ. Tất cả là giả thuyết `[PLACEHOLDER]`, tính từ thông số đã có trong GDD và hai đặc tả trước. Phạm vi: Phần A (mục 1–8) là cốt truyện (Core Bit, Data Chip); Phần B (mục 9–15) là endgame, Gem và doanh thu.

Cập nhật 14/11/2026 (rà soát `/consistency-check` + `/balance-check`): luật thưởng ở mục 2, trần Core Bit ngoài màn và cột live-ops ở mục 4, Data Chip ở mục 5, Farm Run và Gem ở phần B, doanh thu tính lại ở mục 13. Danh sách ở mục 7 và 14.

## 1. Mục tiêu và giả định

**Mục tiêu thiết kế**

- Người chơi chỉ chơi tiến trình bình thường vẫn mua đều đặn, không phải cày màn cũ.
- Hoàn thiện toàn bộ upgrade vào khoảng cuối lượt Thử thách hoặc đầu endgame; skin là sink thẩm mỹ dài hạn, mua tiếp bằng Core Bit ở endgame.
- Không có tiền tệ nào dư vô hạn quá sớm hoặc thiếu đến mức phải cày.

**Giả định của mô hình**

| Giả định | Giá trị `[PLACEHOLDER]` |
| --- | --- |
| Core Bit lượt chơi đầu (độ khó Thường) | 7.800 (8 màn + 3 màn Citadel + màn cuối) |
| Thời gian lượt đầu | 8–10 giờ, khoảng 780–975 Core Bit mỗi giờ |
| Nhịp chơi (để tính live-ops) | Mỗi lượt (Thường, Thử thách) khoảng 12 ngày × 45 phút; lượt Thường thu \~650 Core Bit từ màn mỗi ngày |
| Hệ số thưởng theo độ khó | Cốt truyện ×0,5, Thường ×1, Thử thách ×1,5 (GDD 0.6 bỏ Ác mộng, Huyền thoại, Overclock) |
| Cách chi (mô hình) | 70% upgrade, 15% skin, 15% booster (booster và skin chỉ mở sau boss thứ 4); người chơi thật sẽ tự phân bổ khác |
| Giá upgrade cấp n | Giá cấp 1 × 1,25^(n − 1) |
| Hành vi | Chơi một lượt Thường, rồi một lượt Thử thách (Thử thách mở theo từng màn) |

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

**Luật thưởng (rà soát 14/11):**

- Thu của màn gồm Core Bit kẻ địch và thưởng lần đầu hạ boss. Stage 1 ở Thường: 225 = \~145 từ kẻ địch + 80 thưởng boss.
- **Thưởng boss** (Core Bit, EXP) trả một lần cho mỗi cặp boss–độ khó, nhân `rewardMul` (`11-Do-kho.md` mục 2.3). Vì vậy lượt Thử thách vẫn có thưởng boss.
- **Kẻ địch chỉ trả Core Bit và EXP một lần mỗi lượt vào màn** (`stages.json → mechanics.enemyRewardOncePerRun`). Kẻ địch dựng lại sau khi Kai chết vẫn hạ được nhưng chỉ rơi viên máu. Chết không thành cách cày tiền.
- **Chơi lại màn đã nhận thưởng boss** ở độ khó đó: chỉ nhận Core Bit kẻ địch, tức `(coreBitBase − thưởng boss) × rewardMul`. Stage 1 ở Thường \~145.
- **Gợi ý thiếu tiền ở Quầy** chỉ trỏ màn có trong bản build, tính theo độ khó chọn lần cuối của màn đó (`progress.difficulty[…].last`). Màn đã nhận thưởng boss ở độ khó đó chỉ tính phần kẻ địch.
- **Hai nguồn số thu phải khớp:** `stages.json → coreBitBase` của Stage 1–8 và `economy.json → incomeFormula`. Hiện chưa có kiểm tra; sẽ thêm kiểm tra lúc nạp dữ liệu ở một Story sau.

## 3. Chi tiêu: tổng giá trị Shop

| Hạng mục | Chi tiết | Tổng Core Bit |
| --- | --- | --- |
| Upgrade | Arc Core 3.283; Armor Plating 3.283; Energy Cell 2.052; Nano Cell Cap 2.306; Dash Coil 1.906; Magnet Range 763; Booster Slot 1.000 | **14.593** (giá mỗi cấp làm tròn riêng, sửa 14/11/2026 khi làm EP-09) |
| Skin Thường | 12 món × \~550 | 6.600 |
| Skin Hiếm | 6 món × \~2.250 | 13.500 |
| Skin Sử thi | 6 món, trả bằng Data Chip (mục 5) | 0 |
| Skin Thành tựu | Không bán | 0 |
| **Cộng vĩnh viễn** |  | **34.693** (sửa 14/11: bản trước cộng nhầm 34.691) |
| Booster | 6 loại, 100–400 mỗi cái, chi định kỳ theo ý người chơi | \~20% thu nhập |

Module không tính vào chi Core Bit vì nhận qua nhiệm vụ phụ (8 module, mục 7 của đặc tả Hub).

## 4. Mô hình tiến trình theo độ khó

| Độ khó | Thu của lượt chơi (từ màn) | Tích lũy khi bắt đầu | Upgrade đầu → cuối (chỉ thu từ màn) | Có live-ops, không xem QC | Có live-ops và QC |
| --- | --- | --- | --- | --- | --- |
| Thường | 7.800 | 0 | 0% → 37% | 0% → 43% | 0% → 46% |
| Thử thách | 11.700 | 7.800 | 37% → 94% | 43% → 100% (đủ ở \~94% lượt) | 46% → 100% (đủ ở \~87% lượt) |
| Đầu endgame (Farm Run Mức 1–5, 170–250 Core Bit mỗi lượt) | \~1.000–1.500 mỗi ngày | 19.500 | 94% → 100% sau 5,4 lượt ở Mức 5 (7,9 lượt ở Mức 1) | Đã đủ | Đã đủ |

(Phần trăm upgrade = 70% Core Bit tích lũy chia cho tổng giá upgrade 14.593; đủ 100% khi tích lũy 20.847. Số lượt Farm = (14.593 − 0,7 × 19.500) / (0,7 × Core Bit mỗi lượt). Nếu sau lượt Thử thách dồn hết vào upgrade thì chỉ cần 3,8 lượt ở Mức 5, 5,5 lượt ở Mức 1. Bản trước ghi "3–4 lượt", sửa 14/11.)

**Live-ops trong mô hình** (rà soát 14/11; 12 ngày mỗi lượt, mục 1): Core Bit ngoài màn mỗi ngày = vòng quay thường 45 (kỳ vọng mỗi lượt) + đăng nhập 27,5 (11 ngày × 75 / 30) + lượt quay QC 18 × 2 (chỉ khi xem QC); cộng 400 một lần của 7 ngày tân thủ trong lượt Thường. Lượt Thường: không QC +1.270 (16%), có QC +1.702 (22%), Cyber+ (3 lượt quay QC) +1.918 (25%). Cột "có QC" chưa gồm `AD_DOUBLE`. Nếu nhân `AD_DOUBLE` ×1,5 mọi màn thì lượt Thường lên 0% → 64% và upgrade đủ ở \~39% lượt Thử thách.

**Trần Core Bit ngoài màn (rà soát 14/11):** trong cốt truyện, Core Bit ngoài màn ≤ **25%** Core Bit thu từ màn. Cách giữ trần:

- Vòng quay bảng thường 60/150 Core Bit (trước là 200/500); bảng QC chỉ có 30 Core Bit (`05-Ke-hoach-kiem-tien.md` mục 8.3).
- Ngày thường của lịch đăng nhập 50–100 Core Bit (trước là 150–300).
- Trước khi hạ AEGIS, chỉ đăng nhập, vòng quay và 7 ngày tân thủ cho Core Bit. `AD_GIFT`, rương nhiệm vụ, Season Pass và sự kiện trao booster thay cho phần Core Bit.
- `AD_DOUBLE` trong cốt truyện chỉ ×1,5 (×2 ở endgame). Đây là hệ số trên thu từ màn, tính riêng, không tính vào trần.
- Trần giả định 45 phút chơi mỗi ngày. Người chơi ít hơn có tỷ lệ cao hơn; đo theo nguồn (mục 8) và chỉnh bằng Remote Config.

**Điều kiện của mốc 37/94 (EP-09, quyết định #7):** mô hình tính đủ 7 loại upgrade. Nano Cell Cap, Dash Coil, Booster Slot chưa có tác dụng nên chưa bán. **Chốt (rà soát 14/11): làm tác dụng của ba món này trước Alpha.** Rủi ro nếu không làm: tổng bán được chỉ 9.381 (sau 5 boss là 4.767); upgrade đủ ở khoảng 48% lượt Thử thách; mốc 37/94 phải tính lại; Core Bit dư sớm (ngưỡng mục 6).

**Hoàn thiện Shop:** upgrade (sức mạnh cốt truyện) hoàn thành ở đầu endgame. Skin Thường và Hiếm (tổng 20.100 Core Bit) là sink thẩm mỹ dài hạn: trong cốt truyện chỉ khoảng 2.900 Core Bit (15%) đi vào skin, phần còn lại mua dần bằng Core Bit từ Farm Run. Người chơi không bị buộc phải cày: cốt truyện chỉ cần một lượt Thường, và mọi thứ ảnh hưởng sức mạnh cốt truyện đều đủ sau lượt Thử thách.

**Dòng mua điển hình ở lượt Thường đầu tiên** (theo mô hình 70/15/15, Shop mở sau boss thứ 2, booster và skin sau boss thứ 4):

| Tích lũy | Người chơi mua được khoảng |
| --- | --- |
| 225 (hết Stage 1) | Shop chưa mở; để dành |
| 525 (hết Stage 2) | 1 upgrade cấp 1 (Shop vừa mở) |
| 1.350 (hết Stage 4) | 3 upgrade cấp 1; quầy Booster và Skin vừa mở |
| 3.900 (hết Stage 8) | \~7 cấp upgrade, 1 skin Thường, \~3 booster |
| 7.800 (hết lượt đầu) | Upgrade \~37% (cấp 2–3 ở hầu hết các loại), \~2 skin Thường, \~6 booster |

Nếu người chơi dồn toàn bộ tiền vào upgrade thì sau Stage 2 (525) đã mua được upgrade cấp 1 (400): khớp mục tiêu "món lớn đầu tiên sau 1–2 màn".

## 5. Data Chip: nguồn và chi

Data Chip hữu hạn, chỉ nhận một lần cho mỗi nguồn, không mua được. **Live-ops không cho Data Chip** (rà soát 14/11): đăng nhập, vòng quay, 7 ngày tân thủ và nhiệm vụ tuần trả Gem hoặc mỹ phẩm thay thế (`05-Ke-hoach-kiem-tien.md` mục 8).

**Bản lưu:** Data Chip chưa có trong bản lưu; sẽ thêm `inventory.dataChips` ở bản lưu kế tiếp (cùng Nhiệm vụ phụ, xem `01-GDD/15-Nhiem-vu-phu.md`).

| Nguồn | Số lượng | Ghi chú |
| --- | --- | --- |
| Nhiệm vụ phụ | 8 | 1 mỗi màn |
| Phòng bí mật đầu tiên mỗi màn | 8 | 1 mỗi màn. Stage 2–8: đặt chip khi viết đặc tả màn. Stage 1 hiện chưa có (đặc tả Prologue & Stage 1 chờ cổng Prototype, chưa đổi); thêm khi qua cổng |
| Thành tựu nhỏ | \~10 | 1 mỗi thành tựu |
| Lần đầu phá đảo Thử thách | 3 | |
| Lần đầu hoàn thành mọi màn ở Mức Eclipse 3, 6 và 10 | 9 | 3 mỗi mốc (thay cho ba độ khó đã bỏ) |
| **Tổng cung** | **\~38** |  |

| Chi | Số lượng |
| --- | --- |
| 6 skin Sử thi × 3–6 Data Chip (trung bình 4,5) | \~27 |
| Dự phòng cho module hiếm và upgrade đặc biệt về sau | \~8 |
| **Tổng cầu** | **\~35** |

Cung vượt cầu khoảng 3 chip: đủ để mua mọi thứ nếu người chơi làm gần hết nhiệm vụ và thành tựu, nhưng không dư thừa.

**Vì sao giữ cung 38 bằng phòng bí mật** (thay vì hạ cung xuống 30): cung 30 nhỏ hơn cầu 35, phải bỏ skin Sử thi hoặc phần dự phòng. Chip trong phòng bí mật là thưởng khám phá, đúng trụ cột, không cần hệ thống mới ngoài `inventory.dataChips`. Nếu Stage 1 cuối cùng không có chip, cung còn 37, vẫn hơn cầu 2 chip.

## 6. Lạm phát, thiếu hụt và cách chỉnh

| Tín hiệu | Ngưỡng cảnh báo `[PLACEHOLDER]` | Cách xử lý |
| --- | --- | --- |
| Dư Core Bit | Tồn trên 5.000 mà không còn món muốn mua | Thêm skin hoặc booster mới trong bản cập nhật miễn phí; không thêm sink ép buộc |
| Thiếu Core Bit sớm | Hơn 30% người chơi chưa đủ tiền cho món đầu tiên sau Stage 2 | Tăng thu Stage 1–3 khoảng 15% hoặc giảm giá upgrade cấp 1 |
| Phải cày | Hơn 15% người chơi lặp lại màn đã xong chỉ để kiếm tiền trong 3 màn đầu | Tăng thu theo độ khó thay vì khuyến khích lặp màn cũ |
| Booster nuốt ngân sách | Booster chiếm hơn 40% chi tiêu | Giảm giá booster hoặc tăng booster tặng khi hoàn thành màn lần đầu |
| Live-ops thay màn chơi | Core Bit ngoài màn vượt 25% thu từ màn trong cốt truyện (mục 4) | Giảm Core Bit đăng nhập, vòng quay; không giảm thu từ màn |
| Upgrade lệch | Một loại upgrade chiếm hơn 40% tổng chi upgrade | Cân lại hiệu ứng mỗi cấp của loại đó |

Sau khi hoàn thiện Shop, Core Bit còn dư chỉ dùng cho booster và skin mới ở các bản cập nhật sau ra mắt (miễn phí).

## 7. Điều chỉnh đã áp dụng vào GDD

Mô hình phát hiện bốn chỗ lệch với bản trước, đã sửa:

1. **Skin Sử thi:** giá đổi từ 5–10 Data Chip xuống **3–6 Data Chip**, vì nguồn Data Chip (\~38) không đủ cho 6 skin × 7,5 = 45.
2. **Mức upgrade dự kiến theo độ khó:** thay vì một con số mỗi độ khó, ghi rõ khoảng đầu → cuối lượt chơi: **Thường 0 → 37%, Thử thách 37 → 94%** (mục 4; năm khoảng của sáu độ khó cũ đã bỏ). Độ khó nên được cân quanh mức giữa khoảng đó.
3. **Data Chip mới:** lần đầu phá đảo Thử thách thưởng 3 Data Chip; từ GDD 0.6, ba mốc Mức Eclipse 3, 6, 10 thay cho ba độ khó đã bỏ, mỗi mốc 3 Data Chip.
4. **GDD 0.6, thu gọn độ khó:** bỏ Ác mộng, Huyền thoại, Overclock; giá upgrade hạ (hệ số 1,8 → 1,25, giá cấp 1 của bốn loại giảm) để toàn bộ upgrade đủ sau lượt Thử thách thay vì giữa lượt Overclock.
5. **Rà soát 14/11/2026:** tổng vĩnh viễn 34.693; luật thưởng boss theo cặp, kẻ địch trả thưởng một lần mỗi lượt, chơi lại chỉ nhận phần kẻ địch, gợi ý Quầy (mục 2); trần Core Bit ngoài màn 25%, cột live-ops, số lượt Farm 5,4, điều kiện của mốc 37/94 (mục 4); Data Chip bỏ khỏi live-ops, ghi bản lưu kế tiếp và phòng bí mật (mục 5).

Giữ nguyên: giá booster và giá skin Thường/Hiếm.

## 8. Tham số tinh chỉnh và cách đo khi playtest

| Tham số | Giá trị hiện tại | Ảnh hưởng | Chỉnh khi |
| --- | --- | --- | --- |
| Thu Stage n | 225 + 75 × (n − 1) | Tốc độ kiếm tiền | Thiếu hoặc dư Core Bit |
| Hệ số thưởng độ khó | 0,5 / 1 / 1,5 | Tốc độ nâng cấp ở Thử thách | Thử thách mà thiếu upgrade |
| Hệ số giá upgrade | 1,25 | Độ dốc chi phí | Cấp cuối quá đắt hoặc quá rẻ |
| Giá skin Thường / Hiếm | 300–800 / 1.500–3.000 | Sink thẩm mỹ | Skin không ai mua hoặc mua hết quá sớm |
| Giá booster | 100–400 | Chi định kỳ | Booster nuốt ngân sách |
| Data Chip thưởng | Nhiệm vụ 1, bí mật 1, Thử thách 3, mốc Eclipse 3 | Tốc độ mở skin Sử thi | Cung lệch cầu |
| Trần Core Bit ngoài màn | 25% thu từ màn (cốt truyện) | Vai trò của live-ops so với màn chơi | Vượt trần, hoặc live-ops không ai nhận |

**Số liệu cần ghi khi playtest (ẩn danh):** Core Bit kiếm được mỗi màn và độ khó; Core Bit theo nguồn (màn, live-ops, quảng cáo); số dư cuối mỗi màn; mỗi giao dịch (món, giá, số dư trước và sau); thời gian đến lần mua đầu tiên; số lần lặp lại màn đã hoàn thành; booster dùng mỗi màn; tỷ lệ chi theo loại.

**Mục tiêu đo `[PLACEHOLDER]`:**

- [ ] ≥ 70% người chơi đủ tiền cho món đầu tiên trước khi kết thúc Stage 2.
- [ ] Số dư cuối mỗi màn trung bình ≤ 1,5 lần thu của màn đó.
- [ ] Tỷ lệ chi trong cốt truyện: upgrade 60–80%, skin 10–25%, booster 10–25%.
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
| Core Bit mỗi lượt Farm Run | `150 + 20 × L` ở Mức Eclipse L (Mức 1: 170, Mức 5: 250, Mức 10: 350); chơi 1 đoạn ×0,25, chỉ boss ×0,4 (rà soát 14/11; bản trước luôn 250). Các mục dưới tính ở Mức 5 |
| Sweep | Thưởng như một lượt Farm Run đủ màn ở mức đó, có tính pity, không nhân `AD_DOUBLE`; cần màn đạt 3 sao (`05-Ke-hoach-kiem-tien.md` mục 7.3) |
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
| Core Bit nâng 6 Chip | 86.448 | \~346 lượt ở 250 Core Bit mỗi lượt (Mức 5) |
| Tinh thể nâng 6 Chip | 384 | \~96 lượt Boss Hunt; không phải nút thắt |
| Mảnh vũ khí để Mastery 10 cho 1 vũ khí | 330 | \~55 Farm Run (\~4,6 giờ) |
| Mảnh vũ khí cho cả 8 vũ khí | 2.640 | \~37 giờ nhưng chơi song song với farm Chip |

**Nút thắt là Core Bit** (346 lượt) chứ không phải rơi đồ (291 lượt), nên nâng cấp Chip là nơi tiêu Core Bit chính ở endgame như mong muốn. Một bộ Legendary đủ 6 ô và nâng +15 mất khoảng **29 giờ** (p90 khoảng 40 giờ); cả 8 bộ khoảng 230 giờ.

## 12. Gem: nguồn và chi

| Nguồn Gem (người chơi miễn phí) | Gem mỗi ngày | Ghi chú |
| --- | --- | --- |
| Đăng nhập 30 ngày | \~7,7 | (4×15 + 20 + 50 + 100) / 30; ngày 7 đổi 1 Data Chip thành 20 Gem (rà soát 14/11) |
| Vòng quay | \~5,7 (không quảng cáo) / \~11,7 (thêm 2 lượt QC) | Kỳ vọng 3 Gem mỗi lượt ở cả bảng thường và bảng QC; pity ngày 7 thêm \~2,7 Gem mỗi ngày (27 × 0,94⁶ / 7) |
| Nhiệm vụ ngày | \~10 | `[PLACEHOLDER]` |
| Nhiệm vụ tuần | \~7 | 50 Gem mỗi tuần |
| Làn Free Season Pass | \~3,5 | \~100 Gem mỗi mùa 28 ngày |
| Sự kiện, thành tựu | \~3 |  |
| **Tổng** | **\~37 (không quảng cáo), \~43 (có quảng cáo)** | Bản trước 34/40, chưa tính pity vòng quay |

Một skin Premium (400–1.200 Gem) mất 11–32 ngày với người chơi miễn phí: đủ chậm để có lý do mua, đủ nhanh để không thấy vô vọng.

**Giá mỗi Gem theo gói (USD):** 0,0124 (gói 0,99), 0,0115, 0,0111, 0,0105, 0,0100, 0,0096, 0,0093 (gói 99,99).

**Kiểm tra Cyber+:** với +30 Gem mỗi ngày như bản trước, một tháng nhận 900 Gem cộng 90 Gem từ vòng quay, tương đương khoảng 11 USD theo giá gói 4,99 nhưng chỉ thu 2,99 USD, làm yếu doanh thu gói Gem. Đã giảm xuống **+10 Gem mỗi ngày**: 300 Gem + 90 Gem vòng quay ≈ 390 Gem ≈ 4,3 USD, cộng tắt quảng cáo và thêm Sweep.

**Gói năm và Lifetime (rà soát 14/11):** với 10 Gem mỗi ngày, gói năm 19,99 nhận \~4.745 Gem/năm (≈ 52,7 USD, 0,0042 USD/Gem, rẻ hơn gói 99,99 tới 2,2 lần); Lifetime 24,99 nhận vô hạn. Đã sửa: **gói năm +5 Gem mỗi ngày**, tức (5 + 3 vòng quay) × 365 ≈ 2.920 Gem/năm, 0,0068 USD/Gem (gói 99,99: 0,0093), chấp nhận vì gói năm trả trước 12 tháng. **Lifetime chỉ tắt quảng cáo ép và nhận rewarded ngay**; không Gem mỗi ngày, không skin tháng, không thêm lượt quay hay Sweep.

### Chi Gem cho tiện ích (không bán sức mạnh)

| Tiện ích | Giá Gem | Giới hạn mỗi ngày | Tối đa Gem mỗi ngày |
| --- | --- | --- | --- |
| Vé Farm đôi | 20 | 5 | 100 |
| Sweep thêm | 10 | 5 | 50 |
| **Tổng** |  |  | **150 (\~4.500 mỗi tháng, \~50 USD)** |

### Tốc độ farm theo nhóm người chơi

Tính ở Mức 5 (250 Core Bit mỗi lượt), 6 lượt thủ công mỗi ngày. Rà soát 14/11: Sweep cho thưởng như một lượt (bản trước tính 0,5). Lượt gấp đôi chỉ nhân vật phẩm rơi; `AD_DOUBLE` chỉ nhân Core Bit (6 lần mỗi ngày, không áp cho Sweep). Vì vậy tính riêng hai nút thắt: rơi đồ (291 lượt) và Core Bit (86.448). Ngày xong = số lớn hơn.

| Nhóm | Lượt chơi + Sweep | Gấp đôi (vật phẩm) | `AD_DOUBLE` | Ngày đủ rơi đồ | Ngày đủ Core Bit | Ngày xong 1 bộ Legendary +15 |
| --- | --- | --- | --- | --- | --- | --- |
| Miễn phí, không xem quảng cáo | 6 + 5 | 3 | 0 | \~21 | \~31 | \~31 |
| Miễn phí, có xem quảng cáo | 6 + 7 | 5 | 6 | \~16 | \~18 | \~18 |
| Cyber+ | 6 + 12 | 5 | 6 | \~13 | \~14 | \~14 |
| Chi Gem tối đa | 6 + 17 | 10 | 6 | \~9 | \~12 | \~12 |

(Ngày đủ rơi đồ = 291 / (lượt chơi + Sweep + gấp đôi); ngày đủ Core Bit = 86.448 / ((lượt chơi + Sweep + `AD_DOUBLE`) × 250).)

Người chi tiền nhiều nhất nhanh hơn người miễn phí có xem quảng cáo khoảng **1,5 lần** (bản trước 1,7) nhưng **cùng một trần sức mạnh**. So với người không xem quảng cáo thì khoảng 2,6 lần, vượt mục tiêu 2× ở mục 15: cần theo dõi khi soft launch `[PLACEHOLDER]`. Lợi thế ở bảng xếp hạng "Mở" chỉ kéo dài tới khi người khác cũng đủ bộ, và Rift reset mỗi mùa; bảng Tiêu chuẩn không bị ảnh hưởng.

## 13. Doanh thu (đã hiệu chỉnh)

Công thức: ARPDAU quảng cáo = (rewarded mỗi DAU × eCPM rewarded + interstitial mỗi DAU × eCPM interstitial) / 1.000; ARPDAU IAP = (% người trả tiền trong MAU × chi tiêu mỗi tháng) / 30 / (DAU/MAU, giả định 20%); ARPDAU subscription = % có sub trong DAU × giá mỗi ngày.

| Kịch bản | Quảng cáo | IAP | Subscription | Tổng ARPDAU | Doanh thu tháng (10.000 DAU, trước phí) |
| --- | --- | --- | --- | --- | --- |
| Thận trọng | 0,0070 | 0,0133 | 0,0005 | 0,0208 | \~6.250 USD |
| Cơ sở | 0,0204 | 0,0375 | 0,0010 | 0,0589 | \~17.700 USD |
| Lạc quan | 0,0570 | 0,0800 | 0,0025 | 0,1395 | \~41.800 USD |

Giả định: thận trọng 2 rewarded (eCPM 3 USD) + 0,5 interstitial (2 USD), 1% MAU trả tiền × 8 USD/tháng, 0,5% có sub; cơ sở 2,9 rewarded (6 USD, theo từng vị trí ở `06-Ke-hoach-quang-cao.md` mục 7.1) + 1,0 interstitial (3 USD), 2,5% × 9 USD, 1% sub; lạc quan 4 rewarded (12 USD) + 1,5 interstitial (6 USD), 4% × 12 USD, 2,5% sub. Sub tính giá gói tháng 2,99. eCPM thay đổi mạnh theo quốc gia.

**Rà soát 14/11:** (1) Sửa số học của bảng cũ: quảng cáo cơ sở là 0,0225 (3 × 6 + 1,5 × 3, bản cũ ghi 0,023 ở đây và 0,022 ở tab Kế hoạch kiếm tiền); subscription 0,0010 (cũ 0,0008), thận trọng 0,0005, lạc quan 0,0025. (2) Tính lại interstitial: không hiện sau lần đầu hạ boss chiến dịch, trần chung 2 lượt mỗi ngày, ngày 1 và Cyber+ không có; người đang ở lượt Thường đầu gần như chỉ thấy màn Kết quả sau boss lần đầu. Ước tính cơ sở \~30% DAU \~0 lượt, \~30% (Thử thách, chơi lại) \~1,2, \~40% (endgame) \~1,5, tức \~1,0 `[PLACEHOLDER]`. (3) Rewarded cơ sở 2,9 khớp bảng vị trí. **Bảng này là nguồn duy nhất của dự báo doanh thu**; tab Kế hoạch kiếm tiền mục 9 trỏ về đây.

**Điều chỉnh quan trọng:** bản trước ước tính ARPDAU subscription cao gấp khoảng 10 lần thực tế. Subscription chủ yếu để tắt quảng cáo và tăng giữ chân; **doanh thu chính đến từ IAP (Gem, Starter Pack, Season Pass) và quảng cáo rewarded**.

## 14. Điều chỉnh đã áp dụng vào GDD

1. Cyber+: **+30 Gem mỗi ngày → +10 Gem mỗi ngày** (GDD mục 10.1, tab kế hoạch kiếm tiền mục 5.3 và 8.2, `monetization.json`).
2. Mục tiêu thời gian endgame: từ 40–60 giờ xuống **khoảng 25–35 giờ cho một bộ Legendary +15**, hơn 200 giờ cho cả 8 bộ và Mythic (GDD mục 1, tab kế hoạch mục 7.4).
3. Bảng dự báo doanh thu: sửa dòng subscription và tổng (tab kế hoạch mục 9).
4. Ghi công thức chi phí vào `endgame.json`: nâng Chip `200 × 1,2^(n−1)` Core Bit và `ceil(n/2)` Tinh thể; Mastery `6 × n` Mảnh.
5. **Rà soát 14/11/2026:** Farm Run Core Bit `150 + 20 × L`, 1 đoạn ×0,25, chỉ boss ×0,4 (`endgame.json`); Sweep thưởng như một lượt, bảng tốc độ farm tính lại theo hai nút thắt; Gem miễn phí \~37/43 mỗi ngày (thêm pity vòng quay); Cyber+ gói năm 5 Gem mỗi ngày, Lifetime chỉ tắt quảng cáo ép và nhận rewarded ngay; Season Pass 28 ngày; bảng doanh thu sửa số và tính lại interstitial (mục 13).

## 15. Chỉ số theo dõi khi playtest và soft launch

| Chỉ số | Mục tiêu | Chỉnh khi |
| --- | --- | --- |
| Giờ đến Legendary đầu tiên (trung vị) | ≤ 2 | Quá chậm: tăng tỷ lệ hoặc giảm pity |
| Giờ đến bộ Legendary đủ 6 ô (trung vị) | 20–30 | Lệch ±30%: chỉnh tỷ lệ, số chip mỗi lượt |
| Tồn Core Bit ở endgame | ≤ 2 lần chi phí nâng tiếp theo | Dư: tăng chi phí nâng; thiếu: tăng Core Bit mỗi lượt |
| Gem miễn phí mỗi ngày (trung vị) | 30–40 | Lệch: chỉnh nhiệm vụ và thưởng đăng nhập |
| Tỷ lệ dùng vé Farm đôi và Sweep mua bằng Gem | Theo dõi | Quá cao ở nhóm trả nhiều: xem lại giới hạn mỗi ngày |
| Khoảng cách tốc độ nhóm trả nhiều / miễn phí có xem quảng cáo | ≤ 2× | Vượt: giảm giới hạn mỗi ngày |
| ARPDAU thực tế | So với bảng mục 13 | Thấp hơn kịch bản thận trọng: xem lại quảng cáo và gói IAP |
