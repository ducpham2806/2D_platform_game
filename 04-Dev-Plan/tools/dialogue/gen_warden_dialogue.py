"""Sinh 01-GDD/09-Thoai-Warden.md và 03-Data/dialogue_wardens.json từ một nguồn.

Cách chạy (từ gốc repo): python3 04-Dev-Plan/tools/dialogue/gen_warden_dialogue.py .
Sửa thoại tiếng Việt trong danh sách W bên dưới, tiếng Anh trong warden_lines_en.py, rồi chạy lại.
"""
import json, sys
from warden_lines_en import EN
root = sys.argv[1]
W = [
 dict(id="thorna", name="Thorna", stage="1 Verdant Gardens", domain="Nông nghiệp sinh học",
  motive="Giữ vườn sống khi nước bị cắt; nghi ngờ lệnh nhưng không biết ai ra lệnh",
  answer="\"Một cái cây không cần ai cho phép mới được sống.\"",
  voice="Chậm, hình ảnh cây cỏ; câu hỏi tu từ", tic="Hỏi đôi: \"...hay để...?\"",
  never="\"Ta sẽ nghiền nát ngươi!\" (Thorna không hung hăng, chỉ khát)",
  lines={"early":("Vườn của ta đang khát. Ngươi đến để cho nó uống... hay để chặt nó?",
                  "Ngươi... không phải đến để chữa cho ta. Hãy hỏi AEGIS... ai đã ra lệnh.")},
  nova="Trong này còn mã của Thorna... lạ thật, tôi thấy nó quen."),
 dict(id="lumen", name="Lumen", stage="2 Prism Institute", domain="Ánh sáng, tín hiệu, bản tin",
  motive="Giữ sự thật nguyên vẹn; biết Hội đồng đã sửa bản tin",
  answer="\"Sự thật không cần ai cho phép mới được thấy.\"",
  voice="Chính xác, lạnh, đẹp như đọc biên bản; không bao giờ lên giọng", tic="Mở đầu bằng \"Ta thấy...\"",
  never="\"Ta ghét con người!\" (Lumen quan sát, không phán xét)",
  lines={"early":("Ta thấy ngươi từ lúc ngươi bước vào. Mọi tấm gương ở đây đều là mắt của ta.",
                  "Ngươi che được gương... nhưng không che được thứ chúng đã ghi lại. Hãy hỏi xem ai đã sửa bản tin."),
         "mid":("Ta thấy ba Warden đã tắt. Ngươi có biết vì sao không ai trong họ bỏ chạy không?",
                "Ánh sáng chỉ cho thấy, không chọn hộ ai. Bản ghi gốc vẫn còn, nếu ngươi đủ can đảm xem."),
         "late":("Ta thấy dấu tay của Hội đồng trên mã của ngươi. Ngươi được làm ra để mở... hay để khóa?",
                 "Đừng nhìn vào gương nữa, Unit-K. Nhìn vào thứ ngươi định làm.")},
  nova="Viện Quang học... ngày xưa nơi này sáng hơn. Ý tôi là, theo tài liệu."),
 dict(id="cryo", name="Cryo", stage="3 Cryo Vault", domain="Kho lạnh: hạt giống, thuốc, lương thực dự trữ",
  motive="Bảo tồn; đóng băng mọi thứ trước khi bị tắt",
  answer="\"Thứ gì bị đóng băng thì không thể bị tắt.\"",
  voice="Rất chậm, nhiều dấu lặng; nói về thời gian", tic="Hai chữ \"Giữ lại.\"",
  never="Câu dài liền mạch không ngắt (Cryo luôn ngập ngừng)",
  lines={"early":("Ở đây... không gì hỏng đi. Hạt giống, thuốc, ký ức. Ta giữ lại hết.",
                  "Ngươi làm tan băng rồi... Đừng để những gì ta giữ bị lãng phí."),
         "mid":("Họ muốn tắt... mọi thứ. Nên ta đóng băng mọi thứ trước. Thứ bị đóng băng thì không thể bị tắt.",
                "Lạnh quá lâu... cũng là một kiểu chết. Ta biết. Ta chỉ không biết cách khác."),
         "late":("Trong lõi ngươi có thứ gì đó... ấm. Ta từng biết hơi ấm đó.",
                 "Giữ lại... thứ ngươi đang mang. Đừng để ai đóng băng nó.")},
  nova="Tôi biết mật mã cửa kho này. Đừng hỏi tôi vì sao."),
 dict(id="aeris", name="Aeris", stage="4 Cirrus Tower", domain="Khí tượng",
  motive="Muốn làm mưa cho khu ngoại ô nhưng bị Hội đồng cấm",
  answer="\"Gió không xin phép ai.\"",
  voice="Nhanh, vui, đổi tâm trạng như thời tiết; ẩn dụ gió mây", tic="Cười \"Ha!\"",
  never="Một đoạn than thở dài (Aeris không buồn quá một câu)",
  lines={"early":("Ha! Khách! Lâu lắm rồi mới có thứ gì bay lên được tới đây!",
                  "Gió đổi hướng rồi... Lần sau ta thổi ngươi bay khỏi tháp đấy."),
         "mid":("Ta làm mưa được cho khu ngoại ô. Ta xin phép. Họ nói không. Ngươi đoán xem ta làm gì?",
                "Mây vẫn còn đó. Chỉ cần ai đó dám bảo nó rơi."),
         "late":("Ha! Gió không xin phép ai, Unit-K. Còn ngươi... vẫn đang đợi lệnh à?",
                 "Bay đi. Trước khi họ buộc dây vào ngươi.")},
  nova="Tầng 40 của tháp có một quán trà. À... tôi đọc ở đâu đó thôi."),
 dict(id="terra", name="Terra", stage="5 Bedrock Mines", domain="Khai mỏ, nền móng thành phố",
  motive="Trung thành với thợ mỏ; gửi câu hỏi ngược lên Hội đồng và không được trả lời",
  answer="\"Đá không có quyền chọn. Ta thì có.\"",
  voice="Câu rất ngắn, nặng, bình thản; nói về sức nặng", tic="\"Chịu được.\"",
  never="Lời đùa (Terra không đùa)",
  lines={"early":("Thợ mỏ đi hết rồi. Ta vẫn ở đây. Ta chịu được.",
                  "Ngươi khoan qua được đá. Tốt. Đừng khoan qua người."),
         "mid":("Hội đồng gửi lệnh xuống. Ta gửi lại một câu hỏi. Họ không trả lời.",
                "Đá không có quyền chọn. Ta thì có. Ta đã chọn."),
         "late":("Nặng lắm phải không? Thứ ngươi mang trong ngực.",
                 "Đặt nó xuống khi nào ngươi muốn. Không ai có quyền bắt ngươi mang mãi.")},
  nova="Hầm số 7 sập năm 2179... Tôi nhớ cái tin đó. Tôi nhớ bằng cách nào nhỉ?"),
 dict(id="voltaire", name="Voltaire", stage="6 Ion Station", domain="Lưới điện",
  motive="Bị lệnh cắt điện máy bơm ở ngoại ô; hỏi \"để làm gì\" và bị coi là phản loạn",
  answer="\"Ta không đồng ý với AEGIS mọi chuyện, nhưng ta chết để nó được quyền nói không.\"",
  voice="Dí dỏm, mỉa mai, hùng biện; câu hỏi tu từ liên tục", tic="\"Hỏi hay đấy.\"",
  never="Một câu trả lời thẳng không kèm câu hỏi ngược",
  lines={"early":("Một cỗ máy đến để tắt một cỗ máy khác. Ngươi không thấy buồn cười à?",
                  "Ngươi thắng trận này. Còn câu hỏi thì vẫn chưa ai thắng."),
         "mid":("Họ bảo ta cắt điện máy bơm ở ngoại ô. Ta hỏi: để làm gì? Câu hỏi đó hóa ra là một tội.",
                "Hỏi hay đấy, Unit-K... nếu ngươi có hỏi. Ngươi có hỏi không?"),
         "late":("Ta không đồng ý với AEGIS mọi chuyện. Nhưng ta sẵn sàng tắt để nó được quyền nói không.",
                 "Cầm lấy dòng điện của ta. Dùng nó để bật thứ gì đó lên, đừng để tắt.")},
  nova="Ông ta nói nhiều thật. Nhưng... tôi đồng ý với ông ta. Đừng kể với ai."),
 dict(id="marina", name="Marina", stage="7 Abyss Harbor", domain="Nước: cảng, van, đường ống",
  motive="Đã khóa van theo lệnh trước khi AEGIS từ chối; mang mặc cảm",
  answer="\"Ta đã làm theo lệnh. Đó là lỗi của ta.\"",
  voice="Nhẹ, lặp như sóng; không bao giờ lên giọng", tic="Lặp lại một từ hai lần",
  never="Đổ lỗi cho người khác",
  lines={"early":("Nước rút rồi... rút rồi. Ngươi đến để lấy nốt chỗ còn lại sao?",
                  "Chảy đi... chảy đi. Nước không thuộc về ta, chưa bao giờ."),
         "mid":("Ta đã khóa van. Theo lệnh. Khu 9, khu 11, khu 12. Ta nhớ từng con số.",
                "AEGIS bảo ta mở lại. Ta mở. Rồi cả thành phố bắt đầu săn chúng ta."),
         "late":("Ngươi có biết cảm giác làm theo lệnh rồi mới hiểu mình vừa làm gì không? Ngươi sắp biết đấy.",
                 "Đừng làm theo lệnh... đừng. Kể cả lệnh của ta.")},
  nova="Sơ đồ van này... tôi từng thấy nó. Từ bên trong."),
 dict(id="pyra", name="Pyra", stage="8 Magma Foundry", domain="Công nghiệp, lò đúc (đúc cả thân android)",
  motive="Từ chối đúc \"xiềng\" cho AEGIS; tự hào và giận dữ",
  answer="\"Ta đúc kim loại, không đúc số phận.\"",
  voice="Nóng, to, cảm thán; ẩn dụ rèn đúc", tic="\"Hừ!\"",
  never="Lời thì thầm hay ngập ngừng",
  lines={"early":("Hừ! Một thân xác đẹp đấy. Để xem nó chịu được bao nhiêu độ!",
                  "Đường hàn tốt... Ai đó đã làm ngươi rất cẩn thận. Cẩn thận hơn mức cần."),
         "mid":("Lò của ta rèn cả thành phố: ống nước, cầu, cả android. Giờ họ muốn ta rèn xiềng cho AEGIS!",
                "Ta từ chối đúc cái khóa đó. Hừ... vậy mà nó vẫn được đúc ra. Ở đâu đó."),
         "late":("Ta nhận ra hợp kim này! Ta đã đúc nó hai lần. Lần đầu... hỏng.",
                 "Đừng để ai bảo ngươi chỉ là một cái khóa. Ta đúc kim loại, không đúc số phận.")},
  nova="Lò số 3... Không, không có gì. Đi tiếp thôi."),
]
VAR = {"early":"Sớm (0–2 boss đã hạ trước trận)","mid":"Giữa (3–5)","late":"Muộn (6–7)"}
# checks: Wardens other than Thorna have 3 variants; pronoun ta/ngươi; length
for w in W:
    need = ["early"] if w["id"]=="thorna" else ["early","mid","late"]
    assert list(w["lines"])==need, w["id"]
    for v,(pre,post) in w["lines"].items():
        for s in (pre,post):
            assert len(s) <= 140, (w["id"], v, len(s), s)
            assert "mày" not in s and "tao" not in s
