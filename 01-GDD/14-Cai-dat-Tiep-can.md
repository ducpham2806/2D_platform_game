# Cài đặt và tùy chọn tiếp cận (bản MVP)

- **Trạng thái:** Bản 1, Draft (14/11/2026). Chờ duyệt: Creative Director (tốc độ game và bảng xếp hạng, bảng màu), Technical Director (lưu, tốc độ game, chữ trong canvas).
- **Quy trình:** Game Studio Agent `/design-system` theo `templates/gdd-system-template.md`; vai UI/UX Lead (`ui-designer`, `game-ui-ux`, `input-systems`) + QA Lead (`game-qa-playtest`).
- **Nguồn:** GDD chính mục 5.2, 11 (tùy chọn tiếp cận), 13, 15; wireframe `02-Wireframes/boards/{SettingsControls,Gamepad,Touch,LayoutEdit,PSettings,Access,Graphics,Audio,Account,NSettingsNotif,Pause,PMenu,Menu,PRotate}.html`; `03-Data/{controls,ui,weapons}.json`; code `game/src/logic/input/{settings,touch-layout,stick}.ts`, `game/src/input/{touch-editor,touch-overlay}.ts`, `game/src/scenes/controls-scene.ts`, `game/src/scenes/stage/{pause-menu,stage-hud,stage-renderer,enemy-renderer,dialogue-box}.ts`, `game/src/scenes/stage-scene.ts`, `game/src/logic/combat/loadout.ts`.
- **Phạm vi MVP:** màn Cài đặt cho bản web (PC và điện thoại cầm ngang; chỉ hỗ trợ màn ngang, GDD 5.2, QB-93). Âm thanh chỉ là chỗ đặt, nội dung ở `12-Am-thanh.md` (đang viết song song). Mọi con số là `[PLACEHOLDER]`.
- **Story:** Epic EP-14 (mục 12). Đo việc dùng tùy chọn: `13-Do-luong-MVP.md` (sự kiện `settings_change`, chỉ số S1).

## 0. Hiện trạng

| Đã có | Khoảng trống, mâu thuẫn |
| --- | --- |
| `ControlsScene` (canvas): 3 tab Bàn phím, Tay cầm, Cảm ứng; đổi phím/nút có hoán đổi; "Mặc định" | Chữ 9 px logic = 13,7 dp trên Pixel 7 (k = 4, dpr 2,625), dòng cao 12 px logic = 18 dp; không điều hướng được bằng tay cầm |
| `TouchEditorPanel` (HTML): cỡ nút 0,85/1/1,2, độ trong suốt 0,2–1 (mặc định 0,6), cần ảo nổi/cố định, rung, tự bắn, hỗ trợ ngắm, thuận tay trái, Đặt lại | Nút 40 px, dòng 36 px: dưới 48 dp |
| `cv.controls` bản 1 (localStorage), hỏng từng phần về mặc định | `parseControlSettings` trả mặc định khi `version` khác 1: nâng bản mà quên bước chuyển sẽ xóa phím người chơi đã đổi |
| Menu tạm dừng: Bật/Tắt hướng dẫn (bản lưu `tutorial.off`); "Tùy chọn (chưa có)" | Không có màn Cài đặt; không có tùy chọn Hiển thị, Tiếp cận, Ngôn ngữ |
| Bảng Dữ liệu lưu (menu S): sao chép mã, nhập mã, xóa dữ liệu | Bảng `.cv-panel` chữ 14 px, ghi chú 12 px, nút 40 px |
| FPS chỉ hiện ở `?debug=1` | |
| | **Viết cứng, trái quy tắc dữ liệu:** `AIM_BAND_PX = 12`, `AIM_MAX_SLOPE = 0,25` (`loadout.ts`); `DOWN_AXIS_THRESHOLD = 0,5` (`stage-scene.ts`); rung 8 ms (`touch-overlay.ts`); 7 trong 10 lệnh `camera.shake` và 1 `camera.flash` (`stage-scene.ts`); mọi mã màu ngữ nghĩa trong renderer |
| | **Wireframe:** Access "Giảm rung màn hình" và Graphics "Rung màn hình" là một tùy chọn; SettingsControls ghi Tương tác = E, nhưng đã chốt W/↑ (E là đổi vũ khí); không có mục Ngôn ngữ; tab "Tài khoản" cần cloud (Beta) |
| | GDD 11 "giảm tốc độ game 10–30%" khớp wireframe 100/90/80/70%, nhưng chưa nói có tính vào bảng xếp hạng không |

## 1. Tổng quan và nguyên tắc

- **Trụ cột 1 (điều khiển chuẩn xác, tha thứ đúng chỗ, kể cả cảm ứng):** người chơi chỉnh được điều khiển cho tay mình (bố cục, cỡ nút, độ nhạy, tự bắn).
- **Trụ cột 5 (tôn trọng):** tùy chọn tiếp cận không khóa nội dung, không giảm thưởng. Chỉ tốc độ game < 100% bị tách khỏi bảng xếp hạng (mục 4.6), vì nó đổi chính thứ bảng xếp hạng so.
- **Không thông tin nào chỉ truyền bằng màu** (WCAG 1.4.1). Không chớp quá 3 lần mỗi giây khi bật giảm nhấp nháy (WCAG 2.3.1).
- Mỗi tùy chọn đạt được trong ≤ 3 lần chạm từ menu tạm dừng (Tùy chọn → tab → tùy chọn). Đổi là lưu ngay, không có nút Lưu.
- Chơi trước, cài đặt sau (`07` nguyên tắc 7): mặc định phải chơi được; cỡ nút và tay thuận hỏi sau Prologue (F03).

## 2. Cây menu Cài đặt

Mở từ Menu chính (Tùy chọn) và Menu tạm dừng (Tùy chọn). Bảng HTML theo ADR-001.

```text
Cài đặt
├─ Điều khiển
│  ├─ Bàn phím: đổi phím 11 hành động · Đặt lại
│  ├─ Tay cầm: đổi nút · Độ nhạy cần · Rung tay cầm · Đặt lại
│  └─ Cảm ứng: Chỉnh bố cục (kéo thả) · Cỡ nút · Độ trong suốt · Cần ảo · Độ nhạy cần · Rung phản hồi
│              · Tự bắn · Hỗ trợ ngắm · Thuận tay trái · Đặt lại
├─ Hiển thị: Hiện FPS · Toàn màn hình
├─ Âm thanh: theo 12-Am-thanh.md
├─ Tiếp cận: Mù màu · Rung màn hình · Giảm nhấp nháy · Cỡ chữ hội thoại · Tự tiến thoại · Tốc độ game
│            · Hướng dẫn · (lối tắt) Tự bắn và hỗ trợ ngắm → Điều khiển › Cảm ứng
│            · (lối tắt) Âm cảnh báo đòn boss → Âm thanh
├─ Ngôn ngữ: Tiếng Việt · English (sau MVP)
└─ Dữ liệu: Mã sao lưu (xuất, nhập) · Xóa bản lưu · Nhật ký chơi thử (chỉ bản ?mvp=, 13 mục 4) · Đặt lại mọi cài đặt
```

