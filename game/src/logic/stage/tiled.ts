import { isObject, type Json } from '../../core/json-check';
import { firstFlightHit } from '../combat/flight';
import { Tile, TileMap } from '../tilemap';
import {
  LASER_DIRECTIONS,
  type LaserDirection,
  MIRROR_ANGLES,
  type MirrorAngle,
} from './laser-path';
import {
  type BarrierSpawn,
  type Cell,
  type CloudDriftSpawn,
  type CrumbleSpawn,
  edgeDoorCells,
  type EnemySpawn,
  type OpticsLayout,
  type RoomSpawn,
  type SecretSpawn,
  type SectionSpawn,
  type StageLayout,
  type TargetSpawn,
  type VineSpawn,
} from './layout';

/**
 * Nạp bản đồ Tiled định dạng JSON (.json / .tmj, Tiled 1.8+) thành StageLayout (logic thuần).
 *
 * Quy ước (xem thêm game/maps/README.md):
 * - Bản đồ trực giao, không vô hạn, ô vuông đúng `tileSize`; tileset nhúng trong bản đồ.
 * - Lớp ô `ground`: ô có thuộc tính bool `solid`, `oneway` hoặc `hazard`; ô không có thuộc
 *   tính nào tính là đặc. Lớp ô `hazards`: mọi ô là gai. Các lớp ô khác chỉ để trang trí.
 *   Trùng ô thì đặc > gai > bục một chiều.
 * - Lớp đối tượng `entities` và `triggers` (tên lớp không bắt buộc, chỉ cần đúng class):
 *   spawn, checkpoint, enemy {enemy, harmless?}, target {shield?}, boss, gate (hình chữ nhật
 *   phủ các ô cửa), vine {length?, phase?}, room (hình chữ nhật, mép trái/phải là cột cửa),
 *   secret {item}, barrier (hình chữ nhật) {requiresWeapon}, section {id?} (tên = nhãn).
 */

/** Cờ lật/xoay nằm ở 4 bit cao của gid (Tiled 1.9+). */
const GID_MASK = 0x0fffffff;
const TILE_LAYERS = { ground: 'ground', hazards: 'hazards' } as const;
const OBJECT_CLASSES = [
  'spawn',
  'checkpoint',
  'enemy',
  'target',
  'boss',
  'miniBoss',
  'gate',
  'vine',
  'room',
  'secret',
  'barrier',
  'laser',
  'mirror',
  'lightSensor',
  'opticalDoor',
  'coolant',
  'crumblePlatform',
  'cloudDrift',
  'section',
] as const;
type ObjectClass = (typeof OBJECT_CLASSES)[number];

export class TiledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TiledError';
  }
}

interface TiledObject {
  id: number;
  name: string;
  cls: ObjectClass;
  x: number;
  y: number;
  w: number;
  h: number;
  point: boolean;
  props: Readonly<Record<string, unknown>>;
}

function fail(where: string, msg: string): never {
  throw new TiledError(`${where}: ${msg}`);
}

function int(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) fail(where, 'cần số nguyên ≥ 0');
  return v;
}

/** Mảng `properties` của Tiled → bảng tên → giá trị. */
function propsOf(v: unknown, where: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (v === undefined) return out;
  if (!Array.isArray(v)) fail(where, 'properties phải là mảng');
  for (const p of v) {
    if (!isObject(p) || typeof p.name !== 'string') fail(where, 'thuộc tính thiếu tên');
    out[p.name] = p.value;
  }
  return out;
}

function propStr(props: Readonly<Record<string, unknown>>, key: string, where: string): string {
  const v = props[key];
  if (typeof v !== 'string' || v.length === 0) fail(where, `cần thuộc tính chuỗi "${key}"`);
  return v;
}

function propNum(
  props: Readonly<Record<string, unknown>>,
  key: string,
  where: string,
): number | undefined {
  const v = props[key];
  if (v === undefined) return undefined;
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(where, `thuộc tính "${key}" phải là số`);
  return v;
}