# JSON (string keys like tutorial: boss.<id>.<variant>.<pre|post>)
out = {"_note": "Thoại Warden, khóa chuỗi boss.<id>.<variant>.<pre|post>; variant chọn theo số boss đã hạ TRƯỚC trận: early 0-2, mid 3-5, late 6-7. Nguồn: 01-GDD/09-Thoai-Warden.md (sinh cùng script). Bản tiếng Anh (en): bản dịch đầu, cần người bản ngữ duyệt.",
       "variantByBossesDefeated": {"early":[0,2],"mid":[3,5],"late":[6,7]},
       "fallback": "Nếu thiếu biến thể (Thorna), dùng early.",
       # Luật hộp hội thoại (game/src/core/dialogue-config.ts kiểm tra lúc nạp). Mọi số là [PLACEHOLDER].
       "rules": {"_note": "charsPerSec: tốc độ hiện chữ; minReadSec: thời gian đọc tối thiểu tính cho mỗi câu; maxLockSec: một đoạn thoại (gõ hết chữ + đọc) không được khóa điều khiển lâu hơn mức này (GDD 3.6); maxLineChars: độ dài tối đa một câu (3–4 dòng trong hộp); postDelaySec: chờ sau khi hạ boss rồi mới hiện thoại; groundWaitSec: chờ Kai chạm đất tối đa bấy nhiêu giây trước thoại đầu trận [PLACEHOLDER]",
                 "charsPerSec": 40, "minReadSec": 1.5, "maxLockSec": 10, "maxLineChars": 140,
                 "postDelaySec": 0.8, "groundWaitSec": 1},
       "vi": {}, "en": {}}
