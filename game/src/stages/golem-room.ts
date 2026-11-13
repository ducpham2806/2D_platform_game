import type { AsciiStageDef } from './stage-def';

/**
 * Phòng thử mini-boss Bramble Golem (M6): đoạn dẫn, rồi phòng khóa 20 × 12 ô ('L' là hai cột
 * cửa) có Golem ('G') và hai bục một chiều. Cửa đóng khi Kai vào hẳn bên trong, mở khi hạ Golem
 * (đặc tả Prologue & Stage 1 mục 3, đoạn C). Phòng thật của Stage 1 làm bằng Tiled sau cổng
 * Prototype.
 */
export const GOLEM_ROOM_ROWS: readonly string[] = [
  '#.................L....................L.......#',
  '#.................L....................L.......#',
  '#.................L....................L.......#',
  '#.................L....................L.......#',
  '#.................L....................L.......#',
  '#.................L....................L.......#',
  '#.................L....................L.......#',
  '#.................L....................L.......#',
  '#.................L....===....===......L.......#',
  '#.................L....................L.......#',
  '#..P..............L..............G.....L.......#',
  '################################################',
];

export const GOLEM_ROOM: AsciiStageDef = {
  kind: 'ascii',
  id: 'golem',
  name: 'Phòng thử Bramble Golem',
  rows: GOLEM_ROOM_ROWS,
  sections: [
    { id: 'approach', label: 'Đoạn dẫn', fromCol: 0 },
    { id: 'room', label: 'Phòng khóa Golem', fromCol: 18 },
    { id: 'exit', label: 'Lối ra', fromCol: 40 },
  ],
  enemyMarkers: { G: { enemy: 'bramble_golem' } },
  playtest: false,
  theme: 'verdant',
  tutorial: 'stage1',
};
