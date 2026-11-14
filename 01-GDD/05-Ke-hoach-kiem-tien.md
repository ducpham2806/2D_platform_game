# Kế hoạch kiếm tiền và Live-ops

Chuyển Cyber Vanguard từ mô hình miễn phí hoàn toàn (không IAP, không quảng cáo) sang free-to-play: IAP, quảng cáo (AdMob/H5 Games Ads), subscription tắt ads, cùng các tính năng giữ chân (đăng nhập hằng ngày, 7 ngày tân thủ, vòng quay) và endgame farm sau cốt truyện. Mọi con số đánh dấu `[PLACEHOLDER]` là giả thuyết, cần soft launch để chỉnh. Tài liệu này không phải tư vấn pháp lý hay thuế.

Cập nhật 14/11/2026 (rà soát `/consistency-check` + `/balance-check`): luật Gem chung (mục 6), hai bảng vòng quay, live-ops không cho Data Chip, trần Core Bit ngoài màn (mục 8), Cyber+ theo gói, Starter Pack Rookie Neon, Season Pass 28 ngày (mục 5), dự báo doanh thu chỉ còn ở tab Cân bằng kinh tế mục 13 (mục 9), thêm **mục 14: Quy tắc biên kiếm tiền và live-ops**.

## 1. Tóm tắt thay đổi chiến lược và tác động

| Trước (GDD 0.3) | Sau (kế hoạch này) |
| --- | --- |
| Không IAP, không quảng cáo | Free-to-play: IAP, quảng cáo, subscription Cyber+ để tắt quảng cáo |
| Chỉ Core Bit và Data Chip, kiếm bằng cách chơi | Thêm Gem (tiền cao cấp, mua được và kiếm được một ít) và vật liệu farm |
| Game kết thúc ở AEGIS, hoàn thiện Shop khoảng giữa lượt Overclock (bản cũ; từ GDD 0.6 upgrade đủ sau lượt Thử thách) | Sau cốt truyện mở endgame: Farm, trang bị hiếm, nâng sức mạnh, Rift |
| Không popup, không đồng hồ đếm ngược | Có ưu đãi giới hạn thời gian, nhưng theo quy tắc kỷ luật ở mục 2 |
| Web/PWA, dữ liệu lưu cục bộ làm gốc | Cần app gốc cho mobile và máy chủ giữ số dư Gem, giao dịch (mục 3) |

**Ba điểm quan trọng nhất:**

1. **Kỹ thuật đổi theo:** quảng cáo AdMob và thanh toán qua Apple/Google chỉ chạy trong app gốc, không chạy trong web/PWA thuần. Quyết định "PWA" cũ phải đổi thành "app đóng gói cho mobile + bản web riêng".
2. **Kinh tế đổi theo:** endgame farm cần một hệ thống sức mạnh mới (trang bị hiếm), vì trần +25% của upgrade hiện tại chỉ phục vụ cốt truyện.
3. **Cam kết với người chơi đổi theo:** ba hứa ở GDD cũ (không IAP, không quảng cáo, không đếm ngược) không còn đúng và phải được cập nhật ở mọi tài liệu (mục 11).

## 2. Nguyên tắc kiếm tiền và lựa chọn mô hình

**Nguyên tắc giữ lại khi chuyển sang free-to-play:**

1. **Cốt truyện chơi trọn vẹn miễn phí.** Không paywall; quảng cáo không bao giờ chen vào giữa màn hay trận boss.
2. **Tiền không mua chỉ số trực tiếp.** Gem mua mỹ phẩm, tiện ích tiết kiệm thời gian và pass; trang bị và sức mạnh chỉ rơi khi chơi.
3. **Quảng cáo chủ yếu là rewarded (tự nguyện).** Interstitial bị giới hạn chặt (mục 4).
4. **Bảng xếp hạng công bằng.** Có bảng Tiêu chuẩn (loadout chuẩn hóa, không trang bị, không booster) và bảng Mở (cho phép trang bị).
5. **Không bán ngẫu nhiên bằng tiền.** Vòng quay chỉ miễn phí hoặc xem quảng cáo; lượt từ quảng cáo và Cyber+ dùng bảng giải riêng chỉ có Core Bit, Gem, mỹ phẩm (mục 8.3). Mọi cơ chế ngẫu nhiên đều công bố tỷ lệ và có bảo hiểm xui (pity).
6. **Ưu đãi có kỷ luật:** tối đa 1 popup ưu đãi mỗi phiên, không hiện trong màn chơi, luôn có nút đóng, không đếm ngược giả.

**Hai mô hình để chọn:**

|  | A: Tiện ích + mỹ phẩm (khuyến nghị) | B: Gacha trang bị bằng Gem |
| --- | --- | --- |
| Doanh thu | Vừa; ổn định nhờ subscription, pass, skin | Cao hơn nhưng dồn vào một nhóm nhỏ người chi nhiều |
| Công bằng | Cao: người không chi vẫn đạt cùng trần sức mạnh | Thấp: chi tiền rút nhanh hơn |
| Rủi ro chính sách | Thấp | Cao: phải công bố tỷ lệ; một số nước coi hộp ngẫu nhiên trả tiền gần với cờ bạc |
| Phù hợp GDD | Giữ được tinh thần "người chơi tôn trọng" | Phải thiết kế lại cân bằng và endgame |

Kế hoạch này đi theo **mô hình A**. Nếu bạn muốn mô hình B, cần thêm một vòng thiết kế riêng (xem mục 13).

## 3. Nền tảng, SDK, thanh toán và máy chủ

| Hạng mục | Mobile (Android, iOS) | Web PC |
| --- | --- | --- |
| Dạng phát hành | Đóng gói game Phaser trong app gốc (Capacitor hoặc tương đương) đăng lên Google Play và App Store | Chạy trên trình duyệt |
| Quảng cáo | AdMob (Google Mobile Ads SDK) | AdSense H5 Games Ads (Ad Placement API, cần đăng ký) hoặc mạng quảng cáo H5 khác |
| Thanh toán | Google Play Billing, Apple In-App Purchase; dùng RevenueCat hoặc dịch vụ tương đương để quản lý IAP và subscription | Cổng thanh toán web (ví dụ Stripe hoặc PayPal, hoặc cổng nội địa); cần kiểm tra điều kiện từng nước |
| Phân tích | Firebase Analytics, Crashlytics, Remote Config | Cùng bộ, qua SDK web |
| Thông báo đẩy | FCM, APNs, opt-in | Web push, opt-in |

