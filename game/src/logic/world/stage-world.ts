import type { BossData } from '../../core/boss-config';
import type { EnemiesData } from '../../core/enemy-config';
import type { DifficultyData } from '../../core/game-config';
import type { PlayerData } from '../../core/player-config';
import type { StageMechanics } from '../../core/stage-mechanics-config';
import type { WeaponsData } from '../../core/weapons-config';
import { Boss } from '../boss/boss';
import { WeaponLoadout } from '../combat/loadout';
import { ProjectilePool } from '../combat/projectiles';
import { TrainingTarget } from '../combat/targets';
import type { Enemy } from '../enemy/enemy';
import { levelStats } from '../rpg/progression';
import { playerParams } from '../player/player-params';
import { PlayerPhysics } from '../player/player-physics';
import { createRng, type Rng } from '../rng';
import { type EnemyMarkers, layoutFromRows, type StageLayout } from '../stage/layout';
import { Tile, type TileMap } from '../tilemap';
import { EnemyField } from './enemy-field';
import { resolveEnemyHits, resolvePlayerHits } from './hits';
import { Barrier, LockedRoom, makeSecret, type Secret, standPoint, Vine } from './stage-mechanics';
import { noWorldEvents, type WorldEvents, type WorldInput, type WorldPhase } from './world-types';

export interface WorldSetup {
  /** Bố cục màn (bản đồ Tiled hoặc ASCII đã dựng). Không có thì dựng từ `rows`. */
  layout?: StageLayout;
  /** Bản đồ ASCII (màn xám, phòng thử, test). */
  rows?: readonly string[];
  tileSize: number;
  stepSec: number;
  player: PlayerData;
  weapons: WeaponsData;
  boss: BossData;
  difficulty: DifficultyData;
  seed: number;
  /** Kẻ địch thường (M5): dữ liệu và ký hiệu đặt trên bản đồ. Không có thì màn không có kẻ địch. */
  enemies?: EnemiesData;
  enemyMarkers?: EnemyMarkers;
  /** Cơ chế màn (M7): hồi sinh, hố, gai, dây leo (stages.json → mechanics). */
  mechanics: StageMechanics;
  /** Module Spike Guard: miễn nhiễm gai (M8 sẽ bật theo loadout). */
  spikeGuard?: boolean;
  /** Vào màn từ checkpoint đã lưu (số thứ tự từ 1; 0 hoặc không có = điểm xuất phát). */
  startCheckpoint?: number;
  /** Từ bản lưu (M11): vũ khí boss đã nhận, có ngay khi vào màn. */
  ownedWeapons?: readonly string[];
  /** Từ bản lưu (M11): vật phẩm bí mật đã nhặt (theo `item`), không hiện lại. */
  takenSecrets?: readonly string[];
  /** Từ bản lưu (M11): boss của màn đã hạ, thắng lại không nhận thưởng lần đầu nữa. */
  bossDefeated?: boolean;
  /** Cấp hiệu dụng (M8, đã đồng bộ cấp theo màn) quyết định máu và công; không có thì cấp 1. */
  level?: number;
}

/** Bia tập bắn: máu (phát Arc Cannon) và thời gian dựng lại. Chỉ dùng trong màn xám. */
const TARGET_HP = 3;
const TARGET_RESPAWN_SEC = 2;
const TARGET_SIZE = { w: 12, h: 24 };
/** Hộp người chơi thu nhỏ mỗi phía khi xét chạm gai, để chạm sượt mép ô không tính. */
const HAZARD_INSET_PX = 2;

/**
 * Thế giới màn chơi (logic thuần): Kai, vũ khí, đạn, bia tập bắn, boss, cửa phòng boss,
 * hồi sinh và hit-stop. Scene chỉ đọc trạng thái để vẽ; test có thể mô phỏng cả trận.
 */
