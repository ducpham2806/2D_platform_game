import type { BossData } from '../../core/boss-config';
import type { Box } from '../player/collision';
import type { BossBeamRoute } from './boss-beam';

export interface RoomBossArena {
  topY: number;
  floorY: number;
  beamRoutes: readonly BossBeamRoute[];
}

export interface DiveLine {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export class BossFlight {
  private elapsed = 0;

  constructor(
    private readonly data: NonNullable<BossData['roomFlight']>,
    readonly arena: RoomBossArena,
    private readonly tileSize: number,
  ) {}

  /** Chỉ bắt đầu đòn từ trên không. Sau khi đáp, bay lên lại trong nhịp nghỉ. */
  get attackHeightY(): number {
    return this.arena.floorY - this.data.minHeightTiles * this.tileSize;
  }

  rise(box: Box, dt: number): number {
    const { maxHeightTiles, minHeightTiles, liftTilesPerSec, bobPeriodSec } = this.data;
    this.elapsed += dt;
    const phase = (1 - Math.cos((2 * Math.PI * this.elapsed) / bobPeriodSec)) / 2;
    const heightTiles = minHeightTiles + (maxHeightTiles - minHeightTiles) * phase;
    const targetY = this.arena.floorY - heightTiles * this.tileSize - box.h / 2;
    const step = liftTilesPerSec * this.tileSize * dt;
    return Math.max(-step, Math.min(step, targetY - box.y));
  }

  /** Khóa hướng qua vị trí Kai khi bắt đầu báo. Nếu đích cao hơn, bổ xuống bên dưới đích. */
  planDive(box: Box, x: number, y: number, cols: { first: number; last: number }): DiveLine {
    const from = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const endY = this.arena.floorY - box.h / 2;
    const dx = x - from.x;
    const rise = y - from.y;
    const endX = rise > 0 ? from.x + (dx * (endY - from.y)) / rise : x;
    const left = cols.first * this.tileSize + box.w / 2;
    const right = (cols.last + 1) * this.tileSize - box.w / 2;
    return { from, to: { x: Math.max(left, Math.min(right, endX)), y: endY } };
  }

  route(bossX: number): BossBeamRoute | undefined {
    // Chọn gương bên đối diện để có làn phản xạ đi qua thân Sentinel.
    return this.arena.beamRoutes.reduce<BossBeamRoute | undefined>(
      (best, route) =>
        !best || Math.abs(route.x - bossX) > Math.abs(best.x - bossX) ? route : best,
      undefined,
    );
  }
}
