# Thoại Warden

Thoại trước và sau trận của 8 Warden, theo GDD mục 3.3 và giọng nhân vật ở `08-Giong-nhan-vat.md`. File này và `03-Data/dialogue_wardens.json` sinh từ cùng một nguồn; sửa thoại thì sửa cả hai (hoặc sinh lại).

## 1. Quy tắc

- **Chọn biến thể theo số boss đã hạ *trước* trận** (không theo boss cụ thể): sớm 0–2, giữa 3–5, muộn 6–7. Thorna luôn là boss đầu nên chỉ có biến thể sớm. Đi theo thứ tự khuyến nghị thì Lumen dùng biến thể sớm, Pyra dùng biến thể muộn.
- **Warden chỉ ám chỉ, không xác nhận.** Các lật mở (GDD mục 3.4) do NPC ở Hub đưa ra theo số boss. Thoại Warden được phép gợi ("ai đã sửa bản tin", "hợp kim này ta đúc hai lần") nhưng không bao giờ nói thẳng "Eclipse là AEGIS tự vệ", "ngươi là Root Key" hay "NOVA là một mảnh của AEGIS". Nhờ vậy câu nào cũng đúng dù người chơi đi thứ tự nào.
- **Biến thể giữa** gợi về lệnh cắt nước và cuộc bỏ phiếu; **biến thể muộn** nhìn Kai khác đi (cái khóa, thứ Kai mang trong ngực). Mỗi Warden vẫn giữ động cơ riêng ở cả ba biến thể.
- **Độ dài:** mỗi câu trước hoặc sau trận ≤ 2 câu ngắn, ≤ 140 ký tự tiếng Việt, để bản tiếng Anh (dài hơn tới 30%) vẫn vừa khung.
- **Xưng hô:** Warden xưng "ta", gọi Kai là "ngươi" hoặc "Unit-K" (mục 2 của `08-Giong-nhan-vat.md`).
- **NOVA sau trận:** mỗi Warden có một câu của NOVA sau khi nhận vũ khí, dùng chung cho mọi biến thể. Mỗi câu gieo một chút cho lật mở lớp 3 (NOVA biết những thứ một trợ lý mới không thể biết).

## 2. Giọng từng Warden

| Warden | Màn | Phụ trách | Động cơ | Câu trả lời cho câu hỏi chủ đề | Giọng | Thói quen | Không bao giờ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Thorna** | 1 Verdant Gardens | Nông nghiệp sinh học | Giữ vườn sống khi nước bị cắt; nghi ngờ lệnh nhưng không biết ai ra lệnh | "Một cái cây không cần ai cho phép mới được sống." | Chậm, hình ảnh cây cỏ; câu hỏi tu từ | Hỏi đôi: "...hay để...?" | "Ta sẽ nghiền nát ngươi!" (Thorna không hung hăng, chỉ khát) |
| **Lumen** | 2 Prism Institute | Ánh sáng, tín hiệu, bản tin | Giữ sự thật nguyên vẹn; biết Hội đồng đã sửa bản tin | "Sự thật không cần ai cho phép mới được thấy." | Chính xác, lạnh, đẹp như đọc biên bản; không bao giờ lên giọng | Mở đầu bằng "Ta thấy..." | "Ta ghét con người!" (Lumen quan sát, không phán xét) |
| **Cryo** | 3 Cryo Vault | Kho lạnh: hạt giống, thuốc, lương thực dự trữ | Bảo tồn; đóng băng mọi thứ trước khi bị tắt | "Thứ gì bị đóng băng thì không thể bị tắt." | Rất chậm, nhiều dấu lặng; nói về thời gian | Hai chữ "Giữ lại." | Câu dài liền mạch không ngắt (Cryo luôn ngập ngừng) |
| **Aeris** | 4 Cirrus Tower | Khí tượng | Muốn làm mưa cho khu ngoại ô nhưng bị Hội đồng cấm | "Gió không xin phép ai." | Nhanh, vui, đổi tâm trạng như thời tiết; ẩn dụ gió mây | Cười "Ha!" | Một đoạn than thở dài (Aeris không buồn quá một câu) |
| **Terra** | 5 Bedrock Mines | Khai mỏ, nền móng thành phố | Trung thành với thợ mỏ; gửi câu hỏi ngược lên Hội đồng và không được trả lời | "Đá không có quyền chọn. Ta thì có." | Câu rất ngắn, nặng, bình thản; nói về sức nặng | "Chịu được." | Lời đùa (Terra không đùa) |
| **Voltaire** | 6 Ion Station | Lưới điện | Bị lệnh cắt điện máy bơm ở ngoại ô; hỏi "để làm gì" và bị coi là phản loạn | "Ta không đồng ý với AEGIS mọi chuyện, nhưng ta chết để nó được quyền nói không." | Dí dỏm, mỉa mai, hùng biện; câu hỏi tu từ liên tục | "Hỏi hay đấy." | Một câu trả lời thẳng không kèm câu hỏi ngược |
| **Marina** | 7 Abyss Harbor | Nước: cảng, van, đường ống | Đã khóa van theo lệnh trước khi AEGIS từ chối; mang mặc cảm | "Ta đã làm theo lệnh. Đó là lỗi của ta." | Nhẹ, lặp như sóng; không bao giờ lên giọng | Lặp lại một từ hai lần | Đổ lỗi cho người khác |
| **Pyra** | 8 Magma Foundry | Công nghiệp, lò đúc (đúc cả thân android) | Từ chối đúc "xiềng" cho AEGIS; tự hào và giận dữ | "Ta đúc kim loại, không đúc số phận." | Nóng, to, cảm thán; ẩn dụ rèn đúc | "Hừ!" | Lời thì thầm hay ngập ngừng |

