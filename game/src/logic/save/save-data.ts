/**
 * Dữ liệu lưu của người chơi (M11, đặc tả Hub & Shop mục 8), bản cục bộ cho Vertical slice:
 * tiến trình (boss đã hạ, checkpoint và vật phẩm bí mật theo màn), nhân vật (EXP, vũ khí boss),
 * kho (Core Bit), kỹ năng đã học, module, loadout (bản 2, M8). Các nhóm còn lại của mục 8 (skin,
 * nhiệm vụ...) thêm khi làm module tương ứng, tăng SAVE_VERSION và viết bước nâng cấp trong
 * `parseSave`. SP không lưu: suy từ cấp và boss đã hạ trừ bậc đã học.
 *
 * Logic thuần: hàm nhận bản lưu cũ và trả bản mới, không sửa tại chỗ.
 */

/**
 * Bản 2 (M8): thêm kỹ năng, module, loadout. Bản 3 (M9): thêm cấp Upgrade (`inventory.upgrades`).
 * Bản 4 (độ khó, 01-GDD/11-Do-kho.md): thêm `progress.difficulty` theo màn chiến dịch.
 * Bản cũ đọc lên thành bản mới với các phần chưa có để trống.
 */
export const SAVE_VERSION = 4;

export interface StageProgress {
  /** Checkpoint đã lưu (số thứ tự từ 1; 0 = điểm xuất phát). */
  checkpoint: number;
  /** Vật phẩm bí mật đã nhặt (theo `item` trên bản đồ). */
  secrets: string[];
}

/** Độ khó của một màn chiến dịch: chọn lần trước ở màn Chuẩn bị, các độ khó đã hạ boss. */
export interface StageDifficultySave {
  last: string | null;
  cleared: string[];
}

/** Một bộ cấu hình (MVP chỉ dùng bộ 0; Alpha thêm preset không cần nâng bản lưu). */
export interface Loadout {
  modules: string[];
  /** Bộ phận giáp đang tắt (bộ phận đã có suy từ bí mật đã nhặt). */
  armorOff: string[];
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
    /** Theo id màn chiến dịch (stages.json), không theo phòng thử. */
    difficulty: Record<string, StageDifficultySave>;
  };
  character: {
    exp: number;
    /** Vũ khí boss đã nhận (Arc Cannon luôn có, không ghi). */
    weapons: string[];
    /** Bậc đã học theo id nút kỹ năng (skills.json). */
    skills: Record<string, number>;
    /** Module đã nhận. */
    modules: { owned: string[] };
    loadouts: Loadout[];
    activeLoadout: number;
  };
  inventory: {
    coreBits: number;
    /** Cấp Upgrade đã mua theo id (shop.json); không có = cấp 0. */
    upgrades: Record<string, number>;
  };
  /** Hướng dẫn: bước đã xong (đổi máy không học lại), và người chơi tắt hướng dẫn. */
  tutorial: {
    done: string[];
    off: boolean;
  };
}

export function defaultLoadout(): Loadout {
  return { modules: [], armorOff: [] };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    revision: 0,
    savedAt: 0,
    playTimeSec: 0,
    progress: { bossesDefeated: [], stages: {}, difficulty: {} },
    character: {
      exp: 0,
      weapons: [],
      skills: {},
      modules: { owned: [] },
      loadouts: [defaultLoadout()],
      activeLoadout: 0,
    },
    inventory: { coreBits: 0, upgrades: {} },
    tutorial: { done: [], off: false },
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

/**
 * Bậc kỹ năng hoặc cấp Upgrade: số nguyên dương; khóa hoặc giá trị sai bị bỏ (kiểm theo dữ liệu
 * ở normalizeBuild, normalizeUpgrades).
 */
function parseLevels(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRecord(v)) return out;
  for (const [id, rank] of Object.entries(v)) {
    const r = count(rank);
    if (id.length > 0 && r > 0) out[id] = r;
  }
  return out;
}

function parseLoadouts(v: unknown): Loadout[] {
  const list = Array.isArray(v)
    ? v.filter(isRecord).map((l) => ({ modules: names(l.modules), armorOff: names(l.armorOff) }))
    : [];
  return list.length > 0 ? list : [defaultLoadout()];
}

