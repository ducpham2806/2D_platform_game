import type { EnemiesData } from '../../core/enemy-config';
import type { ExtraSolid } from '../combat/flight';
import type { WeaponLoadout } from '../combat/loadout';
import type { ProjectilePool } from '../combat/projectiles';
import { enemyInRange, enemyOnScreen } from '../enemy/attack-range';
import { createEnemy } from '../enemy/behaviors';
import { type Enemy, isFlying } from '../enemy/enemy';
import { type Box, groundBelow, moveY } from '../player/collision';
import type { PlayerPhysics } from '../player/player-physics';
import { createRng, type Rng } from '../rng';
import type { EnemySpawn } from '../stage/layout';
import type { TileMap } from '../tilemap';
import { enemyReward, NO_STAGE_REWARD, type StageReward } from '../stage/stage-exp';
import { PickupPool } from './pickups';
import { standsOn } from './platforms';
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
  private readonly energyRng: Rng;
  /** Kẻ địch (theo id) đã cho EXP, Core Bit trong lượt vào màn này. */
  private readonly rewarded = new Set<number>();
  private readonly fallSpeeds = new Map<Enemy, number>();

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
    private readonly fallRules?: { gravity: number; maxSpeed: number },
  ) {
    const t = map.tileSize;
    this.rng = createRng(seed);
    // Mở vũ khí không làm lệch chuỗi rơi viên máu của cùng một seed.
    this.energyRng = createRng(seed ^ 0x9e3779b9);
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
    return e.alive && this.inRange(e.box, player.centerX, player.box.y + player.box.h / 2);
  }

  private inRange(box: Box, x: number, y: number): boolean {
    return enemyInRange(this.data.rules, this.map.tileSize, box, x, y);
  }

  active(player: PlayerPhysics): Enemy[] {
    return this.enemies.filter((e) => this.isActive(e, player));
  }

  /** Chỉ địch đất mất mặt đỡ của bục vừa vỡ mới bắt đầu rơi. */
  dropFrom(surface: Box): void {
    if (!this.fallRules) return;
    for (const e of this.enemies) {
      if (e.alive && !isFlying(e.data) && standsOn(e.box, surface) && !groundBelow(e.box, this.map))
        this.fallSpeeds.set(e, 0);
    }
  }

  step(
    player: PlayerPhysics,
    pool: ProjectilePool,
    dt: number,
    mirror?: ExtraSolid,
    view?: Box,
  ): boolean {
    const x = player.centerX;
    const y = player.box.y + player.box.h / 2;
    const ctx = {
      playerX: x,
      playerY: y,
      pool,
      map: this.map,
      ...(mirror ? { mirror } : {}),
      attackAllowed: (box: Box): boolean =>
        this.inRange(box, x, y) && enemyOnScreen(this.data.rules, this.map.tileSize, box, view),
    };
    let fellOut = false;
    for (const e of this.enemies) {
      const vy = this.fallSpeeds.get(e);
      if (vy === undefined) e.step(ctx, dt, this.isActive(e, player));
      else {
        e.step(ctx, dt, false);
        if (this.fall(e, vy, dt)) fellOut = true;
      }
    }
    return fellOut;
  }

  private fall(e: Enemy, vy: number, dt: number): boolean {
    const rules = this.fallRules!;
    const next = Math.min(vy + rules.gravity * dt, rules.maxSpeed);
    if (!e.alive || moveY(e.box, ((vy + next) * dt) / 2, this.map, false)) {
      this.fallSpeeds.delete(e);
    } else if (e.box.y > this.map.heightPx) {
      this.fallSpeeds.delete(e);
      e.hp = 0;
      this.awardExp(e);
      return true;
    } else this.fallSpeeds.set(e, next);
    return false;
  }

  /**
   * Kẻ địch vừa bị hạ: cộng EXP, rơi đồ. Kẻ địch đã cho thưởng trong lượt này (dựng lại sau khi
   * Kai chết) thì chỉ rơi viên máu, để không cày được bằng cách chết.
   */
  onKilled(killed: readonly Enemy[], player: PlayerPhysics, loadout?: WeaponLoadout): void {
    for (const e of killed) {
      const firstReward = this.awardExp(e);
      const coreBit = firstReward
        ? enemyReward(e.data.coreBit, this.mulFor(e).coreBit, this.rewardMul)
        : 0;
      this.dropRewards(e.centerX, e.centerY, coreBit, player, firstReward ? loadout : undefined);
    }
  }

  rewardRoomBoss(
    x: number,
    y: number,
    exp: number,
    coreBit: number,
    player: PlayerPhysics,
    loadout: WeaponLoadout,
  ): void {
    this.exp += enemyReward(exp, 1, this.rewardMul);
    this.dropRewards(x, y, enemyReward(coreBit, 1, this.rewardMul), player, loadout);
  }

  private dropRewards(
    x: number,
    y: number,
    coreBit: number,
    player: PlayerPhysics,
    loadout?: WeaponLoadout,
  ): void {
    this.pickups.drop(x, y, coreBit, player.hp < player.maxHp, this.rng);
    if (loadout?.hasEnergyDeficit) this.pickups.dropEnergy(x, y, this.energyRng);
  }

  private awardExp(e: Enemy): boolean {
    if (this.rewardOnce && this.rewarded.has(e.id)) return false;
    this.rewarded.add(e.id);
    this.exp += enemyReward(e.data.exp, this.mulFor(e).exp, this.rewardMul);
    return true;
  }

  /** Vật phẩm rơi, người chơi nhặt: Core Bit vào túi, viên máu hồi máu (không quá tối đa). */
  /** `magnetPx`: tầm hút Core Bit tính từ thân Kai (Upgrade Magnet Range); 0 = không hút. */
  updatePickups(
    player: PlayerPhysics,
    dt: number,
    ev: WorldEvents,
    magnetPx = 0,
    loadout?: WeaponLoadout,
  ): void {
    if (player.state !== 'dead') this.pickups.attract(player.box, magnetPx, dt);
    this.pickups.update(dt, this.map);
    if (player.state === 'dead') return;
    const got = this.pickups.collect(
      player.box,
      loadout && ((amount) => loadout.restoreEnergy(amount)),
    );
    ev.energyGained = got.energy;
    if (got.coreBit > 0) {
      this.coreBits += got.coreBit;
      ev.coreBitGained = got.coreBit;
    }
    if (got.heal > 0) {
      const before = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + got.heal);
      ev.healed += player.hp - before;
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
    this.fallSpeeds.clear();
    for (const e of this.enemies) if (e.alive || !stayDown?.has(e)) e.reset();
    this.pickups.clear();
  }
}
