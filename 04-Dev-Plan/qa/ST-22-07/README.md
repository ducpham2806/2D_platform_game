# ST-22-07 · Đo phòng 3D trên điện thoại thật

## Cách đo

Trong `game/`, build rồi khởi động bản thử trên địa chỉ Wi-Fi của máy chạy.

```sh
npm run build
node scripts/prototype3d-lan.mjs <IPv4-cua-may> 4187
```

Mở link in ra trên điện thoại cùng Wi-Fi, xoay ngang và đi một lượt ở chất lượng mặc định. Cuối lượt, hoặc trong menu tạm dừng nếu chưa tới đích, bấm **Kết quả đo**. Ghi mẫu máy, mức dễ đọc điểm đáp, đoạn khó nhất và mô tả vấn đề nếu có. Bấm **Lưu kết quả** để ghi báo cáo vào tệp JSONL cục bộ mà lệnh in ra. Khi không dùng trình nhận báo cáo LAN, mở `?measure=1` và sao chép JSON từ biểu mẫu.

- **Tải:** từ lúc điều hướng tới khi gửi xong khung hình 3D đầu tiên, gồm tải và đọc GLB, tạo cảnh và vẽ lần đầu. Máy chủ dùng `Cache-Control: no-store` cho bản thử.
- **FPS:** lấy khoảng giữa các callback vẽ khi đang chơi và tab hiển thị. Báo cáo có FPS trung bình, FPS trung vị và tỷ lệ khung dài hơn 33,3 ms. Bộ đếm giữ cả khung chậm khi đang chơi.
- **Điểm đáp:** lấy câu trả lời trực tiếp của người chơi và đối chiếu số lần rơi theo đoạn. Số lần rơi có thể do đọc chiều sâu, bấm nhảy hoặc điều khiển cần.

## Kiểm bộ đo

Lượt ngắn Chromium với Pixel 7 ngang giả lập kiểm tra tải, lấy mẫu FPS, mở báo cáo khi đang tạm dừng và lưu vào JSONL. [Ảnh biểu mẫu giả lập](touch-01-bao-cao-mau.png)

Lượt kiểm đường truyền từ MacBook hoàn thành tuyến và lưu biểu mẫu qua Wi-Fi. Phản hồi sau lượt phát hiện Kai giữ tư thế nhấc chân khi chạy. Clip `Run` trong GLB cũ bắt đầu ở 1,5 s vì dùng thời gian của dải NLA trong Blender. GLB mới đặt đầu mỗi clip về 0 s. Test three.js xác nhận chân trái và phải đổi bên trong ba vòng liên tiếp, mỗi vòng 0,6 s. Chromium cảm ứng giả lập giữ cần qua nhiều vòng và thả về `Idle` với 0 lỗi trang. [Bước đầu](touch-02-kai-buoc-dau.png), [bước kế](touch-03-kai-buoc-ke.png)

## Kết quả máy thật

Đang chờ lượt đầu tiên qua Wi-Fi.
