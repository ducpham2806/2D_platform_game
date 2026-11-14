/**
 * Ghép sâu một khối ghi đè lên dữ liệu gốc (bản Thử thách trong enemies.json, bosses.json; GDD 11
 * mục 2.6): đối tượng ghép từng khóa, mảng và giá trị khác thì thay cả. Không sửa đầu vào.
 * Kết quả phải qua cùng bộ kiểm tra như dữ liệu gốc. Logic thuần.
 */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = k in base ? deepMerge(base[k], v) : v;
  return out;
}
