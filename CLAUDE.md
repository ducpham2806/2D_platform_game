# Hướng dẫn cho Claude trong repo này

Dự án: Cyber Vanguard, action-platformer 2D (Phaser 3 + TypeScript + Vite). Trả lời người dùng bằng tiếng Việt.

## Đọc trước khi làm

- `game/CONTEXT.md`: kiến trúc, quyết định đã chốt, trạng thái module.
- `04-Dev-Plan/01-Ke-hoach-lam-viec.md`: lộ trình sprint; `04-Dev-Plan/02-Module.md`: danh sách module.
- `04-Dev-Plan/06-Nhat-ky-phien.md`: nhật ký các phiên gần nhất (đọc mục mới nhất để biết đang dừng ở đâu).
- **Không** đọc `04-Dev-Plan/luu-tru/` đầu phiên (bản kế hoạch đầy đủ, nhật ký cũ); chỉ tra khi cần lịch sử.

## Quy tắc bắt buộc: tóm tắt và ghi lại mỗi phiên

Người dùng yêu cầu (02/11/2026): **mọi phiên làm việc phải tóm tắt và ghi lại những gì đã làm.** Trước khi kết thúc phiên (và trước commit cuối):

1. Thêm một mục mới (ngắn, khoảng 15 dòng) lên **đầu** `04-Dev-Plan/06-Nhat-ky-phien.md` theo mẫu trong file đó: ngày, nhánh, mục tiêu, việc đã làm, file chính đã đổi, quyết định, lỗi tìm thấy/đã sửa, kết quả kiểm tra (test, lint, build), việc còn dở và việc tiếp theo. File chỉ giữ tối đa 3 mục; mục cũ hơn chuyển lên đầu `04-Dev-Plan/luu-tru/06-Nhat-ky-phien-luu-tru.md`.
2. Cập nhật `game/CONTEXT.md` (trạng thái module, quyết định mới) và bảng sprint trong `04-Dev-Plan/01-Ke-hoach-lam-viec.md` nếu tiến độ thay đổi.
3. Commit nhật ký cùng với thay đổi của phiên.
4. Cuối câu trả lời cho người dùng, tóm tắt ngắn những gì đã làm và trỏ tới nhật ký.

Phiên chỉ hỏi đáp, không đổi code, vẫn ghi một mục ngắn.

## Kiểm tra trước khi commit (trong `game/`)

```
npm test && npm run lint && npm run format:check && npm run build
```

## Nguyên tắc code

- Mọi chỉ số đọc từ `03-Data/*.json`, không viết cứng; dữ liệu mới phải có kiểm tra trong `game/src/core/*-config.ts`.
- `src/logic/` và `src/core/` là logic thuần, không import Phaser; có test Vitest cho phần logic.
- Không chốt thiết kế màn Prologue và Stage 1 trước khi qua cổng Prototype (`04-Dev-Plan/05-Cong-Prototype.md`).
