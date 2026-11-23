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

## 5. Thử 3D platformer ngày 23/11/2026

Người dùng chọn thử di chuyển của Kai theo cả bề ngang lẫn chiều sâu, ngoài trục nhảy. Đợt này kiểm tra khả năng đọc điểm đáp, hướng camera và mục tiêu bắn trên điện thoại. Demo Thorna là mốc tham chiếu về hình ảnh và hiệu năng.

### Đợt thử đầu tiên

| Bước | Bản giao | Cách đánh giá |
| --- | --- | --- |
| 1. Phòng thử chuyển động | Một phòng xám chơi khoảng 60–90 giây. Kai chạy ngang và sâu, nhảy qua hai bục lệch chiều sâu, lướt, bắn một mục tiêu và hồi sinh ở checkpoint. Camera bám tự động góc 3/4. | Trên PC và điện thoại ngang, người thử nhận ra đường đi, điểm đáp và mục tiêu. Ghi lần rơi do nhìn sai chiều sâu, lúc camera che Kai và lúc thao tác bắn làm người chơi mất hướng. |
| 2. Asset thử trong game | Một Kai low-poly có rig, clip đứng, chạy, nhảy/rơi, tiếp đất và lướt. Một điểm gắn nòng Arc Cannon. Bộ địa hình gồm sàn, bục, mép và vách có thể ghép. Hiệu ứng mẫu gồm tia bắn và bóng chỉ điểm đáp. | Thay khối xám bằng model ngay trong phòng thử. So hình dáng Kai ở kích thước trên điện thoại, độ rõ của mép bục và khả năng nhận ra điểm đáp khi nhảy. |
| 3. Đo và quyết định | Một bản Web có phím và cảm ứng. Đo tải phòng, nhịp khung hình và chất lượng thấp trên Android yếu, Android tầm trung và iPhone thật. | Dùng ngưỡng thử trong ADR là ≥ 50 FPS trên Android tầm trung và ≥ 30 FPS ở mức thấp trên Android yếu. Đối chiếu ngân sách tải thêm ≤ 8 MB mỗi màn và mục tiêu MVP ≥ 55 FPS trên máy tầm trung trước khi mở rộng sản xuất. |

Kai và bộ địa hình sci-fi low-poly được dựng song song với phòng xám. Phòng dùng một rig Kai và một bộ vật liệu cho từng model. Danh sách kẻ địch, boss và môi trường theo màn sẽ được lập sau khi chơi thử.

Giữ nguồn chỉnh sửa trong Blender và xuất `.glb` để thử bằng `GLTFLoader` của three.js. Ghi kích thước, hướng trước, gốc ở chân, tên clip và điểm gắn nòng của từng model. Model và animation đi theo trạng thái điều khiển. Va chạm và tính đòn thuộc lớp gameplay, nên kit địa hình và rig có thể dùng lại nếu chọn 2.5D. [Tài liệu hoạt ảnh three.js](https://threejs.org/manual/pages/animation-system.html)

[Phòng thử ST-22-06](../stories/EP-22-do-hoa-25d.md#st-22-06-phòng-thử-3d-platformer-và-asset-mẫu) đã chạy trọn tuyến bằng bàn phím và Pixel 7 ngang giả lập. [Kết quả và ảnh chạy thử](../qa/ST-22-06/README.md) ghi thời lượng từng lượt. Đo tải và FPS trên máy thật còn chờ.

Nếu phòng thử cho thấy chiều sâu tạo thêm lựa chọn nhảy, né hoặc tiếp cận mục tiêu, lập ADR riêng cho gameplay 3D và ước lượng lại camera, va chạm, nhắm bắn, bản đồ và AI. Dùng tài liệu hiện có làm nguồn cho nhân vật, thế giới, vũ khí và chỉ số, rồi kiểm lại các số ảnh hưởng đến cảm giác chơi. Nếu ưu tiên ra bản MVP sớm hoặc người chơi khó đọc chiều sâu trên điện thoại, đưa Kai và bộ địa hình vào demo 2.5D theo mục 3.