**Quyết định kỹ thuật bắt buộc:**

- **Số dư Gem và giao dịch do máy chủ giữ làm gốc** (server-authoritative), kiểm tra biên lai khi mua. Điều này thay thế quy tắc cũ "lưu cục bộ làm gốc" cho Gem, mua hàng và trang bị; Core Bit và EXP có thể giữ cục bộ nhưng đồng bộ lên máy chủ.
- Bảng xếp hạng Rift và dữ liệu trang bị cần xác thực phía máy chủ để chống gian lận.
- **Remote Config** cho tỷ lệ rơi, tần suất quảng cáo, ưu đãi, thưởng sự kiện, để chỉnh mà không phát hành lại app.
- Hai bản (mobile và web) dùng chung mã game, chỉ khác lớp quảng cáo và thanh toán.
- Phí cửa hàng thường 15–30% doanh thu IAP và subscription trên app store; cần tính vào dự báo (mục 9).
- Khi chọn plugin quảng cáo và thanh toán cho wrapper, kiểm tra khả năng tương thích Android và iOS riêng; tài liệu của Google nêu cầu nối AdMob với H5 trong WebView hiện chỉ hỗ trợ Android.

## 4. Quảng cáo

| Vị trí | Loại | Điều kiện | Giới hạn `[PLACEHOLDER]` | Cyber+ |
| --- | --- | --- | --- | --- |
| Hồi sinh tại chỗ | Rewarded | Sau khi chết, người chơi tự chọn | Tối đa 1 lần mỗi màn, dùng chung với Second Wind và Second Chance | Nhận thưởng không cần xem |
| Nhân Core Bit (không nhân EXP) | Rewarded | Màn Kết quả | 6 lần mỗi ngày; ×1,5 trong cốt truyện, ×2 ở endgame | Nhận thưởng không cần xem |
| Thêm lượt vòng quay | Rewarded | Ở màn vòng quay | 2 lượt mỗi ngày, bảng giải QC (mục 8.3) | Nhận thưởng không cần xem |
| Booster miễn phí trước màn | Rewarded | Màn Chuẩn bị | 1 booster mỗi màn | Nhận thưởng không cần xem |
| Lượt thưởng gấp đôi trong Farm | Rewarded | Trong menu Farm | 2 lượt mỗi ngày | Nhận thưởng không cần xem |
| Bù ngày đăng nhập | Rewarded | Khi lỡ một ngày | 1 lần mỗi ngày, tối đa 3 mỗi chu kỳ; cách bù duy nhất | Nhận thưởng không cần xem |
| Về Hub sau màn Kết quả | Interstitial | Cách quảng cáo trước ≥ 4 phút; tối đa 1 mỗi 2 màn; không hiện trong 20 phút đầu và không bao giờ trong Prologue, Stage 1 hay sau lần đầu hạ boss chiến dịch của màn | Trần chung 2 mỗi ngày với interstitial ở Farm | Tắt hoàn toàn |
| Banner | Không dùng | Tránh che HUD và giảm chất lượng trải nghiệm |  |  |

Id, hạn mức và điều kiện chuẩn nằm ở `03-Data/adplacements.json` và `06-Ke-hoach-quang-cao.md`; bảng trên chỉ tóm tắt.

**Quy tắc chung:**

- Không có quảng cáo trong màn chơi và trận boss.
- Phần thưởng của rewarded ads phải nhỏ so với phần thưởng cơ bản (tối đa nhân đôi), không mở nội dung cốt truyện.
- Nút "Bỏ qua" hiện đúng lúc theo quy định của mạng quảng cáo; luôn tải trước quảng cáo, có phương án dự phòng khi không có quảng cáo (nhận thưởng thấp hơn hoặc ẩn nút).
- Khi phát triển và test chỉ dùng quảng cáo thử (test ads); không bấm quảng cáo thật của chính mình.
- Xin đồng ý quảng cáo cá nhân hóa theo từng khu vực (EU/UK) và hộp thoại theo dõi trên iOS.
- Bản web dùng Ad Placement API (hàm adBreak) cho interstitial và rewarded, theo đúng quy định của chương trình H5 Games Ads.

## 5. IAP và subscription Cyber+

### 5.1 Gói Gem

Giá theo bậc giá của Apple và Google, địa phương hóa theo nước (có VND). Số Gem và giá là `[PLACEHOLDER]`.

| Gói | Giá tham chiếu (USD) | Gem | Ghi chú |
| --- | --- | --- | --- |
| Nhỏ | 0,99 | 80 |  |
| Vừa | 2,99 | 260 | +8% so với gói nhỏ |
| Chuẩn | 4,99 | 450 | +12% |
| Lớn | 9,99 | 950 | +18% |
| Rất lớn | 19,99 | 2.000 | +24% |
| Cực lớn | 49,99 | 5.200 | +29% |
| Tối đa | 99,99 | 10.800 | +34% |

(Thưởng = (Gem / giá) / (80 / 0,99) − 1, sửa 14/11.)

Lần mua đầu tiên của mỗi gói được nhân đôi Gem (một lần cho mỗi gói, tính theo tài khoản trên mọi nền tảng). Gem đã mua không bao giờ hết hạn. Gem là hàng tiêu hao: số dư lấy từ tài khoản trên máy chủ. **"Khôi phục giao dịch"** (yêu cầu của Apple) chỉ áp cho món không tiêu hao: Starter Pack, skin bundle, Cyber+.

### 5.2 Gói khác