- Đổi tên so với wireframe: "Trợ năng" → **Tiếp cận** (cùng chữ GDD 11), "Đồ họa" → **Hiển thị**, "Tài khoản" → **Dữ liệu** (đăng nhập, cloud ở Beta). Thêm **Ngôn ngữ**.
- Trong trận (mở từ menu tạm dừng): đủ các mục, trừ "Xóa bản lưu" (mờ, "Thoát màn để xóa").
- Bản `?gate=1` giữ như hiện nay (chỉ Điều khiển), để không đổi điều kiện cổng Prototype.

## 3. Tùy chọn

Cột "Lưu": `cv.controls` (localStorage, đã có, nâng lên bản 2), `cv.settings` (localStorage, mới), **bản lưu** (IndexedDB, M11). Lý do chọn chỗ lưu: mục 6.

### 3.1 Điều khiển

| id | Giá trị | Mặc định | Lưu | Tác dụng bằng số | Áp dụng | Code |
| --- | --- | --- | --- | --- | --- | --- |
| `keyboard.<hành động>` | 1–2 `KeyboardEvent.code` | `controls.json → keyboard` | `cv.controls` | 11 hành động; trùng phím thì hoán đổi; không để hành động bắt buộc trống; Esc luôn là Quay lại trong Cài đặt | Ngay | Có |
| `gamepad.<hành động>` | chỉ số nút (bố cục standard) | `controls.json → gamepad.buttons` | `cv.controls` | như trên | Ngay | Có |
| `gamepad.sensitivity` | thấp, vừa, cao | vừa | `cv.controls` (bản 2) | vùng chết cần trái 0,35 / 0,25 / 0,15 (hiện cố định 0,25) | Bước logic kế tiếp | Chưa |
| `gamepad.vibration` | bật, tắt | bật | `cv.controls` (bản 2) | rung `dual-rumble`: phản hồi bậc vừa 90 ms (mạnh 0,3, nhẹ 0,5); bậc lớn 150 ms (0,6; 0,8); bị đánh 80 ms (0,4; 0,4). Mẫu đặt cạnh mẫu rung điện thoại ở `ui.json → feedback`, cùng giới hạn ≤ 300 ms trong 1 s. Không có `vibrationActuator` thì dòng mờ | Ngay | Chưa |
| `touch.offsets` | vị trí kéo thả từng nút (dp tính từ góc neo) | `controls.json → touch.buttons` | `cv.controls` | Chỉnh bố cục cần cầm ngang | Ngay | Có |
| `touch.sizePreset` | nhỏ, vừa, lớn | vừa | `cv.controls` | ×0,85 / 1 / 1,2 cỡ gốc, kẹp ≥ 48 dp: Bắn, Nhảy 65 / 76 / 91 dp; Lướt 54 / 64 / 77 dp; nút 48 dp thành 48 / 48 / 58 dp | Ngay | Có |
| `touch.opacity` | 0,2–1, bước 0,05 | 0,6 | `cv.controls` | độ đục lớp nút | Ngay | Có |
| `touch.stickMode` | nổi, cố định | nổi | `cv.controls` | nổi: tâm cần ở chỗ chạm, trong vùng trái rộng 45% màn hình, bỏ 25% phía trên; cố định: tâm cách mép trái 90 dp, mép dưới 90 dp; bán kính 60 dp | Lần chạm sau | Có |
| `touch.sensitivity` | thấp, vừa, cao | vừa | `cv.controls` (bản 2) | vùng chết cần ảo 0,30 / 0,20 / 0,10 × bán kính 60 dp: kéo 18 / 12 / 6 dp thì Kai bắt đầu chạy (di chuyển là số, không theo độ lệch). Ngưỡng Xuống (xuyên bục) giữ 0,5 sau co giãn | Bước logic kế tiếp | Chưa |
| `touch.vibration` | bật, tắt | bật | `cv.controls` | rung 8 ms mỗi lần chạm nút (đã có); mẫu rung theo sự kiện (bị đánh 40 ms, chết, nạp đầy…; tổng ≤ 300 ms trong 1 s) theo `12-Am-thanh.md` mục 6.4. Không có `navigator.vibrate` (iOS) thì dòng mờ "Máy này không hỗ trợ" | Ngay | Có (chạm nút) |
| `touch.autoFire` | bật, tắt | tắt | `cv.controls` | giữ Bắn: đạn thường mỗi 0,2 s (5 phát/s) trong khi vẫn nạp; thả ra thì bắn đạn nạp nếu đã nạp ≥ 0,5 s. Chỉ khi thiết bị gần nhất là cảm ứng | Bước logic kế tiếp | Có |
| `touch.aimAssist` | bật, tắt | tắt | `cv.controls` | đạn thường của Arc Cannon nghiêng về mục tiêu gần nhất phía trước trong dải dọc ±12 px (0,75 ô), độ dốc tối đa 0,25 (≈ 14°); đạn nạp không đổi. Chỉ khi thiết bị gần nhất là cảm ứng | Bước logic kế tiếp | Có (hằng số viết cứng) |
| `touch.leftHanded` | bật, tắt | tắt | `cv.controls` | lật neo ngang mọi nút và vùng cần (cần sang phải); xóa vị trí đã kéo riêng | Ngay | Có |

**Tự bắn và hỗ trợ ngắm cho bàn phím, tay cầm:** không làm ở MVP. Lý do: mô phỏng lối bắn (`power-cap.test.ts`) cho "nạp vừa + tự bắn" 9,15 so với liên thanh 7,40 (đơn vị như trong test); bật cho bàn phím sẽ làm lệch phép so cảm ứng/bàn phím của cổng MVP (MV7, `13` mục 6.2). Xem lại sau cổng.

### 3.2 Hiển thị

| id | Giá trị | Mặc định | Lưu | Tác dụng bằng số | Áp dụng | Code |
| --- | --- | --- | --- | --- | --- | --- |
| `display.showFps` | bật, tắt | tắt | `cv.settings` | góc dưới trái "FPS 60": `game.loop.actualFps` làm tròn, cập nhật mỗi 0,5 s. Bản `?debug=1` vẫn hiện dòng gỡ lỗi đầy đủ | Ngay | Một phần (chỉ `?debug=1`) |
| `display.fullscreen` | bật, tắt | tắt | Không lưu (trình duyệt đòi thao tác người dùng mỗi lần) | Fullscreen API. Pixel 7: mất thanh trình duyệt nên hệ số phóng ước tính lên k = 5 (hình to hơn 25%). Không có API (iPhone) thì ẩn dòng | Ngay | Chưa |
| Chất lượng, giới hạn FPS, hiệu ứng hạt, khóa ngang | | | | Sau MVP: chưa có hệ hạt; khóa ngang cần PWA hoặc app | | Không làm |

