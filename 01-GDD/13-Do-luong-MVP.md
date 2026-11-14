# Đo lường cho đợt thử MVP (M16 bản tối thiểu)

- **Trạng thái:** Bản 1, Draft (14/11/2026). Chờ duyệt: QA Lead, Technical Director (điểm nhận, lược đồ), Producer (phương án gom dữ liệu, mục 2).
- **Quy trình:** Game Studio Agent `/design-system` theo `templates/gdd-system-template.md`; vai UI/UX Lead + QA Lead (đo lường), kỹ năng `game-qa-playtest`.
- **Nguồn:** GDD chính mục 12, 15, 16 (cổng MVP), 17; `04-Can-bang-kinh-te.md` mục 2, 4, 8, 15; `07-Kich-ban-huong-dan.md` mục 1, 9; `11-Do-kho.md` mục 7–8; `04-Dev-Plan/05-Cong-Prototype.md`, `04-Test-va-Launch.md`; code `game/src/logic/playtest/{recorder,summary}.ts`, `game/src/playtest/*.ts`, `game/src/scenes/stage/stage-playtest.ts`.
- **Phạm vi:** đợt thử bản web MVP (Prologue + Stage 1–4, Hub dạng menu, Xưởng, Quầy chỉ Upgrade, 3 độ khó) với khoảng 50 người, không quảng cáo, không IAP. Không có Remote Config và analytics thương mại (Firebase để Live-ops). Mọi ngưỡng và giới hạn là `[PLACEHOLDER]`.
- **Story:** Epic EP-13 (mục 12). Tùy chọn trong Cài đặt: `14-Cai-dat-Tiep-can.md` mục 3.6.

- **Mã chỉ số:** MV1–MV7 (đổi từ G1–G7 ngày 14/11/2026 để không trùng tên ba cổng G1–G3 của `04-Dev-Plan/01-Ke-hoach-lam-viec.md`).
## 0. Hiện trạng

| Đã có (cổng Prototype) | Thiếu cho cổng MVP |
| --- | --- |
| `PlaytestRecorder`: mỗi lần vào màn xám là một phiên tổng hợp (giây theo thiết bị, chết theo đoạn, lượt đánh và thời gian thắng boss, điểm 1–5) | Chỉ màn xám ghi. Không có sự kiện theo thời gian, không có id cài đặt nên không tính được quay lại ngày sau, phễu nhiều màn |
| `cv.playtest` (localStorage), tối đa 200 phiên, phiên < 10 s không lưu | Không có kinh tế, độ khó, vũ khí khắc chế, hướng dẫn, lỗi, FPS trên máy thật |
| Xuất JSON (`makeExport`), gộp (`parseExport`, `mergeSessions`: trùng id giữ bản mới), tổng hợp theo GDD 17 (`summarize`), màn Kết quả chơi thử | Thu tay từng người: được với 5 người, không ổn với 50 (mục 2) |
| `?gate=1` thu gọn menu cho người thử | `makeExport` ghi `userAgent` đầy đủ: thừa và có thể dùng để nhận dạng (mục 4) |

Công cụ cổng Prototype giữ nguyên (`cv.playtest`, gói xuất `version: 1`) tới khi qua cổng. Đợt MVP dùng nhật ký mới `cv.telemetry` (lược đồ 2).

## 1. Mục tiêu đo

Cổng MVP trả lời một câu: **bản MVP có giữ được người chơi mới, trên cả cảm ứng và bàn phím, mà không có đoạn nào làm họ bỏ cuộc không?** Không đạt thì sửa cảm giác chơi và thiết kế màn, không thêm hệ thống (GDD 16).

| Mã | Câu hỏi | Ngưỡng `[PLACEHOLDER]` | Nguồn |
| --- | --- | --- | --- |
| MV1 | Người mới qua được Prologue không? | Hoàn thành Prologue ≥ 90% | GDD 12, 16; `07` mục 1 |
| MV2 | Stage 1 có vừa sức không? | Hoàn thành Stage 1 ≥ 70% | GDD 16, 17 |
| MV3 | Có đi hết MVP không? | ≥ 50% người bắt đầu chơi xong cả 4 màn | GDD 16 |
| MV4 | Có quay lại không? | Quay lại ngày hôm sau ≥ 35% | GDD 16, 17 |
| MV5 | Có muốn chơi thêm không? | ≥ 60% người chơi xong muốn chơi màn 5 | GDD 16 |
| MV6 | Vòng khắc chế có được hiểu không? | ≥ 70% dùng đúng vũ khí khắc chế ở ≥ 2 boss | GDD 7, 16 |
| MV7 | Cảm ứng có bị thiệt không? | Chênh lệch tỷ lệ thua cảm ứng so với bàn phím ≤ 40% ở mọi màn | GDD 16, 17 |
| H1–H4 | Có dấu hiệu "hỏng" nào không? | Không có dấu hiệu nào (mục 6.3) | GDD 17 |

Câu hỏi phụ (không chặn cổng, dùng để chỉnh): kinh tế (`04` mục 8), độ khó (`11` mục 8), hướng dẫn (`07` mục 9), kỹ thuật (GDD 15, 17), cảm giác (tiếp nối cổng Prototype), dùng tùy chọn tiếp cận (`14` mục 10). **Không đo** các chỉ số `04` mục 15 (Chip Lõi, Gem, Farm, ARPDAU): MVP chưa có endgame và tiền thật.

## 2. Cách gom dữ liệu khi chưa có máy chủ

| Tiêu chí | A: mở rộng nhật ký cục bộ + xuất/gộp JSON (như cổng Prototype) | B: điểm nhận nhẹ (một bảng chỉ-ghi trên Supabase gói miễn phí); nhật ký cục bộ làm bộ đệm |
| --- | --- | --- |
| Cách chạy | Ghi trên máy; người thử bấm Xuất JSON, gửi qua Zalo/email; người tổng hợp dán và gộp | Ghi trên máy, gửi từng lô khi có mạng; người tổng hợp tải bảng về chạy báo cáo |
| Công làm (ước lượng) | Code: ít. Thu: khoảng 2 phút × 50 người × 2 lần (ngày 2 cho MV4, ngày 8), cộng nhắc người chưa gửi; lặp lại mỗi đợt | Code: thêm khoảng 1,5 ngày (1 file SQL: bảng, RLS, hàm xóa; bộ gửi có thử lại; thông báo đồng ý). Thu: 0 |
| Người bỏ cuộc | Ít gửi JSON nhất, mà chính họ là nhóm cần đo: MV1–MV3, H1 bị đẹp giả | Có dữ liệu tới lúc dừng chơi |
| MV4 (quay lại ngày sau) | Chỉ có nếu người thử gửi sau ngày 2 | Tự động |
| Riêng tư | Dữ liệu chỉ rời máy khi người thử tự gửi | Rời máy tự động: cần đồng ý và cách xóa (mục 4) |
| Rủi ro | Dán sai, tin nhắn bị cắt, mất dữ liệu khi người thử xóa trình duyệt | Khóa ghi công khai có thể bị ghi rác; trình chặn hiếm khi chặn `*.supabase.co`; lệch câu "không làm máy chủ trước cổng" (GDD 16) |
| Chi phí | 0 | 0 (gói miễn phí 500 MB; cả đợt ước tính < 5 MB) |

