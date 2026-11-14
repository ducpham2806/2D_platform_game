# Độ khó cốt truyện và màn Chuẩn bị (bản MVP)

- **Trạng thái:** **Bản 2, Approved (14/11/2026).** Bản 1 qua hai lượt duyệt độc lập của Game Studio Agent: Creative Director (kèm economy-designer, game-designer) "duyệt kèm sửa"; Technical Director + Producer "duyệt có điều kiện". Bản 2 đã sửa theo mọi điểm bắt buộc (mục 9). Người dùng giao toàn quyền quyết định. Sửa nhỏ khi rà soát 14/11/2026: khoảng cách checkpoint tối đa theo độ khó (mục 2.4).
- **Quy trình:** Game Studio Agent `/design-system` theo mẫu `templates/gdd-system-template.md`.
- **Nguồn:** GDD chính mục 11; đặc tả Hub mục 3 (màn Chuẩn bị); `02-Wireframes/boards/Prep.html`; kịch bản hướng dẫn D06, S09; `03-Data/difficulties.json`; `04-Can-bang-kinh-te.md` mục 4–5.
- **Phạm vi MVP:** Stage 1–4. Tài liệu này chốt quy tắc chung và mẫu đòn Thử thách của **Stage 1**. Mẫu đòn Stage 1 là `[PLACEHOLDER]`: code làm song song nhưng **chốt sau cổng Prototype** (`05-Cong-Prototype.md`). Stage 2–4 thêm mẫu đòn khi viết đặc tả các màn đó.
- **Story:** Epic `04-Dev-Plan/stories/EP-10-do-kho.md`.

## 0. Hiện trạng trước tài liệu này

- `difficulties.json` có 3 độ khó (`damageTaken`, `enemyHp`, `rewardMul`, `unlock` dạng chữ, `checkpoints` dạng chữ, `newAttackPatterns`). Game luôn chạy Thường; không có chỗ chọn.
- Đã áp: `damageTaken` (đòn kẻ địch, gai, hố); `enemyHp` cho kẻ địch thường **và mini-boss** (Golem đi qua `EnemyField`).
- **Chưa áp** (lỗi phát hiện khi rà, sửa ở ST-10-01): máu **boss** không nhân `enemyHp` (`boss.ts` lấy thẳng `data.hp`); thưởng Core Bit và EXP không nhân `rewardMul`.
- `economy.difficultyRewardMul` trùng `difficulties.rewardMul`; `checkDesignInvariants` đã kiểm tra hai chỗ khớp nhau.

## 1. Tổng quan và trụ cột

Ba độ khó cho cốt truyện: **Cốt truyện** (xem truyện, ít áp lực), **Thường** (thiết kế gốc), **Thử thách** (mở theo từng màn, có mẫu đòn mới). Chọn ở màn Chuẩn bị trước mỗi lần vào màn.

- **Trụ cột 1 (kỹ năng quyết định):** Thử thách khó hơn chủ yếu bằng **mẫu đòn mới**, buộc đọc và né khác, không chỉ tăng số. Quy tắc "phòng thủ không thay được né" (GDD 10 mục 8) áp từ Thường trở lên. Ở Cốt truyện, bot không né thắng được Thorna (đo: khoảng 30 s ở cấp 4); đó là chủ đích của chế độ xem truyện.
- **Trụ cột 3 (không cày):** độ khó không chặn tiến trình. Cốt truyện luôn mở; đổi độ khó không mất gì đã có.
- **Trụ cột 5 (tôn trọng):** gợi ý hạ độ khó chỉ là gợi ý; không bán thứ gì liên quan độ khó.

## 2. Cơ chế cốt lõi

### 2.1 Chọn độ khó (màn Chuẩn bị, bản cắt MVP)

