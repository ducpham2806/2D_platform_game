# Bản đồ màn chơi (Tiled)

Bản đồ làm bằng [Tiled](https://www.mapeditor.org/) 1.8 trở lên, lưu dạng **JSON** (`.json`) ngay trong thư mục này. Game đọc bằng `src/logic/stage/tiled.ts`; bản đồ sai quy ước thì game dừng ở màn tải và test báo đỏ, kèm tên lớp/đối tượng sai.

## Quy ước

- **Bản đồ:** Orthogonal, ô **16 × 16**, bỏ chọn Infinite. Tile Layer Format: **CSV** (Map → Map Properties). Một màn hình = 20 × 12 ô.
- **Tileset:** nhúng vào bản đồ (Embed Tileset), không dùng file `.tsx` ngoài. Ô va chạm đánh dấu bằng thuộc tính bool trên ô của tileset: `solid`, `oneway` (bục một chiều) hoặc `hazard` (gai).
- **Lớp ô:**
  - `ground`: va chạm. Ô không có thuộc tính nào tính là **đặc**.
  - `hazards`: mọi ô trên lớp này là **gai** (đặt trên nền đặc).
  - Các lớp ô khác (nền, trang trí, parallax) chỉ để vẽ, không ảnh hưởng va chạm.
  - Trùng ô giữa các lớp: đặc > gai > bục một chiều.
- **Lớp đối tượng** `entities` và `triggers` (tên lớp chỉ để dễ đọc; game dựa vào **Class** của đối tượng). Đối tượng không có Class bị bỏ qua (dùng làm ghi chú).

| Class         | Dạng              | Thuộc tính                                                                                         | Ý nghĩa                                                                                                                                                                |
| ------------- | ----------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spawn`       | điểm              |                                                                                                    | Điểm xuất phát (đúng 1)                                                                                                                                                |
| `checkpoint`  | điểm              |                                                                                                    | Checkpoint, đi qua (theo cột) thì lưu; Stage 1 cần 4                                                                                                                   |
| `enemy`       | điểm              | `enemy` (id trong `enemies.json`), `harmless` (bool)                                               | Kẻ địch; cách spawn/checkpoint ≥ 6 ô                                                                                                                                   |
| `target`      | điểm              | `shield` (bool)                                                                                    | Bia tập bắn                                                                                                                                                            |
| `boss`        | điểm              |                                                                                                    | Chỗ boss đứng (đi cùng `gate`)                                                                                                                                         |
| `gate`        | chữ nhật rộng 1 ô |                                                                                                    | Cửa phòng boss, đóng khi vào đấu trường                                                                                                                                |
| `vine`        | điểm              | `length` (ô), `phase` (0–1)                                                                        | Điểm treo dây leo đu; mặc định dài 4 ô                                                                                                                                 |
| `room`        | chữ nhật          |                                                                                                    | Phòng khóa: mép trái/phải là cột cửa (ô trống ở đó thành cửa)                                                                                                          |
| `secret`      | điểm              | `item` (id)                                                                                        | Vật phẩm bí mật; tên đối tượng là tên hiện cho người chơi                                                                                                              |
| `barrier`     | chữ nhật          | `requiresWeapon` (tên vũ khí)                                                                      | Vật chắn đặc, chỉ vỡ khi trúng đúng vũ khí (rễ khô chắn Két giáp cần "Prism Beam")                                                                                     |
| `laser`       | điểm              | `direction` (`left`, `right`, `up`, `down`), `mode` (`always`, `pulse`), `phase` (0–1, mặc định 0) | Nguồn ở tâm ô; nguồn theo nhịp bắt đầu ở lần báo trước đầy đủ kế tiếp theo pha                                                                                         |
| `mirror`      | điểm              | `angle` (45 hoặc 135, kiểu int)                                                                    | Gương `/` hoặc `\` qua tâm ô, phản xạ cả hai mặt. Đạn nạp của Kai đổi góc                                                                                              |
| `lightSensor` | điểm              | `door` (kiểu object)                                                                               | Cảm biến ánh sáng liên kết với đối tượng `opticalDoor` theo id Tiled                                                                                                   |
| `opticalDoor` | chữ nhật          |                                                                                                    | Cửa đóng trên các ô trống, mở hẳn khi nhận đủ ánh sáng từ cảm biến liên kết                                                                                            |
| `section`     | điểm/chữ nhật     | `id`                                                                                               | Mốc bắt đầu một đoạn (nhật ký chơi thử); tên đối tượng là nhãn                                                                                                         |
| `coolant`     | chữ nhật theo ô   |                                                                                                    | Dòng làm mát trong vùng ô trống. Frost Shard biến dòng chảy thành các bậc một chiều phân bố theo chiều cao. Vùng phải có ít nhất `mechanics.coolant.frozenSteps` hàng. |

Điểm tính theo ô chứa điểm; chữ nhật tính theo ô ở tâm (riêng `room`, `barrier`, `gate`, `opticalDoor`, `coolant` tính theo vùng ô phủ). Thông số cơ chế (hồi sinh, hố, gai, dây leo, laser, gương, cảm biến) nằm trong `03-Data/stages.json` → `mechanics`.

## Dựng nhanh từ bản phác ASCII

`maps/src/*.map.json` là bản phác ASCII (`#` đặc, `=` bục, `^` gai, chữ cái theo `legend`, đối tượng chữ nhật trong `objects`). Chuyển sang Tiled:

```
node scripts/ascii-to-tiled.mjs maps/src/m7-test.map.json maps/m7-test.json
```

Script tạo kèm tileset xám `graybox-tiles.png`. Sau đó mở file `.json` bằng Tiled để sửa tiếp; khi đã sửa bằng Tiled thì đừng chạy lại script (sẽ ghi đè).

## Thêm một màn

1. Lưu bản đồ vào `maps/`.
2. Tạo `src/stages/<ten>.ts` theo mẫu `mechanics-room.ts` (`kind: 'tiled'`, `import map from '../../maps/<ten>.json'`).
3. Thêm vào `STAGE_DEFS` trong `src/stages/index.ts`. Test `tests/enemy.test.ts` tự kiểm tra khoảng cách kẻ địch cho mọi màn.

## Các bản đồ

| File               | Nội dung                                                                                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `m7-test.json`     | Phòng thử màn chơi (M7): gai, hố, 2 checkpoint, 2 dây leo đu ngược pha trên hố gai, phòng khóa (Tháp Pháo + Drone), vách vỡ bằng Arc Cannon giấu Nano Cell, rễ khô cần Prism Beam chắn Két giáp            |
| `optics-test.json` | Phòng thử laser, gương và cảm biến Stage 2. Vào từ menu bằng nút Phòng thử laser hoặc phím O, giữ nút Bắn tới nạp vừa rồi thả để xoay gương. Hoặc dùng vũ khí Prism Beam cho mượn để bắn dội vào cảm biến. |
| `frost-test.json`  | Phòng thử Frost Shard và dòng làm mát. Mở từ menu hoặc phím I. Có vũ khí cho mượn và ba bậc băng để leo lên gờ.                                                                                            |
| `gale-test.json`   | Phòng thử Gale Cutter, mở từ menu hoặc phím V. Tháp pháo bắn đạn cho Kai chặn bằng lưỡi. Sương lạnh dùng `barrier` với `requiresWeapon: "Gale Cutter"` và chắn lối tới Két Tay Mk I.                       |
