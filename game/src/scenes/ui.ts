import type Phaser from 'phaser';

/** Kiểu chữ chung cho khung game (tạm thời, thay bằng bitmap font khi có asset). */
export const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  // Font hệ thống có đủ dấu tiếng Việt; font monospace trên một số máy thiếu glyph (ví dụ "ử").
  fontFamily: '"Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif',
  fontSize: '10px',
  color: '#e8f1ff',
};

export const MUTED_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  ...TEXT_STYLE,
  color: '#7f8ea3',
};

/** Một nút chữ chạm/bấm được; trả về đối tượng Text để đặt vị trí. */
export function textButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onSelect: () => void,
): Phaser.GameObjects.Text {
  const text = scene.add
    .text(x, y, label, { ...TEXT_STYLE, backgroundColor: '#1d2a3b', padding: { x: 6, y: 3 } })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  text.on('pointerover', () => text.setBackgroundColor('#2f4766'));
  text.on('pointerout', () => text.setBackgroundColor('#1d2a3b'));
  text.on('pointerup', onSelect);
  return text;
}

const PANEL_KEY = 'ui_panel';
/** Cỡ một mảnh của khung 9 mảnh (ui_panel: 3 × 3 ô 8 × 8). */
const SLICE = 8;

/**
 * Khung 9 mảnh từ `ui_panel` (góc giữ nguyên, cạnh và ruột kéo giãn), ghép bằng 9 hình trong một
 * Container nên chạy được cả khi trình duyệt chỉ có Canvas. Gốc ở góc trên trái.
 */
export class NinePanel {
  readonly container: Phaser.GameObjects.Container;
  private readonly parts: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    for (let i = 0; i < 9; i += 1)
      this.parts.push(scene.add.image(0, 0, PANEL_KEY, i).setOrigin(0));
    this.container = scene.add.container(Math.round(x), Math.round(y), this.parts);
    this.resize(width, height);
  }

  resize(width: number, height: number): this {
    const w = Math.max(SLICE * 2, Math.round(width));
    const h = Math.max(SLICE * 2, Math.round(height));
    const xs = [0, SLICE, w - SLICE];
    const ys = [0, SLICE, h - SLICE];
    const ws = [SLICE, w - SLICE * 2, SLICE];
    const hs = [SLICE, h - SLICE * 2, SLICE];
    this.parts.forEach((part, i) => {
      const c = i % 3;
      const r = Math.floor(i / 3);
      part.setPosition(xs[c] ?? 0, ys[r] ?? 0).setDisplaySize(ws[c] ?? SLICE, hs[r] ?? SLICE);
    });
    return this;
  }

  setPosition(x: number, y: number): this {
    this.container.setPosition(Math.round(x), Math.round(y));
    return this;
  }
}
