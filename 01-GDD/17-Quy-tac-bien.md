# 17. Quy tắc biên (ngóc ngách của trò chơi)

*Bản 1.4 · 14/11/2026 · Trạng thái: Approved (ủy quyền: người dùng giao toàn quyền quyết định; xem mục 19) · Nguồn: rà soát `/review-all-gdds` + `/consistency-check` ngày 14/11/2026 (4 báo cáo: lõi, kinh tế, giao diện và lời thoại, quy trình)*

## 0. Mục đích và cách dùng

Tài liệu GDD mô tả luật chính. File này gom các **tình huống biên**: hai luật gặp nhau, người chơi làm điều thiết kế không tính tới, hoặc một sự kiện xảy ra đúng lúc một sự kiện khác. Mỗi luật có mã `QB-xx` để Story, test và chú thích code trỏ tới.

- **Nguồn chuẩn:** khi luật ở đây khác GDD khác, file này đúng cho tình huống biên; GDD gốc đúng cho luật chính. Thấy mâu thuẫn thì sửa cả hai trong cùng commit (`/propagate-design-change`).
- **Số:** mọi số chưa code là `[PLACEHOLDER]`. Số đã code nằm trong `03-Data/*.json`; tên trường ghi ở cột Tham số.
- **Kiếm tiền và live-ops:** quy tắc biên của Gem, IAP, quảng cáo, Season Pass, đăng nhập… nằm ở `05-Ke-hoach-kiem-tien.md`, mục "Quy tắc biên kiếm tiền và live-ops". File này chỉ ghi phần chạm vào trận đấu (hồi sinh, booster).

**Trạng thái:**

| Nhãn | Nghĩa |
| --- | --- |
| Code | Đã có trong code và có test |
| Code (chưa test) | Code đang làm đúng nhưng chưa có test khóa lại; viết test khi chạm module |
| Story MVP | Cần Story trước cổng MVP |
| Sau cổng | Cần Story nhưng phụ thuộc thông số cảm giác; chờ quyết định cổng Prototype (G1) |
| Alpha / Beta | Hệ thống chưa có trong MVP; luật ghi trước để không phải đoán khi làm |

## 1. Di chuyển

| Mã | Tình huống | Luật | Tham số | Trạng thái |
| --- | --- | --- | --- | --- |
| QB-01 | Thời gian hồi lướt | Tính từ lúc cú lướt **kết thúc**, không từ lúc bấm | `player.json → dash` | Code (test `player-physics.test.ts`) |
| QB-02 | Lướt qua gai hoặc rơi hố | Bất tử của lướt chỉ tránh đòn kẻ địch và boss; gai, hố vẫn gây sát thương | — | Code (chưa test) |
| QB-03 | Bị đánh khi đang lướt (sau khung bất tử) | Hủy lướt, mất tốc độ dash-jump, bật lùi như thường | — | Sau cổng (viết test) |
| QB-04 | Chết khi đang lướt hoặc đang lơ lửng | Hồi sinh như thường; lượt lướt trên không được hồi | — | Sau cổng (viết test) |
| QB-05 | Bắn khi leo thang, dây | Không bắn khi leo; nhảy rời thang cao 2 ô; leo 3 ô/s | `player.json → climb` (chưa có) | Sau cổng |
| QB-07 | Bị đánh khi đứng trong vùng gió | Gió không đẩy Kai trong thời gian choáng vì trúng đòn (`hurt.stunSec` 0,3 s), để không rơi hố chỉ vì bị đánh | `wind.hurtIgnores: true` (chưa có) | Sau cổng (Stage 4) |
| QB-06 | Dây di chuyển tới đầu mút | Dừng 0,5 s rồi quay đầu; Kai đứng trên dây đi theo dây | `mechanics.movingVine` (chưa có) | Sau cổng |

## 2. Chiến đấu, đổi vũ khí, năng lượng

