/**
 * Lược đồ sự kiện đo lường (logic thuần, ST-13-01; `01-GDD/13-Do-luong-MVP.md` mục 3, 8).
 * Danh mục khai báo ở đây là hợp đồng giữa game và báo cáo: tên sự kiện, thuộc tính được phép,
 * kiểu và thuộc tính bắt buộc. Kiểm lược đồ (`validate.ts`) chặn khóa lạ, chuỗi tự do, giá trị
 * ngoài enum và id ngoài danh mục, nên không thứ gì người chơi gõ lọt vào nhật ký. Mức ưu tiên của
 * từng sự kiện nằm ở `03-Data/telemetry.json` (`priority`).
 *
 * Mọi chuỗi trong sự kiện chỉ gồm ASCII in được, nên độ dài JSON bằng số byte (mục 5).
 * Đổi nghĩa, đổi tên, bỏ khóa: tăng `TELEMETRY_SCHEMA`. Thêm sự kiện, thêm khóa: giữ số.
 */

export const TELEMETRY_SCHEMA = 2;

/** Giá trị thuộc tính: số, boolean, chuỗi (enum hoặc id), danh sách id, bảng id → số. */
export type Prop = number | boolean | string | readonly string[] | Readonly<Record<string, number>>;
export type Props = Readonly<Record<string, Prop>>;

/** 0: không bao giờ bỏ; 1: bỏ sau; 2: bỏ trước (mục 5). */
export type Priority = 0 | 1 | 2;

/** Một sự kiện trong nhật ký (phong bì chung, mục 3). */
export interface TelemetryEvent {
  e: EventName;
  /** ms từ 1970, đồng hồ máy. */
  t: number;
  /** Phiên: 8 ký tự base36 ngẫu nhiên. */
  sid: string;
  /** Thứ tự trong phiên, từ 0, gán sau khi qua kiểm lược đồ. */
  n: number;
  p: Props;
}

/** Danh mục id lấy từ GameConfig (`catalogs.ts`); id không thuộc danh mục bị chặn. */
export type CatalogName =
  'stage' | 'difficulty' | 'boss' | 'weapon' | 'upgrade' | 'skillNode' | 'enemy' | 'tutorialStep';
export type Catalogs = Readonly<Partial<Record<CatalogName, ReadonlySet<string>>>>;

/** Khuôn chuỗi có tên (mục 8). */
export const PATTERNS = {
  /** Ngày theo giờ máy. */
  day: /^\d{4}-\d{2}-\d{2}$/,
  /** Màn hình px CSS làm tròn. */
  screen: /^\d{1,5}x\d{1,5}$/,
  /** Chữ ký build: tổng bậc đã học ở nhánh Vanguard, Phantom, Core. */
  skills: /^V\d{1,2}P\d{1,2}C\d{1,2}$/,
  /** Ngôn ngữ trình duyệt rút gọn. */
  lang: /^(?:[a-z]{2}|other)$/,
} as const;
export type PatternName = keyof typeof PATTERNS;

/** Đơn vị để làm tròn lúc ghi (`telemetry.json → round`): giây, tỉ lệ. */
export type NumUnit = 'sec' | 'ratio';

export type PropSpec =
  | { kind: 'int'; min?: number; max?: number }
  | { kind: 'num'; min?: number; max?: number; unit?: NumUnit }
  | { kind: 'bool' }
  | { kind: 'enum'; values: readonly string[] }
  /** Id (chữ, số, `_ . : -`, ≤ 48 ký tự); có `catalog` thì phải thuộc danh mục. */
  | { kind: 'id'; catalog?: CatalogName }
  | { kind: 'ids'; catalog?: CatalogName }
  /** Bảng id → số; có `catalog` thì khóa phải thuộc danh mục. */
  | { kind: 'map'; catalog?: CatalogName }
  | { kind: 'pattern'; pattern: PatternName }
  /** Nguồn cú đánh: `enemy:<id kẻ địch>`, `boss:<id đòn>`, `spike`, `pit`. */
  | { kind: 'cause' }
  /** Số hoặc boolean (giá trị một tùy chọn Cài đặt). */
  | { kind: 'scalar' }
  /** Chữ đã làm sạch (`sanitizeErrorMessage`), ≤ `errorMsgMaxChars`; chỉ `client_error.msg`. */
  | { kind: 'text' };

