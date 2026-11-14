import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { deepMerge } from '@/core/deep-merge';
import { parseDifficulties, parseGameConfig } from '@/core/game-config';
import {
  checkpointActive,
  defaultDifficulty,
  type DifficultyRule,
  difficultyUnlocked,
  NO_DIFFICULTY_PROGRESS,
  scaleReward,
  startCheckpointFor,
} from '@/logic/difficulty/difficulty';
import { normalizeDifficulty } from '@/logic/difficulty/normalize-difficulty';
import { buildPrep, difficultyStats, type PrepDifficulty } from '@/logic/difficulty/prep-model';
import { buildStageResult } from '@/logic/result/stage-result';
import { decodeSaveCode, encodeSaveCode } from '@/logic/save/save-code';
import {
  defaultSave,
  parseSave,
  recordBossDefeated,
  recordDifficultyChosen,
  recordDifficultyCleared,
  stageDifficulty,
} from '@/logic/save/save-data';
import { MemorySaveStore, SaveManager } from '@/logic/save/save-manager';
import { StageSave } from '@/logic/save/stage-save';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, noWorldEvents, type WorldEvents } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { THORNA_ROOM_ROWS } from '@/stages/thorna-room';
import { loadData } from './helpers';

const RULES: DifficultyRule[] = [
  { id: 'story', unlockClearedOn: null },
  { id: 'normal', unlockClearedOn: null },
  { id: 'challenge', unlockClearedOn: ['normal', 'challenge'] },
];

describe('quy tắc độ khó (GDD 11 mục 2–3)', () => {
  it('Thử thách mở khi đã hạ boss màn đó ở Thường hoặc Thử thách; Cốt truyện không mở', () => {
    const challenge = RULES[2]!;
    expect(difficultyUnlocked(challenge, NO_DIFFICULTY_PROGRESS)).toBe(false);
    expect(difficultyUnlocked(challenge, { last: 'story', cleared: ['story'] })).toBe(false);
    expect(difficultyUnlocked(challenge, { last: 'normal', cleared: ['normal'] })).toBe(true);
    expect(difficultyUnlocked(RULES[0]!, NO_DIFFICULTY_PROGRESS)).toBe(true);
  });

  it('mặc định: lần trước nếu còn mở; chưa chọn hoặc lần trước bị khóa thì Thường', () => {
    expect(defaultDifficulty(RULES, NO_DIFFICULTY_PROGRESS)).toBe('normal');
    expect(defaultDifficulty(RULES, { last: 'story', cleared: [] })).toBe('story');
    expect(defaultDifficulty(RULES, { last: 'challenge', cleared: [] })).toBe('normal');
    expect(defaultDifficulty(RULES, { last: 'challenge', cleared: ['normal'] })).toBe('challenge');
    expect(defaultDifficulty(RULES, { last: 'laser', cleared: [] })).toBe('normal');
  });

  it('thưởng nhân hệ số, làm tròn; gốc > 0 thì ít nhất 1', () => {
    // Drone Lính: 2 Core Bit, 6 EXP.
    expect([0.5, 1, 1.5].map((m) => scaleReward(2, m))).toEqual([1, 2, 3]);
    expect([0.5, 1, 1.5].map((m) => scaleReward(6, m))).toEqual([3, 6, 9]);
    expect(scaleReward(1, 0.5)).toBe(1);
    expect(scaleReward(0, 1.5)).toBe(0);
    expect(scaleReward(80, 0.5)).toBe(40);
    expect(scaleReward(120, 1.5)).toBe(180);
  });

  it('checkpoint lọc theo độ khó; vào lại chọn checkpoint gần nhất phía trước', () => {
    const cps = [{}, { difficulties: ['story'] }, { difficulties: ['story', 'normal'] }, {}];
    expect(cps.map((c) => checkpointActive(c, 'challenge'))).toEqual([true, false, false, true]);
    expect(startCheckpointFor(cps, 'challenge', 3)).toBe(1);
    expect(startCheckpointFor(cps, 'normal', 3)).toBe(3);
    expect(startCheckpointFor(cps, 'normal', 2)).toBe(1);
    expect(startCheckpointFor(cps, 'story', 2)).toBe(2);
    expect(startCheckpointFor(cps, 'challenge', 4)).toBe(4);
    expect(startCheckpointFor(cps, 'challenge', 0)).toBe(0);
    expect(startCheckpointFor([{ difficulties: ['story'] }], 'normal', 1)).toBe(0);
    // Chỉ số lưu vượt số checkpoint (bản đồ đổi) thì kẹp.
    expect(startCheckpointFor(cps, 'normal', 9)).toBe(4);
  });

  it('ghép sâu bản Thử thách: đối tượng ghép từng khóa, mảng thay cả, không sửa đầu vào', () => {
    const base = { hp: 3, attack: { cooldownSec: 1.5, projectile: { damage: 8 } }, tags: [1, 2] };
    const merged = deepMerge(base, { attack: { burst: { count: 2 } }, tags: [9] });
    expect(merged).toEqual({
      hp: 3,
      attack: { cooldownSec: 1.5, projectile: { damage: 8 }, burst: { count: 2 } },
      tags: [9],
    });
    expect(base.attack).toEqual({ cooldownSec: 1.5, projectile: { damage: 8 } });
  });
});

