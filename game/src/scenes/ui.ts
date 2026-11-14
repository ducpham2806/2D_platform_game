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
  /** Nút lớn, rộng đều (menu người thử cổng Prototype): cao ≥ 48 dp trên điện thoại cầm ngang. */
  big = false,
): Phaser.GameObjects.Text {
  const style: Phaser.Types.GameObjects.Text.TextStyle = big
    ? { fontSize: '12px', padding: { x: 8, y: 9 }, fixedWidth: 128, align: 'center' }
    : { padding: { x: 6, y: 3 } };
  const text = scene.add
    .text(x, y, label, { ...TEXT_STYLE, backgroundColor: '#1d2a3b', ...style })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  text.on('pointerover', () => text.setBackgroundColor('#2f4766'));
  text.on('pointerout', () => text.setBackgroundColor('#1d2a3b'));
  text.on('pointerup', onSelect);
  return text;
}
