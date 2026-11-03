/**
 * Dữ liệu lưu của người chơi (M11, đặc tả Hub & Shop mục 8), bản cục bộ cho Vertical slice:
 * tiến trình (boss đã hạ, checkpoint và vật phẩm bí mật theo màn), nhân vật (EXP, vũ khí boss),
 * kho (Core Bit). Các nhóm còn lại của mục 8 (SP, kỹ năng, module, skin, nhiệm vụ...) thêm khi
 * làm module tương ứng, tăng SAVE_VERSION và viết bước nâng cấp trong `parseSave`.
 *
 * Logic thuần: hàm nhận bản lưu cũ và trả bản mới, không sửa tại chỗ.
 */

export const SAVE_VERSION = 1;

export interface StageProgress {
  /** Checkpoint đã lưu (số thứ tự từ 1; 0 = điểm xuất phát). */
  checkpoint: number;
  /** Vật phẩm bí mật đã nhặt (theo `item` trên bản đồ). */
  secrets: string[];
}

export interface SaveData {
  version: number;
  /** Tăng 1 mỗi lần ghi; dùng để so bản trên máy với bản cloud (chưa làm). */
  revision: number;
  /** Thời điểm ghi cuối (ms từ 1970, theo đồng hồ máy). */
  savedAt: number;
  /** Tổng thời gian chơi trong màn (giây). */
  playTimeSec: number;
  progress: {
    bossesDefeated: string[];
    stages: Record<string, StageProgress>;
  };
  character: {
    exp: number;
    /** Vũ khí boss đã nhận (Arc Cannon luôn có, không ghi). */
    weapons: string[];
  };
  inventory: {
    coreBits: number;
  };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    revision: 0,
    savedAt: 0,
    playTimeSec: 0,
    progress: { bossesDefeated: [], stages: {} },
    character: { exp: 0, weapons: [] },
    inventory: { coreBits: 0 },
  };
}

export class SaveError extends Error {}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Số nguyên không âm; sai kiểu thì về `fallback`. */
function count(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
}

function seconds(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
}

/** Danh sách chuỗi không trùng; phần tử sai kiểu bị bỏ. */
function names(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === 'string' && x.length > 0))];
}

function parseStages(v: unknown): Record<string, StageProgress> {
  const out: Record<string, StageProgress> = {};
  if (!isRecord(v)) return out;
  for (const [id, raw] of Object.entries(v)) {
    if (!isRecord(raw)) continue;
    out[id] = { checkpoint: count(raw.checkpoint), secrets: names(raw.secrets) };
  }
  return out;
}

/**
 * Đọc bản lưu từ JSON đã giải mã. Hỏng từng phần thì phần đó về mặc định, phần còn lại giữ
 * nguyên. Bản lưu của phiên bản game mới hơn thì báo lỗi (không đọc bừa rồi ghi đè mất dữ liệu).
 */
export function parseSave(raw: unknown): SaveData {
  const base = defaultSave();
  if (!isRecord(raw)) return base;
  const version = count(raw.version, SAVE_VERSION);
  if (version > SAVE_VERSION)
    throw new SaveError(
      `Bản lưu phiên bản ${version} mới hơn game (${SAVE_VERSION}); hãy cập nhật game.`,
    );
  const progress = isRecord(raw.progress) ? raw.progress : {};
  const character = isRecord(raw.character) ? raw.character : {};
  const inventory = isRecord(raw.inventory) ? raw.inventory : {};
  return {
    version: SAVE_VERSION,
    revision: count(raw.revision),
    savedAt: count(raw.savedAt),
    playTimeSec: seconds(raw.playTimeSec),
    progress: {
      bossesDefeated: names(progress.bossesDefeated),
      stages: parseStages(progress.stages),
    },
    character: { exp: count(character.exp), weapons: names(character.weapons) },
    inventory: { coreBits: count(inventory.coreBits) },
  };
}

export function stageProgress(save: SaveData, stageId: string): StageProgress {
  return save.progress.stages[stageId] ?? { checkpoint: 0, secrets: [] };
}

function withStage(save: SaveData, stageId: string, next: StageProgress): SaveData {
  return {
    ...save,
    progress: { ...save.progress, stages: { ...save.progress.stages, [stageId]: next } },
  };
}

/** Lưu checkpoint của màn; chỉ tiến, không lùi (giống luật checkpoint trong màn). */
export function recordCheckpoint(save: SaveData, stageId: string, index: number): SaveData {
  const cur = stageProgress(save, stageId);
  if (index <= cur.checkpoint) return save;
  return withStage(save, stageId, { ...cur, checkpoint: index });
}

export function recordSecret(save: SaveData, stageId: string, item: string): SaveData {
  const cur = stageProgress(save, stageId);
  if (cur.secrets.includes(item)) return save;
  return withStage(save, stageId, { ...cur, secrets: [...cur.secrets, item] });
}

/** Hoàn thành màn (hạ boss): lần sau vào lại từ đầu màn; vật phẩm bí mật vẫn giữ. */
export function completeStage(save: SaveData, stageId: string): SaveData {
  const cur = stageProgress(save, stageId);
  if (cur.checkpoint === 0) return save;
  return withStage(save, stageId, { ...cur, checkpoint: 0 });
}

export function recordBossDefeated(save: SaveData, bossId: string): SaveData {
  if (save.progress.bossesDefeated.includes(bossId)) return save;
  return {
    ...save,
    progress: { ...save.progress, bossesDefeated: [...save.progress.bossesDefeated, bossId] },
  };
}

export function grantWeapon(save: SaveData, weapon: string): SaveData {
  if (save.character.weapons.includes(weapon)) return save;
  return {
    ...save,
    character: { ...save.character, weapons: [...save.character.weapons, weapon] },
  };
}

/** Cộng EXP, Core Bit và thời gian chơi (phần chênh lệch từ lần ghi trước, không âm). */
export function addRewards(
  save: SaveData,
  gain: { exp?: number; coreBits?: number; playTimeSec?: number },
): SaveData {
  const exp = Math.max(0, Math.floor(gain.exp ?? 0));
  const coreBits = Math.max(0, Math.floor(gain.coreBits ?? 0));
  const time = Math.max(0, gain.playTimeSec ?? 0);
  if (exp === 0 && coreBits === 0 && time === 0) return save;
  return {
    ...save,
    playTimeSec: save.playTimeSec + time,
    character: { ...save.character, exp: save.character.exp + exp },
    inventory: { ...save.inventory, coreBits: save.inventory.coreBits + coreBits },
  };
}

/** Tóm tắt để hiện ở menu và (sau này) màn chọn khi xung đột cloud. */
export interface SaveSummary {
  bosses: number;
  exp: number;
  coreBits: number;
  playTimeSec: number;
  savedAt: number;
}

export function summarize(save: SaveData): SaveSummary {
  return {
    bosses: save.progress.bossesDefeated.length,
    exp: save.character.exp,
    coreBits: save.inventory.coreBits,
    playTimeSec: save.playTimeSec,
    savedAt: save.savedAt,
  };
}
