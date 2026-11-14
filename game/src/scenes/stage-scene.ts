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
import { parseLevelRange } from '../core/game-config';
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
import { buildStageResult } from '../logic/result/stage-result';
import { type BuildStats, computeBuild, EMPTY_BUILD } from '../logic/rpg/build';
import { spentPoints } from '../logic/rpg/skill-tree';
import { totalSkillPoints, WorkshopPanel, workshopUnlocked } from '../workshop/workshop-panel';
import { LevelTracker, skillPoints, syncLevel } from '../logic/rpg/progression';
import { recordTutorialDone, setTutorialOff } from '../logic/save/save-data';
import type { SaveManager } from '../logic/save/save-manager';
import { TutorialManager } from '../logic/tutorial/tutorial-manager';
import { TutorialSignals } from '../logic/tutorial/tutorial-signals';
import { StageSave, stageSaveSetup } from '../logic/save/stage-save';
import { StageWorld } from '../logic/world/stage-world';
import type { WorldEvents, WorldInput } from '../logic/world/world-types';
import { buildStageLayout, STAGE_DEFS, type StageDefId } from '../stages';
import type { StageDef } from '../stages/stage-def';
import { DialogueBox } from './stage/dialogue-box';
import { PauseMenu, type PauseChoice } from './stage/pause-menu';
import { ResultPanel, type ResultChoice } from './stage/result-panel';
import { StageHud } from './stage/stage-hud';
import { TutorialBox } from './stage/tutorial-box';
import { StagePlaytest, tunedData } from './stage/stage-playtest';
import { barrierCells, drawMechanics } from './stage/mechanics-renderer';
import { chargeGlowColor, drawDynamic, drawStaticMap } from './stage/stage-renderer';

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
/** Thời gian giữ chữ "Lên cấp". */
const LEVEL_FLASH_MS = 1800;

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
  /** Hội thoại đang mở: trận đứng yên tới khi đóng (người chơi bỏ qua được bất cứ lúc nào). */
  private dialogue: { runner: DialogueRunner; moment: BossDialogueMoment } | undefined;
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
  private kaiFx = { restoredUntil: 0, grazeUntil: 0 };
  /** Vòng nổ lan đang vẽ (V2), thời điểm hết theo đồng hồ scene. */
  private bursts: { x: number; y: number; r: number; until: number }[] = [];

  constructor() {
    super(SceneKey.Stage);
  }

  /** `scene.start(SceneKey.Stage, { stage: 'enemies' })` chọn màn; mặc định là màn xám. */
  init(data: { stage?: StageDefId } | undefined): void {
    this.stageKey = data?.stage ?? 'gray';
    this.def = STAGE_DEFS[this.stageKey];
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Stage });
    const config = getConfig(this);
    const bossId = this.def.boss ?? 'gray';
    const boss = config.bosses[bossId];
    const difficulty = config.difficulties.find((d) => d.id === 'normal') ?? config.difficulties[0];
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
    const fromSave = save ? stageSaveSetup(save.data, this.def.id, bossId) : {};
    this.savedCoreBits = save?.data.inventory.coreBits ?? 0;
    const defeated = save?.data.progress.bossesDefeated ?? [];
    const storyBosses = new Set(config.stages.stages.map((s) => s.boss));
    this.storyBossesAtStart = defeated.filter((id) => storyBosses.has(id)).length;
    this.storyBossWon = false;
    this.storyBossPending = storyBosses.has(bossId) && !defeated.includes(bossId);
    const campaign = config.stages.stages.find((s) => s.id === this.def.campaign);
    this.levelRange = campaign ? parseLevelRange(campaign.recommendedLevel) : undefined;
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
      enemies: config.enemies,
      mechanics: config.stages.mechanics,
      ...fromSave,
      level: this.levels
        ? syncLevel(this.levels.info.level, this.levelRange, config.stages.levelSync)
        : 1,
      // Màn chơi thử (không bản lưu) dùng build trống để số liệu các phiên so sánh được.
      build: save ? computeBuild(config.skills, save.data.character.skills) : EMPTY_BUILD,
    });
    this.world = world;
    this.saver = save ? new StageSave(save, this.def.id, bossId) : undefined;
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
    this.kaiFx = { restoredUntil: 0, grazeUntil: 0 };
    this.bursts = [];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.workshop?.destroy();
      this.workshop = undefined;
    });
    // Chưa có chọn độ khó: màn luôn chơi ở Thường.
    const tut = this.tutorial;
    this.pause = new PauseMenu(
      this,
      `${this.def.name} · Thường`,
      (c) => this.onPauseChoice(c),
      tut ? () => tut.manager.isEnabled : undefined,
      save !== undefined && workshopUnlocked(save, config),
    );
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
      if (ev.respawned && this.pendingBuild) {
        world.setBuild(this.pendingBuild);
        this.pendingBuild = undefined;
      }
      this.startDialogue(ev, world);
      this.react(ev, world);
      this.checkLevelUp(ev, world);
      this.saver?.step(ev, world, FIXED_STEP_MS / 1000);
      this.stepTutorial(ev, world);
      this.playtest?.record(ev, FIXED_STEP_MS / 1000);
      this.tickResult(ev, world);
    }
    this.updateCamera(world);
    if (this.dynamic) {
      drawDynamic(this.dynamic, world, time);
      drawMechanics(this.dynamic, world, time);
      this.bursts = this.bursts.filter((b) => b.until > time);
      for (const b of this.bursts) {
        const left = (b.until - time) / (getConfig(this).ui.feedback.burstRingSec * 1000);
        this.dynamic.lineStyle(1, 0xffd166, Math.max(0.2, left)).strokeCircle(b.x, b.y, b.r);
      }
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
    // Hộp hội thoại hoặc màn Kết quả đang mở thì lời hướng dẫn chờ (không chồng lên nhau).
    const view = talk || this.result?.isOpen ? undefined : this.tutorial?.manager.view;
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
      this.save?.update((s) => setTutorialOff(s, !on));
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
      onChange: (skills) => (this.pendingBuild = computeBuild(config.skills, skills)),
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
      }),
    );
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
    if (choice === 'retry') this.scene.restart({ stage: this.stageKey });
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
    const roomIndex = world.rooms.findIndex((r) => r.state === 'locked');
    const lock =
      world.phase === 'boss' && world.gateCol !== undefined
        ? 'boss'
        : roomIndex >= 0
          ? `room${roomIndex}`
          : undefined;
    if (lock === this.cameraLock) return;
    this.cameraLock = lock;
    const camera = this.cameras.main;
    const room = world.rooms[roomIndex];
    if (lock === 'boss' && world.gateCol !== undefined) {
      camera.setBounds(
        world.gateCol * TILE_SIZE,
        0,
        (world.map.cols - world.gateCol) * TILE_SIZE,
        world.map.heightPx,
      );
    } else if (room) {
      const r = room.spawn;
      camera.setBounds(
        r.first * TILE_SIZE,
        0,
        (r.last - r.first + 1) * TILE_SIZE,
        world.map.heightPx,
      );
    } else {
      camera.setBounds(0, 0, world.map.widthPx, world.map.heightPx);
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