- Vào một **màn chiến dịch** (StageDef có `campaign`) từ menu thì hiện bảng Chuẩn bị. Màn xám (cổng Prototype) không có bảng này và luôn chạy Thường, để số liệu chơi thử so sánh được.
- Ba thẻ độ khó. Mặc định là độ khó chọn lần trước **cho màn đó**. Chưa chọn bao giờ, hoặc lần trước nay bị khóa: Thường.
- Thử thách khóa cho tới khi **hạ boss chiến dịch của màn đó** (`stages.json → boss`) ở Thường hoặc Thử thách. Thẻ khóa ghi "Mở khi xong màn này ở Thường hoặc Thử thách". Xong ở Cốt truyện không mở.
- Nút **Bắt đầu** lớn, con trỏ đặt sẵn ở đó: giữ mặc định thì 1 chạm, đổi độ khó thì 2 chạm.
- Thanh trên: tên màn, cấp thật (cấp hiệu dụng nếu khác), cấp khuyến nghị. Cấp thật thấp hơn mức khuyến nghị quá `levelSync.belowMin` cấp thì có gợi ý mềm, không chặn.
- Ô booster, loadout, thanh Power Score sang Alpha (chưa có booster, module). Bảng ghi một dòng "Booster mở sau boss 4".
- **Bản lưu theo màn chiến dịch, không theo phòng thử.** 4 phòng thử của Stage 1 (kẻ địch, màn chơi, Golem, Thorna) đều thuộc `verdant_gardens`, nên dùng chung `last`; chỉ phòng Thorna mở được Thử thách.
- Chạy thử: `?debug=1&unlock=1` mở mọi độ khó ở bảng Chuẩn bị (không ghi vào bản lưu).

### 2.2 Không đổi độ khó giữa màn

Độ khó cố định trong một lượt vào màn. Menu tạm dừng chỉ hiện tên độ khó. Muốn đổi thì thoát rồi vào lại; nút "Chơi lại" ở màn Kết quả giữ độ khó.

### 2.3 Thưởng và mở khóa

- **Thưởng lần đầu hạ boss (EXP, Core Bit): một lần cho mỗi cặp (boss, độ khó)**, tối đa 3 lần. Lý do: Thử thách chỉ mở sau khi thắng Thường; nếu thưởng chỉ một lần mỗi boss thì lượt Thử thách mất phần thưởng boss, lệch mô hình kinh tế mục 4 (lượt Thử thách 11.700 Core Bit).
- Vũ khí boss, SP: **một lần mỗi boss**, không phụ thuộc độ khó.
- Hạ boss ghi độ khó vào `cleared` của màn. Thường hoặc Thử thách thì mở Thử thách.

### 2.4 Checkpoint theo độ khó

- Checkpoint trên bản đồ **Tiled** có thuộc tính tùy chọn `difficulties` (chuỗi id cách nhau bằng dấu phẩy). Không ghi thì có ở cả ba độ khó. Ký hiệu `C` của bản đồ ASCII (phòng thử) luôn có ở mọi độ khó.
- Quy tắc đặt khi chốt bản đồ Stage 1–4 (sau cổng Prototype):
  - **Khoảng cách tối đa** giữa hai điểm hồi sinh liền nhau (GDD chính 8.3): Cốt truyện ≤ 90 s, Thường ≤ 150 s, Thử thách ≤ 270 s chơi `[PLACEHOLDER]`.
  - **Thường:** 4 checkpoint sau mỗi đoạn A–D (đặc tả Stage 1).
  - **Thử thách:** bỏ CP1, giữ CP2–CP4 (ghi `difficulties: "story,normal"` cho CP1). Khoảng cách giữa hai điểm hồi sinh liền nhau không quá khoảng 4,5 phút chơi.
  - **Cốt truyện:** thêm 1 checkpoint giữa mỗi đoạn dài hơn 1,5 phút (90 s), ghi `difficulties: "story"` (bản 2 ghi "từ 2,5 phút", nên đoạn A Stage 1 dài 2 phút vượt 90 s; sửa khi rà soát 14/11/2026).
- **Tiến độ checkpoint ghi theo độ khó.** Vào màn ở độ khó d thì dùng checkpoint xa nhất đã chạm ở d **hoặc khó hơn** (thứ tự trong `difficulties.json`); không mang từ dễ sang khó. Sau đó lùi về checkpoint gần nhất phía trước có ở d.
  - Ví dụ: chạm CP4 ở Cốt truyện rồi vào Thử thách thì xuất phát từ đầu màn, nên không thể mở khóa bằng cách đi tắt.
