"""Đạn và hiệu ứng (khung theo manifest.csv)."""
import math
from pix import Layer, C


def arc_shot():      # 16x16 x3: viên đạn Arc Cannon bay sang phải
    out = []
    for i in range(3):
        f = Layer(16, 16)
        f.rect(4, 7, 11, 8, C['cyan2']); f.rect(7, 6, 11, 9, C['cyan2'])
        f.rect(8, 7, 11, 8, C['white']); f.rect(12, 7, 12, 8, C['cyan3'])
        f.rect(2 - i % 2, 7 + i % 2, 3, 7 + i % 2, C['cyan1'])
        out.append(f)
    return out


def arc_mid():       # 16x16 x3: đạn nạp vừa
    out = []
    for i in range(3):
        f = Layer(16, 16)
        f.ellipse(9, 7.5, 4, 3, C['cyan2']); f.ellipse(10, 7.5, 2.4, 1.6, C['white'])
        f.rect(2, 7, 5, 8, C['cyan1']); f.set(1 + i % 2, 6 + i, C['cyan3'])
        out.append(f)
    return out


def arc_charged():   # 32x32 x4: đạn nạp đầy
    out = []
    for i in range(4):
        f = Layer(32, 32)
        f.ellipse(19, 15.5, 8, 6, C['cyan1']); f.ellipse(20, 15.5, 6.5, 4.6, C['cyan3'])
        f.ellipse(21, 15.5, 4, 2.6, C['white'])
        for k in range(3):                              # đuôi lửa điện
            y = 12 + k * 3 + (i + k) % 2
            f.rect(4 + (i + k) % 3 * 2, y, 12, y, C['cyan2'])
        f.set(27, 10 + i % 2 * 2, C['white']); f.set(25, 21 - i % 2 * 2, C['cyan3'])
        out.append(f)
    return out


def enemy_shot():    # 16x16 x3: đạn kẻ địch (đỏ cam, khác hẳn đạn người chơi)
    out = []
    for i in range(3):
        f = Layer(16, 16)
        f.ellipse(7.5, 7.5, 3.2 + (i % 2) * 0.5, 3.2 + (i % 2) * 0.5, C['red2'])
        f.ellipse(7.5, 7.5, 1.8, 1.8, C['yellow']); f.set(7, 7, C['cream'])
        out.append(f.outline(C['red0']))
    return out


def muzzle():        # 16x16 x3
    out = []
    for i in range(3):
        f = Layer(16, 16)
        r = [5, 4, 2][i]
        f.poly([(2, 8 - r), (2 + r * 2, 8), (2, 8 + r)], C['cyan3'] if i < 2 else C['cyan1'])
        if i == 0:
            f.poly([(2, 6), (7, 8), (2, 10)], C['white'])
        out.append(f)
    return out


def hit_spark():     # 16x16 x4
    out = []
    for i in range(4):
        f = Layer(16, 16)
        r = 2 + i * 1.6
        for k in range(4):
            a = k * math.pi / 2 + math.pi / 4
            f.line(8 + math.cos(a) * (r - 2), 8 + math.sin(a) * (r - 2), 8 + math.cos(a) * r, 8 + math.sin(a) * r,
                   C['white'] if i < 2 else C['yellow'])
        if i < 2:
            f.ellipse(7.5, 7.5, 2 - i, 2 - i, C['white'])
        out.append(f)
    return out


def explosion_small():   # 32x32 x6
    out = []
    for i in range(6):
        f = Layer(32, 32)
        t = i / 5
        r = 4 + t * 9
        if i < 4:
            f.ellipse(15.5, 15.5, r, r, C['orange'] if i > 0 else C['white'])
            f.ellipse(15.5, 15.5, r * 0.65, r * 0.65, C['yellow'] if i > 0 else C['cream'])
            if i < 2:
                f.ellipse(15.5, 15.5, r * 0.35, r * 0.35, C['white'])
        for k in range(8):                              # mảnh văng
            a = k / 8 * 2 * math.pi + 0.4
            d = 5 + t * 10
            f.set(15.5 + math.cos(a) * d, 15.5 + math.sin(a) * d, C['red2'] if i > 2 else C['yellow'])
        if i >= 3:                                      # khói tàn
            f.ellipse(15.5, 15.5 - (i - 3) * 2, 7 - (i - 3) * 2, 6 - (i - 3) * 2, C['steel0'])
        out.append(f)
    return out


