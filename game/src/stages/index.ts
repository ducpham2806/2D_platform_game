import { ENEMY_ROOM } from './enemy-room';
import { FROST_ROOM } from './frost-room';
import { GALE_ROOM } from './gale-room';
import { GOLEM_ROOM } from './golem-room';
import { GRAY_BOX } from './gray-box';
import { MINI_BOSS_ROOM } from './mini-boss-room';
import { MECHANICS_ROOM } from './mechanics-room';
import { OPTICS_ROOM } from './optics-room';
import { PLATFORM_ROOM } from './platform-room';
import { PRISM_FROST_ENEMIES } from './prism-frost-enemies';
import type { StageDef } from './stage-def';
import { THORNA_ROOM } from './thorna-room';

export { buildStageLayout } from './stage-def';

/** Các màn dựng sẵn, chọn từ menu. */
export const STAGE_DEFS = {
  gray: GRAY_BOX,
  enemies: ENEMY_ROOM,
  mechanics: MECHANICS_ROOM,
  optics: OPTICS_ROOM,
  frost: FROST_ROOM,
  gale: GALE_ROOM,
  prismFrostEnemies: PRISM_FROST_ENEMIES,
  platforms: PLATFORM_ROOM,
  miniBossRoom: MINI_BOSS_ROOM,
  thorna: THORNA_ROOM,
  golem: GOLEM_ROOM,
} as const satisfies Record<string, StageDef>;
export type StageDefId = keyof typeof STAGE_DEFS;
