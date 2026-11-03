# Nhật ký phiên làm việc

Quy tắc bắt buộc (xem `CLAUDE.md`): cuối mỗi phiên thêm một mục mới lên **đầu** danh sách bên dưới.

Để giảm token đầu phiên:

- File này chỉ giữ **tối đa 3 mục mới nhất**. Khi thêm mục mới mà vượt 3, chuyển mục cũ nhất lên đầu `04-Dev-Plan/luu-tru/06-Nhat-ky-phien-luu-tru.md` (không sửa nội dung).
- Mỗi mục ngắn gọn, khoảng 15 dòng: chi tiết kỹ thuật thuộc về commit và `game/CONTEXT.md`, không chép lại ở đây.
- Mục "Tiếp theo" của mục mới nhất là nơi phiên sau bắt đầu.

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

## 2026-11-03: Sprint 7, M11 lưu cục bộ

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng đồng ý làm M11 (lưu cục bộ của Vertical slice).
- **Đã làm:** `logic/save/` (thuần): `SaveData` (boss đã hạ, checkpoint + bí mật theo màn, EXP, vũ khí boss, Core Bit, thời gian chơi, revision, savedAt; hỏng từng phần về mặc định), mã sao lưu `CV1.<base64url>.<FNV-1a>`, `SaveManager` (ghi theo thứ tự, không ghi đè bản của phiên bản mới hơn), `StageSave` (nối sự kiện StageWorld với bản lưu). Kho IndexedDB, dự phòng localStorage. `StageWorld` nhận `ownedWeapons`, `takenSecrets`, `bossDefeated`. Màn mới "Dữ liệu lưu" (menu S): tóm tắt, sao chép/nhập mã, xóa tiến trình; menu hiện tóm tắt bản lưu.
- **File chính:** `game/src/logic/save/*.ts`, `game/src/save/*.ts`, `game/src/scenes/save-scene.ts`, `stage-scene.ts`, `menu-scene.ts`, `preload-scene.ts`, `game/src/logic/world/stage-world.ts`, `game/tests/save.test.ts`.
- **Quyết định:** ghi ngay khi qua checkpoint/nhặt bí mật/nhận vũ khí/hạ boss; EXP và Core Bit cộng phần chênh lệch cả khi thoát màn (không mất, không trùng). Hạ boss thì lần sau vào lại từ đầu màn. Vũ khí boss dùng được ở mọi màn. Màn xám (cổng Prototype) không đọc, không ghi bản lưu. Cài đặt điều khiển tạm giữ ở `cv.controls`, gộp vào bản lưu khi làm cloud.
- **Lỗi tìm thấy / đã sửa:** không có.
- **Kiểm tra:** `npm test` 231 test (thêm 15 ở `save.test.ts`), lint, format:check, build đều đạt. Chromium: qua checkpoint ở phòng thử màn chơi → Esc → tải lại trang → vào lại đúng checkpoint 1; bảng Dữ liệu lưu vừa màn 740 × 360, mã sai báo lỗi, gõ phím trong ô không lọt xuống menu; không có lỗi console.
- **Còn dở:** cloud save (Backend, xung đột hai thiết bị), các nhóm dữ liệu của module chưa làm (SP, kỹ năng, skin, nhiệm vụ, kỷ lục).
- **Tiếp theo:** (1) người dùng chơi thử Thorna/Golem và cổng Prototype 5 người; (2) code M10 HUD cơ bản, rồi TutorialManager.

## 2026-11-03: Hỏi đáp, việc tiếp theo trong kế hoạch

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng hỏi công việc tiếp theo trong kế hoạch.
- **Đã làm:** đọc mục nhật ký mới nhất và bảng lộ trình, trả lời. Không đổi code.
- **Kiểm tra:** không áp dụng (chỉ hỏi đáp).
- **Tiếp theo:** không đổi so với mục bên dưới: (1) người dùng chơi thử phòng Thorna/Golem và cổng Prototype 5 người; (2) code M11 lưu cục bộ, rồi M10 HUD cơ bản, TutorialManager.

## 2026-11-03: Rút gọn kế hoạch, lưu trữ nhật ký cũ

- **Nhánh / commit:** `claude/condense-plan-archive-logs-kqnyvb`.
- **Mục tiêu:** người dùng yêu cầu rút gọn file kế hoạch và chuyển nhật ký cũ sang file lưu trữ để giảm token đầu phiên.
- **Đã làm:**
  - `01-Ke-hoach-lam-viec.md` rút từ khoảng 8,9 KB xuống khoảng 3,5 KB: giữ quy tắc chính và bảng lộ trình (cột trạng thái ngắn gọn); bỏ vòng lặp làm việc với ChatGPT, nhịp tuần, bảng rủi ro. Bản đầy đủ chuyển sang `luu-tru/01-Ke-hoach-lam-viec-ban-day-du.md`.
  - Nhật ký: 3 mục cũ (M6 Boss, hỏi đáp 2026-11-03, khung M7 2026-11-02) chuyển nguyên văn sang `luu-tru/06-Nhat-ky-phien-luu-tru.md`. File này thêm quy tắc giữ tối đa 3 mục, mỗi mục khoảng 15 dòng.
  - `CLAUDE.md`: thêm quy tắc lưu trữ, ghi rõ không đọc thư mục `luu-tru/` đầu phiên.
- **File chính:** `CLAUDE.md`, `04-Dev-Plan/01-Ke-hoach-lam-viec.md`, `04-Dev-Plan/06-Nhat-ky-phien.md`, `04-Dev-Plan/luu-tru/`.
- **Quyết định:** "plan.md" hiểu là `01-Ke-hoach-lam-viec.md` (repo không có file `plan.md`). Không đổi `game/CONTEXT.md` trong phiên này.
- **Kiểm tra:** chỉ đổi tài liệu, không đổi code; `npm run format:check` đạt.
- **Còn dở:** `game/CONTEXT.md` (khoảng 26 KB) là file lớn nhất được đọc đầu phiên, có thể rút gọn tiếp nếu người dùng muốn.
- **Tiếp theo** (giữ từ phiên M6):
  1. Người dùng: chơi thử phòng Thorna và Golem (phím B, G ở menu), ghi nhận xét để chỉnh `bosses.json`; chơi thử cổng Prototype với 5 người.
  2. Code: M11 lưu cục bộ (checkpoint, vật phẩm bí mật, Vine Lash đã nhận), M10 HUD cơ bản, TutorialManager.
