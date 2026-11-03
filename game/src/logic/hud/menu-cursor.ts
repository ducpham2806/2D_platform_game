/**
 * Con trỏ chọn mục cho menu điều khiển bằng bàn phím/tay cầm (menu tạm dừng...). Bỏ qua mục
 * bị khóa, đi vòng ở hai đầu. Logic thuần.
 */
export class MenuCursor {
  index: number;

  constructor(private readonly enabled: readonly boolean[]) {
    const first = enabled.indexOf(true);
    if (first < 0) throw new Error('Menu cần ít nhất một mục dùng được');
    this.index = first;
  }

  /** dir: -1 lên, 1 xuống. */
  move(dir: 1 | -1): number {
    const n = this.enabled.length;
    let i = this.index;
    for (let k = 0; k < n; k += 1) {
      i = (i + dir + n) % n;
      if (this.enabled[i]) {
        this.index = i;
        break;
      }
    }
    return this.index;
  }

  /** Chọn thẳng một mục (chạm/chuột); mục khóa thì không đổi. */
  select(i: number): boolean {
    if (!this.enabled[i]) return false;
    this.index = i;
    return true;
  }
}
