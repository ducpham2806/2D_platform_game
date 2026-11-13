"""Nền parallax 640x192, lặp ngang liền mạch (mọi hình vẽ đều lặp theo chu kỳ 640)."""
import math, random
from pix import Layer, C

W, H = 640, 192


def _wrap_rect(l, x0, y0, x1, y1, c):
    for dx in (-W, 0, W):
        l.rect(x0 + dx, y0, x1 + dx, y1, c)


def lab_far():
    rnd = random.Random(1)
    l = Layer(W, H)
    l.rect(0, 0, W - 1, H - 1, C['ink'])
    for x in range(0, W, 64):                           # cột xa
        l.rect(x + 20, 0, x + 27, H - 1, C['navy0'])
    for y in (40, 120):
        l.rect(0, y, W - 1, y + 2, C['navy0'])
    for _ in range(40):                                 # đèn nhỏ
        x, y = rnd.randrange(W), rnd.randrange(H)
        l.set(x, y, C['navy2'] if rnd.random() < 0.7 else C['cyan0'])
    return l.image()


def lab_mid():
    rnd = random.Random(2)
    l = Layer(W, H)
    for x in range(0, W, 160):                          # khung giàn và ống
        _wrap_rect(l, x + 60, 0, x + 71, H - 1, C['navy1'])
        _wrap_rect(l, x + 60, 0, x + 61, H - 1, C['navy2'])
        for y in range(16, H, 48):
            _wrap_rect(l, x + 52, y, x + 79, y + 3, C['navy1'])
            l.set(x + 66, y + 1, C['cyan1'])
    for x in range(0, W, 320):
        _wrap_rect(l, x, 70, x + 319, 73, C['navy0'])
    return l.image()


def verdant_far():
    rnd = random.Random(3)
    l = Layer(W, H)
    l.rect(0, 0, W - 1, H - 1, C['ink'])
    l.rect(0, 96, W - 1, H - 1, C['navy0'])
    for cx in (90, 300, 520):                           # vòm nhà kính xa
        for dx in (-W, 0, W):
            l.ellipse(cx + dx, 150, 90, 70, C['navy0'])
            for k in range(-80, 81, 20):
                l.line(cx + dx + k, 150, cx + dx + k * 0.3, 82, C['navy1'])
    for _ in range(50):
        x, y = rnd.randrange(W), rnd.randrange(80)
        l.set(x, y, C['navy2'] if rnd.random() < 0.8 else C['cyan0'])
    return l.image()


def verdant_mid():
    rnd = random.Random(4)
    l = Layer(W, H)
    for x in range(30, W, 128):                         # thân cây và dây leo rủ
        w = 10 + rnd.randrange(8)
        _wrap_rect(l, x, 0, x + w, H - 1, C['navy1'])
        _wrap_rect(l, x, 0, x + 1, H - 1, C['green0'])
        for k in range(3):
            vx = x + rnd.randrange(-30, 50)
            ln = 40 + rnd.randrange(70)
            for y in range(0, ln):
                sway = int(math.sin(y / 9.0 + k) * 2)
                for dx in (-W, 0, W):
                    l.set(vx + sway + dx, y, C['green0'])
            for dx in (-W, 0, W):
                l.rect(vx - 1 + dx, ln, vx + 1 + dx, ln + 2, C['green1'])
    for x in range(0, W, 8):                            # tán lá trên cùng
        h = 6 + int(4 * math.sin(x / 640 * 2 * math.pi * 5)) + rnd.randrange(3)
        l.rect(x, 0, x + 7, h, C['green0'])
    return l.image()
