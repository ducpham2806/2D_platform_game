import type { TileMap } from '../tilemap';

export type ProjectileKind =
  'shot' | 'mid' | 'charged' | 'sweep' | 'enemyShot' | 'shockwave' | 'drop' | 'bomb';

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
  traveled: number;
  maxDistance: number;
  ttl: number;
  /** Gắn theo người chơi (roi): thế giới tự đặt lại vị trí mỗi bước. */
  attached: boolean;
  /** Trọng lực (px/s²) cho đạn rơi như hạt nổ của Bướm Sắt; không có thì bay thẳng. */
  gravity?: number;
  alive: boolean;
  /** Đã trúng mục tiêu nào (mỗi viên chỉ trúng một mục tiêu một lần). */
  hitIds: Set<number>;
}

export type ProjectileSpec = Omit<Projectile, 'id' | 'traveled' | 'alive' | 'hitIds'>;

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

  update(dt: number, map: TileMap): void {
    for (const p of this.items) {
      if (!p.alive) continue;
      p.ttl -= dt;
      if (p.ttl <= 1e-9) {
        p.alive = false;
        continue;
      }
      if (p.attached) continue;
      if (p.gravity) p.vy += p.gravity * dt;
      const dx = p.vx * dt;
      const dy = p.vy * dt;
      p.x += dx;
      p.y += dy;
      p.traveled += Math.hypot(dx, dy);
      if (p.traveled >= p.maxDistance || overlapsSolid(p, map)) p.alive = false;
      if (p.y > map.heightPx || p.x + p.w < 0 || p.x > map.widthPx) p.alive = false;
    }
    this.items = this.items.filter((p) => p.alive);
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
