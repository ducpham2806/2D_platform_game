> Lưu trữ 14/11/2026: quy trình viết code bằng prompt ChatGPT không còn dùng. Code hiện làm theo Epic/Story trong `04-Dev-Plan/stories/` và `game/CONTEXT.md`; cấu trúc thư mục ở đây đã lỗi thời.

# Bộ prompt code cho ChatGPT

Cách dùng: mỗi module một cuộc trò chuyện. Luôn bắt đầu bằng **Prompt ngữ cảnh chung (mục 1)**, rồi dán prompt của module. Thay các chỗ trong `[ngoặc vuông]` bằng nội dung thật (dán giao diện của module khác, đường dẫn file, lỗi...). Prompt viết bằng tiếng Việt; tên kỹ thuật giữ tiếng Anh.

Mọi con số (tốc độ, sát thương, giá...) đã có trong `03-Data/*.json` và GDD. Đừng để ChatGPT tự bịa số.

## 1. Prompt ngữ cảnh chung (dán đầu mỗi cuộc trò chuyện)

```
Bạn là kỹ sư game senior chuyên TypeScript và Phaser 3. Tôi làm game "Cyber Vanguard":
action-platformer 2D cuộn ngang kiểu Mega Man nhưng nhập vai (cấp, kỹ năng, module, giáp,
skin), có cốt truyện, chạy trên điện thoại (app đóng gói) và web PC. Free-to-play với quảng
cáo rewarded, IAP, subscription tắt quảng cáo; sau cốt truyện có endgame farm trang bị hiếm.

RÀNG BUỘC KỸ THUẬT
- Phaser 3 + TypeScript (strict, không dùng any) + Vite; test bằng Vitest.
- Độ phân giải logic 320x192 (20x12 ô, ô 16 px), scale nguyên, chỉ chơi ngang. 60 FPS.
- Vật lý tự viết trên lưới ô (AABB, xử lý từng trục), cập nhật bước cố định 60 Hz.
- Mọi chỉ số đọc từ public/data/*.json (player, weapons, stages, difficulties, shop,
  economy, modules). Không viết cứng con số.
- Tách logic thuần (không import Phaser) vào src/logic để test được.
- Mỗi file tối đa khoảng 300 dòng; tên file kebab-case; class PascalCase.
- Giao tiếp giữa module qua event bus có kiểu, không gọi chéo trực tiếp.
- Không lưu tiền cao cấp hay giao dịch cục bộ làm gốc; dùng interface Backend để thay thế.

CẤU TRÚC DỰ ÁN
src/core, src/player, src/enemies, src/bosses, src/stages, src/hub, src/ui, src/economy,
src/online, src/logic, public/data, public/assets

CÁCH TRẢ LỜI
1) Nêu kế hoạch ngắn: danh sách file sẽ tạo/sửa và lý do.
2) Chờ tôi nói "OK" rồi mới viết code, từng file một, đầy đủ, không rút gọn bằng "...".
3) Sau mỗi file: cách chạy thử và 3 test cần có.
4) Không tự ý đổi thiết kế. Nếu thiếu thông tin, hỏi tối đa 3 câu rồi giả định hợp lý và nói rõ.
```

## 2. Gameplay

### P-M0: Khởi tạo dự án
```
Tạo dự án Phaser 3 + TypeScript + Vite + Vitest + ESLint + Prettier theo cấu trúc ở trên.
Gồm: scripts dev/build/test/lint, tsconfig strict, alias @/ cho src, nạp JSON từ public/data,
file CONTEXT.md mẫu (kiến trúc, quyết định, danh sách module và trạng thái), .gitignore,
GitHub Actions chạy lint + test. Đầu ra: danh sách file, nội dung từng file, lệnh chạy.
```

### P-M1: Khung game và scale
```
Viết Boot/Preload/Menu/Stage scene. Scale: canvas logic 320x192, phóng to nguyên lần lớn nhất
vừa màn hình (điện thoại ngang và PC), thêm viền đen nếu dư, pixelArt: true, không làm mờ.
Khi cầm dọc thì hiện lớp nhắc "Xoay ngang để chơi". Preload nạp atlas và JSON từ manifest
[dán một đoạn manifest.csv], hiện thanh tải. Cung cấp GameConfig đọc từ JSON và event bus có kiểu.
Tiêu chí: 60 FPS, không méo tỷ lệ, đổi kích thước cửa sổ không vỡ.
```

