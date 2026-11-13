import type Phaser from 'phaser';
import { LOGIC_WIDTH } from '../../core/constants';
import { NinePanel, TEXT_STYLE } from '../ui';

const WIDTH = 196;
const TOP = 26;
const DEPTH = 12;

/**
 * Hộp lời thoại hướng dẫn (P-TUT-02, bản cơ bản): tên người nói và tối đa 2 dòng, giữa trên,
 * dưới thanh máu boss, không che vùng giữa màn hình. Gợi ý bậc cao hơn đổi viền sang vàng.
 * Không khóa điều khiển.
 */
export class TutorialBox {
  private readonly bg: NinePanel;
  /** Vạch vàng trên mép hộp khi đang ở bậc gợi ý. */
  private readonly hintMark: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private shown = '';

  constructor(scene: Phaser.Scene) {
    this.bg = new NinePanel(scene, LOGIC_WIDTH / 2 - (WIDTH + 12) / 2, TOP, WIDTH + 12, 16);
    this.bg.container.setScrollFactor(0).setDepth(DEPTH);
    this.hintMark = scene.add
      .rectangle(LOGIC_WIDTH / 2, TOP, WIDTH + 12, 1, 0xffc857)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.text = scene.add
      .text(LOGIC_WIDTH / 2, TOP + 4, '', {
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
      this.bg.resize(WIDTH + 12, this.text.height + 8);
    }
    this.hintMark.setVisible(hint);
    this.bg.container.setVisible(true);
    this.text.setVisible(true);
  }

  hide(): void {
    this.shown = '';
    this.bg.container.setVisible(false);
    this.hintMark.setVisible(false);
    this.text.setVisible(false);
  }
}
