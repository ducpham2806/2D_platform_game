// Kiểm tra "đầu vào" của phiên làm việc (rà soát 14/11/2026, tối ưu đầu vào):
// - nhật ký phiên tối đa 3 mục (CLAUDE.md), mục dài quá thì cảnh báo;
// - file bắt đầu phiên và CONTEXT trong ngân sách;
// - đường dẫn trong các file chỉ mục trỏ tới file có thật.
// Chạy: npm run docs-check (trong game/). Lỗi thì thoát mã 1; cảnh báo thì không.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const errors = [];
const warnings = [];
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// Nhật ký: các mục bắt đầu bằng "## YYYY-MM-DD" sau dòng "---".
const LOG = '04-Dev-Plan/06-Nhat-ky-phien.md';
const MAX_ENTRIES = 3;
const SOFT_ENTRY_LINES = 20;
const log = read(LOG);
const body = log.slice(log.indexOf('\n---\n') + 1);
const entries = body.split(/\n(?=## \d{4}-\d{2}-\d{2})/).filter((e) => /^## \d{4}/.test(e));
if (entries.length > MAX_ENTRIES)
  errors.push(`${LOG}: ${entries.length} mục, tối đa ${MAX_ENTRIES} (chuyển mục cũ vào luu-tru/)`);
const HARD_ENTRY_LINES = 25;
entries.forEach((e, i) => {
  const n = e.trimEnd().split('\n').length;
  const title = e.split('\n')[0].slice(3);
  // Mục mới nhất (phiên vừa ghi) dài quá thì là lỗi; mục cũ chỉ cảnh báo.
  if (i === 0 && n > HARD_ENTRY_LINES)
    errors.push(`${LOG}: mục mới nhất "${title}" dài ${n} dòng, tối đa ${HARD_ENTRY_LINES}`);
  else if (n > SOFT_ENTRY_LINES) warnings.push(`${LOG}: mục "${title}" dài ${n} dòng (khoảng 15)`);
});

// Ngân sách file đọc đầu phiên.
const budgets = [
  { path: '04-Dev-Plan/00-Bat-dau.md', maxLines: 60 },
  { path: 'CLAUDE.md', maxLines: 60 },
  { path: 'game/CONTEXT.md', maxKb: 20 },
];
for (const b of budgets) {
  if (!existsSync(join(ROOT, b.path))) {
    errors.push(`${b.path}: không có file`);
    continue;
  }
  if (b.maxLines !== undefined) {
    const n = read(b.path).trimEnd().split('\n').length;
    if (n > b.maxLines) errors.push(`${b.path}: ${n} dòng, tối đa ${b.maxLines}`);
  }
  if (b.maxKb !== undefined) {
    const kb = statSync(join(ROOT, b.path)).size / 1024;
    if (kb > b.maxKb) errors.push(`${b.path}: ${kb.toFixed(1)} KB, tối đa ${b.maxKb} KB`);
  }
}

// Đường dẫn trong file chỉ mục phải tồn tại (chỉ xét đường dẫn trong dấu `...` có đuôi .md/.json).
const INDEX_FILES = [
  'CLAUDE.md',
  'README.md',
  '04-Dev-Plan/00-Bat-dau.md',
  '04-Dev-Plan/01-Ke-hoach-lam-viec.md',
  '04-Dev-Plan/07-Ban-do-he-thong.md',
  'game/CONTEXT.md',
];
const BASES = [
  '',
  '01-GDD/',
  '03-Data/',
  '04-Dev-Plan/',
  '04-Dev-Plan/stories/',
  '04-Dev-Plan/stories/xong/',
  '05-Assets/',
  'game/',
];
// Không kiểm: file ở repo khác (Game Studio Agent) và file dữ liệu đã lên kế hoạch, chưa tạo.
const EXTERNAL = ['templates/story-template.md'];
const PLANNED = ['armor.json', 'quests.json', 'strings.vi/en.json', 'audio.json'];
for (const file of INDEX_FILES) {
  if (!existsSync(join(ROOT, file))) {
    errors.push(`${file}: không có file chỉ mục`);
    continue;
  }
  for (const m of read(file).matchAll(/`([\w./-]+\.(?:md|json))`/g)) {
    const ref = m[1];
    if (EXTERNAL.includes(ref) || PLANNED.includes(ref)) continue;
    const found = BASES.some((base) => existsSync(join(ROOT, base + ref)));
    if (!found) errors.push(`${file}: trỏ tới \`${ref}\` nhưng không tìm thấy`);
  }
}

for (const w of warnings) console.warn(`cảnh báo: ${w}`);
for (const e of errors) console.error(`lỗi: ${e}`);
if (errors.length > 0) process.exit(1);
console.log(`docs-check: đạt (${warnings.length} cảnh báo)`);