export class StageWorld {
  readonly map: TileMap;
  readonly player: PlayerPhysics;
  readonly loadout: WeaponLoadout;
  readonly pool = new ProjectilePool();
  readonly targets: TrainingTarget[] = [];
  boss: Boss | undefined;
  phase: WorldPhase = 'explore';
  deaths = 0;
  /** Cột ô của cửa và của đấu trường (bên trong hai tường). */
  readonly gateCol: number | undefined;
  readonly arena: { first: number; last: number } | undefined;
  /** Đang dừng hình (hit-stop), tính bằng số bước còn lại. */
  hitStop = 0;
  /** Kẻ địch thường, vật phẩm rơi, EXP và Core Bit của lượt chơi. */
  readonly field: EnemyField | undefined;
  /** Cơ chế màn (M7). */
  readonly layout: StageLayout;
  readonly vines: Vine[];
  readonly rooms: LockedRoom[];
  readonly barriers: Barrier[];
  readonly secrets: Secret[];
  /** Vật phẩm bí mật đã nhặt trong lượt chơi (StageSave ghi vào bản lưu). */
  readonly collected: string[] = [];
  /** Checkpoint đã chạm xa nhất (0 = điểm xuất phát). */
  checkpointIndex = 0;
  /** Số lần rơi hố còn sống (không tính vào `deaths`). */
  falls = 0;
  /** Thời gian của lượt chơi màn (giây, tính cả lúc hit-stop và chờ hồi sinh; màn Kết quả). */
  elapsedSec = 0;

  private readonly rng: Rng;
  private attackMul: number;
  /** Cấp hiệu dụng đang dùng để tính máu và công. */
  level: number;
  private readonly start: { x: number; y: number };
  private checkpoint: { x: number; y: number };
  private respawnTimer = 0;
  /** Hồi sinh đang chờ là do rơi hố còn máu (giữ máu, không dựng lại kẻ địch). */
  private pitReturn = false;
  /** Chỗ đứng an toàn gần nhất (tâm, đáy) để đưa về khi chạm gai. */
  private safe: { x: number; y: number };
  private everWon = false;
  /** EXP và Core Bit thưởng khi thắng boss lần đầu (cộng thêm vào của kẻ địch thường). */
  private bossExp = 0;
  private bossCoreBits = 0;
  /** Các dòng ô của cửa phòng boss (ô 'D'). */
  readonly gateRows: number[];
  private readonly bossSpawn: { x: number; y: number } | undefined;

  constructor(private setup: WorldSetup) {
    const t = setup.tileSize;
    if (!setup.layout && !setup.rows) throw new Error('StageWorld cần layout hoặc rows');
    this.layout = setup.layout ?? layoutFromRows(setup.rows ?? [], t, setup.enemyMarkers);
    this.map = this.layout.map;
    this.rng = createRng(setup.seed);
    this.start = standPoint(this.layout.spawn, t);
    const cps = this.layout.checkpoints;
    this.checkpointIndex = Math.max(0, Math.min(cps.length, setup.startCheckpoint ?? 0));
    this.checkpoint = this.checkpointPoint();
    this.safe = this.checkpoint;
    // Sát thương gốc tính ở cấp 1, nên hệ số công = công hiện tại / công cấp 1.
    this.level = setup.level ?? 1;
    const { maxHp, attackMul } = levelStats(this.level, setup.player.level);
    this.attackMul = attackMul;
    this.player = new PlayerPhysics(
      playerParams(setup.player, t, setup.stepSec),
      this.map,
      this.checkpoint.x,
      this.checkpoint.y,
      maxHp,
    );
    this.loadout = new WeaponLoadout(setup.weapons, t);
    for (const w of setup.ownedWeapons ?? []) this.loadout.grant(w);
    this.everWon = setup.bossDefeated ?? false;

    let nextId = 1;
    const layout = this.layout;
    this.gateRows = layout.gate?.rows ?? [];
    this.gateCol = layout.gate?.col;
    this.arena =
      this.gateCol === undefined ? undefined : { first: this.gateCol + 1, last: this.map.cols - 2 };
    for (const m of layout.targets) {
      const box = {
        x: (m.col + 0.5) * t - TARGET_SIZE.w / 2,
        y: (m.row + 1) * t - TARGET_SIZE.h,
        ...TARGET_SIZE,
      };
      this.targets.push(
        new TrainingTarget(nextId++, box, TARGET_HP, m.shield ? -1 : 0, TARGET_RESPAWN_SEC),
      );
    }
    this.field = setup.enemies
      ? new EnemyField(
          setup.enemies,
          this.map,
          layout.enemies,
          setup.difficulty.enemyHp,
          () => nextId++,
          setup.seed + 1,
        )
      : undefined;
    this.bossSpawn = layout.boss ? standPoint(layout.boss, t) : undefined;
    this.boss = this.makeBoss();

    this.vines = layout.vines.map((v) => new Vine(v, setup.mechanics.vine, t));
    this.player.platforms = this.vines.map((v) => v.platform);
    this.rooms = layout.rooms.map((r) => new LockedRoom(r, this.map));
    if (this.field) for (const r of this.rooms) r.bind(this.field.enemies, layout.enemies);
    this.barriers = layout.barriers.map((b) => new Barrier(b, this.map));
    const taken = new Set(setup.takenSecrets ?? []);
    this.secrets = layout.secrets.map((s) => {
      const secret = makeSecret(s, t);
      secret.taken = taken.has(s.item);
      return secret;
    });
  }

