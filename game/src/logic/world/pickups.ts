import type { PickupRules } from '../../core/enemy-config';
import { overlaps } from '../combat/projectiles';
import type { Box } from '../player/collision';
import type { Rng } from '../rng';
import type { TileMap } from '../tilemap';

/** Vật phẩm rơi khi hạ kẻ địch: Core Bit (phải nhặt) và viên hồi máu (đặc tả mục 4). */
export interface Pickup {
  id: number;
  kind: 'coreBit' | 'heal';
  /** Số Core Bit, hoặc số máu hồi. */
  value: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  /** Giây còn lại trước khi biến mất. */
  ttl: number;
}

/** Tốc độ bung ra khi rơi, ô/s. */
const POP_UP = 6;
const POP_SIDE = 1.5;

export class PickupPool {
  private nextId = 1;
  private items: Pickup[] = [];

  constructor(
    private readonly rules: PickupRules,
    private readonly tileSize: number,
  ) {}

  get all(): readonly Pickup[] {
    return this.items;
  }

  clear(): void {
    this.items = [];
  }

  /**
   * Rơi đồ tại (x, y): Core Bit chia thành tối đa maxCoreBitPickups viên bung ra hai bên;
   * viên hồi máu theo xác suất healChance, chỉ khi người chơi chưa đầy máu.
   */
  drop(x: number, y: number, coreBit: number, playerHurt: boolean, rng: Rng): void {
    const r = this.rules;
    const t = this.tileSize;
    const n = Math.min(r.maxCoreBitPickups, Math.floor(coreBit));
    for (let i = 0; i < n; i += 1) {
      // Chia đều, phần dư dồn vào các viên đầu.
      const value = Math.floor(coreBit / n) + (i < coreBit % n ? 1 : 0);
      this.spawn('coreBit', value, x, y, (i - (n - 1) / 2) * POP_SIDE * t, r.coreBitLifetimeSec);
    }
    if (playerHurt && rng() < r.healChance) {
      this.spawn('heal', r.heal, x, y, 0, r.healLifetimeSec);
    }
  }

  private spawn(
    kind: Pickup['kind'],
    value: number,
    x: number,
    y: number,
    vx: number,
    ttl: number,
  ): void {
    const { w, h } = this.rules.sizePx;
    this.items.push({
      id: this.nextId++,
      kind,
      value,
      x: x - w / 2,
      y: y - h / 2,
      w,
      h,
      vx,
      vy: -POP_UP * this.tileSize,
      ttl,
    });
  }

  /** Rơi theo trọng lực, dừng trên sàn đặc hoặc bục một chiều, không xuyên tường. */
  update(dt: number, map: TileMap): void {
    const t = this.tileSize;
    const g = this.rules.gravityTilesPerSec2 * t;
    for (const p of this.items) {
      p.ttl -= dt;
      p.vy += g * dt;
      const nextX = p.x + p.vx * dt;
      const col = Math.floor((p.vx > 0 ? nextX + p.w - 1e-6 : nextX) / t);
      if (map.isSolid(col, Math.floor((p.y + p.h / 2) / t))) p.vx = 0;
      else p.x = nextX;
      const bottom = p.y + p.h;
      const nextBottom = bottom + p.vy * dt;
      const row = Math.floor(nextBottom / t);
      const c = Math.floor((p.x + p.w / 2) / t);
      const lands =
        p.vy > 0 &&
        Math.floor((bottom - 1e-6) / t) < row &&
        (map.isSolid(c, row) || map.isOneWay(c, row));
      if (lands) {
        p.y = row * t - p.h;
        p.vy = 0;
        p.vx = 0;
      } else {
        p.y = nextBottom - p.h;
      }
    }
    this.items = this.items.filter((p) => p.ttl > 1e-9 && p.y < map.heightPx);
  }

  /** Nhặt mọi vật phẩm chạm hộp người chơi; trả về tổng Core Bit và máu hồi. */
  collect(box: Box): { coreBit: number; heal: number } {
    const got = { coreBit: 0, heal: 0 };
    this.items = this.items.filter((p) => {
      if (!overlaps(p, box)) return true;
      if (p.kind === 'coreBit') got.coreBit += p.value;
      else got.heal += p.value;
      return false;
    });
    return got;
  }
}
