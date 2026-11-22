import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus, getConfig, getInput, getSave } from '../core/phaser-services';
import { WorkshopPanel } from '../workshop/workshop-panel';
import { TEXT_STYLE } from './ui';
import { getTelemetry } from './telemetry/telemetry-service';

/** Xưởng Lắp Ráp mở từ menu hoặc màn Kết quả (M8, ADR-001): bảng HTML phủ lên canvas. */
export class WorkshopScene extends Phaser.Scene {
  private panel: WorkshopPanel | undefined;

  constructor() {
    super(SceneKey.Workshop);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Workshop });
    this.add
      .text(LOGIC_WIDTH / 2, 12, 'XƯỞNG LẮP RÁP', { ...TEXT_STYLE, fontSize: '12px' })
      .setOrigin(0.5);
    // Chạm và gõ phím trong bảng HTML không được lọt xuống canvas.
    this.input.enabled = false;
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    const input = getInput(this);
    input.setGameplayActive(false);
    this.panel = new WorkshopPanel(getSave(this), getConfig(this), {
      onClose: () => this.scene.start(SceneKey.Menu),
      onTelemetry: (name, props) => getTelemetry(this)?.log(name, props),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.panel?.destroy();
      this.panel = undefined;
    });
  }

  override update(): void {
    this.panel?.handle(getInput(this).step());
  }
}
