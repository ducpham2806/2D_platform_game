# Nhiệm vụ phụ Stage 1–4 (bản MVP)

- **Mã hệ thống:** `SYS-15`. Chưa có ID module riêng: phần trong màn thuộc M7, Bảng Nhiệm Vụ thuộc M10, bản lưu thuộc M11 (mục 9).
- **Phân loại:** Gameplay, Meta, Persistence.
- **Độ ưu tiên:** MVP (P0). Đây là nguồn module duy nhất của MVP, nên ST-08-09 (Module, Két giáp) chờ hệ thống này.
- **Trạng thái:** **Bản 2, Approved (ủy quyền) 14/11/2026 sau duyệt Creative Director và Technical Director + Producer.** Người dùng giao toàn quyền; 8 quyết định ở mục 11 đã chốt, điểm duyệt và chỗ sửa ở mục 12. Mọi số là `[PLACEHOLDER]`.
- **Phụ thuộc (upstream):** M7 (bí mật, vật chắn, mốc `section`, bản đồ Tiled), M11 bản lưu 4 (`SaveManager.update`, `transact`), M8 (`character.modules.owned` có từ bản lưu 2), EP-10 độ khó, `stages.json → sideQuestId`, `modules.json`, `economy.json → dataChipSources`.
- **Bị ảnh hưởng (downstream):** ST-08-09 và Xưởng tab Module, HUD, màn Chuẩn bị, màn Kết quả, menu tạm dừng, radar Đầu Mk I, Data Chip, M16 đo lường, đặc tả Stage 2–4 (`16-Dac-ta-Stage2-4-nhap.md`).
- **Nguồn:** đặc tả Hub mục 6–8; GDD chính 4, 6.1, 6.4, 8.3, 10; đặc tả Prologue & Stage 1 mục 3; GDD 10 mục 1, 2.2–2.3; kinh tế mục 5; kịch bản hướng dẫn mục 2, R05, D02, D04; giọng nhân vật; thoại Warden mục 2; `game/src/logic/save/save-data.ts`, `game/src/logic/world/stage-mechanics.ts`, `game/maps/README.md`.
- **Quy trình (Game Studio Agent):** `/design-system` theo `templates/gdd-system-template.md`, vai Level Designer + Narrative Designer (`level-designer`, `narrative-designer`, `save-systems`).
- **Cổng Prototype:** quy tắc, dữ liệu, bản lưu, Bảng Nhiệm Vụ và cơ chế trong màn không phụ thuộc thông số cảm giác, nên viết và code được ngay. **Vị trí** vật nhiệm vụ trên bản đồ Stage 1 chỉ ghi thành quy tắc theo đoạn A–D (số là `[PLACEHOLDER]`), chốt sau cổng. Stage 2–4: quy tắc đặt theo `16-Dac-ta-Stage2-4-nhap.md` mục 3.8, 4.8, 5.8; bản đồ dựng sau cổng (EP-17).

## 0. Câu hỏi và phương án

**Câu hỏi:** 4 nhiệm vụ phụ của MVP (tên và mục tiêu đã có ở đặc tả Hub mục 7) cần thêm gì để code được: cách đếm, lúc nhận, lúc xong, cách lưu, cách đặt trên bản đồ. Ràng buộc: Hub ở MVP chỉ là menu, chưa có bản đồ nhỏ; đặc tả Stage 2–4 viết song song (`16-Dac-ta-Stage2-4-nhap.md`).

| # | Câu hỏi | Phương án | Đề xuất |
| --- | --- | --- | --- |
| Q1 | "Module gắn theo **vị trí màn**" (Hub mục 7) nghĩa là gì | (a) Theo màn: số thứ tự `index` trong `stages.json`, ghi thẳng trong `quests.json`. (b) Theo thứ tự hoàn thành: nhiệm vụ xong thứ k nhận module thứ k | **(a).** Bảng hiện được phần thưởng trước khi nhận; khớp R05, D04 và bảng Hub mục 7; khớp cách gán Két giáp theo màn. (b) chỉ giữ đường sức mạnh cố định khi đổi thứ tự màn. Ở MVP lợi ích này gần như bằng 0: sau boss 3, nhiệm vụ của 3 màn đã qua mở cùng lúc |
| Q2 | Vật nhiệm vụ có trong màn khi chưa nhận không | (a) Chỉ xuất hiện khi đang làm. (b) Luôn có; nhặt trước thì tính sẵn | **(a).** Lần đầu vào màn không có vật nhặt lên mà không để làm gì; số "bí mật x/y" ở màn Kết quả không bị lẫn; khớp R05 ("tìm giúp tôi") và lối "quay lại màn cũ" của GDD 4 |
| Q3 | Nhận thưởng ở đâu | (a) Ở Bảng Nhiệm Vụ, Mira trao. (b) Cấp thưởng ngay trong màn khi xong | **(a), kèm nhắc**: thông báo khi xong, chấm báo ở menu, dòng ở màn Kết quả. Lúc trao thưởng là chỗ của thoại Mira và của D04 (lắp module). Trao thưởng là một giao dịch nguyên tử như Quầy Mira |
| Q4 | "Qua đoạn trượt không rơi" và "qua đoạn gió không chạm sàn" làm bằng gì | (a) Một cơ chế chung `questZone` có luật hỏng trong dữ liệu, và một lý do trong truyện (thùng thuốc, máy ghi gió) chỉ là hình vẽ. (b) Mỗi màn một cơ chế riêng | **(a).** Một máy trạng thái dùng cho cả hai, test được trên phòng thử ngay bây giờ. Lý do trong truyện giải thích vì sao rơi hay chạm sàn là hỏng. Không đổi vật lý Kai |
| Q5 | Thưởng EXP (GDD 6.1: "EXP từ nhiệm vụ phụ") | (a) 0 ở MVP; EXP đến từ kẻ địch trong lần chơi lại. (b) Một lượng EXP cố định khi nhận thưởng | **(a).** Giữ đường cấp và SP của GDD 10 mục 0. Trường `exp` vẫn có trong dữ liệu để chỉnh sau |
| Q6 | Khi nào mở tab Module của Xưởng | (a) Sau boss 3, như hiện nay. (b) Khi nhận module đầu tiên | **(b).** Sau boss 3 chưa ai có module, mở tab lúc đó là tab rỗng. Luật mở dần (kịch bản hướng dẫn nguyên tắc 5) là mở khi dùng được ngay. Tab Giáp đã theo cách này ("khi nhận lần đầu") |

## 1. Tổng quan và trụ cột

- **Mục tiêu thiết kế:** cho người chơi một lý do ngắn, rõ ràng để **quay lại màn đã qua** với vũ khí mới. Mỗi chuyến kết hợp được với Két giáp hoặc Memory Log. Phần thưởng là module, tức một lựa chọn build mới, không phải chỉ số thô.
- **Trụ cột:**
  - **1 (kỹ năng quyết định):** hai nhiệm vụ đoạn thử (Cryo, Cirrus) là bài kiểm tra điều khiển gọn gàng, luật hỏng thấy rõ. Không gì có thể mua để vượt qua.
  - **3 (không cày):** nhiệm vụ là tùy chọn, không chặn tiến trình, làm được ở mọi độ khó. Mỗi nhiệm vụ một chuyến, không lặp.
  - **4 (truyện đi cùng nhịp chơi):** nhiệm vụ thuộc tầng nội dung "khám phá" (GDD 3.6). Thoại của Mira cho thấy cô đang lo cho khu ngoại ô mà không nói ra; câu của NOVA gieo thêm cho lật mở lớp 3.
- **Phản trụ cột:** vật nhiệm vụ cần vũ khí mà người chơi chưa chắc có; mục tiêu chỉ tới được bằng lướt trên không; mất tiến độ vì chết; đồng hồ ẩn; nhiệm vụ cần đánh lại boss.
- **MDA:**
  - *Mechanics:* nhận ở Bảng, vật chỉ xuất hiện khi đang làm, đếm theo id cố định, đoạn thử có mép vào và mép đích, trao thưởng nguyên tử.
  - *Dynamics:* đi lại màn quen theo lối khác (nhánh phụ, góc cao), chạy đoạn thử nhiều lần ngay sau checkpoint, chọn module nào lắp khi tổng tải không đủ.
  - *Aesthetics:* khám phá (Hạt giống, Gương), làm chủ (đoạn thử), "à, Mira cần thứ này để làm gì" (truyện ngầm).

## 2. Cơ chế cốt lõi và máy trạng thái

### 2.1 Luồng chính

1. Hạ boss chiến dịch thứ 3 thì mục **Bảng Nhiệm Vụ** ở menu chính sáng lên, có chấm báo. Từ đây mỗi màn đã hạ boss có một nhiệm vụ ở trạng thái **chưa nhận**.
2. Mở Bảng: Mira nói câu giới thiệu một lần (R05). Chọn một nhiệm vụ: Mira giao việc (tối đa 3 câu), bấm **Nhận**.
3. Vào màn của nhiệm vụ như mọi lần (qua màn Chuẩn bị, chọn độ khó tùy ý). Vật nhiệm vụ xuất hiện, HUD hiện bộ đếm, NOVA nói một câu khi vào màn.
4. Tiến độ ghi **ngay** khi nhặt hoặc phá một vật, hoặc khi qua mép đích của đoạn thử. Không cần hạ boss. Thoát màn từ menu tạm dừng vẫn giữ.
5. Xong thì hiện Báo ngắn "Nhiệm vụ xong!" (mục 6.1) và Bảng có chấm báo. Về Bảng bấm **Nhận thưởng**: một lần ghi gồm module, Data Chip và trạng thái **đã nhận thưởng**. Lần nhận module đầu tiên mở tab Module của Xưởng và chạy D04.

### 2.2 Bốn nhiệm vụ

Người giao là **Mira** (đặc tả Hub mục 6). NOVA chỉ bình luận trong màn. Loại "giải cứu" không dùng ở MVP (cần NPC đi theo, tức thêm AI mới); để Alpha.