**Chọn B**, giữ A làm đường dự phòng (cùng định dạng lô; nút Xuất JSON vẫn có ở Cài đặt → Dữ liệu).

Lý do, với một người làm:

1. Mọi chỉ số chặn cổng MV1–MV4 và H1 là phễu hoặc tỷ lệ quay lại. Với A, người bỏ cuộc ít gửi JSON nhất, nên sai lệch đi đúng chiều làm cổng "đạt" giả.
2. Thu tay 50 người hai lần mất khoảng 4–6 giờ mỗi đợt (kể cả nhắc) và lặp lại ở mỗi đợt; B tốn khoảng 1,5 ngày một lần, hòa vốn sau 2–3 đợt và không có sai lệch ở ý 1.
3. GDD 15 đã chọn Supabase cho Beta, nên phần học công cụ không bỏ phí.

**Ranh giới** để không thành "làm máy chủ trước cổng": một bảng chỉ-ghi, game không đọc lại, không đăng nhập; game chạy đủ khi điểm nhận chết hoặc bị chặn; xóa dự án sau khi chốt cổng + 90 ngày.

**Nếu người dùng không muốn dịch vụ ngoài nào:** dùng A, thu bắt buộc ngày 2 và ngày 8; báo cáo ghi tỷ lệ người gửi, và coi người không gửi là bỏ cuộc ở đoạn cuối đã biết (ước lượng xấu nhất).

```text
StageScene, PrepScene, Quầy, Xưởng, TutorialManager ──sự kiện──▶ Telemetry (thuần, logic/telemetry/)
     ──▶ cv.telemetry (localStorage, bộ đệm) ──▶ Uploader (fetch keepalive, thử lại) ──▶ Supabase telemetry_batches (chỉ ghi)
Người tổng hợp: tải bảng (JSON) và/hoặc JSON xuất tay ──▶ npm run mvp-report ──▶ 04-Dev-Plan/playtest/mvp-dot-<n>.md
```

- Chỉ bản mở bằng `?mvp=<mã đợt>` (ví dụ `?mvp=d1`) mới ghi và gửi. Link thường không ghi gì.
- `?mvp=d1&staff=1` gắn cờ `staff`; báo cáo loại người làm game.

## 3. Danh sách sự kiện

**Phong bì chung** của mọi sự kiện: `e` (tên), `t` (ms, đồng hồ máy), `sid` (phiên), `n` (số thứ tự trong phiên), `p` (thuộc tính bên dưới). Lô có `install`, `batch`, `build`, `data`, `schema` (mục 8).

- Thuộc tính chỉ là số, boolean, enum, hoặc id trong danh mục tên chuẩn (`04-Dev-Plan/07-Ban-do-he-thong.md` mục 3). Không có chuỗi tự do, trừ `client_error.msg` đã lọc.
- `stage` là id màn chiến dịch (`verdant_gardens`…) hoặc `prologue`. `tRun` là giây game tính từ đầu lượt vào màn.
- Ưu tiên khi bộ đệm đầy (mục 5): **0** không bao giờ bỏ, **1** bỏ sau, **2** bỏ trước.

| Tên | Khi nào ghi | Thuộc tính | Dùng cho chỉ số | Ưu tiên |
| --- | --- | --- | --- | --- |
| `session_start` | Menu sẵn sàng sau khi mở trang; hoặc quay lại tab sau ≥ 30 phút ẩn | `day` (ngày theo giờ máy, "2026-11-20"), `tzMin`, `platform` (android, ios, windows, mac, linux, other), `browser` (chrome, safari, firefox, edge, samsung, other), `pwa`, `screen` (px CSS làm tròn 50, "900x400"), `dpr` (làm tròn 0,25), `scaleK`, `touchCapable`, `lang`, `staff` | MV4; nhóm thiết bị; X1 (mẫu số) | 0 |
| `boot_timing` | Mỗi phiên khi Menu vẽ xong; lần đầu cài thêm lúc Kai nhận đầu vào đầu tiên | `msToMenu`, `msToControl` (chỉ lần đầu) | X2, X3 | 2 |
| `consent` | Hiện thông báo, hoặc người chơi đổi lựa chọn | `state` (notice, on, off) | Quyền riêng tư; lọc báo cáo | 0 |
| `stage_start` | Vào một màn (sau màn Chuẩn bị nếu có) | `stage`, `room` (StageDef), `difficulty`, `difficultyDefault`, `challengeOpen`, `run` (lần vào màn thứ mấy), `clearedBefore` (độ khó đã hạ boss), `fromCheckpoint`, `level`, `effLevel`, `skills` (chữ ký build, "V2P1C0"), `upgrades` ({id: cấp}), `weapons` (số vũ khí boss), `coreBits`, `device`, `gameSpeed`, `autoFire`, `aimAssist`; `audio` (`master`, `sfx`, `alert`, `muted`; `12-Am-thanh.md`) | MV1–MV3, MV7, H1, H3, K4, DK1–DK3, S1 | 0 |
| `section_enter` | Lần đầu vào một đoạn trong lượt | `stage`, `section` (A, B, C, D, `boss`…), `tRun` | H1; thời gian theo đoạn | 1 |
| `checkpoint` | Chạm checkpoint mới | `stage`, `index`, `tRun` | Thời gian theo đoạn; H1 | 1 |
| `death` | Chết thật, hoặc rơi hố (tính như nhật ký Prototype) | `stage`, `section`, `kind` (death, pit), `cause` (`enemy:<id>`, `boss:<đòn>`, `spike`, `pit`), `device`, `tRun`, `streak` | MV7, H1; đòn gây chết nhiều nhất | 1 |
| `difficulty_hint` | Gợi ý NOVA sau 3 lần chết hiện (`11` mục 2.5) | `stage`, `difficulty`, `section` | DK; hiệu quả gợi ý | 1 |
| `boss_start` | Cửa đấu trường đóng, hoặc hồi sinh trong phòng boss | `stage`, `boss`, `attempt`, `weaknessOwned`, `weaponsOwned` | MV6, H4 | 1 |
| `boss_end` | Lượt đánh boss kết thúc | `boss`, `outcome` (win, death, exit), `fightSec`, `dmg` ({vũ khí: sát thương tính bằng phát Arc}), `weakHits`, `swaps`, `bossHpPct`, `device`, `gameSpeed` | MV6, H4; thời gian thắng boss | 0 |
| `stage_end` | Rời màn sau khi hạ boss chiến dịch; thoát về menu; bấm Chơi lại (hết một lượt, QB-47) | `stage`, `outcome` (clear, quit; `abandon` do báo cáo suy ra), `runSec` (giây game), `realSec`, `deaths`, `pits`, `furthest`, `last` (đoạn), `coreBitsEarned`, `expEarned`, `balance`, `secrets`, `deviceSec` ({keyboard, gamepad, touch}), `gameSpeedMin`, `fpsMedian`, `slowFramePct` (% khung > 22 ms) | MV1–MV3, MV7, H1, H3, K1, K2, K6, DK2, DK3, X4 | 0 |
| `stage_progress` | Trang ẩn (game tự tạm dừng, QB-90), và mỗi 120 s chơi | Như `stage_end`, không có `outcome` | Lượt bỏ dở: báo cáo lấy bản cuối làm trạng thái `abandon` | 1 |
| `shop_buy`, `shop_refund` | Giao dịch đã ghi xong (sau `SaveManager.transact`) | `item`, `level`, `price`, `before`, `after`, `bosses`, `playSec` | K1, K3, K5 | 0 |
| `skill_change` | Học hoặc đặt lại kỹ năng ở Xưởng | `node`, `rank`, `action` (learn, reset), `spLeft` | Build (phụ) | 2 |
| `tutorial_step_start`, `tutorial_step_complete`, `tutorial_step_fail`, `tutorial_hint_shown`, `tutorial_skip`, `tutorial_phase_complete` | Theo `07` mục 9 | Theo `07` mục 9: `id`, `phase`, `time_sec`, `attempts`, `count`, `level`, `scope`, `total_time_sec` | T1–T4 | 1 |
| `tutorial_toggle` | Bật/tắt hướng dẫn | `on`, `where` (pause, settings) | T3 | 1 |
| `survey_answer` | Bấm một câu trả lời trong phiếu (mục 7.2) | `q` (feel_jump, feel_dash, feel_shoot, want_stage5, audio_annoy: "Âm thanh có làm khó chịu?" sau lần đầu hạ Thorna), `a` (1–5; yes, maybe, no, skip), `device` | MV5, F1 | 0 |
| `settings_change` | Đổi một tùy chọn (`14` mục 3) | `id`, `value` (enum hoặc số), `where` (menu, pause), `device` | S1; lọc lượt có giảm tốc | 2 |
| `client_error` | `window.onerror`, `unhandledrejection`, `config:error` | `kind`, `scene`, `fatal`, `msg` (≤ 120 ký tự, đã bỏ URL và chữ số) | X1 | 1 |
| `save_error` | `SaveManager.lastError` đổi | `op` (open, write, import), `code` | X5 | 1 |

