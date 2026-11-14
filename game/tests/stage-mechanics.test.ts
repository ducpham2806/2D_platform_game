import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { layoutFromRows, type StageLayout } from '@/logic/stage/layout';
import { layoutFromTiled, TiledError } from '@/logic/stage/tiled';
import { Tile } from '@/logic/tilemap';
import { StageWorld, type WorldSetup } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldEvents, type WorldInput } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';
import m7Map from '../maps/m7-test.json';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const config = parseGameConfig(loadData());
const mech = config.stages.mechanics;
const normal = config.difficulties.find((d) => d.id === 'normal')!;

function makeWorld(src: readonly string[] | StageLayout, extra: Partial<WorldSetup> = {}) {
  return new StageWorld({
    ...(Array.isArray(src) ? { rows: src as readonly string[] } : { layout: src as StageLayout }),
    tileSize: t,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.gray!,
    difficulty: normal,
    seed: 5,
    enemies: config.enemies,
    mechanics: mech,
    ...extra,
  });
}

const input = (patch: Partial<WorldInput>): WorldInput => ({ ...IDLE_INPUT, ...patch });

/** Chạy tới khi điều kiện đúng (tối đa `max` bước); trả về các sự kiện đã gặp. */
function runUntil(
  world: StageWorld,
  inp: WorldInput,
  done: (ev: WorldEvents) => boolean,
  max = 600,
): WorldEvents[] {
  const out: WorldEvents[] = [];
  for (let i = 0; i < max; i += 1) {
    const ev = world.step(inp);
    out.push(ev);
    if (done(ev)) return out;
  }
  throw new Error(`Không đạt điều kiện sau ${max} bước`);
}

/** Bản đồ Tiled tối thiểu để thử lỗi: 4 × 3 ô, nền đặc ở hàng cuối, một spawn. */
function tinyMap(patch: Record<string, unknown> = {}) {
  return {
    orientation: 'orthogonal',
    infinite: false,
    width: 4,
    height: 3,
    tilewidth: 16,
    tileheight: 16,
    tilesets: [{ firstgid: 1, tiles: [{ id: 1, properties: [{ name: 'oneway', value: true }] }] }],
    layers: [
      {
        type: 'tilelayer',
        name: 'ground',
        width: 4,
        height: 3,
        data: [0, 0, 0, 0, 0, 2, 0, 0, 1, 1, 1, 1],
      },
      {
        type: 'objectgroup',
        name: 'entities',
        objects: [{ id: 1, type: 'spawn', x: 8, y: 31, point: true }],
      },
    ],
    ...patch,
  };
}

describe('nạp bản đồ Tiled', () => {
  it('phòng thử màn chơi: đủ cơ chế M7', () => {
    const l = layoutFromTiled(m7Map, t);
    expect([l.map.cols, l.map.rows]).toEqual([96, 12]);
    expect(l.spawn).toEqual({ col: 3, row: 10 });
    expect(l.checkpoints).toEqual([
      { col: 30, row: 10 },
      { col: 54, row: 6 },
    ]);
    expect(l.vines.map((v) => [v.col, v.phase])).toEqual([
      [40, 0],
      [48, 0.5],
    ]);
    expect(l.rooms).toHaveLength(1);
    expect(l.rooms[0]).toMatchObject({ first: 60, last: 80, top: 0, bottom: 10 });
    // Cột cửa đặc từ trần tới hàng 6: cửa là 4 ô trống hàng 7–10 ở mỗi bên.
    expect(l.rooms[0]!.doors).toHaveLength(8);
    expect(l.barriers.map((b) => b.requiresWeapon)).toEqual(['Arc Cannon', 'Prism Beam']);
    expect(l.secrets.map((s) => s.label)).toEqual(['Nano Cell', 'Két giáp']);
    expect(l.enemies.map((e) => e.enemy).sort()).toEqual(['drone_linh', 'thap_phao_tap_su']);
    expect(l.sections.map((s) => s.id)).toEqual(['spikes', 'pit', 'vines', 'room', 'secrets']);
    expect(l.map.get(14, 10)).toBe(Tile.Hazard);
    expect(l.map.get(66, 7)).toBe(Tile.OneWay);
    expect(l.map.get(0, 5)).toBe(Tile.Solid);
    expect(l.map.get(25, 11)).toBe(Tile.Empty);
  });

  it('thuộc tính ô và cờ lật: ô không thuộc tính là đặc, ô có oneway là bục', () => {
    const flipped = tinyMap();
    // Gid 2 lật ngang (bit cao nhất) vẫn là bục một chiều.
    (flipped.layers[0] as { data: number[] }).data[5] = 2 + 0x80000000;
    const l = layoutFromTiled(flipped, t);
    expect(l.map.get(1, 1)).toBe(Tile.OneWay);
    expect(l.map.get(0, 2)).toBe(Tile.Solid);
    expect(l.spawn).toEqual({ col: 0, row: 1 });
  });

  it('báo lỗi rõ ràng khi bản đồ sai quy ước', () => {
    const bad: [Record<string, unknown>, RegExp][] = [
      [{ tilewidth: 32 }, /16 × 16/],
      [{ infinite: true }, /vô hạn/],
      [{ tilesets: [{ firstgid: 1, source: 'gray.tsx' }] }, /nhúng tileset/],
      [
        {
          layers: [
            {
              type: 'tilelayer',
              name: 'ground',
              width: 4,
              height: 3,
              encoding: 'base64',
              data: 'AAAA',
            },
          ],
        },
        /CSV/,
      ],
      [{ layers: [] }, /đúng 1 đối tượng spawn/],
      [
        {
          layers: [
            {
              type: 'objectgroup',
              name: 'entities',
              objects: [
                { id: 1, type: 'spawn', x: 8, y: 31 },
                { id: 2, type: 'quai_vat', x: 8, y: 31 },
              ],
            },
          ],
        },
        /class "quai_vat" lạ/,
      ],
      [
        {
          layers: [
            {
              type: 'objectgroup',
              name: 'entities',
              objects: [
                { id: 1, type: 'spawn', x: 8, y: 31 },
                { id: 2, type: 'enemy', x: 40, y: 31 },
              ],
            },
          ],
        },
        /"enemy"/,
      ],
    ];
    for (const [patch, msg] of bad) {
      expect(() => layoutFromTiled(tinyMap(patch), t)).toThrow(TiledError);
      expect(() => layoutFromTiled(tinyMap(patch), t)).toThrow(msg);
    }
  });

  it('mọi màn dựng sẵn đều dựng được bố cục', () => {
    for (const def of Object.values(STAGE_DEFS))
      expect(buildStageLayout(def, t).map.cols).toBeGreaterThan(0);
  });
});