  /** Phòng khóa đang đóng cửa (camera khóa trong phòng, HUD đếm kẻ địch còn lại). */
  get lockedRoom(): LockedRoom | undefined {
    return this.rooms.find((r) => r.state === 'locked');
  }

  /** Điểm hồi sinh của checkpoint đã chạm xa nhất. */
  private checkpointPoint(): { x: number; y: number } {
    const cp = this.layout.checkpoints[this.checkpointIndex - 1];
    return cp ? standPoint(cp, this.setup.tileSize) : this.start;
  }

  /** Dữ liệu đang dùng (bảng chỉnh cảm giác đọc để hiện giá trị hiện tại). */
  get tuning(): Pick<WorldSetup, 'player' | 'weapons' | 'boss'> {
    return { player: this.setup.player, weapons: this.setup.weapons, boss: this.setup.boss };
  }

  /**
   * Đổi thông số khi đang chơi (bảng chỉnh cảm giác ở cổng Prototype). Vật lý Kai và vũ khí
   * đổi ngay; boss mới tạo (đấu lại, hồi sinh) dùng dữ liệu boss mới.
   */
  retune(patch: Partial<Pick<WorldSetup, 'player' | 'weapons' | 'boss'>>): void {
    this.setup = { ...this.setup, ...patch };
    if (patch.player) {
      this.player.setParams(playerParams(patch.player, this.setup.tileSize, this.setup.stepSec));
    }
    if (patch.weapons) this.loadout.setData(patch.weapons);
  }

  /** Lên cấp giữa màn (M8): máu tối đa và công theo cấp hiệu dụng mới, máu cộng phần chênh. */
  setLevel(level: number): void {
    if (level === this.level) return;
    const stats = levelStats(level, this.setup.player.level);
    this.level = level;
    this.attackMul = stats.attackMul;
    this.player.setMaxHp(stats.maxHp);
  }

  get enemies(): readonly Enemy[] {
    return this.field?.enemies ?? [];
  }

  get respawning(): boolean {
    return this.respawnTimer > 0;
  }

