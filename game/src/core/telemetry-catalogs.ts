/**
 * Danh mục id cho kiểm lược đồ đo lường (EP-13, ST-13-01; duyệt Technical Director 14/11/2026):
 * id trong sự kiện phải thuộc danh mục lấy từ dữ liệu game, nên tên tự gõ (dù đúng khuôn id) không
 * lọt vào nhật ký. Logic thuần.
 */
import type { Catalogs } from '../logic/telemetry/schema';
import type { GameConfig } from './game-config';

/** Id của vũ khí từ tên hiển thị (bản lưu và dữ liệu dùng tên): "Vine Lash" → "vineLash". */
export function weaponId(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter((w) => w.length > 0);
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0]?.toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

/** Id màn ngoài `stages.json` (Prologue chưa có trong danh sách màn chiến dịch). */
export const EXTRA_STAGE_IDS = ['prologue'] as const;

export function telemetryCatalogs(config: GameConfig): Catalogs {
  return {
    stage: new Set([...config.stages.stages.map((s) => s.id), ...EXTRA_STAGE_IDS]),
    difficulty: new Set(config.difficulties.map((d) => d.id)),
    boss: new Set(Object.keys(config.bosses)),
    weapon: new Set(['arcCannon', ...config.weapons.bossWeapons.map((w) => weaponId(w.name))]),
    upgrade: new Set(Object.keys(config.shop.upgrades)),
    skillNode: new Set(Object.keys(config.skills.nodes)),
    enemy: new Set(Object.keys(config.enemies.enemies)),
    tutorialStep: new Set(config.tutorial.steps.map((s) => s.id)),
  };
}
