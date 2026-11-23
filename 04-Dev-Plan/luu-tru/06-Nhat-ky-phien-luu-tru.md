# Nhật ký phiên: lưu trữ

Các mục cũ chuyển từ `04-Dev-Plan/06-Nhat-ky-phien.md`, mới nhất ở trên. Không cần đọc đầu phiên; chỉ tra khi cần lịch sử một quyết định hoặc lỗi.

---

## 2026-11-22: Tích hợp nhánh phát triển vào main

- **Phạm vi:** Người dùng yêu cầu merge toàn bộ nhánh phát triển `ccr-9de01342-2046rb` đến `0d5d328` (ST-15-09). Mốc gốc của `main` trước khi tích hợp là `c458643`.
- **Nội dung:** Đo lường và báo cáo MVP, demo 2.5D, hộp chữ, luật biên và các Story Stage 2–4 đã xong. Giữ lộ trình chuyển từng phần của PR #9.
- **G1:** Tag `gate-r1` giữ mốc `eeb8ca1`. Liên kết Pages dựng theo `main`, nên khi ghi kết quả G1 phải ghi commit đã thử.
- **Kiểm tra:** 736 test, lint, build, docs-check và gate-flow đạt trên nhánh phát triển. CI của PR #12 phát hiện một bảng Markdown chưa qua Prettier trong `game/maps/README.md`. Đã chuẩn hóa bảng và chạy lại các kiểm tra.
- **Tiếp theo:** Thu kết quả chơi thử G1 và tiếp ST-15-10 (Lumen) theo kế hoạch.

## 2026-11-22: ST-15-09 Prism Sentinel và Gale Roc

- **Nhánh:** `ccr-9de01342-2046rb`, từ `f9a6d11`. G1 tiếp tục trên `main`.
- **Sentinel:** Tán Sắc và Lao Lăng Kính. Tia Phản Xạ ở pha hai dùng chung `LaserPath`; xoay gương trong lúc báo có thể trừ 10 máu và choáng 1,5 s. Tia Kép mở hai vạch, xung hai đảo góc sau 0,4 s.
- **Roc:** Bổ Nhào khóa hướng, đáp sàn hở 1 s, pha hai bổ nối báo 0,5 s và mưa tám lông chừa hai khe rộng hai ô. Thử thách có hai sóng đất. Vỗ Cánh bắn ba lông và phát trạng thái gió.
- **Phòng khóa:** hai mini-boss dùng `Boss` và `RoomBoss`. Dựng lại nếu chưa hạ, giữ cửa khi xong. Thưởng 110/40 và 270/60 gốc, nhân độ khó. Chặn bắn ngoài khung và chỉ dọn đạn của đúng mini-boss.
- **Quyết định:** Sentinel phát tia từ đầu dẫn phía trên gương để phản đòn bằng nhánh ngang. Tách số máu Kai khỏi tên mini-boss trên HUD sau khi xem ảnh.
- **Kiểm tra:** 736 test, lint, format, build, docs-check, gate-flow. Chromium PC và Pixel 7 ngang giả lập, 0 lỗi console. [Ảnh](qa/ST-15-09/README.md).
- **Còn lại:** Lực đẩy của Vỗ Cánh nối `WindZone` ở ST-15-08b. Phòng chiến dịch ở EP-17.
- **Tiếp theo:** ST-15-10 (Lumen) làm được trước G1.

## 2026-11-22: ST-15-16 Nano Cell và viên năng lượng

- **Nhánh:** `ccr-9de01342-2046rb`, từ `1771a0d`. G1 tiếp tục trên `main`.
- **Nano Cell:** Stage 1/3/5/7 cấp mỗi màn một ô. Đọc bí mật M7 cũ, ghi mới theo id màn chiến dịch. Vào lượt nạp đầy. Nhặt thêm chỉ nạp ô mới. Chết, rơi hố và qua checkpoint giữ số còn lại.
- **Hồi máu:** H/RT hồi 40% máu tối đa khi còn sống và thiếu máu, kể cả đang choáng. Khóa đầu vào 0,4 s, xóa đệm nhảy và nạp súng. Nano Cell Cap nâng dần lên 80% ở cấp 4.
- **Năng lượng:** 6% rơi ở lần đầu hạ địch trong lượt nếu còn thanh vũ khí boss chưa đầy. Khi cầm Arc Cannon, hồi +4 cho thanh thấp nhất. Kẹp theo thanh tối đa và giữ viên khi vũ khí đích đầy.
- **File chính:** `NanoCells`, `StageSave`, `WeaponLoadout`, `EnemyField`, HUD và `game/tests/nano-cell-energy.test.ts`.
- **Kiểm tra:** 723 test, lint, format, build (typecheck), docs-check và gate-flow đạt. Chromium PC/Pixel 7 ngang giả lập, 0 lỗi console. [Ảnh](qa/ST-15-16/README.md).
- **Còn lại:** Nút dùng Nano Cell trên cảm ứng thuộc EP-14. Đặt vật phẩm vào phòng bí mật tại các bản đồ chiến dịch.
- **Tiếp theo:** ST-15-09 (Prism Sentinel và Gale Roc) làm được trước G1.

## 2026-11-22: ST-15-15 báo đòn mini-boss và tầm hoạt động

- **Nhánh:** `ccr-9de01342-2046rb`, từ `93096ce`. G1 tiếp tục trên `main`.
- **QB-21:** kiểm ngưỡng 0,5 s của từng loại đòn mini-boss lúc nạp. Kiểm Bramble Golem và Frost Titan qua giậm, ném, lao, cả giậm nối Thử thách.
- **QB-23:** tầm tâm 12 ô ngang và 7 ô dọc. Cả hộp địch phải nằm trong khung camera đã vẽ, thu 1 ô mỗi cạnh, khi báo và tung đòn. Địch còn trong tầm vẫn tuần tra ngoài khung.
- **Quyết định:** ra khỏi vùng thì hủy đòn hoặc loạt chưa ra. Vào lại báo đủ trước khi tung đòn. Đạn và cú lao đã khởi phát đi tiếp theo cơ chế hiện có.
- **Kiểm tra:** 707 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Chromium PC/Pixel 7 giả lập xác nhận khóa báo ở mép, hủy giữa báo và Frost Titan đủ ngưỡng. [Ảnh](qa/ST-15-15/README.md).
- **Tiếp theo:** ST-15-16 (Nano Cell và vật phẩm năng lượng) làm được trước G1.

## 2026-11-22: ST-15-08a bục băng vỡ và bệ mây

- **Nhánh:** `ccr-9de01342-2046rb`, từ `d858814`. G1 tiếp tục trên `main`.
- **Đã làm:** Kai đặt chân thì nứt theo ba mốc 0 / 0,4 / 0,7 s. Băng vỡ sau 1 s, mây chìm sau 0,8 s ở 3 ô/s. Rời bục không đặt lại đồng hồ. Tính 4 s từ lúc vỡ hoặc bắt đầu chìm và đợi chỗ cũ trống.
- **Bệ trôi:** hai điểm Tiled, 1,5 ô/s, chở Kai theo cả hai trục và dùng Xuống + Nhảy. Bệ chìm chở Kai đến nền hoặc hết bản đồ. Hồi sinh ở checkpoint dựng lại bục và đưa bệ trôi về đầu.
- **Luật biên:** QB-40 loại bục vỡ và bệ di động khỏi kích hoạt checkpoint. Địch đất rơi khi băng dưới chân vỡ. Rơi khỏi bản đồ trả EXP một lần theo QB-20, mất Core Bit.
- **File chính:** `CrumblePlatform`, `CloudDrift`, `StageWorld`, `EnemyField`, bộ nạp Tiled và 14 bài trong `game/tests/platforms.test.ts`.
- **Kiểm tra:** 683 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Phòng **Bục băng và mây** chơi qua bằng bàn phím và Pixel 7 giả lập, 0 lỗi console. [Ảnh](qa/ST-15-08a/README.md).
- **Tiếp theo:** ST-15-15/16 làm được trước G1. Sàn trơn và gió thuộc ST-15-08b, Nứt Bục của Cryo ở ST-15-11, bố trí bệ chiến dịch ở EP-17.

## 2026-11-22: ST-15-06 bốn kẻ địch Viện Quang và Kho Lạnh

- **Nhánh:** `ccr-9de01342-2046rb`, từ `35fca2b`. G1 tiếp tục trên `main`.
- **Đã làm:** Gương Quang dội trần khi bị che và vẽ hướng ngắm. Song Tia thêm viên thẳng nếu có đường dội. Người Tuyết Máy dùng 0 khiên, dừng ở mép và thêm hai cú Trượt Dội ở Thử thách.
- **Địch Kho Lạnh:** Tháp Băng dùng góc ném 50°, có hai điểm rơi và nhắm lại ở loạt hai. Frost Titan giậm, ném ba tảng, húc và miễn vô hiệu. Tảng Vỡ sinh hai sóng khi đáp sàn hoặc bục một chiều. Hạ Titan mở phòng khóa và trả 185 EXP/50 Core Bit theo dữ liệu gốc.
- **Quyết định:** dùng đường va chạm quét cho vạch dội và bóng đổ. Sửa vị trí phóng bom trong hành vi `golem` để bom không chạm sàn ngay lúc bắn. Mở hai chế độ phòng thử ở menu thường.
- **Kiểm tra:** 669 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Chromium PC Thường và Pixel 7 giả lập Thử thách, 0 lỗi console. [Ảnh](qa/ST-15-06/README.md).
- **Tiếp theo:** ST-15-08a hoặc ST-15-15/16. Đặt địch trong bản đồ chiến dịch ở EP-17. QB-21 và QB-23 thống nhất ở ST-15-15.

## 2026-11-21: ST-15-05 Gale Cutter và sương lạnh Két Tay Mk I

- **Nhánh:** `ccr-9de01342-2046rb`, từ `2ed9412`. G1 tiếp tục trên `main`.
- **Đã làm:** Gale Cutter bay ngang tối đa 6 ô, quay đầu ở vật chắn hoặc hết tầm. Chiều về hướng tới Kai và xuyên địa hình. Mỗi mục tiêu trúng tối đa một lần mỗi chiều. Mỗi lượt ném tốn 4 năng lượng, đổi vũ khí vẫn giữ lưỡi.
- **Q4:** hủy tối đa hai viên `enemyShot` hoặc `bomb` có nguồn địch thường, tính cả hai chiều và xử lý trước sát thương lên Kai. Khiên còn chặn sát thương. Lưỡi tan khi chạm boss bất tử đổi pha (QB-31).
- **Sương lạnh:** dùng `Barrier`, giữ lối mở qua hồi sinh. Phòng thử mượn Gale Cutter, có tháp pháo và Két Tay Mk I. Dùng phím V để mở phòng, tránh phát bắn ngoài ý muốn từ phím J.
- **File chính:** `WeaponLoadout`, `ProjectilePool`, va chạm vũ khí, bản đồ Tiled `gale-test.json` và 11 bài trong `game/tests/gale-cutter.test.ts`.
- **Kiểm tra:** 653 test, build (typecheck), lint, format, docs-check và gate-flow đạt. Bàn phím và Pixel 7 giả lập hủy đạn, phá sương, nhặt Két, 0 lỗi console. [Ảnh](qa/ST-15-05/README.md).
- **Tiếp theo:** ST-15-06 hoặc ST-15-15/16 trước G1. Aeris chính thức cấp vũ khí ở ST-15-12, đặt Két ở kho hạt giống trong ST-17-03.

## 2026-11-21: ST-15-01c dữ liệu Gale Cutter và cơ chế Stage 4