Rung màn hình nằm ở Tiếp cận (mục 3.4), không lặp ở Hiển thị.

### 3.3 Âm thanh

Chỉ là chỗ đặt. id, giá trị, tác dụng do `12-Am-thanh.md` quy định (5 thanh: Tổng, Nhạc, Hiệu ứng, Cảnh báo đòn boss, Giao diện, và công tắc Tắt tiếng; bỏ "Tắt tiếng khi chuyển tab", "Nhạc theo nhịp pha boss" của wireframe Audio). Lưu ở khóa riêng `cv.audio` (`12` mục 6.5), không nằm trong `cv.settings`. Tab Tiếp cận có lối tắt tới "Âm cảnh báo đòn boss" (`12` mục 6.3). Tốc độ game không đổi tempo nhạc (mục 4.6).

### 3.4 Tiếp cận

| id | Giá trị | Mặc định | Lưu | Tác dụng bằng số | Áp dụng | Code |
| --- | --- | --- | --- | --- | --- | --- |
| `a11y.colorblind` | tắt, protan, deutan, tritan | tắt | `cv.settings` | đổi tới 6 trong 8 màu ngữ nghĩa theo bảng mục 4.1; dấu hình luôn có ở mọi chế độ | Khung kế tiếp | Chưa |
| `a11y.screenShake` | 100%, 50%, tắt | 100% | `cv.settings` | biên độ rung camera × 1 / 0,5 / 0; thời gian giữ nguyên (mục 4.2). Không đổi dừng hình (hit-stop) và rung tay cầm, điện thoại | Ngay | Chưa |
| `a11y.reduceFlash` | bật, tắt | tắt | `cv.settings` | ≤ 3 lần chớp mỗi giây; không chớp toàn màn hình; báo trước thêm thanh tiến độ (mục 4.3). Thời gian báo trước không đổi | Ngay | Chưa |
| `a11y.textSize` | thường, lớn | thường | `cv.settings` | chữ hội thoại, lời hướng dẫn, gợi ý NOVA: ≥ 16 sp / ≥ 20 sp ở cỡ thật (mục 4.4). Wireframe gọi là "Phụ đề cỡ lớn" | Ngay (hộp đang mở vẽ lại) | Chưa (cố định 9 px logic) |
| `a11y.autoAdvance` | tắt, vừa, chậm | tắt | `cv.settings` | câu hiện hết rồi chờ min(10; max(3; số ký tự / 15)) s; chậm × 1,5 (mục 4.5, QB-72) | Từ câu kế | Chưa |
| `a11y.gameSpeed` | 100%, 90%, 80%, 70% | 100% | `cv.settings` | mọi thứ trong trận chậm đều; lượt không vào bảng xếp hạng (mục 4.6) | Khi bấm Tiếp tục | Chưa |
| `tutorial.off` | bật, tắt hướng dẫn | bật | **Bản lưu** (`tutorial.off`) | tắt thì không hiện bước hướng dẫn và gợi ý NOVA sau 3 lần chết; hộp thoại boss vẫn hiện | Ngay | Có (menu tạm dừng) |
| Âm cảnh báo đòn boss | | | `cv.audio` | Lối tắt sang Âm thanh: công tắc của bus `alert`, cùng trạng thái với thanh Cảnh báo (`12-Am-thanh.md` mục 6.1). Không có "Chỉ báo âm thanh bằng hình" (không cần nhờ QB-23) | | |
| Tự bắn, hỗ trợ ngắm | | | | Lối tắt sang Điều khiển › Cảm ứng | | |

### 3.5 Ngôn ngữ

| id | Giá trị | Mặc định | Lưu | Tác dụng | Áp dụng | Code |
| --- | --- | --- | --- | --- | --- | --- |
| `lang` | vi, en | vi. Sau MVP, lần đầu theo `navigator.language` (bắt đầu bằng `vi` thì vi, khác thì en) | `cv.settings` | chọn bảng chuỗi. MVP chỉ có tiếng Việt; "English (sắp có)" hiện mờ. Thoại Warden đã có `en` trong dữ liệu | Màn kế tiếp; trong hội thoại thì từ câu kế | Chưa (chỉ `locale` của thoại boss) |

### 3.6 Dữ liệu

| id | Giá trị | Lưu | Tác dụng | Áp dụng | Code |
| --- | --- | --- | --- | --- | --- |
| `save.export`, `save.import` | | Bản lưu | mã `CV1.<base64url>.<FNV-1a>`; sai checksum bị từ chối. Mã không chứa cài đặt | Ngay | Có (bảng Dữ liệu lưu) |
| `save.reset` | | Bản lưu | xóa bản lưu, bấm 2 lần; không đụng `cv.settings`, `cv.controls` | Ngay | Có |
| `telemetry.consent` | gửi, không gửi | `cv.telemetry` | chỉ bản `?mvp=`. Tắt gửi thì xóa nhật ký trên máy và ở điểm nhận (`13` mục 4) | Ngay | Chưa |
| `telemetry.status` | | | "Đã gửi" hoặc "Chờ N sự kiện"; mã xóa 8 ký tự; nút Xuất JSON (đường dự phòng, `13` mục 2) | | Chưa |
| `settings.reset` | | `cv.settings`, `cv.controls` | mọi cài đặt về mặc định, bấm 2 lần; không đụng bản lưu, nhật ký chơi thử | Ngay | Chưa (chỉ Đặt lại phím, bố cục) |

## 4. Chi tiết và công thức

### 4.1 Mù màu

Renderer đọc 8 màu ngữ nghĩa từ `ui.json → palette` (thay mã hex viết cứng). Chế độ mù màu thay tới 6 màu bằng bảng `ui.json → colorblind.<chế độ>`. Màu môi trường (nền, dây leo, kẻ địch khi đứng yên) không đổi.

