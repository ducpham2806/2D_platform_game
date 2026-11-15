# EP-15: Stage 2–4 trước cổng

- **Mốc:** S10–S14 (`01-Ke-hoach-lam-viec.md`). Phần không đụng `player-physics` của `01-GDD/16-Dac-ta-Stage2-4-nhap.md` mục 10; danh sách Story, phụ thuộc và cỡ ở đó. ST-15-07, 08b, 11, 12 chờ cổng G1.
- **Không đụng bản thử G1:** code ở nhánh làm việc, chỉ merge vào `main` sau đợt thử G1.

| Mã        | Tên                                                                                                | Phụ thuộc                                              | Cỡ     | Trạng thái        |
| --------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------ | ----------------- |
| ST-15-14  | Boss an toàn: chống khóa choáng (QB-14), kẹp pha khi một đòn vượt hai ngưỡng (QB-31); áp cả Thorna | (01a chỉ để có boss Stage 2; phần luật làm trước được) | 1 ngày | DONE (15/11/2026) |
| ST-15-01a | Dữ liệu Stage 2 và khung kiểm tra chung                                                            | —                                                      | 1 ngày | Chưa              |
| ST-15-02  | Laser, gương, cảm biến ánh sáng                                                                    | 01a                                                    | 2 ngày | Chưa              |

## ST-15-14: Boss an toàn (QB-14, QB-31)

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 (điều kiện của mọi vũ khí khắc chế Stage 2–4) · **Trạng thái:** DONE (15/11/2026) · **Phụ thuộc:** không (GDD 16 ghi 01a vì boss Stage 2; luật chung làm trước và áp cho Thorna)
- **Bằng chứng:** [x] Logic (`tests/boss-safety.test.ts`, 16 test mang mã QB) [x] Config (`bosses.json → rules`) [x] Visual (boss trắng lúc bất tử đổi pha, `04-Dev-Plan/qa/ST-15-14/`)

### 1. User Story

> **Là** người chơi cầm vũ khí khắc chế bắn nhanh, **tôi muốn** boss vẫn ra đòn giữa các lần choáng, **để** trận đấu không biến thành đứng bắn một chỗ; **và** khi một đòn rất mạnh làm boss tụt nhiều máu, **tôi muốn** vẫn thấy từng pha của boss, không bỏ qua pha nào.

### 2. Bối cảnh (nhúng)

- **QB-14:** trúng điểm yếu vẫn ×2,5 sát thương, nhưng sau khi hết choáng thì `weakStunCooldownSec` (1,5 s) không choáng lại được. Choáng không xóa hạt Hoa Nở đã thả.
- **QB-31:** một đòn vượt qua hai ngưỡng pha: máu kẹp ở ngưỡng kế tiếp; boss bất tử `phaseShiftSec` (0,6 s) để đổi pha và xóa đạn boss.
- GDD 16 mục 2.3, 3.7: hồi bắn 0,3–0,4 s ngắn hơn `weakStunSec` 0,5 s, nên bắn liên tục khóa choáng boss. Tham số chung ở `bosses.json` (`17-Quy-tac-bien.md` mục 16).
- GDD 12 (âm thanh): `boss.phase` phát một lần dù một đòn vượt hai ngưỡng; lớp nhạc theo pha sau khi kẹp.
- **Code hiện tại** (`logic/boss/boss.ts`): `takeHit` đặt `stun = max(stun, stunSec)`, nên mỗi phát trúng điểm yếu trong lúc choáng **làm mới** choáng; không có hồi choáng; không kẹp máu theo pha.

### 3. Quyết định (sau duyệt Technical Director 15/11, "Duyệt kèm sửa", 8 điểm bắt buộc đã áp)

