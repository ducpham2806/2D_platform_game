import type { EnemiesData } from '../../core/enemy-config';
import type { ProjectilePool } from '../combat/projectiles';
import { createEnemy } from '../enemy/behaviors';
import { type Enemy, isFlying } from '../enemy/enemy';
import type { PlayerPhysics } from '../player/player-physics';
import { createRng, type Rng } from '../rng';
import type { TileMap } from '../tilemap';
import { PickupPool } from './pickups';
import type { WorldEvents } from './world-types';

/** Ký hiệu trên bản đồ → kẻ địch (cùng dạng với StageDef.enemyMarkers). */
export type EnemyMarkers = Readonly<Record<string, { enemy: string; harmless?: boolean }>>;

/**
 * Các vị trí đặt kẻ địch quá gần điểm xuất phát hoặc checkpoint ('P', 'C'), trái quy tắc
 * "khoảng cách xuất hiện ≥ 6 ô" (đặc tả mục 4). Dùng trong test cho mọi màn.
 */
export function spawnDistanceViolations(
  map: TileMap,
  markers: EnemyMarkers,
  minTiles: number,
): string[] {
  const safe = map.markers.filter((m) => m.ch === 'P' || m.ch === 'C');
  const out: string[] = [];
  for (const m of map.markers) {
    if (!markers[m.ch]) continue;
    for (const s of safe) {
      const d = Math.hypot(m.col - s.col, m.row - s.row);
      if (d < minTiles) out.push(`${m.ch} (${m.col},${m.row}) cách ${s.ch} ${d.toFixed(1)} ô`);
    }
  }
  return out;
}

/**
 * Kẻ địch thường của một màn (M5): tạo từ ký hiệu trên bản đồ, chỉ hoạt động khi người chơi
 * trong tầm, rơi Core Bit/viên máu khi bị hạ, cộng EXP, dựng lại khi người chơi hồi sinh.
 */
export class EnemyField {
  readonly enemies: Enemy[] = [];
  readonly pickups: PickupPool;
  /** Cộng dồn trong lượt chơi màn (M8/M9 sẽ đưa vào cấp và ví). */
  exp = 0;
  coreBits = 0;
  private readonly rng: Rng;

  constructor(
    private readonly data: EnemiesData,
    private readonly map: TileMap,
    markers: EnemyMarkers,
    hpMul: number,
    nextId: () => number,
    seed: number,
  ) {
    const t = map.tileSize;
    this.rng = createRng(seed);
    this.pickups = new PickupPool(data.rules.pickups, t);
    for (const m of map.markers) {
      const place = markers[m.ch];
      if (!place) continue;
      const enemy = data.enemies[place.enemy];
      if (!enemy)
        throw new Error(`Bản đồ đặt kẻ địch "${place.enemy}" không có trong enemies.json`);
      const x = (m.col + 0.5) * t;
      const y = isFlying(enemy) ? (m.row + 0.5) * t : (m.row + 1) * t;
      this.enemies.push(createEnemy(nextId(), enemy, x, y, hpMul, place.harmless ?? false, t));
    }
  }

  /** Kẻ địch còn sống và đang trong tầm hoạt động của người chơi. */
  isActive(e: Enemy, player: PlayerPhysics): boolean {
    const range = this.data.rules.activeRangeTiles * this.map.tileSize;
    return e.alive && Math.abs(e.centerX - player.centerX) <= range;
  }

  active(player: PlayerPhysics): Enemy[] {
    return this.enemies.filter((e) => this.isActive(e, player));
  }

  step(player: PlayerPhysics, pool: ProjectilePool, dt: number): void {
    const ctx = {
      playerX: player.centerX,
      playerY: player.box.y + player.box.h / 2,
      pool,
      map: this.map,
    };
    for (const e of this.enemies) {
      if (this.isActive(e, player)) e.step(ctx, dt);
      else e.flash = 0;
    }
  }

  /** Kẻ địch vừa bị hạ: cộng EXP, rơi đồ. */
  onKilled(killed: readonly Enemy[], player: PlayerPhysics): void {
    for (const e of killed) {
      this.exp += e.data.exp;
      this.pickups.drop(e.centerX, e.centerY, e.data.coreBit, player.hp < player.maxHp, this.rng);
    }
  }

  /** Vật phẩm rơi, người chơi nhặt: Core Bit vào túi, viên máu hồi máu (không quá tối đa). */
  updatePickups(player: PlayerPhysics, dt: number, ev: WorldEvents): void {
    this.pickups.update(dt, this.map);
    if (player.state === 'dead') return;
    const got = this.pickups.collect(player.box);
    if (got.coreBit > 0) {
      this.coreBits += got.coreBit;
      ev.coreBitGained = got.coreBit;
    }
    if (got.heal > 0) {
      const before = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + got.heal);
      ev.healed = player.hp - before;
    }
  }

  /** Người chơi hồi sinh ở checkpoint: mọi kẻ địch dựng lại, vật phẩm chưa nhặt mất đi. */
  reset(): void {
    for (const e of this.enemies) e.reset();
    this.pickups.clear();
  }
}
