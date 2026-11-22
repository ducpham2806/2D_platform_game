import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus, getConfig, getInput, getSave } from '../core/phaser-services';
import { ShopPanel } from '../shop/shop-panel';
import { TEXT_STYLE } from './ui';
import { getTelemetry } from './telemetry/telemetry-service';

/** Quầy Mira mở từ menu (M9, MVP chưa có Hub; ADR-001): bảng HTML phủ lên canvas. */
export class ShopScene extends Phaser.Scene {
  private panel: ShopPanel | undefined;

  constructor() {
    super(SceneKey.Shop);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Shop });
    this.add
      .text(LOGIC_WIDTH / 2, 12, 'QUẦY MIRA', { ...TEXT_STYLE, fontSize: '12px' })
      .setOrigin(0.5);
    // Chạm và gõ phím trong bảng HTML không được lọt xuống canvas.
    this.input.enabled = false;
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    getInput(this).setGameplayActive(false);
    this.panel = new ShopPanel(getSave(this), getConfig(this), {
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