| Mã | Tình huống | Luật | Tham số | Trạng thái |
| --- | --- | --- | --- | --- |
| QB-10 | Đổi vũ khí khi đang nạp dở | Mất nạp. Nạp đầy được giữ 2 s sau khi đổi | `weapons.json` | Code |
| QB-11 | Thả nút nạp khi đang cầm vũ khí boss | Không bắn gì (vũ khí boss không nạp) | — | Code (chưa test) |
| QB-12 | Hết năng lượng giữa chừng | Không bắn; phát sự kiện `emptyWeapon` (tiếng "tạch", thanh năng lượng nháy 0,3 s); **không** tự đổi sang vũ khí khác | — | Code một phần (chưa test): chỉ hiện chữ 0,6 s (viết cứng ở Scene); tiếng "tạch" ở EP-12, nháy thanh ở EP-14 |
| QB-13 | Năng lượng khi vào màn, chết, qua checkpoint | Tính riêng từng vũ khí. Đầy khi vào màn và khi chết; qua checkpoint **không** nạp lại | `refill` | Code (chưa test) |
| QB-14 | Vũ khí bắn nhanh khóa choáng boss liên tục | Trúng điểm yếu vẫn ×2,5 sát thương, nhưng sau khi hết choáng thì 1,5 s không choáng lại được. Choáng không xóa hạt Hoa Nở đã thả | `weakStunCooldownSec: 1.5` (chưa có) | Story MVP |
| QB-15 | Đổi qua lại hai vũ khí khi có nhiều ô | Vũ khí xếp theo thứ tự màn. Giữ nút đổi ≥ 0,3 s: đổi qua lại hai vũ khí dùng gần nhất. Cảm ứng: vuốt lên trên nút đổi | `controls.json → quickSwapHoldSec` (chưa có) | Sau cổng (cần khi có ≥ 3 vũ khí) |
| QB-16 | Vũ khí boss bắn vào khiên Lính Kén | Mỗi cú trúng tính 1 lần vào `shieldHits`, bất kể sát thương | `enemies.json` | Story Stage 2–4 |
| QB-18 | Prism Beam gặp khiên Lính Kén | Tia dừng ở mặt trước khiên, tính 1 lần `shieldHits`, không xuyên | — | Story Stage 2–4 (EP-15) |
| QB-19 | Frost Shard và Phase Step cùng làm vô hiệu một kẻ địch | Lấy `disabledSec` lớn hơn, không cộng dồn; boss và mini-boss miễn | `disabledSec` | Story Stage 2–4 (EP-15) |
| QB-17 | Vật phẩm năng lượng rơi | Tỉ lệ 6%, hồi 4 năng lượng vào vũ khí đang cầm; đang cầm Arc Cannon thì nạp vũ khí boss có % thấp nhất; không rơi khi mọi vũ khí đầy | `pickups.energyChance 0.06`, `energy 4` (chưa có) | Story MVP |

## 3. Kẻ địch

| Mã | Tình huống | Luật | Tham số | Trạng thái |
| --- | --- | --- | --- | --- |
| QB-20 | Chết để kẻ địch dựng lại rồi hạ lại (cày EXP, Core Bit) | Mỗi kẻ địch (theo id trên bản đồ) chỉ cho EXP và Core Bit **một lần mỗi lượt vào màn**; hạ lại chỉ có thể rơi viên máu | `stages.json → mechanics.enemyRewardOncePerRun: true` | Code |
| QB-21 | Mini-boss báo trước quá nhanh | Mini-boss theo luật báo trước của boss: đòn nào cũng báo ≥ 0,5 s | `minTelegraphSec` cho mini-boss (chưa có) | Story MVP |
| QB-22 | Spike Guard và đạn gai | Spike Guard chỉ miễn ô gai môi trường; đạn của Tháp Gai, Gai Quạt vẫn trúng | — | Code (chưa test; cờ `spikeGuard` chưa nối với module) |
| QB-24 | Kai chết sau khi đã hạ mini-boss | Mini-boss đã hạ không dựng lại trong lượt vào màn (phòng khóa giữ trạng thái mở) | — | Cần kiểm code (Golem), viết test |
| QB-23 | Kẻ địch bắn từ ngoài màn hình | Tầm hoạt động có cả trục dọc (7 ô). Kẻ địch chỉ bắt đầu báo trước khi đã nằm trong khung camera thu vào 1 ô | `activeRangeTilesY: 7`, `attackRequiresOnScreen` (chưa có) | Story MVP |

Tình huống biên riêng của từng màn và nhiệm vụ phụ: `15-Nhiem-vu-phu.md` mục 5; `16-Dac-ta-Stage2-4-nhap.md` mục 3.11, 4.11, 5.11.

## 4. Boss

| Mã | Tình huống | Luật | Tham số | Trạng thái |
| --- | --- | --- | --- | --- |
| QB-30 | Đạn Kai hạ boss và đòn boss hạ Kai trong cùng một bước | Boss về 0 máu ở bước nào thì thắng ở bước đó; đòn boss trong bước đó không tính | — | Code (`settleDefeat`, test `thorna.test.ts`) |
| QB-31 | Một đòn vượt qua hai ngưỡng pha | Máu kẹp ở ngưỡng kế tiếp; boss bất tử 0,6 s để đổi pha và xóa đạn boss | `phaseShiftSec: 0.6` (chưa có) | Story MVP |
| QB-32 | Kai chết trong phòng boss | Boss đầy máu, về pha 1; đếm chết cho gợi ý về 0 khi vào lại đấu trường | — | Code |
| QB-33 | Kai chết trong lúc đếm giờ trước màn Kết quả | Không mất trận thắng (boss đã chết, trận đã ghi) | — | Code (chưa test) |
| QB-34 | Thưởng boss khi đánh lại | Thưởng Core Bit và EXP của boss trả **một lần cho mỗi cặp boss–độ khó**; vũ khí boss chỉ trao lần thắng đầu tiên | `bosses.json → rewardCoreBit`, `rewardExp`; `progress.difficulty` | Code |