Số liệu phải thêm vào logic thuần (mục 11): sát thương lên boss theo vũ khí; nguyên nhân cú đánh cuối; id đoạn từ `StageLayout`; chữ ký build.

## 4. Quyền riêng tư

**Không thu:** tên, email, số điện thoại, tài khoản; địa chỉ IP (không ghi vào bảng; nhà cung cấp có thể giữ trong nhật ký hạ tầng ngắn hạn); vị trí; `userAgent` đầy đủ; tên tay cầm (`gamepad.id`); dấu vân tay thiết bị (canvas, font); bất cứ thứ gì người chơi gõ hoặc dán (mã sao lưu, JSON).

**Định danh:**

- `install`: UUID v4 ngẫu nhiên (`crypto.randomUUID`), sinh lần đầu mở bản `?mvp=`, không suy ra từ thiết bị. `sid`: ngẫu nhiên mỗi phiên.
- Người tổ chức không ghi ai giữ `install` nào.

**Đồng ý (hai lớp):**

1. **Lúc tuyển:** phiếu đăng ký có ô "Tôi đồng ý gửi nhật ký chơi ẩn danh", kèm đúng câu thông báo bên dưới. Chỉ mời người từ 16 tuổi `[PLACEHOLDER]`.
2. **Trong game:** lần đầu mở bản `?mvp=`, dải thông báo ở mép trên 8 s, không chặn chơi (giữ "điều khiển Kai trong ≤ 15 s", `07` nguyên tắc 7), có nút **Tắt gửi**. Mặc định là gửi, vì người thử đã đồng ý lúc tuyển.

> Bản thử nghiệm này ghi lại cách bạn chơi (màn, lần chết, thời gian, loại máy như "Android, Chrome") để nhóm làm game sửa game. Không có tên, email, vị trí hay địa chỉ IP. Tắt bất cứ lúc nào ở Cài đặt → Dữ liệu; tắt thì dữ liệu đã gửi bị xóa.

**Xóa:**

- Cài đặt → Dữ liệu → **Tắt gửi và xóa nhật ký**: xóa `cv.telemetry` trên máy, gọi `delete_my_data(install)` ở điểm nhận, ghi `consent: off`. Không có mạng thì giữ `install` cũ trong `pendingDelete`, gọi lại khi có mạng.
- Cài đặt hiện **mã xóa** (8 ký tự đầu của `install`). Người thử có thể gửi mã này để người tổ chức xóa tay.

**Lưu giữ và truy cập:**

- Dữ liệu thô xóa sau 90 ngày kể từ khi chốt cổng MVP.
- Báo cáo tổng hợp giữ trong repo. File JSON gộp đưa vào repo phải đổi `install` thành `p01`…`pNN`.
- Khóa `service_role` chỉ ở máy người tổng hợp, không vào bản build. Khóa `anon` trong bản build chỉ ghi được, không đọc được.
- Không phải tư vấn pháp lý.

## 5. Giới hạn dung lượng và phiên bản lược đồ

| Giới hạn | Giá trị `[PLACEHOLDER]` | Khi vượt |
| --- | --- | --- |
| Bộ đệm `cv.telemetry` | ≤ 256 KB và ≤ 2.000 sự kiện | Bỏ sự kiện **đã gửi** cũ nhất trước; còn vượt thì bỏ sự kiện chưa gửi ưu tiên 2, rồi 1, cũ trước. Ưu tiên 0 không bỏ; chỉ còn ưu tiên 0 thì ngừng ghi ưu tiên 1–2 |
| Lô | ≤ 100 sự kiện, ≤ 24 KB | Chia lô |
| Nhịp gửi | Khi ≥ 20 sự kiện chờ, hoặc 60 s từ lần gửi trước, hoặc sau `stage_end`, hoặc khi trang ẩn | Trang ẩn: `fetch` có `keepalive` (giới hạn 64 KB) |
| Thử lại | 30, 60, 120… tối đa 600 s; ≤ 6 lần mỗi phiên | Giữ trong bộ đệm tới phiên sau |
| `client_error` | ≤ 20 mỗi phiên; cùng `msg` trong phiên chỉ ghi một lần, thêm `count` | |
| Điểm nhận | Lô ≤ 32 KB (ràng buộc bảng); ≤ 500 lô mỗi `install` | Từ chối; client bỏ lô đó |