describe('mô hình màn Chuẩn bị (GDD 11 mục 2.1)', () => {
  const DIFFS: PrepDifficulty[] = [
    { ...RULES[0]!, name: 'Cốt truyện', desc: 'a', damageTaken: 0.5, enemyHp: 0.8, rewardMul: 0.5 },
    { ...RULES[1]!, name: 'Thường', desc: 'b', damageTaken: 1, enemyHp: 1, rewardMul: 1 },
    { ...RULES[2]!, name: 'Thử thách', desc: 'c', damageTaken: 1.5, enemyHp: 1.25, rewardMul: 1.5 },
  ];
  const prep = (level: number, cleared: string[] = [], recommended: [number, number] = [2, 4]) =>
    buildPrep({
      stageName: 'Stage 1',
      recommended,
      level,
      effectiveLevel: Math.max(level, 2),
      hintBelow: 2,
      difficulties: DIFFS,
      progress: { last: undefined, cleared },
    });

  it('Thử thách khóa kèm điều kiện bằng tên độ khó; mặc định Thường', () => {
    const m = prep(2);
    expect(m.selected).toBe('normal');
    expect(m.options.map((o) => o.locked)).toEqual([false, false, true]);
    expect(m.options[2]!.lockText).toBe('Mở khi xong màn này ở Thường hoặc Thử thách');
    expect(prep(2, ['normal']).options[2]!.locked).toBe(false);
  });

  it('hệ số hiện kiểu số Việt Nam', () => {
    expect(difficultyStats(DIFFS[2]!)).toBe(
      'Sát thương nhận ×1,5 · Máu kẻ địch ×1,25 · Thưởng ×1,5',
    );
  });

  it('gợi ý mềm khi cấp thật thấp hơn khuyến nghị quá 2 cấp (Stage 3 khuyến nghị 6–8)', () => {
    expect(prep(1).levelHint).toBeUndefined();
    expect(prep(4, [], [6, 8]).levelHint).toBeUndefined();
    expect(prep(3, [], [6, 8]).levelHint).toMatch(/Cốt truyện/);
  });
});