export interface EventSpec {
  props: Readonly<Record<string, PropSpec>>;
  /** Thuộc tính bắt buộc; còn lại là tùy chọn. */
  required: readonly string[];
}

export const ID_PATTERN = /^[A-Za-z0-9_.:-]{1,48}$/;

const int = (min = 0, max?: number): PropSpec =>
  max === undefined ? { kind: 'int', min } : { kind: 'int', min, max };
const sec: PropSpec = { kind: 'num', min: 0, unit: 'sec' };
const pct: PropSpec = { kind: 'num', min: 0, max: 100, unit: 'ratio' };
const vol: PropSpec = { kind: 'num', min: 0, max: 1, unit: 'ratio' };
const ms: PropSpec = { kind: 'num', min: 0 };
const bool: PropSpec = { kind: 'bool' };
const id: PropSpec = { kind: 'id' };
const cat = (catalog: CatalogName): PropSpec => ({ kind: 'id', catalog });
const oneOf = (...values: string[]): PropSpec => ({ kind: 'enum', values });

export const DEVICES = ['keyboard', 'gamepad', 'touch'] as const;
const device = oneOf(...DEVICES);
const stage = cat('stage');
const gameSpeed: PropSpec = { kind: 'num', min: 0, max: 4, unit: 'ratio' };

/** Thuộc tính chung của `stage_end` và `stage_progress` (trừ `outcome`). */
const STAGE_RUN_PROPS: Readonly<Record<string, PropSpec>> = {
  stage,
  runSec: sec,
  realSec: sec,
  deaths: int(),
  pits: int(),
  furthest: id,
  last: id,
  coreBitsEarned: int(),
  expEarned: int(),
  balance: int(),
  secrets: int(),
  deviceSec: { kind: 'map' },
  gameSpeedMin: gameSpeed,
  fpsMedian: { kind: 'num', min: 0, max: 1000 },
  slowFramePct: pct,
};

const SHOP_PROPS: Readonly<Record<string, PropSpec>> = {
  item: cat('upgrade'),
  level: int(),
  price: int(),
  before: int(),
  after: int(),
  bosses: int(),
  playSec: sec,
};

function spec(props: Readonly<Record<string, PropSpec>>, required: readonly string[]): EventSpec {
  return { props, required };
}

