"""Kai: khung 48x48, chân ở giữa đáy (24, 47), nhìn sang phải.

Hình cao khoảng 28 px, rộng khoảng 16 px để vừa hộp va chạm 12x24 của player.json (manifest ghi
24x40 là theo hướng dẫn cũ; hình to hơn hộp quá nhiều sẽ thò qua trần và tường).
Dựng bằng "khung xương" tham số nên mọi hoạt ảnh cùng tỷ lệ, cùng màu.
"""
import math
from pix import Layer, C

W = H = 48
OX, GY = 24, 47          # gốc: giữa hai chân, mặt đất
INK = C['ink']
LEG = 5.2                # chiều dài mỗi đốt chân


def P(x, y):
    """Tọa độ so với gốc (x sang phải, y lên trên) → điểm ảnh."""
    return OX + x, GY - y


def leg(layer, hip, foot, color, boot):
    """Chân hai đốt: hông → gối → cổ chân, gối gập về phía trước; giày ở bàn chân."""
    hx, hy = hip
    ax, ay = foot[0], foot[1] + 2          # cổ chân trên đế giày
    dx, dy = ax - hx, ay - hy
    d = max(0.01, min(math.hypot(dx, dy), LEG * 2 - 0.01))
    a = math.atan2(dy, dx)
    b = math.acos(d / (2 * LEG))
    kx, ky = hx + math.cos(a + b) * LEG, hy + math.sin(a + b) * LEG   # gối lệch về phía +x
    layer.line(*P(hx, hy), *P(kx, ky), color, 3)
    layer.line(*P(kx, ky), *P(ax, ay), color, 3)
    fx, fy = foot
    layer.rect(*P(fx - 2, fy + 2), *P(fx + 2, fy), boot)
    layer.set(*P(fx + 3, fy), boot)


