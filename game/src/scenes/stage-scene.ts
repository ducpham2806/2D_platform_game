import Phaser from 'phaser';
import { DEBUG } from '../debug/flags';
import {
  FIXED_STEP_MS,
  LOGIC_HEIGHT,
  MAX_STEPS_PER_FRAME,
  SceneKey,
  TILE_SIZE,
} from '../core/constants';
import { wardenIds } from '../core/dialogue-config';
import { enemiesFor } from '../core/enemy-config';
import { bossFor, parseLevelRange, UNIT_REWARD_MUL } from '../core/game-config';
import { getBus, getConfig, getInput, getSave } from '../core/phaser-services';
import type { InputService } from '../input/input-service';
import { FixedStep } from '../logic/fixed-step';
import type { InputSnapshot } from '../logic/input/actions';
import { formatGlyphs } from '../logic/input/glyphs';
import type { TuningData } from '../logic/playtest/tuning';
import type { PlayerStateName } from '../logic/player/player-physics';
import {
  bossDialogue,
  type BossDialogueMoment,
  wardensDefeatedBefore,
} from '../logic/dialogue/boss-dialogue';
import { DialogueRunner } from '../logic/dialogue/dialogue-runner';
import { buildHud } from '../logic/hud/hud-model';
import { type BoxKind, TimedBox, topBox } from '../logic/hud/text-boxes';
import { buildStageResult } from '../logic/result/stage-result';
import { cameraLockFor } from '../logic/stage/camera-bounds';
import {
  DEFAULT_DIFFICULTY,
  deathHintExpired,
  difficultyHintText,
  difficultyUnlocked,
} from '../logic/difficulty/difficulty';
import { type BuildStats, computeBuild, EMPTY_BUILD } from '../logic/rpg/build';
import { spentPoints } from '../logic/rpg/skill-tree';
import { totalSkillPoints, WorkshopPanel, workshopUnlocked } from '../workshop/workshop-panel';
import { LevelTracker, skillPoints, syncLevel } from '../logic/rpg/progression';
import { recordTutorialDone, setTutorialOff, stageDifficulty } from '../logic/save/save-data';
import type { SaveManager } from '../logic/save/save-manager';
import { TutorialManager, type TutorialView } from '../logic/tutorial/tutorial-manager';
import { TutorialSignals } from '../logic/tutorial/tutorial-signals';
import { StageSave, stageSaveSetup } from '../logic/save/stage-save';
import { StageWorld } from '../logic/world/stage-world';
import type { WorldEvents, WorldInput } from '../logic/world/world-types';
import { buildStageLayout, STAGE_DEFS, type StageDefId } from '../stages';
import type { StageDef } from '../stages/stage-def';
import { DialogueBox } from './stage/dialogue-box';
import { PauseMenu, type PauseChoice } from './stage/pause-menu';
import { ResultPanel, type ResultChoice } from './stage/result-panel';
import { KAI_SHIELD_COLOR, StageHud } from './stage/stage-hud';
import { TutorialBox } from './stage/tutorial-box';
import { StagePlaytest, tunedData } from './stage/stage-playtest';
import { barrierCells, drawMechanics } from './stage/mechanics-renderer';
import { chargeGlowColor, drawDynamic, drawStaticMap } from './stage/stage-renderer';
import { StageTelemetry } from './telemetry/stage-telemetry';
import { getTelemetry } from './telemetry/telemetry-service';

const STATE_COLORS: Readonly<Record<PlayerStateName, number>> = {
  idle: 0x4fd1ff,
  run: 0x4fd1ff,
  land: 0x9be7ff,
  jump_up: 0x7fe0ff,
  jump_fall: 0x7fe0ff,
  dash: 0xffd166,
  wall_slide: 0xb48cff,
  wall_jump: 0xd2b4ff,
  hurt: 0xff6b6b,
  dead: 0x5a6577,
};

/** Kéo cần xuống quá mức này thì tính là giữ Xuống (để rơi xuyên bục trên cảm ứng). */
const DOWN_AXIS_THRESHOLD = 0.5;
/** Sát thương thử khi bấm phím T (chỉ bản dev), để xem bật lùi và bất tử. */
const DEBUG_HIT_DAMAGE = 10;
/** Hạt giống ngẫu nhiên của màn xám (khe né Mưa đạn). */
const WORLD_SEED = 2187;
/** Báo nhận vũ khí sau khi chữ "HẠ BOSS!" tắt (khi boss không có thoại sau trận). */
const WEAPON_FLASH_DELAY_MS = 1800;
/** Thời gian mảnh kính của khiên C3 bay ra khi vỡ (ms). */
const SHIELD_SHARD_MS = 350;
/** Thời gian giữ chữ "Lên cấp". */
const LEVEL_FLASH_MS = 1800;

/**
 * Bỏ phần tử đã hết hạn ngay trong mảng (không cấp phát mảng mới mỗi khung hình; quy tắc
 * `core-and-ai-rules`: không cấp phát trên hot-path).
 */
function dropExpired(list: { until: number }[], time: number): void {
  let n = 0;
  for (const item of list) if (item.until > time) list[n++] = item;
  list.length = n;
}

/**
 * Màn xám Prototype: chạy, nhảy, lướt, bám tường, bắn (Arc Cannon 3 mức nạp, Vine Lash),
 * bia tập bắn và boss xám. Toàn bộ luật chơi nằm trong StageWorld (logic thuần); scene chỉ
 * đổi đầu vào, vẽ, khóa camera trong phòng boss và tạo hiệu ứng.
 */
