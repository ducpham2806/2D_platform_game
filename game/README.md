# Cyber Vanguard: mã nguồn game

Phaser 3 + TypeScript + Vite. Tài liệu thiết kế ở thư mục gốc repo (`01-GDD/`, `03-Data/`, `04-Dev-Plan/`); kiến trúc và trạng thái module ở [`CONTEXT.md`](CONTEXT.md).

## Chạy thử

Cần Node 20 trở lên.

```
cd game
npm install
npm run dev
```

Mở http://localhost:5173. Bản đã đăng: https://ducpham2806.github.io/2D_platform_game/ (sau khi bật GitHub Pages, xem `04-Dev-Plan/05-Cong-Prototype.md`). Màn hình chính có sáu lựa chọn:

- **Vào màn thử:** màn xám thử cảm giác điều khiển và chiến đấu, dài 96 ô: bia tập bắn, khe 2 ô, bậc cao 1/3/4 ô, bia có khiên (phải bắn nạp đầy), bục một chiều, giếng 8 ô phải nhảy tường, hành lang trần thấp, hố 5 ô phải lướt + nhảy, rồi **phòng boss** (cửa đóng khi vào). Kai và mọi thứ vẫn là khối giữ chỗ:
  - Kai đổi màu theo trạng thái (xanh: đứng/chạy, vàng: lướt, tím: bám tường, đỏ: bị đánh); viền xanh khi nạp vừa, nhấp nháy vàng trắng khi nạp đầy.
  - Boss nhấp nháy cam khi báo trước đòn (telegraph), kèm chỉ dẫn: làn đạn đứt nét (Bắn thẳng), tam giác chỗ đáp (Nhảy đập), cột đỏ mờ là chỗ đạn sẽ rơi (Mưa đạn, chỗ không có cột là khe an toàn). Boss đỏ khi đang ra đòn, xanh nhạt khi bị choáng.
  - Thắng boss lần đầu nhận **Vine Lash** (roi quét 4 ô). Ra khỏi phòng rồi vào lại để đấu lại: Vine Lash là điểm yếu của boss.
  - Phím: A/D hoặc ←/→ di chuyển, K nhảy (giữ lâu nhảy cao), J bắn (giữ để nạp, thả để bắn đạn nạp), L lướt, Q/E đổi vũ khí, S/↓ + K rơi xuyên bục, Esc quay lại. Tay cầm và cảm ứng như màn Điều khiển. Bản dev (hoặc `?debug=1`): phím T gây 10 sát thương thử, góc dưới trái hiện FPS.
  - Thắng boss lần đầu trong một lần vào màn thì game hỏi phiếu chấm cảm giác Nhảy / Lướt / Bắn (1–5).
  - Bản dev (hoặc `?tune=1`): nút **Chỉnh** ở giữa trên cùng, hoặc F2, mở bảng chỉnh cảm giác (thanh trượt cho tốc độ, nhảy, lướt, nhảy tường, Arc Cannon, boss).
- **Phòng thử kẻ địch:** 5 loại kẻ địch của Prologue và Stage 1, mỗi đoạn một loại rồi trộn ở cuối. Drone Lính bản Prologue viền xanh là vô hại (chỉ đẩy lùi). Lính Kén có khiên phía trước: bắn sau lưng, hoặc 2 phát nạp đầy để phá khiên. Hạ kẻ địch rơi Core Bit (viên vàng, phải nhặt) và đôi khi viên máu; góc phải trên đếm Core Bit và EXP.
- **Phòng thử màn chơi (M7, phím M):** bản đồ làm bằng Tiled (`maps/m7-test.json`). Gai đỏ: chạm vào mất 30 máu và về chỗ đứng an toàn. Hố: rơi xuống mất 20 máu và về checkpoint (cờ, chuyển xanh khi chạm). Hai dây leo đu ngược pha bắc qua hố gai: đứng lên bệ xanh để được chở, nhảy khỏi bệ cao hơn nhảy thường, S/↓ + K để rơi xuyên. Phòng khóa: vào hẳn bên trong thì cửa đóng, góc phải trên đếm kẻ địch còn lại, hạ hết thì cửa mở. Cuối màn: vách nâu vỡ bằng Arc Cannon (sau đó là Nano Cell, viên xanh), rễ khô thứ hai cần Prism Beam (chưa có) chắn Két giáp. Cách làm bản đồ: `maps/README.md`.
- **Hub Arkon:** khung menu.
- **Điều khiển:** đổi phím bàn phím, đổi nút tay cầm, và mở chế độ kéo thả bố cục nút cảm ứng.
- **Kết quả chơi thử:** tổng hợp nhật ký chơi thử trên máy (theo thiết bị, chết theo đoạn, chỗ bỏ cuộc, điểm cảm giác) và dấu hiệu "hỏng" theo GDD 17; sao chép JSON để gửi, gộp nhật ký của người khác, xóa dữ liệu.

**Thử cảm ứng trên máy tính:** mở DevTools của Chrome, bật chế độ thiết bị (Ctrl+Shift+M), chọn một điện thoại và xoay ngang, rồi tải lại trang. Nút cảm ứng hiện khi vào màn thử và chạm vào màn hình. Thử thật trên điện thoại: chạy `npm run dev -- --host` rồi mở địa chỉ mạng LAN in ra trên điện thoại cùng mạng Wi-Fi.

## Kiểm tra

```
npm test              # Vitest: scale, bước cố định, event bus, tính nhất quán của 03-Data
npm run lint          # ESLint
npm run format:check  # Prettier
npm run build         # typecheck + build vào dist/
npm run gate-check    # đo cổng Prototype trên bản build: dung lượng, FPS, độ trễ (cần Playwright)
```

CI (`.github/workflows/ci.yml`) chạy các lệnh trên (trừ `gate-check`) cho mỗi pull request. `.github/workflows/pages.yml` đăng bản build lên GitHub Pages mỗi khi `main` thay đổi.

## Dữ liệu

Không sửa `public/data/`. Sửa số liệu trong `../03-Data/*.json`; `npm run dev` và `npm run build` tự chép sang. Nếu dữ liệu sai kiểu hoặc lệch nhau giữa các file (ví dụ phá vòng khắc chế), test sẽ báo đỏ và game dừng ở màn tải với thông báo lỗi.
