# Nhật ký phiên làm việc

Quy tắc bắt buộc (xem `CLAUDE.md`): cuối mỗi phiên thêm một mục mới lên **đầu** danh sách bên dưới. Mục cũ giữ nguyên.

Mẫu:

```
## YYYY-MM-DD: <tiêu đề ngắn>
- Nhánh / commit:
- Mục tiêu:
- Đã làm:
- File chính:
- Quyết định:
- Lỗi tìm thấy / đã sửa:
- Kiểm tra: test, lint, format, build, chạy thử
- Còn dở / chưa làm:
- Tiếp theo:
```

---

## 2026-11-03: Sprint 6, M6 Boss (Thorna + Bramble Golem)

- **Nhánh / commit:** `ccr-b2db3ef4-uu41jr`.
- **Mục tiêu:** người dùng đồng ý làm M6: Thorna thật theo đặc tả Prologue & Stage 1 mục 5 và mini-boss Bramble Golem.
- **Đã làm:**
  - Đổi `GrayBoss` thành `Boss` (`src/logic/boss/boss.ts`), dùng chung cho boss xám và Thorna. `bosses.json` → `attacks` khai đòn nào dùng đòn đó; đòn có trong danh sách pha mà thiếu dữ liệu thì báo lỗi khi nạp.
  - **Thorna** (`03-Data/bosses.json`): HP 100, 3 pha tại 60% / 30%, pha 3 nhanh hơn 20%. Gai Quạt (5 gai xòe 60° ngang tầm người), Dây Quất (hộp ngang sát sàn dài 6 ô, cắt ngắn khi sát tường), Rễ Trồi (3 cột rễ mọc lần lượt trái → phải, vết nứt báo trước), Hoa Nở (12 hạt rơi, 3 khe an toàn, rồi choáng 2 s). Đi chậm về phía người chơi khi nghỉ.
  - Thưởng tách khỏi điểm yếu: `weakness` Ember Burst, `reward` Vine Lash, `rewardExp` 120, `rewardCoreBit` 80 (cộng một lần ở lần thắng đầu, đọc qua `world.exp` / `world.coreBits`; HUD hiện cả phần của boss).
  - **Bramble Golem** (`enemies.json`, `behavior: golem`): 60 máu, pha 1 giậm đất 0,7 s → 2 sóng đất 15 sát thương; từ ≤ 50% máu thì tung 3 hạt nổ (10 sát thương), báo trước 0,5 s rồi lao 4 ô. Chạy trong phòng khóa như kẻ địch thường; rơi 60 EXP và Core Bit.
  - Kiểm tra dữ liệu mới: `reward` phải bằng `weaponGranted` và `weakness` bằng `bossWeakness` của màn; `miniBoss` của màn đã làm phải có trong `enemies.json`; telegraph của mọi đòn Golem ≥ 0,4 s.
  - Phòng thử: `thorna-room.ts` (đấu trường 24 × 12 ô, 3 bục cao 3 ô, menu phím B) và `golem-room.ts` (phòng khóa 20 ô, phím G). `StageDef.boss` chọn boss; scene không còn cứng boss xám.
  - Hiển thị: Thorna màu xanh lục với báo trước riêng từng đòn (vạch gai, vạch dây sát sàn, vết nứt vàng, cột hạt); Golem nhấp nháy cam khi báo trước, đỏ khi lao.
  - Tài liệu: `game/README.md`, `game/CONTEXT.md`, bảng sprint trong `01-Ke-hoach-lam-viec.md`.
- **File chính:** `game/src/logic/boss/boss.ts`, `rain.ts`, `enemy-projectile.ts`; `game/src/core/boss-config.ts`, `enemy-config.ts`, `game-config.ts`; `game/src/logic/enemy/behaviors.ts`; `game/src/stages/thorna-room.ts`, `golem-room.ts`; `game/tests/thorna.test.ts`, `golem.test.ts`; `03-Data/bosses.json`, `enemies.json`.
- **Quyết định:**
  - Gai Quạt báo trước 0,6 s thay vì 0,5 s của đặc tả: pha 3 tăng tốc 20% sẽ còn 0,5 s, vẫn đạt luật "đòn boss ≥ 0,5 s". Số này là `[PLACEHOLDER]`, chỉnh sau playtest.
  - Rễ Trồi nhắm quanh chỗ người chơi đứng lúc bắt đầu báo trước (3 cột cách 3 ô); Hoa Nở thưa hạt (12 hạt) nên có thêm chỗ né ngoài 3 khe bắt buộc.
  - Bramble Golem làm thành kẻ địch (không dùng lớp Boss) để tái dùng phòng khóa, EXP và Core Bit có sẵn.
  - Đấu trường Thorna 24 ô rộng hơn khung 20 ô nên camera đi theo Kai trong đấu trường.
