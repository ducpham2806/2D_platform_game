import type Phaser from 'phaser';
import { LOGIC_WIDTH } from '../../core/constants';
import type { DialogueInput, DialogueView } from '../../logic/dialogue/dialogue-runner';
import { MUTED_STYLE, TEXT_STYLE } from '../ui';

const DEPTH = 20;
/** Bố cục theo wireframe Dialogue.html (844 × 390) quy ra khung logic 320 × 192. */
const BOX = { x: 15, y: 123, w: 290, h: 62 };
const PORTRAIT = { x: BOX.x + 6, y: BOX.y + 6, size: 36 };
const TEXT_X = BOX.x + 49;
const TEXT_W = 190;
/** Nút to hơn tỉ lệ wireframe để dễ chạm khi canvas nhỏ (cả hộp cũng là vùng chạm Tiếp). */
const BUTTON = { x: BOX.x + BOX.w - 46, w: 40 };
/** Màu chân dung tạm theo người nói (thay bằng ảnh chân dung khi có asset nhóm P1). */
const PORTRAIT_COLORS: Readonly<Record<string, number>> = {
  nova: 0x4fd1ff,
  thorna: 0x6fcf73,
};
const DEFAULT_PORTRAIT = 0x9aa7b8;

/**
 * Hộp hội thoại (M10, P-UI-DIALOG): chân dung, tên, chữ hiện dần, nút Bỏ qua và Tiếp, tối đa
 * 4 dòng, nằm dưới màn hình. Chạm vào hộp hoặc nút Tiếp = Tiếp; nút Bỏ qua đóng cả đoạn.
 * Lớp vẽ chỉ hiện `DialogueView`; luật chạy ở `DialogueRunner` (logic thuần).
 */
export class DialogueBox {
  private readonly root: Phaser.GameObjects.GameObject[] = [];
  private readonly portrait: Phaser.GameObjects.Rectangle;
  private readonly initial: Phaser.GameObjects.Text;
  private readonly name: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly next: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private tapped: DialogueInput = { next: false, skip: false };

  constructor(scene: Phaser.Scene) {
    const box = scene.add
      .rectangle(BOX.x, BOX.y, BOX.w, BOX.h, 0x0f1724, 1)
      .setOrigin(0)
      .setStrokeStyle(1, 0x4fd1ff, 0.9)
      .setInteractive();
    box.on('pointerup', () => (this.tapped.next = true));
    this.portrait = scene.add
      .rectangle(PORTRAIT.x, PORTRAIT.y, PORTRAIT.size, PORTRAIT.size, DEFAULT_PORTRAIT)
      .setOrigin(0);
    this.initial = scene.add
      .text(PORTRAIT.x + PORTRAIT.size / 2, PORTRAIT.y + PORTRAIT.size / 2, '', {
        ...TEXT_STYLE,
        fontSize: '16px',
        color: '#0f1724',
      })
      .setOrigin(0.5);
    this.name = scene.add.text(TEXT_X, BOX.y + 4, '', {
      ...TEXT_STYLE,
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#9be7ff',
    });
    this.body = scene.add.text(TEXT_X, BOX.y + 16, '', {
      ...TEXT_STYLE,
      fontSize: '9px',
      lineSpacing: 1,
      wordWrap: { width: TEXT_W, useAdvancedWrap: true },
      maxLines: 4,
    });
    const skip = this.button(scene, BOX.y + 4, 'Bỏ qua', () => (this.tapped.skip = true));
    this.next = this.button(scene, BOX.y + BOX.h - 26, 'Tiếp >', () => (this.tapped.next = true));
    this.hint = scene.add
      .text(LOGIC_WIDTH - BOX.x, BOX.y - 2, '', { ...MUTED_STYLE, fontSize: '8px' })
      .setOrigin(1, 1);
    this.root.push(box, this.portrait, this.initial, this.name, this.body, skip, this.next);
    this.root.push(this.hint);
    for (const o of this.root) {
      const go = o as Phaser.GameObjects.GameObject &
        Phaser.GameObjects.Components.ScrollFactor &
        Phaser.GameObjects.Components.Depth;
      go.setScrollFactor(0);
      go.setDepth(DEPTH);
    }
    this.hide();
  }

  private button(
    scene: Phaser.Scene,
    y: number,
    label: string,
    onTap: () => void,
  ): Phaser.GameObjects.Text {
    const text = scene.add
      .text(BUTTON.x, y, label, {
        ...TEXT_STYLE,
        fontSize: '8px',
        backgroundColor: '#1d2a3b',
        fixedWidth: BUTTON.w,
        align: 'center',
        padding: { x: 0, y: 6 },
      })
      .setInteractive({ useHandCursor: true });
    text.on('pointerup', onTap);
    return text;
  }

  /** `hint`: dòng phím tắt (rỗng trên cảm ứng). */
  show(view: DialogueView, hint: string): void {
    this.portrait.setFillStyle(PORTRAIT_COLORS[view.speakerId] ?? DEFAULT_PORTRAIT);
    this.initial.setText(view.speaker.charAt(0).toUpperCase());
    this.name.setText(view.speaker);
    if (this.body.text !== view.text) this.body.setText(view.text);
    this.next.setText(view.full && view.index + 1 >= view.count ? 'Đóng' : 'Tiếp >');
    this.hint.setText(hint);
    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
    this.tapped = { next: false, skip: false };
  }

  /** Lần chạm từ lần gọi trước (đọc một lần mỗi bước logic). */
  consumeTaps(): DialogueInput {
    const t = this.tapped;
    this.tapped = { next: false, skip: false };
    return t;
  }

  private setVisible(visible: boolean): void {
    for (const o of this.root)
      (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(visible);
  }
}
