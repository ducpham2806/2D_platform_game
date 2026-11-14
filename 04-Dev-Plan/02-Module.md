# Danh sách module

Mỗi module có giao diện công khai nhỏ để dán vào ChatGPT. Tài liệu nguồn là các file trong `01-GDD/` và dữ liệu trong `03-Data/`.

| ID | Module | Trách nhiệm | Phụ thuộc | Nguồn | Tiêu chí xong |
|---|---|---|---|---|---|
| M0 | Dự án và công cụ | Vite + TypeScript + Phaser 3, lint, test (Vitest), Git, CI cơ bản | | DEV-HANDOFF | `npm run dev` và `npm test` chạy |
| M1 | Khung game | Scene (Boot, Preload, Menu, Hub, Stage), scale 320×192 nguyên tỷ lệ, khóa ngang, nạp atlas và JSON cấu hình | M0 | GDD 15 | 60 FPS trên điện thoại tầm trung; tỷ lệ không méo |
| M2 | Đầu vào | Bàn phím, tay cầm, cảm ứng (cần ảo nổi, nút), đổi phím, chỉnh bố cục nút | M1 | GDD 5.2, tab Hub, wireframe | Nút ≥ 48 dp; bố cục lưu được |
| M3 | Nhân vật | Chạy, nhảy biến thiên, lướt, bám tường, bị đánh, bất tử 1 giây, va chạm lưới ô | M1, M2 | GDD 5.1, `player.json` | Đúng thông số `player.json` |
| M4 | Chiến đấu | Arc Cannon, bắn nạp, đạn, vũ khí boss, sát thương, hộp va chạm, pool đạn | M3 | GDD 5.1, 7, `weapons.json` | Tối đa 3 đạn; nạp 1,2 s ×3 |
| M5 | Kẻ địch | AI theo cấu hình, telegraph, rơi vật phẩm | M4 | GDD 9, 9.1, tab Prologue & Stage 1 | Telegraph ≥ 0,4 s |
| M6 | Boss | Máy trạng thái 3 pha, Thorna trước, điểm yếu, choáng | M4, M5 | tab Prologue & Stage 1 (mục 5) | Thorna đúng bảng pha và thời gian |
| M7 | Màn chơi | Nạp bản đồ Tiled, checkpoint, phòng khóa, bí mật, gai, dây leo, camera | M3, M5 | tab Prologue & Stage 1, `stages.json` | 4 checkpoint; hồi sinh ≤ 1,5 s |
| M8 | Hệ thống RPG | EXP và cấp, cây kỹ năng, module, Két giáp, loadout, tính chỉ số | M4 | GDD 6, `10-He-thong-RPG-Xuong.md`, `player.json`, `skills.json`, `modules.json`; Story `stories/EP-08-xuong-rpg.md` | Công thức EXP; respec miễn phí; trần sức mạnh kiểm tra lúc nạp |
| M9 | Kinh tế và Shop | Tiền tệ, upgrade, booster, skin, giao dịch nguyên tử, hoàn upgrade 100% | M8 | GDD 10, tab Hub & Shop, `shop.json`, `economy.json` | Không mua trùng; mất mạng không mất tiền |
| M10 | Giao diện | HUD, menu, hội thoại, chuẩn bị, kết quả, Hub, Xưởng, cài đặt | M1–M9 | wireframe, tab Hub & Shop | Khớp wireframe |
| M11 | Lưu và cloud | IndexedDB, mã xuất/nhập, cloud save, xung đột (hiện màn chọn) | M1 | tab Hub & Shop mục 8 | Không nhân đôi tiền khi đồng bộ |
| M12 | Âm thanh | SFX, nhạc, âm lượng, cảnh báo đòn boss | M1 | GDD 14 | Không giật khi đổi tab |
| M13 | Live-ops | Đăng nhập, 7 ngày tân thủ, vòng quay, nhiệm vụ, Season Pass, sự kiện | M9, M11, M16 | tab Kế hoạch kiếm tiền (mục 8) | Tỷ lệ và pity đúng, hiển thị công khai |
| M14 | Kiếm tiền | Quảng cáo, IAP, subscription, đồng ý quảng cáo, xác nhận tuổi | M9, M11, M17 | tab Kế hoạch kiếm tiền (mục 3–5) | Mua và khôi phục đúng; không nhân đôi Gem |
| M15 | Endgame | Farm Run, Boss Hunt, Chip Lõi, Sweep, Mastery, Rift | M5–M9, M11 | tab Kế hoạch kiếm tiền (mục 7) | Tỷ lệ rơi và pity đúng |
| M16 | Phân tích và Remote Config | Sự kiện đo lường, cờ tính năng, chỉnh tỷ lệ/quảng cáo từ xa | M1 | tab Cân bằng kinh tế (mục 8) | Chỉnh được không cần phát hành lại |
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

Làm theo thứ tự trong bảng lộ trình; không bắt đầu M13–M15 trước khi Vertical slice được chơi thử.
