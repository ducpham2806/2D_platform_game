# Kế hoạch gắn quảng cáo

Kế hoạch chi tiết cho quảng cáo trong Cyber Vanguard: vị trí, phần thưởng (năng lượng, mạng, lượt), tần suất, kỹ thuật, đo lường và triển khai. Bổ sung cho mục 4 của tab Kế hoạch kiếm tiền và Live-ops. Mọi con số đánh dấu `[PLACEHOLDER]` là giả thuyết cần đo khi soft launch. Không phải tư vấn pháp lý.

## 1. Mục tiêu, nguyên tắc và cách hiểu yêu cầu

**Mục tiêu:** doanh thu quảng cáo chủ yếu từ rewarded ads tự nguyện, không làm hỏng cảm giác chơi, không chặn cốt truyện, không ép người chơi xem.

### 1.1 Cách hiểu yêu cầu "năng lượng, mạng, lượt"

| Bạn yêu cầu | Trong GDD hiện tại | Cách triển khai bằng quảng cáo |
| --- | --- | --- |
| Xem ads nhận **năng lượng** | Chỉ có thanh năng lượng vũ khí (28 đơn vị) và Nano Cell; **không có thể lực (stamina) giới hạn lượt chơi** | Nạp đầy năng lượng vũ khí; hồi 1 Nano Cell |
| Xem ads **tăng mạng** | Không có hệ thống "mạng"; chết thì hồi sinh ở checkpoint (trận boss hồi sinh trong phòng, miễn phí) | Hồi sinh tại chỗ (50% máu, bất tử 2 giây); khiên miễn phí đầu màn |
| Xem ads **thêm lượt** | Không giới hạn lượt chơi; có lượt vòng quay, Sweep, lượt thưởng gấp đôi, đổi nhiệm vụ ngày | Thêm lượt vòng quay, Sweep, lượt thưởng gấp đôi, đổi nhiệm vụ |

**Lưu ý thiết kế quan trọng:** GDD cố ý **không có thể lực hay số mạng giới hạn** (Farm không giới hạn lượt, trụ cột "tôn trọng người chơi"). Vì vậy kế hoạch này **không bán "năng lượng để được chơi"** bằng quảng cáo; quảng cáo chỉ làm phần thưởng tiện ích. Nếu bạn thật sự muốn hệ thống thể lực/mạng giới hạn thì đó là thay đổi thiết kế lớn (ảnh hưởng Farm, kinh tế, trụ cột 5) và cần quyết định riêng trước khi làm.

### 1.2 Nguyên tắc

1. **Tự nguyện:** mọi rewarded ads là lựa chọn, có mô tả phần thưởng trước khi xem, không tự phát.
2. **Đúng lúc:** chỉ đề nghị ở các khoảnh khắc nghỉ (sau khi chết, ở menu tạm dừng, màn Chuẩn bị, màn Kết quả, Hub), không bao giờ ngắt lúc đang điều khiển.
3. **Không chặn cốt truyện:** không có phần nào của cốt truyện bắt buộc xem quảng cáo.
4. **Phần thưởng tiện ích, không phải sức mạnh vĩnh viễn:** không thưởng Chip Lõi, chỉ số, Gem trực tiếp từ quảng cáo thường (bảo vệ doanh thu IAP).
5. **Giới hạn rõ ràng:** mỗi vị trí có hạn mức mỗi màn và mỗi ngày, hiển thị cho người chơi.
6. **Cyber+ bỏ phiền toái:** người đăng ký nhận thưởng ngay, không còn interstitial.

## 2. Định dạng quảng cáo

| Định dạng | Dùng? | Lý do |
| --- | --- | --- |
| **Rewarded video** | Có, chính | Tự nguyện, giá trị cao, người chơi chấp nhận tốt |
| **Rewarded interstitial** | Thử sau (giai đoạn 3) | Có thông báo trước và người chơi được chọn bỏ; chỉ thử A/B ở màn Kết quả |
| **Interstitial** | Có, giới hạn chặt | Chỉ khi chuyển cảnh (Kết quả về Hub); không trong màn chơi |
| **Banner** | Không | Che HUD, giảm chất lượng, doanh thu thấp |
| **App open** | Không | Gây khó chịu ngay lúc mở game, ảnh hưởng giữ chân |
| **Native / Offerwall** | Không | Không phù hợp game hành động |

