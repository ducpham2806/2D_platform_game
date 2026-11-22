import type { EnemiesData } from '../../core/enemy-config';
import type { ProjectilePool } from '../combat/projectiles';
import { createEnemy } from '../enemy/behaviors';
import { type Enemy, isFlying } from '../enemy/enemy';
import type { PlayerPhysics } from '../player/player-physics';
import { createRng, type Rng } from '../rng';
import type { EnemySpawn } from '../stage/layout';
import type { TileMap } from '../tilemap';
import { enemyReward, NO_STAGE_REWARD, type StageReward } from '../stage/stage-exp';
import { PickupPool } from './pickups';
import type { WorldEvents } from './world-types';

/** Ký hiệu trên bản đồ ASCII → kẻ địch (giữ tên cũ cho các màn dựng sẵn). */
export type { EnemyMarkers } from '../stage/layout';

/**
 * Kẻ địch thường của một màn (M5): tạo từ danh sách đặt sẵn của bố cục màn (cùng thứ tự), chỉ hoạt động khi người chơi
 * trong tầm, rơi Core Bit/viên máu khi bị hạ, cộng EXP, dựng lại khi người chơi hồi sinh.
 */
export class EnemyField {
  readonly enemies: Enemy[] = [];
  readonly pickups: PickupPool;
  /** Cộng dồn trong lượt chơi màn (M8/M9 sẽ đưa vào cấp và ví). */
  exp = 0;
  coreBits = 0;
  private readonly rng: Rng;
  /** Kẻ địch (theo id) đã cho EXP, Core Bit trong lượt vào màn này. */
  private readonly rewarded = new Set<number>();

  constructor(
    private readonly data: EnemiesData,
    private readonly map: TileMap,
    spawns: readonly EnemySpawn[],
    hpMul: number,
    nextId: () => number,
    seed: number,
    /** Hệ số thưởng của độ khó (EXP, Core Bit mỗi kẻ địch, làm tròn; GDD 11 mục 3.1). */
    private readonly rewardMul = 1,
    /** EXP, Core Bit chỉ nhận một lần cho mỗi kẻ địch trong lượt (stages.json → mechanics). */
    private readonly rewardOnce = false,
    /**
     * Hệ số thưởng theo màn (`stages.json → enemyRewardMul`, GDD 16 mục 2.1). Mini-boss của màn
     * (`exempt`) không nhân: thưởng ghi thẳng trong dữ liệu.
     */
    private readonly stage: StageReward = NO_STAGE_REWARD,
  ) {
    const t = map.tileSize;
    this.rng = createRng(seed);
    this.pickups = new PickupPool(data.rules.pickups, t);
    for (const s of spawns) {
      const enemy = data.enemies[s.enemy];
      if (!enemy) throw new Error(`Bản đồ đặt kẻ địch "${s.enemy}" không có trong enemies.json`);
      const x = (s.col + 0.5) * t;
      const y = isFlying(enemy) ? (s.row + 0.5) * t : (s.row + 1) * t;
      this.enemies.push(createEnemy(nextId(), enemy, x, y, hpMul, s.harmless, t));
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
    for (const e of this.enemies) e.step(ctx, dt, this.isActive(e, player));
  }

  /**
   * Kẻ địch vừa bị hạ: cộng EXP, rơi đồ. Kẻ địch đã cho thưởng trong lượt này (dựng lại sau khi
   * Kai chết) thì chỉ rơi viên máu, để không cày được bằng cách chết.
   */
  onKilled(killed: readonly Enemy[], player: PlayerPhysics): void {
    for (const e of killed) {
      const paid = this.rewardOnce && this.rewarded.has(e.id);
      if (!paid) {
        this.rewarded.add(e.id);
        this.exp += enemyReward(e.data.exp, this.mulFor(e).exp, this.rewardMul);
      }
      const coreBit = paid
        ? 0
        : enemyReward(e.data.coreBit, this.mulFor(e).coreBit, this.rewardMul);
      this.pickups.drop(e.centerX, e.centerY, coreBit, player.hp < player.maxHp, this.rng);
    }
  }

  /** Vật phẩm rơi, người chơi nhặt: Core Bit vào túi, viên máu hồi máu (không quá tối đa). */
  /** `magnetPx`: tầm hút Core Bit tính từ thân Kai (Upgrade Magnet Range); 0 = không hút. */
  updatePickups(player: PlayerPhysics, dt: number, ev: WorldEvents, magnetPx = 0): void {
    if (player.state !== 'dead') this.pickups.attract(player.box, magnetPx, dt);
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

  private mulFor(e: Enemy): { exp: number; coreBit: number } {
    return this.stage.exempt.includes(e.data.id) ? { exp: 1, coreBit: 1 } : this.stage.mul;
  }

  /**
   * Người chơi hồi sinh ở checkpoint: kẻ địch dựng lại, vật phẩm chưa nhặt mất đi. `stayDown`: kẻ
   * địch đã hạ không dựng lại (của phòng khóa đã xong, kể cả mini-boss; QB-24).
   */
  reset(stayDown?: ReadonlySet<Enemy>): void {
    for (const e of this.enemies) if (e.alive || !stayDown?.has(e)) e.reset();
    this.pickups.clear();
  }
}
