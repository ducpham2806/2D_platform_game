import map from '../../maps/gale-test.json';
import { GALE_CUTTER } from '../logic/combat/loadout';
import type { TiledStageDef } from './stage-def';

export const GALE_ROOM: TiledStageDef = {
  kind: 'tiled',
  id: 'gale',
  name: 'Phòng thử Gale Cutter',
  map,
  playtest: false,
  practiceWeapons: [GALE_CUTTER],
  practiceOnly: true,
};
