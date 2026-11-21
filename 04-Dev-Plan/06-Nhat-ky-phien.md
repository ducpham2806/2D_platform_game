# Nhật ký phiên làm việc

Quy tắc bắt buộc (xem `CLAUDE.md`): cuối mỗi phiên thêm một mục mới lên **đầu** danh sách bên dưới.

Để giảm token đầu phiên:

- File này chỉ giữ **tối đa 3 mục mới nhất**. Khi thêm mục mới mà vượt 3, chuyển mục cũ nhất lên đầu `04-Dev-Plan/luu-tru/06-Nhat-ky-phien-luu-tru.md` (không sửa nội dung).
- Mỗi mục ngắn gọn, khoảng 15 dòng: chi tiết kỹ thuật thuộc về commit và `game/CONTEXT.md`, không chép lại ở đây.
- Mục "Tiếp theo" của mục mới nhất là nơi phiên sau bắt đầu.

Mẫu:

```
## YYYY-MM-DD: <tiêu đề ngắn>
- Nhánh / commit:
- Mục tiêu:
- Đã làm:
- File chính:
- Quyết định:
- Lỗi tìm thấy / đã sửa:
- Kiểm tra: test, lint, format, build, chạy thử
- Còn dở / chưa làm:
- Tiếp theo:
```

---

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
