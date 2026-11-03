# Cyber Vanguard: Gói tài liệu phát triển

Game action-platformer nhập vai kiểu Mega Man (thiết kế nguyên bản), chơi trên điện thoại và web PC. Phiên bản tài liệu 0.6, cập nhật 01/11/2026 (thu gọn độ khó còn 3 mức; rà soát thiết kế: thứ tự màn theo vòng khắc chế, đường chỉ số, MVP 4 màn, lịch mở dần, cốt truyện, giọng nhân vật; xem nhật ký thay đổi ở cuối GDD).

> **Chiến lược đã chốt (0.4):** free-to-play (IAP, quảng cáo, subscription Cyber+) cộng endgame farm. Chi tiết ở `01-GDD/05-Ke-hoach-kiem-tien.md`. Quyết định mục 13 đã được chốt và đưa vào GDD.

## Nội dung gói

| Thư mục | Nội dung |
|---|---|
| `01-GDD/` | GDD chính (Markdown + Word), ba đặc tả (Prologue và Stage 1, Hub và Shop, cân bằng kinh tế) kế hoạch kiếm tiền, kế hoạch gắn quảng cáo (`06-Ke-hoach-quang-cao.md`) , kịch bản hướng dẫn người chơi mới (`07-Kich-ban-huong-dan.md`) giọng nhân vật (`08-Giong-nhan-vat.md`) và thoại Warden (`09-Thoai-Warden.md`) |
| `02-Wireframes/` | 97 màn wireframe HTML. Mở `index.html` bằng trình duyệt |
| `03-Data/` | 15 file JSON cấu hình (màn, vũ khí, boss, kẻ địch, độ khó, điều khiển, Shop, kinh tế, module, người chơi, kiếm tiền, vị trí quảng cáo, live-ops, endgame, thoại Warden) |
| `04-Dev-Plan/` | Kế hoạch làm việc, danh sách module, bộ prompt code, kế hoạch test và launch, nhật ký phiên (`06-Nhat-ky-phien.md`), `tools/economy_sim.py` (mô phỏng kinh tế endgame) |
| `game/` | Mã nguồn game (Phaser 3 + TypeScript + Vite). Hướng dẫn chạy ở `game/README.md`, kiến trúc và trạng thái module ở `game/CONTEXT.md` |
| `05-Assets/` | Hướng dẫn tạo asset, bộ prompt hình, `manifest.csv` (350 spritesheet), script xử lý ảnh |

## Bắt đầu thế nào

1. Đọc `01-GDD/01-GDD-chinh.md` rồi ba đặc tả.
2. Mở `02-Wireframes/index.html` để xem toàn bộ màn hình.
3. Đọc `04-Dev-Plan/01-Ke-hoach-lam-viec.md` và `02-Module.md`.
4. Làm **song song**: asset theo `05-Assets/01-Huong-dan-asset.md` + `02-Prompt-asset.md` (bắt đầu từ STYLE BLOCK và tờ thiết kế Kai), và code theo `04-Dev-Plan/03-Prompt-code.md` (bắt đầu từ prompt ngữ cảnh chung và P-M0).
5. Trước khi phát hành: `04-Dev-Plan/04-Test-va-Launch.md`.

## Quy ước

- Mọi con số `[PLACEHOLDER]` là giả thuyết, chỉnh trong `03-Data/` sau khi chơi thử.
- Tên kẻ địch và mini-boss Stage 2–8 đã nằm trong GDD (mục 9.1).
- Wireframe đã gồm 22 màn cho chiến lược free-to-play, Hub (ngang và dọc) và sơ đồ luồng đã cập nhật (cửa hàng Gem, Cyber+, live-ops, quảng cáo, Vùng Eclipse, Chip Lõi...) và tab Premium trong Shop.
- Wireframe là khung xám để chốt bố cục, chưa phải thiết kế đồ họa cuối.
- Script trong `05-Assets/tools/` cần Python 3 và thư viện Pillow (`pip install pillow`).
