import type { BossData } from '../../core/boss-config';
import type { PlayerData } from '../../core/player-config';
import type { WeaponsData } from '../../core/weapons-config';

/**
 * Bảng chỉnh cảm giác ở cổng Prototype (logic thuần): danh sách thông số chỉnh được,
 * đọc/ghi theo đường dẫn, kẹp giá trị cho hợp lệ, và xuất phần đã đổi theo từng file dữ liệu
 * để dán vào 03-Data.
 */
export type TuningFile = 'player' | 'weapons' | 'boss';

export interface TuningField {
  file: TuningFile;
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

export const TUNING_FIELDS: readonly TuningField[] = [
  {
    file: 'player',
    path: 'speedTilesPerSec',
    label: 'Tốc độ chạy (ô/s)',
    min: 3,
    max: 9,
    step: 0.1,
  },
  {
    file: 'player',
    path: 'jump.maxTiles',
    label: 'Nhảy cao tối đa (ô)',
    min: 2.5,
    max: 6,
    step: 0.1,
  },
  {
    file: 'player',
    path: 'jump.minTiles',
    label: 'Nhảy thấp nhất (ô)',
    min: 0.5,
    max: 3,
    step: 0.1,
  },
  {
    file: 'player',
    path: 'jump.apexSec',
    label: 'Thời gian lên đỉnh (s)',
    min: 0.25,
    max: 0.7,
    step: 0.01,
  },
  {
    file: 'player',
    path: 'jump.fallGravityMul',
    label: 'Rơi nặng hơn lên (×)',
    min: 1,
    max: 3,
    step: 0.05,
  },
  {
    file: 'player',
    path: 'jump.maxFallTilesPerSec',
    label: 'Rơi tối đa (ô/s)',
    min: 8,
    max: 25,
    step: 0.5,
  },
  {
    file: 'player',
    path: 'jump.coyoteSec',
    label: 'Coyote time (s)',
    min: 0,
    max: 0.25,
    step: 0.01,
  },
  {
    file: 'player',
    path: 'jump.bufferSec',
    label: 'Jump buffer (s)',
    min: 0,
    max: 0.25,
    step: 0.01,
  },
  { file: 'player', path: 'dash.tiles', label: 'Lướt xa (ô)', min: 1.5, max: 5, step: 0.1 },
  {
    file: 'player',
    path: 'dash.durationSec',
    label: 'Lướt trong (s)',
    min: 0.1,
    max: 0.5,
    step: 0.01,
  },
  { file: 'player', path: 'dash.cooldownSec', label: 'Hồi lướt (s)', min: 0, max: 1.5, step: 0.05 },
  {
    file: 'player',
    path: 'wallSlideTilesPerSec',
    label: 'Trượt tường (ô/s)',
    min: 0.5,
    max: 6,
    step: 0.1,
  },
  {
    file: 'player',
    path: 'wallJump.pushTilesPerSec',
    label: 'Nhảy tường bật ra (ô/s)',
    min: 2,
    max: 12,
    step: 0.5,
  },
  {
    file: 'player',
    path: 'wallJump.lockSec',
    label: 'Nhảy tường khóa ngang (s)',
    min: 0,
    max: 0.4,
    step: 0.01,
  },
  {
    file: 'weapons',
    path: 'arcCannon.projectile.speedTilesPerSec',
    label: 'Tốc độ đạn (ô/s)',
    min: 6,
    max: 24,
    step: 0.5,
  },
  {
    file: 'weapons',
    path: 'arcCannon.fireIntervalSec',
    label: 'Cách giữa 2 phát (s)',
    min: 0.05,
    max: 0.4,
    step: 0.01,
  },
  {
    file: 'weapons',
    path: 'arcCannon.midCharge.timeSec',
    label: 'Nạp vừa sau (s)',
    min: 0.2,
    max: 1,
    step: 0.05,
  },
  {
    file: 'weapons',
    path: 'arcCannon.charge.timeSec',
    label: 'Nạp đầy sau (s)',
    min: 0.6,
    max: 2.5,
    step: 0.05,
  },
  { file: 'boss', path: 'hp', label: 'Máu boss xám', min: 30, max: 200, step: 5 },
  { file: 'boss', path: 'idleSec', label: 'Boss nghỉ giữa đòn (s)', min: 0.3, max: 2, step: 0.05 },
];

export interface TuningData {
  player: PlayerData;
  weapons: WeaponsData;
  boss: BossData;
}

type Bag = Record<string, unknown>;

export function getPath(root: unknown, path: string): number {
  let node: unknown = root;
  for (const key of path.split('.')) node = (node as Bag | undefined)?.[key];
  if (typeof node !== 'number') throw new Error(`Không đọc được số ở "${path}"`);
  return node;
}

/** Trả về bản sao có giá trị mới ở đường dẫn (không sửa bản gốc). */
export function setPath<T>(root: T, path: string, value: number): T {
  const keys = path.split('.');
  const copy = structuredClone(root) as Bag;
  let node = copy;
  for (const key of keys.slice(0, -1)) node = node[key] as Bag;
  node[keys[keys.length - 1] as string] = value;
  return copy as T;
}

function fileData(data: TuningData, file: TuningFile): unknown {
  return file === 'player' ? data.player : file === 'weapons' ? data.weapons : data.boss;
}

/** Đặt một giá trị: kẹp trong [min, max], làm tròn theo bước, giữ các ràng buộc giữa thông số. */
export function applyField(data: TuningData, field: TuningField, raw: number): TuningData {
  const decimals = Math.max(0, -Math.floor(Math.log10(field.step)));
  let value = Number(Math.min(field.max, Math.max(field.min, raw)).toFixed(decimals));
  if (field.path === 'jump.minTiles') value = Math.min(value, data.player.jump.maxTiles - 0.1);
  if (field.path === 'jump.maxTiles') value = Math.max(value, data.player.jump.minTiles + 0.1);
  if (field.path === 'arcCannon.midCharge.timeSec')
    value = Math.min(value, data.weapons.arcCannon.charge.timeSec - 0.05);
  if (field.path === 'arcCannon.charge.timeSec')
    value = Math.max(value, data.weapons.arcCannon.midCharge.timeSec + 0.05);
  value = Number(value.toFixed(decimals));
  switch (field.file) {
    case 'player':
      return { ...data, player: setPath(data.player, field.path, value) };
    case 'weapons':
      return { ...data, weapons: setPath(data.weapons, field.path, value) };
    case 'boss':
      return { ...data, boss: setPath(data.boss, field.path, value) };
  }
}

export function readField(data: TuningData, field: TuningField): number {
  return getPath(fileData(data, field.file), field.path);
}

/** Các thông số đã khác bản gốc, gom theo file dữ liệu (để dán vào 03-Data). */
export function tuningDiff(
  base: TuningData,
  current: TuningData,
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  const fileName: Record<TuningFile, string> = {
    player: 'player.json',
    weapons: 'weapons.json',
    boss: 'bosses.json › gray',
  };
  for (const f of TUNING_FIELDS) {
    const now = readField(current, f);
    if (now !== readField(base, f)) (out[fileName[f.file]] ??= {})[f.path] = now;
  }
  return out;
}

/** Áp lại các giá trị đã lưu (bỏ qua đường dẫn không còn trong danh sách). */
export function applyStored(
  base: TuningData,
  stored: Readonly<Record<string, number>>,
): TuningData {
  let data = base;
  for (const f of TUNING_FIELDS) {
    const v = stored[`${f.file}:${f.path}`];
    if (typeof v === 'number' && Number.isFinite(v)) data = applyField(data, f, v);
  }
  return data;
}

export function toStored(base: TuningData, current: TuningData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of TUNING_FIELDS) {
    const now = readField(current, f);
    if (now !== readField(base, f)) out[`${f.file}:${f.path}`] = now;
  }
  return out;
}
