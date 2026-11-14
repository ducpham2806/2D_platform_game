# ST-08-09: Module và Két giáp (bị chặn, tách lại khi gỡ chặn)

- **Thuộc Epic:** EP-08 · **Ưu tiên:** P0 (MVP) · **Trạng thái:** BLOCKED
- **Phụ thuộc:** ST-08-05
- **Bị chặn bởi** (cập nhật 14/11/2026 sau rà soát; sẽ làm trong **EP-18**, kế hoạch S13–S16):
  - Nhiệm vụ phụ (nguồn module): đặc tả đã có (`01-GDD/15-Nhiem-vu-phu.md`, Draft); ST-18-01…06 không bị chặn, làm trước.
  - Bản đồ Stage 1–4 chờ qua cổng Prototype (G1).
  - Prism Beam, Frost Shard, Gale Cutter, boss Lumen, Cryo, Aeris: EP-15 (`01-GDD/16-Dac-ta-Stage2-4-nhap.md`).
- **Đổi theo rà soát:** tab Module mở khi nhận module đầu tiên (không cố định "sau boss 3"); Thân Mk II **thay thế** Mk I (−15% kèm phản đòn 2), không cộng dồn; id giáp chân là `leg_mk1`, `leg_mk2` (theo `stages.json`); Magnet Core cộng dồn tầm hút theo QB-63 (`17-Quy-tac-bien.md`).

## Phạm vi khi gỡ chặn (tách thành 3–4 Story ≤ 2 ngày)

1. **Dữ liệu:**
   - `moduleSlots` dạng `[{ fromLevel, slots }]` (1 → 3, 10 → 4, 20 → 5), `moduleLoadPerSlot = 2`.
   - `modules.json` có `cost` (Magnet Core 1, Last Stand 3, Phase Step 3, Energy Siphon 1), tham số và `conditional`.
   - `armor.json` chỉ giữ bộ phận → hiệu ứng, có bất biến khớp `stages.json` → `armorCache`.
2. **Hiệu ứng module:**
   - Magnet Core: 3 ô, 8 ô/s.
   - Last Stand: dưới 20% máu, ×1,3.
   - Energy Siphon: +2 năng lượng mỗi lần hạ.
   - Phase Step: ảo ảnh 0,6 s, choáng 0,3 s. Cần thêm trạng thái choáng cho mọi hành vi kẻ địch; boss và mini-boss miễn.
3. **Hiệu ứng giáp MVP:**
   - Đầu Mk I radar 12 ô: mũi tên tĩnh, ẩn trong đấu trường và khi có kẻ địch trong 6 ô; hai biểu tượng "lấy được" và "cần [vũ khí X]"; ping ≤ 1 lần mỗi 10 s.
   - Thân Mk I: sát thương nhận ×0,85, chỉ với đòn kẻ địch và boss.
   - Tay Mk I: đạn nạp vừa phá khiên.
   - Bộ phận đã có suy từ bí mật đã nhặt.
4. **Xưởng tab Module và Giáp:** lắp và gỡ, thanh tải, "Vượt tải" (nút lắp mờ), bật/tắt bộ phận. Lưu vào `character.loadouts[0]`.
