# ST-22-07 · Đo phòng 3D trên điện thoại thật

## Cách đo

Trong `game/`, build và kiểm đường nhận cục bộ trước khi mở bản thử trên địa chỉ Wi-Fi của máy chạy.

```sh
npm run build
node scripts/prototype3d-lan.mjs --check
node scripts/prototype3d-lan.mjs <IPv4-cua-may> 4187
```

`--check` chỉ mở cổng tạm trên `127.0.0.1`. Nó kiểm trang có biểu mẫu, dữ liệu phòng, đầu tệp hai model GLB, từ chối mã phiên/origin sai và JSON hỏng, rồi kiểm gửi lại vẫn nhận HTTP 201 nhưng chỉ có một dòng JSONL giả. Không dùng mã phiên, tệp báo cáo hay điện thoại của người thử. Lệnh không kiểm WebGL, Wi-Fi hoặc lượt trên máy thật.

Mở link in ra trên điện thoại cùng Wi-Fi, xoay ngang và đi một lượt ở chất lượng mặc định. Cuối lượt, hoặc trong menu tạm dừng nếu chưa tới đích, bấm **Kết quả đo**. Ghi mẫu máy, mức dễ đọc điểm đáp, đoạn khó nhất và nhận xét hoạt ảnh chạy nếu đã để ý. **Lưu kết quả** giữ bản sao trên trình duyệt và gửi tới tệp JSONL trong `game/.prototype3d-playtests/`. Sau khi tải lại cùng link, **Kết quả đã lưu** mở lại bản sao để gửi hoặc sao chép JSON. Có thể dùng `?measure=1` để thu báo cáo khi chơi không qua máy chủ LAN.

Để mở lại đường nhận của một lượt cũ, đặt `CV_PROTOTYPE3D_SESSION` bằng mã 24 ký tự hex trong `session` của link đó. Dùng cùng địa chỉ và cổng để trình duyệt giữ cùng vùng lưu trữ. Tệp báo cáo theo mã phiên được giữ khi máy chủ khởi động lại.

Nếu máy chủ đã ghi nhưng trình duyệt không nhận biên nhận, mở **Kết quả đã lưu** và gửi lại, không cần chơi lại. Với báo cáo mới, gửi lại cùng nội dung và `submissionId` nhận HTTP 201 mà không thêm dòng, kể cả sau khi khởi động lại cùng một máy chủ. Sửa phản hồi hoặc mở một lần đo mới tạo lần gửi riêng. Báo cáo cũ không có mã vẫn mở/nhận được; không tự gộp các dòng cũ. Chỉ chạy một đường nhận cho một phiên.

Báo cáo mới có thể kèm `capture.capturedAtUtc` (đồng hồ thiết bị lúc mở biểu mẫu đo, không phải lúc nhận JSONL) và `capture.artifactSha256` (dấu vân tay gói phòng 3D ghi trong trang ngay khi build). Dấu vân tay băm SHA-256 của JSON các cặp `[tên tương đối, SHA-256 của tệp]` sắp theo tên, gồm chunk vào phòng và phụ thuộc JS/CSS/asset, `data/prototype3d.json` và hai GLB. Mở hoặc gửi lại giữ nguyên hai giá trị đã ghi; thiếu trường thì ghi **chưa rõ**, không lấy bản hiện đang phục vụ để gán lại. Đây là thông tin do trang và đồng hồ thiết bị khai báo, không phải chứng thực đồng hồ, bộ đệm hay máy thật.

- **Tải:** từ lúc điều hướng tới khi gửi xong khung hình 3D đầu tiên, gồm tải và đọc GLB, tạo cảnh và vẽ lần đầu. Máy chủ dùng `Cache-Control: no-store` cho bản thử.
- **FPS:** lấy khoảng giữa các callback vẽ khi đang chơi và tab hiển thị. Báo cáo có FPS trung bình, FPS trung vị và tỷ lệ khung dài hơn 33,3 ms. Bộ đếm giữ cả khung chậm khi đang chơi.
  - Khi khung trung vị từ 100 ms trở lên, biểu đồ không đủ độ phân giải để báo số chính xác. Biểu mẫu hiện **≤10 FPS trung vị**; JSON mới ghi `fpsMedian: null` và `fpsMedianUpperBound: 10`. Với trung vị trong phạm vi đo hoặc chưa có mẫu, `fpsMedianUpperBound` là `null`. Bản lưu cũ không có trường này vẫn mở được; không dùng giá trị cũ gần 10 FPS làm số đo chính xác.
