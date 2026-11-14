import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseGameConfig } from '@/core/game-config';
import { MenuNavigator } from '@/logic/hud/menu-cursor';
import { buildStageResult, formatDuration } from '@/logic/result/stage-result';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const config = parseGameConfig(loadData());
const DT = FIXED_STEP_MS / 1000;

describe('màn Kết quả', () => {
  it('định dạng thời gian mm:ss, quá 1 giờ thì h:mm:ss, làm tròn xuống theo giây', () => {
    expect([0, 59.99, 582, 600.5, 3725].map(formatDuration)).toEqual([
      '00:00',
      '00:59',
      '09:42',
      '10:00',
      '1:02:05',
    ]);
  });

  it('dựng các dòng theo wireframe Result.html: thời gian, chết, EXP, Core Bit, vũ khí, bí mật', () => {
    const view = buildStageResult(
      {
        elapsedSec: 582,
        deaths: 4,
        exp: 350,
        coreBits: 225,
        secrets: [{ taken: true }, { taken: false }, { taken: true }],
      },
      { stageName: 'Stage 1', savedCoreBits: 80, newWeapon: 'Vine Lash', reminders: ['Thử roi.'] },
    );
    expect(view.title).toBe('HOÀN THÀNH: Stage 1');
    expect(view.coreBitsTotal).toBe(305);
    expect(view.stats).toEqual([
      { label: 'Thời gian', value: '09:42' },
      { label: 'Số lần chết', value: '4' },
      { label: 'EXP', value: '+350' },
      { label: 'Core Bit', value: '+225' },
    ]);
    expect(view.rewards).toEqual(['Vũ khí mới: Vine Lash', 'Bí mật 2/3']);
    expect(view.reminders).toEqual(['Thử roi.']);
  });

  it('đấu lại (không có vũ khí mới, màn không có bí mật): báo không có phần thưởng mới', () => {
    const view = buildStageResult(
      { elapsedSec: 30, deaths: 0, exp: 0, coreBits: 0, secrets: [] },
      { stageName: 'Phòng boss', savedCoreBits: 0, newWeapon: undefined, reminders: [] },
    );
    expect(view.rewards).toEqual(['Không có phần thưởng mới']);
  });

  it('StageWorld đếm thời gian lượt chơi mỗi bước, kể cả lúc chờ hồi sinh', () => {
    const world = new StageWorld({
      layout: buildStageLayout(STAGE_DEFS.thorna, TILE_SIZE),
      tileSize: TILE_SIZE,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.thorna!,
      difficulty: config.difficulties.find((d) => d.id === 'normal')!,
      seed: 1,
      mechanics: config.stages.mechanics,
    });
    for (let i = 0; i < 60; i += 1) world.step(IDLE_INPUT);
    world.player.hp = 0;
    world.player.state = 'dead';
    for (let i = 0; i < 60; i += 1) world.step(IDLE_INPUT);
    expect(world.deaths).toBe(1);
    expect(world.elapsedSec).toBeCloseTo(2, 6);
  });
});

describe('MenuNavigator', () => {
  const none = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
    shoot: false,
    interact: false,
  };
  const snap = (p: Partial<typeof none>, moveX = 0, moveY = 0) => ({
    moveX,
    moveY,
    pressed: { ...none, ...p },
  });

  it('trục ngang: trái/phải bỏ qua mục khóa; cần đang kéo lúc mở phải thả về mới tính', () => {
    const nav = new MenuNavigator([true, false, true], 'x');
    nav.reset(2);
    expect(nav.handle(snap({}, 1)).moved).toBe(false);
    expect(nav.handle(snap({}, 0)).moved).toBe(false);
    expect(nav.handle(snap({}, -1)).moved).toBe(true);
    expect(nav.index).toBe(0);
    expect(nav.handle(snap({}, -1)).moved).toBe(false);
    expect(nav.handle(snap({ right: true })).moved).toBe(true);
    expect(nav.index).toBe(2);
    expect(nav.handle(snap({ up: true })).moved).toBe(false);
  });

  it('chọn bằng Nhảy, Bắn hoặc Tương tác', () => {
    const nav = new MenuNavigator([true]);
    expect(nav.handle(snap({ jump: true })).activate).toBe(true);
    expect(nav.handle(snap({ interact: true })).activate).toBe(true);
    expect(nav.handle(snap({})).activate).toBe(false);
  });
});
