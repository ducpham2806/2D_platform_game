import Phaser from 'phaser';
import { DEBUG } from './debug/flags';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from './core/constants';
import { currentLayout } from './core/phaser-scale';
import { BootScene } from './scenes/boot-scene';
import { ControlsScene } from './scenes/controls-scene';
import { HubScene } from './scenes/hub-scene';
import { MenuScene } from './scenes/menu-scene';
import { PlaytestScene } from './scenes/playtest-scene';
import { PreloadScene } from './scenes/preload-scene';
import { SaveScene } from './scenes/save-scene';
import { StageScene } from './scenes/stage-scene';
import { PrepScene } from './scenes/prep-scene';
import { ShopScene } from './scenes/shop-scene';
import { WorkshopScene } from './scenes/workshop-scene';
import './style.css';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: LOGIC_WIDTH,
  height: LOGIC_HEIGHT,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scale: {
    // Tự tính hệ số phóng nguyên ở phaser-scale.ts thay vì để Phaser co giãn lẻ.
    mode: Phaser.Scale.NONE,
    // Căn giữa ở phaser-scale.ts theo biên px thiết bị.
    autoCenter: Phaser.Scale.NO_CENTER,
    zoom: currentLayout().zoom,
  },
  fps: { target: 60 },
  input: { activePointers: 3 },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    HubScene,
    StageScene,
    ControlsScene,
    PlaytestScene,
    SaveScene,
    WorkshopScene,
    ShopScene,
    PrepScene,
  ],
});

if (DEBUG) {
  (window as unknown as { __cvGame?: Phaser.Game }).__cvGame = game;
}
