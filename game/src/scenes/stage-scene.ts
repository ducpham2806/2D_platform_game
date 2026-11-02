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
import { getBus, getConfig, getInput } from '../core/phaser-services';
import type { InputService } from '../input/input-service';
import { ACTIONS, type Action, type InputSnapshot } from '../logic/input/actions';
import { FixedStep } from '../logic/fixed-step';
import { formatGlyphs } from '../logic/input/glyphs';
import { MUTED_STYLE, TEXT_STYLE } from './ui';

const DEBUG_ACTIONS: readonly Action[] = ACTIONS.filter(
  (a) => !['up', 'down', 'left', 'right'].includes(a),
);
const SHORT: Readonly<Partial<Record<Action, string>>> = {
  jump: 'NHẢY',
  shoot: 'BẮN',
  dash: 'LƯỚT',
  swapPrev: 'VK<',
  swapNext: 'VK>',
  pause: 'II',
  interact: 'TT',
};

/**
 * Màn xám thử khung game và đầu vào: lưới 20×12 ô, khối giữ chỗ cho Kai chạy ngang theo
 * moveX (phím, tay cầm hoặc cần ảo) với tốc độ đọc từ player.json, cập nhật bước cố định 60 Hz.
 * Dải dưới cùng hiện các hành động đang giữ / vừa bấm để kiểm tra đầu vào. Vật lý thật thuộc M3.
 */
export class StageScene extends Phaser.Scene {
  private readonly stepper = new FixedStep(FIXED_STEP_MS, MAX_STEPS_PER_FRAME);
  private controls?: InputService;
  private kai?: Phaser.GameObjects.Rectangle;
  private info?: Phaser.GameObjects.Text;
  private hint?: Phaser.GameObjects.Text;
  private readonly lamps = new Map<Action, Phaser.GameObjects.Text>();
  private readonly flash = new Map<Action, number>();
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

    this.add.text(20, 4, `Stage ${stage?.index ?? '?'}: ${stage?.name ?? '?'}`, TEXT_STYLE);
    this.info = this.add.text(20, 18, '', MUTED_STYLE);
    this.hint = this.add.text(LOGIC_WIDTH - 20, 4, '', MUTED_STYLE).setOrigin(1, 0);
    DEBUG_ACTIONS.forEach((action, i) => {
      const lamp = this.add
        .text(22 + i * 40, LOGIC_HEIGHT - TILE_SIZE + 3, SHORT[action] ?? action, {
          ...MUTED_STYLE,
          fontSize: '8px',
        })
        .setOrigin(0, 0);
      this.lamps.set(action, lamp);
    });

    const input = getInput(this);
    this.controls = input;
    input.setGameplayActive(true);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => input.setGameplayActive(false));
  }

  override update(_time: number, delta: number): void {
    const input = this.controls;
    if (!input) return;
    const steps = this.stepper.advance(delta);
    for (let i = 0; i < steps; i += 1) {
      const snapshot = input.step();
      if (snapshot.pressed.pause) {
        this.scene.start(SceneKey.Menu);
        return;
      }
      this.step(snapshot);
    }
    this.info?.setText(
      `FPS ${Math.round(this.game.loop.actualFps)} · bước ${this.stepper.totalSteps}`,
    );
    this.hint?.setText(formatGlyphs('{DI_CHUYỂN} · {TẠM_DỪNG}', input.glyphContext()));
  }

  /** Một bước logic 1/60 giây. */
  private step(snapshot: InputSnapshot): void {
    if (!this.kai) return;
    const half = this.kai.width / 2;
    this.kai.x = Phaser.Math.Clamp(
      this.kai.x + snapshot.moveX * this.speedPxPerStep,
      TILE_SIZE + half,
      LOGIC_WIDTH - TILE_SIZE - half,
    );
    for (const action of DEBUG_ACTIONS) {
      if (snapshot.pressed[action]) this.flash.set(action, 12);
      const remaining = this.flash.get(action) ?? 0;
      if (remaining > 0) this.flash.set(action, remaining - 1);
      const lamp = this.lamps.get(action);
      const color = snapshot.held[action] ? '#4fd1ff' : remaining > 0 ? '#ffd166' : '#5a6577';
      lamp?.setColor(color);
    }
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
    g.fillStyle(0x2a3344, 1).fillRect(
      TILE_SIZE,
      LOGIC_HEIGHT - TILE_SIZE,
      LOGIC_WIDTH - TILE_SIZE * 2,
      TILE_SIZE,
    );
  }
}
