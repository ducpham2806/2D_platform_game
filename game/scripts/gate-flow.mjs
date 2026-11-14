// Chạy thử trọn luồng người thử cổng Prototype trước mỗi đợt (04-Dev-Plan/05-Cong-Prototype.md
// mục 7): link ?gate=1, máy tính (bàn phím) và Pixel 7 cầm ngang (chạm). Mỗi thiết bị: menu →
// màn xám → hạ boss → phiếu chấm → thoát về menu → Kết quả chơi thử → Sao chép JSON. Sau đó gộp
// hai gói như người tổng hợp (gói trùng không tính hai lần). Cần `npm run build` trước.
//
//   node scripts/gate-flow.mjs [--shots <thư mục ảnh>]
//
// Mã thoát 1 nếu có bước hỏng. Bỏ qua đoạn đường của màn xám (đưa Kai thẳng vào phòng boss,
// boss còn ít máu) vì mục tiêu là kiểm tra luồng, không phải độ khó.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const GAME_DIR = fileURLToPath(new URL('..', import.meta.url));
const PORT = 4180;
const URL_GATE = `http://localhost:${PORT}/?gate=1&debug=1`;
const LOGIC = { w: 320, h: 192 };
/** Tọa độ logic của nút trong menu người thử (scenes/menu-scene.ts, createGateMenu). */
const MENU = { play: { x: 160, y: 74 }, results: { x: 160, y: 142 } };

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const id of ['playwright', 'playwright-core']) {
    try {
      return require(id);
    } catch {
      // thử tên tiếp theo
    }
  }
  console.error('Thiếu Playwright: chạy `npm i -g playwright && npx playwright install chromium`.');
  process.exit(2);
}

const args = process.argv.slice(2);
const shotsIdx = args.indexOf('--shots');
const shots = shotsIdx >= 0 ? args[shotsIdx + 1] : undefined;
if (shots) mkdirSync(shots, { recursive: true });