def kai(by=0, lean=0, foot_f=(2, 0), foot_b=(-2, 0), aim=0.0, back_hand=(-4, 11), scarf=(-1, 0),
        crouch=0, head_dy=0, blink=False, tilt=0):
    """Một khung Kai. by: nhún người; lean: ngả trước; aim: góc pháo (rad); scarf: (độ võng, độ bay)."""
    f = Layer(W, H)
    top = round(by - crouch)
    lean_i = round(lean)
    hip = (lean * 0.4, 10 + top)
    sx, sy = 1 + lean_i, 17 + top            # vai
    hx, hy = 1 + round(lean * 1.3 + tilt), 22 + top + head_dy   # tâm đầu

    # Tay sau (xa người xem): tối hơn.
    part = Layer(W, H)
    part.line(*P(sx - 2, sy), *P(back_hand[0] + lean, back_hand[1] + top), C['navy2'], 2)
    f.paste(part)

    # Chân sau.
    part = Layer(W, H)
    leg(part, (hip[0] - 1, hip[1]), foot_b, C['navy2'], C['steel0'])
    f.paste(part)

    # Khăn: dải vải sáng bay sau gáy.
    part = Layer(W, H)
    sag, fly = scarf
    nx, ny = hx - 3, hy - 4
    pts = [(nx, ny), (nx - 2 - fly, ny + sag * 0.3), (nx - 4 - fly * 1.6, ny + sag * 0.8 - 1),
           (nx - 6 - fly * 2, ny + sag * 1.4 - 1)]
    for i in range(len(pts) - 1):
        part.line(*P(*pts[i]), *P(*pts[i + 1]), C['pale'], 2 if i < 2 else 1)
    part.bevel(None, C['steel2'])
    f.paste(part)

    # Thân: giáp ngực, lõi sáng.
    part = Layer(W, H)
    part.poly([P(-3 + lean * 0.6, 10 + top), P(3 + lean * 0.6, 10 + top), P(4 + lean_i, 19 + top),
               P(-3 + lean_i, 19 + top)], C['steel0'])
    part.bevel(C['steel1'], C['navy2'])
    part.rect(*P(1 + lean_i, 15 + top), *P(2 + lean_i, 14 + top), C['cyan2'])
    part.set(*P(1 + lean_i, 15 + top), C['cyan3'])
    f.paste(part)

    # Hông.
    part = Layer(W, H)
    part.rect(*P(-3 + round(hip[0]), 10 + top), *P(2 + round(hip[0]), 8 + top), C['navy2'])
    f.paste(part)

    # Chân trước.
    part = Layer(W, H)
    leg(part, (hip[0] + 1, hip[1]), foot_f, C['steel0'], C['steel2'])
    part.bevel(C['steel1'], None)
    f.paste(part)

    # Đầu: mũ trùm tròn, hai vây vuốt ra sau, khe kính sáng.
    part = Layer(W, H)
    part.ellipse(*P(hx, hy + 0.5), 4.4, 4.4, C['steel0'])
    part.line(*P(hx - 3, hy + 3), *P(hx - 6, hy + 5), C['steel0'], 1)
    part.line(*P(hx - 4, hy + 1), *P(hx - 7, hy + 2), C['steel0'], 1)
    part.bevel(C['steel2'], C['navy2'])
    if not blink:
        part.rect(*P(hx + 1, hy + 1), *P(hx + 4, hy), C['cyan3'])
        part.rect(*P(hx + 1, hy), *P(hx + 2, hy), C['cyan2'])
    else:
        part.rect(*P(hx + 1, hy), *P(hx + 4, hy), C['cyan1'])
    f.paste(part)

    # Tay pháo (gần người xem): giáp vai lệch + nòng pháo, viền miệng nòng sáng.
    part = Layer(W, H)
    ca, sa = math.cos(aim), math.sin(aim)
    ex, ey = round(sx + 1 + ca * 3), round(sy - 2 + sa * 3)          # khuỷu
    part.line(*P(sx, sy - 1), *P(ex, ey), C['steel1'], 3)
    for t in range(0, 7):
        cx_, cy_ = round(ex + ca * t), round(ey + sa * t)
        part.rect(*P(cx_, cy_ + 2), *P(cx_, cy_ - 1), C['steel2'])
    part.bevel(C['pale'], C['steel1'])
    mx, my = round(ex + ca * 7), round(ey + sa * 7)
    part.rect(*P(mx, my + 2), *P(mx, my - 1), C['cyan2'])
    part.rect(*P(mx, my + 1), *P(mx, my), C['cyan3'])
    part.ellipse(*P(sx - 1, sy + 1), 2.2, 1.8, C['steel2'])     # giáp vai
    part.set(*P(sx - 2, sy + 2), C['pale'])
    f.paste(part)

    return f.outline(INK)


def idle():
    out = []
    for i in range(4):
        b = [0, 0, -1, -1][i]
        out.append(kai(by=b, scarf=([3, 4, 4, 3][i], [0, 0, 1, 0][i]), blink=False))
    return out


def run():
    out = []
    for i in range(8):
        t = i / 8 * 2 * math.pi
        # Hai chân lệch pha nửa chu kỳ; chân đang bước tới thì nhấc khỏi đất.
        def foot(phase):
            x = math.sin(t + phase) * 5
            y = max(0, math.cos(t + phase)) * 3.2
            return (x + 1, y)
        bob = [0, 1, 1, 0, 0, 1, 1, 0][i]
        out.append(kai(by=bob, lean=1.5, foot_f=foot(0), foot_b=foot(math.pi),
                       back_hand=(-4 + math.sin(t) * 2.5, 12), scarf=(1 + (i % 2), 2)))
    return out


def jump_up():
    return [kai(by=1, lean=0.5, foot_f=(2, 2), foot_b=(-2, 0), scarf=(5, 0), back_hand=(-5, 13)),
            kai(by=1, lean=0.5, foot_f=(1, 3), foot_b=(-2, 1), scarf=(6, 0), back_hand=(-5, 14))]


