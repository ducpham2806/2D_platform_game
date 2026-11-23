/**
 * Kiểm tra 03-Data/tutorial.json (kịch bản hướng dẫn, 01-GDD/07-Kich-ban-huong-dan.md mục 10).
 * Logic thuần.
 */
import { type Action, isAction } from '../logic/input/actions';
import { arr, ConfigError, type Json, num, obj, str } from './json-check';

/**
 * Tín hiệu của màn chơi mà bước hướng dẫn dùng để kích hoạt, hoàn thành, đếm thất bại.
 * Thêm dạng có tham số: `section:<id đoạn>`, `near:<id kẻ địch>` (kẻ địch còn sống trong
 * `nearTiles` ô), `roomLocked:<id kẻ địch>` (phòng khóa vừa đóng có loại kẻ địch đó),
 * `fire:<shot|mid|charged|sweep|beam|shard>`.
 */
export const TUTORIAL_SIGNALS = [
  'start',
  'jump',
  'dash',
  'wallSlide',
  'wallJump',
  'vine',
  'swap',
  'fire',
  'fireWarden',
  'checkpoint',
  'kill',
  'roomLocked',
  'roomCleared',
  'secret',
  'spike',
  'pit',
  'death',
  'heal',
  'hurt',
  'shieldBlocked',
  'shieldBroken',
  'barrierBroken',
  'bossGate',
  'bossPhase',
  'bossDefeated',
  'weaponGranted',
] as const;

const FIRE_KINDS = ['shot', 'mid', 'charged', 'sweep', 'beam', 'shard'];
export const TUTORIAL_STAGES = ['prologue', 'stage1'] as const;
export type TutorialStage = (typeof TUTORIAL_STAGES)[number];

export interface TutorialHint {
  /** Hiện sau chừng này giây kể từ khi bước bắt đầu (bậc gợi ý 1). */
  afterSec?: number;
  /** Hoặc sau chừng này lần thất bại (bậc gợi ý 2). */
  afterFails?: number;
  text?: string;
  highlight?: Action;
}

export interface TutorialStep {
  id: string;
  stage: TutorialStage;
  speaker: string;
  /** Kích hoạt khi có tín hiệu `on` (trừ khi cùng lúc có tín hiệu trong `not`), sau khi bước `after` xong. */
  trigger: { on?: string; not: string[]; after?: string };
  /** Hoàn thành khi tín hiệu `on` xuất hiện `count` lần, hoặc đi được `moveTiles` ô sang phải. Không có: chỉ hiện lời thoại `showSec` giây. */
  require?: { on?: string; count: number; moveTiles?: number };
  showSec: number;
  text: string;
  highlight?: Action;
  fails: string[];
  /** Tín hiệu làm bước hết ý nghĩa (ví dụ đã hạ boss): đang chờ/đang hiện thì bỏ, tính là xong. */
  cancelOn: string[];
  hints: TutorialHint[];
  /** Người chơi đã làm được yêu cầu từ trước khi bước kích hoạt thì bỏ qua bước. */
  skipIfDone: boolean;
  /** Bước đang hiện/đang chờ khi màn kết thúc thì nhắc lại lời ở màn Kết quả. */
  remindOnResult: boolean;
}

export interface TutorialData {
  rules: { showSec: number; nearTiles: number; maxTextChars: number };
  steps: TutorialStep[];
}

/** `enemyIds`: id trong enemies.json, để kiểm tra tín hiệu `near:` và `roomLocked:`. */
export function isTutorialSignal(signal: string, enemyIds: ReadonlySet<string>): boolean {
  if ((TUTORIAL_SIGNALS as readonly string[]).includes(signal)) return true;
  const [kind, arg, extra] = signal.split(':');
  if (extra !== undefined || !arg) return false;
  if (kind === 'section') return true;
  if (kind === 'fire') return FIRE_KINDS.includes(arg);
  if (kind === 'near' || kind === 'roomLocked') return enemyIds.has(arg);
  return false;
}

function optAction(v: unknown, path: string): Action | undefined {
  if (v === undefined) return undefined;
  if (typeof v !== 'string' || !isAction(v))
    throw new ConfigError(`${path}: hành động không tồn tại`);
  return v;
}

function optNum(v: unknown, path: string, min: number): number | undefined {
  return v === undefined ? undefined : num(v, path, { min });
}

