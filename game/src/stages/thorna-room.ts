import type { AsciiStageDef } from './stage-def';

/**
 * Phòng thử boss Thorna (M6): đoạn dẫn ngắn rồi cửa 'D' vào đấu trường 24 × 12 ô, 3 bục một
 * chiều cao 3 ô, Thorna ('B') đứng bên phải (đặc tả Prologue & Stage 1 mục 5). Bản đồ thật của
 * phòng boss Stage 1 làm bằng Tiled sau cổng Prototype.
 */
export const THORNA_ROOM_ROWS: readonly string[] = [
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............D...===....===....===....#',
  '#.............D........................#',
  '#..P..........D....................B...#',
  '########################################',
];

export const THORNA_ROOM: AsciiStageDef = {
  kind: 'ascii',
  id: 'thorna',
  name: 'Phòng boss Thorna',
  rows: THORNA_ROOM_ROWS,
  sections: [
    { id: 'approach', label: 'Đoạn dẫn', fromCol: 0 },
    { id: 'boss', label: 'Phòng boss Thorna', fromCol: 14 },
  ],
  enemyMarkers: {},
  playtest: false,
  theme: 'verdant',
  tutorial: 'stage1',
  boss: 'thorna',
};
