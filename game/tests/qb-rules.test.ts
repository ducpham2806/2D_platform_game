/**
 * Khóa các luật tình huống biên đã code (01-GDD/17-Quy-tac-bien.md). Tên test bắt đầu bằng mã luật.
 */
import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig, parseLevelRange } from '@/core/game-config';
import { ARC_CANNON } from '@/logic/combat/loadout';
import { scaleReward } from '@/logic/difficulty/difficulty';
import { levelForExp, LevelTracker, syncLevel } from '@/logic/rpg/progression';
import { WORKSHOP_TABS, workshopTabLabel } from '@/logic/rpg/workshop-model';
import { MemorySaveStore, SaveManager } from '@/logic/save/save-manager';
import { StageSave } from '@/logic/save/stage-save';
import { cameraLockFor } from '@/logic/stage/camera-bounds';
import { layoutFromRows, type StageLayout } from '@/logic/stage/layout';
import { StageWorld, type WorldSetup } from '@/logic/world/stage-world';
import { IDLE_INPUT, type WorldEvents, type WorldInput } from '@/logic/world/world-types';
import { STAGE_DEFS } from '@/stages';
import { GOLEM_ROOM, GOLEM_ROOM_ROWS } from '@/stages/golem-room';
import { THORNA_ROOM_ROWS } from '@/stages/thorna-room';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const config = parseGameConfig(loadData());
const mech = config.stages.mechanics;
const normal = config.difficulties.find((d) => d.id === 'normal')!;
const markers = STAGE_DEFS.enemies.enemyMarkers;
const VINE_LASH = config.bosses.thorna!.reward;

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

/** Phòng boss Thorna (không kẻ địch thường). */
function thornaWorld(extra: Partial<WorldSetup> = {}) {
  return new StageWorld({
    rows: THORNA_ROOM_ROWS,
    tileSize: t,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.thorna!,
    difficulty: normal,
    seed: 7,
    mechanics: mech,
    ...extra,
  });
}

const input = (patch: Partial<WorldInput>): WorldInput => ({ ...IDLE_INPUT, ...patch });
const press = input({ shootPressed: true, shootHeld: true });

/** Chạy tới khi điều kiện đúng (tối đa `max` bước); trả về các sự kiện đã gặp. */
function runUntil(
  world: StageWorld,
  inp: WorldInput | ((i: number) => WorldInput),
  done: (ev: WorldEvents) => boolean,
  max = 600,
): WorldEvents[] {
  const out: WorldEvents[] = [];
  for (let i = 0; i < max; i += 1) {
    const ev = world.step(typeof inp === 'function' ? inp(i) : inp);
    out.push(ev);
    if (done(ev)) return out;
  }
  throw new Error(`Không đạt điều kiện sau ${max} bước`);
}

/** Bắn nhịp đều: bấm 1 bước, nhả bước sau, lặp mỗi `every` bước. */
const tapEvery =
  (every: number, extra: Partial<WorldInput> = {}) =>
  (i: number): WorldInput => {
    const on = i % every === 0;
    return input({ ...extra, shootPressed: on, shootHeld: on, shootReleased: i % every === 1 });
  };

/** Kai chết ngay rồi chờ hồi sinh. */
function dieAndRespawn(world: StageWorld): WorldEvents[] {
  world.player.applyHit(9999, world.player.centerX + 5);
  return runUntil(world, IDLE_INPUT, (e) => e.respawned);
}

const FLAT = ['#..............#', '#..............#', '#.P............#', '################'];

/** Vào màn có Vine Lash và cầm sẵn Vine Lash. */
function withVineLash(rows: readonly string[] = FLAT, extra: Partial<WorldSetup> = {}) {
  const world = makeWorld(rows, { ownedWeapons: [VINE_LASH], ...extra });
  world.step(input({ swapNext: true }));
  expect(world.loadout.current.name).toBe(VINE_LASH);
  return world;
}

