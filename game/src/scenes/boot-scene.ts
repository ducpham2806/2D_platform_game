import Phaser from 'phaser';
import { SceneKey } from '../core/constants';
import { installBus } from '../core/phaser-services';
import { installIntegerScaling } from '../core/phaser-scale';

/** Khởi tạo dịch vụ dùng chung (event bus, scale) rồi chuyển sang Preload. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    const bus = installBus(this.game);
    const uninstall = installIntegerScaling(this.game, bus);
    this.game.events.once(Phaser.Core.Events.DESTROY, uninstall);
    this.scene.start(SceneKey.Preload);
  }
}
