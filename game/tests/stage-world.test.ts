import { describe, expect, it } from 'vitest';
import { parseBosses } from '@/core/boss-config';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { IDLE_INPUT, type WorldInput } from '@/logic/world/world-types';
import { StageWorld } from '@/logic/world/stage-world';
import { GRAY_BOX_ROWS } from '@/stages/gray-box';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const config = parseGameConfig(loadData());
const boss = parseBosses(loadData().bosses).gray!;

function makeWorld(rows: readonly string[] = GRAY_BOX_ROWS): StageWorld {
  return new StageWorld({
    rows,
    tileSize: TILE_SIZE,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    mechanics: config.stages.mechanics,
    seed: 7,
  });
}

const input = (patch: Partial<WorldInput>): WorldInput => ({ ...IDLE_INPUT, ...patch });

/** Bắn nhịp đều (bấm 1 bước, nhả 1 bước...) trong `steps` bước. */
function tapFire(world: StageWorld, steps: number, extra: Partial<WorldInput> = {}) {
  const events = [];
  for (let i = 0; i < steps; i += 1) {
    const press = i % 8 === 0;
    events.push(
      world.step(
        input({ ...extra, shootPressed: press, shootHeld: press, shootReleased: i % 8 === 1 }),
      ),
    );
  }
  return events;
}

/** Đưa Kai vào giữa đấu trường (đặt thẳng vị trí cho test), rồi chạy một bước để đóng cửa. */
function enterArena(world: StageWorld) {
  const t = TILE_SIZE;
  world.player.respawn((world.arena!.first + 3) * t, 11 * t);
  return world.step(IDLE_INPUT);
}

describe('bia tập bắn', () => {
  it('bia thường: 3 phát Arc Cannon thì vỡ', () => {
    const world = makeWorld();
    const target = world.targets.find((t) => t.shieldSide === 0)!;
    tapFire(world, 40);
    expect(target.alive).toBe(false);
  });

  it('bia có khiên: đạn thường bị chặn, nạp đầy phá khiên', () => {
    const rows = ['#..........#', '#..........#', '#P.....S...#', '############'];
    const world = makeWorld(rows);
    const target = world.targets[0]!;
    const blocked = tapFire(world, 30).some((e) => e.blocked);
    expect(blocked).toBe(true);
    expect(target.hp).toBe(target.maxHp);
    world.step(input({ shootPressed: true, shootHeld: true }));
    for (let i = 0; i < 80; i += 1) world.step(input({ shootHeld: true }));
    const after = [world.step(input({ shootReleased: true }))];
    for (let i = 0; i < 40; i += 1) after.push(world.step(IDLE_INPUT));
    expect(after.some((e) => e.shieldBroken)).toBe(true);
    expect(target.shieldUp).toBe(false);
  });
});

describe('phòng boss', () => {
  it('vào đấu trường: cửa đóng, boss bắt đầu, không ra được', () => {
    const world = makeWorld();
    const ev = enterArena(world);
    expect(ev.gateClosed).toBe(true);
    expect(world.phase).toBe('boss');
    expect(world.boss!.state).not.toBe('waiting');
    for (let i = 0; i < 120; i += 1) world.step(input({ moveX: -1 }));
    expect(world.player.box.x).toBeGreaterThanOrEqual((world.gateCol! + 1) * TILE_SIZE);
  });

  it('chỉ bằng Arc Cannon vẫn hạ được boss; thắng lần đầu nhận Vine Lash, cửa mở', () => {
    const world = makeWorld();
    enterArena(world);
    let defeated = false;
    let granted: string | undefined;
    let seconds = 0;
    for (let i = 0; i < 60 * 180 && !defeated; i += 1) {
      // Giữ Kai sống để đo riêng tốc độ hạ boss; luôn quay mặt về phía boss.
      world.player.hp = world.player.maxHp;
      const dir = world.boss!.centerX > world.player.centerX ? 1 : -1;
      const press = i % 8 === 0;
      const ev = world.step(
        input({
          moveX: i % 30 === 0 ? dir : 0,
          shootPressed: press,
          shootHeld: press,
          shootReleased: i % 8 === 1,
        }),
      );
      if (ev.bossDefeated) defeated = true;
      if (ev.weaponGranted) granted = ev.weaponGranted;
      seconds = i * DT;
    }
    expect(defeated).toBe(true);
    // Bắn liên tục không né là cận dưới; chơi thật có né sẽ lâu hơn nhiều.
    expect(seconds).toBeGreaterThan(20);
    expect(seconds).toBeLessThan(120);
    expect(granted).toBe('Vine Lash');
    expect(world.phase).toBe('won');
    expect(world.map.isSolid(world.gateCol!, 10)).toBe(false);
  });

  it('đấu lại: Vine Lash là điểm yếu → sát thương 2,5×, choáng và dừng hình', () => {
    const world = makeWorld();
    world.loadout.grant('Vine Lash');
    world.loadout.swap(1);
    enterArena(world);
    const b = world.boss!;
    // Đặt Kai sát boss để roi 4 ô với tới.
    world.player.respawn(b.centerX - 30, 11 * TILE_SIZE);
    const hpBefore = b.hp;
    const ev = world.step(input({ shootPressed: true, shootHeld: true }));
    const next = ev.weakHit ? ev : world.step(IDLE_INPUT);
    expect(ev.weakHit || next.weakHit).toBe(true);
    expect(hpBefore - b.hp).toBeCloseTo(1 * 2 * 2.5);
    expect(b.stunned).toBe(true);
    expect(world.hitStop).toBeGreaterThan(0);
  });

  it('chết trong phòng boss: hồi sinh trong phòng, boss đầy máu lại', () => {
    const world = makeWorld();
    enterArena(world);
    world.boss!.hp = 10;
    world.player.applyHit(1000, world.player.centerX + 1);
    let respawned = false;
    for (let i = 0; i < 120 && !respawned; i += 1) respawned = world.step(IDLE_INPUT).respawned;
    expect(respawned).toBe(true);
    expect(world.boss!.hp).toBe(boss.hp);
    expect(world.player.box.x).toBeGreaterThan(world.gateCol! * TILE_SIZE);
    expect(world.player.hp).toBe(world.player.maxHp);
  });
});

describe('hồi sinh', () => {
  it('chết một lần chỉ tính một lần (không chết lặp sau khi hồi sinh)', () => {
    const world = makeWorld();
    world.step(IDLE_INPUT);
    world.player.applyHit(9999, world.player.centerX + 5);
    let died = 0;
    for (let i = 0; i < 400; i += 1) if (world.step(IDLE_INPUT).playerDied) died += 1;
    expect(died).toBe(1);
    expect(world.deaths).toBe(1);
    expect(world.player.state).not.toBe('dead');
  });
});

describe('rơi hố', () => {
  it('rơi xuống khe đầu tiên thì mất máu và về điểm xuất phát (M7: không tính là chết)', () => {
    const world = makeWorld();
    const startX = world.player.centerX;
    let respawned = false;
    for (let i = 0; i < 300 && !respawned; i += 1)
      respawned = world.step(input({ moveX: 1 })).respawned;
    expect(respawned).toBe(true);
    expect(world.player.centerX).toBeCloseTo(startX);
    expect(world.deaths).toBe(0);
    expect(world.falls).toBe(1);
    expect(world.player.hp).toBeLessThan(world.player.maxHp);
  });
});
