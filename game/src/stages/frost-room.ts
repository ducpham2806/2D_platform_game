import map from '../../maps/frost-test.json';
import { FROST_SHARD } from '../logic/combat/loadout';
import type { TiledStageDef } from './stage-def';

export const FROST_ROOM: TiledStageDef = {
  kind: 'tiled',
  id: 'frost',
  name: 'Phòng thử băng',
  map,
  playtest: false,
  practiceWeapons: [FROST_SHARD],
  practiceOnly: true,
};
