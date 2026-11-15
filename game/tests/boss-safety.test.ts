/**
 * Boss an toàn (EP-15 ST-15-14): chống khóa choáng (QB-14), kẹp pha khi một đòn vượt hai ngưỡng
 * (QB-31). Số lấy từ dữ liệu (`bosses.json → rules`, `weapons.json`).
 */
import { describe, expect, it } from 'vitest';
import { parseBosses } from '@/core/boss-config';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { Boss } from '@/logic/boss/boss';
import { enemyProjectile } from '@/logic/boss/enemy-projectile';
import { outgoingDamage } from '@/logic/combat/damage';
import { ProjectilePool } from '@/logic/combat/projectiles';
import { createRng } from '@/logic/rng';
import { TileMap } from '@/logic/tilemap';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { StageWorld } from '@/logic/world/stage-world';
import { THORNA_ROOM_ROWS } from '@/stages/thorna-room';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const config = parseGameConfig(loadData());
const thorna = config.bosses.thorna!;
const rules = thorna.rules;
const ember = config.weapons.bossWeapons.find((w) => w.name === thorna.weakness)!;
const ARENA_COLS = 24;
const ARENA = TileMap.fromRows(
  [...Array.from({ length: 11 }, () => `#${'.'.repeat(ARENA_COLS)}#`), '#'.repeat(ARENA_COLS + 2)],
  t,
);
const FLOOR = 11 * t;
const PLAYER = { playerX: 6 * t, playerY: FLOOR - 12 };

function makeBoss(data = thorna): { boss: Boss; pool: ProjectilePool } {
  const boss = new Boss(data, ARENA, 20 * t, FLOOR, { first: 1, last: ARENA_COLS }, createRng(3));
  boss.activate();
  return { boss, pool: new ProjectilePool() };
}

const weakHit = (amount = 0.01) => ({ amount, weak: true, stunSec: ember.weakStunSec });
const plainHit = (amount: number) => ({ amount, weak: false, stunSec: 0 });

describe('QB-14: chống khóa choáng', () => {
  it('QB-14: dữ liệu chung có hồi choáng 1,5 s, dài hơn choáng 0,5 s của vũ khí khắc chế', () => {
    expect(rules.weakStunCooldownSec).toBe(1.5);
    expect(ember.weakStunSec).toBe(0.5);
    // Bản Thử thách dùng cùng luật.
    expect(config.bossesChallenge.thorna?.rules).toEqual(rules);
  });

  it('QB-14: bắn điểm yếu mỗi 0,3 s trong 6 s: boss có khoảng không choáng ≥ 1,5 s và vẫn ra đòn', () => {
    const { boss, pool } = makeBoss();
    const every = Math.round(0.3 / DT);
    let stunnedSteps = 0;
    let freeRun = 0;
    let longestFree = 0;
    let attacks = 0;
    let hpLost = 0;
    for (let i = 0; i < 6 / DT; i += 1) {
      if (i % every === 0) {
        const before = boss.hp;
        expect(boss.takeHit(weakHit())).toBe(true);
        hpLost += before - boss.hp;
      }
      const ev = boss.step(PLAYER, pool, DT);
      pool.update(DT, ARENA);
      if (ev.attackStarted) attacks += 1;
      if (boss.stunned) {
        stunnedSteps += 1;
        freeRun = 0;
      } else longestFree = Math.max(longestFree, (freeRun += 1));
    }
    // Mỗi phát vẫn trừ đủ máu (sát thương không đổi theo choáng).
    expect(hpLost).toBeCloseTo(0.01 * Math.ceil(6 / DT / every), 6);
    expect(longestFree * DT).toBeGreaterThanOrEqual(rules.weakStunCooldownSec - DT);
    // Chu kỳ choáng 0,5 s + hồi 1,5 s: choáng chiếm khoảng 1/4 thời gian, không phải gần hết.
    expect(stunnedSteps * DT).toBeLessThan(6 * 0.4);
    expect(attacks).toBeGreaterThan(0);
  });

  it('QB-14: trúng điểm yếu trong lúc choáng không làm mới choáng; hết choáng thì hồi 1,5 s', () => {
    const { boss, pool } = makeBoss();
    boss.takeHit(weakHit());
    let steps = 0;
    while (boss.stunned) {
      if (steps === Math.round(0.4 / DT)) boss.takeHit(weakHit());
      boss.step(PLAYER, pool, DT);
      steps += 1;
    }
    // Không làm mới: hết sau khoảng weakStunSec (một bước sai số số thực), không phải 0,4 + 0,5 s.
    expect(steps * DT).toBeGreaterThanOrEqual(ember.weakStunSec - 1e-9);
    expect(steps * DT).toBeLessThanOrEqual(ember.weakStunSec + DT + 1e-9);
    expect(boss.stunCooldownSec).toBe(rules.weakStunCooldownSec);
    // Trong hồi choáng: trúng điểm yếu vẫn trừ máu nhưng không choáng.
    const hp = boss.hp;
    boss.takeHit(weakHit());
    expect(boss.hp).toBeLessThan(hp);
    expect(boss.stunned).toBe(false);
    for (let i = 0; i < rules.weakStunCooldownSec / DT + 1; i += 1) boss.step(PLAYER, pool, DT);
    expect(boss.stunCooldownSec).toBe(0);
    boss.takeHit(weakHit());
    expect(boss.stunned).toBe(true);
  });

  it('QB-14: sát thương điểm yếu vẫn ×damageVsWeak', () => {
    const out = outgoingDamage({
      base: 1,
      kindMul: 1,
      attackMul: 1,
      weapon: ember.name,
      targetWeakness: thorna.weakness,
      weakMul: ember.damageVsWeak,
      weakStunSec: ember.weakStunSec,
    });
    expect(out).toEqual({ amount: ember.damageVsWeak, weak: true, stunSec: ember.weakStunSec });
  });

  it('QB-14: choáng không xóa hạt Hoa Nở đã thả', () => {
    const { boss, pool } = makeBoss();
    boss.hp = thorna.hp * 0.2;
    for (let i = 0; i < 60 * 60; i += 1) {
      const ev = boss.step(PLAYER, pool, DT);
      if (ev.attackStarted === 'bloom') break;
    }
    while (boss.state === 'telegraph') boss.step(PLAYER, pool, DT);
    const seeds = pool.count('enemy', ['seed']);
    expect(seeds).toBeGreaterThan(0);
    boss.takeHit(weakHit());
    boss.step(PLAYER, pool, DT);
    expect(pool.count('enemy', ['seed'])).toBe(seeds);
  });
});

