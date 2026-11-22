import { Tile, TileMap } from '../tilemap';
import type { LaserDirection, MirrorAngle } from './laser-path';

/**
 * Bố cục một màn (logic thuần): lưới ô và mọi đối tượng đặt sẵn, tính theo ô. Cùng một cấu trúc
 * cho bản đồ ASCII (màn xám, phòng thử) và bản đồ Tiled (M7), nên StageWorld không cần biết
 * màn đến từ đâu. Mỗi lần vào màn dựng một bố cục mới, vì lưới ô bị đổi khi chơi (cửa, rễ khô).
 */

/** Một ô, (col, row) tính từ góc trên trái. Đối tượng "đứng" trên ô thì đáy ô là mặt đất. */
export interface Cell {
  col: number;
  row: number;
}

/** Checkpoint; `difficulties` (chỉ bản đồ Tiled): chỉ có ở các độ khó này (GDD 11 mục 2.4). */
export interface CheckpointSpawn extends Cell {
  difficulties?: readonly string[];
}

export interface EnemySpawn extends Cell {
  /** id trong enemies.json. */
  enemy: string;
  /** Prologue nhịp 1–3: chỉ đẩy lùi, không mất máu. */
  harmless: boolean;
}

export interface TargetSpawn extends Cell {
  /** Bia có khiên mặt trái. */
  shield: boolean;
}

/** Dây leo đu: (col, row) là ô treo dây (điểm treo ở mép trên ô). */
export interface VineSpawn extends Cell {
  /** Chiều dài dây (ô). Không có thì lấy mặc định trong stages.json. */
  lengthTiles?: number;
  /** Lệch pha 0–1 so với các dây khác. */
  phase: number;
}

/** Mép trái và mặt trên của bệ, tọa độ ô từ 0. */
export interface PlatformSpawn extends Cell {
  widthTiles: number;
}

export interface CrumbleSpawn extends PlatformSpawn {
  mode: 'break' | 'sink';
}

export interface CloudDriftSpawn extends PlatformSpawn {
  /** Mép trái và mặt trên ở đầu còn lại của đường trôi. */
  end: Cell;
}

/**
 * Phòng khóa: hai cột mép trái/phải (`first`, `last`) chứa cửa, hàng `top`..`bottom`. Vào hẳn bên
 * trong thì cửa đóng tới khi hạ hết kẻ địch xuất phát trong phòng.
 */
export interface RoomSpawn {
  first: number;
  last: number;
  top: number;
  bottom: number;
  doors: Cell[];
  /** Mini-boss chạy bằng Boss (Q1), lấy cấu hình từ bosses.json. */
  miniBoss?: Cell & { id: string };
}

/** Vật phẩm bí mật nhặt một lần (Memory Log, Nano Cell, Hạt Giống, Két giáp...). */
export interface SecretSpawn extends Cell {
  item: string;
  /** Tên hiện cho người chơi (tên đối tượng trong Tiled); không có thì dùng `item`. */
  label: string;
}

/** Vật chắn (rễ khô...) đặc như tường, chỉ vỡ khi trúng đúng vũ khí. Tính theo ô, gồm cả hai đầu. */
export interface CellSpan {
  first: number;
  last: number;
  top: number;
  bottom: number;
}

export interface BarrierSpawn extends CellSpan {
  /** Tên vũ khí trong weapons.json (ví dụ "Prism Beam"). */
  requiresWeapon: string;
}

export interface LaserSpawn extends Cell {
  direction: LaserDirection;
  mode: 'always' | 'pulse';
  phase: number;
}

export interface MirrorSpawn extends Cell {
  angle: MirrorAngle;
}

export interface SensorSpawn extends Cell {
  doorId: number;
}

export interface OpticalDoorSpawn extends CellSpan {
  id: number;
}

export interface OpticsLayout {
  lasers: LaserSpawn[];
  mirrors: MirrorSpawn[];
  sensors: SensorSpawn[];
  doors: OpticalDoorSpawn[];
}

export interface SectionSpawn {
  id: string;
  label: string;
  /** Cột ô bắt đầu đoạn. */
  fromCol: number;
}

export interface StageLayout {
  map: TileMap;
  spawn: Cell;
  enemies: EnemySpawn[];
  targets: TargetSpawn[];
  boss?: Cell;
  /** Cửa phòng boss: một cột, nhiều hàng. */
  gate?: { col: number; rows: number[] };
  /** Theo thứ tự đi qua (cột tăng dần). */
  checkpoints: CheckpointSpawn[];
  vines: VineSpawn[];
  rooms: RoomSpawn[];
  secrets: SecretSpawn[];
  barriers: BarrierSpawn[];
  /** Vùng dòng làm mát; các ô trống cho tới khi đóng băng. */
  coolant?: CellSpan[];
  crumbles?: CrumbleSpawn[];
  cloudDrifts?: CloudDriftSpawn[];
  optics?: OpticsLayout;
  sections: SectionSpawn[];
}

