import type { EnemyRules } from '../../core/enemy-config';
import type { Box } from '../player/collision';

export function enemyInRange(
  rules: EnemyRules,
  tileSize: number,
  box: Box,
  playerX: number,
  playerY: number,
): boolean {
  return (
    Math.abs(box.x + box.w / 2 - playerX) <= rules.activeRangeTiles * tileSize &&
    Math.abs(box.y + box.h / 2 - playerY) <= rules.activeRangeTilesY * tileSize
  );
}

/** QB-23: toàn hộp kẻ địch nằm trong khung vừa vẽ, thu lại số ô đã cấu hình. */
export function enemyOnScreen(rules: EnemyRules, tileSize: number, box: Box, view?: Box): boolean {
  if (!view || !rules.attackRequiresOnScreen) return true;
  const inset = rules.attackScreenInsetTiles * tileSize;
  return (
    box.x >= view.x + inset &&
    box.x + box.w <= view.x + view.w - inset &&
    box.y >= view.y + inset &&
    box.y + box.h <= view.y + view.h - inset
  );
}