def charge(level):   # 32x32 x4: vòng năng lượng quanh nòng khi nạp
    out = []
    for i in range(4):
        f = Layer(32, 32)
        n = 6 if level == 1 else 10
        r = 11 - i * 2.5
        col = C['cyan2'] if level == 1 else C['white']
        for k in range(n):
            a = k / n * 2 * math.pi + i * 0.5
            f.set(15.5 + math.cos(a) * r, 15.5 + math.sin(a) * r, col)
            if level == 2:
                f.set(15.5 + math.cos(a) * (r + 2), 15.5 + math.sin(a) * (r + 2), C['cyan3'])
        out.append(f)
    return out


def core_bit():      # 16x16 x4: Core Bit xoay
    out = []
    for i in range(4):
        f = Layer(16, 16)
        w = [4, 3, 1, 3][i]
        f.poly([(8, 3), (8 + w, 8), (8, 13), (8 - w, 8)], C['yellow'])
        f.line(8, 4, 8 - w + 1, 8, C['cream'])
        out.append(f.outline(C['brown0']))
    return out


def health():        # 16x16 x2: viên máu
    out = []
    for i in range(2):
        f = Layer(16, 16)
        f.ellipse(7.5, 8, 4, 4, C['green2']); f.rect(7, 6, 8, 10, C['white']); f.rect(5, 8, 10, 8, C['white'])
        if i:
            f.set(4, 5, C['lime'])
        out.append(f.outline(C['green0']))
    return out


SHEETS = {  # id → (hàm, frame_w, fps, lặp, đường dẫn)
    'fx_arc_shot': (arc_shot, 16, 12, True), 'fx_arc_mid': (arc_mid, 16, 12, True),
    'fx_arc_charged': (arc_charged, 32, 12, True), 'fx_enemy_shot': (enemy_shot, 16, 10, True),
    'fx_muzzle': (muzzle, 16, 24, False), 'fx_hit_spark': (hit_spark, 16, 20, False),
    'fx_explosion_small': (explosion_small, 32, 14, False),
    'fx_charge_1': (lambda: charge(1), 32, 12, True), 'fx_charge_full': (lambda: charge(2), 32, 14, True),
    'obj_core_bit': (core_bit, 16, 8, True), 'obj_health': (health, 16, 4, True),
}


# ---- Đòn của boss, kẻ địch và vũ khí boss (đợt 3) ----

def shockwave():     # 16x16 x3: sóng chấn động chạy sát sàn (hình gốc chạy sang phải)
    out = []
    for i in range(3):
        f = Layer(16, 16)
        h = [9, 11, 8][i]
        f.poly([(2, 15), (13, 15), (11, 15 - h), (6, 15 - h * 0.5)], C['orange'])
        f.poly([(5, 15), (11, 15), (10, 15 - h * 0.6)], C['yellow'])
        f.set(10, 15 - h, C['cream']); f.set(3 + i, 12 - i, C['yellow'])
        out.append(f.outline(C['red0']))
    return out


def drop():          # 16x16 x2: đạn rơi của boss xám (Mưa đạn)
    out = []
    for i in range(2):
        f = Layer(16, 16)
        f.poly([(8, 2), (11, 9), (8, 13), (5, 9)], C['red2'])
        f.poly([(8, 6), (9, 9), (8, 11), (7, 9)], C['yellow'])
        f.set(8, 1 - i, C['orange']); f.set(8, 0, C['red1'] if i else C['orange'])
        out.append(f.outline(C['red0']))
    return out


def seed():          # 16x16 x3: hạt rơi của Thorna (Hoa Nở)
    out = []
    for i in range(3):
        f = Layer(16, 16)
        f.ellipse(7.5, 9, 3.2, 4, C['green2']); f.rect(7, 7, 7, 9, C['lime']); f.set(8, 12, C['green1'])
        f.set(7 + (i - 1), 3, C['lime']); f.set(8, 4 - i % 2, C['green1'])     # đuôi lá
        out.append(f.outline(C['green0']))
    return out


def bomb():          # 16x16 x2: hạt nổ (Bướm Sắt, Bramble Golem)
    out = []
    for i in range(2):
        f = Layer(16, 16)
        f.ellipse(7.5, 8, 4, 4, C['purple1']); f.rect(6, 6, 7, 7, C['magenta'])
        f.rect(7, 9, 8, 10, C['lime'] if i == 0 else C['cream'])
        f.set(8, 3, C['brown1']); f.set(9, 2, C['yellow'] if i else C['orange'])
        out.append(f.outline(C['ink']))
    return out