- **Điểm đáp:** lấy câu trả lời trực tiếp của người chơi và đối chiếu số lần rơi theo đoạn. Số lần rơi có thể do đọc chiều sâu, bấm nhảy hoặc điều khiển cần.

## Kiểm bộ đo

Lượt ngắn Chromium với Pixel 7 ngang giả lập kiểm tra tải, lấy mẫu FPS, mở báo cáo khi đang tạm dừng và lưu vào JSONL. [Ảnh biểu mẫu giả lập](touch-01-bao-cao-mau.png)

Lượt kiểm đường truyền từ MacBook hoàn thành tuyến và lưu biểu mẫu qua Wi-Fi. Phản hồi sau lượt phát hiện Kai giữ tư thế nhấc chân khi chạy. Clip `Run` trong GLB cũ bắt đầu ở 1,5 s vì dùng thời gian của dải NLA trong Blender. GLB mới đặt đầu mỗi clip về 0 s. Test three.js xác nhận chân trái và phải đổi bên trong ba vòng liên tiếp, mỗi vòng 0,6 s. Chromium cảm ứng giả lập giữ cần qua nhiều vòng và thả về `Idle` với 0 lỗi trang. [Bước đầu](touch-02-kai-buoc-dau.png), [bước kế](touch-03-kai-buoc-ke.png)

Kiểm ngày 24/11 trên Pixel 7 giả lập. Phản hồi HTTP 200 trả về trang HTML không được tính là đã nhận báo cáo. Tải lại trang khôi phục đúng số đo và phản hồi. Gửi lại nhận HTTP 201 và ghi đúng báo cáo. Khởi động lại máy chủ với cùng mã vẫn đọc được tệp đã ghi. [Ảnh mở lại bản lưu](touch-04-khoi-phuc-bao-cao.png)

Chrome mở trực tiếp tệp HTML sẽ hiện hướng dẫn và link HTTP cho Mac. Đã kiểm cả tệp nguồn và tệp build. Bấm link Mac vào được phòng, địa chỉ Wi-Fi vào được phòng với cần cảm ứng trên Pixel 7 giả lập. [Ảnh hướng dẫn mở qua HTTP](pc-05-huong-dan-mo-qua-http.png)

Chạy lại toàn tuyến trên bản `18b8472` ngày 24/11. Bàn phím về đích trong 64,2 s và Pixel 7 ngang giả lập trong 66,1 s, gồm một lần rơi chủ động để kiểm checkpoint. Cả hai lượt có 0 lỗi console.

Kiểm tổng hợp trên bản vá từ `85f7e53`: ba khoảng khung 200 ms từng cho trung bình 5 FPS nhưng báo trung vị 10 FPS. Biểu mẫu mới ghi trung bình 5, cận trên trung vị 10 và 100% khung chậm. Đã kiểm mở/lưu/mở lại biểu mẫu bằng DOM giả lập từ trang build, trường hợp đủ mẫu, không có mẫu và bản lưu cũ; đường nhận cục bộ trả HTTP 201 và ghi đúng JSONL. Đây không phải lượt trên trình duyệt thật hay điện thoại.

## Kết quả máy thật

Ngày 24/11, người chơi báo đã bấm **Lưu kết quả** trên điện thoại. Khi kiểm tra, đường nhận cũ đã ngừng lắng nghe và tệp của phiên còn trống. Đã mở lại cùng đường nhận để thử gửi lại lượt đó. Chờ báo cáo điện thoại để ghi tải, FPS và nhận xét điểm đáp.