## 5. Checkpoint, chết, hồi sinh tại chỗ

| Mã | Tình huống | Luật | Tham số | Trạng thái |
| --- | --- | --- | --- | --- |
| QB-40 | Kích hoạt checkpoint | Chỉ khi Kai đứng trên mặt đứng được (ô đặc, bục một chiều, bệ mây đứng yên; không phải bục vỡ, bệ trôi) và đi qua; không đặt checkpoint trong vùng thử nhiệm vụ (`questZone`); chỉ tiến, không lùi. Màn dọc (Cirrus Tower): checkpoint là vùng chữ nhật trên Tiled, xét theo thứ tự | — | Code (màn ngang); vùng chữ nhật: Story Stage 4 |
| QB-41 | Qua checkpoint | Không hồi máu, không nạp năng lượng; đặt lại đếm chết cho gợi ý | — | Code (chưa test phần máu, năng lượng) |
| QB-42 | Chết trước checkpoint đầu tiên | Về đầu màn | — | Code |
| QB-43 | Rơi hố khi còn máu | Mất máu hố, về checkpoint gần nhất, giữ máu còn lại; hết máu thì tính là chết | `mechanics.pit` | Code |
| QB-44 | Nhiều nguồn hồi sinh tại chỗ cùng có | Thứ tự: booster Second Chance (đã kích hoạt lúc vào màn) → module Second Wind → quảng cáo. Mỗi lượt vào màn tối đa 1 lần hồi sinh bằng quảng cáo | `adplacements.json` (chuẩn), `inPlaceRevivePerStage.order` | Alpha |
| QB-45 | Hồi sinh tại chỗ (mọi nguồn) | Bất tử 2 s, xóa đạn địch trong 4 ô, mất nạp, boss giữ máu và pha. Máu khi hồi: Second Wind 20%, nguồn khác 50%. Chết vì hố hoặc gai thì dựng ở chỗ đứng an toàn gần nhất | `reviveIFrameSec: 2` | Alpha |
| QB-46 | Hồi sinh trong phòng boss | Module và booster dùng được; quảng cáo **không**. Hộp hỏi dừng trận, không tính vào `maxRespawnSec`, tự đóng sau 5 s | `revivePromptSec: 5` | Alpha |
| QB-47 | "Lượt vào màn" | Từ màn Chuẩn bị tới khi thoát hoặc bấm Chơi lại. Chơi lại làm mới giới hạn hồi sinh và danh sách kẻ địch đã trả thưởng (QB-20) | — | Code (QB-20); Alpha (hồi sinh) |
| QB-48 | Repair Kit và cú chết | Repair Kit chỉ kích hoạt khi máu còn > 0; không cứu cú chết | — | Alpha |
| QB-49 | Hoàn booster khi thoát sớm | Hoàn khi thoát trước **checkpoint đầu tiên có ở độ khó đang chơi** (Thử thách là CP2) và booster chưa kích hoạt. Chết trước checkpoint đó không hoàn | — | Alpha |

## 6. Nano Cell (bình hồi máu)

Luật chính ở GDD chính. Toàn bộ là Story MVP, số `[PLACEHOLDER]`.

| Mã | Tình huống | Luật | Tham số (chưa có) |
| --- | --- | --- | --- |
| QB-50 | Sức chứa và nạp lại | Tối đa 4, tìm ở Stage 1, 3, 5, 7. Nạp đầy khi vào màn mới; chết **không** nạp lại cái đã dùng | `player.json → nanoCell.max`, `stages.json → nanoCell` |
| QB-51 | Dùng khi đầy máu | Không cho dùng; nút xám | — |
| QB-52 | Dùng khi đang bị đánh | Được dùng cả khi đang choáng vì trúng đòn; khóa thao tác 0,4 s | `nanoCell.useLockSec 0.4` |
| QB-53 | Hết máu | Không tự dùng Nano Cell khi chết | — |
| QB-54 | Lượng hồi | 40% máu tối đa; Nano Cell Cap tối đa đưa lên 80% | `nanoCell.healPct 0.4` |

## 7. Cấp, build, thưởng trong trận

