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
      .text(cx, 28, 'CYBER VANGUARD', { ...TEXT_STYLE, fontSize: '16px', color: '#4fd1ff' })
      .setOrigin(0.5);
    this.add.text(cx, 44, 'bản Prototype', MUTED_STYLE).setOrigin(0.5);

    const enemies = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'enemies' });
    };
    const mechanics = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'mechanics' });
    };
    const thorna = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'thorna' });
    };
    const golem = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'golem' });
    };
    textButton(this, cx, 58, 'Vào màn thử', () => this.scene.start(SceneKey.Stage));
    textButton(this, cx, 73, 'Phòng thử kẻ địch', enemies);
    textButton(this, cx, 88, 'Phòng thử màn chơi', mechanics);
    textButton(this, cx, 103, 'Boss Thorna', thorna);
    textButton(this, cx, 118, 'Mini-boss Bramble Golem', golem);
    textButton(this, cx, 133, 'Hub Arkon', () => this.scene.start(SceneKey.Hub));
    textButton(this, cx, 148, 'Điều khiển', () => this.scene.start(SceneKey.Controls));
    textButton(this, cx, 163, 'Kết quả chơi thử', () => this.scene.start(SceneKey.Playtest));
    this.add
      .text(
        cx,
        182,
        'Enter: màn thử · K: kẻ địch · M: màn chơi · B: Thorna · G: Golem · H: Hub · C · R',
        {
          ...MUTED_STYLE,
          fontSize: '8px',
        },
      )
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ENTER', () => this.scene.start(SceneKey.Stage));
    keyboard?.once('keydown-H', () => this.scene.start(SceneKey.Hub));
    keyboard?.once('keydown-C', () => this.scene.start(SceneKey.Controls));
    keyboard?.once('keydown-R', () => this.scene.start(SceneKey.Playtest));
    keyboard?.once('keydown-K', enemies);
    keyboard?.once('keydown-M', mechanics);
    keyboard?.once('keydown-B', thorna);
    keyboard?.once('keydown-G', golem);
  }
}
