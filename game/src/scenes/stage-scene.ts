import Phaser from 'phaser';
import { DEBUG } from '../debug/flags';
import {
  FIXED_STEP_MS,
  LOGIC_HEIGHT,
  MAX_STEPS_PER_FRAME,
  SceneKey,
  TILE_SIZE,
} from '../core/constants';
import { getBus, getConfig, getInput, getSave } from '../core/phaser-services';
import type { InputService } from '../input/input-service';
import { FixedStep } from '../logic/fixed-step';
import type { InputSnapshot } from '../logic/input/actions';
import { formatGlyphs } from '../logic/input/glyphs';
import type { TuningData } from '../logic/playtest/tuning';
import type { PlayerStateName } from '../logic/player/player-physics';
import { StageSave, stageSaveSetup } from '../logic/save/stage-save';
import { StageWorld } from '../logic/world/stage-world';
import type { WorldEvents, WorldInput } from '../logic/world/world-types';
import { buildStageLayout, STAGE_DEFS, type StageDefId } from '../stages';
import type { StageDef } from '../stages/stage-def';
import { StageHud } from './stage/stage-hud';
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
      if (snap.pressed.pause) {
        this.scene.start(SceneKey.Menu);
        return;
      }
      this.prev = { x: world.player.box.x, y: world.player.box.y };
      const ev = world.step(this.toWorldInput(snap, input));
      this.react(ev, world);
      this.saver?.step(ev, world, FIXED_STEP_MS / 1000);
      this.playtest?.record(ev, FIXED_STEP_MS / 1000);
    }
    this.updateCamera(world);
    if (this.dynamic) {
      drawDynamic(this.dynamic, world, time);
      drawMechanics(this.dynamic, world, time);
    }
    this.syncSprites(this.stepper.alpha);
    const ctx = input.glyphContext();
    this.hud?.update(world, formatGlyphs('{ĐỔI_VK}', ctx));
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
      const ctx = this.controls?.glyphContext();
      const swap = ctx ? formatGlyphs('{ĐỔI_VK}', ctx) : '';
      this.time.delayedCall(1800, () =>
        hud?.flash(`Nhận vũ khí: ${ev.weaponGranted}\n${swap} để đổi vũ khí`, 2600),
      );
    }
    if (ev.emptyWeapon) hud?.flash('Hết năng lượng vũ khí', 600);
    if (ev.enemyKilled) camera.shake(60, 0.002);
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
  }
}
