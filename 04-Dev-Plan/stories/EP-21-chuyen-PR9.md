# EP-21: Chuyển phần còn giá trị của PR #9

- **Bối cảnh:** PR #9 (nhánh `claude/peaceful-mccarthy-13m5ah`, phiên 13/11) tách từ `main` song song với nhánh của PR #10. Hai nhánh cùng làm hội thoại boss, màn Kết quả, hệ số phóng theo px thiết bị, nên xung đột 31 file. PR #10 là bản chơi thử G1 (đã kiểm thử, safe-area, 423+ test); PR #9 không merge.
- **Quyết định (người dùng chọn 14/11, cách A):** giữ bản chơi thử G1 như hiện tại (hình khối). Sau tag `gate-r1`, chuyển từng phần của PR #9 thành Story riêng trên code của PR #10, theo GDD hiện hành (không chép nguyên). Xong hoặc bỏ hết các Story dưới đây thì đóng PR #9.
- **Nguồn:** commit trong PR #9 ghi ở từng Story; xem bằng `git show <commit>` (nhánh còn trên GitHub tới khi đóng PR).

| Mã | Tên | Nguồn PR #9 | Đích | Chờ | Cỡ | Trạng thái |
| --- | --- | --- | --- | --- | --- | --- |
| ST-21-01 | Chuỗi hướng dẫn khi chơi lại (QB-88) | `bc49696` | `tutorial-manager.ts` | — | 0,5 phiên | DONE (14/11/2026) |
| ST-21-02 | Smoke check luồng chính (`npm run smoke`), job CI không chặn | `040901c`, `4cc3468` | `game/scripts/`, CI | tag `gate-r1` | 1 phiên | Chưa |
| ST-21-03 | Âm thanh tổng hợp làm bộ âm tạm cho EP-12 | `038bf62` (`sfx-player.ts`, `feedback.json`) | EP-12 ST-12-01…03 | tag `gate-r1` | gộp vào EP-12 | Chưa |
| ST-21-04 | Hiệu ứng phản hồi: hạt, co giãn hình Kai | `038bf62` (`logic/feel/*`) | lớp scene | quyết định G1 (đụng cảm giác) | 1 phiên | Chưa |
| ST-21-05 | Đồ họa vẽ bằng mã: công cụ `codeart`, 68 file hình, lớp vẽ (Tilemap, nền parallax, `KaiView`, `SpritePool`, `FxLayer`, khung 9 mảnh) | `b741713`, `22fa2cb`, `7254af4`, `a78343d` | `05-Assets/tools/`, `game/public/assets/`, `scenes/` | — | — | **Bỏ** (14/11: người dùng chọn 2.5D three.js, EP-22) |
| ST-21-06 | Bảng chuỗi vi/en cho HUD, tạm dừng, hội thoại, Kết quả | `af4daff` (`strings.json`, `logic/i18n.ts`) | EP-14 (i18n nền) | tag `gate-r1` | gộp vào EP-14 | Chưa |

Không chuyển: `07-Danh-gia-ke-hoach.md`, `08-Viec-cho-nguoi-dung.md` của PR #9 (đã thay bằng `01-Ke-hoach-lam-viec.md`, `00-Bat-dau.md`); thư mục `__pycache__` lọt vào commit đồ họa.

## ST-21-01: Chuỗi hướng dẫn khi chơi lại (QB-88)

**Bối cảnh (nhúng):**
- `tutorial.json`: S08 (`on: bossGate`, hiện 6 s) → S09 (`after: S08`, chờ `bossPhase`) → S10 (`after: S09`, chờ `bossDefeated`). Bước xong được lưu ngay (`tutorial.done`).
- Lỗi (PR #9 tìm ra, nhánh này cũng có): thoát hoặc tải lại trang giữa trận Thorna rồi vào lại màn thì bước nối sau hiện ngay đầu màn ("Nó đang dồn sức. Giữ nhịp né." khi chưa thấy boss) và nằm đó tới khi hạ boss.
- Không ảnh hưởng G1: màn xám của link `?gate=1` không có hướng dẫn (`game/docs/quyet-dinh/giao-dien-huong-dan-hoi-thoai.md`).

**Quyết định:** PR #9 sửa bằng cách chỉ nối chuỗi theo bước xong trong lượt; như vậy người vào lại mất luôn S09, S10 (mất gợi ý né đòn boss). Bản ở đây giữ cách đó và thêm: bước đã lưu mà điều kiện kích hoạt xảy ra lại (vào lại phòng boss) thì tính xong trong lượt, không hiện lại lời, nên phần còn dở của chuỗi chạy tiếp đúng chỗ. Luật QB-88.

**Tiêu chí nghiệm thu:**
1. Đã lưu S08, S09: đầu màn không hiện gì; vào phòng boss thì S10 hiện; hạ boss thì S13. Test QB-88.
2. Đã lưu S08: đầu màn không hiện gì; vào phòng boss thì S09 hiện (không lặp S08); đổi pha thì S10. Test QB-88.
3. Test cũ của chuỗi trận boss và `cancelOn` đạt nguyên.
4. Chạy thử Chromium phòng Thorna với bản lưu đã xong S01–S09: trước khi sửa S10 hiện đầu màn; sau khi sửa không hiện, vào lại phòng boss mới hiện. Ảnh ở `04-Dev-Plan/qa/ST-21-01/`.

**File:** `src/logic/tutorial/tutorial-manager.ts`, `tests/tutorial.test.ts`, `01-GDD/17-Quy-tac-bien.md` (QB-88).

## Ghi chú cho các Story còn lại (viết đủ khi mở)

- **ST-21-02:** menu và luồng của PR #10 khác PR #9 (màn Chuẩn bị, Xưởng, Quầy). Viết lại theo `gate-flow.mjs` (cùng cách mở `vite preview`, cờ `?debug=1`), không chép nguyên. Ảnh không commit.
- **ST-21-03:** PR #9 dùng `feedback.json` và `sfx-player.ts`; GDD `12-Am-thanh.md` dùng `audio.json`, AudioService có bus `alert`, dừng khi ẩn tab (QB-140…146). Lấy cách tổng hợp âm của PR #9 làm âm tạm cho từng id âm trong `12`, không giữ cấu trúc cũ.
- **ST-21-05:** GDD chính mục 14 ghi pixel art; ngày 13/11 người dùng nói muốn 2.5D (model 3D, lối chơi 2D), chưa chốt. Chỉ mở Story khi người dùng chọn. Nếu giữ pixel art: Kai cao 28 px (PR #9) hay 40 px (`01-Huong-dan-asset.md`) cần chốt cùng lúc; cập nhật `manifest.csv`; đo lại `gate-check` (PR #9 đo 60 FPS ở CPU chậm 6×, tải đầu 1,56 MB). Ảnh để duyệt: `04-Dev-Plan/qa/ST-21-05/`.
- **ST-21-06:** `docs-check` đang để `strings.vi/en.json` trong danh sách file dự kiến; PR #9 dùng một file `strings.json`. Chốt tên file khi mở EP-14.
