# ADR-002: Gom dữ liệu đo lường cho đợt thử MVP khi chưa có máy chủ

- **Ngày tạo:** 2026-11-14
- **Trạng thái:** Proposed. **Chờ người dùng chọn** (dữ liệu chơi rời máy người thử; đây là quyết định của chủ dự án, không ủy quyền được).
- **Người đề xuất:** Technical Director, Producer, QA Lead (rà soát 14/11/2026, F02)
- **Phân hệ ảnh hưởng:** Meta (M16 bản rút gọn), Persistence, UI (Cài đặt → Dữ liệu)
- **Tài liệu thiết kế:** `01-GDD/13-Do-luong-MVP.md` (mục tiêu đo, danh sách sự kiện, quyền riêng tư, lược đồ); cổng `04-Dev-Plan/08-Cong-MVP.md`.

## 1. Bối cảnh

Cổng MVP đo khoảng 50 người qua bản web: phễu Prologue → Stage 4, quay lại ngày hôm sau, dùng vũ khí khắc chế, chênh lệch cảm ứng và bàn phím, đoạn bị bỏ cuộc. GDD chính mục 16 nói Giai đoạn 1 không làm máy chủ. Công cụ cổng Prototype chỉ ghi cục bộ rồi người thử tự xuất JSON. Cách đó ổn với 5 người ngồi cạnh, không ổn với 50 người chơi ở nhà trong 7 ngày: người bỏ cuộc là nhóm cần đo nhất nhưng ít gửi file nhất, và chỉ số quay lại ngày sau cần dữ liệu tự đến.

## 2. Các phương án

| Tiêu chí | A: nhật ký cục bộ + xuất/gộp JSON | B: một bảng chỉ-ghi trên dịch vụ có gói miễn phí (Supabase), nhật ký cục bộ làm bộ đệm | C: dịch vụ phân tích có sẵn (Firebase Analytics, PostHog…) |
| --- | --- | --- | --- |
| Cơ chế | Ghi `cv.telemetry` trên máy; người thử bấm Xuất, gửi qua Zalo/email; người tổng hợp gộp | Ghi trên máy, gửi từng lô khi có mạng (`fetch keepalive`, thử lại); người tổng hợp tải bảng về chạy báo cáo | SDK gửi sự kiện tự động, bảng điều khiển có sẵn |
| Ưu | Không dịch vụ ngoài; dữ liệu chỉ rời máy khi người thử tự gửi | Có dữ liệu của người bỏ cuộc; quay lại ngày sau tự động; thu 0 công; chi phí 0 (< 5 MB cả đợt); GDD 15 đã chọn Supabase cho Beta | Ít code; biểu đồ sẵn |
| Nhược, rủi ro | Sai lệch "đạt giả" ở phễu và quay lại; 4–6 giờ thu tay mỗi đợt; mất dữ liệu khi người thử xóa trình duyệt | Thêm khoảng 1,5 ngày code (bảng, quy tắc chỉ ghi, hàm xóa, bộ gửi); khóa ghi công khai có thể bị ghi rác; cần đồng ý và cách xóa | SDK thu nhiều hơn mức cần (định danh thiết bị, IP); khó giữ cam kết riêng tư mục 4 của GDD 13; nặng bản build; lệch "không máy chủ, không analytics thương mại trước cổng" |
| Hiệu năng | Không đáng kể | Không đáng kể (gửi theo lô, ngoài vòng khung hình) | SDK chạy nền, tăng tải đầu |

## 3. Quyết định đề xuất

- **Đề xuất: Phương án B**, giữ A làm đường dự phòng (cùng định dạng lô; nút Xuất JSON vẫn có ở Cài đặt → Dữ liệu). Không chọn C.
- **Lý do:** mọi chỉ số chặn cổng (phễu, quay lại, đoạn bỏ cuộc) bị A làm đẹp giả theo đúng chiều nguy hiểm; B tốn công một lần, hòa vốn sau 2–3 đợt.
- **Ranh giới để không thành "làm máy chủ trước cổng":** một bảng chỉ-ghi; game không đọc lại; không đăng nhập; game chạy đủ khi điểm nhận chết hoặc bị chặn; chỉ bản mở bằng `?mvp=<đợt>` mới ghi và gửi; xóa dự án sau khi chốt cổng + 90 ngày.
- **Luồng dữ liệu:**
  ```text
  StageScene, PrepScene, Quầy, Xưởng, TutorialManager ──sự kiện──▶ Telemetry (thuần, logic/telemetry/)
    ──▶ cv.telemetry (localStorage, bộ đệm) ──▶ Uploader (lô, thử lại) ──▶ bảng chỉ-ghi
  Người tổng hợp: tải bảng và/hoặc JSON xuất tay ──▶ npm run mvp-report ──▶ báo cáo đợt
  ```
- **Nếu người dùng không muốn dịch vụ ngoài nào:** dùng A, thu bắt buộc ngày 2 và ngày 8; báo cáo ghi tỷ lệ người gửi và coi người không gửi là bỏ cuộc ở đoạn cuối đã biết (ước lượng xấu nhất).

## 4. Hệ quả và quy tắc bắt buộc

- **Tích cực:** cổng MVP đo được tự động; cùng code ghi sự kiện dùng lại cho M16 đầy đủ sau này.
- **Đánh đổi:** một dịch vụ ngoài trong Giai đoạn 1; phải giữ đúng cam kết riêng tư.
- **Quy tắc cho Story (EP-13):**
  1. Không thu tên, email, IP, vị trí, `userAgent` đầy đủ, `gamepad.id`, dấu vân tay thiết bị; định danh là UUID ngẫu nhiên trên máy (GDD 13 mục 4).
  2. Đồng ý hai lớp (lúc tuyển và trong game); có nút "Tắt gửi và xóa nhật ký" và mã xóa.
  3. Logic ghi sự kiện là thuần (`src/logic/telemetry/`), có test; gửi mạng nằm ngoài vòng khung hình, không cấp phát mỗi khung.
  4. Khóa trong bản build chỉ ghi được, không đọc được; khóa quản trị không vào repo.
  5. Lỗi mạng, bị chặn: game chạy bình thường, không hiện lỗi cho người chơi.
  6. Không phải tư vấn pháp lý; trước đợt thử, người dùng xác nhận phiếu đồng ý và độ tuổi tối thiểu.