function propBool(props: Readonly<Record<string, unknown>>, key: string, where: string): boolean {
  const v = props[key];
  if (v === undefined) return false;
  if (typeof v !== 'boolean') fail(where, `thuộc tính "${key}" phải là bool`);
  return v;
}

/** gid → loại ô theo thuộc tính trong tileset nhúng. */
function tileKinds(tilesets: unknown): Map<number, Tile> {
  const kinds = new Map<number, Tile>();
  if (!Array.isArray(tilesets)) fail('tilesets', 'cần một mảng');
  tilesets.forEach((ts, i) => {
    const where = `tilesets[${i}]`;
    if (!isObject(ts)) fail(where, 'cần một object');
    if (ts.source !== undefined)
      fail(where, `tileset ngoài "${String(ts.source)}": hãy nhúng tileset vào bản đồ (Embed)`);
    const first = int(ts.firstgid, `${where}.firstgid`);
    const tiles = ts.tiles ?? [];
    if (!Array.isArray(tiles)) fail(`${where}.tiles`, 'cần một mảng');
    for (const t of tiles) {
      if (!isObject(t)) continue;
      const id = int(t.id, `${where}.tiles.id`);
      const p = propsOf(t.properties, `${where}.tiles[${id}]`);
      const w = `${where}.tiles[${id}]`;
      if (propBool(p, 'solid', w)) kinds.set(first + id, Tile.Solid);
      else if (propBool(p, 'hazard', w)) kinds.set(first + id, Tile.Hazard);
      else if (propBool(p, 'oneway', w)) kinds.set(first + id, Tile.OneWay);
    }
  });
  return kinds;
}

const PRIORITY: Readonly<Record<Tile, number>> = {
  [Tile.Empty]: 0,
  [Tile.OneWay]: 1,
  [Tile.Hazard]: 2,
  [Tile.Solid]: 3,
};

function readObject(o: unknown, where: string): TiledObject | undefined {
  if (!isObject(o)) fail(where, 'cần một object');
  // Tiled ≤ 1.8 ghi "type", 1.9 ghi "class", 1.10+ lại ghi "type".
  const cls = o.type ?? o.class;
  if (cls === undefined || cls === '') return undefined; // đối tượng ghi chú, bỏ qua
  if (typeof cls !== 'string' || !(OBJECT_CLASSES as readonly string[]).includes(cls))
    fail(where, `class "${String(cls)}" lạ (dùng: ${OBJECT_CLASSES.join(', ')})`);
  const num = (v: unknown, k: string): number => {
    if (typeof v !== 'number' || !Number.isFinite(v)) fail(where, `${k} phải là số`);
    return v;
  };
  const w = o.width === undefined ? 0 : num(o.width, 'width');
  const h = o.height === undefined ? 0 : num(o.height, 'height');
  // Đối tượng ô (có gid) neo ở góc dưới trái; đưa về góc trên trái như hình chữ nhật.
  const y = num(o.y, 'y') - (o.gid !== undefined ? h : 0);
  return {
    id: typeof o.id === 'number' ? o.id : 0,
    name: typeof o.name === 'string' ? o.name : '',
    cls: cls as ObjectClass,
    x: num(o.x, 'x'),
    y,
    w,
    h,
    point: o.point === true || (w === 0 && h === 0),
    props: propsOf(o.properties, where),
  };
}

/**
 * Đọc bản đồ Tiled. `tileSize` là cỡ ô của game (16); bản đồ khác cỡ thì báo lỗi.
 * Mọi lỗi là TiledError có chỉ rõ lớp/đối tượng sai để sửa trong Tiled.
 */