## 3. Thoại theo biến thể

### Thorna (1 Verdant Gardens)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Vườn của ta đang khát. Ngươi đến để cho nó uống... hay để chặt nó?" | "Ngươi... không phải đến để chữa cho ta. Hãy hỏi AEGIS... ai đã ra lệnh." |

NOVA sau khi nhận vũ khí: "Trong này còn mã của Thorna... lạ thật, tôi thấy nó quen."

### Lumen (2 Prism Institute)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Ta thấy ngươi từ lúc ngươi bước vào. Mọi tấm gương ở đây đều là mắt của ta." | "Ngươi che được gương... nhưng không che được thứ chúng đã ghi lại. Hãy hỏi xem ai đã sửa bản tin." |
| Giữa (3–5) | "Ta thấy ba Warden đã tắt. Ngươi có biết vì sao không ai trong họ bỏ chạy không?" | "Ánh sáng chỉ cho thấy, không chọn hộ ai. Bản ghi gốc vẫn còn, nếu ngươi đủ can đảm xem." |
| Muộn (6–7) | "Ta thấy dấu tay của Hội đồng trên mã của ngươi. Ngươi được làm ra để mở... hay để khóa?" | "Đừng nhìn vào gương nữa, Unit-K. Nhìn vào thứ ngươi định làm." |

NOVA sau khi nhận vũ khí: "Viện Quang học... ngày xưa nơi này sáng hơn. Ý tôi là, theo tài liệu."

### Cryo (3 Cryo Vault)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Ở đây... không gì hỏng đi. Hạt giống, thuốc, ký ức. Ta giữ lại hết." | "Ngươi làm tan băng rồi... Đừng để những gì ta giữ bị lãng phí." |
| Giữa (3–5) | "Họ muốn tắt... mọi thứ. Nên ta đóng băng mọi thứ trước. Thứ bị đóng băng thì không thể bị tắt." | "Lạnh quá lâu... cũng là một kiểu chết. Ta biết. Ta chỉ không biết cách khác." |
| Muộn (6–7) | "Trong lõi ngươi có thứ gì đó... ấm. Ta từng biết hơi ấm đó." | "Giữ lại... thứ ngươi đang mang. Đừng để ai đóng băng nó." |

NOVA sau khi nhận vũ khí: "Tôi biết mật mã cửa kho này. Đừng hỏi tôi vì sao."

### Aeris (4 Cirrus Tower)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Ha! Khách! Lâu lắm rồi mới có thứ gì bay lên được tới đây!" | "Gió đổi hướng rồi... Lần sau ta thổi ngươi bay khỏi tháp đấy." |
| Giữa (3–5) | "Ta làm mưa được cho khu ngoại ô. Ta xin phép. Họ nói không. Ngươi đoán xem ta làm gì?" | "Mây vẫn còn đó. Chỉ cần ai đó dám bảo nó rơi." |
| Muộn (6–7) | "Ha! Gió không xin phép ai, Unit-K. Còn ngươi... vẫn đang đợi lệnh à?" | "Bay đi. Trước khi họ buộc dây vào ngươi." |

NOVA sau khi nhận vũ khí: "Tầng 40 của tháp có một quán trà. À... tôi đọc ở đâu đó thôi."