/** Ký hiệu chữ hoa trên bản đồ ASCII → kẻ địch. */
export type EnemyMarkers = Readonly<Record<string, { enemy: string; harmless?: boolean }>>;

/**
 * Chữ hoa có nghĩa cố định trên bản đồ ASCII; mọi chữ hoa khác tra bảng kẻ địch của màn.
 *   P xuất phát · T bia · S bia có khiên · B boss · D cửa phòng boss · C checkpoint
 *   V điểm treo dây leo đu · L ô cửa phòng khóa (hai cột L liên tiếp là mép một phòng)
 */
export const RESERVED_MARKERS = ['P', 'T', 'S', 'B', 'D', 'C', 'V', 'L'] as const;

/** Dựng bố cục từ bản đồ ASCII (ký hiệu: logic/tilemap.ts và RESERVED_MARKERS). */
export function layoutFromRows(
  rows: readonly string[],
  tileSize: number,
  enemyMarkers: EnemyMarkers = {},
  sections: readonly SectionSpawn[] = [],
): StageLayout {
  const map = TileMap.fromRows(rows, tileSize);
  const at = (ch: string): Cell[] =>
    map.markers.filter((m) => m.ch === ch).map(({ col, row }) => ({ col, row }));
  const spawn = at('P')[0] ?? { col: 2, row: map.rows - 2 };
  const gates = at('D');
  const boss = at('B')[0];
  const enemies: EnemySpawn[] = [];
  for (const m of map.markers) {
    const place = enemyMarkers[m.ch];
    if (place)
      enemies.push({ col: m.col, row: m.row, enemy: place.enemy, harmless: !!place.harmless });
    else if (!(RESERVED_MARKERS as readonly string[]).includes(m.ch))
      throw new Error(`Ký hiệu "${m.ch}" ở (${m.col}, ${m.row}) không có trong bảng kẻ địch`);
  }
  return {
    map,
    spawn,
    enemies,
    targets: map.markers
      .filter((m) => m.ch === 'T' || m.ch === 'S')
      .map((m) => ({ col: m.col, row: m.row, shield: m.ch === 'S' })),
    ...(boss ? { boss } : {}),
    ...(gates[0] ? { gate: { col: gates[0].col, rows: gates.map((g) => g.row) } } : {}),
    checkpoints: at('C').sort((a, b) => a.col - b.col),
    vines: at('V').map((c) => ({ ...c, phase: 0 })),
    rooms: roomsFromDoorCells(at('L'), map.rows),
    secrets: [],
    barriers: [],
    sections: [...sections],
  };
}

/** Ô 'L' gom theo cột; hai cột liên tiếp (1–2, 3–4...) là mép trái/phải của một phòng. */
function roomsFromDoorCells(cells: readonly Cell[], mapRows: number): RoomSpawn[] {
  const cols = [...new Set(cells.map((c) => c.col))].sort((a, b) => a - b);
  if (cols.length % 2 !== 0) throw new Error('Phòng khóa cần cột cửa L theo cặp (trái, phải)');
  const rooms: RoomSpawn[] = [];
  for (let i = 0; i < cols.length; i += 2) {
    const first = cols[i]!;
    const last = cols[i + 1]!;
    rooms.push({
      first,
      last,
      top: 0,
      bottom: mapRows - 1,
      doors: cells.filter((c) => c.col === first || c.col === last),
    });
  }
  return rooms;
}

/** Ô trống trên hai cột mép của một vùng: chỗ đặt cửa phòng khóa dựng từ Tiled. */
export function edgeDoorCells(
  map: TileMap,
  first: number,
  last: number,
  top: number,
  bottom: number,
): Cell[] {
  const out: Cell[] = [];
  for (const col of [first, last])
    for (let row = top; row <= bottom; row += 1)
      if (map.get(col, row) === Tile.Empty) out.push({ col, row });
  return out;
}

/** Kẻ địch đặt gần điểm xuất phát/checkpoint dưới `minTiles` ô (quy tắc đặc tả mục 4). */
export function spawnDistanceViolations(layout: StageLayout, minTiles: number): string[] {
  const safe = [
    { name: 'xuất phát', ...layout.spawn },
    ...layout.checkpoints.map((c, i) => ({ name: `checkpoint ${i + 1}`, ...c })),
  ];
  const out: string[] = [];
  for (const e of layout.enemies) {
    for (const s of safe) {
      const d = Math.hypot(e.col - s.col, e.row - s.row);
      if (d < minTiles) out.push(`${e.enemy} (${e.col},${e.row}) cách ${s.name} ${d.toFixed(1)} ô`);
    }
  }
  return out;
}
