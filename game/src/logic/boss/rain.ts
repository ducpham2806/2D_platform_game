import type { Rng } from '../rng';

/**
 * Chọn các cột ô sẽ có đạn rơi trong đòn "Mưa đạn": mọi cột trong đấu trường trừ `gaps`
 * khe an toàn, mỗi khe rộng `gapWidth` ô, không chồng nhau và không sát tường (GDD 9:
 * đòn đỉnh nhưng luôn có khe né). Trả về [cột rơi, các khe (cột bắt đầu)].
 */
export function planRain(
  firstCol: number,
  lastCol: number,
  gaps: number,
  gapWidth: number,
  rng: Rng,
): { dropCols: number[]; gapStarts: number[] } {
  const width = lastCol - firstCol + 1;
  // Cần chỗ cho mọi khe và ít nhất một cột đạn giữa hai khe kề nhau.
  if (gaps * (gapWidth + 1) > width) throw new RangeError('Đấu trường quá hẹp cho số khe an toàn');
  const gapStarts: number[] = [];
  let tries = 0;
  while (gapStarts.length < gaps && tries < 500) {
    tries += 1;
    const start = firstCol + Math.floor(rng() * (width - gapWidth + 1));
    const clash = gapStarts.some((g) => start < g + gapWidth + 1 && g < start + gapWidth + 1);
    if (!clash) gapStarts.push(start);
  }
  // Rơi vào vòng thử quá lâu (hiếm): rải khe đều để vẫn đảm bảo đủ khe.
  if (gapStarts.length < gaps) {
    gapStarts.length = 0;
    const step = Math.floor(width / gaps);
    for (let i = 0; i < gaps; i += 1) gapStarts.push(firstCol + i * step);
  }
  gapStarts.sort((a, b) => a - b);
  const safe = new Set<number>();
  for (const g of gapStarts) for (let c = g; c < g + gapWidth; c += 1) safe.add(c);
  const dropCols: number[] = [];
  for (let c = firstCol; c <= lastCol; c += 1) if (!safe.has(c)) dropCols.push(c);
  return { dropCols, gapStarts };
}
