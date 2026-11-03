import { type EnemyMarkers, layoutFromRows, type StageLayout } from '../logic/stage/layout';
import { layoutFromTiled } from '../logic/stage/tiled';

/** Kẻ địch đặt ở một ký hiệu chữ trên bản đồ ASCII. */
export interface EnemyPlacement {
  /** id trong enemies.json. */
  enemy: string;
  /** Prologue nhịp 1–3: chỉ đẩy lùi, không mất máu. */
  harmless?: boolean;
}

export interface StageSection {
  id: string;
  label: string;
  /** Cột ô bắt đầu đoạn. */
  fromCol: number;
}

interface StageDefBase {
  id: string;
  name: string;
  /** Ghi nhật ký chơi thử của cổng Prototype (chỉ màn xám). */
  playtest: boolean;
}

/** Màn dựng bằng ASCII (màn xám, phòng thử kẻ địch). Ký hiệu: logic/tilemap.ts, logic/stage/layout.ts. */
export interface AsciiStageDef extends StageDefBase {
  kind: 'ascii';
  rows: readonly string[];
  /** Các đoạn theo cột tăng dần, cho nhật ký chơi thử và báo cáo. */
  sections: readonly StageSection[];
  /** Ký hiệu chữ hoa trên bản đồ → kẻ địch. */
  enemyMarkers: EnemyMarkers & Readonly<Record<string, EnemyPlacement>>;
}

/** Màn làm bằng Tiled (M7): bản đồ JSON trong game/maps/, các đoạn lấy từ đối tượng `section`. */
export interface TiledStageDef extends StageDefBase {
  kind: 'tiled';
  map: unknown;
}

export type StageDef = AsciiStageDef | TiledStageDef;

/** Dựng bố cục mới cho một lần vào màn (lưới ô bị đổi khi chơi nên không dùng chung). */
export function buildStageLayout(def: StageDef, tileSize: number): StageLayout {
  return def.kind === 'ascii'
    ? layoutFromRows(def.rows, tileSize, def.enemyMarkers, def.sections)
    : layoutFromTiled(def.map, tileSize);
}