  step(input: WorldInput): WorldEvents {
    const ev = noWorldEvents();
    const dt = this.setup.stepSec;
    this.elapsedSec += dt;
    if (this.hitStop > 0) {
      this.hitStop -= 1;
      return ev;
    }
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 1e-9) this.respawn(ev);
      return ev;
    }

    for (const v of this.vines) v.step(dt);

    if (input.swapPrev || input.swapNext) {
      const before = this.loadout.index;
      this.loadout.swap(input.swapNext ? 1 : -1);
      ev.swapped = this.loadout.index !== before;
    }

    const pl = this.player;
    const pe = pl.step(
      {
        moveX: input.moveX,
        jumpPressed: input.jumpPressed,
        jumpHeld: input.jumpHeld,
        dashPressed: input.dashPressed,
        downHeld: input.downHeld,
      },
      dt,
    );
    this.attachSweeps();

    const canShoot = pl.state !== 'dead' && pl.state !== 'hurt';
    const fire = this.loadout.step(
      {
        pressed: canShoot && input.shootPressed,
        held: canShoot && input.shootHeld,
        released: canShoot && input.shootReleased,
        autoFire: input.autoFire,
      },
      {
        centerX: pl.centerX,
        top: pl.box.y,
        facing: pl.facing,
        hurt: pe.hurt,
        aimTargets: input.aimAssist ? this.aimTargets() : undefined,
      },
      this.pool,
      dt,
    );
    ev.fired = fire.fired;
    ev.emptyWeapon = fire.empty;

    for (const target of this.targets) target.step(dt);
    if (this.boss) {
      const be = this.boss.step(
        { playerX: pl.centerX, playerY: pl.box.y + pl.box.h / 2 },
        this.pool,
        dt,
      );
      ev.bossPhaseChanged = be.phaseChanged;
      ev.bossLanded = be.landed;
      if (be.defeated) this.onBossDefeated(ev);
    }
    this.field?.step(pl, this.pool, dt);
    this.pool.update(dt, this.map, (p) => {
      for (const b of this.barriers) if (b.tryBreak(p)) ev.barrierBroken = true;
    });

    const killed: Enemy[] = [];
    this.hitStop = resolvePlayerHits(
      this.pool,
      { targets: this.targets, enemies: this.enemies, boss: this.boss },
      this.setup.weapons,
      this.attackMul,
      ev,
      killed,
    );
    this.field?.onKilled(killed, pl);
    resolveEnemyHits(
      this.pool,
      this.field?.active(pl) ?? [],
      this.phase === 'boss' ? this.boss : undefined,
      pl,
      this.setup.difficulty.damageTaken,
      ev,
    );
    this.field?.updatePickups(pl, dt, ev);

    this.updateHazards(ev);
    this.updateSecrets(ev);
    this.updateRooms(ev);
    this.updateCheckpoints(ev);
    this.updateArena(ev);
    const mech = this.setup.mechanics;
    if (pl.state !== 'dead' && pe.fellOut) {
      // Rơi hố: mất máu rồi về checkpoint; hết máu thì tính là chết (đặc tả Stage 1 mục 3).
      pl.hp = Math.max(0, pl.hp - this.damageTaken(mech.pit.damage));
      if (pl.hp > 0) {
        ev.fellInPit = true;
        this.falls += 1;
        this.pitReturn = true;
        this.respawnTimer = mech.pit.returnSec;
        return ev;
      }
      pl.state = 'dead';
    }
    if (pe.died || pl.state === 'dead') {
      ev.playerDied = true;
      this.deaths += 1;
      this.pitReturn = false;
      this.respawnTimer = mech.respawnSec;
    }
    return ev;
  }

  /** Sát thương môi trường nhân hệ số độ khó, làm tròn, tối thiểu 1 (như đòn kẻ địch). */
  private damageTaken(base: number): number {
    if (base <= 0) return 0;
    return Math.max(1, Math.round(base * this.setup.difficulty.damageTaken));
  }

  /** Gai: mất máu, về chỗ đứng an toàn. Ghi lại chỗ an toàn khi đứng vững trên nền thật. */
  private updateHazards(ev: WorldEvents): void {
    const pl = this.player;
    if (pl.state === 'dead') return;
    const b = pl.box;
    const inset = {
      x: b.x + HAZARD_INSET_PX,
      y: b.y + HAZARD_INSET_PX,
      w: b.w - 2 * HAZARD_INSET_PX,
      h: b.h - 2 * HAZARD_INSET_PX,
    };
    if (!this.setup.spikeGuard && this.map.overlapsHazard(inset)) {
      ev.spikeHit = true;
      const dmg = this.damageTaken(this.setup.mechanics.spikes.damage);
      if (pl.hitHazard(dmg, this.safe.x, this.safe.y)) ev.playerHurt = true;
      return;
    }
    if (!pl.grounded || pl.onPlatform || pl.state === 'hurt' || this.map.overlapsHazard(b)) return;
    const t = this.map.tileSize;
    const row = Math.floor((pl.bottom + 0.5) / t);
    const firm = (x: number): boolean => {
      const tile = this.map.get(Math.floor(x / t), row);
      return tile === Tile.Solid || tile === Tile.OneWay;
    };
    if (firm(b.x) && firm(b.x + b.w - 1e-6)) this.safe = { x: pl.centerX, y: pl.bottom };
  }

  private updateSecrets(ev: WorldEvents): void {
    const pl = this.player;
    if (pl.state === 'dead') return;
    for (const s of this.secrets) {
      if (s.taken) continue;
      const b = s.box;
      const p = pl.box;
      if (p.x < b.x + b.w && p.x + p.w > b.x && p.y < b.y + b.h && p.y + p.h > b.y) {
        s.taken = true;
        this.collected.push(s.spawn.item);
        ev.secretFound = s.spawn.item;
      }
    }
  }

  private updateRooms(ev: WorldEvents): void {
    const alive = this.player.state !== 'dead';
    for (const r of this.rooms) {
      const change = r.update(this.player.box, alive);
      if (change === 'locked') ev.roomLocked = true;
      else if (change === 'cleared' && r.spawn.doors.length > 0) ev.roomCleared = true;
    }
  }

  /** Đi qua checkpoint (theo cột) thì lưu làm điểm hồi sinh; chỉ tiến, không lùi. */
  private updateCheckpoints(ev: WorldEvents): void {
    const pl = this.player;
    if (this.phase !== 'explore' || pl.state === 'dead') return;
    const cps = this.layout.checkpoints;
    const t = this.setup.tileSize;
    for (let i = this.checkpointIndex; i < cps.length; i += 1) {
      const cp = cps[i]!;
      if (pl.centerX < (cp.col + 0.5) * t || !pl.grounded) break;
      this.checkpointIndex = i + 1;
      ev.checkpoint = i + 1;
    }
    if (ev.checkpoint !== undefined) {
      this.checkpoint = this.checkpointPoint();
      this.safe = this.checkpoint;
    }
  }

  /** Roi bám theo tay Kai trong suốt thời gian quét. */
  private attachSweeps(): void {
    const pl = this.player;
    for (const p of this.pool.all) {
      if (!p.attached || p.owner !== 'player') continue;
      p.x = pl.facing > 0 ? pl.centerX : pl.centerX - p.w;
      p.y = pl.box.y + this.setup.weapons.arcCannon.muzzleOffsetPx.y - p.h / 2;
    }
  }

  private aimTargets(): { x: number; y: number }[] {
    const out = this.targets
      .filter((t) => t.alive)
      .map((t) => ({ x: t.box.x + t.box.w / 2, y: t.box.y + t.box.h / 2 }));
    if (this.boss && this.phase === 'boss')
      out.push({ x: this.boss.centerX, y: this.boss.box.y + this.boss.box.h / 2 });
    return out;
  }

  private makeBoss(): Boss | undefined {
    if (!this.bossSpawn || !this.arena) return undefined;
    return new Boss(
      this.setup.boss,
      this.map,
      this.bossSpawn.x,
      this.bossSpawn.y,
      this.arena,
      this.rng,
    );
  }

  private setGate(closed: boolean): void {
    if (this.gateCol === undefined) return;
    for (const row of this.gateRows)
      this.map.set(this.gateCol, row, closed ? Tile.Solid : Tile.Empty);
  }

  /** Vào đấu trường thì đóng cửa, bắt đầu trận; thắng rồi ra khỏi đấu trường thì boss dựng lại để đấu lại. */
  private updateArena(ev: WorldEvents): void {
    if (!this.arena || this.gateCol === undefined) return;
    const t = this.setup.tileSize;
    const pl = this.player;
    if (this.phase === 'explore' && pl.box.x >= this.arena.first * t + t && pl.state !== 'dead') {
      this.phase = 'boss';
      this.setGate(true);
      this.boss?.activate();
      this.checkpoint = { x: (this.arena.first + 1.5) * t, y: this.start.y };
      ev.gateClosed = true;
    } else if (this.phase === 'won' && pl.box.x + pl.box.w < this.gateCol * t) {
      this.phase = 'explore';
      this.boss = this.makeBoss();
      this.checkpoint = this.checkpointPoint();
    }
  }

  /** EXP tích lũy trong lượt chơi màn (kẻ địch thường + boss). */
  get exp(): number {
    return (this.field?.exp ?? 0) + this.bossExp;
  }

  /** Core Bit nhặt được trong lượt chơi màn (kẻ địch thường + boss). */
  get coreBits(): number {
    return (this.field?.coreBits ?? 0) + this.bossCoreBits;
  }

  private onBossDefeated(ev: WorldEvents): void {
    ev.bossDefeated = true;
    this.phase = 'won';
    this.setGate(false);
    this.pool.clear('enemy');
    if (!this.everWon) {
      this.everWon = true;
      const reward = this.setup.boss.reward;
      if (this.loadout.grant(reward)) ev.weaponGranted = reward;
      this.bossExp += this.setup.boss.rewardExp;
      this.bossCoreBits += this.setup.boss.rewardCoreBit;
    }
    this.checkpoint = this.checkpointPoint();
  }

  private respawn(ev: WorldEvents): void {
    const pl = this.player;
    this.safe = this.checkpoint;
    if (this.pitReturn) {
      // Rơi hố còn máu: về checkpoint, giữ máu và mọi thứ khác.
      this.pitReturn = false;
      pl.respawn(this.checkpoint.x, this.checkpoint.y, pl.hp);
      this.pool.clear('enemy');
      ev.respawned = true;
      return;
    }
    pl.respawn(this.checkpoint.x, this.checkpoint.y);
    this.pool.clear();
    this.loadout.refill();
    this.field?.reset();
    for (const r of this.rooms) r.reset();
    if (this.phase === 'boss') {
      // Chết trong phòng boss: hồi sinh trong phòng, boss đầy máu, trận bắt đầu lại.
      this.boss = this.makeBoss();
      this.boss?.activate();
    }
    ev.respawned = true;
  }
}
