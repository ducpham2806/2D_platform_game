#!/usr/bin/env python3
"""Xử lý ảnh ChatGPT thành spritesheet game.

Ảnh đầu vào: một dải/lưới khung hình, nền màu phẳng (khuyến nghị #FF00FF).
Các bước: xóa nền, cắt lưới, căn chân (bottom-center), thu nhỏ NEAREST
với cùng một tỷ lệ cho mọi khung, ép về bảng màu, alpha nhị phân.

Ví dụ:
  python process_sprites.py kai_run_raw.png --cols 8 --rows 1 --cell 48x48 \
      --name kai_run --fps 12 --out out/
Kết quả: out/kai_run.png (dải ngang), out/kai_run.json (thông số Phaser + anim).
"""
import argparse, json, os, sys
from PIL import Image

def hex_to_rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def remove_key(img, key, tol):
    px = img.load(); w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r-key[0]) <= tol and abs(g-key[1]) <= tol and abs(b-key[2]) <= tol:
                px[x, y] = (0, 0, 0, 0)
    return img

def quantize(img, palette):
    px = img.load(); w, h = img.size; cache = {}
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                px[x, y] = (0, 0, 0, 0); continue
            k = (r, g, b)
            if k not in cache:
                cache[k] = min(palette, key=lambda c: (c[0]-r)**2 + (c[1]-g)**2 + (c[2]-b)**2)
            px[x, y] = cache[k] + (255,)
    return img

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('--cols', type=int, required=True)
    ap.add_argument('--rows', type=int, default=1)
    ap.add_argument('--cell', default='48x48', help='kích thước khung đích, ví dụ 48x48')
    ap.add_argument('--name', required=True); ap.add_argument('--fps', type=int, default=10)
    ap.add_argument('--loop', type=int, default=1, help='1 = lặp, 0 = chạy một lần')
    ap.add_argument('--key', default='#FF00FF'); ap.add_argument('--tol', type=int, default=40)
    ap.add_argument('--no-key', action='store_true', help='ảnh đã có nền trong suốt')
    ap.add_argument('--palette', default=os.path.join(os.path.dirname(__file__), 'palette.json'))
    ap.add_argument('--no-palette', action='store_true')
    ap.add_argument('--margin', type=int, default=1); ap.add_argument('--out', default='out')
    a = ap.parse_args()
    cw, ch = map(int, a.cell.lower().split('x'))
    img = Image.open(a.src).convert('RGBA')
    if not a.no_key: img = remove_key(img, hex_to_rgb(a.key), a.tol)
    W, H = img.size; fw, fh = W // a.cols, H // a.rows
    frames, boxes = [], []
    for r in range(a.rows):
        for c in range(a.cols):
            f = img.crop((c*fw, r*fh, (c+1)*fw, (r+1)*fh))
            bb = f.getbbox()
            frames.append((f, bb)); boxes.append(bb)
    valid = [b for b in boxes if b]
    if not valid: sys.exit('Không tìm thấy điểm ảnh nào sau khi xóa nền')
    mw = max(b[2]-b[0] for b in valid); mh = max(b[3]-b[1] for b in valid)
    s = min((cw - 2*a.margin) / mw, (ch - a.margin) / mh)
    palette = None
    if not a.no_palette and os.path.exists(a.palette):
        palette = [hex_to_rgb(x) for x in json.load(open(a.palette))['colors']]
    n = len(frames); sheet = Image.new('RGBA', (cw*n, ch), (0, 0, 0, 0))
    for i, (f, bb) in enumerate(frames):
        if not bb: continue
        crop = f.crop(bb); nw, nh = max(1, round(crop.width*s)), max(1, round(crop.height*s))
        crop = crop.resize((nw, nh), Image.NEAREST)
        if palette: crop = quantize(crop, palette)
        x = i*cw + (cw - nw)//2; y = ch - a.margin - nh
        sheet.paste(crop, (x, y), crop)
    os.makedirs(a.out, exist_ok=True)
    sheet.save(os.path.join(a.out, a.name + '.png'))
    meta = {'name': a.name, 'frameWidth': cw, 'frameHeight': ch, 'frames': n,
            'anim': {'key': a.name, 'start': 0, 'end': n-1, 'frameRate': a.fps, 'repeat': -1 if a.loop else 0},
            'scaleUsed': round(s, 3)}
    json.dump(meta, open(os.path.join(a.out, a.name + '.json'), 'w'), indent=2)
    print(f'OK {a.name}: {n} khung {cw}x{ch}, tỷ lệ {s:.3f}')

if __name__ == '__main__': main()