describe('QB-02: bất tử của lướt không tránh gai, hố', () => {
  const SPIKES = ['#..............#', '#..............#', '#..P....^^^....#', '################'];
  const dash = config.player.dash;

  it('QB-02: lướt vào gai vẫn mất máu và về chỗ an toàn (dù đang trong khung bất tử của lướt)', () => {
    const world = makeWorld(SPIKES);
    const pl = world.player;
    const max = pl.hp;
    // Đứng sát mép gai (cột 8), lướt sang phải.
    pl.respawn(8 * t - pl.box.w / 2 - 1, 3 * t);
    world.step(IDLE_INPUT);
    const evs = runUntil(
      world,
      (i) => input({ moveX: 1, dashPressed: i === 0 }),
      (e) => e.spikeHit,
    );
    // Chạm gai trong khung bất tử của lướt.
    expect((evs.length - 1) * DT).toBeLessThan(dash.iFrameSec);
    expect(evs.at(-1)!.playerHurt).toBe(true);
    expect(evs.at(-1)!.hurtBy).toBe('spike');
    expect(pl.hp).toBe(max - Math.round(mech.spikes.damage * normal.damageTaken));
    expect(pl.box.x + pl.box.w).toBeLessThanOrEqual(8 * t + 1e-6);
  });

  it('QB-02: đang lướt thì đòn kẻ địch không trúng nhưng gai vẫn trúng (PlayerPhysics)', () => {
    const world = makeWorld(FLAT);
    const pl = world.player;
    world.step(input({ dashPressed: true }));
    expect(pl.dashing).toBe(true);
    expect(pl.invulnerable).toBe(true);
    expect(pl.applyHit(10, pl.centerX + 5)).toBe(false);
    const hp = pl.hp;
    expect(pl.hitHazard(mech.spikes.damage, pl.centerX, pl.bottom)).toBe(true);
    expect(pl.hp).toBe(hp - mech.spikes.damage);
  });

  it('QB-02: rơi khỏi đáy hố trong lúc lướt (đang bất tử) vẫn mất máu hố', () => {
    // Lướt trên không cần kỹ năng P1; bật thẳng trong dữ liệu để đặt Kai đang lướt dưới đáy hố.
    const player = { ...config.player, abilities: { ...config.player.abilities, airDash: true } };
    const world = makeWorld(['#..........#', '#..........#', '#.P........#', '####...#####'], {
      player,
    });
    const pl = world.player;
    const max = pl.hp;
    pl.respawn(5.5 * t, world.map.heightPx + pl.box.h + 1);
    const ev = world.step(input({ dashPressed: true }));
    expect(pl.dashing).toBe(true);
    expect(pl.invulnerable).toBe(true);
    expect(ev.fellInPit).toBe(true);
    expect(pl.hp).toBe(max - Math.round(mech.pit.damage * normal.damageTaken));
  });
});

