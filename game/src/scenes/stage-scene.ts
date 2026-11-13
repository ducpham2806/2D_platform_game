import Phaser from 'phaser';
import { DEBUG } from '../debug/flags';
import {
  FIXED_STEP_MS,
  LOGIC_HEIGHT,
  MAX_STEPS_PER_FRAME,
  SceneKey,
  TILE_SIZE,
} from '../core/constants';
import type { CueId, FeedbackData } from '../core/feedback-config';
import { getBus, getConfig, getInput, getSave, getSfx, getStrings } from '../core/phaser-services';
import type { Strings } from '../logic/i18n';
import type { SfxPlayer } from '../audio/sfx-player';
import { CueCollector } from '../logic/feel/cue-collector';
import { ParticlePool } from '../logic/feel/particle-pool';
import { Squash } from '../logic/feel/squash';
import { createRng, type Rng } from '../logic/rng';
import type { InputService } from '../input/input-service';
import { FixedStep } from '../logic/fixed-step';
import type { InputSnapshot } from '../logic/input/actions';
import { formatGlyphs } from '../logic/input/glyphs';
import type { TuningData } from '../logic/playtest/tuning';
import { BossDialogueDirector, bossDialogueScript } from '../logic/dialogue/boss-dialogue';
import { buildHud } from '../logic/hud/hud-model';
import { buildStageResult, ResultGate } from '../logic/result/stage-result';
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
import type { ResultSceneData } from './result-scene';
import { StageHud } from './stage/stage-hud';
import { TutorialBox } from './stage/tutorial-box';
import { StagePlaytest, tunedData } from './stage/stage-playtest';
import { barrierCells, drawMechanics } from './stage/mechanics-renderer';
import { drawDynamic, drawParticles } from './stage/stage-renderer';
import {
  ArtDepth,
  Backdrop,
  buildTileLayer,
  drawActors,
  drawWorldArt,
  FxLayer,
  KaiView,
  SpritePool,
} from './stage/stage-art';

