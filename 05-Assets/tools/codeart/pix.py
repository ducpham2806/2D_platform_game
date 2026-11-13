"""Công cụ vẽ pixel art bằng mã (không dùng mô hình sinh ảnh).

Mỗi bộ phận vẽ trên một lớp riêng bằng màu nền, rồi `bevel` thêm sáng (cạnh trên, trái) và tối
(cạnh dưới, phải) theo hướng sáng trên-trái của style bible; cuối cùng `outline` viền tối 1 px.
Chỉ dùng màu trong tools/palette.json.
"""
import json, math, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PALETTE = [c.upper() for c in json.load(open(os.path.join(HERE, '..', 'palette.json')))['colors']]


def rgb(hexcode):
    h = hexcode.lstrip('#')
    assert ('#' + h).upper() in PALETTE, f'màu {hexcode} không nằm trong bảng 32 màu'
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


# Tên màu theo vai trò (style bible).
C = {k: rgb(v) for k, v in {
    'black': '#000000', 'ink': '#0B0F1A', 'navy0': '#141B2D', 'navy1': '#1F2A44', 'navy2': '#2E3B5E',
    'steel0': '#46567F', 'steel1': '#6B7A99', 'steel2': '#9AA8C2', 'pale': '#CBD5E6', 'white0': '#F2F5FA',
    'white': '#FFFFFF', 'cyan0': '#0A5C7A', 'cyan1': '#118AB2', 'cyan2': '#2EC4E6', 'cyan3': '#8FE9FF',
    'purple0': '#3A0F4E', 'purple1': '#6A1B9A', 'magenta': '#B5179E', 'pink': '#F72585',
    'red0': '#5C1A1A', 'red1': '#A4262C', 'red2': '#E63946', 'orange': '#FF8C42', 'yellow': '#FFC857',
    'cream': '#FFF1A8', 'green0': '#14472B', 'green1': '#2E7D32', 'green2': '#57CC63', 'lime': '#B7F171',
    'brown0': '#5A4636', 'brown1': '#8C6B4F', 'tan': '#D9A57A'}.items()}


class Layer:
    """Lưới điểm ảnh RGBA nhỏ; None là trong suốt."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]

    def get(self, x, y):
        return self.px[y][x] if 0 <= x < self.w and 0 <= y < self.h else None

    def set(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        x0, x1 = sorted((int(round(x0)), int(round(x1))))
        y0, y1 = sorted((int(round(y0)), int(round(y1))))
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.set(x, y, c)

    def ellipse(self, cx, cy, rx, ry, c):
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x - cx) / max(rx, 0.01)) ** 2 + ((y - cy) / max(ry, 0.01)) ** 2 <= 1.0:
                    self.set(x, y, c)

    def line(self, x0, y0, x1, y1, c, th=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
        r = (th - 1) / 2
        for i in range(n + 1):
            t = i / n
            x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            self.rect(x - r, y - r, x + r, y + r, c)

    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            for i in range(len(pts)):
                (xa, ya), (xb, yb) = pts[i], pts[(i + 1) % len(pts)]
                if ya == yb:
                    continue
                if min(ya, yb) <= y + 0.5 < max(ya, yb):
                    xs.append(xa + (y + 0.5 - ya) * (xb - xa) / (yb - ya))
            xs.sort()
            for a, b in zip(xs[0::2], xs[1::2]):
                for x in range(int(math.ceil(a - 0.5)), int(math.floor(b - 0.5)) + 1):
                    self.set(x, y, c)

    def bevel(self, light=None, dark=None):
        """Sáng ở cạnh trên/trái, tối ở cạnh dưới/phải của vùng đã vẽ trên lớp này."""
        src = [row[:] for row in self.px]
        g = lambda x, y: src[y][x] if 0 <= x < self.w and 0 <= y < self.h else None
        for y in range(self.h):
            for x in range(self.w):
                if src[y][x] is None:
                    continue
                if dark and (g(x, y + 1) is None or g(x + 1, y) is None):
                    self.px[y][x] = dark
                if light and (g(x, y - 1) is None or g(x - 1, y) is None):
                    self.px[y][x] = light
        return self

    def paste(self, other, dx=0, dy=0):
        for y in range(other.h):
            for x in range(other.w):
                c = other.px[y][x]
                if c is not None:
                    self.set(x + dx, y + dy, c)
        return self

    def outline(self, c):
        src = [row[:] for row in self.px]
        g = lambda x, y: src[y][x] if 0 <= x < self.w and 0 <= y < self.h else None
        for y in range(self.h):
            for x in range(self.w):
                if src[y][x] is None and (g(x - 1, y) or g(x + 1, y) or g(x, y - 1) or g(x, y + 1)):
                    self.px[y][x] = c
        return self

    def flip(self):
        out = Layer(self.w, self.h)
        out.px = [row[::-1] for row in self.px]
        return out

    def image(self):
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is not None:
                    im.putpixel((x, y), self.px[y][x])
        return im


def strip(frames):
    """Ghép các khung cùng cỡ thành một dải ngang."""
    w, h = frames[0].w, frames[0].h
    im = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        im.paste(f.image(), (i * w, 0))
    return im


def save(im, root, rel):
    path = os.path.join(root, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)
    return path


def check_palette(im):
    """Mọi điểm ảnh phải trong suốt hẳn hoặc đục hẳn và thuộc bảng màu."""
    allowed = {tuple(int(p[i:i + 2], 16) for i in (1, 3, 5)) for p in PALETTE}
    for r, g, b, a in im.getdata():
        assert a in (0, 255), 'alpha phải nhị phân'
        assert a == 0 or (r, g, b) in allowed, f'màu lạc bảng: {(r, g, b)}'
