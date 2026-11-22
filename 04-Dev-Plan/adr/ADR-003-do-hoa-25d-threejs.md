# ADR-003: Đồ họa 2.5D thời gian thực bằng three.js

- **Ngày tạo:** 2026-11-14
- **Trạng thái:** Proposed. **Hướng đã chọn** (người dùng chọn cách c ngày 14/11/2026, `09-Quyet-dinh-cho-duyet.md` mục 3); **cách chuyển** chờ duyệt Technical Director + Creative Director và đo trên máy thật.
- **Người đề xuất:** Technical Director, Art Director (Game Studio Agent)
- **Phân hệ ảnh hưởng:** lớp hiển thị (thay Phaser), Asset (M1), UI trong trận (HUD), hiệu năng và tải; **không** đổi logic (`src/logic`, `src/core`, `03-Data`).
- **Bằng chứng:** demo `game/demo-25d.html` (`game/src/demo25d/`), video và ảnh ở `04-Dev-Plan/qa/DEMO-25D/`.

## 1. Bối cảnh

GDD chính mục 14 ghi pixel art. Ngày 13/11 người dùng nói muốn 2.5D (model 3D, lối chơi 2D); ngày 14/11 chọn cách c (three.js thời gian thực) trong ba cách: (a) pixel art, (b) model 3D render sẵn thành sprite, (c) 3D thời gian thực. Logic game đã tách khỏi Phaser (`src/logic` thuần, có test), nên đổi lớp vẽ không đụng luật chơi.

## 2. Demo đã chứng minh

- Dùng nguyên `StageWorld`, `03-Data`, phòng boss Thorna; chỉ thay lớp vẽ. Va chạm, đòn boss, checkpoint, thắng thua giữ nguyên.
- Camera phối cảnh (FOV 30°) bám Kai, nghiêng nhẹ để thấy mặt bên khối; khóa vào đấu trường khi đánh boss.
- Ô dựng thành khối có chiều sâu (InstancedMesh, một lần vẽ cho cả bản đồ), rêu sáng ở mép, bục một chiều, cửa năng lượng; rừng nhiều lớp chìm trong sương; bóng đổ, bloom.
- Kai, Thorna dựng từ khối 3D trong code (chưa cần file model): Kai xoay người 3/4 khi đổi hướng, hoạt ảnh chạy, nhảy, lướt (bóng mờ), bị đánh; Thorna lắc, tán lá, mắt và lõi đổi màu theo trạng thái (chờ, báo đòn, ra đòn, choáng, chết chìm xuống).
- Vùng cảnh báo đòn (cột mưa đạn, vệt quất, vết nứt rễ, đường bắn) vẽ 3D từ đúng dữ liệu telegraph của logic.
- Nút chạm HTML như bản Phaser; chất lượng thấp `?q=low` (không bóng, không bloom, pixel ratio 1).
- Kích thước: chunk demo 546 KB (140 KB gzip), three.js gồm cả bloom; game Phaser không nạp three.js.

## 3. Phương án chuyển (đề xuất, chờ duyệt)

| Bước | Nội dung | Điều kiện |
| --- | --- | --- |
| 1 | Đo demo trên máy thật: Android yếu, Android trung, iPhone; mục tiêu ≥ 50 FPS ở chất lượng cao trên máy trung, ≥ 30 FPS `q=low` trên máy yếu | Sau đợt thử G1 (đưa demo lên Pages) |
| 2 | Duyệt ADR (Technical Director: kiến trúc lớp vẽ, ngân sách; Creative Director: phong cách); cập nhật GDD chính mục 14, `05-Assets` (model glTF thay spritesheet), quyết định 320 × 192 + `pixelArt` | Bước 1 đạt |
| 3 | Lớp vẽ chung: renderer three.js đọc `StageWorld` (tách khỏi `src/demo25d`), HUD và bảng HTML giữ nguyên; Phaser còn dùng cho menu cho tới khi thay hết | Bước 2 |
| 4 | Pipeline asset: model low-poly glTF (Kai, kẻ địch, boss), hoạt ảnh xương; nguồn: tự dựng, mua, hay AI tạo 3D; giới hạn tam giác và kết cấu theo ngân sách | Song song bước 3 |
| 5 | Chuyển từng màn; bản Phaser giữ làm dự phòng tới cổng MVP | |

## 4. Hệ quả và rủi ro

- **Tích cực:** chiều sâu, ánh sáng, camera động mà pixel art không có; dựng nhân vật, boss một lần, góc nhìn và hoạt ảnh linh hoạt; logic và test giữ nguyên.
- **Rủi ro hiệu năng:** máy Android yếu có thể không giữ 30 FPS khi có bóng và bloom; cần mức chất lượng tự hạ. Đo FPS trong máy ảo (không GPU) ở đây không có ý nghĩa.
- **Rủi ro asset:** model 3D có hoạt ảnh tốn công hơn sprite; người làm một mình cần nguồn model (mua, AI 3D) và quy trình rõ trước khi làm hàng loạt.
- **Rủi ro tải:** ngân sách tải theo màn ≤ 8 MB (GDD 15) phải tính cả model, kết cấu.
- **Lệch tài liệu:** GDD mục 14, `05-Assets/*`, `manifest.csv`, ST-21-05 (hình vẽ bằng mã) đều theo pixel art; chỉ sửa sau khi duyệt bước 2 (`/propagate-design-change`). ST-21-05 bỏ.
- **Không đổi:** cổng G1 vẫn đo cảm giác điều khiển trên bản Phaser hình khối; logic chung nên kết quả G1 vẫn dùng được.