### P-M2a: Đầu vào bàn phím và tay cầm
```
Viết InputManager trả về trạng thái trừu tượng (moveX, jumpPressed, jumpHeld, shootPressed,
shootHeld, dashPressed, swapLeft, swapRight, pause, interact) cho bàn phím và Gamepad API.
Phím mặc định: A/D hoặc mũi tên, K nhảy, J bắn, L lướt, Q/E đổi vũ khí, Esc tạm dừng,
E tương tác. Tay cầm: cần trái/D-pad, A, X, B, LB/RB, Start, Y. Hỗ trợ đổi phím và lưu cấu hình.
Tự phát hiện thiết bị dùng gần nhất để đổi biểu tượng nút. Có test cho logic ánh xạ.
```

### P-M2b: Điều khiển cảm ứng
```
Viết TouchControls: cần ảo nổi bên trái (xuất hiện tại điểm chạm), nút Nhảy, Bắn (giữ để nạp),
Lướt, hai nút đổi vũ khí, nút tạm dừng. Tối thiểu 48 dp, hỗ trợ đa chạm, không bị chặn bởi cử
chỉ hệ thống. Tùy chọn: tự bắn, hỗ trợ ngắm nhẹ, rung phản hồi, thuận tay trái. Màn "Chỉnh
bố cục nút" cho kéo-thả, đổi kích thước và độ trong suốt, lưu vào save. Tham chiếu wireframe:
02-Wireframes/boards/Main.html, LayoutEdit.html, Touch.html.
```

### P-M3: Nhân vật
```
Viết PlayerController theo public/data/player.json [dán file]. Máy trạng thái: idle, run,
jump_up, jump_fall, land, dash, wall_slide, wall_jump, hurt, dead. Yêu cầu: coyote time 0,1 s;
jump buffer 0,12 s; nhảy biến thiên (thả nút thì cắt vận tốc); lướt 3 ô trong 0,25 s, hồi 0,6 s,
bất tử 0,1 s đầu; bám tường trượt 2 ô/giây; bị đánh có knockback, bất tử 1 s nhấp nháy.
Va chạm AABB trên lưới ô, xử lý trục X rồi Y, hỗ trợ bục một chiều. Logic vật lý thuần ở
src/logic/player-physics.ts. Viết test: độ cao nhảy tối thiểu/tối đa, coyote, buffer, lướt, bám tường.
```

### P-M4: Chiến đấu
```
Viết hệ thống Arc Cannon và bắn nạp theo weapons.json [dán]: tối đa 3 đạn, nạp 1,2 s nhân 3 sát
thương và xuyên 1 kẻ địch, hiệu ứng 3 mức nạp. Viết DamageSystem (sát thương, phòng thủ,
điểm yếu 2,5 lần, choáng 0,5 s), pool đạn, hộp va chạm hit/hurt, bất tử khung. Vũ khí boss
là dữ liệu: tên, tiêu hao năng lượng (thanh 28), hành vi đạn. Đổi vũ khí tức thời, không dừng game.
Có test cho tính sát thương và giới hạn đạn.
```

### P-M5: Kẻ địch
```
Viết lớp EnemyBase đọc cấu hình [dán enemies.json hoặc bảng kẻ địch Stage 1]: HP, sát thương,
hành vi, telegraph (>= 0,4 s), EXP, Core Bit, xác suất rơi hồi máu. Cài đặt hành vi: Patrol,
Fly-sine, Turret (cố định), Shield (khiên chặn đạn thường, bắn nạp phá khiên), Charge (lao tới).
Không để kẻ địch xuất hiện cách người chơi dưới 6 ô. Viết Drone Lính, Bướm Sắt, Tháp Gai,
Lính Kén làm mẫu và test cho telegraph.
```

