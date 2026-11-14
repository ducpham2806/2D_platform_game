# Danh sách module

Mỗi module có giao diện công khai nhỏ; khi làm một module chỉ cần đưa giao diện (type, hàm công khai) của module khác vào ngữ cảnh. Tài liệu nguồn là các file trong `01-GDD/` và dữ liệu trong `03-Data/`. Trạng thái từng module: bảng trong `game/CONTEXT.md` (nguồn duy nhất).

| ID | Module | Trách nhiệm | Phụ thuộc | Nguồn | Tiêu chí xong |
|---|---|---|---|---|---|
| M0 | Dự án và công cụ | Vite + TypeScript + Phaser 3, lint, test (Vitest), Git, CI cơ bản | | GDD 15, `game/CONTEXT.md` | `npm run dev` và `npm test` chạy |
| M1 | Khung game | Scene (Boot, Preload, Menu, Hub, Stage), scale 320×192 nguyên tỷ lệ, khóa ngang, nạp atlas và JSON cấu hình | M0 | GDD 15 | 60 FPS trên điện thoại tầm trung; tỷ lệ không méo |
| M2 | Đầu vào | Bàn phím, tay cầm, cảm ứng (cần ảo nổi, nút), đổi phím, chỉnh bố cục nút | M1 | GDD 5.2, tab Hub, wireframe | Nút ≥ 48 dp; bố cục lưu được |
| M3 | Nhân vật | Chạy, nhảy biến thiên, lướt, bám tường, bị đánh, bất tử 1 giây, va chạm lưới ô | M1, M2 | GDD 5.1, `player.json` | Đúng thông số `player.json` |
| M4 | Chiến đấu | Arc Cannon, bắn nạp, đạn, vũ khí boss, sát thương, hộp va chạm, pool đạn | M3 | GDD 5.1, 7, `weapons.json` | Tối đa 3 đạn; nạp 1,2 s ×3 |
| M5 | Kẻ địch | AI theo cấu hình, telegraph, rơi vật phẩm | M4 | GDD 9, 9.1, tab Prologue & Stage 1 | Telegraph ≥ 0,4 s |
| M6 | Boss | Máy trạng thái 3 pha, Thorna trước, điểm yếu, choáng | M4, M5 | tab Prologue & Stage 1 (mục 5) | Thorna đúng bảng pha và thời gian |
| M7 | Màn chơi | Nạp bản đồ Tiled, checkpoint, phòng khóa, bí mật, gai, dây leo, camera; vật và đoạn thử của nhiệm vụ phụ (`questItem`, `questTarget`, `questZone`) | M3, M5 | tab Prologue & Stage 1, `stages.json` | 4 checkpoint; hồi sinh ≤ 1,5 s |
| M8 | Hệ thống RPG | EXP và cấp, cây kỹ năng, module, Két giáp, loadout, tính chỉ số | M4 | GDD 6, `10-He-thong-RPG-Xuong.md`, `player.json`, `skills.json`, `modules.json`; Story `stories/EP-08-xuong-rpg.md` | Công thức EXP; respec miễn phí; trần sức mạnh kiểm tra lúc nạp |
| M9 | Kinh tế và Shop | Tiền tệ, upgrade, booster, skin, giao dịch nguyên tử, gỡ upgrade hoàn đúng số đã trả | M8 | GDD 10, tab Hub & Shop, `shop.json`, `economy.json` | Không mua trùng; mất mạng không mất tiền |
| M10 | Giao diện | HUD, menu, hội thoại, chuẩn bị, kết quả, Hub, Xưởng, Bảng Nhiệm Vụ, cài đặt | M1–M9 | wireframe (xem `02-Wireframes/LOI-THOI.md`), tab Hub & Shop, `14-Cai-dat-Tiep-can.md`, `17-Quy-tac-bien.md` mục 8–11 | Khớp đặc tả; chữ ≥ 16 sp, nút ≥ 48 dp |
| M11 | Lưu và cloud | IndexedDB, mã xuất/nhập, cloud save, xung đột (hiện màn chọn); bản lưu kế tiếp thêm `sideQuests`, `inventory.dataChips` (số phiên bản theo thứ tự merge) | M1 | tab Hub & Shop mục 8 | Không nhân đôi tiền khi đồng bộ |
| M12 | Âm thanh | SFX, nhạc, âm lượng, cảnh báo đòn boss (bản MVP: EP-12) | M1 | GDD 14, `01-GDD/12-Am-thanh.md` | Theo `12-Am-thanh.md` mục 8.2: âm chặn tải đầu ≤ 30 KB, dừng hẳn khi ẩn tab, cue báo trước ≤ 75% thời gian báo trước |
| M13 | Live-ops | Đăng nhập, 7 ngày tân thủ, vòng quay, nhiệm vụ ngày/tuần (khác nhiệm vụ phụ trong màn của `15-Nhiem-vu-phu.md`), Season Pass, sự kiện | M9, M11, M16 | tab Kế hoạch kiếm tiền (mục 8) | Tỷ lệ và pity đúng, hiển thị công khai |
| M14 | Kiếm tiền | Quảng cáo, IAP, subscription, đồng ý quảng cáo, xác nhận tuổi | M9, M11, M17 | tab Kế hoạch kiếm tiền (mục 3–5) | Mua và khôi phục đúng; không nhân đôi Gem |
| M15 | Endgame | Farm Run, Boss Hunt, Chip Lõi, Sweep, Mastery, Rift | M5–M9, M11 | tab Kế hoạch kiếm tiền (mục 7) | Tỷ lệ rơi và pity đúng |
| M16 | Phân tích và Remote Config | Sự kiện đo lường, cờ tính năng, chỉnh tỷ lệ/quảng cáo từ xa (bản MVP rút gọn: EP-13) | M1 | tab Cân bằng kinh tế (mục 8), `01-GDD/13-Do-luong-MVP.md`, ADR-002 | Chỉnh được không cần phát hành lại |
| M17 | Đóng gói | Capacitor Android/iOS, PWA web, ký ứng dụng, cầu nối SDK | M1 | tab Kế hoạch kiếm tiền (mục 3) | Chạy trên máy thật |
| M18 | QA và công cụ debug | Menu debug, cheat tiền/cấp, nhảy tới màn, ghi log, test tự động | tất cả | các danh sách nghiệm thu | Chạy lại được mọi kịch bản chính |

## Thứ tự phụ thuộc

```
M0 → M1 → M2 → M3 → M4 → M5 → M7
                    └→ M6
M1 → M11, M12, M16, M17
M4 → M8 → M9 → M10
M9+M11+M16 → M13;   M9+M11+M17 → M14;   M5..M9+M11 → M15
```

Làm theo thứ tự trong `01-Ke-hoach-lam-viec.md`. M13–M15, M17 và phần đầy đủ của M16 chỉ bắt đầu sau cổng MVP (GDD chính mục 16).