describe('dữ liệu cơ chế màn', () => {
  it('đúng đặc tả: hồi sinh ≤ 1,5 s, gai 30, hố 20, dây leo 2,4 s / 3 ô', () => {
    expect(mech.respawnSec).toBeLessThanOrEqual(1.5);
    expect(mech.maxRespawnSec).toBe(1.5);
    expect(mech.spikes.damage).toBe(30);
    expect(mech.pit.damage).toBe(20);
    expect(mech.vine.periodSec).toBe(2.4);
    expect(mech.vine.amplitudeTiles).toBe(3);
  });

  it('chặn dữ liệu sai: hồi sinh chậm, gai giết ngay', () => {
    const slow = loadData();
    (slow.stages as { mechanics: { respawnSec: number } }).mechanics.respawnSec = 2;
    expect(() => parseGameConfig(slow)).toThrow(/respawnSec/);
    const deadly = loadData();
    (deadly.stages as { mechanics: { spikes: { damage: number } } }).mechanics.spikes.damage = 500;
    expect(() => parseGameConfig(deadly)).toThrow(/spikes\.damage/);
  });
});

describe('hố rơi', () => {
  // Hố 3 ô ngay trước mặt; checkpoint C ở cột 2.
  const PIT = ['#..........#', '#..........#', '#.PC.......#', '####...#####'];

  it('rơi hố: mất 20 máu, về checkpoint, không tính là chết', () => {
    const world = makeWorld(PIT);
    const max = world.player.hp;
    const evs = runUntil(world, input({ moveX: 1 }), (e) => e.respawned);
    expect(evs.some((e) => e.fellInPit)).toBe(true);
    expect(world.deaths).toBe(0);
    expect(world.falls).toBe(1);
    expect(world.player.hp).toBe(max - Math.round(mech.pit.damage * normal.damageTaken));
    expect(world.player.centerX).toBeCloseTo((3 + 0.5) * t);
    // Về checkpoint trong pit.returnSec (cộng thời gian rơi khỏi màn).
    const fallAt = evs.findIndex((e) => e.fellInPit);
    expect((evs.length - 1 - fallAt) * DT).toBeLessThanOrEqual(mech.pit.returnSec + DT);
  });

  it('rơi hố chỉ hồi sinh một lần: không hồi đầy máu, không dựng lại màn ở bước sau', () => {
    // Lỗi cũ: đồng hồ chờ hồi sinh còn dư sai số (> 0) nên bước sau hồi sinh lần nữa theo nhánh
    // chết (đầy máu, xóa đạn, dựng lại kẻ địch và boss).
    const world = makeWorld(PIT);
    runUntil(world, input({ moveX: 1 }), (e) => e.respawned);
    const hp = world.player.hp;
    const after = Array.from({ length: 60 }, () => world.step(input({})));
    expect(after.some((e) => e.respawned)).toBe(false);
    expect(world.player.hp).toBe(hp);
  });

  it('rơi hố khi còn ít máu thì chết, hồi sinh đầy máu', () => {
    const world = makeWorld(PIT);
    world.player.hp = 5;
    const evs = runUntil(world, input({ moveX: 1 }), (e) => e.respawned);
    expect(evs.some((e) => e.playerDied)).toBe(true);
    expect(world.deaths).toBe(1);
    expect(world.player.hp).toBe(world.player.maxHp);
  });
});

