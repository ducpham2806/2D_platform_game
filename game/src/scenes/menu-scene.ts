import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus, getConfig, getSave } from '../core/phaser-services';
import { characterProgress } from '../logic/rpg/progression';
import { spentPoints } from '../logic/rpg/skill-tree';
import { workshopUnlocked } from '../workshop/workshop-panel';
import { summarize } from '../logic/save/save-data';
import { MUTED_STYLE, TEXT_STYLE, textButton } from './ui';

/** Màn hình chính tạm thời (wireframe Main). Không đăng nhập, không quảng cáo. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Menu);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Menu });
    const cx = LOGIC_WIDTH / 2;
    this.add
      .text(cx, 28, 'CYBER VANGUARD', { ...TEXT_STYLE, fontSize: '16px', color: '#4fd1ff' })
      .setOrigin(0.5);
    const manager = getSave(this);
    const save = manager.data;
    const saved = summarize(save);
    const config = getConfig(this);
    const progress = characterProgress(
      save.character.exp,
      save.progress.bossesDefeated,
      new Set(config.stages.stages.map((st) => st.boss)),
      config.player.level,
    );
    this.add
      .text(
        cx,
        44,
        `bản Prototype · cấp ${progress.level} · SP còn ${Math.max(0, progress.skillPoints - spentPoints(save.character.skills))} · boss đã hạ ${saved.bosses} · Core Bit ${saved.coreBits}`,
        MUTED_STYLE,
      )
      .setOrigin(0.5);
    if (manager.notice) {
      // Bản lưu vừa được chuẩn hóa lại (ví dụ kỹ năng không còn hợp lệ): báo một lần.
      this.add
        .text(cx, 186, manager.notice, { ...MUTED_STYLE, fontSize: '8px', color: '#ffd166' })
        .setOrigin(0.5, 1);
      manager.notice = undefined;
    }

    const enemies = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'enemies' });
    };
    const mechanics = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'mechanics' });
    };
    const thorna = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'thorna' });
    };
    const golem = (): void => {
      this.scene.start(SceneKey.Stage, { stage: 'golem' });
    };
    textButton(this, cx, 58, 'Vào màn thử', () => this.scene.start(SceneKey.Stage));
    textButton(this, cx, 73, 'Phòng thử kẻ địch', enemies);
    textButton(this, cx, 88, 'Phòng thử màn chơi', mechanics);
    textButton(this, cx, 103, 'Boss Thorna', thorna);
    textButton(this, cx, 118, 'Mini-boss Bramble Golem', golem);
    textButton(this, cx - 52, 133, 'Hub Arkon', () => this.scene.start(SceneKey.Hub));
    // Xưởng mở sau boss chiến dịch đầu tiên (đặc tả Hub mục 5).
    const workshop = (): void => {
      if (workshopUnlocked(manager, config)) this.scene.start(SceneKey.Workshop);
    };
    if (workshopUnlocked(manager, config)) textButton(this, cx + 52, 133, 'Xưởng', workshop);
    else this.add.text(cx + 52, 133, 'Xưởng (sau boss 1)', MUTED_STYLE).setOrigin(0.5);
    textButton(this, cx, 148, 'Điều khiển', () => this.scene.start(SceneKey.Controls));
    textButton(this, cx - 52, 163, 'Kết quả chơi thử', () => this.scene.start(SceneKey.Playtest));
    textButton(this, cx + 52, 163, 'Dữ liệu lưu', () => this.scene.start(SceneKey.Save));
    this.add
      .text(
        cx,
        182,
        'Enter: màn thử · K: kẻ địch · M: màn chơi · B: Thorna · G: Golem · H: Hub · X: Xưởng · C · R · S',
        {
          ...MUTED_STYLE,
          fontSize: '8px',
        },
      )
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ENTER', () => this.scene.start(SceneKey.Stage));
    keyboard?.once('keydown-H', () => this.scene.start(SceneKey.Hub));
    keyboard?.once('keydown-C', () => this.scene.start(SceneKey.Controls));
    keyboard?.once('keydown-R', () => this.scene.start(SceneKey.Playtest));
    keyboard?.once('keydown-S', () => this.scene.start(SceneKey.Save));
    keyboard?.once('keydown-K', enemies);
    keyboard?.once('keydown-M', mechanics);
    keyboard?.once('keydown-B', thorna);
    keyboard?.once('keydown-G', golem);
    keyboard?.once('keydown-X', workshop);
  }
}
