/**
 * Lưới ô cho va chạm (logic thuần). Tạo từ các dòng ký tự để dựng màn xám nhanh:
 *   '#' khối đặc, '=' bục một chiều (đứng lên được, nhảy xuyên từ dưới lên), '.' trống,
 *   'P' điểm xuất phát của Kai, 'B' boss, 'T' bia tập bắn, 'S' bia có khiên mặt trái,
 *   'D' cửa phòng boss (trống, đóng lại khi vào đấu trường); các chữ hoa khác là kẻ địch theo
 *   bảng của từng màn (StageDef.enemyMarkers). Mọi ký hiệu chữ đều là ô trống và được ghi vào
 *   `markers` để thế giới đặt đối tượng.
 * Bản đồ Tiled thật (M7) sẽ đổ vào cùng cấu trúc này.
 */
export const Tile = {
  Empty: 0,
  Solid: 1,
  OneWay: 2,
} as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

const CHAR_TO_TILE: Readonly<Record<string, Tile>> = {
  '.': Tile.Empty,
  ' ': Tile.Empty,
  '#': Tile.Solid,
  '=': Tile.OneWay,
};

export class TileMap {
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

  get widthPx(): number {
    return this.cols * this.tileSize;
  }

  get heightPx(): number {
    return this.rows * this.tileSize;
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
    this.tiles[row * this.cols + col] = tile;
  }

  isSolid(col: number, row: number): boolean {
    return this.get(col, row) === Tile.Solid;
  }

  isOneWay(col: number, row: number): boolean {
    return this.get(col, row) === Tile.OneWay;
  }
}
