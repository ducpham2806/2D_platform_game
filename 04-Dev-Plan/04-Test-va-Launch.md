# Test và Launch

Mọi con số là `[PLACEHOLDER]`; chốt sau soft launch. Đây không phải tư vấn pháp lý.

## 1. Chiến lược test

| Tầng | Công cụ | Test gì | Khi nào |
|---|---|---|---|
| Logic thuần | Vitest | Công thức EXP/chỉ số, vật lý nhảy/lướt, kinh tế, xác suất rơi đồ và pity, tính tiền, xung đột lưu | Mỗi commit (CI) |
| Dữ liệu | Script kiểm tra JSON | Schema, giá trị trong khoảng, tham chiếu đúng (màn, boss, vũ khí) | Mỗi commit |
| Tích hợp | Playwright (web) | Luồng chính: menu, vào màn, mua hàng, lưu/tải; chụp ảnh so sánh màn quan trọng. Hiện có `npm run gate-flow` (luồng người thử `?gate=1`); EP-19 thêm e2e toàn chiến dịch vào CI | Mỗi Story có giao diện; CI từ EP-19 |
| Tài liệu | `npm run docs-check` | Nhật ký ≤ 3 mục, ngân sách file đầu phiên, đường dẫn trong file chỉ mục | Mỗi commit (CI) |
| Chơi thử | Người thật | Cảm giác điều khiển, độ khó, hiểu giao diện | Cuối mỗi sprint |
| Thiết bị | Máy thật | Hiệu năng, cảm ứng, quảng cáo, thanh toán | Từ Alpha |
| Mô phỏng kinh tế | Script | 100.000 lượt rơi đồ, thu/chi Core Bit và Gem theo ngày chơi | Trước Alpha và trước soft launch |

### 1.1 Test bắt buộc theo module

| Module | Trường hợp phải có |
|---|---|
| M3 Nhân vật | Độ cao nhảy tối thiểu/tối đa; coyote 0,1 s; buffer 0,12 s; lướt 3 ô và hồi 0,6 s; bám tường trượt 2 ô/giây; bất tử 1 s |
| M4 Chiến đấu | Tối đa 3 đạn; nạp 1,2 s ×3; điểm yếu ×2,5; xuyên 1 kẻ địch |
| M7 Màn chơi | Hồi sinh ≤ 1,5 s; giữ Core Bit và EXP; gai 30 sát thương và về ô an toàn; phòng khóa mở khi hết kẻ địch; kẻ địch dựng lại không trả thưởng lần nữa (QB-20) |
| M6 Boss | Boss và Kai hết máu cùng bước thì thắng (QB-30); một đòn qua hai ngưỡng pha bị kẹp (QB-31); báo trước ≥ 0,5 s sau `speedMul` |
| M9 Shop | Không mua trùng; không âm tiền; mất mạng không mất tiền; gỡ upgrade hoàn đúng số đã trả; gợi ý thu nhập chỉ trỏ màn có trong bản build (QB-65) |
| M10 Cài đặt | Lưu và chuyển phiên bản (`cv.settings`, `cv.controls` không mất phím đã đổi); bảng màu mù màu ΔE00 ≥ 20; giảm nhấp nháy; tốc độ game; nút ≥ 48 dp, chữ ≥ 16 sp (`01-GDD/14-Cai-dat-Tiep-can.md`) |
| M10 Hộp chữ | Thứ tự ưu tiên (QB-70); câu ghép ≤ giới hạn ký tự và ≤ 2 dòng (QB-73) |
| M12 Âm thanh | Dừng khi ẩn tab; không giật khi đổi tab; cảnh báo đòn boss phát trước hoặc cùng lúc báo trước hình (`01-GDD/12-Am-thanh.md`) |
| M16 Đo lường MVP | Lược đồ, bộ đệm theo ưu tiên, giới hạn dung lượng, thử lại, không gửi khi tắt đồng ý, báo cáo khớp bộ dữ liệu mẫu (`01-GDD/13-Do-luong-MVP.md`) |
| M11 Lưu | Hai thiết bị xung đột hiện màn chọn; không nhân đôi tiền; mã sao lưu sai checksum bị từ chối |
| M13 Live-ops | Phân phối vòng quay khớp tỷ lệ; pity lượt thứ 7; bù ngày đăng nhập; 7 ngày tân thủ không mất thưởng khi lỡ |
| M14 Kiếm tiền | Mua, hủy, khôi phục; quyền Cyber+ bật/tắt đúng; tần suất interstitial đúng giới hạn; không quảng cáo ở Prologue, Stage 1, boss |
| M14 Quảng cáo (chi tiết) | Hạn mức mỗi màn/ngày đúng; không quảng cáo ở Prologue, boss, lúc điều khiển; đóng sớm không thưởng; xem xong thưởng đúng một lần; mất mạng, no fill, thoát app giữa quảng cáo; đếm ngược 3-2-1; bảo vệ bực bội; Cyber+ nhận ngay (xem danh sách mục 9.1 của kế hoạch quảng cáo) |
| M15 Endgame | Tỷ lệ rơi và pity trên 100.000 lượt; nâng +15 không có xác suất thất bại; tối đa 10 lượt thưởng gấp đôi mỗi ngày |

