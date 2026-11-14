# EP-11: Cổng Prototype đợt 1 (G1)

- **Mốc:** Prototype → quyết định G1 (`01-Ke-hoach-lam-viec.md`, S9). Cổng: `05-Cong-Prototype.md` (cảm ứng là tiêu chí chính).
- **Việc của người:** ~~merge PR~~ (PR #10 merge 14/11, `eeb8ca1`); bật GitHub Pages; tag `gate-r1`; chơi thử 5 người (≥ 3 cảm ứng), ghi mục 7 file 05.
- **Việc code:** chỉ sửa những gì làm sai lệch kết quả đợt thử trên điện thoại. Sau khi tag `gate-r1`, code mới ở nhánh mới.

| Mã | Tên | Phụ thuộc | Cỡ | Trạng thái |
| --- | --- | --- | --- | --- |
| ST-11-01 | Vùng an toàn (tai thỏ, góc bo, thanh vuốt) cho nút cảm ứng, cần ảo, canvas và bảng HTML | — | 1 phiên | DONE (14/11/2026) |

## ST-11-01: Vùng an toàn cho lớp cảm ứng, canvas và bảng HTML

**Bối cảnh (nhúng):**
- `17-Quy-tac-bien.md` QB-92: lớp nút cảm ứng, bảng HTML và lề HUD cộng `env(safe-area-inset-*)`. QB-74: nút ≥ 48 dp.
- Rà soát 14/11 (N03, duyệt Technical Director): `index.html` đặt `viewport-fit=cover` nhưng code không dùng `env(safe-area-inset-*)`. Nút II neo cách mép 32 dp, cần ảo cố định 90 dp, nên trên máy có tai thỏ có thể nằm dưới tai thỏ, lệch tiêu chí chính của G1.
- GDD chính 5.2: chỉ hỗ trợ màn ngang. Trên iPhone cầm ngang, vùng an toàn thường là trái/phải 47 px (tai thỏ, góc bo) và dưới 21 px (thanh vuốt home); trên trên 0.

**Quyết định:**
- Nút cảm ứng và cần ảo tránh **cả 4 phía**: đó là chỗ bấm, không được nằm dưới tai thỏ hay vùng vuốt hệ thống. Vị trí neo tính từ mép vùng an toàn; nút bị kẹp trong vùng an toàn.
- Canvas (HUD vẽ trong canvas) tránh **trái, phải, trên** (phía tai thỏ, góc bo che hình), **không** tránh dưới: thanh vuốt home chỉ nằm đè, không che hình, và nếu tránh thì iPhone 14 ngang tụt từ ×6 xuống ×5. Vẫn giữ hệ số phóng nguyên theo px thiết bị.
- Bảng HTML (Xưởng, Quầy, Chuẩn bị, Dữ liệu lưu, chỉnh nút): chiều rộng, chiều cao tối đa trừ vùng an toàn cả 4 phía.
- Đọc vùng an toàn bằng một phần tử dò ẩn có `padding: env(safe-area-inset-*)`; máy không có thì 0. Đọc lại khi đổi kích thước, xoay máy.

**Tiêu chí nghiệm thu:**
1. Logic thuần (`touch-layout.ts`, `scale.ts`) nhận vùng an toàn; không vùng an toàn thì kết quả y như cũ (test cũ đạt nguyên).
2. Test: nút neo phải cách mép phải đúng `x + inset.right`; nút không lọt vào vùng an toàn kể cả khi người chơi kéo sát mép; cần ảo cố định dời theo `inset.left` (hoặc `inset.right` khi thuận tay trái); kéo nút trong chế độ chỉnh rồi lưu thì vị trí lưu không phụ thuộc máy có tai thỏ hay không.
3. Test: canvas iPhone 14 ngang (844 × 390, dpr 3, trái/phải 47, dưới 21) giữ ×6 và nằm trọn giữa hai vùng tai thỏ; máy có tai thỏ hẹp hơn thì hạ hệ số phóng chứ không lấn vào tai thỏ.
4. Chạy thử Chromium giả lập Pixel 7 và iPhone 14 ngang (vùng an toàn giả lập bằng CSS), ảnh ở `04-Dev-Plan/qa/ST-11-01/`; không lỗi console; `npm run gate-flow` đạt.
5. Hot-path: đọc vùng an toàn chỉ khi đổi kích thước, không đọc mỗi khung.

**File:** `src/logic/input/touch-layout.ts`, `src/logic/scale.ts`, `src/input/safe-area.ts` (mới), `src/input/touch-overlay.ts`, `src/core/phaser-scale.ts`, `src/style.css`, `tests/input-touch.test.ts`, `tests/scale.test.ts`.