| Gói | Giá | Nội dung | Điều kiện |
| --- | --- | --- | --- |
| **Starter Pack** | 1,99 | 300 Gem, bộ skin **Rookie Neon** (biến thể riêng, khác bộ Rookie tặng ngày 7 tân thủ), hiệu ứng lướt Rookie Neon (mỹ phẩm), 5 vé Farm đôi (dùng sau cốt truyện, trong trần 5 vé mỗi ngày); không có booster vì booster tăng sức chiến đấu | Mua một lần; hiện khi đã qua ngày 2 **và** đã hạ 2 boss (07 L05), hết khi đóng cửa sổ 14 ngày tân thủ |
| **Season Pass (Premium)** | 4,99 mỗi mùa | Làn thưởng Premium của mùa (mục 8.5) | Mỗi mùa 28 ngày, trùng mùa Rift |
| **Skin bundle** | 2,99–9,99 | Bộ skin mỹ phẩm theo chủ đề, giảm giá so với mua lẻ | Không có chỉ số |
| **Weekly Deal** | 0,99–4,99 | Chỉ được bán: Gem, mỹ phẩm, vé Farm đôi (dùng trong trần 5 vé mỗi ngày) | Xoay vòng, tối đa 1 popup mỗi phiên |
| **Cyber+ Lifetime** (tùy chọn) | 24,99 | Tắt quảng cáo ép và nhận rewarded ngay, vĩnh viễn. Không Gem mỗi ngày, không skin tháng, không thêm lượt quay hay Sweep (rà soát 14/11) | Dành cho người không thích subscription; xem mục 13 |

### 5.3 Subscription Cyber+ (tắt quảng cáo)

|  | Giá `[PLACEHOLDER]` |
| --- | --- |
| Gói tháng | 2,99 |
| Gói năm | 19,99 (tiết kiệm khoảng 44%) |
| Dùng thử | 3 ngày, hiện rõ ngày tính tiền |

| Quyền lợi | Chi tiết |
| --- | --- |
| Tắt quảng cáo bắt buộc | Không còn interstitial |
| Rewarded ads miễn phí | Mọi nút "xem quảng cáo nhận thưởng" cho thưởng ngay, không cần xem |
| Đăng nhập hằng ngày | +10 Gem mỗi ngày đăng nhập (gói năm: +5) |
| Vòng quay | +1 lượt vòng quay mỗi ngày, bảng giải QC (mục 8.3) |
| Farm | +5 lượt Sweep mỗi ngày (mục 7.3) |
| Mỹ phẩm | 1 skin độc quyền mỗi tháng |
| **Không có** | Không tăng chỉ số, không tăng tỷ lệ rơi trang bị hiếm |

**Theo gói (rà soát 14/11):** gói tháng có đủ các dòng trên; gói năm như gói tháng nhưng **+5 Gem mỗi ngày** (kiểm tra giá trị ở tab Cân bằng kinh tế mục 12); Lifetime chỉ có hai dòng đầu.

**Quy tắc subscription:** hiển thị rõ giá, kỳ hạn, tự động gia hạn và cách hủy; có "Khôi phục giao dịch"; liên kết trực tiếp tới trang quản lý subscription của cửa hàng; không dùng giao diện đánh lừa để ngăn hủy; quyền lợi kết thúc đúng khi hết hạn.

## 6. Kinh tế mới: Gem, vật liệu, nguồn và chi

| Tiền tệ/Tài nguyên | Loại | Nguồn | Nơi tiêu |
| --- | --- | --- | --- |
| **Core Bit** | Mềm, kiếm bằng chơi | Màn, Farm, vòng quay, đăng nhập, quà (trong cốt truyện, ngoài màn ≤ 25% thu từ màn: tab Cân bằng kinh tế mục 4) | Upgrade, skin Thường/Hiếm, booster, nâng cấp trang bị (chi lớn ở endgame), mở rộng kho Chip |
| **Data Chip** | Hiếm, hữu hạn, không mua được | Nhiệm vụ, bí mật, thành tựu, phá đảo độ khó; **không** từ live-ops | Skin Sử thi, module hiếm |
| **Gem** | Cao cấp, mua và kiếm được | IAP, đăng nhập, nhiệm vụ, Season Pass, thành tựu | Skin Premium, vé Farm đôi, Sweep thêm, cấp Season Pass, đổi tên |
| **Mảnh vũ khí** | Vật liệu farm | Boss Hunt, Farm | Nâng cấp Mastery của từng vũ khí boss |
| **Tinh thể Eclipse** | Vật liệu endgame | Boss Hunt, Rift | Nâng cấp và tái tạo dòng phụ của Chip Lõi |
| **Chip Lõi** | Trang bị | Farm, Boss Hunt, Rift | Lắp vào 6 ô trang bị (mục 7.2) |

**Quy tắc:**

- Người chơi miễn phí kiếm khoảng 37 Gem mỗi ngày (43 nếu xem quảng cáo; tab Cân bằng kinh tế mục 12) `[PLACEHOLDER]`, đủ để tự mua một skin Premium sau 11–32 ngày.
- **Luật Gem chung (rà soát 14/11): Gem không đổi ra Core Bit, Data Chip, booster, vật liệu hay Chip, kể cả gián tiếp.** Vì vậy: bù ngày đăng nhập chỉ bằng quảng cáo (bỏ bù bằng 30 Gem); cấp Season Pass mua bằng Gem chỉ trao phần Gem và mỹ phẩm của cấp đó; Weekly Deal chỉ bán Gem, mỹ phẩm, vé Farm đôi. Ngoại lệ duy nhất: tiện ích Farm trong trần ngày (vé Farm đôi, Sweep thêm; mục 7.3, quyết định 13.4), vì chỉ rút thời gian, không vượt trần sức mạnh.
- Gem **không** mua trực tiếp chỉ số, Chip Lõi hay Mastery. Chỉ mua mỹ phẩm, vé Farm đôi (giới hạn mỗi ngày) và các tiện ích.
- **Hai ví:** Gem mua và Gem miễn phí. **Tiêu Gem miễn phí trước**, hiện rõ ở màn xác nhận. Hoàn tiền chỉ trừ ví Gem mua (mục 14).
- **Kho Chip Lõi:** 300 ô miễn phí, mở rộng bằng Core Bit (giá `[PLACEHOLDER]`); không bán ô kho bằng Gem.
- Core Bit cần các nơi tiêu mới ở endgame (nâng cấp Chip Lõi) để không bị dư như đã cảnh báo ở tab Cân bằng kinh tế.
- Giá Premium skin tham khảo: 400–1.200 Gem `[PLACEHOLDER]`.

**Mô hình Gem, vật liệu và endgame:** đã làm ở tab Cân bằng kinh tế phần B (mục 9–15).