**Web PC:** dùng H5 Games Ads (hàm adBreak) cho hai dạng tương đương: `reward` (rewarded) và `next` (interstitial khi chuyển cảnh). Game phải tạm dừng và tắt tiếng khi quảng cáo chạy, rồi tiếp tục đúng trạng thái.

## 3. Bản đồ vị trí quảng cáo

### 3.1 Rewarded ads

Hạn mức là `[PLACEHOLDER]`, chỉnh bằng Remote Config.

| ID | Vị trí và thời điểm | Phần thưởng | Hạn mức | Cyber+ |
| --- | --- | --- | --- | --- |
| `AD_REVIVE` | Màn hồi sinh sau khi chết, **chỉ ở màn thường** (phòng boss đã hồi sinh miễn phí) | Hồi sinh tại chỗ, 50% máu, bất tử 2 giây | 1 lần mỗi màn (dùng chung với Second Wind và Second Chance, GDD mục 10), 6 mỗi ngày | Nhận ngay, vẫn giới hạn 1 mỗi màn |
| `AD_ENERGY` | Mục "Hỗ trợ" trong menu tạm dừng, và chip "+Năng lượng" cạnh thanh năng lượng khi dưới 15% (chạm vào sẽ tạm dừng game) | Nạp đầy năng lượng vũ khí | 1 lần mỗi màn, 4 mỗi ngày | Nhận ngay |
| `AD_HEAL` | Mục "Hỗ trợ" trong menu tạm dừng khi hết Nano Cell và máu dưới 30% | Hồi đầy 1 Nano Cell | 1 lần mỗi màn, 3 mỗi ngày | Nhận ngay |
| `AD_BOOSTER` | Màn Chuẩn bị: nút "Booster miễn phí" | 1 booster tự chọn trong Shield Cell, Magnet Pulse, Overcharge | 1 lần mỗi màn, 5 mỗi ngày | Nhận ngay |
| `AD_DOUBLE` | Màn Kết quả: "Nhân đôi Core Bit" | Nhân đôi **Core Bit** của màn (không nhân EXP, Data Chip) | 6 mỗi ngày | Tự động nhân đôi |
| `AD_GIFT` | Hub: "Quà miễn phí", hồi chiêu 4 giờ | 100–200 Core Bit hoặc 1 booster ngẫu nhiên | 3 mỗi ngày | Nhận không cần xem |
| `AD_SPIN` | Màn vòng quay | +1 lượt quay | 2 mỗi ngày | Nhận +1 lượt miễn phí |
| `AD_LOGIN` | Đăng nhập hằng ngày khi lỡ ngày | Bù 1 ngày | 1 mỗi ngày | Nhận ngay |
| `AD_SWEEP` | Menu Farm / Sweep | +1 lượt Sweep | 2 mỗi ngày | Nhận ngay |
| `AD_FARM2X` | Menu Farm | +1 lượt thưởng gấp đôi | 2 mỗi ngày | Nhận ngay |
| `AD_QUEST` | Màn nhiệm vụ | Đổi 1 nhiệm vụ ngày | 1 mỗi ngày | Nhận ngay |
| `AD_SALVAGE` | Kho Chip: khi phân rã Chip | Nhân đôi vật liệu thu được | 3 mỗi ngày | Nhận ngay |

### 3.2 Interstitial

| ID | Vị trí | Điều kiện | Cyber+ |
| --- | --- | --- | --- |
| `INT_HUB` | Khi chuyển từ màn Kết quả về Hub | Cách quảng cáo trước ≥ 4 phút; tối đa 1 mỗi 2 màn và ≤ 2 mỗi ngày; không trong 20 phút đầu, không ở Prologue, Stage 1, sau boss, hoặc khi vừa chết ≥ 3 lần liên tiếp | Tắt |
| `INT_FARM` | Khi về menu Farm sau 3 lượt Farm liên tiếp | Tối đa 1 mỗi ngày; cùng giới hạn cách quãng | Tắt |

