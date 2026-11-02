import type { TileMap } from '../tilemap';

/** Hộp va chạm: (x, y) là góc trên trái, đơn vị px. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const EPS = 1e-6;

function rowsOf(box: Box, map: TileMap): [number, number] {
  return [Math.floor(box.y / map.tileSize), Math.floor((box.y + box.h - EPS) / map.tileSize)];
}

function colsOf(box: Box, map: TileMap): [number, number] {
  return [Math.floor(box.x / map.tileSize), Math.floor((box.x + box.w - EPS) / map.tileSize)];
}

/**
 * Di chuyển theo trục X rồi chặn ở khối đặc (bục một chiều không chặn ngang).
 * Chia nhỏ quãng đi để không bao giờ xuyên qua tường mỏng. Trả về hướng va (−1, 0, 1).
 */
export function moveX(box: Box, dx: number, map: TileMap): number {
  const step = map.tileSize / 2;
  let remaining = dx;
  while (Math.abs(remaining) > EPS) {
    const move = Math.max(-step, Math.min(step, remaining));
    remaining -= move;
    box.x += move;
    const [top, bottom] = rowsOf(box, map);
    if (move > 0) {
      const col = Math.floor((box.x + box.w - EPS) / map.tileSize);
      for (let r = top; r <= bottom; r += 1) {
        if (map.isSolid(col, r)) {
          box.x = col * map.tileSize - box.w;
          return 1;
        }
      }
    } else {
      const col = Math.floor(box.x / map.tileSize);
      for (let r = top; r <= bottom; r += 1) {
        if (map.isSolid(col, r)) {
          box.x = (col + 1) * map.tileSize;
          return -1;
        }
      }
    }
  }
  return 0;
}

/**
 * Di chuyển theo trục Y. Rơi xuống thì đáp lên khối đặc và bục một chiều (trừ khi đang
 * cố ý xuống xuyên bục); đi lên thì chỉ khối đặc chặn đầu. Trả về −1 (cụng trần), 1 (đáp), 0.
 */
export function moveY(box: Box, dy: number, map: TileMap, dropThrough: boolean): number {
  const step = map.tileSize / 2;
  let remaining = dy;
  while (Math.abs(remaining) > EPS) {
    const move = Math.max(-step, Math.min(step, remaining));
    remaining -= move;
    const prevBottom = box.y + box.h;
    box.y += move;
    const [left, right] = colsOf(box, map);
    if (move > 0) {
      const row = Math.floor((box.y + box.h - EPS) / map.tileSize);
      const rowTop = row * map.tileSize;
      for (let c = left; c <= right; c += 1) {
        const oneWayLanding = !dropThrough && map.isOneWay(c, row) && prevBottom <= rowTop + EPS;
        if (map.isSolid(c, row) || oneWayLanding) {
          box.y = rowTop - box.h;
          return 1;
        }
      }
    } else {
      const row = Math.floor(box.y / map.tileSize);
      for (let c = left; c <= right; c += 1) {
        if (map.isSolid(c, row)) {
          box.y = (row + 1) * map.tileSize;
          return -1;
        }
      }
    }
  }
  return 0;
}

/** Có đang đứng trên khối đặc hoặc bục một chiều không (đáy hộp chạm mặt trên ô). */
export function groundBelow(box: Box, map: TileMap): 'solid' | 'oneWay' | undefined {
  const bottom = box.y + box.h;
  const row = Math.floor((bottom + EPS) / map.tileSize);
  if (Math.abs(row * map.tileSize - bottom) > 0.01) return undefined;
  const [left, right] = colsOf(box, map);
  let found: 'solid' | 'oneWay' | undefined;
  for (let c = left; c <= right; c += 1) {
    if (map.isSolid(c, row)) return 'solid';
    if (map.isOneWay(c, row)) found = 'oneWay';
  }
  return found;
}

/** Tường sát bên trái (−1), phải (1) hoặc không (0), dò cách 1 px. */
export function wallBeside(box: Box, map: TileMap): number {
  const [top, bottom] = rowsOf(box, map);
  const rightCol = Math.floor((box.x + box.w + 1 - EPS) / map.tileSize);
  const leftCol = Math.floor((box.x - 1) / map.tileSize);
  for (let r = top; r <= bottom; r += 1) {
    if (map.isSolid(rightCol, r) && rightCol * map.tileSize - (box.x + box.w) < 1) return 1;
  }
  for (let r = top; r <= bottom; r += 1) {
    if (map.isSolid(leftCol, r) && box.x - (leftCol + 1) * map.tileSize < 1) return -1;
  }
  return 0;
}
