# Độ khó cốt truyện và màn Chuẩn bị (bản MVP)

- **Trạng thái:** Bản 1, Draft (14/11/2026), chờ Creative Director và Technical Director + Producer duyệt. Người dùng giao toàn quyền quyết định.
- **Quy trình:** Game Studio Agent `/design-system` theo mẫu `templates/gdd-system-template.md`.
- **Nguồn:** GDD chính mục 11; đặc tả Hub mục 3 (màn Chuẩn bị); `02-Wireframes/boards/Prep.html`; `03-Data/difficulties.json`; `04-Can-bang-kinh-te.md` mục 4–5; bản đồ hệ thống (`04-Dev-Plan/07-Ban-do-he-thong.md`, dòng "3 độ khó, mẫu đòn Thử thách": thiếu số liệu).
- **Phạm vi MVP:** Stage 1–4. Tài liệu này chốt quy tắc chung và mẫu đòn Thử thách của **Stage 1**. Stage 2–4 thêm mẫu đòn khi viết đặc tả các màn đó (sau cổng Prototype).

## 0. Hiện trạng trước tài liệu này

- `difficulties.json` có 3 độ khó với `damageTaken`, `enemyHp`, `rewardMul`, `unlock` (chuỗi chữ), `checkpoints` ("more", "normal", "fewer"), `newAttackPatterns`.
- Game luôn chạy Thường (`stage-scene.ts`); không có chỗ chọn độ khó.
- Đã áp: `damageTaken` (đòn kẻ địch, gai, hố), `enemyHp` (kẻ địch thường).
- **Chưa áp** (lỗi phát hiện khi rà): máu boss và mini-boss không nhân `enemyHp`; thưởng Core Bit và EXP không nhân `rewardMul`.
- `economy.json → difficultyRewardMul` trùng `difficulties.json → rewardMul`, chưa có gì kiểm tra hai chỗ khớp nhau.

## 1. Tổng quan và trụ cột

Ba độ khó cho cốt truyện: **Cốt truyện** (xem truyện, ít áp lực), **Thường** (thiết kế gốc), **Thử thách** (mở theo từng màn, có mẫu đòn mới). Chọn ở màn Chuẩn bị trước mỗi lần vào màn.

- **Trụ cột 1 (kỹ năng quyết định):** Thử thách khó hơn chủ yếu bằng **mẫu đòn mới** (phải đọc và né khác), không chỉ tăng số.
- **Trụ cột 3 (không cày):** độ khó không chặn tiến trình. Cốt truyện luôn mở, và đổi độ khó không mất gì đã có.
- **Trụ cột 5 (tôn trọng):** gợi ý hạ độ khó chỉ là gợi ý, không ép; không bán thứ gì liên quan độ khó.

## 2. Cơ chế cốt lõi

### 2.1 Chọn độ khó (màn Chuẩn bị, bản cắt MVP)

- Vào một **màn chiến dịch** (StageDef có `campaign`) từ menu thì hiện bảng Chuẩn bị trước khi vào màn. Màn xám (cổng Prototype) không có bảng Chuẩn bị và luôn chạy Thường, để số liệu chơi thử so sánh được.
- Ba ô độ khó. Mặc định là độ khó chọn lần trước **cho màn đó**; chưa chọn bao giờ thì Thường.
- Thử thách khóa cho tới khi **hạ boss của màn đó ở Thường hoặc Thử thách**. Thẻ khóa ghi "Mở khi xong màn này ở Thường". Xong ở Cốt truyện không mở Thử thách.
- Nút **Bắt đầu** lớn. Từ lúc mở bảng tới lúc vào màn tối đa 2 chạm: chọn độ khó, Bắt đầu; nếu giữ mặc định thì 1 chạm.
- Cột trái: tên màn, cấp khuyến nghị, cấp hiệu dụng của người chơi. Cấp thấp hơn mức khuyến nghị quá 2 cấp thì hiện gợi ý mềm (học kỹ năng, mua Upgrade, chọn Cốt truyện), không chặn.
- Ô booster và loadout của wireframe chưa có trong MVP (Booster, Loadout ở Alpha). Bảng ghi một dòng "Booster mở sau boss 4". Thanh Power Score sang Alpha, vì chưa có module.

### 2.2 Không đổi độ khó giữa màn

- Độ khó cố định trong một lượt vào màn: menu tạm dừng chỉ hiện độ khó đang chơi.
- Muốn đổi thì thoát ra menu rồi vào lại. Checkpoint đã lưu của màn vẫn giữ (mục 2.4).

### 2.3 Hồi sinh, phần thưởng, mở khóa