export function layoutFromTiled(json: unknown, tileSize: number): StageLayout {
  if (!isObject(json)) fail('bản đồ', 'cần một object JSON');
  const m: Json = json;
  if (m.orientation !== undefined && m.orientation !== 'orthogonal')
    fail('bản đồ', 'chỉ hỗ trợ bản đồ trực giao (orthogonal)');
  if (m.infinite === true) fail('bản đồ', 'không hỗ trợ bản đồ vô hạn (bỏ chọn Infinite)');
  const cols = int(m.width, 'width');
  const rows = int(m.height, 'height');
  if (m.tilewidth !== tileSize || m.tileheight !== tileSize)
    fail('bản đồ', `ô phải là ${tileSize} × ${tileSize} px`);
  const kinds = tileKinds(m.tilesets);
  if (!Array.isArray(m.layers)) fail('layers', 'cần một mảng');

  const tiles = new Uint8Array(cols * rows);
  const objects: TiledObject[] = [];
  const walk = (layers: unknown[], prefix: string): void => {
    layers.forEach((layer, i) => {
      if (!isObject(layer)) fail(`${prefix}[${i}]`, 'cần một object');
      const name = typeof layer.name === 'string' ? layer.name : `#${i}`;
      const where = `lớp "${name}"`;
      if (layer.type === 'group') {
        walk(Array.isArray(layer.layers) ? layer.layers : [], `${where}.layers`);
      } else if (layer.type === 'tilelayer') {
        if (name !== TILE_LAYERS.ground && name !== TILE_LAYERS.hazards) return; // trang trí
        if (layer.encoding !== undefined && layer.encoding !== 'csv')
          fail(where, 'lưu lớp ô dạng CSV (Map → Map Properties → Tile Layer Format)');
        if (layer.width !== cols || layer.height !== rows)
          fail(where, `kích thước phải bằng bản đồ (${cols} × ${rows})`);
        const data = layer.data;
        if (!Array.isArray(data) || data.length !== cols * rows)
          fail(where, `data cần ${cols * rows} ô`);
        data.forEach((raw, idx) => {
          const gid = int(raw, `${where}.data[${idx}]`) & GID_MASK;
          if (gid === 0) return;
          const kind = name === TILE_LAYERS.hazards ? Tile.Hazard : (kinds.get(gid) ?? Tile.Solid);
          if (PRIORITY[kind] > PRIORITY[(tiles[idx] ?? 0) as Tile]) tiles[idx] = kind;
        });
      } else if (layer.type === 'objectgroup') {
        const list = Array.isArray(layer.objects) ? layer.objects : [];
        list.forEach((o, j) => {
          const obj = readObject(o, `${where}, đối tượng ${j}`);
          if (obj) objects.push(obj);
        });
      }
    });
  };
  walk(m.layers, 'layers');

  return buildLayout(TileMap.fromTiles(cols, rows, tileSize, tiles), objects);
}

