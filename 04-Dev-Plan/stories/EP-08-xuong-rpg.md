# EP-08: Hệ thống RPG và Xưởng (M8)

- **Mốc:** Vertical slice cần ST-08-01 → ST-08-05 (tab Kỹ năng và hiệu ứng thông số); MVP thêm ST-08-06 → ST-08-08 (cơ chế mới của tầng 2–3); ST-08-09 (Module, Két giáp) bị chặn.
- **GDD:** `01-GDD/10-He-thong-RPG-Xuong.md` (bản 2, In Review). **ADR:** `04-Dev-Plan/adr/ADR-001-xuong-bang-html.md`.
- **Đã có trước epic này:** cấp, EXP, SP, đồng bộ cấp, lên cấp giữa màn (`game/src/logic/rpg/progression.ts`, Sprint 8).
- **Điều kiện bắt đầu:** đã có: người dùng duyệt các quyết định ở mục 10 của GDD ngày 14/11/2026.
- **Quy ước Story** (theo `templates/story-template.md` của Game Studio Agent, rút gọn cho dự án một người): mỗi Story tự chứa đủ số liệu; mỗi Story một commit; test, lint, format, build đạt; Story có hình ảnh thì lưu ảnh chạy thử ở `04-Dev-Plan/qa/<mã Story>/`.

| Mã | Tên | Phụ thuộc | Bị chặn | Cỡ | Mốc |
| --- | --- | --- | --- | --- | --- |
| ST-08-01 | Dữ liệu kỹ năng, số hóa Upgrade/Booster, trần mới | (duyệt GDD) | Không | 1 ngày | VS |
| ST-08-02 | Cây kỹ năng thuần, bản lưu 2, `normalizeBuild` | 01 | Không | 1,5 ngày | VS |
| ST-08-03 | `applyBuild`, `statsFor`: V1, P2 bậc 1, C1, C2 vào trận | 02 | Không | 1,5 ngày | VS |
| ST-08-04 | Kiểm tra trần lúc nạp + mô phỏng 4 lối bắn + bot phòng thủ | 03 | Không | 1 ngày | VS |
| ST-08-05 | Xưởng tab Kỹ năng (HTML), lối vào, menu tạm dừng | 02 (03 để thấy hiệu ứng) | Không | 2 ngày | VS |
| ST-08-06 | Phantom: P1 lượt lướt, P2 ân hạn, P3 bất tử với đạn và sượt đạn | 03 | Không | 1,5 ngày | MVP |
| ST-08-07 | Vanguard: V2 nổ lan, V3 Đòn Trừng Phạt, bậc phản hồi | 03 | Không | 1,5 ngày | MVP |
| ST-08-08 | Core: C3 khiên, `BuildRuntime`, quy tắc hồi sinh | 03 | Không | 1,5 ngày | MVP |
| ST-08-09 | Module và Két giáp (tách lại khi gỡ chặn) | 05 | **Có**: nhiệm vụ phụ chưa có; bản đồ Stage 1–4 chờ cổng Prototype; Prism Beam, Frost Shard, Gale Cutter chưa có hành vi; boss Lumen, Cryo, Aeris chưa có dữ liệu | | MVP |

Thứ tự: 01 → 02 → 03 → (04 song song 05) → 06 → 07 → 08. Tổng phần không bị chặn khoảng 11,5 ngày làm việc (khoảng 4–5 tuần với 20 giờ/tuần).