const { chromium, devices } = loadPlaywright();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runDevice(browser, mode) {
  const touch = mode === 'touch';
  const context = await browser.newContext({
    ...(touch ? devices['Pixel 7 landscape'] : { viewport: { width: 960, height: 576 } }),
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const shot = async (name) => {
    if (shots) await page.screenshot({ path: join(shots, `${mode}-${name}.png`) });
  };
  const tapLogic = async ({ x, y }) => {
    const r = await page.evaluate(() => {
      const c = document.querySelector('canvas').getBoundingClientRect();
      return { x: c.left, y: c.top, w: c.width, h: c.height };
    });
    const px = r.x + (x * r.w) / LOGIC.w;
    const py = r.y + (y * r.h) / LOGIC.h;
    if (touch) await page.touchscreen.tap(px, py);
    else await page.mouse.click(px, py);
  };
  const tapButton = async (locator) => (touch ? locator.tap() : locator.click());
  /** Nút cảm ứng: lớp phủ nhận chạm (không phải từng nút), nên chạm theo tọa độ. */
  const tapTouchButton = async (id) => {
    const b = await page.locator(`.touch-button[data-id="${id}"]`).boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  };

  await page.goto(URL_GATE);
  await page.evaluate(() => {
    indexedDB.deleteDatabase('cyber-vanguard');
    localStorage.clear();
  });
  await page.reload();
  await page.waitForFunction(() => window.__cvGame?.scene.isActive('menu'), null, {
    timeout: 15000,
  });
  await shot('1-menu');
  if (touch) await tapLogic(MENU.play);
  else await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__cvGame.scene.isActive('stage') && window.__cvWorld);
  // Phiên phải dài ≥ 10 s mới được tính.
  await sleep(11000);
  await page.evaluate(() => {
    const w = window.__cvWorld;
    w.player.box.x = (w.gateCol + 3) * 16;
    w.player.box.y = 10 * 16 - w.player.box.h;
  });
  await sleep(800);
  await page.evaluate(() => {
    window.__cvWorld.boss.hp = 4;
  });
  let won = false;
  for (let i = 0; i < 80 && !won; i += 1) {
    await page.evaluate(() => {
      const w = window.__cvWorld;
      w.player.hp = w.player.maxHp;
    });
    if (touch) await tapTouchButton('shoot');
    else await page.keyboard.press('j');
    await sleep(120);
    won = await page.evaluate(() => {
      const b = window.__cvWorld.boss;
      return !b || b.hp <= 0 || b.state === 'dead';
    });
  }
  if (!won) throw new Error(`${mode}: không hạ được boss`);
  await page.waitForSelector('.cv-rating', { timeout: 8000 });
  await shot('2-phieu-cham');
  for (const [row, score] of [
    [0, 4],
    [1, 5],
    [2, 4],
  ])
    await tapButton(
      page
        .locator('.cv-rating-row')
        .nth(row)
        .locator('button', { hasText: String(score) }),
    );
  await tapButton(page.locator('.cv-rating button', { hasText: 'Gửi' }));
  await sleep(300);
  if (touch) await tapTouchButton('pause');
  else await page.keyboard.press('Escape');
  await sleep(400);
  await shot('3-tam-dung');
  if (touch) {
    const quit = await page.evaluate(() => {
      const s = window.__cvGame.scene.getScene('stage');
      const t = s.children.list.find((o) => o.text === 'Thoát về menu');
      return t && { x: t.x, y: t.y };
    });
    if (!quit) throw new Error('touch: không thấy mục Thoát về menu');
    await tapLogic(quit);
    await sleep(200);
    await tapLogic(quit); // xác nhận thoát
  } else {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('k');
    await sleep(100);
    await page.keyboard.press('k'); // xác nhận thoát
  }
  await page.waitForFunction(() => window.__cvGame.scene.isActive('menu'), null, {
    timeout: 5000,
  });
  if (touch) await tapLogic(MENU.results);
  else await page.keyboard.press('r');
  await sleep(500);
  await shot('4-ket-qua');
  await tapButton(page.locator('button', { hasText: 'Sao chép JSON' }).first());
  await sleep(300);
  await tapButton(page.locator('button', { hasText: /^Sao chép$/ }).first());
  await sleep(300);
  const json = await page.evaluate(() => navigator.clipboard.readText());
  const pack = JSON.parse(json);
  const session = pack.sessions?.[0];
  const device = touch ? 'touch' : 'keyboard';
  const ok =
    pack.sessions?.length === 1 &&
    session.bossWins === 1 &&
    session.ratings?.jump === 4 &&
    (session.deviceSec?.[device] ?? 0) > 10;
  await context.close();
  return { mode, ok, json, errors, session };
}

async function checkMerge(browser, packs) {
  const context = await browser.newContext({ viewport: { width: 960, height: 576 } });
  const page = await context.newPage();
  await page.goto(URL_GATE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.__cvGame?.scene.isActive('menu'));
  await page.keyboard.press('r');
  await sleep(400);
  await page.locator('button', { hasText: 'Gộp nhật ký' }).first().click();
  const notes = [];
  for (const text of [...packs, packs[0]]) {
    await page.locator('textarea').last().fill(text);
    await page.locator('button', { hasText: /^Gộp$/ }).last().click();
    await sleep(250);
    notes.push(await page.locator('.cv-json .cv-panel-note').last().innerText());
  }
  await page.locator('.cv-json button', { hasText: 'Đóng' }).click();
  await sleep(300);
  if (shots) await page.screenshot({ path: join(shots, 'tong-hop-gop.png') });
  const summary = await page.locator('.cv-results').innerText();
  await context.close();
  const ok = /2 phiên tính được/.test(summary) && /thêm mới 0/.test(notes[notes.length - 1]);
  return { ok, notes, summary };
}

const server = await preview({
  root: GAME_DIR,
  logLevel: 'silent',
  preview: { port: PORT, strictPort: true, open: false },
});
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
let failed = false;
try {
  const runs = [];
  for (const mode of ['pc', 'touch']) {
    const r = await runDevice(browser, mode);
    runs.push(r);
    const s = r.session;
    console.log(
      `${r.ok && r.errors.length === 0 ? 'ĐẠT ' : 'HỎNG'} ${mode}: phiên ${Math.round(s?.durationSec ?? 0)} s, thắng boss ${s?.bossWins}, điểm ${JSON.stringify(s?.ratings)}, lỗi console ${r.errors.length}`,
    );
    if (!r.ok || r.errors.length > 0) failed = true;
    for (const e of r.errors) console.log('  ', e);
  }
  const merge = await checkMerge(
    browser,
    runs.map((r) => r.json),
  );
  console.log(`${merge.ok ? 'ĐẠT ' : 'HỎNG'} gộp nhật ký: ${merge.notes.join(' | ')}`);
  if (!merge.ok) failed = true;
} catch (e) {
  console.error('HỎNG', e);
  failed = true;
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
process.exit(failed ? 1 : 0);
