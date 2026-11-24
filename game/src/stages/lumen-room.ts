import type { AsciiStageDef } from './stage-def';

const ROWS = [
  '########################################',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............#........................#',
  '#.............D...===............===...#',
  '#.............D........................#',
  '#..P..........D............B...........#',
  '########################################',
] as const;

/** Phòng thử độc lập, không lưu tiến trình, không thay bản chơi thử G1. */
export const LUMEN_ROOM: AsciiStageDef = {
  kind: 'ascii',
  id: 'lumen',
  name: 'Phòng boss Lumen',
  rows: ROWS,
  sections: [
    { id: 'approach', label: 'Đoạn dẫn', fromCol: 0 },
    { id: 'boss', label: 'Phòng boss Lumen', fromCol: 14 },
  ],
  enemyMarkers: {},
  playtest: false,
  practiceOnly: true,
  practiceWeapons: ['Vine Lash'],
  boss: 'lumen',
  result: true,
  anchoredArena: {
    anchors: [
      { col: 20, row: 7 },
      { col: 27, row: 9 },
      { col: 34, row: 7 },
    ],
    startIndex: 1,
    ceilingRow: 0,
    floorRow: 11,
  },
  mirrors: [
    { col: 16, row: 7, angle: 45 },
    { col: 37, row: 7, angle: 135 },
    { col: 16, row: 9, angle: 135 },
    { col: 27, row: 2, angle: 45 },
  ],
};
