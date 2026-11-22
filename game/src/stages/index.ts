import { ENEMY_ROOM } from './enemy-room';
import { GOLEM_ROOM } from './golem-room';
import { GRAY_BOX } from './gray-box';
import { MECHANICS_ROOM } from './mechanics-room';
import { OPTICS_ROOM } from './optics-room';
import type { StageDef } from './stage-def';
import { THORNA_ROOM } from './thorna-room';

export { buildStageLayout } from './stage-def';

/** Các màn dựng sẵn, chọn từ menu. */
export const STAGE_DEFS = {
  gray: GRAY_BOX,
  enemies: ENEMY_ROOM,
  mechanics: MECHANICS_ROOM,
  optics: OPTICS_ROOM,
  thorna: THORNA_ROOM,
  golem: GOLEM_ROOM,
} as const satisfies Record<string, StageDef>;
export type StageDefId = keyof typeof STAGE_DEFS;
