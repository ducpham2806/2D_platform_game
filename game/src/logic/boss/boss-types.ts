/** Kiểu dữ liệu ra của boss (logic thuần). */
import type { BossAttackId } from '../../core/boss-config';

export type BossState =
  'waiting' | 'idle' | 'telegraph' | 'active' | 'recover' | 'stunned' | 'dead';

export interface BossEvents {
  phaseChanged: boolean;
  attackStarted: BossAttackId | undefined;
  landed: boolean;
  reflected: boolean;
  defeated: boolean;
}

export interface BossContext {
  playerX: number;
  playerY: number;
  /** Phòng khóa áp QB-23 theo khung đã vẽ và khoảng cách tới Kai. */
  attackAllowed?: boolean;
  inRange?: boolean;
}

export function noEvents(): BossEvents {
  return {
    phaseChanged: false,
    attackStarted: undefined,
    landed: false,
    reflected: false,
    defeated: false,
  };
}