- **Nhánh:** `ccr-9de01342-2046rb`, từ `654c31a`. Bản thử G1 tiếp tục trên `main`.
- **Đã làm:** Gale Cutter có dữ liệu `boomerang`, tốn 4/28 năng lượng, trúng cả đi và về với ngân sách 14 sát thương/thanh. Mỗi lần ném hủy tối đa 2 viên thuộc `cancelKinds`. Loadout cấp vũ khí từ ST-15-05.
- **Dữ liệu cơ chế:** `wind` gồm ngoại lệ QB-07 và kiểm thời lượng báo trước, `cloud` bắt buộc một chiều, `crumble.sink` dùng hai mốc nứt của băng vỡ.
- **File chính:** `03-Data/{weapons,stages}.json`, bộ kiểm cấu hình, `WeaponLoadout` và `game/tests/stage-data.test.ts`.
- **Quyết định:** dữ liệu Chim Cắt Gió và Cối Xoáy đi cùng ST-15-07, Gale Roc cùng ST-15-09, Aeris cùng ST-15-12. Đo khắc chế Terra khi có hành vi ở Alpha.
- **Kiểm tra:** 642 test, build (typecheck), lint, format, docs-check và gate-flow (PC, Pixel 7 giả lập, gộp nhật ký) đạt.
- **Tiếp theo:** ST-15-05 ném và đón Gale Cutter, hủy đạn theo Q4 và mở sương lạnh ở Két Tay Mk I. Bệ mây ở ST-15-08a, gió ở ST-15-08b sau G1.

## 2026-11-21: ST-15-04 Frost Shard, vô hiệu QB-19 và dòng làm mát

- **Nhánh:** `ccr-9de01342-2046rb`, từ `850e7b2`. Bản thử G1 trên `main`.
- **Đã làm:** cấp Frost Shard, đạn theo dữ liệu. `Enemy.disable` lấy thời gian còn lại hoặc thời gian mới lớn hơn (QB-19); vô hiệu dừng nhịp AI và sát thương chạm thân. Khiên Lính Kén vẫn chặn mặt trước. Boss và mini-boss miễn vô hiệu.
- **Dòng làm mát:** class Tiled `coolant` chuyển thành ba bậc một chiều. Dòng lỏng vô hại, giữ viên Frost Shard lúc đông. Bậc tồn tại qua hồi sinh, đặt lại khi chơi lại.
- **Phòng thử:** phím I hoặc chọn từ menu, mượn Frost Shard, tiến trình ở trong lượt. PC leo tới gờ thật. Ảnh PC và Pixel 7 giả lập ở `qa/ST-15-04/`.
- **File chính:** `WeaponLoadout`, `Enemy`, `hits.ts`, `CoolantFlow`, map và renderer; 16 bài trong `game/tests/frost-shard.test.ts`.
- **Kiểm tra:** 620 test, build (typecheck), lint, format, docs-check, gate-flow. Luồng phòng băng trên Chromium PC và Pixel 7 giả lập, 0 lỗi console.
- **Tiếp theo:** Phase Step gọi API vô hiệu ở ST-08-09. Cryo cấp vũ khí ở ST-15-11, đặt Két Thân Mk I ở ST-17-02.

## 2026-11-21: ST-15-01b dữ liệu Frost Shard và cơ chế băng

- **Nhánh:** `ccr-9de01342-2046rb`, từ `49394f1`. G1 tiếp tục trên `main`.
- **Đã làm:** Frost Shard có cấu hình `shard` (10 ô/s, tầm 10 ô, đạn 8 × 6 px, ×2 sát thương, hồi 0,4 s, đóng băng 2 s, tốn 4/28). Bộ kiểm cân bằng xác nhận 14 sát thương/thanh, 12,5/s khi khắc chế Aeris.
- **Dữ liệu cơ chế:** nạp `ice`, `crumble` (hai mốc nứt tăng dần và trước khi vỡ) và `coolant.frozenSteps` (3 bậc, số nguyên dương). Bộ kiểm báo đường dẫn trường sai.
- **File chính:** `03-Data/{weapons,stages}.json`, bộ kiểm cấu hình, `WeaponLoadout` và `game/tests/stage-data.test.ts`.
- **Quyết định:** cấp Frost Shard từ ST-15-04. Dữ liệu Người Tuyết Máy, Tháp Băng, Frost Titan đi cùng ST-15-06; dữ liệu Cryo đi cùng ST-15-11, sau khi phần thưởng Frost Shard hoạt động.
- **Kiểm tra:** 604 test, lint, format, build (typecheck), docs-check và gate-flow (PC, Pixel 7 giả lập, gộp nhật ký) đạt.
- **Tiếp theo:** ST-15-04 triển khai đạn Frost Shard, trạng thái vô hiệu QB-19 và dòng làm mát.

## 2026-11-21: ST-15-03 Prism Beam

- **Nhánh:** `ccr-9de01342-2046rb`, từ `995085b`. Bản chơi thử G1 ở `main`.
- **Đã làm:** Prism Beam dùng lại `LaserPath`; cắt tia theo khiên ở QB-16/18, xuyên mục tiêu đúng một lần, đốt rễ khô và dội vào cảm biến. Đo lường ghi sát thương boss thật và giữ luật QB-14/31.
- **File chính:** `WeaponLoadout`, `beam-hits.ts`, `StageWorld`, `StageOptics`, `Barrier`, renderer và `tests/prism-beam.test.ts`.
- **Quyết định:** một xung Prism Beam đủ mở cảm biến; nguồn môi trường vẫn dùng `sensor.holdSec`. Phòng thử laser cho mượn vũ khí trong lượt.
- **Kiểm tra:** 578 test; typecheck, lint, format, build, docs-check và gate-flow đạt. Chromium trên PC và Pixel 7 giả lập: mở cửa, tốn 3 năng lượng, 0 lỗi console; đốt rễ phòng M7 trên PC. Ảnh ở `qa/ST-15-03/`.
- **Còn dở:** nhận Prism Beam từ Lumen ở ST-15-10. Việc tiếp theo có thể là ST-15-01b, rồi ST-15-04 (Frost Shard, vô hiệu, dòng làm mát), hoặc ST-15-15/16.

## 2026-11-21: ST-15-02 laser, gương và cảm biến Stage 2

- **Nhánh:** `ccr-9de01342-2046rb`, từ `83f6d6b`. Giữ bản thử G1 trên `main`.
- **Đã làm:** đường tia phản xạ dùng chung, nguồn liên tục và theo nhịp, Arc Cannon nạp vừa/đầy xoay gương, cảm biến mở cửa trong lượt, hồi sinh đặt lại gương. Phòng thử mở từ menu bằng nút Phòng thử laser hoặc phím O.
- **File chính:** logic đường tia, `StageOptics`, `StageWorld`, Tiled, renderer và phòng thử. Cập nhật lược đồ nguồn sát thương `laser` và tài liệu EP-15.
- **Quyết định:** nguồn lệch pha bắt đầu ở lần báo trước đầy đủ kế tiếp. Bố trí bục bắn, gương và tia phản xạ ở phòng thử để có lối đi bên dưới sau khi mở cửa.
- **Kiểm tra:** 566 test, typecheck, lint, format, build, docs-check và gate-flow. Chạy thử PC và Pixel 7 giả lập, 0 lỗi console. Ảnh trong `qa/ST-15-02/`.
- **Tiếp theo:** ST-15-03 (Prism Beam). Bố cục và kiểm đường chính của Stage 2 ở ST-17-02 sau G1.

## 2026-11-15: EP-15 ST-15-01a dữ liệu Stage 2 dùng chung và khung kiểm tra

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit ST-15-01a.
- **Mục tiêu:** người dùng bảo làm tiếp: ST-15-01a (GDD 16 mục 2.1–2.3, 3.3, 3.7).
- **Đã làm:** `stages.json` `expBudget` 332/660/1.101/1.602, `enemyRewardMul` (nối vào thưởng kẻ địch, mini-boss không nhân, một lần làm tròn), `mechanics.minTelegraphSec/laser/mirror/sensor`; Prism Beam (`beam`, chưa cấp được); `weapons.json → balance`; `bosses.json → rules.maxAttackDamage`. Kiểm lúc nạp: ngân sách năng lượng, sức mạnh khắc chế, trần đòn boss theo màn, laser không chết một đòn, EXP cộng dồn theo cấp khuyến nghị. `logic/stage/stage-exp.ts` (Σ EXP ± 5%).
- **File chính:** `03-Data/{stages,weapons,bosses}.json`, `game/src/core/{game-config,stage-mechanics-config,weapons-config,boss-config}.ts`, `game/src/logic/stage/stage-exp.ts`, `game/src/logic/world/{enemy-field,stage-world}.ts`, `game/src/logic/combat/loadout.ts`, `game/tests/stage-data.test.ts` (14 test), GDD 16 mục 10, `stories/EP-15-stage-2-4.md`.
- **Quyết định:** dữ liệu Gương Quang, Tháp Laser, Prism Sentinel, Lumen dời sang Story làm hành vi (06, 07, 09, 10) vì bộ kiểm từ chối hành vi chưa có; ST-15-10 thêm phụ thuộc 03 (Prism Beam phải cấp được trước khi thắng Lumen).
- **Duyệt:** Technical Director + Producer "kèm sửa", 8 điểm đã áp (mini-boss không nhân, hệ số theo `def.campaign`, bắt buộc với màn có đặc tả, ≥ 1, báo trước từ dữ liệu…).
- **Lỗi tìm thấy / đã sửa:** bản nháp nhân cả mini-boss (Frost Titan sẽ cho 555 EXP thay vì 185).
- **Kiểm tra:** 541 test, typecheck, lint, format, build, docs-check đạt; `gate-flow` đạt.
- **Còn dở:** không.
- **Tiếp theo:** em: ST-15-02 (LaserPath, LaserEmitter, Mirror, LightSensor). Người dùng (khi rảnh): chơi thử G1 trên `gate-r1`, ADR-002, Vercel.

## 2026-11-15: EP-15 ST-15-14 boss an toàn (QB-14 chống khóa choáng, QB-31 kẹp pha)

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); `a4cc397` (bản đầu) + commit chốt sau duyệt.
- **Mục tiêu:** mục 4 của `00-Bat-dau.md`; người dùng bảo cứ làm tiếp, việc của người dùng (G1, ADR-002, Vercel) để sau.
- **Đã làm:** `bosses.json → rules {weakStunCooldownSec 1.5, phaseShiftSec 0.6}`. Boss: choáng điểm yếu chỉ bắt đầu khi không đang choáng và hết hồi choáng; một đòn rơi cách pha đang chơi ≥ 2 (chết tính là một pha) thì kẹp ở ngưỡng, bất tử đứng yên 0,6 s (vẽ trắng), bỏ đòn dở; StageWorld xóa đạn boss cùng bước; đạn Kai lúc bất tử phát `bossImmune`. Đo lường `dmg` = máu thật bị trừ.
- **File chính:** `game/src/logic/boss/boss.ts`, `game/src/logic/world/{hits,stage-world,world-types}.ts`, `game/src/core/boss-config.ts`, `03-Data/bosses.json`, `game/tests/boss-safety.test.ts` (16 test), `stories/EP-15-stage-2-4.md` (mới), GDD 13, 16, 17, `05-Cong-Prototype.md`, `qa/ST-15-14/`.
- **Duyệt:** Technical Director "kèm sửa", 8 điểm đã áp: không kéo dài choáng sau Hoa Nở; chết là một pha (pha áp chót cũng kẹp); ghi luật hai đòn cùng bước; `bossImmune` thay `blocked` (S06 đếm `blocked` là thất bại); đo lường; ghi khác biệt với `gate-r1`; thêm test biên.
- **Lỗi tìm thấy / đã sửa:** trước đây trúng điểm yếu lúc choáng làm mới choáng, nên Vine Lash (hồi 0,35 s) khóa choáng boss xám mãi; trúng điểm yếu lúc choáng sau Hoa Nở kéo dài khoảng hở 0,5 s.
- **Kiểm tra:** 527 test, typecheck, lint, format, build, docs-check đạt; chạy thử Chromium (kẹp 60%, pha 2, trắng 0,6 s, 0 lỗi console); `gate-flow` đạt.
- **Còn dở:** hit-stop, rung ở mọi phát điểm yếu lúc hồi choáng (quyết ở mô phỏng ST-15-10…12).
- **Tiếp theo:** em: ST-15-01a (dữ liệu Stage 2, khung kiểm tra chung), rồi ST-15-02. Người dùng (khi rảnh): chơi thử G1 trên bản `gate-r1`, chọn ADR-002, trả lời Vercel.

