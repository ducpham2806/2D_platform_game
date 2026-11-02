import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus } from '../core/phaser-services';
import { LocalStorageStore } from '../input/browser-store';
import { showResultsPanel } from '../playtest/results-panel';
import { TEXT_STYLE } from './ui';

/** Kết quả chơi thử của cổng Prototype. Nội dung là bảng HTML để đọc được trên điện thoại. */
export class PlaytestScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Playtest);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Playtest });
    this.add
      .text(LOGIC_WIDTH / 2, 12, 'KẾT QUẢ CHƠI THỬ', { ...TEXT_STYLE, fontSize: '12px' })
      .setOrigin(0.5);
    // Chạm vào bảng HTML không được lọt xuống canvas.
    this.input.enabled = false;
    const close = showResultsPanel(new LocalStorageStore(), () => this.scene.start(SceneKey.Menu));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, close);
  }
}