### 3.3 Nơi **không bao giờ** có quảng cáo

Prologue; trận boss và mọi lúc đang điều khiển nhân vật; màn Chuẩn bị (chỉ có nút rewarded tùy chọn); trước và trong lúc mua hàng; màn xác nhận tuổi và đồng ý quảng cáo; màn Cyber+; màn hội thoại và cutscene; ngay sau khi mở game.

## 4. Quy tắc tần suất, công bằng và ảnh hưởng kinh tế

### 4.1 Nhịp và bảo vệ người chơi `[PLACEHOLDER]`

| Quy tắc | Giá trị |
| --- | --- |
| Ngày đầu tiên | Chỉ có rewarded; interstitial bật từ ngày 2 |
| Interstitial | ≥ 4 phút giữa hai quảng cáo, tối đa 2 mỗi ngày, 1 mỗi 2 màn |
| Bảo vệ bực bội | Vừa chết ≥ 3 lần liên tiếp trong 5 phút: tắt interstitial 10 phút |
| Đề nghị rewarded | Tối đa 1 gợi ý nổi mỗi 3 phút; không chồng lên popup IAP hay ưu đãi |
| Popup mỗi phiên | Tổng ưu đãi IAP và gợi ý quảng cáo chủ động tối đa 1 mỗi phiên (nút rewarded do người chơi tự bấm không tính) |
| Phục hồi sau quảng cáo | Đếm ngược 3–2–1 trước khi tiếp tục điều khiển |
| Tổng rewarded mỗi ngày | Hạn mức từng vị trí (mục 3.1); kỳ vọng thực tế khoảng 3 lượt xem mỗi người mỗi ngày |

### 4.2 Ảnh hưởng kinh tế (đã kiểm tra bằng mô hình)

Chỉ `AD_DOUBLE` và `AD_GIFT` tăng Core Bit. Với 6 lượt chơi 250 Core Bit mỗi ngày (1.500) và ngân sách Chip +15 ở tab Cân bằng kinh tế:

| Tỷ lệ lượt được nhân đôi | Core Bit mỗi lượt | Số lượt đủ Core Bit cho 6 Chip +15 (86.448) | Giờ cho một bộ Legendary +15 |
| --- | --- | --- | --- |
| 0% (không xem) | 250 | 346 | \~29 |
| 25% | 313 | 277 | \~24,3 (nút thắt chuyển sang rơi đồ) |
| 50% | 375 | 231 | \~24,3 |
| 100% | 500 | 173 | \~24,3 |

Kết luận: quảng cáo nhân đôi **không làm vỡ** cân bằng endgame vì giới hạn thật là tỷ lệ rơi Chip (291 lượt, \~24 giờ). Nó chỉ rút nút thắt Core Bit từ \~29 xuống \~24 giờ cho người xem quảng cáo. Ở phần cốt truyện, người nhân đôi mọi màn hoàn thiện Shop nhanh hơn khoảng 30%, chấp nhận được vì đó là nhóm đang đóng góp doanh thu quảng cáo.

**Quy tắc bảo vệ kinh tế:** (1) chỉ nhân đôi Core Bit, **không** nhân EXP để không phá cân bằng cấp; (2) không thưởng Gem, Data Chip, Chip Lõi từ quảng cáo thường; (3) hạn mức `AD_DOUBLE` 6 mỗi ngày (thay cho 10 ở kế hoạch trước); (4) theo dõi thu Core Bit từ quảng cáo, báo động nếu vượt 60% thu cơ bản.

## 5. Luồng giao diện và xử lý lỗi

### 5.1 Nút đề nghị quảng cáo (chuẩn chung)

- Nhãn rõ: biểu tượng video + "Xem quảng cáo" + **phần thưởng cụ thể** (ví dụ "Nạp đầy năng lượng"), số lần còn lại hôm nay ("2/4").
- Không bao giờ tự phát quảng cáo; chỉ chạy khi người chơi bấm.
- Trong lúc quảng cáo chạy: tạm dừng game, tắt tiếng nhạc nền, khóa nút để không bấm hai lần.
- Sau quảng cáo: hiện thưởng bằng thông báo ngắn rồi đếm ngược 3–2–1 trước khi trở lại điều khiển.
- Người đăng ký Cyber+: nút đổi thành "Nhận (Cyber+)", không gọi SDK, vẫn trừ hạn mức.

