# Cyber Vanguard: Gói tài liệu phát triển

Game action-platformer nhập vai kiểu Mega Man (thiết kế nguyên bản), chơi trên điện thoại và web PC. GDD bản 0.8, cập nhật 14/11/2026 (rà soát toàn bộ tài liệu, thêm tài liệu âm thanh, đo lường, cài đặt, nhiệm vụ phụ, Stage 2–4 bản nháp, quy tắc biên; nhật ký thay đổi ở cuối GDD).

> **Chiến lược đã chốt (0.4):** free-to-play (IAP, quảng cáo, subscription Cyber+) cộng endgame farm, **chỉ làm sau cổng MVP**. Giai đoạn 1 chỉ trả lời câu hỏi "game có vui không" (GDD chính mục 16).

## Nội dung gói

| Thư mục | Nội dung |
| --- | --- |
| `01-GDD/` | GDD chính (`01-GDD-chinh.md`) và 16 tài liệu hệ thống (02–17). Danh sách và trạng thái: `04-Dev-Plan/07-Ban-do-he-thong.md` mục 2 |
| `02-Wireframes/` | 97 bảng wireframe HTML; mở `index.html`. Bảng nào lỗi thời so với đặc tả: `02-Wireframes/LOI-THOI.md` |
| `03-Data/` | 18 file JSON cấu hình. Game nạp và kiểm tra các file gameplay khi khởi động; `monetization`, `adplacements`, `liveops`, `endgame` dùng sau cổng MVP |
| `04-Dev-Plan/` | Điểm bắt đầu `00-Bat-dau.md`; kế hoạch, module, test và launch, cổng Prototype và MVP, nhật ký phiên, bản đồ hệ thống, Story (`stories/`), ADR (`adr/`), bằng chứng chạy thử (`qa/`), lưu trữ (`luu-tru/`), công cụ (`tools/`) |
| `05-Assets/` | Hướng dẫn tạo asset, bộ prompt hình, `manifest.csv`, script xử lý ảnh |
| `game/` | Mã nguồn (Phaser 3 + TypeScript + Vite). Chạy: `game/README.md`; kiến trúc và trạng thái module: `game/CONTEXT.md` |

## Bắt đầu thế nào

1. Đọc `04-Dev-Plan/00-Bat-dau.md`: mốc hiện tại, việc đang chờ, danh sách đọc theo loại việc.
2. Thiết kế: `01-GDD/01-GDD-chinh.md`, rồi tài liệu hệ thống cần dùng; tình huống biên ở `01-GDD/17-Quy-tac-bien.md`.
3. Code: theo Story trong `04-Dev-Plan/stories/`, kiểm tra trước commit trong `game/`: `npm test && npm run lint && npm run format:check && npm run build`.
4. Asset làm song song theo `05-Assets/01-Huong-dan-asset.md` + `02-Prompt-asset.md`.
5. Chơi thử và phát hành: `04-Dev-Plan/05-Cong-Prototype.md`, `08-Cong-MVP.md`, `04-Test-va-Launch.md`.

## Quy ước

- Mọi con số `[PLACEHOLDER]` là giả thuyết, chỉnh trong `03-Data/` sau khi chơi thử; số phụ thuộc cảm giác điều khiển ghi `[SAU CỔNG]`.
- Wireframe là khung xám để chốt bố cục, chưa phải thiết kế đồ họa cuối; khi lệch thì đặc tả và dữ liệu đúng.
- Script trong `05-Assets/tools/` cần Python 3 và Pillow (`pip install pillow`).