/** Kéo cần xuống quá mức này thì tính là giữ Xuống (để rơi xuyên bục trên cảm ứng). */
const DOWN_AXIS_THRESHOLD = 0.5;
/** Sát thương thử khi bấm phím T (chỉ bản dev), để xem bật lùi và bất tử. */
const DEBUG_HIT_DAMAGE = 10;
/** Hạt giống ngẫu nhiên của màn xám (khe né Mưa đạn). */
const WORLD_SEED = 2187;
/** Đầu nòng Arc Cannon nằm ở chừng này chiều cao hộp Kai tính từ trên xuống (tạm, tới khi có sprite). */
const MUZZLE_HEIGHT = 0.4;
/** Cue làm hình Kai co giãn, và kiểu co giãn tương ứng trong feedback.json. */
const SQUASH_CUES: Partial<Record<CueId, 'jump' | 'land' | 'dash'>> = {
  jump: 'jump',
  wallJump: 'jump',
  land: 'land',
  dash: 'dash',
};
/** Thông báo nhận vũ khí hiện sau chữ "HẠ BOSS!" bấy nhiêu ms (hoặc ngay sau thoại sau trận). */
const WEAPON_NOTICE_DELAY_MS = 1800;
/** Thông báo nhận vũ khí hiện bấy nhiêu ms; lời hướng dẫn chờ nó tắt rồi mới hiện. */
const WEAPON_NOTICE_HOLD_MS = 2000;

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
  private kai?: KaiView;
  private backdrop?: Backdrop;
  private worldArt?: SpritePool;
  private actorArt?: SpritePool;
  private fx?: FxLayer;
  /** Kẻ địch còn sống ở khung trước, để nổ tại chỗ khi vừa bị hạ. */
  private readonly aliveEnemies = new Set<object>();
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
  private strings!: Strings;
  /** Thoại trước/sau trận boss (chỉ khi boss có thoại và chưa bị hạ trong bản lưu). */
  private dialogue: { director: BossDialogueDirector; box: DialogueBox } | undefined;
  /** Vũ khí vừa nhận, chờ hiện thông báo (sau thoại sau trận). */
  private weaponNotice: { name: string; atMs: number } | undefined;
  private noticeUntilMs = 0;
  /** Lượt chơi để đưa sang màn Kết quả (màn chơi thử của cổng Prototype không có). */
  /** Phản hồi cảm giác chơi: âm thanh, hạt, co giãn hình Kai (theo feedback.json). */
  private feel:
    | {
        data: FeedbackData;
        sfx: SfxPlayer;
        cues: CueCollector;
        particles: ParticlePool;
        squash: Squash;
        rng: Rng;
      }
    | undefined;
  private run:
    | {
        gate: ResultGate;
        sec: number;
        won: boolean;
        weapon: string | undefined;
        expAtStart: number;
      }
    | undefined;
  private prev = { x: 0, y: 0 };
  /** Khung camera đang khóa: 'boss', số thứ tự phòng khóa, hoặc undefined (theo người chơi). */
  private cameraLock: string | undefined;
  private def: StageDef = STAGE_DEFS.gray;

  constructor() {
    super(SceneKey.Stage);
  }

  /** `scene.start(SceneKey.Stage, { stage: 'enemies' })` chọn màn; mặc định là màn xám. */
  init(data: { stage?: StageDefId } | undefined): void {
    this.def = STAGE_DEFS[data?.stage ?? 'gray'];
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Stage });
    const config = getConfig(this);
    const strings = getStrings(this);
    this.strings = strings;
    const bossId = this.def.boss ?? 'gray';
    const boss = config.bosses[bossId];
    const difficulty = config.difficulties.find((d) => d.id === 'normal') ?? config.difficulties[0];
    if (!boss || !difficulty) throw new Error(`Thiếu dữ liệu boss "${bossId}" hoặc độ khó Thường`);
    this.stepper.reset();
    this.cameraLock = undefined;
    // Dữ liệu gốc từ 03-Data; khi bật ?tune=1 thì áp thêm phần đã chỉnh lưu trên máy.
    const base: TuningData = { player: config.player, weapons: config.weapons, boss };
    const tuned = tunedData(base);
    // Màn chơi thử (cổng Prototype) luôn bắt đầu như nhau để số liệu các phiên so sánh được.
    const save = this.def.playtest ? undefined : getSave(this);
    const fromSave = save ? stageSaveSetup(save.data, this.def.id, bossId) : {};
    this.savedCoreBits = save?.data.inventory.coreBits ?? 0;
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

    const theme = this.def.theme ?? 'lab';
    this.backdrop = new Backdrop(this, theme);
    buildTileLayer(this, world.map, theme, barrierCells(world));
    this.dynamic = this.add.graphics();
    this.actorArt = new SpritePool(this, ArtDepth.actors);
    this.worldArt = new SpritePool(this, ArtDepth.projectiles);
    this.fx = new FxLayer(this);
    this.aliveEnemies.clear();
    const pl = world.player;
    this.kai = new KaiView(this);
    this.prev = { x: pl.box.x, y: pl.box.y };
    this.hud = new StageHud(this, strings);
    this.tweens.add({ targets: this.hud.hint, alpha: 0.25, delay: 8000, duration: 800 });
    if (world.checkpointIndex > 0)
      this.hud.flash(strings.t('hud.resumeCheckpoint', { n: world.checkpointIndex }));
    this.syncSprites(0);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, world.map.widthPx, world.map.heightPx);
    camera.startFollow(this.kai.sprite, true, 0.2, 0.2);
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
    // Thoại boss: biến thể theo số boss khác đã hạ; đánh lại boss đã hạ thì không nghe lại.
    const defeated = save?.data.progress.bossesDefeated ?? [];
    const script = bossDialogueScript(
      config.dialogue,
      bossId,
      boss.name,
      defeated.filter((b) => b !== bossId).length,
      strings.lang,
    );
    const feedback = config.feedback;
    this.feel = {
      data: feedback,
      sfx: getSfx(this),
      cues: new CueCollector(),
      particles: new ParticlePool(feedback.rules.maxParticles),
      squash: new Squash(feedback.squash.recoverSec),
      // Hạt chỉ để vẽ: hạt giống riêng, không đụng tới ngẫu nhiên của luật chơi.
      rng: createRng(WORLD_SEED + 1),
    };
    this.weaponNotice = undefined;
    this.noticeUntilMs = 0;
    this.run = save
      ? {
          gate: new ResultGate(config.stages.mechanics.result),
          sec: 0,
          won: false,
          weapon: undefined,
          expAtStart: save.data.character.exp,
        }
      : undefined;
    this.dialogue =
      script.pre.length + script.post.length > 0 && !defeated.includes(bossId)
        ? {
            director: new BossDialogueDirector(script, config.dialogue.rules),
            box: new DialogueBox(this),
          }
        : undefined;
    // Chưa có chọn độ khó: màn luôn chơi ở Thường.
    const tut = this.tutorial;
    this.pause = new PauseMenu(
      this,
      `${this.def.name} · ${strings.t('difficulty.normal')}`,
      strings,
      (c) => this.onPauseChoice(c),
      tut ? () => tut.manager.isEnabled : undefined,
      () => !getSfx(this).muted,
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
      if (this.pause?.isOpen) {
        // Menu tạm dừng: trận đứng yên, đầu vào chỉ dùng để chọn mục.
        this.pause.handle(snap);
        continue;
      }
      const dlg = this.dialogue;
      if (dlg?.director.active) {
        // Đang hội thoại: trận đứng yên, Nhảy/Bắn/chạm = Tiếp, Tạm dừng = Bỏ qua.
        const tap = dlg.box.takeInput();
        const ended = dlg.director.stepDialogue(FIXED_STEP_MS / 1000, {
          advance: snap.pressed.jump || snap.pressed.shoot || snap.pressed.interact || tap.advance,
          skip: snap.pressed.pause || tap.skip,
        });
        if (ended) {
          input.setGameplayActive(true);
          this.stepper.reset();
          break;
        }
        continue;
      }
      if (snap.pressed.pause) {
        this.openPause(input);
        continue;
      }
      this.prev = { x: world.player.box.x, y: world.player.box.y };
      const ev = world.step(this.toWorldInput(snap, input));
      this.react(ev, world);
      this.playCues(ev, world);
      this.saver?.step(ev, world, FIXED_STEP_MS / 1000);
      this.stepTutorial(ev, world);
      this.playtest?.record(ev, FIXED_STEP_MS / 1000);
      if (dlg?.director.afterWorldStep(ev, world.player.grounded, FIXED_STEP_MS / 1000)) {
        // Ẩn lớp nút cảm ứng để chạm vào hộp hội thoại.
        input.setGameplayActive(false);
        dlg.box.takeInput();
      }
      if (this.stepRun(ev, world, time)) return;
    }
    this.showWeaponNotice(time);
    this.updateCamera(world);
    if (this.dynamic) {
      drawDynamic(this.dynamic, world, time);
      drawMechanics(this.dynamic, world);
    }
    this.backdrop?.update(this.cameras.main);
    if (this.actorArt) drawActors(this.actorArt, this, world, time);
    if (this.worldArt) drawWorldArt(this.worldArt, world, this.def.theme ?? 'lab', time);
    this.enemyExplosions(world);
    if (this.feel) {
      const dt = Math.min(delta, FIXED_STEP_MS * MAX_STEPS_PER_FRAME) / 1000;
      this.feel.particles.update(dt);
      this.feel.squash.update(dt);
      if (this.dynamic) drawParticles(this.dynamic, this.feel.particles);
    }
    this.syncSprites(this.stepper.alpha);
    const ctx = input.glyphContext();
    const hud = buildHud(world, this.savedCoreBits);
    input.setWeaponLabel(hud.weapon.name);
    this.hud?.update(hud, input.device === 'touch', formatGlyphs('{ĐỔI_VK}', ctx));
    const talking = this.dialogue?.director.active;
    if (talking?.line)
      this.dialogue?.box.show(
        talking.line,
        talking.visibleChars,
        talking.lineComplete,
        input.device === 'touch'
          ? { next: this.strings.t('dialogue.next'), skip: this.strings.t('dialogue.skip') }
          : {
              next: formatGlyphs(`{NHẢY} ${this.strings.t('dialogue.next')}`, ctx),
              skip: formatGlyphs(`{TẠM_DỪNG} ${this.strings.t('dialogue.skip')}`, ctx),
            },
      );
    else this.dialogue?.box.hide();
    // Lời hướng dẫn nhường chỗ khi sắp hoặc đang có thoại boss.
    const view =
      this.dialogue?.director.busy || this.weaponNotice || time < this.noticeUntilMs
        ? undefined
        : this.tutorial?.manager.view;
    if (view)
      this.tutorial?.box.show(view.speaker, formatGlyphs(view.text, ctx), view.hintLevel > 0);
    else this.tutorial?.box.hide();
    input.setTouchHighlight(view?.highlight);
    this.hud?.hint.setText(formatGlyphs(this.strings.t('hud.controlsHint'), ctx));
    if (DEBUG) {
      this.hud?.debug.setText(
        `${world.player.state} · chết ${world.deaths} · FPS ${Math.round(this.game.loop.actualFps)}`,
      );
    }
  }

  /** Âm thanh, hạt và co giãn hình theo các cue của bước vừa chạy. */
  private playCues(ev: WorldEvents, world: StageWorld): void {
    const feel = this.feel;
    if (!feel) return;
    const pl = world.player;
    for (const cue of feel.cues.collect(world, ev)) {
      const def = feel.data.cues[cue];
      if (def.sfx) feel.sfx.play(def.sfx);
      const preset = def.particles ? feel.data.particles[def.particles] : undefined;
      if (preset) {
        let x = pl.centerX;
        let y = pl.box.y + pl.box.h / 2;
        if (def.at === 'feet') y = pl.box.y + pl.box.h;
        else if (def.at === 'muzzle') {
          x = pl.facing > 0 ? pl.box.x + pl.box.w : pl.box.x;
          y = pl.box.y + pl.box.h * MUZZLE_HEIGHT;
        } else if (def.at === 'boss' && world.boss) {
          x = world.boss.box.x + world.boss.box.w / 2;
          y = world.boss.box.y + world.boss.box.h / 2;
        }
        feel.particles.spawn(preset, x, y, pl.facing > 0 ? 1 : -1, feel.rng);
      }
      if (cue === 'shot' || cue === 'shotMid' || cue === 'shotCharged') {
        const mx = pl.facing > 0 ? pl.box.x + pl.box.w + 6 : pl.box.x - 6;
        this.fx?.play('fx_muzzle', mx, pl.box.y + pl.box.h * MUZZLE_HEIGHT, pl.facing < 0);
      } else if (cue === 'hitBoss' || cue === 'weakHit') {
        if (world.boss) {
          const b = world.boss.box;
          this.fx?.play(
            'fx_hit_spark',
            pl.centerX < b.x ? b.x : b.x + b.w,
            pl.box.y + pl.box.h * MUZZLE_HEIGHT,
          );
        }
      } else if (cue === 'bossDefeated' && world.boss) {
        const b = world.boss.box;
        const cx = b.x + b.w / 2;
        if (world.boss.data.id === 'gray') this.fx?.play('fx_explosion_small', cx, b.y + b.h / 2);
        else this.fx?.play('boss_thorna_die', cx, b.y + b.h - 48, world.boss.facing > 0);
      } else if (cue === 'died') {
        this.fx?.play('kai_death', pl.centerX, pl.box.y + pl.box.h - 24, pl.facing < 0);
      } else if (cue === 'respawn') {
        this.kai?.playRespawn();
      }
      const squash = SQUASH_CUES[cue];
      if (squash) feel.squash.set(feel.data.squash[squash]);
      if (cue === 'respawn') feel.squash.reset();
    }
  }

  /** Đếm giờ lượt chơi; hạ boss xong thì chuyển sang màn Kết quả. Trả về true nếu đã chuyển. */
  private stepRun(ev: WorldEvents, world: StageWorld, nowMs: number): boolean {
    const run = this.run;
    if (!run) return false;
    const dt = FIXED_STEP_MS / 1000;
    if (!run.won) run.sec += dt;
    if (ev.bossDefeated) run.won = true;
    if (ev.weaponGranted) run.weapon = ev.weaponGranted;
    const ready = run.gate.step(dt, {
      won: run.won,
      busy:
        (this.dialogue?.director.busy ?? false) ||
        this.weaponNotice !== undefined ||
        nowMs < this.noticeUntilMs,
      tutorialPending: this.tutorial?.manager.view !== undefined,
    });
    if (!ready) return false;
    const data: ResultSceneData = {
      stage: this.def.id as StageDefId,
      result: buildStageResult(
        {
          stageName: this.def.name,
          timeSec: run.sec,
          deaths: world.deaths,
          expAtStart: run.expAtStart,
          expGained: world.exp,
          coreBitsGained: world.coreBits,
          weapon: run.weapon,
          secretsFound: world.secrets.filter((s) => s.taken).length,
          secretsTotal: world.secrets.length,
        },
        getConfig(this).player.level,
      ),
    };
    this.scene.start(SceneKey.Result, data);
    return true;
  }

  /** Thông báo nhận vũ khí: sau chữ "HẠ BOSS!", và không chen vào thoại sau trận. */
  private showWeaponNotice(nowMs: number): void {
    const notice = this.weaponNotice;
    if (!notice || this.dialogue?.director.busy) return;
    if (!this.dialogue && nowMs < notice.atMs) return;
    this.weaponNotice = undefined;
    // Màn có hướng dẫn thì cách đổi vũ khí do bước S13 nói; không thì nhắc ngay ở đây.
    const ctx = this.controls?.glyphContext();
    const swap =
      !this.tutorial?.manager.isEnabled && ctx
        ? `\n${formatGlyphs(this.strings.t('hud.swapHint'), ctx)}`
        : '';
    this.hud?.flash(
      this.strings.t('hud.weaponGranted', { name: notice.name }) + swap,
      WEAPON_NOTICE_HOLD_MS,
    );
    this.noticeUntilMs = nowMs + WEAPON_NOTICE_HOLD_MS;
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
    if (choice === 'tutorial') {
      const tut = this.tutorial;
      if (!tut) return;
      const on = !tut.manager.isEnabled;
      tut.manager.setEnabled(on);
      this.save?.update((s) => setTutorialOff(s, !on));
      return;
    }
    if (choice === 'sound') {
      const sfx = getSfx(this);
      sfx.setMuted(!sfx.muted);
      return;
    }
    if (choice === 'quit') {
      this.scene.start(SceneKey.Menu);
      return;
    }
    this.pause?.hide();
    this.controls?.setGameplayActive(true);
    this.stepper.reset();
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
    const s = this.strings;
    if (ev.bossDefeated) hud?.flash(s.t('hud.bossDefeated'));
    if (ev.weaponGranted)
      this.weaponNotice = { name: ev.weaponGranted, atMs: this.time.now + WEAPON_NOTICE_DELAY_MS };
    if (ev.emptyWeapon) hud?.flash(s.t('hud.weaponEmpty'), 600);
    if (ev.enemyKilled) camera.shake(60, 0.002);
    if (ev.healed > 0) hud?.flash(s.t('hud.healed', { n: ev.healed }), 500);
    if (ev.checkpoint !== undefined)
      hud?.flash(
        s.t(this.saver ? 'hud.checkpointSaved' : 'hud.checkpoint', { n: ev.checkpoint }),
        900,
      );
    if (ev.fellInPit) camera.shake(80, 0.003);
    if (ev.spikeHit) camera.shake(90, 0.004);
    if (ev.roomLocked) hud?.flash(s.t('hud.roomLocked'), 1200);
    if (ev.roomCleared) hud?.flash(s.t('hud.roomCleared'), 900);
    if (ev.barrierBroken) camera.shake(100, 0.004);
    if (ev.secretFound) {
      const label = world.secrets.find((s) => s.spawn.item === ev.secretFound)?.spawn.label;
      hud?.flash(s.t('hud.secretFound', { name: label ?? ev.secretFound }), 1400);
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

  /** Vẽ Kai ở vị trí nội suy giữa bước trước và bước hiện tại, cùng vòng nạp ở nòng pháo. */
  private syncSprites(alpha: number): void {
    const world = this.world;
    if (!world || !this.kai) return;
    const pl = world.player;
    const x = Math.round(this.prev.x + (pl.box.x - this.prev.x) * alpha);
    const y = Math.round(this.prev.y + (pl.box.y - this.prev.y) * alpha);
    const visible = !world.respawning && (!pl.blinking || Math.floor(this.time.now / 60) % 2 === 0);
    // Co giãn quanh điểm giữa chân: hộp va chạm không đổi, chỉ hình vẽ.
    this.kai.update(
      world,
      x + pl.box.w / 2,
      y + pl.box.h,
      this.feel?.squash.x ?? 1,
      this.feel?.squash.y ?? 1,
      visible,
      world.loadout.current.kind === 'buster' ? world.loadout.chargeLevel : 0,
    );
  }

  /** Nổ tại chỗ kẻ địch vừa bị hạ (so danh sách còn sống với khung trước). */
  private enemyExplosions(world: StageWorld): void {
    for (const e of world.enemies) {
      if (e.alive) this.aliveEnemies.add(e);
      else if (this.aliveEnemies.delete(e))
        this.fx?.play('fx_explosion_small', e.box.x + e.box.w / 2, e.box.y + e.box.h / 2);
    }
  }
}
