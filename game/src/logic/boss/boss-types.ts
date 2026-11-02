/** Kiểu dữ liệu ra của boss (logic thuần). */
import type { BossAttackId } from '../../core/boss-config';

export type BossState =
  'waiting' | 'idle' | 'telegraph' | 'active' | 'recover' | 'stunned' | 'dead';

export interface BossEvents {
  phaseChanged: boolean;
  attackStarted: BossAttackId | undefined;
  landed: boolean;
  defeated: boolean;
}

export interface BossContext {
  playerX: number;
  playerY: number;
}

export function noEvents(): BossEvents {
  return { phaseChanged: false, attackStarted: undefined, landed: false, defeated: false };
}