**Ước lượng:** sự kiện trung bình khoảng 170 byte; khoảng 180 sự kiện mỗi giờ chơi (kể cả `stage_progress`), tức khoảng 30 KB/giờ. MVP khoảng 3 giờ nên khoảng 90 KB mỗi người; 50 người khoảng 4,5 MB.

**Phiên bản lược đồ:**

- `schema: 2`. Bản 1 là gói xuất cổng Prototype (`version: 1`); báo cáo MVP không đọc bản 1.
- Thêm sự kiện hoặc thuộc tính: giữ số `schema`. Báo cáo bỏ qua khóa lạ, coi khóa thiếu là "không có".
- Đổi nghĩa, đổi tên, bỏ khóa: tăng `schema`; báo cáo có bước chuyển cho từng bản cũ (như `parseSave`).
- `build` (commit ngắn, nhúng lúc build) và `data` (8 ký tự FNV-1a của `03-Data`, cùng hàm băm với mã sao lưu) để tách bản vá giữa đợt.
- Kiểm lược đồ ở client (test) và ở báo cáo (sự kiện sai dạng bị bỏ và đếm).

## 6. Chỉ số dẫn xuất và ngưỡng

### 6.1 Quy ước chung

- **Người chơi** = một `install`. Dùng hai máy thì thành hai người (mục 9).
- **Cửa sổ đo:** từ ngày gửi link (ngày 0) tới hết ngày 7; cắt dữ liệu lúc 00:00 ngày 8.
- **Loại khỏi báo cáo:** `staff`; `install` chỉ có phiên < 10 s; `build` ngoài danh sách của đợt.
- **Lượt** = lượt vào màn theo QB-47 (`17-Quy-tac-bien.md`): từ màn Chuẩn bị tới khi thoát hoặc bấm Chơi lại.
- **Thiết bị của lượt** = thiết bị nhiều giây nhất trong `deviceSec` (như `primaryDevice`).
- **Lượt có giảm tốc** (`gameSpeedMin < 1`, `14` mục 4.6): loại khỏi MV7, H3, H4; vẫn tính MV1–MV3.
- **Bỏ cuộc ở màn S:** đã vào S, tới lúc cắt chưa hạ boss chiến dịch của S. **Đoạn kẹt** = đoạn xa nhất đã tới trong mọi lượt vào S.
- **Dùng đúng vũ khí khắc chế ở boss B:** có ít nhất một `boss_end` của B với `dmg[điểm yếu] / Σ dmg ≥ 0,25` `[PLACEHOLDER]`. Chỉ tính boss mà người chơi đã có vũ khí khắc chế khi vào đấu trường (`weaknessOwned`). Ở MVP: Lumen (Vine Lash), Cryo (Prism Beam), Aeris (Frost Shard). Thorna không tính: điểm yếu Ember Burst là vũ khí Stage 8.

### 6.2 Chỉ số chặn cổng

| Mã | Công thức | Ngưỡng | Mẫu tối thiểu |
| --- | --- | --- | --- |
| MV1 | người có `stage_end{prologue, clear}` / người có `stage_start{prologue}` | ≥ 0,90 | 30 |
| MV2 | người hạ `thorna` (boss chiến dịch `verdant_gardens`) ở bất kỳ độ khó / người có `stage_start{verdant_gardens}` | ≥ 0,70 | 30 |
| MV3 | người hạ đủ `thorna`, `lumen`, `cryo`, `aeris` / người có `stage_start{prologue}` | ≥ 0,50 | 30 |
| MV4 | người có `session_start` ở ngày đầu + 1 (theo `day`) / người có ngày đầu ≤ ngày 6 | ≥ 0,35 | 30 |
| MV5 | số `want_stage5 = yes` / số người trả lời (trừ `skip`) trong nhóm đã xong 4 màn | ≥ 0,60 | 10; ít hơn 70% nhóm trả lời thì "Thiếu dữ liệu" |
| MV6 | người dùng đúng ở ≥ 2 boss / người đã đánh ≥ 2 boss với `weaknessOwned` | ≥ 0,70 | 10 |
| MV7 | max theo màn S của (chết/phút cảm ứng ÷ chết/phút bàn phím − 1). Chết/phút của nhóm = Σ `death` ÷ (Σ `runSec` / 60), gộp mọi lượt của nhóm trong S | ≤ 0,40 | ≥ 5 người mỗi nhóm trong S; thiếu thì bỏ S và ghi |

- Báo cáo thêm, không dùng để chặn: tỷ lệ hạ boss ngay trong lượt đầu vào màn (GDD 17 "lần chơi đầu", `07` "phiên đầu"), và số lần chết trung bình trước khi hạ boss ở Stage 2–4 (GDD 17: ≤ 8).
- Tay cầm báo cáo riêng, không vào MV7 (GDD chỉ so cảm ứng với bàn phím).

### 6.3 Dấu hiệu "hỏng" (GDD 17)

| Mã | GDD 17 | Cách tính | Hỏng khi |
| --- | --- | --- | --- |
| H1 | Hơn 30% người thử bỏ cuộc ở cùng một đoạn | Với mỗi màn S: max theo đoạn X của (số người bỏ cuộc ở S có đoạn kẹt X) / (số người đã vào S) | > 0,30 |
| H2 | Cảm ứng thua nhiều hơn bàn phím trên 40% ở cùng màn | Như MV7 | > 0,40 |
| H3 | Một build cho thời gian hoàn thành chênh quá 2× dự kiến | Nhóm theo hướng build (nhánh có nhiều bậc nhất: V, P, C; chênh ≤ 1 bậc thì "cân bằng") × tổng cấp Upgrade (0–2, 3–5, ≥ 6). Thời gian hoàn thành = Σ `runSec` các lượt vào S tới lần hạ boss đầu. Tỷ số = trung vị nhóm ÷ (`expectedMin` của S × 60) | Ngoài [0,5; 2] với nhóm ≥ 3 người |
| H4 | Có chuỗi kỹ năng/module làm boss chết dưới 10% thời gian thiết kế | `boss_end{win}.fightSec` < 0,1 × `designFightSec[0]` của boss (Thorna: 60–90 s, ngưỡng 6 s) | Một lượt là đủ để mở điều tra, ghi kèm build |

- **H1 khác cổng Prototype:** Prototype tính trên các phiên chưa thắng (5 người, ít dữ liệu). MVP tính trên người đã vào màn, đúng chữ "30% người thử" của GDD 17. Nếu tính như Prototype, một người bỏ cuộc duy nhất đã là 100%.
- **Thời gian dự kiến:** Prologue 4 phút, Stage 1 10 phút (`02` mục 6); Stage 2–4 khoảng 11 / 11,5 / 12 phút (`16-Dac-ta-Stage2-4-nhap.md`, bản nháp). Thắng boss: Thorna, Lumen, Cryo 60–90 s, Aeris 75–105 s (cùng nguồn), nên ngưỡng H4 là 6 s và 7,5 s. Mọi số `[PLACEHOLDER]`.

