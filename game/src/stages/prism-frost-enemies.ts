import map from '../../maps/prism-frost-enemies.json';
import type { TiledStageDef } from './stage-def';

export const PRISM_FROST_ENEMIES: TiledStageDef = {
  kind: 'tiled',
  id: 'prismFrostEnemies',
  name: 'Phòng thử địch Stage 2–3',
  playtest: false,
  practiceOnly: true,
  map,
};
