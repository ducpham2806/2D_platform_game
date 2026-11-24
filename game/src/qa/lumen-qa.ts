import { FIXED_STEP_HZ } from '../core/constants';
import type { WorldEvents } from '../logic/world/world-types';

/** GDD 16 §2.2: Lumen Thường, cân bằng Arc Cannon ở cấp 5, không build hay hồi máu. */
export const LUMEN_QA_LEVEL = 5;
export const LUMEN_QA_SEED = 2187;

type AttemptEvents = Pick<WorldEvents, 'gateClosed' | 'respawned' | 'playerDied' | 'bossDefeated'>;

/** Chỉ gọi sau world.step, nên đồng hồ không tính màn tạm dừng hoặc hội thoại. */
export class LumenAttemptClock {
  private frames = 0;
  private active = false;
  last: { sec: number; won: boolean } | undefined;

  get seconds(): number | undefined {
    return this.active ? this.frames / FIXED_STEP_HZ : undefined;
  }

  step(ev: AttemptEvents, inFight: boolean): void {
    if (ev.gateClosed || (ev.respawned && inFight)) {
      this.frames = 0;
      this.active = true;
      return;
    }
    if (!this.active) return;
    this.frames += 1;
    if (ev.playerDied || ev.bossDefeated) {
      this.last = { sec: this.frames / FIXED_STEP_HZ, won: ev.bossDefeated };
      this.active = false;
    }
  }

  label(): string {
    const current = this.seconds;
    const last = this.last;
    const previous = last ? `${last.won ? 'Thắng' : 'Thua'}: ${last.sec.toFixed(1)} s` : '';
    if (current !== undefined)
      return `Trận: ${current.toFixed(1)} s${previous ? ` · Trước: ${previous}` : ''}`;
    return previous || 'QA Lumen · Đi sang phải để bắt đầu';
  }
}