- Lần đầu hạ boss của màn: ghi độ khó đó vào `cleared` của màn. Mở Thử thách nếu đó là Thường hoặc Thử thách.
- Thưởng lần đầu hạ boss (EXP, Core Bit) chỉ nhận một lần cho mỗi boss, ở độ khó lần đầu thắng. Vũ khí boss và SP không phụ thuộc độ khó.
- Thắng lại ở độ khó khác chỉ ghi thêm vào `cleared`, không thưởng lần đầu nữa.

### 2.4 Checkpoint theo độ khó

- Mỗi checkpoint trên bản đồ có thuộc tính tùy chọn `difficulties` (danh sách id, ví dụ `"story"` hoặc `"story,normal"`). Không ghi thì có ở cả ba độ khó.
- Quy tắc đặt khi chốt bản đồ Stage 1–4 (sau cổng Prototype):
  - **Thường:** 4 checkpoint sau mỗi đoạn A–D (đặc tả Stage 1).
  - **Cốt truyện:** thêm 1 checkpoint giữa mỗi đoạn dài (đoạn B, C), ghi `difficulties: "story"`.
  - **Thử thách:** chỉ checkpoint trước mini-boss và trước boss; hai checkpoint còn lại ghi `difficulties: "story,normal"`.
- Bản lưu giữ **chỉ số checkpoint trên danh sách đầy đủ**. Vào màn ở độ khó khác thì xuất phát tại checkpoint **gần nhất phía trước (chỉ số ≤ đã lưu)** có ở độ khó đó; không có thì từ đầu màn. Chạm một checkpoint vẫn ghi theo chỉ số trên danh sách đầy đủ, nên đổi qua lại không mất tiến độ.
- `difficulties.json → checkpoints` ("more"/"normal"/"fewer") chỉ là chữ mô tả; cơ chế là thuộc tính trên bản đồ.

### 2.5 Gợi ý khi chết nhiều lần (GDD chính mục 11)

- Đếm số lần **chết** (không tính rơi hố còn máu) liên tiếp kể từ checkpoint gần nhất chạm được; chạm checkpoint mới thì đếm lại từ 0.
- Lần chết thứ 5: NOVA hiện một câu gợi ý ở hộp gợi ý (như hướng dẫn), tự tắt sau vài giây, không dừng game.
  - Ở Thường hoặc Thử thách: gợi ý chọn độ khó thấp hơn ở màn Chuẩn bị, hoặc dùng vũ khí khắc chế nếu đã có (đang ở phòng boss và đã sở hữu điểm yếu của boss).
  - Ở Cốt truyện: chỉ gợi ý vũ khí khắc chế (nếu có), hoặc học thêm kỹ năng ở Xưởng.
- Mỗi lượt vào màn hiện tối đa một lần. Tắt hướng dẫn (menu tạm dừng) thì không hiện.

### 2.6 Mẫu đòn Thử thách

- Khi độ khó có `newAttackPatterns: true`, kẻ địch và boss dùng **bản Thử thách** trong dữ liệu.
- Bản Thử thách là khối `challenge` trong `enemies.json` hoặc `bosses.json`, ghép sâu lên dữ liệu gốc: đối tượng thì ghép từng khóa, mảng thì thay cả mảng. Bản ghép phải qua cùng bộ kiểm tra như dữ liệu gốc.
- Prologue (Drone Lính Prologue) không có độ khó nên không có bản Thử thách.

**Stage 1:**

| Đối tượng | Gốc | Bản Thử thách | Người chơi phải làm khác gì |
| --- | --- | --- | --- |
| Drone Lính | 1 viên nhắm, hồi 1,5 s | **Bắn đôi:** 2 viên cách 0,25 s, viên 2 nhắm lại | Lướt hoặc nhảy hết loạt, không chỉ né một viên |
| Tháp Pháo Tập Sự | 1 viên bắn ngang | **Ngắm theo:** viên bay về phía Kai lúc bắn (kể cả chéo) | Không trốn được bằng cách đứng cao hoặc thấp hơn nòng |
| Bướm Sắt | Thả 1 hạt nổ | **Thả kép:** 2 hạt cách 0,4 s khi đang trôi | Hai điểm rơi, phải đứng ngoài cả hai |
| Tháp Gai | 3 viên xòe 30° | **Hai loạt so le:** loạt 2 sau 0,35 s lệch 15° | Khe né của loạt 1 bị loạt 2 lấp, phải đổi chỗ |
| Lính Kén | Lao 3 ô rồi hồi 1 s | **Lao nối:** sau lần lao đầu quay lại, báo 0,4 s, lao lần nữa | Vượt qua lưng là chưa an toàn ngay |
| Bramble Golem (mini-boss) | Pha 2 ở 50% máu | Pha 2 từ 70% máu | Gặp bom và lao sớm hơn |
| Thorna | 4 đòn | **Thêm đòn Rễ Đuổi** ở pha 2 và 3 (mục 3.3) | Phải di chuyển liên tục, không đứng một chỗ bắn |

