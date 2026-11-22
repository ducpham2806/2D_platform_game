import type { BoomerangBehavior } from '../../core/weapons-config';
import type { Box } from '../player/collision';
import type { TileMap } from '../tilemap';
import { type ExtraSolid, firstFlightHit } from './flight';

export type ProjectileKind =
  | 'shot'
  | 'mid'
  | 'charged'
  | 'sweep'
  | 'shard'
  | 'boomerang'
  | 'enemyShot'
  | 'shockwave'
  | 'drop'
  | 'bomb'
  | 'lash'
  | 'root'
  | 'seed';

export interface BoomerangFlight {
  speedPxPerSec: number;
  phase: 'out' | 'turn' | 'return';
  cancelKinds: BoomerangBehavior['cancelKinds'];
  cancelsLeft: number;
}

/** Đạn, sóng, roi… mọi hộp gây sát thương có thời hạn. (x, y) là góc trên trái, px. */
export interface Projectile {
  id: number;
  owner: 'player' | 'enemy';
  kind: ProjectileKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  /** Sát thương gốc (người chơi: đơn vị phát Arc Cannon; kẻ địch: máu người chơi). */
  damage: number;
  /** Hệ số loại đòn (nạp vừa, nạp đầy, roi…). */
  kindMul: number;
  /** Số mục tiêu còn được xuyên qua; xuyên hết thì đạn biến mất ở mục tiêu tiếp theo. */
  pierceLeft: number;
  breaksShield: boolean;
  weapon: string;
  /**
   * Nguồn đòn cho đo lường (`enemy:<id kẻ địch>` hoặc `boss:<kind>` nếu không có tag).
   */
  source?: string;
  /** Q4: nguồn là địch thường, gồm cả đạn còn bay sau khi địch bị hạ. */
  fromRegularEnemy?: boolean;
  traveled: number;
  maxDistance: number;
  ttl: number;
  /** Gắn theo người chơi (roi): thế giới tự đặt lại vị trí mỗi bước. */
  attached: boolean;
  /** Trọng lực (px/s²) cho đạn rơi như hạt nổ của Bướm Sắt; không có thì bay thẳng. */
  gravity?: number;
  /** Đạn dội coi ô gương như tường, kể cả khi đã hết lượt nảy. */
  bouncesLeft?: number;
  /** Đạn ném cong chạm bục một chiều lúc rơi. */
  arc?: { onLand?: (p: Projectile) => void };
  /** Vô hiệu kẻ địch thường khi đạn băng gây sát thương (QB-19). */
  freezeSec?: number;
  boomerang?: BoomerangFlight;
  alive: boolean;
  /** Đã chạm mục tiêu nào trong lượt bay hiện tại. */
  hitIds: Set<number>;
}

export type ProjectileSpec = Omit<Projectile, 'id' | 'traveled' | 'alive' | 'hitIds'>;

/** Phần của đòn dùng để xét hướng trúng và tác dụng lên khiên. */
export type ShieldContact = Pick<Projectile, 'vx' | 'x' | 'w' | 'breaksShield'>;

function overlapsSolid(p: Projectile, map: TileMap): boolean {
  const t = map.tileSize;
  const c0 = Math.floor(p.x / t);
  const c1 = Math.floor((p.x + p.w - 1e-6) / t);
  const r0 = Math.floor(p.y / t);
  const r1 = Math.floor((p.y + p.h - 1e-6) / t);
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) if (map.isSolid(c, r)) return true;
  }
  return false;
}

function stepSpecialFlight(p: Projectile, dt: number, map: TileMap, mirror?: ExtraSolid): void {
  const gravity = p.gravity ?? 0;
  const initialVY = p.vy;
  p.vy += gravity * dt;
  let dx = p.vx * dt;
  let dy = (initialVY + (gravity * dt) / 2) * dt;
  while (p.alive) {
    const distance = Math.hypot(dx, dy);
    const range = p.maxDistance - p.traveled;
    const ratio = distance > 0 ? Math.min(1, range / distance) : 1;
    dx *= ratio;
    dy *= ratio;
    const hit = firstFlightHit(
      map,
      p,
      dx,
      dy,
      p.arc !== undefined,
      p.bouncesLeft !== undefined ? mirror : undefined,
    );
    const fraction = hit?.fraction ?? 1;
    p.x += dx * fraction;
    p.y += dy * fraction;
    p.traveled += distance * ratio * fraction;
    if (!hit) {
      if (p.traveled >= p.maxDistance - 1e-9) p.alive = false;
      return;
    }
    if (!p.bouncesLeft) {
      p.alive = false;
      if (hit.ny < 0 && dy > 0) p.arc?.onLand?.(p);
      return;
    }
    p.bouncesLeft -= 1;
    p.x += hit.nx * 1e-6;
    p.y += hit.ny * 1e-6;
    if (hit.nx) p.vx *= -1;
    if (hit.ny) p.vy *= -1;
    dx *= (1 - fraction) * (hit.nx ? -1 : 1);
    dy *= (1 - fraction) * (hit.ny ? -1 : 1);
  }
}