### 5.2 Luồng hồi sinh (`AD_REVIVE`)

1. Kai bị hạ, 1 giây hoạt ảnh.
2. Màn hồi sinh: **Về checkpoint** (miễn phí, nút nổi bật ngang hàng) và **Xem quảng cáo để hồi sinh tại chỗ** (50% máu, bất tử 2 giây).
3. Không có đồng hồ đếm ngược ép chọn.
4. Ở phòng boss: hồi sinh miễn phí trong phòng như cũ, không có nút quảng cáo.

### 5.3 Tình huống lỗi

| Tình huống | Xử lý |
| --- | --- |
| Chưa có quảng cáo (no fill) | Ẩn nút hoặc hiện "Chưa có quảng cáo, thử lại sau"; không trừ hạn mức; hồi sinh vẫn có nút về checkpoint |
| Đóng sớm, chưa xem hết | Không thưởng; thông báo "Xem hết quảng cáo để nhận thưởng"; không trừ hạn mức |
| Xem xong | SDK báo thưởng; với thưởng lưu lâu dài (Core Bit, booster, lượt) máy chủ xác nhận rồi mới cộng; hiện thông báo |
| Thoát app, có cuộc gọi giữa chừng | Khi quay lại: nếu đã có sự kiện thưởng thì cộng, nếu không thì không thưởng |
| Mất mạng lúc nhận thưởng | Xếp hàng gửi lại; cộng khi đồng bộ; mã giao dịch ngăn nhận hai lần |
| Quảng cáo lỗi giữa chừng | Xem như không thưởng, cho thử lại 1 lần |
| Bấm nhanh hai lần | Khóa nút ngay khi bấm; chỉ một phiên quảng cáo mỗi lần |
| Hết hạn mức | Nút xám, ghi "Hết lượt hôm nay", hiện thời điểm làm mới |

### 5.4 Interstitial

Hiện khi chuyển cảnh (Kết quả về Hub), có nhãn "Quảng cáo" trước khi vào, không đặt nút ở vùng dễ bấm nhầm, và tuân thủ điều kiện ở mục 3.2.

## 6. Kiến trúc kỹ thuật và cấu hình

### 6.1 Lớp trừu tượng

```ts
type PlacementId = 'AD_REVIVE' | 'AD_ENERGY' | 'AD_HEAL' | 'AD_BOOSTER' | 'AD_DOUBLE'
  | 'AD_GIFT' | 'AD_SPIN' | 'AD_LOGIN' | 'AD_SWEEP' | 'AD_FARM2X' | 'AD_QUEST' | 'AD_SALVAGE'
  | 'INT_HUB' | 'INT_FARM';

interface AdResult { status: 'rewarded' | 'closed' | 'no_fill' | 'error'; nonce?: string }

interface AdService {
  init(consent: ConsentState): Promise<void>;
  preload(p: PlacementId): void;
  isReady(p: PlacementId): boolean;
  showRewarded(p: PlacementId): Promise<AdResult>;
  showInterstitial(p: PlacementId): Promise<AdResult>;
}
// Cài đặt: AdMobAdService (app) và H5AdService (web, qua adBreak)
// PlacementManager: hạn mức mỗi màn/ngày, hồi chiêu, Cyber+, Remote Config
// RewardService.claim(placement, nonce) -> máy chủ cộng thưởng một lần
```

### 6.2 Tải trước và hiển thị

- Tải trước 1 rewarded khi vào Hub và khi bắt đầu màn; tải trước interstitial khi vào màn Kết quả; tải lại ngay sau mỗi lần hiển thị.
- Thời gian chờ tải tối đa 3 giây; quá hạn thì coi là chưa sẵn sàng.
- Tên placement dùng nhất quán để báo cáo theo vị trí.

### 6.3 Xác thực thưởng phía máy chủ

