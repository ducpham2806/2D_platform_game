import Phaser from 'phaser';
import {
  FIXED_STEP_MS,
  LOGIC_HEIGHT,
  MAX_STEPS_PER_FRAME,
  SceneKey,
  TILE_SIZE,
} from '../core/constants';
import { getBus, getConfig, getInput } from '../core/phaser-services';
import type { InputService } from '../input/input-service';
import { FixedStep } from '../logic/fixed-step';
import { formatGlyphs } from '../logic/input/glyphs';
import { PlayerPhysics, type PlayerStateName } from '../logic/player/player-physics';
import { playerParams } from '../logic/player/player-params';
import { Tile, TileMap } from '../logic/tilemap';
import { GRAY_BOX_ROWS } from '../stages/gray-box';
import { MUTED_STYLE, TEXT_STYLE } from './ui';

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

/** Máu tạm của Kai ở màn thử; máu theo cấp thuộc M8. */
const TEST_MAX_HP = 100;
/** Kéo cần xuống quá mức này thì tính là giữ Xuống (để rơi xuyên bục trên cảm ứng). */
const DOWN_AXIS_THRESHOLD = 0.5;
/** Sát thương thử khi bấm phím T (chỉ bản dev), để xem bật lùi và bất tử. */
const DEBUG_HIT_DAMAGE = 10;

/**
 * Màn xám Prototype: Kai (khối giữ chỗ có màu theo trạng thái) chạy, nhảy biến thiên,
 * lướt, bám và nhảy tường trên lưới ô, theo đúng player.json. Logic chạy bước cố định
 * 60 Hz; hình vẽ nội suy giữa hai bước nên vẫn mượt trên màn hình 90/120 Hz.
 */
export class StageScene extends Phaser.Scene {
  private readonly stepper = new FixedStep(FIXED_STEP_MS, MAX_STEPS_PER_FRAME);
  private controls?: InputService;
  private player?: PlayerPhysics;
  private map?: TileMap;
  private kai?: Phaser.GameObjects.Rectangle;
  private eye?: Phaser.GameObjects.Rectangle;
  private info?: Phaser.GameObjects.Text;
  private hint?: Phaser.GameObjects.Text;
  private prev = { x: 0, y: 0 };
  private respawning = false;
  private deaths = 0;

