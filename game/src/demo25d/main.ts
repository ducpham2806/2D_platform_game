/**
 * Demo 2.5D thời gian thực (three.js) cho hướng đồ họa người dùng chọn ngày 14/11/2026 (`09-Quyet-
 * dinh-cho-duyet.md` mục 3, cách c; ADR-003). Dùng nguyên logic game (StageWorld, dữ liệu
 * `03-Data`, phòng boss Thorna); chỉ thay lớp vẽ. Không đụng game Phaser.
 *
 *   demo-25d.html            chơi bằng bàn phím hoặc nút chạm
 *   demo-25d.html?auto=1     tự chơi (quay video)
 *   demo-25d.html?q=low      chất lượng thấp: không bóng, không bloom (đo trên máy yếu)
 *   demo-25d.html?auto=1&capture=1  quay video từng khung (scripts/demo25d-video.mjs)
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { DATA_BASE_PATH, DATA_MANIFEST, FIXED_STEP_MS } from '../core/constants';
import { bossFor, parseGameConfig, type GameConfig } from '../core/game-config';
import { enemiesFor } from '../core/enemy-config';
import { FixedStep } from '../logic/fixed-step';
import { StageWorld } from '../logic/world/stage-world';
import { IDLE_INPUT, type WorldEvents, type WorldInput } from '../logic/world/world-types';
import { buildStageLayout } from '../stages/stage-def';
import { THORNA_ROOM } from '../stages/thorna-room';
import { KaiModel, ProjectileLayer, Sparks, TelegraphLayer, ThornaModel } from './actors';
import { approach, boxCenter, clampCameraX } from './coords';
import { DemoInput } from './input';
import { buildStage3D, PALETTE } from './stage3d';

const params = new URLSearchParams(location.search);
const AUTO = params.has('auto');
/** Quay video: mỗi lần gọi `__demo.advance(ms)` chạy đúng một khung (không theo đồng hồ thật). */
const CAPTURE = params.has('capture');
const LOW = params.get('q') === 'low';
const TILE = 16;
const FOV = 30;
const CAM_DIST = 20;

async function loadConfig(): Promise<GameConfig> {
  const manifest = (await (await fetch(DATA_MANIFEST)).json()) as { files: string[] };
  const files: Record<string, unknown> = {};
  await Promise.all(
    manifest.files.map(async (f) => {
      files[f.replace(/\.json$/, '')] = await (await fetch(`${DATA_BASE_PATH}/${f}`)).json();
    }),
  );
  return parseGameConfig(files);
}

function makeWorld(config: GameConfig): StageWorld {
  const difficulty = config.difficulties.find((d) => d.id === 'normal');
  const boss = bossFor(config, 'thorna', false);
  if (!difficulty || !boss) throw new Error('Thiếu dữ liệu Thorna hoặc độ khó Thường');
  return new StageWorld({
    layout: buildStageLayout(THORNA_ROOM, TILE),
    tileSize: TILE,
    stepSec: FIXED_STEP_MS / 1000,
    player: config.player,
    weapons: config.weapons,
    boss,
    difficulty,
    enemies: enemiesFor(config.enemies, false),
    mechanics: config.stages.mechanics,
    seed: 2187,
  });
}

