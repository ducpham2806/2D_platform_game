import map from '../../maps/mini-boss-test.json';
import type { TiledStageDef } from './stage-def';

export const MINI_BOSS_ROOM: TiledStageDef = {
  kind: 'tiled',
  id: 'miniBossRoom',
  name: 'Phòng thử Prism Sentinel và Gale Roc',
  playtest: false,
  practiceOnly: true,
  map,
};
