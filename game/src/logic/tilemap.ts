/**
 * Lưới ô cho va chạm (logic thuần). Tạo từ các dòng ký tự để dựng màn xám nhanh:
 *   '#' khối đặc, '=' bục một chiều (đứng lên được, nhảy xuyên từ dưới lên), '.' trống,
 *   '^' bẫy gai (không chặn, chạm vào thì mất máu và về chỗ an toàn),
 *   'P' điểm xuất phát của Kai, 'B' boss, 'T' bia tập bắn, 'S' bia có khiên mặt trái,
 *   'D' cửa phòng boss (trống, đóng lại khi vào đấu trường); các chữ hoa khác là kẻ địch theo
 *   bảng của từng màn (StageDef.enemyMarkers). Mọi ký hiệu chữ đều là ô trống và được ghi vào
 *   `markers` để thế giới đặt đối tượng.
 * Bản đồ Tiled (M7) dựng lưới bằng `TileMap.fromTiles` (xem logic/stage/tiled.ts); ký hiệu đặt
 * đối tượng của cả hai nguồn được gom vào StageLayout (logic/stage/layout.ts).
 */
export const Tile = {
  Empty: 0,
  Solid: 1,
  OneWay: 2,
  Hazard: 3,
} as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

const CHAR_TO_TILE: Readonly<Record<string, Tile>> = {
  '.': Tile.Empty,
  ' ': Tile.Empty,
  '#': Tile.Solid,
  '=': Tile.OneWay,
  '^': Tile.Hazard,
};

export class TileMap {
  private edits = 0;

  private constructor(
    readonly cols: number,
    readonly rows: number,
    readonly tileSize: number,
    private readonly tiles: Uint8Array,
    /** Tâm đáy ô 'P' (px), hoặc undefined nếu không có. */
    readonly spawn: { x: number; y: number } | undefined,
    /** Các ký hiệu chữ hoa và vị trí ô của chúng. */
    readonly markers: ReadonlyArray<{ ch: string; col: number; row: number }>,
  ) {}

  static fromRows(rows: readonly string[], tileSize: number): TileMap {
    if (rows.length === 0) throw new Error('Bản đồ rỗng');
    const cols = Math.max(...rows.map((r) => r.length));
    const tiles = new Uint8Array(cols * rows.length);
    let spawn: { x: number; y: number } | undefined;
    const markers: { ch: string; col: number; row: number }[] = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < cols; x += 1) {
        const ch = row[x] ?? '.';
        // Mọi chữ hoa là ký hiệu đặt đối tượng, đứng trên ô trống.
        const tile = /[A-Z]/.test(ch) ? Tile.Empty : CHAR_TO_TILE[ch];
        if (tile === undefined) throw new Error(`Ký tự lạ "${ch}" ở dòng ${y}, cột ${x}`);
        tiles[y * cols + x] = tile;
        if (ch === 'P') spawn = { x: (x + 0.5) * tileSize, y: (y + 1) * tileSize };
        if (/[A-Z]/.test(ch)) markers.push({ ch, col: x, row: y });
      }
    });
    return new TileMap(cols, rows.length, tileSize, tiles, spawn, markers);
  }

  /** Lưới dựng sẵn (bản đồ Tiled). `tiles` dài đúng cols × rows, theo hàng. */
  static fromTiles(
    cols: number,
    rows: number,
    tileSize: number,
    tiles: Uint8Array,
    spawn?: { x: number; y: number },
  ): TileMap {
    if (cols <= 0 || rows <= 0) throw new Error('Bản đồ rỗng');
    if (tiles.length !== cols * rows)
      throw new Error(`Lưới ô dài ${tiles.length}, cần ${cols} × ${rows}`);
    return new TileMap(cols, rows, tileSize, tiles, spawn, []);
  }

  get widthPx(): number {
    return this.cols * this.tileSize;
  }

  get heightPx(): number {
    return this.rows * this.tileSize;
  }

  /** Đổi khi hình học của lưới thay đổi (cửa mở/đóng, vật chắn vỡ). */
  get revision(): number {
    return this.edits;
  }

  /** Ngoài hai cạnh trái/phải coi như tường; trên và dưới bản đồ là trống (rơi xuống hố). */
  get(col: number, row: number): Tile {
    if (col < 0 || col >= this.cols) return Tile.Solid;
    if (row < 0 || row >= this.rows) return Tile.Empty;
    return (this.tiles[row * this.cols + col] ?? Tile.Empty) as Tile;
  }

  /** Đổi một ô (ví dụ đóng/mở cửa phòng boss). Ngoài bản đồ thì bỏ qua. */
  set(col: number, row: number, tile: Tile): void {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
    const index = row * this.cols + col;
    if (this.tiles[index] !== tile) {
      this.tiles[index] = tile;
      this.edits += 1;
    }
  }

  isSolid(col: number, row: number): boolean {
    return this.get(col, row) === Tile.Solid;
  }

  isOneWay(col: number, row: number): boolean {
    return this.get(col, row) === Tile.OneWay;
  }

  isHazard(col: number, row: number): boolean {
    return this.get(col, row) === Tile.Hazard;
  }

  /** Hộp (px) có chạm ô gai nào không. */
  overlapsHazard(box: { x: number; y: number; w: number; h: number }): boolean {
    const t = this.tileSize;
    const c0 = Math.floor(box.x / t);
    const c1 = Math.floor((box.x + box.w - 1e-6) / t);
    const r0 = Math.floor(box.y / t);
    const r1 = Math.floor((box.y + box.h - 1e-6) / t);
    for (let r = r0; r <= r1; r += 1)
      for (let c = c0; c <= c1; c += 1) if (this.isHazard(c, r)) return true;
    return false;
  }
}
