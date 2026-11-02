# Bộ prompt tạo hình cho ChatGPT

Prompt hình viết bằng **tiếng Anh** (ổn định hơn); chú thích bằng tiếng Việt. Thay phần trong `[ngoặc vuông]`.

## 0. Quy tắc dùng

1. **Một cuộc trò chuyện cho mỗi nhóm asset** (Kai, kẻ địch Stage 1, nền Stage 1...). Trong cuộc đó luôn đính kèm ảnh tham chiếu đã duyệt (tờ thiết kế, bảng màu).
2. Đầu mỗi cuộc: dán **STYLE BLOCK** (mục 1) và đính kèm **ảnh tờ thiết kế** của nhân vật hoặc ảnh phong cách.
3. Luôn yêu cầu **nền phẳng #FF00FF**, **không chữ, không khung, không bóng đổ trên nền**.
4. Yêu cầu hình **"chunky pixel art"** (điểm ảnh to, dễ nhìn), tạo ở kích thước lớn rồi thu nhỏ bằng script.
5. Sai một chi tiết thì dùng **prompt sửa** (mục 14), đừng tạo lại từ đầu.
6. Lưu mọi prompt thành công vào nhật ký để tái tạo.
7. Không dùng tên thương hiệu hay nhân vật có bản quyền, không "theo phong cách [họa sĩ còn sống]".

## 1. STYLE BLOCK (dán đầu mọi cuộc trò chuyện)

```
STYLE BLOCK
Art style: chunky 16-bit-era pixel art, clean 1-pixel dark outlines, flat shading with at most
3 tones per material, NO anti-aliasing, NO gradients, NO blur, NO dithering noise.
Light comes from the top-left. Side-view (profile) for gameplay sprites, facing right.
Palette (use only these colors): #000000 #0B0F1A #141B2D #1F2A44 #2E3B5E #46567F #6B7A99
#9AA8C2 #CBD5E6 #F2F5FA #FFFFFF #0A5C7A #118AB2 #2EC4E6 #8FE9FF #3A0F4E #6A1B9A #B5179E
#F72585 #5C1A1A #A4262C #E63946 #FF8C42 #FFC857 #FFF1A8 #14472B #2E7D32 #57CC63 #B7F171
#5A4636 #8C6B4F #D9A57A.
Mood: neon cyber-organic sci-fi, a city of Nova Prime overrun by a corrupting virus called Eclipse.
Background: solid flat magenta #FF00FF everywhere (for chroma key), no ground, no shadow, no text.
```

## 2. Tờ thiết kế Kai (nhân vật chính)

```
[STYLE BLOCK]
Create a character design sheet for "Kai", a lean combat android, young and determined.
Design: dark navy armor (#1F2A44, #2E3B5E) with cyan accents (#118AB2, #2EC4E6, #8FE9FF);
a smooth hooded helmet with two small swept-back fins and a single glowing cyan visor slit;
a glowing cyan core on the chest; asymmetrical shoulder plate on the left; the RIGHT arm is a
compact arm cannon; short white-grey scarf-like cloth tail that trails behind; slim legs with
armored boots. Height about 2.5 heads tall, readable at 24x40 pixels.
Show: side view facing right (large, center), front view, back view, and 3 head close-ups
(neutral, determined, worried). All on flat #FF00FF background, labelled shapes only, no text.
Original design, not resembling any existing franchise character.
```
Duyệt xong thì **khóa**: lưu ảnh này, đính kèm cho mọi prompt sau.

## 3. Hoạt ảnh Kai

### 3A. Từng tư thế một (khuyến nghị)

```
Using the attached approved side-view Kai sprite as the exact reference, draw the SAME character
in this pose: [POSE]. Keep identical proportions, colors, outline weight, and facing right.
Canvas: 512x512, flat #FF00FF background, character centered, feet touching the same baseline
at 85% of canvas height as in the reference. No motion blur, no extra effects, no text.
```

Mô tả [POSE] cho từng hoạt ảnh (khung theo manifest):

