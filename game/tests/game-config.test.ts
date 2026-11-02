import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkDesignInvariants,
  ConfigError,
  parseGameConfig,
  parseLevelRange,
  parsePlayer,
} from '@/core/game-config';

/** Đọc thẳng 03-Data (nguồn thật) để test bắt được dữ liệu lệch nhau. */
const DATA_DIR = resolve(__dirname, '../../03-Data');

function loadData(): Record<string, unknown> {
  const files: Record<string, unknown> = {};
  for (const name of readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'))) {
    files[name.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8'));
  }
  return files;
}

describe('dữ liệu 03-Data', () => {
  it('đủ file bắt buộc và qua mọi kiểm tra', () => {
    const config = parseGameConfig(loadData());
    expect(config.stages.stages).toHaveLength(8);
    expect(config.difficulties.map((d) => d.id)).toEqual(['story', 'normal', 'challenge']);
  });

  it('vòng khắc chế khớp thứ tự màn (GDD mục 7)', () => {
    const config = parseGameConfig(loadData());
    const stages = config.stages.stages;
    for (let i = 0; i < stages.length; i += 1) {
      const current = stages[i]!;
      const next = stages[(i + 1) % stages.length]!;
      expect(next.bossWeakness).toBe(current.weaponGranted);
    }
  });

  it('chỉ số người chơi khớp GDD mục 5.1', () => {
    const { player } = parseGameConfig(loadData());
    expect(player.jump.coyoteSec).toBe(0.1);
    expect(player.jump.bufferSec).toBe(0.12);
    expect(player.inPlaceRevivePerStage.max).toBe(1);
  });
});

describe('phát hiện dữ liệu sai', () => {
  it('báo thiếu file bắt buộc', () => {
    const files = loadData();
    delete files.weapons;
    expect(() => parseGameConfig(files)).toThrow(/Thiếu file dữ liệu: weapons/);
  });

  it('báo trường sai kiểu kèm đường dẫn', () => {
    const files = loadData();
    const player = structuredClone(files.player) as { jump: { coyoteSec: unknown } };
    player.jump.coyoteSec = 'nhanh';
    expect(() => parsePlayer(player)).toThrow(new ConfigError('player.jump.coyoteSec: cần một số'));
  });

  it('báo vòng khắc chế bị phá', () => {
    const config = parseGameConfig(loadData());
    const broken = structuredClone(config);
    broken.stages.stages[2]!.bossWeakness = 'Vine Lash';
    expect(checkDesignInvariants(broken).join('\n')).toMatch(/vòng khắc chế/);
  });

  it('báo hệ số thưởng economy lệch difficulties', () => {
    const files = loadData();
    const economy = structuredClone(files.economy) as {
      difficultyRewardMul: Record<string, number>;
    };
    economy.difficultyRewardMul.nightmare = 2;
    files.economy = economy;
    expect(() => parseGameConfig(files)).toThrow(/nightmare: độ khó không tồn tại/);
  });

  it('phân tích khoảng cấp khuyến nghị', () => {
    expect(parseLevelRange('4-7')).toEqual([4, 7]);
    expect(() => parseLevelRange('7-4')).toThrow(ConfigError);
    expect(() => parseLevelRange('cao')).toThrow(ConfigError);
  });
});
