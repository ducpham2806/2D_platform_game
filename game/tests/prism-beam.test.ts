import { describe, expect, it } from 'vitest';
import { FIXED_STEP_HZ, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { PRISM_BEAM } from '@/logic/combat/loadout';
import type { ShieldCharger } from '@/logic/enemy/behaviors';
import { layoutFromRows, type StageLayout } from '@/logic/stage/layout';
import { Tile } from '@/logic/tilemap';
import { StageWorld, type WorldSetup } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldInput } from '@/logic/world/world-types';
import { OPTICS_ROOM } from '@/stages/optics-room';
import { MECHANICS_ROOM } from '@/stages/mechanics-room';
import { buildStageLayout } from '@/stages/stage-def';
import { loadData } from './helpers';

const cfg = parseGameConfig(loadData());
const t = TILE_SIZE;
const dt = 1 / FIXED_STEP_HZ;
const weapon = cfg.weapons.bossWeapons.find((w) => w.name === PRISM_BEAM)!;
const beam = weapon.behavior!;
if (beam.type !== 'beam' || weapon.energyCost === null) throw new Error('Thiếu dữ liệu Prism Beam');
const cost = weapon.energyCost;
const cooldownSteps = Math.round(beam.cooldownSec / dt);
const damage = cfg.weapons.arcCannon.damage * beam.damageMul;
const optics = () => buildStageLayout(OPTICS_ROOM, t);
const chamber = (row = '#P..................#') =>
  layoutFromRows(
    [...Array.from({ length: 9 }, () => '#...................#'), row, '#####################'],
    t,
    { E: { enemy: 'linh_ken' } },
  );

function makeWorld(layout: StageLayout, overrides: Partial<WorldSetup> = {}): StageWorld {
  const w = new StageWorld({
    layout,
    tileSize: t,
    stepSec: dt,
    player: cfg.player,
    weapons: cfg.weapons,
    boss: cfg.bosses.gray!,
    enemies: cfg.enemies,
    difficulty: cfg.difficulties.find((d) => d.id === 'normal')!,
    mechanics: cfg.stages.mechanics,
    seed: 3,
    ownedWeapons: [PRISM_BEAM],
    ...overrides,
  });
  w.loadout.index = w.loadout.slots.findIndex((slot) => slot.name === PRISM_BEAM);
  return w;
}

function step(w: StageWorld, patch: Partial<WorldInput> = {}) {
  return w.step({ ...IDLE_INPUT, ...patch });
}

function idle(w: StageWorld, steps: number): void {
  for (let i = 0; i < steps; i += 1) step(w);
}

const fire = (w: StageWorld) => step(w, { shootPressed: true });

