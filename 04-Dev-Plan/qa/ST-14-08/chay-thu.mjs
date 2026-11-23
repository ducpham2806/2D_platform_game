// Chạy thử ST-14-08: gợi ý chết không hết giờ khi tạm dừng, hiện lại sau hội thoại.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
const { preview } = await import('/home/user/2D_platform_game/game/node_modules/vite/dist/node/index.js');

const GAME_DIR = '/home/user/2D_platform_game/game';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const require = createRequire(GAME_DIR + '/package.json');
const { chromium } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = await preview({ root: GAME_DIR, preview: { port: 4181, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 576 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('http://localhost:4181/?debug=1');
await page.evaluate(() => { indexedDB.deleteDatabase('cyber-vanguard'); localStorage.clear(); });
await page.reload();
await page.waitForFunction(() => window.__cvGame?.scene.isActive('menu'), null, { timeout: 20000 });
await page.evaluate(() => window.__cvGame.scene.start('stage', { stage: 'thorna' }));
await page.waitForFunction(() => window.__cvWorld && window.__cvGame.scene.isActive('stage'));
await sleep(500);
const state = () => page.evaluate(() => {
  const s = window.__cvGame.scene.getScene('stage');
  const t = s.deathHint.timed;
  return { active: t?.active, left: t?.remainingSec, waited: t?.waitedSec, shown: s.deathHint.box?.bg?.visible, paused: !!s.pause?.isOpen, deaths: window.__cvWorld.deaths, talk: !!s.dialogue };
});
// Chết 3 lần liên tiếp (gây sát thương lớn bằng hàm debug), chờ hồi sinh giữa các lần.
for (let i = 0; i < 3; i += 1) {
  await page.evaluate(() => { const w = window.__cvWorld; w.player.applyHit(9999, w.player.centerX + 8); });
  await page.waitForFunction((n) => window.__cvWorld.deaths >= n && window.__cvWorld.player.state !== 'dead', i + 1, { timeout: 10000 });
  await sleep(300);
}
await sleep(1000);
const s1 = await state();
console.log('sau 3 lần chết', s1);
await page.screenshot({ path: join(OUT, 'pc-1-goi-y-hien.png') });
await page.keyboard.press('Escape');
await sleep(300);
const sP = await state();
console.log('vừa tạm dừng', sP);
await sleep(9000);
const s2 = await state();
console.log('tạm dừng 9 s', s2);
await page.screenshot({ path: join(OUT, 'pc-2-tam-dung-9s-goi-y-an.png') });
await page.keyboard.press('Escape');
await sleep(800);
const s3 = await state();
console.log('đóng menu', s3);
await page.screenshot({ path: join(OUT, 'pc-3-dong-menu-van-con.png') });
await sleep(Math.ceil((s3.left ?? 0) * 1000) + 800);
const s4 = await state();
console.log('hết giờ đọc', s4);
await page.screenshot({ path: join(OUT, 'pc-4-het-gio.png') });
console.log('lỗi console:', errors);
const ok = s1.active && s2.active && s2.paused && sP.paused && Math.abs(s2.left - sP.left) < 1e-6 && s1.shown && !sP.shown && !s2.shown && s3.shown && !s4.shown && s3.active && !s3.paused && !s4.active && errors.length === 0;
console.log(ok ? 'ĐẠT' : 'HỎNG');
await browser.close();
await server.close();
process.exit(ok ? 0 : 1);
