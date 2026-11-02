// Đo tự động cho cổng Prototype (GDD 15, 17): dung lượng tải, thời gian vào game, FPS khi CPU
// chậm như điện thoại tầm trung, và độ trễ từ lúc bấm phím/chạm đến khung hình có phản hồi.
//
// Cách chạy (sau `npm run build`):
//   node scripts/gate-check.mjs                # in bảng kết quả
//   node scripts/gate-check.mjs --json out.json # thêm file JSON
// Cần Playwright và Chromium: `npm i -g playwright && npx playwright install chromium`
// (hoặc đặt CHROMIUM_PATH tới một Chrome/Chromium có sẵn).
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { preview } from 'vite';

const GAME_DIR = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(GAME_DIR, 'dist');
const PORT = 4179;

/** Ngưỡng của cổng. CPU chậm 4× ≈ điện thoại tầm trung (~3 GB RAM) so với laptop. */
const LIMITS = {
  initialMB: 30,
  enterSec: 3,
  fps: 55,
  latencyMs: 50,
};
const PHONE_CPU = 4;
const WEAK_PHONE_CPU = 6;
/** Mạng 4G thường dùng để ước tính thời gian tải bản nén (máy chủ Pages có nén gzip). */
const NET_MBPS = 4;
const NET_RTT_MS = 60;

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
    // Cài toàn cục (npm i -g playwright).
    return require(require.resolve('playwright', { paths: [process.env.NODE_PATH ?? ''] }));
  } catch {
    console.error(
      'Thiếu Playwright: chạy `npm i -g playwright && npx playwright install chromium`.',
    );
    process.exit(2);
  }
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function measureSize() {
  let raw = 0;
  let gz = 0;
  for (const file of walk(DIST)) {
    const bytes = readFileSync(file);
    raw += bytes.length;
    gz += /\.(js|css|html|json|svg)$/.test(file) ? gzipSync(bytes).length : bytes.length;
  }
  return {
    rawMB: raw / 1e6,
    gzipMB: gz / 1e6,
    estimatedNetSec: (gz * 8) / (NET_MBPS * 1e6) + (4 * NET_RTT_MS) / 1000,
  };
}

function percentile(values, p) {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function openGame(browser, { cpu = 1, touch = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 960, height: 540 },
    hasTouch: touch,
    isMobile: false,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const cdp = await context.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const t0 = Date.now();
  await page.goto(`http://localhost:${PORT}/?debug=1`);
  await page.waitForFunction(() => window.__cvGame?.scene.isActive('menu'), null, {
    timeout: 30000,
  });
  const enterSec = (Date.now() - t0) / 1000;
  return { context, page, errors, enterSec };
}

async function startStage(page) {
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__cvGame?.scene.isActive('stage') && window.__cvWorld);
  await page.waitForTimeout(300);
}

/**
 * Đưa Kai vào phòng boss, hạ máu boss xuống pha cuối (có Mưa đạn, nhiều đạn nhất), giữ Kai
 * không chết, và đếm khung hình trong `seconds` giây.
 */
