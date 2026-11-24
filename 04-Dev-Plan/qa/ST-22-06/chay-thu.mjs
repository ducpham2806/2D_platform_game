import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const require = createRequire(join(process.cwd(), "package.json"));
const { chromium, devices } = require("playwright");
const { preview } = require("vite");
const shotDir = resolve("../04-Dev-Plan/qa/ST-22-06");
const mode = process.argv[2] ?? "pc";
if (!["pc", "touch"].includes(mode)) throw new Error("Cần pc hoặc touch");
const touch = mode === "touch";
const port = touch ? 46838 : 46837;
const server = await preview({
  logLevel: "silent",
  preview: { host: "127.0.0.1", port, strictPort: true },
});
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

try {
  const context = await browser.newContext(
    touch
      ? devices["Pixel 7 landscape"]
      : { viewport: { width: 960, height: 576 } },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(8500);
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  const snap = () => page.evaluate(() => window.cv3d?.());
  const photo = (name) =>
    page.screenshot({ path: join(shotDir, `${mode}-${name}.png`) });
  const query = touch ? "?q=low&debug=1" : "?debug=1";
  await page.goto(`http://127.0.0.1:${port}/prototype-3d.html${query}`);
  await page.waitForFunction(
    () => window.cv3d?.().phase === "ready" && window.cv3d().camera[1] > 0,
  );
  const initial = await snap();
  assert.equal(initial.gray, false);
  assert.equal(initial.low, touch);
  assert.ok(initial.camera[1] > initial.position.y);
  assert.ok(
    initial.camera[0] !== initial.position.x &&
      initial.camera[2] !== initial.position.z,
  );
  if (!touch) await photo("01-tram-phan-luc");
  if (touch) await page.locator("#proceed").tap();
  else await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.cv3d().phase === "playing");

  const cdp = touch ? await context.newCDPSession(page) : undefined;
  const inputStick = touch
    ? await page.locator("#steer").boundingBox()
    : undefined;
  const cx = inputStick ? inputStick.x + inputStick.width / 2 : 0;
  const cy = inputStick ? inputStick.y + inputStick.height / 2 : 0;
  const radius = inputStick ? inputStick.width * 0.342 : 0;
  const yaw = (initial.yawDeg * Math.PI) / 180;
  const cos = Math.cos(yaw),
    sin = Math.sin(yaw);
  let stickPoint;
  let keys = [];
  const gesture = (type, touchPoints) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints });

  const steer = async (dx, dz) => {
    const x = dx * cos - dz * sin;
    const forward = -dx * sin - dz * cos;
    if (touch) {
      const r = Math.hypot(x, forward);
      const wasDown = Boolean(stickPoint);
      if (r < 0.001) {
        if (wasDown) await gesture("touchEnd", []);
        stickPoint = undefined;
      } else {
        const travel = Math.min(1, r * 1.5) * radius;
        stickPoint = {
          x: cx + (x / r) * travel,
          y: cy - (forward / r) * travel,
          id: 1,
        };
        await gesture(wasDown ? "touchMove" : "touchStart", [stickPoint]);
      }
      return;
    }
    const next = [];
    if (Math.hypot(x, forward) > 0.001) {
      const angle =
        Math.round(Math.atan2(forward, x) / (Math.PI / 4)) * (Math.PI / 4);
      const lateral = Math.cos(angle),
        ahead = Math.sin(angle);
      if (lateral > 0.4) next.push("d");
      else if (lateral < -0.4) next.push("a");
      if (ahead > 0.4) next.push("w");
      else if (ahead < -0.4) next.push("s");
    }
    for (const key of keys)
      if (!next.includes(key)) await page.keyboard.up(key);
    for (const key of next)
      if (!keys.includes(key)) await page.keyboard.down(key);
    keys = next;
  };

  const action = async (name, key) => {
    if (!touch) {
      await page.keyboard.press(key);
      return;
    }
    const b = await page.locator(`#${name}`).boundingBox();
    const finger = { id: 2, x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await gesture("touchStart", stickPoint ? [stickPoint, finger] : [finger]);
    await gesture("touchEnd", []);
    if (stickPoint) await gesture("touchStart", [stickPoint]);
  };

  const go = async (label, x, z, { jump = false, evidence } = {}) => {
    const start = await snap();
    let tookPhoto = false;
    let state;
    for (let step = 0; step < 230; step++) {
      state = await snap();
      if (state.finished) break;
      if (state.phase === "paused") throw new Error(`${label}: bị tạm dừng`);
      const dx = x - state.position.x,
        dz = z - state.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.28 && state.grounded && (!jump || step > 2)) break;
      if (state.falls > start.falls)
        throw new Error(`${label}: rơi tại ${JSON.stringify(state.position)}`);
      if (distance < 0.24) await steer(0, 0);
      else await steer(dx, dz);
      if (step === 0 && jump) await action("jump", "Space");
      if (
        evidence &&
        !tookPhoto &&
        !state.grounded &&
        state.position.y > start.position.y + 0.55
      ) {
        await photo(evidence);
        tookPhoto = true;
      }
      await page.waitForTimeout(50);
    }
    await steer(0, 0);
    if (!state.finished)
      assert.ok(
        Math.hypot(x - state.position.x, z - state.position.z) < 0.54 &&
          state.grounded,
        `${label}: không tới (${x}, ${z}) từ ${JSON.stringify(state)}`,
      );
    console.log(mode, label, state.elapsed.toFixed(1), state.position);
    return state;
  };

  await go("xuất phát", 0, -6.2);
  await go("sàn lấy đà", 0, -19.65);
  await go("bục A", 1.7, -23.25, {
    jump: true,
    evidence: "02-nhay-lech-chieu-sau",
  });
  await go("mép A", 0.8, -24.63);
  await go("bục B", -1.1, -28.64, { jump: true });
  await go("mép B", -1.4, -30.6);
  await go("checkpoint 1", -2.6, -34.08, { jump: true });
  await go("hướng Arc Cannon", -2.6, -36.8);
  assert.equal((await snap()).aimingAtRelay, true);
  await action("shoot", "j");
  await page.waitForFunction(() => window.cv3d().relayPowered);
  await photo("03-cong-da-mo");

  if (touch) {
    await steer(-1, 0);
    await page.waitForFunction(() => window.cv3d().falls === 1);
    await steer(0, 0);
    await page.waitForFunction(() => {
      const s = window.cv3d();
      return (
        s.checkpoint === 0 && s.grounded && Math.abs(s.position.z + 35.8) < 0.16
      );
    });
    assert.equal((await snap()).relayPowered, true);
  } else {
    await page.keyboard.press("p");
    assert.equal((await snap()).phase, "paused");
    const elapsed = (await snap()).elapsed;
    await page.waitForTimeout(180);
    assert.equal((await snap()).elapsed, elapsed);
    await page.keyboard.press("p");
  }

  await go("khúc cua đông", -2.6, -69.8);
  await go("qua khúc cua", 11.7, -70);
  await go("mép dãy trên", 11.7, -82.58);
  await go("bục C", 13, -86, { jump: true });
  await go("mép C", 12.1, -88.76);
  await go("bục D", 10.4, -92.46, { jump: true });
  await go("mép D", 9.5, -95.2);
  await go("sàn trên", 8.2, -98.59, { jump: true });
  await go("checkpoint 2", 8.2, -103);
  await steer(0, -1);
  await page.waitForTimeout(90);
  const dashStart = await snap();
  await action("dash", "Shift");
  await page.waitForFunction(() => window.cv3d().clip === "Dash");
  await steer(0, 0);
  await page.waitForFunction(() => window.cv3d().clip !== "Dash");
  const dashEnd = await snap();
  assert.ok(
    dashEnd.position.z < dashStart.position.z - 1.5,
    "Kai phải lướt dọc theo cầu",
  );
  await go("khúc cua tây", 8.2, -124.2);
  await go("cầu cuối", -8.6, -124.2);
  await go("bến quay", -8.6, -145.8);
  await go("rẽ vòng quanh lõi", -25, -146);
  await go("cầu ngang", -25, -170);
  await go("cận đích", -3, -170);
  const end = await go("đích", -3, -201);
  assert.ok(
    end.elapsed >= 60 && end.elapsed <= 90,
    `Thời lượng ${end.elapsed.toFixed(2)} s`,
  );
  assert.equal(end.finished, true);
  assert.equal(end.checkpoint, 1);
  await photo("04-ket-qua");

  if (!touch) {
    await page.goto(
      `http://127.0.0.1:${port}/prototype-3d.html?gray=1&debug=1`,
    );
    await page.waitForFunction(
      () => window.cv3d?.().phase === "ready" && window.cv3d().camera[1] > 0,
    );
    assert.equal((await snap()).gray, true);
    await photo("05-khoi-xam");
  }
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      mode,
      elapsed: end.elapsed,
      falls: end.falls,
      shots: end.shots,
      errors: errors.length,
    }),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
