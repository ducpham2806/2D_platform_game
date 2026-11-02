import type { AsciiStageDef, StageSection } from './stage-def';

/**
 * Màn xám thử cảm giác điều khiển (mốc Prototype). Theo nhịp dạy của Prologue và Stage 1:
 * khe 2 ô → bậc cao 1, 3, 4 ô → bục một chiều → giếng 8 ô phải nhảy tường → gờ ra →
 * hành lang trần thấp (cao 2 ô) → hố 5 ô phải lướt + nhảy (dash-jump) → cửa 'D' → phòng boss
 * 18 ô với 2 bục một chiều cao 3 ô ('B' là chỗ boss đứng). 'T' bia tập bắn, 'S' bia có khiên.
 * Ký hiệu: xem logic/tilemap.ts.
 * Bản đồ thật của từng màn làm bằng Tiled (xem game/maps/README.md).
 */
export const GRAY_BOX_ROWS: readonly string[] = [
  '#....................................................##########.............#..................#',
  '#....................................................##########.............#..................#',
  '#....................................................##########.............#..................#',
  '#......................................#....#######..##########.............#..................#',
  '#......................................#....#........##########.............#..................#',
  '#..............................=======.#....#........##########.............#..................#',
  '#......................................#....#........##########.............#..................#',
  '#........................##............#....#........##########.............#..................#',
  '#...................##...##..=======...#....#........##########.............D...===......===...#',
  '#...................##...##.................#...............................D..................#',
  '#..P..T........##...##.S.##.................#...............................D...............B..#',
  '##########..####################################################.....###########################',
];

/**
 * Các đoạn của màn xám, để nhật ký chơi thử biết người chơi chết hay bỏ cuộc ở đâu
 * (GDD 17: "hơn 30% người thử bỏ cuộc ở cùng một đoạn" là hỏng). fromCol: cột ô bắt đầu.
 */
export const GRAY_BOX_SECTIONS: readonly StageSection[] = [
  { id: 'start', label: 'Xuất phát + bia', fromCol: 0 },
  { id: 'gap', label: 'Khe 2 ô', fromCol: 9 },
  { id: 'steps', label: 'Bậc + bia khiên', fromCol: 14 },
  { id: 'oneway', label: 'Bục một chiều', fromCol: 28 },
  { id: 'well', label: 'Giếng nhảy tường', fromCol: 38 },
  { id: 'corridor', label: 'Hành lang thấp', fromCol: 51 },
  { id: 'pit', label: 'Hố lướt + nhảy', fromCol: 63 },
  { id: 'boss', label: 'Phòng boss', fromCol: 76 },
];

export const GRAY_BOX: AsciiStageDef = {
  kind: 'ascii',
  id: 'gray',
  name: 'Màn xám',
  rows: GRAY_BOX_ROWS,
  sections: GRAY_BOX_SECTIONS,
  enemyMarkers: {},
  playtest: true,
};
