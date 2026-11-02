#!/usr/bin/env python3
"""Làm ảnh nền lặp được theo chiều ngang (parallax) bằng cách hòa trộn mép.

Ví dụ: python make_seamless.py bg_raw.png bg_layer1.png --overlap 64 --height 192
Ảnh đầu ra hẹp hơn ảnh gốc `overlap` điểm ảnh; mép trái và phải khớp nhau.
Có thể thu nhỏ về chiều cao đích (--height) bằng NEAREST.
"""
import argparse
from PIL import Image

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--overlap', type=int, default=64); ap.add_argument('--height', type=int, default=0)
    a = ap.parse_args(); img = Image.open(a.src).convert('RGBA')
    if a.height:
        img = img.resize((round(img.width * a.height / img.height), a.height), Image.NEAREST)
    W, H = img.size; o = min(a.overlap, W // 3)
    out = img.crop((0, 0, W - o, H)); px = out.load(); src = img.load()
    for i in range(o):
        t = i / o
        for y in range(H):
            p, q = src[W - o + i, y], src[i, y]
            px[i, y] = tuple(round(p[k] * (1 - t) + q[k] * t) for k in range(4))
    out.save(a.dst); print(f'OK {a.dst}: {out.size[0]}x{out.size[1]}')

if __name__ == '__main__': main()
