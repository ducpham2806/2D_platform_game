import { levelForExp, type LevelCurve } from '../player/level';

/** Số liệu một lượt hoàn thành màn, đưa sang màn Kết quả (wireframe Result.html). */
export interface StageResult {
  stageName: string;
  /** Thời gian chơi trong màn (không tính lúc tạm dừng và hội thoại). */
  timeSec: number;
  deaths: number;
  expGained: number;
  coreBitsGained: number;
  levelBefore: number;
  levelAfter: number;
  /** Vũ khí vừa nhận ở lượt này (lần đầu hạ boss). */
  weapon: string | undefined;
  secretsFound: number;
  secretsTotal: number;
}

export interface StageResultInput {
  stageName: string;
  timeSec: number;
  deaths: number;
  /** EXP trong bản lưu lúc vào màn và EXP, Core Bit kiếm được trong lượt. */
  expAtStart: number;
  expGained: number;
  coreBitsGained: number;
  weapon: string | undefined;
  secretsFound: number;
  secretsTotal: number;
}

export function buildStageResult(input: StageResultInput, curve: LevelCurve): StageResult {
  return {
    stageName: input.stageName,
    timeSec: input.timeSec,
    deaths: input.deaths,
    expGained: input.expGained,
    coreBitsGained: input.coreBitsGained,
    levelBefore: levelForExp(input.expAtStart, curve),
    levelAfter: levelForExp(input.expAtStart + input.expGained, curve),
    weapon: input.weapon,
    secretsFound: input.secretsFound,
    secretsTotal: input.secretsTotal,
  };
}

/** 582,4 giây → "09:42"; từ một giờ trở lên → "1:02:03". */
export function formatRunTime(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const two = (n: number): string => String(n).padStart(2, '0');
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

export interface ResultGateRules {
  delaySec: number;
  tutorialWaitSec: number;
}

export interface ResultGateState {
  /** Boss của màn đã bị hạ trong lượt này. */
  won: boolean;
  /** Đang có thoại hoặc thông báo: chưa tính giờ. */
  busy: boolean;
  /** Còn bước hướng dẫn đang hiện (ví dụ S13: thử vũ khí mới). */
  tutorialPending: boolean;
}

/**
 * Quyết định lúc chuyển sang màn Kết quả sau khi hạ boss: chờ `delaySec` giây yên tĩnh; nếu
 * còn bước hướng dẫn đang hiện thì chờ người chơi làm xong, nhưng không quá `tutorialWaitSec`.
 * Logic thuần; `step` trả về `true` đúng một lần.
 */
export class ResultGate {
  private quietSec = 0;
  private waitSec = 0;
  private fired = false;

  constructor(private readonly rules: ResultGateRules) {}

  step(dtSec: number, state: ResultGateState): boolean {
    if (this.fired || !state.won || state.busy) return false;
    if (state.tutorialPending) {
      this.waitSec += dtSec;
      if (this.waitSec < this.rules.tutorialWaitSec) return false;
    } else {
      this.quietSec += dtSec;
      if (this.quietSec < this.rules.delaySec) return false;
    }
    this.fired = true;
    return true;
  }
}
