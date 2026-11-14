# Bắt đầu phiên (đọc file này trước)

*Cập nhật 14/11/2026. Giữ ≤ 60 dòng; sửa ở cuối mỗi phiên nếu mốc, việc chờ hay việc tiếp theo đổi.*

## Đang ở đâu

- **Mốc:** Giai đoạn 1. Code Prototype và phần MVP không phụ thuộc cảm giác đã xong (EP-08, 09, 10). **Đang chờ cổng Prototype (G1).**
- **Nhánh làm việc:** `ccr-9de01342-2046rb`, đi trước `main` khoảng 40 commit. Chưa có tag nào.
- **Kế hoạch:** `01-Ke-hoach-lam-viec.md` (sprint S9–S18, epic EP-11…EP-20, ba cổng G1, G2, G3).

## Chờ người dùng (đường găng)

1. Merge nhánh vào `main` (để GitHub Pages có bản mới), rồi tag `gate-r1`.
2. Chơi thử cổng Prototype với 5 người, ≥ 3 người cảm ứng: `05-Cong-Prototype.md` mục 3. Ghi kết quả vào mục 7 file đó.
3. Chọn kênh gửi dữ liệu đo lường cho cổng MVP: `adr/ADR-002-do-luong-mvp.md` (đề xuất sẵn một phương án).
4. Asset nhóm P0 (10 sheet): `05-Assets/01-Huong-dan-asset.md`.
5. Xem lại các quyết định đã chốt theo ủy quyền ngày 14/11 (nhật ký phiên 14/11 liệt kê đủ); không đồng ý điểm nào thì nói, em sửa theo `/propagate-design-change`.

## 5 việc code tiếp theo (không phụ thuộc cảm giác, làm được ngay)

1. EP-12 Âm thanh MVP: AudioService và SFX theo `WorldEvents` (`01-GDD/12-Am-thanh.md`).
2. EP-15 ST-15-01: dữ liệu Stage 2–4 và bộ kiểm tra (`01-GDD/16-Dac-ta-Stage2-4-nhap.md` mục 10).
3. EP-14: hộp chữ, cỡ chữ, nút ≥ 48 dp, safe-area, tự tạm dừng, báo lỗi lưu (`01-GDD/17-Quy-tac-bien.md` mục 8–11, `14-Cai-dat-Tiep-can.md`).
4. Luật biên boss: kẹp pha `phaseShiftSec`, chống khóa choáng `weakStunCooldownSec` (QB-14, QB-31).
5. EP-13 Đo lường: logger thuần, hàng đợi ngoại tuyến (`01-GDD/13-Do-luong-MVP.md`), kênh gửi theo ADR-002.

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

Trong `game/`: `npm test && npm run lint && npm run format:check && npm run build` trước mỗi commit. Cờ URL và lệnh khác: `game/CONTEXT.md` mục Lệnh.