## 7. Endgame: Farm, trang bị hiếm, nâng sức mạnh

Mục tiêu: sau khi hạ AEGIS (bất kỳ kết thúc nào), người chơi mở **Vùng Eclipse** và có lý do chơi tiếp hàng chục giờ: farm trang bị hiếm, nâng sức mạnh, rồi đánh tầng khó hơn. Farm hoàn toàn miễn phí, không giới hạn thể lực.

### 7.1 Ba chế độ endgame

| Chế độ | Mô tả | Phần thưởng chính |
| --- | --- | --- |
| **Farm Run** | Chơi lại bất kỳ màn nào ở Mức Eclipse 1–10 (mỗi mức +15% máu và sát thương kẻ địch kèm biến thể theo mức ở GDD mục 11, tỷ lệ rơi tốt hơn). Có thể chọn chơi từng đoạn A–D hoặc chỉ boss để mỗi lượt 3–6 phút | Chip Lõi, Mảnh vũ khí, Core Bit `150 + 20 × L` (Mức 5: 250). Chơi 1 đoạn: mọi thưởng ×0,25; chỉ boss: ×0,4 (số chip lẻ tung xác suất) |
| **Boss Hunt** | Đánh 8 boss và AEGIS ở "dạng Eclipse" với mẫu đòn mới; mỗi boss có bộ Chip Lõi riêng | Chip Lõi theo bộ, Tinh thể Eclipse |
| **Eclipse Rift** | Tháp 100 tầng theo mùa (4 tuần), độ khó tăng dần, không checkpoint giữa các tầng | Tinh thể, skin mùa, thứ hạng bảng Mở |

Mở khóa: Farm Run và Boss Hunt mở ngay sau cốt truyện; Rift mở khi hạ đủ 8 boss Hunt ở Mức Eclipse 3.

### 7.2 Hệ thống trang bị Chip Lõi

- 6 ô: Đầu, Thân, Tay, Chân, Lõi, Phụ. Mỗi Chip có 1 chỉ số chính và 0–4 dòng phụ theo độ hiếm.
- Mỗi bộ có hiệu ứng 2 mảnh và 4 mảnh; 8 bộ gắn với 8 boss (ví dụ bộ Thorna tăng sát thương vũ khí Vine Lash).
- Nâng cấp +0 đến +15 bằng Core Bit và Tinh thể Eclipse, **không có xác suất thất bại**. Tái tạo dòng phụ tốn Tinh thể và cho chọn giữ hoặc đổi.
- Chip không bán bằng tiền thật. Chỉ Core Bit và vật liệu farm mua được cửa hàng đổi nhỏ (ví dụ đổi Chip Common thành vật liệu).

| Độ hiếm | Tỷ lệ rơi `[PLACEHOLDER]` | Chỉ số chính | Dòng phụ |
| --- | --- | --- | --- |
| Common | 60% | +5% | 0 |
| Rare | 28% | +8% | 1 |
| Epic | 10% | +12% | 2 |
| Legendary | 1,9% | +18% | 3 |
| Mythic | 0,1% | +25% | 4 |

**Bảo hiểm xui (pity):** Legendary đảm bảo sau 80 lượt rơi không có; Mythic đảm bảo sau 600 lượt; lần đầu hạ mỗi boss Hunt chắc chắn rơi Epic trở lên. Tỷ lệ và bảo hiểm được hiển thị trong menu Farm.

### 7.3 Sweep, lượt thưởng gấp đôi và Mastery

- **Sao của màn** (mỗi màn, mỗi Mức Eclipse; lưu số sao cao nhất; sao sau gồm điều kiện của sao trước, trong cùng một lượt): ★ xong màn; ★★ chết ≤ 2 lần; ★★★ thời gian dưới 1,25 × thời gian mục tiêu của màn (`[PLACEHOLDER]`, ghi trong dữ liệu màn).
- **Sweep (quét):** với màn đã hạ ở mức Eclipse đạt 3 sao, tự hoàn thành mà không chơi. Thưởng như một lượt Farm Run đủ màn ở mức đó, có tính pity, không nhân đôi bằng `AD_DOUBLE`. Miễn phí 5 lượt mỗi ngày; Cyber+ thêm 5; xem quảng cáo thêm 2; mua bằng Gem thêm tối đa 5 mỗi ngày `[PLACEHOLDER]`.
- **Lượt thưởng gấp đôi:** 3 lượt miễn phí mỗi ngày nhân đôi vật phẩm rơi; thêm bằng quảng cáo (2) hoặc vé Farm đôi (từ mọi nguồn: Gem, Starter Pack, Weekly Deal, đăng nhập; dùng tối đa 5 mỗi ngày). Tổng tối đa 10 lượt mỗi ngày để người chi tiền không tách xa người chơi thường.
- **Weapon Mastery:** mỗi vũ khí boss lên cấp 1–10 bằng Mảnh vũ khí: tăng sát thương và giảm tiêu hao năng lượng (tối đa +30% và −20%).

### 7.4 Đường cong sức mạnh

| Giai đoạn | Nguồn sức mạnh | Trần tham khảo |
| --- | --- | --- |
| Cốt truyện | Cấp, upgrade, module, Két giáp | Khoảng +25% từ upgrade (mục 10.1 GDD) |
| Mức Eclipse 1–3 | Chip Common và Rare, Mastery 1–4 | Sức mạnh gấp \~1,5× cuối cốt truyện |
| Mức Eclipse 4–7 | Chip Epic và Legendary, bộ 2 mảnh | \~2,5× |
| Mức Eclipse 8–10 và Rift | Chip Mythic, bộ 4 mảnh, Mastery 10 | \~4× |

Mục tiêu thời gian cho người chơi miễn phí: hoàn thiện một build Legendary đầy đủ sau khoảng 25–35 giờ farm (mô phỏng ở tab Cân bằng kinh tế, phần B) `[PLACEHOLDER]`; người chi tiền rút ngắn thời gian bằng lượt thưởng gấp đôi và Sweep nhưng **không vượt trần sức mạnh**.

**Bảng xếp hạng:** Tiêu chuẩn (loadout chuẩn hóa, mọi người như nhau) và Mở (cho phép Chip Lõi); thưởng thứ hạng chủ yếu là mỹ phẩm.