| Màu ngữ nghĩa | Dùng cho | Gốc | Protan | Deutan | Tritan |
| --- | --- | --- | --- | --- | --- |
| `hpOk` | thanh máu lúc thường, viên máu, viền kẻ địch vô hại, checkpoint đã chạm, Golem pha 1 | `#7bd389` lục | `#3a8dff` lam | `#3a8dff` lam | `#e8f1ff` trắng lam |
| `danger` | máu thấp, Kai bị đánh, Drone báo trước, boss đang ra đòn, cột Mưa đạn và Hoa Nở, Golem pha 2 | `#ff6b6b` đỏ | `#ff3b3b` đỏ đậm | `#d55e00` cam son | giữ |
| `dangerSoft` | máu boss, vệt đạn, Gai Quạt, Dây Quất, Lính Kén lao | `#ff8787` | `danger` pha 25% trắng | như Protan | giữ |
| `warn` | boss và Golem đang báo trước, cú giậm | `#ffa94d` cam | `#ffe066` vàng | `#fff3b0` vàng nhạt | `#ffe066` vàng |
| `caution` | vết nứt Rễ Trồi, Tháp Gai báo trước, chấm nhịp, lõi hở, choáng, Core Bit | `#ffd166` vàng | giữ | giữ | giữ |
| `stalk` | Rễ Đuổi (vệt, cột mờ, tư thế) | `#c084fc` tím | `#ff4fa3` hồng | giữ | `#785ef0` tím lam |
| `player` | đạn Kai, thanh năng lượng, quầng nạp vừa | `#4fd1ff` lam nhạt | `#e8f1ff` trắng lam | `#e8f1ff` trắng lam | giữ |
| `shield` | khiên Core | `#a5b4fc` | giữ | giữ | giữ |

**Kiểm chứng (đã chạy khi viết tài liệu):** mô phỏng Machado, Oliveira, Fernandes (2009) mức nặng 1,0 trên RGB tuyến tính; khoảng cách CIEDE2000 (ΔE00). Ngưỡng cho cặp phải phân biệt: ΔE00 ≥ 20 `[PLACEHOLDER]` (vật nhỏ trên nền tối, nhìn lướt).

| Cặp phải phân biệt | Gốc: P / D / T | Bảng mới: P / D / T |
| --- | --- | --- |
| Máu thường / máu thấp; viên máu / đòn địch (`hpOk`/`danger`) | 20 / **7** / 64 | 51 / 61 / 37 |
| Báo trước / đang đánh (`warn`/`danger`) | 20 / **11** / **13** | 35 / 29 / 28 |
| Rễ Trồi / Rễ Đuổi (`caution`/`stalk`) | 58 / 58 / 20 | 50 / 58 / 45 |
| Đạn Kai / đòn địch (`player`/`danger`) | 38 / 44 / 67 | 46 / 44 / 67 |
| Rễ Đuổi / Kai đứng trên vệt (`stalk`/`player`) | **16** / **9** / 46 | 32 / 26 / 30 |
| Rễ Đuổi / đòn địch (`stalk`/`danger`) | 41 / 48 / 24 | 37 / 57 / 49 |
| Đạn Kai / viên máu (`player`/`hpOk`) | 40 / 40 / **8** | 30 / 35 / 21 |
| Viên máu / Core Bit (`hpOk`/`caution`) | **8** / **14** / 43 | 60 / 65 / 29 |

Nhỏ nhất: gốc 8 / 7 / 8, bảng mới 30 / 26 / 21. Với mắt thường, bảng gốc nhỏ nhất 29. Khiên/đạn Kai (`shield`/`player`) còn 19 / 20 / 14: chấp nhận, vì khiên là viền quanh Kai, không lẫn với vật khác.

**Dấu hình (mọi chế độ, kể cả tắt; QB-85):**

- Máu thấp: số máu (đã có) + viền thanh máu dày 2 px; khi giảm nhấp nháy tắt thì viền nhấp nháy 2 Hz.
- Rễ Trồi: vết nứt ngang 12 × 2 px. Rễ Đuổi: vệt 18 × 3 px + cột mờ 14 × 28 px + tư thế giơ hai tay (đã có), thêm dấu ▼ trên vệt.
- Báo trước và đang đánh: báo trước nhấp nháy hoặc có thanh tiến độ (mục 4.3); đang đánh là màu đặc.
- Yêu cầu cho sprite (asset P1–P2): viên máu hình chữ thập, Core Bit hình thoi; đạn Kai hình chữ nhật ngang, đạn địch hình tròn.

### 4.2 Rung màn hình

`biên độ thật = biên độ gốc × a11y.screenShake`; thời gian giữ nguyên; hệ số 0 thì không gọi `camera.shake`. Bảng gốc chuyển vào `ui.json → shake` (hiện 7 dòng viết cứng trong `stage-scene.ts`, 3 dòng đọc `ui.json → feedback`):

| Sự kiện | ms | Biên độ 100% | 50% |
| --- | --- | --- | --- |
| Boss tiếp đất (`bossLanded`) | 160 | 0,006 | 0,003 |
| Đòn Trừng Phạt (`feedback.large`) | 150 | 0,006 | 0,003 |
| Vật chắn vỡ | 100 | 0,004 | 0,002 |
| Trúng điểm yếu, chạm gai | 90 | 0,004 | 0,002 |
| Nổ lan, khiên vỡ (`feedback.medium`) | 90 | 0,003 | 0,0015 |
| Kai bị đánh, rơi hố | 80 | 0,003 | 0,0015 |
| Hạ kẻ địch | 60 | 0,002 | 0,001 |

### 4.3 Giảm nhấp nháy

| Hiệu ứng | Hiện nay | Khi bật |
| --- | --- | --- |
| Boss đổi pha | `camera.flash` 120 ms phủ cả màn hình (cam) | viền khung 2 px logic màu `warn`, alpha 0,35, mờ dần trong 0,3 s |
| Boss, Golem báo trước | bật/tắt, nửa chu kỳ 140 → 50 ms (3,6 → 10 lần/s) | không tắt hẳn: alpha 0,6 → 1 theo tiến độ, dao động ≤ 3 Hz; thanh tiến độ 16 × 2 px trên đầu đầy dần |
| Drone, Tháp báo trước; nạp đầy | 70 ms (7 lần/s) | màu cố định + thanh tiến độ (nạp: vòng sáng cố định) |
| Vệt Rễ Đuổi | 150 → 40 ms (tới 12,5 lần/s) | đậm dần 0,45 → 0,95, không chớp |
| Kai bất tử sau bị đánh | 60 ms (8,3 lần/s) | alpha cố định 0,5 |
| Kẻ địch, boss trúng đòn | chớp trắng 100% | pha 50% trắng |
| Lõi hở (V3), choáng, vật phẩm sắp mất | 90–120 ms | đổi độ đậm ≤ 3 Hz |

