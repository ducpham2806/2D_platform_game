#!/usr/bin/env python3
"""Gộp các dải sprite (đầu ra của process_sprites.py) thành một atlas Phaser (JSON Hash).

Ví dụ: python pack_atlas.py out/ --name kai --size 1024
Đọc mọi *.png + *.json trong thư mục, xuất kai.png + kai.json (tên khung: <tên>_<chỉ số>).
Phaser: this.load.atlas('kai', 'kai.png', 'kai.json')
"""
import argparse, glob, json, os
from PIL import Image

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('folder')
    ap.add_argument('--name', required=True); ap.add_argument('--size', type=int, default=1024)
    ap.add_argument('--pad', type=int, default=1); ap.add_argument('--out', default=None)
    a = ap.parse_args(); out = a.out or a.folder
    items = []
    for jp in sorted(glob.glob(os.path.join(a.folder, '*.json'))):
        m = json.load(open(jp))
        if 'frameWidth' not in m: continue
        png = os.path.splitext(jp)[0] + '.png'
        if not os.path.exists(png): continue
        sheet = Image.open(png).convert('RGBA')
        for i in range(m['frames']):
            fr = sheet.crop((i*m['frameWidth'], 0, (i+1)*m['frameWidth'], m['frameHeight']))
            items.append((f"{m['name']}_{i}", fr))
    items.sort(key=lambda t: -t[1].height)
    atlas = Image.new('RGBA', (a.size, a.size), (0, 0, 0, 0)); frames = {}
    x = y = row_h = 0
    for name, fr in items:
        w, h = fr.size
        if x + w + a.pad > a.size: x, y, row_h = 0, y + row_h + a.pad, 0
        if y + h > a.size: raise SystemExit('Atlas đầy: tăng --size hoặc tách thành nhiều atlas')
        atlas.paste(fr, (x, y))
        frames[name] = {'frame': {'x': x, 'y': y, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
                        'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h}}
        x += w + a.pad; row_h = max(row_h, h)
    atlas.save(os.path.join(out, a.name + '.png'))
    json.dump({'frames': frames, 'meta': {'image': a.name + '.png', 'format': 'RGBA8888', 'size': {'w': a.size, 'h': a.size}, 'scale': '1'}},
              open(os.path.join(out, a.name + '.json'), 'w'), indent=1)
    print(f'OK {a.name}: {len(frames)} khung')

if __name__ == '__main__': main()