## 2026-11-15: EP-14 ST-14-08 hộp chữ thuần (QB-70…72) và ST-QB-01 test khóa luật biên

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit ST-14-08 + ST-QB-01.
- **Mục tiêu:** mục 3 của `00-Bat-dau.md`: sửa QB-72 (tạm dừng vẫn làm gợi ý chết hết giờ), QB-70 (bị che thì mất hẳn), test khóa các luật đã code.
- **Đã làm:** `logic/hud/text-boxes.ts` (`BOX_ORDER`, `topBox`, `readingSec` NFC, `TimedBox` đồng hồ trận frozen/covered/free); Scene đếm gợi ý mỗi bước trận chạy, ẩn khi tạm dừng rồi hiện lại, hủy khi hạ boss, checkpoint, vào đấu trường, tắt hướng dẫn; đo lường `difficulty_hint` lúc câu thật sự hiện. `ui.json → reading {15, 3, 10}` thay `difficultyHint.charsPerSecRead`. Agent viết `tests/qb-rules.test.ts` (18 test: QB-02, 11, 12, 13, 22, 24, 33, 41, 61, 121, 132); tách `logic/stage/camera-bounds.ts`, nhãn tab Xưởng vào `workshop-model.ts`.
- **File chính:** `game/src/logic/hud/text-boxes.ts`, `game/src/scenes/stage-scene.ts`, `game/src/core/ui-config.ts`, `game/src/logic/world/{stage-world,enemy-field,stage-mechanics}.ts`, `game/tests/{text-boxes,qb-rules}.test.ts`, `03-Data/ui.json`, GDD 07, 11, 14, 17, `stories/EP-14-giao-dien-mvp.md` (mới), `stories/QB-khoa-luat.md` (mới), `qa/ST-14-08/`, `qa/QB-khoa-luat/`.
- **Duyệt:** Technical Director duyệt ST-14-08 "kèm sửa", 7 điểm bắt buộc đã áp (ẩn khi tạm dừng; hội thoại không tính là chờ; hủy khi vào đấu trường, khi tắt hướng dẫn; đếm từng bước; GDD 14 tự tiến thoại dùng `reading`, không dùng `maxWaitSec`; GDD 11).
- **Lỗi tìm thấy / đã sửa:** QB-24: hạ Golem xong mà Kai chết thì Golem dựng lại đầy máu trong phòng đã mở; sửa: kẻ địch của phòng khóa đã xong không dựng lại (luật mở rộng ghi ở QB-24). Chữ tab Module "khi có" → "khi nhận module đầu tiên" (QB-87).
- **Kiểm tra:** 511 test (thêm 29), typecheck, lint, format, build, docs-check đạt; chạy thử Chromium ST-14-08 đạt (tạm dừng 9 s, thời gian còn lại đứng yên, 0 lỗi console); `npm run gate-flow` đạt (máy tính, Pixel 7).
- **Còn dở:** Báo ngắn, câu NOVA nhiệm vụ (ST-14-09); bước hướng dẫn chỉ có lời vẫn đếm giờ khi bị gợi ý chết che; QB-33 đấu lại có thể bắt đầu lúc màn Kết quả mở (hiếm); QB-13 riêng từng vũ khí chờ vũ khí boss thứ hai.
- **Tiếp theo:** người dùng: chơi thử G1, chọn ADR-002. Em: EP-15 ST-15-14 (QB-14, QB-31), rồi ST-15-01a, ST-15-02 (mục 4 của `00-Bat-dau.md`).

## 2026-11-14: EP-13 ST-13-05b chỉ số phụ của báo cáo cổng MVP

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit ST-13-05b.
- **Mục tiêu:** làm tiếp kế hoạch: mục 7 của báo cáo (GDD 13 mục 6.4), đóng ST-13-05.
- **Đã làm:** `logic/telemetry/report-extra.ts`: K1–K6 (kinh tế), DK1–DK4 (độ khó, kèm cờ chỉnh), T1–T4 (hướng dẫn), X1–X5 (kỹ thuật, p75 nội suy), F1 theo thiết bị, S1 (tự bắn, hỗ trợ ngắm, giảm tốc, mù màu, cỡ chữ). `core/mvp-report.ts` tính số liệu game từ dữ liệu (giá rẻ nhất lúc Quầy mở 200, tổng giá Upgrade 14.593, thu theo màn, `rewardMul`); mục tiêu ở `telemetry.json → report.targets`. Bộ mẫu thêm sự kiện Quầy, độ khó, hướng dẫn, lỗi, cài đặt.
- **File chính:** `game/src/logic/telemetry/report-extra.ts`, `report.ts`, `game/src/core/mvp-report.ts`, `game/tests/mvp-{sample,report}.ts`, `03-Data/telemetry.json`, `01-GDD/13-Do-luong-MVP.md` (cách tính mục 6.4), `stories/EP-13-do-luong.md`, `qa/ST-13-05/`.
- **Quyết định:** chỉ số phụ không chặn cổng (Đúng mục tiêu, Lệch, Theo dõi, Thiếu dữ liệu); số liệu kinh tế tính từ dữ liệu game, không chép vào `telemetry.json`; tùy chọn dạng danh sách ghi `settings_change.value` bằng chỉ số (0 = mặc định) vì `value` chỉ nhận số hoặc boolean.
- **Lỗi tìm thấy / đã sửa:** đáp án DK2 em đếm tay sai (52 lượt Thường, đúng là 51 vì P06 chơi Stage 3 ở Cốt truyện); báo cáo đúng.
- **Kiểm tra:** 482 test (thêm 6), typecheck, lint, format, build, docs-check đạt; chạy `npm run mvp-report` thật, báo cáo mẫu cập nhật ở `qa/ST-13-05/`.
- **Còn dở:** X3 chờ `msToControl` (ST-13-03); id đổi cỡ nút, tay thuận chờ EP-14.
- **Tiếp theo:** người dùng: chơi thử G1, chọn ADR-002. Em: test khóa luật QB đã code nhưng chưa test, sửa QB-72, QB-70 (mục 3 của `00-Bat-dau.md`).

## 2026-11-14: EP-13 ST-13-05a báo cáo cổng MVP (MV1–MV7, H1–H4)

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit ST-13-05a.
- **Mục tiêu:** làm tiếp kế hoạch: bộ báo cáo cổng MVP (`npm run mvp-report`), có bộ dữ liệu mẫu có đáp án.
- **Đã làm:** `logic/telemetry/report-data.ts` (đọc gói xuất, bảng tải, mảng lô; kiểm, khử trùng QB-152; lọc đợt, build, cửa sổ đo; loại staff, phiên ngắn, ghi rác; dựng lượt qua phiên QB-154), `report.ts` (MV1–MV7 kèm Wilson, H1–H4 ba trạng thái, phễu, theo màn, thiết bị, F1, việc đề xuất theo 7.4, Markdown), `core/mvp-report.ts`, `scripts/mvp-report.mjs` (Vite `runnerImport`). `boss_start`/`boss_end` ghi `weaknessOwned` (MV6 trước đây luôn n = 0); danh mục boss gồm Lumen, Cryo, Aeris; `stages.json` thêm `expectedMin`, `bossFightSec`; khối `report` trong `telemetry.json`.
- **Duyệt:** QA Lead duyệt GDD 13 mục 6–7 kèm sửa: áp hết 10 sửa bắt buộc vào GDD 13 bản 1.2 (xong màn theo `boss_end{win}` đúng boss; sắp phiên theo `t`; đoạn theo `segments`; MV6 không suy từ `dmg`; ngày 0 bắt buộc; Chưa kết luận khi còn Biên/Thiếu dữ liệu).
- **File chính:** `game/src/logic/telemetry/report*.ts`, `game/src/core/mvp-report.ts`, `game/scripts/mvp-report.mjs`, `game/tests/mvp-{sample,report}.ts`, `03-Data/{stages,telemetry}.json`, `01-GDD/13-Do-luong-MVP.md`, `stories/EP-13-do-luong.md`, `qa/ST-13-05/`.
- **Quyết định:** khối `report` game không đọc (lỗi không tắt đo lường); thời gian dự kiến, thời gian thắng boss ở `stages.json` (không thêm boss rỗng vào `bosses.json`); giờ chơi tối thiểu khi tính ghi rác 15 phút (1 giờ làm người chơi nhiều bị loại nhầm).
- **Lỗi tìm thấy / đã sửa:** bản nháp tính "xong màn" theo `stage_end`, sắp phiên theo `sid`, loại install theo tổng phiên (QA Lead chỉ ra, đã sửa trước commit).
- **Kiểm tra:** 476 test (thêm 20), typecheck, lint, format, build, docs-check đạt; chạy `npm run mvp-report` thật trên bộ mẫu, báo cáo ở `qa/ST-13-05/`.
- **Còn dở:** ST-13-05b (K, DK, T, X, S). Prologue chưa ghi `stage_end{clear}` (chưa có Prologue); bản đồ thật phải dùng id đoạn `A`–`D`, `boss`.
- **Tiếp theo:** người dùng: chơi thử G1, chọn ADR-002. Em: ST-13-05b, rồi test khóa luật QB (mục 3 của `00-Bat-dau.md`).

## 2026-11-14: Hướng đồ họa 2.5D three.js: demo phòng Thorna (EP-22 ST-22-01)

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); commit demo 2.5D.
- **Mục tiêu:** người dùng chọn hướng đồ họa (c) 2.5D thời gian thực bằng three.js và xin demo.
- **Đã làm:** trang riêng `game/demo-25d.html` + `src/demo25d/`: dựng phòng boss Thorna từ `StageWorld` thật (logic, dữ liệu không đổi); khối ô có chiều sâu, rừng nhiều lớp, sương, bóng, bloom; Kai, Thorna dựng từ khối 3D có hoạt ảnh; đạn phát sáng, vùng cảnh báo đòn 3D, hạt; camera phối cảnh bám Kai, khóa đấu trường; nút chạm; `?q=low`; tự chơi và quay từng khung (`scripts/demo25d-video.mjs`). three.js 0.170; chunk demo 140 KB gzip, game Phaser không nạp.
- **Tài liệu:** ADR-003 (Proposed: hướng đã chọn, cách chuyển chờ duyệt và đo máy thật), Epic EP-22, `09` mục 3 ghi lựa chọn, GDD chính mục 14 ghi đang đổi, ST-21-05 bỏ, asset pixel art dừng.
- **Lỗi tìm thấy / đã sửa:** tường nền che rừng; rêu quá rộng làm chói; tự chơi kẹt (leo tường, quay lưng bắn, đứng trên bục bắn qua đầu boss): đã sửa.
- **Kiểm tra:** 456 test (thêm 3), typecheck, lint, format, build, docs-check đạt; chạy Chromium (CPU, không GPU) PC và Pixel 7: 0 lỗi trang; video 24 s, ảnh ở `qa/DEMO-25D/`. FPS máy thật chưa đo.
- **Tiếp theo:** người dùng xem video; sau đợt thử G1 đưa demo lên Pages để thử trên điện thoại (ST-22-02); duyệt ADR-003. Em: ST-13-05 báo cáo đo lường.

## 2026-11-14: EP-13 ST-13-02 nối đo lường vào game

- **Nhánh / commit:** `ccr-9de01342-2046rb` (không merge vào `main` trong đợt thử G1); `8ba4609` (02a), commit 02b.
- **Mục tiêu:** người dùng giao "làm tiếp": ST-13-02 nối sự kiện đo lường vào game; tách 02a (logic thuần) và 02b (scene).
- **02a:** đạn kẻ địch mang `source`; `WorldEvents.hurtBy`, `deathCause` (`enemy:<id>`, `boss:<loại đạn>`, `spike`, `pit`); `StageWorld.bossDamage` theo vũ khí, `bossWeakHits`; `StageTracker` (một lượt màn: stage_start…stage_end, boss_end win/death/exit), `FrameStats`, `buildSignature`. Test chuỗi sự kiện trên StageWorld thật (GDD 13 mục 10 ý 1).
- **02b:** `src/scenes/telemetry/` (dịch vụ: session_start, boot_timing, lỗi trang; một lượt màn: FrameStats, hướng dẫn, gợi ý NOVA, trang ẩn, rời màn); `logic/telemetry/device.ts`; Quầy, Xưởng báo giao dịch qua `onTelemetry`; cờ tạm `?debug=1&telemetry=1` (bộ nhớ), `?staff=1`.
- **Quyết định:** chỉ màn chiến dịch mới ghi; lớp nối nằm trong `src/scenes/` vì luật lint chỉ cho scene import Phaser; mã lỗi lưu, phiên mới sau 30 phút ẩn, `msToControl` chuyển sang ST-13-03.
- **Kiểm tra:** 453 test (thêm 7), typecheck, lint, format, build, docs-check đạt; chạy thử Chromium Pixel 7: không cờ thì 0 bộ ghi, 0 request; có cờ thì 17 sự kiện đúng chuỗi, 0 sai lược đồ, 0 lỗi console (`qa/ST-13-02/`); `gate-flow` đạt.
- **Tiếp theo:** ST-13-05 báo cáo (`report.ts`, `npm run mvp-report`). Người dùng: chơi thử G1, chọn hướng đồ họa, chọn kênh gửi (ADR-002).