describe('bẫy gai', () => {
  // Gai 3 ô trên nền đặc.
  const SPIKES = ['#..............#', '#..............#', '#..P....^^^....#', '################'];

  it('chạm gai: mất 30 máu, về chỗ đứng an toàn, bất tử', () => {
    const world = makeWorld(SPIKES);
    const max = world.player.hp;
    runUntil(world, input({ moveX: 1 }), (e) => e.spikeHit);
    expect(world.player.hp).toBe(max - Math.round(mech.spikes.damage * normal.damageTaken));
    expect(world.player.box.x + world.player.box.w).toBeLessThanOrEqual(8 * t + 1e-6);
    expect(world.player.blinking).toBe(true);
    expect(world.player.state).not.toBe('dead');
  });

  it('Spike Guard miễn nhiễm', () => {
    const world = makeWorld(SPIKES, { spikeGuard: true });
    const max = world.player.hp;
    for (let i = 0; i < 90; i += 1) expect(world.step(input({ moveX: 1 })).spikeHit).toBe(false);
    expect(world.player.hp).toBe(max);
    expect(world.player.centerX).toBeGreaterThan(11 * t);
  });

  it('gai không giết ngay Kai đầy máu ở mọi độ khó', () => {
    for (const d of config.difficulties) {
      const world = makeWorld(SPIKES, { difficulty: d });
      runUntil(world, input({ moveX: 1 }), (e) => e.spikeHit);
      expect(world.player.hp, d.id).toBeGreaterThan(0);
    }
  });
});

describe('checkpoint', () => {
  const ROW = [
    '#....................#',
    '#....................#',
    '#.P.....C.......C....#',
    '######################',
  ];

  it('đi qua thì lưu; chết thì hồi sinh ở checkpoint trong ≤ 1,5 s, giữ Core Bit và EXP', () => {
    const world = makeWorld(ROW);
    const evs = runUntil(world, input({ moveX: 1 }), () => world.checkpointIndex === 2);
    expect(evs.filter((e) => e.checkpoint !== undefined).map((e) => e.checkpoint)).toEqual([1, 2]);
    world.field!.coreBits = 7;
    world.field!.exp = 12;
    world.player.applyHit(9999, world.player.centerX + 5);
    const after = runUntil(world, IDLE_INPUT, (e) => e.respawned);
    expect((after.length - 1) * DT).toBeLessThanOrEqual(mech.maxRespawnSec);
    expect(world.player.centerX).toBeCloseTo(16.5 * t);
    expect([world.field!.coreBits, world.field!.exp]).toEqual([7, 12]);
  });

  it('vào màn từ checkpoint đã lưu', () => {
    const world = makeWorld(ROW, { startCheckpoint: 1 });
    expect(world.checkpointIndex).toBe(1);
    expect(world.player.centerX).toBeCloseTo(8.5 * t);
  });
});

