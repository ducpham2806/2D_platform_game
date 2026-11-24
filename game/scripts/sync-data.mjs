// Chép 03-Data/*.json (nguồn số liệu duy nhất) sang public/data/ để game nạp lúc chạy.
// Không sửa tay public/data/: thư mục này bị gitignore và được tạo lại mỗi lần dev/build.
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../../03-Data');
const target = resolve(here, '../public/data');

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

const files = readdirSync(source)
  .filter((name) => name.endsWith('.json'))
  .sort();
for (const name of files) {
  copyFileSync(join(source, name), join(target, name));
}
// Phòng thử 3D tự nạp dữ liệu riêng. Các trang Phaser và 2.5D đọc danh sách chung.
const shared = files.filter((name) => name !== 'prototype3d.json');
writeFileSync(join(target, 'manifest.json'), `${JSON.stringify({ files: shared }, null, 2)}\n`);
console.log(`sync-data: ${files.length} file JSON -> public/data`);
