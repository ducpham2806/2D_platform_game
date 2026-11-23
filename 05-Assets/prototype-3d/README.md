# Asset mẫu của phòng thử 3D

| Nguồn Blender | Tệp chạy trong game | Nội dung |
| --- | --- | --- |
| [kai.blend](kai.blend) | [kai.glb](../../game/public/assets/prototype3d/kai.glb) | Kai low-poly, 2.020 tam giác, 11 xương, điểm `Muzzle` và bảy clip `Idle`, `Run`, `Jump`, `Fall`, `Land`, `Dash`, `Shoot` |
| [terrain-kit.blend](terrain-kit.blend) | [terrain-kit.glb](../../game/public/assets/prototype3d/terrain-kit.glb) | Bốn mô-đun `Floor`, `Platform`, `Edge`, `Wall`, tổng 704 tam giác |

Kai dùng gốc ở chân, chiều cao gần 1,8 m và hướng mặt về −Y trong Blender. Sau khi xuất GLB, trục Y hướng lên và mặt hướng +Z trong three.js. Nòng pháo gắn vào xương tay phải. Hai clip lặp là `Idle` và `Run`. Các clip giữ Kai tại gốc, còn chuyển động và sát thương chạy theo dữ liệu phòng.

Mặt đi của sàn và bục tại z = 0 trong Blender. Chân vách tại z = 0. Các mô-đun có dấu chân danh định 1 × 1 m, có thể ghép trong Blender hoặc đặt từ JSON. Vật liệu phẳng và màu phát sáng nằm trong GLB.

Đây là asset dựng riêng cho Cyber Vanguard. Tái tạo từ gốc repo bằng Blender 4.5 LTS.

```sh
blender --background --python 05-Assets/prototype-3d/build_assets.py
```

Script tái tạo cả hai nguồn `.blend` và hai bản `.glb`. Khi chỉnh asset thủ công, lưu nguồn trước rồi xuất GLB với tên mô-đun và clip như trong bảng.