describe('QB-11, QB-12, QB-13: vũ khí boss và năng lượng', () => {
  const { energyMax } = config.weapons;
  const vine = config.weapons.bossWeapons.find((w) => w.name === VINE_LASH)!;
  const cost = vine.energyCost!;
  const chargeSteps = Math.ceil(config.weapons.arcCannon.charge.timeSec / DT) + 2;
  const chargedShots = (world: StageWorld) =>
    world.pool.all.filter((p) => p.alive && (p.kind === 'charged' || p.kind === 'mid')).length;

  it('QB-11: giữ rồi thả nút nạp khi cầm vũ khí boss: không bắn gì, không tốn năng lượng', () => {
    const world = withVineLash();
    expect(world.step(press).fired).toBe('sweep');
    const energy = world.loadout.current.energy;
    for (let i = 0; i < chargeSteps; i += 1) world.step(input({ shootHeld: true }));
    const ev = world.step(input({ shootReleased: true }));
    expect(ev.fired).toBeUndefined();
    expect(chargedShots(world)).toBe(0);
    expect(world.loadout.current.energy).toBe(energy);
  });

  it('QB-11: nạp đầy Arc Cannon, đổi sang vũ khí boss rồi thả: không bắn đạn nạp', () => {
    const world = makeWorld(FLAT, { ownedWeapons: [VINE_LASH] });
    expect(world.loadout.current.name).toBe(ARC_CANNON);
    world.step(press);
    for (let i = 0; i < chargeSteps; i += 1) world.step(input({ shootHeld: true }));
    expect(world.loadout.chargeLevel).toBe(2);
    world.step(input({ shootHeld: true, swapNext: true }));
    expect(world.loadout.current.name).toBe(VINE_LASH);
    const ev = world.step(input({ shootReleased: true }));
    expect(ev.fired).toBeUndefined();
    expect(chargedShots(world)).toBe(0);
  });

  it('QB-12: hết năng lượng: không bắn, phát emptyWeapon, không tự đổi vũ khí', () => {
    const world = withVineLash();
    // Bắn mỗi 0,5 s (hơn hồi chiêu, kém thời gian chờ tự hồi năng lượng) tới khi hết.
    const every = Math.round(0.5 / DT);
    const behavior = vine.behavior;
    if (behavior?.type !== 'sweep') throw new Error('Vine Lash cần hành vi sweep');
    expect(every * DT).toBeGreaterThan(behavior.cooldownSec);
    expect(every * DT).toBeLessThan(config.weapons.energyRegen.afterNoFireSec);
    const evs = runUntil(world, tapEvery(every), (e) => e.emptyWeapon);
    expect(evs.filter((e) => e.fired === 'sweep')).toHaveLength(Math.floor(energyMax / cost));
    const last = evs.at(-1)!;
    expect(last.fired).toBeUndefined();
    expect(last.swapped).toBe(false);
    expect(world.loadout.current.name).toBe(VINE_LASH);
    // Bấm tiếp vẫn chỉ báo hết, vẫn cầm vũ khí boss.
    for (let i = 0; i < 3; i += 1) {
      for (let k = 0; k < every - 1; k += 1) world.step(IDLE_INPUT);
      const ev = world.step(press);
      expect(ev.emptyWeapon).toBe(true);
      expect(ev.fired).toBeUndefined();
      expect(world.loadout.current.name).toBe(VINE_LASH);
    }
  });

  const CP = [
    '#....................#',
    '#....................#',
    '#.P.....C............#',
    '######################',
  ];

  it('QB-13: vào màn thì vũ khí boss đầy năng lượng', () => {
    const world = makeWorld(FLAT, { ownedWeapons: [VINE_LASH] });
    for (const slot of world.loadout.slots) expect(slot.energy, slot.name).toBe(energyMax);
  });

  it('QB-13: chết thì nạp đầy; qua checkpoint không nạp lại', () => {
    const world = withVineLash(CP);
    expect(world.step(press).fired).toBe('sweep');
    const slot = world.loadout.current;
    expect(slot.energy).toBe(energyMax - cost);
    // Đi tới checkpoint trước khi năng lượng tự hồi.
    const evs = runUntil(world, input({ moveX: 1 }), (e) => e.checkpoint !== undefined);
    expect(evs.length * DT).toBeLessThan(config.weapons.energyRegen.afterNoFireSec);
    expect(slot.energy).toBe(energyMax - cost);
    dieAndRespawn(world);
    for (const s of world.loadout.slots) expect(s.energy, s.name).toBe(energyMax);
  });
});

describe('QB-22: Spike Guard chỉ miễn ô gai', () => {
  it('QB-22: có Spike Guard đứng trên gai không sao, nhưng đạn Tháp Gai vẫn trúng', () => {
    const rows = [
      '#................#',
      '#................#',
      '#..P^^^.......F..#',
      '##################',
    ];
    const world = makeWorld(layoutFromRows(rows, t, markers), { spikeGuard: true });
    const pl = world.player;
    pl.respawn(5.5 * t, 3 * t);
    expect(world.map.overlapsHazard(pl.box)).toBe(true);
    let hurt: WorldEvents | undefined;
    for (let i = 0; i < 60 * 10 && !hurt; i += 1) {
      const ev = world.step(IDLE_INPUT);
      expect(ev.spikeHit).toBe(false);
      if (ev.playerHurt) hurt = ev;
    }
    expect(hurt?.hurtBy).toBe('enemy:thap_gai');
    expect(pl.hp).toBeLessThan(pl.maxHp);
  });

  it('QB-22: có Spike Guard vẫn trúng Gai Quạt của Thorna', () => {
    const world = thornaWorld({ spikeGuard: true });
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    expect(world.phase).toBe('boss');
    const evs = runUntil(
      world,
      () => {
        world.player.hp = world.player.maxHp;
        return IDLE_INPUT;
      },
      (e) => e.hurtBy === 'boss:enemyShot',
      60 * 60,
    );
    expect(evs.at(-1)!.playerHurt).toBe(true);
  });
});