describe('QB-31: một đòn vượt hai ngưỡng pha', () => {
  const pct = (boss: Boss) => Math.round(boss.hpPct * 1000) / 1000;
  const first = thorna.phases[0]!.untilHpPct;
  const second = thorna.phases[1]!.untilHpPct;

  it('QB-31: từ pha đầu xuống 20%: kẹp ở ngưỡng đầu, sang pha 2 một lần, bất tử phaseShiftSec', () => {
    const { boss, pool } = makeBoss();
    boss.step(PLAYER, pool, DT);
    expect(boss.takeHit(plainHit(thorna.hp * 0.8))).toBe(true);
    expect(pct(boss)).toBe(first);
    expect(boss.shifting).toBe(true);
    expect(boss.takeShotClear()).toBe(true);
    expect(boss.takeShotClear()).toBe(false);
    let changes = 0;
    let steps = 0;
    while (boss.shifting) {
      expect(boss.takeHit(weakHit(5))).toBe(false);
      const ev = boss.step(PLAYER, pool, DT);
      if (ev.phaseChanged) changes += 1;
      expect(ev.attackStarted).toBeUndefined();
      steps += 1;
    }
    expect(changes).toBe(1);
    expect(boss.phase).toBe(1);
    expect(steps * DT).toBeCloseTo(rules.phaseShiftSec, 5);
    expect(pct(boss)).toBe(first);
    expect(boss.stunned).toBe(false);
    expect(boss.takeHit(plainHit(1))).toBe(true);
    expect(boss.hp).toBeCloseTo((thorna.hp * first) / 100 - 1, 6);
  });

  it('QB-31: vượt đúng một ngưỡng thì như cũ (không kẹp, không bất tử)', () => {
    const { boss, pool } = makeBoss();
    boss.step(PLAYER, pool, DT);
    boss.takeHit(plainHit(thorna.hp * 0.5));
    expect(pct(boss)).toBe(50);
    expect(boss.shifting).toBe(false);
    expect(boss.takeShotClear()).toBe(false);
    expect(boss.step(PLAYER, pool, DT).phaseChanged).toBe(true);
    expect(boss.phase).toBe(1);
  });

  it('QB-31: đòn chí mạng từ pha đầu không giết boss mà kẹp ở ngưỡng đầu; ở pha áp chót thì chết', () => {
    const a = makeBoss();
    a.boss.step(PLAYER, a.pool, DT);
    a.boss.takeHit(plainHit(thorna.hp * 10));
    expect(pct(a.boss)).toBe(first);
    expect(a.boss.settleDefeat()).toBe(false);
    const b = makeBoss();
    b.boss.hp = (thorna.hp * (second + 5)) / 100;
    b.boss.step(PLAYER, b.pool, DT);
    expect(b.boss.phase).toBe(1);
    b.boss.takeHit(plainHit(thorna.hp));
    expect(b.boss.shifting).toBe(false);
    expect(b.boss.settleDefeat()).toBe(true);
  });

  it('QB-31: hai đòn cùng bước, đòn đầu đã qua một ngưỡng: đòn sau không đẩy qua ngưỡng thứ hai', () => {
    const { boss, pool } = makeBoss();
    boss.step(PLAYER, pool, DT);
    boss.takeHit(plainHit(thorna.hp * 0.45));
    expect(pct(boss)).toBe(55);
    // Chưa bước nên boss vẫn ở pha đầu: đòn này kẹp, không hồi máu lên ngưỡng.
    boss.takeHit(plainHit(thorna.hp * 0.4));
    expect(pct(boss)).toBe(55);
    expect(boss.shifting).toBe(true);
  });

  it('QB-31: trong StageWorld: đạn boss bị xóa, đạn kẻ địch thường còn; đạn Kai trúng boss bị chặn', () => {
    const world = new StageWorld({
      rows: THORNA_ROOM_ROWS,
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: thorna,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      seed: 7,
      mechanics: config.stages.mechanics,
    });
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    const boss = world.boss!;
    expect(world.phase).toBe('boss');
    world.step(IDLE_INPUT);
    // Đặt sẵn một viên đạn boss và một viên của kẻ địch thường ở góc trên, xa Kai.
    const far = { x: 2 * t, y: t };
    world.pool.spawn(enemyProjectile(t, 'enemyShot', far.x, far.y, { w: 4, h: 4 }, 0, 0, 5));
    world.pool.spawn({
      ...enemyProjectile(t, 'enemyShot', far.x + t, far.y, { w: 4, h: 4 }, 0, 0, 5),
      source: 'enemy:thap_gai',
    });
    boss.takeHit(plainHit(thorna.hp * 0.8));
    world.step(IDLE_INPUT);
    const enemyShots = world.pool.all.filter((p) => p.owner === 'enemy');
    expect(enemyShots.map((p) => p.source)).toEqual(['enemy:thap_gai']);
    // Đạn Kai bay vào boss lúc bất tử: mất, báo chặn, máu không đổi.
    const hp = boss.hp;
    world.pool.spawn({
      owner: 'player',
      kind: 'shot',
      x: boss.box.x + 2,
      y: boss.box.y + 2,
      w: 4,
      h: 4,
      vx: 0,
      vy: 0,
      damage: 1,
      kindMul: 1,
      weapon: 'Arc Cannon',
      pierceLeft: 0,
      breaksShield: false,
      maxDistance: 100,
      ttl: 1,
      attached: false,
    });
    const ev = world.step(IDLE_INPUT);
    expect(boss.shifting).toBe(true);
    expect(ev.blocked).toBe(true);
    expect(boss.hp).toBe(hp);
  });
});

describe('bosses.json → rules', () => {
  it('kiểm dữ liệu', () => {
    const raw = loadData().bosses as Record<string, Record<string, unknown>>;
    const bad = (patch: Record<string, unknown>) => ({ ...raw, rules: { ...raw.rules, ...patch } });
    expect(() => parseBosses(bad({ weakStunCooldownSec: -1 }))).toThrow(/weakStunCooldownSec/);
    expect(() => parseBosses(bad({ phaseShiftSec: 3 }))).toThrow(/phaseShiftSec: tối đa 2/);
    expect(() => parseBosses({ ...raw, rules: undefined })).toThrow(/bosses.rules/);
    expect(Object.keys(parseBosses(raw))).not.toContain('rules');
  });
});
