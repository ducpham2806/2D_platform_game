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