describe('dây leo đu', () => {
  const VINE = [
    '#.........#',
    '#....V....#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '#.........#',
    '###########',
  ];

  it('lắc đúng chu kỳ và biên độ', () => {
    const world = makeWorld(VINE);
    const vine = world.vines[0]!;
    const xs: number[] = [];
    const steps = Math.round(mech.vine.periodSec / DT);
    for (let i = 0; i < steps; i += 1) {
      world.step(IDLE_INPUT);
      xs.push(vine.end.x - vine.pivotX);
    }
    expect(Math.max(...xs) / t).toBeCloseTo(mech.vine.amplitudeTiles, 1);
    expect(Math.min(...xs) / t).toBeCloseTo(-mech.vine.amplitudeTiles, 1);
    // Sau đúng một chu kỳ về lại vị trí ban đầu.
    expect(xs[steps - 1]!).toBeCloseTo(0, 0);
  });

  it('đứng trên bệ thì được chở theo; nhảy khỏi bệ cao hơn nhảy thường', () => {
    const world = makeWorld(VINE);
    const pl = world.player;
    const p = world.vines[0]!.platform;
    pl.respawn(p.x + p.w / 2, p.y);
    world.step(IDLE_INPUT);
    expect(pl.onPlatform).toBe(true);
    const startX = pl.centerX;
    for (let i = 0; i < 20; i += 1) world.step(IDLE_INPUT);
    expect(pl.onPlatform).toBe(true);
    expect(pl.centerX).not.toBeCloseTo(startX, 0);
    expect(pl.bottom).toBeCloseTo(p.y, 3);
    world.step(input({ jumpPressed: true, jumpHeld: true }));
    const vineJump = pl.vy;

    const ground = makeWorld(VINE);
    ground.step(input({ jumpPressed: true, jumpHeld: true }));
    expect(-vineJump).toBeGreaterThan(-ground.player.vy * (1 + mech.vine.jumpBonus / 2));
  });

  it('Xuống + Nhảy thì rơi xuyên bệ', () => {
    const world = makeWorld(VINE);
    const pl = world.player;
    const p = world.vines[0]!.platform;
    pl.respawn(p.x + p.w / 2, p.y);
    world.step(IDLE_INPUT);
    world.step(input({ downHeld: true, jumpPressed: true, jumpHeld: true }));
    for (let i = 0; i < 10; i += 1) world.step(IDLE_INPUT);
    expect(pl.onPlatform).toBe(false);
    expect(pl.bottom).toBeGreaterThan(p.y + 8);
  });
});

describe('phòng khóa', () => {
  // Cột L là cửa; Tháp Pháo (U) trong phòng.
  const ROOM = [
    '##########################',
    '#......#........#........#',
    '#......L........L........#',
    '#.P....L......U.L........#',
    '##########################',
  ];
  const markers = STAGE_DEFS.enemies.enemyMarkers;
  const layout = (): StageLayout => layoutFromRows(ROOM, t, markers);

  it('vào hẳn trong phòng thì đóng cửa; hạ hết kẻ địch thì mở', () => {
    const world = makeWorld(layout());
    const room = world.rooms[0]!;
    runUntil(world, input({ moveX: 1 }), (e) => e.roomLocked);
    expect(room.state).toBe('locked');
    expect(world.map.isSolid(7, 3)).toBe(true);
    expect(world.lockedRoom?.remaining).toBe(1);
    world.enemies[0]!.hp = 0;
    const ev = world.step(IDLE_INPUT);
    expect(ev.roomCleared).toBe(true);
    expect(room.state).toBe('cleared');
    expect(world.map.isSolid(7, 3)).toBe(false);
    expect(world.map.isSolid(16, 3)).toBe(false);
  });

  it('chết trong phòng: cửa mở lại, kẻ địch dựng lại, vào lại thì khóa lại', () => {
    const world = makeWorld(layout());
    runUntil(world, input({ moveX: 1 }), (e) => e.roomLocked);
    world.player.applyHit(9999, world.player.centerX + 5);
    runUntil(world, IDLE_INPUT, (e) => e.respawned);
    expect(world.rooms[0]!.state).toBe('open');
    expect(world.map.isSolid(7, 3)).toBe(false);
    runUntil(world, input({ moveX: 1 }), (e) => e.roomLocked);
  });
});

describe('vật chắn và bí mật', () => {
  it('phòng thử màn chơi: Arc Cannon phá vách thử, không phá được rễ khô cần Prism Beam', () => {
    const world = makeWorld(layoutFromTiled(m7Map, t));
    const [arc, prism] = world.barriers;
    expect(world.map.isSolid(86, 9)).toBe(true);
    // Đứng trước vách thử, quay phải, bắn.
    world.player.respawn(84.5 * t, 11 * t);
    let broke = false;
    for (let i = 0; i < 60 && !broke; i += 1)
      broke = world.step(
        input({
          moveX: i < 2 ? 1 : 0,
          shootPressed: i % 10 === 2,
          shootHeld: i % 10 === 2,
          shootReleased: i % 10 === 3,
        }),
      ).barrierBroken;
    expect(broke).toBe(true);
    expect(arc!.broken).toBe(true);
    expect(world.map.isSolid(86, 9)).toBe(false);
    // Đi tới nhặt Nano Cell, rồi bắn rễ khô: không vỡ.
    const evs = runUntil(world, input({ moveX: 1 }), (e) => e.secretFound !== undefined, 120);
    expect(evs.at(-1)!.secretFound).toBe('nano_cell');
    for (let i = 0; i < 60; i += 1)
      world.step(
        input({ shootPressed: i % 10 === 0, shootHeld: i % 10 === 0, shootReleased: i % 10 === 1 }),
      );
    expect(prism!.broken).toBe(false);
    expect(world.map.isSolid(91, 9)).toBe(true);
    expect(world.collected).toEqual(['nano_cell']);
  });
});