### P-M6: Boss
```
Viết khung BossStateMachine 3 pha (ngưỡng 60% và 30% máu) và cài Thorna đúng bảng:
[dán bảng boss Thorna từ tab Prologue & Stage 1]. Yêu cầu: telegraph >= 0,5 s, mọi đòn <= 18
sát thương, luôn có khe né, đòn đỉnh "Hoa Nở" rồi choáng 2 s, Ember Burst gây 2,5 lần và choáng
0,5 s, thắng được chỉ bằng Arc Cannon. Chết thì hồi sinh trong phòng sau 1 giây. Có chế độ debug
chọn pha. Tiêu chí: mỗi pha qua được bằng Arc Cannon trong 60–90 giây.
```

### P-M7: Màn chơi
```
Viết StageLoader nạp bản đồ Tiled JSON (lớp ground, hazards, entities, triggers; thuộc tính ô:
solid, hazard, oneway). Cài: 4 checkpoint, hồi sinh <= 1,5 s giữ Core Bit và EXP, phòng khóa
(đóng cửa đến khi diệt hết, hiển thị còn lại), bẫy gai (30 sát thương và về ô an toàn), dây leo
đu (chu kỳ 2,4 s, biên độ 3 ô), hố rơi (mất 20 máu), bí mật và Két giáp cần vũ khí. Camera theo
người chơi, giới hạn trong màn. Dữ liệu màn từ stages.json [dán đoạn Stage 1].
```

### P-M8: Hệ thống RPG
```
Viết src/logic/rpg.ts: EXP lên cấp 40*L^1.4 tối đa cấp 30, máu 100+4*(L-1), công 10+0.25*(L-1), đồng bộ cấp theo levelSync trong stages.json,
1 SP mỗi cấp từ cấp 2 và 1 SP mỗi boss. Cây kỹ năng 3 nhánh (Vanguard, Phantom, Core), đặt lại
miễn phí. Module: 3/4/5 ô theo cấp 1/10/20, mỗi module có tải, không lưu cấu hình vượt tải.
Giáp Két giáp 4 bộ phận Mk I/II. Loadout 3 preset (module + giáp + skin; kỹ năng dùng chung).
Hàm tính chỉ số cuối cùng (cấp + upgrade + module + giáp). Test đầy đủ cho công thức.
```

### P-M9: Kinh tế và Shop (logic)
```
Viết src/economy: ví Core Bit, Data Chip (và Gem do máy chủ), kho booster tối đa 9, upgrade
theo shop.json (giá cấp n = giá cấp 1 x 1,8^(n-1), hoàn 100% khi gỡ), skin theo bộ phận
(không đổi hitbox), giao dịch nguyên tử (trừ tiền và thêm món cùng lúc, lỗi thì hoàn tác),
lịch mở hàng theo tiến trình. Interface Wallet và PurchaseService để thay bằng bản có máy chủ.
Test: không mua trùng, không âm tiền, hoàn tác khi lỗi lưu.
```

## 3. Giao diện (code UI)

Dán kèm file wireframe tương ứng (mở bằng trình duyệt, chụp ảnh gửi ChatGPT hoặc mô tả bố cục).

### P-UI-HUD
```
Viết HUD theo wireframe Main.html (cảm ứng) và HUDPC.html: thanh máu, thanh năng lượng vũ
khí, thanh máu boss (chỉ hiện ở trận boss), Core Bit, nút tạm dừng. HUD không che vùng chơi
giữa màn hình, tôn trọng safe-area. Cập nhật qua event bus, không đọc trực tiếp trạng thái.
```

### P-UI-DIALOG
```
Viết DialogueBox (Dialogue.html): chân dung, tên, chữ hiện từng chữ, chạm để hiện hết, nút Bỏ
qua, tối đa 3–4 dòng, không khóa điều khiển quá 10 giây. Đọc kịch bản từ JSON [dán 1 đoạn thoại
Prologue]. Thêm ChoicePanel (Choice.html) với lựa chọn khóa theo điều kiện.
```