## 2026-11-14: EP-13 ST-13-01 lõi đo lường (duyệt Technical Director GDD 13)

- **Nhánh / commit:** `ccr-9de01342-2046rb` (sau merge PR #10, #11; không merge vào `main` trong đợt thử G1); commit ST-13-01.
- **Mục tiêu:** người dùng giao "làm tiếp theo plan": việc code số 2 của `00-Bat-dau.md`, EP-13 lõi đo lường.
- **Quy trình:** agent Technical Director duyệt GDD 13 trước khi code: "duyệt kèm sửa", 12 điểm (byte = độ dài JSON ASCII; lô bất biến; bộ đệm không bao giờ vượt; khử trùng theo install+sid+n; id theo danh mục; làm phẳng `audio`; enum còn thiếu; làm sạch lỗi; tắt gửi không ghi `consent: off`; `telemetry.json` thêm trường, không bắt buộc; dấu vân tay `data` trừ `telemetry.json`; hiệu năng). Đã sửa hết vào GDD 13 bản 1.1 và code.
- **Code:** `logic/telemetry/` (schema 26 sự kiện, validate, text, buffer, batch, logger), `logic/hash.ts`, `core/telemetry-config.ts`, `core/telemetry-catalogs.ts`, `03-Data/telemetry.json`. Bản thường chưa gọi lõi.
- **Tài liệu:** Epic `stories/EP-13-do-luong.md` (Story ST-13-01 theo mẫu), `17-Quy-tac-bien.md` bản 1.4 (mục 10.1, QB-150…157, 101 luật), `game/docs/quyet-dinh/do-luong.md`, CONTEXT, bản đồ hệ thống.
- **Lỗi tìm thấy / đã sửa:** bản nháp đầu đếm sự kiện bị bỏ đúng luật vào `lost`; sửa (chỉ đếm `lost` khi không còn gì bỏ được).
- **Kiểm tra:** 446 test (thêm 21), typecheck, lint, format, build, docs-check đạt; `gate-flow` đạt (PC, cảm ứng).
- **Tiếp theo:** ST-13-02 nối sự kiện (StageWorld: sát thương theo vũ khí, nguồn cú đánh cuối, chữ ký build; mã lỗi SaveManager), ST-13-05 báo cáo. Người dùng: chơi thử G1, chọn hướng đồ họa, chọn kênh gửi (ADR-002).

## 2026-11-14: CI đỏ trên PR #10; PR #9 song song; ST-21-01 chuỗi hướng dẫn (QB-88)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `76b9b62` (CI), `02008fe` (ghi chú PR #9), `b71a155` (EP-21), merge `eeb8ca1`, commit tài liệu sau merge.
- **Mục tiêu:** trả lời kế hoạch tiếp theo; kiểm tra CI đỏ người dùng báo; xử lý PR #9 theo cách A người dùng chọn (giữ bản thử G1, chuyển PR #9 từng phần).
- **CI:** lần #40–#42 đỏ ở `docs-check` vì commit tạm của agent có README trỏ tới `LOI-THOI.md` trước khi file được commit; #43 trở đi đạt. Nâng action lên bản Node 24 (checkout, setup-node v6; Pages v6/v5/v5). Mục EP-10 sang lưu trữ.
- **PR #9:** nhánh phiên 13/11, tách từ `main` song song, xung đột 31 file; có hình vẽ bằng mã, âm tổng hợp, smoke check, chuỗi vi/en. Epic `stories/EP-21-chuyen-PR9.md` (ST-21-01…06). Ảnh hình PR #9 so với hình khối: `qa/ST-21-05/`.
- **ST-21-01 (QB-88):** thoát giữa trận Thorna rồi vào lại thì câu S10 hiện ngay đầu màn tới khi hạ boss. Sửa: `after` nối theo bước xong trong lượt; bước đã lưu mà điều kiện xảy ra lại (vào lại phòng boss) thì nối chuỗi, không hiện lại lời (giữ gợi ý né đòn, khác bản sửa của PR #9). Không ảnh hưởng G1 (màn xám không có hướng dẫn).
- **Tìm lại:** yêu cầu 2.5D của người dùng (13/11) chỉ nằm trên nhánh PR #9; đã ghi vào `09-Quyet-dinh-cho-duyet.md` mục 3 (pixel art / 2.5D render sẵn / three.js; đề xuất pixel art cho MVP).
- **Lỗi tìm thấy:** commit tạm được đẩy khi chưa chạy docs-check (từ nay chạy đủ trước cả commit tạm).
- **Kiểm tra:** 425 test (thêm 2 QB-88, đỏ trên code cũ), lint, format, build, docs-check đạt; chạy thử Chromium trước/sau sửa (`qa/ST-21-01/`), 0 lỗi console.
- **Merge:** người dùng nhờ merge; PR #10 merge (merge commit `eeb8ca1`, CI #50 đạt). Pages #5 trên `main`: test, build đạt, dừng ở `configure-pages` vì repo riêng tư chưa bật Pages. Nhánh làm việc đưa lên ngang `main`. Người dùng chuyển repo sang công khai; Pages #6 (chạy tay) vẫn dừng ở `configure-pages`: chưa chọn Source "GitHub Actions" trong Settings → Pages. Người dùng bật Pages; lần #7 đăng thành công `eeb8ca1`. Môi trường chặn `github.io` nên em không tự mở link thật được.
- **Tag, merge tài liệu:** người dùng đồng ý tag `gate-r1`; đẩy tag từ môi trường bị proxy chặn (403), GitHub MCP không có lệnh tạo tag, người dùng tạo trên GitHub (`gate-r1` → `eeb8ca1`, đã kiểm). Tài liệu sau merge vào `main` bằng PR #11 (`c458643`); Pages #8 đăng lại đạt, code game không đổi.
- **Tiếp theo:** người dùng mở link `?gate=1` trên điện thoại rồi phát cho 5 người; không merge vào `main` trong đợt thử; chọn hướng đồ họa. Em: EP-13 lõi đo lường; EP-21 ST-21-02 sau tag.

## 2026-11-14: ST-11-01 vùng an toàn cho nút cảm ứng, canvas, bảng HTML (bước đầu của G1)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; commit ST-11-01.
- **Mục tiêu:** người dùng đồng ý làm bước đầu tiên của `00-Bat-dau.md`: sửa vùng an toàn (QB-92) trước khi phát link chơi thử G1.
- **Đã làm:** Story `stories/EP-11-cong-prototype-dot-1.md`; `touch-layout.ts` (nút, cần ảo neo theo mép vùng an toàn), `scale.ts` (canvas tránh trái, phải, trên), `input/safe-area.ts` (đọc `env()` qua phần tử dò), `style.css` (bảng HTML trừ vùng an toàn).
- **Quyết định:** canvas không tránh thanh vuốt dưới (chỉ đè, không che hình; tránh thì iPhone 14 tụt ×6 → ×5); nút tránh cả 4 phía.
- **Kiểm tra:** 423 test (thêm 8), lint, format, build, docs-check đạt; `gate-flow` đạt; chạy thử iPhone 14 và Pixel 7 giả lập tai thỏ bằng CDP, 0 lỗi console (`qa/ST-11-01/`).
- **Còn dở:** kiểm trên máy thật có tai thỏ ở buổi chơi thử.
- **Tiếp theo:** người dùng merge và tag `gate-r1`, chơi thử 5 người; code tiếp (EP-13 lõi đo lường) ở nhánh mới.

## 2026-11-14: Rà soát toàn bộ tài liệu, quy tắc biên, tài liệu hệ thống còn thiếu, kế hoạch S9–S21

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `84ac8b2` (sửa code), `3ec2438` … commit đóng phiên (tài liệu).
- **Mục tiêu:** người dùng giao kiểm tra toàn bộ tài liệu (nhất là GDD), mô tả mọi ngóc ngách, bổ sung chỗ thiếu, kiểm mâu thuẫn và quy tắc, tối ưu đầu vào, kế hoạch chi tiết, theo quy trình Game Studio Agent.
- **Đã làm:**
  - Rà soát 4 nhóm (`/review-all-gdds`, `/consistency-check`): lõi, kinh tế, giao diện và lời thoại, quy trình. Sửa mâu thuẫn ở GDD chính (0.8), 02–11, JSON.
  - Tài liệu mới: 12 Âm thanh, 13 Đo lường MVP, 14 Cài đặt, 15 Nhiệm vụ phụ, 16 Stage 2–4 (nháp), 17 Quy tắc biên (92 luật QB), `08-Cong-MVP.md`, ADR-002, `02-Wireframes/LOI-THOI.md`.
  - Duyệt Creative Director và Technical Director + Producer: mọi file "duyệt kèm sửa", đã sửa.
  - Kế hoạch S9–S21, EP-11…EP-20, ba cổng G1/G2/G3. Đầu vào: `00-Bat-dau.md`, CLAUDE.md gọn, Story xong vào `stories/xong/`, `npm run docs-check` (CI).
- **Sửa code:** boss và Kai hết máu cùng bước thì thắng (QB-30); gợi ý NOVA hiện được giữa trận boss (QB-70…72, 82); chết để cày EXP, Core Bit bị chặn (QB-20); gợi ý thu nhập Quầy đúng màn và độ khó (QB-65); nhãn tab Xưởng (QB-132); `regenDelayMul` 0,6667.
- **Quyết định:** chốt theo ủy quyền, danh sách ở `09-Quyet-dinh-cho-duyet.md` (Thorna 45–65 s, Mk II thay Mk I, hết MVP cấp 10, Nano Cell, bỏ Data Chip khỏi live-ops, chỉ màn ngang…).
- **Lỗi tìm thấy / đã sửa:** 4 lỗi code ở trên; một commit tạm lọt 1 test đỏ (test hướng dẫn theo S08 6 s) và `__pycache__`, đã sửa ngay; 4 agent dừng vì giới hạn sử dụng, đã cho chạy tiếp.
- **Kiểm tra:** 415 test, lint, format, build, docs-check đạt; chạy thử trình duyệt: gợi ý NOVA trong trận boss, gợi ý Quầy, tab Xưởng (ảnh ở `qa/ST-09-04`, `qa/ST-08-05`).
- **Còn dở:** người dùng chọn kênh đo lường (ADR-002), xem `09-Quyet-dinh-cho-duyet.md`; tài liệu 12–14 còn Draft (duyệt khi mở EP-12/13/14); chưa test nào mang mã QB.
- **Tiếp theo:** 1. Safe-area (QB-92) rồi đóng băng bản thử G1 (`gate-r1`), chơi thử 5 người. 2. EP-13 lõi đo lường. 3. Test các luật QB đã code. 4. EP-15 ST-15-14, ST-15-01a. 5. EP-12 âm thanh.

## 2026-11-14: EP-10 ba độ khó; chốt EP-09 theo duyệt Game Studio Agent

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `8fc56bb` (bản nháp), `a22fd10`, `6677f97`, `6d98fdc`, `b48a892`, `930bdb6` (ST-10-01…05), `36f7499` (EP-09 sửa theo duyệt), commit ST-10-06 và tài liệu.
- **Mục tiêu:** người dùng giao "làm tiếp 3 độ khó", tự dùng Game Studio Agent bổ sung mọi chỗ còn thiếu, toàn quyền quyết định.
- **Đã làm:**
  - GDD `01-GDD/11-Do-kho.md` theo mẫu `/design-system`, qua 2 agent duyệt độc lập (Creative Director; Technical Director + Producer), sửa thành bản 2 Approved. Epic EP-10.
  - ST-10-01…06: màn Chuẩn bị; hệ số độ khó (cả máu boss); mở Thử thách theo màn; bản lưu 4; checkpoint theo độ khó; gợi ý NOVA sau 3 lần chết; bản Thử thách của 4 kẻ địch Stage 1, Golem và Thorna (đòn Rễ Đuổi).
  - Chốt 9 quyết định EP-09 theo duyệt: Energy Cell +15%/cấp; hoàn đúng giá đã trả; món chưa có tác dụng không bán; thẻ Quầy hiện số thật.
- **File chính:** `game/src/logic/difficulty/*`, `game/src/prep/`, `scenes/{prep,stage,menu}-scene.ts`, `core/{enemy,boss,shop}-config.ts`, `core/deep-merge.ts`, `logic/enemy/behaviors.ts`, `logic/boss/boss.ts`, `logic/save/*`, `03-Data/{difficulties,enemies,bosses,ui,shop}.json`.
- **Quyết định:** xem GDD 11 mục 9 và EP-09 (bảng quyết định). Chính:
  - thưởng boss một lần mỗi cặp (boss, độ khó);
  - không mang checkpoint từ độ khó dễ sang khó;
  - 3 lần chết (thống nhất với kịch bản hướng dẫn);
  - mẫu đòn Stage 1 là `[PLACEHOLDER]` tới cổng Prototype.
- **Lỗi tìm thấy / đã sửa:**
  - Máu boss không nhân hệ số độ khó.
  - Đã hạ boss xám ở phòng thử mà vẫn mở được Thử thách.
  - Bản lưu 3 sẽ khóa Thử thách của người đã hạ Thorna.
  - Tháp Gai lệch 15° trùng gai cũ.
  - Rễ chỉ mọc ở sàn nên đứng bục là miễn nhiễm.
  - Quầy trên Pixel 7 bị cắt nút khi hiện gợi ý.
- **Kiểm tra:**
  - 412 test, lint, format, build, `gate-flow`, `gate-check` đều đạt.
  - Chạy thử Chromium PC và Pixel 7; ảnh ở `04-Dev-Plan/qa/ST-10-02…05`, `ST-09-04`.
- **Còn dở:**
  - Chơi thử 5 người; PR #10 chưa merge (commit phiên này nằm cùng nhánh).
  - Đặt checkpoint theo độ khó lên bản đồ thật, chốt số mẫu đòn (sau cổng).
- **Tiếp theo:** 1. Merge PR #10, chạy đợt chơi thử 1. 2. Tài liệu âm thanh MVP (M12) và đo lường MVP (M16). 3. Sau cổng: đặc tả Stage 2–4 kèm mẫu đòn Thử thách.

## 2026-11-14: M9 Shop chỉ Upgrade (EP-09, Quầy Mira)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `8f5e0c2` (Epic + ST-09-01), `4bb7d80` (ST-09-02), `7d42fe6` (ST-09-03), `d4ee4f4` (ST-09-04), commit tài liệu.
- **Mục tiêu:** người dùng giao "làm tiếp game theo plan". Chơi thử cổng Prototype còn chờ người thật (PR #10 chưa merge), nên làm việc MVP kế tiếp không bị chặn: M9 Shop chỉ Upgrade.
- **Đã làm:**
  - Epic EP-09 + 4 Story; lấp 9 khoảng trống của đặc tả (mục "Khoảng trống" trong Epic).
  - **ST-09-01:** lịch mở theo boss trong `shop.json`, giá theo cấp, mua/gỡ thuần.
  - **ST-09-02:** bản lưu 3 (`inventory.upgrades`), chuẩn hóa, `SaveManager.transact`.
  - **ST-09-03:** Arc Core, Armor Plating, Energy Cell, Magnet Range có tác dụng trong trận.
  - **ST-09-04:** Quầy Mira (HTML) từ menu (phím Q, mở sau 2 boss), Mua → Xác nhận, Gỡ.
- **File chính:** `03-Data/{shop,enemies}.json`, `game/src/core/shop-config.ts`, `game/src/logic/shop/*`, `game/src/shop/shop-panel.ts`, `game/src/scenes/{shop,menu}-scene.ts`, `logic/save/save-{data,manager}.ts`, `logic/rpg/build.ts`, `logic/world/{pickups,stage-world}.ts`.
- **Quyết định (`[PLACEHOLDER]`, người dùng có thể đổi):** cấp 3 mở sau 5 boss; Energy Cell 28 → 31 → 34; nam châm tính từ thân Kai; MVP mở quầy từ menu; `?shop=1` để thử khi mới có 1 boss.
- **Lỗi tìm thấy / đã sửa:** trên Pixel 7 ngang bảng một cột cao hơn màn, nút Mua bị đẩy xuống dưới (đổi sang hai cột); dòng phím ở menu bị cắt hai đầu.
- **Kiểm tra:** 373 test (thêm 25), lint, format, build đạt; `gate-flow` đạt; chạy thử Chromium PC + Pixel 7, ảnh ở `04-Dev-Plan/qa/ST-09-04/`.
- **Còn dở:** chơi thử 5 người; PR #10 chưa merge (commit phiên này nằm cùng nhánh); R04; Booster, Skin (Alpha).
- **Tiếp theo:** 1. Merge PR #10, chạy đợt chơi thử 1. 2. "3 độ khó" của MVP: màn Chuẩn bị chọn độ khó (đặc tả Hub mục 3). 3. Tài liệu âm thanh và đo lường MVP.

## 2026-11-14: Cổng Prototype: chuẩn bị đợt chơi thử 1, cân bằng Thorna

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `55cf18f` (bản người thử), `5e82e50` (Thorna), commit tài liệu và `gate-flow`.
- **Mục tiêu:** người dùng đồng ý quyết định Hoa Nở xuyên khiên và giao "làm tiếp cổng Prototype". Phần chơi thử 5 người cần người thật, nên phiên này chuẩn bị mọi thứ trước đợt 1.
- **Đã làm:**
  - Đo tự động lại trên bản build sau M8 (`npm run gate-check`): mọi hạng mục đạt (tải 1,50 MB, vào game 2,51 s ở CPU 4×, FPS 59,5–60, trễ p95 13–23 ms).
  - Bản người thử `?gate=1`: menu chỉ còn Chơi, Điều khiển, Kết quả chơi thử; nút và menu tạm dừng ≥ 48 dp trên điện thoại.
  - `npm run gate-flow`: chạy thử trọn luồng người thử trên máy tính và Pixel 7, gộp nhật ký; đạt.
  - Thorna máu 100 → 250 theo mô phỏng; mẫu tin nhắn mời và phiếu quan sát trong `05-Cong-Prototype.md` mục 4.
- **File chính:** `game/src/scenes/{menu-scene,ui}.ts`, `stage/pause-menu.ts`, `debug/flags.ts`, `game/scripts/gate-flow.mjs`, `03-Data/bosses.json`, `game/tests/{power-cap,thorna,hud}.test.ts`, `04-Dev-Plan/05-Cong-Prototype.md`, đặc tả Stage 1 mục 5.
- **Quyết định:** Thorna 250 máu (`[PLACEHOLDER]`): 100 máu thì bot không né thắng sau 15 s; 250 thì bot không né thua ở cấp 4 kể cả build Core đủ bậc; người né được cần khoảng 45–65 s. Tiêu chí GDD 10 "phòng thủ không thay được né" đạt lại.
- **Lỗi tìm thấy / đã sửa:** người thử dễ vào nhầm phòng thử khác (chỉ màn xám ghi nhật ký); nút menu và menu tạm dừng chỉ cao 28–30 dp trên điện thoại. Không có lỗi mất phím khi nhấn nhả rất nhanh (đã thử).
- **Kiểm tra:** 348 test, lint, format, build đạt; `gate-check` và `gate-flow` đạt. Ảnh ở `04-Dev-Plan/qa/cong-prototype/`.
- **Còn dở:** chơi thử 5 người (≥ 3 cảm ứng) chưa làm. Đã mở PR #10 vào `main` (theo yêu cầu người dùng); merge xong thì GitHub Pages đăng bản mới.
- **Tiếp theo:** 1. Merge PR #10, kiểm tra link `?gate=1`, gửi người thử, tổng hợp vào mục 7. 2. Theo kết quả: chỉnh cảm giác, hoặc qua cổng rồi chốt bản đồ Prologue/Stage 1. 3. Tài liệu âm thanh và đo lường MVP.

## 2026-11-14: Sprint 8, EP-08 ST-08-06…08 (Phantom, Vanguard, khiên Core)

- **Nhánh / commit:** `ccr-9de01342-2046rb`; `e1001c0` (ST-08-06), `fcd59bc` (ST-08-07), `0af2359` (ST-08-08), commit tài liệu.
- **Mục tiêu:** người dùng giao "làm tiếp ST-08-06 đến 08": cơ chế tầng 2–3 của cây kỹ năng.
- **Đã làm:**
  - **ST-08-06 Phantom:** lượt lướt trên không (P1), ân hạn nhảy tường (P2 bậc 2), lướt xuyên đạn và sượt đạn (P3); đèn chân, bóng mờ.
  - **ST-08-07 Vanguard:** nổ lan (V2), Đòn Trừng Phạt khi mục tiêu hở (V3), lõi sáng boss; ba bậc phản hồi trong `ui.json`.
  - **ST-08-08 Core:** `BuildRuntime` trong StageWorld, `absorbHit`, khiên chặn một đòn rồi hồi; vòng hồi trên HUD, viền quanh Kai, mảnh kính khi vỡ.
- **File chính:** `game/src/logic/{player,world,rpg}/*`, `game/src/logic/enemy/{enemy,behaviors}.ts`, `boss.ts`, `stage-scene.ts`, `stage-hud.ts`, `stage-renderer.ts`, `03-Data/{skills,ui}.json`; test `phantom`, `vanguard`, `shield`.
- **Quyết định:**
  - Chu kỳ lướt đo được là 50 bước (không phải 51).
  - Hạt Hoa Nở xuyên khiên (`rules.shieldPierceKinds`): 12 hạt rơi cùng lúc, nên tiêu chí cũ "trúng sau khi khiên vỡ" không thể đạt.
  - Khiên không chặn đòn 0 máu. Màu đèn chân P1 đổi sang cam.
- **Lỗi tìm thấy / đã sửa:** rơi hố còn máu thì bước sau hồi sinh lần hai theo nhánh chết (hồi đầy máu, dựng lại boss). Nguyên nhân là đồng hồ còn dư sai số; có test hồi quy.
- **Kiểm tra:** 348 test (thêm 27), lint, format, build đạt. Chromium cả 3 Story, không lỗi console; ảnh ở `04-Dev-Plan/qa/ST-08-06`, `07`, `08`.
- **Còn dở:** âm thanh kỹ năng (M12); R02/R03; Booster `shield_cell` chưa chạy trong trận; tay cầm chưa thử máy thật; Thorna quá dễ (chờ cổng Prototype).
- **Tiếp theo:** 1. Chơi thử cổng Prototype, gồm cân bằng Thorna. 2. Tài liệu âm thanh và đo lường MVP. 3. Shop chỉ Upgrade (M9).

## 2026-11-14: Sprint 8, EP-08 ST-08-01…05 (cây kỹ năng, Xưởng tab Kỹ năng)

- **Nhánh / commit:** `ccr-9de01342-2046rb`, 6 commit:
  - lan thay đổi thiết kế;
  - ST-08-01 đến ST-08-05, mỗi Story một commit.
- **Mục tiêu:** người dùng duyệt 5 quyết định của `01-GDD/10-He-thong-RPG-Xuong.md` và giao làm tiếp.
- **Đã làm:**
  - **Lan thay đổi sang tài liệu:** GDD 0.7 (6.1–6.4, 8.3, nhật ký), đặc tả Hub mục 5, hướng dẫn R03/D02, wireframe `Workshop.html`, `02-Module.md`.
  - **ST-08-01 (dữ liệu):** `skills.json` có kiểm tra luật bậc; trường số trong `shop.json`; công 0,2/cấp; trần mới.
  - **ST-08-02 (cây kỹ năng):** logic thuần; bản lưu 2; `normalizeBuild` trong `SaveManager`.
  - **ST-08-03 (build trong trận):** `computeBuild`/`applyBuild`/`statsFor`; StageWorld giữ dữ liệu gốc và bản đã áp build.
  - **ST-08-04 (trần sức mạnh):** `checkStoryPowerCap`; mô phỏng 4 lối bắn; bot không né.
  - **ST-08-05 (Xưởng):** bảng HTML từ menu, màn Kết quả, menu tạm dừng (áp khi hồi sinh).
- **Quyết định:** sàn nạp đầy nâng 0,75 → 0,8 s theo mô phỏng; phép thử giả định ≤ 1/3 phát nạp đầy trúng lúc boss hở; tiêu chí "bot phòng thủ thua Thorna" đổi thành "build Core không đổi số đòn trúng".
- **Lỗi tìm thấy / đã sửa:**
  - ↑/W trùng Lên và Tương tác, nên trong menu tạm dừng, màn Kết quả, Xưởng bấm ↑ là kích hoạt mục mới (sửa bằng `menuActivate`).
  - Nút Xưởng trên điện thoại 40 px (nâng lên 48).
  - **Chưa sửa (cổng Prototype):** bot không né thắng Thorna sau ~15 s, chỉ trúng 5–6 đòn (đặc tả 60–90 s).
- **Kiểm tra:**
  - `npm test` 321 test (thêm 34), lint, format, build đạt.
  - Chromium:
    - build vào trận đúng (cấp 3 + C1: máu 124, trượt tường ×0,6); màn xám không có build;
    - Xưởng: học bằng phím, chuột, chạm (Pixel 7); đặt lại 2 lần; Esc;
    - menu tạm dừng: học C1, máu đổi sau hồi sinh.
  - Không lỗi console. Ảnh ở `04-Dev-Plan/qa/ST-08-03`, `ST-08-05`.
- **Còn dở:** R02/R03 (chưa có giai đoạn Hub của hướng dẫn); tay cầm chưa thử bằng máy thật.
- **Tiếp theo:**
  1. ST-08-06 → 08 (Phantom, Vanguard, Core: cơ chế tầng 2–3).
  2. Tài liệu âm thanh và đo lường MVP.
  3. Chơi thử cổng Prototype, gồm cân bằng Thorna.

## 2026-11-14: Tài liệu M8 (kỹ năng, module, Két giáp, Xưởng) theo quy trình Game Studio Agent

- **Nhánh / commit:** `ccr-9de01342-2046rb`.
- **Mục tiêu:** người dùng giao "dùng Game Studio Agent triển khai tiếp tài liệu còn thiếu, đề xuất phương án tốt nhất".
- **Đã làm:** đọc đầu vào bằng graphify. Theo bộ khung:
  - `/map-systems`: bản đồ hệ thống, tài liệu còn thiếu, tên chuẩn.
  - `/design-system`: GDD hệ thống theo mẫu 8 mục, so 5 phương án cây kỹ năng, chọn E.
  - Hai Director duyệt độc lập (agent con): Creative Director; Technical Director + Producer, có chạy mô phỏng DPS bằng code game. Cả hai "duyệt kèm sửa"; đã kiểm chứng trên code và sửa thành bản 2.
  - ADR-001 (Xưởng là bảng HTML); Epic EP-08 với 9 Story.
- **File chính:** `01-GDD/10-He-thong-RPG-Xuong.md`, `04-Dev-Plan/07-Ban-do-he-thong.md`, `04-Dev-Plan/adr/ADR-001-xuong-bang-html.md`, `04-Dev-Plan/stories/EP-08-xuong-rpg.md`, `ST-08-01…09`.
- **Quyết định đề xuất (chờ duyệt, GDD mục 10):**
  - Cây E: 3 × 3 nút có bậc, 18 SP.
  - Hạ công theo cấp 0,25 → 0,2.
  - Tab Kỹ năng làm ngay; Module, Giáp khi có nội dung Stage 2–4; skin, Loadout sang Alpha.
  - Chỉnh kỹ năng trong menu tạm dừng, áp khi hồi sinh.
  - Build không giảm sát thương gai/hố.
- **Lỗi tìm thấy:**
  - GDD 6.1 mâu thuẫn trần ×2,2: cấp 30 × Upgrade đã 2,16, Citadel không đồng bộ cấp.
  - Bản 1 tính sai: tăng tốc nạp áp cả nạp vừa nâng DPS tối đa khoảng 26–30% (`loadout.ts` bắn 1 phát khi bấm; mô phỏng 7,47 / 9,62).
  - P3 bất tử có đồng hồ ẩn, vượt 20%.
  - Cờ `airDash` cho lướt trên không vô hạn.
  - Kẻ địch chưa có trạng thái choáng (Phase Step).
- **Kiểm tra:** chỉ tài liệu, không đổi code; prettier đạt.
- **Còn dở:** chờ người dùng duyệt; lan thay đổi sang GDD chính, Hub, hướng dẫn, wireframe (GDD mục 9) sau khi duyệt.
- **Tiếp theo:**
  1. Duyệt mục 10, rồi làm ST-08-01 → 05 (Vertical slice).
  2. Tài liệu âm thanh MVP và đo lường MVP (bản đồ hệ thống mục 2).
  3. Đặc tả Stage 2–4 sau cổng Prototype.

## 2026-11-14: Sprint 8, phóng hình theo px thiết bị và M8 cấp/SP

- **Nhánh / commit:** `ccr-9de01342-2046rb` (2 commit: phóng hình; M8).
- **Mục tiêu:** người dùng đồng ý sửa hệ số phóng theo đề xuất rồi làm tiếp: chọn M8 RPG rút gọn (đọc GDD 6, P-M8, `player.json` bằng graphify).
- **Đã làm:** (1) `computeLayout` nhận `devicePixelRatio`, phóng nguyên theo px thật, tự căn giữa đúng biên px thật; chữ thông báo giữa màn hình neo dưới hộp hướng dẫn. (2) M8: `logic/rpg/progression.ts` (cấp từ EXP, SP, đồng bộ cấp, chỉ số theo cấp, LevelTracker); StageWorld nhận `level` và `setLevel()` thay cấp 1 cố định của Prototype; `StageDef.campaign`; lên cấp giữa màn; cấp ở HUD, màn Kết quả, menu, Dữ liệu lưu; kiểm tra trần sức mạnh cốt truyện lúc nạp.
- **File chính:** `game/src/logic/scale.ts`, `core/phaser-scale.ts`, `main.ts`, `style.css`, `scenes/stage/stage-hud.ts`; `game/src/logic/rpg/progression.ts`, `core/player-config.ts`, `core/game-config.ts`, `logic/world/stage-world.ts`, `logic/player/player-physics.ts`, `scenes/stage-scene.ts`, `logic/result/stage-result.ts`, `scenes/{menu,save}-scene.ts`, `save/save-panel.ts`, `game/tests/{scale,rpg}.test.ts`.
- **Quyết định:** cấp và SP suy ra từ EXP và boss đã hạ (không lưu riêng); lên cấp áp ngay giữa màn; màn xám luôn cấp 1; phòng thử Stage 1 đồng bộ cấp 1–6. Cây kỹ năng chưa làm vì chưa có danh sách kỹ năng (cần người dùng chốt).
- **Lỗi tìm thấy / đã sửa:** điện thoại ngang chỉ phóng ×1 theo px CSS (nay Pixel 7 ×4 px thật, iPhone 13 ×5). Chữ "Nhận vũ khí" bị hộp S13 che. Khi viết M8: boss hạ lần đầu suýt không được cộng SP vì cờ thoại đã đổi trước (sửa bằng cờ riêng). GDD ghi EXP 29→30 "~4.460", tính đúng là 4461.
- **Kiểm tra:** `npm test` 287 test (thêm 14: scale 2, rpg 12), lint, format:check, build đạt. Chromium: canvas Pixel 7 1280 × 768 px thật, iPhone 13 ×5, desktop ×3 không đổi, Windows 125% ×4, nhấp nút trong canvas trúng ở mọi cấu hình; Pixel 7 chạm hộp thoại/Bỏ qua/Kết quả vẫn đúng. M8: hạ Thorna ở cấp 1 → "Lên cấp 2! +1 SP", máu tối đa 100 → 104, Kết quả "+120 (cấp 1 → 2)", "+2 SP", menu "cấp 2 · SP 2". Không lỗi console.
- **Còn dở:** cây kỹ năng rút gọn, module và ô theo cấp, Két giáp, loadout, Xưởng.
- **Tiếp theo:** người dùng chọn phạm vi cây kỹ năng rút gọn (đề xuất 3 nhánh × 3 kỹ năng dùng cơ chế đã có), rồi làm Xưởng (kỹ năng, đặt lại miễn phí, lưu SP đã tiêu). Vẫn chờ kết quả cổng Prototype 5 người (nay bản điện thoại hiển thị to hơn).

## 2026-11-14: Sprint 8, hội thoại boss và màn Kết quả (đọc đầu vào bằng graphify)

- **Nhánh / commit:** `ccr-9de01342-2046rb`.
- **Mục tiêu:** người dùng giao "làm tiếp plan", dùng graphify đọc dữ liệu đầu vào. Làm hai phần M10 còn thiếu của Vertical slice mà không cần bản đồ thật: hội thoại boss (thoại Thorna, cần cho S11) và màn Kết quả.
- **Đã làm:** cài `graphifyy`, dựng đồ thị repo (`graphify update .`, 1692 node, không cần khóa LLM), tra `graphify query/explain` để tìm P-UI-DIALOG, P-UI-PREP-RESULT, `09-Thoai-Warden.md`, đặc tả Thorna mục 5, kịch bản S11–S13, wireframe Dialogue/Result; tra thêm skill `dialogue-systems` trong đồ thị Game_Studio_Agent. Code: `03-Data/ui.json` + kiểm tra (`core/ui-config.ts`, `core/dialogue-config.ts`), `logic/dialogue/` (chọn biến thể theo số Warden đã hạ, DialogueRunner), `DialogueBox`, `logic/result/` + `ResultPanel`, `MenuNavigator` dùng chung (menu tạm dừng chuyển sang dùng), `world.elapsedSec`, `StageDef.result` (phòng Thorna), `remindOnResult` cho bước hướng dẫn.
- **File chính:** `03-Data/ui.json`, `03-Data/tutorial.json`, `game/src/core/{ui,dialogue,game}-config.ts`, `game/src/logic/{dialogue,result}/*`, `game/src/logic/hud/menu-cursor.ts`, `game/src/scenes/stage/{dialogue-box,result-panel,pause-menu}.ts`, `stage-scene.ts`, `game/tests/{dialogue,result,tutorial}.test.ts`.
- **Quyết định:** hộp mở thì trận đứng yên, không tự đóng (luôn bỏ qua được); S11/S12 chuyển thành hộp hội thoại (hiện cả khi tắt hướng dẫn), S13 kích hoạt khi nhận vũ khí; Kết quả mở sau 8 s kể từ khi thoại đóng; nút "Về menu" thay "Về Hub" tới khi Hub dùng được trên cảm ứng; `graphify-out/` vào `.gitignore` (sinh lại được).
- **Lỗi tìm thấy / đã sửa:** chạy thử thấy chữ HUD lờ mờ xuyên qua hộp thoại (nền đục lại), nút Bỏ qua nhỏ khi chạm (phóng to). **Chưa sửa, cần chốt:** điện thoại ngang ~360 px CSS chỉ được phóng ×1 (canvas 320 × 192 px CSS, khoảng 1/3 màn hình) vì hệ số nguyên tính theo px CSS.
- **Kiểm tra:** `npm test` 273 test (thêm 19), lint, format:check, build đạt. Chromium bàn phím: thoại trước trận (boss đứng yên), hạ Thorna → Thorna → NOVA → báo Vine Lash → S13 → Kết quả 8 s sau; Chơi lại thành trận đấu lại không thoại, Kết quả "Không có phần thưởng mới"; Về menu. Pixel 7 ngang: chạm hộp hiện hết/đóng, chạm Bỏ qua, lớp nút ẩn/hiện đúng, chạm Chơi lại màn. Không lỗi console.
- **Còn dở:** ChoicePanel, thoại NPC/Prologue, tự tiến, âm thanh biểu cảm, chân dung thật; Kết quả chưa có cấp/SP (M8), Data Chip, Memory Log/Két giáp, kỷ lục.
- **Tiếp theo:** (1) hỏi người dùng có sửa hệ số phóng theo px thiết bị trước đợt chơi thử 5 người không (ảnh hưởng trải nghiệm trên điện thoại); (2) chờ kết quả cổng Prototype; (3) trong lúc chờ: M8 RPG rút gọn (cấp, SP, Két giáp) để màn Kết quả có lên cấp.

## 2026-11-03: Sprint 7, TutorialManager

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng giao làm TutorialManager (việc code cuối của Vertical slice).
- **Đã làm:** `03-Data/tutorial.json` (13 bước Stage 1 S01–S13 theo kịch bản mục 4.2) + kiểm tra `core/tutorial-config.ts`. `logic/tutorial/` (thuần): `TutorialManager` (hàng đợi, `after`, `skipIfDone`, `cancelOn`, gợi ý theo giây/thất bại) và `TutorialSignals` (StageWorld → tín hiệu, thêm `LockedRoom.kinds`). Hộp lời thoại `TutorialBox`, nút cảm ứng nhấp nháy theo gợi ý, mục Bật/Tắt hướng dẫn ở menu tạm dừng, tiến độ lưu trong bản lưu (`tutorial.done/off`). Bật cho 4 phòng thử (`StageDef.tutorial: 'stage1'`).
- **File chính:** `03-Data/tutorial.json`, `game/src/core/tutorial-config.ts`, `game-config.ts`, `game/src/logic/tutorial/*.ts`, `game/src/scenes/stage/tutorial-box.ts`, `pause-menu.ts`, `stage-scene.ts`, `game/src/logic/save/save-data.ts`, `game/tests/tutorial.test.ts`.
- **Quyết định:** bước theo tín hiệu sự kiện, không theo tọa độ bản đồ (chưa được chốt màn trước cổng Prototype). Chưa làm Prologue P01–P13 và F01–F04 vì cần bản đồ Prologue. Màn xám không có hướng dẫn để giữ số liệu chơi thử. Lời thoại để thẳng tiếng Việt trong dữ liệu (khóa `tut.<ID>` và tiếng Anh làm khi có bản địa hóa).
- **Lỗi tìm thấy / đã sửa:** chạy thử thấy hạ boss khi lời S08 còn hiện thì S09/S10 vẫn hiện sau trận; thêm `cancelOn` (S08, S09) và `skipIfDone` (S10), có test.
- **Kiểm tra:** `npm test` 254 test (thêm 14 ở `tutorial.test.ts`), lint, format:check, build đều đạt. Chromium: chạm gai ở phòng thử màn chơi → S03, lưu `done: [S03]`; tắt hướng dẫn ở menu tạm dừng → lưu `off: true`; giả lập Pixel 7: hạ Thorna → S11, S12, S13 và nút VK > cùng nút vũ khí nhấp nháy; không có lỗi console.
- **Còn dở:** gợi ý bậc 3–4, minh họa bóng mờ, mục Trợ giúp, sự kiện đo lường; trên cảm ứng tên nút dài nên một số lời thoại thành 3 dòng.
- **Tiếp theo:** phần code Vertical slice đã đủ khung. Chờ người dùng báo kết quả chơi thử (Thorna/Golem, cổng Prototype 5 người). Trong lúc chờ, có thể làm: hộp hội thoại (thoại Thorna, cần cho S11), màn Kết quả, hoặc M8 RPG rút gọn của MVP (hỏi người dùng).

## 2026-11-03: Sprint 7, M10 HUD cơ bản

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng giao làm phần tiếp theo (M10 HUD cơ bản); phần chơi thử người dùng sẽ báo sau.
- **Đã làm:** `logic/hud/` (thuần): `buildHud` dựng mô hình HUD từ StageWorld, `MenuCursor`. HUD vẽ lại theo wireframe Main/HUDPC (máu kèm số, năng lượng, máu boss giữa trên, Core Bit gồm cả bản lưu, EXP, ô vũ khí PC, chừa chỗ nút II trên cảm ứng). Menu tạm dừng thay cho Esc về thẳng menu. Nút biểu tượng vũ khí cảm ứng (chạm = sau, vuốt trái = trước, nhãn là tên vũ khí): `controls.json` thêm nút `weapon` (`swipe: true`) và `swipeMinDp`, có kiểm tra.
- **File chính:** `game/src/logic/hud/*.ts`, `game/src/scenes/stage/stage-hud.ts`, `pause-menu.ts`, `stage-scene.ts`, `game/src/input/touch-overlay.ts`, `input-service.ts`, `game/src/core/controls-config.ts`, `03-Data/controls.json`, `game/tests/hud.test.ts`.
- **Quyết định:** HUD đọc mô hình thuần mỗi khung thay vì event bus (gợi ý trong P-UI-HUD), vì số liệu đổi mỗi bước. "Lắp module nhanh" và "Tùy chọn" hiện mờ tới khi có M8/Cài đặt. Thoát về menu (Hub mới là khung).
- **Lỗi tìm thấy / đã sửa:** ô vũ khí đè dòng hướng dẫn phím ở cạnh dưới (đã đẩy lên). Dòng M8–M18 trong bảng module của `CONTEXT.md` chưa được cập nhật ở phiên M11 (khoảng trắng đệm làm lệnh thay không khớp), đã sửa.
- **Kiểm tra:** `npm test` 240 test (thêm 9 ở `hud.test.ts`), lint, format:check, build đều đạt. Chromium: HUD trong trận Thorna, tạm dừng giữ trận đứng yên, thoát cần bấm hai lần, Esc tiếp tục; giả lập Pixel 7 ngang: chạm nút vũ khí đổi sang Vine Lash, nhãn đổi theo; không có lỗi console.
- **Còn dở:** safe-area tai thỏ, hội thoại, màn Kết quả, Cài đặt, bản đồ nhỏ (phần còn lại của M10).
- **Tiếp theo:** (1) người dùng chơi thử Thorna/Golem và cổng Prototype 5 người (sẽ báo); (2) code TutorialManager (`01-GDD/07-Kich-ban-huong-dan.md`).

## 2026-11-03: Sprint 7, M11 lưu cục bộ

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng đồng ý làm M11 (lưu cục bộ của Vertical slice).
- **Đã làm:** `logic/save/` (thuần): `SaveData` (boss đã hạ, checkpoint + bí mật theo màn, EXP, vũ khí boss, Core Bit, thời gian chơi, revision, savedAt; hỏng từng phần về mặc định), mã sao lưu `CV1.<base64url>.<FNV-1a>`, `SaveManager` (ghi theo thứ tự, không ghi đè bản của phiên bản mới hơn), `StageSave` (nối sự kiện StageWorld với bản lưu). Kho IndexedDB, dự phòng localStorage. `StageWorld` nhận `ownedWeapons`, `takenSecrets`, `bossDefeated`. Màn mới "Dữ liệu lưu" (menu S): tóm tắt, sao chép/nhập mã, xóa tiến trình; menu hiện tóm tắt bản lưu.
- **File chính:** `game/src/logic/save/*.ts`, `game/src/save/*.ts`, `game/src/scenes/save-scene.ts`, `stage-scene.ts`, `menu-scene.ts`, `preload-scene.ts`, `game/src/logic/world/stage-world.ts`, `game/tests/save.test.ts`.
- **Quyết định:** ghi ngay khi qua checkpoint/nhặt bí mật/nhận vũ khí/hạ boss; EXP và Core Bit cộng phần chênh lệch cả khi thoát màn (không mất, không trùng). Hạ boss thì lần sau vào lại từ đầu màn. Vũ khí boss dùng được ở mọi màn. Màn xám (cổng Prototype) không đọc, không ghi bản lưu. Cài đặt điều khiển tạm giữ ở `cv.controls`, gộp vào bản lưu khi làm cloud.
- **Lỗi tìm thấy / đã sửa:** không có.
- **Kiểm tra:** `npm test` 231 test (thêm 15 ở `save.test.ts`), lint, format:check, build đều đạt. Chromium: qua checkpoint ở phòng thử màn chơi → Esc → tải lại trang → vào lại đúng checkpoint 1; bảng Dữ liệu lưu vừa màn 740 × 360, mã sai báo lỗi, gõ phím trong ô không lọt xuống menu; không có lỗi console.
- **Còn dở:** cloud save (Backend, xung đột hai thiết bị), các nhóm dữ liệu của module chưa làm (SP, kỹ năng, skin, nhiệm vụ, kỷ lục).
- **Tiếp theo:** (1) người dùng chơi thử Thorna/Golem và cổng Prototype 5 người; (2) code M10 HUD cơ bản, rồi TutorialManager.

## 2026-11-03: Hỏi đáp, việc tiếp theo trong kế hoạch

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng hỏi công việc tiếp theo trong kế hoạch.
- **Đã làm:** đọc mục nhật ký mới nhất và bảng lộ trình, trả lời. Không đổi code.
- **Kiểm tra:** không áp dụng (chỉ hỏi đáp).
- **Tiếp theo:** không đổi so với mục bên dưới: (1) người dùng chơi thử phòng Thorna/Golem và cổng Prototype 5 người; (2) code M11 lưu cục bộ, rồi M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Rút gọn kế hoạch, lưu trữ nhật ký cũ

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng yêu cầu rút gọn file kế hoạch và chuyển nhật ký cũ sang file lưu trữ để giảm token đầu phiên.
- **Đã làm:**
  - `01-Ke-hoach-lam-viec.md` rút từ khoảng 8,9 KB xuống khoảng 3,5 KB: giữ quy tắc chính và bảng lộ trình (cột trạng thái ngắn gọn); bỏ vòng lặp làm việc với ChatGPT, nhịp tuần, bảng rủi ro. Bản đầy đủ chuyển sang `luu-tru/01-Ke-hoach-lam-viec-ban-day-du.md`.
  - Nhật ký: 3 mục cũ (M6 Boss, hỏi đáp 2026-11-03, khung M7 2026-11-02) chuyển nguyên văn sang `luu-tru/06-Nhat-ky-phien-luu-tru.md`. File này thêm quy tắc giữ tối đa 3 mục, mỗi mục khoảng 15 dòng.
  - `CLAUDE.md`: thêm quy tắc lưu trữ, ghi rõ không đọc thư mục `luu-tru/` đầu phiên.
- **File chính:** `CLAUDE.md`, `04-Dev-Plan/01-Ke-hoach-lam-viec.md`, `04-Dev-Plan/06-Nhat-ky-phien.md`, `04-Dev-Plan/luu-tru/`.
- **Quyết định:** "plan.md" hiểu là `01-Ke-hoach-lam-viec.md` (repo không có file `plan.md`). Không đổi `game/CONTEXT.md` trong phiên này.
- **Kiểm tra:** chỉ đổi tài liệu, không đổi code; `npm run format:check` đạt.
- **Còn dở:** `game/CONTEXT.md` (khoảng 26 KB) là file lớn nhất được đọc đầu phiên, có thể rút gọn tiếp nếu người dùng muốn.
- **Tiếp theo** (giữ từ phiên M6):
  1. Người dùng: chơi thử phòng Thorna và Golem (phím B, G ở menu), ghi nhận xét để chỉnh `bosses.json`; chơi thử cổng Prototype với 5 người.
  2. Code: M11 lưu cục bộ (checkpoint, vật phẩm bí mật, Vine Lash đã nhận), M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Sprint 6, M6 Boss (Thorna + Bramble Golem)

- **Nhánh / commit:** `ccr-b2db3ef4-uu41jr`.
- **Mục tiêu:** người dùng đồng ý làm M6: Thorna thật theo đặc tả Prologue & Stage 1 mục 5 và mini-boss Bramble Golem.
- **Đã làm:**
  - Đổi `GrayBoss` thành `Boss` (`src/logic/boss/boss.ts`), dùng chung cho boss xám và Thorna. `bosses.json` → `attacks` khai đòn nào dùng đòn đó; đòn có trong danh sách pha mà thiếu dữ liệu thì báo lỗi khi nạp.
  - **Thorna** (`03-Data/bosses.json`): HP 100, 3 pha tại 60% / 30%, pha 3 nhanh hơn 20%. Gai Quạt (5 gai xòe 60° ngang tầm người), Dây Quất (hộp ngang sát sàn dài 6 ô, cắt ngắn khi sát tường), Rễ Trồi (3 cột rễ mọc lần lượt trái → phải, vết nứt báo trước), Hoa Nở (12 hạt rơi, 3 khe an toàn, rồi choáng 2 s). Đi chậm về phía người chơi khi nghỉ.
  - Thưởng tách khỏi điểm yếu: `weakness` Ember Burst, `reward` Vine Lash, `rewardExp` 120, `rewardCoreBit` 80 (cộng một lần ở lần thắng đầu, đọc qua `world.exp` / `world.coreBits`; HUD hiện cả phần của boss).
  - **Bramble Golem** (`enemies.json`, `behavior: golem`): 60 máu, pha 1 giậm đất 0,7 s → 2 sóng đất 15 sát thương; từ ≤ 50% máu thì tung 3 hạt nổ (10 sát thương), báo trước 0,5 s rồi lao 4 ô. Chạy trong phòng khóa như kẻ địch thường; rơi 60 EXP và Core Bit.
  - Kiểm tra dữ liệu mới: `reward` phải bằng `weaponGranted` và `weakness` bằng `bossWeakness` của màn; `miniBoss` của màn đã làm phải có trong `enemies.json`; telegraph của mọi đòn Golem ≥ 0,4 s.
  - Phòng thử: `thorna-room.ts` (đấu trường 24 × 12 ô, 3 bục cao 3 ô, menu phím B) và `golem-room.ts` (phòng khóa 20 ô, phím G). `StageDef.boss` chọn boss; scene không còn cứng boss xám.
  - Hiển thị: Thorna màu xanh lục với báo trước riêng từng đòn (vạch gai, vạch dây sát sàn, vết nứt vàng, cột hạt); Golem nhấp nháy cam khi báo trước, đỏ khi lao.
  - Tài liệu: `game/README.md`, `game/CONTEXT.md`, bảng sprint trong `01-Ke-hoach-lam-viec.md`.
- **File chính:** `game/src/logic/boss/boss.ts`, `rain.ts`, `enemy-projectile.ts`; `game/src/core/boss-config.ts`, `enemy-config.ts`, `game-config.ts`; `game/src/logic/enemy/behaviors.ts`; `game/src/stages/thorna-room.ts`, `golem-room.ts`; `game/tests/thorna.test.ts`, `golem.test.ts`; `03-Data/bosses.json`, `enemies.json`.
- **Quyết định:**
  - Gai Quạt báo trước 0,6 s thay vì 0,5 s của đặc tả: pha 3 tăng tốc 20% sẽ còn 0,5 s, vẫn đạt luật "đòn boss ≥ 0,5 s". Số này là `[PLACEHOLDER]`, chỉnh sau playtest.
  - Rễ Trồi nhắm quanh chỗ người chơi đứng lúc bắt đầu báo trước (3 cột cách 3 ô); Hoa Nở thưa hạt (12 hạt) nên có thêm chỗ né ngoài 3 khe bắt buộc.
  - Bramble Golem làm thành kẻ địch (không dùng lớp Boss) để tái dùng phòng khóa, EXP và Core Bit có sẵn.
  - Đấu trường Thorna 24 ô rộng hơn khung 20 ô nên camera đi theo Kai trong đấu trường.
- **Lỗi tìm thấy / đã sửa:** boss giữ vận tốc đi bộ của lúc nghỉ khi vào báo trước nên trượt trong lúc báo trước (test Dây Quất bắt được). Đã đặt vận tốc về 0 khi báo trước.
- **Kiểm tra:** `npm test` 216 test (thêm 24: `thorna.test.ts`, `golem.test.ts`), `npm run lint`, `npm run format:check`, `npm run build` đều đạt. Chạy bản build bằng Chromium: vào phòng Thorna (boss xanh, gai bay, thanh máu có vạch pha) và phòng Golem (cửa khóa, "Còn 1 kẻ địch"); không có lỗi console.
- **Còn dở / chưa làm:** thoại trước/sau trận của Thorna (cần hệ thống thoại), 1 SP (cần hệ thống cấp, M8), sprite, bản đồ thật phòng boss Stage 1 và đoạn C (làm bằng Tiled, chờ cổng Prototype), chưa chơi thử cảm giác với người thật (thời gian thắng 60–90 s mới đo bằng mô phỏng, chưa đo bằng người).
- **Tiếp theo:**
  1. Người dùng: chơi thử phòng Thorna và Golem (phím B, G ở menu) xem cảm giác khe né, thời gian báo trước, độ khó; ghi nhận xét để chỉnh `bosses.json`.
  2. Code: M11 lưu cục bộ (checkpoint, vật phẩm bí mật, Vine Lash đã nhận), M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Hỏi đáp, xác định việc tiếp theo

- **Nhánh / commit:** `ccr-b2db3ef4-uu41jr`.
- **Mục tiêu:** người dùng hỏi phần tiếp theo là gì.
- **Đã làm:** đọc mục nhật ký mới nhất (2026-11-02) và trả lời. Không đổi code.
- **Quyết định:** giữ nguyên lộ trình đã ghi ở mục "Tiếp theo" của phiên 2026-11-02.
- **Kiểm tra:** không áp dụng (không đổi code).
- **Tiếp theo:** (1) người dùng bật GitHub Pages và chơi thử cổng Prototype bằng bản build mới; (2) code M6 Thorna thật + Bramble Golem, rồi M11 lưu cục bộ, M10 HUD cơ bản, TutorialManager.

## 2026-11-02: Sprint 6, khung M7 Màn chơi

- **Nhánh:** `ccr-93d525c1-j97gfr` (từ `main` sau PR #5).
- **Mục tiêu:** đọc kế hoạch để chọn việc tiếp theo, rồi code Sprint 6 (tiếp Vertical slice), bắt đầu bằng M7 Màn chơi. Người dùng đặt quy tắc bắt buộc: mọi phiên phải tóm tắt và ghi lại những gì đã làm (đã đưa vào `CLAUDE.md` và file này).
- **Đọc kế hoạch:** Sprint 1–5 xong (M0–M5, boss xám, công cụ cổng Prototype, đo tự động đạt). Cổng Prototype **chưa** chơi thử với người thật (mục 7 của `05-Cong-Prototype.md` còn trống). Theo mục 6 của file đó, phần mã Vertical slice được làm song song; chỉ thiết kế màn Prologue/Stage 1 phải chờ qua cổng.
- **Đã làm:**
  - Bộ nạp bản đồ **Tiled JSON** (`src/logic/stage/tiled.ts`): lớp ô `ground`/`hazards`, thuộc tính ô `solid`/`oneway`/`hazard`, cờ lật trong gid, đối tượng theo Class (spawn, checkpoint, enemy, target, boss, gate, vine, room, secret, barrier, section), báo lỗi rõ ràng (tileset ngoài, base64, sai cỡ ô, thiếu spawn, Class lạ, thiếu thuộc tính).
  - `StageLayout` chung (`src/logic/stage/layout.ts`) cho cả ASCII và Tiled; `StageWorld` nhận `layout`; `EnemyField` nhận danh sách kẻ địch thay vì ký hiệu chữ.
  - Cơ chế màn (`src/logic/world/stage-mechanics.ts` + `stage-world.ts`): checkpoint (lưu khi đi qua, hồi sinh 1 s, giữ Core Bit/EXP, vào lại từ checkpoint đã lưu), **hố** (−20 máu, về checkpoint, hết máu mới tính chết), **gai** (−30 máu, về chỗ đứng an toàn, bất tử, Spike Guard miễn nhiễm), **dây leo đu** (con lắc 2,4 s, lệch 3 ô, bệ chở người, nhảy khỏi bệ +10%, Xuống + Nhảy rơi xuyên), **phòng khóa** (đóng cửa khi vào, đếm kẻ địch còn lại, mở khi hạ hết, chết thì mở lại), **vật chắn** chỉ vỡ bằng đúng vũ khí, **vật phẩm bí mật**.
  - Vật lý Kai: hỗ trợ bệ di động (`Platform`) và `hitHazard`.
  - Dữ liệu: `03-Data/stages.json` thêm `mechanics` (mọi con số M7), có kiểm tra: hồi sinh ≤ 1,5 s, gai/hố không giết ngay Kai cấp 1 ở độ khó nặng nhất, dây không ngắn hơn biên độ.
  - Hiển thị: vẽ gai, cờ checkpoint, dây leo, cửa phòng khóa, vật chắn, bí mật; HUD "Còn N kẻ địch"; thông báo checkpoint/nhặt đồ; camera khóa trong phòng khóa.
  - **Phòng thử màn chơi** (menu, phím M): bản đồ Tiled `game/maps/m7-test.json` sinh từ bản phác `maps/src/m7-test.map.json` bằng script mới `scripts/ascii-to-tiled.mjs` (tạo kèm tileset xám PNG).
  - Tài liệu: `game/maps/README.md` (quy ước làm bản đồ Tiled), `game/README.md`, `game/CONTEXT.md`, bảng sprint trong `01-Ke-hoach-lam-viec.md`, lưu ý bản build trong `05-Cong-Prototype.md`, `CLAUDE.md` (quy tắc phiên).
- **Quyết định:**
  - Rơi hố không còn là chết (theo đặc tả Stage 1 mục 3): `world.falls` đếm riêng; nhật ký chơi thử vẫn tính rơi hố là một lần hỏng ở đoạn đó để so sánh được với số liệu cũ.
  - Sát thương gai/hố nhân `damageTaken` của độ khó như đòn kẻ địch.
  - Bất tử khi lướt không cứu khỏi gai; đang bất tử sau cú đánh thì chạm gai chỉ bị đưa về, không mất máu.
  - Bản đồ Tiled phải nhúng tileset và lưu lớp ô dạng CSV (đơn giản, dễ đọc diff).
  - Thắng boss rồi ra khỏi phòng thì về checkpoint cuối, không về điểm xuất phát.
- **Lỗi tìm thấy / đã sửa:** **lỗi chết lặp có từ Sprint 3–5**: sau lần chết đầu tiên, sự kiện "chết" cũ còn trong `PlayerPhysics.events` nên Kai hồi sinh rồi chết lại mãi (đã tái hiện trên bản cũ: 7 lần chết trong 400 bước sau một cú đánh). Sửa: `respawn()` xóa sự kiện; thêm test. Bản build trên Pages trước bản này có lỗi đó, đã ghi chú trong `05-Cong-Prototype.md`.
- **Kiểm tra:** `npm test` 192/192 (thêm 20 test ở `tests/stage-mechanics.test.ts` và 1 test hồi sinh), `npm run lint`, `npm run format:check`, `npm run build` đều đạt. Chạy bản build bằng Chromium: vào phòng thử màn chơi, xem dây leo, phòng khóa (khóa cửa, khóa camera, đếm 2 kẻ địch), vật chắn và bí mật; không có lỗi console.
- **Còn dở / chưa làm của M7:** bản đồ thật Prologue và Stage 1 (chờ qua cổng Prototype), thang và dây leo đứng yên (cần leo trèo, thuộc M3), bệ dây di chuyển (đoạn B), lớp parallax, lưu checkpoint và vật phẩm bí mật (M11), Bramble Golem.
- **Tiếp theo:**
  1. Người dùng: bật GitHub Pages và chạy đợt chơi thử cổng Prototype với bản build mới (đã sửa lỗi chết lặp).
  2. Code: M6 Thorna thật (khung 3 pha đã có từ boss xám) + Bramble Golem, rồi M11 lưu cục bộ (checkpoint, vật phẩm bí mật), M10 HUD cơ bản, TutorialManager.
