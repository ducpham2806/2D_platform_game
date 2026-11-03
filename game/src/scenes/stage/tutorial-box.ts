import type Phaser from 'phaser';
import { LOGIC_WIDTH } from '../../core/constants';
import { TEXT_STYLE } from '../ui';

const WIDTH = 196;
const TOP = 26;
const DEPTH = 12;

/**
 * Hộp lời thoại hướng dẫn (P-TUT-02, bản cơ bản): tên người nói và tối đa 2 dòng, giữa trên,
 * dưới thanh máu boss, không che vùng giữa màn hình. Gợi ý bậc cao hơn đổi viền sang vàng.
 * Không khóa điều khiển.
 */
export class TutorialBox {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private shown = '';

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add
      .rectangle(LOGIC_WIDTH / 2, TOP, WIDTH + 8, 10, 0x0f1724, 0.88)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.text = scene.add
      .text(LOGIC_WIDTH / 2, TOP + 3, '', {
        ...TEXT_STYLE,
        fontSize: '9px',
        align: 'center',
        wordWrap: { width: WIDTH, useAdvancedWrap: true },
        lineSpacing: 1,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.hide();
  }

  /** `text` đã thay biểu tượng nút; `hint`: đang ở bậc gợi ý (viền vàng). */
  show(speaker: string, text: string, hint: boolean): void {
    const full = `${speaker}: ${text}`;
    if (full !== this.shown) {
      this.shown = full;
      this.text.setText(full);
      this.bg.setSize(WIDTH + 8, this.text.height + 6);
    }
    this.bg.setStrokeStyle(1, hint ? 0xffd166 : 0x4fd1ff, 0.9);
    this.bg.setVisible(true);
    this.text.setVisible(true);
  }

  hide(): void {
    this.shown = '';
    this.bg.setVisible(false);
    this.text.setVisible(false);
  }
}
