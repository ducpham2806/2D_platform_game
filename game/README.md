# Cyber Vanguard: mã nguồn game

Phaser 3 + TypeScript + Vite. Tài liệu thiết kế ở thư mục gốc repo (`01-GDD/`, `03-Data/`, `04-Dev-Plan/`); kiến trúc và trạng thái module ở [`CONTEXT.md`](CONTEXT.md).

## Chạy thử

Cần Node 20 trở lên.

```
cd game
npm install
npm run dev
```

Mở http://localhost:5173. Màn hình chính có hai lựa chọn: **Vào màn thử** (phòng xám 20 × 12 ô, ←/→ hoặc A/D để di chuyển khối giữ chỗ, Esc để quay lại) và **Hub Arkon** (khung menu).

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
