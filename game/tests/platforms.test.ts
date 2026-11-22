import { describe, expect, it } from 'vitest';
import { FIXED_STEP_HZ, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { layoutFromRows, type StageLayout } from '@/logic/stage/layout';
import { layoutFromTiled } from '@/logic/stage/tiled';
import { Tile } from '@/logic/tilemap';
import { CloudDrift, CrumblePlatform } from '@/logic/world/platforms';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldInput } from '@/logic/world/world-types';
import { PLATFORM_ROOM } from '@/stages/platform-room';
import { buildStageLayout } from '@/stages/stage-def';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const t = TILE_SIZE;
const dt = 1 / FIXED_STEP_HZ;
const mechanics = config.stages.mechanics;
const room = () => buildStageLayout(PLATFORM_ROOM, t);
const floor = 10 * t;

function world(layout: StageLayout = room()): StageWorld {
  return new StageWorld({
    layout,
    tileSize: t,
    stepSec: dt,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.gray!,
    enemies: config.enemies,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    mechanics,
    seed: 42,
  });
}

const step = (w: StageWorld, patch: Partial<WorldInput> = {}) =>
  w.step({ ...IDLE_INPUT, ...patch });

function advance(w: StageWorld, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / dt); i += 1) step(w);
}

function until(w: StageWorld, ready: () => boolean): void {
  for (let i = 0; i < 600 && !ready(); i += 1) step(w);
  expect(ready()).toBe(true);
}

describe('bục băng vỡ (ST-15-08a)', () => {
  it('xuyên lên từ dưới, ba mốc nứt và vỡ đúng 1 giây dù Kai đã rời', () => {
    const w = world();
    const ice = w.crumbles[0]!;
    const x = ice.origin.x + ice.origin.w / 2;
    const col = ice.spawn.col;
    const row = ice.spawn.row;
    w.player.respawn(x, floor);
    step(w, { jumpPressed: true, jumpHeld: true });
    for (let i = 0; i < 17; i += 1) step(w, { jumpHeld: true });
    expect(w.player.bottom).toBeLessThan(ice.origin.y);
    expect(ice.state).toBe('ready');
    until(w, () => ice.cracks === 1);
    expect(w.player.bottom).toBeCloseTo(ice.origin.y);
    expect(step(w, { jumpPressed: true, downHeld: true }).platformCracked).toBe(false);
    w.player.respawn(56, floor);
    advance(w, mechanics.crumble.warnAtSec[0] - 2 * dt);
    expect(ice.cracks).toBe(1);
    expect(step(w).platformCracked).toBe(true);
    expect(ice.cracks).toBe(2);
    advance(w, mechanics.crumble.warnAtSec[1] - mechanics.crumble.warnAtSec[0] - dt);
    expect(step(w).platformCracked).toBe(true);
    expect(ice.cracks).toBe(3);
    advance(w, mechanics.crumble.triggerSec - mechanics.crumble.warnAtSec[1] - dt);
    expect(w.map.isOneWay(col, row)).toBe(true);
    expect(step(w).platformBroken).toBe(true);
    expect(w.map.get(col, row)).toBe(Tile.Empty);
    advance(w, mechanics.crumble.respawnSec);
    expect(ice.state).toBe('ready');
    expect(w.map.isOneWay(col, row)).toBe(true);
  });

  it.each([false, true])('chờ chỗ mọc lại trống, mây chìm = %s', (sink) => {
    const layout = room();
    const slab = new CrumblePlatform(
      layout.crumbles![sink ? 1 : 0]!,
      layout.map,
      mechanics.crumble,
    );
    const rules = sink ? mechanics.crumble.sink : mechanics.crumble;
    const rider = { x: slab.origin.x + 1, y: slab.origin.y - 24, w: 12, h: 24 };
    const obstructed = () => slab.obstructedBy(rider);
    expect(slab.activate()).toBe(true);
    expect(slab.step(rules.triggerSec, obstructed)).toBe('collapse');
    slab.step(rules.respawnSec, obstructed);
    expect(slab.state).not.toBe('ready');
    expect(slab.obstructedBy({ ...rider, y: slab.origin.y + 1 })).toBe(true);
    rider.x += slab.origin.w;
    expect(slab.step(dt, obstructed)).toBe('restore');
    expect(slab.state).toBe('ready');
    expect(slab.platform.y).toBe(slab.origin.y);
  });

  it('QB-40: bục băng và bệ di động không làm mốc hồi sinh, nền thật vẫn kích hoạt', () => {
    const layout = room();
    layout.checkpoints.push({ col: 5, row: 9 });
    const w = world(layout);
    const [ice, sink] = w.crumbles;
    w.player.respawn(ice!.origin.x + 8, ice!.origin.y);
    expect(step(w).checkpoint).toBeUndefined();
    w.player.respawn(sink!.origin.x + 8, sink!.origin.y);
    expect(step(w).checkpoint).toBeUndefined();
    expect(w.player.onPlatform).toBe(true);
    const drift = w.cloudDrifts[0]!.platform;
    w.player.respawn(drift.x + 8, drift.y);
    expect(step(w).checkpoint).toBeUndefined();
    expect(w.player.onPlatform).toBe(true);
    w.player.respawn(5.5 * t, floor);
    expect(step(w).checkpoint).toBe(1);
  });

  it('địch đất đứng trên băng không kích hoạt, rơi xuống sàn khi Kai làm vỡ', () => {
    const layout = room();
    layout.enemies.push({ col: 7, row: 7, enemy: 'thap_phao_tap_su', harmless: true });
    const w = world(layout);
    const e = w.enemies[0]!;
    const ice = w.crumbles[0]!;
    advance(w, 1.1);
    expect(ice.state).toBe('ready');
    expect(e.box.y + e.box.h).toBe(ice.origin.y);
    w.player.respawn(ice.origin.x + 7, ice.origin.y);
    step(w);
    advance(w, mechanics.crumble.triggerSec + 0.4);
    expect(ice.state).toBe('broken');
    expect(e.box.y + e.box.h).toBeCloseTo(floor);
    expect(e.alive).toBe(true);
    expect(w.exp).toBe(0);
  });

  it('QB-20: địch rơi khỏi bản đồ cộng EXP một lần, Core Bit mất theo hố', () => {
    const layout = room();
    layout.enemies.push({ col: 7, row: 7, enemy: 'thap_phao_tap_su', harmless: true });
    for (const row of [10, 11]) for (const col of [5, 6, 7]) layout.map.set(col, row, Tile.Empty);
    const w = world(layout);
    const e = w.enemies[0]!;
    const ice = w.crumbles[0]!;
    const trigger = () => {
      w.player.respawn(ice.origin.x + 7, ice.origin.y);
      step(w);
      w.player.respawn(56, floor);
    };
    trigger();
    let killed = false;
    for (let i = 0; i < 160 && e.alive; i += 1) killed ||= step(w).enemyKilled;
    expect(killed).toBe(true);
    expect(w.exp).toBe(e.data.exp);
    expect(w.field!.pickups.all).toHaveLength(0);
    w.player.hp = 0;
    w.player.state = 'dead';
    step(w);
    until(w, () => !w.respawning);
    expect(ice.state).toBe('ready');
    expect(e.alive).toBe(true);
    trigger();
    until(w, () => !e.alive);
    expect(w.exp).toBe(e.data.exp);
    expect(w.field!.pickups.all).toHaveLength(0);
  });
});

