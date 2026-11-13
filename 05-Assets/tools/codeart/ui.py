"""Chân dung hộp hội thoại (30x30, đúng cỡ ô chân dung trong game)."""
from pix import Layer, C

S = 30


def _bg(col):
    f = Layer(S, S)
    f.rect(0, 0, S - 1, S - 1, col)
    return f


def nova():
    """NOVA: trí tuệ dẫn đường, hiện thành khối sáng hologram."""
    f = _bg(C['navy0'])
    for y in range(2, S, 4):
        f.rect(0, y, S - 1, y, C['navy1'])              # vạch quét hologram
    p = Layer(S, S)
    p.poly([(15, 4), (24, 13), (15, 26), (6, 13)], C['cyan1'])
    p.bevel(C['cyan3'], C['cyan0'])
    f.paste(p)
    f.poly([(15, 9), (20, 13), (15, 20), (10, 13)], C['cyan2'])
    f.rect(12, 12, 13, 13, C['white']); f.rect(17, 12, 18, 13, C['white'])
    f.rect(13, 17, 17, 17, C['cyan3'])
    return f


def thorna():
    f = _bg(C['green0'])
    p = Layer(S, S)
    p.ellipse(15, 18, 9, 9, C['brown1'])
    p.bevel(C['tan'], C['brown0'])
    f.paste(p)
    q = Layer(S, S)
    for dx, dy in ((-8, -2), (-3, -5), (3, -5), (8, -2)):
        q.ellipse(15 + dx, 9 + dy, 5, 4, C['green1'])
    q.bevel(C['green2'], C['green0'])
    f.paste(q)
    f.rect(10, 17, 12, 18, C['lime']); f.rect(18, 17, 20, 18, C['lime'])
    f.line(11, 23, 19, 23, C['brown0']); f.line(8, 14, 12, 15, C['brown0']); f.line(22, 14, 18, 15, C['brown0'])
    f.set(6, 21, C['pink']); f.set(24, 22, C['pink'])
    return f


def kai():
    f = _bg(C['navy1'])
    p = Layer(S, S)
    p.ellipse(15, 15, 10, 10, C['steel0'])
    p.line(6, 8, 2, 4, C['steel0'], 2); p.line(5, 13, 1, 11, C['steel0'], 2)     # vây mũ
    p.bevel(C['steel2'], C['navy2'])
    f.paste(p)
    f.rect(13, 13, 24, 16, C['cyan3']); f.rect(13, 16, 24, 16, C['cyan2']); f.rect(13, 13, 14, 16, C['cyan1'])
    f.rect(8, 25, 22, 29, C['pale']); f.rect(8, 25, 22, 25, C['white0'])           # khăn
    return f


def boss_generic():
    """Chân dung chung cho Warden chưa có hình riêng."""
    f = _bg(C['purple0'])
    p = Layer(S, S)
    p.poly([(15, 4), (25, 12), (22, 26), (8, 26), (5, 12)], C['steel0'])
    p.bevel(C['steel1'], C['navy1'])
    f.paste(p)
    f.rect(9, 14, 13, 15, C['red2']); f.rect(17, 14, 21, 15, C['red2'])
    f.rect(12, 21, 18, 21, C['navy0'])
    return f


PORTRAITS = {'portrait_nova': nova, 'portrait_thorna': thorna, 'portrait_kai': kai, 'portrait_warden': boss_generic}


# ---- Giao diện (đợt 3) ----
import math, random

# Phông điểm ảnh 5x7 cho logo (chỉ các chữ cần dùng).
GLYPHS = {
    'C': ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
    'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
    'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    'V': ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
    'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    'N': ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
    'G': ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
    'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
}


def _word(layer, text, x, y, scale, col):
    for ch in text:
        if ch != ' ':
            for r, row in enumerate(GLYPHS[ch]):
                for c, bit in enumerate(row):
                    if bit == '1':
                        layer.rect(x + c * scale, y + r * scale, x + c * scale + scale - 1, y + r * scale + scale - 1, col)
        x += 6 * scale
    return x


def logo():
    """Logo 200x64: CYBER (cyan) trên, VANGUARD (trắng) dưới, gạch năng lượng ở giữa."""
    f = Layer(200, 64)
    a = Layer(200, 64); _word(a, 'CYBER', 40, 2, 4, C['cyan2']); a.bevel(C['cyan3'], C['cyan1']); f.paste(a)
    b = Layer(200, 64); _word(b, 'VANGUARD', 4, 34, 4, C['pale']); b.bevel(C['white'], C['steel1']); f.paste(b)
    f.rect(4, 31, 195, 31, C['cyan1']); f.rect(60, 31, 140, 31, C['cyan3'])
    return f.outline(C['ink'])


