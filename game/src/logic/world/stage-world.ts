import type { BossData } from '../../core/boss-config';
import type { DifficultyData } from '../../core/game-config';
import type { PlayerData } from '../../core/player-config';
import type { WeaponsData } from '../../core/weapons-config';
import { GrayBoss } from '../boss/gray-boss';
import { WeaponLoadout } from '../combat/loadout';
import { ProjectilePool } from '../combat/projectiles';
import { TrainingTarget } from '../combat/targets';
import { evaluateFormula } from '../formula';
import { playerParams } from '../player/player-params';
import { PlayerPhysics } from '../player/player-physics';
import { createRng, type Rng } from '../rng';
import { Tile, TileMap } from '../tilemap';
import { resolveEnemyHits, resolvePlayerHits } from './hits';
import { noWorldEvents, type WorldEvents, type WorldInput, type WorldPhase } from './world-types';

export interface WorldSetup {
  rows: readonly string[];
  tileSize: number;
  stepSec: number;
  player: PlayerData;
  weapons: WeaponsData;
  boss: BossData;
  difficulty: DifficultyData;
  seed: number;
}

/** Bia tập bắn: máu (phát Arc Cannon) và thời gian dựng lại. Chỉ dùng trong màn xám. */
const TARGET_HP = 3;
const TARGET_RESPAWN_SEC = 2;
const TARGET_SIZE = { w: 12, h: 24 };
/** Thời gian chờ trước khi hồi sinh sau khi chết / rơi hố. */
const RESPAWN_AFTER_DEATH_SEC = 1;
const RESPAWN_AFTER_FALL_SEC = 0.3;
/** Cấp của Kai ở mốc Prototype (chưa có hệ thống cấp). */
const PROTOTYPE_LEVEL = 1;

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
  boss: GrayBoss | undefined;
  phase: WorldPhase = 'explore';
  deaths = 0;
  /** Cột ô của cửa và của đấu trường (bên trong hai tường). */
  readonly gateCol: number | undefined;
  readonly arena: { first: number; last: number } | undefined;
  /** Đang dừng hình (hit-stop), tính bằng số bước còn lại. */
  hitStop = 0;

  private readonly rng: Rng;
  private readonly attackMul: number;
  private readonly start: { x: number; y: number };
  private checkpoint: { x: number; y: number };
  private respawnTimer = 0;
  private everWon = false;
  /** Các dòng ô của cửa phòng boss (ô 'D'). */
  readonly gateRows: number[];
  private readonly bossSpawn: { x: number; y: number } | undefined;

  constructor(private setup: WorldSetup) {
    const t = setup.tileSize;
    this.map = TileMap.fromRows(setup.rows, t);
    this.rng = createRng(setup.seed);
    this.start = this.map.spawn ?? { x: t * 2, y: this.map.heightPx - t };
    this.checkpoint = this.start;
    // Prototype chơi ở cấp 1; hệ thống cấp (M8) sẽ truyền cấp thật vào đây.
    const level = { L: PROTOTYPE_LEVEL };
    const maxHp = evaluateFormula(setup.player.level.hp, level);
    // Sát thương gốc tính ở cấp 1, nên hệ số công = công hiện tại / công cấp 1.
    this.attackMul =
      evaluateFormula(setup.player.level.atk, level) /
      evaluateFormula(setup.player.level.atk, { L: 1 });
    this.player = new PlayerPhysics(
      playerParams(setup.player, t, setup.stepSec),
      this.map,
      this.start.x,
      this.start.y,
      maxHp,
    );
    this.loadout = new WeaponLoadout(setup.weapons, t);

    let nextId = 1;
    const gates = this.map.markers.filter((m) => m.ch === 'D');
    this.gateRows = gates.map((g) => g.row);
    this.gateCol = gates[0]?.col;
    this.arena =
      this.gateCol === undefined ? undefined : { first: this.gateCol + 1, last: this.map.cols - 2 };
    for (const m of this.map.markers) {
      if (m.ch === 'T' || m.ch === 'S') {
        const box = {
          x: (m.col + 0.5) * t - TARGET_SIZE.w / 2,
          y: (m.row + 1) * t - TARGET_SIZE.h,
          ...TARGET_SIZE,
        };
        this.targets.push(
          new TrainingTarget(nextId++, box, TARGET_HP, m.ch === 'S' ? -1 : 0, TARGET_RESPAWN_SEC),
        );
      }
    }
    const b = this.map.markers.find((m) => m.ch === 'B');
    this.bossSpawn = b ? { x: (b.col + 0.5) * t, y: (b.row + 1) * t } : undefined;
    this.boss = this.makeBoss();
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

  get respawning(): boolean {
    return this.respawnTimer > 0;
  }

  step(input: WorldInput): WorldEvents {
    const ev = noWorldEvents();
    const dt = this.setup.stepSec;
    if (this.hitStop > 0) {
      this.hitStop -= 1;
      return ev;
    }
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 1e-9) this.respawn(ev);
      return ev;
    }

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
    this.pool.update(dt, this.map);

    this.hitStop = resolvePlayerHits(
      this.pool,
      this.targets,
      this.boss,
      this.setup.weapons,
      this.attackMul,
      ev,
    );
    resolveEnemyHits(
      this.pool,
      this.phase === 'boss' ? this.boss : undefined,
      pl,
      this.setup.difficulty.damageTaken,
      ev,
    );

    this.updateArena(ev);
    if (pe.died || pe.fellOut || pl.state === 'dead') {
      ev.playerDied = true;
      this.deaths += 1;
      this.respawnTimer = pe.fellOut ? RESPAWN_AFTER_FALL_SEC : RESPAWN_AFTER_DEATH_SEC;
    }
    return ev;
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

  private makeBoss(): GrayBoss | undefined {
    if (!this.bossSpawn || !this.arena) return undefined;
    return new GrayBoss(
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
      this.checkpoint = this.start;
    }
  }

  private onBossDefeated(ev: WorldEvents): void {
    ev.bossDefeated = true;
    this.phase = 'won';
    this.setGate(false);
    this.pool.clear('enemy');
    if (!this.everWon) {
      this.everWon = true;
      const reward = this.setup.boss.weakness;
      if (this.loadout.grant(reward)) ev.weaponGranted = reward;
    }
    this.checkpoint = this.start;
  }

  private respawn(ev: WorldEvents): void {
    const pl = this.player;
    pl.respawn(this.checkpoint.x, this.checkpoint.y);
    this.pool.clear();
    this.loadout.refill();
    if (this.phase === 'boss') {
      // Chết trong phòng boss: hồi sinh trong phòng, boss đầy máu, trận bắt đầu lại.
      this.boss = this.makeBoss();
      this.boss?.activate();
    }
    ev.respawned = true;
  }
}
