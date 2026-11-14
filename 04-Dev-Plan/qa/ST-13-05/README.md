# ST-13-05a: báo cáo cổng MVP (chạy thử)

- **Bản chạy:** `npm run mvp-report` trên bộ dữ liệu mẫu có đáp án (`game/tests/mvp-sample.ts`: 20 người chơi giả và 4 install biên), 14/11/2026. Story không đổi gì người chơi nhìn thấy; bằng chứng là báo cáo Markdown.
- **Lệnh:** `npm --prefix game run mvp-report -- --day0 2026-11-20 --wave d1 --out <file.md> <gói xuất.json> <bảng tải.json>`, gọi từ gốc repo (đường dẫn tương đối tính từ thư mục gọi).

| File | Nội dung |
| --- | --- |
| `bao-cao-mau-nguong-that.md` | Ngưỡng thật (`telemetry.json`): 20 người chưa đủ mẫu 30, nên MV1–MV6 là Thiếu dữ liệu; MV7 vẫn Không (+50%) |
| `bao-cao-mau-mau-nho.md` | Như trên nhưng hạ mẫu tối thiểu còn 10 và 3, để thấy Đạt / Không / Hỏng; đáp án ở `game/tests/mvp-report.test.ts` |

**Bộ mẫu có những trường hợp (GDD 13 mục 9):** staff; phiên quá ngắn (đã vào Prologue); ghi rác (400 sự kiện trong 2 phút); bản vá đổi dữ liệu (`data` khác); lô sai phong bì; sự kiện có khóa lạ; lô gửi lại và gói xuất chồng lên bảng (bản trùng); lượt qua hai phiên (QB-154); phiên có `sid` nhỏ hơn phiên trước (sắp theo `t`); đồng hồ máy lùi; phiên ngoài cửa sổ đo; người bắt đầu ngày 7; chơi Stage 3 trước Stage 2; thắng boss xám rồi `stage_end{clear}` (không tính là xong); lượt có giảm tốc; trận boss thiếu `weaknessOwned`; hai trận Lumen, gộp sát thương thì tỷ lệ Vine Lash thấp.

**Chưa có trong bản này:** K, DK, T, X, S (ST-13-05b). Prologue chưa có bản đồ thật, nên ở đợt thật MV1 và H1 của Prologue là Thiếu dữ liệu tới khi Prologue ghi `stage_end{prologue, clear}` và có danh sách đoạn.