describe('QB-24: mini-boss đã hạ không dựng lại trong lượt', () => {
  function golemWorld() {
    return makeWorld(layoutFromRows(GOLEM_ROOM_ROWS, t, GOLEM_ROOM.enemyMarkers));
  }
  /** Đi vào phòng tới khi cửa khóa. */
  function enterRoom(world: StageWorld): void {
    let locked = false;
    for (let i = 0; i < 60 * 12 && !locked; i += 1)
      locked = world.step(input({ moveX: 1 })).roomLocked;
    expect(locked).toBe(true);
  }

  it('QB-24: hạ Golem, phòng mở; Kai chết rồi hồi sinh: Golem vẫn hạ, phòng vẫn mở, không thưởng lại', () => {
    const world = golemWorld();
    enterRoom(world);
    const golem = world.enemies[0]!;
    golem.hp = 0.5;
    world.player.respawn(golem.centerX - 5 * t, golem.box.y + golem.box.h);
    let cleared = false;
    for (let i = 0; i < 60 * 5 && !cleared; i += 1) {
      world.player.hp = world.player.maxHp;
      cleared = world.step(tapEvery(8)(i)).roomCleared;
    }
    expect(cleared).toBe(true);
    const exp = world.exp;
    dieAndRespawn(world);
    expect(golem.alive).toBe(false);
    expect(world.rooms[0]!.state).toBe('cleared');
    for (let i = 0; i < 120; i += 1) world.step(IDLE_INPUT);
    expect(golem.alive).toBe(false);
    expect(world.exp).toBe(exp);
  });

  it('QB-24: chết khi phòng còn khóa (chưa hạ Golem): cửa mở, Golem dựng lại đầy máu', () => {
    const world = golemWorld();
    enterRoom(world);
    const golem = world.enemies[0]!;
    golem.hp = golem.maxHp / 2;
    dieAndRespawn(world);
    expect(world.rooms[0]!.state).toBe('open');
    expect(golem.alive).toBe(true);
    expect(golem.hp).toBe(golem.maxHp);
  });
});

describe('QB-33: Kai chết trong lúc đếm giờ trước màn Kết quả', () => {
  it('QB-33: không mất trận thắng: thưởng, vũ khí, bản lưu giữ nguyên; boss không tính thắng lại', async () => {
    const world = thornaWorld();
    const manager = await SaveManager.open(new MemorySaveStore());
    const saver = new StageSave(manager, 'thorna', 'thorna');
    const step = (inp: WorldInput): WorldEvents => {
      const ev = world.step(inp);
      saver.step(ev, world, DT);
      return ev;
    };
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    step(IDLE_INPUT);
    world.boss!.hp = 0.5;
    let won = false;
    for (let i = 0; i < 60 * 10 && !won; i += 1) {
      world.player.hp = world.player.maxHp;
      const on = i % 8 === 0;
      won = step(
        input({ shootPressed: on, shootHeld: on, shootReleased: i % 8 === 1 }),
      ).bossDefeated;
    }
    expect(won).toBe(true);
    const exp = world.exp;
    const coreBits = world.coreBits;
    expect(exp).toBeGreaterThan(0);
    // Kai chết trong lúc đếm (ui.result.delaySec), rồi hồi sinh.
    world.player.applyHit(9999, world.player.centerX + 5);
    const after: WorldEvents[] = [];
    for (let i = 0; i < Math.round(config.ui.result.delaySec / DT) + 60; i += 1)
      after.push(step(IDLE_INPUT));
    expect(after.some((e) => e.playerDied)).toBe(true);
    expect(after.some((e) => e.respawned)).toBe(true);
    expect(after.some((e) => e.bossDefeated)).toBe(false);
    expect([world.exp, world.coreBits]).toEqual([exp, coreBits]);
    expect(world.loadout.has(VINE_LASH)).toBe(true);
    expect(manager.data.progress.bossesDefeated).toContain('thorna');
    expect(manager.data.character.weapons).toContain(VINE_LASH);
    expect(manager.data.character.exp).toBe(exp);
  });
});

describe('QB-41: qua checkpoint', () => {
  const CP = [
    '#....................#',
    '#....................#',
    '#.P.....C............#',
    '######################',
  ];

  it('QB-41: không hồi máu, không nạp năng lượng; đặt lại đếm chết cho gợi ý', () => {
    const world = makeWorld(CP, { ownedWeapons: [VINE_LASH] });
    dieAndRespawn(world);
    expect(world.deathStreak).toBe(1);
    world.step(input({ swapNext: true }));
    expect(world.step(press).fired).toBe('sweep');
    const slot = world.loadout.current;
    const energy = slot.energy;
    expect(energy).toBeLessThan(config.weapons.energyMax);
    const hp = world.player.maxHp - Math.round(mech.spikes.damage * normal.damageTaken);
    world.player.hp = hp;
    const evs = runUntil(world, input({ moveX: 1 }), (e) => e.checkpoint !== undefined);
    expect(evs.length * DT).toBeLessThan(config.weapons.energyRegen.afterNoFireSec);
    expect(evs.at(-1)!.healed).toBe(0);
    expect(world.player.hp).toBe(hp);
    expect(slot.energy).toBe(energy);
    expect(world.deathStreak).toBe(0);
  });
});

