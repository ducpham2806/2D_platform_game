import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus } from '../core/phaser-services';
import { MUTED_STYLE, TEXT_STYLE, textButton } from './ui';

/** Hub Arkon dạng menu (MVP). Các khu sẽ mở dần theo 07-Kich-ban-huong-dan.md mục 2. */
export class HubScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Hub);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Hub });
    const cx = LOGIC_WIDTH / 2;
    this.add.text(cx, 20, 'HUB ARKON', { ...TEXT_STYLE, fontSize: '14px' }).setOrigin(0.5);
    this.add.text(cx, 38, 'Khung tạm: chỉ Cổng Chiến dịch mở', MUTED_STYLE).setOrigin(0.5);

    textButton(this, cx, 80, 'Cổng Chiến dịch', () => this.scene.start(SceneKey.Stage));
    ['Xưởng (sau boss 1)', 'Shop (sau boss 2)', 'Nhiệm vụ (sau boss 3)'].forEach((label, i) => {
      this.add.text(cx, 108 + i * 16, label, MUTED_STYLE).setOrigin(0.5);
    });
    this.add.text(cx, 176, 'Esc: về màn hình chính', MUTED_STYLE).setOrigin(0.5);
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(SceneKey.Menu));
  }
}
