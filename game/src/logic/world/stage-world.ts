import type { BossData } from '../../core/boss-config';
import type { EnemiesData } from '../../core/enemy-config';
import type { DifficultyData } from '../../core/game-config';
import type { PlayerData } from '../../core/player-config';
import type { StageMechanics } from '../../core/stage-mechanics-config';
import type { WeaponsData } from '../../core/weapons-config';
import { Boss } from '../boss/boss';
import { type BeamShot, WeaponLoadout } from '../combat/loadout';
import { ProjectilePool } from '../combat/projectiles';
import { TrainingTarget } from '../combat/targets';
import type { Enemy } from '../enemy/enemy';
import { type Box, groundBelow, moveX } from '../player/collision';
import {
  applyBuild,
  type BuildStats,
  EMPTY_BUILD,
  playerModsOf,
  statsFor,
  vanguardOf,
} from '../rpg/build';
import { BuildRuntime } from '../rpg/build-runtime';
import { checkpointActive, scaleReward, startCheckpointFor } from '../difficulty/difficulty';
import { playerParams } from '../player/player-params';
import { PlayerPhysics } from '../player/player-physics';
import { createRng, type Rng } from '../rng';
import { type EnemyMarkers, layoutFromRows, type StageLayout } from '../stage/layout';
import { laserBox, type LaserPath, traceLaser } from '../stage/laser-path';
import { Tile, type TileMap } from '../tilemap';
import type { StageReward } from '../stage/stage-exp';
import { EnemyField } from './enemy-field';
import { resolveBeamHits } from './beam-hits';
import {
  type BossDamageObserver,
  type KaiDefense,
  resolveEnemyHits,
  resolvePlayerHits,
  type VanguardMods,
} from './hits';
import { Barrier, LockedRoom, makeSecret, type Secret, standPoint, Vine } from './stage-mechanics';
import { StageOptics } from './stage-optics';
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
  /** Hệ số thưởng kẻ địch thường của màn chiến dịch, trừ mini-boss (GDD 16 mục 2.1); không có thì 1. */
  stageReward?: StageReward;
  /** Vào màn từ checkpoint đã lưu (số thứ tự từ 1; 0 hoặc không có = điểm xuất phát). */
  startCheckpoint?: number;
  /** Từ bản lưu (M11): vũ khí boss đã nhận, có ngay khi vào màn. */
  ownedWeapons?: readonly string[];
  /** Từ bản lưu (M11): vật phẩm bí mật đã nhặt (theo `item`), không hiện lại. */
  takenSecrets?: readonly string[];
  /** Từ bản lưu (M11): boss của màn đã hạ, thắng lại không nhận thưởng lần đầu nữa. */
  bossDefeated?: boolean;
  /**
   * Thưởng lần đầu hạ boss (EXP, Core Bit) đã nhận ở độ khó này (GDD 11 mục 2.3: một lần mỗi cặp
   * boss, độ khó). Không có thì theo `bossDefeated`. Vũ khí vẫn chỉ một lần mỗi boss.
   */
  bossRewardClaimed?: boolean;
  /** Cấp hiệu dụng (M8, đã đồng bộ cấp theo màn) quyết định máu và công; không có thì cấp 1. */
  level?: number;
  /** Build kỹ năng (M8); không có thì build trống. `player`/`weapons` ở trên là dữ liệu gốc. */
  build?: BuildStats;
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
  /** Vệt Prism Beam giữ lại để vẽ. Sát thương được giải quyết ngay lúc bắn. */
  readonly playerBeams: { boxes: readonly Box[]; remainingSec: number }[] = [];
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
  readonly optics: StageOptics | undefined;
  readonly secrets: Secret[];
  /** Vật phẩm bí mật đã nhặt trong lượt chơi (StageSave ghi vào bản lưu). */
  readonly collected: string[] = [];
  /** Checkpoint đã chạm xa nhất (0 = điểm xuất phát). */
  checkpointIndex = 0;
  /** Số lần rơi hố còn sống (không tính vào `deaths`). */
  falls = 0;
  /**
   * Số lần chết liên tiếp kể từ checkpoint gần nhất (gợi ý NOVA, GDD 11 mục 2.5). Không tính rơi
   * hố còn máu; chạm checkpoint hoặc vào đấu trường boss thì về 0. Khác `deaths` (màn Kết quả).
   */
  deathStreak = 0;
  /** Thời gian của lượt chơi màn (giây, tính cả lúc hit-stop và chờ hồi sinh; màn Kết quả). */
  elapsedSec = 0;
  /**
   * Đo lường (GDD 13): sát thương lên boss theo tên vũ khí (đơn vị phát Arc Cannon) và số cú trúng
   * điểm yếu, cộng dồn cả lượt; nguồn đòn gần nhất làm Kai mất máu.
   */
  readonly bossDamage = new Map<string, number>();
  bossWeakHits = 0;
  lastHitCause: string | undefined;

  private readonly rng: Rng;
  private attackMul: number;
  /** Cấp hiệu dụng đang dùng để tính máu và công. */
  level: number;
  /** Build kỹ năng đang áp. */
  build: BuildStats;
  /** Dữ liệu gốc đã áp build: dùng cho vật lý Kai và vũ khí (`setup` giữ dữ liệu gốc). */
  private built: { player: PlayerData; weapons: WeaponsData };
  /** Phòng thủ từ build: loại đạn P3 xuyên qua, sượt đạn cộng thời gian nạp. */
  private defense: KaiDefense;
  /** Nổ lan và Đòn Trừng Phạt từ build. */
  private vanguard: VanguardMods;
  /** Trạng thái build trong trận (khiên C3). Chạm gai không làm mới; chết thì khiên sẵn. */
  readonly runtime: BuildRuntime;
  private readonly start: { x: number; y: number };
  private checkpoint: { x: number; y: number };
  private respawnTimer = 0;
  /** Hồi sinh đang chờ là do rơi hố còn máu (giữ máu, không dựng lại kẻ địch). */
  private pitReturn = false;
  /** Chỗ đứng an toàn gần nhất (tâm, đáy) để đưa về khi chạm gai. */
  private safe: { x: number; y: number };
  private everWon = false;
  private rewardClaimed = false;
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
    // Checkpoint đã lưu là chỉ số trên danh sách đầy đủ; xuất phát ở checkpoint gần nhất phía
    // trước có ở độ khó này (GDD 11 mục 2.4).
    this.checkpointIndex = startCheckpointFor(
      this.layout.checkpoints,
      setup.difficulty.id,
      Math.max(0, setup.startCheckpoint ?? 0),
    );
    this.checkpoint = this.checkpointPoint();
    this.safe = this.checkpoint;
    // Sát thương gốc tính ở cấp 1, nên hệ số công = công hiện tại / công cấp 1.
    this.level = setup.level ?? 1;
    this.build = setup.build ?? EMPTY_BUILD;
    this.built = applyBuild(setup.player, setup.weapons, this.build);
    const { maxHp, attackMul } = statsFor(this.level, setup.player.level, this.build);
    this.attackMul = attackMul;
    this.player = new PlayerPhysics(
      playerParams(this.built.player, t, setup.stepSec, playerModsOf(this.build, setup.stepSec)),
      this.map,
      this.checkpoint.x,
      this.checkpoint.y,
      maxHp,
    );
    this.loadout = new WeaponLoadout(this.built.weapons, t);
    this.runtime = new BuildRuntime(this.build.shield);
    this.defense = this.defenseOf(this.build);
    this.vanguard = vanguardOf(this.build, t);
    for (const w of setup.ownedWeapons ?? []) this.loadout.grant(w);
    this.everWon = setup.bossDefeated ?? false;
    this.rewardClaimed = setup.bossRewardClaimed ?? this.everWon;

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
          setup.difficulty.rewardMul,
          setup.mechanics.enemyRewardOncePerRun,
          setup.stageReward,
        )
      : undefined;
    this.bossSpawn = layout.boss ? standPoint(layout.boss, t) : undefined;
    this.boss = this.makeBoss();

    this.vines = layout.vines.map((v) => new Vine(v, setup.mechanics.vine, t));
    this.player.platforms = this.vines.map((v) => v.platform);
    this.rooms = layout.rooms.map((r) => new LockedRoom(r, this.map));
    if (this.field) for (const r of this.rooms) r.bind(this.field.enemies, layout.enemies);
    this.barriers = layout.barriers.map((b) => new Barrier(b, this.map));
    this.optics = layout.optics && new StageOptics(layout.optics, this.map, setup.mechanics);
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
    // Dữ liệu chỉnh là dữ liệu gốc: áp lại build để không mất hiệu ứng kỹ năng.
    this.built = applyBuild(this.setup.player, this.setup.weapons, this.build);
    if (patch.player) {
      this.player.setParams(
        playerParams(
          this.built.player,
          this.setup.tileSize,
          this.setup.stepSec,
          playerModsOf(this.build, this.setup.stepSec),
        ),
      );
    }
    if (patch.weapons) this.loadout.setData(this.built.weapons);
  }

  /** Lên cấp giữa màn (M8): máu tối đa và công theo cấp hiệu dụng mới, máu cộng phần chênh. */
  setLevel(level: number): void {
    if (level === this.level) return;
    const stats = statsFor(level, this.setup.player.level, this.build);
    this.level = level;
    this.attackMul = stats.attackMul;
    this.player.setMaxHp(stats.maxHp);
  }

  private defenseOf(build: BuildStats): KaiDefense {
    const graze = build.effects.grazeChargeSec ?? 0;
    return {
      bulletKinds: build.bulletKinds,
      onGraze: graze > 0 ? () => this.loadout.addCharge(graze) : undefined,
      shield: build.shield ? this.runtime : undefined,
    };
  }

  /**
   * Đổi build giữa màn (kỹ năng chỉnh từ menu tạm dừng, áp ở lần hồi sinh kế tiếp): dựng lại dữ
   * liệu đã áp build, máu tối đa theo build mới (máu hiện tại cộng phần chênh).
   */
  setBuild(build: BuildStats): void {
    this.build = build;
    this.built = applyBuild(this.setup.player, this.setup.weapons, build);
    this.player.setParams(
      playerParams(
        this.built.player,
        this.setup.tileSize,
        this.setup.stepSec,
        playerModsOf(build, this.setup.stepSec),
      ),
    );
    this.runtime.setShield(build.shield);
    this.defense = this.defenseOf(build);
    this.vanguard = vanguardOf(build, this.setup.tileSize);
    this.loadout.setData(this.built.weapons);
    const stats = statsFor(this.level, this.setup.player.level, build);
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
      if (this.respawnTimer <= 1e-9) {
        // Đặt về 0: phần dư sai số (≤ 1e-9 nhưng > 0) sẽ làm bước sau hồi sinh lần nữa theo
        // nhánh chết (hồi đầy máu, dựng lại boss) ngay sau khi rơi hố.
        this.respawnTimer = 0;
        this.respawn(ev);
      }
      return ev;
    }
    // Khiên hồi trước khi xử lý trúng đòn; đồng hồ dừng trong hit-stop và lúc chờ hồi sinh.
    if (this.runtime.step(dt)) ev.kaiShieldReady = true;

    for (let i = this.playerBeams.length - 1; i >= 0; i -= 1) {
      const beam = this.playerBeams[i]!;
      beam.remainingSec -= dt;
      if (beam.remainingSec <= 1e-9) this.playerBeams.splice(i, 1);
    }

    for (const v of this.vines) v.step(dt);
    this.optics?.step(dt, ev);

    if (input.swapPrev || input.swapNext) {
      const before = this.loadout.index;
      this.loadout.swap(input.swapNext ? 1 : -1);
      ev.swapped = this.loadout.index !== before;
    }

    const pl = this.player;
    const previousX = pl.centerX;
    const previousY = pl.box.y + pl.box.h / 2;
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
    ev.airDash = pe.airDashed;
    ev.airDashRestored = pe.airDashRestored;

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
    const path = fire.beam && this.tracePlayerBeam(fire.beam);

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
    const optics = this.optics;
    this.pool.update(
      dt,
      this.map,
      (p) => {
        for (const b of this.barriers) if (b.tryBreak(p)) ev.barrierBroken = true;
      },
      optics?.mirrors.length ? (p) => optics.absorbShot(p, ev) : undefined,
    );

    const killed: Enemy[] = [];
    const observeBossDamage: BossDamageObserver = (weapon, amount, weak) => {
      this.bossDamage.set(weapon, (this.bossDamage.get(weapon) ?? 0) + amount);
      if (weak) this.bossWeakHits += 1;
    };
    this.hitStop = resolvePlayerHits(
      this.pool,
      { targets: this.targets, enemies: this.enemies, boss: this.boss },
      this.built.weapons,
      this.attackMul,
      ev,
      killed,
      this.vanguard,
      observeBossDamage,
    );
    if (fire.beam && path) this.fireBeam(fire.beam, path, ev, killed, observeBossDamage);
    this.field?.onKilled(killed, pl);
    // Boss hết máu vì đạn của Kai trong bước này thì thắng ngay, trước khi xét đòn lên Kai
    // (trước đây cùng bước Kai chết thì boss được dựng lại đầy máu).
    if (this.phase === 'boss' && this.boss?.settleDefeat()) this.onBossDefeated(ev);
    // Boss vừa kẹp pha (QB-31): xóa đạn boss trước khi xét đòn lên Kai. Đạn kẻ địch thường có
    // `source`, giữ nguyên.
    if (this.boss?.takeShotClear())
      this.pool.removeWhere((p) => p.owner === 'enemy' && p.source === undefined);
    resolveEnemyHits(
      this.pool,
      this.field?.active(pl) ?? [],
      this.phase === 'boss' ? this.boss : undefined,
      pl,
      // Đòn kẻ địch và boss: độ khó × build (Armor Plating, đã kẹp sàn). Gai, hố chỉ theo độ khó.
      this.setup.difficulty.damageTaken * this.build.damageTakenMul,
      ev,
      this.defense,
    );
    if (ev.kaiShieldAbsorbed)
      this.hitStop = Math.max(this.hitStop, this.build.shield?.hitStopSteps ?? 0);
    this.field?.updatePickups(pl, dt, ev, this.build.magnetTiles * this.setup.tileSize);

    if (!this.updateLasers(ev, previousX, previousY)) this.updateHazards(ev);
    if (ev.hurtBy) this.lastHitCause = ev.hurtBy;
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
        this.playerBeams.length = 0;
        this.respawnTimer = mech.pit.returnSec;
        return ev;
      }
      pl.state = 'dead';
      ev.deathCause = 'pit';
    }
    if (pe.died || pl.state === 'dead') {
      ev.playerDied = true;
      ev.deathCause ??= ev.hurtBy ?? this.lastHitCause;
      this.deaths += 1;
      this.deathStreak += 1;
      this.pitReturn = false;
      this.playerBeams.length = 0;
      this.respawnTimer = mech.respawnSec;
    }
    return ev;
  }

  private tracePlayerBeam(shot: BeamShot): LaserPath {
    const range = shot.behavior.rangeTiles * this.map.tileSize;
    return (
      this.optics?.trace(shot.origin, shot.direction, shot.behavior.maxBounces, range) ??
      traceLaser(
        this.map,
        shot.origin,
        shot.direction,
        () => undefined,
        shot.behavior.maxBounces,
        range,
      )
    );
  }

  private fireBeam(
    shot: BeamShot,
    path: LaserPath,
    ev: WorldEvents,
    killed: Enemy[],
    observeBossDamage: BossDamageObserver,
  ): void {
    const { widthPx, activeSec } = shot.behavior;
    const result = resolveBeamHits(
      path,
      shot,
      { targets: this.targets, enemies: this.enemies, boss: this.boss },
      this.built.weapons,
      this.attackMul,
      ev,
      killed,
      observeBossDamage,
    );
    this.hitStop = Math.max(this.hitStop, result.hitStop);
    const end = result.path.at(-1);
    if (!end) return;
    if (!result.blocked) {
      for (const barrier of this.barriers)
        if (barrier.tryBreakByBeam(shot.weapon, end, widthPx)) ev.barrierBroken = true;
    }
    const boxes = result.path.map((leg) => laserBox(leg, widthPx));
    this.optics?.receiveBeam(boxes, ev);
    this.playerBeams.push({ boxes, remainingSec: activeSec });
  }

  /** Sát thương môi trường nhân hệ số độ khó, làm tròn, tối thiểu 1 (như đòn kẻ địch). */
  private damageTaken(base: number): number {
    if (base <= 0) return 0;
    return Math.max(1, Math.round(base * this.setup.difficulty.damageTaken));
  }

  /** Laser môi trường dùng đường tia hiện tại, đi qua địch và bỏ qua khiên C3. */
  private updateLasers(ev: WorldEvents, previousX: number, previousY: number): boolean {
    const pl = this.player;
    if (!this.optics || pl.state === 'dead') return false;
    const { damage, knockbackTilesPerSec } = this.setup.mechanics.laser;
    for (const laser of this.optics.lasers) {
      const segment = laser.collision(pl.box);
      if (!segment || !laser.canHit) continue;
      let hurt: boolean;
      if (laser.spawn.mode === 'always') {
        const safe = this.laserReturnPoint();
        hurt = pl.hitHazard(this.damageTaken(damage), safe.x, safe.y);
      } else {
        const speed = knockbackTilesPerSec * this.map.tileSize;
        const vertical = segment.from.x === segment.to.x;
        // Dùng phía trước khi Kai bước vào tia nếu tâm đang nằm ngay trên đường tia.
        const offset = vertical
          ? pl.centerX - segment.from.x
          : pl.box.y + pl.box.h / 2 - segment.from.y;
        const previous = vertical ? previousX - segment.from.x : previousY - segment.from.y;
        const away = (offset || previous) > 0 ? 1 : -1;
        hurt = pl.applyHazardHit(
          this.damageTaken(damage),
          vertical ? away * speed : 0,
          vertical ? 0 : away * speed,
        );
      }
      if (hurt) {
        if (laser.spawn.mode === 'pulse') laser.registerHit();
        ev.laserHit = true;
        ev.playerHurt = true;
        ev.hurtBy = 'laser';
      }
      if (hurt || laser.spawn.mode === 'always') return true;
    }
    return false;
  }

  private laserReturnPoint(): { x: number; y: number } {
    const { w, h } = this.player.box;
    const t = this.map.tileSize;
    for (const point of [this.safe, this.checkpoint]) {
      const base = { x: point.x - w / 2, y: point.y - h, w, h };
      if (!this.inLaser(base)) return point;
      // Gương có thể vừa hướng tia vào chỗ an toàn trước đó. Dò mặt sàn cùng phía tường.
      const left = { ...base };
      const right = { ...base };
      let leftBlocked = false;
      let rightBlocked = false;
      while (!leftBlocked || !rightBlocked) {
        leftBlocked ||= moveX(left, -t, this.map) !== 0;
        rightBlocked ||= moveX(right, t, this.map) !== 0;
        for (const box of [leftBlocked ? undefined : left, rightBlocked ? undefined : right]) {
          if (!box || !groundBelow(box, this.map)) continue;
          if (!this.map.overlapsHazard(box) && !this.inLaser(box))
            return { x: box.x + w / 2, y: point.y };
        }
      }
    }
    return this.checkpoint;
  }

  private inLaser(box: Box): boolean {
    return this.optics?.lasers.some((laser) => !!laser.collision(box)) ?? false;
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
      if (pl.hitHazard(dmg, this.safe.x, this.safe.y)) {
        ev.playerHurt = true;
        ev.hurtBy = 'spike';
      }
      return;
    }
    if (
      !pl.grounded ||
      pl.onPlatform ||
      pl.state === 'hurt' ||
      this.map.overlapsHazard(b) ||
      this.inLaser(b)
    )
      return;
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
      // Checkpoint không có ở độ khó này: đi qua không ghi.
      if (!checkpointActive(cp, this.setup.difficulty.id)) continue;
      this.checkpointIndex = i + 1;
      ev.checkpoint = i + 1;
    }
    if (ev.checkpoint !== undefined) {
      this.deathStreak = 0;
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
      p.y = pl.box.y + this.built.weapons.arcCannon.muzzleOffsetPx.y - p.h / 2;
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
    // Máu boss nhân hệ số độ khó như kẻ địch thường (GDD 11 mục 3.1); pha tính theo % nên giữ nguyên.
    const data = this.setup.boss;
    const hpMul = this.setup.difficulty.enemyHp;
    return new Boss(
      hpMul === 1 ? data : { ...data, hp: data.hp * hpMul },
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
      this.deathStreak = 0;
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
    }
    if (!this.rewardClaimed) {
      this.rewardClaimed = true;
      // Thưởng lần đầu nhân hệ số độ khó (GDD 11 mục 3.1); vũ khí và SP không đổi.
      const mul = this.setup.difficulty.rewardMul;
      this.bossExp += scaleReward(this.setup.boss.rewardExp, mul);
      this.bossCoreBits += scaleReward(this.setup.boss.rewardCoreBit, mul);
    }
    this.checkpoint = this.checkpointPoint();
  }

  private respawn(ev: WorldEvents): void {
    const pl = this.player;
    this.safe = this.checkpoint;
    this.optics?.reset();
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
    this.runtime.resetOnDeath();
    // Phòng khóa đã xong giữ trạng thái mở, nên kẻ địch của nó (kể cả mini-boss) không dựng lại.
    const cleared = this.rooms.filter((r) => r.state === 'cleared').flatMap((r) => r.members);
    this.field?.reset(new Set(cleared));
    for (const r of this.rooms) r.reset();
    if (this.phase === 'boss') {
      // Chết trong phòng boss: hồi sinh trong phòng, boss đầy máu, trận bắt đầu lại.
      this.boss = this.makeBoss();
      this.boss?.activate();
    }
    ev.respawned = true;
  }
}
