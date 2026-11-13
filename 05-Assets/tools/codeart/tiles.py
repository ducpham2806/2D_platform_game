"""Tileset 128x128 (8x8 ô 16x16) cho hai chủ đề: lab (Prototype, xám) và verdant (Stage 1).

Bố cục ô (giống nhau ở mọi chủ đề, game đọc theo chỉ số):
  0 bục một chiều · 1 gai · 2 cửa · 3 vật chắn (rễ khô) · 4 cột checkpoint tắt · 5 cột checkpoint sáng
  16..31 khối đặc tự ghép theo 4 hàng xóm: 16 + mặt nạ (1 = trống phía trên, 2 = phải, 4 = dưới, 8 = trái)
"""
import random
from pix import Layer, C

T = 16


def _solid(theme, mask, seed):
    rnd = random.Random(seed)
    t = Layer(T, T)
    up, right, down, left = mask & 1, mask & 2, mask & 4, mask & 8
    if theme == 'lab':
        t.rect(0, 0, 15, 15, C['navy2'])
        # tấm kim loại: rãnh tối, đinh tán
        t.rect(0, 15, 15, 15, C['navy1']); t.rect(15, 0, 15, 15, C['navy1'])
        t.rect(0, 0, 15, 0, C['steel0']); t.rect(0, 0, 0, 15, C['steel0'])
        for x, y in ((3, 3), (12, 3), (3, 12), (12, 12)):
            t.set(x, y, C['navy1'])
        if up:
            t.rect(0, 0, 15, 2, C['steel1']); t.rect(0, 0, 15, 0, C['pale']); t.rect(0, 3, 15, 3, C['navy1'])
        if down:
            t.rect(0, 13, 15, 15, C['steel0']); t.rect(0, 15, 15, 15, C['navy0'])
        if left:
            t.rect(0, 0, 1, 15, C['steel1']); t.rect(0, 0, 0, 15, C['steel2'])
        if right:
            t.rect(14, 0, 15, 15, C['steel0']); t.rect(15, 0, 15, 15, C['navy0'])
    else:
        t.rect(0, 0, 15, 15, C['brown0'])
        # đất lẫn rễ và mảnh kim loại
        for _ in range(4):
            t.set(rnd.randrange(16), rnd.randrange(16), C['brown1'])
        for _ in range(3):
            x, y = rnd.randrange(15), rnd.randrange(15)
            t.rect(x, y, x + 1, y, C['navy1'])
        for _ in range(2):
            x, y = rnd.randrange(13), rnd.randrange(4, 14)
            t.line(x, y, x + 3, y + 1, C['navy0'])
        if left:
            t.rect(0, 0, 1, 15, C['brown1']); t.rect(0, 0, 0, 15, C['tan'])
        if right:
            t.rect(14, 0, 15, 15, C['brown0']); t.rect(15, 0, 15, 15, C['navy0'])
        if down:
            t.rect(0, 14, 15, 15, C['navy0'])
            for x in range(1, 16, 5):
                t.set(x + rnd.randrange(2), 15, C['brown1'])
        if up:
            t.rect(0, 0, 15, 3, C['green1']); t.rect(0, 0, 15, 0, C['lime']); t.rect(0, 1, 15, 1, C['green2'])
            for x in range(16):                       # tua cỏ rủ xuống so le
                if rnd.random() < 0.55:
                    t.set(x, 4, C['green1'])
                    if rnd.random() < 0.4:
                        t.set(x, 5, C['green0'])
            for x in (2, 9, 13):
                t.set(x, 0, C['cream'] if x == 9 else C['lime'])
    return t


def _oneway(theme):
    t = Layer(T, T)
    if theme == 'lab':
        t.rect(0, 0, 15, 3, C['steel1']); t.rect(0, 0, 15, 0, C['pale']); t.rect(0, 3, 15, 3, C['navy1'])
        for x in (2, 8, 13):
            t.set(x, 2, C['navy2'])
    else:
        t.rect(0, 0, 15, 3, C['brown1']); t.rect(0, 0, 15, 0, C['green2']); t.rect(0, 3, 15, 3, C['brown0'])
        for x in (1, 6, 11):
            t.set(x, 0, C['lime']); t.set(x + 2, 4, C['green1'])
    return t


def _spike(theme):
    t = Layer(T, T)
    body, tip, dark = (C['steel1'], C['white0'], C['steel0']) if theme == 'lab' else (C['red1'], C['pink'], C['red0'])
    for x0 in (0, 8):
        t.poly([(x0, 16), (x0 + 8, 16), (x0 + 4, 5)], body)
        t.line(x0 + 4.5, 6, x0 + 7, 15, dark)
        t.rect(x0 + 3, 5, x0 + 4, 7, tip)
    return t.outline(C['ink'])


def _gate():
    t = Layer(T, T)
    t.rect(0, 0, 15, 15, C['steel0']); t.rect(0, 0, 1, 15, C['steel1']); t.rect(14, 0, 15, 15, C['navy2'])
    for y in range(-16, 16, 6):                       # sọc cảnh báo chéo
        for k in range(3):
            t.line(5, y + k + 5, 10, y + k, C['yellow'])
    t.rect(0, 0, 15, 0, C['navy1']); t.rect(0, 15, 15, 15, C['navy1'])
    return t


def _barrier():
    rnd = random.Random(7)
    t = Layer(T, T)
    t.rect(0, 0, 15, 15, C['brown0'])
    for x in range(1, 16, 3):
        t.line(x, 0, x + rnd.randrange(-1, 2), 15, C['brown1'], 2)
    for _ in range(6):
        t.set(rnd.randrange(16), rnd.randrange(16), C['tan'])
    t.rect(0, 0, 15, 0, C['navy0']); t.rect(0, 15, 15, 15, C['navy0'])
    return t


def _checkpoint(on):
    t = Layer(T, T)
    t.rect(7, 3, 8, 15, C['steel0']); t.rect(7, 3, 7, 15, C['steel1'])
    t.rect(5, 14, 10, 15, C['steel0'])
    t.rect(5, 0, 10, 4, C['cyan3'] if on else C['navy2'])
    t.rect(6, 1, 9, 3, C['white'] if on else C['navy1'])
    return t.outline(C['ink'])


def tileset(theme):
    sheet = Layer(128, 128)
    put = lambda i, tile: sheet.paste(tile, (i % 8) * T, (i // 8) * T)
    put(0, _oneway(theme)); put(1, _spike(theme)); put(2, _gate()); put(3, _barrier())
    put(4, _checkpoint(False)); put(5, _checkpoint(True))
    for mask in range(16):
        put(16 + mask, _solid(theme, mask, 100 + mask))
    return sheet.image()
