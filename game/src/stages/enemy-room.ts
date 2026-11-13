import type { AsciiStageDef } from './stage-def';

/**
 * Phòng thử kẻ địch (M5), mỗi đoạn giới thiệu một loại rồi trộn lại ở cuối:
 *   'H' Drone Lính bản Prologue, vô hại (chỉ đẩy lùi) · 'R' Drone Lính · 'U' Tháp Pháo Tập Sự
 *   'W' Bướm Sắt · 'F' Tháp Gai (trên gờ) · 'K' Lính Kén (khiên trước, 2 phát nạp đầy phá khiên).
 * Không kẻ địch nào đứng gần điểm xuất phát hơn 6 ô (quy tắc đặc tả mục 4).
 */
export const ENEMY_ROOM_ROWS: readonly string[] = [
  '#..................................................................................................#',
  '#..................................................................................................#',
  '#..................................................................................................#',
  '#.......................................W...........................................W..............#',
  '#..................................................................................................#',
  '#...................R.........................................................R....................#',
  '#..................................................................................................#',
  '#.........H.......................................F...............................===..............#',
  '#................................................####...........................................####',
  '#.....................##..................................................................##.......#',
  '#..P..................##......U.............................K.........................K...##.....U.#',
  '####################################################################################################',
];

export const ENEMY_ROOM: AsciiStageDef = {
  kind: 'ascii',
  id: 'enemies',
  name: 'Phòng thử kẻ địch',
  rows: ENEMY_ROOM_ROWS,
  sections: [
    { id: 'start', label: 'Xuất phát + Drone vô hại', fromCol: 0 },
    { id: 'drone', label: 'Drone Lính', fromCol: 15 },
    { id: 'turret', label: 'Tháp Pháo Tập Sự', fromCol: 25 },
    { id: 'butterfly', label: 'Bướm Sắt', fromCol: 35 },
    { id: 'spike', label: 'Tháp Gai', fromCol: 45 },
    { id: 'cocoon', label: 'Lính Kén', fromCol: 56 },
    { id: 'mixed', label: 'Trộn', fromCol: 72 },
  ],
  enemyMarkers: {
    H: { enemy: 'drone_linh_prologue', harmless: true },
    R: { enemy: 'drone_linh' },
    U: { enemy: 'thap_phao_tap_su' },
    W: { enemy: 'buom_sat' },
    F: { enemy: 'thap_gai' },
    K: { enemy: 'linh_ken' },
  },
  playtest: false,
  theme: 'verdant',
  tutorial: 'stage1',
};
