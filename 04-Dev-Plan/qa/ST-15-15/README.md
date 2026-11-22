# Kiểm thử báo đòn và khung camera (ST-15-15)

Ảnh Chromium từ bản build của commit `EP-15 ST-15-15: áp dụng QB-21 và QB-23`, trên nền `93096ce`. PC 960 × 576 ở Thường và Pixel 7 cầm ngang giả lập ở Thử thách. Cả hai lượt có 0 lỗi console.

Chạy phòng thử **Địch S2–3** hoặc **Thử thách S2–3** với `?debug=1`. Bài kiểm đặt Kai cạnh Tháp Băng và dịch camera để giữ nguyên khoảng cách giữa hai nhân vật. Tháp Băng vẫn hiện ở sát mép nhưng nằm ngoài lề 1 ô, nên không báo hay bắn. Dịch vào trong lề thì hiện dấu rơi. Dịch ra lần nữa giữa lúc báo thì hủy đòn. Khi trở vào, bài kiểm đo lại ít nhất 0,6 s từ lúc bắt đầu báo đến phát đầu bằng từng bước logic.

Trong phòng khóa, bài kiểm theo dõi thời gian từ lúc Frost Titan hiện báo giậm đến lúc sóng xuất hiện và xác nhận đạt QB-21. Bộ `tests/enemy-safety.test.ts` kiểm tất cả đòn của hai mini-boss, từng mép camera, tầm dọc đúng 7 ô và các loạt Thử thách bị gián đoạn.

| Tình huống | PC | Pixel 7 |
| --- | --- | --- |
| Tháp Băng sát mép, chưa báo đòn | [Ảnh](pc-01-thap-bang-sat-mep.png) | [Ảnh](touch-01-thap-bang-sat-mep.png) |
| Tháp Băng vào trong lề và hiện dấu rơi | [Ảnh](pc-02-thap-bang-bao-don.png) | [Ảnh](touch-02-thap-bang-bao-don.png) |
| Frost Titan báo giậm trong phòng khóa | [Ảnh](pc-03-frost-titan-bao-giam.png) | [Ảnh](touch-03-frost-titan-bao-giam.png) |