/** Tự chơi để quay video: chạy vào đấu trường, giữ khoảng cách, nhảy né, bắn liên tục. */
function autoInput(world: StageWorld, step: number): WorldInput {
  const pl = world.player;
  const boss = world.boss;
  const input: WorldInput = { ...IDLE_INPUT };
  if (world.phase === 'explore') {
    input.moveX = 1;
    // Nhảy hai lần ở đoạn đầu cho thấy hoạt ảnh; gần cửa thì không nhảy (khỏi bám tường leo lên).
    const early = pl.box.x < 9 * TILE;
    input.jumpPressed = early && step % 50 === 20;
    input.jumpHeld = early && step % 50 >= 20 && step % 50 < 40;
    input.dashPressed = step === 70;
    return input;
  }
  if (!boss || boss.state === 'dead') return input;
  // Bất tử trong chế độ tự chơi, để video không dừng giữa chừng.
  pl.hp = pl.maxHp;
  const dx = boss.centerX - pl.centerX;
  const want = 5 * TILE;
  const toward = Math.sign(dx) || 1;
  // Kai quay theo hướng đi: chỉ lùi ngắn, rồi quay mặt về boss để bắn trúng.
  if (Math.abs(dx) > want + 24) input.moveX = toward;
  else if (Math.abs(dx) < want - 24 && step % 60 < 14) input.moveX = -toward;
  else input.moveX = pl.facing !== toward ? toward : 0;
  // Chỉ nhảy để né đòn sát đất sắp ra (quất, rễ, sóng); còn lại đứng bắn liên tục, thỉnh thoảng
  // nạp đầy một phát cho thấy đạn lớn.
  const ground = boss.attack === 'lash' || boss.attack === 'roots' || boss.attack === 'slam';
  const dodge = boss.state === 'telegraph' && ground && boss.telegraphProgress > 0.75;
  input.jumpPressed = dodge && pl.grounded;
  input.jumpHeld = dodge || !pl.grounded;
  // Lỡ đáp lên bục thì xuống lại sàn (giữ xuống + nhảy), để đạn ngang tầm Thorna.
  const raised = pl.grounded && pl.bottom < world.map.heightPx - 2 * TILE;
  if (!dodge && raised) {
    input.downHeld = true;
    input.moveY = 1;
    input.jumpPressed = step % 12 === 0;
    input.jumpHeld = false;
  }
  const charge = step % 240 < 80;
  input.shootPressed = charge ? step % 240 === 0 : step % 8 === 0;
  input.shootHeld = charge ? step % 240 < 79 : step % 8 === 0;
  input.shootReleased = charge ? step % 240 === 79 : step % 8 === 1;
  return input;
}

function hud(): {
  set(hp: number, maxHp: number, bossPct: number | undefined, fps: number, banner: string): void;
} {
  const hpFill = document.getElementById('hp-fill') as HTMLElement;
  const bossBar = document.getElementById('boss') as HTMLElement;
  const bossFill = document.getElementById('boss-fill') as HTMLElement;
  const fpsEl = document.getElementById('fps') as HTMLElement;
  const bannerEl = document.getElementById('banner') as HTMLElement;
  return {
    set(hp, maxHp, bossPct, fps, banner) {
      hpFill.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
      bossBar.style.visibility = bossPct === undefined ? 'hidden' : 'visible';
      bossFill.style.width = `${bossPct ?? 0}%`;
      fpsEl.textContent = `${Math.round(fps)} FPS${LOW ? ' · thấp' : ''}`;
      bannerEl.textContent = banner;
      bannerEl.style.opacity = banner ? '1' : '0';
    },
  };
}

