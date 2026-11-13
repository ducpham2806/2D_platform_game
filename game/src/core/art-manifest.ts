import { arr, ConfigError, num, obj, str } from './json-check';

/**
 * Danh sách hình của game: `public/assets/assets.json`, do `05-Assets/tools/codeart/build.py`
 * sinh ra (hình vẽ bằng mã; thay hình thì đè file cùng tên, cùng cỡ khung). Logic thuần.
 */

export interface ArtSheet {
  key: string;
  file: string;
  frameW: number;
  frameH: number;
  frames: number;
  /** 0: không phải hoạt ảnh (tileset). */
  fps: number;
  loop: boolean;
}

export interface ArtImage {
  key: string;
  file: string;
}

export interface ArtManifest {
  sheets: ArtSheet[];
  images: ArtImage[];
}

export const STAGE_THEMES = ['lab', 'verdant'] as const;
export type StageTheme = (typeof STAGE_THEMES)[number];

/** Hoạt ảnh của Kai theo trạng thái (logic/player) và hai hoạt ảnh chết/hồi sinh. */
export const KAI_ANIMS = [
  'kai_idle',
  'kai_run',
  'kai_jump_up',
  'kai_jump_fall',
  'kai_land',
  'kai_dash',
  'kai_wall_slide',
  'kai_wall_jump',
  'kai_hurt',
  'kai_death',
  'kai_respawn',
] as const;

export const FX_SHEETS = [
  'fx_arc_shot',
  'fx_arc_mid',
  'fx_arc_charged',
  'fx_enemy_shot',
  'fx_muzzle',
  'fx_hit_spark',
  'fx_explosion_small',
  'fx_charge_1',
  'fx_charge_full',
  'obj_core_bit',
  'obj_health',
] as const;

/** Kẻ địch, mini-boss, boss: mỗi loại có `<gốc>_idle` và `<gốc>_attack` (báo trước đòn). */
export const ACTOR_BASES = [
  'en_drone',
  'en_turret',
  'en_butterfly',
  'en_spike_turret',
  'en_cocoon',
  'mb_golem',
  'boss_gray',
  'boss_thorna',
] as const;
export type ActorBase = (typeof ACTOR_BASES)[number];

const ACTOR_EXTRA = [
  'en_cocoon_shield',
  'boss_thorna_stun',
  'boss_thorna_die',
  'boss_thorna_core',
] as const;

export const PORTRAITS = [
  'portrait_nova',
  'portrait_thorna',
  'portrait_kai',
  'portrait_warden',
] as const;

/** Mọi spritesheet và ảnh mà mã nguồn dùng; thiếu cái nào thì game dừng ở màn tải. */
export const REQUIRED_SHEETS: readonly string[] = [
  ...KAI_ANIMS,
  ...FX_SHEETS,
  ...ACTOR_BASES.flatMap((b) => [`${b}_idle`, `${b}_attack`]),
  ...ACTOR_EXTRA,
  ...STAGE_THEMES.map((t) => `ts_${t}`),
];
export const REQUIRED_IMAGES: readonly string[] = [
  ...STAGE_THEMES.flatMap((t) => [`bg_${t}_l1`, `bg_${t}_l2`]),
  ...PORTRAITS,
];

/** Chỉ số ô trong tileset (xem 05-Assets/tools/codeart/tiles.py). */
export const TILE_INDEX = {
  oneWay: 0,
  spike: 1,
  gate: 2,
  barrier: 3,
  checkpointOff: 4,
  checkpointOn: 5,
  /** Khối đặc: cộng mặt nạ hàng xóm trống (1 trên, 2 phải, 4 dưới, 8 trái). */
  solidBase: 16,
} as const;

export function parseArtManifest(value: unknown): ArtManifest {
  const m = obj(value, 'assets');
  const sheets = arr(m.sheets, 'assets.sheets').map((item, i) => {
    const p = `assets.sheets[${i}]`;
    const s = obj(item, p);
    if (typeof s.loop !== 'boolean') throw new ConfigError(`${p}.loop: cần true/false`);
    return {
      key: str(s.key, `${p}.key`),
      file: str(s.file, `${p}.file`),
      frameW: num(s.frameW, `${p}.frameW`, { min: 1 }),
      frameH: num(s.frameH, `${p}.frameH`, { min: 1 }),
      frames: num(s.frames, `${p}.frames`, { min: 1 }),
      fps: num(s.fps, `${p}.fps`, { min: 0 }),
      loop: s.loop,
    };
  });
  const images = arr(m.images, 'assets.images').map((item, i) => {
    const p = `assets.images[${i}]`;
    const s = obj(item, p);
    return { key: str(s.key, `${p}.key`), file: str(s.file, `${p}.file`) };
  });
  const have = new Set([...sheets.map((s) => s.key), ...images.map((s) => s.key)]);
  const missing = [...REQUIRED_SHEETS, ...REQUIRED_IMAGES].filter((k) => !have.has(k));
  if (missing.length > 0) throw new ConfigError(`assets.json thiếu hình: ${missing.join(', ')}`);
  return { sheets, images };
}

/**
 * Chỉ số ô của khối đặc theo hàng xóm. `solid(col, row)` trả về true cho ô đặc; ngoài bản đồ
 * coi như đặc để mép màn không mọc viền.
 */
export function solidTileIndex(
  solid: (col: number, row: number) => boolean,
  col: number,
  row: number,
): number {
  let mask = 0;
  if (!solid(col, row - 1)) mask |= 1;
  if (!solid(col + 1, row)) mask |= 2;
  if (!solid(col, row + 1)) mask |= 4;
  if (!solid(col - 1, row)) mask |= 8;
  return TILE_INDEX.solidBase + mask;
}