- **Lỗi tìm thấy / đã sửa:** boss giữ vận tốc đi bộ của lúc nghỉ khi vào báo trước nên trượt trong lúc báo trước (test Dây Quất bắt được). Đã đặt vận tốc về 0 khi báo trước.
- **Kiểm tra:** `npm test` 216 test (thêm 24: `thorna.test.ts`, `golem.test.ts`), `npm run lint`, `npm run format:check`, `npm run build` đều đạt. Chạy bản build bằng Chromium: vào phòng Thorna (boss xanh, gai bay, thanh máu có vạch pha) và phòng Golem (cửa khóa, "Còn 1 kẻ địch"); không có lỗi console.
- **Còn dở / chưa làm:** thoại trước/sau trận của Thorna (cần hệ thống thoại), 1 SP (cần hệ thống cấp, M8), sprite, bản đồ thật phòng boss Stage 1 và đoạn C (làm bằng Tiled, chờ cổng Prototype), chưa chơi thử cảm giác với người thật (thời gian thắng 60–90 s mới đo bằng mô phỏng, chưa đo bằng người).
- **Tiếp theo:**
  1. Người dùng: chơi thử phòng Thorna và Golem (phím B, G ở menu) xem cảm giác khe né, thời gian báo trước, độ khó; ghi nhận xét để chỉnh `bosses.json`.
  2. Code: M11 lưu cục bộ (checkpoint, vật phẩm bí mật, Vine Lash đã nhận), M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Hỏi đáp, xác định việc tiếp theo

- **Nhánh / commit:** `ccr-b2db3ef4-uu41jr`.
- **Mục tiêu:** người dùng hỏi phần tiếp theo là gì.
- **Đã làm:** đọc mục nhật ký mới nhất (2026-11-02) và trả lời. Không đổi code.
- **Quyết định:** giữ nguyên lộ trình đã ghi ở mục "Tiếp theo" của phiên 2026-11-02.
- **Kiểm tra:** không áp dụng (không đổi code).
- **Tiếp theo:** (1) người dùng bật GitHub Pages và chơi thử cổng Prototype bằng bản build mới; (2) code M6 Thorna thật + Bramble Golem, rồi M11 lưu cục bộ, M10 HUD cơ bản, TutorialManager.

## 2026-11-02: Sprint 6, khung M7 Màn chơi