| Mã | Tình huống | Luật | Tham số | Trạng thái |
| --- | --- | --- | --- | --- |
| QB-60 | Lên cấp giữa trận | Máu hiện tại cộng phần máu tối đa vừa tăng | — | Code |
| QB-61 | EXP và đồng bộ cấp | EXP nhận không giảm theo đồng bộ cấp | `stages.json → levelSync` | Code (chưa test) |
| QB-62 | Ngưỡng Last Stand | 20% tính theo máu tối đa hiện tại (đã cộng cấp, build) | — | Alpha |
| QB-63 | Cộng dồn tầm hút | Tầm = max(Magnet Pulse 6, Magnet Core 3 + cấp Magnet Range); không cộng hai nguồn | `shop.json → magnetTilesPerLevel` | Code (Magnet Range); Alpha (module) |
| QB-64 | Thoát màn giữa chừng | Giữ checkpoint, Core Bit và EXP đã nhận. Hộp xác nhận ghi đúng như vậy; nút mặc định là Hủy | — | Code (ghi), Story MVP (hộp xác nhận chung) |
| QB-65 | Chơi lại màn đã nhận thưởng boss | Chỉ nhận Core Bit và EXP của kẻ địch (Stage 1 Thường ≈ 145 Core Bit). Gợi ý thu nhập ở Quầy tính theo luật này, theo độ khó chọn lần cuối, chỉ trỏ màn có trong bản build | `economy.json → incomeFormula`, `bosses.json → rewardCoreBit` | Code |
| QB-66 | Cấp khuyến nghị màn cuối | Citadel 20–22, màn cuối 22–24 (cuối cốt truyện cấp 22–24, 31–33 SP) | `stages.json → recommendedLevel` | Story Stage 7–8 |

## 8. Hộp chữ trên màn hình (thứ tự ưu tiên)

Mỗi lúc chỉ **một** hộp ở giữa phía trên khung hình.

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-70 | Nhiều hộp cùng muốn hiện | Thứ tự: **Hội thoại > Kết quả > Gợi ý chết > Hướng dẫn > Câu NOVA nhiệm vụ phụ > Báo ngắn** (Nhận vũ khí, Lên cấp, Nhiệm vụ xong). Hộp thấp hơn ẩn khi hộp cao hơn hiện, rồi hiện lại nếu còn hiệu lực | Code một phần (4 hộp đầu ở `stage-scene.ts`, chưa test; gợi ý chết bị che thì chưa hiện lại); Story MVP (hiện lại, câu nhiệm vụ, Báo ngắn, chuyển sang logic thuần) |
| QB-71 | Hộp chờ quá lâu hoặc mất ngữ cảnh | Gợi ý chết bị hủy khi hạ boss hoặc qua checkpoint. Hộp chờ quá 10 s cũng hủy | Code (gợi ý chết, chưa test); Story MVP (10 s) |
| QB-72 | Thời gian đọc | Hộp tự tắt sau max(3 s, số ký tự / 15). Gợi ý chết: max(`showSec`, ký tự / `charsPerSecRead`). Không đếm giờ khi tạm dừng hoặc có hội thoại | Code một phần (gợi ý chết, `ui.json → difficultyHint.charsPerSecRead`; menu tạm dừng chưa dừng đồng hồ); Story MVP (chung, dừng đồng hồ) |
| QB-73 | Độ dài chữ | Hộp hướng dẫn tối đa 2 dòng, kiểm bằng **số dòng** đo theo phông thật, không chỉ số ký tự. Câu ghép có biến (tên vũ khí) kiểm với giá trị dài nhất | Code (câu ghép, `checkDesignInvariants`); Story MVP (số dòng) |
| QB-74 | Cỡ chữ và nút trên điện thoại | Chữ ≥ 16 sp, nút ≥ 48 dp. Với hệ số phóng của Pixel 7, chữ canvas cần ≥ 11 px logic; nếu không được thì chuyển hộp chữ và menu sang lớp HTML (ADR-001) | Story MVP |