## 8. Live-ops: giữ chân và kiếm tiền

### 8.1 Bảy ngày tân thủ

Tính từ lần đăng nhập đầu. Không mất thưởng khi lỡ ngày: người chơi tiếp tục ngày kế tiếp trong cửa sổ 14 ngày. Mỗi ngày kèm 1 nhiệm vụ nhỏ dạy một hệ thống.

| Ngày | Thưởng | Nhiệm vụ (dạy gì) |
| --- | --- | --- |
| 1 | 100 Core Bit, 1 Shield Cell | Hoàn thành Prologue |
| 2 | 20 Gem, 1 Repair Kit | Hạ boss Stage 1 (Shop) |
| 3 | 300 Core Bit, 1 lượt vòng quay thêm (bảng thường) | Mua 1 upgrade (Shop) |
| 4 | 20 Gem (thay 1 Data Chip, rà soát 14/11) | Mở Xưởng và học 1 kỹ năng |
| 5 | Chọn 1 skin Thường | Dùng 1 booster trong màn |
| 6 | 50 Gem, 2 booster | Hoàn thành 1 nhiệm vụ phụ |
| 7 | Bộ skin Rookie (mỹ phẩm), 130 Gem (thay 2 Data Chip) | Hạ 2 boss |

Ngoài ra có thanh **Điểm tân thủ** (mỗi nhiệm vụ 20 điểm), rương thưởng ở mốc 20/40/60/80/100 điểm. Starter Pack không gắn với ô ngày 2: hiện khi đã qua ngày 2 **và** đã hạ 2 boss (07 L05).

### 8.2 Đăng nhập hằng ngày

Chu kỳ 30 lần nhận, không theo lịch tháng (mục 14, KT-02). Lỡ một ngày không mất chuỗi: ô kế tiếp giữ nguyên. Bù chỉ bằng xem quảng cáo (1 lần mỗi ngày, tối đa 3 ngày mỗi chu kỳ); bỏ bù bằng 30 Gem (luật Gem, mục 6).

| Ngày | Thưởng `[PLACEHOLDER]` |
| --- | --- |
| 1, 2, 4, 5 … | 50–100 Core Bit hoặc 1 booster, xen kẽ (giảm từ 150–300 để giữ trần Core Bit ngoài màn) |
| 3, 10, 17, 24 | 15 Gem |
| 7 | 20 Gem (thay 1 Data Chip) |
| 14 | 50 Gem + 1 vé Farm đôi |
| 21 | 1 Chip Lõi Rare (trước AEGIS: vào kho, KT-06) |
| 30 | 100 Gem + khung hồ sơ + biểu tượng hồ sơ (mỹ phẩm; biểu tượng thay 1 Data Chip) |

Cyber+ nhận thêm 10 Gem mỗi ngày đăng nhập (gói năm 5, Lifetime 0).

### 8.3 Vòng quay hằng ngày

- 1 lượt miễn phí mỗi ngày; thêm 2 lượt bằng xem quảng cáo (Cyber+ nhận miễn phí và thêm 1 lượt). **Không bán lượt bằng Gem hay tiền thật**, để vòng quay không thành cơ chế ngẫu nhiên trả tiền.
- **Hai bảng giải (rà soát 14/11).** Bảng thường cho lượt miễn phí và lượt tặng (7 ngày tân thủ, Welcome back). Bảng QC cho lượt từ `AD_SPIN` và Cyber+: chỉ có Core Bit, Gem, mỹ phẩm, để tiền thật và quảng cáo không đổi ra booster, vật liệu, Chip hay Data Chip. Cả hai bảng kỳ vọng 3 Gem mỗi lượt (ngoại lệ "không thưởng Gem từ quảng cáo" ở `06-Ke-hoach-quang-cao.md` mục 4.2).
- Pity: lượt miễn phí ngày thứ 7 liên tiếp chắc chắn ≥ 30 Gem nếu 6 lượt trước chưa trúng (KT-03). Tỷ lệ luôn được hiển thị.
- Core Bit kỳ vọng mỗi lượt: bảng thường 45, bảng QC 18 (trần Core Bit ngoài màn, tab Cân bằng kinh tế mục 4).

| Giải | Bảng thường `[PLACEHOLDER]` | Bảng QC `[PLACEHOLDER]` |
| --- | --- | --- |
| 30 Core Bit | — | 60% |
| 60 Core Bit (trước 200) | 30% | — |
| 150 Core Bit (trước 500) | 18% | — |
| Booster ngẫu nhiên | 18% | — |
| 10 Gem | 12% | 24% |
| Vật liệu farm nhỏ | 12% | — |
| 30 Gem | 6% | 2% |
| Mỹ phẩm nhỏ (khung, biểu tượng hồ sơ; đã có hết thì 30 Core Bit) | 3% (thay 1 Data Chip) | 14% |
| 1 Chip Lõi Epic | 1% | — |

### 8.4 Nhiệm vụ ngày và tuần

- 5 nhiệm vụ ngày (ví dụ hạ 20 kẻ địch, dùng 1 vũ khí boss, hoàn thành 1 màn); mỗi nhiệm vụ 20 điểm; rương ở mốc 20/40/60/80/100 điểm (Core Bit, Gem nhỏ, vật liệu). Trước khi hạ AEGIS, phần Core Bit trong rương đổi thành booster (trần Core Bit ngoài màn).
- 3 nhiệm vụ tuần, thưởng lớn hơn (Gem, Chip Lõi Rare, mỹ phẩm; không còn Data Chip).

### 8.5 Season Pass

- Mùa 28 ngày (trùng mùa Rift), 30 cấp; kinh nghiệm pass lấy từ nhiệm vụ ngày/tuần và chơi màn (chi tiết KT-12).
- **Làn Free:** Core Bit, booster, vật liệu, một ít Gem (\~100 Gem mỗi mùa). Trước khi hạ AEGIS, phần Core Bit đổi thành booster.
- **Làn Premium (4,99):** skin mùa, Gem (hoàn lại khoảng 60% giá khi hoàn thành đủ), khung hồ sơ, hiệu ứng lướt. Không có chỉ số và Chip Lõi.
- Có thể mua cấp bằng Gem để theo kịp (giới hạn 10 cấp mỗi mùa). Cấp mua bằng Gem chỉ trao phần Gem và mỹ phẩm của cấp đó (luật Gem, mục 6).