| # | Màn (`stage`) | Nhiệm vụ (`id`) | Loại | Mục tiêu trong màn | Đếm tiến độ | Xong khi | Thưởng |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Verdant Gardens (`verdant_gardens`) | Hạt giống thất lạc (`sq_verdant_gardens`) | Thu thập (`collect`) | Nhặt 5 **Hạt Giống Phát Quang** rải trong đoạn A–D | Số id hạt đã nhặt, 0–5 | Nhặt hạt thứ 5 | 1 Data Chip + Magnet Core (`magnet_core`) |
| 2 | Prism Institute (`prism_institute`) | Gương rối (`sq_prism_institute`) | Hạ mục tiêu (`destroy`) | Phá 6 **Gương Rối**: vật tĩnh nhiễm Eclipse. Không phải kẻ địch Gương Quang (`guong_quang`), cũng không phải gương của câu đố laser | Số id gương đã phá, 0–6 | Phá gương thứ 6 | 1 Data Chip + Last Stand (`last_stand`) |
| 3 | Cryo Vault (`cryo_vault`) | Băng vỡ (`sq_cryo_vault`) | Đến nơi (`reach`), luật **không rơi** | Mang **thùng thuốc lạnh** qua đoạn băng trượt trong một lần thử: không rơi hố, không chết | 0/1. Lần thử dở không lưu | Qua mép đích trong một lần thử hợp lệ | 1 Data Chip + Phase Step (`phase_step`) |
| 4 | Cirrus Tower (`cirrus_tower`) | Gió mất hướng (`sq_cirrus_tower`) | Đến nơi, luật **không chạm sàn** | Mang **máy ghi gió** qua đoạn gió: không đứng trên ô đặc, không rơi hố, không chết | 0/1 | Như trên | 1 Data Chip + Energy Siphon (`energy_siphon`) |

**Vì sao "hạ mục tiêu" là phá vật, không phải hạ kẻ địch:** kẻ địch dựng lại mỗi lần hồi sinh nên đếm kẻ địch vừa dễ cày vừa khó lưu. Vật tĩnh có id cố định, phá một lần là xong.

### 2.3 Máy trạng thái nhiệm vụ

| Trạng thái | Lưu? | Vào khi | Ra khi → trạng thái kế | Thấy ở đâu |
| --- | --- | --- | --- | --- |
| `locked` (khóa) | Không (suy ra) | Mặc định | Đủ `rules.boardUnlockBosses` boss chiến dịch **và** boss của màn đã hạ → `available` | Bảng: dòng khóa "Mở khi hạ boss <màn>" (chỉ khi Bảng đã mở) |
| `available` (chưa nhận) | Suy ra; lưu một bản ghi khi Bảng hiện nhiệm vụ lần đầu (đánh dấu đã xem) | Như trên | Bấm **Nhận** → `active` | Bảng: nút Nhận. Menu: chấm báo khi có nhiệm vụ chưa xem |
| `active` (đang làm) | Có, kèm `items` | Bấm Nhận | collect/destroy: số `items` ≥ `required` → `done`. reach: qua mép đích → `done` | Bảng: "Đang làm 2/5". Màn Chuẩn bị, HUD, menu tạm dừng, Kết quả |
| `done` (xong) | Có | Như trên, ghi ngay trong màn | Bấm **Nhận thưởng** (giao dịch thành công) → `claimed` | HUD báo một lần. Bảng: nút Nhận thưởng nổi bật. Menu: chấm báo. Kết quả: một dòng nhắc |
| `claimed` (đã nhận thưởng) | Có | Giao dịch nhận thưởng | Không ra (trạng thái cuối) | Bảng: "Đã nhận", đọc lại được câu của Mira |

- Không có nút bỏ nhiệm vụ: nhiệm vụ chỉ ảnh hưởng màn của nó, đang làm mà không đi cũng không mất gì.
- Vật và đoạn thử của nhiệm vụ chỉ có trong màn khi trạng thái là `active`. Khi `done` hoặc `claimed` thì mọi vật đã lấy hết và đoạn thử biến mất.

### 2.4 Máy trạng thái lần thử (đoạn thử `questZone`, chỉ trong lượt chơi)

Đoạn thử là một hình chữ nhật trên bản đồ. Có một **mép vào** và một **mép đích** (thuộc tính `enter`, `exit`). Các mép còn lại phải kín (tường đặc hoặc hố). Mép vào không được là mép dưới (test bản đồ, mục 2.8).

"Đang đứng" là đang chạm đất trên mặt đứng được: ô đặc, bục một chiều, bệ di động, dây leo đu. Mọi lúc khác (nhảy, rơi, bám tường) tính là "đang nhảy hoặc rơi".

| Trạng thái | Điều kiện | Kế tiếp | Phản hồi |
| --- | --- | --- | --- |
| `idle` | Nhiệm vụ `active`, Kai ngoài vùng | Kai còn sống, qua mép vào, hộp va chạm nằm trọn trong vùng → `running` | Vạch vào sáng. Thùng hoặc máy ghi hiện trên lưng Kai. Lần đầu trong lượt: NOVA nói câu `start` |
| `running` | Đang thử | Tâm hộp Kai qua mép đích → `done` (ghi ngay) | Vạch đích chớp, chuông ngắn, NOVA nói câu `done`, HUD báo xong |
| `running` | Phạm luật trong `failOn`: `pit` (rơi hố), `death` (chết), `ground` (đứng trên ô `Tile.Solid` liên tục ≥ `groundGraceSteps` bước) | → `idle` (hỏng) | Thùng vỡ hoặc máy ghi tắt đèn, tiếng hỏng. NOVA nói câu `fail` ở lần hỏng đầu của lượt; từ lần hỏng thứ `hintAfterFails` nói câu `hint` (một lần) |
| `running` | Bị đưa ra ngoài vùng không qua mép đích (gai về chỗ an toàn, hố về checkpoint, hồi sinh) hoặc ra qua mép kín | → `idle` (hỏng) | Như trên |
| `running` | Tâm hộp Kai ra qua mép vào khi **đang đứng** | → `idle` (hủy, không tính là hỏng) | Đồ trên lưng biến mất, không có câu thoại |
| `running` | Tâm hộp Kai ra qua mép vào khi **đang nhảy hoặc rơi** | → `idle` (hỏng) | Như dòng hỏng. Không lách luật hỏng bằng cách nhảy ngược ra |

- "Sàn" (luật `ground`) là mặt trên của ô **đặc**. Bục một chiều (bệ mây tĩnh), bệ di động, dây leo đu và bám tường đều được. Đây là cách đọc đã có trong `StageWorld` khi tìm chỗ đứng an toàn (`firm`), chỉ khác là bục một chiều không tính.
- Thùng và máy ghi **chỉ là hình vẽ**: không đổi tốc độ, trọng lực hay hộp va chạm của Kai.
- Tạm dừng và hộp hội thoại làm trận đứng yên, nên lần thử cũng đứng yên.

### 2.5 Nhận và nhận thưởng: Bảng Nhiệm Vụ bản MVP

- **Lối vào:** menu chính (Hub dạng menu), nút chữ **Bảng Nhiệm Vụ** và phím **N** (hiện chưa phím nào dùng). Trước khi đủ boss thì nút mờ "Bảng Nhiệm Vụ (sau boss 3)", giống Xưởng và Quầy Mira. Không mở từ menu tạm dừng.
- **Bảng:** bảng HTML theo ADR-001, giống Xưởng và Quầy Mira. Chi tiết ở mục 6.2.
- **Nhận:** một chạm vào Nhận ghi `active` (`manager.update`). Nhận nhiều nhiệm vụ cùng lúc được.
- **Nhận thưởng:** dùng `SaveManager.transact(claimQuest)`, giống mua Upgrade. Một lần ghi gồm: thêm module vào `character.modules.owned` (đã có thì thôi), cộng `inventory.dataChips`, trạng thái `claimed`. Bảng chờ ghi xong mới báo. Ghi lỗi thì hoàn tác, giữ `done` và báo lỗi. Bấm hai lần thì lần hai không đổi gì.
- **R05** (lần đầu mở Bảng): Mira nói câu giới thiệu. Câu thứ hai đổi theo Két giáp Verdant (mục 6.5). Khi có giai đoạn Hub của TutorialManager thì chuyển sang đó (R02–R04 cũng đang chờ giai đoạn này). Trong lúc chờ, Bảng tự hiện câu và ghi `tutorial.done: R05`. R05 làm ở ST-18-05, không thuộc EP-14.
- **D04** (lắp module đầu tiên): kích hoạt khi nhận thưởng nhiệm vụ đầu tiên, không phải "sau boss 3". Phụ thuộc tab Module (ST-08-09).

### 2.6 Chết, rơi hố, thoát giữa chừng

| Tình huống | Thu thập, hạ mục tiêu | Đoạn thử |
| --- | --- | --- |
| Chết, hồi sinh ở checkpoint | Vật đã lấy vẫn giữ (đã ghi), không dựng lại. Kẻ địch dựng lại như thường | Lần thử đang chạy thì hỏng. Checkpoint trước vạch vào ≤ `zoneCheckpointMaxTiles` ô nên thử lại ngay |
| Rơi hố còn máu | Giữ | Hỏng nếu `pit` có trong `failOn` (cả hai đoạn thử MVP đều có) |
| Chạm gai | Giữ | Bị đưa ra ngoài vùng thì hỏng. Về chỗ an toàn vẫn trong vùng thì không hỏng (gai không phải "rơi"). Đoạn gió Cirrus không đặt gai (mục 2.8) |
| Thoát từ menu tạm dừng, đóng tab, `pagehide` | Đã ghi lúc nhặt hoặc phá | Lần thử dở mất. Đã qua đích thì đã ghi `done` |
| Vào lại màn | Vật đã lấy không xuất hiện. Xuất phát ở checkpoint đã lưu như thường (theo độ khó, GDD 11 mục 2.4) | Vạch vào chờ ở `idle` |
| Hạ boss trong chuyến nhiệm vụ | Không ảnh hưởng. Checkpoint của màn về 0 như hiện nay | Như bên trái |

