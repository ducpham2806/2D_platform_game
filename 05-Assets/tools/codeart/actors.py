"""Kẻ địch Stage 1/Prologue (khung 32x32), mini-boss Bramble Golem (64x64), boss (96x96).

Mọi hình nhìn sang TRÁI (game lật khi quay phải), đáy thân chạm đáy khung, tâm ngang ở giữa khung.
Mỗi loại: `idle` 4 khung và `attack` 4 khung (tư thế báo trước đòn). Trúng đòn thì game nháy trắng
bằng mã nên không vẽ khung `hit`.
"""
import math
from pix import Layer, C

INK = C['ink']


def _frame(size):
    return Layer(size, size)


def drone(attack=False):
    out = []
    for i in range(4):
        f = _frame(32)
        bob = [0, 1, 1, 0][i]
        y = 14 + bob                                   # đỉnh thân
        p = Layer(32, 32)
        p.ellipse(16, y + 8, 8, 6, C['green1'])        # thân giáp xanh gỉ
        p.bevel(C['green2'], C['green0'])
        p.rect(11, y + 5, 20, y + 6, C['green0'])      # khe giáp
        f.paste(p)
        f.rect(5, y + 9, 9, y + 11, C['steel0']); f.rect(4, y + 10, 5, y + 10, C['steel2'])  # nòng súng
        eye = C['white'] if attack and i % 2 == 0 else C['red2']
        f.rect(10, y + 7, 12, y + 9, eye); f.set(10, y + 7, C['cream'] if not attack else C['white'])
        f.rect(14, y, 17, y + 1, C['steel1'])          # cánh quạt
        w = [7, 4, 2, 5][i]
        f.rect(16 - w, y - 1, 16 + w, y - 1, C['steel2'])
        f.set(13 + i % 2 * 5, y + 15, C['yellow'])     # lửa đẩy
        out.append(f.outline(INK))
    return out


def turret(attack=False):
    out = []
    for i in range(4):
        f = _frame(32)
        p = Layer(32, 32)
        p.poly([(8, 32), (24, 32), (21, 26), (11, 26)], C['steel0'])      # đế
        p.ellipse(16, 23, 6, 5, C['steel1'])                             # vòm
        p.bevel(C['steel2'], C['navy2'])
        f.paste(p)
        f.rect(5, 21, 12, 23, C['steel0']); f.rect(4, 21, 5, 23, C['steel2'])   # nòng
        lamp = (C['yellow'], C['cream'])[i % 2] if attack else C['navy1']
        f.rect(15, 20, 18, 22, lamp)
        if attack:
            f.rect(3, 21 + i % 2, 3, 22, C['cream'])
        f.set(13, 29, C['navy1']); f.set(19, 29, C['navy1'])
        out.append(f.outline(INK))
    return out


def butterfly(attack=False):
    out = []
    for i in range(4):
        f = _frame(32)
        cy = 22
        span = [10, 7, 3, 7][i]                        # cánh vỗ
        grow = 1.5 if attack else 0
        for side in (-1, 1):
            p = Layer(32, 32)
            x1 = 16 + side * (span + 2 + grow)
            p.poly([(16, cy - 2), (x1, cy - 9 - grow), (x1 + side, cy + 1), (16, cy + 3)], C['purple1'])
            p.poly([(16, cy + 2), (16 + side * (span * 0.7 + 1), cy + 7), (16, cy + 5)], C['magenta'])
            p.bevel(C['magenta'], C['purple0'])
            f.paste(p)
            f.line(16, cy, 16 + side * (span * 0.6 + 1), cy - 5, C['purple0'])   # gân cánh
        body = C['yellow'] if attack and i % 2 == 0 else C['steel2']
        f.rect(15, cy - 4 - grow, 16, cy + 5 + grow, body)
        f.rect(15, cy - 5 - grow, 16, cy - 4 - grow, C['pink'])
        if attack:
            f.ellipse(15.5, cy + 6, 2, 2, C['lime'])   # hạt nổ sắp thả
        out.append(f.outline(INK))
    return out


