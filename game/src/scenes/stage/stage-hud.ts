import type Phaser from 'phaser';
import type { Strings } from '../../logic/i18n';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from '../../core/constants';
import type { HudModel } from '../../logic/hud/hud-model';
import { MUTED_STYLE, TEXT_STYLE } from '../ui';

/** Chừa góc phải trên cho nút tạm dừng cảm ứng (48 dp, cách mép 32 dp; ở hệ số phóng ≥ 2). */
const TOUCH_PAUSE_RESERVE = 30;
const PAD = 6;
/** Khung HUD (ui_hud_frame 104 × 22) đặt ở góc trên trái; rãnh máu và năng lượng theo hình vẽ. */
const FRAME = { x: 3, y: 3 } as const;
const HP_SLOT = { x: FRAME.x + 15, y: FRAME.y + 3, w: 82, h: 6 } as const;
const ENERGY_SLOT = { x: FRAME.x + 15, y: FRAME.y + 14, w: 50, h: 5 } as const;
/** Khung máu boss (ui_boss_frame 132 × 12), rãnh 120 × 6. */
const BOSS_FRAME = { w: 132, y: 12 } as const;
/** Tâm ngang của thanh máu boss: lệch phải một chút để không đè khung máu người chơi. */
const BOSS_CX = 176;
const BOSS_W = 120;
const DEPTH = 10;

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
  private readonly frame: Phaser.GameObjects.Image;
  private readonly bossFrame: Phaser.GameObjects.Image;
  private readonly coin: Phaser.GameObjects.Image;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly energyText: Phaser.GameObjects.Text;
  private readonly bossName: Phaser.GameObjects.Text;
  private readonly coreBits: Phaser.GameObjects.Text;
  private readonly side: Phaser.GameObjects.Text;
  private readonly weapon: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  readonly hint: Phaser.GameObjects.Text;
  readonly debug: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly strings: Strings,
  ) {
    const fixed = <T extends Phaser.GameObjects.Components.ScrollFactor>(o: T): T =>
      o.setScrollFactor(0);
    this.frame = fixed(
      scene.add.image(FRAME.x, FRAME.y, 'ui_hud_frame').setOrigin(0).setDepth(DEPTH),
    );
    this.bossFrame = fixed(
      scene.add.image(BOSS_CX, BOSS_FRAME.y, 'ui_boss_frame').setOrigin(0.5, 0).setDepth(DEPTH),
    );
    this.coin = fixed(scene.add.image(0, PAD + 5, 'obj_core_bit', 0).setDepth(DEPTH + 1));
    this.bars = fixed(scene.add.graphics().setDepth(DEPTH));
    this.hpText = fixed(
      scene.add
        .text(HP_SLOT.x + HP_SLOT.w / 2, HP_SLOT.y + HP_SLOT.h / 2, '', {
          ...SMALL,
          fontSize: '7px',
          color: '#ffffff',
          stroke: '#0b0f1a',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(DEPTH + 1),
    );
    this.energyText = fixed(
      scene.add
        .text(FRAME.x + 74, FRAME.y + 12, '', { ...SMALL, color: '#9be7ff' })
        .setDepth(DEPTH),
    );
    this.bossName = fixed(scene.add.text(BOSS_CX, 2, '', SMALL).setOrigin(0.5, 0).setDepth(DEPTH));
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
        .text(LOGIC_WIDTH / 2, 70, '', {
          ...TEXT_STYLE,
          fontSize: '12px',
          align: 'center',
          stroke: '#0f1724',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
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

  /** Hiện một dòng giữa màn hình rồi mờ dần. */
  flash(text: string, holdMs = 1600): void {
    this.message.setText(text).setAlpha(1);
    this.scene.tweens.killTweensOf(this.message);
    this.scene.tweens.add({ targets: this.message, alpha: 0, delay: holdMs, duration: 500 });
  }

  /** Ẩn/hiện cả HUD (menu tạm dừng vẫn giữ HUD, chỉ phủ mờ lên trên). */
  setVisible(visible: boolean): void {
    for (const o of [this.bars, this.hpText, this.energyText, this.bossName, this.coreBits])
      o.setVisible(visible);
    for (const o of [this.frame, this.bossFrame, this.coin]) o.setVisible(visible);
    for (const o of [this.side, this.weapon, this.hint]) o.setVisible(visible);
  }

  /**
   * `touch`: đang chơi bằng cảm ứng (chừa chỗ nút tạm dừng, ô vũ khí nằm trong lớp nút).
   * `swapGlyph`: phím/nút đổi vũ khí của thiết bị đang dùng (ví dụ "Q / E").
   */
  update(hud: HudModel, touch: boolean, swapGlyph: string): void {
    const g = this.bars;
    g.clear();
    // Máu: tô phần đầy vào rãnh của khung.
    g.fillStyle(hud.hp.low ? 0xe63946 : 0x57cc63, 1).fillRect(
      HP_SLOT.x,
      HP_SLOT.y,
      Math.round(HP_SLOT.w * hud.hp.frac),
      HP_SLOT.h,
    );
    g.fillStyle(hud.hp.low ? 0xff8c42 : 0xb7f171, 1).fillRect(
      HP_SLOT.x,
      HP_SLOT.y,
      Math.round(HP_SLOT.w * hud.hp.frac),
      1,
    );
    this.hpText.setText(`${hud.hp.value}/${hud.hp.max}`);
    // Năng lượng vũ khí boss.
    if (hud.energy) {
      g.fillStyle(0x2ec4e6, 1).fillRect(
        ENERGY_SLOT.x,
        ENERGY_SLOT.y,
        Math.round(ENERGY_SLOT.w * hud.energy.frac),
        ENERGY_SLOT.h,
      );
      this.energyText.setText(`${hud.energy.value}/${hud.energy.max}`);
    } else {
      this.energyText.setText('');
    }
    // Máu boss.
    if (hud.boss) {
      const b = hud.boss;
      const x = BOSS_CX - BOSS_W / 2;
      g.fillStyle(0xe63946, 1).fillRect(x, 15, Math.round(BOSS_W * b.frac), 6);
      g.fillStyle(0xff8c42, 1).fillRect(x, 15, Math.round(BOSS_W * b.frac), 1);
      // Vạch ngưỡng đổi pha.
      for (const pct of b.phaseMarks)
        g.fillStyle(0xffffff, 0.8).fillRect(x + (BOSS_W * pct) / 100, 14, 1, 8);
      this.bossName.setText(this.strings.t('hud.bossPhase', { name: b.name, n: b.phase }));
    } else {
      this.bossName.setText('');
    }
    this.bossFrame.setVisible(hud.boss !== undefined && this.frame.visible);
    // Core Bit, EXP, phòng khóa.
    const right = LOGIC_WIDTH - PAD - (touch ? TOUCH_PAUSE_RESERVE : 0);
    this.coreBits.setX(right).setText(String(hud.coreBits));
    this.coin.setX(right - this.coreBits.width - 7);
    const lines = [`EXP ${hud.exp}`];
    if (hud.roomRemaining !== undefined)
      lines.push(this.strings.t('hud.roomRemaining', { n: hud.roomRemaining }));
    this.side.setX(right).setText(lines.join('\n'));
    // Ô vũ khí (PC/tay cầm).
    const swap =
      hud.weapon.count > 1 ? `\n${this.strings.t('hud.weaponSwap', { keys: swapGlyph })}` : '';
    this.weapon
      .setVisible(!touch)
      .setText(this.strings.t('hud.weapon', { name: hud.weapon.name }) + swap);
  }
}