### 6.4 Chỉ số phụ

| Mã | Chỉ số | Công thức | Mục tiêu `[PLACEHOLDER]` | Nguồn |
| --- | --- | --- | --- | --- |
| K1 | Đủ tiền cho món đầu tiên trước khi hết Stage 2 | người có `balance` lúc Quầy mở (hạ boss chiến dịch thứ 2) ≥ giá rẻ nhất đang bán (`shop.json`, hiện Magnet Range cấp 1: 200) / người hạ ≥ 2 boss | ≥ 70% | `04` mục 8 |
| K2 | Số dư cuối màn | trung bình `balance` ở `stage_end{clear}` lần đầu, Thường ÷ thu của màn (225 + 75 × (n − 1)) | ≤ 1,5 | `04` mục 2, 8 |
| K3 | Mức upgrade sau Stage 4 Thường | Σ giá đã trả ÷ 14.593, so với mô hình 70% × 1.350 ÷ 14.593 ≈ 6,5% | lệch ≤ 10 điểm % | `04` mục 4, 8 |
| K4 | Lặp màn để kiếm tiền | người có `stage_start` ở Stage 1–3 với `difficulty` bằng hoặc dễ hơn một độ khó trong `clearedBefore`, trước lần đầu vào màn mới kế tiếp / người | < 15% | `04` mục 8 |
| K5 | Thời gian tới lần mua đầu | trung vị `playSec` ở `shop_buy` đầu tiên | theo dõi | `04` mục 8 |
| K6 | Core Bit mỗi màn | trung vị `coreBitsEarned` (lượt hạ boss đầu) ÷ ((225 + 75 × (n − 1)) × `rewardMul`) | 0,8–1,2 | `04` mục 2 |
| DK1 | Chọn Thử thách | người có `stage_start{challenge}` / người đã mở Thử thách ở ≥ 1 màn | 10–20% | `11` mục 8 |
| DK2 | Bỏ cuộc theo độ khó | tỷ lệ lượt `stage_end{quit, abandon}` ở Thử thách ÷ ở Thường | ≤ 2 | `11` mục 8 |
| DK3 | Cốt truyện hoàn thành màn | màn đã vào ở Cốt truyện và hạ boss ở Cốt truyện / màn đã vào ở Cốt truyện | ≥ 90% | `11` mục 8 |
| DK4 | Quy tắc chỉnh | > 50% người thử Thử thách bỏ cuộc ở một đoạn: nới mẫu đòn; Cốt truyện còn người chết > 3 lần ở một đoạn: thêm checkpoint `story` | | `11` mục 7 |
| T1 | Thời lượng Prologue | trung vị `runSec` lượt hoàn thành | 3–5 phút | `07` mục 1 |
| T2 | Bỏ cuộc tại một bước | người có `tutorial_step_start` mà tới lúc cắt không có `complete` hay `skip` của bước đó / người bắt đầu bước | ≤ 3% mỗi bước | `07` mục 1, 9 |
| T3 | Bỏ qua hướng dẫn | người có `tutorial_skip{prologue}` hoặc `tutorial_toggle{on: false}` / người | ≤ 15% | `07` mục 1, 9 |
| T4 | Phễu Prologue → Hub → Stage 1 → boss Stage 1 | tỷ lệ qua từng mốc | ≥ 90% / 85% / 70% | `07` mục 9 |
| X1 | Không lỗi chết game | phiên không có `client_error{fatal}` / phiên | ≥ 99% | GDD 17 |
| X2 | Vào game | p75 `msToMenu` | ≤ 3.000 ms | GDD 15, 17 |
| X3 | Điều khiển Kai từ lần mở đầu | p75 `msToControl` | ≤ 15.000 ms | GDD 12, `07` |
| X4 | FPS trên điện thoại thật | lượt trên điện thoại có `fpsMedian ≥ 55` / lượt trên điện thoại | ≥ 90% | GDD 15 |
| X5 | Lỗi lưu | số `save_error` | 0 | M11 |
| F1 | Cảm giác Nhảy, Lướt, Bắn | trung bình theo thiết bị (phiếu sau lần đầu hạ Thorna) | ≥ 4/5 | Cổng Prototype |
| S1 | Dùng tùy chọn tiếp cận | % người cảm ứng bật tự bắn, hỗ trợ ngắm; % người dùng giảm tốc, mù màu, chữ lớn | theo dõi | `14` mục 10 |

Gợi ý bậc 3 (`07` mục 9) không đo: MVP mới có bậc 1–2.

### 6.5 Cỡ mẫu và độ tin cậy

Khoảng tin cậy 95% Wilson cho tỷ lệ p̂ trên n người (z = 1,96):

```text
tâm   = (p̂ + z²/(2n)) / (1 + z²/n)
nửa   = z × √(p̂(1 − p̂)/n + z²/(4n²)) / (1 + z²/n)
```

| Ví dụ | n = 50 | n = 30 |
| --- | --- | --- |
| p̂ = 0,90 (MV1) | [0,79; 0,96] | [0,74; 0,97] |
| p̂ = 0,70 (MV2) | [0,56; 0,81] | [0,52; 0,83] |
| p̂ = 0,35 (MV4) | [0,23; 0,49] | [0,21; 0,53] |

- 50 người chỉ cho sai số khoảng ±12 điểm %. Báo cáo ghi cả khoảng. **Đạt** khi p̂ đạt ngưỡng; **Biên** khi khoảng chứa ngưỡng ở phía không đạt; Producer quyết định trường hợp Biên và ghi lý do.
- Tuyển ≥ 25 người chơi chủ yếu cảm ứng và ≥ 15 người bàn phím, để MV7 còn ≥ 5 người mỗi nhóm ở Stage 4, nơi còn ít người nhất.

## 7. Báo cáo tổng hợp

### 7.1 Lịch đợt thử

| Ngày | Việc |
| --- | --- |
| −7 | `npm run mvp-flow` (Playwright, máy tính + Pixel 7): mở `?mvp=d0&staff=1`, đi Prologue → Stage 1, xác nhận lô tới điểm nhận; xem lô thật bằng mắt (không có dữ liệu thừa); xóa dữ liệu thử |
| −5…−1 | Tuyển 55–60 người (dự phòng khoảng 15% không chơi): ≥ 25 cảm ứng, ≥ 15 bàn phím; người mới (chưa thử Prototype); phiếu tuyển có ô đồng ý (mục 4) |
| 0 | Gửi link `?mvp=d1` kèm tin nhắn mẫu; đóng băng bản build |
| 0–7 | **Không nhắc chơi lại** (nhắc làm sai MV4); chỉ trả lời câu hỏi. Chỉ đăng bản vá cho lỗi mức Chặn (`04-Test-va-Launch.md` mục 3), ghi `build` mới |
| 8 | Cắt dữ liệu 00:00; gửi khảo sát cuối tùy chọn (form ẩn danh, 3 câu, không hỏi tên) |
| 8–9 | `npm run mvp-report`; ghi kết quả vào `04-Dev-Plan/08-Cong-MVP.md` (mới); quyết định theo 7.4 |

