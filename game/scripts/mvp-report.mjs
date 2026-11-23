// Báo cáo cổng MVP (EP-13 ST-13-05a; 01-GDD/13-Do-luong-MVP.md mục 6, 7.3). Mọi phép tính ở
// src/logic/telemetry/report.ts và src/core/mvp-report.ts (thuần, có test); script chỉ đọc file và ghi.
//
// Cách chạy (trong game/):
//   npm run mvp-report -- --day0 2026-11-20 --wave d1 [--build a,b] [--data <hash>] [--tz 420]
//                         [--out <file.md>] <file.json> [...]
// File vào: JSON xuất tay (Cài đặt → Dữ liệu → Xuất JSON), bảng tải từ điểm nhận (mảng dòng có
// `payload`), hoặc mảng lô. Mặc định ghi 04-Dev-Plan/playtest/mvp-dot-<đợt>.md; không có --wave thì
// in ra màn hình. Thiếu --day0 thì không cắt cửa sổ đo và MV4 là Thiếu dữ liệu.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const GAME_DIR = fileURLToPath(new URL('..', import.meta.url));
const DATA_DIR = join(GAME_DIR, '..', '03-Data');

function parseArgs(argv) {
  const opts = { files: [] };
  const list = (v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`${a}: thiếu giá trị`);
      i += 1;
      return v;
    };
    if (a === '--day0') opts.day0 = next();
    else if (a === '--wave') opts.waves = list(next());
    else if (a === '--build' || a === '--builds') opts.builds = list(next());
    else if (a === '--data') opts.data = next();
    else if (a === '--tz') opts.tzMin = Number(next());
    else if (a === '--out') opts.out = next();
    else if (a === '--title') opts.title = next();
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a.startsWith('--')) throw new Error(`không rõ tham số ${a}`);
    else opts.files.push(a);
  }
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || opts.files.length === 0) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\nimport ')[0]);
  process.exit(opts.help ? 0 : 1);
}
if (opts.tzMin !== undefined && !Number.isInteger(opts.tzMin)) {
  console.error('--tz: cần số phút lệch UTC (ví dụ 420)');
  process.exit(1);
}

const files = {};
for (const name of readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')))
  files[name.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8'));
// INIT_CWD: thư mục nơi gọi `npm run`, để đường dẫn tương đối của người dùng đúng.
const cwd = process.env.INIT_CWD ?? process.cwd();
const inputs = opts.files.map((f) => JSON.parse(readFileSync(resolve(cwd, f), 'utf8')));

const { module } = await runnerImport(join(GAME_DIR, 'src/core/mvp-report.ts'), {
  configFile: false,
  logLevel: 'error',
});
const { report, markdown } = module.runMvpReport(files, inputs, opts);

const out =
  opts.out !== undefined
    ? resolve(cwd, opts.out)
    : opts.waves?.length
      ? join(GAME_DIR, '..', '04-Dev-Plan', 'playtest', `mvp-dot-${opts.waves.join('-')}.md`)
      : undefined;
if (out) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, markdown);
  console.log(`Đã ghi ${out}`);
} else {
  console.log(markdown);
}
const label = { pass: 'QUA cổng', fail: 'CHƯA QUA cổng', undecided: 'CHƯA KẾT LUẬN' };
console.error(
  `${label[report.conclusion]}: ${report.header.players} người, ${report.header.events} sự kiện.`,
);
