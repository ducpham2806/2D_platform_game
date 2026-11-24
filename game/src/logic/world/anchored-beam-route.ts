import type { BossAnchorPoint } from '../boss/boss-anchors';
import type { BossBeamRoute } from '../boss/boss-beam';
import { LASER_DIRECTIONS, type LaserPath } from '../stage/laser-path';
import type { StageOptics } from './stage-optics';

/** Chỉ chọn đường có dội gương. Khi hoà dùng thứ tự hướng cố định của LaserPath. */
export function anchoredBeamRoute(
  optics: StageOptics,
  origin: BossAnchorPoint,
  player: BossAnchorPoint,
): BossBeamRoute {
  return {
    x: origin.x,
    turns: () => 0,
    trace: (_alternate, limit) => {
      let best = Infinity;
      let chosen: LaserPath = [];
      for (const dir of LASER_DIRECTIONS) {
        const path = optics.trace(origin, dir, limit);
        if (path.length < 2) continue;
        for (const { from, to } of path.slice(1)) {
          const dx = Math.max(
            Math.min(from.x, to.x) - player.x,
            0,
            player.x - Math.max(from.x, to.x),
          );
          const dy = Math.max(
            Math.min(from.y, to.y) - player.y,
            0,
            player.y - Math.max(from.y, to.y),
          );
          const dist = dx * dx + dy * dy;
          if (dist < best) {
            chosen = path;
            best = dist;
          }
        }
      }
      return chosen;
    },
  };
}
