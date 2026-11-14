# Quyết định chốt theo ủy quyền, chờ người dùng xem lại

Người dùng giao toàn quyền quyết định (14/11/2026). Các quyết định dưới đây đã chốt qua quy trình Game Studio Agent (rà soát 4 nhóm, duyệt Creative Director và Technical Director + Producer) và đã ghi vào tài liệu. Không đồng ý điểm nào thì nói, em sửa theo `/propagate-design-change`. Điểm nào người dùng đã xem thì gạch đầu dòng bằng "đã xem".

## Cần người dùng quyết (không ủy quyền được)

1. **Kênh gửi dữ liệu đo lường cho cổng MVP** (`adr/ADR-002-do-luong-mvp.md`): đề xuất một bảng chỉ-ghi trên Supabase gói miễn phí; phương án khác là thu JSON bằng tay. Kèm hai lựa chọn: mặc định gửi hay chạm đồng ý một lần.
2. **Pháp lý** trước đợt thử MVP: phiếu đồng ý, độ tuổi tối thiểu người thử (đề xuất 16).
3. **Hướng đồ họa** (thêm 14/11; chặn ST-21-05 và asset P0, P1). **Người dùng đã chọn (c) 2.5D thời gian thực bằng three.js (14/11/2026).** Demo: `game/demo-25d.html`, video `qa/DEMO-25D/`; kiến trúc và cách chuyển: `adr/ADR-003-do-hoa-25d-threejs.md` (Proposed), Epic EP-22. ST-21-05 bỏ. GDD chính mục 14 ghi pixel art; ngày 13/11 (phiên của PR #9) anh nói muốn 2.5D: model 3D, lối chơi 2D. Ba lựa chọn:
   - (a) **Giữ pixel art**, dùng bộ hình vẽ bằng mã của PR #9 làm nền rồi thay dần bằng hình vẽ tay. Rẻ nhất; ảnh để xem ở `qa/ST-21-05/` (so sánh với bản hình khối hiện tại). Cần chốt thêm: Kai cao 28 px (PR #9) hay 40 px (hướng dẫn asset).
   - (b) **2.5D render sẵn:** dựng model 3D, render thành spritesheet, giữ Phaser và toàn bộ code. Cần công cụ 3D và người dựng model; đổi `05-Assets` (manifest, prompt), xem lại quyết định 320 × 192 + `pixelArt`.
   - (c) **2.5D thời gian thực** bằng three.js: giữ `src/logic`, viết lại lớp scene. Đắt nhất, rủi ro tải (ngân sách 30 MB) và hiệu năng trên Android yếu.
   Đề xuất: (a) cho MVP, vì G1 và G3 đo lối chơi, không đo hình; cân nhắc (b) sau cổng MVP khi có ngân sách asset.

## Gameplay lõi (GDD chính 0.8, `10`, `11`, `17`)

- Thorna giữ 250 máu; trận khoảng 45–65 s (thay 60–90 s).
- Thân Mk II **thay thế** Mk I: −15% sát thương nhận kèm phản đòn 2 (giữ trần sức mạnh 3,65).
- Cuối cốt truyện cấp 22–24, tổng 31–33 SP; mỗi màn có ngân sách EXP (`expBudget`); hết MVP ở cấp 10, 13 SP.
- Nano Cell: tối đa 4, hồi 40% máu, khóa 0,4 s, nút riêng `heal`, nạp đầy khi vào màn mới; bỏ khỏi nhánh kỹ năng Core.
- Khoảng cách checkpoint: Cốt truyện ≤ 90 s, Thường ≤ 150 s, Thử thách ≤ 270 s.
- Kẻ địch dựng lại sau khi Kai chết không trả EXP, Core Bit lần nữa (đã code).
- Năng lượng tối đa ở Energy Cell tối đa là 49 (không phải 50); hồi năng lượng sau 2 s.
- Quy tắc biên: 101 luật ở `01-GDD/17-Quy-tac-bien.md` (ví dụ: boss và Kai hết máu cùng lúc thì thắng; một đòn qua hai ngưỡng pha thì kẹp; vũ khí bắn nhanh không khóa choáng boss mãi).

## Stage 2–4 và nhiệm vụ phụ (`15`, `16`)

- Thưởng theo màn tách EXP và Core Bit (EXP ×1,8/3,0/4,0; Core Bit ×1,8/1,9/2,0).
- Prism Beam bắn nhanh hơn (hồi 0,3 s) để vòng khắc chế đủ rõ; laser môi trường không đánh kẻ địch; Gale Cutter hủy tối đa 2 đạn mỗi lần ném.
- Aeris bay 3–6 ô, lốc ≤ 2,5 ô; gió không đẩy Kai khi đang bị đánh.
- 4 nhiệm vụ phụ do Mira giao, mở sau boss 3; mỗi cái 1 Data Chip và 1 module; không thưởng EXP.
- Két Chân Mk I ở Stage 4 hiện khóa "cần Quake Drill" trong MVP.

## Kinh tế và kiếm tiền (sau cổng MVP; `04`, `05`, `06`)

- Bỏ Data Chip khỏi live-ops; Gem không đổi ra Core Bit, Data Chip, booster, vật liệu hay Chip, kể cả gián tiếp.
- Core Bit ngoài màn ≤ 25% thu từ màn; vòng quay 60/150; nhân đôi bằng quảng cáo trong cốt truyện ×1,5.
- Cyber+: gói năm 5 Gem/ngày; Lifetime chỉ tắt quảng cáo ép; Cyber+ là ngoại lệ của trụ cột 5 (chỉ thay thao tác xem quảng cáo, cùng hạn mức).
- Starter Pack dùng skin Rookie Neon; Season Pass 28 ngày; interstitial tối đa 2 lượt/ngày.
- Còn mở: Sweep cho thưởng đủ làm người chi Gem nhanh hơn người không xem quảng cáo 2,6 lần (KPI ≤ 2×), ghi ở `04` mục 12, xử lý trước Live-ops.

## Giao diện, hướng dẫn, lời thoại (`03`, `07`, `08`, `14`)

- Chỉ hỗ trợ màn ngang; lần mở đầu vào thẳng Prologue, Menu chính từ lần thứ hai.
- Mỗi lần về Hub mở tối đa 1 hệ thống + 1 nhịp truyện; tab Module mở khi nhận module đầu tiên; Tủ skin, Loadout sau boss 5.
- Một cờ `weaknessKnown[boss]` cho mọi chỗ lộ điểm yếu.
- Thứ tự hộp chữ: hội thoại > Kết quả > gợi ý chết > hướng dẫn > câu nhiệm vụ > báo ngắn.
- NOVA gọi người chơi là "cậu"; lời bước hướng dẫn chỉ nằm ở `tutorial.json`.

## Quy trình

- Kế hoạch S9–S21, epic EP-11…EP-20, ba cổng G1/G2/G3 (`01-Ke-hoach-lam-viec.md`).
- Đóng băng bản thử G1 (tag `gate-r1`) trước khi code tiếp; sửa safe-area trước khi phát link cho người thử.