def spike_turret(attack=False):
    out = []
    for i in range(4):
        f = _frame(32)
        squeeze = 3 if attack else [0, 0, 1, 0][i]     # co lại trước khi bắn
        top = 15 + squeeze
        p = Layer(32, 32)
        p.rect(13, 27, 18, 31, C['brown0'])            # thân cây máy
        p.ellipse(15.5, top + 6, 7 - squeeze * 0.5, 6, C['green1'])
        p.bevel(C['green2'], C['green0'])
        f.paste(p)
        for k, (dx, dy) in enumerate(((-7, -3), (-8, 2), (-6, 6))):       # ba gai phía trước
            tipx = 15 + dx + (2 if attack else 0)
            f.line(12, top + 6 + dy * 0.5, tipx, top + 6 + dy, C['red1'], 1)
            f.set(tipx, top + 6 + dy, C['pink'])
        core = C['cream'] if attack and i % 2 == 0 else C['lime']
        f.rect(14, top + 4, 16, top + 7, core)
        f.rect(11, 30, 20, 31, C['brown1'])
        out.append(f.outline(INK))
    return out


def cocoon(attack=False):
    out = []
    for i in range(4):
        f = _frame(32)
        step = [0, 1, 0, -1][i]
        p = Layer(32, 32)
        p.ellipse(16, 18, 6.5, 9, C['brown1'])         # kén bọc giáp
        p.bevel(C['tan'], C['brown0'])
        for y in (13, 18, 23):
            p.rect(11, y, 21, y, C['brown0'])
        f.paste(p)
        f.rect(12 + step, 27, 14 + step, 31, C['steel0']); f.rect(18 - step, 27, 20 - step, 31, C['steel0'])
        f.rect(11 + step, 31, 14 + step, 31, C['steel1']); f.rect(17 - step, 31, 20 - step, 31, C['steel1'])
        eye = C['white'] if attack and i % 2 == 0 else C['orange']
        f.rect(11, 14, 13, 15, eye)
        out.append(f.outline(INK))
    return out


def cocoon_shield():
    """Khiên của Lính Kén (vẽ riêng để game bật/tắt và nháy): 2 khung 16x32, thường và sáng."""
    out = []
    for i in range(2):
        f = Layer(16, 32)
        col, edge = (C['cyan2'], C['cyan3']) if i == 0 else (C['white'], C['white'])
        f.poly([(6, 8), (10, 8), (11, 20), (10, 31), (6, 31), (5, 20)], col)
        f.rect(6, 9, 6, 30, edge)
        f.rect(8, 14, 9, 24, C['cyan1'] if i == 0 else C['cyan3'])
        out.append(f.outline(INK))
    return out


def golem(attack=False):
    out = []
    for i in range(4):
        f = _frame(64)
        bob = [0, 0, 1, 1][i]
        raise_arm = 8 if attack else 0
        p = Layer(64, 64)
        p.ellipse(32, 44 + bob, 13, 13, C['brown0'])                     # thân rễ quấn
        p.rect(22, 52, 29, 63, C['brown0']); p.rect(35, 52, 42, 63, C['brown0'])   # chân
        p.bevel(C['brown1'], C['navy0'])
        f.paste(p)
        for k in range(5):                                               # rễ gai quấn quanh
            a = k * 1.3 + 0.4
            f.line(32 + math.cos(a) * 12, 44 + bob + math.sin(a) * 11, 32 + math.cos(a + 0.9) * 11,
                   44 + bob + math.sin(a + 0.9) * 12, C['green0'])
        q = Layer(64, 64)
        q.rect(24, 38 + bob, 40, 46 + bob, C['steel0'])                  # tấm sắt ngực
        q.bevel(C['steel1'], C['navy2'])
        f.paste(q)
        for side in (-1, 1):                                             # tay to
            a = Layer(64, 64)
            ax = 32 + side * 15
            ay = 40 + bob - (raise_arm if side < 0 or attack else 0)
            a.line(32 + side * 11, 38 + bob, ax, ay + 8, C['brown1'], 5)
            a.ellipse(ax, ay + 12, 5, 5, C['brown1'])
            a.bevel(C['tan'], C['brown0'])
            f.paste(a)
            f.set(ax - 2, ay + 9, C['pink']); f.set(ax + 2, ay + 14, C['pink'])
        h = Layer(64, 64)
        h.ellipse(30, 30 + bob, 7, 6, C['brown1'])                       # đầu
        h.bevel(C['tan'], C['brown0'])
        f.paste(h)
        eye = C['white'] if attack and i % 2 == 0 else C['lime']
        f.rect(24, 29 + bob, 26, 30 + bob, eye); f.rect(29, 29 + bob, 31, 30 + bob, eye)
        f.rect(30, 41 + bob, 33, 43 + bob, C['orange'] if attack else C['green2'])   # lõi ngực
        out.append(f.outline(INK))
    return out