- Bản lưu ghi **chỉ số trên danh sách đầy đủ**. Khi chốt bản đồ, nếu sau đó còn sửa vị trí hay số checkpoint mà đã có bản lưu của người chơi thật, chuyển sang id checkpoint cố định (bản lưu 5). Hiện chưa có bản lưu của người chơi thật nên chưa cần.
- `difficulties.json → checkpoints` ("more", "normal", "fewer") chỉ là chữ mô tả.

### 2.5 Gợi ý khi chết nhiều lần

Thống nhất với kịch bản hướng dẫn D06 và S09: **3 lần chết liên tiếp**. GDD chính mục 11 sửa 5 thành 3.

- **Đếm:** tăng khi chết thật. Không tính rơi hố còn máu, không tính hồi sinh tại chỗ (khi có). Đặt về 0 khi chạm checkpoint, hoặc khi vào đấu trường boss (cửa đóng đổi điểm hồi sinh nhưng không phát sự kiện checkpoint).
- **Lần chết thứ 3:** NOVA hiện một câu ở hộp gợi ý riêng (không phụ thuộc màn có hướng dẫn hay không), tự tắt sau 6 s, không dừng game. Mỗi lượt vào màn tối đa một lần. Tắt hướng dẫn ở menu tạm dừng thì không hiện.
- **Ưu tiên:** hộp hướng dẫn đang có lời thì gợi ý chờ tới khi hộp trống.
- **Câu (giọng NOVA, `ui.json → difficultyHint`):**
  - Thử thách: "Ba lần rồi. Đòn Thử thách khó đọc thật. Chế độ Thường ở màn Chuẩn bị, checkpoint vẫn giữ."
  - Thường: "Ba lần rồi. Tôi không chê đâu, chỉ gợi ý: chế độ Cốt truyện ở màn Chuẩn bị. Checkpoint vẫn giữ."
  - Cốt truyện: "Ba lần rồi. Hiệu chỉnh đề xuất: học thêm kỹ năng ở Xưởng, hoặc mua Upgrade."
  - Thêm khi đang ở phòng boss, đã có vũ khí khắc chế, và lúc chết không cầm nó: "Hoặc thử {weapon}. Nó hợp với đối thủ này."

### 2.6 Mẫu đòn Thử thách

- Khi độ khó có `newAttackPatterns: true`, kẻ địch và boss dùng **bản Thử thách**.
- **Dữ liệu:** khối `challenge` trong từng kẻ địch (`enemies.json`) hoặc boss (`bosses.json`), ghép sâu lên bản gốc:
  - Đối tượng thì ghép từng khóa; mảng thì thay cả mảng. Ví dụ `phases` của Thorna phải chép lại `untilHpPct`, `speedMul`; test kiểm hai bản khớp nhau.
  - Cấm ghi đè `id`, `behavior`. Bản ghép bỏ khóa `challenge` rồi qua **cùng bộ kiểm tra** như bản gốc: telegraph, nhịp đòn, không chết một đòn.
  - Lưu riêng (`config.enemies.challenge`, `config.bossesChallenge`). StageScene chọn bản theo độ khó bằng hàm thuần `dataFor(config, difficulty)`, nên StageWorld không cần biết có bản Thử thách.
- **Báo trước đòn nhiều nhịp:** báo trước tính cho cả loạt (nhịp sau không có báo trước riêng). Bản Thử thách hiện **số nhịp**: một chấm sáng mỗi nhịp phía trên kẻ địch trong lúc báo trước, để người chơi biết "loạt này có 2".
- Prologue không có độ khó, nên không có bản Thử thách. Tháp Pháo Tập Sự chỉ có ở Prologue.

**Stage 1** (`stages.json → verdant_gardens.enemies`: Drone Lính, Bướm Sắt, Tháp Gai, Lính Kén; mini-boss Bramble Golem; boss Thorna):

