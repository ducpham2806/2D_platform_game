import { FROST_SHARD } from '../combat/loadout';
import { overlaps, type Projectile } from '../combat/projectiles';
import type { Box } from '../player/collision';
import type { CellSpan } from '../stage/layout';
import { Tile, type TileMap } from '../tilemap';

/** Dòng lỏng vô hại; Frost Shard đóng băng thành bậc đứng một chiều tới hết lượt. */
export class CoolantFlow {
  readonly box: Box;
  /** Hàng ô của các bậc khi đã đông, tính từ trên xuống. */
  readonly stepRows: readonly number[];
  frozen = false;

  constructor(
    readonly spawn: CellSpan,
    private readonly map: TileMap,
    frozenSteps: number,
  ) {
    const { first, last, top, bottom } = spawn;
    const t = map.tileSize;
    const rows = bottom - top + 1;
    if (rows < frozenSteps)
      throw new Error(`Dòng làm mát (${first}, ${top}) cần cao ít nhất ${frozenSteps} ô`);
    this.box = { x: first * t, y: top * t, w: (last - first + 1) * t, h: rows * t };
    this.stepRows = Array.from(
      { length: frozenSteps },
      (_, i) => top + Math.round((i * (rows - 1)) / Math.max(1, frozenSteps - 1)),
    );
  }

  /** Trả về true để giữ viên đạn vừa làm đông dòng chảy. Bậc đã đông cho đạn đi qua. */
  absorbShot(p: Projectile): boolean {
    if (
      this.frozen ||
      p.owner !== 'player' ||
      p.kind !== 'shard' ||
      p.weapon !== FROST_SHARD ||
      !overlaps(p, this.box)
    )
      return false;
    this.frozen = true;
    for (const row of this.stepRows)
      for (let col = this.spawn.first; col <= this.spawn.last; col += 1)
        this.map.set(col, row, Tile.OneWay);
    return true;
  }
}
