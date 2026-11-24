import { LUMEN_QA } from '../../debug/flags';
import type Phaser from 'phaser';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from '../../core/constants';
import { MenuNavigator } from '../../logic/hud/menu-cursor';
import type { InputSnapshot } from '../../logic/input/actions';
import type { StageResultView } from '../../logic/result/stage-result';
import { MUTED_STYLE, TEXT_STYLE } from '../ui';

export type ResultChoice = 'retry' | 'workshop' | 'menu';

const DEPTH = 40;
const PAD = 6;
const BAR_H = 22;
const PANEL = { y: 28, h: 112, w: 151, gap: 6 };
const ROW_Y = 48;
const ROW_GAP = 20;
const BUTTON = { y: 180, w: 96 };
const COLOR = { idle: '#1d2a3b', picked: '#2f6d8f', off: '#151d29' };

/**
 * Màn Kết quả (M10, wireframe Result.html) phủ lên màn chơi: thanh trên (tên màn, tổng Core
 * Bit), cột Kết quả, cột Phần thưởng và thu thập, dòng nhắc hướng dẫn còn dở, ba nút Chơi lại
 * màn / Mở Xưởng (mờ khi Xưởng chưa mở hoặc hết SP) / Về menu. Chọn bằng trái/phải + Nhảy/Bắn hoặc chạm.
 */
export class ResultPanel {
  private readonly root: Phaser.GameObjects.GameObject[] = [];
  private readonly buttons: { text: Phaser.GameObjects.Text; choice: ResultChoice | undefined }[] =
    [];
  private readonly nav: MenuNavigator;
  private open = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onChoice: (choice: ResultChoice) => void,
    /** Xưởng đã mở và còn SP: nút "Mở Xưởng" bấm được (nếu không thì hiện mờ). */
    workshop = false,
  ) {
    const defs: { label: string; choice: ResultChoice | undefined }[] = [
      { label: 'Chơi lại màn', choice: 'retry' },
      ...(!LUMEN_QA
        ? [
            workshop
              ? { label: 'Mở Xưởng', choice: 'workshop' as const }
              : { label: 'Mở Xưởng (không có SP)', choice: undefined },
            { label: 'Về menu', choice: 'menu' as const },
          ]
        : []),
    ];
    this.nav = new MenuNavigator(
      defs.map((d) => d.choice !== undefined),
      'x',
    );
    const step = (LOGIC_WIDTH - 2 * PAD - BUTTON.w) / Math.max(1, defs.length - 1);
    defs.forEach((d, i) => {
      const text = scene.add
        .text(LUMEN_QA ? LOGIC_WIDTH / 2 : PAD + BUTTON.w / 2 + i * step, BUTTON.y, d.label, {
          ...(d.choice ? TEXT_STYLE : MUTED_STYLE),
          fontSize: '9px',
          fixedWidth: BUTTON.w,
          align: 'center',
          padding: { x: 0, y: 6 },
        })
        .setOrigin(0.5);
      if (d.choice) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerup', () => {
          this.nav.cursor.select(i);
          this.refresh();
          this.pick();
        });
      }
      this.buttons.push({ text, choice: d.choice });
    });
    this.fix(this.buttons.map((b) => b.text));
    this.setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(view: StageResultView): void {
    const s = this.scene;
    const dim = s.add.rectangle(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT, 0x05080d, 0.95).setOrigin(0);
    dim.setInteractive();
    const bar = s.add.rectangle(0, 0, LOGIC_WIDTH, BAR_H, 0x1d2a3b, 1).setOrigin(0);
    const title = s.add.text(PAD, 5, view.title, {
      ...TEXT_STYLE,
      fontSize: '10px',
      fontStyle: 'bold',
    });
    const total = s.add
      .text(LOGIC_WIDTH - PAD, 7, `Core Bit ${view.coreBitsTotal}`, {
        ...TEXT_STYLE,
        fontSize: '8px',
        color: '#ffd166',
      })
      .setOrigin(1, 0);
    const objs: Phaser.GameObjects.GameObject[] = [dim, bar, title, total];
    const left = PAD;
    const right = PAD + PANEL.w + PANEL.gap;
    for (const [x, header] of [
      [left, 'Kết quả'],
      [right, 'Phần thưởng và thu thập'],
    ] as const) {
      objs.push(
        s.add.rectangle(x, PANEL.y, PANEL.w, PANEL.h).setOrigin(0).setStrokeStyle(1, 0x2f4766),
        s.add.text(x + 6, PANEL.y + 4, header, {
          ...TEXT_STYLE,
          fontSize: '9px',
          fontStyle: 'bold',
        }),
      );
    }
    view.stats.forEach((row, i) => {
      const y = ROW_Y + i * ROW_GAP;
      objs.push(
        s.add.text(left + 6, y, row.label, { ...MUTED_STYLE, fontSize: '9px' }),
        s.add
          .text(left + PANEL.w - 6, y, row.value, { ...TEXT_STYLE, fontSize: '9px' })
          .setOrigin(1, 0),
      );
    });
    view.rewards.forEach((line, i) => {
      objs.push(
        s.add.text(right + 6, ROW_Y + i * ROW_GAP, line, {
          ...TEXT_STYLE,
          fontSize: '9px',
          wordWrap: { width: PANEL.w - 12, useAdvancedWrap: true },
        }),
      );
    });
    if (view.reminders.length > 0) {
      objs.push(
        s.add.text(PAD, PANEL.y + PANEL.h + 4, `NOVA: ${view.reminders.join(' ')}`, {
          ...MUTED_STYLE,
          fontSize: '8px',
          wordWrap: { width: LOGIC_WIDTH - 2 * PAD, useAdvancedWrap: true },
          maxLines: 2,
        }),
      );
    }
    this.fix(objs, DEPTH);
    this.root.push(...objs);
    this.open = true;
    // Mặc định trỏ vào Về menu (nút chính của wireframe), cần đang kéo thì chờ về giữa.
    this.nav.reset(this.buttons.length - 1);
    this.setVisible(true);
    this.refresh();
  }

  /** Đọc đầu vào của một bước logic khi màn Kết quả đang mở. */
  handle(snap: InputSnapshot): void {
    if (!this.open) return;
    const r = this.nav.handle(snap);
    if (r.moved) this.refresh();
    if (r.activate) this.pick();
  }

  private pick(): void {
    const choice = this.buttons[this.nav.index]?.choice;
    if (choice) this.onChoice(choice);
  }

  private refresh(): void {
    this.buttons.forEach((b, i) =>
      b.text.setBackgroundColor(
        !b.choice ? COLOR.off : i === this.nav.index ? COLOR.picked : COLOR.idle,
      ),
    );
  }

  private fix(objs: Phaser.GameObjects.GameObject[], depth = DEPTH + 1): void {
    for (const o of objs) {
      const go = o as Phaser.GameObjects.GameObject &
        Phaser.GameObjects.Components.ScrollFactor &
        Phaser.GameObjects.Components.Depth;
      go.setScrollFactor(0);
      go.setDepth(depth);
    }
  }

  private setVisible(visible: boolean): void {
    for (const o of [...this.root, ...this.buttons.map((b) => b.text)])
      (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(visible);
  }
}