### 8.6 Sự kiện và ưu đãi

| Loại | Nhịp | Nội dung |
| --- | --- | --- |
| Cuối tuần x2 rơi | Hằng tuần | Nhân đôi tỷ lệ rơi vật liệu ở Farm Run |
| Boss giới hạn | 2 tuần/lần | Boss sự kiện với bộ Chip riêng, mỹ phẩm |
| Rift mùa | 4 tuần | Xếp hạng, skin mùa |
| Welcome back | Khi quay lại sau ≥ 7 ngày | Quà quay lại, không bán (KT-14) |
| Weekly Deal | Hằng tuần | Tối đa 1 popup mỗi phiên |

### 8.7 Thông báo đẩy

Chỉ khi người chơi đồng ý. Tối đa 1 thông báo mỗi ngày, các loại: vòng quay sẵn sàng, quà đăng nhập, sự kiện mới. Có tùy chọn tắt từng loại trong Cài đặt.

## 9. Dự báo doanh thu và KPI

**Công thức:** Doanh thu ngày = DAU × (ARPDAU quảng cáo + ARPDAU IAP + ARPDAU subscription); phần IAP và subscription còn phải trừ phí cửa hàng (thường 15–30%) và thuế.

Các con số chỉ để lập kế hoạch, **không phải dự báo**: eCPM thay đổi rất mạnh theo quốc gia (thị trường Việt Nam thường thấp hơn nhiều so với Mỹ, châu Âu), nên phải thay bằng số liệu soft launch.

**Bảng ba kịch bản (thận trọng, cơ sở, lạc quan) chỉ giữ ở tab Cân bằng kinh tế mục 13** (công thức từng phần, giả định, ghi chú tính lại). Rà soát 14/11: bỏ bảng trùng ở đây vì hai bảng đã lệch nhau.

**KPI mục tiêu `[PLACEHOLDER]`:**

| Chỉ số | Mục tiêu |
| --- | --- |
| Giữ chân ngày 1 / 7 / 30 | 35–40% / 12–15% / 5–6% |
| % MAU trả tiền trong tháng | 1–3% (khớp công thức IAP ở tab Cân bằng kinh tế mục 13) |
| Tỷ lệ có subscription | 0,5–1,5% DAU |
| Tỷ lệ chọn xem rewarded ads | 40–60% người chơi hoạt động |
| Quảng cáo interstitial mỗi người mỗi ngày | ≤ 2 (trần chung `INT_HUB` + `INT_FARM`) |
| Số phiên mỗi ngày / thời lượng | 3 phiên / 12–18 phút |
| Crash-free | ≥ 99% |

**Cổng quyết định sau soft launch:** chỉ mở rộng thị trường và chạy quảng cáo mua người dùng khi D1 ≥ 35%, D7 ≥ 10%, và giá trị vòng đời (LTV) lớn hơn chi phí mua một người dùng (CPI) trong thị trường đó. Nếu chưa đạt thì chỉnh onboarding, độ khó và tần suất quảng cáo trước khi tăng chi tiêu.

## 10. Tuân thủ và rủi ro

| Mục | Điều cần làm |
| --- | --- |
| **Độ tuổi** | GDD đang ghi 12+. Người dưới 13 tuổi kéo theo quy định riêng về quảng cáo và dữ liệu trẻ em (ví dụ COPPA ở Mỹ). Khuyến nghị đặt độ tuổi **13+** và có màn hình xác nhận tuổi, hoặc xử lý toàn game như hướng đến trẻ em (hạn chế quảng cáo cá nhân hóa) |
| **Đồng ý quảng cáo** | Hộp thoại đồng ý cho EU/UK (UMP), hộp thoại theo dõi trên iOS, chính sách quyền riêng tư công khai |
| **Apple IAP** | Tiền trong game mua bằng IAP không được hết hạn; phải có "Khôi phục giao dịch"; cơ chế ngẫu nhiên trả tiền phải công bố tỷ lệ trước khi mua |
| **Google Play** | Dùng Play Billing cho hàng hóa số; kiểm tra chính sách hiện hành về hộp ngẫu nhiên trả tiền và subscription khi nộp |
| **Subscription** | Hiển thị rõ giá, kỳ hạn, tự gia hạn, cách hủy; dùng thử nêu rõ ngày tính tiền |
| **Luật hộp ngẫu nhiên** | Một số nước coi hộp ngẫu nhiên trả tiền gần với cờ bạc; mô hình A tránh việc này (không bán ngẫu nhiên bằng tiền) |
| **Thanh toán web, thuế, pháp lý** | Cần tư vấn kế toán và pháp lý tại Việt Nam và các thị trường mục tiêu; kế hoạch này không phải tư vấn pháp lý |
| **Thiết kế: bị coi là pay-to-win** | Giữ nguyên tắc mục 2: không bán chỉ số, bảng xếp hạng Tiêu chuẩn, trần sức mạnh như nhau |
| **Thiết kế: mệt vì quảng cáo** | Giới hạn tần suất bằng Remote Config; rewarded tự nguyện; không quảng cáo trong màn chơi |
| **Kinh tế: lạm phát và gian lận** | Gem và trang bị do máy chủ giữ; theo dõi nguồn/chi hằng tuần; công cụ điều chỉnh bằng Remote Config |
| **Quảng cáo: lưu lượng không hợp lệ** | Không khuyến khích bấm quảng cáo, không tự bấm quảng cáo thật khi test |
| **Cam kết cũ** | Thông báo rõ với người đã theo dõi dự án nếu trước đó đã hứa "không IAP/không quảng cáo" |

## 11. Thay đổi trong GDD và wireframe (GDD đã cập nhật ở bản 0.4)

### 11.1 GDD