## 9. Hội thoại, hướng dẫn, gợi ý

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-80 | Bỏ qua hội thoại | Một lần bấm hoặc chạm: hiện hết câu đang chạy. Đóng cả đoạn: nút Bỏ qua hoặc **giữ Lướt 0,6 s**. Hiện tại một lần bấm Lướt đóng cả đoạn thoại Warden; phải sửa | Story MVP |
| QB-81 | Bỏ qua hướng dẫn | Giữ 1,5 s (07 mục 7). Bỏ qua Prologue (F04) tắt hướng dẫn nhưng vẫn giữ thoại truyện; Prologue chạy tiếp từ P07; nút bỏ qua ≥ 48 dp, xa cụm nút bắn | Sau cổng |
| QB-82 | Gợi ý sau 3 lần chết | Đếm chết từ checkpoint gần nhất hoặc từ lúc vào đấu trường. Câu theo độ khó (`ui.json → difficultyHint.lines`). Cốt truyện khi Xưởng còn khóa dùng câu `story_early` (không nhắc Xưởng, Quầy) | Code |
| QB-83 | Lộ điểm yếu boss | Một cờ duy nhất `weaknessKnown[boss]`, bật theo bước D03 hoặc D10 (D03 đã nói tên vũ khí khắc chế), hoặc khi hạ boss đó. D10 không chạy ở Stage 1 (Thorna yếu trước Ember Burst, vũ khí của boss 8). Màn Chuẩn bị và câu gợi ý vũ khí khắc chế đều đọc cờ này | Story MVP |
| QB-84 | Muốn đổi độ khó sau gợi ý | Sau khi gợi ý đã hiện, menu tạm dừng có thêm mục "Đổi độ khó": về màn Chuẩn bị, giữ checkpoint (theo luật mang checkpoint của GDD 11) | Story MVP |
| QB-85 | Gợi ý chỉ dựa vào màu | Câu nhắc màu (cam, xanh, vàng, đỏ) phải kèm hình dạng hoặc tư thế | Story MVP (lời trong `tutorial.json`) |
| QB-86 | Hướng dẫn Hub khi điều kiện khác | R04 làm nổi món rẻ nhất **mua được** (Cốt truyện ≈ 262 Core Bit sau 2 boss: Magnet Range 200). R05 có hai biến thể: chưa có Prism Beam; đã lấy Két giáp | Story Hub (EP-14) |
| QB-87 | Mỗi lần về Hub | Mở tối đa 1 hệ thống + 1 nhịp truyện. Tab Module mở khi nhận module đầu tiên | Story Hub (EP-14) |
| QB-88 | Chuỗi hướng dẫn bị cắt (thoát, tải lại trang giữa chuỗi, ví dụ giữa trận boss) | Bước `after` chỉ nối khi bước đứng trước xong **trong lượt này**; bước đã lưu không làm bước sau hiện ngay đầu màn. Bước đã lưu mà điều kiện kích hoạt xảy ra lại (vào lại phòng boss) thì tính xong trong lượt, không hiện lại lời; phần còn dở của chuỗi chạy tiếp từ đó | Code (ST-21-01, `tutorial-manager.ts`, test QB-88) |

## 10. Nhập liệu, thiết bị, ứng dụng

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-90 | App ẩn, trang ẩn, mất tay cầm | `visibilitychange`, `pagehide`, hoặc `gamepaddisconnected` khi thiết bị dùng gần nhất là tay cầm: mở menu tạm dừng; **không** tự chơi tiếp. Hiện code chỉ nhả phím và ghi bản lưu | Story MVP |
| QB-91 | Đổi thiết bị nhập giữa chừng | Biểu tượng nút theo thiết bị dùng gần nhất; tay cầm PlayStation (theo `gamepad.id`) dùng ✕○□△. Câu hướng dẫn có bản riêng cho cảm ứng khi tên nút trùng hành động (S13) | Story MVP |
| QB-92 | Tai thỏ, góc bo, thanh vuốt hệ thống | Nút cảm ứng và cần ảo tránh cả 4 phía (neo theo mép vùng an toàn); canvas tránh trái, phải, trên (thanh vuốt dưới chỉ đè, không che hình, tránh thì tụt bậc phóng); bảng HTML tránh cả 4 phía. Đọc `env(safe-area-inset-*)` khi đổi kích thước, không mỗi khung | Code (ST-11-01, test `input-touch.test.ts`, `scale.test.ts`) |
| QB-93 | Cầm dọc | Chỉ hỗ trợ màn ngang; lớp phủ "xoay ngang" che mọi scene và tự tạm dừng trận | Code (lớp phủ); Story MVP (tự tạm dừng) |
| QB-94 | Phím tắt ở Hub | Ở Hub, Start của tay cầm mở Menu nhanh (không phải Tạm dừng); phím 1–0 chọn 10 ô | Story Hub (EP-14) |
| QB-95 | Chơi với tốc độ game < 100% (tiếp cận) | Vẫn nhận đủ thưởng; lượt không vào bảng xếp hạng (khi có); đo lường không tính lượt đó vào chỉ số cân bằng điều khiển và dấu hiệu "hỏng" (MV7, H3, H4 của `13-Do-luong-MVP.md`) | Story MVP (ST-14-06, EP-13) |
| QB-96 | Phím Quay lại trong bảng HTML | Esc (bàn phím), B/○ (tay cầm) luôn là Quay lại một cấp; ở cấp đầu thì đóng bảng | Story MVP (ST-14-02) |
| QB-97 | Đổi phiên bản cài đặt điều khiển | Tăng phiên bản `cv.controls` phải có bước chuyển; không làm mất phím người chơi đã đổi | Story MVP (ST-14-01) |

### 10.1 Đo lường (bản `?mvp=`, EP-13)