export class StageScene extends Phaser.Scene {
  private readonly stepper = new FixedStep(FIXED_STEP_MS, MAX_STEPS_PER_FRAME);
  private controls?: InputService;
  private world?: StageWorld;
  private dynamic?: Phaser.GameObjects.Graphics;
  private kai?: Phaser.GameObjects.Rectangle;
  private eye?: Phaser.GameObjects.Rectangle;
  private glow?: Phaser.GameObjects.Graphics;
  private hud?: StageHud;
  private playtest?: StagePlaytest;
  /** Ghi tiến trình vào bản lưu (M11); màn chơi thử của cổng Prototype không lưu. */
  private saver: StageSave | undefined;
  /** Core Bit trong bản lưu lúc vào màn (HUD cộng thêm phần nhặt trong lượt). */
  private savedCoreBits = 0;
  private pause?: PauseMenu;
  /** Hướng dẫn (chỉ màn có `tutorial` và có bản lưu). */
  private tutorial:
    { manager: TutorialManager; signals: TutorialSignals; box: TutorialBox } | undefined;
  private save: SaveManager | undefined;
  private prev = { x: 0, y: 0 };
  /** Khung camera đang khóa: 'boss', số thứ tự phòng khóa, hoặc undefined (theo người chơi). */
  private cameraLock: string | undefined;
  private def: StageDef = STAGE_DEFS.gray;
  private stageKey: StageDefId = 'gray';
  /** Độ khó của lượt (chọn ở màn Chuẩn bị; GDD 11). Màn chơi thử luôn Thường. */
  private difficultyId = DEFAULT_DIFFICULTY;
  /** Tên độ khó của lượt; các độ khó còn khóa của màn chiến dịch lúc vào màn (màn Kết quả). */
  private difficultyName = '';
  private lockedAtStart: string[] = [];
  /** id màn chiến dịch khi boss của phòng này là boss chiến dịch của màn (ghi `cleared`). */
  private campaignBoss: string | undefined;
  /**
   * Gợi ý của NOVA sau nhiều lần chết liên tiếp (GDD 11 mục 2.5): hộp riêng, tối đa một lần mỗi
   * lượt vào màn. Thứ tự và thời gian hiện theo QB-70…72 (`logic/hud/text-boxes.ts`).
   */
  private deathHint: { box: TutorialBox | undefined; used: boolean; timed: TimedBox | undefined } =
    { box: undefined, used: false, timed: undefined };
  /** Hội thoại đang mở: trận đứng yên tới khi đóng (người chơi bỏ qua được bất cứ lúc nào). */
  private dialogue: { runner: DialogueRunner; moment: BossDialogueMoment } | undefined;
  /** Đo lượt này (EP-13); undefined khi đo lường tắt hoặc màn không thuộc chiến dịch. */
  private telemetry: StageTelemetry | undefined;
  private dialogueBox?: DialogueBox;
  /** Thoại boss của lượt: số Warden đã hạ trước trận, đã nói câu trước trận, boss đã hạ. */
  private talk = { defeatedBefore: 0, preShown: false, won: false };
  /** Vũ khí vừa nhận lúc hạ boss: báo sau khi thoại sau trận đóng. */
  private pendingWeapon: string | undefined;
  /** Vũ khí nhận trong lượt (màn Kết quả). */
  private newWeapon: string | undefined;
  /** Giây còn lại tới khi mở màn Kết quả; undefined: chưa hạ boss hoặc màn không có Kết quả. */
  private resultIn: number | undefined;
  private result: ResultPanel | undefined;
  /** Bảng Kỹ năng mở từ menu tạm dừng (trận đứng yên). */
  private workshop: WorkshopPanel | undefined;
  /** Build mới chỉnh trong màn: áp ở lần hồi sinh kế tiếp. */
  private pendingBuild: BuildStats | undefined;
  /** M8: cấp thật trong lượt (EXP bản lưu + EXP của lượt); màn không lưu thì không có (cấp 1). */
  private levels: LevelTracker | undefined;
  /** Cấp khuyến nghị của màn chiến dịch (đồng bộ cấp); undefined: không đồng bộ. */
  private levelRange: [number, number] | undefined;
  /** Boss của màn chiến dịch đã hạ lúc vào màn, và boss của màn hạ lần đầu trong lượt (SP). */
  private storyBossesAtStart = 0;
  private storyBossWon = false;
  /** Boss của màn này là boss chiến dịch và chưa hạ lúc vào màn (hạ thì +SP mỗi boss). */
  private storyBossPending = false;
  /** Hiệu ứng ngắn trên người Kai (thời điểm hết, ms theo đồng hồ scene). */
  private kaiFx = { restoredUntil: 0, grazeUntil: 0, shieldReadyUntil: 0 };
  /** Mảnh kính khi khiên C3 vỡ (tâm Kai lúc vỡ, thời điểm hết). */
  private shieldShards: { x: number; y: number; until: number }[] = [];
  /** Vòng nổ lan đang vẽ (V2), thời điểm hết theo đồng hồ scene. */
  private bursts: { x: number; y: number; r: number; until: number }[] = [];

  constructor() {
    super(SceneKey.Stage);
  }