**Mẫu tin nhắn mời:**

> Chào bạn, mình đang làm game hành động 2D chơi trên trình duyệt và cần người chơi thử trong tuần này.
> Mở link (điện thoại thì cầm ngang): <link>?mvp=d1. Chơi lúc nào, bao lâu tùy bạn; không cần chơi hết.
> Chơi trên một máy, đừng dùng tab ẩn danh. Game tự gửi nhật ký chơi ẩn danh; tắt ở Cài đặt → Dữ liệu.

### 7.2 Phiếu trong game

- **Sau lần đầu hạ Thorna:** phiếu Nhảy, Lướt, Bắn 1–5 như cổng Prototype (`rating-panel.ts`). Mỗi câu ghi một `survey_answer`.
- **Sau màn Kết quả của boss chiến dịch thứ 4 (lần đầu):** "Bạn có muốn chơi tiếp màn 5 không?" Có / Có lẽ / Không / Bỏ qua. Nút ≥ 48 dp. Không bắt buộc: Bỏ qua thì ghi `skip`.
- Không hỏi thêm trong game, để phiên chơi không bị cắt ngang.

### 7.3 Báo cáo

`npm run mvp-report -- <file.json> [...]` đọc bảng tải từ Supabase (JSON) và/hoặc JSON xuất tay, gộp theo (`install`, `batch`) không trùng, rồi in Markdown vào `04-Dev-Plan/playtest/mvp-dot-<n>.md`:

1. **Đầu trang:** đợt, các `build`, số người theo thiết bị, số lô và sự kiện bị bỏ (sai lược đồ), số `install` loại.
2. **Cổng:** MV1–MV7: giá trị, n, khoảng Wilson, ngưỡng, Đạt / Không / Biên / Thiếu dữ liệu.
3. **Hỏng:** H1–H4, kèm màn, đoạn, build. Dòng hỏng tô cam như màn Kết quả chơi thử.
4. **Phễu:** Prologue → Hub → Stage 1 → Thorna → Stage 2 → Lumen → Stage 3 → Cryo → Stage 4 → Aeris (số người, %).
5. **Theo màn:** bảng đoạn × (người tới, chết, bỏ cuộc kẹt ở đây %); 5 nguyên nhân chết nhiều nhất.
6. **Thiết bị:** chết/phút, tỷ lệ hoàn thành, F1.
7. **Phụ:** K1–K6, DK1–DK4, T1–T4, X1–X5, S1.
8. **Việc đề xuất**, theo thứ tự sửa ở 7.4.

Mọi phép tính nằm ở `game/src/logic/telemetry/report.ts` (thuần, có test); script chỉ đọc file và in. Ngưỡng đọc từ `03-Data/telemetry.json`.

### 7.4 Quy tắc quyết định

- **Qua cổng:** MV1–MV7 đạt và không có H nào, trên cùng một build. Bản vá lỗi Chặn mà không đổi `data` thì gộp.
- **Chưa qua** (GDD 16, `05-Cong-Prototype.md` mục 6): sửa theo thứ tự, không thêm hệ thống:
  1. Điều khiển cảm ứng (MV7, H2).
  2. Thông số cảm giác (F1).
  3. Đoạn có nhiều người bỏ cuộc (H1): nới khe né, thêm checkpoint trước khi chỉnh chỉ số.
  4. Cân bằng build, boss (H3, H4).
  5. Thử lại với người mới.

## 8. Schema dữ liệu đề xuất

```ts
// game/src/logic/telemetry/schema.ts (thuần)
export const TELEMETRY_SCHEMA = 2;
export type Prop = number | boolean | string | string[] | Record<string, number>;
export interface TelemetryEvent {
  e: EventName;          // tên trong mục 3
  t: number;             // ms từ 1970, đồng hồ máy
  sid: string;           // phiên, ngẫu nhiên
  n: number;             // thứ tự trong phiên, từ 0
  p: Record<string, Prop>;
}
export interface TelemetryBatch {
  schema: 2;
  install: string;       // UUID v4 ngẫu nhiên
  batch: string;         // `${sid}-${số lô trong phiên}`, duy nhất theo install
  wave: string;          // mã đợt từ ?mvp=
  build: string;         // commit ngắn
  data: string;          // FNV-1a 8 ký tự của 03-Data
  sentAt: number;
  events: TelemetryEvent[];
}
export interface TelemetryLocal {   // localStorage `cv.telemetry`
  schema: 2;
  install: string;
  consent: 'on' | 'off';
  noticeShown: boolean;
  pendingDelete: string[];          // install cũ chờ xóa ở điểm nhận
  failedSessions: number;           // số phiên liền không gửi được
}
// Bộ đệm theo phiên để hai thẻ không ghi đè nhau: `cv.telemetry.q.<sid>` = Array<TelemetryEvent & { sent?: true }>
```

Ví dụ một lô (rút gọn):

```json
{"schema":2,"install":"3f6c…","batch":"k9x2-4","wave":"d1","build":"a1b2c3d","data":"9e0f12ab","sentAt":1763600000000,
 "events":[
  {"e":"death","t":1763599990000,"sid":"k9x2","n":57,"p":{"stage":"verdant_gardens","section":"B","kind":"death","cause":"enemy:shieldCharger","device":"touch","tRun":312.4,"streak":2}},
  {"e":"boss_end","t":1763599999000,"sid":"k9x2","n":58,"p":{"boss":"thorna","outcome":"win","fightSec":71.3,"dmg":{"Arc Cannon":238,"Vine Lash":12},"weakHits":0,"swaps":1,"bossHpPct":0,"device":"touch","gameSpeed":1}}
 ]}
```

Điểm nhận (file `04-Dev-Plan/tools/telemetry/schema.sql`):

```sql
create table public.telemetry_batches (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  install_id uuid not null,
  batch text not null check (char_length(batch) <= 40),
  wave text not null check (char_length(wave) <= 16),
  schema smallint not null check (schema = 2),
  build text not null check (char_length(build) <= 16),
  payload jsonb not null check (octet_length(payload::text) <= 32768),
  unique (install_id, batch)
);
alter table public.telemetry_batches enable row level security;
create policy telemetry_insert on public.telemetry_batches for insert to anon with check (true);
-- Không có policy select, update, delete cho anon: khóa trong bản build chỉ ghi được.
create function public.delete_my_data(p_install uuid) returns void
  language sql security definer set search_path = public
  as $$ delete from public.telemetry_batches where install_id = p_install $$;
revoke all on function public.delete_my_data(uuid) from public;
grant execute on function public.delete_my_data(uuid) to anon;
-- Giới hạn 500 lô mỗi install: trigger before insert đếm theo install_id.
```

