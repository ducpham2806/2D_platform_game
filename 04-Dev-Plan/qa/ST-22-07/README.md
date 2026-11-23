# ST-22-07 · Đo phòng 3D trên điện thoại thật

## Cách đo

Trong `game/`, build rồi khởi động bản thử trên địa chỉ Wi-Fi của máy chạy.

```sh
npm run build
node scripts/prototype3d-lan.mjs <IPv4-cua-may> 4187
```

Mở link in ra trên điện thoại cùng Wi-Fi, xoay ngang và đi một lượt ở chất lượng mặc định. Cuối lượt, hoặc trong menu tạm dừng nếu chưa tới đích, bấm **Kết quả đo**. Ghi mẫu máy, mức dễ đọc điểm đáp, đoạn khó nhất và nhận xét hoạt ảnh chạy nếu đã để ý. **Lưu kết quả** giữ bản sao trên trình duyệt và gửi tới tệp JSONL trong `game/.prototype3d-playtests/`. Sau khi tải lại cùng link, **Kết quả đã lưu** mở lại bản sao để gửi hoặc sao chép JSON. Có thể dùng `?measure=1` để thu báo cáo khi chơi không qua máy chủ LAN.

Để mở lại đường nhận của một lượt cũ, đặt `CV_PROTOTYPE3D_SESSION` bằng mã 24 ký tự hex trong `session` của link đó. Dùng cùng địa chỉ và cổng để trình duyệt giữ cùng vùng lưu trữ. Tệp báo cáo theo mã phiên được giữ khi máy chủ khởi động lại.

- **Tải:** từ lúc điều hướng tới khi gửi xong khung hình 3D đầu tiên, gồm tải và đọc GLB, tạo cảnh và vẽ lần đầu. Máy chủ dùng `Cache-Control: no-store` cho bản thử.
- **FPS:** lấy khoảng giữa các callback vẽ khi đang chơi và tab hiển thị. Báo cáo có FPS trung bình, FPS trung vị và tỷ lệ khung dài hơn 33,3 ms. Bộ đếm giữ cả khung chậm khi đang chơi.
- **Điểm đáp:** lấy câu trả lời trực tiếp của người chơi và đối chiếu số lần rơi theo đoạn. Số lần rơi có thể do đọc chiều sâu, bấm nhảy hoặc điều khiển cần.

## Kiểm bộ đo

Lượt ngắn Chromium với Pixel 7 ngang giả lập kiểm tra tải, lấy mẫu FPS, mở báo cáo khi đang tạm dừng và lưu vào JSONL. [Ảnh biểu mẫu giả lập](touch-01-bao-cao-mau.png)

Lượt kiểm đường truyền từ MacBook hoàn thành tuyến và lưu biểu mẫu qua Wi-Fi. Phản hồi sau lượt phát hiện Kai giữ tư thế nhấc chân khi chạy. Clip `Run` trong GLB cũ bắt đầu ở 1,5 s vì dùng thời gian của dải NLA trong Blender. GLB mới đặt đầu mỗi clip về 0 s. Test three.js xác nhận chân trái và phải đổi bên trong ba vòng liên tiếp, mỗi vòng 0,6 s. Chromium cảm ứng giả lập giữ cần qua nhiều vòng và thả về `Idle` với 0 lỗi trang. [Bước đầu](touch-02-kai-buoc-dau.png), [bước kế](touch-03-kai-buoc-ke.png)

Kiểm ngày 24/11 trên Pixel 7 giả lập. Phản hồi HTTP 200 trả về trang HTML không được tính là đã nhận báo cáo. Tải lại trang khôi phục đúng số đo và phản hồi. Gửi lại nhận HTTP 201 và ghi đúng báo cáo. Khởi động lại máy chủ với cùng mã vẫn đọc được tệp đã ghi. [Ảnh mở lại bản lưu](touch-04-khoi-phuc-bao-cao.png)

Chrome mở trực tiếp tệp HTML sẽ hiện hướng dẫn và link HTTP cho Mac. Đã kiểm cả tệp nguồn và tệp build. Bấm link Mac vào được phòng, địa chỉ Wi-Fi vào được phòng với cần cảm ứng trên Pixel 7 giả lập. [Ảnh hướng dẫn mở qua HTTP](pc-05-huong-dan-mo-qua-http.png)

## Kết quả máy thật

Ngày 24/11, người chơi báo đã bấm **Lưu kết quả** trên điện thoại. Khi kiểm tra, đường nhận cũ đã ngừng lắng nghe và tệp của phiên còn trống. Đã mở lại cùng đường nhận để thử gửi lại lượt đó. Chờ báo cáo điện thoại để ghi tải, FPS và nhận xét điểm đáp.