def jump_fall():
    return [kai(by=1, foot_f=(3, 1), foot_b=(-3, 2), scarf=(-4, 0), back_hand=(-5, 16)),
            kai(by=1, foot_f=(3, 0), foot_b=(-4, 2), scarf=(-5, 0), back_hand=(-6, 17))]


def land():
    return [kai(crouch=3, lean=1, foot_f=(3, 0), foot_b=(-3, 0), scarf=(-2, 1), back_hand=(-5, 9)),
            kai(crouch=1, lean=0.5, foot_f=(3, 0), foot_b=(-2, 0), scarf=(2, 1))]


def dash():
    out = []
    for i in range(3):
        out.append(kai(crouch=3, lean=4, foot_f=(0, 1), foot_b=(-6 - i % 2, 2), scarf=(0, 3 + i % 2),
                       back_hand=(-6, 10), head_dy=-1, tilt=1))
    return out


def wall_slide():
    # Bám tường phía trước mặt: hai chân co, tay sau giơ lên vịn tường.
    return [kai(by=0, lean=1, foot_f=(4, 3), foot_b=(3, 0), scarf=(-3 - i, 0), back_hand=(6, 21),
                aim=-0.9) for i in range(2)]


def wall_jump():
    return [kai(by=1, lean=-1.5, foot_f=(3, 1), foot_b=(-3, 3), scarf=(3, -1), back_hand=(-5, 14)),
            kai(by=1, lean=-1, foot_f=(2, 2), foot_b=(-3, 2), scarf=(4, -1), back_hand=(-5, 15))]


def hurt():
    return [kai(by=1, lean=-2.5, foot_f=(3, 1), foot_b=(-2, 0), scarf=(2, -2), back_hand=(-6, 17),
                aim=0.9, blink=True, tilt=-1),
            kai(by=0, lean=-2, foot_f=(3, 0), foot_b=(-2, 0), scarf=(3, -2), back_hand=(-6, 15),
                aim=0.6, blink=True, tilt=-1)]


def _burst(i, n, gather=False):
    """Kai tan thành mảnh sáng (chết) hoặc mảnh sáng tụ lại (hồi sinh)."""
    f = Layer(W, H)
    t = (i + 1) / n
    if gather:
        t = 1 - t
    cx, cy = 0, 14
    for k in range(10):
        a = k / 10 * 2 * math.pi + 0.3
        r = 2 + t * 17
        x, y = cx + math.cos(a) * r, cy + math.sin(a) * r * 0.9
        size = 1 if t > 0.6 else 2
        col = C['white'] if t < 0.3 else C['cyan3'] if t < 0.7 else C['cyan1']
        f.rect(*P(x, y), *P(x + size - 1, y - size + 1), col)
    if t < 0.45:
        f.ellipse(*P(cx, cy), 5 - t * 8, 7 - t * 10, C['white'] if t < 0.2 else C['cyan3'])
    return f


def death():
    first = kai(by=0, lean=-2, foot_f=(3, 0), foot_b=(-2, 0), scarf=(3, -2), aim=0.6, blink=True)
    return [first] + [_burst(i, 5) for i in range(5)]


def respawn():
    frames = [_burst(i, 4, gather=True) for i in range(4)]
    frames.append(kai(crouch=2, scarf=(1, 0), blink=True))
    frames.append(kai(scarf=(3, 0)))
    return frames


SHEETS = {  # id trong manifest.csv → (hàm dựng khung, fps, lặp)
    'kai_idle': (idle, 6, True), 'kai_run': (run, 12, True), 'kai_jump_up': (jump_up, 8, False),
    'kai_jump_fall': (jump_fall, 8, False), 'kai_land': (land, 12, False), 'kai_dash': (dash, 12, False),
    'kai_wall_slide': (wall_slide, 8, True), 'kai_wall_jump': (wall_jump, 12, False),
    'kai_hurt': (hurt, 10, False), 'kai_death': (death, 10, False), 'kai_respawn': (respawn, 12, False),
}
