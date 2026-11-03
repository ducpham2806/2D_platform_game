/**
 * TutorialManager (kịch bản hướng dẫn mục 7 và 10): máy trạng thái các bước theo dữ liệu.
 * Mỗi bước logic nhận tập tín hiệu của màn (TutorialSignals) và quãng đi sang phải:
 * - bước chưa xong mà gặp tín hiệu kích hoạt thì vào hàng đợi; mỗi lúc chỉ hiện một bước;
 * - `skipIfDone`: người chơi đã làm được yêu cầu từ trước thì bỏ qua (không hiện lời);
 * - đang hiện: đếm tiến độ yêu cầu, đếm thất bại, nâng bậc gợi ý theo thời gian/thất bại;
 * - bước không có yêu cầu chỉ hiện lời thoại `showSec` giây;
 * - gặp tín hiệu `cancelOn` (ví dụ đã hạ boss) thì bước đang chờ/đang hiện bị bỏ, tính là xong,
 *   và bước nối sau nó cũng bỏ trong cùng bước logic (không hiện lời trận đấu sau khi trận xong).
 * Chết thì bước vẫn giữ nguyên (hồi sinh ngay tại bước). Không bao giờ khóa điều khiển.
 * Logic thuần.
 */
import type { TutorialData, TutorialStage, TutorialStep } from '../../core/tutorial-config';
import type { Action } from '../input/actions';

export interface TutorialView {
  id: string;
  speaker: string;
  /** Lời thoại hiện tại (đã đổi sang câu gợi ý nếu lên bậc), chưa thay biểu tượng nút. */
  text: string;
  highlight: Action | undefined;
  /** 0 = lời gốc; 1.. = bậc gợi ý (số thứ tự gợi ý trong dữ liệu + 1). */
  hintLevel: number;
}

export interface TutorialStepResult {
  /** Bước vừa bắt đầu hiện. */
  started: string | undefined;
  /** Bước vừa xong (kể cả bỏ qua vì đã làm được). */
  completed: string[];
}

interface Active {
  step: TutorialStep;
  sec: number;
  progress: number;
  fails: number;
}

export class TutorialManager {
  private readonly done: Set<string>;
  private readonly steps: TutorialStep[];
  private readonly queue: TutorialStep[] = [];
  private active: Active | undefined;
  /** Số lần mỗi tín hiệu đã xuất hiện trong lượt chơi (cho `skipIfDone`). */
  private readonly seen = new Map<string, number>();
  private moved = 0;

  constructor(
    data: TutorialData,
    stage: TutorialStage,
    done: Iterable<string> = [],
    /** Tắt hướng dẫn: không kích hoạt bước nào. */
    private enabled = true,
  ) {
    this.done = new Set(done);
    this.steps = data.steps.filter((s) => s.stage === stage);
  }

  get completed(): ReadonlySet<string> {
    return this.done;
  }

  get view(): TutorialView | undefined {
    const a = this.active;
    if (!a) return undefined;
    let text = a.step.text;
    let highlight = a.step.highlight;
    let level = 0;
    a.step.hints.forEach((h, i) => {
      const reached =
        (h.afterSec !== undefined && a.sec >= h.afterSec && a.progress === 0) ||
        (h.afterFails !== undefined && a.fails >= h.afterFails);
      if (!reached) return;
      level = i + 1;
      if (h.text) text = h.text;
      if (h.highlight) highlight = h.highlight;
    });
    return { id: a.step.id, speaker: a.step.speaker, text, highlight, hintLevel: level };
  }

  /** Bật/tắt giữa chừng (menu tạm dừng). Tắt thì ẩn ngay bước đang hiện, không tính là xong. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.active = undefined;
      this.queue.length = 0;
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  /** `signals`: tín hiệu của bước logic này; `moveTiles`: quãng đi sang phải (ô, có thể âm). */
  step(signals: ReadonlySet<string>, moveTiles: number, dt: number): TutorialStepResult {
    const result: TutorialStepResult = { started: undefined, completed: [] };
    for (const s of signals) this.seen.set(s, (this.seen.get(s) ?? 0) + 1);
    const forward = Math.max(0, moveTiles);
    this.moved += forward;
    if (!this.enabled) return result;

    const cancelled = (st: TutorialStep): boolean => st.cancelOn.some((c) => signals.has(c));
    if (this.active && cancelled(this.active.step)) {
      this.finish(this.active.step, result);
      this.active = undefined;
    }
    for (let i = this.queue.length - 1; i >= 0; i -= 1) {
      const q = this.queue[i] as TutorialStep;
      if (cancelled(q)) {
        this.queue.splice(i, 1);
        this.finish(q, result);
      }
    }

    const a = this.active;
    if (a) {
      a.sec += dt;
      const rq = a.step.require;
      if (rq?.moveTiles !== undefined) a.progress += forward;
      else if (rq?.on !== undefined && signals.has(rq.on)) a.progress += 1;
      if (a.step.fails.some((f) => signals.has(f))) a.fails += 1;
      const target = rq ? (rq.moveTiles ?? rq.count) : undefined;
      if (target !== undefined ? a.progress >= target : a.sec >= a.step.showSec) {
        this.finish(a.step, result);
        this.active = undefined;
      }
    }

    for (const s of this.steps) {
      if (this.done.has(s.id) || this.active?.step === s || this.queue.includes(s)) continue;
      if (s.trigger.after !== undefined && !this.done.has(s.trigger.after)) continue;
      const on = s.trigger.on;
      if (on !== undefined && !signals.has(on)) continue;
      if (s.trigger.not.some((n) => signals.has(n))) continue;
      if (cancelled(s)) this.finish(s, result);
      else this.queue.push(s);
    }

    while (!this.active && this.queue.length > 0) {
      const next = this.queue.shift() as TutorialStep;
      if (next.skipIfDone && this.alreadyDone(next)) {
        this.finish(next, result);
        continue;
      }
      this.active = { step: next, sec: 0, progress: 0, fails: 0 };
      result.started = next.id;
    }
    return result;
  }

  private alreadyDone(step: TutorialStep): boolean {
    const rq = step.require;
    if (!rq) return false;
    if (rq.moveTiles !== undefined) return this.moved >= rq.moveTiles;
    return rq.on !== undefined && (this.seen.get(rq.on) ?? 0) >= rq.count;
  }

  private finish(step: TutorialStep, result: TutorialStepResult): void {
    this.done.add(step.id);
    result.completed.push(step.id);
  }
}