### 2.7 Độ khó và Thử thách

- **Tiến độ dùng chung mọi độ khó.** Một hạt nhặt ở Cốt truyện vẫn tính khi chơi Thường. Vật nhiệm vụ không có thuộc tính `difficulties`: cùng chỗ ở cả ba độ khó.
- **Thưởng không nhân `rewardMul`:** GDD 11 mục 3.1 đã xếp module và Data Chip vào nhóm không nhân. Máu Gương Rối không nhân `enemyHp`, vì đây là vật như vật chắn, không phải kẻ địch.
- **Đoạn thử** giữ nguyên luật ở mọi độ khó. Kẻ địch trong hoặc gần đoạn thử dùng bản của độ khó đang chơi, nên ở Thử thách (mẫu đòn mới) đoạn thử khó hơn. Người chơi tự chọn, không có thưởng thêm.
- **Luật "không checkpoint trong vùng"** áp cho mọi checkpoint, kể cả checkpoint chỉ có ở Cốt truyện (`difficulties: "story"`).
- **Không có bản Thử thách của nhiệm vụ.** Data Chip "lần đầu phá đảo Thử thách" là nguồn khác (kinh tế mục 5).

### 2.8 Đối tượng bản đồ và quy tắc đặt

**Ba class Tiled mới** (thêm vào bảng ở `game/maps/README.md`; chỉ có trên bản đồ Tiled và mục `objects` của bản phác ASCII; không thêm ký hiệu chữ cho bản đồ ASCII):

| Class | Dạng | Thuộc tính | Ý nghĩa |
| --- | --- | --- | --- |
| `questItem` | điểm | `quest` (id nhiệm vụ), `item` (id trong `objective.items`) | Vật nhặt một lần (Hạt Giống). Nhãn hiển thị lấy từ `quests.json`, không lấy tên đối tượng |
| `questTarget` | điểm | `quest`, `item` | Vật cần phá (Gương Rối), hộp trúng 1 × 1 ô, không chặn đường. Dựng như bia tập bắn (`TrainingTarget`, không khiên, không dựng lại). Máu lấy từ `objective.hp` |
| `questZone` | chữ nhật | `quest`, `enter` (`left`, `right`, `top`; không `bottom`), `exit` (`left`, `right`, `top`, `bottom`; khác `enter`) | Đoạn thử. Luật hỏng lấy từ `objective.failOn`. Vạch vào, vạch đích vẽ ở hai mép |

**Quy tắc đặt chung** (thêm vào checklist duyệt màn M7; dòng có dấu * được test tự động kiểm):

- \* `quest` của mọi vật bằng `sideQuestId` của màn. Mỗi id trong `items` có đúng một vật, không có id lạ. Nhiệm vụ `reach` có đúng một `questZone`, `enter` không phải `bottom`.
- \* Không vật nào nằm trong đấu trường boss (từ cột cửa `gate` trở đi) hay trong vùng một `barrier`. Không checkpoint, phòng khóa hay cửa boss nằm trong `questZone`. Có checkpoint trước mép vào trong `zoneCheckpointMaxTiles` ô.
- Tới được và hoàn thành được bằng **bộ động tác gốc + Arc Cannon** (GDD chính 8.3, `16-Dac-ta-Stage2-4-nhap.md` mục 0.2). Không vật hay đoạn thử nào cần vũ khí Warden, kể cả Vine Lash và vũ khí của chính màn.
- Lệch khỏi đường chính ≤ 20 ô `[PLACEHOLDER]` và **nhìn thấy được từ đường chính**: Hạt Giống phát một cột sáng mờ cao ≥ 3 ô, Gương Rối sáng tím. Dùng đường dẫn mắt có sẵn (dây leo, ánh đèn) để dẫn tới. MVP chưa có bản đồ nhỏ nên điều này bắt buộc.
- Một chuyến thu thập hoặc hạ mục tiêu ≤ thời lượng màn + 2 phút `[PLACEHOLDER]`, không tính boss.

**Theo màn** (vị trí cụ thể chưa chốt; Stage 1 chốt sau cổng Prototype, Stage 2–4 theo `16-Dac-ta-Stage2-4-nhap.md` mục 3.8, 4.8, 5.8, dựng ở EP-17):

| Màn | Quy tắc đặt `[PLACEHOLDER]` |
| --- | --- |
| 1 Verdant (đoạn A–D, đặc tả Stage 1 mục 3) | 5 hạt: A 1, B 2, C 1, D 1. **A:** gờ cao của giếng bám tường. **B:** một hạt lấy được khi nhảy từ dây leo đu (rơi xuống là gai, không phải hố); một hạt ở nhánh cao gần phòng Memory Log 1 nhưng **ngoài** phòng (Memory Log vẫn là phần thưởng riêng). **C:** trong hoặc ngay sau phòng khóa, trên lối dẫn tới rễ khô của Két giáp, **không sau** rễ khô (Prism Beam chưa chắc đã có). **D:** trên đường chính trước CP4. Không hạt nào trên ô gai hay trong đấu trường Thorna. Chuyến nhiệm vụ ≤ 10 phút (A–D khoảng 8,5 phút + đường vòng ≤ 1,5 phút) |
| 2 Prism | 6 gương: **A 1, B 2, C 2, D 1**; không gương nào trong phòng mini-boss. Hình khác hẳn Gương Quang và gương câu đố (tím, nứt, không xoay được). Không nằm trên đường tia laser của câu đố. Tối đa 1 gương đặt ở chỗ Prism Beam bắn dễ hơn, nhưng Arc Cannon vẫn bắn tới |
| 3 Cryo | Một đoạn băng trượt có hố bên dưới (sàn trơn và băng vỡ), dài 30–40 ô, một lần thử 20–40 s. Mép vào có "kệ thùng thuốc" làm mốc, nhìn thấy từ checkpoint. Đoạn nằm trên đường chính, đầu đoạn C ngay sau CP2 (`16-…` mục 4.8): lần đầu người chơi đã đi qua, nhiệm vụ đòi đi lại một mạch sạch |
| 4 Cirrus | Một đoạn gió (gió đổi hướng), đầu đoạn C ngay sau CP2 (`16-…` mục 5.8). Bệ mây phải là **bục một chiều hoặc bệ di động**, không phải ô đặc. **Vào từ cạnh bên** (`enter: left` hoặc `right`), từ một gờ đặc nằm ngoài vùng; **ra ở mép trên** (`exit: top`). **Sàn đặc an toàn nằm trong vùng**, trải dưới cả đoạn, không hố: rơi xuống sàn là hỏng theo luật `ground`, không mất máu, không thành hủy. Không đặt gai trong vùng. Test bản đồ cấm vào từ mép dưới. Từ chỗ hỏng về vạch vào ≤ 10 s đi bộ |

## 3. Công thức, giá trị biên và dữ liệu

### 3.1 Công thức

```text
campaignBosses   = |bossesDefeated ∩ {stages[].boss}|                  (không tính boss xám)
boardOpen        = campaignBosses ≥ rules.boardUnlockBosses            (3)
available(q)     = boardOpen ∧ stages[q.stage].boss ∈ bossesDefeated ∧ state(q) ∈ {không có, available}
progress(q)      = |sideQuests[q].items ∩ q.objective.items|            (collect, destroy; 0 … required)
done(q)          = progress(q) ≥ q.objective.required                  (collect, destroy)
                 = qua mép đích khi lần thử đang chạy                  (reach)
spawn(vật v)     = state(q) = active ∧ v.item ∉ sideQuests[q].items
zoneCancel       = tâm Kai ra qua mép vào ∧ đang đứng                    (mục 2.4)
zoneFail         = (pit ∈ failOn ∧ rơi hố) ∨ (death ∈ failOn ∧ chết)
                 ∨ (ground ∈ failOn ∧ số bước liên tiếp đứng trên Tile.Solid ≥ groundGraceSteps)
                 ∨ (ra khỏi vùng không qua mép đích ∧ ¬zoneCancel)       (gồm nhảy, rơi ra qua mép vào)
mirrorHitsToBreak = ceil(hp / (damage × atk(L)/atk(1) × upgrade))      ; hp = 2
dataChips        = Σ reward.dataChips của nhiệm vụ đã claimed (+ nguồn khác khi làm)
loadCap          = moduleLoadPerSlot (2) × slots(cấp)                   (GDD 10 mục 2.2)
```

### 3.2 Giá trị biên

**Module và Data Chip theo mốc** (cấp theo `expBudget` GDD 10 mục 0; tải module theo GDD 10 mục 2.2):

| Mốc | Boss | Cấp | Nhiệm vụ mở | Module tối đa | Tải lắp hết / loadCap | Data Chip từ nhiệm vụ |
| --- | --- | --- | --- | --- | --- | --- |
| Hết Stage 1 hoặc sau boss 2 | 1–2 | 4–6 | 0 (Bảng khóa) | 0 | 0 / 6 | 0 |
| Sau boss 3 (Bảng vừa mở) | 3 | 8 | 3 | 3 | Theo thứ tự màn: {Magnet, Last Stand, Phase Step} = 7 > 6, **phải chọn**; {Magnet, Last Stand, Siphon} = 5; {Magnet, Phase Step, Siphon} = 5 | 0 → 3 |
| Cuối MVP (boss 4) | 4 | 10 | 4 | 4 | 8 / 8 (4 ô từ cấp 10): lắp đủ | 4 |
| Cuối cốt truyện (đối chiếu) | 8 | 30 | 8 | 8 | Chưa có tải của 4 module sau | 8 = `economy.dataChipSources.sideQuests` |

**Gương Rối, `hp = 2`** (sát thương theo phát Arc Cannon gốc; Prism đồng bộ cấp trong 2–9):

