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

- **Vào màn thử:** màn xám thử cảm giác điều khiển, dài 74 ô: khe 2 ô, bậc cao 1/3/4 ô, bục một chiều, giếng 8 ô phải nhảy tường, hành lang trần thấp, hố 5 ô phải lướt + nhảy. Kai là khối giữ chỗ đổi màu theo trạng thái (xanh: đứng/chạy, vàng: lướt, tím: bám tường, đỏ: bị đánh). Phím: A/D hoặc ←/→, K nhảy (giữ lâu nhảy cao), L lướt, S/↓ + K rơi xuyên bục, Esc quay lại; tay cầm và cảm ứng như màn Điều khiển. Bản dev: phím T gây 10 sát thương thử.
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
