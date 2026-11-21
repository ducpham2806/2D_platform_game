import type { TileMap } from '../tilemap';

export type ProjectileKind =
  | 'shot'
  | 'mid'
  | 'charged'
  | 'sweep'
  | 'enemyShot'
  | 'shockwave'
  | 'drop'
  | 'bomb'
  | 'lash'
  | 'root'
  | 'seed';

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
   * Nguồn đòn của đạn địch cho đo lường (`enemy:<id kẻ địch>`); không có thì là đòn boss, tính
   * theo loại đạn (`boss:<kind>`). GDD 13 mục 3, `death.cause`.
   */
  source?: string;
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
  ): void {
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
    this.items = this.items.filter((p) => p.alive);
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