### P-UI-MENUS
```
Viết MainMenu, PauseMenu, SettingsMenu theo wireframe Menu.html, Pause.html, SettingsControls.html,
Gamepad.html, Touch.html, Audio.html, Graphics.html, Access.html. Dùng hệ UI thống nhất: Panel
9-slice, Button 3 trạng thái, điều hướng bằng bàn phím, tay cầm và chạm. Cài đặt lưu vào save.
```

### P-UI-HUB
```
Viết Hub Arkon (Hub.html): rộng 3 màn hình, Kai đi bộ, 5 khu tương tác (Hồ Sơ, Xưởng, Shop,
Nhiệm vụ, Chiến dịch) và Menu nhanh 6 ô (1 chạm đến khu, Kai tự chạy tới). Hub đổi theo số
boss đã hạ [dán bảng "Hub biến đổi theo cốt truyện"]. Mira đứng cạnh quầy.
```

### P-UI-PREP-RESULT
```
Viết màn Chuẩn bị (Prep.html) và Kết quả (Result.html): chọn độ khó (khóa theo điều kiện),
2–3 slot booster, loadout nhanh, thanh Sức mạnh so với khuyến nghị; vào chơi tối đa 2 chạm.
Màn Kết quả hiện thời gian, số lần chết, EXP/Core Bit, vũ khí mới, thu thập và nút Về Hub.
```

### P-UI-SHOP
```
Viết Shop (Shop.html, ShopBooster.html, ShopUpgrade.html, Confirm.html): 4 tab (Skin, Booster, Upgrade, Premium), lưới thẻ với
trạng thái (mua được, thiếu tiền, khóa, đã có), xem trước Kai khi đứng/chạy/lướt, hộp xác nhận
một bước, bộ chọn số lượng booster, nút Nâng và Gỡ cho upgrade. Gọi PurchaseService, không
tự xử lý tiền. Không popup quảng bá trong luồng mua.
```

### P-UI-WORKSHOP
```
Viết Xưởng Lắp Ráp (Workshop.html, Module.html, Armor.html, Wardrobe.html, Loadout.html): 5 tab,
cây kỹ năng 3 nhánh, ô module với thanh tải, giáp bật/tắt, tủ skin 6 bộ phận kèm 3 bộ phối,
loadout. Thay đổi áp dụng ngay và tự lưu.
```

### P-UI-STORE
```
Viết Cửa hàng Gem (NStore.html), Cyber+ (NCyberPlus.html), popup Starter Pack và ưu đãi tuần
(NStarterPopup.html, NWeeklyDeal.html), cài đặt khôi phục giao dịch (NSettingsNotif.html). Chỉ gọi
PurchaseService (RevenueCat/billing); hiển thị giá theo cửa hàng, nút Khôi phục giao dịch, liên kết
Quản lý đăng ký, ghi rõ ngày tính tiền khi dùng thử. Popup ưu đãi tối đa 1 mỗi phiên, không hiện
trong màn chơi, luôn có nút đóng. Không có hộp ngẫu nhiên trả tiền.
```

### P-UI-LIVEOPS
```
Viết các màn live-ops theo wireframe: NDailyLogin, NNewPlayer7, NSpin, NOdds, NQuests, NSeasonPass,
NEvents. Dữ liệu từ 03-Data/liveops.json và Remote Config. Vòng quay: bốc thăm trên máy chủ, tỷ lệ
luôn xem được (NOdds), không bán lượt. Đăng nhập: bù ngày bằng quảng cáo hoặc 30 Gem. 7 ngày tân
thủ: cửa sổ 14 ngày. Season Pass: làn Free và Premium, mua cấp bằng Gem tối đa 10 mỗi mùa.
```

### P-UI-ADS-CONSENT
```
Viết NAdRevive, NAdDouble và NConsent: hộp hồi sinh bằng quảng cáo rewarded (tối đa 2 lần mỗi màn,
không ở trận boss), nhân đôi thưởng ở màn Kết quả (tối đa 10 lần mỗi ngày), Cyber+ nhận thưởng ngay
không cần xem. Màn xác nhận tuổi 13+ và đồng ý quảng cáo (UMP, ATT iOS) ở lần mở đầu. Gọi AdService
và ConsentService, không gọi SDK trực tiếp.
```

