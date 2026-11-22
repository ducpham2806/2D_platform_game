import map from '../../maps/optics-test.json';
import type { TiledStageDef } from './stage-def';

export const OPTICS_ROOM: TiledStageDef = {
  kind: 'tiled',
  id: 'optics',
  name: 'Phòng thử laser',
  map,
  playtest: false,
};
