import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { bossFor, parseGameConfig } from '@/core/game-config';
import { ARC_CANNON } from '@/logic/combat/loadout';
import { computeBuild, type BuildStats } from '@/logic/rpg/build';
import { characterProgress } from '@/logic/rpg/progression';
import { MemorySaveStore, SaveManager } from '@/logic/save/save-manager';
import { StageSave } from '@/logic/save/stage-save';
import { anchoredBeamRoute } from '@/logic/world/anchored-beam-route';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;
const T = TILE_SIZE;
const FLOOR = 11 * T;

function enter(world: StageWorld): void {
  world.player.respawn((world.arena!.first + 3) * T, FLOOR);
  expect(world.step(IDLE_INPUT).gateClosed).toBe(true);
}

function makeWorld(difficultyId = 'normal', level = 1, build?: BuildStats) {
  const difficulty = config.difficulties.find((d) => d.id === difficultyId)!;
  const world = new StageWorld({
    layout: buildStageLayout(STAGE_DEFS.lumen, T),
    tileSize: T,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: bossFor(config, 'lumen', difficulty.newAttackPatterns)!,
    difficulty,
    mechanics: config.stages.mechanics,
    seed: 42,
    level,
    ...(build ? { build } : {}),
  });
  enter(world);
  return world;
}

function advance(world: StageWorld, predicate: () => boolean, seconds = 16): number {
  for (let i = 0; i * DT < seconds; i += 1) {
    if (predicate()) return i;
    world.step(IDLE_INPUT);
  }
  throw new Error('Lumen chưa tới trạng thái cần kiểm: ' + world.boss?.attack);
}

