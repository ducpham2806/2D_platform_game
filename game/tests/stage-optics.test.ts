import { describe, expect, it } from 'vitest';
import { FIXED_STEP_HZ, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { ARC_CANNON } from '@/logic/combat/loadout';
import { EMPTY_BUILD } from '@/logic/rpg/build';
import { laserBox, type MirrorAngle, opticalCenter, traceLaser } from '@/logic/stage/laser-path';
import { layoutFromTiled } from '@/logic/stage/tiled';
import { Tile, TileMap } from '@/logic/tilemap';
import { LaserEmitter, StageOptics } from '@/logic/world/stage-optics';
import { StageWorld, type WorldSetup } from '@/logic/world/stage-world';
import { IDLE_INPUT, noWorldEvents, type WorldInput } from '@/logic/world/world-types';
import { buildStageLayout } from '@/stages/stage-def';
import { OPTICS_ROOM } from '@/stages/optics-room';
import { loadData } from './helpers';

const data = parseGameConfig(loadData());
const rules = data.stages.mechanics;
const t = TILE_SIZE;
const dt = 1 / FIXED_STEP_HZ;
const map = () =>
  TileMap.fromRows(
    Array.from({ length: 10 }, () => '.'.repeat(10)),
    t,
  );
const center = (col: number, row: number) => opticalCenter(col, row, t);
const room = () => buildStageLayout(OPTICS_ROOM, t);

function world(overrides: Partial<WorldSetup> = {}) {
  return new StageWorld({
    layout: room(),
    tileSize: t,
    stepSec: dt,
    player: data.player,
    weapons: data.weapons,
    boss: data.bosses.gray!,
    difficulty: data.difficulties.find((d) => d.id === 'normal')!,
    mechanics: rules,
    seed: 1,
    ...overrides,
  });
}

function steps(w: StageWorld, count: number, input: Partial<WorldInput> = {}) {
  return Array.from({ length: count }, () => w.step({ ...IDLE_INPUT, ...input }));
}

function charge(w: StageWorld) {
  steps(w, 1, { shootPressed: true, shootHeld: true });
  steps(w, Math.ceil(data.weapons.arcCannon.midCharge.timeSec * FIXED_STEP_HZ), {
    shootHeld: true,
  });
  expect(w.step({ ...IDLE_INPUT, shootReleased: true }).fired).toBe('mid');
}

describe('LaserPath (GDD 16 mục 3.3)', () => {
  it('dừng ở mép ô đặc hoặc mép bản đồ, đi qua bục một chiều, gai và tầm còn lại', () => {
    const tiles = map();
    tiles.set(2, 2, Tile.OneWay);
    tiles.set(3, 2, Tile.Hazard);
    tiles.set(4, 2, Tile.Solid);
    const source = center(1, 2);
    expect(traceLaser(tiles, source, 'right', () => undefined, 4)).toEqual([
      { from: source, to: { x: 4 * t, y: source.y } },
    ]);
    expect(traceLaser(tiles, source, 'up', () => undefined, 4)[0]?.to).toEqual({
      x: source.x,
      y: 0,
    });
    expect(traceLaser(tiles, source, 'down', () => undefined, 4)[0]?.to).toEqual({
      x: source.x,
      y: tiles.heightPx,
    });
    expect(traceLaser(tiles, source, 'right', () => undefined, 4, t)[0]?.to).toEqual(center(2, 2));
  });

  it.each([0, 1, 2, 4])(
    'giới hạn %i lần phản xạ và đếm chiều dài xuyên suốt các đoạn',
    (maxBounces) => {
      const tiles = map();
      const mirrors = new Map<string, MirrorAngle>([
        ['6,2', 135],
        ['6,6', 45],
        ['3,6', 135],
        ['3,4', 45],
        ['8,4', 135],
      ]);
      const pivot = (col: number, row: number) => mirrors.get(`${col},${row}`);
      const source = center(1, 2);
      const endpoints = [center(6, 2), center(6, 6), center(3, 6), center(3, 4), center(8, 4)];
      const path = traceLaser(tiles, source, 'right', pivot, maxBounces);
      expect(path.map((segment) => segment.to)).toEqual(endpoints.slice(0, maxBounces + 1));
      expect(traceLaser(tiles, source, 'right', pivot, 4, 6 * t).at(-1)?.to).toEqual(center(6, 3));
    },
  );

  it('cả hai mặt gương hoạt động, kể cả với nguồn lệch tâm ô', () => {
    const tiles = map();
    const pivot = (col: number, row: number) => (col === 3 && row === 3 ? 45 : undefined);
    const source = { x: t, y: 3 * t + 4 };
    const hit = { x: 4 * t - 4, y: source.y };
    expect(traceLaser(tiles, source, 'right', pivot, 4)).toEqual([
      { from: source, to: hit },
      { from: hit, to: { x: hit.x, y: 0 } },
    ]);
    expect(traceLaser(tiles, center(6, 3), 'left', pivot, 4).at(-1)?.to).toEqual({
      x: center(3, 3).x,
      y: tiles.heightPx,
    });
  });

  it('dừng tại nguồn và cắt vòng kín theo ngân sách phản xạ', () => {
    const tiles = map();
    const mirrors = new Map<string, MirrorAngle>([
      ['2,2', 45],
      ['6,2', 135],
      ['6,6', 45],
      ['2,6', 135],
    ]);
    const pivot = (col: number, row: number) => mirrors.get(`${col},${row}`);
    const source = center(4, 2);
    expect(traceLaser(tiles, source, 'right', pivot, 4).at(-1)?.to).toEqual(source);
    const inside = center(2, 2);
    expect(traceLaser(tiles, inside, 'right', pivot, 4)).toHaveLength(4);
    expect(traceLaser(tiles, source, 'right', pivot, 2).at(-1)?.to).toEqual(center(2, 6));
  });
});

describe('Chu kỳ và hình học laser', () => {
  it.each([0, 0.15, 0.7, 1])('pha %f vẫn có đủ thời lượng báo và xung bật', (phase) => {
    const laser = new LaserEmitter(
      { col: 0, row: 0, direction: 'right', mode: 'pulse', phase },
      rules.laser,
      t,
    );
    const states = [laser.state];
    for (let n = 0; n < 400; n += 1) {
      laser.step(dt);
      states.push(laser.state);
    }
    const active = states.indexOf('active');
    const warning = states.indexOf('warning');
    expect((active - warning) * dt).toBeCloseTo(rules.laser.pulse.warnSec, 6);
    expect(states.slice(active).indexOf('off') * dt).toBeCloseTo(rules.laser.pulse.onSec, 6);
  });

  it('vạch báo và vùng trúng dùng cùng đường qua gương, nạp lại đường khi cửa mở', () => {
    const layout = room();
    layout.optics!.lasers[0]!.mode = 'pulse';
    const optics = new StageOptics(layout.optics!, layout.map, rules);
    const laser = optics.lasers[0]!;
    for (let i = 0; i < 180 && laser.state === 'off'; i += 1) optics.step(dt, noWorldEvents());
    expect(laser.state).toBe('warning');
    const path = laser.path;
    const mirrorX = center(8, 7).x;
    expect(path).toHaveLength(2);
    expect(laser.collision({ x: mirrorX - 1, y: 130, w: 2, h: 2 })).toBeUndefined();
    for (let i = 0; i < 180 && laser.state === 'warning'; i += 1) optics.step(dt, noWorldEvents());
    expect(laser.path).toBe(path);
    expect(laser.boxes).toEqual(path.map((segment) => laserBox(segment, rules.laser.beamWidthPx)));
    expect(laser.collision({ x: mirrorX - 1, y: 130, w: 2, h: 2 })).toBe(path[1]);
    expect(laser.collision({ x: mirrorX + 2, y: 130, w: 2, h: 2 })).toBeUndefined();
    layout.map.set(9, 7, Tile.Solid);
    optics.step(dt, noWorldEvents());
    expect(laser.path).toEqual([{ from: laser.center, to: { x: 10 * t, y: laser.center.y } }]);
  });

  it('tia khác đi xa hơn từ bước sau khi cửa quang mở', () => {
    const tiles = map();
    const optics = new StageOptics(
      {
        lasers: [
          { col: 1, row: 2, direction: 'right', mode: 'always', phase: 0 },
          { col: 1, row: 4, direction: 'right', mode: 'always', phase: 0 },
        ],
        mirrors: [],
        sensors: [{ col: 3, row: 2, doorId: 1 }],
        doors: [{ id: 1, first: 4, last: 4, top: 4, bottom: 4 }],
      },
      tiles,
      rules,
    );
    const laser = optics.lasers[1]!;
    expect(laser.path[0]?.to.x).toBe(4 * t);
    const ev = noWorldEvents();
    optics.step(rules.sensor.holdSec, ev);
    expect(ev.sensorActivated).toBe(true);
    expect(laser.path[0]?.to.x).toBe(4 * t);
    optics.step(dt, noWorldEvents());
    expect(laser.path[0]?.to.x).toBe(tiles.widthPx);
  });
});

describe('StageWorld optics', () => {
  it('đạn tự bắn bị hấp thụ; nạp vừa đổi gương; cửa giữ mở khi hồi sinh và đóng lại ở lượt mới', () => {
    const w = world();
    const optics = w.optics!;
    const mirror = optics.mirrors[0]!;
    const sensor = optics.sensors[0]!;
    const door = optics.doors[0]!;
    expect(w.map.get(12, 9)).toBe(Tile.Solid);
    expect(steps(w, 75, { autoFire: true }).some((ev) => ev.mirrorToggled)).toBe(false);
    expect(w.pool.all.filter((p) => p.alive).every((p) => p.x < mirror.box.x)).toBe(true);
    expect(mirror.angle).toBe(45);
    charge(w);
    const initialPath = optics.lasers[0]!.path;
    let toggled = false;
    for (let i = 0; i < 50 && !toggled; i += 1) toggled = w.step(IDLE_INPUT).mirrorToggled;
    expect(toggled).toBe(true);
    expect(optics.lasers[0]!.path).toBe(initialPath);
    expect(sensor.progress).toBe(0);
    const holdSteps = Math.ceil(rules.sensor.holdSec / dt);
    expect(steps(w, holdSteps - 1).some((ev) => ev.sensorActivated)).toBe(false);
    expect(sensor.progress).toBeGreaterThan(0);
    expect(w.step(IDLE_INPUT).sensorActivated).toBe(true);
    expect(steps(w, 2).some((ev) => ev.sensorActivated)).toBe(false);
    expect(w.map.get(12, 9)).toBe(Tile.Empty);
    expect(steps(w, 110, { moveX: 1 }).every((ev) => !ev.laserHit)).toBe(true);
    expect(w.player.centerX).toBeGreaterThan(13 * t);
    w.player.hp = 1;
    w.player.respawn(center(9, 7).x, 8 * t, 1);
    expect(w.step(IDLE_INPUT)).toMatchObject({
      laserHit: true,
      playerDied: true,
      deathCause: 'laser',
    });
    expect(steps(w, Math.ceil(rules.respawnSec / dt) + 1).some((ev) => ev.respawned)).toBe(true);
    expect(mirror.angle).toBe(45);
    expect(door.open).toBe(true);
    expect(w.map.get(12, 9)).toBe(Tile.Empty);
    expect(world().map.get(12, 9)).toBe(Tile.Solid);
  });

  it('hai phát trúng cùng bước đổi một lần, phát trong 0,25 s bị gương hấp thụ', () => {
    const w = world();
    const mirror = w.optics!.mirrors[0]!;
    const spawn = (kind: 'shot' | 'mid' | 'charged') =>
      w.pool.spawn({
        owner: 'player',
        weapon: ARC_CANNON,
        kind,
        x: mirror.center.x,
        y: mirror.center.y,
        w: 4,
        h: 4,
        vx: 0,
        vy: 0,
        ttl: 1,
        damage: 1,
        kindMul: 1,
        pierceLeft: 1,
        breaksShield: false,
        maxDistance: 100,
        attached: false,
      });
    const first = spawn('mid');
    const second = spawn('charged');
    expect(w.step(IDLE_INPUT).mirrorToggled).toBe(true);
    expect(mirror.angle).toBe(135);
    expect(first.alive || second.alive).toBe(false);
    const during = spawn('mid');
    expect(w.step(IDLE_INPUT).mirrorToggled).toBe(false);
    expect(during.alive).toBe(false);
    steps(w, Math.round(rules.mirror.rotateSec / dt) - 2);
    spawn('mid');
    expect(w.step(IDLE_INPUT).mirrorToggled).toBe(true);
    expect(mirror.angle).toBe(45);
    expect(w.optics!.sensors[0]!.progress).toBeLessThan(1);
    w.step(IDLE_INPUT);
    expect(w.optics!.sensors[0]!.progress).toBe(0);
  });

  it('cảm biến không tính vạch báo và không tích dồn ánh sáng từ nhiều xung ngắn', () => {
    const layout = room();
    layout.optics!.mirrors[0]!.angle = 135;
    layout.optics!.lasers[0]!.mode = 'pulse';
    const mechanics = {
      ...rules,
      laser: { ...rules.laser, pulse: { ...rules.laser.pulse, onSec: 0.2 } },
    };
    const w = world({ layout, mechanics });
    const [sensor] = w.optics!.sensors;
    const laser = w.optics!.lasers[0]!;
    for (let i = 0; i < 180 && laser.state === 'off'; i += 1) w.step(IDLE_INPUT);
    expect(laser.state).toBe('warning');
    expect(sensor!.progress).toBe(0);
    expect(steps(w, 430).some((ev) => ev.sensorActivated)).toBe(false);
    expect(sensor!.door.open).toBe(false);
  });

  it.each(['story', 'normal', 'challenge'])(
    'tia luôn bật ở %s đưa Kai về chỗ an toàn và bỏ qua khiên',
    (id) => {
      const difficulty = data.difficulties.find((d) => d.id === id)!;
      const build = {
        ...EMPTY_BUILD,
        shield: { rechargeSec: 6, iFrameSec: 1, hitStopSteps: 2, pierceKinds: new Set<string>() },
      };
      const w = world({ difficulty, build, spikeGuard: true });
      const safe = w.player.centerX;
      w.player.respawn(center(8, 9).x, 10 * t);
      expect(w.step({ ...IDLE_INPUT, dashPressed: true })).toMatchObject({
        laserHit: true,
        kaiShieldAbsorbed: false,
      });
      expect(w.player.hp).toBe(
        w.player.maxHp - Math.round(rules.laser.damage * difficulty.damageTaken),
      );
      expect(w.player.centerX).toBe(safe);
      expect(w.step(IDLE_INPUT).laserHit).toBe(false);
    },
  );

  it('tia theo nhịp đẩy Kai vuông góc và chỉ trúng một lần dù bất tử đã hết', () => {
    const w = world();
    const pulse = w.optics!.lasers[1]!;
    const x = pulse.center.x - 3;
    const bottom = 10 * t;
    const state = () => pulse.state;
    for (let i = 0; i < 180 && state() !== 'warning'; i += 1) w.step(IDLE_INPUT);
    expect(state()).toBe('warning');
    w.player.respawn(x, bottom);
    for (let i = 0; i < 180 && state() === 'warning'; i += 1) w.step(IDLE_INPUT);
    const hp = w.player.maxHp - rules.laser.damage;
    expect(w.player.hp).toBe(hp);
    expect(w.player.vx).toBe(-t * rules.laser.knockbackTilesPerSec);
    expect(w.player.vy).toBe(0);
    for (let i = 0; i < 180 && state() === 'active'; i += 1) {
      w.player.box.x = x - w.player.box.w / 2;
      expect(w.step(IDLE_INPUT).laserHit).toBe(false);
    }
    expect(w.player.hp).toBe(hp);
    expect(w.player.invulnerable).toBe(false);
    w.player.respawn(x, bottom, hp);
    expect(steps(w, Math.ceil(rules.laser.pulse.periodSec / dt)).some((ev) => ev.laserHit)).toBe(
      true,
    );
    expect(w.player.hp).toBe(hp - rules.laser.damage);
  });
});

describe('đối tượng quang học trong Tiled', () => {
  it('đọc thông số gương, nguồn, cửa và cảm biến từ phòng thử', () => {
    expect(room().optics).toMatchObject({
      lasers: [
        { direction: 'left', mode: 'always' },
        { direction: 'down', mode: 'pulse', phase: 0 },
      ],
      mirrors: [{ col: 8, row: 7, angle: 45 }],
      sensors: [{ doorId: 6 }],
      doors: [{ id: 6, first: 12, top: 7, bottom: 9 }],
    });
  });

  it.each([
    ['laser', 'direction', 'diagonal'],
    ['laser', 'mode', 'random'],
    ['mirror', 'angle', 90],
    ['lightSensor', 'door', 99],
  ])('báo rõ thuộc tính %s.%s sai', (kind, key, value) => {
    const raw = structuredClone(OPTICS_ROOM.map) as {
      layers: { objects?: { type: string; properties: { name: string; value: unknown }[] }[] }[];
    };
    const object = raw.layers.flatMap((layer) => layer.objects ?? []).find((o) => o.type === kind)!;
    object.properties.find((property) => property.name === key)!.value = value;
    expect(() => layoutFromTiled(raw, t)).toThrow(new RegExp(String(key)));
  });
});
