# Bắt đầu phiên (đọc file này trước)

<<<<<<< HEAD
*Cập nhật 21/11/2026. Giữ ≤ 60 dòng; sửa ở cuối mỗi phiên nếu mốc, việc chờ hay việc tiếp theo đổi.*

## Đang ở đâu

- **Mốc:** Giai đoạn 1. Code Prototype và phần MVP không phụ thuộc cảm giác đã xong (EP-08, 09, 10). **Đang chờ cổng Prototype (G1).**
- **Bản thử:** tag `gate-r1` trỏ tới `eeb8ca1` (PR #10). `main` trên GitHub ở `c458643` (PR #11, chỉ tài liệu). CI #53 và Pages #8 đạt ngày 15/11 theo giờ Việt Nam.
- **Nhánh phát triển:** `ccr-9de01342-2046rb` ở `83f6d6b`, hơn `main` 13 commit. Có lõi đo lường và báo cáo MVP (EP-13), hộp chữ và kiểm thử luật biên (EP-14), an toàn boss và dữ liệu nền Stage 2 (EP-15), demo 2.5D phòng Thorna (EP-22).
=======
*Cập nhật 22/11/2026. Giữ ≤ 60 dòng; sửa ở cuối mỗi phiên nếu mốc, việc chờ hay việc tiếp theo đổi.*

## Đang ở đâu

- **Mốc:** Giai đoạn 1. Code Prototype và phần MVP không phụ thuộc cảm giác đã xong (EP-08, 09, 10). Bản gốc G1 được lưu ở tag `gate-r1`. **Đang chờ ghi kết quả chơi thử cổng Prototype (G1).**
- **Tích hợp:** Người dùng yêu cầu đưa nhánh `ccr-9de01342-2046rb` đến ST-15-09 vào `main`. Tag `gate-r1` trỏ tới `eeb8ca1` (PR #10). GitHub Pages dựng theo commit mới trên `main`.
>>>>>>> 6eb3e419966f34e2a9b6b9bb046704b88ec1db68
- **Kế hoạch:** `01-Ke-hoach-lam-viec.md` (sprint S9–S21, epic EP-11…EP-20, ba cổng G1, G2, G3).

## Chờ người dùng (đường găng)

<<<<<<< HEAD
1. Mở [bản thử G1](https://ducpham2806.github.io/2D_platform_game/?gate=1) trên điện thoại để kiểm tra trước khi phát link. Nhánh phát triển chờ hết đợt thử mới merge. PR #9 vẫn mở, xử lý bằng cách chuyển từng phần theo `stories/EP-21-chuyen-PR9.md`, rồi đóng PR.
2. Chơi thử cổng Prototype với 5 người, gồm ít nhất 3 người chơi cảm ứng và 2 người chơi trên máy tính. Quy trình ở `05-Cong-Prototype.md` mục 4, ghi kết quả vào mục 7. Chưa thấy kết quả trong repo.
3. Chọn kênh gửi dữ liệu đo lường (`adr/ADR-002-do-luong-mvp.md`).
4. Asset 3D chờ duyệt phương án chuyển đổi trong ADR-003 (EP-22).
5. Xem lại quyết định đã chốt theo ủy quyền: `09-Quyet-dinh-cho-duyet.md`.
6. Đã chọn 2.5D thời gian thực bằng three.js. Demo trên nhánh phát triển cần đo hiệu năng trên Android và iPhone thật trước khi duyệt ADR-003.
=======
1. Khi ghi kết quả G1, ghi rõ commit đã dùng. Link Pages `?gate=1` mở chế độ chơi thử của bản đang đăng. PR #9 xử lý bằng cách chuyển từng phần theo `stories/EP-21-chuyen-PR9.md` (phương án A đã chọn 14/11).
2. Chơi thử cổng Prototype với 5 người, ≥ 3 người cảm ứng: `05-Cong-Prototype.md` mục 3; ghi kết quả vào mục 7.
3. Chọn kênh gửi dữ liệu đo lường (`adr/ADR-002-do-luong-mvp.md`).
4. Asset: tạm dừng (hướng dẫn asset hiện theo pixel art); làm lại theo model 3D sau khi duyệt ADR-003 (EP-22 ST-22-03, 05).
5. Xem lại quyết định đã chốt theo ủy quyền: `09-Quyet-dinh-cho-duyet.md`.
6. ~~Chọn hướng đồ họa~~: đã chọn **2.5D thời gian thực three.js** (14/11). Demo `game/demo-25d.html`, video `qa/DEMO-25D/`; ADR-003 (Proposed), EP-22. Còn: thử demo trên điện thoại (sau đợt thử G1, khi demo lên Pages).
>>>>>>> 6eb3e419966f34e2a9b6b9bb046704b88ec1db68

## Việc code tiếp theo (theo duyệt Technical Director + Producer)

Mỗi việc: viết Story trước (`/story-readiness`, mẫu Story của Game Studio Agent, nhúng mã `QB-xx`), rồi code.

<<<<<<< HEAD
1. EP-15: tiếp ST-15-02 (laser, gương, cảm biến). ST-15-14 (an toàn boss) và ST-15-01a (dữ liệu Stage 2) đã có trên nhánh phát triển.
2. EP-13: lõi đo lường, xuất JSON và báo cáo đã có trên nhánh phát triển. ST-13-03, 04 chờ ADR-002.
3. EP-12: AudioService (âm tạm lấy từ PR #9, ST-21-03). EP-14: phần giao diện còn lại (QB-90, QB-100, chuỗi vi/en ST-21-06). Hộp chữ (ST-14-08) và kiểm thử luật biên (ST-QB-01) đã có trên nhánh phát triển.
4. EP-21: tiếp smoke check (ST-21-02); ST-21-01 (QB-88) đã xong. EP-22: sau đợt thử G1, đo demo trên máy thật (ST-22-02), rồi duyệt cách chuyển lớp hiển thị (ST-22-03).
=======
1. ~~Safe-area (QB-92)~~ xong (ST-11-01); bản thử đã khóa ở tag `gate-r1` và đăng Pages (14/11).
2. EP-13 đo lường (`stories/EP-13-do-luong.md`): ~~ST-13-01 lõi~~, ~~ST-13-02a/b nối vào game~~, ~~ST-13-05a/b báo cáo cổng đủ chỉ số~~ xong (14/11; `npm run mvp-report`). ST-13-03, 04 chờ ADR-002; ST-13-06 sau 03–05.
3. ~~Test khóa luật QB đã code (ST-QB-01), sửa QB-70…72 hộp chữ (EP-14 ST-14-08)~~ xong (15/11; tìm và sửa lỗi QB-24 Golem dựng lại).
4. EP-15 (`stories/EP-15-stage-2-4.md`): ST-15-01a/b/c, ST-15-02…06, ST-15-08a, ST-15-09 và ST-15-14…16 đã xong. Tiếp theo ST-15-10 (Lumen), ST-15-13 (chỉ số vật lý và phòng thử).
5. EP-12 AudioService (âm tạm lấy từ PR #9, ST-21-03); rồi phần EP-14 không đụng lớp nút cảm ứng (QB-90, QB-100, hộp chữ, chuỗi vi/en ST-21-06).
6. EP-21: ST-21-02 smoke check (sau tag). ST-21-01 (QB-88) đã xong; ST-21-05 (hình vẽ bằng mã) bỏ.
7. EP-22 đồ họa 2.5D (`stories/EP-22-do-hoa-25d.md`): ~~ST-22-01 demo~~ xong (14/11); tiếp ST-22-02 đo trên máy thật, ST-22-03 duyệt ADR-003.
>>>>>>> 6eb3e419966f34e2a9b6b9bb046704b88ec1db68

## Asset

Bản thử G1 dùng hình khối. Danh sách `05-Assets/manifest.csv` vẫn theo hướng pixel art. Cập nhật quy trình model glTF sau khi duyệt ADR-003.

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
