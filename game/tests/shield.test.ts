import { describe, expect, it } from 'vitest';
import { attackOf } from '@/core/boss-config';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { enemyProjectile, spawnRainDrops } from '@/logic/boss/enemy-projectile';
import { createEnemy } from '@/logic/enemy/behaviors';
import { buildHud } from '@/logic/hud/hud-model';
import { computeBuild } from '@/logic/rpg/build';
import { BuildRuntime } from '@/logic/rpg/build-runtime';
import { resolveEnemyHits } from '@/logic/world/hits';
import { StageWorld } from '@/logic/world/stage-world';
import {
  IDLE_INPUT,
  noWorldEvents,
  type WorldEvents,
  type WorldInput,
} from '@/logic/world/world-types';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;
const T = TILE_SIZE;
const CORE = { C1: 1, C2: 2, C3: 3 };
const THORNA = config.bosses.thorna!;

/**
 * Phòng 30 ô: Kai đứng ở cột 10, gai ở cột 20 (bên phải), hố rộng 2 ô ở cột 3–4 (bên trái).
 */
const ROOM = [
  ...Array.from({ length: 10 }, () => `#${'.'.repeat(28)}#`),
  `#${'.'.repeat(9)}P${'.'.repeat(9)}^${'.'.repeat(8)}#`,
  `###..${'#'.repeat(25)}`,
];

function makeWorld(ranks: Record<string, number>): StageWorld {
  const w = new StageWorld({
    rows: ROOM,
    tileSize: T,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: THORNA,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    seed: 1,
    mechanics: config.stages.mechanics,
    build: computeBuild(config.skills, ranks),
  });
  for (let i = 0; i < 10; i += 1) w.step(IDLE_INPUT);
  return w;
}

/** Một đòn của địch (mặc định Gai Quạt của Thorna, 12 máu) nằm đè lên Kai. */
function hitKai(w: StageWorld, damage = attackOf(THORNA, 'thorns').damage): void {
  const b = w.player.box;
  w.pool.spawn(enemyProjectile(T, 'enemyShot', b.x + 2, b.y + 6, { w: 8, h: 8 }, 0, 0, damage));
}

/** Chạy `n` bước; gộp các cờ sự kiện. */
function run(w: StageWorld, n: number, input: WorldInput = IDLE_INPUT): Partial<WorldEvents> {
  const seen: Partial<WorldEvents> = {};
  for (let i = 0; i < n; i += 1) {
    const ev = w.step(input);
    for (const k of Object.keys(ev) as (keyof WorldEvents)[])
      if (ev[k]) (seen as Record<string, unknown>)[k] = ev[k];
  }
  return seen;
}

/** Đi theo `dir` tới khi `until` đúng (tối đa 4 s). */
function walkUntil(w: StageWorld, dir: 1 | -1, until: (ev: WorldEvents) => boolean): WorldEvents {
  for (let i = 0; i < 240; i += 1) {
    const ev = w.step({ ...IDLE_INPUT, moveX: dir });
    if (until(ev)) return ev;
  }
  throw new Error('không tới nơi');
}

