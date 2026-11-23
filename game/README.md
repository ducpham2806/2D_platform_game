# Cyber Vanguard: mã nguồn game

Phaser 3 + TypeScript + Vite. Tài liệu thiết kế ở thư mục gốc repo (`01-GDD/`, `03-Data/`, `04-Dev-Plan/`); kiến trúc và trạng thái module ở [`CONTEXT.md`](CONTEXT.md).

## Chạy thử

Cần Node 20 trở lên.

```
cd game
npm install
npm run dev
```

Mở http://localhost:5173. Bản đã đăng: https://ducpham2806.github.io/2D_platform_game/ (sau khi bật GitHub Pages, xem `04-Dev-Plan/05-Cong-Prototype.md`). Màn hình chính (dòng dưới tên game tóm tắt bản lưu: boss đã hạ, Core Bit, EXP) có các lựa chọn:

- **Vào màn thử:** màn xám thử cảm giác điều khiển và chiến đấu, dài 96 ô: bia tập bắn, khe 2 ô, bậc cao 1/3/4 ô, bia có khiên (phải bắn nạp đầy), bục một chiều, giếng 8 ô phải nhảy tường, hành lang trần thấp, hố 5 ô phải lướt + nhảy, rồi **phòng boss** (cửa đóng khi vào). Kai và mọi thứ vẫn là khối giữ chỗ:
  - Kai đổi màu theo trạng thái (xanh: đứng/chạy, vàng: lướt, tím: bám tường, đỏ: bị đánh); viền xanh khi nạp vừa, nhấp nháy vàng trắng khi nạp đầy.
  - Boss nhấp nháy cam khi báo trước đòn (telegraph), kèm chỉ dẫn: làn đạn đứt nét (Bắn thẳng), tam giác chỗ đáp (Nhảy đập), cột đỏ mờ là chỗ đạn sẽ rơi (Mưa đạn, chỗ không có cột là khe an toàn). Boss đỏ khi đang ra đòn, xanh nhạt khi bị choáng.
  - Thắng boss lần đầu nhận **Vine Lash** (roi quét 4 ô). Ra khỏi phòng rồi vào lại để đấu lại: Vine Lash là điểm yếu của boss.
  - Phím: A/D hoặc ←/→ di chuyển, K nhảy (giữ lâu nhảy cao), J bắn (giữ để nạp, thả để bắn đạn nạp), L lướt, Q/E đổi vũ khí, S/↓ + K rơi xuyên bục, Esc tạm dừng (menu: Tiếp tục, Thoát về menu bấm hai lần). Tay cầm và cảm ứng như màn Điều khiển. Bản dev (hoặc `?debug=1`): phím T gây 10 sát thương thử, góc dưới trái hiện FPS.
  - Thắng boss lần đầu trong một lần vào màn thì game hỏi phiếu chấm cảm giác Nhảy / Lướt / Bắn (1–5).
  - Bản dev (hoặc `?tune=1`): nút **Chỉnh** ở giữa trên cùng, hoặc F2, mở bảng chỉnh cảm giác (thanh trượt cho tốc độ, nhảy, lướt, nhảy tường, Arc Cannon, boss).
