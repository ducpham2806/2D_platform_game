import type { InputDevice } from '../input/actions';

/**
 * Nhật ký chơi thử cho cổng Prototype (logic thuần). Mỗi lần vào màn là một phiên: ghi thời gian
 * theo thiết bị, số lần chết theo đoạn, số lần đánh boss và thời gian thắng, điểm cảm giác 1–5.
 * Không gửi đi đâu; chỉ lưu trên máy và cho sao chép JSON để gom lại.
 */
export interface PlaytestRatings {
  jump: number;
  dash: number;
  shoot: number;
}

export interface PlaytestSession {
  id: string;
  startedAt: number;
  durationSec: number;
  /** Giây chơi theo từng thiết bị; thiết bị chính là thiết bị nhiều giây nhất. */
  deviceSec: Partial<Record<InputDevice, number>>;
  deaths: Record<string, number>;
  /** Đoạn xa nhất đã tới và đoạn đang đứng khi phiên kết thúc. */
  furthestSection: string;
  lastSection: string;
  bossAttempts: number;
  bossWins: number;
  /** Giây từ lúc cửa phòng boss đóng tới lúc hạ boss, mỗi lần thắng. */
  bossWinSec: number[];
  ratings: PlaytestRatings | undefined;
}

export function primaryDevice(session: PlaytestSession): InputDevice {
  let best: InputDevice = 'keyboard';
  let bestSec = -1;
  for (const [device, sec] of Object.entries(session.deviceSec) as [InputDevice, number][]) {
    if (sec > bestSec) {
      best = device;
      bestSec = sec;
    }
  }
  return best;
}

/** Đoạn chứa cột ô `col`: đoạn cuối cùng có fromCol ≤ col (đoạn sắp theo cột tăng dần). */
export function sectionAt(
  sections: ReadonlyArray<{ id: string; fromCol: number }>,
  col: number,
): string {
  let id = sections[0]?.id ?? 'start';
  for (const s of sections) if (s.fromCol <= col) id = s.id;
  return id;
}

export class PlaytestRecorder {
  readonly session: PlaytestSession;
  private bossTimer: number | undefined;

  constructor(
    id: string,
    startedAt: number,
    private readonly sectionOrder: readonly string[],
  ) {
    const first = sectionOrder[0] ?? 'start';
    this.session = {
      id,
      startedAt,
      durationSec: 0,
      deviceSec: {},
      deaths: {},
      furthestSection: first,
      lastSection: first,
      bossAttempts: 0,
      bossWins: 0,
      bossWinSec: [],
      ratings: undefined,
    };
  }

  /** Gọi mỗi bước logic với thiết bị đang dùng và đoạn Kai đang đứng. */
  step(device: InputDevice, section: string, dt: number): void {
    const s = this.session;
    s.durationSec += dt;
    s.deviceSec[device] = (s.deviceSec[device] ?? 0) + dt;
    s.lastSection = section;
    if (this.sectionOrder.indexOf(section) > this.sectionOrder.indexOf(s.furthestSection)) {
      s.furthestSection = section;
    }
    if (this.bossTimer !== undefined) this.bossTimer += dt;
  }

  death(section: string): void {
    this.session.deaths[section] = (this.session.deaths[section] ?? 0) + 1;
    // Chết trong phòng boss: lần đánh này kết thúc; hồi sinh trong phòng là lần đánh mới.
    if (this.bossTimer !== undefined) this.bossTimer = undefined;
  }

  bossStart(): void {
    this.session.bossAttempts += 1;
    this.bossTimer = 0;
  }

  bossWin(): void {
    this.session.bossWins += 1;
    if (this.bossTimer !== undefined)
      this.session.bossWinSec.push(Math.round(this.bossTimer * 10) / 10);
    this.bossTimer = undefined;
  }

  rate(ratings: PlaytestRatings): void {
    this.session.ratings = ratings;
  }
}