| Đối tượng | Gốc | Bản Thử thách | Người chơi phải làm khác gì |
| --- | --- | --- | --- |
| Drone Lính | 1 viên nhắm, hồi 1,5 s | **Bắn đôi:** 2 viên cách 0,25 s, viên 2 nhắm lại | Lướt hoặc nhảy hết loạt, không chỉ né một viên |
| Bướm Sắt | Thả 1 hạt nổ | **Thả kép:** 2 hạt cách 0,4 s khi đang trôi | Hai điểm rơi, phải đứng ngoài cả hai |
| Tháp Gai | 3 viên xòe 30° (−15°, 0°, +15°) | **Hai loạt so le:** loạt 2 sau 0,35 s, lệch 7,5° (−7,5°, +7,5°, +22,5°) | Đứng yên không còn khe. Ở xa (khoảng 10 ô): nhảy thấp qua loạt 1 rồi đứng yên cho loạt 2 bay qua đầu (test kiểm có đường né). Áp sát (khoảng 6 ô) thì gần như không né được: giữ khoảng cách và phá tháp từ xa |
| Lính Kén | Lao 3 ô rồi hồi 1 s | **Lao nối:** sau lần lao đầu quay lại, báo 0,4 s, lao lần nữa | Vượt qua lưng là chưa an toàn ngay |
| Bramble Golem | Giậm, bom, lao | **Lao rồi giậm:** dừng lao là giậm đất tại chỗ (báo trước 0,7 s), sóng đất lan hai bên | Né cú lao xong còn phải nhảy sóng |
| Thorna | 4 đòn | **Thêm đòn Rễ Đuổi** ở pha 2 và 3 (mục 3.3) | Phải di chuyển liên tục; đứng trên bục cũng không an toàn |

Báo trước vẫn ≥ 0,4 s với kẻ địch, ≥ 0,5 s với boss (luật telegraph), kể cả khi Thorna pha 3 tăng tốc 20%.

## 3. Công thức và dữ liệu

### 3.1 Hệ số

```text
damageTaken (đòn kẻ địch, boss) = round(raw × difficulty.damageTaken × build.damageTakenMul) ; ≥ 1
envDamage (gai, hố)             = round(raw × difficulty.damageTaken) ; ≥ 1
enemyHp, miniBossHp, bossHp     = base × difficulty.enemyHp   (không làm tròn; máu tính bằng phát Arc Cannon)
thưởng (từng nguồn)             = round(base × difficulty.rewardMul) ; base > 0 thì tối thiểu 1
```

- **Nhân `rewardMul`:** Core Bit và EXP của từng kẻ địch (làm tròn theo từng kẻ địch lúc bị hạ, không làm tròn lúc nhặt); thưởng lần đầu hạ boss của từng độ khó; rương, thùng khi có.
- **Không nhân:** Data Chip, SP, vũ khí boss, module, Két giáp, vật phẩm bí mật.
- Lần đầu phá đảo Thử thách (+3 Data Chip, `economy.json → dataChipSources.firstClearChallenge`): khi hạ boss cuối cốt truyện lần đầu ở Thử thách. Ngoài MVP; Data Chip chưa có trong bản lưu.
- EXP ở Cốt truyện cũng ×0,5 (đúng GDD chính). Người chơi Cốt truyện lên cấp chậm hơn; đồng bộ cấp bù phần máu và công.

| Độ khó | `damageTaken` | `enemyHp` | `rewardMul` | Mở khi | Mẫu đòn mới |
| --- | --- | --- | --- | --- | --- |
| Cốt truyện (`story`) | 0,5 | 0,8 | 0,5 | Có sẵn | Không |
| Thường (`normal`) | 1 | 1 | 1 | Có sẵn | Không |
| Thử thách (`challenge`) | 1,5 | 1,25 | 1,5 | Hạ boss màn đó ở Thường hoặc Thử thách | Có |

- Drone Lính (2 Core Bit, 6 EXP): Cốt truyện 1 và 3; Thử thách 3 và 9.
- Thorna: 200 / 250 / 312,5 máu; thưởng lần đầu 60 EXP + 40 Core Bit / 120 + 80 / 180 + 120. Golem: 48 / 60 / 75 máu.
- Gai Quạt 12: Cốt truyện 6, Thử thách 18 (Armor Plating cấp 2: round(12 × 1,5 × 0,92) = 17). Gai môi trường Thử thách: 45.
- **Không chết một đòn** (kiểm tra lúc nạp dữ liệu): đòn mạnh nhất của kẻ địch, boss (cả bản Thử thách) và môi trường × `damageTaken` lớn nhất phải nhỏ hơn máu cấp 1 (100). Lớn nhất hiện nay: gai 45; Hoa Nở 27.