describe('Prism Beam, đầu vào và phạm vi', () => {
  it('QB-11–13: chỉ bắn khi bấm, trừ đúng năng lượng và tuân thủ hồi bắn', () => {
    const w = makeWorld(chamber());
    const slot = w.loadout.current;
    expect(step(w, { shootReleased: true }).fired).toBeUndefined();
    expect(fire(w).fired).toBe('beam');
    expect(slot.energy).toBe(cfg.weapons.energyMax - cost);
    expect(w.pool.count('player')).toBe(0);
    for (let i = 1; i < cooldownSteps; i += 1) {
      expect(step(w, { shootHeld: true, autoFire: true }).fired).toBeUndefined();
    }
    expect(fire(w).fired).toBe('beam');
    expect(slot.energy).toBe(cfg.weapons.energyMax - 2 * cost);
    idle(w, cooldownSteps);
    slot.energy = cost - 1;
    expect(fire(w)).toMatchObject({ emptyWeapon: true, fired: undefined });
    expect(w.loadout.current.name).toBe(PRISM_BEAM);
    expect(w.loadout.slots[0]?.energy).toBe(cfg.weapons.energyMax);
    w.loadout.refill();
    expect(slot.energy).toBe(cfg.weapons.energyMax);
  });

  it('xuyên nhiều mục tiêu, giới hạn tầm và chỉ tính trúng tại lúc bắn', () => {
    const w = makeWorld(chamber('#P.T...T......T.....#'));
    const [near, second, far] = w.targets;
    expect(fire(w)).toMatchObject({ fired: 'beam', hitTarget: true });
    expect(near!.hp).toBe(near!.maxHp - damage);
    expect(second!.hp).toBe(second!.maxHp - damage);
    expect(far!.hp).toBe(far!.maxHp);
    const box = w.playerBeams[0]!.boxes[0]!;
    expect(box).toMatchObject({ x: w.player.centerX, w: beam.rangeTiles * t, h: beam.widthPx });
    far!.box.x = second!.box.x;
    idle(w, Math.ceil(beam.activeSec / dt) - 1);
    expect(w.playerBeams).toHaveLength(1);
    idle(w, 1);
    expect(w.playerBeams).toHaveLength(0);
    expect(far!.hp).toBe(far!.maxHp);
    expect(near!.hp).toBe(near!.maxHp - damage);
  });

  it('giới hạn ba lần dội và tầm tổng ở cấu hình đang dùng', () => {
    const layout = chamber();
    layout.optics = {
      lasers: [],
      doors: [],
      sensors: [],
      mirrors: [
        { col: 3, row: 9, angle: 45 },
        { col: 3, row: 7, angle: 135 },
        { col: 2, row: 7, angle: 45 },
        { col: 2, row: 8, angle: 135 },
      ],
    };
    const full = makeWorld(layout);
    expect(fire(full).fired).toBe('beam');
    const boxes = full.playerBeams[0]!.boxes;
    expect(boxes).toHaveLength(beam.maxBounces + 1);
    expect(boxes[3]).toMatchObject({ y: 127, h: 2, w: beam.widthPx });
    const shorter = {
      ...cfg.weapons,
      bossWeapons: cfg.weapons.bossWeapons.map((w) =>
        w.name === PRISM_BEAM ? { ...w, behavior: { ...beam, rangeTiles: 3 } } : w,
      ),
    };
    const short = makeWorld(layout, { weapons: shorter });
    fire(short);
    const lengths = short.playerBeams[0]!.boxes.map((b, i) => (i % 2 === 0 ? b.w : b.h));
    expect(lengths).toEqual([39, 9]);
  });

  it('qua gương mở cảm biến và một mục tiêu ở điểm dội chỉ trúng một lần', () => {
    const layout = optics();
    layout.targets.push({ col: 8, row: 7, shield: false });
    const w = makeWorld(layout);
    const sensor = w.optics!.sensors[0]!;
    const mirror = w.optics!.mirrors[0]!;
    const hp = w.player.hp;
    expect(fire(w)).toMatchObject({
      fired: 'beam',
      sensorActivated: true,
      mirrorToggled: false,
      hitTarget: true,
    });
    expect(w.playerBeams[0]!.boxes).toHaveLength(2);
    expect(w.targets[0]!.hp).toBe(w.targets[0]!.maxHp - damage);
    expect(sensor.door.open).toBe(true);
    expect(mirror.angle).toBe(45);
    expect(w.player.hp).toBe(hp);
  });

  it('tia dội lại tới Kai thì dừng ở nguồn và không gây sát thương', () => {
    const layout = chamber();
    layout.optics = {
      lasers: [],
      doors: [],
      sensors: [],
      mirrors: [
        { col: 5, row: 9, angle: 45 },
        { col: 5, row: 7, angle: 135 },
        { col: 3, row: 7, angle: 45 },
      ],
    };
    const w = makeWorld(layout);
    w.player.respawn(49, 10 * t);
    expect(fire(w)).toMatchObject({ fired: 'beam', playerHurt: false });
    const boxes = w.playerBeams[0]!.boxes;
    expect(boxes).toHaveLength(4);
    expect(boxes[3]).toEqual({ x: 49 - beam.widthPx / 2, y: 127, w: beam.widthPx, h: 18 });
    expect(w.player.hp).toBe(w.player.maxHp);
  });
});