Nguồn: duyệt Technical Director cho `13-Do-luong-MVP.md` ngày 14/11/2026. Bản thường (không `?mvp=`) không ghi gì.

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-150 | Bộ đệm đo lường vượt giới hạn | Bỏ mục đã nhận cũ nhất (mọi ưu tiên), rồi mục chờ ưu tiên 2, rồi 1, cũ trước; xét cả sự kiện mới. Mục đang gửi và mục chờ ưu tiên 0 không bỏ; chỉ còn chúng thì không lưu sự kiện mới, đếm `lost`. Không bao giờ vượt `buffer.maxBytes`, `maxEvents` | Code (ST-13-01, `buffer.ts`, test) |
| QB-151 | Thử lại một lô | Cùng `batch`, cùng các sự kiện; sự kiện mới vào lô sau. 409 (trùng) coi là đã nhận | Code phần lõi (ST-13-01, `cutBatch`/`ack`); Uploader ở ST-13-04 |
| QB-152 | Sự kiện trùng (gửi lại, Xuất JSON chồng lên bảng, hai thẻ gộp một hàng đợi) | Báo cáo khử trùng theo (`install`, `sid`, `n`) | Story ST-13-05 |
| QB-153 | Sự kiện sai lược đồ ở client | Bỏ cả sự kiện (không cắt bớt khóa), đếm `rejected`; bản DEV và test ném lỗi (`strict`) | Code (ST-13-01, `logger.ts`, test) |
| QB-154 | Quay lại tab sau ≥ `newSessionAfterHiddenMin` (30) phút ẩn | `sid` mới, `n` từ 0, ghi `session_start`, không ghi `boot_timing` | Story ST-13-02/03 |
| QB-155 | `client_error` lặp | Ghi lần đầu (`count: 1`); các lần sau chỉ đếm, ghi bù `count` khi trang ẩn hoặc lúc ghi `stage_progress`; quá `errorsPerSession` (20) bản ghi thì chỉ đếm | Code (ST-13-01, `clientError`/`flushErrorCounts`, test); gọi lúc trang ẩn ở ST-13-02 |
| QB-156 | Tắt gửi | Xóa bộ đệm, ngừng ghi, **không** ghi `consent: off`; bật lại thì sinh `install` mới | Code phần lõi (ST-13-01, `disable`); Cài đặt ở ST-13-03 |
| QB-157 | Khung > `frame.ignoreMs` (250 ms: tab ẩn, dừng để gỡ lỗi) | Không tính vào FPS, `slowFramePct`, `realSec` | Story ST-13-02 |

## 11. Lưu

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-98 | Trang ẩn khi đang trong màn | Ghi bản lưu (Core Bit, EXP, thời gian chưa ghi) và, ở bản đo lường, sự kiện tiến độ màn | Code (bản lưu, `pagehide`); Story MVP (sự kiện, EP-13) |
| QB-100 | Ghi bản lưu lỗi | Dải báo không chặn kèm nút "Xuất mã sao lưu". Safari chế độ riêng tư hoặc kho bị chặn: chơi bằng bộ nhớ tạm, báo rõ "tiến trình sẽ mất khi đóng trang". Hiện code chỉ in ra console | Story MVP |
| QB-101 | Bản lưu từ phiên bản game mới hơn | Chỉ đọc: xem được, không mua, không ghi | Code |
| QB-102 | Giao dịch mua, gỡ | Một lần ghi nguyên tử; ghi lỗi thì tự hoàn tác, không báo "đã mua" | Code |
| QB-103 | Id lạ trong bản lưu (độ khó, Upgrade, kỹ năng) | Chuẩn hóa khi nạp: id độ khó lạ coi như Thường; Upgrade, kỹ năng lạ bỏ, hoàn đúng số đã trả | Code |

## 12. Độ khó

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-110 | Mang checkpoint giữa các độ khó | Tiến độ checkpoint lưu theo độ khó; chỉ mang sang độ khó bằng hoặc dễ hơn. Thử thách bỏ CP1 | Code |
| QB-111 | Khoảng cách checkpoint | Cốt truyện ≤ 90 s, Thường ≤ 150 s, Thử thách ≤ 270 s chơi liên tục | Story (khi dựng bản đồ; thêm `stages.json → checkpointMaxGapSec`) |
| QB-112 | Đổi độ khó giữa màn | Chỉ qua màn Chuẩn bị (thoát màn, hoặc mục QB-84) | Code |

## 13. Camera và âm thanh

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-120 | Nhìn trước | Camera lệch 3 ô theo hướng Kai nhìn; vùng chết 2 × 3 ô; chỉ dịch dọc khi Kai đứng đất hoặc lệch quá 4 ô. Hiện code: vùng chết 48 px ngang, bám mượt 0,2 | Sau cổng |
| QB-121 | Phòng khóa, đấu trường | Camera khóa trong phòng khóa | Code (chưa test, nằm ở Scene) |

### 13.1 Âm thanh