- **Phòng thử kẻ địch:** 5 loại kẻ địch của Prologue và Stage 1, mỗi đoạn một loại rồi trộn ở cuối. Drone Lính bản Prologue viền xanh là vô hại (chỉ đẩy lùi). Lính Kén có khiên phía trước: bắn sau lưng, hoặc 2 phát nạp đầy để phá khiên. Hạ kẻ địch rơi Core Bit (viên vàng, phải nhặt) và đôi khi viên máu; góc phải trên đếm Core Bit và EXP.
- **Boss Thorna (M6, phím B):** đoạn dẫn ngắn rồi cửa vào đấu trường 24 × 12 ô có 3 bục cao 3 ô; Thorna (xanh lục) đứng bên phải, đi chậm về phía bạn. Pha 1 (100–60%): Gai Quạt (5 gai xòe 60°, thân sáng, vạch đỏ báo hướng) và Dây Quất (vạch đỏ sát sàn dài 6 ô, nhảy hoặc đứng bục). Pha 2 (60–30%) thêm Rễ Trồi (3 vết nứt vàng trên sàn, rễ mọc lần lượt trái sang phải). Pha 3 (dưới 30%) nhanh hơn 20% và thêm Hoa Nở (cột cảnh báo đỏ, 3 khe an toàn rộng 2 ô; sau đó Thorna choáng 2 giây). Thắng lần đầu nhận Vine Lash, 120 EXP, 80 Core Bit; đấu lại thì Ember Burst mới là điểm yếu.
- **Mini-boss Bramble Golem (M6, phím G):** phòng khóa 20 ô; vào hẳn bên trong thì cửa đóng. Pha 1: giậm đất (nhấp nháy cam 0,7 s) rồi sóng đất chạy ra hai bên. Dưới 50% máu: tung 3 hạt nổ lên cao rơi quanh mình, báo trước rồi lao 4 ô. Hạ xong cửa mở, nhận 60 EXP và Core Bit.
- **Phòng thử màn chơi (M7, phím M):** bản đồ làm bằng Tiled (`maps/m7-test.json`). Gai đỏ: chạm vào mất 30 máu và về chỗ đứng an toàn. Hố: rơi xuống mất 20 máu và về checkpoint (cờ, chuyển xanh khi chạm). Hai dây leo đu ngược pha bắc qua hố gai: đứng lên bệ xanh để được chở, nhảy khỏi bệ cao hơn nhảy thường, S/↓ + K để rơi xuyên. Phòng khóa: vào hẳn bên trong thì cửa đóng, góc phải trên đếm kẻ địch còn lại, hạ hết thì cửa mở. Cuối màn: vách nâu vỡ bằng Arc Cannon (sau đó là Nano Cell, viên xanh), rễ khô thứ hai cần Prism Beam (chưa có) chắn Két giáp. Cách làm bản đồ: `maps/README.md`.
- **Hub Arkon:** khung menu.
- **Điều khiển:** đổi phím bàn phím, đổi nút tay cầm, và mở chế độ kéo thả bố cục nút cảm ứng.
- **HUD (M10):** máu trái trên, năng lượng vũ khí boss dưới máu, máu boss giữa trên (vạch trắng là ngưỡng đổi pha), Core Bit và EXP góc phải, ô vũ khí góc phải dưới. Trên cảm ứng, nút vuông ghi tên vũ khí là biểu tượng vũ khí: chạm để sang vũ khí sau, vuốt sang trái để về vũ khí trước; nút II để tạm dừng.
- **Hướng dẫn (NOVA):** ở các phòng thử (không có ở màn xám), lời NOVA hiện ở hộp giữa trên khi gặp tình huống mới: bám tường lần đầu, dây leo, chạm gai, phòng bí mật, phòng khóa, gặp Lính Kén, Bramble Golem, vào phòng boss Thorna, nhận và thử Vine Lash. Làm đúng thì hộp tự tắt; vướng lâu hoặc thất bại nhiều lần thì hiện gợi ý (viền vàng, nút cảm ứng cần bấm nhấp nháy). Mỗi bước chỉ hiện một lần (được lưu); tắt/bật ở menu tạm dừng. Muốn xem lại từ đầu: "Dữ liệu lưu" → Xóa dữ liệu.
- **Dữ liệu lưu (M11, phím S):** game tự lưu trên máy (IndexedDB) khi qua checkpoint, nhặt vật phẩm bí mật, hạ boss và khi thoát màn. Thoát giữa màn rồi vào lại thì tiếp tục ở checkpoint đã lưu (thắng boss thì lần sau vào lại từ đầu màn); vũ khí boss đã nhận có sẵn ở mọi màn, bí mật đã nhặt không hiện lại, Core Bit/EXP cộng dồn. Bảng này hiện tóm tắt, **mã sao lưu** (chép sang máy khác rồi dán vào ô "Nhập mã"), và nút xóa tiến trình (bấm hai lần). Màn xám (cổng Prototype) không đọc, không ghi bản lưu để các phiên chơi thử so sánh được.
- **Kết quả chơi thử:** tổng hợp nhật ký chơi thử trên máy (theo thiết bị, chết theo đoạn, chỗ bỏ cuộc, điểm cảm giác) và dấu hiệu "hỏng" theo GDD 17; sao chép JSON để gửi, gộp nhật ký của người khác, xóa dữ liệu.

**Thử cảm ứng trên máy tính:** mở DevTools của Chrome, bật chế độ thiết bị (Ctrl+Shift+M), chọn một điện thoại và xoay ngang, rồi tải lại trang. Nút cảm ứng hiện khi vào màn thử và chạm vào màn hình. Thử thật trên điện thoại: chạy `npm run dev -- --host` rồi mở địa chỉ mạng LAN in ra trên điện thoại cùng mạng Wi-Fi.

## Phòng thử 3D

Mở [Trạm phản lực](http://localhost:5173/prototype-3d.html) khi Vite đang chạy. Đường dẫn `file://` chỉ hiện hướng dẫn mở qua HTTP. Để mở bản build trên Mac, chạy `npm run preview -- --host 127.0.0.1 --port 4186` và mở [bản chơi thử](http://127.0.0.1:4186/prototype-3d.html).

Dùng WASD hoặc phím mũi tên để đi theo góc camera, Space để nhảy, Shift để lướt, J để bắn và P hoặc Esc để tạm dừng. Trên điện thoại xoay ngang, dùng cần và các nút trên màn hình.

Thêm `?gray=1` để xem cùng tuyến dưới dạng khối xám, hoặc `?q=low` để giảm chất lượng vẽ. Xem [nguồn Blender và tệp GLB](../05-Assets/prototype-3d/README.md) và [ảnh chạy thử](../04-Dev-Plan/qa/ST-22-06/README.md).

Để đo tải và FPS trên điện thoại cùng Wi-Fi, chạy `npm run build` và `node scripts/prototype3d-lan.mjs <IPv4-cua-may> 4187`. Mở link in ra và bấm **Kết quả đo** cuối lượt. [Quy trình và kết quả máy thật](../04-Dev-Plan/qa/ST-22-07/README.md).

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