- **Nhánh:** `ccr-93d525c1-j97gfr` (từ `main` sau PR #5).
- **Mục tiêu:** đọc kế hoạch để chọn việc tiếp theo, rồi code Sprint 6 (tiếp Vertical slice), bắt đầu bằng M7 Màn chơi. Người dùng đặt quy tắc bắt buộc: mọi phiên phải tóm tắt và ghi lại những gì đã làm (đã đưa vào `CLAUDE.md` và file này).
- **Đọc kế hoạch:** Sprint 1–5 xong (M0–M5, boss xám, công cụ cổng Prototype, đo tự động đạt). Cổng Prototype **chưa** chơi thử với người thật (mục 7 của `05-Cong-Prototype.md` còn trống). Theo mục 6 của file đó, phần mã Vertical slice được làm song song; chỉ thiết kế màn Prologue/Stage 1 phải chờ qua cổng.
- **Đã làm:**
  - Bộ nạp bản đồ **Tiled JSON** (`src/logic/stage/tiled.ts`): lớp ô `ground`/`hazards`, thuộc tính ô `solid`/`oneway`/`hazard`, cờ lật trong gid, đối tượng theo Class (spawn, checkpoint, enemy, target, boss, gate, vine, room, secret, barrier, section), báo lỗi rõ ràng (tileset ngoài, base64, sai cỡ ô, thiếu spawn, Class lạ, thiếu thuộc tính).
  - `StageLayout` chung (`src/logic/stage/layout.ts`) cho cả ASCII và Tiled; `StageWorld` nhận `layout`; `EnemyField` nhận danh sách kẻ địch thay vì ký hiệu chữ.
  - Cơ chế màn (`src/logic/world/stage-mechanics.ts` + `stage-world.ts`): checkpoint (lưu khi đi qua, hồi sinh 1 s, giữ Core Bit/EXP, vào lại từ checkpoint đã lưu), **hố** (−20 máu, về checkpoint, hết máu mới tính chết), **gai** (−30 máu, về chỗ đứng an toàn, bất tử, Spike Guard miễn nhiễm), **dây leo đu** (con lắc 2,4 s, lệch 3 ô, bệ chở người, nhảy khỏi bệ +10%, Xuống + Nhảy rơi xuyên), **phòng khóa** (đóng cửa khi vào, đếm kẻ địch còn lại, mở khi hạ hết, chết thì mở lại), **vật chắn** chỉ vỡ bằng đúng vũ khí, **vật phẩm bí mật**.
  - Vật lý Kai: hỗ trợ bệ di động (`Platform`) và `hitHazard`.
  - Dữ liệu: `03-Data/stages.json` thêm `mechanics` (mọi con số M7), có kiểm tra: hồi sinh ≤ 1,5 s, gai/hố không giết ngay Kai cấp 1 ở độ khó nặng nhất, dây không ngắn hơn biên độ.
  - Hiển thị: vẽ gai, cờ checkpoint, dây leo, cửa phòng khóa, vật chắn, bí mật; HUD "Còn N kẻ địch"; thông báo checkpoint/nhặt đồ; camera khóa trong phòng khóa.
  - **Phòng thử màn chơi** (menu, phím M): bản đồ Tiled `game/maps/m7-test.json` sinh từ bản phác `maps/src/m7-test.map.json` bằng script mới `scripts/ascii-to-tiled.mjs` (tạo kèm tileset xám PNG).
  - Tài liệu: `game/maps/README.md` (quy ước làm bản đồ Tiled), `game/README.md`, `game/CONTEXT.md`, bảng sprint trong `01-Ke-hoach-lam-viec.md`, lưu ý bản build trong `05-Cong-Prototype.md`, `CLAUDE.md` (quy tắc phiên).
- **Quyết định:**
  - Rơi hố không còn là chết (theo đặc tả Stage 1 mục 3): `world.falls` đếm riêng; nhật ký chơi thử vẫn tính rơi hố là một lần hỏng ở đoạn đó để so sánh được với số liệu cũ.
  - Sát thương gai/hố nhân `damageTaken` của độ khó như đòn kẻ địch.
  - Bất tử khi lướt không cứu khỏi gai; đang bất tử sau cú đánh thì chạm gai chỉ bị đưa về, không mất máu.
  - Bản đồ Tiled phải nhúng tileset và lưu lớp ô dạng CSV (đơn giản, dễ đọc diff).
  - Thắng boss rồi ra khỏi phòng thì về checkpoint cuối, không về điểm xuất phát.
- **Lỗi tìm thấy / đã sửa:** **lỗi chết lặp có từ Sprint 3–5**: sau lần chết đầu tiên, sự kiện "chết" cũ còn trong `PlayerPhysics.events` nên Kai hồi sinh rồi chết lại mãi (đã tái hiện trên bản cũ: 7 lần chết trong 400 bước sau một cú đánh). Sửa: `respawn()` xóa sự kiện; thêm test. Bản build trên Pages trước bản này có lỗi đó, đã ghi chú trong `05-Cong-Prototype.md`.
- **Kiểm tra:** `npm test` 192/192 (thêm 20 test ở `tests/stage-mechanics.test.ts` và 1 test hồi sinh), `npm run lint`, `npm run format:check`, `npm run build` đều đạt. Chạy bản build bằng Chromium: vào phòng thử màn chơi, xem dây leo, phòng khóa (khóa cửa, khóa camera, đếm 2 kẻ địch), vật chắn và bí mật; không có lỗi console.
- **Còn dở / chưa làm của M7:** bản đồ thật Prologue và Stage 1 (chờ qua cổng Prototype), thang và dây leo đứng yên (cần leo trèo, thuộc M3), bệ dây di chuyển (đoạn B), lớp parallax, lưu checkpoint và vật phẩm bí mật (M11), Bramble Golem.
- **Tiếp theo:**
  1. Người dùng: bật GitHub Pages và chạy đợt chơi thử cổng Prototype với bản build mới (đã sửa lỗi chết lặp).
  2. Code: M6 Thorna thật (khung 3 pha đã có từ boss xám) + Bramble Golem, rồi M11 lưu cục bộ (checkpoint, vật phẩm bí mật), M10 HUD cơ bản, TutorialManager.
