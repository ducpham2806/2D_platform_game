/** Kích thước logic cố định của game (GDD mục 15, DEV-HANDOFF): 20 × 12 ô, ô 16 px. */
export const TILE_SIZE = 16;
export const TILES_X = 20;
export const TILES_Y = 12;
export const LOGIC_WIDTH = TILE_SIZE * TILES_X; // 320
export const LOGIC_HEIGHT = TILE_SIZE * TILES_Y; // 192

/** Vật lý và logic chạy theo bước cố định 60 Hz, tách khỏi tốc độ khung hình. */
export const FIXED_STEP_HZ = 60;
export const FIXED_STEP_MS = 1000 / FIXED_STEP_HZ;
/** Giới hạn số bước bù trong một khung để tránh "vòng xoáy chết" khi tab bị treo. */
export const MAX_STEPS_PER_FRAME = 5;

export const SceneKey = {
  Boot: 'boot',
  Preload: 'preload',
  Menu: 'menu',
  Hub: 'hub',
  Stage: 'stage',
  Controls: 'controls',
  Playtest: 'playtest',
  Save: 'save',
  Workshop: 'workshop',
  Shop: 'shop',
} as const;
export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

/** Đường dẫn dữ liệu cấu hình (được scripts/sync-data.mjs chép từ 03-Data). */
export const DATA_BASE_PATH = 'data';
export const DATA_MANIFEST = `${DATA_BASE_PATH}/manifest.json`;