describe('C3 Khiên Hấp Thụ (GDD 10 mục 2.1, 5)', () => {
  it('chặn Gai Quạt (12): giữ máu, không bật lùi, giữ mức nạp, dừng hình 2 bước', () => {
    const w = makeWorld(CORE);
    const hold = { ...IDLE_INPUT, shootHeld: true };
    w.step({ ...hold, shootPressed: true });
    run(w, 40, hold);
    expect(w.loadout.chargeLevel).toBe(1);
    const hp = w.player.hp;
    hitKai(w);
    hitKai(w); // viên thứ hai cùng lúc
    const ev = w.step(hold);
    expect(ev.kaiShieldAbsorbed).toBe(true);
    expect(ev.playerHurt).toBe(false);
    expect(w.player.hp).toBe(hp);
    expect(w.player.state).not.toBe('hurt');
    expect(w.player.vx).toBe(0);
    expect(w.hitStop).toBe(config.skills.rules.shieldBreakHitStopSteps);
    expect(w.runtime.shieldReady).toBe(false);
    // Viên thứ hai còn đè lên Kai nhưng không trúng trong 0,3 s bất tử; mức nạp vẫn tăng.
    expect(run(w, 2 + 10, hold).playerHurt).toBeUndefined();
    expect(w.player.hp).toBe(hp);
    expect(w.loadout.chargeLevel).toBeGreaterThanOrEqual(1);
    for (const p of w.pool.all) if (p.owner === 'enemy') p.alive = false;
    // Hết 0,3 s: đòn trúng bình thường.
    run(w, 10, hold);
    hitKai(w);
    const after = w.step(hold);
    expect(after.playerHurt).toBe(true);
    expect(after.kaiShieldAbsorbed).toBe(false);
    expect(hp - w.player.hp).toBe(12);
  });

  it('bậc 3 hồi sau đúng 20 s tính từ lúc vỡ; mất máu giữa chừng không đặt lại', () => {
    const w = makeWorld(CORE);
    hitKai(w);
    expect(w.step(IDLE_INPUT).kaiShieldAbsorbed).toBe(true);
    let readyAt = -1;
    let hurtAt = -1;
    for (let i = 1; i <= 1300 && readyAt < 0; i += 1) {
      if (i === 600) hitKai(w);
      const ev = w.step(IDLE_INPUT);
      if (ev.playerHurt) hurtAt = i;
      if (ev.kaiShieldReady) readyAt = i;
    }
    expect(hurtAt).toBe(600);
    // 2 bước dừng hình (đồng hồ dừng) + 20 s × 60 bước.
    expect(readyAt).toBe(2 + 20 * 60);
    expect(w.runtime.shieldReady).toBe(true);
  });

  it('gai: khiên không chặn, không làm mới khiên đang hồi', () => {
    const w = makeWorld(CORE);
    const hp = w.player.hp;
    walkUntil(w, 1, (ev) => ev.spikeHit);
    expect(hp - w.player.hp).toBe(config.stages.mechanics.spikes.damage);
    expect(w.runtime.shieldReady).toBe(true);
    run(w, 70); // hết bất tử sau gai
    hitKai(w);
    expect(w.step(IDLE_INPUT).kaiShieldAbsorbed).toBe(true);
    run(w, 60);
    const before = w.runtime.shieldProgress;
    walkUntil(w, 1, (ev) => ev.spikeHit);
    expect(w.runtime.shieldReady).toBe(false);
    expect(w.runtime.shieldProgress).toBeGreaterThan(before);
    expect(w.runtime.shieldProgress).toBeLessThan(0.2);
  });

  it('rơi hố còn máu giữ đồng hồ hồi; chết thì khiên sẵn khi hồi sinh', () => {
    const w = makeWorld(CORE);
    hitKai(w);
    w.step(IDLE_INPUT);
    run(w, 30);
    const before = w.runtime.shieldProgress;
    walkUntil(w, -1, (ev) => ev.fellInPit);
    const hpAfterPit = w.player.hp;
    const back = run(w, 30);
    expect(back.respawned).toBe(true);
    // Rơi hố chỉ hồi sinh một lần (không rơi sang nhánh chết: máu giữ nguyên sau khi trừ hố).
    expect(w.player.hp).toBe(hpAfterPit);
    expect(w.runtime.shieldReady).toBe(false);
    expect(w.runtime.shieldProgress).toBeGreaterThan(before);
    // Còn 1 máu, trúng đòn (khiên chưa hồi) thì chết.
    w.player.hp = 1;
    run(w, 70);
    hitKai(w);
    expect(w.step(IDLE_INPUT).playerDied).toBe(true);
    expect(run(w, 90).respawned).toBe(true);
    expect(w.runtime.shieldReady).toBe(true);
  });

  it('Hoa Nở với khiên sẵn, đứng yên: vẫn trúng hạt (18), khiên vẫn sẵn', () => {
    const w = makeWorld(CORE);
    const hp = w.player.hp;
    const col = Math.floor(w.player.centerX / T);
    spawnRainDrops(w.pool, T, [col], attackOf(THORNA, 'bloom'), 'seed');
    const seen = run(w, 120);
    expect(seen.playerHurt).toBe(true);
    expect(seen.kaiShieldAbsorbed).toBeUndefined();
    expect(hp - w.player.hp).toBe(attackOf(THORNA, 'bloom').damage);
    expect(w.runtime.shieldReady).toBe(true);
  });

  it('chặn thân kẻ địch; kẻ địch vô hại (0 máu) không làm vỡ khiên', () => {
    const w = makeWorld(CORE);
    const d = config.enemies.enemies.drone_linh!;
    const at = (harmless: boolean) =>
      createEnemy(1, d, w.player.centerX, w.player.box.y + 12, 1, harmless, T);
    const resolve = (enemy: ReturnType<typeof at>): WorldEvents => {
      const ev = noWorldEvents();
      const defense = { bulletKinds: new Set<string>(), onGraze: undefined, shield: w.runtime };
      resolveEnemyHits(w.pool, [enemy], undefined, w.player, 1, ev, defense);
      return ev;
    };
    const hp = w.player.hp;
    const harmless = at(true);
    expect(harmless.contactDamage).toBe(0);
    expect(resolve(harmless).kaiShieldAbsorbed).toBe(false);
    expect(w.runtime.shieldReady).toBe(true);
    run(w, 70); // hết bất tử vì bị đẩy lùi
    const ev = resolve(at(false));
    expect(ev.kaiShieldAbsorbed).toBe(true);
    expect(ev.playerHurt).toBe(false);
    expect(w.player.hp).toBe(hp);
  });

  it('chưa học C3 thì không có khiên; đổi build ở lần hồi sinh', () => {
    const w = makeWorld({ C1: 1 });
    expect(buildHud(w).shield).toBeUndefined();
    hitKai(w);
    expect(w.step(IDLE_INPUT).playerHurt).toBe(true);
    w.setBuild(computeBuild(config.skills, CORE));
    expect(buildHud(w).shield).toEqual({ ready: true, progress: 1 });
    run(w, 70);
    hitKai(w);
    w.step(IDLE_INPUT);
    expect(buildHud(w).shield).toEqual({ ready: false, progress: 0 });
    run(w, 2 + 10 * 60);
    expect(buildHud(w).shield?.progress).toBeCloseTo(0.5, 6);
    w.setBuild(computeBuild(config.skills, { C1: 1 }));
    expect(buildHud(w).shield).toBeUndefined();
  });
});

describe('BuildRuntime', () => {
  const shieldOf = (rank: number) => computeBuild(config.skills, { ...CORE, C3: rank }).shield;

  it('đổi bậc khi đang hồi: giữ thời gian đã hồi, tính theo thời gian hồi mới', () => {
    const rt = new BuildRuntime(shieldOf(1));
    expect(rt.shieldReady).toBe(true);
    rt.breakShield();
    for (let i = 0; i < 22 * 60; i += 1) rt.step(DT);
    expect(rt.shieldReady).toBe(false); // bậc 1: 30 s
    rt.setShield(shieldOf(3)); // bậc 3: 20 s, đã hồi 22 s
    expect(rt.shieldReady).toBe(true);
  });

  it('khiên đã vỡ không vỡ lại; chết đặt lại thành sẵn', () => {
    const rt = new BuildRuntime(shieldOf(3));
    rt.breakShield();
    for (let i = 0; i < 60; i += 1) rt.step(DT);
    rt.breakShield();
    expect(rt.shieldProgress).toBeCloseTo(1 / 20, 9);
    rt.resetOnDeath();
    expect(rt.shieldReady).toBe(true);
    expect(new BuildRuntime(undefined).shieldReady).toBe(false);
  });
});
