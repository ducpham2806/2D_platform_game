// Smoke check (04-Test-va-Launch.md mục 1, tầng Tích hợp): chạy luồng chính trên bản build bằng
// Chromium, kiểm tra từng bước và chụp ảnh làm bằng chứng trực quan.
//
//   menu → vào phòng boss Thorna → di chuyển/nhảy → tạm dừng → thoại trước trận → hạ boss →
//   thoại sau trận → màn Kết quả → tải lại trang (bản lưu còn) → bản cảm ứng (nút, hệ số phóng).
//
// Cách chạy (sau `npm run build`):
//   node scripts/smoke-check.mjs             # ảnh lưu ở smoke-shots/ (không commit)
// Mã thoát 1 nếu có bước hỏng hoặc có lỗi console. Cần Playwright và Chromium như gate-check.
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const GAME_DIR = fileURLToPath(new URL('..', import.meta.url));
const SHOTS = join(GAME_DIR, 'smoke-shots');
const PORT = 4181;
const URL_BASE = `http://localhost:${PORT}/?debug=1`;

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const id of ['playwright', 'playwright-core']) {
    try {
      return require(id);
    } catch {
      // thử tên tiếp theo
    }
  }
  try {
    return require(require.resolve('playwright', { paths: [process.env.NODE_PATH ?? ''] }));
  } catch {
    console.error(
      'Thiếu Playwright: chạy `npm i -g playwright && npx playwright install chromium`.',
    );
    process.exit(2);
  }
}

const results = [];
let shotIndex = 0;

/** Chạy một bước; hỏng thì ghi lại và chạy tiếp các bước sau để thấy hết lỗi trong một lần. */
async function check(page, name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail ?? '' });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e?.message ?? e).split('\n')[0] });
  }
  shotIndex += 1;
  const file = `${String(shotIndex).padStart(2, '0')}-${name.replace(/[^a-z0-9]+/gi, '-')}.png`;
  await page.screenshot({ path: join(SHOTS, file) }).catch(() => undefined);
}

function expect(cond, message) {
  if (!cond) throw new Error(message);
}

async function watch(context) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return { page, errors };
}

const waitScene = (page, key) =>
  page.waitForFunction((k) => window.__cvGame?.scene.isActive(k), key, { timeout: 20000 });
const stage = (page, fn) => page.evaluate(fn);
const talking = (page) =>
  page.evaluate(() => !!window.__cvGame.scene.getScene('stage').dialogue?.director.active);

async function desktopFlow(browser) {
  const context = await browser.newContext({ viewport: { width: 960, height: 576 } });
  const { page, errors } = await watch(context);

  await check(page, 'menu', async () => {
    await page.goto(URL_BASE);
    await waitScene(page, 'menu');
  });

  await check(page, 'vao-man', async () => {
    await page.keyboard.press('KeyB');
    await waitScene(page, 'stage');
    await page.waitForFunction(() => window.__cvWorld);
    await page.waitForTimeout(300);
  });

  await check(page, 'di-chuyen-nhay', async () => {
    const x0 = await stage(page, () => window.__cvWorld.player.box.x);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');
    const x1 = await stage(page, () => window.__cvWorld.player.box.x);
    expect(x1 > x0 + 8, `Kai không đi sang phải (${x0} → ${x1})`);
    await page.keyboard.down('KeyK');
    await page.waitForFunction(() => !window.__cvWorld.player.grounded, null, { timeout: 2000 });
    await page.keyboard.up('KeyK');
    await page.waitForFunction(() => window.__cvWorld.player.grounded, null, { timeout: 3000 });
    const sfx = await stage(page, () => window.__cvGame.registry.get('cv.sfx').ctx?.state);
    expect(sfx === 'running', `âm thanh chưa chạy sau cú bấm phím (${sfx})`);
    return `x ${Math.round(x0)} → ${Math.round(x1)}, âm thanh ${sfx}`;
  });

  await check(page, 'tam-dung', async () => {
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__cvGame.scene.getScene('stage').pause.isOpen);
    const x0 = await stage(page, () => window.__cvWorld.player.box.x);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(250);
    await page.keyboard.up('ArrowRight');
    const x1 = await stage(page, () => window.__cvWorld.player.box.x);
    expect(x0 === x1, 'trận vẫn chạy khi đang tạm dừng');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !window.__cvGame.scene.getScene('stage').pause.isOpen);
  });

  await check(page, 'thoai-truoc-tran', async () => {
    await stage(page, () => {
      const w = window.__cvWorld;
      w.player.box.x = (w.gateCol + 3) * 16;
    });
    await page.waitForFunction(
      () => !!window.__cvGame.scene.getScene('stage').dialogue?.director.active,
      null,
      { timeout: 5000 },
    );
    await page.waitForTimeout(400);
    const hp0 = await stage(page, () => window.__cvWorld.player.box.x);
    await page.waitForTimeout(300);
    expect(
      hp0 === (await stage(page, () => window.__cvWorld.player.box.x)),
      'trận chạy trong lúc thoại',
    );
  });

  await check(page, 'ha-boss-thoai-sau-tran', async () => {
    // Bấm Tiếp hai lần (hiện hết câu, rồi đóng); cách nhau đủ xa để rơi vào hai bước logic.
    await page.keyboard.press('KeyK');
    await page.waitForTimeout(120);
    await page.keyboard.press('KeyK');
    await page.waitForFunction(
      () => !window.__cvGame.scene.getScene('stage').dialogue?.director.active,
    );
    await stage(page, () => (window.__cvWorld.boss.hp = 0.01));
    for (let i = 0; i < 200; i += 1) {
      if (await stage(page, () => window.__cvWorld.boss.hp <= 0)) break;
      await page.keyboard.press('KeyJ');
      await page.waitForTimeout(60);
    }
    expect(await stage(page, () => window.__cvWorld.boss.hp <= 0), 'không hạ được boss');
    await page.waitForFunction(
      () => !!window.__cvGame.scene.getScene('stage').dialogue?.director.active,
      null,
      { timeout: 5000 },
    );
    await page.waitForTimeout(500);
  });

  await check(page, 'ket-qua', async () => {
    if (await talking(page)) await page.keyboard.press('Escape');
    // Làm bước hướng dẫn "thử vũ khí mới" (đổi sang Vine Lash rồi bắn) để màn kết thúc sớm.
    await page.waitForFunction(
      () => window.__cvGame.scene.getScene('stage').tutorial?.manager.view !== undefined,
      null,
      { timeout: 8000 },
    );
    // Phím bấm cùng bước với cú Bỏ qua bị hội thoại nuốt: chờ hội thoại đóng hẳn rồi mới bấm.
    await page.waitForTimeout(400);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(150);
    await page.keyboard.press('KeyJ');
    await waitScene(page, 'result');
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => window.__cvGame.scene.getScene('result').data_.result);
    expect(r.weapon === 'Vine Lash', `không ghi nhận vũ khí mới (${r.weapon})`);
    expect(r.expGained > 0 && r.coreBitsGained > 0, 'không có thưởng EXP/Core Bit');
    return `EXP +${r.expGained}, Core Bit +${r.coreBitsGained}, cấp ${r.levelBefore} → ${r.levelAfter}`;
  });

  await check(page, 'luu-sau-khi-tai-lai', async () => {
    await page.keyboard.press('KeyK');
    await waitScene(page, 'menu');
    await page.reload();
    await waitScene(page, 'menu');
    const save = await page.evaluate(() => window.__cvGame.registry.get('cv.save').data);
    expect(save.progress.bossesDefeated.includes('thorna'), 'bản lưu mất boss đã hạ');
    expect(save.character.weapons.includes('Vine Lash'), 'bản lưu mất vũ khí');
    return `boss ${save.progress.bossesDefeated.join(',')}; Core Bit ${save.inventory.coreBits}`;
  });

  await context.close();
  return errors;
}