async function start(): Promise<void> {
  const config = await loadConfig();
  let world = makeWorld(config);
  const map = world.map;
  const gate =
    world.gateCol === undefined ? undefined : { col: world.gateCol, rows: world.gateRows };
  const stage = buildStage3D(map, gate, LOW);
  const scene = stage.scene;

  const renderer = new THREE.WebGLRenderer({
    antialias: !LOW,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW ? 1 : 2));
  renderer.shadowMap.enabled = !LOW;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.getElementById('view')?.append(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 200);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.45, 0.86);
  if (!LOW) composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const input = new DemoInput();
  input.bindTouch(document.getElementById('touch') as HTMLElement);
  let kai = new KaiModel(scene);
  let thorna = world.boss ? new ThornaModel(scene, world.boss) : undefined;
  const shots = new ProjectileLayer(scene);
  const warn = new TelegraphLayer(scene);
  const sparks = new Sparks(scene);
  const ui = hud();
  const stepper = new FixedStep(FIXED_STEP_MS, 5);
  let step = 0;
  let camX = boxCenter(world.player.box, map.heightPx, TILE).x;
  let camY = map.rows / 2;
  let camDist = CAM_DIST;
  let shake = 0;
  let last = performance.now();
  let fps = 60;
  let banner = 'Demo 2.5D · three.js · phòng boss Thorna';
  let bannerUntil = 3;
  let wonAt = 0;
  const clock = { t: 0 };

  const react = (ev: WorldEvents): void => {
    const pl = world.player;
    const pc = boxCenter(pl.box, map.heightPx, TILE);
    if (ev.fired) kai.fired();
    if (ev.playerHurt) {
      kai.hurt();
      sparks.burst(pc.x, pc.y, PALETTE.danger, 18, 5);
      shake = Math.max(shake, 0.25);
    }
    if (ev.hitBoss && world.boss) {
      const bc = boxCenter(world.boss.box, map.heightPx, TILE);
      sparks.burst(
        bc.x - world.boss.facing * 0.8,
        bc.y + 0.3,
        ev.weakHit ? 0xfff27a : PALETTE.neon,
        ev.weakHit ? 26 : 10,
        6,
      );
    }
    if (ev.bossLanded) shake = Math.max(shake, 0.4);
    if (ev.gateClosed) {
      // Tự chơi: Thorna bắt đầu ở 20% máu để video có đoạn hạ boss.
      if (AUTO && world.boss) world.boss.hp = world.boss.data.hp * 0.2;
      banner = 'THORNA';
      bannerUntil = clock.t + 2;
    }
    if (ev.bossDefeated && world.boss) {
      const bc = boxCenter(world.boss.box, map.heightPx, TILE);
      for (let i = 0; i < 4; i += 1)
        sparks.burst(bc.x, bc.y + i * 0.5, i % 2 ? PALETTE.moss : 0xff4fa8, 40, 9);
      shake = 0.6;
      banner = 'THORNA ĐÃ BỊ HẠ';
      bannerUntil = clock.t + 4;
      wonAt = clock.t;
    }
  };

  const frame = (now: number): void => {
    const dtMs = Math.min(100, now - last);
    last = now;
    const dt = dtMs / 1000;
    clock.t += dt;
    fps = approach(fps, 1000 / Math.max(1, dtMs), 3, dt);
    const steps = stepper.advance(dtMs);
    for (let i = 0; i < steps; i += 1) {
      const wi = AUTO ? autoInput(world, step) : input.step();
      step += 1;
      const ev = world.step(wi);
      react(ev);
      kai.update(world.player, map, clock.t, FIXED_STEP_MS / 1000, world.player.events.landed);
    }
    // Tự chơi: thắng xong 5 giây thì chơi lại từ đầu.
    if (AUTO && wonAt > 0 && clock.t - wonAt > 5) {
      for (const o of [kai.root, thorna?.root]) if (o) scene.remove(o);
      world = makeWorld(config);
      kai = new KaiModel(scene);
      thorna = world.boss ? new ThornaModel(scene, world.boss) : undefined;
      wonAt = 0;
      step = 0;
    }
    thorna?.update(map, clock.t, dt);
    shots.update(world.pool.all, map, clock.t);
    warn.update(world.boss, map, clock.t);
    sparks.update(dt);
    stage.update(clock.t, map);

    // Camera phối cảnh bám Kai, khóa vào đấu trường khi đánh boss; nghiêng nhẹ để thấy chiều sâu.
    const halfH = camDist * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const halfW = halfH * camera.aspect;
    const kc = boxCenter(world.player.box, map.heightPx, TILE);
    const arena = world.arena;
    const targetX =
      world.phase !== 'explore' && arena
        ? (arena.first + arena.last + 1) / 2
        : clampCameraX(kc.x + 2, halfW - 1, map.cols);
    camX = approach(camX, targetX, 4, dt);
    const inArena = world.phase !== 'explore';
    const targetY = inArena
      ? map.rows / 2 - 0.6
      : Math.max(map.rows / 2 - 0.5, Math.min(map.rows / 2 + 1, kc.y + 1.5));
    camY = approach(camY, targetY, 3, dt);
    camDist = approach(camDist, inArena ? CAM_DIST + 3.5 : CAM_DIST, 2, dt);
    shake = Math.max(0, shake - dt * 1.5);
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    camera.position.set(camX - 2.2 + sx, camY + 2.6 + sy, camDist);
    camera.lookAt(camX, camY - 0.4, 0);
    composer.render();

    const boss = world.boss;
    const bossPct = world.phase === 'explore' || !boss ? undefined : Math.max(0, boss.hpPct);
    ui.set(world.player.hp, world.player.maxHp, bossPct, fps, clock.t < bannerUntil ? banner : '');
    if (!CAPTURE) requestAnimationFrame(frame);
  };
  let simNow = 0;
  if (CAPTURE) last = 0;
  else
    requestAnimationFrame((now) => {
      last = now;
      frame(now);
    });
  (window as unknown as { __demo?: unknown }).__demo = {
    advance(ms: number): void {
      simNow += ms;
      frame(simNow);
    },
    get world() {
      return world;
    },
    get fps() {
      return fps;
    },
    renderer,
  };
}

start().catch((e: unknown) => {
  const el = document.getElementById('banner');
  if (el) {
    el.textContent = `Lỗi: ${e instanceof Error ? e.message : String(e)}`;
    el.style.opacity = '1';
  }
  console.error(e);
});
