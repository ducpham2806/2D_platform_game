import type Phaser from 'phaser';
import { EventBus } from './event-bus';
import type { GameConfig } from './game-config';
import type { GameEventBus, GameEvents } from './game-events';
import type { InputService } from '../input/input-service';
import type { SaveManager } from '../logic/save/save-manager';
import type { SfxPlayer } from '../audio/sfx-player';
import type { Strings } from '../logic/i18n';

const BUS_KEY = 'cv.bus';
const CONFIG_KEY = 'cv.config';
const INPUT_KEY = 'cv.input';
const SAVE_KEY = 'cv.save';
const SFX_KEY = 'cv.sfx';
const STRINGS_KEY = 'cv.strings';

/** Gắn event bus dùng chung vào registry của game (gọi một lần ở BootScene). */
export function installBus(game: Phaser.Game): GameEventBus {
  const existing = game.registry.get(BUS_KEY) as GameEventBus | undefined;
  if (existing) return existing;
  const bus = new EventBus<GameEvents>();
  game.registry.set(BUS_KEY, bus);
  return bus;
}

export function getBus(scene: Phaser.Scene): GameEventBus {
  const bus = scene.registry.get(BUS_KEY) as GameEventBus | undefined;
  if (!bus) throw new Error('Event bus chưa được khởi tạo (BootScene phải chạy trước)');
  return bus;
}

export function setConfig(scene: Phaser.Scene, config: GameConfig): void {
  scene.registry.set(CONFIG_KEY, config);
}

export function getConfig(scene: Phaser.Scene): GameConfig {
  const config = scene.registry.get(CONFIG_KEY) as GameConfig | undefined;
  if (!config) throw new Error('Cấu hình chưa được nạp (PreloadScene phải chạy trước)');
  return config;
}

export function setInput(scene: Phaser.Scene, input: InputService): void {
  scene.registry.set(INPUT_KEY, input);
}

export function getInput(scene: Phaser.Scene): InputService {
  const input = scene.registry.get(INPUT_KEY) as InputService | undefined;
  if (!input) throw new Error('InputService chưa được tạo (PreloadScene phải chạy trước)');
  return input;
}

export function setStrings(scene: Phaser.Scene, strings: Strings): void {
  scene.registry.set(STRINGS_KEY, strings);
}

export function getStrings(scene: Phaser.Scene): Strings {
  const strings = scene.registry.get(STRINGS_KEY) as Strings | undefined;
  if (!strings) throw new Error('Bảng chuỗi chưa được nạp (PreloadScene phải chạy trước)');
  return strings;
}

export function setSfx(scene: Phaser.Scene, sfx: SfxPlayer): void {
  scene.registry.set(SFX_KEY, sfx);
}

export function getSfx(scene: Phaser.Scene): SfxPlayer {
  const sfx = scene.registry.get(SFX_KEY) as SfxPlayer | undefined;
  if (!sfx) throw new Error('SfxPlayer chưa được tạo (PreloadScene phải chạy trước)');
  return sfx;
}

export function setSave(scene: Phaser.Scene, save: SaveManager): void {
  scene.registry.set(SAVE_KEY, save);
}

export function getSave(scene: Phaser.Scene): SaveManager {
  const save = scene.registry.get(SAVE_KEY) as SaveManager | undefined;
  if (!save) throw new Error('SaveManager chưa được tạo (PreloadScene phải chạy trước)');
  return save;
}
