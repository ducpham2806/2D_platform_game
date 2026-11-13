"""Bảng xem trước: mọi khung trên nền caro, phóng to nguyên lần."""
import sys
from PIL import Image


def sheet(strips, scale=4, cell_bg=((40, 46, 60), (52, 60, 78)), game_bg=(15, 23, 36)):
    """strips: [(tên, ảnh dải, frame_w)]. Nửa trên nền caro, nửa dưới nền màu game."""
    rows = []
    for name, im, fw in strips:
        n = im.width // fw
        row = Image.new('RGBA', (im.width, im.height * 2), game_bg + (255,))
        for i in range(n):
            for y in range(0, im.height, 8):
                for x in range(0, fw, 8):
                    c = cell_bg[((x // 8) + (y // 8) + i) % 2]
                    row.paste(c + (255,), (i * fw + x, y, i * fw + x + 8, y + 8))
        row.alpha_composite(im, (0, 0))
        row.alpha_composite(im, (0, im.height))
        rows.append(row)
    w = max(r.width for r in rows)
    out = Image.new('RGBA', (w, sum(r.height for r in rows)), (0, 0, 0, 255))
    y = 0
    for r in rows:
        out.paste(r, (0, y)); y += r.height
    return out.resize((out.width * scale, out.height * scale), Image.NEAREST)