- Công thức chung: `blinkOn(t, nửaChuKỳ, giảm) = floor(t / max(nửaChuKỳ, giảm ? 167 : 0)) mod 2`; khi giảm thì vẽ alpha `0,6 + 0,4 × blinkOn` thay vì bật/tắt.
- Luật báo trước (≥ 0,4 s kẻ địch, ≥ 0,5 s boss) và chấm nhịp (`11` mục 2.6) giữ nguyên; chỉ đổi cách vẽ.
- Viền đổi pha vẫn là "hình thay âm" cho boss đổi pha (`12` mục 6.3).

### 4.4 Cỡ chữ hội thoại

Chữ trong canvas đo bằng px logic; mỗi px logic dài `k / dpr` dp (k: hệ số phóng nguyên ở `logic/scale.ts`).

```text
px = min(16, max(minPx[mức], ceil(sp[mức] × dpr / k)))
mức thường: sp = 16, minPx = 9      mức lớn: sp = 20, minPx = 12
```

| Thiết bị (trong trình duyệt) | k | dpr | dp mỗi px | Thường: px (dp) | Lớn: px (dp) |
| --- | --- | --- | --- | --- | --- |
| Pixel 7 | 4 | 2,625 | 1,52 | 11 (16,8) | 14 (21,3) |
| Android 720p | 3 | 2 | 1,5 | 11 (16,5) | 14 (21) |
| iPhone 12–14 (ước tính) | 5 | 3 | 1,67 | 10 (16,7) | 12 (20) |
| Laptop 1366 × 768 | 3 | 1 | 3 | 9 (27) | 12 (36) |
| PC 1080p | 4 | 1 | 4 | 9 (36) | 12 (48) |

- Khớp QB-74 (`17-Quy-tac-bien.md`): Pixel 7 cần ≥ 11 px logic. Nếu chữ canvas ở cỡ này mờ hoặc vỡ dấu, chuyển hộp chữ sang lớp HTML (ADR-001), cỡ đặt thẳng bằng sp.
- Áp cho: hộp hội thoại, hộp hướng dẫn, gợi ý NOVA. Mức Thường cũng phải đạt 16 sp, nên hộp hội thoại hiện tại (9 px cố định) phải đổi dù không bật tùy chọn.
- Hộp hội thoại tự cao theo chữ, tối đa 40% chiều cao logic (77 px). Không vừa thì chia trang theo ranh giới từ; Tiếp sang trang sau; tự tiến tính riêng từng trang.
- Hộp hướng dẫn (không có nút Tiếp): tối đa 2 dòng ở cỡ đang chọn (QB-73, đo theo phông thật). Câu vượt 2 dòng ở cỡ Lớn thì dùng cỡ Thường cho câu đó; vượt cả ở Thường là lỗi dữ liệu.
- Không áp cho chữ HUD và thông báo nhanh ("HẠ BOSS!"): việc của M10 (mục 11).
- Đổi `k` (xoay máy, đổi cỡ cửa sổ, toàn màn hình) thì tính lại.

### 4.5 Tự tiến thoại

```text
chờ (s) = m × min(10; max(3; n / r))   n: số ký tự câu (hoặc trang); r = 15 ký tự/s (tốc độ đọc chung, QB-72); m = 1 (vừa), 1,5 (chậm)
```

Đồng hồ chờ bắt đầu khi câu đã hiện hết (chữ hiện 40 ký tự/s, `ui.json → dialogue.charsPerSec`).

| Câu | Hiện chữ | Chờ (vừa) | Chờ (chậm) |
| --- | --- | --- | --- |
| 20 ký tự | 0,5 s | 3 s | 4,5 s |
| 70 ký tự | 1,75 s | 4,7 s | 7 s |
| 140 ký tự (dài nhất, vi) | 3,5 s | 9,3 s | 14 s |

- Vừa: 15 ký tự/s, khoảng 200 tiếng/phút; Chậm: 10 ký tự/s. Cùng tốc độ đọc với hộp tự tắt (QB-72), nên chỉ có một số để chỉnh.
- Bấm vẫn như cũ (QB-80: một lần bấm hiện hết câu; Bỏ qua hoặc giữ Lướt 0,6 s đóng cả đoạn); sang câu mới thì đồng hồ đặt lại.
- Đồng hồ dừng khi tạm dừng hoặc tab ẩn (tab ẩn thì mở menu tạm dừng, QB-90).
- Câu cuối của đoạn trước trận boss tự đóng xong thì trận đứng yên thêm 1,0 s, hiện "Sẵn sàng", để người chơi không bị đánh khi chưa nhìn lại màn.
- Bật tùy chọn này là chủ động, nên không trái quyết định "hội thoại không tự đóng theo giờ" (GDD 3.6): mặc định vẫn tắt.

### 4.6 Tốc độ game

- **Cơ chế:** `FixedStep.advance(delta × s)` ở StageScene, s ∈ {1; 0,9; 0,8; 0,7}. Mọi thứ trong StageWorld chậm đều: Kai, kẻ địch, đạn, đồng hồ báo trước, coyote, buffer, hồi sinh. Một bước logic vẫn là 1/60 s thời gian game, nên mô phỏng và test không đổi.
- **Thời gian thật** ở 90 / 80 / 70%:
  - báo trước boss 0,5 s → 0,56 / 0,63 / 0,71 s; báo trước kẻ địch 0,4 s → 0,44 / 0,5 / 0,57 s;
  - coyote 0,1 s → 0,11 / 0,13 / 0,14 s; jump buffer 0,12 s → 0,13 / 0,15 / 0,17 s;
  - Stage 1 (10 phút) → 11,1 / 12,5 / 14,3 phút;
  - 54 / 48 / 42 bước logic mỗi giây; độ trễ nhập tối đa một bước 18,5 / 20,8 / 23,8 ms (100%: 16,7 ms).
- **Không đổi:** hộp thoại (chữ hiện dần, tự tiến), HUD, tween, menu, rung camera (theo thời gian thật), nhạc và tempo (`12-Am-thanh.md`).
- **Hiển thị:** màn Kết quả ghi "Tốc độ 70%" cạnh thời gian lượt (thời gian game). Menu tạm dừng ghi "<màn> · <độ khó> · 70%".
- **Bảng xếp hạng (Beta):** lượt có lúc nào s < 1 gắn `assisted` và **không nộp** bảng Tiêu chuẩn hay Mở; kỷ lục cá nhân lưu riêng, có nhãn "Hỗ trợ tốc độ". Thưởng, mở Thử thách, tiến trình: nhận đủ.
- **Đo lường:** `stage_start.gameSpeed`, `stage_end.gameSpeedMin`; lượt có giảm tốc bị loại khỏi MV7, H3, H4 (`13` mục 6.1).
- **Vẽ:** StageScene đã nội suy Kai theo `stepper.alpha`. Ở 70% chỉ có 42 bước/giây nên kẻ địch, đạn, boss cũng phải nội suy, không thì giật (kiểm ở ST-14-06).

