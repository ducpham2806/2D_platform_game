// Chạy thử ST-15-14 (QB-31): một đòn lớn làm Thorna kẹp pha, trắng suốt lúc bất tử, rồi trở lại.
// Gọi từ game/ sau `npm run build`: node ../04-Dev-Plan/qa/ST-15-14/chay-thu.mjs <thư mục ảnh>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const GAME_DIR = process.cwd();
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const { preview } = await import(pathToFileURL(join(GAME_DIR, 'node_modules/vite/dist/node/index.js')).href);
const require = createRequire(join(GAME_DIR, 'package.json'));
const { chromium } = require('playwright');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = await preview({ root: GAME_DIR, preview: { port: 4183, strictPort: true }, logLevel: 'error' });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 576 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto('http://localhost:4183/?debug=1');
await page.evaluate(() => { indexedDB.deleteDatabase('cyber-vanguard'); localStorage.clear(); });
await page.reload();
await page.waitForFunction(() => window.__cvGame?.scene.isActive('menu'), null, { timeout: 20000 });
await page.evaluate(() => window.__cvGame.scene.start('stage', { stage: 'thorna' }));
await page.waitForFunction(() => window.__cvWorld && window.__cvGame.scene.isActive('stage'));
// Vào đấu trường; bỏ qua thoại trước trận bằng phím Lướt.
await page.evaluate(() => { const w = window.__cvWorld; w.player.respawn((w.arena.first + 3) * 16, 11 * 16); });
await sleep(600);
for (let i = 0; i < 3; i += 1) { await page.keyboard.press('l'); await sleep(300); }
await page.waitForFunction(() => window.__cvWorld.phase === 'boss' && !window.__cvGame.scene.getScene('stage').dialogue, null, { timeout: 10000 });
// Đưa Kai lại gần boss để camera thấy boss.
await page.evaluate(() => { const w = window.__cvWorld; w.player.respawn(w.boss.centerX - 7 * 16, 11 * 16); });
await sleep(1500);
const read = () => page.evaluate(() => { const b = window.__cvWorld.boss; return { hpPct: Math.round(b.hpPct * 10) / 10, phase: b.phase, shifting: b.shifting }; });
await page.screenshot({ path: join(OUT, 'pc-1-truoc-don.png') });
await page.evaluate(() => { const b = window.__cvWorld.boss; b.takeHit({ amount: b.data.hp * 0.8, weak: false, stunSec: 0 }); });
await sleep(150);
const s1 = await read();
await page.screenshot({ path: join(OUT, 'pc-2-kep-pha-bat-tu.png') });
await sleep(900);
const s2 = await read();
await page.screenshot({ path: join(OUT, 'pc-3-het-bat-tu.png') });
console.log(s1, s2, 'lỗi console:', errors);
const ok = s1.shifting && s1.hpPct === 60 && !s2.shifting && s2.phase === 1 && errors.length === 0;
console.log(ok ? 'ĐẠT' : 'HỎNG');
await browser.close();
await server.close();
process.exit(ok ? 0 : 1);