/** Danh mục sự kiện (mục 3). */
export const EVENT_SPECS = {
  session_start: spec(
    {
      day: { kind: 'pattern', pattern: 'day' },
      tzMin: int(-720, 840),
      platform: oneOf('android', 'ios', 'windows', 'mac', 'linux', 'other'),
      browser: oneOf('chrome', 'safari', 'firefox', 'edge', 'samsung', 'other'),
      pwa: bool,
      screen: { kind: 'pattern', pattern: 'screen' },
      dpr: { kind: 'num', min: 0, max: 8 },
      scaleK: int(),
      touchCapable: bool,
      lang: { kind: 'pattern', pattern: 'lang' },
      staff: bool,
    },
    ['day', 'tzMin', 'platform', 'browser'],
  ),
  boot_timing: spec({ msToMenu: ms, msToControl: ms }, ['msToMenu']),
  /** Tắt gửi không ghi sự kiện nào (QB-156), nên chỉ có `notice` và `on`. */
  consent: spec({ state: oneOf('notice', 'on') }, ['state']),
  stage_start: spec(
    {
      stage,
      room: id,
      difficulty: cat('difficulty'),
      difficultyDefault: cat('difficulty'),
      challengeOpen: bool,
      run: int(1),
      clearedBefore: { kind: 'ids', catalog: 'difficulty' },
      fromCheckpoint: int(),
      level: int(1),
      effLevel: int(1),
      skills: { kind: 'pattern', pattern: 'skills' },
      upgrades: { kind: 'map', catalog: 'upgrade' },
      weapons: int(),
      coreBits: int(),
      device,
      gameSpeed,
      autoFire: bool,
      aimAssist: bool,
      audioMaster: vol,
      audioSfx: vol,
      audioAlert: vol,
      audioMuted: bool,
    },
    ['stage', 'difficulty', 'run', 'device'],
  ),
  section_enter: spec({ stage, section: id, tRun: sec }, ['stage', 'section']),
  checkpoint: spec({ stage, index: int(), tRun: sec }, ['stage', 'index']),
  death: spec(
    {
      stage,
      section: id,
      kind: oneOf('death', 'pit'),
      cause: { kind: 'cause' },
      device,
      tRun: sec,
      streak: int(1),
    },
    ['stage', 'kind'],
  ),
  difficulty_hint: spec({ stage, difficulty: cat('difficulty'), section: id }, [
    'stage',
    'difficulty',
  ]),
  boss_start: spec(
    {
      stage,
      boss: cat('boss'),
      attempt: int(1),
      weaknessOwned: bool,
      weaponsOwned: { kind: 'ids', catalog: 'weapon' },
    },
    ['boss', 'attempt'],
  ),
  boss_end: spec(
    {
      boss: cat('boss'),
      outcome: oneOf('win', 'death', 'exit'),
      fightSec: sec,
      dmg: { kind: 'map', catalog: 'weapon' },
      weakHits: int(),
      swaps: int(),
      bossHpPct: pct,
      weaknessOwned: bool,
      device,
      gameSpeed,
    },
    ['boss', 'outcome', 'fightSec'],
  ),
  stage_end: spec({ ...STAGE_RUN_PROPS, outcome: oneOf('clear', 'quit') }, [
    'stage',
    'outcome',
    'runSec',
  ]),
  stage_progress: spec(STAGE_RUN_PROPS, ['stage', 'runSec']),
  shop_buy: spec(SHOP_PROPS, ['item', 'level', 'price']),
  shop_refund: spec(SHOP_PROPS, ['item', 'level', 'price']),
  skill_change: spec(
    { node: cat('skillNode'), rank: int(), action: oneOf('learn', 'reset'), spLeft: int() },
    ['action'],
  ),
  tutorial_step_start: spec({ id: cat('tutorialStep'), phase: id }, ['id']),
  tutorial_step_complete: spec({ id: cat('tutorialStep'), time_sec: sec, attempts: int() }, ['id']),
  tutorial_step_fail: spec({ id: cat('tutorialStep'), count: int(1) }, ['id']),
  tutorial_hint_shown: spec({ id: cat('tutorialStep'), level: int(1, 4) }, ['id', 'level']),
  tutorial_skip: spec({ id: cat('tutorialStep'), scope: oneOf('step', 'prologue') }, ['scope']),
  tutorial_phase_complete: spec({ phase: id, total_time_sec: sec }, ['phase']),
  tutorial_toggle: spec({ on: bool, where: oneOf('pause', 'settings') }, ['on']),
  survey_answer: spec(
    {
      q: oneOf('feel_jump', 'feel_dash', 'feel_shoot', 'want_stage5', 'audio_annoy'),
      a: oneOf('1', '2', '3', '4', '5', 'yes', 'maybe', 'no', 'skip'),
      device,
    },
    ['q', 'a'],
  ),
  settings_change: spec({ id, value: { kind: 'scalar' }, where: oneOf('menu', 'pause'), device }, [
    'id',
    'value',
  ]),
  client_error: spec(
    {
      kind: oneOf('error', 'rejection', 'config'),
      scene: id,
      fatal: bool,
      msg: { kind: 'text' },
      count: int(1),
    },
    ['kind', 'msg', 'count'],
  ),
  save_error: spec(
    {
      op: oneOf('open', 'write', 'import'),
      code: oneOf('read', 'write', 'corrupt', 'newer', 'import_invalid'),
    },
    ['op', 'code'],
  ),
} as const satisfies Record<string, EventSpec>;

export type EventName = keyof typeof EVENT_SPECS;
export const EVENT_NAMES = Object.keys(EVENT_SPECS) as EventName[];

export function isEventName(value: string): value is EventName {
  return Object.prototype.hasOwnProperty.call(EVENT_SPECS, value);
}

/** Câu trả lời hợp lệ theo câu hỏi phiếu (mục 7.2): điểm 1–5 hoặc có/có lẽ/không. */
export const SURVEY_ANSWERS: Readonly<Record<string, readonly string[]>> = {
  feel_jump: ['1', '2', '3', '4', '5', 'skip'],
  feel_dash: ['1', '2', '3', '4', '5', 'skip'],
  feel_shoot: ['1', '2', '3', '4', '5', 'skip'],
  want_stage5: ['yes', 'maybe', 'no', 'skip'],
  audio_annoy: ['yes', 'maybe', 'no', 'skip'],
};