export function parseTutorial(value: unknown, enemyIds: ReadonlySet<string>): TutorialData {
  const t = obj(value, 'tutorial');
  const r = obj(t.rules, 'tutorial.rules');
  const rules = {
    showSec: num(r.showSec, 'tutorial.rules.showSec', { min: 0.5 }),
    nearTiles: num(r.nearTiles, 'tutorial.rules.nearTiles', { min: 1 }),
    maxTextChars: num(r.maxTextChars, 'tutorial.rules.maxTextChars', { min: 20 }),
  };
  const signal = (v: unknown, path: string): string => {
    const s = str(v, path);
    if (!isTutorialSignal(s, enemyIds)) throw new ConfigError(`${path}: tín hiệu "${s}" không có`);
    return s;
  };
  const text = (v: unknown, path: string): string => {
    const s = str(v, path);
    // Lời thoại tối đa 2 dòng (kịch bản hướng dẫn mục 1 và 8.2).
    if (s.length > rules.maxTextChars)
      throw new ConfigError(`${path}: dài ${s.length} ký tự, tối đa ${rules.maxTextChars}`);
    return s;
  };
  const ids = new Set<string>();
  const steps = arr(t.steps, 'tutorial.steps').map((item, i): TutorialStep => {
    const p = `tutorial.steps[${i}]`;
    const s = obj(item, p);
    const id = str(s.id, `${p}.id`);
    if (ids.has(id)) throw new ConfigError(`${p}.id: trùng "${id}"`);
    ids.add(id);
    if (typeof s.stage !== 'string' || !(TUTORIAL_STAGES as readonly string[]).includes(s.stage))
      throw new ConfigError(`${p}.stage: phải là ${TUTORIAL_STAGES.join(' hoặc ')}`);
    const tr = obj(s.trigger, `${p}.trigger`);
    const after = tr.after === undefined ? undefined : str(tr.after, `${p}.trigger.after`);
    if (after !== undefined && !ids.has(after))
      throw new ConfigError(`${p}.trigger.after: "${after}" phải là bước đứng trước`);
    const on = tr.on === undefined ? undefined : signal(tr.on, `${p}.trigger.on`);
    if (on === undefined && after === undefined)
      throw new ConfigError(`${p}.trigger: cần "on" hoặc "after"`);
    const not = tr.not === undefined ? [] : arr(tr.not, `${p}.trigger.not`);
    let require: TutorialStep['require'];
    if (s.require !== undefined) {
      const rq: Json = obj(s.require, `${p}.require`);
      const moveTiles = optNum(rq.moveTiles, `${p}.require.moveTiles`, 1);
      const rqOn = rq.on === undefined ? undefined : signal(rq.on, `${p}.require.on`);
      if ((rqOn === undefined) === (moveTiles === undefined))
        throw new ConfigError(`${p}.require: cần đúng một trong "on" hoặc "moveTiles"`);
      require = {
        count: optNum(rq.count, `${p}.require.count`, 1) ?? 1,
        ...(rqOn === undefined ? {} : { on: rqOn }),
        ...(moveTiles === undefined ? {} : { moveTiles }),
      };
    }
    const hints = (s.hints === undefined ? [] : arr(s.hints, `${p}.hints`)).map((h, j) => {
      const hp = `${p}.hints[${j}]`;
      const o = obj(h, hp);
      const afterSec = optNum(o.afterSec, `${hp}.afterSec`, 1);
      const afterFails = optNum(o.afterFails, `${hp}.afterFails`, 1);
      if ((afterSec === undefined) === (afterFails === undefined))
        throw new ConfigError(`${hp}: cần đúng một trong "afterSec" hoặc "afterFails"`);
      const hint: TutorialHint = {};
      if (afterSec !== undefined) hint.afterSec = afterSec;
      if (afterFails !== undefined) hint.afterFails = afterFails;
      if (o.text !== undefined) hint.text = text(o.text, `${hp}.text`);
      const hl = optAction(o.highlight, `${hp}.highlight`);
      if (hl) hint.highlight = hl;
      return hint;
    });
    for (const flag of ['skipIfDone', 'remindOnResult'])
      if (s[flag] !== undefined && typeof s[flag] !== 'boolean')
        throw new ConfigError(`${p}.${flag}: cần true/false`);
    const step: TutorialStep = {
      id,
      stage: s.stage as TutorialStage,
      speaker: str(s.speaker, `${p}.speaker`),
      trigger: {
        not: not.map((x, j) => signal(x, `${p}.trigger.not[${j}]`)),
        ...(on === undefined ? {} : { on }),
        ...(after === undefined ? {} : { after }),
      },
      showSec: optNum(s.showSec, `${p}.showSec`, 0.5) ?? rules.showSec,
      text: text(s.text, `${p}.text`),
      fails: (s.fails === undefined ? [] : arr(s.fails, `${p}.fails`)).map((x, j) =>
        signal(x, `${p}.fails[${j}]`),
      ),
      cancelOn: (s.cancelOn === undefined ? [] : arr(s.cancelOn, `${p}.cancelOn`)).map((x, j) =>
        signal(x, `${p}.cancelOn[${j}]`),
      ),
      hints,
      skipIfDone: s.skipIfDone === true,
      remindOnResult: s.remindOnResult === true,
    };
    if (require) step.require = require;
    const hl = optAction(s.highlight, `${p}.highlight`);
    if (hl) step.highlight = hl;
    return step;
  });
  return { rules, steps };
}
