import type { StageMechanics } from '../../core/stage-mechanics-config';
import type { Projectile } from '../combat/projectiles';
import type { Enemy } from '../enemy/enemy';
import type { Box } from '../player/collision';
import type { Platform } from '../player/player-physics';
import type {
  BarrierSpawn,
  Cell,
  EnemySpawn,
  RoomSpawn,
  SecretSpawn,
  VineSpawn,
} from '../stage/layout';
import { Tile, type TileMap } from '../tilemap';

/** Cơ chế môi trường của màn (M7, đặc tả Stage 1 mục 3). Logic thuần. */

/** Bệ của dây leo đu dày bao nhiêu px (chỉ để vẽ; va chạm chỉ dùng mặt trên). */
export const VINE_PLATFORM_THICKNESS = 4;

/**
 * Dây leo đu: treo ở mép trên ô (col, row), lắc như con lắc với chu kỳ `periodSec`, lệch ngang
 * tối đa `amplitudeTiles`. Đầu dây là một bệ một chiều, chở người chơi đứng trên.
 */
export class Vine {
  readonly pivotX: number;
  readonly pivotY: number;
  readonly lengthPx: number;
  readonly platform: Platform;
  private readonly maxAngle: number;
  private time: number;

  constructor(
    spawn: VineSpawn,
    private readonly rules: StageMechanics['vine'],
    tileSize: number,
  ) {
    this.pivotX = (spawn.col + 0.5) * tileSize;
    this.pivotY = spawn.row * tileSize;
    const length = spawn.lengthTiles ?? rules.lengthTiles;
    this.lengthPx = length * tileSize;
    this.maxAngle = Math.asin(Math.min(1, rules.amplitudeTiles / length));
    this.time = spawn.phase * rules.periodSec;
    const w = rules.platformWidthTiles * tileSize;
    this.platform = { x: 0, y: 0, w, dx: 0, dy: 0, jumpBonus: rules.jumpBonus };
    this.place();
    this.platform.dx = 0;
    this.platform.dy = 0;
  }

  /** Góc lệch so với phương thẳng đứng (radian). */
  get angle(): number {
    return this.maxAngle * Math.sin((2 * Math.PI * this.time) / this.rules.periodSec);
  }

  /** Điểm buộc bệ (giữa mặt trên của bệ). */
  get end(): { x: number; y: number } {
    const a = this.angle;
    return {
      x: this.pivotX + this.lengthPx * Math.sin(a),
      y: this.pivotY + this.lengthPx * Math.cos(a),
    };
  }

  step(dt: number): void {
    this.time = (this.time + dt) % this.rules.periodSec;
    this.place();
  }

  private place(): void {
    const e = this.end;
    const p = this.platform;
    const x = e.x - p.w / 2;
    p.dx = x - p.x;
    p.dy = e.y - p.y;
    p.x = x;
    p.y = e.y;
  }
}

export type RoomState = 'open' | 'locked' | 'cleared';

/**
 * Phòng khóa: người chơi vào hẳn bên trong (qua khỏi cột cửa) thì cửa đóng; hạ hết kẻ địch
 * xuất phát trong phòng thì cửa mở hẳn. Chết trong phòng thì cửa mở lại để hồi sinh ở checkpoint.
 */
export class LockedRoom {
  state: RoomState = 'open';
  private enemies: readonly Enemy[] = [];

  constructor(
    readonly spawn: RoomSpawn,
    private readonly map: TileMap,
  ) {}

  /** Gán các kẻ địch xuất phát bên trong phòng (giữa hai cột cửa). */
  bind(enemies: readonly Enemy[], spawns: readonly EnemySpawn[]): void {
    const r = this.spawn;
    this.enemies = enemies.filter((_, i) => {
      const s = spawns[i];
      return !!s && s.col > r.first && s.col < r.last && s.row >= r.top && s.row <= r.bottom;
    });
  }

  get remaining(): number {
    return this.enemies.filter((e) => e.alive).length;
  }

  /** Các loại kẻ địch (id trong enemies.json) của phòng. */
  get kinds(): string[] {
    return [...new Set(this.enemies.map((e) => e.data.id))];
  }