describe('bệ mây', () => {
  it('mây chìm đúng nhịp và mang Kai tới nền dưới', () => {
    const w = world();
    const sink = w.crumbles[1]!;
    w.player.respawn(sink.origin.x + 12, sink.origin.y);
    expect(step(w).platformCracked).toBe(true);
    advance(w, mechanics.crumble.sink.triggerSec - dt);
    expect(sink.state).toBe('cracking');
    expect(step(w).platformBroken).toBe(true);
    expect(sink.state).toBe('sinking');
    const before = w.player.bottom;
    step(w);
    expect(w.player.onPlatform).toBe(true);
    expect(w.player.bottom - before).toBeCloseTo(mechanics.crumble.sink.sinkTilesPerSec * t * dt);
    until(w, () => sink.state === 'broken');
    expect(w.player.bottom).toBeCloseTo(floor);
    expect(w.player.onPlatform).toBe(false);
    until(w, () => sink.state === 'ready');
    expect(sink.platform.y).toBe(sink.origin.y);
    expect(w.player.bottom).toBeCloseTo(floor);
  });

  it('rời bệ đang chìm rồi đáp lại, bệ vẫn tiếp tục chìm', () => {
    const layout = layoutFromRows(
      [
        '#..................#',
        ...Array.from({ length: 39 }, () => '#..................#'),
        '####################',
      ],
      t,
    );
    layout.crumbles = [{ col: 5, row: 7, widthTiles: 4, mode: 'sink' }];
    const w = world(layout);
    const sink = w.crumbles[0]!;
    w.player.respawn(sink.origin.x + 25, sink.origin.y);
    step(w);
    advance(w, mechanics.crumble.sink.triggerSec + 2 * dt);
    expect(sink.state).toBe('sinking');
    const y = sink.platform.y;
    step(w, { jumpPressed: true, jumpHeld: true });
    expect(w.player.onPlatform).toBe(false);
    until(w, () => w.player.onPlatform);
    expect(sink.state).toBe('sinking');
    expect(sink.platform.y).toBeGreaterThan(y);
    const old = sink.platform;
    until(w, () => sink.state === 'ready');
    expect(sink.platform).not.toBe(old);
    expect(w.player.bottom).toBeGreaterThan(sink.origin.y + 2 * t);
  });

  it('bệ trôi đi đường chéo ở tốc độ cấu hình và giữ phần quãng dư khi đổi hướng', () => {
    const speed = mechanics.cloud.drift.speedTilesPerSec * t;
    const p = new CloudDrift({ col: 1, row: 8, widthTiles: 2, end: { col: 5, row: 5 } }, speed, t);
    const duration = (5 * t) / speed;
    p.step(duration + 0.5);
    expect(p.platform.x).toBeCloseTo(5 * t - 0.8 * speed * 0.5);
    expect(p.platform.y).toBeCloseTo(5 * t + 0.6 * speed * 0.5);
    p.step(duration - 0.5);
    expect(p.platform.x).toBeCloseTo(t);
    expect(p.platform.y).toBeCloseTo(8 * t);
  });

  it('bệ trôi chở Kai theo dx/dy và cho xuống + nhảy rơi xuyên', () => {
    const w = world();
    const p = w.cloudDrifts[0]!.platform;
    w.player.respawn(p.x + p.w / 2, p.y);
    step(w);
    expect(w.player.onPlatform).toBe(true);
    const x = w.player.centerX;
    const y = w.player.bottom;
    step(w);
    expect(w.player.centerX - x).toBeCloseTo(p.dx);
    expect(w.player.bottom - y).toBeCloseTo(p.dy);
    step(w, { downHeld: true, jumpPressed: true });
    expect(w.player.onPlatform).toBe(false);
    until(w, () => w.player.bottom === floor);
    expect(w.player.onPlatform).toBe(false);
  });

  it('Kai rời bệ khi bị tường chắn trong lúc bệ đi tiếp', () => {
    const layout = room();
    layout.cloudDrifts = [{ col: 6, row: 7, widthTiles: 3, end: { col: 12, row: 7 } }];
    layout.map.set(9, 5, Tile.Solid);
    layout.map.set(9, 6, Tile.Solid);
    const w = world(layout);
    const p = w.cloudDrifts[0]!.platform;
    w.player.respawn(8 * t, 7 * t);
    step(w);
    expect(w.player.onPlatform).toBe(true);
    until(w, () => !w.player.onPlatform);
    expect(w.player.box.x + w.player.box.w).toBeCloseTo(9 * t);
    expect(p.x).toBeGreaterThanOrEqual(9 * t);
    until(w, () => w.player.bottom === floor);
  });

  it('QB-43: trở về checkpoint do rơi hố dựng lại bệ, giữ máu còn lại', () => {
    const w = world();
    w.crumbles[0]!.activate();
    const x = w.cloudDrifts[0]!.platform.x;
    advance(w, mechanics.crumble.triggerSec);
    expect(w.crumbles[0]!.state).toBe('broken');
    w.player.box.y = w.map.heightPx + 1;
    expect(step(w).fellInPit).toBe(true);
    until(w, () => !w.respawning);
    expect(w.player.hp).toBe(w.player.maxHp - mechanics.pit.damage);
    expect(w.crumbles[0]!.state).toBe('ready');
    expect(w.cloudDrifts[0]!.platform.x).toBe(x);
  });
});

