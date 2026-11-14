import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { decodeSaveCode, encodeSaveCode } from '@/logic/save/save-code';
import {
  addRewards,
  completeStage,
  defaultSave,
  grantWeapon,
  parseSave,
  recordBossDefeated,
  recordCheckpoint,
  recordSecret,
  SAVE_VERSION,
  SaveError,
  stageProgress,
} from '@/logic/save/save-data';
import { MemorySaveStore, SaveManager, type SaveStore } from '@/logic/save/save-manager';
import { StageSave, stageSaveSetup } from '@/logic/save/stage-save';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, noWorldEvents, type WorldEvents } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { THORNA_ROOM_ROWS } from '@/stages/thorna-room';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const config = parseGameConfig(loadData());
const ev = (patch: Partial<WorldEvents>): WorldEvents => ({ ...noWorldEvents(), ...patch });

describe('dữ liệu lưu', () => {
  it('bản mới rỗng; đọc lại đúng bản đã ghi', () => {
    let s = defaultSave();
    s = recordCheckpoint(s, 'stage1', 2);
    s = recordSecret(s, 'stage1', 'nano_cell');
    s = grantWeapon(s, 'Vine Lash');
    s = recordBossDefeated(s, 'thorna');
    s = addRewards(s, { exp: 120, coreBits: 80, playTimeSec: 12.5 });
    expect(parseSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it('checkpoint chỉ tiến; bí mật, vũ khí, boss không ghi trùng; không đổi thì trả lại đúng bản cũ', () => {
    const s = recordCheckpoint(defaultSave(), 'a', 2);
    expect(recordCheckpoint(s, 'a', 1)).toBe(s);
    expect(recordCheckpoint(s, 'a', 2)).toBe(s);
    const s2 = recordSecret(s, 'a', 'x');
    expect(recordSecret(s2, 'a', 'x')).toBe(s2);
    const s3 = grantWeapon(s2, 'Vine Lash');
    expect(grantWeapon(s3, 'Vine Lash')).toBe(s3);
    const s4 = recordBossDefeated(s3, 'thorna');
    expect(recordBossDefeated(s4, 'thorna')).toBe(s4);
    expect(addRewards(s4, { exp: -5, coreBits: 0 })).toBe(s4);
    // Hàm thuần: bản gốc không bị sửa.
    expect(stageProgress(defaultSave(), 'a')).toEqual({ checkpoint: 0, secrets: [] });
  });

  it('hoàn thành màn: về đầu màn, giữ bí mật', () => {
    const s = recordSecret(recordCheckpoint(defaultSave(), 'a', 2), 'a', 'x');
    expect(stageProgress(completeStage(s, 'a'), 'a')).toEqual({ checkpoint: 0, secrets: ['x'] });
  });

  it('hỏng từng phần thì phần đó về mặc định', () => {
    const s = parseSave({
      version: 1,
      revision: 'abc',
      progress: { bossesDefeated: ['thorna', 3, 'thorna'], stages: { a: { checkpoint: -1 } } },
      character: { exp: 50, weapons: 'Vine Lash' },
      inventory: null,
    });
    expect(s.revision).toBe(0);
    expect(s.progress.bossesDefeated).toEqual(['thorna']);
    expect(s.progress.stages.a).toEqual({ checkpoint: 0, secrets: [] });
    expect(s.character).toEqual({ ...defaultSave().character, exp: 50, weapons: [] });
    expect(s.inventory.coreBits).toBe(0);
    expect(parseSave('rác')).toEqual(defaultSave());
  });

  it('bản lưu của phiên bản mới hơn thì báo lỗi', () => {
    expect(() => parseSave({ version: SAVE_VERSION + 1 })).toThrow(SaveError);
  });
});

describe('mã sao lưu', () => {
  const s = addRewards(
    grantWeapon(recordSecret(defaultSave(), 'tầng 1', 'Két giáp'), 'Vine Lash'),
    {
      coreBits: 80,
    },
  );

  it('xuất rồi nhập lại ra đúng bản lưu (cả chữ có dấu)', () => {
    const code = encodeSaveCode(s);
    expect(code).toMatch(/^CV1\.[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    expect(decodeSaveCode(code)).toEqual(s);
    // Chép kèm khoảng trắng, xuống dòng vẫn đọc được.
    expect(decodeSaveCode(` ${code.slice(0, 20)}\n${code.slice(20)} `)).toEqual(s);
  });

  it('sai một ký tự, thiếu đoạn hoặc sai định dạng thì báo lỗi', () => {
    const code = encodeSaveCode(s);
    const i = 10;
    const typo = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1);
    expect(() => decodeSaveCode(typo)).toThrow(/checksum/);
    expect(() => decodeSaveCode(code.slice(0, -12) + code.slice(-9))).toThrow(SaveError);
    expect(() => decodeSaveCode('xin chào')).toThrow(/định dạng/);
    expect(() => decodeSaveCode('')).toThrow(SaveError);
  });
});

describe('SaveManager', () => {
  it('mỗi thay đổi ghi một lần, revision tăng, có thời điểm lưu; không đổi thì không ghi', async () => {
    const store = new MemorySaveStore();
    const m = await SaveManager.open(store, () => 1000);
    expect(m.data).toEqual(defaultSave());
    expect(m.update((s) => grantWeapon(s, 'Vine Lash'))).toBe(true);
    expect(m.update((s) => grantWeapon(s, 'Vine Lash'))).toBe(false);
    await m.flush();
    expect(store.writes).toBe(1);
    expect(m.data.revision).toBe(1);
    expect(m.data.savedAt).toBe(1000);
    const again = await SaveManager.open(store);
    expect(again.data).toEqual(m.data);
  });

  it('JSON hỏng thì bắt đầu bản mới và báo lỗi', async () => {
    const m = await SaveManager.open(new MemorySaveStore('{hỏng'));
    expect(m.data).toEqual(defaultSave());
    expect(m.lastError).toBeDefined();
  });

  it('bản lưu phiên bản mới hơn: không ghi đè', async () => {
    const text = JSON.stringify({ version: SAVE_VERSION + 1, revision: 9 });
    const store = new MemorySaveStore(text);
    const m = await SaveManager.open(store);
    expect(m.readOnly).toBe(true);
    m.update((s) => grantWeapon(s, 'Vine Lash'));
    await m.flush();
    expect(store.text).toBe(text);
  });

  it('ghi lỗi thì giữ bản trong bộ nhớ và báo lỗi', async () => {
    const store: SaveStore = {
      read: () => Promise.resolve(null),
      write: () => Promise.reject(new Error('đầy')),
    };
    const m = await SaveManager.open(store);
    m.update((s) => grantWeapon(s, 'Vine Lash'));
    await m.flush();
    expect(m.data.character.weapons).toEqual(['Vine Lash']);
    expect(m.lastError).toMatch(/đầy/);
  });

  it('nhập mã: thay bản hiện tại, revision lớn hơn cả hai; mã sai thì giữ nguyên', async () => {
    const m = await SaveManager.open(new MemorySaveStore());
    m.update((s) => addRewards(s, { coreBits: 5 }));
    const other = { ...addRewards(defaultSave(), { coreBits: 300 }), revision: 7 };
    m.importCode(encodeSaveCode(other));
    expect(m.data.inventory.coreBits).toBe(300);
    expect(m.data.revision).toBe(8);
    expect(() => m.importCode('CV1.abc.00000000')).toThrow(SaveError);
    expect(m.data.inventory.coreBits).toBe(300);
    m.reset();
    expect(m.data.inventory.coreBits).toBe(0);
    expect(m.data.revision).toBe(9);
    expect(decodeSaveCode(m.exportCode())).toEqual(m.data);
  });
});

describe('lưu tiến trình trong màn', () => {
  it('ghi checkpoint, bí mật, vũ khí, boss; EXP/Core Bit cộng phần chênh lệch, không trùng', async () => {
    const m = await SaveManager.open(new MemorySaveStore());
    const saver = new StageSave(m, 'thorna', 'thorna');
    const run = { exp: 0, coreBits: 0 };
    expect(saver.step(ev({}), run, DT)).toBe(false);
    run.coreBits = 3;
    run.exp = 10;
    expect(saver.step(ev({ checkpoint: 1 }), run, DT)).toBe(true);
    expect(m.data.inventory.coreBits).toBe(3);
    run.coreBits = 5;
    saver.step(ev({ secretFound: 'nano_cell' }), run, DT);
    expect(m.data.inventory.coreBits).toBe(5);
    expect(m.data.character.exp).toBe(10);
    // Chết rồi hồi sinh không mất Core Bit; nhặt thêm rồi thoát màn thì cộng phần còn lại.
    run.coreBits = 9;
    saver.exit(run);
    expect(m.data.inventory.coreBits).toBe(9);
    expect(m.data.playTimeSec).toBeCloseTo(3 * DT);
    expect(stageProgress(m.data, 'thorna')).toEqual({ checkpoint: 1, secrets: ['nano_cell'] });
    saver.step(ev({ bossDefeated: true, weaponGranted: 'Vine Lash' }), run, DT);
    expect(m.data.progress.bossesDefeated).toEqual(['thorna']);
    expect(m.data.character.weapons).toEqual(['Vine Lash']);
    expect(stageProgress(m.data, 'thorna').checkpoint).toBe(0);
  });

  it('vào lại màn: đúng checkpoint, có vũ khí đã nhận, bí mật đã nhặt không hiện lại', () => {
    let s = recordCheckpoint(defaultSave(), 'mechanics', 1);
    s = recordSecret(s, 'mechanics', 'nano_cell');
    s = grantWeapon(s, 'Vine Lash');
    const world = new StageWorld({
      layout: buildStageLayout(STAGE_DEFS.mechanics, t),
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.gray!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      seed: 1,
      enemies: config.enemies,
      mechanics: config.stages.mechanics,
      ...stageSaveSetup(s, 'mechanics', 'gray'),
    });
    expect(world.checkpointIndex).toBe(1);
    const cp = world.layout.checkpoints[0]!;
    expect(Math.floor(world.player.centerX / t)).toBe(cp.col);
    expect(world.loadout.has('Vine Lash')).toBe(true);
    expect(world.secrets.find((x) => x.spawn.item === 'nano_cell')!.taken).toBe(true);
    expect(world.secrets.find((x) => x.spawn.item !== 'nano_cell')!.taken).toBe(false);
  });

  it('boss đã hạ trong bản lưu: thắng lại không nhận thưởng lần đầu', () => {
    const world = new StageWorld({
      rows: THORNA_ROOM_ROWS,
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.thorna!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      mechanics: config.stages.mechanics,
      seed: 7,
      ...stageSaveSetup(recordBossDefeated(defaultSave(), 'thorna'), 'thorna', 'thorna'),
    });
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    expect(world.phase).toBe('boss');
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
    expect(world.exp).toBe(0);
    expect(world.coreBits).toBe(0);
  });
});
