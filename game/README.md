# Cyber Vanguard: mã nguồn game

Phaser 3 + TypeScript + Vite. Tài liệu thiết kế ở thư mục gốc repo (`01-GDD/`, `03-Data/`, `04-Dev-Plan/`); kiến trúc và trạng thái module ở [`CONTEXT.md`](CONTEXT.md).

## Chạy thử

Cần Node 20 trở lên.

```
cd game
npm install
npm run dev
```

Mở http://localhost:5173. Màn hình chính có ba lựa chọn:

- **Vào màn thử:** màn xám thử cảm giác điều khiển và chiến đấu, dài 96 ô: bia tập bắn, khe 2 ô, bậc cao 1/3/4 ô, bia có khiên (phải bắn nạp đầy), bục một chiều, giếng 8 ô phải nhảy tường, hành lang trần thấp, hố 5 ô phải lướt + nhảy, rồi **phòng boss** (cửa đóng khi vào). Kai và mọi thứ vẫn là khối giữ chỗ:
  - Kai đổi màu theo trạng thái (xanh: đứng/chạy, vàng: lướt, tím: bám tường, đỏ: bị đánh); viền xanh khi nạp vừa, nhấp nháy vàng trắng khi nạp đầy.
  - Boss nhấp nháy cam khi báo trước đòn (telegraph), kèm chỉ dẫn: làn đạn đứt nét (Bắn thẳng), tam giác chỗ đáp (Nhảy đập), cột đỏ mờ là chỗ đạn sẽ rơi (Mưa đạn, chỗ không có cột là khe an toàn). Boss đỏ khi đang ra đòn, xanh nhạt khi bị choáng.
  - Thắng boss lần đầu nhận **Vine Lash** (roi quét 4 ô). Ra khỏi phòng rồi vào lại để đấu lại: Vine Lash là điểm yếu của boss.
  - Phím: A/D hoặc ←/→ di chuyển, K nhảy (giữ lâu nhảy cao), J bắn (giữ để nạp, thả để bắn đạn nạp), L lướt, Q/E đổi vũ khí, S/↓ + K rơi xuyên bục, Esc quay lại. Tay cầm và cảm ứng như màn Điều khiển. Bản dev: phím T gây 10 sát thương thử.
- **Hub Arkon:** khung menu.
- **Điều khiển:** đổi phím bàn phím, đổi nút tay cầm, và mở chế độ kéo thả bố cục nút cảm ứng.

**Thử cảm ứng trên máy tính:** mở DevTools của Chrome, bật chế độ thiết bị (Ctrl+Shift+M), chọn một điện thoại và xoay ngang, rồi tải lại trang. Nút cảm ứng hiện khi vào màn thử và chạm vào màn hình. Thử thật trên điện thoại: chạy `npm run dev -- --host` rồi mở địa chỉ mạng LAN in ra trên điện thoại cùng mạng Wi-Fi.

## Kiểm tra

```
npm test              # Vitest: scale, bước cố định, event bus, tính nhất quán của 03-Data
npm run lint          # ESLint
npm run format:check  # Prettier
npm run build         # typecheck + build vào dist/
```

CI (`.github/workflows/ci.yml`) chạy toàn bộ các lệnh trên cho mỗi pull request.

## Dữ liệu

Không sửa `public/data/`. Sửa số liệu trong `../03-Data/*.json`; `npm run dev` và `npm run build` tự chép sang. Nếu dữ liệu sai kiểu hoặc lệch nhau giữa các file (ví dụ phá vòng khắc chế), test sẽ báo đỏ và game dừng ở màn tải với thông báo lỗi.
