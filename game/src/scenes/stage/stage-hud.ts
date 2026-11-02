import type Phaser from 'phaser';
import { LOGIC_WIDTH } from '../../core/constants';
import type { StageWorld } from '../../logic/world/stage-world';
import { MUTED_STYLE, TEXT_STYLE } from '../ui';

/**
 * HUD theo GDD 13 và đặc tả Stage 1: thanh máu trái trên, năng lượng vũ khí dưới thanh máu,
 * tên vũ khí, thanh máu boss ở trên cùng khi đánh boss, thông báo giữa màn hình.
 */
export class StageHud {
  private readonly bars: Phaser.GameObjects.Graphics;
  private readonly weapon: Phaser.GameObjects.Text;
  private readonly bossName: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  readonly hint: Phaser.GameObjects.Text;
  readonly debug: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.bars = scene.add.graphics().setScrollFactor(0).setDepth(10);
    this.weapon = scene.add
      .text(8, 20, '', { ...MUTED_STYLE, fontSize: '8px' })
      .setScrollFactor(0)
      .setDepth(10);
    this.bossName = scene.add
      .text(LOGIC_WIDTH - 8, 4, '', { ...MUTED_STYLE, fontSize: '8px' })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10);
    this.message = scene.add
      .text(LOGIC_WIDTH / 2, 70, '', {
        ...TEXT_STYLE,
        fontSize: '12px',
        align: 'center',
        stroke: '#0f1724',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(11)
      .setAlpha(0);
    this.hint = scene.add
      .text(8, 31, '', { ...MUTED_STYLE, fontSize: '8px', color: '#c5d0de' })
      .setScrollFactor(0)
      .setDepth(10);
    this.debug = scene.add
      .text(8, 178, '', { ...MUTED_STYLE, fontSize: '8px' })
      .setScrollFactor(0)
      .setDepth(10);
  }

  /** Hiện một dòng giữa màn hình rồi mờ dần. */
  flash(text: string, holdMs = 1600): void {
    this.message.setText(text).setAlpha(1);
    this.scene.tweens.killTweensOf(this.message);
    this.scene.tweens.add({ targets: this.message, alpha: 0, delay: holdMs, duration: 500 });
  }

  /** `swapGlyph`: tên phím/nút đổi vũ khí của thiết bị đang dùng (ví dụ "Q / E", "LB / RB"). */
  update(world: StageWorld, swapGlyph: string): void {
    const g = this.bars;
    g.clear();
    const pl = world.player;
    const hpFrac = pl.hp / pl.maxHp;
    g.fillStyle(0x0f1724, 0.8).fillRect(6, 6, 66, 9);
    g.fillStyle(hpFrac > 0.3 ? 0x7bd389 : 0xff6b6b, 1).fillRect(8, 8, 62 * hpFrac, 5);
    const slot = world.loadout.current;
    let weaponText = slot.name;
    if (slot.kind !== 'buster') {
      const max = world.loadout.energyMax;
      const frac = slot.energy / max;
      g.fillStyle(0x0f1724, 0.8).fillRect(6, 15, 66, 5);
      g.fillStyle(0x7bd389, 1).fillRect(8, 16, 62 * Math.min(1, frac), 3);
      weaponText += `  ${Math.floor(slot.energy)}/${max}`;
    }
    if (world.loadout.slots.length > 1) weaponText += `  (đổi: ${swapGlyph})`;
    this.weapon.setText(weaponText).setY(slot.kind !== 'buster' ? 21 : 16);

    const boss = world.boss;
    if (boss && world.phase === 'boss') {
      const frac = boss.hp / boss.data.hp;
      const w = 110;
      const x = LOGIC_WIDTH - 8 - w;
      g.fillStyle(0x0f1724, 0.8).fillRect(x - 2, 14, w + 4, 9);
      g.fillStyle(0xff8787, 1).fillRect(x, 16, w * frac, 5);
      // Vạch ngưỡng đổi pha.
      for (const ph of boss.data.phases) {
        if (ph.untilHpPct > 0)
          g.fillStyle(0xffffff, 0.8).fillRect(x + (w * ph.untilHpPct) / 100, 15, 1, 7);
      }
      this.bossName.setText(`${boss.data.name} · pha ${boss.phase + 1}`);
    } else {
      this.bossName.setText('');
    }
  }
}
