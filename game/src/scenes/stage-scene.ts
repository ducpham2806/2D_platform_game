import Phaser from 'phaser';
import {
  FIXED_STEP_MS,
  LOGIC_HEIGHT,
  LOGIC_WIDTH,
  MAX_STEPS_PER_FRAME,
  SceneKey,
  TILE_SIZE,
  TILES_X,
  TILES_Y,
} from '../core/constants';
import { getBus, getConfig } from '../core/phaser-services';
import { FixedStep } from '../logic/fixed-step';
import { MUTED_STYLE, TEXT_STYLE } from './ui';

/**
 * Màn xám thử khung game: lưới 20×12 ô, khối giữ chỗ cho Kai chạy ngang với tốc độ đọc
 * từ player.json, cập nhật theo bước cố định 60 Hz. Vật lý thật thuộc M3.
 */
export class StageScene extends Phaser.Scene {
  private readonly stepper = new FixedStep(FIXED_STEP_MS, MAX_STEPS_PER_FRAME);
  private kai?: Phaser.GameObjects.Rectangle;
  private info?: Phaser.GameObjects.Text;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: { a: Phaser.Input.Keyboard.Key; d: Phaser.Input.Keyboard.Key };
  private speedPxPerStep = 0;

  constructor() {
    super(SceneKey.Stage);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Stage });
    const config = getConfig(this);
    const stage = config.stages.stages[0];
    this.stepper.reset();
    this.speedPxPerStep = (config.player.speedTilesPerSec * TILE_SIZE * FIXED_STEP_MS) / 1000;

    this.drawRoom();
    this.kai = this.add.rectangle(TILE_SIZE * 3, LOGIC_HEIGHT - TILE_SIZE, 12, 24, 0x4fd1ff);
    this.kai.setOrigin(0.5, 1);

    this.add.text(4, 4, `Stage ${stage?.index ?? '?'}: ${stage?.name ?? '?'}`, TEXT_STYLE);
    this.info = this.add.text(4, 18, '', MUTED_STYLE);
    this.add.text(LOGIC_WIDTH - 4, 4, '←/→ hoặc A/D · Esc', MUTED_STYLE).setOrigin(1, 0);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.keys = {
        a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      keyboard.once('keydown-ESC', () => this.scene.start(SceneKey.Menu));
    }
  }

  override update(_time: number, delta: number): void {
    const steps = this.stepper.advance(delta);
    for (let i = 0; i < steps; i += 1) this.step();
    this.info?.setText(
      `FPS ${Math.round(this.game.loop.actualFps)} · bước ${this.stepper.totalSteps}`,
    );
  }

  /** Một bước logic 1/60 giây. */
  private step(): void {
    if (!this.kai) return;
    const left = Boolean(this.cursors?.left.isDown || this.keys?.a.isDown);
    const right = Boolean(this.cursors?.right.isDown || this.keys?.d.isDown);
    const dir = Number(right) - Number(left);
    const half = this.kai.width / 2;
    this.kai.x = Phaser.Math.Clamp(
      this.kai.x + dir * this.speedPxPerStep,
      TILE_SIZE + half,
      LOGIC_WIDTH - TILE_SIZE - half,
    );
  }

  private drawRoom(): void {
    const g = this.add.graphics();
    g.fillStyle(0x0f1724, 1).fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
    g.lineStyle(1, 0x1b2638, 1);
    for (let x = 0; x <= TILES_X; x += 1)
      g.lineBetween(x * TILE_SIZE, 0, x * TILE_SIZE, LOGIC_HEIGHT);
    for (let y = 0; y <= TILES_Y; y += 1)
      g.lineBetween(0, y * TILE_SIZE, LOGIC_WIDTH, y * TILE_SIZE);
    g.fillStyle(0x5a6577, 1);
    g.fillRect(0, LOGIC_HEIGHT - TILE_SIZE, LOGIC_WIDTH, TILE_SIZE); // sàn
    g.fillRect(0, 0, TILE_SIZE, LOGIC_HEIGHT); // tường trái
    g.fillRect(LOGIC_WIDTH - TILE_SIZE, 0, TILE_SIZE, LOGIC_HEIGHT); // tường phải
  }
}