def menu_bg():
    """Nền màn hình chính 320x192: thành phố Nova Prime về đêm, tháp trung tâm phát sáng."""
    rnd = random.Random(11)
    f = Layer(320, 192)
    f.rect(0, 0, 319, 191, C['ink'])
    f.rect(0, 110, 319, 191, C['navy0'])
    for _ in range(70):
        f.set(rnd.randrange(320), rnd.randrange(100), C['navy2'] if rnd.random() < 0.8 else C['steel1'])
    x = 0
    while x < 320:                                    # dãy nhà xa
        w, h = 10 + rnd.randrange(18), 30 + rnd.randrange(60)
        f.rect(x, 191 - h - 30, x + w, 191, C['navy0'])
        for wy in range(191 - h - 26, 186, 6):
            for wx in range(x + 2, x + w - 1, 4):
                if rnd.random() < 0.18:
                    f.set(wx, wy, C['cyan0'])
        x += w + 2
    f.poly([(150, 191), (170, 191), (165, 40), (155, 40)], C['navy1'])     # tháp trung tâm (Citadel)
    f.rect(159, 28, 160, 40, C['navy2']); f.rect(158, 24, 161, 27, C['purple1']); f.set(159, 25, C['pink'])
    for wy in range(50, 190, 9):
        f.rect(157, wy, 162, wy, C['cyan1'])
    x = 0
    while x < 320:                                    # dãy nhà gần
        w, h = 16 + rnd.randrange(22), 20 + rnd.randrange(46)
        f.rect(x, 191 - h, x + w, 191, C['navy1'])
        f.rect(x, 191 - h, x + w, 191 - h, C['navy2'])
        for wy in range(191 - h + 4, 188, 5):
            for wx in range(x + 2, x + w - 1, 4):
                r = rnd.random()
                if r < 0.22:
                    f.set(wx, wy, C['yellow'] if r < 0.05 else C['cyan1'])
        x += w + 1
    return f


def panel():
    """Khung 9 mảnh 24x24 (3x3 ô 8x8): nền tối, viền cyan, góc vát sáng."""
    f = Layer(24, 24)
    f.rect(0, 0, 23, 23, C['navy0'])
    f.rect(0, 0, 23, 0, C['cyan1']); f.rect(0, 23, 23, 23, C['cyan0'])
    f.rect(0, 0, 0, 23, C['cyan1']); f.rect(23, 0, 23, 23, C['cyan0'])
    f.rect(1, 1, 22, 1, C['navy2']); f.rect(1, 1, 1, 22, C['navy2'])
    for x, y in ((0, 0), (23, 0), (0, 23), (23, 23)):
        f.set(x, y, None)
    for x, y in ((1, 1), (22, 1), (1, 22), (22, 22)):
        f.set(x, y, C['cyan3'])
    f.rect(3, 3, 5, 3, C['cyan2'])                    # vạch trang trí góc trên trái
    return f


def hud_frame():
    """Khung thanh máu và năng lượng 104x22 (ô trống để game tô phần đầy)."""
    f = Layer(104, 22)
    f.poly([(0, 0), (103, 0), (99, 12), (72, 12), (68, 21), (0, 21)], C['navy0'])
    f.rect(0, 0, 103, 0, C['cyan1']); f.rect(0, 0, 0, 21, C['cyan1'])
    f.rect(1, 21, 67, 21, C['cyan0'])
    f.rect(2, 2, 12, 9, C['navy2']); f.rect(6, 3, 8, 8, C['green2']); f.rect(4, 5, 10, 6, C['green2'])   # biểu tượng máu
    f.rect(15, 3, 96, 8, C['ink'])                     # rãnh máu (82x6)
    f.rect(2, 12, 12, 19, C['navy2']); f.poly([(8, 13), (5, 16), (8, 16), (6, 19), (10, 15), (7, 15)], C['cyan3'])
    f.rect(15, 14, 64, 18, C['ink'])                   # rãnh năng lượng (50x5)
    return f


def boss_frame():
    """Khung thanh máu boss 132x12."""
    f = Layer(132, 12)
    f.poly([(4, 0), (127, 0), (131, 6), (127, 11), (4, 11), (0, 6)], C['navy0'])
    f.rect(4, 0, 127, 0, C['red1']); f.rect(4, 11, 127, 11, C['red0'])
    f.rect(6, 3, 125, 8, C['ink'])                     # rãnh máu (120x6)
    f.set(2, 6, C['red2']); f.set(129, 6, C['red2'])
    return f


def icons():
    """Biểu tượng 16x16: [Arc Cannon, Vine Lash, tạm dừng]."""
    out = []
    a = Layer(16, 16); a.rect(2, 6, 11, 10, C['steel1']); a.rect(11, 5, 12, 11, C['cyan2']); a.rect(13, 7, 14, 9, C['cyan3'])
    a.rect(3, 7, 9, 7, C['pale']); out.append(a.outline(C['ink']))
    b = Layer(16, 16)
    for i in range(12):
        b.set(2 + i, 8 + round(math.sin(i * 0.9) * 3), C['green2'])
    b.set(13, 6, C['pink']); b.set(5, 4, C['pink']); b.set(9, 12, C['pink']); out.append(b.outline(C['green0']))
    p = Layer(16, 16); p.rect(4, 3, 6, 12, C['pale']); p.rect(9, 3, 11, 12, C['pale']); out.append(p.outline(C['ink']))
    return out


IMAGES = {'ui_logo': logo, 'ui_menu_bg': menu_bg, 'ui_hud_frame': hud_frame, 'ui_boss_frame': boss_frame}
UI_SHEETS = {'ui_panel': (lambda: [panel()], 8, 8), 'ui_icons': (icons, 16, 16)}   # id → (hàm, frame_w, frame_h)