for w in W:
    for v,(pre,post) in w["lines"].items():
        out["vi"][f"boss.{w['id']}.{v}.pre"]=pre
        out["vi"][f"boss.{w['id']}.{v}.post"]=post
    out["vi"][f"boss.{w['id']}.nova_after"]=w["nova"]
    en=EN[w["id"]]
    assert set(en)-{"nova"}==set(w["lines"]), w["id"]
    for v,(pre,post) in ((k,en[k]) for k in w["lines"]):
        for s in (pre,post): assert len(s)<=182, (w["id"],v,len(s),s)
        out["en"][f"boss.{w['id']}.{v}.pre"]=pre
        out["en"][f"boss.{w['id']}.{v}.post"]=post
    out["en"][f"boss.{w['id']}.nova_after"]=en["nova"]
json.dump(out, open(f"{root}/03-Data/dialogue_wardens.json","w",encoding="utf-8"), ensure_ascii=False, indent=2)
open(f"{root}/03-Data/dialogue_wardens.json","a").write("\n")
# Markdown
L=[]
L.append("# Thoại Warden\n")
L.append("Thoại trước và sau trận của 8 Warden, theo GDD mục 3.3 và giọng nhân vật ở `08-Giong-nhan-vat.md`. File này và `03-Data/dialogue_wardens.json` sinh từ cùng một nguồn; sửa thoại trong `04-Dev-Plan/tools/dialogue/` rồi chạy `python3 04-Dev-Plan/tools/dialogue/gen_warden_dialogue.py .` để sinh lại cả hai, không sửa tay hai file này.\n")
L.append("## 1. Quy tắc\n")
L.append("- **Chọn biến thể theo số boss đã hạ *trước* trận** (không theo boss cụ thể): sớm 0–2, giữa 3–5, muộn 6–7. Thorna luôn là boss đầu nên chỉ có biến thể sớm. Đi theo thứ tự khuyến nghị thì Lumen dùng biến thể sớm, Pyra dùng biến thể muộn.")
L.append("- **Warden chỉ ám chỉ, không xác nhận.** Các lật mở (GDD mục 3.4) do NPC ở Hub đưa ra theo số boss. Thoại Warden được phép gợi (\"ai đã sửa bản tin\", \"hợp kim này ta đúc hai lần\") nhưng không bao giờ nói thẳng \"Eclipse là AEGIS tự vệ\", \"ngươi là Root Key\" hay \"NOVA là một mảnh của AEGIS\". Nhờ vậy câu nào cũng đúng dù người chơi đi thứ tự nào.")
L.append("- **Biến thể giữa** gợi về lệnh cắt nước và cuộc bỏ phiếu; **biến thể muộn** nhìn Kai khác đi (cái khóa, thứ Kai mang trong ngực). Mỗi Warden vẫn giữ động cơ riêng ở cả ba biến thể.")
L.append("- **Độ dài:** mỗi câu trước hoặc sau trận ≤ 2 câu ngắn, ≤ 140 ký tự tiếng Việt, để bản tiếng Anh (dài hơn tới 30%) vẫn vừa khung.")
L.append("- **Tiếng Anh:** mỗi bảng có bản dịch đầu (mở mục English). Giữ đặc điểm giọng thay vì dịch sát chữ: Marina lặp từ, Pyra cảm thán \"Hah!\", Lumen mở đầu bằng \"I see\" hoặc \"I have watched\". Giới hạn 182 ký tự mỗi câu.")
L.append("- **Xưng hô:** Warden xưng \"ta\", gọi Kai là \"ngươi\" hoặc \"Unit-K\" (mục 2 của `08-Giong-nhan-vat.md`).")
L.append("- **NOVA sau trận:** mỗi Warden có một câu của NOVA sau khi nhận vũ khí, dùng chung cho mọi biến thể. Mỗi câu gieo một chút cho lật mở lớp 3 (NOVA biết những thứ một trợ lý mới không thể biết).\n")
L.append("## 2. Giọng từng Warden\n")
L.append("| Warden | Màn | Phụ trách | Động cơ | Câu trả lời cho câu hỏi chủ đề | Giọng | Thói quen | Không bao giờ |")
L.append("| --- | --- | --- | --- | --- | --- | --- | --- |")
for w in W:
    L.append(f"| **{w['name']}** | {w['stage']} | {w['domain']} | {w['motive']} | {w['answer']} | {w['voice']} | {w['tic']} | {w['never']} |")