- Thưởng lưu lâu dài (Core Bit, booster, lượt vòng quay/Sweep, bù đăng nhập) được cộng bằng máy chủ. Dùng xác thực phía máy chủ của AdMob (SSV) hoặc mã `nonce` do máy chủ cấp và kiểm tra một lần.
- Thưởng tạm thời trong màn (hồi sinh, nạp năng lượng, hồi Nano Cell) có thể tin client vì không lưu lâu dài.
- Ghi log mỗi lượt thưởng để phát hiện gian lận (số lần bất thường mỗi ngày).

### 6.4 Cấu hình Remote Config (mẫu)

```json
{
  "ads": {
    "AD_REVIVE": {"enabled": true, "capPerStage": 1, "capPerDay": 6, "reviveHpPct": 50, "invincibleSec": 2},
    "AD_ENERGY": {"enabled": true, "capPerStage": 1, "capPerDay": 4, "triggerEnergyPct": 15},
    "AD_DOUBLE": {"enabled": true, "capPerDay": 6, "multiplier": 2, "applyTo": ["core_bit"]},
    "AD_GIFT": {"enabled": true, "capPerDay": 3, "cooldownHours": 4},
    "INT_HUB": {"enabled": true, "minGapMin": 4, "capPerDay": 2, "everyNStages": 2,
                "noAdFirstMinutes": 20, "startDay": 2, "frustrationGuard": {"deaths": 3, "windowMin": 5, "muteMin": 10}}
  }
}
```

### 6.5 Sự kiện đo lường

| Sự kiện | Tham số |
| --- | --- |
| `ad_offer_shown` | placement, stage, difficulty, remaining\_cap |
| `ad_offer_click` | placement |
| `ad_start` / `ad_close` | placement, network, duration |
| `ad_reward` | placement, reward\_type, amount |
| `ad_no_fill` / `ad_error` | placement, code |
| `ad_cap_hit` | placement, scope (stage/day) |

### 6.6 Prompt ChatGPT cho module quảng cáo

- **P-ADS-01:** "Viết interface AdService và hai cài đặt AdMobAdService (Capacitor) và H5AdService (adBreak). Có preload, timeout 3 giây, trả AdResult. Không gọi SDK trực tiếp từ giao diện."
- **P-ADS-02:** "Viết PlacementManager đọc cấu hình ở mục 6.4: hạn mức mỗi màn và mỗi ngày, hồi chiêu, bảo vệ bực bội, Cyber+. Có test cho mọi hạn mức."
- **P-ADS-03:** "Viết component AdOfferButton theo chuẩn mục 5.1 và luồng hồi sinh mục 5.2; xử lý các tình huống lỗi ở mục 5.3."
- **P-ADS-04:** "Viết Edge Function Supabase nhận callback xác thực thưởng (SSV) và hàm claim(nonce) cộng thưởng một lần, chống nhận lặp."

## 7. Đo lường, A/B test và ước tính doanh thu

### 7.1 Ước tính theo vị trí `[PLACEHOLDER]`

Giả định kịch bản cơ sở: eCPM rewarded 6 USD, interstitial 3 USD. Tổng khoảng 2,9 lượt rewarded và 1,5 interstitial mỗi người dùng hoạt động mỗi ngày, khớp bảng doanh thu ở tab Kế hoạch kiếm tiền (ARPDAU quảng cáo \~0,022).

**Điều chỉnh từ GDD 0.5:** `AD_REVIVE` giảm từ 0,35 xuống 0,25 lượt mỗi DAU vì hai lý do. (1) Giới hạn mỗi màn hạ từ 2 xuống 1 lần, nên mất các lượt hồi sinh thứ hai; theo giả định khoảng 20% lượt hồi sinh cũ là lượt thứ hai trong cùng màn. (2) Giới hạn này dùng chung với Second Wind và Second Chance; người đã có một trong hai thứ đó thì không còn nút quảng cáo, ước tính mất thêm khoảng 10% `[PLACEHOLDER]`. Tổng giảm khoảng 0,0006 USD mỗi DAU (khoảng 3% doanh thu quảng cáo).

