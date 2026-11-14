import type Phaser from 'phaser';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from '../../core/constants';
import { MenuNavigator } from '../../logic/hud/menu-cursor';
import type { InputSnapshot } from '../../logic/input/actions';
import { MUTED_STYLE, TEXT_STYLE } from '../ui';
import { GATE } from '../../debug/flags';

export type PauseChoice = 'resume' | 'quit' | 'tutorial' | 'skills';

interface Item {
  label: string;
  choice: PauseChoice | undefined;
  text?: Phaser.GameObjects.Text;
}

const DEPTH = 30;
const ITEM_W = 150;
const ITEM_GAP = 19;
/** Bản người thử (`?gate=1`) chỉ có 2 mục nên hàng cao hơn: ≥ 48 dp trên điện thoại cầm ngang. */
const ROW = GATE ? { gap: 32, padY: 10 } : { gap: ITEM_GAP, padY: 3 };
const COLOR = { idle: '#1d2a3b', picked: '#2f6d8f', off: '#151d29' };

/**
 * Menu tạm dừng (M10, wireframe Pause.html): Tiếp tục, Bật/Tắt hướng dẫn (màn có hướng dẫn), Lắp module nhanh và Tùy chọn (chưa có,
 * hiện mờ), Thoát về menu (bấm hai lần để xác nhận). Điều khiển bằng lên/xuống + Nhảy/Bắn
 * (bàn phím, tay cầm) hoặc chạm; bấm Tạm dừng lần nữa để tiếp tục.
 */
export class PauseMenu {
  private readonly root: Phaser.GameObjects.GameObject[] = [];
  private readonly items: Item[];
  private readonly nav: MenuNavigator;
  private armedQuit = false;
  private open = false;

  constructor(
    scene: Phaser.Scene,
    subtitle: string,
    private readonly onChoice: (choice: PauseChoice) => void,
    /** Màn có hướng dẫn: trả về hướng dẫn đang bật hay tắt (thêm mục Bật/Tắt hướng dẫn). */
    private readonly tutorialOn?: () => boolean,
    /** Có bản lưu và Xưởng đã mở: thêm mục Kỹ năng (áp dụng ở lần hồi sinh kế tiếp). */
    skills = false,
  ) {
    this.items = [
      { label: 'Tiếp tục', choice: 'resume' },
      ...(skills ? [{ label: 'Kỹ năng (áp khi hồi sinh)', choice: 'skills' as const }] : []),
      ...(tutorialOn ? [{ label: '', choice: 'tutorial' as const }] : []),
      // Bản cho người thử cổng Prototype ẩn các mục chưa có để khỏi rối.
      ...(GATE
        ? []
        : [
            { label: 'Lắp module nhanh (chưa có)', choice: undefined },
            { label: 'Tùy chọn (chưa có)', choice: undefined },
          ]),
      { label: 'Thoát về menu', choice: 'quit' },
    ];
    this.nav = new MenuNavigator(this.items.map((i) => i.choice !== undefined));
    const cx = LOGIC_WIDTH / 2;
    const top = 30;
    const h = 34 + this.items.length * ROW.gap + 8 + (ROW.gap - ITEM_GAP) / 2;
    const dim = scene.add.rectangle(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT, 0x05080d, 0.6).setOrigin(0);
    // Chặn chạm xuyên xuống các nút khác của scene.
    dim.setInteractive();
    const panel = scene.add
      .rectangle(cx, top, ITEM_W + 24, h, 0x121c2b, 0.95)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x2f4766);
    const title = scene.add
      .text(cx, top + 6, 'TẠM DỪNG', { ...TEXT_STYLE, fontSize: '11px' })
      .setOrigin(0.5, 0);
    const sub = scene.add
      .text(cx, top + 20, subtitle, { ...MUTED_STYLE, fontSize: '8px' })
      .setOrigin(0.5, 0);
    this.root.push(dim, panel, title, sub);
    this.items.forEach((item, i) => {
      const enabled = item.choice !== undefined;
      const text = scene.add
        .text(cx, top + 42 + (ROW.gap - ITEM_GAP) / 2 + i * ROW.gap, item.label, {
          ...(enabled ? TEXT_STYLE : MUTED_STYLE),
          fixedWidth: ITEM_W,
          align: 'center',
          padding: { x: 0, y: ROW.padY },
        })
        .setOrigin(0.5);
      if (enabled) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerup', () => {
          this.nav.cursor.select(i);
          this.activate();
        });
      }
      item.text = text;
      this.root.push(text);
    });
    for (const o of this.root) {
      const go = o as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor;
      go.setScrollFactor(0);
      (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(DEPTH);
    }
    this.setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(): void {
    this.open = true;
    this.armedQuit = false;
    this.nav.reset(0);
    this.setVisible(true);
    this.refresh();
  }

  hide(): void {
    this.open = false;
    this.setVisible(false);
  }

  /** Đọc đầu vào của một bước logic khi menu đang mở. */
  handle(snap: InputSnapshot): void {
    if (!this.open) return;
    if (snap.pressed.pause) {
      this.onChoice('resume');
      return;
    }
    const r = this.nav.handle(snap);
    if (r.moved) {
      this.armedQuit = false;
      this.refresh();
    }
    if (r.activate) this.activate();
  }

  private activate(): void {
    const choice = this.items[this.nav.index]?.choice;
    if (choice === 'quit' && !this.armedQuit) {
      this.armedQuit = true;
      this.refresh();
      return;
    }
    if (choice) this.onChoice(choice);
    if (choice === 'tutorial') this.refresh();
  }

  private refresh(): void {
    this.items.forEach((item, i) => {
      const t = item.text;
      if (!t) return;
      const enabled = item.choice !== undefined;
      t.setBackgroundColor(!enabled ? COLOR.off : i === this.nav.index ? COLOR.picked : COLOR.idle);
      if (item.choice === 'quit') t.setText(this.armedQuit ? 'Bấm lần nữa để thoát' : item.label);
      if (item.choice === 'tutorial')
        t.setText(this.tutorialOn?.() ? 'Tắt hướng dẫn' : 'Bật hướng dẫn');
    });
  }

  private setVisible(visible: boolean): void {
    for (const o of this.root)
      (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(visible);
  }
}
