import type { SceneKey } from './constants';
import type { EventBus } from './event-bus';
import type { GameConfig } from './game-config';
import type { ViewportLayout } from '../logic/scale';

/** Danh sách sự kiện toàn game. Thêm sự kiện mới ở đây để mọi nơi dùng chung một kiểu. */
export type GameEvents = {
  'config:ready': { config: GameConfig };
  'config:error': { message: string };
  'scene:changed': { key: SceneKey };
  'viewport:changed': ViewportLayout;
};

export type GameEventBus = EventBus<GameEvents>;
