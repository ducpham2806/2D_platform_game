import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus } from '../core/phaser-services';
import { MUTED_STYLE, TEXT_STYLE, textButton } from './ui';

/** Màn hình chính tạm thời (wireframe Main). Không đăng nhập, không quảng cáo. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Menu);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Menu });
    const cx = LOGIC_WIDTH / 2;
    this.add
      .text(cx, 40, 'CYBER VANGUARD', { ...TEXT_STYLE, fontSize: '16px', color: '#4fd1ff' })
      .setOrigin(0.5);
    this.add.text(cx, 60, 'bản khung (Sprint 1)', MUTED_STYLE).setOrigin(0.5);

    textButton(this, cx, 96, 'Vào màn thử', () => this.scene.start(SceneKey.Stage));
    textButton(this, cx, 118, 'Hub Arkon', () => this.scene.start(SceneKey.Hub));
    textButton(this, cx, 140, 'Điều khiển', () => this.scene.start(SceneKey.Controls));
    this.add
      .text(cx, 174, 'Enter: vào màn  ·  H: Hub  ·  C: Điều khiển', MUTED_STYLE)
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ENTER', () => this.scene.start(SceneKey.Stage));
    keyboard?.once('keydown-H', () => this.scene.start(SceneKey.Hub));
    keyboard?.once('keydown-C', () => this.scene.start(SceneKey.Controls));
  }
}