function buildLayout(map: TileMap, objects: readonly TiledObject[]): StageLayout {
  const t = map.tileSize;
  const label = (o: TiledObject): string =>
    `đối tượng ${o.cls}${o.name ? ` "${o.name}"` : ''} (id ${o.id})`;
  /** Ô chứa đối tượng: điểm thì ô dưới điểm, hình chữ nhật thì ô ở tâm. */
  const cellOf = (o: TiledObject): Cell => {
    const x = o.point ? o.x : o.x + o.w / 2;
    const y = o.point ? o.y : o.y + o.h / 2;
    const cell = { col: Math.floor(x / t), row: Math.floor(y / t) };
    if (cell.col < 0 || cell.col >= map.cols || cell.row < 0 || cell.row >= map.rows)
      fail(label(o), 'nằm ngoài bản đồ');
    return cell;
  };
  /** Vùng ô (gồm hai đầu) mà hình chữ nhật phủ. */
  const span = (o: TiledObject): { first: number; last: number; top: number; bottom: number } => {
    if (o.point || o.w <= 0 || o.h <= 0) fail(label(o), 'cần là hình chữ nhật');
    const r = {
      first: Math.floor(o.x / t + 1e-6),
      last: Math.ceil((o.x + o.w) / t - 1e-6) - 1,
      top: Math.floor(o.y / t + 1e-6),
      bottom: Math.ceil((o.y + o.h) / t - 1e-6) - 1,
    };
    if (r.first < 0 || r.top < 0 || r.last >= map.cols || r.bottom >= map.rows)
      fail(label(o), 'vượt ra ngoài bản đồ');
    return r;
  };
  const of = (cls: ObjectClass): TiledObject[] => objects.filter((o) => o.cls === cls);

  const spawns = of('spawn');
  if (spawns.length !== 1) fail('bản đồ', `cần đúng 1 đối tượng spawn (đang có ${spawns.length})`);
  const bosses = of('boss');
  if (bosses.length > 1) fail('bản đồ', 'chỉ được 1 boss');
  const gates = of('gate');
  if (gates.length > 1) fail('bản đồ', 'chỉ được 1 cửa phòng boss (gate)');
  if ((bosses.length === 1) !== (gates.length === 1))
    fail('bản đồ', 'boss và cửa phòng boss (gate) phải đi cùng nhau');

  const enemies: EnemySpawn[] = of('enemy').map((o) => ({
    ...cellOf(o),
    enemy: propStr(o.props, 'enemy', label(o)),
    harmless: propBool(o.props, 'harmless', label(o)),
  }));
  const targets: TargetSpawn[] = of('target').map((o) => ({
    ...cellOf(o),
    shield: propBool(o.props, 'shield', label(o)),
  }));
  const vines: VineSpawn[] = of('vine').map((o) => {
    const length = propNum(o.props, 'length', label(o));
    const phase = propNum(o.props, 'phase', label(o)) ?? 0;
    if (length !== undefined && length <= 0) fail(label(o), 'length phải > 0');
    return { ...cellOf(o), ...(length !== undefined ? { lengthTiles: length } : {}), phase };
  });
  const rooms: RoomSpawn[] = of('room').map((o) => {
    const s = span(o);
    if (s.last - s.first < 2) fail(label(o), 'phòng khóa cần rộng ít nhất 3 ô');
    const doors = edgeDoorCells(map, s.first, s.last, s.top, s.bottom);
    if (doors.length === 0) fail(label(o), 'mép trái/phải không có ô trống để làm cửa');
    return { ...s, doors };
  });
  for (const o of of('miniBoss')) {
    const cell = cellOf(o);
    const enclosing = rooms.filter(
      (r) => cell.col > r.first && cell.col < r.last && cell.row >= r.top && cell.row <= r.bottom,
    );
    const room = enclosing[0];
    if (!room || enclosing.length !== 1)
      fail(label(o), 'mini-boss phải nằm trong đúng một phòng khóa');
    if (room.miniBoss) fail(label(o), 'phòng khóa chỉ có một mini-boss dùng lớp Boss');
    if (map.get(cell.col, cell.row) !== Tile.Empty)
      fail(label(o), 'điểm xuất hiện mini-boss phải trống');
    for (let col = room.first + 1; col < room.last; col += 1) {
      if (room.bottom + 1 >= map.rows || !map.isSolid(col, room.bottom + 1))
        fail(label(o), 'phòng mini-boss cần sàn đặc liền hàng dưới phòng');
    }
    room.miniBoss = { ...cell, id: propStr(o.props, 'boss', label(o)) };
  }
  const secrets: SecretSpawn[] = of('secret').map((o) => ({
    ...cellOf(o),
    item: propStr(o.props, 'item', label(o)),
    label: o.name || propStr(o.props, 'item', label(o)),
  }));
  const barriers: BarrierSpawn[] = of('barrier').map((o) => ({
    ...span(o),
    requiresWeapon: propStr(o.props, 'requiresWeapon', label(o)),
  }));
  const sections: SectionSpawn[] = of('section')
    .map((o, i) => ({
      id: typeof o.props.id === 'string' && o.props.id ? o.props.id : `s${i + 1}`,
      label: o.name || `Đoạn ${i + 1}`,
      fromCol: Math.max(0, Math.floor(o.x / t)),
    }))
    .sort((a, b) => a.fromCol - b.fromCol);

  let gate: StageLayout['gate'];
  if (gates[0]) {
    const s = span(gates[0]);
    if (s.first !== s.last) fail(label(gates[0]), 'cửa phòng boss rộng đúng 1 ô');
    gate = {
      col: s.first,
      rows: Array.from({ length: s.bottom - s.top + 1 }, (_, i) => s.top + i),
    };
  }

  const doorCells = new Set(
    rooms.flatMap((room) => room.doors).map(({ col, row }) => row * map.cols + col),
  );
  if (gate) for (const row of gate.rows) doorCells.add(row * map.cols + gate.col);
  const overlapsBarrier = (col: number, row: number): boolean =>
    barriers.some(
      ({ first, last, top, bottom }) => col >= first && col <= last && row >= top && row <= bottom,
    );
  const opticalDoors: OpticsLayout['doors'] = [];
  const doorIds = new Set<number>();
  for (const o of of('opticalDoor')) {
    if (!Number.isSafeInteger(o.id) || o.id <= 0 || doorIds.has(o.id))
      fail(label(o), 'cần id Tiled dương và duy nhất');
    const s = span(o);
    for (let row = s.top; row <= s.bottom; row += 1) {
      for (let col = s.first; col <= s.last; col += 1) {
        const key = row * map.cols + col;
        if (map.get(col, row) !== Tile.Empty || doorCells.has(key) || overlapsBarrier(col, row))
          fail(label(o), `ô cửa (${col}, ${row}) phải trống`);
        doorCells.add(key);
      }
    }
    doorIds.add(o.id);
    opticalDoors.push({ ...s, id: o.id });
  }
  const opticalCells = new Set<number>();
  const opticalCell = (o: TiledObject): Cell => {
    const cell = cellOf(o);
    const { col, row } = cell;
    const key = row * map.cols + col;
    if (
      map.isSolid(col, row) ||
      doorCells.has(key) ||
      overlapsBarrier(col, row) ||
      opticalCells.has(key)
    )
      fail(label(o), `ô quang học (${col}, ${row}) bị chắn hoặc trùng đối tượng`);
    opticalCells.add(key);
    return cell;
  };
  const optics: OpticsLayout = {
    doors: opticalDoors,
    lasers: of('laser').map((o) => {
      const mode = propStr(o.props, 'mode', label(o));
      if (mode !== 'always' && mode !== 'pulse') fail(label(o), 'mode phải là always hoặc pulse');
      const direction = propStr(o.props, 'direction', label(o));
      if (!LASER_DIRECTIONS.includes(direction as LaserDirection))
        fail(label(o), `direction cần một trong ${LASER_DIRECTIONS.join(', ')}`);
      const phase = propNum(o.props, 'phase', label(o)) ?? 0;
      if (phase < 0 || phase > 1) fail(label(o), 'phase cần nằm trong 0–1');
      return { ...opticalCell(o), mode, direction: direction as LaserDirection, phase };
    }),
    mirrors: of('mirror').map((o) => {
      const angle = propNum(o.props, 'angle', label(o));
      if (!MIRROR_ANGLES.includes(angle as MirrorAngle))
        fail(label(o), `angle cần một trong ${MIRROR_ANGLES.join(', ')}`);
      return { ...opticalCell(o), angle: angle as MirrorAngle };
    }),
    sensors: of('lightSensor').map((o) => {
      const doorId = propNum(o.props, 'door', label(o));
      if (doorId === undefined || !doorIds.has(doorId))
        fail(label(o), 'door phải trỏ tới id đối tượng opticalDoor');
      return { ...opticalCell(o), doorId };
    }),
  };
  const hasOptics = opticalCells.size > 0 || opticalDoors.length > 0;
  const coolantCells = new Set<number>();
  const coolant = of('coolant').map((o) => {
    const region = span(o);
    for (let row = region.top; row <= region.bottom; row += 1) {
      for (let col = region.first; col <= region.last; col += 1) {
        const key = row * map.cols + col;
        if (
          map.get(col, row) !== Tile.Empty ||
          doorCells.has(key) ||
          overlapsBarrier(col, row) ||
          coolantCells.has(key)
        )
          fail(label(o), `ô dòng làm mát (${col}, ${row}) phải trống`);
        coolantCells.add(key);
      }
    }
    return region;
  });

  const platformCells = new Map<number, TiledObject>();
  const reservePlatform = (o: TiledObject, { col: first, row }: Cell, width: number): void => {
    if (first < 0 || first + width > map.cols || row < 0 || row >= map.rows)
      fail(label(o), 'bệ vượt ra ngoài bản đồ');
    for (let col = first; col < first + width; col += 1) {
      const key = row * map.cols + col;
      const occupied = platformCells.get(key);
      if (
        map.get(col, row) !== Tile.Empty ||
        doorCells.has(key) ||
        overlapsBarrier(col, row) ||
        opticalCells.has(key) ||
        coolantCells.has(key) ||
        (occupied !== undefined && occupied !== o)
      )
        fail(label(o), `ô bệ (${col}, ${row}) phải trống`);
      platformCells.set(key, o);
    }
  };
  const platformOrigin = (o: TiledObject) => {
    if (
      o.point ||
      o.h !== t ||
      ![o.x, o.y, o.w].every((px) => Number.isInteger(px / t)) ||
      o.w <= 0
    )
      fail(label(o), 'bệ cần hình chữ nhật cao 1 ô, căn theo lưới');
    const start = { col: o.x / t, row: o.y / t, widthTiles: o.w / t };
    reservePlatform(o, start, start.widthTiles);
    return start;
  };
  const crumbles: CrumbleSpawn[] = of('crumblePlatform').map((o) => {
    const mode = propStr(o.props, 'mode', label(o));
    if (mode !== 'break' && mode !== 'sink') fail(label(o), 'mode phải là break hoặc sink');
    return { ...platformOrigin(o), mode };
  });
  const cloudDrifts: CloudDriftSpawn[] = of('cloudDrift').map((o) => {
    const start = platformOrigin(o);
    const col = propNum(o.props, 'endCol', label(o));
    const row = propNum(o.props, 'endRow', label(o));
    if (col === undefined || row === undefined || !Number.isInteger(col) || !Number.isInteger(row))
      fail(label(o), 'endCol và endRow phải là tọa độ ô nguyên');
    if (col === start.col && row === start.row) fail(label(o), 'hai đầu đường trôi phải khác nhau');
    const end = { col, row };
    reservePlatform(o, end, start.widthTiles);
    if (
      firstFlightHit(
        map,
        { x: o.x, y: o.y, w: o.w, h: 1 },
        (col - start.col) * t,
        (row - start.row) * t,
        false,
        (col, row) => doorCells.has(row * map.cols + col) || overlapsBarrier(col, row),
      )
    )
      fail(label(o), 'đường trôi chạm khối đặc hoặc cửa');
    return { ...start, end };
  });

  return {
    map,
    spawn: cellOf(spawns[0]!),
    enemies,
    targets,
    ...(bosses[0] ? { boss: cellOf(bosses[0]) } : {}),
    ...(gate ? { gate } : {}),
    checkpoints: of('checkpoint')
      .map((o) => {
        // Thuộc tính tùy chọn `difficulties`: id độ khó cách nhau bằng dấu phẩy (GDD 11 mục 2.4).
        const raw = o.props.difficulties;
        if (raw === undefined) return cellOf(o);
        if (typeof raw !== 'string') fail(label(o), 'difficulties phải là chuỗi');
        const ids = raw
          .split(',')
          .map((x) => x.trim())
          .filter((x) => x.length > 0);
        if (ids.length === 0) fail(label(o), 'difficulties rỗng');
        return { ...cellOf(o), difficulties: ids };
      })
      .sort((a, b) => a.col - b.col),
    vines,
    rooms,
    secrets,
    barriers,
    ...(coolant.length ? { coolant } : {}),
    ...(crumbles.length ? { crumbles } : {}),
    ...(cloudDrifts.length ? { cloudDrifts } : {}),
    ...(hasOptics ? { optics } : {}),
    sections,
  };
}