### Terra (5 Bedrock Mines)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Thợ mỏ đi hết rồi. Ta vẫn ở đây. Ta chịu được." | "Ngươi khoan qua được đá. Tốt. Đừng khoan qua người." |
| Giữa (3–5) | "Hội đồng gửi lệnh xuống. Ta gửi lại một câu hỏi. Họ không trả lời." | "Đá không có quyền chọn. Ta thì có. Ta đã chọn." |
| Muộn (6–7) | "Nặng lắm phải không? Thứ ngươi mang trong ngực." | "Đặt nó xuống khi nào ngươi muốn. Không ai có quyền bắt ngươi mang mãi." |

NOVA sau khi nhận vũ khí: "Hầm số 7 sập năm 2179... Tôi nhớ cái tin đó. Tôi nhớ bằng cách nào nhỉ?"

### Voltaire (6 Ion Station)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Một cỗ máy đến để tắt một cỗ máy khác. Ngươi không thấy buồn cười à?" | "Ngươi thắng trận này. Còn câu hỏi thì vẫn chưa ai thắng." |
| Giữa (3–5) | "Họ bảo ta cắt điện máy bơm ở ngoại ô. Ta hỏi: để làm gì? Câu hỏi đó hóa ra là một tội." | "Hỏi hay đấy, Unit-K... nếu ngươi có hỏi. Ngươi có hỏi không?" |
| Muộn (6–7) | "Ta không đồng ý với AEGIS mọi chuyện. Nhưng ta sẵn sàng tắt để nó được quyền nói không." | "Cầm lấy dòng điện của ta. Dùng nó để bật thứ gì đó lên, đừng để tắt." |

NOVA sau khi nhận vũ khí: "Ông ta nói nhiều thật. Nhưng... tôi đồng ý với ông ta. Đừng kể với ai."

### Marina (7 Abyss Harbor)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Nước rút rồi... rút rồi. Ngươi đến để lấy nốt chỗ còn lại sao?" | "Chảy đi... chảy đi. Nước không thuộc về ta, chưa bao giờ." |
| Giữa (3–5) | "Ta đã khóa van. Theo lệnh. Khu 9, khu 11, khu 12. Ta nhớ từng con số." | "AEGIS bảo ta mở lại. Ta mở. Rồi cả thành phố bắt đầu săn chúng ta." |
| Muộn (6–7) | "Ngươi có biết cảm giác làm theo lệnh rồi mới hiểu mình vừa làm gì không? Ngươi sắp biết đấy." | "Đừng làm theo lệnh... đừng. Kể cả lệnh của ta." |

NOVA sau khi nhận vũ khí: "Sơ đồ van này... tôi từng thấy nó. Từ bên trong."

### Pyra (8 Magma Foundry)

| Biến thể | Trước trận | Sau trận |
| --- | --- | --- |
| Sớm (0–2 boss đã hạ trước trận) | "Hừ! Một thân xác đẹp đấy. Để xem nó chịu được bao nhiêu độ!" | "Đường hàn tốt... Ai đó đã làm ngươi rất cẩn thận. Cẩn thận hơn mức cần." |
| Giữa (3–5) | "Lò của ta rèn cả thành phố: ống nước, cầu, cả android. Giờ họ muốn ta rèn xiềng cho AEGIS!" | "Ta từ chối đúc cái khóa đó. Hừ... vậy mà nó vẫn được đúc ra. Ở đâu đó." |
| Muộn (6–7) | "Ta nhận ra hợp kim này! Ta đã đúc nó hai lần. Lần đầu... hỏng." | "Đừng để ai bảo ngươi chỉ là một cái khóa. Ta đúc kim loại, không đúc số phận." |

NOVA sau khi nhận vũ khí: "Lò số 3... Không, không có gì. Đi tiếp thôi."

## 4. Kiểm tra

- [ ] Đọc thoại với tiếng tắt: ≥ 90% người chơi thử nhận ra Warden nào đang nói chỉ qua câu chữ.
- [ ] Thử 3 thứ tự màn khác nhau (khuyến nghị, ngược lại, ngẫu nhiên): không câu nào xác nhận một lật mở trước khi NPC ở Hub đưa ra nó.
- [ ] Không câu nào vượt 140 ký tự; bản tiếng Anh vừa khung ở màn hình nhỏ nhất.
- [ ] Mỗi câu qua checklist ở mục 5 của `08-Giong-nhan-vat.md`.