/** Chạm tường hoặc hết tầm thì bước kế tiếp bắt đầu chiều về, dùng sổ trúng riêng. */
function stepBoomerang(
  p: Projectile,
  flight: BoomerangFlight,
  dt: number,
  map: TileMap,
  player: Box,
  onWall: ((p: Projectile) => void) | undefined,
): void {
  if (flight.phase === 'turn') {
    flight.phase = 'return';
    p.hitIds.clear();
  }
  const step = flight.speedPxPerSec * dt;
  if (flight.phase === 'return') {
    const dx = player.x + (player.w - p.w) / 2 - p.x;
    const dy = player.y + (player.h - p.h) / 2 - p.y;
    const distance = Math.hypot(dx, dy);
    const ratio = distance > 0 ? Math.min(1, step / distance) : 0;
    p.vx = (dx * ratio) / dt;
    p.vy = (dy * ratio) / dt;
    p.x += dx * ratio;
    p.y += dy * ratio;
    // Chiều về xuyên nền để đón được lưỡi ngay cả khi Kai đã rẽ qua một góc tường.
    if (overlapsSolid(p, map)) onWall?.(p);
    return;
  }

  const distance = Math.min(step, p.maxDistance - p.traveled);
  const pieces = Math.max(1, Math.ceil(distance / (map.tileSize / 2)));
  const dx = (Math.sign(p.vx) * distance) / pieces;
  for (let i = 0; i < pieces; i += 1) {
    const before = p.x;
    p.x += dx;
    if (overlapsSolid(p, map)) {
      onWall?.(p);
      p.x = before;
      flight.phase = 'turn';
      return;
    }
    p.traveled += Math.abs(dx);
  }
  if (p.traveled >= p.maxDistance - 1e-9) flight.phase = 'turn';
}

/** Quản lý mọi đạn đang bay. Đạn chết không bị xóa ngay mà để lại cho lần dọn sau mỗi bước. */
export class ProjectilePool {
  private nextId = 1;
  private items: Projectile[] = [];

  get all(): readonly Projectile[] {
    return this.items;
  }

  spawn(spec: ProjectileSpec): Projectile {
    const p: Projectile = {
      ...spec,
      id: this.nextId++,
      traveled: 0,
      alive: true,
      hitIds: new Set(),
    };
    this.items.push(p);
    return p;
  }

  /** Số đạn còn sống của một phe, lọc theo loại nếu cần (giới hạn 3 đạn Arc Cannon). */
  count(owner: Projectile['owner'], kinds?: readonly ProjectileKind[]): number {
    return this.items.filter(
      (p) => p.alive && p.owner === owner && (!kinds || kinds.includes(p.kind)),
    ).length;
  }

  /** `onWall` được gọi với viên vừa vỡ vì chạm khối đặc (để vật chắn biết ai bắn vào). */
  update(
    dt: number,
    map: TileMap,
    onWall?: (p: Projectile) => void,
    absorb?: (p: Projectile) => boolean,
    returnTarget?: Box,
    mirror?: ExtraSolid,
  ): void {
    // Sóng sinh khi tảng băng đáp được xét trúng ngay, bắt đầu dịch chuyển ở bước kế.
    for (let i = 0, count = this.items.length; i < count; i += 1) {
      const p = this.items[i]!;
      if (!p.alive || p.boomerang) continue;
      p.ttl -= dt;
      if (p.ttl <= 1e-9) {
        p.alive = false;
        continue;
      }
      if (p.attached) continue;
      if (p.bouncesLeft !== undefined || p.arc) {
        stepSpecialFlight(p, dt, map, mirror);
        if (p.y > map.heightPx || p.x + p.w < 0 || p.x > map.widthPx) p.alive = false;
        continue;
      }
      if (p.gravity) p.vy += p.gravity * dt;
      const dx = p.vx * dt;
      const dy = p.vy * dt;
      // Phòng gương: đạn Kai đi từng đoạn không quá nửa ô để tôn trọng thứ tự tường/gương.
      const pieces =
        absorb && p.owner === 'player'
          ? Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (map.tileSize / 2)))
          : 1;
      const distance = Math.hypot(dx, dy) / pieces;
      for (let i = 0; i < pieces && p.alive; i += 1) {
        p.x += dx / pieces;
        p.y += dy / pieces;
        p.traveled += distance;
        if (p.traveled >= p.maxDistance) p.alive = false;
        else if (overlapsSolid(p, map)) {
          p.alive = false;
          onWall?.(p);
        } else if (absorb?.(p)) p.alive = false;
      }
      if (p.y > map.heightPx || p.x + p.w < 0 || p.x > map.widthPx) p.alive = false;
    }
    if (returnTarget) {
      for (const p of this.items) {
        const flight = p.boomerang;
        if (!p.alive || !flight) continue;
        stepBoomerang(p, flight, dt, map, returnTarget, onWall);
        this.cancelEnemyShots(p, flight);
        if (flight.phase === 'return' && overlaps(p, returnTarget)) p.alive = false;
      }
    }
    this.items = this.items.filter((p) => p.alive);
  }

  private cancelEnemyShots(blade: Projectile, flight: BoomerangFlight): void {
    if (flight.cancelsLeft <= 0) return;
    for (const p of this.items) {
      if (
        !p.alive ||
        p.owner !== 'enemy' ||
        !p.fromRegularEnemy ||
        (p.kind !== 'enemyShot' && p.kind !== 'bomb') ||
        !flight.cancelKinds.includes(p.kind) ||
        !overlaps(p, blade)
      )
        continue;
      p.alive = false;
      flight.cancelsLeft -= 1;
      if (flight.cancelsLeft === 0) return;
    }
  }

  /** Bỏ mọi viên thỏa `match` (vd. đạn boss khi boss đổi pha, QB-31). */
  removeWhere(match: (p: Projectile) => boolean): void {
    this.items = this.items.filter((p) => !match(p));
  }

  clear(owner?: Projectile['owner']): void {
    this.items = owner ? this.items.filter((p) => p.owner !== owner) : [];
  }
}

export function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