  /** Vùng bên trong (px), giữa hai cột cửa. */
  inner(tileSize: number): { x: number; y: number; w: number; h: number } {
    const r = this.spawn;
    return {
      x: (r.first + 1) * tileSize,
      y: r.top * tileSize,
      w: (r.last - r.first - 1) * tileSize,
      h: (r.bottom - r.top + 1) * tileSize,
    };
  }

  /** Trả về 'locked' / 'cleared' khi vừa đổi trạng thái trong bước này. */
  update(player: Box, alive: boolean): 'locked' | 'cleared' | undefined {
    const t = this.map.tileSize;
    if (this.state === 'open') {
      const inner = this.inner(t);
      const inside =
        player.x >= inner.x &&
        player.x + player.w <= inner.x + inner.w &&
        player.y + player.h > inner.y &&
        player.y < inner.y + inner.h;
      if (!alive || !inside) return undefined;
      if (this.remaining === 0) {
        this.state = 'cleared';
        return 'cleared';
      }
      this.state = 'locked';
      this.setDoors(true);
      return 'locked';
    }
    if (this.state === 'locked' && this.remaining === 0) {
      this.state = 'cleared';
      this.setDoors(false);
      return 'cleared';
    }
    return undefined;
  }

  /** Người chơi hồi sinh: phòng chưa xong thì mở cửa, chờ vào lại. */
  reset(): void {
    if (this.state !== 'locked') return;
    this.state = 'open';
    this.setDoors(false);
  }

  private setDoors(closed: boolean): void {
    for (const d of this.spawn.doors) this.map.set(d.col, d.row, closed ? Tile.Solid : Tile.Empty);
  }
}

/**
 * Vật chắn (rễ khô chắn Két giáp...): đặc như tường, vỡ khi trúng vũ khí `requiresWeapon`.
 * Vũ khí khác bắn vào thì bị chặn.
 */
export class Barrier {
  broken = false;

  constructor(
    readonly spawn: BarrierSpawn,
    private readonly map: TileMap,
  ) {
    this.fill(Tile.Solid);
  }

  box(): Box {
    const t = this.map.tileSize;
    const s = this.spawn;
    return {
      x: s.first * t,
      y: s.top * t,
      w: (s.last - s.first + 1) * t,
      h: (s.bottom - s.top + 1) * t,
    };
  }

  /** Đạn người chơi chạm vật chắn (nới 1 px vì đạn chết ngay mép khối). true nếu vừa vỡ. */
  tryBreak(p: Projectile): boolean {
    if (this.broken || p.owner !== 'player' || p.weapon !== this.spawn.requiresWeapon) return false;
    const b = this.box();
    const touching =
      p.x < b.x + b.w + 1 && p.x + p.w > b.x - 1 && p.y < b.y + b.h + 1 && p.y + p.h > b.y - 1;
    if (!touching) return false;
    this.broken = true;
    this.fill(Tile.Empty);
    return true;
  }

  private fill(tile: Tile): void {
    const s = this.spawn;
    for (let r = s.top; r <= s.bottom; r += 1)
      for (let c = s.first; c <= s.last; c += 1) this.map.set(c, r, tile);
  }
}

/** Vật phẩm bí mật (nhặt một lần trong lượt chơi; M11 sẽ lưu lại). */
export interface Secret {
  spawn: SecretSpawn;
  box: Box;
  taken: boolean;
}

export function makeSecret(spawn: SecretSpawn, tileSize: number): Secret {
  const size = tileSize - 4;
  return {
    spawn,
    box: {
      x: (spawn.col + 0.5) * tileSize - size / 2,
      y: (spawn.row + 1) * tileSize - size,
      w: size,
      h: size,
    },
    taken: false,
  };
}

/** Tâm đáy của một ô (chỗ đặt người chơi khi hồi sinh). */
export function standPoint(cell: Cell, tileSize: number): { x: number; y: number } {
  return { x: (cell.col + 0.5) * tileSize, y: (cell.row + 1) * tileSize };
}