async function measureBossFps(page, seconds) {
  return page.evaluate(async (sec) => {
    const w = window.__cvWorld;
    const game = window.__cvGame;
    w.player.box.x = (w.gateCol + 3) * 16;
    w.player.box.y = 10 * 16 - w.player.box.h;
    await new Promise((r) => setTimeout(r, 400));
    if (w.boss) w.boss.hp = Math.floor(w.boss.data.hp * 0.25);
    const keepAlive = setInterval(() => {
      w.player.hp = w.player.maxHp;
      if (w.boss && w.boss.hp < 5) w.boss.hp = Math.floor(w.boss.data.hp * 0.25);
    }, 100);
    // Đo cả thời gian một bước logic để biết còn dư bao nhiêu.
    const step = w.step.bind(w);
    let stepMs = 0;
    let stepN = 0;
    w.step = (input) => {
      const t = performance.now();
      const ev = step(input);
      stepMs += performance.now() - t;
      stepN += 1;
      return ev;
    };
    const deltas = [];
    let maxShots = 0;
    await new Promise((resolve) => {
      let last = performance.now();
      const end = last + sec * 1000;
      const tick = (now) => {
        deltas.push(now - last);
        last = now;
        maxShots = Math.max(maxShots, w.pool.all.length);
        if (now < end) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    clearInterval(keepAlive);
    w.step = step;
    const total = deltas.reduce((a, b) => a + b, 0);
    return {
      fps: (deltas.length / total) * 1000,
      phaserFps: game.loop.actualFps,
      slowFrames: deltas.filter((d) => d > 1000 / 45).length / deltas.length,
      p95FrameMs: [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length * 0.95)],
      stepMs: stepMs / Math.max(1, stepN),
      maxProjectiles: maxShots,
      phase: w.phase,
      renderer: game.renderer.type === 2 ? 'WebGL' : 'Canvas',
    };
  }, seconds);
}

/**
 * Bấm Nhảy rồi chờ khung hình đầu tiên vẽ Kai đã rời đất (cuối khung đó, sự kiện postrender;
 * chưa tính thời gian màn hình hiển thị). Mỗi lần đo hai số:
 *   game:  từ lúc trang nhận sự kiện đến khung hình có phản hồi (phần game kiểm soát);
 *   total: từ dấu thời gian của sự kiện (event.timeStamp, lúc trình duyệt nhận) đến khung đó.
 */
async function measureLatency(page, trials, press) {
  await page.evaluate(() => {
    const w = window.__cvWorld;
    // Về chỗ đất phẳng đầu màn, xa vật cản.
    w.player.box.x = 3 * 16;
    w.player.box.y = 11 * 16 - w.player.box.h;
    window.__cvLat = { pending: undefined, samples: [] };
    const mark = (e) => {
      if (window.__cvLat.pending === undefined)
        window.__cvLat.pending = { stamp: e.timeStamp, recv: performance.now() };
    };
    window.addEventListener('keydown', mark, { capture: true });
    window.addEventListener('pointerdown', mark, { capture: true });
    window.__cvGame.events.on('postrender', () => {
      const lat = window.__cvLat;
      if (lat.pending !== undefined && w.player.vy < 0) {
        const now = performance.now();
        lat.samples.push({ game: now - lat.pending.recv, total: now - lat.pending.stamp });
        lat.pending = undefined;
      }
    });
  });
  for (let i = 0; i < trials; i += 1) {
    await page.waitForFunction(() => {
      const p = window.__cvWorld.player;
      return p.state === 'idle' || p.state === 'run';
    });
    await page.waitForTimeout(120 + Math.random() * 60);
    await press();
    await page.waitForFunction(() => window.__cvLat.pending === undefined, null, {
      timeout: 3000,
    });
    await page.waitForTimeout(450);
  }
  const samples = await page.evaluate(() => window.__cvLat.samples);
  const pick = (k) => samples.map((s) => s[k]);
  return {
    n: samples.length,
    game: { median: percentile(pick('game'), 50), p95: percentile(pick('game'), 95) },
    total: { median: percentile(pick('total'), 50), p95: percentile(pick('total'), 95) },
  };
}

function verdict(ok) {
  return ok ? 'ĐẠT' : 'CHƯA ĐẠT';
}

async function main() {
  const jsonOut = process.argv.includes('--json')
    ? process.argv[process.argv.indexOf('--json') + 1]
    : undefined;
  const { chromium } = loadPlaywright();
  const server = await preview({
    root: GAME_DIR,
    logLevel: 'silent',
    preview: { port: PORT, strictPort: true, open: false },
  });
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  const result = { date: new Date().toISOString(), limits: LIMITS };
  try {
    result.size = measureSize();

    const desk = await openGame(browser);
    result.enterDesktopSec = desk.enterSec;
    await startStage(desk.page);
    result.fpsDesktop = await measureBossFps(desk.page, 8);
    result.latencyKeyboard = await measureLatency(desk.page, 15, () =>
      desk.page.keyboard.press('KeyK'),
    );
    result.errors = [...desk.errors];
    await desk.context.close();

    const phone = await openGame(browser, { cpu: PHONE_CPU, touch: true });
    result.enterPhoneSec = phone.enterSec;
    await startStage(phone.page);
    result.fpsPhone = await measureBossFps(phone.page, 10);
    const jump = phone.page.locator('.touch-button[data-id="jump"]');
    // Chạm một lần cho lớp cảm ứng hiện ra.
    await phone.page.touchscreen.tap(200, 100);
    await jump.waitFor({ state: 'visible', timeout: 5000 });
    const box = await jump.boundingBox();
    result.latencyTouch = await measureLatency(phone.page, 15, () =>
      phone.page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2),
    );
    result.errors.push(...phone.errors);
    await phone.context.close();

    const weak = await openGame(browser, { cpu: WEAK_PHONE_CPU });
    await startStage(weak.page);
    result.fpsWeakPhone = await measureBossFps(weak.page, 10);
    await weak.context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }

  const kb = result.latencyKeyboard;
  const touch = result.latencyTouch;
  const ms = (v) => `trung vị ${v.median.toFixed(1)} ms, p95 ${v.p95.toFixed(1)} ms`;
  const enterPhoneTotal = result.enterPhoneSec + result.size.estimatedNetSec;
  const rows = [
    [
      'Tải đầu (dist)',
      `${result.size.rawMB.toFixed(2)} MB (nén ${result.size.gzipMB.toFixed(2)} MB)`,
      `≤ ${LIMITS.initialMB} MB`,
      result.size.rawMB <= LIMITS.initialMB,
    ],
    [
      'Vào game: máy tính',
      `${result.enterDesktopSec.toFixed(2)} s`,
      `≤ ${LIMITS.enterSec} s`,
      result.enterDesktopSec <= LIMITS.enterSec,
    ],
    [
      `Vào game: CPU ${PHONE_CPU}× + 4G ước tính`,
      `${enterPhoneTotal.toFixed(2)} s (${result.enterPhoneSec.toFixed(2)} + mạng ${result.size.estimatedNetSec.toFixed(2)})`,
      `≤ ${LIMITS.enterSec} s`,
      enterPhoneTotal <= LIMITS.enterSec,
    ],
    ...[
      ['FPS phòng boss: máy tính', result.fpsDesktop],
      [`FPS phòng boss: CPU ${PHONE_CPU}×`, result.fpsPhone],
      [`FPS phòng boss: CPU ${WEAK_PHONE_CPU}× (máy yếu)`, result.fpsWeakPhone],
    ].map(([name, f]) => [
      name,
      `${f.fps.toFixed(1)} (khung > 22 ms: ${(f.slowFrames * 100).toFixed(1)}%, bước logic ${f.stepMs.toFixed(2)} ms, ${f.maxProjectiles} đạn)`,
      `≥ ${LIMITS.fps}`,
      f.fps >= LIMITS.fps,
    ]),
    [
      'Độ trễ phím: trang nhận → khung hình',
      `${ms(kb.game)} (${kb.n} lần); tính cả trình duyệt: ${ms(kb.total)}`,
      `p95 ≤ ${LIMITS.latencyMs} ms`,
      kb.game.p95 <= LIMITS.latencyMs,
    ],
    [
      `Độ trễ chạm: trang nhận → khung hình (CPU ${PHONE_CPU}×)`,
      `${ms(touch.game)} (${touch.n} lần); tính cả trình duyệt: ${ms(touch.total)}`,
      `p95 ≤ ${LIMITS.latencyMs} ms`,
      touch.game.p95 <= LIMITS.latencyMs,
    ],
  ];
  console.log(`\nĐo cổng Prototype · ${result.date} · trình vẽ ${result.fpsDesktop.renderer}\n`);
  console.log('| Hạng mục | Kết quả | Ngưỡng | Đánh giá |\n| --- | --- | --- | --- |');
  for (const [name, value, limit, ok] of rows)
    console.log(`| ${name} | ${value} | ${limit} | ${verdict(ok)} |`);
  if (result.errors.length) console.log('\nLỗi trên trang:', result.errors);
  result.rows = rows.map(([name, value, limit, ok]) => ({ name, value, limit, ok }));
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify(result, null, 2));
  process.exitCode = rows.every((r) => r[3]) && result.errors.length === 0 ? 0 : 1;
}

await main();
