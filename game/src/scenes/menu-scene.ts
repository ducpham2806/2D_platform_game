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
      .text(cx, 32, 'CYBER VANGUARD', { ...TEXT_STYLE, fontSize: '16px', color: '#4fd1ff' })
      .setOrigin(0.5);
    this.add.text(cx, 50, 'bản Prototype', MUTED_STYLE).setOrigin(0.5);

    textButton(this, cx, 78, 'Vào màn thử', () => this.scene.start(SceneKey.Stage));
    textButton(this, cx, 100, 'Hub Arkon', () => this.scene.start(SceneKey.Hub));
    textButton(this, cx, 122, 'Điều khiển', () => this.scene.start(SceneKey.Controls));
    textButton(this, cx, 144, 'Kết quả chơi thử', () => this.scene.start(SceneKey.Playtest));
    this.add
      .text(cx, 176, 'Enter: vào màn  ·  H: Hub  ·  C: Điều khiển  ·  R: Kết quả', MUTED_STYLE)
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ENTER', () => this.scene.start(SceneKey.Stage));
    keyboard?.once('keydown-H', () => this.scene.start(SceneKey.Hub));
    keyboard?.once('keydown-C', () => this.scene.start(SceneKey.Controls));
    keyboard?.once('keydown-R', () => this.scene.start(SceneKey.Playtest));
  }
}