describe('áp độ khó vào trận và bản lưu 4 (ST-10-01)', () => {
  const config = parseGameConfig(loadData());
  const t = TILE_SIZE;
  const DT = FIXED_STEP_MS / 1000;
  const diff = (id: string) => config.difficulties.find((d) => d.id === id)!;

  function thornaWorld(id: string): StageWorld {
    return new StageWorld({
      rows: THORNA_ROOM_ROWS,
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.thorna!,
      difficulty: diff(id),
      mechanics: config.stages.mechanics,
      seed: 7,
    });
  }

  /** Đưa Kai vào đấu trường, để boss còn 1 máu rồi bắn tới khi hạ. */
  function winBoss(world: StageWorld): WorldEvents | undefined {
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    world.boss!.hp = 1;
    let out: WorldEvents | undefined;
    for (let i = 0; i < 600 && !out?.bossDefeated; i += 1) {
      world.player.hp = world.player.maxHp;
      const dir = world.boss!.centerX > world.player.centerX ? 1 : -1;
      out = world.step({
        ...IDLE_INPUT,
        moveX: i % 30 === 0 ? dir : 0,
        shootPressed: i % 8 === 0,
        shootHeld: i % 8 === 0,
        shootReleased: i % 8 === 1,
      });
    }
    return out;
  }

  it('dữ liệu: tên, mô tả, luật mở; Thường có sẵn', () => {
    expect(config.difficulties.map((d) => [d.id, d.name, d.unlockClearedOn])).toEqual([
      ['story', 'Cốt truyện', null],
      ['normal', 'Thường', null],
      ['challenge', 'Thử thách', ['normal', 'challenge']],
    ]);
    expect(config.difficulties.map((d) => d.newAttackPatterns)).toEqual([false, false, true]);
    const raw = structuredClone(loadData().difficulties) as Record<string, unknown>[];
    raw[2]!.unlock = { clearedOn: ['hard'] };
    expect(() => parseDifficulties(raw)).toThrow('unlock.clearedOn lạ "hard"');
    raw[2]!.unlock = { clearedOn: [] };
    expect(() => parseDifficulties(raw)).toThrow('ít nhất một');
    expect(() => parseDifficulties(raw.slice(0, 1))).toThrow('"normal"');
  });

  it('máu boss nhân enemyHp: Thorna 200 / 250 / 312,5', () => {
    expect(['story', 'normal', 'challenge'].map((id) => thornaWorld(id).boss!.data.hp)).toEqual([
      200, 250, 312.5,
    ]);
    expect(thornaWorld('story').boss!.hp).toBe(200);
  });

  it('thưởng lần đầu hạ boss nhân rewardMul: Cốt truyện 60 EXP, 40 Core Bit; Thử thách 180, 120', () => {
    const story = thornaWorld('story');
    expect(winBoss(story)?.bossDefeated).toBe(true);
    expect([story.exp, story.coreBits]).toEqual([60, 40]);
    const challenge = thornaWorld('challenge');
    expect(winBoss(challenge)?.bossDefeated).toBe(true);
    expect([challenge.exp, challenge.coreBits]).toEqual([180, 120]);
  });

  it('bản lưu 4: đọc bản 3, ghi độ khó chọn và đã hạ; id rỗng hoặc sai kiểu bị bỏ', () => {
    const old = parseSave({ version: 3, progress: { bossesDefeated: ['thorna'] } });
    expect(old.version).toBe(4);
    expect(old.progress.difficulty).toEqual({});
    let s = recordDifficultyChosen(defaultSave(), 'verdant_gardens', 'story');
    s = recordDifficultyCleared(s, 'verdant_gardens', 'story');
    s = recordDifficultyCleared(s, 'verdant_gardens', 'story');
    expect(stageDifficulty(s, 'verdant_gardens')).toEqual({ last: 'story', cleared: ['story'] });
    expect(recordDifficultyChosen(s, 'verdant_gardens', 'story')).toBe(s);
    expect(stageDifficulty(s, 'prism_institute')).toEqual({ last: null, cleared: [] });
    const parsed = parseSave({
      version: 4,
      progress: { difficulty: { a: { last: 3, cleared: ['normal', 1] }, '': {}, b: 'x' } },
    });
    expect(parsed.progress.difficulty).toEqual({ a: { last: null, cleared: ['normal'] } });
    expect(decodeSaveCode(encodeSaveCode(s)).progress.difficulty).toEqual(s.progress.difficulty);
  });

  it('StageSave: hạ boss ghi độ khó vào cleared của màn chiến dịch; màn thử thì không', async () => {
    const m = await SaveManager.open(new MemorySaveStore());
    const run = { exp: 0, coreBits: 0 };
    const ev = { ...noWorldEvents(), bossDefeated: true };
    new StageSave(m, 'thorna', 'thorna', { campaign: 'verdant_gardens', id: 'normal' }).step(
      ev,
      run,
      0.016,
    );
    expect(stageDifficulty(m.data, 'verdant_gardens').cleared).toEqual(['normal']);
    new StageSave(m, 'golem', 'gray').step(ev, run, 0.016);
    expect(Object.keys(m.data.progress.difficulty)).toEqual(['verdant_gardens']);
  });
});

