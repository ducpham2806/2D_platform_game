# Cổng MVP (G3)

Cổng này trả lời câu hỏi của Giai đoạn 1: **game có vui đủ để làm tiếp Giai đoạn 2 không?** (GDD chính mục 16). Đo với khoảng 50 người chơi thử bản web MVP (Prologue + Stage 1–4, không quảng cáo, không IAP). Không qua thì sửa cảm giác chơi và thiết kế màn, **không** thêm hệ thống.

Cấu trúc theo `05-Cong-Prototype.md`: tiêu chí, cách đo, quy trình, quy tắc quyết định, kết quả các đợt. Epic: EP-20 (kế hoạch S17–S18). Điều kiện bắt đầu: EP-13 (đo lường) và EP-19 (bản web MVP, QA) xong.

## 1. Tiêu chí `[PLACEHOLDER]`

| # | Nhóm | Tiêu chí | Nguồn | Đo bằng |
| --- | --- | --- | --- | --- |
| 1 | Onboarding | Hoàn thành Prologue ≥ 90% người bắt đầu | GDD 16, 17 | Sự kiện vào/qua Prologue (`13-Do-luong-MVP.md`) |
| 2 | Màn đầu | Hoàn thành Stage 1 ≥ 70% người bắt đầu Stage 1 | GDD 16, 17 | Sự kiện vào/qua màn |
| 3 | Đi hết | ≥ 50% người bắt đầu chơi xong cả 4 màn | GDD 16 | Sự kiện hạ boss chiến dịch |
| 4 | Quay lại | Quay lại chơi ngày hôm sau ≥ 35% | GDD 16 | Mã người chơi ẩn danh, ngày của phiên |
| 5 | Muốn chơi tiếp | ≥ 60% người chơi xong 4 màn trả lời "muốn chơi màn 5" | GDD 16 | Phiếu hỏi trong game sau boss 4 |
| 6 | Vòng khắc chế | ≥ 70% người chơi xong dùng đúng vũ khí khắc chế ở ít nhất 2 boss | GDD 16 | Sự kiện trúng điểm yếu theo boss |
| 7 | Cân bằng điều khiển | Tỉ lệ thua trên cảm ứng không cao hơn bàn phím quá 40% ở cùng màn | GDD 17 | Sự kiện chết theo thiết bị chính |
| 8 | Bỏ cuộc | Không đoạn nào có > 30% người bỏ cuộc dừng ở đó | GDD 17 ("hỏng") | Đoạn cuối của phiên không quay lại |
| 9 | Build | Không build nào cho thời gian hạ boss < 10% thời gian thiết kế; thời gian hoàn thành màn không lệch > 2× dự kiến | GDD 17 ("hỏng") | Sự kiện hạ boss kèm thời gian, build |
| 10 | Kỹ thuật | Crash-free ≥ 99% phiên; vào game ≤ 3 s; ≥ 55 FPS điện thoại tầm trung; lỗi mức Chặn/Cao = 0 | GDD 15, 17; `04-Test-va-Launch.md` | Lỗi JS gửi kèm sự kiện; `gate-check`; báo lỗi người thử |

## 2. Cỡ mẫu và cách đọc số

50 người cho khoảng tin cậy rộng (ví dụ 35% quay lại với 50 người: khoảng 80% là 27–44%). Mỗi tiêu chí 1–8 ghi một trong ba mức theo khoảng tin cậy 80% (Wilson):

- **Đạt:** cả khoảng nằm trên ngưỡng, hoặc tỉ lệ đo ≥ ngưỡng và cận dưới cách ngưỡng ≤ 5 điểm %.
- **Cần xem:** ngưỡng nằm trong khoảng tin cậy.
- **Không đạt:** cả khoảng nằm dưới ngưỡng.

Tiêu chí 9, 10 là cứng: một lần vi phạm là Không đạt.

## 3. Bản thử và dữ liệu

- Bản web từ tag `mvp-rN` (N là số đợt), mở trên GitHub Pages hoặc host tĩnh; bật bảng đồng ý đo lường ở lần mở đầu (ADR-002).
- Dữ liệu: sự kiện theo `01-GDD/13-Do-luong-MVP.md`, gửi theo kênh trong `adr/ADR-002-do-luong-mvp.md`. Không thu tên, email, IP lưu lâu; mã người chơi là chuỗi ngẫu nhiên trên máy.
- Phiếu hỏi trong game: sau boss 4 (tiêu chí 5) và khi người chơi bấm "Gửi góp ý" trong menu tạm dừng (câu hỏi mở).

## 4. Quy trình

1. **Tuyển:** 2 đợt × 25 người. Mỗi đợt ≥ 50% chơi trên điện thoại cảm ứng; có người chưa từng chơi platformer. Người đã thử cổng Prototype không tính vào đợt đầu.
2. **Giao:** gửi link, không hướng dẫn thêm ngoài câu "chơi như bình thường, trong 7 ngày". Không ngồi cạnh (khác cổng Prototype).
3. **Theo dõi:** ngày 1, 3, 7 xem bảng tổng hợp; lỗi Chặn sửa ngay và ghi phiên bản.
4. **Phân tích:** chạy script tổng hợp (EP-13) trên dữ liệu đợt, ra bảng mục 1 kèm khoảng tin cậy; ghi vào mục 6.
5. **Quyết định:** theo mục 5; ghi lý do; tag `mvp` nếu qua.

## 5. Quy tắc quyết định

| Kết quả | Quyết định |
| --- | --- |
| Mọi tiêu chí Đạt | Qua G3: bắt đầu Giai đoạn 2 (Alpha) |
| Có Cần xem, không có Không đạt | Sửa điểm yếu nhỏ, chạy thêm 1 đợt 25 người mới chỉ để kiểm các tiêu chí đó |
| Có Không đạt ở 1, 2, 7, 8 (cảm giác, màn) | Sửa cảm giác điều khiển, bố cục đoạn bị bỏ, hướng dẫn; chạy lại đợt 25 người mới |
| Có Không đạt ở 3, 4, 5, 6 (giữ chân, chiều sâu) | Xem lại nhịp màn, độ khó, thưởng, câu đố khắc chế (gợi ý NOVA, D10); **không** thêm hệ thống |
| Không đạt ở 9, 10 | Sửa trước khi tính các tiêu chí khác |
| Hai đợt liên tiếp Không đạt cùng tiêu chí 1–4 | Dừng, họp lại phạm vi với người dùng (cắt Stage 4, đổi trọng tâm) |

## 6. Kết quả các đợt thử

| Đợt | Ngày | Phiên bản | Số người (cảm ứng / bàn phím) | Kết quả | Quyết định |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | Chưa chạy | — |
