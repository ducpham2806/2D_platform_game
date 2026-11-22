import map from '../../maps/platform-test.json';
import type { TiledStageDef } from './stage-def';

export const PLATFORM_ROOM: TiledStageDef = {
  kind: 'tiled',
  id: 'platforms',
  name: 'Phòng thử bục băng và mây',
  map,
  playtest: false,
  practiceOnly: true,
};