### 3.2 Dữ liệu mới

- `difficulties.json`: `name`, `desc`; `unlock` là `null` hoặc `{ "clearedOn": [...] }`; `newAttackPatterns` (true/false).
- `enemies.json`, `bosses.json`: khối `challenge` (mục 2.6). Trường hành vi mới, parser gán mặc định:
  - drone: `attack.burst {count = 1, gapSec}`;
  - turret: `attack.volleys = 1`, `volleyGapSec`, `volleyOffsetDeg`;
  - butterfly: `attack.drops = 1`, `dropGapSec`;
  - shieldCharger: `attack.chainDashes = 0`, `chainTelegraphSec`;
  - golem: `attack.dash.endSlam = false`.
- `bosses.json → thorna.attacks.stalk` (Rễ Đuổi) chỉ có trong khối `challenge`.
- `ui.json → difficultyHint`: số lần chết (3), thời gian hiện (6 s), các câu NOVA.
- **Bản lưu 4:**
  - `progress.difficulty[campaignId] = { last, cleared }`;
  - `progress.stages[stageId].checkpointBy[difficultyId]` (checkpoint xa nhất theo độ khó; `checkpoint` cũ của bản 3 thành `checkpointBy.normal`).
  - **Nâng từ bản 3** (bước chuẩn hóa theo dữ liệu): boss chiến dịch đã hạ mà `cleared` rỗng thì ghi `cleared: ["normal"]`, vì trước bản 4 game luôn chạy Thường. Id độ khó lạ bị bỏ.

### 3.3 Đòn Rễ Đuổi (Thorna, chỉ ở Thử thách)

| Thông số | Giá trị | Ghi chú |
| --- | --- | --- |
| Báo trước toàn đòn | 0,7 s | Tư thế riêng: Thorna giơ hai tay, sáng **tím** (Rễ Trồi: chống tay xuống đất, sáng vàng) |
| Số rễ | 4 | |
| Khoảng đánh dấu | 0,45 s (pha 3: 0,375 s, suy ra) | |
| Vị trí đánh dấu | Mặt đứng ngay dưới Kai lúc đánh dấu, **kể cả bục**; Kai đang nhảy thì lấy mặt phía dưới | Đứng trên bục cũng không né được |
| Đánh dấu tới khi trồi | Lưu 0,6 s; pha 3 = max(0,5, 0,6 / 1,2) = 0,5 s (suy ra, không lưu riêng) | Bộ kiểm telegraph của boss kiểm cả trường này |
| Vệt đánh dấu | Vệt **tím** nhấp nháy dần nhanh trên mặt đứng | Khác vệt vàng của Rễ Trồi |
| Rễ | Trồi 0,5 s, 14 × 28 px, 15 sát thương | Mọc từ mặt được đánh dấu |
| Hồi sau đòn | 0,9 s | Lúc hở để bắn trả |

Pha 2: `thorns, roots, stalk, lash`. Pha 3: `roots, thorns, stalk, bloom, lash`. Pha 1 giữ nguyên.

## 4. Giao tiếp hệ thống

- **Màn Chuẩn bị → StageScene:** `scene.start(Stage, { stage, difficulty })`; không có `difficulty` thì Thường. Bảng Chuẩn bị ghi `last`.
- **StageScene:** `dataFor(config, difficulty)` chọn bản gốc hoặc bản Thử thách của kẻ địch và boss; truyền độ khó cho StageWorld; truyền checkpoint xuất phát theo mục 2.4; dựng hộp gợi ý NOVA.
- **StageWorld:** nhân `enemyHp` (boss trong `makeBoss`, bằng một BossData mới để `hpPct` và thanh máu HUD đúng), `rewardMul` (theo từng kẻ địch lúc bị hạ, thưởng boss lần đầu theo độ khó); lọc checkpoint theo độ khó; bộ đếm chết liên tiếp.
- **StageSave:** hạ **boss chiến dịch** của màn thì ghi `cleared`; chạm checkpoint thì ghi `checkpointBy[độ khó]`.
- **Màn Kết quả, menu tạm dừng:** hiện tên độ khó; Kết quả thêm "Đã mở Thử thách cho màn này" khi vừa mở.
- **Đồng bộ cấp, trần sức mạnh, Upgrade:** không phụ thuộc độ khó.