### P-UI-ECLIPSE
```
Viết Vùng Eclipse theo wireframe: NEclipseMenu, NFarmSelect, NSweep, NChipInv, NChipDetail, NMastery,
NRift. Dùng module Endgame; mọi bốc thăm rơi đồ và nâng cấp xác nhận từ máy chủ, client chỉ hiển
thị. Hiển thị tỷ lệ rơi và pity, nâng cấp Chip không có xác suất thất bại, Sweep chỉ cho màn đã đạt 3 sao.
```

## 4. Tính năng

### P-M11: Lưu và cloud
```
Viết SaveManager: IndexedDB làm bản cục bộ, mã xuất/nhập có checksum, interface Backend
(đăng nhập, lưu, tải, kiểm tra biên lai). Cài bản Supabase [hoặc dịch vụ bạn chọn] cho
Backend. Đồng bộ ghi thưa (sau giao dịch Shop, hoàn thành/thoát màn, đóng app). Mỗi bản lưu có
revision và thời điểm; khi xung đột KHÔNG tự gộp mà hiện màn chọn (Conflict.html). Gem và giao
dịch do máy chủ giữ. Viết test cho xung đột hai thiết bị và chống nhân đôi tiền.
```

### P-M13: Live-ops
```
Viết module LiveOps: đăng nhập 30 ngày (bù ngày bằng quảng cáo hoặc 30 Gem), 7 ngày tân thủ
(cửa sổ 14 ngày, không mất thưởng khi lỡ), vòng quay (bảng tỷ lệ [dán], 1 lượt miễn phí, pity
lượt thứ 7, tỷ lệ hiển thị), nhiệm vụ ngày/tuần (điểm 20/40/60/80/100), Season Pass 30 cấp
(Free/Premium). Mọi bốc thăm chạy trên máy chủ với seed ghi log, không tin client. Cấu hình
từ Remote Config. Viết test phân phối xác suất và pity.
```

### P-M14: Quảng cáo, IAP, subscription
```
Viết lớp trừu tượng AdService (showRewarded, showInterstitial, isReady) với hai cài đặt: AdMob
(app) và H5 Games Ads (web); tần suất lấy từ Remote Config (interstitial cách >= 4 phút, tối đa
1 mỗi 2 màn, không trong 20 phút đầu, không ở Prologue, Stage 1 hay sau boss). Viết
PurchaseService qua RevenueCat [hoặc billing gốc]: gói Gem, Starter Pack, Cyber+ (tháng/năm,
dùng thử 3 ngày), Khôi phục giao dịch, kiểm tra biên lai phía máy chủ. Thêm ConsentService
(UMP, ATT, xác nhận tuổi 13+). Cyber+ tắt interstitial và cho rewarded nhận thưởng ngay.
Luôn dùng test ads khi phát triển.
```

### P-M15: Endgame
```
Viết module Endgame: Farm Run (Mức Eclipse 1–10, +25% máu và sát thương mỗi mức), Boss Hunt,
Rift 100 tầng; Chip Lõi (6 ô, 5 độ hiếm với tỷ lệ [dán bảng], dòng phụ, bộ 2/4 mảnh, nâng +0 đến
+15 không xác suất thất bại), pity (Legendary sau 80, Mythic sau 600), Sweep, lượt thưởng gấp
đôi (tối đa 10 lượt mỗi ngày), Weapon Mastery 1–10. Bốc thăm rơi đồ chạy trên máy chủ; client
chỉ hiển thị. Test tỷ lệ rơi và pity bằng 100.000 lượt mô phỏng.
```

### P-M16: Phân tích và Remote Config
```
Viết AnalyticsService (Firebase hoặc tương đương) và RemoteConfig: sự kiện tối thiểu: tutorial_step,
stage_start/stage_clear/stage_fail (kèm số lần chết, độ khó), purchase, ad_impression, ad_reward,
shop_view, sub_start/sub_cancel, daily_login, spin, farm_run. Cờ tính năng, tỷ lệ rơi, tần suất
quảng cáo, thưởng sự kiện chỉnh được từ xa với giá trị mặc định cục bộ.
```

