import { ENEMY_ROOM } from './enemy-room';
import { GRAY_BOX } from './gray-box';
import { MECHANICS_ROOM } from './mechanics-room';
import type { StageDef } from './stage-def';

export { buildStageLayout } from './stage-def';

/** Các màn dựng sẵn, chọn từ menu. */
export const STAGE_DEFS = {
  gray: GRAY_BOX,
  enemies: ENEMY_ROOM,
  mechanics: MECHANICS_ROOM,
} as const satisfies Record<string, StageDef>;
export type StageDefId = keyof typeof STAGE_DEFS;
