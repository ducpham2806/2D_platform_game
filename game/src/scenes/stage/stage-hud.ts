import type Phaser from 'phaser';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from '../../core/constants';
import type { HudModel } from '../../logic/hud/hud-model';
import { MUTED_STYLE, TEXT_STYLE } from '../ui';

/** Chừa góc phải trên cho nút tạm dừng cảm ứng (48 dp, cách mép 32 dp; ở hệ số phóng ≥ 2). */
const TOUCH_PAUSE_RESERVE = 30;
const PAD = 6;
const HP_W = 80;
const ENERGY_W = 56;
const BOSS_W = 120;
const DEPTH = 10;
/** Mép trên của chữ thông báo giữa màn hình (px logic). */
const MESSAGE_TOP = 72;
/** Màu khiên C3 (vòng HUD và viền quanh Kai): tím nhạt, khác lục lam của P3 và cam của P1. */
export const KAI_SHIELD_COLOR = 0xa5b4fc;
/** Vòng khiên dưới thanh năng lượng (tâm, bán kính px logic). */
const SHIELD_ICON = { x: PAD + 5, y: PAD + 27, r: 4 };

const SMALL: Phaser.Types.GameObjects.Text.TextStyle = {
  ...MUTED_STYLE,
  fontSize: '8px',
  color: '#c5d0de',
};

/**
 * HUD (M10) theo GDD 13 và wireframe Main.html / HUDPC.html: máu trái trên, năng lượng vũ khí
 * dưới máu, máu boss giữa trên (chỉ trong trận boss), Core Bit góc phải (chừa chỗ nút tạm dừng
 * khi chơi cảm ứng), ô vũ khí góc phải dưới trên PC/tay cầm (cảm ứng: biểu tượng vũ khí là nút
 * trong lớp cảm ứng). Không che vùng giữa màn hình. Chỉ vẽ theo HudModel, không đọc StageWorld.
 */
export class StageHud {
  private readonly bars: Phaser.GameObjects.Graphics;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly nanoText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly bossName: Phaser.GameObjects.Text;
  private readonly coreBits: Phaser.GameObjects.Text;
  private readonly side: Phaser.GameObjects.Text;
  private readonly weapon: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  readonly hint: Phaser.GameObjects.Text;
  readonly debug: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    const fixed = <T extends Phaser.GameObjects.Components.ScrollFactor>(o: T): T =>
      o.setScrollFactor(0);
    this.bars = fixed(scene.add.graphics().setDepth(DEPTH));
    this.hpText = fixed(scene.add.text(PAD + HP_W + 6, PAD - 1, '', SMALL).setDepth(DEPTH));
    this.energyText = fixed(
      scene.add
        .text(PAD + ENERGY_W + 6, PAD + 10, '', { ...SMALL, color: '#9be7ff' })
        .setDepth(DEPTH),
    );
    this.nanoText = fixed(
      scene.add.text(PAD, PAD + 23, '', { ...SMALL, color: '#a4f2b4' }).setDepth(DEPTH),
    );
    this.bossName = fixed(
      scene.add
        .text(LOGIC_WIDTH / 2, 3, '', SMALL)
        .setOrigin(0.5, 0)
        .setDepth(DEPTH),
    );
    this.coreBits = fixed(
      scene.add
        .text(LOGIC_WIDTH - PAD, PAD - 1, '', {
          ...TEXT_STYLE,
          fontSize: '9px',
          color: '#ffd166',
          backgroundColor: '#0f1724cc',
          padding: { x: 4, y: 1 },
        })
        .setOrigin(1, 0)
        .setDepth(DEPTH),
    );
    this.side = fixed(
      scene.add
        .text(LOGIC_WIDTH - PAD, PAD + 14, '', { ...SMALL, align: 'right' })
        .setOrigin(1, 0)
        .setDepth(DEPTH),
    );
    this.weapon = fixed(
      scene.add
        .text(LOGIC_WIDTH - PAD, LOGIC_HEIGHT - 16, '', {
          ...TEXT_STYLE,
          fontSize: '8px',
          align: 'right',
          backgroundColor: '#0f1724cc',
          padding: { x: 4, y: 2 },
        })
        .setOrigin(1, 1)
        .setDepth(DEPTH),
    );
    this.message = fixed(
      scene.add
        // Neo mép trên dưới hộp hướng dẫn (3 dòng chữ 9 px, đáy ≈ y 70) để không chồng lên nhau.
        .text(LOGIC_WIDTH / 2, MESSAGE_TOP, '', {
          ...TEXT_STYLE,
          fontSize: '12px',
          align: 'center',
          stroke: '#0f1724',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0)
        .setDepth(DEPTH + 1)
        .setAlpha(0),
    );
    this.hint = fixed(
      scene.add
        .text(LOGIC_WIDTH / 2, LOGIC_HEIGHT - 4, '', SMALL)
        .setOrigin(0.5, 1)
        .setDepth(DEPTH),
    );
    this.debug = fixed(
      scene.add
        .text(PAD, LOGIC_HEIGHT - 26, '', { ...MUTED_STYLE, fontSize: '8px' })
        .setDepth(DEPTH),
    );
  }

