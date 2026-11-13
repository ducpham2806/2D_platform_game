# Đánh giá lại kế hoạch phát triển (2026-11-13)

Đánh giá `01-Ke-hoach-lam-viec.md` và trạng thái thực tế của repo bằng khung của repo **Game Studio Agent** (3 giám đốc Tier 1, các skill `game-production-scrum`, `prototype-fast`, `platformer`, `game-feel`, `level-design`, `create-game-assets`, `game-qa-playtest`, `game-release-liveops`, `phaser-core` và 4 file `rules/`).

Đây là **bản đề xuất**. Chưa sửa kế hoạch, GDD hay dữ liệu; các thay đổi ở mục 4 chờ người dùng chọn (giao thức Question → Options → Decision của studio).

## 1. Kết luận ngắn

- **Phần kỹ thuật tốt hơn mức studio yêu cầu.** Vấn đề của kế hoạch không nằm ở code.
- **Kế hoạch đang xếp theo module code, trong khi đường găng là những việc không phải code:** chơi thử với người thật, asset, bản đồ thật, âm thanh. Code Sprint 1–7 làm xong trong 4 ngày (01–04/11), còn cổng Prototype vẫn chưa có đợt thử nào và chưa có sprite nào.
- **Giai đoạn thật của dự án (theo 7 giai đoạn của studio): Prototype, chưa qua cổng.** Bảng lộ trình ghi Sprint 5–9 "Code xong" dễ làm tưởng đã ở Vertical slice.
- **Ba lỗ hổng lớn nhất:** (1) âm thanh nằm tận Beta, tức cổng MVP 50 người sẽ thử một game câm; (2) giả thuyết vui thứ hai (đổi vũ khí khắc chế tạo khoảnh khắc "à, thì ra thế") không có prototype nào và phải tới cuối MVP mới được thử; (3) cổng MVP cần đo 50 người và tỷ lệ quay lại ngày hôm sau nhưng không có cách thu số liệu.

## 2. Kiểm tra cổng (`/gate-check`, vai Producer)

| Giai đoạn studio | Trạng thái thật | Nhận xét |
| --- | --- | --- |
| Concept | Xong | GDD 0.6 có trụ cột, giả thuyết vui, định nghĩa "hỏng". Đạt chuẩn `gdd-and-story-rules` (có số, có công thức) |
| Prototype | **Chưa qua** | Đo tự động đạt. Bảng kết quả đợt thử (`05-Cong-Prototype.md` mục 7) còn trống; chưa chạy trên điện thoại thật |
| Technical setup | Xong | CI, test, lint, kiểm tra dữ liệu, Pages |
| Vertical slice | Mới có khung code | Thiếu toàn bộ nội dung: bản đồ Prologue/Stage 1, 84 spritesheet P1, hội thoại, màn Kết quả |

Hai điểm lệch so với chuẩn của studio:

- **"Xong" đang rộng hơn định nghĩa của chính kế hoạch.** Quy tắc ghi "xong = chạy trên PC và điện thoại", nhưng M1–M7 ghi "Xong" khi chưa module nào chạy trên máy thật. Nên ghi "Code xong, chưa nghiệm thu máy thật".
- **Làm hệ thống trước khi có phán quyết.** `prototype-fast` xếp lưu game, hướng dẫn, HUD vào nhóm "không phải câu hỏi của prototype". Kế hoạch cho phép làm song song và mã theo dữ liệu nên rủi ro làm lại thấp, nhưng nên dừng ở đây: mục "Tiếp theo" của nhật ký gần nhất gợi ý làm M8 RPG trong lúc chờ, **không nên làm**. Nếu cổng không qua, GDD mục 16 đã ghi rõ: sửa cảm giác chơi, không thêm hệ thống.

## 3. Phát hiện theo từng vai

### 3.1 Creative Director: cảm giác chơi và giả thuyết vui