Mọi báo trước vẫn ≥ 0,4 s với kẻ địch thường, ≥ 0,5 s với boss (luật telegraph), kể cả khi Thorna pha 3 tăng tốc 20%.

## 3. Công thức và dữ liệu

### 3.1 Hệ số

```text
damageTaken (đòn kẻ địch, boss) = round(raw × difficulty.damageTaken × build.damageTakenMul) ; ≥ 1
envDamage (gai, hố)             = round(raw × difficulty.damageTaken) ; ≥ 1
enemyHp, bossHp                 = base × difficulty.enemyHp   (không làm tròn; máu tính bằng phát Arc Cannon)
coreBit một kẻ địch             = round(base × difficulty.rewardMul)  (base > 0 thì ≥ 1)
exp một kẻ địch                 = round(base × difficulty.rewardMul)  (base > 0 thì ≥ 1)
thưởng lần đầu hạ boss          = round(rewardExp × rewardMul), round(rewardCoreBit × rewardMul)
```

| Độ khó | `damageTaken` | `enemyHp` | `rewardMul` | Mở khi | Mẫu đòn mới |
| --- | --- | --- | --- | --- | --- |
| Cốt truyện (`story`) | 0,5 | 0,8 | 0,5 | Có sẵn | Không |
| Thường (`normal`) | 1 | 1 | 1 | Có sẵn | Không |
| Thử thách (`challenge`) | 1,5 | 1,25 | 1,5 | Hạ boss màn đó ở Thường hoặc Thử thách | Có |

- Ví dụ Drone Lính (2 Core Bit, 6 EXP): Cốt truyện 1 và 3; Thử thách 3 và 9.
- Thorna 250 máu: Cốt truyện 200, Thử thách 312,5.
- Gai Quạt 12: Cốt truyện 6, Thử thách 18 (Armor Plating cấp 2 ở Thử thách: round(12 × 1,5 × 0,92) = 17).
- Thử thách không bao giờ gây chết trong một đòn ở cấp khuyến nghị: đòn mạnh nhất Stage 1 là Hoa Nở 18 × 1,5 = 27, nhỏ hơn máu cấp 2 (104).
- Kiểm tra lúc nạp dữ liệu: `economy.difficultyRewardMul[id]` phải bằng `difficulties[id].rewardMul`.

### 3.2 Dữ liệu mới

- `difficulties.json`: thêm `name`, `desc` (chữ trên màn Chuẩn bị); `unlock` đổi thành `null` hoặc `{ "clearedOn": ["normal", "challenge"] }`; giữ `checkpoints` làm chữ mô tả.
- `enemies.json`, `bosses.json`: khối `challenge` cho từng đối tượng (mục 2.6), kèm các trường hành vi mới:
  - drone: `attack.burst {count, gapSec}`;
  - turret: `attack.aim`, `attack.volleys`, `attack.volleyGapSec`, `attack.volleyOffsetDeg`;
  - butterfly: `attack.drops`, `attack.dropGapSec`;
  - shieldCharger: `attack.chainDashes`, `attack.chainTelegraphSec`.
- `ui.json → difficultyHint`: số lần chết (5), thời gian hiện (6 s), các câu NOVA.
- **Bản lưu 4:** `progress.difficulty[campaignId] = { last: id, cleared: id[] }`.

### 3.3 Đòn Rễ Đuổi (Thorna, chỉ ở Thử thách)

| Thông số | Giá trị | Ghi chú |
| --- | --- | --- |
| Báo trước toàn đòn | 0,7 s | Thorna cắm tay xuống đất (như Rễ Trồi) |
| Số rễ | 4 | |
| Đánh dấu | Mỗi 0,45 s đánh dấu một ô dưới chân Kai (vệt sáng trên sàn) | |
| Thời gian từ đánh dấu tới khi trồi | 0,6 s (pha 3: 0,5 s) | ≥ 0,5 s sau tăng tốc 20% |
| Rễ đứng | 0,5 s, 14 × 28 px, 15 sát thương | Như Rễ Trồi |
| Hồi sau đòn | 0,9 s | Lúc hở để bắn trả |

Pha 2: `thorns, roots, stalk, lash`. Pha 3: `roots, thorns, stalk, bloom, lash`. Pha 1 giữ nguyên để người chơi quen nhịp trước.

## 4. Giao tiếp hệ thống

- **Màn Chuẩn bị → StageScene:** `scene.start(Stage, { stage, difficulty })`; không có `difficulty` thì Thường.
- **StageWorld:** nhận `difficulty` (đã có), dùng bản Thử thách của kẻ địch và boss khi `newAttackPatterns`, nhân `rewardMul` khi rơi Core Bit, EXP và khi hạ boss lần đầu.
- **StageSave:** khi hạ boss thì ghi `cleared`; khi vào màn thì ghi `last`.
- **TutorialBox:** gợi ý NOVA của mục 2.5 dùng hộp gợi ý sẵn có.
- **Màn Kết quả, menu tạm dừng:** hiện tên độ khó.
- **Đồng bộ cấp, trần sức mạnh, Upgrade:** không phụ thuộc độ khó (GDD 6.1: "Upgrade giữ nguyên khi đổi độ khó").