## 5. Điều hướng và kích thước

| Thao tác | Bàn phím | Tay cầm | Chạm, chuột |
| --- | --- | --- | --- |
| Chọn dòng | ↑/↓ (W/S); giữ thì lặp sau 0,4 s, mỗi 0,12 s | D-pad, cần trái | chạm dòng |
| Đổi giá trị | ←/→ (A/D) | ←/→ | nút −/+ hoặc ô chọn |
| Chọn, bật/tắt | Enter, Space, K (Nhảy), J (Bắn) | A, X | chạm |
| Đổi tab | Q/E | LB/RB | chạm tab |
| Quay lại, đóng | Esc | B (Lướt), Start | nút "Quay lại" góc trên trái |

- **Focus:** mở Cài đặt thì về tab dùng gần nhất trong phiên, dòng đầu. Viền focus 2 px `#4fd1ff`, tương phản 9,7:1 trên nền `#121c2b`. Chạm hay di chuột vào dòng nào thì focus dòng đó; đổi thiết bị không làm mất focus.
- **Bắt phím:** chọn dòng → bấm phím hoặc nút mới; Esc hủy (trừ khi đang đổi Tạm dừng); không bấm gì sau 5 s thì hủy.
- **Kích thước ở cỡ thật:**
  - mỗi dòng cao ≥ 48 dp; nút, ô bật/tắt, −/+ ≥ 48 × 48 dp, cách nhau ≥ 8 dp;
  - thanh trượt có nút −/+ (không bắt buộc kéo), núm ≥ 28 dp;
  - mọi chữ ≥ 16 sp (`1rem`, theo cỡ chữ của trình duyệt);
  - tương phản chữ ≥ 4,5:1 (hiện `#e8f1ff` 15:1, `#9fb0c5` 7,7:1 trên `#121c2b`).
- **Bố cục:** ngang (≥ 640 px CSS): cột tab bên trái rộng 180 dp, nội dung cuộn bên phải. Hẹp hoặc cầm dọc: tab thành hàng chip cuộn ngang (PSettings). Có lề `env(safe-area-inset-*)` (QB-92).
- **Cầm dọc:** chỉ hỗ trợ màn ngang (rà soát C11): lớp phủ "xoay ngang" che mọi scene kể cả Cài đặt; trong trận thì trận tự tạm dừng (QB-93). Bảng PRotate ở wireframe là lưu trữ (`02-Wireframes/LOI-THOI.md`).
- **Kiểm ở cỡ thật:** Playwright giả lập Pixel 7 (412 × 915 px CSS, dpr 2,625): mọi phần tử bấm có `getBoundingClientRect` ≥ 48 × 48, mọi chữ có `font-size` tính ra ≥ 16 px.

## 6. Lưu và áp dụng

`cv.settings` (mới, localStorage):

```json
{ "version": 1,
  "display": { "showFps": false },
  "a11y": { "colorblind": "off", "screenShake": 1, "reduceFlash": false, "textSize": "normal",
            "autoAdvance": "off", "gameSpeed": 1 },
  "lang": "vi" }
```

- Đọc đồng bộ ở Boot, trước khi dựng scene, để giảm nhấp nháy và mù màu có hiệu lực từ khung hình đầu.
- Hỏng từng phần thì phần đó về mặc định. Bản mới hơn game thì dùng mặc định và không ghi đè (như bản lưu `readOnly`, QB-101). Không có localStorage thì giữ trong bộ nhớ, đầu bảng ghi "Trình duyệt này không lưu được cài đặt" (cùng cách báo với bản lưu, QB-100).
- Ghi ngay sau mỗi thay đổi, rồi phát `settings:changed`.
- Âm thanh lưu riêng ở `cv.audio` (`12` mục 6.5).
- `cv.controls` lên bản 2: thêm `touch.sensitivity`, `gamepad.sensitivity`, `gamepad.vibration`. **Bắt buộc có bước chuyển 1 → 2** giữ phím, nút, bố cục đã đổi.

**Vì sao không vào bản lưu:**

1. Bản lưu IndexedDB mở bất đồng bộ; cài đặt cần trước khung hình đầu.
2. Cỡ nút, độ nhạy, toàn màn hình theo từng thiết bị.
3. "Xóa bản lưu" không được tắt tùy chọn tiếp cận của người đang cần nó.
4. Cùng quyết định với `cv.controls`.

Ngoại lệ: `tutorial.off` vẫn ở bản lưu (gắn tiến trình, đã có). Khi có cloud (Beta): nhóm Tiếp cận và Ngôn ngữ đi theo tài khoản; Điều khiển, Hiển thị theo thiết bị.

## 7. Giao tiếp hệ thống

- `core/game-events.ts`: thêm `settings:changed: { settings: GameSettings }` (điều khiển đã có `input:settings-changed`).
- `logic/settings/` (thuần, có test): `GameSettings`, `parseSettings`, `defaultSettings(ui)`, `paletteFor(mode, ui)`, `shakeAmp(base, settings)`, `blinkOn(t, halfMs, reduce)`, `textPx(level, k, dpr, ui)`, `autoAdvanceSec(chars, mode, ui)`.
- `settings/settings-panel.ts` (HTML, ADR-001) vẽ mô hình thuần; `scenes/settings-scene.ts` mở từ Menu chính; PauseMenu mục Tùy chọn mở cùng bảng trên trận đang dừng (tắt `scene.input`, ẩn lớp cảm ứng, đóng thì bỏ phím dồn bằng `input.step()`). `ControlsScene` gộp vào tab Điều khiển.
- Bên đọc: StageScene (bảng màu, rung, nhấp nháy, tốc độ, FPS), renderer (bảng màu), DialogueBox, TutorialBox (cỡ chữ; tự tiến qua `DialogueRunner`), InputService (độ nhạy, rung), Telemetry (`settings_change`, `13` mục 3).

## 8. Trường hợp biên

