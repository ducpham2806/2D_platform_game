# Bắt đầu phiên (đọc file này trước)

*Cập nhật 24/11/2026. Giữ ≤ 60 dòng; sửa ở cuối mỗi phiên nếu mốc, việc chờ hay việc tiếp theo đổi.*

## Đang ở đâu

- **Mốc:** Giai đoạn 1. Code Prototype và phần MVP không phụ thuộc cảm giác đã xong (EP-08, 09, 10). Bản gốc G1 được lưu ở tag `gate-r1`. **Đang chờ ghi kết quả chơi thử cổng Prototype (G1).**
- **Tích hợp:** Người dùng yêu cầu đưa nhánh `ccr-9de01342-2046rb` đến ST-15-09 vào `main`. Tag `gate-r1` trỏ tới `eeb8ca1` (PR #10). GitHub Pages dựng theo commit mới trên `main`.
- **Kế hoạch:** `01-Ke-hoach-lam-viec.md` (sprint S9–S21, epic EP-11…EP-20, ba cổng G1, G2, G3).

## Chờ người dùng (đường găng)

1. Mở [bản thử G1](https://ducpham2806.github.io/2D_platform_game/?gate=1) trên điện thoại trước khi gửi link. Khi ghi kết quả, ghi rõ commit đã thử. Chuyển từng phần của PR #9 rồi đóng PR theo `stories/EP-21-chuyen-PR9.md` (phương án A đã chọn 14/11).
2. Chơi thử cổng Prototype với 5 người, ít nhất 3 người dùng điện thoại cảm ứng và 2 người dùng máy tính. Quy trình ở `05-Cong-Prototype.md` mục 4. Ghi kết quả vào mục 7.
3. Chọn kênh gửi dữ liệu đo lường (`adr/ADR-002-do-luong-mvp.md`).
4. ST-22-07 chờ nhận báo cáo điện thoại thật trên `codex/asset-3d-plan`. Bản đo giữ bản sao trên trình duyệt và tệp theo mã phiên. Xem `qa/ST-22-07/README.md`.
5. Xem lại quyết định đã chốt theo ủy quyền: `09-Quyet-dinh-cho-duyet.md`.
6. ~~Chọn hướng đồ họa~~: đã chọn **2.5D thời gian thực three.js** (14/11). Demo `game/demo-25d.html`, video `qa/DEMO-25D/`; ADR-003 (Proposed), EP-22. Còn: thử demo trên điện thoại (sau đợt thử G1, khi demo lên Pages).

## Việc code tiếp theo (theo duyệt Technical Director + Producer)

Mỗi việc: viết Story trước (`/story-readiness`, mẫu Story của Game Studio Agent, nhúng mã `QB-xx`), rồi code.

1. ~~Safe-area (QB-92)~~ xong (ST-11-01); bản thử đã khóa ở tag `gate-r1` và đăng Pages (14/11).
2. EP-13 đo lường (`stories/EP-13-do-luong.md`): ~~ST-13-01 lõi~~, ~~ST-13-02a/b nối vào game~~, ~~ST-13-05a/b báo cáo cổng đủ chỉ số~~ xong (14/11; `npm run mvp-report`). ST-13-03, 04 chờ ADR-002; ST-13-06 sau 03–05.
3. ~~Test khóa luật QB đã code (ST-QB-01), sửa QB-70…72 hộp chữ (EP-14 ST-14-08)~~ xong (15/11; tìm và sửa lỗi QB-24 Golem dựng lại).
4. EP-15 (`stories/EP-15-stage-2-4.md`): ST-15-01a/b/c, ST-15-02…06, ST-15-08a, ST-15-09 và ST-15-14…16 đã xong. Tiếp theo ST-15-10 (Lumen), ST-15-13 (chỉ số vật lý và phòng thử).
5. EP-12 AudioService (âm tạm lấy từ PR #9, ST-21-03); rồi phần EP-14 không đụng lớp nút cảm ứng (QB-90, QB-100, hộp chữ, chuỗi vi/en ST-21-06).
6. EP-21: ST-21-02 smoke check (sau tag). ST-21-01 (QB-88) đã xong; ST-21-05 (hình vẽ bằng mã) bỏ.
7. EP-22 (`stories/EP-22-do-hoa-25d.md`): ST-22-01 và ST-22-06 xong. ST-22-07 đang đo phòng 3D trên máy thật. Còn duyệt ADR-003.

## Asset

Bản G1 dùng hình khối. Nguồn Blender của Kai và kit phòng thử ở `05-Assets/prototype-3d/`, GLB ở `game/public/assets/prototype3d/`. Lộ trình chuyển PR #9 ở `stories/EP-21-chuyen-PR9.md`. Danh sách asset chiến dịch ở `05-Assets/manifest.csv` vẫn theo hướng pixel art. Cập nhật quy trình glTF sau khi duyệt ADR-003.

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
