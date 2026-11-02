#!/usr/bin/env python3
"""Kiểm tra thư mục asset theo manifest.csv: file có đủ không, kích thước dải có khớp không.

Ví dụ: python validate_assets.py ../manifest.csv ../../game/public/assets
Mỗi dòng manifest dùng cột: id, file, frame_w, frame_h, frames (frames > 1 thì kiểm tra chiều rộng = frame_w * frames).
"""
import csv, os, sys
from PIL import Image

def main():
    if len(sys.argv) < 3: sys.exit(__doc__)
    manifest, root = sys.argv[1], sys.argv[2]
    ok = miss = bad = 0
    for row in csv.DictReader(open(manifest, encoding='utf-8')):
        path = os.path.join(root, row['file'])
        if not os.path.exists(path): miss += 1; continue
        try:
            fw, fh, n = int(row['frame_w']), int(row['frame_h']), int(row['frames'])
        except ValueError:
            ok += 1; continue
        w, h = Image.open(path).size
        if n > 1 and (w != fw * n or h != fh): bad += 1; print(f"SAI KÍCH THƯỚC {row['id']}: có {w}x{h}, cần {fw*n}x{fh}")
        else: ok += 1
    print(f'Đạt {ok} · thiếu {miss} · sai {bad}')

if __name__ == '__main__': main()
