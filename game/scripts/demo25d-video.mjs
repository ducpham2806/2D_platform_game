// Quay video demo 2.5D (three.js) từng khung bằng Chromium rồi ghép bằng ffmpeg.
// Cần `npm run build` trước. Máy không có GPU vẫn ra video mượt vì mỗi khung tiến đúng 1/fps giây.
//
//   node scripts/demo25d-video.mjs <thư mục ra> [giây=20] [fps=30] [rộng=1280] [cao=720]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const [out = 'demo25d-video', sec = '20', fpsArg = '30', w = '1280', h = '720'] =
  process.argv.slice(2);
const fps = Number(fpsArg);
const frames = Math.round(Number(sec) * fps);
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const server = await preview({
  root: fileURLToPath(new URL('..', import.meta.url)),
  preview: { port: 4196, strictPort: true },
});
const tmp = join(out, 'frames');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:4196/demo-25d.html?auto=1&capture=1');
await page.waitForFunction(() => window.__demo?.advance, null, { timeout: 30000 });
for (let i = 0; i < frames; i += 1) {
  await page.evaluate((ms) => window.__demo.advance(ms), 1000 / fps);
  await page.screenshot({
    path: join(tmp, `f${String(i).padStart(5, '0')}.jpg`),
    type: 'jpeg',
    quality: 88,
  });
}
await browser.close();
server.httpServer.close();
const mp4 = join(out, 'demo-25d.mp4');
execFileSync('ffmpeg', [
  '-y',
  '-loglevel',
  'error',
  '-framerate',
  String(fps),
  '-i',
  join(tmp, 'f%05d.jpg'),
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-crf',
  '24',
  '-movflags',
  '+faststart',
  mp4,
]);
rmSync(tmp, { recursive: true, force: true });
console.log(`video: ${mp4} (${frames} khung), lỗi trang: ${errors.length}`);
