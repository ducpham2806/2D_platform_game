import Phaser from 'phaser';
import { LOGIC_WIDTH } from '../../core/constants';
import { NOVA_SPEAKER } from '../../logic/dialogue/boss-dialogue';
import type { DialogueLine } from '../../logic/dialogue/dialogue-player';
import { MUTED_STYLE, TEXT_STYLE } from '../ui';

const DEPTH = 20;
const MARGIN = 6;
/** Dưới hàng HUD (máu, máu boss), để không che nhân vật và boss đứng trên sàn. */
const TOP = 30;
const PANEL_H = 54;
const PORTRAIT = 30;
const PAD = 6;
const NOVA_COLOR = 0x4fd1ff;
const WARDEN_COLOR = 0x7bd88f;
/** Chân dung theo tên người nói; Warden chưa có hình riêng dùng chân dung chung. */
const PORTRAIT_BY_SPEAKER: Readonly<Record<string, string>> = {
  [NOVA_SPEAKER]: 'portrait_nova',
  Thorna: 'portrait_thorna',
  Kai: 'portrait_kai',
};
/** Chữ "Tiếp >" nhấp nháy khi câu đã hiện hết. */
const BLINK_MS = 400;

export interface DialogueLabels {
  next: string;
  skip: string;
}

/**
 * Hộp hội thoại (P-UI-DIALOG, wireframe Dialogue.html; đặt phía trên vì sàn đấu ở cạnh dưới): chân dung 30x30, tên người nói, câu thoại hiện dần, nút Bỏ qua và Tiếp.
 * Chạm bất kỳ đâu trên màn hình (kể cả viền đen ngoài khung game) = Tiếp; chạm nút Bỏ qua =
 * bỏ qua. Trạng thái hội thoại nằm ở DialoguePlayer;
 * lớp này chỉ vẽ và ghi nhận cú chạm.
 */
export class DialogueBox {
  private readonly root: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible)[];
  private readonly portrait: Phaser.GameObjects.Rectangle;
  private readonly face: Phaser.GameObjects.Image;
  private readonly name: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly next: Phaser.GameObjects.Text;
  private readonly skip: Phaser.GameObjects.Text;
  /** Câu đang hiện, đã ngắt dòng sẵn để chữ không nhảy dòng khi đang gõ. */
  private wrapped = '';
  private source: DialogueLine | undefined;
  private tapped = { advance: false, skip: false };
  private listening = false;
  private readonly onPointerUp = (): void => {
    this.tapped.advance = true;
  };

  constructor(private readonly scene: Phaser.Scene) {
    const top = TOP;
    const width = LOGIC_WIDTH - MARGIN * 2;
    const textX = MARGIN + PAD + PORTRAIT + PAD;
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.listen(false));
    const panel = scene.add
      .rectangle(MARGIN, top, width, PANEL_H, 0x0f1724, 0.94)
      .setOrigin(0)
      .setStrokeStyle(1, NOVA_COLOR, 0.9);
    this.portrait = scene.add
      .rectangle(MARGIN + PAD, top + PAD, PORTRAIT, PORTRAIT, NOVA_COLOR)
      .setOrigin(0);
    this.face = scene.add.image(MARGIN + PAD, top + PAD, 'portrait_nova').setOrigin(0);
    this.name = scene.add.text(textX, top + 4, '', {
      ...TEXT_STYLE,
      fontSize: '9px',
      color: '#ffd166',
    });
    this.body = scene.add.text(textX, top + 16, '', {
      ...TEXT_STYLE,
      fontSize: '9px',
      lineSpacing: 1,
      wordWrap: { width: MARGIN + width - PAD - textX, useAdvancedWrap: true },
    });
    this.skip = scene.add
      .text(MARGIN + width - 3, top + 3, '', {
        ...MUTED_STYLE,
        fontSize: '8px',
        backgroundColor: '#1d2a3b',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    this.skip.on('pointerup', () => (this.tapped.skip = true));
    this.next = scene.add
      .text(MARGIN + width - 4, top + PANEL_H - 3, '', { ...TEXT_STYLE, fontSize: '8px' })
      .setOrigin(1, 1);
    this.root = [panel, this.portrait, this.face, this.name, this.body, this.skip, this.next];
    for (const o of this.root) {
      (o as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor(0);
      (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(DEPTH);
    }
    this.hide();
  }

  /** `visibleChars`: số ký tự đã lộ; `complete`: câu đã hiện hết (hiện chữ Tiếp). */
  show(line: DialogueLine, visibleChars: number, complete: boolean, labels: DialogueLabels): void {
    if (line !== this.source) {
      this.source = line;
      this.wrapped = this.body.getWrappedText(line.text).join('\n');
      const nova = line.speaker === NOVA_SPEAKER;
      this.portrait.setFillStyle(nova ? NOVA_COLOR : WARDEN_COLOR);
      this.face.setTexture(PORTRAIT_BY_SPEAKER[line.speaker] ?? 'portrait_warden');
      this.name.setText(line.speaker);
    }
    this.body.setText(complete ? this.wrapped : this.wrapped.slice(0, visibleChars));
    this.skip.setText(labels.skip);
    this.next.setText(labels.next);
    if (!this.listening) {
      for (const o of this.root) o.setVisible(true);
      this.skip.setInteractive({ useHandCursor: true });
      this.listen(true);
    }
    this.next.setVisible(complete && Math.floor(this.scene.time.now / BLINK_MS) % 2 === 0);
  }

  hide(): void {
    this.source = undefined;
    for (const o of this.root) o.setVisible(false);
    this.skip.disableInteractive();
    this.listen(false);
  }

  /** Nghe cú chạm/bấm chuột trên cả trang khi hộp đang hiện (vùng viền đen nằm ngoài canvas). */
  private listen(on: boolean): void {
    if (on === this.listening) return;
    this.listening = on;
    if (on) window.addEventListener('pointerup', this.onPointerUp);
    else window.removeEventListener('pointerup', this.onPointerUp);
  }

  /** Cú chạm từ lần gọi trước (đọc xong thì xóa). */
  takeInput(): { advance: boolean; skip: boolean } {
    const t = this.tapped;
    this.tapped = { advance: false, skip: false };
    return t;
  }
}
