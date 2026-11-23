# ST-QB-01: Test khóa các luật biên đã code

- **Nguồn:** `01-GDD/17-Quy-tac-bien.md` mục 17 (mỗi luật nhãn Code phải có test mang mã luật) và mục 18 (việc nhỏ ưu tiên, trước EP mới); `04-Dev-Plan/00-Bat-dau.md` việc code 3.
- **Ưu tiên:** P1 · **Trạng thái:** DONE (15/11/2026) · **Phụ thuộc:** không
- **Bằng chứng:** [x] Logic (Vitest `tests/qb-rules.test.ts`, 18 test) [x] Visual (chữ tab Module, `04-Dev-Plan/qa/QB-khoa-luat/`) [x] `npm run gate-flow` đạt (camera dùng chung với bản thử G1)

## 1. User Story

> **Là** người làm game, **tôi muốn** mỗi luật biên đã code có một test mang mã luật, **để** sửa code sau này không làm hỏng luật mà không ai biết.

## 2. Bối cảnh (nhúng)

Luật cần khóa (cột Luật ở `17-Quy-tac-bien.md`): QB-02 (lướt không tránh gai, hố), QB-11 (thả nạp khi cầm vũ khí boss), QB-12 (hết năng lượng), QB-13 (năng lượng khi vào màn, chết, checkpoint), QB-22 (Spike Guard chỉ miễn ô gai), QB-24 (mini-boss đã hạ không dựng lại), QB-33 (chết trước màn Kết quả không mất trận thắng), QB-41 (checkpoint không hồi máu, không nạp, đặt lại đếm chết), QB-61 (EXP không giảm theo đồng bộ cấp), QB-121 (camera khóa trong phòng khóa, đấu trường), QB-132 (nhãn tab Xưởng chưa mở theo lời người chơi). QB-71 làm ở ST-14-08.

## 3. Kết quả

| Luật                          | Kết quả                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| QB-02, 11, 12, 13, 22, 41, 61 | Test đạt. Số lấy từ config. Kiểm test có thể đỏ: tạm cho gai tôn trọng bất tử của lướt, checkpoint hồi máu và nạp năng lượng, thì QB-02, 13, 41 đỏ                                                                                                                                                                                                                 |
| QB-24                         | **Lỗi:** hạ Golem xong, Kai chết thì `EnemyField.reset()` dựng lại mọi kẻ địch, Golem đầy máu đi lại trong phòng đã mở. **Sửa:** `StageWorld.respawn` không dựng lại kẻ địch của phòng khóa đã xong (`LockedRoom.members`, `EnemyField.reset(stayDown)`). Mở rộng luật cho mọi kẻ địch của phòng khóa đã xong (phòng không khóa lại được). Test đỏ khi bỏ phần sửa |
| QB-33                         | Phần logic có test: chết trong lúc đếm `ui.result.delaySec` không mất EXP, Core Bit, vũ khí, `bossesDefeated`; boss không tính thắng lại. Đếm giờ ở Scene không xóa khi chết                                                                                                                                                                                       |
| QB-121                        | Tách `logic/stage/camera-bounds.ts` (`cameraLockFor`) khỏi Scene, Scene gọi hàm này; kết quả y như trước                                                                                                                                                                                                                                                           |
| QB-132                        | Nhãn tab chuyển vào `logic/rpg/workshop-model.ts` (`WORKSHOP_TABS`); bảng Xưởng dựng tab từ đó. Sửa chữ tab Module "khi có" thành "khi nhận module đầu tiên" cho khớp QB-87                                                                                                                                                                                        |

**Còn hở (ghi lại, chưa sửa):**

- QB-13 "riêng từng vũ khí" chưa kiểm được: dữ liệu mới có một vũ khí boss (Vine Lash).
- QB-33: sau khi hồi sinh (ở ngoài đấu trường), `updateArena` dựng boss mới chờ đấu lại; nếu Kai vào lại đấu trường trước khi hết `delaySec` thì trận đấu lại bắt đầu đúng lúc màn Kết quả mở. Hiếm (8 s), xử lý khi làm Kết quả cho bản đồ thật.
- "Tủ skin · mở sau boss 5" có thể bị coi là tên mốc; chờ i18n.

## 4. File

- Tạo: `game/tests/qb-rules.test.ts`, `game/src/logic/stage/camera-bounds.ts`, `04-Dev-Plan/qa/QB-khoa-luat/`.
- Sửa: `game/src/logic/world/{stage-world,enemy-field,stage-mechanics}.ts` (QB-24), `game/src/logic/rpg/workshop-model.ts`, `game/src/workshop/workshop-panel.ts`, `game/src/scenes/stage-scene.ts` (camera), `01-GDD/17-Quy-tac-bien.md` (trạng thái, QB-24), `game/docs/quyet-dinh/giao-dien-huong-dan-hoi-thoai.md`.