- Client gửi `POST /rest/v1/telemetry_batches` với `Prefer: return=minimal`. Trùng (`install_id`, `batch`) thì máy chủ trả 409; client coi 409 là đã nhận.
- `install_id` là UUID ngẫu nhiên 122 bit, không đoán được, nên ai biết nó mới xóa được dữ liệu của nó.
- URL và khóa `anon` lấy từ biến build `VITE_TELEMETRY_URL`, `VITE_TELEMETRY_KEY` (biến của GitHub Actions; khóa `anon` vốn công khai). Thiếu biến thì bản build chỉ ghi cục bộ.

`03-Data/telemetry.json` (mới, kiểm tra ở `game/src/core/telemetry-config.ts`: ngưỡng trong [0; 1], giới hạn > 0, lô ≤ 32.768 byte, tên sự kiện trong danh sách):

```json
{
  "schema": 2,
  "minSessionSec": 10,
  "newSessionAfterHiddenMin": 30,
  "buffer": { "maxBytes": 262144, "maxEvents": 2000 },
  "batch": { "maxEvents": 100, "maxBytes": 24576, "minPending": 20, "intervalSec": 60 },
  "retry": { "baseSec": 30, "maxSec": 600, "maxPerSession": 6 },
  "errorsPerSession": 20,
  "noticeSec": 8,
  "gate": { "prologueClear": 0.9, "stage1Clear": 0.7, "allFourClear": 0.5, "returnNextDay": 0.35,
            "wantStage5": 0.6, "weaknessUse": 0.7, "weaknessBosses": 2, "weaknessDamageShare": 0.25,
            "touchVsKeyboard": 0.4, "minSample": 30, "minGroup": 5 },
  "broken": { "quitSameSection": 0.3, "buildTimeRatio": 2, "buildMinGroup": 3, "bossTtkFrac": 0.1 }
}
```

## 9. Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| Một người chơi trên hai máy hoặc hai trình duyệt | Thành hai `install`. Báo cáo ghi "người chơi = install"; tin mời dặn chơi một máy |
| Tab ẩn danh, xóa dữ liệu trang | `install` mới mỗi lần, MV4 thấp hơn thật. Tin mời dặn không dùng ẩn danh; báo cáo đếm `install` chỉ có một phiên dưới 2 phút |
| Hai thẻ cùng mở | Mỗi thẻ một `sid` và một hàng đợi `cv.telemetry.q.<sid>`; `batch` theo `sid` nên không trùng |
| Mất mạng, điểm nhận chết, bị trình chặn | Giữ trong bộ đệm, thử lại. Game không chờ, không lỗi console ngoài một dòng cảnh báo. 3 phiên liền không gửi được: Cài đặt → Dữ liệu hiện "Chưa gửi được N sự kiện" kèm nút Xuất JSON |
| Gửi trùng (hết giờ chờ nhưng máy chủ đã nhận) | Khóa (`install_id`, `batch`) → 409 → coi như đã nhận |
| Đóng trình duyệt giữa màn | Lúc trang ẩn: ghi `stage_progress`, gửi bộ đệm bằng keepalive. Không quay lại thì báo cáo coi lượt là `abandon`, lấy `stage_progress` cuối (hoặc sự kiện cuối) làm trạng thái |
| Ẩn tab rồi quay lại dưới 30 phút | Cùng phiên; `realSec` không cộng lúc ẩn |
| Đổi giờ máy, đổi múi giờ | `day` lấy theo giờ máy lúc mở. Ngày lùi hoặc nhảy quá 30 ngày thì bỏ MV4 của người đó và đếm |
| Bản vá giữa đợt | `build` khác; báo cáo tách theo build; gộp cho G chỉ khi `data` không đổi |
| Người làm game tự chơi | `staff=1` → loại |
| Link lan ra ngoài nhóm tuyển | Thông báo trong game vẫn hiện, có nút Tắt gửi. Hơn 60 `install` thì xem lại nguồn |
| Ghi rác vào bảng | Chỉ ghi, giới hạn kích thước và số lô; báo cáo bỏ lô sai lược đồ và `install` có số sự kiện mỗi giờ > 3 lần trung vị; đợt xong thì thu quyền ghi |
| Rút đồng ý khi không có mạng | Xóa cục bộ ngay; `install` cũ vào `pendingDelete`, gọi xóa khi có mạng |
| Lượt có giảm tốc | Loại khỏi MV7, H3, H4; vẫn tính phễu |
| Prologue chưa có bản đồ thật lúc tới đợt thử | Không đo được MV1, T1–T4. Đợt thử chờ Prologue, hoặc ghi "không đo" và Producer quyết |
| Chơi các màn không theo thứ tự | MV6 chỉ tính boss mà người chơi đã có vũ khí khắc chế khi vào đấu trường |
| Phiên < 10 s | Bỏ khỏi báo cáo (như cổng Prototype) |
| `localStorage` đầy hoặc bị chặn | Ghi trong bộ nhớ của phiên và gửi ngay; không có bộ đệm qua phiên |

## 10. Tiêu chí nghiệm thu

- [ ] Test mô phỏng một lượt Stage 1 bằng `StageWorld` và đầu vào giả sinh đúng chuỗi `stage_start → section_enter… → death → checkpoint → boss_start → boss_end → stage_end`, đủ thuộc tính bắt buộc.
- [ ] Bộ kiểm lược đồ chặn khóa lạ, chuỗi tự do, giá trị ngoài enum. `client_error.msg` không còn URL, chữ số, và ≤ 120 ký tự.
- [ ] Bộ đệm không vượt 256 KB hay 2.000 sự kiện; bỏ đúng thứ tự ưu tiên; không mất sự kiện ưu tiên 0 (test đổ 10.000 sự kiện).
- [ ] Mở không có `?mvp=` thì không tạo `cv.telemetry` và không có request mạng nào (Playwright đếm request).
- [ ] Tắt gửi: bộ đệm trống, `delete_my_data` được gọi, không còn request ghi; bảng thật không còn dòng của `install` đó.
- [ ] Gửi lô: thử lại có giãn cách; 409 coi như đã nhận; tắt mạng 10 phút rồi bật không mất sự kiện; bước logic không chậm thêm quá 0,1 ms vì gửi.
- [ ] `mvp-report` trên bộ dữ liệu mẫu có đáp án (20 `install` giả, gồm các trường hợp ở mục 9) cho đúng MV1–MV7, H1–H4, K, DK, T, X; khoảng Wilson đúng tới 0,01.
- [ ] Lô thật không có `userAgent` đầy đủ, tên, IP (xem bằng mắt trước đợt).
- [ ] `npm run mvp-flow` đạt trên máy tính và Pixel 7 giả lập; ảnh và lô mẫu lưu ở `04-Dev-Plan/qa/<mã Story>/`.
- [ ] Bot chơi lặp 60 phút sinh ≤ 40 KB dữ liệu.

