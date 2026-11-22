import type { BossData } from '../../core/boss-config';
import type { EnemyRules } from '../../core/enemy-config';
import { Boss } from '../boss/boss';
import type { ProjectilePool } from '../combat/projectiles';
import { enemyInRange, enemyOnScreen } from '../enemy/attack-range';
import type { Box } from '../player/collision';
import type { PlayerPhysics } from '../player/player-physics';
import { createRng } from '../rng';
import { opticalCenter } from '../stage/laser-path';
import type { RoomSpawn } from '../stage/layout';
import type { TileMap } from '../tilemap';
import type { StageOptics } from './stage-optics';

/** Bộ chuyển Q1: phòng khóa dùng alive/id, chiến đấu và chuyển pha vẫn do Boss quản lý. */
export class RoomBoss {
  boss: Boss;

  constructor(
    private readonly room: RoomSpawn,
    private readonly data: BossData,
    private readonly map: TileMap,
    private readonly optics: StageOptics | undefined,
    private readonly rules: EnemyRules,
    private readonly seed: number,
  ) {
    this.boss = this.create();
  }

  get id(): string {
    return this.data.id;
  }

  get alive(): boolean {
    return this.boss.state !== 'dead';
  }

  activate(): void {
    this.boss.activate();
  }

  step(player: PlayerPhysics, pool: ProjectilePool, dt: number, view?: Box) {
    const playerX = player.centerX;
    const playerY = player.box.y + player.box.h / 2;
    const t = this.map.tileSize;
    const inRange = enemyInRange(this.rules, t, this.boss.box, playerX, playerY);
    return this.boss.step(
      {
        playerX,
        playerY,
        inRange,
        attackAllowed: inRange && enemyOnScreen(this.rules, t, this.boss.box, view),
      },
      pool,
      dt,
    );
  }

  reset(): void {
    if (this.alive) this.boss = this.create();
  }

  private create(): Boss {
    const spawn = this.room.miniBoss!;
    const t = this.map.tileSize;
    const topY = this.room.top * t;
    const floorY = (this.room.bottom + 1) * t;
    const center = opticalCenter(spawn.col, spawn.row, t);
    const { first, last } = this.room;
    const optics = this.optics;
    const hoverY = floorY - this.data.roomFlight!.minHeightTiles * t;
    const beamRoutes =
      this.data.attacks.beam && optics
        ? optics.mirrors
            .filter(
              ({ center, spawn: { col, row } }) =>
                col > first &&
                col < last &&
                row > this.room.top + 1 &&
                row <= this.room.bottom &&
                Math.abs(center.y - hoverY) < this.data.sizePx.h / 2,
            )
            .map((mirror) => ({
              x: mirror.center.x,
              turns: () => mirror.turns,
              trace: (alternate: boolean, maxBounces: number) =>
                optics.bossBeamPath(mirror.spawn, topY + 1.5 * t, alternate, maxBounces),
            }))
        : [];
    if (this.data.attacks.beam && beamRoutes.length === 0)
      throw new Error(`${this.id}: phòng khóa cần gương cho Tia Phản Xạ`);
    const rain = this.data.attacks.rain;
    if (rain) {
      const gapCols = rain.safeGaps * rain.gapWidthTiles;
      if (last - first - 1 < gapCols + Math.max(rain.safeGaps, rain.count ?? 0))
        throw new Error(`${this.id}: phòng khóa quá hẹp cho Mưa Lông Thép`);
    }
    return new Boss(
      this.data,
      this.map,
      center.x,
      center.y + this.data.sizePx.h / 2,
      { first: first + 1, last: last - 1 },
      createRng(this.seed),
      { topY, floorY, beamRoutes },
    );
  }
}