## 5. Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| `last: "challenge"` nhưng Thử thách khóa (dữ liệu đổi, nhập mã) | Mặc định về Thường |
| Id độ khó lạ trong bản lưu | Bỏ ở bước chuẩn hóa theo dữ liệu |
| Bản lưu 3 đã hạ Thorna | `cleared: ["normal"]` (đã chơi Thường), Thử thách mở |
| Checkpoint đã lưu (số 3) không có ở Thử thách | Xuất phát ở checkpoint gần nhất phía trước có ở Thử thách |
| Đạt CP4 ở Cốt truyện rồi vào Thử thách | Xuất phát từ đầu màn (không mang tiến độ từ dễ sang khó) |
| Rơi hố còn máu xen giữa các lần chết | Không tính, không đặt lại bộ đếm |
| Hạ boss xám trong phòng Golem (phòng thử) | Không ghi `cleared` (không phải boss chiến dịch của màn) |
| Màn xám | Không bảng Chuẩn bị, luôn Thường, không ghi gì về độ khó |
| Bản Thử thách thiếu, hỏng, hoặc ghi đè `id`/`behavior` | Lỗi khi nạp dữ liệu |
| Thưởng nhân 0,5 làm 1 thành 0,5 | Làm tròn, tối thiểu 1 |

## 6. Giao diện và phản hồi

- **Màn Chuẩn bị** (bảng HTML, ADR-001): ba thẻ (tên, mô tả, hệ số chính "Sát thương nhận ×1,5 · Máu kẻ địch ×1,25 · Thưởng ×1,5"); thẻ khóa có biểu tượng khóa và điều kiện; nút Bắt đầu lớn; nút ≥ 48 dp; phím, tay cầm, chạm.
- **Menu tạm dừng:** "<tên màn> · <độ khó>".
- **Màn Kết quả:** dòng "Độ khó"; "Đã mở Thử thách cho màn này" khi vừa mở.
- **Báo trước nhiều nhịp:** chấm sáng theo số nhịp trên đầu kẻ địch.
- **Rễ Đuổi:** tư thế và màu tím riêng (mục 3.3).
- **Âm thanh:** cảnh báo đòn mới dùng âm cảnh báo đòn boss (M12, chưa làm).

## 7. Nút tinh chỉnh

- Hệ số từng độ khó (`difficulties.json`); khối `challenge` của từng kẻ địch và boss.
- Số lần chết trước khi gợi ý, câu gợi ý (`ui.json → difficultyHint`).
- Checkpoint theo độ khó (thuộc tính bản đồ).
- Quy tắc chỉnh sau chơi thử: Thử thách mà quá 50% người thử bỏ cuộc ở một đoạn thì nới mẫu đòn (khoảng cách, báo trước) trước khi hạ hệ số. Cốt truyện mà còn người chết quá 3 lần ở một đoạn thì thêm checkpoint `story`.
- Lưu ý dữ liệu dễ lệch: chỉnh `phases` của bản gốc thì phải chỉnh cả `challenge.phases` (mảng thay cả); test kiểm hai bản khớp ngưỡng pha.

## 8. Tiêu chí kiểm thử và giả thuyết

- [ ] Máu boss nhân `enemyHp`: Thorna 200 / 250 / 312,5; Golem 48 / 60 / 75 (hồi quy).
- [ ] Thưởng nhân `rewardMul` theo từng kẻ địch; thưởng boss lần đầu theo từng độ khó (Cốt truyện rồi Thường thì nhận cả hai lần).
- [ ] Thử thách khóa tới khi hạ boss chiến dịch ở Thường hoặc Thử thách; bản lưu 3 đã hạ Thorna thì mở.
- [ ] Mặc định là độ khó lần trước của màn; `last` khóa thì Thường.
- [ ] Checkpoint lọc theo độ khó; không mang tiến độ từ dễ sang khó; chọn checkpoint gần nhất phía trước.
- [ ] Chết 3 lần liên tiếp thì đúng một gợi ý, câu đúng độ khó; rơi hố không tính; chạm checkpoint hoặc vào đấu trường thì đếm lại.
- [ ] Bản Thử thách của 4 kẻ địch Stage 1, Golem và Thorna chạy đúng; báo trước không dưới ngưỡng; Tháp Gai còn đường né bằng nhảy; không chết một đòn (kiểm tra lúc nạp).
- [ ] Bot không né thua Thorna ở Thường và Thử thách (cấp 4).
- [ ] Màn xám luôn Thường, không bảng Chuẩn bị (`gate-flow` đạt).
- **Giả thuyết đo ở đợt thử MVP:** khoảng 10–20% người chơi chọn Thử thách ở ít nhất một màn; tỷ lệ bỏ cuộc ở Thử thách ≤ 2 lần Thường; người chọn Cốt truyện vẫn hoàn thành ≥ 90% màn.

