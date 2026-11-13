import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseArtManifest,
  REQUIRED_IMAGES,
  REQUIRED_SHEETS,
  solidTileIndex,
  TILE_INDEX,
} from '@/core/art-manifest';

const ASSETS = resolve(__dirname, '../public/assets');
const raw = JSON.parse(readFileSync(resolve(ASSETS, 'assets.json'), 'utf8')) as unknown;

/** Kích thước PNG đọc từ phần đầu file (IHDR), không cần thư viện ảnh. */
function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  expect(b.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

describe('hình của game (assets.json)', () => {
  const art = parseArtManifest(raw);

  it('có đủ mọi spritesheet và ảnh mà mã nguồn dùng', () => {
    const keys = new Set([...art.sheets.map((s) => s.key), ...art.images.map((s) => s.key)]);
    for (const k of [...REQUIRED_SHEETS, ...REQUIRED_IMAGES]) expect(keys.has(k), k).toBe(true);
  });

  it('mỗi file tồn tại và đúng cỡ: rộng = cỡ khung × số khung (tileset: lưới 8 × 8)', () => {
    for (const s of art.sheets) {
      const path = resolve(ASSETS, s.file);
      expect(existsSync(path), s.file).toBe(true);
      const { w, h } = pngSize(path);
      if (s.key.startsWith('ts_')) {
        expect([w, h], s.key).toEqual([128, 128]);
        expect(s.frames).toBe(64);
      } else {
        expect([w, h], s.key).toEqual([s.frameW * s.frames, s.frameH]);
      }
    }
    for (const i of art.images) {
      expect(existsSync(resolve(ASSETS, i.file)), i.file).toBe(true);
      expect(pngSize(resolve(ASSETS, i.file)), i.key).toEqual({ w: 640, h: 192 });
    }
  });

  it('báo lỗi khi thiếu hình bắt buộc hoặc sai kiểu', () => {
    const m = structuredClone(raw) as { sheets: { key: string; fps: unknown }[] };
    m.sheets = m.sheets.filter((s) => s.key !== 'kai_run');
    expect(() => parseArtManifest(m)).toThrow(/thiếu hình: kai_run/);
    const n = structuredClone(raw) as { sheets: { fps: unknown }[] };
    n.sheets[0]!.fps = 'nhanh';
    expect(() => parseArtManifest(n)).toThrow(/fps/);
  });
});

describe('tự ghép viền khối đặc', () => {
  it('mặt nạ theo hàng xóm trống: 1 trên, 2 phải, 4 dưới, 8 trái', () => {
    const only = (c0: number, r0: number) => (c: number, r: number) => c === c0 && r === r0;
    expect(solidTileIndex(() => true, 3, 3)).toBe(TILE_INDEX.solidBase);
    expect(solidTileIndex(only(3, 3), 3, 3)).toBe(TILE_INDEX.solidBase + 15);
    // Chỉ trống phía trên (mặt đất).
    expect(solidTileIndex((c, r) => r >= 3, 5, 3)).toBe(TILE_INDEX.solidBase + 1);
    // Mép phải của một bậc: trống trên và phải.
    expect(solidTileIndex((c, r) => r >= 3 && c <= 5, 5, 3)).toBe(TILE_INDEX.solidBase + 3);
  });
});