1. **Âm thanh (M12) xếp ở Beta, sau cổng MVP.** `game-feel`: một cú trúng "đã" là 5–8 phản hồi nhỏ xếp chồng trong khoảng 100 ms, âm thanh là lớp đầu tiên. GDD mục 14 còn dùng âm thanh làm cảnh báo đòn boss. Cổng MVP đo "muốn chơi tiếp" và quay lại ngày hôm sau; đo trên bản không có tiếng sẽ cho số thấp sai lệch.
2. **Cổng Prototype đang chấm điểm "sướng" trên hình hộp, không tiếng, gần như không có juice.** Hiện chỉ có hit-stop, rung camera và nháy trắng kẻ địch. Chưa có bụi tiếp đất, co giãn (squash/stretch), chớp nòng, hạt khi trúng. `prototype-fast` cảnh báo đừng đánh bóng để che một cơ chế nhạt; nhưng tiêu chí ở đây là người lạ chấm ≥ 4/5, nên một lượt tối thiểu là hợp lý (xem phương án ở mục 4).
3. **Giả thuyết vui số 2 chưa có prototype.** Thorna yếu trước Ember Burst, vũ khí của màn 8, nên Vertical slice không thử được khoảnh khắc khắc chế. Lần thử đầu tiên là boss màn 2 (Lumen, yếu trước Vine Lash), tức giữa MVP. Theo `prototype-fast` (một câu hỏi, một prototype), nên có một phòng thử rẻ: một boss xám yếu trước Vine Lash, đánh ngay sau Thorna.
4. **Bộ điều khiển thiếu hai trợ giúp trong bảng của skill `platformer`:** corner correction (đẩy nhẹ khi sượt mép 1–2 px) và apex hang (giảm trọng lực ở đỉnh nhảy). Cả hai phục vụ thẳng trụ cột 1 "tha thứ đúng chỗ" và giúp nhiều nhất trên cảm ứng. Camera có deadzone nhưng chưa có look-ahead. Nên thêm làm thông số trong bảng chỉnh (`?tune=1`), mặc định tắt, để thử A/B trong đợt chơi thử.

### 3.2 Producer: phạm vi và ước lượng (`/scope-check`)

1. **Ước lượng MVP mâu thuẫn với chính GDD.** GDD mục 16: một màn có boss tốn 80–150 giờ với một người. MVP thêm 3 màn (Stage 2–4) + RPG + Xưởng + Shop + 3 độ khó trong Sprint 10–17 = 160 giờ. Riêng 3 màn đã là 240–450 giờ theo con số của GDD.
2. **Đơn vị "sprint = 1 tuần, 20 giờ" không còn đo được gì.** Code đi nhanh gấp nhiều lần ước lượng; phần nội dung (bản đồ, asset, cân chỉnh, chơi thử) thì chưa có số đo nào. Nên ước lượng lại theo nội dung sau khi làm xong Stage 1 thật, lấy Stage 1 làm thước.
3. **Asset chậm 7 sprint so với code.** Kế hoạch ghi Sprint 1 có style bible và Kai; hiện chưa có file hình nào ngoài tileset xám. Manifest: P0 10, P1 84, P2 107, P3 142 spritesheet (tổng 350). GDD xếp "asset AI không nhất quán" là rủi ro Cao, mà rủi ro này chưa được thử lần nào.
4. **Module M8–M10 còn ở cỡ "làm hệ thống RPG".** `game-production-scrum` gọi đây là story mơ hồ; khi bắt đầu MVP nên tách thành lát 1–2 ngày có tiêu chí nghiệm thu (ví dụ: công thức EXP và cấp; cây kỹ năng rút gọn; respec; lắp module; lưu các nhóm này).
5. **Giai đoạn 2 (30–40 tuần)** gồm backend, IAP, quảng cáo, live-ops, endgame, bảng xếp hạng kiểm tra chuỗi input, Android/iOS, 4 màn + Citadel + 3 kết thúc. Con số này không đáng tin, nhưng kế hoạch đã ghi sẽ ước lượng lại sau cổng MVP nên chưa cần sửa. Chỉ cần giữ nguyên tắc: không đụng thêm vào tài liệu kiếm tiền/live-ops (khoảng 70 KB GDD, 6 file dữ liệu) trước cổng MVP.

### 3.3 Technical Director: kiến trúc so với `rules/`