## 9. Kết quả duyệt và quyết định (bản 1 → bản 2)

| Nguồn | Điểm | Quyết định |
| --- | --- | --- |
| Creative Director | Thưởng boss một lần mỗi boss làm lượt Thử thách mất thưởng, lệch mô hình kinh tế | Một lần mỗi cặp (boss, độ khó) |
| Creative Director | Phạm vi `rewardMul` chưa đủ; thiếu Data Chip phá đảo Thử thách | Liệt kê nguồn nhân và không nhân (mục 3.1) |
| Creative Director | Thử thách chỉ checkpoint trước mini-boss và boss là quá thưa (khoảng 6 phút) | Thử thách bỏ CP1, khoảng cách ≤ 4,5 phút |
| Creative Director | Mang checkpoint từ dễ sang khó để mở Thử thách | Tiến độ checkpoint theo độ khó; chỉ mang sang bằng hoặc dễ hơn |
| Cả hai | Bản lưu 3 đã hạ Thorna bị khóa Thử thách | Chuẩn hóa: `cleared: ["normal"]` |
| Cả hai | Rễ Đuổi chỉ đánh dấu sàn: đứng bục là miễn nhiễm | Đánh dấu mặt Kai đang đứng, kể cả bục; tư thế, màu riêng |
| Cả hai | Pha 3 "0,5 s" lưu riêng sai cách tính | Lưu 0,6; suy ra; vào bộ kiểm telegraph |
| Creative Director | Golem chỉ đổi ngưỡng 50 → 70% là đổi số | Lao rồi giậm |
| Creative Director | Đòn nhiều nhịp cần báo trước khác; Tháp Gai lệch 15° trùng gai cũ | Chấm theo số nhịp; lệch 7,5°; test đường né |
| Creative Director | Stage 1 chỉ có 4 kẻ địch thường; Tháp Pháo Tập Sự thuộc Prologue | Bỏ biến thể Tháp Pháo |
| Creative Director, Technical Director | Gợi ý: câu NOVA, Thử thách gợi ý Thường; 3 hay 5 lần | 3 lần (theo D06, S09); câu theo độ khó (mục 2.5) |
| Technical Director | Mini-boss đã nhân `enemyHp`; chỉ boss chưa | Sửa mục 0; test Golem |
| Technical Director | Bản Thử thách: lưu riêng, `dataFor`, cấm ghi đè id/behavior, kiểm tra cả bản ghép | Mục 2.6 |
| Technical Director | Đếm chết phải đặt lại khi vào đấu trường; hộp gợi ý gắn với `def.tutorial` | Mục 2.5 |
| Technical Director | Hạ boss xám trong phòng thử không được ghi `cleared` | So với boss chiến dịch (mục 2.1, 5) |
| Technical Director | Chốt mẫu đòn Stage 1 trước cổng Prototype | `[PLACEHOLDER]`, chốt sau cổng |
| Technical Director | Cốt truyện: bot không né thắng Thorna | Chủ đích; quy tắc "phòng thủ không thay được né" áp từ Thường; test |
| Hai bên | Id checkpoint cố định | Hoãn tới khi chốt bản đồ (mục 2.4), lý do: chưa có bản lưu người chơi thật |
| Creative Director (tùy chọn) | Màn chưa chơi lấy độ khó gần nhất | Không làm: Thường là mặc định an toàn, chọn lại chỉ 1 chạm |
| Creative Director (tùy chọn) | Cốt truyện không nhân EXP | Không làm: giữ GDD chính; đồng bộ cấp đã bù |
