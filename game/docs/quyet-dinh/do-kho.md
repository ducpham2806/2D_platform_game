# Quyết định đã chốt: Ba độ khó và màn Chuẩn bị (EP-10)

Tóm tắt cách code hiện thực `01-GDD/11-Do-kho.md`. Tách từ `game/CONTEXT.md` ngày 15/11/2026 để giảm phần đọc đầu phiên; chỉ đọc khi làm việc với module này.

- **Ba độ khó (EP-10, 01-GDD/11-Do-kho.md bản 2, 14/11/2026; duyệt Creative Director và Technical Director + Producer).**
  - Vào phòng chiến dịch (StageDef có `campaign`) từ menu thì qua màn Chuẩn bị (`PrepScene`, bảng HTML), chọn Cốt truyện/Thường/Thử thách; mặc định là lần trước của màn đó. Màn xám luôn Thường, không qua Chuẩn bị. `scene.start(Stage, { stage, difficulty })`; "Chơi lại" giữ độ khó.
  - Thử thách mở khi hạ **boss chiến dịch** của màn ở Thường hoặc Thử thách (`difficulties.json → unlock.clearedOn`). Bản lưu 4: `progress.difficulty[campaign] = {last, cleared}`; bản 3 đã hạ boss thì `cleared: ["normal"]` (chuẩn hóa theo dữ liệu).
  - Hệ số: máu boss nhân `enemyHp` trong `makeBoss` (BossData mới; trước đây bị sót); thưởng EXP/Core Bit nhân `rewardMul`, làm tròn theo từng kẻ địch lúc bị hạ, gốc > 0 thì ≥ 1. Thưởng lần đầu hạ boss một lần **mỗi cặp (boss, độ khó)**; vũ khí, SP một lần mỗi boss.
  - Checkpoint: thuộc tính Tiled `difficulties` lọc checkpoint; bản lưu `checkpointBy[độ khó]`; vào màn chỉ mang checkpoint từ độ khó đang chọn hoặc khó hơn, rồi lùi về checkpoint gần nhất có ở độ khó đó. Id checkpoint cố định hoãn tới khi chốt bản đồ.
  - Gợi ý NOVA sau 3 lần chết liên tiếp (`world.deathStreak`; rơi hố không tính; checkpoint hoặc cửa đấu trường đặt lại), hộp riêng, câu theo độ khó (`ui.json → difficultyHint`).
  - Bản Thử thách: khối `challenge` trong `enemies.json`, `bosses.json` ghép sâu (mảng thay cả, cấm đổi id/behavior), kiểm tra như bản gốc; chọn bằng `enemiesFor`, `bossFor`. Stage 1: Drone bắn đôi, Bướm thả kép, Tháp Gai hai loạt lệch 7,5°, Lính Kén lao nối, Golem lao rồi giậm, Thorna thêm Rễ Đuổi (đánh dấu mặt Kai đứng kể cả bục). Báo trước nhiều nhịp vẽ một chấm mỗi nhịp. Số liệu `[PLACEHOLDER]`, chốt sau cổng Prototype.
  - Kiểm tra lúc nạp: không chết một đòn ở `damageTaken` lớn nhất (1,5), cả bản Thử thách; ngưỡng pha của bản Thử thách khớp bản gốc. Bot không né: Cốt truyện thắng Thorna (chủ đích), Thường và Thử thách thua.
  - Chạy thử: `?debug=1&unlock=1` mở mọi độ khó.
