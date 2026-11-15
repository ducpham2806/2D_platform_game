# EP-15: Stage 2–4 trước cổng

- **Mốc:** S10–S14 (`01-Ke-hoach-lam-viec.md`). Phần không đụng `player-physics` của `01-GDD/16-Dac-ta-Stage2-4-nhap.md` mục 10; danh sách Story, phụ thuộc và cỡ ở đó. ST-15-07, 08b, 11, 12 chờ cổng G1.
- **Không đụng bản thử G1:** code ở nhánh làm việc, chỉ merge vào `main` sau đợt thử G1.

| Mã | Tên | Phụ thuộc | Cỡ | Trạng thái |
| --- | --- | --- | --- | --- |
| ST-15-14 | Boss an toàn: chống khóa choáng (QB-14), kẹp pha khi một đòn vượt hai ngưỡng (QB-31); áp cả Thorna | (01a chỉ để có boss Stage 2; phần luật làm trước được) | 1 ngày | Đang làm |
| ST-15-01a | Dữ liệu Stage 2 và khung kiểm tra chung | — | 1 ngày | Chưa |
| ST-15-02 | Laser, gương, cảm biến ánh sáng | 01a | 2 ngày | Chưa |

## ST-15-14: Boss an toàn (QB-14, QB-31)

- **Thuộc Epic:** EP-15 · **Ưu tiên:** P1 (điều kiện của mọi vũ khí khắc chế Stage 2–4) · **Phụ thuộc:** không (GDD 16 ghi 01a vì boss Stage 2; luật chung làm trước và áp cho Thorna)
- **Bằng chứng:** [ ] Logic (Vitest, tên test mang mã QB) [ ] Config (`bosses.json → rules`) [ ] Visual (không có thay đổi hình; boss đứng yên 0,6 s khi kẹp pha là hiếm, kiểm bằng test)

### 1. User Story

> **Là** người chơi cầm vũ khí khắc chế bắn nhanh, **tôi muốn** boss vẫn ra đòn giữa các lần choáng, **để** trận đấu không biến thành đứng bắn một chỗ; **và** khi một đòn rất mạnh làm boss tụt nhiều máu, **tôi muốn** vẫn thấy từng pha của boss, không bỏ qua pha nào.

### 2. Bối cảnh (nhúng)

- **QB-14:** trúng điểm yếu vẫn ×2,5 sát thương, nhưng sau khi hết choáng thì `weakStunCooldownSec` (1,5 s) không choáng lại được. Choáng không xóa hạt Hoa Nở đã thả.
- **QB-31:** một đòn vượt qua hai ngưỡng pha: máu kẹp ở ngưỡng kế tiếp; boss bất tử `phaseShiftSec` (0,6 s) để đổi pha và xóa đạn boss.
- GDD 16 mục 2.3, 3.7: hồi bắn 0,3–0,4 s ngắn hơn `weakStunSec` 0,5 s, nên bắn liên tục khóa choáng boss. Tham số chung ở `bosses.json` (`17-Quy-tac-bien.md` mục 16).
- GDD 12 (âm thanh): `boss.phase` phát một lần dù một đòn vượt hai ngưỡng; lớp nhạc theo pha sau khi kẹp.
- **Code hiện tại** (`logic/boss/boss.ts`): `takeHit` đặt `stun = max(stun, stunSec)`, nên mỗi phát trúng điểm yếu trong lúc choáng **làm mới** choáng; không có hồi choáng; không kẹp máu theo pha.

### 3. Quyết định

- Dữ liệu `bosses.json → rules { weakStunCooldownSec: 1.5, phaseShiftSec: 0.6 }`, dùng chung mọi boss (kể cả bản Thử thách). `parseBosses` bỏ qua khóa `rules` khi đọc boss và gắn `rules` vào từng `BossData`.
- **Choáng (QB-14):** chỉ bắt đầu choáng khi boss **không** đang choáng và hết hồi choáng. Trúng điểm yếu trong lúc choáng không làm mới choáng (nếu không, bắn nhanh hơn 0,5 s vẫn khóa được). Hết choáng thì đếm hồi choáng; hồi choáng chỉ trôi khi trận chạy (boss bước). Sát thương ×2,5 giữ nguyên trong mọi trường hợp. Choáng không đụng tới đạn trong `ProjectilePool` (hạt Hoa Nở đã thả vẫn rơi).
- **Kẹp pha (QB-31):** trong `takeHit`, nếu máu sau đòn rơi vào pha cách pha hiện tại từ 2 trở lên thì máu = ngưỡng kế tiếp (đúng `untilHpPct` của pha hiện tại, nên boss sang đúng pha kế). Kể cả đòn từ pha đầu xuống 0: boss không chết mà dừng ở ngưỡng đầu. Khi kẹp: boss bất tử `phaseShiftSec`, đứng yên (đồng hồ đòn dừng như choáng), bỏ đòn đang dở (về `idle`), và ở bước kế xóa mọi đạn boss trong pool (đạn `owner: 'enemy'` không có `source`; đạn của kẻ địch thường giữ nguyên). Vượt đúng một ngưỡng thì như cũ (không kẹp, không bất tử), để không đổi cân bằng Thorna.
- Trong lúc bất tử, đạn của Kai trúng boss thì mất (như trúng khiên, `ev.blocked`), không gây sát thương, không choáng; nổ lan V2 không gây sát thương lên boss.

### 4. Tiêu chí nghiệm thu

1. Test QB-14: bắn điểm yếu mỗi 0,3 s trong 6 s: boss có các khoảng không choáng ≥ 1,5 s và vẫn ra đòn; mỗi phát vẫn ×2,5; trúng trong lúc choáng không kéo dài choáng; hạt Hoa Nở đã thả còn trong pool sau khi choáng.
2. Test QB-31: một đòn từ 100% xuống 20% (Thorna, ngưỡng 60/30): máu = 60%, pha 1, `phaseChanged` một lần, bất tử 0,6 s (đòn tiếp theo không trừ máu, đạn bị chặn), đạn boss bị xóa, đạn kẻ địch thường còn; hết 0,6 s thì nhận sát thương lại. Một đòn từ 100% xuống 50% (vượt một ngưỡng): không kẹp, không bất tử. Đòn chí mạng từ pha đầu xuống 0: không chết, kẹp 60%.
3. `core/boss-config.ts` kiểm `rules` (`weakStunCooldownSec` ≥ 0, `phaseShiftSec` ≥ 0 và ≤ 2); test lỗi dữ liệu.
4. Test cũ (Thorna, boss xám, mô phỏng DPS, `gate-flow`) đạt nguyên.

### 5. File

- Sửa: `03-Data/bosses.json`, `game/src/core/boss-config.ts`, `game/src/logic/boss/boss.ts`, `game/src/logic/combat/projectiles.ts` (xóa đạn theo điều kiện), `game/src/logic/world/hits.ts`, `01-GDD/17-Quy-tac-bien.md` (QB-14, 31), `01-GDD/16-Dac-ta-Stage2-4-nhap.md` (bảng Story), `game/docs/quyet-dinh/` (boss).
- Tạo: `game/tests/boss-safety.test.ts`.
