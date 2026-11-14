import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus, getConfig, getSave } from '../core/phaser-services';
import { characterProgress } from '../logic/rpg/progression';
import { showSavePanel } from '../save/save-panel';
import { TEXT_STYLE } from './ui';

/** Dữ liệu lưu (M11): xem tóm tắt, xuất/nhập mã sao lưu, xóa tiến trình. Nội dung là bảng HTML. */
export class SaveScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Save);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Save });
    this.add
      .text(LOGIC_WIDTH / 2, 12, 'DỮ LIỆU LƯU', { ...TEXT_STYLE, fontSize: '12px' })
      .setOrigin(0.5);
    // Chạm và gõ phím trong bảng HTML không được lọt xuống canvas.
    this.input.enabled = false;
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    const config = getConfig(this);
    const storyBosses = new Set(config.stages.stages.map((st) => st.boss));
    const close = showSavePanel(
      getSave(this),
      () => this.scene.start(SceneKey.Menu),
      (data) =>
        characterProgress(
          data.character.exp,
          data.progress.bossesDefeated,
          storyBosses,
          config.player.level,
        ),
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, close);
  }
}
