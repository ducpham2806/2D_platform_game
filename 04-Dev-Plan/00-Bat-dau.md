# Bắt đầu phiên (đọc file này trước)

*Cập nhật 21/11/2026. Giữ ≤ 60 dòng; sửa ở cuối mỗi phiên nếu mốc, việc chờ hay việc tiếp theo đổi.*

## Đang ở đâu

- **Mốc:** Giai đoạn 1. Code Prototype và phần MVP không phụ thuộc cảm giác đã xong (EP-08, 09, 10). Bản thử G1 đã đăng (tag `gate-r1`). **Đang chờ người dùng chơi thử cổng Prototype (G1).**
- **Nhánh làm việc:** `ccr-9de01342-2046rb`. `gate-r1` trỏ tới `eeb8ca1` (PR #10); `main` ở `c458643` (PR #11, chỉ tài liệu). Nhánh phát triển chờ xong đợt thử G1 mới merge.
- **Kế hoạch:** `01-Ke-hoach-lam-viec.md` (sprint S9–S21, epic EP-11…EP-20, ba cổng G1, G2, G3).

## Chờ người dùng (đường găng)

1. ~~Merge PR #10~~ xong (14/11, `main` = `eeb8ca1`). Repo công khai, Pages đã bật; bản `eeb8ca1` đã đăng ở `https://ducpham2806.github.io/2D_platform_game/?gate=1` (14/11). Tag `gate-r1` → `eeb8ca1` (người dùng tạo trên GitHub, 14/11; môi trường của Claude không đẩy được tag). Còn: người dùng mở thử trên điện thoại rồi phát link. Code mới tiếp tục trên nhánh này, chỉ merge vào `main` sau đợt thử. **Không merge PR #9** (nhánh của phiên 13/11, tách từ `main` song song, xung đột 31 file); người dùng chọn cách A (14/11): chuyển từng phần sau tag (`stories/EP-21-chuyen-PR9.md`), rồi đóng PR #9.
2. Chơi thử cổng Prototype với 5 người, ≥ 3 người cảm ứng: `05-Cong-Prototype.md` mục 3; ghi kết quả vào mục 7.
3. Chọn kênh gửi dữ liệu đo lường (`adr/ADR-002-do-luong-mvp.md`).
4. Asset: tạm dừng (hướng dẫn asset hiện theo pixel art); làm lại theo model 3D sau khi duyệt ADR-003 (EP-22 ST-22-03, 05).
5. Xem lại quyết định đã chốt theo ủy quyền: `09-Quyet-dinh-cho-duyet.md`.
6. ~~Chọn hướng đồ họa~~: đã chọn **2.5D thời gian thực three.js** (14/11). Demo `game/demo-25d.html`, video `qa/DEMO-25D/`; ADR-003 (Proposed), EP-22. Còn: thử demo trên điện thoại (sau đợt thử G1, khi demo lên Pages).

## Việc code tiếp theo (theo duyệt Technical Director + Producer)

Mỗi việc: viết Story trước (`/story-readiness`, mẫu Story của Game Studio Agent, nhúng mã `QB-xx`), rồi code.

1. ~~Safe-area (QB-92)~~ xong (ST-11-01); bản thử đã khóa ở tag `gate-r1` và đăng Pages (14/11).
2. EP-13 đo lường (`stories/EP-13-do-luong.md`): ~~ST-13-01 lõi~~, ~~ST-13-02a/b nối vào game~~, ~~ST-13-05a/b báo cáo cổng đủ chỉ số~~ xong (14/11; `npm run mvp-report`). ST-13-03, 04 chờ ADR-002; ST-13-06 sau 03–05.
3. ~~Test khóa luật QB đã code (ST-QB-01), sửa QB-70…72 hộp chữ (EP-14 ST-14-08)~~ xong (15/11; tìm và sửa lỗi QB-24 Golem dựng lại).
4. EP-15 (`stories/EP-15-stage-2-4.md`): ST-15-14, ST-15-01a/b/c và ST-15-02…04 đã xong. Phòng thử băng có Frost Shard và dòng làm mát. ST-15-05 đã có cấu hình Gale Cutter. ST-15-15/16 cũng có thể làm trước G1.
5. EP-12 AudioService (âm tạm lấy từ PR #9, ST-21-03); rồi phần EP-14 không đụng lớp nút cảm ứng (QB-90, QB-100, hộp chữ, chuỗi vi/en ST-21-06).
6. EP-21: ST-21-02 smoke check (sau tag). ST-21-01 (QB-88) đã xong; ST-21-05 (hình vẽ bằng mã) bỏ.
7. EP-22 đồ họa 2.5D (`stories/EP-22-do-hoa-25d.md`): ~~ST-22-01 demo~~ xong (14/11); tiếp ST-22-02 đo trên máy thật, ST-22-03 duyệt ADR-003.

## Asset

`game/public/` mới có `data/`; chưa có asset nào. Game chạy bằng hình khối. PR #9 (chưa merge) có bộ hình vẽ bằng mã, âm thanh tổng hợp, smoke check, chuỗi vi/en: kế hoạch chuyển từng phần ở `stories/EP-21-chuyen-PR9.md`; phần hình chờ người dùng chọn hướng đồ họa (`09-Quyet-dinh-cho-duyet.md` mục 3, ảnh so sánh ở `qa/ST-21-05/`). Danh sách và mốc asset: `05-Assets/manifest.csv` (P0 Prototype, P1 Vertical slice, P2a Stage 2–4 thuộc MVP, P2b Hub/NPC thuộc Alpha).

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
