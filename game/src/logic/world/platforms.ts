import type { StageMechanics } from '../../core/stage-mechanics-config';
import { type Box, moveY } from '../player/collision';
import type { Platform } from '../player/player-physics';
import type { CloudDriftSpawn, CrumbleSpawn, PlatformSpawn } from '../stage/layout';
import { Tile, type TileMap } from '../tilemap';

const EPS = 1e-9;
export const PLATFORM_DEPTH = 4;

function atSpawn(spawn: PlatformSpawn, tile: number): Platform {
  return {
    x: spawn.col * tile,
    y: spawn.row * tile,
    w: spawn.widthTiles * tile,
    dx: 0,
    dy: 0,
    jumpBonus: 0,
  };
}

/** Cùng dung sai tiếp đất với Platform của Kai. */
export function standsOn(box: Box, surface: Pick<Platform, 'x' | 'y' | 'w'>): boolean {
  return (
    box.x < surface.x + surface.w &&
    box.x + box.w > surface.x &&
    Math.abs(box.y + box.h - surface.y) <= 0.01
  );
}

/** Bệ một chiều phản xạ quãng đường thừa ở đầu đoạn, giữ tốc độ cả khi đường chéo. */
export class CloudDrift {
  readonly platform: Platform;
  private readonly startX: number;
  private readonly startY: number;
  private readonly dx: number;
  private readonly dy: number;
  private readonly length: number;
  private distance = 0;

  constructor(
    spawn: CloudDriftSpawn,
    private readonly speed: number,
    tile: number,
  ) {
    this.platform = atSpawn(spawn, tile);
    this.startX = this.platform.x;
    this.startY = this.platform.y;
    this.dx = (spawn.end.col - spawn.col) * tile;
    this.dy = (spawn.end.row - spawn.row) * tile;
    this.length = Math.hypot(this.dx, this.dy);
    if (this.length === 0) throw new Error('Bệ mây trôi cần hai điểm khác nhau');
  }

  step(dt: number): void {
    this.distance = (this.distance + this.speed * dt) % (2 * this.length);
    const progress = Math.min(this.distance, 2 * this.length - this.distance) / this.length;
    const p = this.platform;
    const x = this.startX + this.dx * progress;
    const y = this.startY + this.dy * progress;
    p.dx = x - p.x;
    p.dy = y - p.y;
    p.x = x;
    p.y = y;
  }

  reset(): void {
    this.distance = 0;
    Object.assign(this.platform, { x: this.startX, y: this.startY, dx: 0, dy: 0 });
  }
}

export type CrumbleState = 'ready' | 'cracking' | 'broken' | 'sinking';
export type CrumbleEvent = 'crack' | 'collapse' | 'restore';

/** Băng vỡ là ô một chiều cho cả Kai và địch đất. Mây chìm dùng bệ di động của Kai. */
export class CrumblePlatform {
  readonly origin: Box;
  state: CrumbleState = 'ready';
  private elapsed = 0;
  platform: Platform;

  constructor(
    readonly spawn: CrumbleSpawn,
    private readonly map: TileMap,
    private readonly rules: StageMechanics['crumble'],
  ) {
    this.platform = atSpawn(spawn, map.tileSize);
    this.origin = { x: this.platform.x, y: this.platform.y, w: this.platform.w, h: PLATFORM_DEPTH };
    if (spawn.mode === 'break') this.fillIce(Tile.OneWay);
  }

  get support(): Platform | undefined {
    return this.spawn.mode === 'sink' && this.state !== 'broken' ? this.platform : undefined;
  }

  get cracks(): number {
    if (this.state !== 'cracking') return 0;
    const [first, second] = this.rules.warnAtSec;
    if (this.elapsed + EPS >= second) return 3;
    return this.elapsed + EPS >= first ? 2 : 1;
  }

  get collapsedFor(): number | undefined {
    return this.state === 'broken' || this.state === 'sinking' ? this.elapsed : undefined;
  }

  /** Chân đè mặt cũ hoặc thân cắt qua chỗ bệ sắp mọc. */
  obstructedBy(box: Box): boolean {
    const p = this.origin;
    return (
      box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h >= p.y - 0.01
    );
  }

  activate(): boolean {
    if (this.state !== 'ready') return false;
    this.state = 'cracking';
    return true;
  }

  step(dt: number, obstructed: () => boolean): CrumbleEvent | undefined {
    if (this.state === 'ready') return;
    const sink = this.spawn.mode === 'sink';
    const rules = sink ? this.rules.sink : this.rules;
    const cracks = this.cracks;
    this.elapsed += dt;
    if (this.state === 'cracking') {
      if (this.elapsed + EPS < rules.triggerSec)
        return this.cracks !== cracks ? 'crack' : undefined;
      this.elapsed = Math.max(0, this.elapsed - rules.triggerSec);
      this.state = sink ? 'sinking' : 'broken';
      if (sink) this.sink(this.elapsed);
      else this.fillIce(Tile.Empty);
      return 'collapse';
    }
    if (this.state === 'sinking') this.sink(dt);
    if (this.elapsed + EPS >= rules.respawnSec && !obstructed()) {
      this.reset();
      return 'restore';
    }
  }

  reset(): void {
    this.state = 'ready';
    this.elapsed = 0;
    // Lần mọc mới có mặt đỡ mới để Kai không bị kéo từ bệ chìm về vị trí gốc.
    this.platform = atSpawn(this.spawn, this.map.tileSize);
    if (this.spawn.mode === 'break') this.fillIce(Tile.OneWay);
  }

  private fillIce(tile: Tile): void {
    for (let i = 0; i < this.spawn.widthTiles; i += 1)
      this.map.set(this.spawn.col + i, this.spawn.row, tile);
  }

  private sink(dt: number): void {
    const p = this.platform;
    const surface = { x: p.x, y: p.y, w: p.w, h: 0 };
    const hit = moveY(
      surface,
      this.rules.sink.sinkTilesPerSec * this.map.tileSize * dt,
      this.map,
      false,
    );
    p.dy = surface.y - p.y;
    p.y = surface.y;
    if (hit || p.y > this.map.heightPx) this.state = 'broken';
  }
}