  constructor() {
    super(SceneKey.Stage);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Stage });
    const config = getConfig(this);
    this.stepper.reset();
    this.respawning = false;
    this.deaths = 0;

    const map = TileMap.fromRows(GRAY_BOX_ROWS, TILE_SIZE);
    const spawn = map.spawn ?? { x: TILE_SIZE * 2, y: map.heightPx - TILE_SIZE };
    this.map = map;
    this.drawMap(map);
    const params = playerParams(config.player, TILE_SIZE, FIXED_STEP_MS / 1000);
    this.player = new PlayerPhysics(params, map, spawn.x, spawn.y, TEST_MAX_HP);
    this.prev = { x: this.player.box.x, y: this.player.box.y };

    this.kai = this.add
      .rectangle(0, 0, params.width, params.height, STATE_COLORS.idle)
      .setOrigin(0, 0);
    this.eye = this.add.rectangle(0, 0, 3, 3, 0x0f1724).setOrigin(0, 0);
    this.syncSprites(0);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthPx, map.heightPx);
    camera.startFollow(this.kai, true, 0.2, 0.2);
    camera.setDeadzone(48, LOGIC_HEIGHT);

    this.add.text(20, 4, 'Màn xám', TEXT_STYLE).setScrollFactor(0);
    this.info = this.add.text(20, 18, '', MUTED_STYLE).setScrollFactor(0);
    // Gợi ý phím: một dòng nhỏ dưới thông tin, tự mờ sau vài giây để không che tầm nhìn.
    this.hint = this.add
      .text(20, 31, '', { ...MUTED_STYLE, fontSize: '8px', color: '#c5d0de' })
      .setScrollFactor(0);
    this.tweens.add({ targets: this.hint, alpha: 0.25, delay: 6000, duration: 800 });

    const input = getInput(this);
    this.controls = input;
    input.setGameplayActive(true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => input.setGameplayActive(false));
    if (import.meta.env.DEV) {
      this.input.keyboard?.on('keydown-T', () => {
        const pl = this.player;
        if (pl) pl.applyHit(DEBUG_HIT_DAMAGE, pl.centerX + pl.facing * 8);
      });
    }
  }

  override update(_time: number, delta: number): void {
    const input = this.controls;
    const pl = this.player;
    if (!input || !pl) return;
    const steps = this.stepper.advance(delta);
    for (let i = 0; i < steps; i += 1) {
      const snap = input.step();
      if (snap.pressed.pause) {
        this.scene.start(SceneKey.Menu);
        return;
      }
      this.prev = { x: pl.box.x, y: pl.box.y };
      const events = pl.step(
        {
          moveX: snap.moveX,
          jumpPressed: snap.pressed.jump,
          jumpHeld: snap.held.jump,
          dashPressed: snap.pressed.dash,
          // Cần ảo/cần tay cầm là trục analog: kéo xuống quá nửa cũng tính là "xuống".
          downHeld: snap.held.down || snap.moveY > DOWN_AXIS_THRESHOLD,
        },
        FIXED_STEP_MS / 1000,
      );
      if (events.fellOut || events.died) this.scheduleRespawn(events.fellOut ? 0 : 1000);
    }
    this.syncSprites(this.stepper.alpha);
    this.info?.setText(
      `${pl.state}  HP ${pl.hp}/${pl.maxHp}  chết ${this.deaths}  ·  FPS ${Math.round(this.game.loop.actualFps)}`,
    );
    this.hint?.setText(
      formatGlyphs(
        '{DI_CHUYỂN} · nhảy {NHẢY} · lướt {LƯỚT} · xuống + nhảy: xuyên bục · {TẠM_DỪNG}',
        input.glyphContext(),
      ),
    );
  }

  private scheduleRespawn(delayMs: number): void {
    if (this.respawning) return;
    this.respawning = true;
    this.deaths += 1;
    this.time.delayedCall(delayMs, () => {
      const pl = this.player;
      const spawn = this.map?.spawn;
      if (pl && spawn) {
        pl.respawn(spawn.x, spawn.y);
        this.prev = { x: pl.box.x, y: pl.box.y };
      }
      this.respawning = false;
    });
  }

  /** Vẽ Kai ở vị trí nội suy giữa bước trước và bước hiện tại. */
  private syncSprites(alpha: number): void {
    const pl = this.player;
    if (!pl || !this.kai || !this.eye) return;
    const x = this.prev.x + (pl.box.x - this.prev.x) * alpha;
    const y = this.prev.y + (pl.box.y - this.prev.y) * alpha;
    this.kai.setPosition(Math.round(x), Math.round(y));
    this.kai.setFillStyle(STATE_COLORS[pl.state]);
    // Nhấp nháy khi còn bất tử sau khi bị đánh.
    this.kai.setVisible(!pl.blinking || Math.floor(this.time.now / 60) % 2 === 0);
    const eyeX = pl.facing > 0 ? pl.box.w - 5 : 2;
    this.eye.setPosition(Math.round(x) + eyeX, Math.round(y) + 5).setVisible(this.kai.visible);
  }

  private drawMap(map: TileMap): void {
    const g = this.add.graphics();
    g.fillStyle(0x0f1724, 1).fillRect(0, 0, map.widthPx, map.heightPx);
    g.lineStyle(1, 0x172234, 1);
    for (let c = 0; c <= map.cols; c += 1)
      g.lineBetween(c * TILE_SIZE, 0, c * TILE_SIZE, map.heightPx);
    for (let r = 0; r <= map.rows; r += 1)
      g.lineBetween(0, r * TILE_SIZE, map.widthPx, r * TILE_SIZE);
    for (let r = 0; r < map.rows; r += 1) {
      for (let c = 0; c < map.cols; c += 1) {
        const tile = map.get(c, r);
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        if (tile === Tile.Solid) {
          g.fillStyle(0x4a5568, 1).fillRect(x, y, TILE_SIZE, TILE_SIZE);
          if (map.get(c, r - 1) !== Tile.Solid)
            g.fillStyle(0x8193ad, 1).fillRect(x, y, TILE_SIZE, 2);
        } else if (tile === Tile.OneWay) {
          g.fillStyle(0x8fa3bf, 1).fillRect(x, y, TILE_SIZE, 4);
        }
      }
    }
  }
}
