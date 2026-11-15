/**
 * Khung camera theo trạng thái màn (QB-121): trong phòng boss khóa đúng khung đấu trường (từ cột
 * cửa tới hết bản đồ); trong phòng khóa đang đóng cửa khóa trong phòng (gồm hai cột cửa); còn lại
 * là cả bản đồ. Scene chỉ gọi `setBounds` khi `key` đổi. Logic thuần.
 */

export interface CameraRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CameraLock {
  /** 'boss', `room<chỉ số>` hoặc undefined (không khóa). */
  key: string | undefined;
  bounds: CameraRect;
}

/** Phần StageWorld cần để tính khung camera. */
export interface CameraSource {
  readonly phase: string;
  readonly gateCol: number | undefined;
  readonly rooms: readonly {
    readonly state: string;
    readonly spawn: { readonly first: number; readonly last: number };
  }[];
  readonly map: { readonly cols: number; readonly widthPx: number; readonly heightPx: number };
}

export function cameraLockFor(world: CameraSource, tileSize: number): CameraLock {
  const { map } = world;
  if (world.phase === 'boss' && world.gateCol !== undefined) {
    return {
      key: 'boss',
      bounds: {
        x: world.gateCol * tileSize,
        y: 0,
        w: (map.cols - world.gateCol) * tileSize,
        h: map.heightPx,
      },
    };
  }
  const index = world.rooms.findIndex((r) => r.state === 'locked');
  const room = world.rooms[index];
  if (room) {
    const r = room.spawn;
    return {
      key: `room${index}`,
      bounds: {
        x: r.first * tileSize,
        y: 0,
        w: (r.last - r.first + 1) * tileSize,
        h: map.heightPx,
      },
    };
  }
  return { key: undefined, bounds: { x: 0, y: 0, w: map.widthPx, h: map.heightPx } };
}