describe('Prism Beam, chắn tia', () => {
  const shieldRoom = () => {
    const layout = chamber('#P....E.T...........#');
    layout.optics = {
      lasers: [],
      mirrors: [],
      sensors: [{ col: 8, row: 9, doorId: 1 }],
      doors: [{ id: 1, first: 11, last: 11, top: 8, bottom: 9 }],
    };
    layout.barriers.push({ first: 10, last: 10, top: 8, bottom: 9, requiresWeapon: PRISM_BEAM });
    return layout;
  };

  it('QB-16, QB-18: mặt trước mất một lượt khiên; phát phá khiên vẫn dừng', () => {
    const w = makeWorld(shieldRoom());
    const enemy = w.enemies[0] as ShieldCharger;
    enemy.shieldLeft = 2;
    const before = enemy.hp;
    expect(fire(w)).toMatchObject({
      shieldHit: true,
      hitTarget: false,
      sensorActivated: false,
      barrierBroken: false,
    });
    expect(enemy.shieldLeft).toBe(1);
    const leg = w.playerBeams[0]!.boxes[0]!;
    expect(leg.x + leg.w).toBeCloseTo(enemy.box.x);
    idle(w, cooldownSteps - 1);
    enemy.facing = -1;
    expect(fire(w)).toMatchObject({
      shieldBroken: true,
      hitTarget: false,
      sensorActivated: false,
      barrierBroken: false,
    });
    expect(enemy.shieldLeft).toBe(0);
    expect(enemy.hp).toBe(before);
    expect(w.targets[0]!.hp).toBe(w.targets[0]!.maxHp);
    idle(w, cooldownSteps - 1);
    expect(fire(w)).toMatchObject({
      hitEnemy: true,
      hitTarget: true,
      sensorActivated: true,
      barrierBroken: true,
    });
  });

  it('QB-18: xuyên mặt sau khiên và mở cảm biến phía sau địch', () => {
    const w = makeWorld(shieldRoom());
    const enemy = w.enemies[0] as ShieldCharger;
    enemy.facing = 1;
    const shield = enemy.shieldLeft;
    expect(fire(w)).toMatchObject({
      hitEnemy: true,
      hitTarget: true,
      shieldHit: false,
      sensorActivated: true,
    });
    expect(enemy.hp).toBeCloseTo(enemy.maxHp - damage);
    expect(enemy.shieldLeft).toBe(shield);
  });

  it('QB-18: xét hướng của đoạn vừa dội vào khiên, kể cả khi ngược hướng bắn ban đầu', () => {
    const layout = chamber();
    layout.map.set(4, 8, Tile.Solid);
    layout.enemies.push({ col: 4, row: 7, enemy: 'linh_ken', harmless: true });
    layout.optics = {
      lasers: [],
      doors: [],
      sensors: [],
      mirrors: [
        { col: 5, row: 9, angle: 45 },
        { col: 5, row: 7, angle: 135 },
      ],
    };
    const w = makeWorld(layout);
    const enemy = w.enemies[0] as ShieldCharger;
    w.player.respawn(49, 10 * t);
    enemy.facing = 1;
    enemy.shieldLeft = 2;
    expect(fire(w)).toMatchObject({ shieldHit: true, hitEnemy: false });
    expect(enemy.shieldLeft).toBe(1);
    expect(w.playerBeams[0]!.boxes[2]!.x).toBeCloseTo(enemy.box.x + enemy.box.w);
  });

  it('đốt rễ sát mặt tường, mục tiêu phía sau chỉ trúng từ phát sau', () => {
    const layout = chamber('#P......T...........#');
    layout.barriers.push({ first: 6, last: 6, top: 8, bottom: 9, requiresWeapon: PRISM_BEAM });
    const w = makeWorld(layout);
    w.player.respawn(t * 6 - w.player.box.w / 2, 10 * t);
    w.loadout.swap(1);
    fire(w);
    idle(w, 15);
    expect(w.map.get(6, 9)).toBe(Tile.Solid);
    w.loadout.swap(1);
    expect(fire(w)).toMatchObject({ barrierBroken: true, hitTarget: false });
    expect(w.map.get(6, 9)).toBe(Tile.Empty);
    expect(w.playerBeams[0]!.boxes[0]!.w).toBe(w.player.box.w / 2);
    idle(w, cooldownSteps - 1);
    expect(fire(w)).toMatchObject({ barrierBroken: false, hitTarget: true });
  });

  it('ô đặc chặn đường vào gương hoặc đường thẳng tới cảm biến', () => {
    const room = optics();
    room.map.set(6, 7, Tile.Solid);
    const w = makeWorld(room);
    expect(fire(w)).toMatchObject({ fired: 'beam', sensorActivated: false });
    expect(w.playerBeams[0]!.boxes).toHaveLength(1);
    expect(w.optics!.doors[0]!.open).toBe(false);
  });

  it('đốt được rễ khô trước Két giáp trong bản đồ Tiled của phòng thử M7', () => {
    const w = makeWorld(buildStageLayout(MECHANICS_ROOM, t));
    const roots = w.barriers.find((b) => b.spawn.requiresWeapon === PRISM_BEAM)!;
    const b = roots.box();
    w.player.respawn(b.x - w.player.box.w, b.y + b.h);
    expect(fire(w)).toMatchObject({ fired: 'beam', barrierBroken: true });
    expect(roots.broken).toBe(true);
  });

  it('QB-14, QB-31: điểm yếu và đo lường dùng sát thương thật, tia bỏ qua bất tử lúc đổi pha', () => {
    const layout = chamber('#P.D....B...........#');
    layout.map.set(3, 9, Tile.Empty);
    const w = makeWorld(layout, { boss: { ...cfg.bosses.gray!, weakness: PRISM_BEAM } });
    w.phase = 'boss';
    w.boss!.activate();
    const expected = damage * weapon.damageVsWeak;
    expect(fire(w)).toMatchObject({ hitBoss: true, weakHit: true });
    expect(w.bossDamage.get(PRISM_BEAM)).toBeCloseTo(expected);
    expect(w.bossWeakHits).toBe(1);
    expect(w.hitStop).toBe(cfg.weapons.hitStopSteps.weakness);
    idle(w, cooldownSteps + w.hitStop);
    w.boss!.takeHit({ amount: w.boss!.data.hp, weak: false, stunSec: 0 });
    expect(w.boss!.shifting).toBe(true);
    expect(fire(w)).toMatchObject({ bossImmune: true, hitBoss: false, weakHit: false });
    expect(w.bossDamage.get(PRISM_BEAM)).toBeCloseTo(expected);
  });
});