| Hoạt ảnh | Số khung | Mô tả từng khung |
|---|---|---|
| idle | 4 | Thở nhẹ: đứng, ngực nhô lên, đứng, hạ xuống; vải đuôi đung đưa |
| run | 8 | Chạm đất chân trước; hạ thấp người; chân sau vượt qua; điểm cao; lặp lại bên chân kia |
| jump_up | 2 | Bắt đầu bật, người kéo dài; đang lên, chân co |
| jump_fall | 2 | Bắt đầu rơi, chân duỗi; rơi nhanh, người hơi nghiêng |
| land | 2 | Chạm đất, gối chùng; đứng thẳng lại |
| dash | 3 | Cúi thấp người nghiêng về trước; lướt xa nhất; thu về |
| wall_slide | 2 | Một tay/chân bám tường, người sát tường (tường bên phải), hai tư thế nhẹ |
| wall_jump | 2 | Đẩy khỏi tường; bay chéo lên |
| hurt | 2 | Bị đẩy ngửa ra sau, mắt nhắm; giữ nguyên rồi nhấc người |
| death | 6 | Giật mình, nứt, phát sáng, vỡ thành mảnh, mảnh bay, tan |
| respawn | 6 | Mảnh sáng tụ lại, thành bóng, thành hình, đứng dậy |
| victory | 4 | Giơ pháo lên trời, ngực sáng, giữ, hạ xuống |

### 3B. Cả dải một lần (cho hiệu ứng và chu kỳ đơn giản)

```
[STYLE BLOCK] + attached Kai reference.
Make a sprite sheet of Kai [ANIMATION NAME] with exactly [N] frames arranged in a grid of
[COLS] columns x [ROWS] rows on a single 1536x1024 canvas. Every frame is the same size, evenly
spaced, same baseline, same character scale, facing right, flat #FF00FF background. Frame
sequence: [LIST OF FRAME DESCRIPTIONS]. No frame numbers, no grid lines, no text.
```

## 4. Kẻ địch (mẫu)

```
[STYLE BLOCK]
Enemy sprite: "[NAME]", [ROLE: patrol / flying / turret / shielded], themed [THEME]. Size on
screen 32x32 pixels, readable silhouette, menacing but cartoonish, at most 12 colors, a clear
glowing "eye" or core so the player reads it as an enemy. Side view facing left. Show [N] animation
frames in a row: [FRAMES]. Flat #FF00FF background, no text.
```

**Kẻ địch Stage 1:**

| Tên | [ROLE] / [THEME] | Khung |
|---|---|---|
| Drone Lính | patrol / hovering sentry drone with a small red eye and a stubby gun, rusty green plating | idle 4, attack 4, hit 2 |
| Bướm Sắt | flying / metal butterfly with segmented wings, drops glowing seed bombs | idle 4 (cánh vỗ), attack 4 (phình ra rồi thả), hit 2 |
| Tháp Gai | turret / plant-machine turret that fires three thorns in a fan, closes up before firing | idle 4, attack 4 (co lại rồi bắn), hit 2 |
| Lính Kén | shielded / armored cocoon soldier with a glowing front shield that flashes before charging | idle 4, attack 4 (khiên sáng, lao), hit 2 |
| Tháp Pháo Tập Sự (Prologue) | turret / training turret, grey with a simple barrel, glows before shooting | idle 4, attack 4, hit 2 |

Đối với Stage 2–8, lấy tên và chủ đề từ GDD mục 9.1; giữ cùng khuôn mô tả.

## 5. Mini-boss và Boss

```
[STYLE BLOCK]
Boss sprite: "[NAME]", [DESCRIPTION]. Fits inside a 96x96 pixel cell (mini-boss 64x64), a
distinct silhouette with a glowing weak-point core that changes color by phase (phase 1 [COLOR 1],
phase 2 [COLOR 2], phase 3 [COLOR 3]). Side view facing left, strong heavy design, readable
telegraph pose. Draw the [ANIMATION] in [N] frames: [FRAME DESCRIPTIONS].
Flat #FF00FF background, no text.
```

| Tên | [DESCRIPTION] | Màu lõi (pha 1 / 2 / 3) |
|---|---|---|
| Thorna (boss 1) | A giant mechanical tree-warden, bark-and-metal torso, thorn-covered vine arms, a glowing seed-core in the chest | #57CC63 / #FFC857 / #E63946 |
| Bramble Golem (mini-boss 1) | A hulking golem of tangled thorny roots and iron plates, glowing yellow eyes | #B7F171 / #FF8C42 |