  setQaAttempt(text: string): void {
    if (text !== this.debug.text)
      this.debug
        .setPosition(LOGIC_WIDTH / 2, 25)
        .setOrigin(0.5, 0)
        .setText(text);
  }

  /** Hiện một dòng giữa màn hình rồi mờ dần. */
  flash(text: string, holdMs = 1600): void {
    this.message.setText(text).setAlpha(1);
    this.scene.tweens.killTweensOf(this.message);
    this.scene.tweens.add({ targets: this.message, alpha: 0, delay: holdMs, duration: 500 });
  }

  /** Ẩn/hiện cả HUD (menu tạm dừng vẫn giữ HUD, chỉ phủ mờ lên trên). */
  setVisible(visible: boolean): void {
    for (const o of [
      this.bars,
      this.hpText,
      this.energyText,
      this.nanoText,
      this.bossName,
      this.coreBits,
    ])
      o.setVisible(visible);
    for (const o of [this.side, this.weapon, this.hint]) o.setVisible(visible);
  }

  /**
   * `touch`: đang chơi bằng cảm ứng (chừa chỗ nút tạm dừng, ô vũ khí nằm trong lớp nút).
   * `swapGlyph`: phím/nút đổi vũ khí của thiết bị đang dùng (ví dụ "Q / E").
   */
  update(hud: HudModel, touch: boolean, swapGlyph: string): void {
    const g = this.bars;
    g.clear();
    // Chừa khoảng giữa số máu Kai và tên mini-boss dài trong phòng khóa.
    const hpWidth = hud.boss && hud.roomRemaining !== undefined ? HP_W - 16 : HP_W;
    g.fillStyle(0x0f1724, 0.8).fillRect(PAD, PAD, hpWidth + 4, 9);
    g.fillStyle(hud.hp.low ? 0xff6b6b : 0x7bd389, 1).fillRect(
      PAD + 2,
      PAD + 2,
      hpWidth * hud.hp.frac,
      5,
    );
    this.hpText.setX(PAD + hpWidth + 6).setText(`${hud.hp.value}/${hud.hp.max}`);
    // Năng lượng vũ khí boss.
    if (hud.energy) {
      g.fillStyle(0x0f1724, 0.8).fillRect(PAD, PAD + 11, ENERGY_W + 4, 6);
      g.fillStyle(0x4fd1ff, 1).fillRect(PAD + 2, PAD + 12, ENERGY_W * hud.energy.frac, 4);
      this.energyText.setText(`${hud.energy.value}/${hud.energy.max}`);
    } else {
      this.energyText.setText('');
    }
    const { capacity, remaining } = hud.nanoCells;
    // Chừa chỗ cho vòng khiên bên trái và hộp hướng dẫn bắt đầu ở x = 58.
    this.nanoText.setX(hud.shield ? PAD + 11 : PAD);
    this.nanoText.setText(capacity > 0 ? `Nano ${remaining}/${capacity}` : '');
    // Khiên C3: vòng đầy khi sẵn; đang hồi thì cung sáng chạy theo tiến độ.
    if (hud.shield) {
      const { x, y, r } = SHIELD_ICON;
      g.fillStyle(0x0f1724, 0.8).fillCircle(x, y, r + 2);
      if (hud.shield.ready) {
        g.lineStyle(2, KAI_SHIELD_COLOR, 1).strokeCircle(x, y, r);
        g.fillStyle(KAI_SHIELD_COLOR, 0.55).fillCircle(x, y, r - 2);
      } else {
        g.lineStyle(2, 0x3b4252, 1).strokeCircle(x, y, r);
        const start = -Math.PI / 2;
        g.lineStyle(2, KAI_SHIELD_COLOR, 0.8).beginPath();
        g.arc(x, y, r, start, start + 2 * Math.PI * hud.shield.progress, false).strokePath();
      }
    }
    // Máu boss.
    if (hud.boss) {
      const b = hud.boss;
      const x = (LOGIC_WIDTH - BOSS_W) / 2;
      g.fillStyle(0x0f1724, 0.8).fillRect(x - 2, 13, BOSS_W + 4, 9);
      g.fillStyle(0xff8787, 1).fillRect(x, 15, BOSS_W * b.frac, 5);
      // Vạch ngưỡng đổi pha.
      for (const pct of b.phaseMarks)
        g.fillStyle(0xffffff, 0.8).fillRect(x + (BOSS_W * pct) / 100, 14, 1, 7);
      this.bossName.setText(`${b.name} · pha ${b.phase}`);
    } else {
      this.bossName.setText('');
    }
    // Core Bit, EXP, phòng khóa.
    const right = LOGIC_WIDTH - PAD - (touch ? TOUCH_PAUSE_RESERVE : 0);
    this.coreBits.setX(right).setText(`◆ ${hud.coreBits}`);
    const lines = [`Cấp ${hud.level} · EXP ${hud.exp}`];
    if (hud.roomRemaining !== undefined) lines.push(`Còn ${hud.roomRemaining} kẻ địch`);
    this.side.setX(right).setText(lines.join('\n'));
    // Ô vũ khí (PC/tay cầm).
    const swap = hud.weapon.count > 1 ? `\nđổi: ${swapGlyph}` : '';
    this.weapon.setVisible(!touch).setText(`Vũ khí: ${hud.weapon.name}${swap}`);
  }
}