describe('ST-15-10 · phòng thử Lumen', () => {
  it('có 24 cột, 12 hàng, hai bục và bốn gương; không lưu hay ghi thử G1', () => {
    const world = makeWorld();
    expect(world.arena!.last - world.arena!.first + 1).toBe(24);
    expect(world.map.rows).toBe(12);
    expect(world.optics?.mirrors).toHaveLength(4);
    expect(STAGE_DEFS.lumen.practiceOnly).toBe(true);
    expect(STAGE_DEFS.lumen.playtest).toBe(false);
    expect(STAGE_DEFS.gray.boss ?? 'gray').toBe('gray');
    expect(world.boss?.hp).toBe(280);
    expect(makeWorld('challenge').boss?.hp).toBe(350);
  });

  it('dịch chuyển sau đòn, báo vị trí trong 0,3 giây; chết thì dựng lại ở neo giữa', () => {
    const world = makeWorld();
    const boss = world.boss!;
    const old = { ...boss.anchors!.current };
    advance(world, () => boss.anchors!.warning !== undefined);
    const dest = { ...boss.anchors!.warning! };
    expect(dest.progress).toBe(0);
    expect(boss.centerX).toBe(old.x);
    const steps = advance(world, () => !boss.anchors!.warning);
    expect(steps * DT).toBeCloseTo(0.3, 6);
    expect(boss.centerX).toBe(dest.x);
    expect(boss.box.y + boss.box.h / 2).toBe(dest.y);
    // Xóa bất tử sau một lượt ngắn nếu viên đạn vừa va vào Kai.
    world.player.respawn(world.player.centerX, FLOOR);
    expect(world.player.applyHit(world.player.maxHp, boss.centerX)).toBe(true);
    world.step(IDLE_INPUT);
    advance(world, () => world.boss !== boss, 3);
    expect(world.boss?.anchors?.current).toEqual(old);
    expect(world.boss?.hp).toBe(280);
    expect(world.player.hp).toBe(world.player.maxHp);
  });

  it('mọi neo có đường tia dội; pha cuối có nhánh hai lần dội theo đích', () => {
    const world = makeWorld();
    const points = world.layout.anchoredArena!.anchors.map(({ col, row }) => ({
      x: (col + 0.5) * T,
      y: (row + 0.5) * T,
    }));
    for (const origin of points) {
      const path = anchoredBeamRoute(world.optics!, origin, { x: 30 * T, y: 9.5 * T }).trace(
        false,
        1,
      );
      expect(path).toHaveLength(2);
      expect(path[0]!.from).toEqual(origin);
    }
    const twice = anchoredBeamRoute(world.optics!, points[0]!, { x: 30 * T, y: 9.5 * T }).trace(
      false,
      2,
    );
    expect(twice.length).toBe(3);
    expect(twice[2]!.from.y).toBe(9.5 * T);
  });

  it('tia thực giữ nguyên vạch đã báo khi Kai đổi chỗ và gương xoay', () => {
    const world = makeWorld();
    const boss = world.boss!;
    world.player.absorbHit(30);
    advance(world, () => boss.beam.warnings.length > 0);
    const announced = structuredClone(boss.beam.warnings[0]!.path);
    expect(announced).toHaveLength(2);
    const toggled = world.optics!.mirrors.map((mirror) => mirror.toggle(2));
    expect(toggled.every(Boolean)).toBe(true);
    world.player.box.x = boss.centerX - 4 * T;
    advance(world, () => boss.beam.pulses.length > 0);
    expect(boss.beam.pulses[0]!.path).toEqual(announced);
    expect(boss.beam.pulses[0]!.damage).toBe(18);
    expect(boss.hp).toBe(280);
  });

  it('Thử thách thêm Tiêu Điểm; Quang Phổ chừa ba khe và có cửa sổ choáng', () => {
    const hard = makeWorld('challenge');
    hard.player.absorbHit(30);
    hard.boss!.hp *= 0.5;
    advance(hard, () => hard.boss!.focus.marks.length > 0);
    expect(hard.boss!.attack).toBe('focus');
    expect(config.bosses.lumen!.phases.every((p) => !p.attacks.includes('focus'))).toBe(true);
    const world = makeWorld();
    const boss = world.boss!;
    world.player.absorbHit(30);
    boss.hp *= 0.25;
    advance(world, () => boss.attack === 'rain' && boss.state === 'telegraph', 30);
    const gaps: number[] = [];
    let size = 0;
    for (let x = world.arena!.first; x <= world.arena!.last + 1; x += 1) {
      if (x <= world.arena!.last && !boss.rainCols.includes(x)) size += 1;
      else if (size > 0) {
        gaps.push(size);
        size = 0;
      }
    }
    expect(gaps).toEqual([2, 2, 2]);
    advance(world, () => world.pool.all.some((p) => p.alive && p.kind === 'spectrum'));
    expect(config.skills.rules.shieldPierceKinds.has('spectrum')).toBe(true);
    advance(world, () => boss.state === 'stunned');
    expect(boss.exposed).toBe(true);
    const steps = advance(world, () => boss.state !== 'stunned');
    expect(steps * DT).toBeGreaterThanOrEqual(2 - DT);
  });

  it('đòn kết liễu Arc Cannon cấp Prism Beam, EXP và Core Bit đúng một lần', async () => {
    const world = makeWorld();
    // Phòng thử không có saver. Nối bộ nhớ giả ở đây để kiểm hợp đồng chiến dịch, không ghi thiết bị.
    const save = await SaveManager.open(new MemorySaveStore());
    const saver = new StageSave(save, 'prism_institute', 'lumen', {
      clearsCampaign: 'prism_institute',
    });
    const fight = () => {
      const boss = world.boss!;
      boss.hp = 0.5; // Bỏ qua phần cân bằng trận; bước kết liễu vẫn đi qua đạn và va chạm thật.
      world.player.respawn(boss.centerX - 3 * T, FLOOR);
      world.step(IDLE_INPUT);
      expect(world.loadout.current.name).toBe(ARC_CANNON);
      world.step({ ...IDLE_INPUT, shootPressed: true, shootHeld: true });
      world.step({ ...IDLE_INPUT, shootReleased: true });
      let reward: string | undefined;
      for (let i = 0; i < 75 && world.phase !== 'won'; i += 1) {
        const ev = world.step(IDLE_INPUT);
        reward ??= ev.weaponGranted;
        saver.step(ev, world, DT);
      }
      expect(world.phase).toBe('won');
      return reward;
    };
    expect(fight()).toBe('Prism Beam');
    expect(world.exp).toBe(241);
    expect(world.coreBits).toBe(110);
    world.player.respawn((world.gateCol! - 2) * T, FLOOR);
    world.step(IDLE_INPUT);
    expect(world.phase).toBe('explore');
    enter(world);
    expect(fight()).toBeUndefined();
    expect(world.exp).toBe(241);
    expect(world.coreBits).toBe(110);
    expect(save.data.character.weapons.filter((name) => name === 'Prism Beam')).toHaveLength(1);
    expect(save.data.progress.bossesDefeated).toEqual(['lumen']);
    expect(save.data.character.exp).toBe(241);
    expect(save.data.inventory.coreBits).toBe(110);
    const wardens = new Set(config.stages.stages.map((st) => st.boss));
    const sp = (defeated: readonly string[]) =>
      characterProgress(save.data.character.exp, defeated, wardens, config.player.level)
        .skillPoints;
    expect(sp(save.data.progress.bossesDefeated) - sp([])).toBe(1);
  });
});

describe('ST-15-10 · đo đỡ đòn trong phòng thử', () => {
  it('bot cấp 7 chỉ bám ngang và bắn Arc Cannon không thay được né, kể cả build Core', () => {
    const core = computeBuild(config.skills, { C1: 1, C2: 2, C3: 3 });
    for (const keep of [3, 8]) {
      const world = makeWorld('normal', 7, core);
      let result: 'died' | 'won' | 'limit' = 'limit';
      let count = 0;
      for (let i = 0; i * DT <= 120; i += 1) {
        const gap = world.boss!.centerX - world.player.centerX;
        const press = i % 8 === 0;
        const ev = world.step({
          ...IDLE_INPUT,
          moveX: Math.abs(gap) > keep * T ? Math.sign(gap) : 0,
          shootPressed: press,
          shootHeld: press,
          shootReleased: i % 8 === 1,
        });
        if (ev.playerHurt) count += 1;
        if (ev.playerDied || ev.bossDefeated) {
          result = ev.playerDied ? 'died' : 'won';
          break;
        }
      }
      expect({ keep, result, count }).toMatchObject({ keep, result: 'died' });
      expect(count).toBeGreaterThan(0);
    }
  });
});