Chi tiết ở `12-Am-thanh.md` mục 5.8. Cue báo đòn của kẻ địch dựa vào QB-23 (chỉ báo đòn khi ở trong màn hình), nên không cần tùy chọn "chỉ báo âm thanh bằng hình".

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-140 | Âm chưa được mở khóa (trình duyệt cần một lần chạm, bấm) | Bỏ yêu cầu phát, không xếp hàng; nhạc vào trong 1 s sau khi mở khóa | Story MVP (EP-12) |
| QB-141 | Nhiều bước logic trong một khung (bù sau giật) | Gộp âm theo id trong khung | Story MVP (EP-12) |
| QB-142 | Hai sự kiện loại trừ cùng bước | Chỉ phát âm của sự kiện mạnh hơn: `playerHurt` thua `fellInPit`, `spikeHit`, `playerDied`; `hitEnemy` thua `enemyKilled`; `hitBoss` thua `weakHit` | Story MVP (EP-12) |
| QB-143 | Hạ boss khi cue báo đòn đang phát; Kai chết lúc boss báo đòn | Hạ boss: dừng mọi kênh `alert` (50 ms) rồi phát `boss.defeat`. Kai chết: cue `alert` vẫn phát hết, nhạc giảm | Story MVP (EP-12) |
| QB-144 | Hồi sinh | Dừng vòng lặp (ù nạp, bám tường); cue của kẻ địch dựng lại dừng theo | Story MVP (EP-12) |
| QB-145 | Trận đứng yên (tạm dừng, bảng HTML đè, tab ẩn) | Tạm dừng bus `sfx`, `alert`; tab ẩn thì dừng hẳn âm | Story MVP (EP-12) |
| QB-146 | Tốc độ game < 100% | Không đổi tốc độ, cao độ âm và nhạc | Story MVP (EP-12, ST-14-06) |

## 14. Hub, Quầy, Xưởng

| Mã | Tình huống | Luật | Trạng thái |
| --- | --- | --- | --- |
| QB-130 | Món chưa có tác dụng | Không bán, dù đã tới mốc; thẻ ghi "Sắp có" | Code |
| QB-131 | Gỡ Upgrade | Hoàn đúng số đã trả cho cấp cao nhất (`inventory.upgradePaid`) | Code |
| QB-132 | Tab chưa mở | Nhãn ghi điều kiện mở theo lời người chơi, không ghi tên mốc nội bộ; tab Module: "khi nhận module đầu tiên" (QB-87) | Code (chưa test; chữ viết cứng ở `workshop-panel.ts`, chuyển sang chuỗi khi làm i18n) |
| QB-133 | Quầy Premium | Là tab thứ 4 của Quầy Mira; khu Cửa hàng Gem ở Hub là lối tắt tới tab đó | Alpha |
| QB-134 | Booster nhận trước khi mở | Vào kho, ô hiện khóa; quảng cáo AD_BOOSTER chỉ cho booster đã mở | Alpha |

## 15. Kiếm tiền và live-ops

Xem `05-Ke-hoach-kiem-tien.md`, mục "Quy tắc biên kiếm tiền và live-ops": mốc ngày (04:00 theo múi giờ tài khoản), chu kỳ đăng nhập 30 lần nhận, booster vượt kho, IAP và biên lai, hoàn tiền, Cyber+, Season Pass 28 ngày, ưu đãi, mã quà, đồng ý quảng cáo và tuổi. Luật chung: Gem không đổi ra Core Bit, Data Chip, booster, vật liệu hay Chip, kể cả gián tiếp.

## 16. Tham số mới cần thêm vào dữ liệu

Mỗi trường dưới đây phải có kiểm tra trong `game/src/core/*-config.ts` khi thêm (quy tắc dự án).

| Trường | File | Giá trị đề xuất | Luật |
| --- | --- | --- | --- |
| `weakStunCooldownSec` | `bosses.json` (chung) | 1,5 | QB-14 |
| `phaseShiftSec` | `bosses.json` (chung) | 0,6 | QB-31 |
| `minTelegraphSec` (mini-boss) | `enemies.json` | 0,5 | QB-21 |
| `activeRangeTilesY`, `attackRequiresOnScreen` | `enemies.json → rules` | 7, true | QB-23 |
| `pickups.energyChance`, `pickups.energy` | `enemies.json` | 0,06; 4 | QB-17 |
| `nanoCell {max, healPct, useLockSec, refill}` | `player.json`; vị trí ở `stages.json` | 4; 0,4; 0,4; "stageEnter" | QB-50…54 |
| `climb {speedTilesPerSec, shoot, jumpOffTiles}` | `player.json` | 3; false; 2 | QB-05 |
| `movingVine {speedTilesPerSec, pauseSec}` | `stages.json → mechanics` | 2; 0,5 | QB-06 |
| `checkpointMaxGapSec` | `stages.json` | 90 / 150 / 270 | QB-111 |
| `camera {lookAheadTiles, deadZoneTiles}` | `player.json` hoặc `ui.json` | 3; 2 × 3 | QB-120 |
| `quickSwapHoldSec` | `controls.json` | 0,3 | QB-15 |
| `dialogue.skipHoldSec` | `ui.json` | 0,6 | QB-80 |
| `reviveIFrameSec`, `revivePromptSec` | `adplacements.json` | 2; 5 | QB-45, QB-46 |