| Trường hợp | Xử lý |
| --- | --- |
| `cv.settings` hỏng một phần | Phần đó về mặc định, phần khác giữ |
| `cv.settings` của bản game mới hơn | Dùng mặc định trong phiên, không ghi đè |
| `cv.controls` bản 1 | Chuyển lên bản 2, giữ phím và bố cục (test) |
| Không có API rung (iOS) hoặc tay cầm không có `vibrationActuator` | Dòng mờ "Máy này không hỗ trợ"; giữ giá trị đã lưu |
| Tab Tay cầm khi chưa cắm tay cầm | Ghi "Cắm tay cầm rồi bấm một nút" (đã có); vẫn chỉnh được độ nhạy, rung |
| Đổi phím Tạm dừng sang phím khác | Esc vẫn là Quay lại trong Cài đặt; trong trận chỉ phím đã gán mới tạm dừng |
| Đổi tốc độ giữa màn | Áp khi bấm Tiếp tục; lượt giữ `gameSpeedMin` nhỏ nhất (về 100% vẫn là lượt có hỗ trợ) |
| Tự tiến khi tạm dừng, tab ẩn, hộp hội thoại boss | Đồng hồ dừng; trận vẫn đứng yên khi hộp mở như hiện nay |
| Chữ lớn với tiếng Anh (dài hơn tới 30%, 182 ký tự) | Chia trang; test với câu dài nhất của mỗi ngôn ngữ |
| Mù màu cùng giảm nhấp nháy | Độc lập; thanh tiến độ báo trước dùng `warn` của bảng đang chọn |
| Thuận tay trái khi đã kéo nút | Xóa vị trí riêng (đã có) |
| Toàn màn hình rồi bấm Esc (PC) | Trình duyệt thoát toàn màn hình; đang chơi thì tự tạm dừng (`fullscreenchange`) |
| Trang ẩn, mất tay cầm khi đang chơi | Mở menu tạm dừng, không tự chơi tiếp (QB-90); Cài đặt đang mở thì giữ nguyên |
| Xoay máy, đổi cỡ cửa sổ | Tính lại `k`, cỡ chữ, bố cục bảng; giữ dòng đang focus |
| Đổi ngôn ngữ giữa hội thoại | Câu đang hiện giữ nguyên; câu sau theo ngôn ngữ mới |
| Xóa bản lưu | Không đụng `cv.settings`, `cv.controls` |
| Đặt lại mọi cài đặt | Bấm 2 lần; không đụng bản lưu, nhật ký chơi thử |
| Bản `?gate=1` | Không có Cài đặt đầy đủ, chỉ Điều khiển (giữ điều kiện cổng Prototype) |
| `?debug=1` và tắt Hiện FPS | Dòng gỡ lỗi vẫn hiện |
| Giá trị trong `ui.json` sai (tốc độ ngoài (0; 1], hệ số rung âm, sp < 16) | Lỗi khi nạp dữ liệu (`core/ui-config.ts`) |

## 9. Tiêu chí nghiệm thu

- [ ] Mở Cài đặt từ Menu chính và Menu tạm dừng; đúng cây mục 2; đi hết mọi mục chỉ bằng bàn phím, chỉ bằng tay cầm, chỉ bằng chạm.
- [ ] Pixel 7 ngang và dọc: mọi phần tử bấm ≥ 48 × 48 dp, mọi chữ ≥ 16 px CSS, không cuộn ngang (Playwright đo).
- [ ] Mỗi tùy chọn ghi đúng chỗ ở mục 3; tải lại trang giữ giá trị; hỏng từng phần về mặc định (test).
- [ ] `cv.controls` bản 1 lên bản 2 giữ phím và bố cục đã đổi (test).
- [ ] Mù màu: test thuần cho mỗi chế độ, 8 cặp ở mục 4.1 có ΔE00 ≥ 20 (cùng phương pháp mô phỏng); renderer không còn mã màu ngữ nghĩa viết cứng.
- [ ] Rung 50%: `camera.shake` nhận đúng biên độ × 0,5; Tắt: không gọi; dừng hình không đổi (test bước logic giống hệt).
- [ ] Giảm nhấp nháy: `blinkOn` không đổi trạng thái quá 3 lần mỗi giây; không còn `camera.flash`; thời gian báo trước giữ nguyên (test).
- [ ] Cỡ chữ: Pixel 7 mức Thường 11 px logic (≥ 16 dp), Lớn 14 px (≥ 20 dp); câu dài nhất vi và en không tràn hộp (Playwright).
- [ ] Tự tiến: câu 70 ký tự sang câu sau sau 1,75 + 4,67 s ± 0,1 s (Vừa); đồng hồ dừng khi tạm dừng (test thuần).
- [ ] Tốc độ 70%: cùng chuỗi đầu vào theo bước thì trạng thái sau 600 bước giống hệt 100%; thời gian thật gấp 1/0,7; Kết quả ghi "Tốc độ 70%"; `stage_end.gameSpeedMin = 0,7`.
- [ ] Độ nhạy cần ảo Thấp / Vừa / Cao: Kai bắt đầu chạy khi kéo 18 / 12 / 6 dp (test `stickVector`).
- [ ] Hằng số hỗ trợ ngắm, ngưỡng Xuống, thời gian rung chạm, bảng rung camera đọc từ `03-Data` (không còn hằng số trong mã).
- [ ] Ảnh PC và Pixel 7 (ngang, dọc) cho mỗi tab và cả 3 chế độ mù màu ở `04-Dev-Plan/qa/<mã Story>/`; không lỗi console; `gate-flow` vẫn đạt.

## 10. Giả thuyết đo ở đợt thử MVP

Đo bằng `settings_change` và `stage_start` (`13`, chỉ số S1):

- Tự bắn được bật bởi 20–50% người chơi cảm ứng. Người bật không có chết/phút cao hơn người không bật quá 20%; cao hơn thì xem lại tự bắn.
- Giảm tốc < 100% được ≤ 10% người dùng. Hơn 25% người vào một màn dùng giảm tốc ở màn đó thì màn đó quá khó: báo cho đặc tả màn.
- Hơn 30% người cảm ứng đổi cỡ nút hoặc tay thuận sau Prologue thì xem lại bố cục mặc định (`controls.json`).

## 11. Thay đổi cần lan sang tài liệu khác