## 11. Thay đổi cần lan sang tài liệu khác

| Tài liệu | Thay đổi |
| --- | --- |
| GDD chính mục 15 | Dòng "Phân tích và vận hành": đợt thử MVP dùng một bảng chỉ-ghi Supabase tách riêng, xóa sau cổng. Ghi rõ "không làm máy chủ trước cổng" (mục 16) không gồm điểm nhận này |
| GDD chính mục 16 | Mẫu số từng tiêu chí cổng; định nghĩa "dùng đúng vũ khí khắc chế" (mục 6.1); Thorna không tính trong lượt đầu |
| GDD chính mục 17 | "Tỷ lệ thua" = chết/phút như cổng Prototype; mẫu số H1 là người đã vào màn; cách nhóm build cho H3; H4 dựa trên `designFightSec` |
| `04-Can-bang-kinh-te.md` mục 8 | MVP chưa có booster, skin: bỏ "booster dùng mỗi màn" và "tỷ lệ chi theo loại" khỏi danh sách đo MVP. "Đủ tiền cho món đầu tiên trước khi kết thúc Stage 2" đo lúc Quầy mở (sau boss chiến dịch thứ 2) |
| `07-Kich-ban-huong-dan.md` mục 9 | Sự kiện `tutorial_*` dùng phong bì chung; thêm `tutorial_toggle` |
| `11-Do-kho.md` mục 8 | Mẫu số của giả thuyết "10–20% chọn Thử thách" là người đã mở Thử thách |
| `04-Dev-Plan/04-Test-va-Launch.md` | Mục 1.1 thêm hàng M16 (lược đồ, bộ đệm, thử lại, báo cáo); mục 2 thêm mốc MVP với quy trình mục 7 |
| `04-Dev-Plan/08-Cong-MVP.md` (mới) | Theo khuôn `05-Cong-Prototype.md`: tiêu chí, quy trình, kết quả các đợt |
| `04-Dev-Plan/05-Cong-Prototype.md` | Không đổi cách đo. Nên bỏ `userAgent` đầy đủ trong `makeExport` (thay bằng `platform`, `browser`) |
| `04-Dev-Plan/01-Ke-hoach-lam-viec.md` | Sprint 17–18: EP-13 phải xong trước đợt thử 50 người |
| `04-Dev-Plan/02-Module.md` | M16 tách "bản tối thiểu MVP" (sự kiện, điểm nhận, báo cáo) khỏi Remote Config; phụ thuộc: trước cổng MVP |
| `04-Dev-Plan/07-Ban-do-he-thong.md` | Dòng M16: Tài liệu "Đủ (`13-Do-luong-MVP.md`)". Thêm tên sự kiện và thuộc tính chung vào danh mục tên chuẩn (mục 3) |
| `03-Data` | `telemetry.json` (mới); `stages.json` thêm `expectedMin` mỗi màn và id đoạn trên bản đồ (A, B, C, D, `boss`); `bosses.json` thêm `designFightSec` (Thorna, Lumen, Cryo `[60, 90]`; Aeris `[75, 105]`); số lấy từ `02` mục 6 và `16-Dac-ta-Stage2-4-nhap.md` |
| Code thuần | `StageWorld`: cộng sát thương lên boss theo vũ khí; nhớ nguồn của cú đánh cuối (`enemy:<id>`, `boss:<đòn>`, `spike`, `pit`); chữ ký build từ `character.skills` |
| `game/CONTEXT.md`, `game/docs/quyet-dinh/` | Dòng trạng thái M16; file quyết định mới `do-luong.md` |
| `14-Cai-dat-Tiep-can.md` mục 3.6 | Mục Dữ liệu: trạng thái gửi, mã xóa, Tắt gửi và xóa, Xuất JSON (chỉ hiện ở bản `?mvp=`) |
| `17-Quy-tac-bien.md` | Đã giải quyết 14/11: Epic đo lường là **EP-13** (kế hoạch S9), EP-16 là Vertical slice. Thêm luật biên mới: lượt có giảm tốc không tính MV7, H3, H4; trang ẩn ghi `stage_progress` |

## 12. Story đề xuất (EP-13)

| Mã | Tên | Phụ thuộc | Cỡ | Tiêu chí chính |
| --- | --- | --- | --- | --- |
| ST-13-01 | Lõi `logic/telemetry/`: lược đồ, phong bì, bộ đệm theo ưu tiên, giới hạn; `telemetry.json` + `core/telemetry-config.ts` | | 1 ngày | Mục 10 ý 2–3; test thuần |
| ST-13-02 | Nối sự kiện: Boot, Menu, StageScene (`WorldEvents` → sự kiện), màn Chuẩn bị, Quầy, Xưởng, TutorialManager; `StageWorld` thêm sát thương theo vũ khí, nguồn cú đánh cuối, chữ ký build; `stages.json`, `bosses.json` thêm số liệu | 01 | 2 ngày | Mục 10 ý 1; mọi sự kiện ở mục 3 có test; QB-47, QB-90 |
| ST-13-03 | Cờ `?mvp=`, `staff`; `install`; thông báo không chặn; Cài đặt → Dữ liệu (Tắt gửi và xóa, mã xóa, trạng thái, Xuất JSON) | 01; EP-14 khung Cài đặt | 1 ngày | Mục 10 ý 4–5; thông báo không làm `msToControl` vượt 15 s |
| ST-13-04 | Điểm nhận: `schema.sql` (bảng, RLS, `delete_my_data`, giới hạn lô), Uploader (lô, thử lại, keepalive, 409), biến build trong Pages workflow | 01, 03 | 1,5 ngày | Mục 10 ý 6, 8 |
| ST-13-05 | Báo cáo: `logic/telemetry/report.ts` (G, H, K, DK, T, X, F, S, Wilson) + `npm run mvp-report`; bộ dữ liệu mẫu có đáp án | 01 | 1,5 ngày | Mục 10 ý 7 |
| ST-13-06 | Phiếu trong game (cảm giác sau Thorna, "màn 5" sau boss thứ 4); `npm run mvp-flow`; `08-Cong-MVP.md` và cập nhật `04-Test-va-Launch.md` | 02–05 | 1 ngày | Mục 10 ý 9–10; ảnh ở `04-Dev-Plan/qa/ST-13-06/` |

Thứ tự: 01 → 02 → 03 → 04 → 05 → 06, tổng khoảng 8 ngày. ST-13-05 làm song song được sau 01.

**Hoãn khỏi MVP:** Remote Config, cờ tính năng (M16 đầy đủ, Live-ops); Firebase Analytics, Crashlytics; sự kiện quảng cáo `ad_*` (`06` mục 6.5); bảng điều khiển trực tuyến (báo cáo Markdown là đủ cho 50 người).
