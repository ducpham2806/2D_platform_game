import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Đọc thẳng 03-Data (nguồn thật) để test bắt được dữ liệu lệch nhau. */
export const DATA_DIR = resolve(__dirname, '../../03-Data');

export function loadData(): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  for (const name of readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))) {
    files[name.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8'));
  }
  return files;
}