| Tài liệu | Thay đổi |
| --- | --- |
| GDD chính mục 11 | "Giảm tốc độ game 10–30%" ghi thành "tốc độ 70–100%, bước 10%; lượt có giảm tốc không vào bảng xếp hạng, vẫn nhận đủ thưởng"; trỏ tới tài liệu này |
| GDD chính mục 5.2 | Tự bắn và hỗ trợ ngắm chỉ cho cảm ứng ở MVP (mặc định tắt); thêm độ nhạy cần |
| GDD chính mục 13 | Menu tạm dừng: Tùy chọn mở Cài đặt (mục 2) |
| GDD chính mục 15 | "Lưu game": cài đặt ở localStorage (đọc đồng bộ), không ở IndexedDB |
| GDD chính mục 3.6 | Ngoại lệ "không tự đóng theo giờ": tự tiến thoại khi người chơi bật |
| Wireframe `Access`, `Graphics`, `SettingsControls`, `Touch`, `Gamepad`, `PSettings`, `Account` | Tab: Tiếp cận, Hiển thị, Dữ liệu, thêm Ngôn ngữ; rung màn hình 3 mức chỉ ở Tiếp cận (bỏ khỏi Graphics); Tương tác = W/↑ (không phải E); thêm Độ nhạy cần ở Touch, Gamepad; Phụ đề cỡ lớn đổi thành Cỡ chữ hội thoại |
| `03-Data/ui.json` | Khối mới `settings` (lựa chọn, mặc định, `textSp`, `textMinPx`, `dialogueMaxHeightFrac`, `autoAdvance { minSec, maxSec, slowMul, fightReadySec }`, `reducedFlash`), `palette`, `colorblind` (kèm `minDeltaE`), `shake`; chuyển `difficultyHint.charsPerSecRead` thành tốc độ đọc chung (`reading.charsPerSec`, QB-72); `feedback` thêm rung chạm nút 8 ms và mẫu rung tay cầm; kiểm tra ở `core/ui-config.ts` |
| `03-Data/controls.json` | `touch.stick.deadzoneBySensitivity` (thay `deadzone`), `gamepad.deadzoneBySensitivity` (thay `stickDeadzone`), `downAxisThreshold`; kiểm tra ở `core/controls-config.ts` |
| `03-Data/weapons.json` | `arcCannon.aimAssist { bandPx: 12, maxSlope: 0.25 }`; kiểm tra ở config vũ khí |
| `game/src/style.css` | `.cv-panel` chữ 16 px; nút `.cv-panel button`, `.touch-editor button` 40 → 48 px; `.touch-editor-row` 36 → 48 px |
| M10 (HUD, hộp thoại) | Hộp hội thoại và hộp hướng dẫn tính cỡ chữ theo mục 4.4, hộp tự cao, chia trang. Rà chữ HUD 8–9 px (12–14 dp trên Pixel 7) ở một Story M10 riêng |
| `12-Am-thanh.md` | Đã khớp: khóa `cv.audio`, rung điện thoại ở `ui.json → feedback`, tốc độ game không đổi tempo. Cần thêm: tab Âm thanh nằm trong bảng Cài đặt chung (mục 2), điều hướng và cỡ theo mục 5; mẫu rung tay cầm đặt cạnh mẫu rung điện thoại |
| `13-Do-luong-MVP.md` | Đã dùng: `settings_change`, `gameSpeedMin`, mục Dữ liệu |
| `07-Kich-ban-huong-dan.md` | F03 "chỉnh lại ở Cài đặt" trỏ tới Điều khiển › Cảm ứng; mục Trợ giúp (xem lại hướng dẫn) để sau MVP |
| `04-Dev-Plan/04-Test-va-Launch.md` mục 1.1 | Thêm hàng M10 Cài đặt (lưu, chuyển bản, bảng màu ΔE, nhấp nháy, tốc độ, 48 dp, 16 sp) |
| `04-Dev-Plan/07-Ban-do-he-thong.md` | Dòng "Cài đặt, tiếp cận": Tài liệu "Đủ (`14-Cai-dat-Tiep-can.md`)"; thêm id tùy chọn vào danh mục tên chuẩn |
| `04-Dev-Plan/01-Ke-hoach-lam-viec.md`, `02-Module.md` | EP-14 vào mốc MVP (trước đợt thử 50 người) |
| `game/CONTEXT.md`, `game/docs/quyet-dinh/` | Trạng thái M10 (Cài đặt), M2 (`cv.controls` bản 2); file quyết định mới `cai-dat.md` (`cv.settings`, bảng màu, tốc độ game, `assisted`) |
| `17-Quy-tac-bien.md`, `ST-08-05` | Đã chốt 14/11: EP-14 là Epic "Giao diện MVP" gồm Cài đặt (ST-14-01…07 ở đây) và Hub, hộp chữ (ST-14-08 trở đi). Thêm luật biên mới: lượt có giảm tốc không vào bảng xếp hạng (mục 4.6); Esc luôn là Quay lại trong Cài đặt |

## 12. Story đề xuất (EP-14)

| Mã | Tên | Phụ thuộc | Cỡ | Tiêu chí chính |
| --- | --- | --- | --- | --- |
| ST-14-01 | Lõi `logic/settings/`: `cv.settings` bản 1, parse từng phần, mặc định từ `ui.json → settings`; `cv.controls` bản 2 và bước chuyển; đưa hằng số hỗ trợ ngắm, ngưỡng Xuống, rung chạm vào dữ liệu | | 1 ngày | Mục 9 ý 3, 4, 12; QB-100, QB-101 |
| ST-14-02 | Màn Cài đặt HTML: cây mục 2, điều hướng phím/tay cầm/chạm, ≥ 48 dp, ≥ 16 sp; mở từ Menu chính và menu tạm dừng; gộp ControlsScene và TouchEditor (nâng 48 dp); tab Dữ liệu gom bảng Dữ liệu lưu; Hiện FPS, Toàn màn hình, Ngôn ngữ (khung vi) | 01 | 2,5 ngày | Mục 9 ý 1, 2, 13; QB-74, QB-90, QB-92, QB-93 |
| ST-14-03 | Bảng màu ngữ nghĩa và chế độ mù màu: `ui.json → palette`, `colorblind`; renderer đọc màu; dấu hình; test ΔE | 01 | 1,5 ngày | Mục 9 ý 5; QB-85 |
| ST-14-04 | Rung màn hình theo hệ số (`ui.json → shake`), giảm nhấp nháy (`blinkOn`, viền đổi pha, thanh tiến độ báo trước) | 01, 03 | 1 ngày | Mục 9 ý 6, 7 |
| ST-14-05 | Cỡ chữ hội thoại (công thức sp → px, hộp tự cao, chia trang), tự tiến thoại | 01 | 1,5 ngày | Mục 9 ý 8, 9; QB-72, QB-73, QB-74, QB-80 |
| ST-14-06 | Tốc độ game: hệ số ở `FixedStep`, nội suy vật thể di chuyển, nhãn Kết quả và menu tạm dừng, `gameSpeedMin` cho lượt | 01 | 1 ngày | Mục 9 ý 10 |
| ST-14-07 | Độ nhạy cần (cảm ứng, tay cầm), rung tay cầm; QA trọn bộ: ảnh mỗi tab, 3 chế độ mù màu, `gate-flow` | 02–06 | 1 ngày | Mục 9 ý 11, 13 |

Thứ tự: 01 → 02 → (03, 05, 06 song song) → 04 → 07. Tổng khoảng 9,5 ngày.

**Hoãn khỏi MVP:** tiếng Anh trong giao diện (cần tách chuỗi); tự bắn và hỗ trợ ngắm cho bàn phím, tay cầm (xem lại sau cổng); chất lượng hình, giới hạn FPS, hiệu ứng hạt, khóa ngang; tài khoản và cloud (Beta); cỡ chữ HUD (Story M10 riêng); Trợ giúp xem lại hướng dẫn.