def root_seg():      # 16x16 x2: [ngọn, thân] của cột rễ trồi lên
    tip, body = Layer(16, 16), Layer(16, 16)
    p = Layer(16, 16)
    p.poly([(8, 1), (13, 16), (3, 16)], C['brown1']); p.bevel(C['tan'], C['brown0'])
    tip.paste(p); tip.set(8, 2, C['pink']); tip.set(5, 11, C['pink']); tip.set(11, 9, C['pink'])
    q = Layer(16, 16)
    q.rect(3, 0, 12, 15, C['brown1']); q.bevel(C['tan'], C['brown0'])
    q.rect(3, 0, 12, 0, C['brown1']); q.rect(3, 15, 12, 15, C['brown1'])
    body.paste(q)
    for x, y in ((5, 3), (9, 8), (6, 13)):
        body.line(x, y, x + 2, y + 2, C['brown0'])
    body.set(2, 5, C['pink']); body.set(13, 11, C['pink'])
    return [tip.outline(C['ink']), body.outline(C['ink'])]


def _whip_seg(col, hi, lo, thorn_col):
    """[đốt thân, đốt ngọn] của một dây quất nằm ngang, ngọn ở bên phải."""
    body, tip = Layer(16, 16), Layer(16, 16)
    p = Layer(16, 16)
    for x in range(16):
        y = 7 + (1 if (x // 4) % 2 else 0)
        p.rect(x, y, x, y + 2, col)
    p.bevel(hi, lo)
    body.paste(p)
    for x in (3, 11):
        body.set(x, 5 + (x // 4) % 2, thorn_col); body.set(x + 2, 11, thorn_col)
    q = Layer(16, 16)
    q.poly([(0, 6), (10, 7), (15, 8), (10, 9), (0, 10)], col); q.bevel(hi, lo)
    tip.paste(q); tip.set(14, 8, thorn_col); tip.set(4, 5, thorn_col)
    return [body.outline(C['ink']), tip.outline(C['ink'])]


def lash_seg():      # Dây Quất của Thorna
    return _whip_seg(C['green1'], C['green2'], C['green0'], C['pink'])


def sweep_seg():     # roi Vine Lash của người chơi: sáng hơn để khác đòn của boss
    return _whip_seg(C['green2'], C['lime'], C['green1'], C['cream'])


def secret():        # 16x16 x4: vật phẩm bí mật (mảnh dữ liệu phát sáng)
    out = []
    for i in range(4):
        f = Layer(16, 16)
        w = [5, 4, 2, 4][i]
        f.poly([(8, 2), (8 + w, 6), (8 + w, 10), (8, 14), (8 - w, 10), (8 - w, 6)], C['cyan2'])
        f.poly([(8, 4), (8 + w - 2, 7), (8, 10)], C['cyan3'])
        f.set(8 - max(1, w - 2), 6, C['white'])
        out.append(f.outline(C['cyan0']))
    return out


def target():        # 16x32 x3: bia tập bắn [bình thường, trúng, đã hạ]
    out = []
    for i in range(3):
        f = Layer(16, 32)
        if i == 2:
            f.rect(7, 22, 8, 31, C['steel0']); f.rect(4, 30, 11, 31, C['steel0'])
        else:
            f.rect(7, 20, 8, 31, C['steel0']); f.rect(4, 30, 11, 31, C['steel0'])
            f.ellipse(7.5, 14, 6, 7, C['white'] if i == 1 else C['yellow'])
            if i == 0:
                f.ellipse(7.5, 14, 4, 5, C['white0']); f.ellipse(7.5, 14, 2, 2.6, C['red2'])
        out.append(f.outline(C['ink']))
    return out


SHEETS.update({
    'fx_shockwave': (shockwave, 16, 12, True), 'fx_drop': (drop, 16, 12, True),
    'fx_seed': (seed, 16, 10, True), 'fx_bomb': (bomb, 16, 8, True),
    'fx_root': (root_seg, 16, 0, False), 'fx_lash': (lash_seg, 16, 0, False),
    'fx_sweep': (sweep_seg, 16, 0, False),
    'obj_secret': (secret, 16, 8, True), 'obj_target': (target, 16, 0, False),
})