describe('ST-10-02: thưởng boss theo độ khó, nâng bản lưu, mini-boss, màn Kết quả', () => {
  const config = parseGameConfig(loadData());
  const t = TILE_SIZE;
  const DT = FIXED_STEP_MS / 1000;
  const diff = (id: string) => config.difficulties.find((d) => d.id === id)!;

  it('mini-boss Golem nhân enemyHp: 48 / 60 / 75 (hồi quy)', () => {
    const hp = ['story', 'normal', 'challenge'].map((id) => {
      const w = new StageWorld({
        layout: buildStageLayout(STAGE_DEFS.golem, t),
        tileSize: t,
        stepSec: DT,
        player: config.player,
        weapons: config.weapons,
        boss: config.bosses.gray!,
        difficulty: diff(id),
        seed: 1,
        enemies: config.enemies,
        mechanics: config.stages.mechanics,
      });
      return w.enemies.find((e) => e.data.id === 'bramble_golem')!.maxHp;
    });
    expect(hp).toEqual([48, 60, 75]);
  });

  it('boss đã hạ (vũ khí đã có) nhưng chưa nhận thưởng ở độ khó này: nhận EXP, Core Bit, không nhận lại vũ khí', () => {
    const world = new StageWorld({
      rows: THORNA_ROOM_ROWS,
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.thorna!,
      difficulty: diff('normal'),
      mechanics: config.stages.mechanics,
      seed: 7,
      ownedWeapons: ['Vine Lash'],
      bossDefeated: true,
      bossRewardClaimed: false,
    });
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    world.boss!.hp = 1;
    let out: WorldEvents | undefined;
    for (let i = 0; i < 600 && !out?.bossDefeated; i += 1) {
      world.player.hp = world.player.maxHp;
      const dir = world.boss!.centerX > world.player.centerX ? 1 : -1;
      out = world.step({
        ...IDLE_INPUT,
        moveX: i % 30 === 0 ? dir : 0,
        shootPressed: i % 8 === 0,
        shootHeld: i % 8 === 0,
        shootReleased: i % 8 === 1,
      });
    }
    expect(out?.bossDefeated).toBe(true);
    expect(out?.weaponGranted).toBeUndefined();
    expect([world.exp, world.coreBits]).toEqual([120, 80]);
  });

  it('nâng bản lưu 3: boss chiến dịch đã hạ thì cleared ["normal"]; id lạ bị bỏ; chạy lại không đổi', () => {
    const v3 = parseSave({ version: 3, progress: { bossesDefeated: ['thorna', 'gray'] } });
    const r = normalizeDifficulty(v3, config);
    expect(r.save.progress.difficulty).toEqual({
      verdant_gardens: { last: null, cleared: ['normal'] },
    });
    expect(normalizeDifficulty(r.save, config).save).toBe(r.save);
    const odd = parseSave({
      version: 4,
      progress: {
        bossesDefeated: [],
        difficulty: { verdant_gardens: { last: 'hard', cleared: ['story', 'hard'] } },
      },
    });
    expect(normalizeDifficulty(odd, config).save.progress.difficulty).toEqual({
      verdant_gardens: { last: null, cleared: ['story'] },
    });
    // Đã hạ ở Cốt truyện thì không ghi thêm Thường.
    const story = recordDifficultyCleared(
      recordBossDefeated(defaultSave(), 'thorna'),
      'verdant_gardens',
      'story',
    );
    expect(normalizeDifficulty(story, config).save).toBe(story);
  });

  it('màn Kết quả: dòng độ khó và độ khó vừa mở', () => {
    const view = buildStageResult(
      { elapsedSec: 61, deaths: 0, exp: 120, coreBits: 80, secrets: [] },
      {
        stageName: 'Phòng boss Thorna',
        savedCoreBits: 0,
        newWeapon: undefined,
        reminders: [],
        difficulty: { name: 'Thường', unlocked: ['Thử thách'] },
      },
    );
    expect(view.stats[0]).toEqual({ label: 'Độ khó', value: 'Thường' });
    expect(view.rewards).toContain('Đã mở Thử thách cho màn này');
  });
});
