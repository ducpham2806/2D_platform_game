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

/**
 * Một màn dựng bằng ASCII (màn xám, phòng thử kẻ địch). Bản đồ Tiled thật (M7) sẽ đổ ra
 * cùng cấu trúc này.
 */
export interface StageDef {
  id: string;
  name: string;
  rows: readonly string[];
  /** Các đoạn theo cột tăng dần, cho nhật ký chơi thử và báo cáo. */
  sections: readonly StageSection[];
  /** Ký hiệu chữ hoa trên bản đồ → kẻ địch. */
  enemyMarkers: Readonly<Record<string, EnemyPlacement>>;
  /** Ghi nhật ký chơi thử của cổng Prototype (chỉ màn xám). */
  playtest: boolean;
}
