import { describe, expect, it } from 'vitest';
import { parseGameConfig } from '@/core/game-config';
import { buildNormalizer, normalizeBuild, validRanks } from '@/logic/rpg/normalize-build';
import {
  branchSpent,
  learn,
  nodeState,
  resetBranch,
  type SkillRanks,
  spentPoints,
} from '@/logic/rpg/skill-tree';
import { buildWorkshop } from '@/logic/rpg/workshop-model';
import { defaultSave, parseSave, SAVE_VERSION, setSkills } from '@/logic/save/save-data';
import { MemorySaveStore, SaveManager } from '@/logic/save/save-manager';
import { encodeSaveCode } from '@/logic/save/save-code';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const tree = config.skills;
const node = (id: string) => tree.nodes[id]!;

/** Học lần lượt các nút với số SP có cho trước; báo lỗi nếu bị từ chối. */
function learnAll(ids: string[], total: number, start: SkillRanks = {}): SkillRanks {
  return ids.reduce((acc, id) => {
    const next = learn(tree, acc, id, total - spentPoints(acc));
    if (!next) throw new Error(`không học được ${id}`);
    return next;
  }, start);
}

describe('cây kỹ năng (GDD 10 mục 2.1, 2.4)', () => {
  it('học từng bậc tốn 1 SP; tầng sau khóa tới khi tầng trước đủ bậc', () => {
    expect(nodeState(tree, {}, node('V2'), 4)).toBe('locked');
    const s = learnAll(['V1'], 4);
    expect(s).toEqual({ V1: 1 });
    expect(nodeState(tree, s, node('V1'), 3)).toBe('maxed');
    expect(nodeState(tree, s, node('V2'), 3)).toBe('learnable');
    expect(learn(tree, s, 'V3', 3)).toBeUndefined();
    const s2 = learnAll(['V2', 'V2'], 4, s);
    expect(s2).toEqual({ V1: 1, V2: 2 });
    expect(nodeState(tree, s2, node('V3'), 1)).toBe('learnable');
    expect(nodeState(tree, s2, node('V3'), 0)).toBe('noSp');
  });

  it('hết SP, nút lạ hoặc đủ bậc thì không học được', () => {
    expect(learn(tree, {}, 'V1', 0)).toBeUndefined();
    expect(learn(tree, {}, 'X9', 5)).toBeUndefined();
    expect(learn(tree, { V1: 1 }, 'V1', 5)).toBeUndefined();
  });

  it('đặt lại nhánh chỉ bỏ nhánh đó; SP của nhánh tính đúng', () => {
    const s = learnAll(['V1', 'V2', 'P1', 'C1'], 13);
    expect(branchSpent(tree, s, 'vanguard')).toBe(2);
    expect(resetBranch(tree, s, 'vanguard')).toEqual({ P1: 1, C1: 1 });
    expect(resetBranch(tree, { P1: 1 }, 'vanguard')).toEqual({ P1: 1 });
  });

  it('mô hình Xưởng: SP còn lại, trạng thái nút, mô tả bậc kế, khóa khi chỉ đọc', () => {
    const m = buildWorkshop(tree, { V1: 1, V2: 1 }, 4);
    expect([m.available, m.spent, m.total]).toEqual([2, 2, 4]);
    const v = m.branches[0]!.nodes;
    expect(v.map((n) => `${n.id}:${n.rank}/${n.maxRank}:${n.state}`)).toEqual([
      'V1:1/1:maxed',
      'V2:1/2:learnable',
      'V3:0/3:locked',
    ]);
    expect(v[1]!.nextText).toBe(node('V2').ranks[1]!.text);
    expect(v[2]!.requires).toBe('Đạn Nạp Nổ Lan đủ 2 bậc');
    const ro = buildWorkshop(tree, {}, 4, true);
    expect(ro.branches[0]!.nodes[0]!.state).toBe('noSp');
  });
});

describe('bản lưu 2 và chuẩn hóa build', () => {
  it('bản lưu 1 đọc lên thành bản hiện tại với kỹ năng, module, loadout trống', () => {
    const s = parseSave({ version: 1, character: { exp: 40, weapons: ['Vine Lash'] } });
    expect(SAVE_VERSION).toBe(4);
    expect(s.version).toBe(4);
    expect(s.character).toEqual({
      exp: 40,
      weapons: ['Vine Lash'],
      skills: {},
      modules: { owned: [] },
      loadouts: [{ modules: [], armorOff: [] }],
      activeLoadout: 0,
    });
  });

  it('bậc sai kiểu bị bỏ; loadout trống thành một bộ mặc định; chỉ số loadout bị kẹp', () => {
    const s = parseSave({
      version: 2,
      character: { skills: { V1: 1, V2: -2, P1: 'x', '': 3 }, loadouts: [], activeLoadout: 5 },
    });
    expect(s.character.skills).toEqual({ V1: 1 });
    expect(s.character.loadouts).toHaveLength(1);
    expect(s.character.activeLoadout).toBe(0);
  });

  it('chuẩn hóa: nút lạ, bậc vượt tối đa, mất điều kiện tầng trước', () => {
    expect(validRanks(tree, { V1: 3, X9: 1, P2: 1, C1: 1, C2: 2, C3: 1 })).toEqual({
      V1: 1,
      C1: 1,
      C2: 2,
      C3: 1,
    });
    const save = setSkills(defaultSave(), { V1: 1, X9: 1 });
    const r = normalizeBuild(save, tree, 5);
    expect(r.save.character.skills).toEqual({ V1: 1 });
    expect(r.notice).toMatch(/không còn hợp lệ/);
    const same = normalizeBuild(r.save, tree, 5);
    expect(same.save).toBe(r.save);
    expect(same.notice).toBeUndefined();
  });

  it('tổng bậc vượt SP có được thì đặt lại cả cây và báo số SP hoàn', () => {
    const save = setSkills(defaultSave(), { V1: 1, V2: 2, P1: 1 });
    const r = normalizeBuild(save, tree, 2);
    expect(r.save.character.skills).toEqual({});
    expect(r.notice).toBe('Kỹ năng đã được đặt lại do thay đổi dữ liệu (hoàn 4 SP).');
  });

  it('SaveManager chuẩn hóa khi mở và khi nhập mã sao lưu, ghi lại một lần', async () => {
    const normalize = buildNormalizer(config);
    // 0 EXP, chưa hạ boss: 0 SP, nhưng bản lưu ghi đã học V1.
    const bad = { ...setSkills(defaultSave(), { V1: 1 }), revision: 3 };
    const store = new MemorySaveStore(JSON.stringify(bad));
    const m = await SaveManager.open(store, () => 1, normalize);
    expect(m.data.character.skills).toEqual({});
    expect(m.notice).toMatch(/hoàn 1 SP/);
    await m.flush();
    expect(JSON.parse((await store.read())!).character.skills).toEqual({});
    m.notice = undefined;
    m.importCode(encodeSaveCode(bad));
    expect(m.data.character.skills).toEqual({});
    expect(m.notice).toMatch(/đặt lại/);
  });
});