### 1.2 Ngân sách hiệu năng

| Chỉ số | Mục tiêu |
|---|---|
| FPS | 60 trên điện thoại Android tầm trung (~3 GB RAM), 60 trên laptop phổ thông |
| Tải đầu | ≤ 30 MB; mỗi màn tải thêm ≤ 8 MB |
| Vào Hub | ≤ 2 giây |
| Độ trễ nhập | ≤ 50 ms |
| Bộ nhớ | Không tăng liên tục sau 30 phút chơi (kiểm tra rò rỉ) |
| Pin | Không nóng máy bất thường sau 20 phút |

### 1.3 Ma trận thiết bị tối thiểu

| Nhóm | Ví dụ |
|---|---|
| Android thấp | 2–3 GB RAM, màn 720p |
| Android trung | 4–6 GB RAM, màn 1080p |
| Android cao | 8 GB RAM trở lên |
| iPhone | 1 máy cũ + 1 máy mới |
| Trình duyệt | Chrome, Safari, Firefox, Edge bản mới; PC và laptop |
| Tay cầm | 1 tay cầm kiểu Xbox, 1 kiểu PlayStation |

## 2. Quy trình chơi thử

- **Người thử:** 5 người mỗi đợt, chưa từng xem game; người ngoài nhóm làm game.
- **Cách làm:** để họ tự chơi, không giải thích; quay màn hình và ghi lại chỗ dừng, chết, bỏ cuộc.
- **Đo:** thời gian hoàn thành, số lần chết mỗi đoạn, chỗ không hiểu giao diện, mức vui (1–5).
- **Quy tắc:** nếu hơn 30% người thử chết ở cùng một điểm thì nới khe né hoặc thêm checkpoint trước khi chỉnh chỉ số kẻ địch.

| Mốc | Câu hỏi kiểm tra |
|---|---|
| Prototype | Nhảy, lướt, bắn có "sướng" không (điểm ≥ 4/5 từ ít nhất 4 người)? Quy trình và công cụ: `05-Cong-Prototype.md` |
| Vertical slice (G2) | Prologue hoàn thành ≥ 90%; Stage 1 ≥ 70% ở phiên đầu; Thorna thắng được bằng Arc Cannon |
| MVP (G3) | Khoảng 50 người, 2 đợt × 25, bản web: tiêu chí, cách đo, quy tắc quyết định ở `08-Cong-MVP.md`; dữ liệu theo `01-GDD/13-Do-luong-MVP.md` |
| Alpha | Có người nào mua được món đầu tiên mà không cần hướng dẫn? Kinh tế không vỡ? |
| Beta | Độ khó từng màn theo thứ tự tự do có hợp lý không? Có chuỗi build phá boss quá nhanh không? |
| Soft launch | Đạt cổng KPI (mục 4.2) |

## 3. Phân loại lỗi

| Mức | Ví dụ | Xử lý |
|---|---|---|
| Chặn | Crash, mất dữ liệu, mất tiền, nhân đôi Gem, không vào được màn | Sửa ngay, chặn phát hành |
| Cao | Không mua được, quảng cáo hiện sai chỗ, boss kẹt | Sửa trong sprint |
| Trung | Hiệu ứng sai, chữ tràn | Gom lại sửa theo đợt |
| Thấp | Căn chỉnh nhỏ | Khi rảnh |

## 4. Soft launch

### 4.1 Cách làm

1. Chọn 1–2 thị trường nhỏ gần với thị trường mục tiêu (ảnh hưởng eCPM và giá).
2. Đầu tiên mở với quảng cáo rewarded và IAP; thêm interstitial sau tuần đầu nếu giữ chân ổn.
3. Dùng Remote Config để chỉnh tần suất quảng cáo, tỷ lệ rơi, thưởng sự kiện mà không phát hành lại.
4. Theo dõi hằng ngày: crash-free, D1/D7, ARPDAU, tỷ lệ chọn rewarded, doanh thu theo gói.
5. Mua người dùng chỉ khi qua cổng quyết định.