  /**
   * `scene.start(SceneKey.Stage, { stage: 'enemies', difficulty: 'story' })` chọn màn và độ khó;
   * mặc định là màn xám, độ khó Thường.
   */
  init(data: { stage?: StageDefId; difficulty?: string } | undefined): void {
    this.stageKey = data?.stage ?? 'gray';
    this.difficultyId = data?.difficulty ?? DEFAULT_DIFFICULTY;
    this.def = STAGE_DEFS[this.stageKey];
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Stage });
    const config = getConfig(this);
    const bossId = this.def.boss ?? 'gray';
    // Màn chơi thử (cổng Prototype) luôn Thường để số liệu các phiên so sánh được.
    const wanted = this.def.playtest ? DEFAULT_DIFFICULTY : this.difficultyId;
    const difficulty =
      config.difficulties.find((d) => d.id === wanted) ??
      config.difficulties.find((d) => d.id === DEFAULT_DIFFICULTY);
    // Thử thách: boss dùng bản Thử thách khi có (GDD 11 mục 2.6).
    const boss = difficulty ? bossFor(config, bossId, difficulty.newAttackPatterns) : undefined;
    if (!boss || !difficulty) throw new Error(`Thiếu dữ liệu boss "${bossId}" hoặc độ khó Thường`);
    this.stepper.reset();
    this.cameraLock = undefined;
    // Scene chơi lại (restart) dùng lại đối tượng cũ nên phải đặt lại trạng thái của lượt.
    this.dialogue = undefined;
    this.pendingWeapon = undefined;
    this.newWeapon = undefined;
    this.resultIn = undefined;
    // Dữ liệu gốc từ 03-Data; khi bật ?tune=1 thì áp thêm phần đã chỉnh lưu trên máy.
    const base: TuningData = { player: config.player, weapons: config.weapons, boss };
    const tuned = tunedData(base);
    // Màn chơi thử (cổng Prototype) luôn bắt đầu như nhau để số liệu các phiên so sánh được.
    const save = this.def.playtest ? undefined : getSave(this);
    // Checkpoint chỉ mang từ độ khó đang chọn hoặc khó hơn (thứ tự trong difficulties.json).
    const allowed = config.difficulties
      .slice(config.difficulties.findIndex((d) => d.id === difficulty.id))
      .map((d) => d.id);
    const fromSave = save ? stageSaveSetup(save.data, this.def.id, bossId, allowed) : {};
    this.savedCoreBits = save?.data.inventory.coreBits ?? 0;
    const defeated = save?.data.progress.bossesDefeated ?? [];
    const storyBosses = new Set(config.stages.stages.map((s) => s.boss));
    this.storyBossesAtStart = defeated.filter((id) => storyBosses.has(id)).length;
    this.storyBossWon = false;
    this.storyBossPending = storyBosses.has(bossId) && !defeated.includes(bossId);
    const campaign = config.stages.stages.find((s) => s.id === this.def.campaign);
    this.levelRange = campaign ? parseLevelRange(campaign.recommendedLevel) : undefined;
    // Chỉ boss chiến dịch của màn mới ghi `cleared` và tính thưởng theo độ khó (GDD 11 mục 2.3).
    this.campaignBoss = save && campaign?.boss === bossId ? campaign.id : undefined;
    const rewardClaimed =
      save && this.campaignBoss
        ? stageDifficulty(save.data, this.campaignBoss).cleared.includes(difficulty.id)
        : undefined;
    // Màn chơi thử của cổng Prototype luôn ở cấp 1 để số liệu các phiên so sánh được.
    this.levels = save ? new LevelTracker(config.player.level, save.data.character.exp) : undefined;
    this.talk = {
      defeatedBefore: wardensDefeatedBefore(defeated, wardenIds(config.wardenDialogue), bossId),
      preShown: false,
      won: defeated.includes(bossId),
    };
    const world = new StageWorld({
      layout: buildStageLayout(this.def, TILE_SIZE),
      tileSize: TILE_SIZE,
      stepSec: FIXED_STEP_MS / 1000,
      ...tuned,
      difficulty,
      seed: WORLD_SEED,
      // Thử thách: kẻ địch dùng bản Thử thách khi có (GDD 11 mục 2.6).
      enemies: enemiesFor(config.enemies, difficulty.newAttackPatterns),
      mechanics: config.stages.mechanics,
      // Thưởng kẻ địch theo màn chiến dịch (GDD 16 mục 2.1; Stage 1 = 1), mini-boss không nhân.
      // Theo `def.campaign`, không phụ thuộc bản lưu.
      ...(campaign
        ? {
            stageReward: {
              mul: campaign.enemyRewardMul ?? UNIT_REWARD_MUL,
              exempt: [campaign.miniBoss],
            },
          }
        : {}),
      ...fromSave,
      ...(rewardClaimed === undefined ? {} : { bossRewardClaimed: rewardClaimed }),
      level: this.levels
        ? syncLevel(this.levels.info.level, this.levelRange, config.stages.levelSync)
        : 1,
      // Màn chơi thử (không bản lưu) dùng build trống để số liệu các phiên so sánh được.
      build: save
        ? computeBuild(config.skills, save.data.character.skills, {
            shop: config.shop,
            levels: save.data.inventory.upgrades,
          })
        : EMPTY_BUILD,
    });
    this.world = world;
    const campaignId = this.campaignBoss;
    this.difficultyName = difficulty.name;
    this.lockedAtStart = save && campaignId ? this.lockedDifficulties(save, campaignId) : [];
    this.saver = save
      ? new StageSave(save, this.def.id, bossId, {
          difficulty: difficulty.id,
          ...(campaignId ? { clearsCampaign: campaignId } : {}),
        })
      : undefined;
    this.save = save;
    if (save) {
      // Thoát màn (về menu) hoặc đóng/ẩn trang: cộng Core Bit, EXP, thời gian chưa ghi.
      const flushRun = (): void => {
        this.saver?.exit(world);
      };
      window.addEventListener('pagehide', flushRun);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        window.removeEventListener('pagehide', flushRun);
        flushRun();
        this.saver = undefined;
      });
    }

    drawStaticMap(this.add.graphics(), world.map, barrierCells(world));
    this.dynamic = this.add.graphics();
    this.glow = this.add.graphics();
    const pl = world.player;
    this.kai = this.add.rectangle(0, 0, pl.box.w, pl.box.h, STATE_COLORS.idle).setOrigin(0, 0);
    this.eye = this.add.rectangle(0, 0, 3, 3, 0x0f1724).setOrigin(0, 0);
    this.prev = { x: pl.box.x, y: pl.box.y };
    this.hud = new StageHud(this);
    this.tweens.add({ targets: this.hud.hint, alpha: 0.25, delay: 8000, duration: 800 });
    if (world.checkpointIndex > 0)
      this.hud.flash(`Tiếp tục từ checkpoint ${world.checkpointIndex}`);
    this.syncSprites(0);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, world.map.widthPx, world.map.heightPx);
    camera.startFollow(this.kai, true, 0.2, 0.2);
    camera.setDeadzone(48, LOGIC_HEIGHT);

    const input = getInput(this);
    this.controls = input;
    input.setGameplayActive(true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => input.setGameplayActive(false));
    this.playtest = new StagePlaytest(this, world, input, base, this.def.playtest);
    this.tutorial =
      save && this.def.tutorial
        ? {
            manager: new TutorialManager(
              config.tutorial,
              this.def.tutorial,
              save.data.tutorial.done,
              !save.data.tutorial.off,
            ),
            signals: new TutorialSignals(config.tutorial.rules.nearTiles),
            box: new TutorialBox(this),
          }
        : undefined;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => input.setTouchHighlight(undefined));
    this.dialogueBox = new DialogueBox(this);
    this.result = undefined;
    this.workshop = undefined;
    this.pendingBuild = undefined;
    this.kaiFx = { restoredUntil: 0, grazeUntil: 0, shieldReadyUntil: 0 };
    this.bursts = [];
    this.shieldShards = [];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.workshop?.destroy();
      this.workshop = undefined;
    });
    const tut = this.tutorial;
    this.pause = new PauseMenu(
      this,
      `${this.def.name} · ${difficulty.name}`,
      (c) => this.onPauseChoice(c),
      tut ? () => tut.manager.isEnabled : undefined,
      save !== undefined && workshopUnlocked(save, config),
    );
    // Màn chơi thử (không bản lưu) không gợi ý, để số liệu các phiên so sánh được.
    this.deathHint = {
      box: save ? new TutorialBox(this) : undefined,
      used: false,
      timed: save ? new TimedBox(config.ui.reading) : undefined,
    };
    this.telemetry = StageTelemetry.start(this, world, {
      def: this.def,
      difficultyId: difficulty.id,
      difficultyDefault: DEFAULT_DIFFICULTY,
      challengeOpen: save !== undefined && !this.lockedAtStart.includes('challenge'),
      clearedBefore: save && campaignId ? stageDifficulty(save.data, campaignId).cleared : [],
      save,
      level: this.levels?.info.level ?? 1,
      savedCoreBits: this.savedCoreBits,
      device: input.device,
      stepSec: FIXED_STEP_MS / 1000,
    });
    if (DEBUG) {
      this.input.keyboard?.on('keydown-T', () =>
        world.player.applyHit(DEBUG_HIT_DAMAGE, world.player.centerX + world.player.facing * 8),
      );
      (window as unknown as { __cvWorld?: StageWorld }).__cvWorld = world;
    }
  }

  override update(time: number, delta: number): void {
    const input = this.controls;
    const world = this.world;
    if (!input || !world) return;
    this.telemetry?.frame(delta);
    if (this.playtest?.paused) {
      // Bảng chơi thử đang mở: trận đứng yên, không bù bước khi đóng bảng.
      this.stepper.reset();
      return;
    }
    const steps = this.stepper.advance(delta);
    for (let i = 0; i < steps; i += 1) {
      const snap = input.step();
      if (this.result?.isOpen) {
        this.result.handle(snap);
        continue;
      }
      if (this.workshop) {
        this.workshop.handle(snap);
        continue;
      }
      if (this.pause?.isOpen) {
        // Menu tạm dừng: trận đứng yên, đầu vào chỉ dùng để chọn mục.
        this.pause.handle(snap);
        continue;
      }
      if (snap.pressed.pause) {
        this.openPause(input);
        continue;
      }
      if (this.dialogue) {
        this.stepDialogue(snap);
        continue;
      }
      this.prev = { x: world.player.box.x, y: world.player.box.y };
      const ev = world.step(this.toWorldInput(snap, input));
      this.telemetry?.step(ev, input.device);
      if (ev.respawned && this.pendingBuild) {
        world.setBuild(this.pendingBuild);
        this.pendingBuild = undefined;
      }
      this.startDialogue(ev, world);
      this.react(ev, world);
      this.checkLevelUp(ev, world);
      this.saver?.step(ev, world, FIXED_STEP_MS / 1000);
      this.checkDeathHint(ev, world);
      this.stepTutorial(ev, world);
      this.stepDeathHint();
      this.playtest?.record(ev, FIXED_STEP_MS / 1000);
      this.tickResult(ev, world);
    }
    this.updateCamera(world);
    if (this.dynamic) {
      drawDynamic(this.dynamic, world, time);
      drawMechanics(this.dynamic, world, time);
      dropExpired(this.bursts, time);
      for (const b of this.bursts) {
        const left = (b.until - time) / (getConfig(this).ui.feedback.burstRingSec * 1000);
        this.dynamic.lineStyle(1, 0xffd166, Math.max(0.2, left)).strokeCircle(b.x, b.y, b.r);
      }
      this.drawShieldShards(this.dynamic, time);
    }
    this.syncSprites(this.stepper.alpha);
    const ctx = input.glyphContext();
    const hud = buildHud(world, this.savedCoreBits, this.levels?.info.level);
    input.setWeaponLabel(hud.weapon.name);
    this.hud?.update(hud, input.device === 'touch', formatGlyphs('{ĐỔI_VK}', ctx));
    const talk = this.dialogue?.runner.view;
    if (talk) {
      const keys = input.device === 'touch' ? '' : formatGlyphs('{NHẢY} tiếp · {LƯỚT} bỏ qua', ctx);
      this.dialogueBox?.show(talk, keys);
    }
    const view = this.drawTextBoxes();
    if (view)
      this.tutorial?.box.show(view.speaker, formatGlyphs(view.text, ctx), view.hintLevel > 0);
    else this.tutorial?.box.hide();
    input.setTouchHighlight(view?.highlight);
    this.hud?.hint.setText(
      formatGlyphs(
        '{DI_CHUYỂN} · nhảy {NHẢY} · bắn {BẮN} (giữ để nạp) · lướt {LƯỚT} · {TẠM_DỪNG}',
        ctx,
      ),
    );
    if (DEBUG) {
      this.hud?.debug.setText(
        `${world.player.state} · chết ${world.deaths} · FPS ${Math.round(this.game.loop.actualFps)}`,
      );
    }
  }

  private openPause(input: InputService): void {
    // Ẩn lớp nút cảm ứng để chạm được vào các mục của menu trên canvas.
    input.setGameplayActive(false);
    this.pause?.show();
  }

  private stepTutorial(ev: WorldEvents, world: StageWorld): void {
    const tut = this.tutorial;
    if (!tut) return;
    const frame = tut.signals.collect(world, ev);
    const result = tut.manager.step(frame.signals, frame.moveTiles, FIXED_STEP_MS / 1000);
    this.telemetry?.tutorial(result, tut.manager.view, this.def.tutorial);
    if (result.completed.length > 0)
      this.save?.update((s) => recordTutorialDone(s, result.completed));
  }

  private onPauseChoice(choice: PauseChoice): void {
    if (choice === 'skills') {
      this.openSkills();
      return;
    }
    if (choice === 'tutorial') {
      const tut = this.tutorial;
      if (!tut) return;
      const on = !tut.manager.isEnabled;
      tut.manager.setEnabled(on);
      this.telemetry?.tutorialToggle(on);
      this.save?.update((s) => setTutorialOff(s, !on));
      // Tắt hướng dẫn thì gợi ý chết cũng không hiện (GDD 07, GDD 11 mục 2.5), kể cả câu đang có.
      if (!on) this.deathHint.timed?.cancel();
      return;
    }
    if (choice === 'quit') {
      this.scene.start(SceneKey.Menu);
      return;
    }
    this.pause?.hide();
    // Đang có hộp hội thoại thì lớp nút cảm ứng vẫn ẩn để chạm được vào hộp.
    this.controls?.setGameplayActive(!this.dialogue);
    this.stepper.reset();
  }

  /** Bảng Kỹ năng từ menu tạm dừng: đổi bản lưu ngay, build mới áp ở lần hồi sinh kế tiếp. */
  private openSkills(): void {
    const save = this.save;
    if (!save) return;
    const config = getConfig(this);
    this.pause?.hide();
    // Phaser nghe thả chuột trên cả cửa sổ: tắt để cú chạm trong bảng không xuyên xuống canvas.
    this.input.enabled = false;
    this.workshop = new WorkshopPanel(save, config, {
      note: 'Thay đổi áp dụng ở lần hồi sinh kế tiếp hoặc lần vào màn sau.',
      onTelemetry: (name, props) => getTelemetry(this)?.log(name, props),
      // Upgrade không đổi trong màn (chỉ mua ở Quầy Mira), nhưng build mới phải giữ chúng.
      onChange: (skills) =>
        (this.pendingBuild = computeBuild(config.skills, skills, {
          shop: config.shop,
          levels: save.data.inventory.upgrades,
        })),
      onClose: () => {
        this.workshop?.destroy();
        this.workshop = undefined;
        this.input.enabled = true;
        this.pause?.show();
      },
    });
  }

  /** M8: EXP vượt mốc thì lên cấp ngay (máu và công theo cấp hiệu dụng mới), báo kèm SP. */
  private checkLevelUp(ev: WorldEvents, world: StageWorld): void {
    if (ev.bossDefeated && this.storyBossPending) {
      this.storyBossPending = false;
      this.storyBossWon = true;
    }
    const up = this.levels?.update(world.exp);
    if (!up) return;
    const config = getConfig(this);
    const data = config.player.level;
    world.setLevel(syncLevel(up.to, this.levelRange, config.stages.levelSync));
    const sp = skillPoints(up.to, 0, data) - skillPoints(up.from, 0, data);
    const text = `Lên cấp ${up.to}! +${sp} SP`;
    this.hud?.flash(ev.bossDefeated ? `HẠ BOSS!\n${text}` : text, LEVEL_FLASH_MS);
  }

  /** Mở thoại trước trận (vào đấu trường lần đầu) hoặc sau trận (hạ boss lần đầu) nếu boss có thoại. */
  private startDialogue(ev: WorldEvents, world: StageWorld): void {
    let moment: BossDialogueMoment | undefined;
    if (ev.gateClosed && !this.talk.preShown && !this.talk.won) moment = 'pre';
    if (ev.bossDefeated && !this.talk.won) moment = 'post';
    if (ev.gateClosed) this.talk.preShown = true;
    if (ev.bossDefeated) this.talk.won = true;
    const boss = world.boss?.data;
    if (!moment || !boss) return;
    const config = getConfig(this);
    const lines = bossDialogue(config.wardenDialogue, {
      bossId: boss.id,
      bossName: boss.name,
      speakers: config.ui.dialogue.speakers,
      defeatedBefore: this.talk.defeatedBefore,
      moment,
    });
    if (lines.length === 0) return;
    this.dialogue = { runner: new DialogueRunner(lines, config.ui.dialogue), moment };
    // Ẩn lớp nút cảm ứng để chạm vào hộp và nút Bỏ qua trên canvas.
    this.controls?.setGameplayActive(false);
  }

  private stepDialogue(snap: InputSnapshot): void {
    const d = this.dialogue;
    if (!d) return;
    const taps = this.dialogueBox?.consumeTaps() ?? { next: false, skip: false };
    const r = d.runner.step(
      {
        next: taps.next || snap.pressed.jump || snap.pressed.shoot || snap.pressed.interact,
        skip: taps.skip || snap.pressed.dash,
      },
      FIXED_STEP_MS / 1000,
    );
    if (!r.closed) return;
    this.dialogue = undefined;
    this.dialogueBox?.hide();
    this.controls?.setGameplayActive(true);
    const weapon = this.pendingWeapon;
    this.pendingWeapon = undefined;
    if (weapon) this.flashWeapon(weapon, 0);
  }

  private flashWeapon(weapon: string, delayMs: number): void {
    const ctx = this.controls?.glyphContext();
    const swap = ctx ? formatGlyphs('{ĐỔI_VK}', ctx) : '';
    this.time.delayedCall(delayMs, () =>
      this.hud?.flash(`Nhận vũ khí: ${weapon}\n${swap} để đổi vũ khí`, 2600),
    );
  }

  /** Hạ boss của màn có Kết quả: đếm `ui.result.delaySec` (sau khi thoại đóng) rồi mở màn Kết quả. */
  private tickResult(ev: WorldEvents, world: StageWorld): void {
    if (ev.bossDefeated && this.def.result && this.resultIn === undefined)
      this.resultIn = getConfig(this).ui.result.delaySec;
    if (this.resultIn === undefined || this.dialogue) return;
    this.resultIn -= FIXED_STEP_MS / 1000;
    if (this.resultIn > 1e-9) return;
    this.resultIn = undefined;
    // Ghi EXP, Core Bit, thời gian của lượt trước khi hiện tổng.
    this.saver?.exit(world);
    const ctx = this.controls?.glyphContext();
    const reminders = (this.tutorial?.manager.reminders ?? []).map((t) =>
      ctx ? formatGlyphs(t, ctx) : t,
    );
    this.controls?.setGameplayActive(false);
    const save = this.save;
    const config = getConfig(this);
    const spLeft = save
      ? totalSkillPoints(save, config) - spentPoints(save.data.character.skills)
      : 0;
    this.result = new ResultPanel(
      this,
      (c) => this.onResultChoice(c),
      save !== undefined && workshopUnlocked(save, config) && spLeft > 0,
    );
    this.result.show(
      buildStageResult(world, {
        stageName: this.def.name,
        savedCoreBits: this.savedCoreBits,
        newWeapon: this.newWeapon,
        reminders,
        level: this.levelResult(),
        difficulty: this.def.playtest
          ? undefined
          : {
              name: this.difficultyName,
              unlocked: this.lockedAtStart
                .filter((id) => {
                  const campaign = this.def.campaign;
                  return save && campaign && !this.lockedDifficulties(save, campaign).includes(id);
                })
                .map((id) => config.difficulties.find((d) => d.id === id)?.name ?? id),
            },
      }),
    );
  }

  /** Chết đủ số lần liên tiếp thì chuẩn bị câu gợi ý của NOVA (GDD 11 mục 2.5). */
  private checkDeathHint(ev: WorldEvents, world: StageWorld): void {
    const hint = this.deathHint;
    // Mất ngữ cảnh (thắng boss, qua checkpoint, vào đấu trường): bỏ câu đang chờ hoặc đang hiện.
    if (deathHintExpired(ev)) hint.timed?.cancel();
    if (!ev.playerDied || hint.used || !hint.timed || this.save?.data.tutorial.off) return;
    const config = getConfig(this);
    const data = config.ui.difficultyHint;
    if (world.deathStreak < data.deaths) return;
    hint.used = true;
    // Vũ khí khắc chế: đang ở phòng boss, đã có, mà lúc chết không cầm nó.
    const weak = world.boss?.data.weakness;
    const counter =
      world.phase === 'boss' &&
      weak &&
      world.loadout.has(weak) &&
      world.loadout.current.name !== weak
        ? weak
        : undefined;
    const early = !this.save || !workshopUnlocked(this.save, config);
    hint.timed.post(difficultyHintText(data, this.difficultyId, counter, early), data.showSec);
  }

  /** Hộp nào đang muốn hiện (QB-70); gợi ý chết chỉ khi còn hiệu lực. */
  private boxWants(): Partial<Record<BoxKind, boolean>> {
    return {
      dialogue: this.dialogue !== undefined,
      result: !!this.result?.isOpen,
      deathHint: !!this.deathHint.timed?.active,
      tutorial: this.tutorial?.manager.view !== undefined,
    };
  }

  /**
   * Đếm giờ gợi ý chết cho một bước trận đang chạy (QB-71, QB-72). Bước trận đứng yên (menu tạm
   * dừng, bảng Kỹ năng, hội thoại, Kết quả) không gọi hàm này, nên không đếm gì. Ghi đo lường ở bước
   * đầu tiên câu thật sự hiện (GDD 13: `difficulty_hint` là lúc hiện, không phải lúc chuẩn bị).
   */
  private stepDeathHint(): void {
    const timed = this.deathHint.timed;
    if (!timed?.active) return;
    const clock = topBox(this.boxWants()) === 'deathHint' ? 'free' : 'covered';
    if (timed.step(FIXED_STEP_MS / 1000, clock)) this.telemetry?.hint();
  }

  /**
   * Vẽ hộp chữ theo thứ tự QB-70 (hội thoại > Kết quả > gợi ý chết > hướng dẫn). Gợi ý chết ẩn khi
   * menu tạm dừng hay bảng Kỹ năng mở (giữ nguyên thời gian còn lại). Trả lời hướng dẫn được hiện.
   */
  private drawTextBoxes(): TutorialView | undefined {
    const hint = this.deathHint;
    const top = topBox(this.boxWants());
    const frozen = !!this.pause?.isOpen || this.workshop !== undefined;
    const text = hint.timed?.text;
    if (top === 'deathHint' && !frozen && text) {
      const speaker = getConfig(this).ui.dialogue.speakers.nova ?? 'NOVA';
      hint.box?.show(speaker, text, true);
    } else hint.box?.hide();
    return top === 'tutorial' ? this.tutorial?.manager.view : undefined;
  }

  /** Id các độ khó còn khóa ở màn chiến dịch `campaign` theo bản lưu. */
  private lockedDifficulties(save: SaveManager, campaign: string): string[] {
    const progress = stageDifficulty(save.data, campaign);
    return getConfig(this)
      .difficulties.filter((d) => !difficultyUnlocked(d, progress))
      .map((d) => d.id);
  }

  /** Cấp lúc vào màn và lúc xong, SP nhận thêm (lên cấp + boss hạ lần đầu). */
  private levelResult(): { from: number; to: number; spGained: number } | undefined {
    const lv = this.levels;
    if (!lv) return undefined;
    const data = getConfig(this).player.level;
    const bosses = this.storyBossesAtStart + (this.storyBossWon ? 1 : 0);
    return {
      from: lv.startLevel,
      to: lv.info.level,
      spGained:
        skillPoints(lv.info.level, bosses, data) -
        skillPoints(lv.startLevel, this.storyBossesAtStart, data),
    };
  }

  private onResultChoice(choice: ResultChoice): void {
    if (choice === 'retry')
      this.scene.restart({ stage: this.stageKey, difficulty: this.difficultyId });
    else if (choice === 'workshop') this.scene.start(SceneKey.Workshop);
    else this.scene.start(SceneKey.Menu);
  }

  private toWorldInput(snap: InputSnapshot, input: InputService): WorldInput {
    const touch = snap.device === 'touch' ? input.controlSettings.touch : undefined;
    return {
      moveX: snap.moveX,
      moveY: snap.moveY,
      jumpPressed: snap.pressed.jump,
      jumpHeld: snap.held.jump,
      dashPressed: snap.pressed.dash,
      // Cần ảo/cần tay cầm là trục analog: kéo xuống quá nửa cũng tính là "xuống".
      downHeld: snap.held.down || snap.moveY > DOWN_AXIS_THRESHOLD,
      shootPressed: snap.pressed.shoot,
      shootHeld: snap.held.shoot,
      shootReleased: snap.released.shoot,
      swapPrev: snap.pressed.swapPrev,
      swapNext: snap.pressed.swapNext,
      autoFire: touch?.autoFire ?? false,
      aimAssist: touch?.aimAssist ?? false,
    };
  }

  /** Hiệu ứng theo sự kiện của thế giới: chữ thông báo, rung màn hình. */
  private react(ev: WorldEvents, world: StageWorld): void {
    const hud = this.hud;
    const camera = this.cameras.main;
    if (ev.gateClosed) hud?.flash(world.boss?.data.name.toUpperCase() ?? 'BOSS');
    if (ev.bossPhaseChanged) camera.flash(120, 255, 170, 80);
    if (ev.bossLanded) camera.shake(160, 0.006);
    if (ev.weakHit) camera.shake(90, 0.004);
    if (ev.playerHurt) camera.shake(80, 0.003);
    if (ev.bossDefeated) hud?.flash('HẠ BOSS!');
    if (ev.weaponGranted) {
      this.newWeapon = ev.weaponGranted;
      // Có thoại sau trận thì báo vũ khí khi hộp hội thoại đóng.
      if (this.dialogue) this.pendingWeapon = ev.weaponGranted;
      else this.flashWeapon(ev.weaponGranted, WEAPON_FLASH_DELAY_MS);
    }
    if (ev.emptyWeapon) hud?.flash('Hết năng lượng vũ khí', 600);
    if (ev.enemyKilled) camera.shake(60, 0.002);
    // M8 Phantom: chớp đèn chân khi hồi lượt lướt trên không (lúc đang ở trên không), tia sượt đạn.
    if (ev.airDashRestored && !world.player.grounded)
      this.kaiFx.restoredUntil = this.time.now + 160;
    if (ev.graze) this.kaiFx.grazeUntil = this.time.now + 140;
    // M8 Vanguard: bậc phản hồi (ui.json → feedback): nổ lan bậc vừa, Đòn Trừng Phạt bậc lớn.
    const fb = getConfig(this).ui.feedback;
    if (ev.burst) {
      this.bursts.push({ ...ev.burst, until: this.time.now + fb.burstRingSec * 1000 });
      camera.shake(fb.medium.shakeMs, fb.medium.shakeIntensity);
    }
    if (ev.punishHit) camera.shake(fb.large.shakeMs, fb.large.shakeIntensity);
    // M8 Core: khiên vỡ là bậc vừa (dừng hình ở thế giới); khiên hồi chớp viền trắng.
    if (ev.kaiShieldAbsorbed) {
      const pl = world.player;
      this.shieldShards.push({
        x: pl.centerX,
        y: pl.box.y + pl.box.h / 2,
        until: this.time.now + SHIELD_SHARD_MS,
      });
      camera.shake(fb.medium.shakeMs, fb.medium.shakeIntensity);
    }
    if (ev.kaiShieldReady) this.kaiFx.shieldReadyUntil = this.time.now + 220;
    if (ev.healed > 0) hud?.flash(`+${ev.healed} máu`, 500);
    if (ev.checkpoint !== undefined)
      hud?.flash(`Checkpoint ${ev.checkpoint}${this.saver ? ' · đã lưu' : ''}`, 900);
    if (ev.fellInPit) camera.shake(80, 0.003);
    if (ev.spikeHit) camera.shake(90, 0.004);
    if (ev.roomLocked) hud?.flash('Phòng khóa: hạ hết kẻ địch', 1200);
    if (ev.roomCleared) hud?.flash('Cửa mở', 900);
    if (ev.barrierBroken) camera.shake(100, 0.004);
    if (ev.secretFound) {
      const label = world.secrets.find((s) => s.spawn.item === ev.secretFound)?.spawn.label;
      hud?.flash(`Nhặt được: ${label ?? ev.secretFound}`, 1400);
    }
  }

  /**
   * Trong phòng boss, khóa camera đúng khung đấu trường (rộng đúng một màn hình); trong phòng
   * khóa đang đóng cửa, khóa camera trong phòng (gồm hai cột cửa).
   */
  private updateCamera(world: StageWorld): void {
    // Khung camera theo phòng khóa, đấu trường (QB-121, logic/stage/camera-bounds.ts).
    const { key, bounds } = cameraLockFor(world, TILE_SIZE);
    if (key === this.cameraLock) return;
    this.cameraLock = key;
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  /** Khiên C3 vỡ: 8 mảnh kính bay ra quanh Kai rồi mờ dần (vẽ cả lúc Kai đang nhấp nháy). */
  private drawShieldShards(g: Phaser.GameObjects.Graphics, time: number): void {
    dropExpired(this.shieldShards, time);
    for (const s of this.shieldShards) {
      const left = (s.until - time) / SHIELD_SHARD_MS;
      const r = 10 + 14 * (1 - left);
      g.lineStyle(1, left > 0.7 ? 0xffffff : KAI_SHIELD_COLOR, left);
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        g.lineBetween(s.x + c * r, s.y + sn * r, s.x + c * (r + 4), s.y + sn * (r + 3));
      }
    }
  }

  /** Vẽ Kai ở vị trí nội suy giữa bước trước và bước hiện tại, cùng quầng nạp đạn. */
  private syncSprites(alpha: number): void {
    const world = this.world;
    if (!world || !this.kai || !this.eye || !this.glow) return;
    const pl = world.player;
    const x = Math.round(this.prev.x + (pl.box.x - this.prev.x) * alpha);
    const y = Math.round(this.prev.y + (pl.box.y - this.prev.y) * alpha);
    const visible = !world.respawning && (!pl.blinking || Math.floor(this.time.now / 60) % 2 === 0);
    this.kai.setPosition(x, y).setFillStyle(STATE_COLORS[pl.state]).setVisible(visible);
    this.eye.setPosition(x + (pl.facing > 0 ? pl.box.w - 5 : 2), y + 5).setVisible(visible);
    this.glow.clear();
    const color =
      world.loadout.current.kind === 'buster'
        ? chargeGlowColor(world.loadout.chargeLevel, this.time.now)
        : undefined;
    if (color !== undefined && visible)
      this.glow.lineStyle(1, color, 1).strokeRect(x - 2, y - 2, pl.box.w + 4, pl.box.h + 4);
    if (!visible) return;
    const now = this.time.now;
    const { w, h } = pl.box;
    // P1: đèn đẩy (màu cam, khác mọi màu trạng thái của Kai) sáng khi còn lượt lướt trên không.
    if (pl.airDashMax > 0 && !pl.grounded && pl.airDashesLeft > 0) {
      const flash = now < this.kaiFx.restoredUntil;
      this.glow
        .fillStyle(flash ? 0xffffff : 0xff9f43, flash ? 1 : 0.85)
        .fillRect(x + 2, y + h, w - 4, flash ? 3 : 2);
    }
    // C3: viền khiên tím nhạt quanh Kai khi khiên sẵn (chớp trắng lúc vừa hồi).
    if (world.runtime.shieldReady) {
      const fresh = now < this.kaiFx.shieldReadyUntil;
      const pulse = 0.75 + 0.2 * Math.sin(now / 180);
      this.glow
        .lineStyle(1, fresh ? 0xffffff : KAI_SHIELD_COLOR, fresh ? 1 : pulse)
        .strokeEllipse(x + w / 2, y + h / 2, w + 10, h + 8);
    }
    // P3: bóng mờ lục lam trong phần bất tử thêm với đạn.
    if (pl.bulletGuardExtended) {
      this.glow.fillStyle(0x4fd1ff, 0.25).fillRect(x - pl.facing * 6, y, w, h);
      this.glow.lineStyle(1, 0x7fe0ff, 0.7).strokeRect(x - 1, y - 1, w + 2, h + 2);
    }
    // Sượt đạn: hai tia trắng ngắn hai bên.
    if (now < this.kaiFx.grazeUntil) {
      this.glow.lineStyle(1, 0xffffff, 1);
      this.glow
        .lineBetween(x - 4, y + 6, x - 1, y + 9)
        .lineBetween(x + w + 4, y + 6, x + w + 1, y + 9);
    }
  }
}