| Vị trí | Lượt xem mỗi DAU | Doanh thu mỗi DAU (USD) |
| --- | --- | --- |
| `AD_DOUBLE` | 0,70 | 0,0042 |
| `AD_SPIN` | 0,50 | 0,0030 |
| `AD_BOOSTER` | 0,40 | 0,0024 |
| `AD_REVIVE` | 0,25 | 0,0015 |
| `AD_GIFT` | 0,35 | 0,0021 |
| `AD_ENERGY` | 0,20 | 0,0012 |
| `AD_FARM2X` | 0,20 | 0,0012 |
| `AD_SWEEP` | 0,15 | 0,0009 |
| `AD_HEAL` | 0,10 | 0,0006 |
| `AD_LOGIN` | 0,05 | 0,0003 |
| Rewarded tổng | 2,90 | 0,0174 |
| Interstitial (`INT_HUB`, `INT_FARM`) | 1,50 | 0,0045 |
| **Tổng quảng cáo** |  | **0,0219** |

Nhóm đem lại nhiều doanh thu nhất: nhân đôi thưởng, vòng quay, booster miễn phí, hồi sinh. `AD_QUEST`, `AD_SALVAGE` có lượt rất nhỏ nên chưa tính.

### 7.2 Bảng theo dõi

| Chỉ số | Mục tiêu `[PLACEHOLDER]` |
| --- | --- |
| Tỷ lệ bấm khi thấy gợi ý (offer → click) theo vị trí | 8–15% |
| Tỷ lệ xem hết (start → reward) | ≥ 90% |
| Tỷ lệ có quảng cáo (fill) | ≥ 85% |
| Số lần chạm hạn mức mỗi ngày | Theo dõi: chạm nhiều nghĩa là vị trí được ưa chuộng |
| Giữ chân ngày 1 / 7 so với nhóm đối chứng | Không giảm quá 2 điểm phần trăm |
| Khiếu nại về quảng cáo | Không tăng |

### 7.3 Thí nghiệm A/B

| Thí nghiệm | Biến thể | Chỉ số chính | Chỉ số bảo vệ |
| --- | --- | --- | --- |
| Hồi sinh | 50% máu hay 100% máu | Tỷ lệ bấm, doanh thu | Tỷ lệ qua màn |
| Khoảng cách interstitial | 4 phút hay 6 phút | ARPDAU | Giữ chân D1/D7 |
| Ngưỡng gợi ý năng lượng | 15% hay 25% | Tỷ lệ bấm | Số lần dừng game |
| Hồi chiêu quà | 4 giờ hay 6 giờ | Lượt xem mỗi DAU | Giữ chân ngày 7 |
| Nhân đôi Core Bit | ×2 hay ×1,5 | Tỷ lệ bấm | Tốc độ hoàn thiện Shop |
| Rewarded interstitial ở màn Kết quả | Bật hay tắt | ARPDAU | Khiếu nại, giữ chân |

## 8. Tuân thủ và chính sách

| Mục | Việc cần làm |
| --- | --- |
| Rewarded phải tự nguyện | Không thưởng cho việc bấm quảng cáo hay cài đặt; không khuyến khích bấm; thưởng chỉ khi xem xong |
| Interstitial | Chỉ ở chuyển cảnh tự nhiên; không lúc mở hay thoát app; không bất ngờ trong lúc điều khiển |
| Bấm nhầm | Không đặt nút điều khiển hay nút thưởng sát vùng quảng cáo dễ bấm nhầm |
| Độ tuổi và đồng ý | 13+; hộp thoại đồng ý (UMP) cho EU/UK; hộp thoại theo dõi (ATT) trên iOS; chính sách quyền riêng tư công khai |
| Nội dung quảng cáo | Dùng kiểm soát danh mục của mạng quảng cáo để chặn nội dung không phù hợp độ tuổi (cờ bạc, người lớn...) |
| Phát triển và test | Chỉ dùng quảng cáo thử; không tự bấm quảng cáo thật (nguy cơ bị khóa tài khoản vì lưu lượng không hợp lệ) |
| Bản web | Tuân thủ điều kiện đăng ký H5 Games Ads: tạm dừng và tắt tiếng game khi quảng cáo chạy, đúng vị trí gọi adBreak |
| Chính sách hiện hành | Đọc lại chính sách AdMob, Apple và Google Play trước khi nộp; chính sách thay đổi theo thời gian |
| Nếu hạ độ tuổi xuống dưới 13 | Cần cấu hình quảng cáo hướng đến trẻ em, hạn chế cá nhân hóa; thiết kế lại toàn bộ kế hoạch quảng cáo |

