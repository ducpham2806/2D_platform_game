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