| Mục / Tài liệu | Thay đổi |
| --- | --- |
| 1 Tổng quan, mục 1.1 trụ cột 5 | Viết lại trụ cột "Tôn trọng người chơi" theo nguyên tắc mục 2; sửa dòng Kinh doanh |
| 2 Mô hình miễn phí | Thay hoàn toàn bằng mô hình F2P (IAP, quảng cáo, Cyber+) |
| 3 Cốt truyện | Thêm hậu kết thúc: lý do Vùng Eclipse tồn tại |
| 4 Core loop | Thêm vòng dài hạn: Farm, Chip Lõi, Rift |
| 6, 7 Phát triển nhân vật, vũ khí | Thêm trần sức mạnh sau cốt truyện, Chip Lõi, Weapon Mastery |
| 8 Thế giới | Thêm Vùng Eclipse và Mức Eclipse 1–10 |
| 10, 10.1 Kinh tế, Shop | Thêm Gem, vật liệu, quầy Premium, Cyber+, Season Pass |
| 11 Độ khó | Làm rõ quan hệ giữa độ khó cốt truyện và Mức Eclipse |
| 13 UI | Thêm vị trí quảng cáo, popup ưu đãi, nút khôi phục giao dịch |
| 15 Kỹ thuật | Thay "PWA" bằng app đóng gói + web, máy chủ giữ Gem, Remote Config |
| 16 Lộ trình | Thêm các mốc mục 12 |
| 17 KPI | Thêm KPI kiếm tiền (mục 9) |
| 18 Rủi ro | Thêm rủi ro mục 10 |
| Tab Hub & Shop | Bỏ nguyên tắc "không popup quảng bá"; thêm khu Cửa hàng, Sự kiện, Nhiệm vụ ngày |
| Tab Cân bằng kinh tế | Mô hình lại với Gem, vật liệu, Chip Lõi |

### 11.2 Màn wireframe mới (khoảng 22 màn)

Cửa hàng IAP (gói Gem), Cyber+ (subscription), Starter Pack, đăng nhập hằng ngày, 7 ngày tân thủ, vòng quay hằng ngày, nhiệm vụ ngày/tuần, Season Pass, sự kiện, hộp thoại xem quảng cáo (hồi sinh, nhân đôi thưởng), đồng ý quảng cáo và xác nhận tuổi, màn công bố tỷ lệ, menu Vùng Eclipse (Farm Run, Boss Hunt, Rift), chọn Mức Eclipse, kho Chip Lõi, chi tiết/nâng cấp/tái tạo Chip, hiệu ứng bộ, Weapon Mastery, Sweep, bảng xếp hạng Rift, cài đặt thông báo, khôi phục giao dịch và quản lý tài khoản.

## 12. Lộ trình triển khai

Nguyên tắc: chỉ thêm kiếm tiền sau khi vòng chơi cốt lõi đã vui (Vertical slice đạt tiêu chí onboarding), và không mở rộng tiền mua người dùng trước khi qua cổng soft launch (mục 9).

| Giai đoạn | Nội dung | Điều kiện hoàn thành |
| --- | --- | --- |
| **P0: Quyết định và thiết kế** (1–2 tuần) | Chốt mục 13; cập nhật GDD và wireframe (mục 11); thiết kế kinh tế Gem và endgame; đăng ký tài khoản AdMob, Google Play, Apple, AdSense H5 | GDD 0.4 và wireframe mới được duyệt |
| **P1: Core và cốt truyện** | Prototype, Vertical slice, Alpha theo mục 16 GDD; thêm khung máy chủ và analytics từ Alpha | Onboarding ≥ 90%, hệ thống RPG không vỡ |
| **P2: Live-ops MVP** (trước soft launch) | Đăng nhập hằng ngày, 7 ngày tân thủ, vòng quay, nhiệm vụ ngày; rewarded ads (hồi sinh, nhân đôi thưởng); IAP Gem, Starter Pack, Cyber+; máy chủ giữ Gem; Remote Config; đồng ý quảng cáo, xác nhận tuổi | Mua và khôi phục giao dịch đúng trên Android và iOS; không lỗi nhân đôi Gem |
| **P3: Endgame MVP** | Farm Run, Boss Hunt, Chip Lõi 6 ô, Sweep, Weapon Mastery, bảng xếp hạng Tiêu chuẩn | Hoàn thành vòng farm đầu tiên trong 3–6 phút, tỷ lệ rơi hiển thị đúng |
| **P4: Soft launch** (4–6 tuần) | 1–2 thị trường nhỏ; đo KPI; chỉnh bằng Remote Config | Qua cổng quyết định ở mục 9 |
| **P5: Ra mắt toàn cầu và mùa đầu** | Eclipse Rift, Season Pass, sự kiện, kiếm tiền bản web | KPI ổn định 2 tuần |
| **Sau ra mắt** | Mỗi 2 tuần: 1 sự kiện; mỗi 4 tuần: 1 mùa; mỗi tháng: bản vá cân bằng | Nhịp nội dung ổn định |

## 13. Quyết định đã chốt (16/10/2026)

Bạn giao cho tôi quyết định; các lựa chọn dưới đây theo khuyến nghị ban đầu và đã được đưa vào GDD 0.4 (mục 2.1 và 19).

1. **Mô hình kiếm tiền:** A (tiện ích và mỹ phẩm, không bán ngẫu nhiên bằng tiền).
2. **Độ tuổi mục tiêu:** 13+, có xác nhận tuổi.
3. **Cyber+ Lifetime:** có bán, khoảng 24,99 USD. Rà soát 14/11: chỉ tắt quảng cáo ép và nhận rewarded ngay; không Gem mỗi ngày, không skin tháng.
4. **Gem mua tiện ích Farm:** có, trong giới hạn mục 7.3 (không mua được trang bị hay chỉ số).
5. **Thứ tự phát hành:** Android và web PC trước, iOS sau.
6. **Soft launch:** Việt Nam cộng một thị trường tiếng Anh nhỏ; ngôn ngữ tiếng Việt và tiếng Anh.
7. **Dịch vụ:** Supabase (backend), RevenueCat (IAP và subscription), AdMob và H5 Games Ads (quảng cáo), Firebase (phân tích, Remote Config).

**Việc còn lại:** (1) cập nhật 66 wireframe hiện có và vẽ thêm khoảng 22 màn mới; (2) đã xong: mô hình Gem, vật liệu và endgame ở tab Cân bằng kinh tế phần B; (3) chốt giá cuối sau playtest; (4) chọn thị trường tiếng Anh cụ thể cho soft launch.