Hoạt ảnh Thorna: idle, move, attack_a (Gai Quạt), attack_b (Dây Quất), attack_c (Rễ Trồi), ultimate (Hoa Nở), hurt, stun, die.

## 6. Hiệu ứng (FX)

```
[STYLE BLOCK]
Effect sprite sheet: [EFFECT], [N] frames in a row, 16-bit style, bright palette colors only
([COLORS]), additive-glow look done with solid pixel shapes (no gradients), centered, same size
per frame ([SIZE]), flat #FF00FF background, no text.
```

| Hiệu ứng | [N] | [SIZE] | [COLORS] |
|---|---|---|---|
| Đạn Arc Cannon | 3 | 16x16 | #8FE9FF, #2EC4E6, #FFFFFF |
| Lóe nòng | 3 | 16x16 | #FFF1A8, #FFFFFF |
| Tia lửa trúng đòn | 4 | 16x16 | #FFFFFF, #FFC857 |
| Nạp mức 1/2/đầy | 4 mỗi mức | 32x32 | #8FE9FF → #FFC857 → #F72585 |
| Nổ nhỏ | 6 | 32x32 | #FFC857, #FF8C42, #E63946 |
| Nổ lớn | 8 | 64x64 | như trên + #FFFFFF |
| Tàn ảnh lướt | 4 | 32x32 | #2EC4E6 mờ dần bằng khối |

## 7. Tileset (ví dụ Verdant Gardens)

```
[STYLE BLOCK]
Tileset sheet for "Verdant Gardens": overgrown bio-garden with metal pipes and glowing green
spores. Layout: an 8x8 grid of 16x16 pixel tiles, total 128x128, seamless edges. Include: ground
top left/middle/right, solid fill (2 variants), inside and outside corners, left/right walls,
ceiling, thin one-way platform left/middle/right, spikes up and down, a door, a vine post, and 6
decor tiles (mushroom, bush, pipe, lamp, fern, crack). Palette: #14472B #2E7D32 #57CC63
#B7F171 #1F2A44 #2E3B5E #6B7A99. Flat #FF00FF background around the sheet, no text.
```

Ghi chú: ô sẽ không lặp liền mạch hoàn toàn; chỉnh trong Aseprite và thử ghép trong Tiled.

## 8. Nền parallax (3 lớp, ví dụ Verdant)

```
[STYLE BLOCK]
Wide parallax background layer [LAYER: far / middle / near] for a side-scrolling stage "Verdant
Gardens". [FAR: dark teal sky, distant silhouettes of giant mechanical trees, soft glowing spores]
[MIDDLE: overgrown pipes, hanging vines, mid-distance greenhouse frames] [NEAR: sparse dark
foreground ferns and posts at the bottom edge only]. Horizontal strip composition, 1536x460
crop area, left and right edges should roughly match in content, no characters, no text, low
contrast so gameplay stays readable. Palette: green and teal family plus #0B0F1A #141B2D.
```

Sau đó: cắt dải, chạy `make_seamless.py`, thu nhỏ về chiều cao 192.

## 9. Giao diện và biểu tượng

```
[STYLE BLOCK]
UI icon sheet: [THEME, e.g. 6 booster icons: shield cell, repair kit, overcharge, magnet pulse,
second chance, boss scanner]. Grid of [COLS]x[ROWS] cells, each icon centered in a square
cell, 32x32 target size, bold readable silhouette, 1px dark outline, 3-tone shading, a small
rarity-neutral glow, consistent style across the sheet. Flat #FF00FF background, no text, no
cell borders.
```

Dùng cho: booster (6), upgrade (7), module (8), vũ khí (9), kỹ năng (9), tiền tệ (3), thành tựu (6), Chip Lõi (6 ô, 8 bộ), khung độ hiếm (5), Live-ops (8).

