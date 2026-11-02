import map from '../../maps/m7-test.json';
import type { TiledStageDef } from './stage-def';

/**
 * Phòng thử màn chơi (M7), làm bằng Tiled (`game/maps/m7-test.json`, sinh từ bản phác
 * `maps/src/m7-test.map.json`): gai, hố, 2 checkpoint, 2 dây leo đu ngược pha trên hố gai,
 * phòng khóa (Tháp Pháo + Drone), vách vỡ bằng Arc Cannon giấu Nano Cell, rễ khô cần Prism Beam
 * chắn Két giáp.
 */
export const MECHANICS_ROOM: TiledStageDef = {
  kind: 'tiled',
  id: 'mechanics',
  name: 'Phòng thử màn chơi',
  map,
  playtest: false,
};