| Trường hợp | Hệ số công | Phát thường | Nạp vừa (×2), nạp đầy (×3), Vine Lash (×2) |
| --- | --- | --- | --- |
| Cấp hiệu dụng 2 (thấp nhất) | 1,02 | 2 phát | 1 phát |
| Cấp 7 (khuyến nghị cao) | 1,12 | 2 phát | 1 phát |
| Cấp hiệu dụng 9 + Arc Core tối đa (×1,25) | 1,45 | 2 phát | 1 phát |

Mọi mốc cho cùng kết quả "2 phát thường hoặc 1 phát nạp", nên nhiệm vụ không phụ thuộc build.

**Đoạn thử** (Kai chạy 5,5 ô/s):

| Đoạn | Độ dài | Chạy thẳng | Một lần thử dự kiến | Thử lại sau hỏng |
| --- | --- | --- | --- | --- |
| Cryo (ngắn nhất) | 30 ô | 5,5 s | khoảng 20 s | Hố: 0,3 s về checkpoint + ≤ 20 ô đi bộ (≤ 4 s) |
| Cryo (dài nhất) | 40 ô | 7,3 s | khoảng 40 s | Như trên |
| Cirrus | 30–40 ô hoặc 2–3 màn hình dọc | không áp dụng | 20–40 s | Chạm sàn: đi bộ về vạch ≤ 10 s, không mất máu |

`groundGraceSteps = 2` (1/30 s): đủ bỏ qua cú quệt góc ô trong một bước, nhưng đáp hẳn xuống sàn (≥ 2 bước) vẫn tính là chạm.

### 3.3 Dữ liệu `03-Data/quests.json` (đề xuất)

Nhiệm vụ 2–4 có khối `lines` cùng dạng với nhiệm vụ 1 (chữ ở mục 6.5), lược đi ở đây.

```json
{
  "_note": "Nhiệm vụ phụ Stage 1–4 (01-GDD/15-Nhiem-vu-phu.md). Kiểm tra ở game/src/core/quests-config.ts. Vị trí vật nằm trên bản đồ (Tiled: questItem, questTarget, questZone), không ở đây. Mọi số là [PLACEHOLDER].",
  "rules": {
    "boardUnlockBosses": 3,
    "groundGraceSteps": 2,
    "hintAfterFails": 5,
    "zoneCheckpointMaxTiles": 20
  },
  "board": {
    "intro": ["Được rồi, có việc cho cậu. Việc lặt vặt, nhưng tôi trả công."],
    "introCache": {
      "stage": "verdant_gardens",
      "ready": "Bắt đầu từ Verdant. Tiện thể lấy luôn cái Két giáp cậu bỏ lại.",
      "locked": "Bắt đầu từ Verdant. Cái Két giáp thì đợi có Prism Beam đã.",
      "taken": "Bắt đầu từ Verdant."
    },
    "firstChip": "Kèm một Data Chip. Thứ đó không ai bán, giữ cho kỹ.",
    "empty": "Hết việc rồi. Có gì mới tôi gọi."
  },
  "quests": [
    {
      "id": "sq_verdant_gardens",
      "stage": "verdant_gardens",
      "name": "Hạt giống thất lạc",
      "giver": "mira",
      "objective": {
        "type": "collect",
        "label": "Hạt Giống Phát Quang",
        "items": ["seed_1", "seed_2", "seed_3", "seed_4", "seed_5"],
        "required": 5
      },
      "reward": { "dataChips": 1, "module": "magnet_core", "exp": 0 },
      "lines": {
        "offer": [
          { "who": "mira", "text": "Vườn của Thorna còn giống cây chịu hạn. Năm hạt phát quang, rơi khắp Verdant." },
          { "who": "mira", "text": "Thứ đó mọc được ở nơi gần như không có nước. Mang về đây." },
          { "who": "kai", "text": "Năm hạt." }
        ],
        "enter": "Năm tín hiệu sinh học, yếu nhưng sáng. Cứ đi theo ánh sáng.",
        "done": "Đủ năm hạt. Mira sẽ giả vờ là không vui cho xem.",
        "claim": [
          { "who": "mira", "text": "Năm hạt, không hạt nào nứt. Góc kia sắp có màu xanh rồi." },
          { "who": "mira", "text": "Lắp Magnet Core vào. Nhìn cậu cúi nhặt từng viên Bit mà tôi mỏi cả lưng." }
        ]
      }
    },
    {
      "id": "sq_prism_institute",
      "stage": "prism_institute",
      "name": "Gương rối",
      "giver": "mira",
      "objective": {
        "type": "destroy",
        "label": "Gương Rối",
        "items": ["mirror_1", "mirror_2", "mirror_3", "mirror_4", "mirror_5", "mirror_6"],
        "required": 6,
        "hp": 2
      },
      "reward": { "dataChips": 1, "module": "last_stand", "exp": 0 }
    },
    {
      "id": "sq_cryo_vault",
      "stage": "cryo_vault",
      "name": "Băng vỡ",
      "giver": "mira",
      "objective": {
        "type": "reach",
        "label": "Thùng thuốc lạnh",
        "carry": "medicine_case",
        "failOn": ["pit", "death"]
      },
      "reward": { "dataChips": 1, "module": "phase_step", "exp": 0 }
    },
    {
      "id": "sq_cirrus_tower",
      "stage": "cirrus_tower",
      "name": "Gió mất hướng",
      "giver": "mira",
      "objective": {
        "type": "reach",
        "label": "Máy ghi gió",
        "carry": "wind_recorder",
        "failOn": ["pit", "death", "ground"]
      },
      "reward": { "dataChips": 1, "module": "energy_siphon", "exp": 0 }
    }
  ]
}
```

- `lines` của nhiệm vụ `reach` có thêm `start`, `fail`, `hint`. Câu `hint` viết cùng đặc tả Stage 3, 4, vì nó phụ thuộc cách trượt và cách gió của màn.
- Tên module hiển thị lấy từ `modules.json → name` (trường mới, thêm ở ST-08-09). Bảng không viết cứng tên.
- Bản tiếng Anh của thoại làm cùng bản địa hóa M10 (như `tutorial.json`, hiện chỉ có tiếng Việt).

### 3.4 Kiểm tra lúc nạp (`game/src/core/quests-config.ts`, thêm `quests` vào `REQUIRED_DATA_FILES`)

1. `rules`: `boardUnlockBosses` nguyên, 0 ≤ x ≤ số màn chiến dịch. `groundGraceSteps` nguyên 0–6. `hintAfterFails` nguyên ≥ 1. `zoneCheckpointMaxTiles` nguyên > 0. Không có trường thời gian hiện chữ: hộp chữ dùng thời gian đọc chung QB-72.
2. `id` không trùng. `stage` có trong `stages.json` và `stages[stage].sideQuestId === id`. Mỗi màn tối đa một nhiệm vụ. Màn có `index ≤ STAGES_WITH_QUEST_DATA` (hằng số mới = 4, tăng khi làm Alpha, giống `STAGES_WITH_ENEMY_DATA`) bắt buộc có nhiệm vụ.
3. `giver` có trong `ui.json → dialogue.speakers` (hiện chỉ có `nova`; thêm `mira` và `kai`). Mọi `who` có trong `dialogue.speakers` và thuộc `mira`, `kai`, `nova`.
4. `objective.type` ∈ `collect`, `destroy`, `reach`.
   - `collect` và `destroy`: `items` không rỗng, id không trùng trong toàn file, 1 ≤ `required` ≤ số `items`. `destroy` có `hp` > 0.
   - `reach`: `failOn` không rỗng, chỉ gồm `pit`, `death`, `ground`. Không có `items`.
5. `reward.module` có trong `modules.json`, hai nhiệm vụ không trùng module. `reward.dataChips` và `reward.exp` nguyên ≥ 0. Σ `dataChips` ≤ `economy.dataChipSources.sideQuests`.
6. Thoại không rỗng. Câu ở Bảng (`offer`, `claim`, `board.*`) ≤ `ui.dialogue.maxChars.vi` (140), mỗi lượt ≤ 3 câu. Câu trong màn (`enter`, `start`, `fail`, `hint`, `done`) ≤ `tutorial.rules.maxTextChars` (120).
7. `introCache.stage` có trong `stages.json`.

Sai thì game dừng ở màn tải kèm thông báo lỗi, test báo đỏ (như mọi file dữ liệu khác).

## 4. Giao tiếp hệ thống và bản lưu

- **Logic thuần mới** `game/src/logic/quest/` (không import Phaser, có test Vitest):
  - `questView(save, config)`: trạng thái suy ra và tiến độ, dùng cho Bảng, màn Chuẩn bị, menu, Kết quả.
  - `acceptQuest`, `markQuestSeen`, `recordQuestItem`, `completeQuestZone`, `claimQuest`: hàm thuần nhận bản lưu cũ, trả bản mới; không đổi gì thì trả lại đúng bản cũ (không ghi).
  - `normalizeQuests(save, config)`: một `SaveNormalizer` nữa trong chuỗi chạy sau `SaveManager.open` và sau khi nhập mã sao lưu.
  - `QuestZoneRun`: máy trạng thái mục 2.4, chạy trong `StageWorld`.
- **StageScene → StageWorld:** `WorldSetup.quest?: { id, type, pending: string[] (id chưa lấy), hp?, failOn?, carry? }`. Chỉ truyền khi nhiệm vụ của màn (`StageDef.campaign` → `sideQuestId`) đang `active`. Không có thì `StageWorld` bỏ qua mọi vật nhiệm vụ trên bản đồ.
- **StageWorld → sự kiện:**
  - `WorldEvents.questItem: string | undefined`: nhặt hoặc phá xong một vật.
  - `WorldEvents.questZone: 'start' | 'cancel' | 'fail' | 'done' | undefined`.
  - Nhặt vật dùng cùng thứ tự bước với bí mật (`updateSecrets`): Kai phải còn sống lúc kiểm tra.