### 4.2 Cổng quyết định `[PLACEHOLDER]`

| Chỉ số | Ngưỡng đi tiếp |
|---|---|
| Crash-free | ≥ 99% |
| Giữ chân D1 / D7 | ≥ 35% / ≥ 10% |
| Hoàn thành Prologue | ≥ 90% |
| Giá trị vòng đời (LTV) so với chi phí mua người dùng (CPI) | LTV > CPI trong thị trường đó |
| Khiếu nại về quảng cáo hoặc "pay-to-win" | Không có xu hướng tăng |

Chưa đạt: chỉnh onboarding, độ khó, tần suất quảng cáo; chưa tăng chi tiêu.

## 5. Danh sách phát hành

### 5.1 Google Play

- Tài khoản nhà phát triển, ký ứng dụng, khai báo an toàn dữ liệu (Data safety), phân loại nội dung, chính sách quyền riêng tư công khai.
- Cấu hình hàng hóa: gói Gem, Starter Pack, Cyber+ (tháng/năm, dùng thử), kiểm thử thanh toán bằng tài khoản thử.
- Kênh thử: nội bộ, kín, mở; kiểm tra yêu cầu thử kín hiện hành với tài khoản cá nhân mới (thường phải có một nhóm người thử trong một thời gian trước khi lên bản chính thức).
- Phiên bản SDK mục tiêu theo yêu cầu hiện hành của cửa hàng.

### 5.2 App Store

- Tài khoản nhà phát triển, App Store Connect, nhãn quyền riêng tư (privacy nutrition label), hộp thoại theo dõi (ATT) nếu theo dõi.
- Cấu hình IAP và subscription; "Khôi phục giao dịch"; công bố tỷ lệ cho mọi cơ chế ngẫu nhiên trả tiền; tiền mua bằng IAP không hết hạn.
- TestFlight cho thử nghiệm; chuẩn bị thời gian chờ duyệt; nếu dùng đăng nhập bên thứ ba, kiểm tra yêu cầu đăng nhập tương đương của Apple.

### 5.3 Web

- Tên miền, HTTPS, đăng ký H5 Games Ads (cần được duyệt), cổng thanh toán web, chính sách quyền riêng tư và cookie/đồng ý quảng cáo.

### 5.4 Pháp lý và tuân thủ

- Chính sách quyền riêng tư, điều khoản sử dụng, điều khoản subscription (giá, kỳ hạn, tự gia hạn, cách hủy).
- Độ tuổi: đặt 13+ và có màn hình xác nhận tuổi; đồng ý quảng cáo (UMP) cho EU/UK.
- Kế toán và thuế tại Việt Nam và thị trường mục tiêu: tham khảo chuyên gia.

### 5.5 Tài liệu cửa hàng

- Biểu tượng 1024×1024, ảnh nổi bật 1024×500, 6–8 ảnh chụp màn hình (chụp từ game thật), trailer 30–45 giây, mô tả và từ khóa (ASO), địa phương hóa tiếng Việt và tiếng Anh.

## 6. Lịch trước và sau ra mắt

| Thời điểm | Việc |
|---|---|
| T−8 tuần | Đóng băng tính năng; bắt đầu thử kín; hoàn thiện chính sách và tài khoản cửa hàng |
| T−6 tuần | Soft launch (mục 4); đo KPI |
| T−4 tuần | Sửa theo dữ liệu; quay trailer; hoàn thiện ảnh cửa hàng |
| T−2 tuần | Nộp bản chờ duyệt; kiểm tra thanh toán và quảng cáo thật |
| T−1 tuần | Kiểm tra cuối: danh sách chặn lỗi = 0; chuẩn bị bảng theo dõi |
| T (ngày ra mắt) | Mở dần theo vùng; theo dõi crash, thanh toán, quảng cáo mỗi vài giờ |
| T+1 đến T+7 | Sửa lỗi nóng; trả lời đánh giá; chỉnh bằng Remote Config |
| T+2 tuần | Sự kiện đầu tiên |
| T+4 tuần | Mùa đầu và bản vá cân bằng; cân nhắc mở Rift |

**Khi có sự cố:** tắt tính năng bằng Remote Config trước, sửa lỗi sau; có sẵn quy trình bản vá nhanh và cách khôi phục tiền cho người dùng bị ảnh hưởng.