describe('QB-61: EXP và đồng bộ cấp', () => {
  const ROWS = ['#............#', '#............#', '#.P.......U..#', '##############'];
  const turret = config.enemies.enemies[markers.U!.enemy]!;

  it('QB-61: EXP nhận không đổi theo cấp hiệu dụng (đồng bộ xuống hay cấp thật)', () => {
    const stage1 = config.stages.stages[0]!;
    const range = parseLevelRange(stage1.recommendedLevel);
    const sync = config.stages.levelSync;
    const realLevel = range[1] + sync.aboveMax + 3;
    const synced = syncLevel(realLevel, range, sync);
    expect(synced).toBeLessThan(realLevel);
    const expOf = (level: number): number => {
      const world = makeWorld(layoutFromRows(ROWS, t, markers), { level });
      runUntil(
        world,
        (i) => {
          world.player.hp = world.player.maxHp;
          return tapEvery(8)(i);
        },
        (e) => e.enemyKilled,
        60 * 20,
      );
      return world.exp;
    };
    const expected = scaleReward(turret.exp, normal.rewardMul);
    expect([expOf(1), expOf(synced), expOf(realLevel)]).toEqual([expected, expected, expected]);
    // Cấp thật cộng đủ EXP của lượt, không theo cấp hiệu dụng.
    const lv = config.player.level;
    const saved = 5000;
    const tracker = new LevelTracker(lv, saved);
    tracker.update(expected);
    expect(tracker.info).toEqual(levelForExp(saved + expected, lv));
  });
});

describe('QB-121: camera khóa trong phòng khóa, đấu trường', () => {
  it('QB-121: phòng khóa đóng cửa thì khung camera là phòng (gồm cột cửa); mở thì cả bản đồ', () => {
    const ROOM = [
      '##########################',
      '#......#........#........#',
      '#......L........L........#',
      '#.P....L......U.L........#',
      '##########################',
    ];
    const world = makeWorld(layoutFromRows(ROOM, t, markers));
    const full = { x: 0, y: 0, w: world.map.widthPx, h: world.map.heightPx };
    expect(cameraLockFor(world, t)).toEqual({ key: undefined, bounds: full });
    runUntil(world, input({ moveX: 1 }), (e) => e.roomLocked);
    expect(cameraLockFor(world, t)).toEqual({
      key: 'room0',
      bounds: { x: 7 * t, y: 0, w: 10 * t, h: world.map.heightPx },
    });
    world.enemies[0]!.hp = 0;
    expect(world.step(IDLE_INPUT).roomCleared).toBe(true);
    expect(cameraLockFor(world, t)).toEqual({ key: undefined, bounds: full });
  });

  it('QB-121: trong phòng boss khung camera là đấu trường (từ cột cửa), thắng rồi thì mở', () => {
    const world = thornaWorld();
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    expect(world.phase).toBe('boss');
    const gate = world.gateCol!;
    const lock = cameraLockFor(world, t);
    expect(lock.key).toBe('boss');
    expect(lock.bounds).toEqual({
      x: gate * t,
      y: 0,
      w: (world.map.cols - gate) * t,
      h: world.map.heightPx,
    });
    world.phase = 'won';
    expect(cameraLockFor(world, t).key).toBeUndefined();
  });
});

describe('QB-132: nhãn tab Xưởng chưa mở', () => {
  it('QB-132: tab khóa ghi điều kiện mở theo lời người chơi, không ghi mã mốc nội bộ', () => {
    const locked = WORKSHOP_TABS.filter((tab) => tab.lockedHint !== undefined);
    expect(locked.length).toBeGreaterThan(0);
    for (const tab of locked) {
      const hint = tab.lockedHint!;
      expect(hint, tab.id).toMatch(/^(khi|mở sau) /);
      // Không có mã nội bộ: id gạch dưới, mã Story/Epic/module/luật.
      expect(hint, tab.id).not.toMatch(/_|\b(EP|ST|QB|ADR)-\d|\bM\d+\b/);
      expect(workshopTabLabel(tab)).toBe(`${tab.name} · ${hint}`);
    }
    expect(WORKSHOP_TABS.find((tab) => tab.id === 'module')?.lockedHint).toMatch(
      /khi nhận module đầu tiên$/,
    );
  });
});