- **StageSave:** `questItem` hoặc `questZone = 'done'` thì ghi ngay (như bí mật), kèm phần EXP và Core Bit chênh lệch như mọi lần ghi khác.
- **HUD:** `HudModel.quest?: { label, have, need, sectionLeft?, zone?: 'idle' | 'running' }`, dựng mỗi khung từ `StageWorld`. Không dùng event bus cho số liệu từng khung (quyết định M10).
- **Event bus:** chưa thêm sự kiện (`quest:accepted`, `quest:progress`, `quest:zoneFail`, `quest:done`, `quest:claimed`) cho tới khi có nơi nghe ở M16, cùng quy tắc với Xưởng.
- **TutorialManager:** không cần tín hiệu mới.
- **Hộp chữ** (QB-70…72, `17-Quy-tac-bien.md` mục 8): câu NOVA của nhiệm vụ là hộp "Câu NOVA nhiệm vụ phụ", xếp **dưới Hướng dẫn, trên Báo ngắn**. "Nhiệm vụ xong!" là một **Báo ngắn** (bậc thấp nhất, cùng Nhận vũ khí, Lên cấp). Hộp cao hơn hiện thì hộp thấp ẩn, rồi hiện lại nếu còn hiệu lực; chờ quá 10 s thì hủy (QB-71). Tự tắt theo thời gian đọc chung QB-72: max(3 s, số ký tự / 15), không đếm khi tạm dừng hay có hội thoại. Không dừng trận.
- **Radar Đầu Mk I** (ST-08-09): "vật phẩm được lưu chưa lấy" gồm cả vật của nhiệm vụ đang làm.

**Bản lưu kế tiếp** (theo `save-systems`: đóng số phiên bản, nâng bằng hàm thuần, kiểm tra lúc đọc, lưu dữ liệu chứ không lưu đối tượng). Số phiên bản theo thứ tự merge: hiện là bản 4, nhưng EP-16 có thể lấy số 5 trước, nên dưới đây gọi là bản N. Gộp cùng các trường MVP khác của đợt đó, như `weaknessKnown` (QB-83), để chỉ nâng một lần (ST-18-02).

```text
SaveData thêm:
  sideQuests          : Record<questId, { state: "available" | "active" | "done" | "claimed"; items: string[] }>
  inventory.dataChips : number            // số dư; Data Chip từ nhiệm vụ suy từ claimed
Không lưu: "khóa" và "chưa xem" (suy từ dữ liệu và boss đã hạ), lần thử đoạn đang dở, số lần hỏng.
Nâng N−1 → N trong parseSave: sideQuests = {}, dataChips = 0. Bản N gặp build cũ: chỉ đọc (cơ chế readOnly đã có).
```

- Nhóm tên `sideQuests` (không phải `quests`) để không trùng nhiệm vụ ngày của Live-ops (M13). Đây là nhóm "Nhiệm vụ và thành tựu" ở đặc tả Hub mục 8.
- **Id cố định ngay từ đầu:** vật nhiệm vụ lưu bằng id trong `quests.json` (`seed_3`), không lưu số thứ tự trên bản đồ. Checkpoint đang lưu theo chỉ số nên phải đổi khi chốt bản đồ (GDD 11 mục 2.4). Vật nhiệm vụ thì đổi vị trí trên bản đồ không làm hỏng bản lưu.
- **`normalizeQuests`:**
  - Bỏ id nhiệm vụ lạ. Bỏ id vật không có trong `objective.items`.
  - `active` mà đủ `required` thì thành `done`. `done`, `claimed` không bao giờ bị lùi, kể cả khi `required` tăng.
  - `claimed` mà thiếu module trong `owned` thì thêm lại module (không cộng lại Data Chip) và báo một lần.
  - `parseSave` lo phần hỏng: trạng thái lạ thì bỏ bản ghi đó, `dataChips` sai kiểu thì 0.

## 5. Trường hợp biên

| Tình huống | Xử lý |
| --- | --- |
| Nhặt hạt cuối đúng bước Kai chết | Theo thứ tự bước của bí mật: lúc kiểm tra còn sống thì tính, đã ghi thì giữ |
| Đạn nạp đầy xuyên trúng 2 gương; roi Vine Lash quét 2 gương | Mỗi gương nhận đòn một lần (luật `hitIds`), cả hai cùng tính |
| Nổ lan V2 chạm gương | Không tính: nổ lan chỉ đánh kẻ địch. Gương chỉ nhận đòn trực tiếp của đạn hoặc roi |
| Kai bị đẩy lùi xuống sàn trong đoạn gió | Hỏng (luật `ground`). Sàn an toàn nên không mất máu thêm |
| Quệt góc ô đặc trong 1 bước | Không hỏng (`groundGraceSteps = 2`) |
| Rơi vào vùng từ trên xuống, không qua mép vào | Không bắt đầu lần thử. Phải ra rồi vào lại qua vạch vào |
| Đang thử, đi bộ ngược ra qua vạch vào | Hủy: đồ trên lưng biến mất, không tính hỏng, không câu thoại |
| Đang thử, nhảy hoặc rơi ngược ra qua vạch vào (sắp rơi hố, sắp chạm sàn) | Hỏng như mọi lần hỏng: không lách luật bằng cách nhảy ra |
| Đoạn thử đặt `enter: bottom` | Test bản đồ báo lỗi: rơi ra mép dưới phải là hỏng, không thể là lối vào |
| R05 khi chưa có Prism Beam, hoặc đã lấy Két giáp Verdant | Câu thứ hai đổi theo `introCache` (`locked`, `taken`). Câu gốc của R05 sai với người đi thứ tự 1 → 3 → 4 |
| Bảng mở khi một màn trong MVP chưa hạ boss | Dòng khóa "Mở khi hạ boss <màn>" |
| Nhận thưởng mà ghi lỗi, hoặc bấm hai lần | `transact` hoàn tác, giữ `done`, báo lỗi. Lần bấm thứ hai không đổi gì |
| Bản lưu chỉ đọc (bản mới hơn) | Bảng chỉ xem, nút Nhận và Nhận thưởng mờ. Trong màn vẫn nhặt được trong lượt nhưng không ghi, như mọi lần ghi khác |
| Module thưởng đã có sẵn (dữ liệu đổi, nhập mã) | Chỉ cộng Data Chip và ghi `claimed` |
| Dữ liệu đổi module thưởng sau khi đã `claimed` | Không cấp module mới (`claimed` là cuối) |
| Phòng thử (4 phòng Stage 1 dùng `verdant_gardens`) | Không đặt vật nhiệm vụ: nếu không, người chơi làm xong nhiệm vụ thật trong phòng thử. Thử cơ chế bằng `?debug=1&quest=<id>`: nhiệm vụ coi như đang làm, StageSave bỏ qua sự kiện nhiệm vụ (không ghi) |
| Màn xám (cổng Prototype) | Không có nhiệm vụ, không đọc và không ghi gì về nhiệm vụ |
| Người chơi không bao giờ mở Bảng | Chấm báo ở menu. Không ép, không popup |
| Đổi độ khó giữa hai lượt | Tiến độ giữ nguyên (mục 2.7) |
| Hai mốc mở trong một lần về menu (ví dụ boss 3 xong rồi nhận ngay module đầu) | R05 chạy trước. D04 chạy khi nhận thưởng, nên không trùng lượt |

## 6. Giao diện, phản hồi và thoại

### 6.1 Trong màn

- **HUD:** bộ đếm nhỏ dưới dòng Cấp · EXP ở góc phải trên. Trên cảm ứng chừa 30 px cho nút II như phần còn lại của HUD.
  - Thu thập, hạ mục tiêu: biểu tượng (hạt, gương) + "2/5". Khi vào một đoạn (mốc `section`) còn vật chưa lấy thì thêm "· đoạn này còn 1" trong thời gian đọc chung QB-72. MVP chưa có bản đồ nhỏ nên dòng này thay cho chấm trên bản đồ.
  - Đoạn thử: biểu tượng (thùng, máy ghi) + "Sẵn sàng" hoặc "Đang mang" / "Đang ghi".
  - Bộ đếm chớp khi tăng. Xong thì hiện Báo ngắn "Nhiệm vụ xong! Nhận thưởng ở Bảng Nhiệm Vụ" (bậc thấp nhất của QB-70, thời gian đọc QB-72). Báo ngắn này hiện cả khi tắt hướng dẫn.
- **Câu NOVA** (hộp "Câu NOVA nhiệm vụ phụ", giữa Hướng dẫn và Báo ngắn, mục 4): `enter` (một lần mỗi lượt), `start` (lần thử đầu của lượt), `fail` (lần hỏng đầu), `hint` (từ lần hỏng thứ `hintAfterFails`, một lần), `done`. Tắt hướng dẫn thì không hiện, nhưng HUD và Báo ngắn xong vẫn hiện.
- **Không chỉ dùng màu** (GDD 11): Hạt Giống có cột sáng và hình hạt. Gương Rối có vết nứt. Vạch vào và vạch đích có hoa văn sọc khác nhau. Thùng vỡ có mảnh văng, máy ghi tắt có biểu tượng gạch chéo.

### 6.2 Bảng Nhiệm Vụ (bảng HTML, ADR-001)

- **Thanh trên:** Data Chip, Core Bit.
- **Ô thoại** của Mira (tên người nói đứng trước, ≤ 3 câu).
- **Danh sách** theo `index` của màn. Mỗi dòng: tên nhiệm vụ, tên màn, mục tiêu một dòng, tiến độ, phần thưởng (module + "1 Data Chip"), nút trạng thái:

| Trạng thái | Nút, chữ |
| --- | --- |
| Khóa | Biểu tượng khóa, "Mở khi hạ boss <màn>" |
| Chưa nhận | **Nhận**. Chọn dòng thì Mira đọc `offer` |
| Đang làm | "Đang làm · 2/5" hoặc "Đang làm · chưa qua" (mờ, không bấm) |
| Xong | **Nhận thưởng** (nổi bật). Bấm thì Mira đọc `claim` (+ `firstChip` ở lần đầu), rồi hiện "+ Magnet Core · + 1 Data Chip" |
| Đã nhận | "Đã nhận" kèm dấu tích; chọn dòng thì đọc lại `claim` |

- **Điều hướng:** InputService qua `gridMove`, chuột và chạm, giống Xưởng. Nút ≥ 48 dp, chữ ≥ 16 sp (QB-74), nút không giữ focus.
- Bảng là **nhật ký nhiệm vụ** của MVP. Mục "Nhiệm vụ" trong Phòng Hồ Sơ để Alpha (cùng Hub).

### 6.3 Menu, màn Chuẩn bị, menu tạm dừng, màn Kết quả, Dữ liệu lưu

- **Menu chính:** nút Bảng Nhiệm Vụ (phím N). Chấm báo khi có nhiệm vụ chưa xem hoặc đang chờ nhận thưởng.
- **Màn Chuẩn bị** (cột trái, một dòng): "Nhiệm vụ: Hạt giống thất lạc 2/5", hoặc "… xong, nhận thưởng ở Bảng". Màn chưa có nhiệm vụ đang làm thì không hiện gì.
- **Menu tạm dừng:** dòng dưới "<tên màn> · <độ khó>": "<tên nhiệm vụ> 2/5".
- **Màn Kết quả** (nếu tới): "Nhiệm vụ 4/5", hoặc "Nhiệm vụ xong: nhận thưởng ở Bảng Nhiệm Vụ". Số "Bí mật x/y" không tính vật nhiệm vụ.
- **Dữ liệu lưu** (menu S): số nhiệm vụ đã nhận thưởng / đã mở, Data Chip.

### 6.4 Hiệu ứng và âm thanh

Dùng ba bậc phản hồi của `ui.json → feedback`:

- **Bậc nhỏ** (không rung, không dừng hình): nhặt hạt, phá gương, bắt đầu lần thử, hỏng. Để không chen vào nhịp chiến đấu.
- **Không rung khi xong:** thông báo và tiếng chuông là đủ.
- **Âm thanh (M12):** chuông nhặt hạt cao dần theo số đã có; tiếng gương vỡ; tiếng "bíp" khi qua vạch vào; tiếng hỏng (thùng vỡ hoặc máy ghi tắt); nhạc ngắn khi xong.

### 6.5 Thoại

- **Quy tắc** (`08-Giong-nhan-vat.md`):
  - Mira xưng "tôi" gọi "cậu": cộc, thực dụng, quan tâm nói như chê, đặt biệt danh cho máy. NOVA đùa ngay sau tin xấu. Kai rất ngắn, lặp lại từ khóa.
  - Nhiệm vụ nhận được từ boss 3 trở đi, nghĩa là có thể trước hoặc sau midpoint (boss 4). Vì vậy thoại phải **đúng ở mọi số boss**: không dùng chữ "virus", không nhắc cuộc bỏ phiếu, không xác nhận lật mở nào. Chỉ gợi ở mức biến thể sớm và giữa của Warden.
  - Mira chưa nói về gia đình (tới sau boss 5). Chỉ có "khu ngoại ô", "chỗ cần nó" làm ẩn ý.
  - Câu ở Bảng ≤ 140 ký tự, câu trong màn ≤ 120 ký tự.

| Nhiệm vụ | Lúc | Câu |
| --- | --- | --- |
| Bảng | R05, lần đầu mở | Mira: "Được rồi, có việc cho cậu. Việc lặt vặt, nhưng tôi trả công." + một trong ba câu `introCache` (mục 3.3) |
| Bảng | Nhận thưởng lần đầu | Mira: "Kèm một Data Chip. Thứ đó không ai bán, giữ cho kỹ." |
| Bảng | Hết việc | Mira: "Hết việc rồi. Có gì mới tôi gọi." |
| 1 Hạt giống | Giao | Mira: "Vườn của Thorna còn giống cây chịu hạn. Năm hạt phát quang, rơi khắp Verdant." / Mira: "Thứ đó mọc được ở nơi gần như không có nước. Mang về đây." / Kai: "Năm hạt." |
| 1 | Trong màn | NOVA, vào màn: "Năm tín hiệu sinh học, yếu nhưng sáng. Cứ đi theo ánh sáng." / NOVA, xong: "Đủ năm hạt. Mira sẽ giả vờ là không vui cho xem." |
| 1 | Trao thưởng | Mira: "Năm hạt, không hạt nào nứt. Góc kia sắp có màu xanh rồi." / Mira: "Lắp Magnet Core vào. Nhìn cậu cúi nhặt từng viên Bit mà tôi mỏi cả lưng." |
| 2 Gương rối | Giao | Mira: "Bà Già, cái radio của tôi, lại rè. Không phải lỗi của nó." / Mira: "Sáu tấm gương ở Prism bị Eclipse vặn lệch, dội tín hiệu loạn cả lên. Đập hết." / Kai: "Sáu tấm." |
| 2 | Trong màn | NOVA, vào màn: "Sáu mặt gương lệch pha. Mỗi tấm dội lại một bản tin hơi khác nhau." / NOVA, xong: "Hết nhiễu. Từ giờ radio phát gì, ít nhất cũng chỉ còn một bản." |
| 2 | Trao thưởng | Mira: "Bà Già nói rõ từng chữ rồi. Toàn bản tin cũ, nhưng rõ." / Mira: "Last Stand đây. Lúc cậu sắp hỏng, nó vắt nốt chút sức. Đừng để phải dùng tới." |
| 3 Băng vỡ | Giao | Mira: "Kho của Cryo còn thuốc giữ lạnh. Một thùng thôi, đủ cho cả một khu ngoại ô." / Mira: "Đường ra là đoạn băng trượt. Rơi một lần là thùng vỡ, khỏi mang về." / Kai: "Không rơi. Hiểu." |
| 3 | Trong màn | NOVA, vào màn: "Kệ thuốc ở đầu đoạn băng. Tôi đánh dấu rồi." / NOVA, bắt đầu: "Thùng đã lên lưng. Nhiệt độ ổn. Ngã là tôi phải tính lại từ đầu đấy." / NOVA, hỏng: "Vỡ rồi. Kho còn thùng khác, quay lại vạch đầu." / NOVA, xong: "Thùng nguyên vẹn. Cryo giữ đồ kỹ thật, kỹ như sợ ai lấy mất." |
| 3 | Trao thưởng | Mira: "Thuốc còn lạnh. Tốt. Tôi biết chỗ cần nó." / Mira: "Phase Step cho cậu. Lướt xong để lại cái bóng, con nào đâm vào là đứng hình một nhịp." |
| 4 Gió mất hướng | Giao | Mira: "Gió quanh Cirrus đổi hướng loạn xạ. Tôi cần bản đồ gió của đoạn đó." / Mira: "Máy ghi chỉ chạy khi lơ lửng. Chạm sàn là nó xóa sạch. Đừng hỏi, tôi lắp vội." / Kai: "Không chạm sàn." |
| 4 | Trong màn | NOVA, vào màn: "Máy ghi của Mira đã nạp. Đoạn gió ở phía trước." / NOVA, bắt đầu: "Máy ghi đang chạy. Đứng bệ, bám tường thì được. Chạm sàn là hỏng." / NOVA, hỏng: "Chạm sàn. Máy ghi về 0. Quay lại vạch đầu." / NOVA, xong: "Ghi xong. Gió ở đây thổi theo nhịp... tôi đếm được trước cả máy đo." |
| 4 | Trao thưởng | Mira: "Có bản đồ gió rồi. Mây đi đâu, mưa rơi đâu, giờ tôi đoán được." / Mira: "Lắp Energy Siphon vào. Hạ con nào là hút lại chút năng lượng. Cậu xài nó như thể nó mọc trên cây." |

**Chức năng của từng nhịp** (lượt sửa "chức năng"):

- Hạt giống và "góc kia sắp có màu xanh": báo trước góc cây xanh của Hub sau boss 3 (đặc tả Hub mục 6), Mira lo chuyện nước.
- "Bà Già": radio của Arkon, báo trước bản tin Hale sau boss 5. "Mỗi tấm dội lại một bản tin hơi khác nhau" khớp động cơ của Lumen (biết bản tin bị sửa) mà không xác nhận gì.
- Thùng thuốc và "Tôi biết chỗ cần nó": ẩn ý về gia đình ở khu ngoại ô, trả lời sau boss 5. Thùng cũng là **lý do của luật "không rơi"**.
- Máy ghi gió: giải thích luật "không chạm sàn". Mira muốn biết mưa rơi đâu, nối với động cơ của Aeris (muốn làm mưa cho ngoại ô).
- Câu `done` của NOVA ở Cryo và Cirrus gieo cho lật mở lớp 3: NOVA hiểu Warden "quá rõ" so với một trợ lý mới.

## 7. Nút tinh chỉnh

- `quests.json → rules`: `boardUnlockBosses` (3), `groundGraceSteps` (2), `hintAfterFails` (5), `zoneCheckpointMaxTiles` (20). Thời gian hiện chữ không chỉnh riêng: theo QB-72.
- Theo nhiệm vụ: `objective.items` và `required` (thu 5 trong 6 hạt được bằng cách thêm id), `objective.hp` (Gương Rối), `objective.failOn`, `reward.dataChips`, `reward.module`, `reward.exp` (0), toàn bộ thoại.
- Trên bản đồ: vị trí vật, độ dài và mép của đoạn thử, checkpoint trước vạch vào.
- **Quy tắc chỉnh sau chơi thử:**
  - Người chơi không tìm ra vật cuối: tăng độ cao cột sáng, dời vật về gần đường chính, trước khi thêm công cụ chỉ đường.
  - Đoạn thử có > 30% người bỏ dở sau ≥ 5 lần hỏng: rút ngắn đoạn hoặc nới khe, trước khi tăng `groundGraceSteps`.
  - Module không ai lắp: ghi vào đánh giá tab Module (GDD 10 mục 2.2), không đổi nhiệm vụ.

