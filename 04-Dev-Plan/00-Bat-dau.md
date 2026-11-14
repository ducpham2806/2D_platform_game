# Bắt đầu phiên (đọc file này trước)

*Cập nhật 14/11/2026. Giữ ≤ 60 dòng; sửa ở cuối mỗi phiên nếu mốc, việc chờ hay việc tiếp theo đổi.*

## Đang ở đâu

- **Mốc:** Giai đoạn 1. Code Prototype và phần MVP không phụ thuộc cảm giác đã xong (EP-08, 09, 10). **Đang chờ cổng Prototype (G1).**
- **Nhánh làm việc:** `ccr-9de01342-2046rb`, đi trước `main` khoảng 40 commit. Chưa có tag nào.
- **Kế hoạch:** `01-Ke-hoach-lam-viec.md` (sprint S9–S21, epic EP-11…EP-20, ba cổng G1, G2, G3).

## Chờ người dùng (đường găng)

1. Merge nhánh vào `main` rồi tag `gate-r1` (bản người thử G1). Sau đó code mới ở nhánh mới, không lẫn vào bản thử.
2. Chơi thử cổng Prototype với 5 người, ≥ 3 người cảm ứng: `05-Cong-Prototype.md` mục 3; ghi kết quả vào mục 7.
3. Chọn kênh gửi dữ liệu đo lường (`adr/ADR-002-do-luong-mvp.md`).
4. Asset nhóm P0 (10 sheet): `05-Assets/01-Huong-dan-asset.md`.
5. Xem lại quyết định đã chốt theo ủy quyền: `09-Quyet-dinh-cho-duyet.md`.

## Việc code tiếp theo (theo duyệt Technical Director + Producer)

Mỗi việc: viết Story trước (`/story-readiness`, mẫu Story của Game Studio Agent, nhúng mã `QB-xx`), rồi code.

1. **Trước khi phát link G1:** safe-area cho lớp nút cảm ứng và HUD (QB-92), chạy thử Pixel 7 và iPhone giả lập; rồi đóng băng bản thử.
2. EP-13 lõi đo lường (logger thuần, bộ đệm, xuất JSON): không chờ ADR-002, dùng được cho G2.
3. Test khóa các luật đã code nhưng chưa test, gắn mã QB vào tên test; sửa QB-72 (dừng đồng hồ khi tạm dừng), QB-70 (gợi ý bị che thì hiện lại).
4. EP-15: ST-15-14 (QB-14, QB-31), rồi ST-15-01a (dữ liệu Stage 2), ST-15-02.
5. EP-12 AudioService; rồi phần EP-14 không đụng lớp nút cảm ứng (QB-90, QB-100, hộp chữ).

## Asset

`game/public/` mới có `data/`; chưa có asset nào. Game chạy bằng hình khối. Danh sách và mốc: `05-Assets/manifest.csv` (P0 Prototype, P1 Vertical slice, P2a Stage 2–4 thuộc MVP, P2b Hub/NPC thuộc Alpha).

## Đọc gì theo loại việc

| Việc | Đọc theo thứ tự |
| --- | --- |
| Mọi phiên | `CLAUDE.md` → file này → mục mới nhất của `06-Nhat-ky-phien.md` |
| Code một Story | File Story → `game/CONTEXT.md` → file quyết định của module ở `game/docs/quyet-dinh/` → mục GDD và mã `QB-xx` mà Story nhúng |
| Thiết kế, sửa GDD | `07-Ban-do-he-thong.md` (danh sách tài liệu, tên chuẩn) → GDD liên quan → `01-GDD/17-Quy-tac-bien.md` |
| Chơi thử, QA | `05-Cong-Prototype.md`, `08-Cong-MVP.md`, `04-Test-va-Launch.md`, `qa/README.md` |
| Asset | `05-Assets/01-Huong-dan-asset.md`, `05-Assets/manifest.csv` |
| Kế hoạch, Story mới | `01-Ke-hoach-lam-viec.md` → `07-Ban-do-he-thong.md` → file EP trong `stories/` |

**Không đọc đầu phiên:** `luu-tru/` (bản cũ), `02-Module.md` (chỉ khi cần phụ thuộc giữa module), `graphify-out/` (cũ; chạy `graphify update .` trước khi dùng).

## Lệnh

Trong `game/`: `npm test && npm run lint && npm run format:check && npm run build && npm run docs-check` trước mỗi commit. Cờ URL và lệnh khác: `game/CONTEXT.md` mục Lệnh.