async function touchFlow(browser, playwright) {
  const context = await browser.newContext({ ...playwright.devices['Pixel 7 landscape'] });
  const { page, errors } = await watch(context);

  await check(page, 'cam-ung-vao-man', async () => {
    await page.goto(URL_BASE);
    await waitScene(page, 'menu');
    const view = page.viewportSize();
    await page.touchscreen.tap(view.width / 2, view.height / 2);
    await page.evaluate(() =>
      window.__cvGame.scene.getScene('menu').scene.start('stage', { stage: 'thorna' }),
    );
    await page.waitForFunction(() => window.__cvWorld);
    await page.touchscreen.tap(view.width / 2, view.height / 2);
    await page.waitForTimeout(400);
    const info = await page.evaluate(() => {
      const c = document.querySelector('canvas').getBoundingClientRect();
      const buttons = [...document.querySelectorAll('[data-id]')].filter(
        (b) => b.getBoundingClientRect().width > 0,
      );
      const small = buttons.filter((b) => b.getBoundingClientRect().width < 48).length;
      return { h: c.height, view: window.innerHeight, buttons: buttons.length, small };
    });
    expect(info.h / info.view > 0.7, `khung game chỉ cao ${info.h}/${info.view} px`);
    expect(info.buttons >= 4, `chỉ thấy ${info.buttons} nút cảm ứng`);
    expect(info.small === 0, `${info.small} nút cảm ứng nhỏ hơn 48 px`);
    return `khung game cao ${Math.round(info.h)}/${info.view} px, ${info.buttons} nút cảm ứng`;
  });

  await context.close();
  return errors;
}

const playwright = loadPlaywright();
rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });
const server = await preview({
  root: GAME_DIR,
  logLevel: 'silent',
  preview: { port: PORT, strictPort: true, open: false },
});
const browser = await playwright.chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
let errors = [];
try {
  errors = [...(await desktopFlow(browser)), ...(await touchFlow(browser, playwright))];
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}

console.log('\n| Bước | Kết quả | Chi tiết |\n| --- | --- | --- |');
for (const r of results) console.log(`| ${r.name} | ${r.ok ? 'ĐẠT' : 'HỎNG'} | ${r.detail} |`);
console.log(`| lỗi console | ${errors.length === 0 ? 'ĐẠT' : 'HỎNG'} | ${errors.join(' · ')} |`);
console.log(`\nẢnh chụp: ${SHOTS}`);
process.exit(results.every((r) => r.ok) && errors.length === 0 ? 0 : 1);