### P-M17: Đóng gói
```
Hướng dẫn từng bước đóng gói bản Phaser thành app Android và iOS bằng Capacitor: cấu hình,
plugin quảng cáo và mua hàng, khóa ngang, màn hình khởi động, ký ứng dụng, chạy trên máy thật,
và bản web (PWA) riêng. Liệt kê các điểm khác biệt giữa web và app (quảng cáo, thanh toán,
lưu dữ liệu). Kèm danh sách lỗi hay gặp và cách xử lý.
```

### P-ADS-01..04: Module quảng cáo (chi tiết ở `01-GDD/06-Ke-hoach-quang-cao.md`)
```
P-ADS-01: Viết interface AdService (init, preload, isReady, showRewarded, showInterstitial) và hai cài đặt
AdMobAdService (Capacitor) và H5AdService (adBreak). Có preload, timeout 3 giây, trả AdResult
(rewarded/closed/no_fill/error), tắt tiếng và tạm dừng game khi quảng cáo chạy. Không gọi SDK từ UI.

P-ADS-02: Viết PlacementManager đọc 03-Data/adplacements.json (hoặc Remote Config): hạn mức mỗi màn và mỗi
ngày, hồi chiêu, bảo vệ bực bội (chết >= 3 lần trong 5 phút thì tắt interstitial 10 phút), ngày bắt đầu
interstitial, Cyber+ (nhận thưởng ngay). Test mọi hạn mức và thời điểm làm mới.

P-ADS-03: Viết component AdOfferButton (nhãn, phần thưởng cụ thể, số lần còn lại) và luồng hồi sinh
AD_REVIVE (có nút Về checkpoint ngang hàng, không có đồng hồ ép), mục "Hỗ trợ miễn phí" trong menu
tạm dừng (AD_ENERGY, AD_HEAL), AD_BOOSTER ở màn Chuẩn bị, AD_DOUBLE ở màn Kết quả (chỉ nhân đôi
Core Bit), AD_GIFT ở Hub. Xử lý các tình huống lỗi trong mục 5.3 của kế hoạch.

P-ADS-04: Viết Edge Function Supabase nhận callback xác thực thưởng (SSV) hoặc nonce và hàm claim(nonce)
cộng thưởng lâu dài một lần (Core Bit, booster, lượt vòng quay/Sweep), chống nhận lặp, ghi log.
```

## 5. Prompt tiện ích

| Mục đích | Prompt |
|---|---|
| Rà soát code | "Đọc [file]. Tìm lỗi logic, rò rỉ bộ nhớ, vi phạm ràng buộc ở mục 1, chỗ viết cứng con số. Liệt kê theo mức độ và đề xuất sửa nhỏ nhất." |
| Sửa lỗi | "Lỗi: [dán nguyên văn]. Code liên quan: [dán]. Hành vi mong đợi: [mô tả]. Nêu nguyên nhân gốc trước, rồi mới sửa. Không sửa phần khác." |
| Tái cấu trúc | "Giữ nguyên hành vi, tách [file] thành các file nhỏ <= 300 dòng, không đổi giao diện công khai. Chạy được test hiện có." |
| Viết test | "Viết test Vitest cho [hàm/file], gồm trường hợp biên và ngoại lệ. Không mock Phaser nếu logic nằm ở src/logic." |
| Hiệu năng | "Tìm điểm nghẽn tạo rác bộ nhớ trong vòng lặp update của [file]. Đề xuất pool, tránh cấp phát mới mỗi khung hình." |
| Bảo mật | "Rà soát luồng mua hàng và lưu Gem: xác thực biên lai, chống phát lại, chống sửa dữ liệu phía client. Liệt kê rủi ro và cách vá." |
| Cập nhật ngữ cảnh | "Dựa trên cuộc trò chuyện này, viết lại mục [module] trong CONTEXT.md: những gì đã làm, giao diện công khai, việc còn lại." |
| Sinh schema | "Từ file JSON này [dán], sinh kiểu TypeScript và hàm kiểm tra dữ liệu lúc nạp, báo lỗi rõ khi sai." |