## 8. Tiêu chí kiểm thử và giả thuyết

**Nghiệm thu (test logic, test bản đồ, chạy thử):**

- [ ] Bảng mở đúng khi đủ 3 boss chiến dịch (boss xám không tính). Nhiệm vụ chỉ `available` khi boss của màn đã hạ. Dòng khóa ghi đúng điều kiện.
- [ ] Vật và đoạn thử chỉ có trong màn khi nhiệm vụ `active`. Không có ở `available`, `done`, `claimed`, phòng thử, màn xám.
- [ ] Nhặt và phá ghi ngay. Chết, rơi hố, thoát, tải lại trang đều giữ. Không đếm trùng. Đủ `required` thì `done` ngay, không cần hạ boss.
- [ ] Đoạn thử: hỏng đúng ba luật (hố, chết, sàn đặc ≥ 2 bước); bục một chiều, bệ di động và bám tường không hỏng; đứng mà ra qua mép vào thì hủy, nhảy hoặc rơi ra qua mép vào thì hỏng; bị đưa ra ngoài thì hỏng; test bản đồ báo lỗi khi `enter: bottom`; qua mép đích thì xong và ghi ngay; lần thử dở không lưu.
- [ ] Nhận thưởng nguyên tử: module, Data Chip và `claimed` trong một lần ghi. Ghi lỗi thì hoàn tác. Bấm hai lần không nhận hai lần.
- [ ] Bản lưu hiện hành đọc lên bản lưu kế tiếp (bản N) với `sideQuests = {}`, `dataChips = 0`. Bản N gặp build cũ thì chỉ đọc. `normalizeQuests` xử lý đủ các trường hợp ở mục 4. Mã sao lưu giữ được nhiệm vụ.
- [ ] Kiểm tra lúc nạp mục 3.4 bắt đúng từng lỗi (mỗi luật một test). Test bản đồ (dòng có * ở mục 2.8) chạy cho mọi bản đồ có vật nhiệm vụ.
- [ ] Độ khó không đổi tiến độ, vị trí vật, luật đoạn thử, phần thưởng.
- [ ] Chạy thử (quy tắc nhìn tận mắt, ảnh lưu ở `04-Dev-Plan/qa/<mã Story>/`) trên PC và điện thoại: HUD, Báo ngắn xong, Bảng (bàn phím, tay cầm, chạm), màn Chuẩn bị, menu tạm dừng, Kết quả.
- [ ] Duyệt màn: mọi vật và đoạn thử tới được và hoàn thành được bằng bộ động tác gốc + Arc Cannon.
- [ ] Hộp chữ: câu NOVA của nhiệm vụ ẩn khi Hướng dẫn hiện và hiện lại sau đó; Báo ngắn "Nhiệm vụ xong!" chờ câu NOVA; thời gian hiện theo QB-72 (test mang mã QB-70, QB-72).

**Giả thuyết đo ở đợt thử MVP** (sự kiện M16; trước khi có M16 thì nhật ký chơi thử cục bộ) `[PLACEHOLDER]`:

| Giả thuyết | Đo bằng | Đạt khi |
| --- | --- | --- |
| Nhiệm vụ đủ hấp dẫn để quay lại | Tỷ lệ người tới boss 3 nhận ≥ 1 nhiệm vụ; xong ≥ 1 | ≥ 60% nhận; ≥ 40% xong |
| Không có bản đồ nhỏ vẫn tìm được | Thời gian từ vật thứ (n − 1) tới vật thứ n; tỷ lệ bỏ dở khi còn 1 vật | Trung vị ≤ 3 phút; ≤ 20% bỏ dở khi còn 1 vật |
| Đoạn thử khó vừa phải | Số lần thử tới khi xong; tỷ lệ bỏ dở sau ≥ 5 lần hỏng | Trung vị ≤ 4 lần; ≤ 30% bỏ dở (ngưỡng "hỏng" GDD 17) |
| Cảm ứng không thiệt | Số lần hỏng đoạn thử theo thiết bị | Cảm ứng không cao hơn bàn phím quá 40% |
| Chuyến nhiệm vụ không thành cày | Thời gian một chuyến thu thập, hạ mục tiêu | ≤ thời lượng màn + 2 phút |
| Phần thưởng được dùng | Module được lắp ít nhất một lần sau khi nhận | ≥ 70% module đã nhận |
| Giọng Mira nhận ra được | Thử giọng (giọng nhân vật mục 1): giấu tên người nói | ≥ 90% nhận ra Mira |

## 9. Thay đổi cần lan sang tài liệu khác (`/propagate-design-change`)

Tài liệu đã duyệt (bản 2, 14/11/2026). Bảng dưới theo bản 2; trưởng nhóm lan truyền, dòng đã áp có ghi rõ.

| Tài liệu | Thay đổi |
| --- | --- |
| `03-Dac-ta-Hub-Shop.md` | **Mục 2 và 5:** tab Module mở khi nhận module đầu tiên (thay "sau boss 3"). **Mục 6:** sau boss 3 "Mira giao nhiệm vụ của 3 màn đã qua" (thay "màn 1–3", vì thứ tự màn tự do). **Mục 7:** module gắn theo `index` của màn; nhận và nhận thưởng tại Bảng; bản MVP mở Bảng từ menu (phím N); MVP chưa có bản đồ nhỏ nên thay bằng cột sáng, bộ đếm theo đoạn và radar Đầu Mk I; Gương Rối khác kẻ địch Gương Quang; Băng vỡ thêm thùng thuốc, Gió mất hướng thêm máy ghi; trỏ tài liệu này. **Mục 8:** nhóm "Nhiệm vụ và thành tựu" là `sideQuests` ở bản lưu kế tiếp (số phiên bản theo thứ tự merge) |
| `02-Dac-ta-Prologue-Stage1.md` mục 3 | Dòng Hạt Giống: "chỉ xuất hiện khi nhiệm vụ đang làm; quy tắc đặt ở `15-Nhiem-vu-phu.md` mục 2.8" (thay "hiện trên bản đồ nhỏ sau khi nhận nhiệm vụ") |
| `07-Kich-ban-huong-dan.md` | **Mục 2:** "Sau boss 3: Bảng Nhiệm Vụ"; tab Module khi nhận module đầu tiên. **R05:** câu thứ hai theo ba biến thể `introCache`. **D04:** kích hoạt khi nhận thưởng nhiệm vụ đầu tiên. Thêm trỏ tới câu NOVA của nhiệm vụ ở mục 6.5 |
| `10-He-thong-RPG-Xuong.md` | **Mục 0, 2.2:** nguồn module là `quests.json` theo `index` của màn; tab Module mở khi nhận module đầu tiên. **Mục 2.3:** radar Đầu Mk I tính cả vật của nhiệm vụ đang làm |
| `01-GDD-chinh.md` | **6.1** (đã áp): EXP từ nhiệm vụ phụ là gián tiếp (kẻ địch trong lần chơi lại), `reward.exp = 0` ở MVP. **8.3** (đã áp, sửa lại thành bộ động tác gốc + Arc Cannon): luật duyệt màn "mục tiêu nhiệm vụ phụ tới được bằng bộ động tác gốc + Arc Cannon, như mọi vật phẩm được lưu" |
| `04-Can-bang-kinh-te.md` mục 5 | MVP có tối đa 4 Data Chip từ nhiệm vụ nhưng **chưa có chỗ tiêu** (skin Sử thi ở Alpha). Hiện số dư, câu Mira "giữ cho kỹ". Bản lưu kế tiếp có `inventory.dataChips` |
| `11-Do-kho.md` mục 3.1 | "Không nhân" thêm máu Gương Rối. Bỏ câu "Data Chip chưa có trong bản lưu" (bản lưu kế tiếp có). Tiến độ nhiệm vụ dùng chung mọi độ khó |
| `03-Data/` | `quests.json` mới (mục 3.3, không có `rules.toastSec`). `ui.json → dialogue.speakers` thêm `mira = "Mira"` và `kai = "Kai"` (hiện chỉ có `nova`). `modules.json → name` (cùng `cost` ở ST-08-09). `stages.json` không đổi (`sideQuestId` đã khớp) |
| `game/maps/README.md` | Ba class `questItem`, `questTarget`, `questZone` (mục 2.8) |
| `04-Dev-Plan/07-Ban-do-he-thong.md` | **Dòng "Nhiệm vụ phụ":** tài liệu "Đủ (trừ vị trí trên bản đồ)", trỏ tài liệu này. **Danh mục tên:** id nhiệm vụ `sq_*`, id vật `seed_1…5`, `mirror_1…6`, class Tiled, `sideQuests`, `inventory.dataChips` |
| `04-Dev-Plan/02-Module.md` | Ghi nhiệm vụ phụ vào M7 (vật trong màn), M10 (Bảng), M11 (bản lưu kế tiếp); phân biệt với "nhiệm vụ ngày" của M13 |
| `04-Dev-Plan/stories/ST-08-09-module-ket-giap.md` | Đổi chặn "Hệ thống nhiệm vụ phụ chưa có" thành "EP-18 (ST-18-01…06 không chờ cổng; phụ thuộc ở mục 10)". Tab Module mở khi có module đầu tiên |
| `16-Dac-ta-Stage2-4-nhap.md` | Ràng buộc ở mục 2.8: 6 Gương Rối của Prism (A 1, B 2, C 2, D 1, không trong phòng mini-boss); đoạn băng trượt của Cryo; đoạn gió của Cirrus vào từ cạnh bên, ra mép trên, bệ mây là bục một chiều hoặc bệ di động, sàn an toàn trong vùng; bộ động tác gốc + Arc Cannon. Câu `hint` của hai đoạn thử viết ở ST-18-08 |
| `game/CONTEXT.md` | Khi code: quyết định và trạng thái module |