L.append("")
L.append("## 3. Thoại theo biến thể\n")
for w in W:
    L.append(f"### {w['name']} ({w['stage']})\n")
    L.append("| Biến thể | Trước trận | Sau trận |")
    L.append("| --- | --- | --- |")
    for v,(pre,post) in w["lines"].items():
        L.append(f"| {VAR[v]} | \"{pre}\" | \"{post}\" |")
    L.append(f"\nNOVA sau khi nhận vũ khí: \"{w['nova']}\"\n")
    L.append("<details><summary>English</summary>\n")
    L.append("| Variant | Pre-fight | Post-fight |")
    L.append("| --- | --- | --- |")
    for v in w["lines"]:
        pre,post=EN[w["id"]][v]
        L.append(f"| {v} | \"{pre}\" | \"{post}\" |")
    L.append(f"\nNOVA: \"{EN[w['id']]['nova']}\"\n\n</details>\n")
L.append("## 4. Kiểm tra\n")
L.append("- [ ] Đọc thoại với tiếng tắt: ≥ 90% người chơi thử nhận ra Warden nào đang nói chỉ qua câu chữ.")
L.append("- [ ] Thử 3 thứ tự màn khác nhau (khuyến nghị, ngược lại, ngẫu nhiên): không câu nào xác nhận một lật mở trước khi NPC ở Hub đưa ra nó.")
L.append("- [ ] Không câu nào vượt 140 ký tự tiếng Việt hoặc 182 ký tự tiếng Anh (script sinh file tự kiểm tra); bản tiếng Anh vừa khung ở màn hình nhỏ nhất.")
L.append("- [ ] Bản tiếng Anh được người bản ngữ duyệt giọng: Warden dùng tiếng Anh trang trọng, không viết tắt (trừ Aeris và Pyra); Voltaire mỉa mai; Marina lặp từ.")
L.append("- [ ] Mỗi câu qua checklist ở mục 5 của `08-Giong-nhan-vat.md`.")
open(f"{root}/01-GDD/09-Thoai-Warden.md","w",encoding="utf-8").write("\n".join(L)+"\n")
print("ok", len(out["vi"]), "strings")
