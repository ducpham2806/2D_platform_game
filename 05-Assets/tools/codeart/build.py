#!/usr/bin/env python3
"""Dựng toàn bộ asset vẽ bằng mã vào game/public/assets và ghi assets.json cho game nạp.

Chạy từ gốc repo: python3 05-Assets/tools/codeart/build.py
Asset do mã vẽ (art_source: code), không dùng mô hình sinh ảnh; thay bằng asset khác thì đè file
cùng tên, cùng kích thước khung.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import actors, bg, fx, kai, pix, tiles, ui

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'game', 'public', 'assets')


def main():
    sheets, images = [], []
    for key, (fn, fps, loop) in kai.SHEETS.items():
        im = pix.strip(fn()); pix.check_palette(im)
        rel = f'sprites/kai/{key}.png'; pix.save(im, OUT, rel)
        sheets.append(dict(key=key, file=rel, frameW=48, frameH=48, frames=im.width // 48, fps=fps, loop=loop))
    for key, (fn, fw, fps, loop) in fx.SHEETS.items():
        im = pix.strip(fn()); pix.check_palette(im)
        folder = 'objects' if key.startswith('obj_') else 'fx'
        rel = f'sprites/{folder}/{key}.png'; pix.save(im, OUT, rel)
        sheets.append(dict(key=key, file=rel, frameW=fw, frameH=im.height, frames=im.width // fw, fps=fps, loop=loop))
    for key, (fn, fw, fps, loop, folder) in actors.SHEETS.items():
        im = pix.strip(fn()); pix.check_palette(im)
        rel = f'sprites/{folder}/{key}.png'; pix.save(im, OUT, rel)
        sheets.append(dict(key=key, file=rel, frameW=fw, frameH=im.height, frames=im.width // fw, fps=fps, loop=loop))
    for key, fn in ui.PORTRAITS.items():
        im = fn().image(); pix.check_palette(im)
        rel = f'ui/{key}.png'; pix.save(im, OUT, rel)
        images.append(dict(key=key, file=rel))
    for key, fn in ui.IMAGES.items():
        im = fn().image(); pix.check_palette(im)
        rel = f'ui/{key}.png'; pix.save(im, OUT, rel)
        images.append(dict(key=key, file=rel))
    for key, (fn, fw, fh) in ui.UI_SHEETS.items():
        im = pix.strip(fn()); pix.check_palette(im)
        rel = f'ui/{key}.png'; pix.save(im, OUT, rel)
        sheets.append(dict(key=key, file=rel, frameW=fw, frameH=fh, frames=(im.width // fw) * (im.height // fh), fps=0, loop=False))
    for theme in ('lab', 'verdant'):
        im = tiles.tileset(theme); pix.check_palette(im)
        rel = f'tilesets/ts_{theme}.png'; pix.save(im, OUT, rel)
        sheets.append(dict(key=f'ts_{theme}', file=rel, frameW=16, frameH=16, frames=64, fps=0, loop=False))
    for key, fn in (('bg_lab_l1', bg.lab_far), ('bg_lab_l2', bg.lab_mid),
                    ('bg_verdant_l1', bg.verdant_far), ('bg_verdant_l2', bg.verdant_mid)):
        im = fn(); pix.check_palette(im)
        rel = f'backgrounds/{key}.png'; pix.save(im, OUT, rel)
        images.append(dict(key=key, file=rel))
    manifest = dict(_note='Sinh bởi 05-Assets/tools/codeart/build.py; không sửa tay.', sheets=sheets, images=images)
    with open(os.path.join(OUT, 'assets.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2); f.write('\n')
    print(f'{len(sheets)} spritesheet, {len(images)} ảnh nền → {OUT}')


if __name__ == '__main__':
    main()
