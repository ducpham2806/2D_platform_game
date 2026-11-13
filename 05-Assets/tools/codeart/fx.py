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