## 9. Kiểm thử và triển khai theo giai đoạn

### 9.1 Danh sách kiểm thử

- [ ] Mọi vị trí hiện đúng điều kiện, đúng hạn mức mỗi màn và mỗi ngày; hạn mức làm mới đúng giờ.
- [ ] Không có quảng cáo ở Prologue, trận boss, trong lúc điều khiển, màn tuổi/đồng ý, màn Cyber+.
- [ ] Chế độ máy bay (mất mạng), không có quảng cáo, quảng cáo lỗi: game không treo, không mất hạn mức.
- [ ] Đóng sớm: không thưởng. Xem xong: thưởng đúng một lần, kể cả khi bấm hai lần hoặc mạng chập chờn.
- [ ] Cuộc gọi đến, thoát app, khóa màn hình giữa quảng cáo: trở lại đúng trạng thái.
- [ ] Âm thanh tắt trong quảng cáo, bật lại đúng; đếm ngược 3–2–1 trước khi tiếp tục.
- [ ] Cyber+ nhận thưởng không cần xem, không còn interstitial, vẫn trừ hạn mức.
- [ ] Bảo vệ bực bội: chết 3 lần liên tiếp thì tắt interstitial 10 phút.
- [ ] Thưởng lâu dài được máy chủ ghi một lần (kiểm tra nhận lặp).
- [ ] Bản web: adBreak tạm dừng và khôi phục game đúng.

### 9.2 Triển khai

| Giai đoạn | Nội dung | Điều kiện sang giai đoạn sau |
| --- | --- | --- |
| 1. Live-ops MVP (nội bộ, quảng cáo thử) | `AD_REVIVE`, `AD_DOUBLE`, `AD_SPIN`, `AD_BOOSTER`, `AD_GIFT`, `AD_LOGIN` | Qua danh sách kiểm thử; không lỗi nhân đôi thưởng |
| 2. Soft launch tuần 1–2 | Thêm `AD_ENERGY`, `AD_HEAL`, `AD_FARM2X`, `AD_SWEEP`, `AD_QUEST`, `AD_SALVAGE` (endgame khi đã có) | Fill ≥ 85%, xem hết ≥ 90%, giữ chân không giảm quá 2 điểm |
| 3. Soft launch tuần 3 trở đi | Bật `INT_HUB`, `INT_FARM`; chạy các thí nghiệm mục 7.3 | ARPDAU đạt kịch bản thận trọng trở lên; không tăng khiếu nại |
| 4. Ra mắt | Tối ưu mediation, mức giá sàn, thử rewarded interstitial | KPI ổn định 2 tuần |

Mỗi giai đoạn có công tắc bằng Remote Config để tắt nhanh từng vị trí khi có sự cố.

## 10. Thay đổi cần cập nhật

| Hạng mục | Thay đổi |
| --- | --- |
| Tab Kế hoạch kiếm tiền, mục 4 | `AD_DOUBLE`: chỉ nhân đôi Core Bit (không EXP), hạn mức 6 mỗi ngày (đã sửa) |
| GDD mục 13 (UI) | Trỏ tới tab này; thêm vị trí quảng cáo ở menu tạm dừng, màn Chuẩn bị, Kết quả, Hub (đã bổ sung wireframe bản đồ vị trí) |
| Dữ liệu | `03-Data/adplacements.json` (mới) và `monetization.json` (cập nhật hạn mức) |
| Wireframe | 5 màn mới: bản đồ vị trí ở HUD, Chuẩn bị, Kết quả, Hub và các kết quả của quảng cáo; sửa `NAdDouble` |
| Bộ prompt code | Thêm P-ADS-01 đến P-ADS-04 |
| Kế hoạch test | Thêm mục kiểm thử quảng cáo (mục 9.1) |
| Câu hỏi cần xác nhận | Có muốn hệ thống thể lực hoặc mạng giới hạn thật sự không (hiện không có, xem mục 1.1) |