## 17. Tiêu chí nghiệm thu

Mỗi luật nhãn Code phải có (hoặc được thêm) một test Vitest mang mã luật trong tên test. Ngày 14/11/2026 chưa test nào mang mã QB (0/415): thêm dần khi một Story chạm module đó; các luật nhãn "chưa test" là việc nhỏ ưu tiên. Mỗi Story chạm luật nhãn Story phải:

1. Ghi mã `QB-xx` trong phần Bối cảnh của Story.
2. Có test cho tình huống biên (không chỉ đường chính).
3. Nếu người chơi nhìn thấy: có ảnh chạy thử ở `04-Dev-Plan/qa/<mã Story>/` (Look rule).

## 18. Story đề xuất

| Nhóm | Luật | Đưa vào epic |
| --- | --- | --- |
| Boss an toàn: kẹp pha, chống khóa choáng | QB-14, QB-31 | EP-15 (ST-15-14) |
| Kẻ địch: tầm dọc, chỉ bắn khi trên màn, báo trước mini-boss | QB-21, QB-23 | EP-15 (ST-15-15) |
| Vũ khí Stage 2–4 gặp khiên, vô hiệu chồng nhau; gió khi bị đánh | QB-07, QB-18, QB-19 | EP-15, EP-17 |
| Nano Cell và vật phẩm năng lượng | QB-17, QB-50…54 | EP-15 (ST-15-16, dữ liệu, logic thuần); nút cảm ứng ở EP-14 |
| Hộp chữ: báo ngắn, hủy 10 s, thời gian đọc chung, đo số dòng | QB-70…73 | EP-14 |
| Cỡ chữ, nút, safe-area, tự tạm dừng, biểu tượng tay cầm | QB-74, QB-90…93 | EP-14 |
| Hội thoại: bỏ qua giữ 0,6 s; cờ `weaknessKnown`; Đổi độ khó trong menu tạm dừng | QB-80, QB-83, QB-84 | EP-14 |
| Lưu: dải báo lỗi, chế độ không có kho | QB-100 | EP-14 |
| Cài đặt: tốc độ game, phím Quay lại, chuyển phiên bản `cv.controls` | QB-95…97 | EP-14 (ST-14-01, 02, 06) |
| Âm thanh: mở khóa, gộp, loại trừ, hạ boss, hồi sinh, tạm dừng, tốc độ | QB-140…146 | EP-12 |
| Đo lường: bộ đệm, lô, khử trùng, lược đồ, phiên, lỗi lặp, tắt gửi, khung dài | QB-150…157 | EP-13 |
| Di chuyển, camera, leo thang | QB-03…06, QB-15, QB-120 | EP-16 (sau cổng) |
| Test khóa luật đã code nhưng chưa test (gắn mã QB vào tên test) | QB-02, 11, 13, 22, 24, 33, 41, 61, 71, 121 | Việc nhỏ ưu tiên, trước EP mới |

## 19. Duyệt

- Bản 1.0 do trưởng nhóm viết từ 4 báo cáo rà soát; người dùng giao toàn quyền quyết định (14/11/2026), nên trạng thái là "Approved (ủy quyền)". Danh sách quyết định để người dùng xem lại nằm ở `04-Dev-Plan/00-Bat-dau.md`, mục "Chờ người dùng".
- Thay đổi file này: thêm dòng vào bảng dưới, cập nhật tài liệu liên quan trong cùng commit.

| Ngày | Thay đổi |
| --- | --- |
| 14/11/2026 | Bản 1.0: 77 luật từ rà soát; QB-20, QB-30, QB-65, QB-70…72, QB-82 đã code cùng ngày |
| 14/11/2026 | QB-92 đã code (ST-11-01) |
| 14/11/2026 | Bản 1.2 (sau duyệt Creative Director, Technical Director + Producer): sửa nhãn trạng thái theo code thật (QB-01, 11–13, 22, 41, 61, 70–72, 121, 132); sửa QB-12, 40, 70, 83; thêm QB-07, 18, 19, 24 (92 luật) |
| 14/11/2026 | Bản 1.3: thêm QB-88 (chuỗi hướng dẫn khi chơi lại, lỗi PR #9 tìm ra), đã code ở ST-21-01 (93 luật) |
| 14/11/2026 | Bản 1.4: thêm mục 10.1 Đo lường, QB-150…157 từ duyệt Technical Director cho GDD 13; QB-150, 153 đã code, QB-151, 155, 156 code phần lõi ở ST-13-01 (101 luật) |
| 14/11/2026 | Bản 1.1: thêm QB-95…98 từ `13-Do-luong-MVP.md`, `14-Cai-dat-Tiep-can.md`; QB-140…146 (âm thanh) từ `12-Am-thanh.md` (88 luật) |