Panel và nút 9-slice:
```
[STYLE BLOCK]
A set of UI frames for a sci-fi game: panel, button normal, button pressed, button disabled.
Each 48x48 pixel nine-slice friendly (clean corners, repeatable straight edges), dark navy
(#141B2D) body, cyan (#2EC4E6) 1px trim, subtle inner highlight. Flat #FF00FF background.
```

## 10. Chân dung hội thoại

```
[STYLE BLOCK] + attached character reference.
Dialogue portrait of [NAME], bust shot facing slightly right, 3 expressions in one row
(neutral, happy/eager, worried), 512x512 each, strong readable face, same lighting and outline
weight as the reference. Flat #FF00FF background, no text.
```

Nhân vật: Kai, NOVA (AI hologram, hình khối sáng), Mira (kỹ sư trẻ, kính bảo hộ, găng tay), Vex (android thế hệ cũ, giáp đỏ sẫm, vết nứt trên mặt nạ), Dr. Lin (nhà khoa học, hologram xanh), và 8 boss (2 biểu cảm).

## 11. Minh họa cutscene

```
[STYLE BLOCK]
Cutscene illustration, 640x384 composition (5:3), pixel-art style but richer detail and
lighting allowed. Scene: [SCENE]. Cinematic framing, strong silhouette, limited palette from
the style block. No text, no UI.
```

| Cảnh | [SCENE] |
|---|---|
| Prologue 1 | Kai awakens in a dim laboratory, cables falling off, a hologram of a scientist flickering |
| Prologue 2 | A ruined Nova Prime skyline seen from a window, green Eclipse light spreading |
| Vex | A silhouette of a rival android in a doorway, red visor glowing, firing one shot at a pillar |
| Kết thúc A | The city lights returning, Kai watching from a rooftop, a power-off device in his hand |
| Kết thúc B | Kai merged with a glowing core inside a central tower, city lit blue |
| Kết thúc C | Kai, Mira and Vex standing together on a rooftop at sunrise, a calm holographic AI above |

## 12. Logo và ảnh cửa hàng

```
[STYLE BLOCK-lite: neon sci-fi]
Game logo "CYBER VANGUARD" as stylized pixel lettering, cyan and white with a magenta (#B5179E)
edge glow, a small visor-slit emblem above the V, transparent-looking flat #FF00FF background.
Also an app icon version: Kai's helmet with glowing cyan visor, centered, bold silhouette,
rounded-square safe zone, 1024x1024.
```

Ảnh cửa hàng: chụp ảnh từ game thật; ảnh nổi bật 1024×500 dùng Kai + boss + logo, không chữ nhỏ.

## 13. Danh sách thứ tự nên làm

1. STYLE BLOCK → tờ thiết kế Kai (mục 1–2) → khóa.
2. Kai: idle, run, nhảy, đáp (P0) → xử lý bằng script → thử trong game.
3. Hiệu ứng Arc Cannon, nổ nhỏ, Drone Lính.
4. Ô gạch xám (Prototype), rồi tileset Prologue và Stage 1.
5. Các hoạt ảnh Kai còn lại, Thorna, Bramble Golem.
6. Giao diện lõi, chân dung, cutscene Prologue.
7. Stage 2–4, rồi 5–8.

## 14. Prompt sửa lỗi

| Lỗi | Prompt |
|---|---|
| Nhân vật khác bản gốc | "Redraw exactly like the attached reference: same helmet fins, visor, chest core and right-arm cannon. Change only the pose to [POSE]." |
| Khung lệch đường nền | "Keep the character the same, but move the feet to touch the baseline at 85% of the canvas height, centered horizontally." |
| Có răng cưa/độ chuyển màu | "Remove all anti-aliasing and gradients. Use flat hard-edged pixel color blocks only, from the given palette." |
| Nền không phẳng | "Replace the entire background with solid flat #FF00FF. Do not change the character." |
| Thừa chi tiết/chữ | "Remove all text, borders and decorative frames. Keep only the sprite." |
| Chi tiết sai nhỏ | "Keep everything identical except [DETAIL]: change it to [NEW DETAIL]." |
| Quá nhỏ/khó đọc | "Make the silhouette bolder and the details larger; fewer small details, so it reads at 32x32." |
| Khác màu bảng | "Recolor using only these palette colors: [list]." |