def gray_boss(attack=False):
    """Boss xám của Prototype: cỗ máy canh gác đơn giản, hộp 28x32."""
    out = []
    for i in range(4):
        f = _frame(96)
        bob = [0, 0, 1, 1][i]
        p = Layer(96, 96)
        p.rect(35, 66 + bob, 60, 88, C['steel0'])                        # thân
        p.rect(37, 88, 44, 95, C['navy2']); p.rect(51, 88, 58, 95, C['navy2'])   # chân
        p.bevel(C['steel1'], C['navy1'])
        f.paste(p)
        h = Layer(96, 96)
        h.rect(38, 58 + bob, 57, 68 + bob, C['steel1'])                  # đầu
        h.bevel(C['steel2'], C['steel0'])
        f.paste(h)
        eye = C['white'] if attack and i % 2 == 0 else C['red2']
        f.rect(40, 62 + bob, 46, 64 + bob, eye)
        f.rect(29, 72 + bob, 35, 78 + bob, C['steel0']); f.rect(27, 74 + bob, 29, 76 + bob, C['steel2'])  # pháo
        f.rect(46, 74 + bob, 52, 80 + bob, C['orange'] if attack else C['yellow'])   # lõi
        out.append(f.outline(INK))
    return out


def _thorna_pose(bob=0, arms=0.0, droop=0, eyes='open', shake=0):
    """Thorna: người gác dạng cây máy, thân vỏ cây + kim loại, hai tay dây gai, hộp 28x48."""
    f = _frame(96)
    bx = 48 + shake
    top = 46 + bob + droop
    p = Layer(96, 96)
    p.poly([(bx - 10, 95), (bx + 10, 95), (bx + 12, top + 20), (bx + 9, top + 6), (bx - 9, top + 6),
            (bx - 12, top + 20)], C['brown0'])                           # thân cây
    for dx in (-13, 13):                                                 # rễ chân
        p.poly([(bx + dx * 0.6, 95), (bx + dx, 95), (bx + dx * 0.7, 86)], C['brown0'])
    p.bevel(C['brown1'], C['navy0'])
    f.paste(p)
    for y in range(top + 10, 94, 7):                                     # vân vỏ cây
        f.line(bx - 7, y, bx - 3, y + 3, C['navy0'])
        f.line(bx + 4, y + 2, bx + 8, y + 4, C['navy0'])
    m = Layer(96, 96)
    m.rect(bx - 8, top + 12, bx + 8, top + 26, C['steel0'])              # giáp ngực kim loại
    m.bevel(C['steel1'], C['navy2'])
    f.paste(m)
    for side in (-1, 1):                                                 # tay dây gai
        sx, sy = bx + side * 10, top + 12
        ang = (-0.5 - arms) if side < 0 else (0.5 + arms)
        pts = [(sx, sy)]
        for k in range(1, 5):
            a = math.pi / 2 + ang * (1.6 - k * 0.2)
            pts.append((pts[-1][0] + math.cos(a) * 6 * side * -1 + side * 5, pts[-1][1] + math.sin(a) * 6 - arms * 9))
        v = Layer(96, 96)
        for a_, b_ in zip(pts, pts[1:]):
            v.line(a_[0], a_[1], b_[0], b_[1], C['green1'], 3)
        v.bevel(C['green2'], C['green0'])
        f.paste(v)
        for (x, y) in pts[1:]:
            f.set(x + side * 2, y - 1, C['pink'])                        # gai
    h = Layer(96, 96)
    h.ellipse(bx - 1, top, 9, 8, C['brown1'])                            # đầu
    for dx, dy in ((-6, -9), (0, -12), (6, -9)):                         # tán lá trên đầu
        h.ellipse(bx + dx, top + dy, 5, 4, C['green1'])
    h.bevel(C['green2'], C['brown0'])
    f.paste(h)
    if eyes == 'open':
        f.rect(bx - 8, top - 1, bx - 6, top, C['lime']); f.rect(bx - 3, top - 1, bx - 1, top, C['lime'])
    elif eyes == 'glow':
        f.rect(bx - 8, top - 2, bx - 6, top, C['white']); f.rect(bx - 3, top - 2, bx - 1, top, C['white'])
    else:
        f.rect(bx - 8, top, bx - 6, top, C['navy0']); f.rect(bx - 3, top, bx - 1, top, C['navy0'])
    return f.outline(INK)