function parseDifficulty(v: unknown): Record<string, StageDifficultySave> {
  const out: Record<string, StageDifficultySave> = {};
  if (!isRecord(v)) return out;
  for (const [id, raw] of Object.entries(v)) {
    if (!isRecord(raw) || id.length === 0) continue;
    const last = typeof raw.last === 'string' && raw.last.length > 0 ? raw.last : null;
    out[id] = { last, cleared: names(raw.cleared) };
  }
  return out;
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
  const tutorial = isRecord(raw.tutorial) ? raw.tutorial : {};
  const loadouts = parseLoadouts(character.loadouts);
  return {
    version: SAVE_VERSION,
    revision: count(raw.revision),
    savedAt: count(raw.savedAt),
    playTimeSec: seconds(raw.playTimeSec),
    progress: {
      bossesDefeated: names(progress.bossesDefeated),
      stages: parseStages(progress.stages),
      difficulty: parseDifficulty(progress.difficulty),
    },
    character: {
      exp: count(character.exp),
      weapons: names(character.weapons),
      skills: parseLevels(character.skills),
      modules: { owned: names(isRecord(character.modules) ? character.modules.owned : undefined) },
      loadouts,
      activeLoadout: Math.min(count(character.activeLoadout), loadouts.length - 1),
    },
    inventory: { coreBits: count(inventory.coreBits), upgrades: parseLevels(inventory.upgrades) },
    tutorial: { done: names(tutorial.done), off: tutorial.off === true },
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

/** Tiến trình độ khó của màn chiến dịch `campaign`. */
export function stageDifficulty(save: SaveData, campaign: string): StageDifficultySave {
  return save.progress.difficulty[campaign] ?? { last: null, cleared: [] };
}

function withDifficulty(save: SaveData, campaign: string, next: StageDifficultySave): SaveData {
  return {
    ...save,
    progress: { ...save.progress, difficulty: { ...save.progress.difficulty, [campaign]: next } },
  };
}

/** Ghi độ khó vừa chọn ở màn Chuẩn bị (mặc định cho lần sau). */
export function recordDifficultyChosen(save: SaveData, campaign: string, id: string): SaveData {
  const cur = stageDifficulty(save, campaign);
  if (cur.last === id) return save;
  return withDifficulty(save, campaign, { ...cur, last: id });
}

/** Hạ boss của màn ở độ khó `id` (mở Thử thách theo luật `unlock.clearedOn`). */
export function recordDifficultyCleared(save: SaveData, campaign: string, id: string): SaveData {
  const cur = stageDifficulty(save, campaign);
  if (cur.cleared.includes(id)) return save;
  return withDifficulty(save, campaign, { ...cur, cleared: [...cur.cleared, id] });
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

/** Thay bậc kỹ năng đã học (Xưởng); không đổi gì thì trả lại đúng bản cũ. */
export function setSkills(save: SaveData, skills: Readonly<Record<string, number>>): SaveData {
  const cur = save.character.skills;
  const keys = new Set([...Object.keys(cur), ...Object.keys(skills)]);
  if ([...keys].every((k) => cur[k] === skills[k])) return save;
  return { ...save, character: { ...save.character, skills: { ...skills } } };
}

/**
 * Đặt cấp Upgrade và Core Bit cùng lúc (giao dịch Shop: trừ tiền và thêm món trong cùng một bản
 * lưu, đặc tả Hub mục 8). Không đổi gì thì trả lại đúng bản cũ.
 */
export function setInventory(
  save: SaveData,
  upgrades: Readonly<Record<string, number>>,
  coreBits: number,
): SaveData {
  const cur = save.inventory;
  const keys = new Set([...Object.keys(cur.upgrades), ...Object.keys(upgrades)]);
  if (cur.coreBits === coreBits && [...keys].every((k) => cur.upgrades[k] === upgrades[k]))
    return save;
  return {
    ...save,
    inventory: { ...cur, coreBits: Math.max(0, Math.floor(coreBits)), upgrades: { ...upgrades } },
  };
}

export function recordTutorialDone(save: SaveData, ids: readonly string[]): SaveData {
  const fresh = ids.filter((id) => !save.tutorial.done.includes(id));
  if (fresh.length === 0) return save;
  return { ...save, tutorial: { ...save.tutorial, done: [...save.tutorial.done, ...fresh] } };
}

export function setTutorialOff(save: SaveData, off: boolean): SaveData {
  if (save.tutorial.off === off) return save;
  return { ...save, tutorial: { ...save.tutorial, off } };
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