- Dữ liệu `bosses.json → rules { weakStunCooldownSec: 1.5 (≤ 5), phaseShiftSec: 0.6 (≤ 2) }`, dùng chung mọi boss (kể cả bản Thử thách, bản nhân máu theo độ khó). `parseBosses` bỏ qua khóa `rules` khi đọc boss và gắn `rules` vào từng `BossData`.
- **Choáng (QB-14):** chỉ bắt đầu choáng khi boss **không đang choáng** (cả choáng điểm yếu lẫn choáng sau Mưa đạn, Hoa Nở; duyệt điểm 1: trước đó trúng điểm yếu lúc choáng sau Hoa Nở kéo dài khoảng hở thêm 0,5 s) và hết hồi choáng. Trúng trong lúc choáng không làm mới choáng. Hết choáng thì đếm hồi choáng; hồi choáng chỉ trôi ở bước boss chạy bình thường. Sát thương ×2,5 giữ nguyên. Choáng không đụng tới đạn trong pool (hạt Hoa Nở đã thả vẫn rơi).
- **Kẹp pha (QB-31):** trong `takeHit`, so máu sau đòn với **pha đang chơi** (`this.phase`, chỉ đổi ở `step`). **Chết tính là pha sau pha cuối** (duyệt điểm 2), nên đòn chí mạng ở pha áp chót cũng kẹp; ở pha cuối thì chết bình thường. Rơi cách pha đang chơi từ 2 trở lên thì máu = min(máu hiện có, ngưỡng kết thúc pha đang chơi × (1 − 1e-12)): boss sang đúng pha kế, không bao giờ hồi máu. Hai đòn cùng bước 100 → 55 → 25: đòn sau gây 0 và kẹp (duyệt điểm 3). Khi kẹp: bất tử `phaseShiftSec`, đứng yên, vẽ trắng suốt (gợi ý duyệt: người chơi thấy vì sao đạn không vào), bỏ đòn đang dở (về `idle`; xóa vệt Rễ Đuổi, cột rễ, cột mưa). `StageWorld` xóa mọi đạn boss (`owner: 'enemy'` không có `source`) **ngay trong bước đó**, sau khi xử lý đạn Kai và trước khi xét đòn lên Kai. Vượt đúng một ngưỡng thì như cũ (không đổi cân bằng Thorna).
- Trong lúc bất tử, đạn của Kai trúng boss thì mất, phát **`ev.bossImmune`** (duyệt điểm 4: không dùng `blocked`, vì hướng dẫn S06 đếm `blocked` là thất bại ở khiên và âm "keng" dùng để dạy khiên), không sát thương, không choáng, không Trừng Phạt; nổ lan V2 không trừ máu boss.
- **Đo lường** (duyệt điểm 6): `dmg` của `boss_end` ghi máu boss thật bị trừ: đòn kẹp chỉ tính tới ngưỡng, phần thừa của đòn kết liễu không tính (trước đây có). Ghi ở GDD 13.
- **Bản thử G1** (duyệt điểm 7): bản sau thay đổi này khác `gate-r1` ở trận đấu lại boss xám bằng Vine Lash (hồi 0,35 s < choáng 0,5 s: trước đây khóa choáng mãi). Đợt thử dùng bản Pages = `gate-r1`; ghi ở `05-Cong-Prototype.md` mục 3.
- **Chưa làm** (gợi ý duyệt, để mô phỏng ST-15-10…12 quyết): hit-stop 3 bước và rung khi trúng điểm yếu vẫn chạy ở mọi phát trong lúc hồi choáng (vũ khí 0,3 s thì khoảng 17% thời gian dừng hình).

### 4. Tiêu chí nghiệm thu

1. [x] Test QB-14: bắn điểm yếu mỗi 0,3 s trong 6 s: có khoảng không choáng ≥ 1,5 s, boss vẫn ra đòn, máu trừ đủ; trúng lúc choáng không kéo dài; hồi choáng rồi choáng lại; ×`damageVsWeak`; hạt Hoa Nở còn; trúng điểm yếu lúc choáng sau Hoa Nở không kéo dài khoảng hở.
2. [x] Test QB-31: 100% → 20%: kẹp 60%, pha 2 báo một lần, bất tử đúng 0,6 s, hết thì nhận sát thương; vượt một ngưỡng: không kẹp; đòn chí mạng ở pha đầu, pha áp chót kẹp, pha cuối chết; hai đòn cùng bước; máu ×0,8 / ×1 / ×1,25; Thử thách đang đánh dấu Rễ Đuổi thì bỏ vệt; hồi choáng và bất tử không ảnh hưởng nhau; đạn Kai lúc bất tử: `bossImmune` không `blocked`, không Trừng Phạt, nổ lan V2 không trừ máu, đo lường = máu thật bị trừ; trong StageWorld: đạn boss đè lên Kai bị xóa ngay bước kẹp (Kai không mất máu), đạn kẻ địch thường còn, `bossPhaseChanged` một lần.
3. [x] `core/boss-config.ts` kiểm `rules`; test lỗi dữ liệu.
4. [x] Test cũ đạt, trừ một test cố ý dùng đòn từ pha đầu xuống 0 (`tests/boss.test.ts`, "hết máu"): sửa cho boss vào pha cuối trước. Mô phỏng DPS (`power-cap.test.ts`) và `gate-flow` đạt.
5. [x] Chạy thử Chromium: phòng Thorna, một đòn 80% máu: thanh máu dừng 60%, "pha 2", boss trắng 0,6 s rồi trở lại; 0 lỗi console.

### 5. File

- Sửa: `03-Data/bosses.json`, `game/src/core/boss-config.ts`, `game/src/logic/boss/boss.ts`, `game/src/logic/combat/projectiles.ts` (`removeWhere`), `game/src/logic/world/{hits,stage-world,world-types}.ts` (`bossImmune`), `game/src/scenes/stage/stage-renderer.ts` (trắng lúc bất tử), `game/tests/boss.test.ts`, `01-GDD/17-Quy-tac-bien.md` (QB-14, 31, mục 16), `01-GDD/16-Dac-ta-Stage2-4-nhap.md`, `01-GDD/13-Do-luong-MVP.md` (`dmg`), `04-Dev-Plan/05-Cong-Prototype.md`, `game/docs/quyet-dinh/ke-dich-boss.md`.
- Tạo: `game/tests/boss-safety.test.ts`, `04-Dev-Plan/qa/ST-15-14/`.