## 14. Quy tắc biên kiếm tiền và live-ops

Thêm khi rà soát 14/11/2026. Mỗi luật có mã `KT-xx` để Story và test ghi lại. Tình huống biên của gameplay và UI nằm ở `17-Quy-tac-bien.md` (mã `QB-xx`). Mọi số là `[PLACEHOLDER]`.

| Mã | Tình huống | Luật |
| --- | --- | --- |
| KT-01 | Mốc ngày | Hạn mức ngày, đăng nhập, vòng quay, nhiệm vụ ngày đặt lại lúc 04:00 giờ máy chủ theo múi giờ của tài khoản (Việt Nam: UTC+7). Mất mạng thì không nhận thưởng ngày; đổi giờ máy không có tác dụng. |
| KT-02 | Đăng nhập 30 ngày | Chu kỳ tính theo 30 lần nhận, không theo lịch tháng (28–31 ngày). Lỡ ngày thì giữ nguyên ô kế tiếp. Bù chỉ bằng `AD_LOGIN`, tối đa 3 ngày mỗi chu kỳ; không bù bằng Gem. |
| KT-03 | Vòng quay | Lượt miễn phí và lượt tặng dùng bảng thường; lượt `AD_SPIN` và Cyber+ dùng bảng QC (mục 8.3). Pity: chuỗi ngày liền có dùng lượt miễn phí; ngày 7 chắc chắn ≥ 30 Gem nếu 6 lượt trước chưa trúng; lỡ ngày thì chuỗi về 0. |
| KT-04 | Cộng dồn nhân đôi | `AD_DOUBLE` chỉ nhân Core Bit (cốt truyện ×1,5, endgame ×2; không áp cho Sweep). Lượt gấp đôi Farm chỉ nhân vật phẩm rơi. Sự kiện ×2 cuối tuần không cộng với lượt gấp đôi (tối đa ×2). Vé Farm đôi từ mọi nguồn dùng tối đa 5 mỗi ngày; tổng tối đa 10 lượt gấp đôi. |
| KT-05 | Booster vượt kho 9 | Booster từ quà, vòng quay, hướng dẫn (R06 tặng 2) vượt 9 thì vào hộp thư, giữ 30 ngày; hết hạn thì mất, không đổi ra Core Bit (để không lách trần Core Bit ngoài màn). Booster nhận trước boss 4 vào kho, ô hiện khóa. Mua tối đa 9 − số đang có. |
| KT-06 | Thưởng chưa dùng được trong cốt truyện | Chip Lõi, vật liệu, vé Farm vào kho, ghi "mở sau AEGIS"; không đổi ra Core Bit. |
| KT-07 | Pity Chip Lõi | Đếm theo số chip rơi, chung toàn tài khoản. Ra Mythic thì đặt lại cả bộ đếm Legendary. Sweep có tính. Bộ đếm hiện cho người chơi. |
| KT-08 | Mua IAP | Chỉ cộng khi máy chủ xác nhận biên lai; mỗi giao dịch có id riêng, không cộng hai lần. Giao dịch "đang chờ thanh toán" chưa cộng; mất mạng giữa chừng thì cộng ở lần mở sau. Quầy Premium khóa khi offline. Thưởng nhân đôi lần mua đầu tính theo tài khoản, trên mọi nền tảng. |
| KT-09 | Hoàn tiền, chargeback | Trừ Gem của giao dịch đó ở ví Gem mua; cho số dư âm tới mức đã cấp, khóa tiêu Gem tới khi về ≥ 0; thu hồi đúng món của giao dịch. Từ lần thứ 2 thì khóa mua 30 ngày. Không bao giờ trừ tiến trình chơi. |
| KT-10 | Xung đột cloud, mã sao lưu | Gem, quyền lợi IAP, Chip Lõi và bộ đếm pity luôn lấy theo máy chủ, không nằm trong màn chọn bản lưu. Từ Endgame MVP, Core Bit cũng do máy chủ giữ (bảng xếp hạng Mở phụ thuộc Chip đã nâng). |
| KT-11 | Cyber+ | Dùng thử 1 lần cho mỗi tài khoản cửa hàng. Skin tháng nhận sau kỳ trả tiền đầu tiên; hết hạn vẫn giữ skin đã nhận. Quyền lợi theo ngày dừng ở mốc ngày kế tiếp sau khi hết hạn. Quyền lợi theo gói ở mục 5.3. |
| KT-12 | Season Pass | 28 ngày, 30 cấp, 100 XP mỗi cấp (nhiệm vụ ngày \~100 XP, nhiệm vụ tuần 3 × 150 XP). Mua cấp 50 Gem, tối đa 10 cấp; cấp mua bằng Gem chỉ trao Gem và mỹ phẩm. Làn Premium trả \~270 Gem (\~60% giá). Mua Premium giữa mùa thì nhận bù các cấp đã đạt; thưởng chưa nhận khi hết mùa vào hộp thư. |
| KT-13 | Ưu đãi | "Phiên" kết thúc khi app nằm nền quá 15 phút. Đếm ngược chỉ dùng cho hạn thật. Cùng một ưu đãi không lặp lại trong 30 ngày. Starter Pack hiện khi đã qua ngày 2 **và** đã hạ 2 boss (07 L05), hết khi đóng cửa sổ 14 ngày. |
| KT-14 | Quà, mã quà, Welcome back | Không chuyển Gem hay vật phẩm giữa người chơi. Mã quà chỉ cho Gem miễn phí hoặc mỹ phẩm, mỗi tài khoản 1 lần. Welcome back (vắng ≥ 7 ngày): 1 booster + 1 lượt quay bảng thường + 20 Gem, tối đa 1 lần mỗi 30 ngày. |
| KT-15 | Đồng ý quảng cáo và tuổi | Từ chối vẫn xem được rewarded không cá nhân hóa; đổi lại được trong Cài đặt; không thưởng cho việc đồng ý. Khai dưới 13 tuổi thì lưu kết quả, không hỏi lại trong 24 giờ. Soft launch Việt Nam: cần pháp lý xác nhận yêu cầu định danh tài khoản và giới hạn giờ chơi của người dưới 18. |