| Quy tắc studio | Trạng thái |
| --- | --- |
| Dữ liệu tách khỏi mã, không viết cứng (`gameplay-rules` 1) | Đạt, còn có kiểm tra bất biến giữa các file lúc nạp |
| Độc lập tốc độ khung hình (`gameplay-rules` 2) | Đạt, bước cố định 60 Hz |
| Gameplay không gọi UI; UI chỉ quan sát (`ui-and-data-rules` 1) | Đạt (StageWorld thuần, HUD đọc `HudModel`) |
| Pool cho đạn (`core-and-ai-rules` 1) | Đạt cho đạn. `buildHud` dựng mô hình mới mỗi khung: lệch nhẹ, đo trên máy thật trước khi sửa |
| Máy trạng thái, telegraph (`gameplay-rules` 4) | Đạt, còn chặn telegraph ngắn ngay lúc nạp dữ liệu |
| Sẵn sàng đa ngôn ngữ (`ui-and-data-rules` 2) | **Chưa.** Chuỗi tiếng Việt nằm trong scene (`'HẠ BOSS!'`) và trong `tutorial.json`. GDD nhắm soft launch có thị trường tiếng Anh |
| Bằng chứng trực quan lưu lại (Look Rule) | **Một nửa.** Có chạy thử Chromium mỗi phiên và ghi vào nhật ký, nhưng không lưu ảnh nên không so sánh được giữa các phiên |
| Test 4 tầng (unit, tích hợp, dữ liệu, soak) | Unit và dữ liệu mạnh (254 test). Tích hợp Playwright "mỗi sprint" trong `04-Test-va-Launch.md` chưa làm (mới có `gate-check`). Chưa có soak 30 phút |

Hai việc kỹ thuật nên kéo sớm hơn kế hoạch:

- **Bảng chuỗi (khóa → văn bản) trước khi M10 lớn lên.** Bây giờ có khoảng vài chục chuỗi; sau Hub, Xưởng, Shop, hội thoại sẽ là vài trăm.
- **Thử đóng gói Android (M17) nửa ngày ở Vertical slice.** Cảm ứng là tiêu chí chính và sản phẩm đích là app Capacitor; WebView có thể khác Chrome về FPS và độ trễ chạm. Kế hoạch để M17 ở Live-ops MVP, tức phát hiện muộn nhất có thể.

Phaser: giữ 3.90. Skill `phaser-core` nhắm Phaser 4.2 cho dự án mới nhưng yêu cầu không tự ý chuyển dự án đang ghim Phaser 3.

### 3.4 QA Lead: chơi thử và đo lường

- **Cổng MVP không đo được bằng công cụ hiện có.** Sao chép JSON gửi tay chạy được với 5 người; với 50 người và chỉ số "quay lại ngày hôm sau ≥ 35%" thì không. M16 (đo lường) lại xếp ở Live-ops MVP. Cần một bản đo tối thiểu trước cổng MVP: gửi sự kiện ẩn danh (bắt đầu, qua checkpoint, chết theo đoạn, hạ boss, vũ khí dùng lúc hạ boss, ngày chơi), có thông báo cho người thử.
- **Quy trình chơi thử đã đúng tinh thần `/playtest-report`** (không giải thích, tách quan sát khỏi đề xuất, sửa thiết kế trước khi chỉnh chỉ số). Giữ nguyên.
- **Thiếu smoke check 5 phút tự động** (vào menu → vào màn → điều khiển → lưu/tải → không lỗi console, kèm ảnh chụp). Playwright đã có sẵn cho `gate-check`, thêm rẻ, và giải quyết luôn phần bằng chứng trực quan.

### 3.5 Level và Asset Lead

- **Bản đồ thật:** kế hoạch gộp "bản đồ thật + asset P1" thành một việc. `level-design` yêu cầu tách: chốt số đo (metrics) → sơ đồ nhịp (beat chart) → dựng khối xám → chơi thử khối xám → mới phủ hình. Đề xuất sau cổng Prototype: (a) một test tự đo khoảng nhảy xa nhất, lướt-nhảy, độ cao bám tường từ `player.json` để có bảng `SAFE_GAP`/`HARD_GAP`; (b) beat chart Stage 1 từ đặc tả; (c) bản đồ Tiled bằng tileset xám; (d) chơi thử; (e) phủ hình.
- **Asset:** theo `create-game-assets`, khóa khung kỹ thuật rồi **duyệt một mẫu chuẩn trong game ở đúng độ phân giải 320×192** trước khi làm hàng loạt. Việc này không phụ thuộc cổng Prototype và nên bắt đầu ngay: Kai (idle, run, jump, dash, wall-slide, hurt) + 1 tileset Verdant + 1 kẻ địch. Nếu pipeline AI không giữ được nhất quán thì biết sớm, trước khi cam kết 350 spritesheet.

## 4. Đề xuất thay đổi kế hoạch (chờ quyết định)

### Quyết định 1: làm gì trước đợt chơi thử cổng Prototype