## 10. Story đề xuất: EP-18 Nhiệm vụ phụ Stage 1–4

- **Quy ước:** như EP-08…10. Mỗi Story ≤ 2 ngày, một commit. Khi tách file Story, nhúng tóm tắt mục 2–4 liên quan vào phần `Bối cảnh & Thông số Kỹ thuật` (`rules/gdd-and-story-rules.md`). Story có hình ảnh phải có ảnh chạy thử.
- **Cổng Prototype:** ST-18-01…06 không phụ thuộc thông số cảm giác, không chờ cổng (thử trên phòng thử bằng `?debug=1&quest=<id>`), nhưng 01, 02, 05, 06 có phụ thuộc ở cột "Bị chặn bởi". ST-18-07 và 08 chờ cổng.

| Mã | Tên | Phụ thuộc | Cỡ | Bị chặn bởi |
| --- | --- | --- | --- | --- |
| ST-18-01 | Dữ liệu `quests.json`, `core/quests-config.ts` (mục 3.4), `ui.json` thêm `mira` và `kai`, `STAGES_WITH_QUEST_DATA` | | 1 ngày | Danh mục module đã parse: `modules.json` hiện chỉ giữ thô (`raw`, `game/src/core/game-config.ts:116`), nên chưa kiểm được `reward.module` |
| ST-18-02 | Bản lưu kế tiếp (`sideQuests`, `inventory.dataChips`), nâng N−1 → N, `normalizeQuests`, các hàm thuần của mục 4, `questView` | 01 | 1 ngày | Gộp với các trường MVP khác của cùng lần nâng, như `weaknessKnown` (QB-83); số phiên bản theo thứ tự merge (EP-16 có thể lấy số 5 trước) |
| ST-18-03 | Vật nhiệm vụ trong màn: class `questItem`, `questTarget` (`tiled.ts`, `StageLayout`), `WorldSetup.quest`, sinh vật theo trạng thái, Gương Rối bằng `TrainingTarget`, `WorldEvents.questItem`, StageSave ghi ngay, test bản đồ (dòng *) | 02 | 1,5 ngày | Không |
| ST-18-04 | Đoạn thử `questZone`: `QuestZoneRun` (mục 2.4), luật `pit`, `death`, `ground`, hủy (đứng ra qua mép vào) và hỏng (nhảy, rơi ra), ghi `done`, test bản đồ của đoạn thử (cấm `enter: bottom`) | 03 | 1,5 ngày | Không |
| ST-18-05 | Bảng Nhiệm Vụ (HTML, ADR-001) từ menu (phím N, nút, chấm báo): Nhận, Nhận thưởng qua `transact`, thoại Mira, R05 với `introCache` (R05 chỉ ở Story này, không ở EP-14), `tutorial.done` | 02 | 2 ngày | Menu và i18n của EP-14. D04 chờ tab Module (ST-08-09) |
| ST-18-06 | Hiển thị: `HudModel.quest`, bộ đếm theo đoạn, Báo ngắn "Nhiệm vụ xong!", câu NOVA ở hộp "Câu NOVA nhiệm vụ phụ", dòng ở màn Chuẩn bị, menu tạm dừng, Kết quả, Dữ liệu lưu | 03, 04 | 1 ngày | Hàng đợi hộp chữ QB-70…72 (EP-14) |
| ST-18-07 | Đặt 5 Hạt Giống lên bản đồ Stage 1 thật theo mục 2.8, duyệt màn, đo thời gian chuyến | 03, bản đồ Stage 1 | 0,5 ngày | **Cổng Prototype** (bản đồ Stage 1 chốt sau cổng) |
| ST-18-08 | Nhiệm vụ Stage 2–4 trên bản đồ: 6 Gương Rối, đoạn băng trượt, đoạn gió; câu `hint`; chỉnh số | 03, 04, bản đồ Stage 2–4 (ST-17-02…04 của `16-Dac-ta-Stage2-4-nhap.md`), boss Lumen, Cryo, Aeris | 1,5 ngày | **Cổng Prototype và EP-17** (sàn trơn, gió ở ST-15-08b chờ cổng; băng vỡ, bệ mây ở ST-15-08a) |
| ST-18-09 | QA: luồng trọn (nhận → làm → chết → thoát → vào lại → xong → nhận thưởng) bằng test mô phỏng; chạy thử PC và điện thoại; ảnh bằng chứng | tất cả | 0,5 ngày | Phần Stage 2–4 chờ ST-18-08 |

Thứ tự: 01 → 02 → 03 → 04 → 05 → 06, rồi 07 (sau cổng) và 08 (sau bản đồ Stage 2–4) → 09. Tổng khoảng 10,5 ngày, trong đó 8 ngày không chờ cổng (01…06, khi phụ thuộc ở cột "Bị chặn bởi" đã xong). Sau ST-18-02, ST-08-09 hết chặn vì "chưa có nguồn module". Module vẫn cần ST-08-09 để có tác dụng và được lắp.

**Hoãn khỏi MVP:** nhiệm vụ Stage 5–8 (Alpha, cùng nội dung các màn); loại "giải cứu"; mục Nhiệm vụ trong Phòng Hồ Sơ và Bảng đi bộ trong Hub (Alpha); chấm trên bản đồ nhỏ; tiếng Anh; sự kiện đo lường (M16).

## 11. Quyết định đã duyệt (14/11/2026, ủy quyền)

1. **Duyệt.** Module theo `index` của màn (Q1-a), ghi trong `quests.json`.
2. **Duyệt.** Vật nhiệm vụ chỉ xuất hiện khi đang làm (Q2-a).
3. **Duyệt.** Nhận và nhận thưởng tại Bảng Nhiệm Vụ mở từ menu (phím N) sau boss 3, trao thưởng bằng giao dịch nguyên tử; có Báo ngắn, chấm báo và dòng nhắc (Q3-a).
4. **Duyệt kèm luật hủy/hỏng mới.** Một cơ chế đoạn thử chung với luật hỏng trong dữ liệu. Thùng thuốc và máy ghi gió là lý do trong truyện, chỉ là hình vẽ (Q4-a). "Sàn" là ô đặc; bục một chiều, bệ di động, bám tường đều được. Ra qua mép vào khi đang đứng thì hủy, khi đang nhảy hoặc rơi thì hỏng; không có `enter: bottom` (mục 2.4, 2.8).
5. **Duyệt: không thưởng EXP ở MVP** (Q5-a). `reward.exp = 0`, giữ đường cấp theo `expBudget` (GDD 10 mục 0).
6. **Duyệt.** Tab Module mở khi nhận module đầu tiên; D04 chạy lúc nhận thưởng (Q6-b).
7. **Duyệt.** Tiến độ dùng chung mọi độ khó, thưởng không nhân hệ số, không có bản Thử thách của nhiệm vụ (mục 2.7).
8. **Duyệt kèm số bản lưu.** Bản lưu kế tiếp, số phiên bản theo thứ tự merge (EP-16 có thể lấy số 5 trước), gộp với `weaknessKnown` (QB-83); nhóm `sideQuests` và `inventory.dataChips`; vật lưu bằng id cố định (mục 4).

## 12. Kết quả duyệt

Duyệt độc lập 14/11/2026, người dùng giao toàn quyền nên trạng thái là "Approved (ủy quyền)".

| Người duyệt | Điểm | Đã sửa |
| --- | --- | --- |
| Creative Director | Nhảy hoặc rơi ngược ra qua mép vào thành "hủy", lách được luật hỏng; Cirrus `enter: bottom` cho rơi ra cũng thành hủy | Mục 2.4, 2.8, 3.1, 5, 8: đứng thì hủy, nhảy hoặc rơi thì hỏng; Cirrus vào từ cạnh bên, ra mép trên, sàn an toàn trong vùng; test bản đồ cấm `enter: bottom` |
| Creative Director | Luật vũ khí "Vine Lash và vũ khí của chính màn" lệch GDD chính 8.3 và `16-…` mục 0.2 | Mục 2.8, 8, 9: bộ động tác gốc + Arc Cannon |
| Creative Director | Gương Rối "mỗi đoạn ≥ 1, B–C ≥ 2" chưa đủ rõ, có thể rơi vào phòng mini-boss | Mục 2.8: A 1, B 2, C 2, D 1; không gương nào trong phòng mini-boss |
| Creative Director | Bảng 3.2 dùng cấp cận trên (4–7), lệch `expBudget` | Mục 3.2: cấp 4–6, chú thích theo `expBudget` GDD 10 mục 0 |
| Technical Director + Producer | Câu NOVA và thông báo xong chưa có chỗ trong thứ tự hộp chữ; `toastSec` trùng thời gian đọc QB-72 | Mục 2.1, 3.3, 3.4, 4, 6.1, 7, 8: xếp theo QB-70, "Nhiệm vụ xong!" là Báo ngắn, bỏ `rules.toastSec` |
| Technical Director + Producer | Số "bản lưu 5" có thể bị EP-16 lấy trước | Mục 4, 8, 9, 10, 11: bản lưu kế tiếp, số theo thứ tự merge |
| Technical Director + Producer | `ui.json → dialogue.speakers` chỉ có `nova`, thiếu cả `kai` | Mục 3.4, 9, 10 |
| Technical Director + Producer | "48 px" sai đơn vị; trỏ "đặc tả Stage 2–4 (chưa viết)"; ý sửa `legs_mk1` đã làm ở bản đồ hệ thống | Mục 6.2 (48 dp, QB-74); đầu file, 2.8, 9 trỏ `16-…`; bỏ ý `legs_mk1` |
| Technical Director + Producer | Story thiếu phụ thuộc ẩn | Mục 10: ST-18-01 cần danh mục module đã parse; ST-18-02 gộp `weaknessKnown`; ST-18-05 cần menu, i18n EP-14, R05 chỉ ở đây; ST-18-06 cần hàng đợi QB-70…72 |