describe('Tiled', () => {
  it('nạp đúng bề rộng, hai chế độ và điểm cuối', () => {
    const layout = room();
    expect(layout.crumbles).toEqual([
      { col: 5, row: 8, widthTiles: 3, mode: 'break' },
      { col: 11, row: 8, widthTiles: 3, mode: 'sink' },
    ]);
    expect(layout.cloudDrifts).toEqual([
      { col: 17, row: 8, widthTiles: 3, end: { col: 22, row: 6 } },
    ]);
  });

  it('báo lỗi nếu sai mode, trùng điểm, ra ngoài hoặc đường trôi xuyên tường', () => {
    type Raw = {
      layers: {
        data?: number[];
        objects?: { type: string; properties: { name: string; value: unknown }[] }[];
      }[];
    };
    const get = () => structuredClone(PLATFORM_ROOM.map) as Raw;
    const prop = (map: Raw, object: string, key: string) =>
      map.layers
        .flatMap((l) => l.objects ?? [])
        .find((o) => o.type === object)!
        .properties.find((p) => p.name === key)!;
    const mode = get();
    prop(mode, 'crumblePlatform', 'mode').value = 'melt';
    expect(() => layoutFromTiled(mode, t)).toThrow(/mode/);
    const same = get();
    prop(same, 'cloudDrift', 'endCol').value = 17;
    prop(same, 'cloudDrift', 'endRow').value = 8;
    expect(() => layoutFromTiled(same, t)).toThrow(/hai đầu/);
    prop(same, 'cloudDrift', 'endCol').value = 32;
    expect(() => layoutFromTiled(same, t)).toThrow(/ngoài bản đồ/);
    const wall = get();
    wall.layers.find((l) => l.data)!.data![7 * 32 + 21] = 1;
    expect(() => layoutFromTiled(wall, t)).toThrow(/đường trôi chạm/);
  });
});