## 5. Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| Bản lưu ghi `last: "challenge"` nhưng Thử thách bị khóa (dữ liệu đổi, nhập mã) | Mặc định về Thường |
| Id độ khó lạ trong bản lưu | Bỏ khi đọc |
| Vào màn ở Thử thách, checkpoint đã lưu (số 3) không có ở Thử thách | Xuất phát ở checkpoint gần nhất phía trước có ở Thử thách (số 2); chạm số 4 thì vẫn ghi 4 |
| Chết 5 lần nhưng rơi hố còn máu xen giữa | Rơi hố không tính, không đặt lại bộ đếm |
| Hạ boss ở Cốt truyện rồi vào lại | Thử thách vẫn khóa; Thường dùng được |
| Màn thử không phải màn chiến dịch (màn xám) | Không có bảng Chuẩn bị, luôn Thường, không ghi `difficulty` |
| Bản Thử thách thiếu hoặc hỏng | Lỗi khi nạp dữ liệu (không chạy với dữ liệu sai) |
| Thưởng nhân 0,5 làm 1 Core Bit thành 0,5 | Làm tròn lên thành 1 (base > 0 thì ≥ 1), để Cốt truyện vẫn có tiền rơi |

## 6. Giao diện và phản hồi

- **Màn Chuẩn bị** (bảng HTML, ADR-001, như Xưởng và Quầy Mira):
  - Ba thẻ độ khó: tên, mô tả một dòng, hệ số chính (ví dụ "Kẻ địch ×1,25 máu · thưởng ×1,5"). Thẻ khóa có biểu tượng khóa và điều kiện.
  - Nút Bắt đầu lớn; nút ≥ 48 dp; điều khiển bằng phím, tay cầm, chạm.
- **Menu tạm dừng:** dòng tiêu đề "Tạm dừng · <độ khó>".
- **Màn Kết quả:** thêm dòng "Độ khó: …"; lần đầu mở Thử thách thì thêm dòng "Đã mở Thử thách cho màn này".
- **Rễ Đuổi:** vệt đỏ nhấp nháy trên sàn tại ô đánh dấu (giống báo trước Rễ Trồi).
- **Âm thanh:** cảnh báo đòn mới dùng chung âm cảnh báo đòn boss (M12, chưa làm).

## 7. Nút tinh chỉnh

- Hệ số từng độ khó (`difficulties.json`).
- Số lần chết trước khi gợi ý, câu gợi ý (`ui.json → difficultyHint`).
- Khối `challenge` của từng kẻ địch và boss.
- Đặt checkpoint theo độ khó (thuộc tính bản đồ).

Quy tắc chỉnh sau chơi thử: Thử thách mà quá 50% người thử bỏ cuộc ở một đoạn thì nới mẫu đòn (khoảng cách, báo trước) trước khi hạ hệ số. Cốt truyện mà còn người chết quá 5 lần ở một đoạn thì thêm checkpoint `story`.

## 8. Tiêu chí kiểm thử và giả thuyết

- [ ] Máu boss và mini-boss nhân `enemyHp`: Thorna Cốt truyện 200, Thử thách 312,5.
- [ ] Thưởng nhân `rewardMul` và làm tròn đúng mục 3.1 (Drone Lính: Cốt truyện 1 Core Bit, Thử thách 3).
- [ ] Thử thách khóa tới khi hạ boss ở Thường hoặc Thử thách; Cốt truyện không mở.
- [ ] Mặc định là độ khó lần trước của màn đó; `last` khóa thì về Thường.
- [ ] Checkpoint lọc theo độ khó; vào lại chọn checkpoint gần nhất phía trước; chạm checkpoint ghi chỉ số đầy đủ.
- [ ] Chết 5 lần liên tiếp ở một đoạn thì có đúng một gợi ý; rơi hố không tính.
- [ ] Bản Thử thách của 5 kẻ địch, Golem và Thorna chạy đúng; báo trước không dưới ngưỡng (test tự động).
- [ ] Màn xám luôn Thường, không bảng Chuẩn bị (`gate-flow` vẫn đạt).
- **Giả thuyết đo ở đợt thử MVP:** khoảng 10–20% người chơi chọn Thử thách ở ít nhất một màn; tỷ lệ bỏ cuộc ở Thử thách ≤ 2 lần Thường; người chọn Cốt truyện vẫn hoàn thành ≥ 90% màn.