def thorna_idle():
    return [_thorna_pose(bob=[0, 0, 1, 1][i], arms=[0, 0.1, 0.15, 0.05][i]) for i in range(4)]


def thorna_attack():
    return [_thorna_pose(bob=-1, arms=[0.5, 0.7, 0.8, 0.7][i], eyes='glow' if i % 2 == 0 else 'open',
                         shake=[0, 1, 0, -1][i]) for i in range(4)]


def thorna_stun():
    return [_thorna_pose(bob=2, droop=3, arms=-0.2, eyes='shut', shake=[0, 1][i]) for i in range(2)]


def thorna_die():
    out = []
    for i in range(6):
        f = _thorna_pose(bob=2 + i, droop=3 + i * 3, arms=-0.2 - i * 0.05, eyes='shut')
        for k in range(i * 6):                          # tan thành hạt sáng từ trên xuống
            x = 30 + (k * 37 + i * 11) % 36
            y = 30 + (k * 53 + i * 7) % (20 + i * 10)
            f.rect(x, y, x + 1, y + 1, None)
            if k % 3 == 0:
                f.set(x, y - 6 - i * 2, C['lime'] if k % 2 else C['cream'])
        out.append(f)
    return out


def thorna_core():
    """Lõi hạt ở ngực, đổi màu theo pha (xanh, vàng, đỏ): 3 khung 16x16, game đặt đè lên ngực."""
    out = []
    for col, hi in ((C['green2'], C['lime']), (C['yellow'], C['cream']), (C['red2'], C['pink'])):
        f = Layer(16, 16)
        f.ellipse(7.5, 7.5, 3, 3, col); f.rect(6, 6, 7, 7, hi)
        out.append(f.outline(INK))
    return out


SHEETS = {  # id → (hàm, frame_w, fps, lặp, thư mục)
    'en_drone_idle': (drone, 32, 8, True, 'enemies'), 'en_drone_attack': (lambda: drone(True), 32, 12, True, 'enemies'),
    'en_turret_idle': (turret, 32, 6, True, 'enemies'), 'en_turret_attack': (lambda: turret(True), 32, 12, True, 'enemies'),
    'en_butterfly_idle': (butterfly, 32, 10, True, 'enemies'),
    'en_butterfly_attack': (lambda: butterfly(True), 32, 12, True, 'enemies'),
    'en_spike_turret_idle': (spike_turret, 32, 6, True, 'enemies'),
    'en_spike_turret_attack': (lambda: spike_turret(True), 32, 12, True, 'enemies'),
    'en_cocoon_idle': (cocoon, 32, 8, True, 'enemies'), 'en_cocoon_attack': (lambda: cocoon(True), 32, 12, True, 'enemies'),
    'en_cocoon_shield': (cocoon_shield, 16, 0, False, 'enemies'),
    'mb_golem_idle': (golem, 64, 6, True, 'bosses'), 'mb_golem_attack': (lambda: golem(True), 64, 12, True, 'bosses'),
    'boss_gray_idle': (gray_boss, 96, 6, True, 'bosses'), 'boss_gray_attack': (lambda: gray_boss(True), 96, 12, True, 'bosses'),
    'boss_thorna_idle': (thorna_idle, 96, 6, True, 'bosses'), 'boss_thorna_attack': (thorna_attack, 96, 12, True, 'bosses'),
    'boss_thorna_stun': (thorna_stun, 96, 6, True, 'bosses'), 'boss_thorna_die': (thorna_die, 96, 8, False, 'bosses'),
    'boss_thorna_core': (thorna_core, 16, 0, False, 'bosses'),
}
