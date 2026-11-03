#!/usr/bin/env node
/**
 * Dựng bản đồ Tiled (JSON) từ bản phác ASCII, để có bản đầu rồi mở bằng Tiled sửa tiếp.
 *
 *   node scripts/ascii-to-tiled.mjs maps/src/m7-test.map.json maps/m7-test.json
 *
 * Bản phác (JSON):
 *   rows    : các dòng ký tự. '#' đặc, '=' bục một chiều, '^' gai, '.' trống.
 *   legend  : chữ → đối tượng điểm { class, name?, props? } (ví dụ "P": { "class": "spawn" }).
 *   objects : đối tượng hình chữ nhật hoặc có tên: { class, name?, rect: [c0, r0, c1, r1] }
 *             (ô, gồm hai đầu) hoặc { class, name?, col, row? }; props tùy chọn.
 * Tileset nhúng `graybox` (maps/graybox-tiles.png, tạo kèm nếu chưa có): 0 đặc, 1 bục một chiều,
 * 2 gai. Quy ước đọc bản đồ: src/logic/stage/tiled.ts và maps/README.md.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { deflateSync } from 'node:zlib';

const TILE = 16;
const TILESET_IMAGE = 'graybox-tiles.png';
const TILE_IDS = { '#': 0, '=': 1, '^': 2 };

const [, , specPath, outPath] = process.argv;
if (!specPath || !outPath) {
  console.error('Cách dùng: node scripts/ascii-to-tiled.mjs <bản phác.json> <ra.json>');
  process.exit(1);
}
const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const rows = spec.rows;
const height = rows.length;
const width = Math.max(...rows.map((r) => r.length));
const legend = spec.legend ?? {};

const ground = new Array(width * height).fill(0);
const hazards = new Array(width * height).fill(0);
const objects = [];
let nextId = 1;

const props = (p = {}) =>
  Object.entries(p).map(([name, value]) => ({
    name,
    type: typeof value === 'boolean' ? 'bool' : typeof value === 'number' ? 'float' : 'string',
    value,
  }));

rows.forEach((row, y) => {
  for (let x = 0; x < width; x += 1) {
    const ch = row[x] ?? '.';
    const idx = y * width + x;
    if (ch === '#' || ch === '=') ground[idx] = TILE_IDS[ch] + 1;
    else if (ch === '^') hazards[idx] = TILE_IDS[ch] + 1;
    else if (ch === '.' || ch === ' ') continue;
    else if (legend[ch]) {
      const l = legend[ch];
      // Điểm đặt ở giữa đáy ô (chân đối tượng), cách đáy 1 px để vẫn nằm trong ô.
      objects.push({
        id: nextId++,
        name: l.name ?? '',
        type: l.class,
        x: (x + 0.5) * TILE,
        y: (y + 1) * TILE - 1,
        width: 0,
        height: 0,
        point: true,
        rotation: 0,
        visible: true,
        properties: props(l.props),
      });
    } else {
      throw new Error(`Ký tự "${ch}" ở dòng ${y}, cột ${x} không có trong legend`);
    }
  }
});

const triggers = [];
for (const o of spec.objects ?? []) {
  const base = {
    id: nextId++,
    name: o.name ?? '',
    type: o.class,
    rotation: 0,
    visible: true,
    properties: props(o.props),
  };
  if (o.rect) {
    const [c0, r0, c1, r1] = o.rect;
    triggers.push({
      ...base,
      x: c0 * TILE,
      y: r0 * TILE,
      width: (c1 - c0 + 1) * TILE,
      height: (r1 - r0 + 1) * TILE,
    });
  } else {
    triggers.push({
      ...base,
      x: o.col * TILE,
      y: (o.row ?? 0) * TILE,
      width: 0,
      height: 0,
      point: true,
    });
  }
}

const outDir = dirname(outPath);
const imagePath = join(outDir, TILESET_IMAGE);
if (!existsSync(imagePath)) writeFileSync(imagePath, tilesetPng());

const map = {
  type: 'map',
  version: '1.10',
  tiledversion: '1.10.2',
  orientation: 'orthogonal',
  renderorder: 'right-down',
  infinite: false,
  width,
  height,
  tilewidth: TILE,
  tileheight: TILE,
  nextlayerid: 5,
  nextobjectid: nextId,
  properties: props({ name: spec.name ?? '' }),
  tilesets: [
    {
      firstgid: 1,
      name: 'graybox',
      image: relative(outDir, imagePath),
      imagewidth: TILE * 3,
      imageheight: TILE,
      tilewidth: TILE,
      tileheight: TILE,
      tilecount: 3,
      columns: 3,
      margin: 0,
      spacing: 0,
      tiles: [
        { id: 0, properties: props({ solid: true }) },
        { id: 1, properties: props({ oneway: true }) },
        { id: 2, properties: props({ hazard: true }) },
      ],
    },
  ],
  layers: [
    tileLayer(1, 'ground', ground),
    tileLayer(2, 'hazards', hazards),
    objectLayer(3, 'entities', objects),
    objectLayer(4, 'triggers', triggers),
  ],
};
writeFileSync(outPath, `${JSON.stringify(map, null, 1)}\n`);
console.log(
  `Đã ghi ${outPath} (${width} × ${height} ô, ${objects.length + triggers.length} đối tượng)`,
);

function tileLayer(id, name, data) {
  return {
    id,
    name,
    type: 'tilelayer',
    width,
    height,
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
    data,
  };
}

function objectLayer(id, name, list) {
  return {
    id,
    name,
    type: 'objectgroup',
    draworder: 'topdown',
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
    objects: list,
  };
}

/** Ảnh tileset xám 48 × 16: đặc, bục một chiều, gai (PNG tự mã hóa, không cần thư viện). */
function tilesetPng() {
  const w = TILE * 3;
  const h = TILE;
  const px = Buffer.alloc((w * 4 + 1) * h);
  const set = (x, y, [r, g, b, a]) => {
    const i = y * (w * 4 + 1) + 1 + x * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = a;
  };
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      set(x, y, y < 2 ? [0x81, 0x93, 0xad, 255] : [0x4a, 0x55, 0x68, 255]);
      set(TILE + x, y, y < 4 ? [0x8f, 0xa3, 0xbf, 255] : [0, 0, 0, 0]);
      const spike = y >= 6 && Math.abs((x % 8) - 3.5) <= (y - 6) / 2.5;
      set(TILE * 2 + x, y, spike ? [0xff, 0x6b, 0x6b, 255] : [0, 0, 0, 0]);
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(px)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
