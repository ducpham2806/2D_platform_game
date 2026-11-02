import type Phaser from 'phaser';
import { EventBus } from './event-bus';
import type { GameConfig } from './game-config';
import type { GameEventBus, GameEvents } from './game-events';
import type { InputService } from '../input/input-service';

const BUS_KEY = 'cv.bus';
const CONFIG_KEY = 'cv.config';
const INPUT_KEY = 'cv.input';

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