| Phương án | Ưu | Nhược |
| --- | --- | --- |
| **A (khuyến nghị): lượt "cảm giác tối thiểu" rồi thử.** Khoảng 10–15 SFX tổng hợp (nhảy, đáp, lướt, bắn, nạp, trúng, bị đánh, cảnh báo đòn boss), bụi tiếp đất, chớp nòng, hạt khi trúng; corner correction và apex hang làm thông số chỉnh được | Điểm "sướng" phản ánh đúng hơn; âm thanh cảnh báo boss là một phần thiết kế | Thêm một phiên làm việc; nguy cơ đánh bóng che cơ chế nhạt |
| B: thử ngay bản hiện tại | Không chậm thêm; đúng tinh thần hộp xám | Có thể trượt 4/5 vì thiếu phản hồi chứ không vì điều khiển, rồi tốn một đợt 5 người mới |
| C: thử ngay, nếu trượt mới làm A | Rẻ nếu qua luôn | Mỗi đợt cần 5 người chưa từng chơi; người thử là tài nguyên hiếm nhất |

### Quyết định 2: phạm vi MVP

| Phương án | Ưu | Nhược |
| --- | --- | --- |
| **A (khuyến nghị): giữ 4 màn, bỏ mốc tuần; ước lượng lại sau khi xong Stage 1 thật** | Giữ nguyên cổng MVP của GDD; số ước lượng có căn cứ | Chưa có ngày đích trong lúc chờ |
| B: MVP còn Prologue + Stage 1–3 | Bớt khoảng 80–150 giờ nội dung; vẫn có 2 boss có vũ khí khắc chế lấy được, đủ để thử giả thuyết 2 | Phải sửa tiêu chí cổng MVP trong GDD ("xong cả 4 màn", "đúng vũ khí ở ≥ 2 boss" thành 2/2) |
| C: giữ nguyên kế hoạch | Không phải sửa gì | Lệch 2–3 lần so với ước lượng của chính GDD |

### Quyết định 3: việc kéo sớm (có thể chọn nhiều)

1. Âm thanh tối thiểu (SFX + 1–2 bản nhạc) vào Vertical slice, phần còn lại của M12 giữ ở Beta.
2. Phòng thử khắc chế (boss xám yếu trước Vine Lash) vào Vertical slice.
3. Đo lường tối thiểu (một phần M16) vào trước cổng MVP.
4. Thử đóng gói Android nửa ngày (một phần M17) vào Vertical slice.
5. Bảng chuỗi đa ngôn ngữ trước phần còn lại của M10.
6. Smoke check Playwright có ảnh chụp, chạy trong CI.

### Thứ tự đề xuất nếu chọn các phương án khuyến nghị

1. Lượt cảm giác tối thiểu → kiểm tra trên một điện thoại thật → **đợt chơi thử 5 người** (việc duy nhất chỉ người dùng làm được, và đang chặn mọi thứ).
2. Song song, không cần chờ cổng: mẫu chuẩn asset Kai trong game; smoke check; bảng chuỗi.
3. Qua cổng: chốt thông số → bảng số đo màn → beat chart → Stage 1 khối xám → chơi thử → phủ hình; Prologue; phòng thử khắc chế; hội thoại, màn Kết quả.
4. Cổng Vertical slice (Prologue ≥ 90%, Stage 1 ≥ 70%) → ước lượng lại MVP theo số giờ thật của Stage 1.

## 5. Phần nào của Game Studio Agent nên áp dụng cho dự án này

Dự án một người, nên dùng mức `rigor: minimal`, chỉ nâng lên `standard` cho chiến đấu và kinh tế. Cụ thể:

- **Nên dùng:** `/gate-check` và `/scope-check` ở mỗi mốc; Look Rule có lưu ảnh; chia story 1–2 ngày khi vào MVP; quy trình asset "duyệt một mẫu chuẩn trước"; quy trình màn "khối xám trước, hình sau".
- **Không cần:** `production/session-state/active.md` (trùng với `06-Nhat-ky-phien.md`), thư mục epics/stories đầy đủ cho phần đã làm xong, hội đồng 3 giám đốc duyệt từng story, quy ước khóa JSON `snake_case` (dữ liệu hiện dùng camelCase nhất quán và đã có kiểm tra; đổi chỉ tốn công).
- **Lưu ý khi dùng repo đó cho dự án này:** `project.template.yaml` chỉ liệt kê `godot4 | unity | unreal5 | roblox | web` và độ phân giải gốc 1920×1080; với Cyber Vanguard cần `engine: web/phaser`, `language: typescript`, `code_root: game/src`, `resolution_base: 320x192`, `stage: prototype`.
