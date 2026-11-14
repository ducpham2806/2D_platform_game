import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { parseControls } from '@/core/controls-config';
import { parseGameConfig } from '@/core/game-config';
import { buildHud, LOW_HP_FRACTION } from '@/logic/hud/hud-model';
import { gridMove, MenuCursor } from '@/logic/hud/menu-cursor';
import { defaultTouchSettings } from '@/logic/input/settings';
import { resolveButtons, swipeAction, stickZone, inRect } from '@/logic/input/touch-layout';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { THORNA_ROOM_ROWS } from '@/stages/thorna-room';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const t = TILE_SIZE;
const config = parseGameConfig(loadData());
const normal = config.difficulties.find((d) => d.id === 'normal')!;

function thornaWorld(): StageWorld {
  return new StageWorld({
    rows: THORNA_ROOM_ROWS,
    tileSize: t,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses.thorna!,
    difficulty: normal,
    mechanics: config.stages.mechanics,
    seed: 7,
    ownedWeapons: ['Vine Lash'],
  });
}

describe('mô hình HUD', () => {
  it('máu, vũ khí, Core Bit cộng bản lưu; không có máu boss ngoài trận', () => {
    const world = thornaWorld();
    const hud = buildHud(world, 50);
    expect(hud.hp).toEqual({ value: 100, max: 100, frac: 1, low: false });
    expect(hud.energy).toBeUndefined();
    expect(hud.weapon).toEqual({ name: 'Arc Cannon', index: 0, count: 2 });
    expect(hud.boss).toBeUndefined();
    expect(hud.coreBits).toBe(50);
    expect(hud.roomRemaining).toBeUndefined();
  });

  it('máu thấp thì cảnh báo; máu không âm', () => {
    const world = thornaWorld();
    world.player.hp = world.player.maxHp * LOW_HP_FRACTION;
    expect(buildHud(world).hp.low).toBe(true);
    world.player.hp = -5;
    expect(buildHud(world).hp).toMatchObject({ value: 0, frac: 0 });
  });

  it('cầm vũ khí boss thì có thanh năng lượng', () => {
    const world = thornaWorld();
    world.step({ ...IDLE_INPUT, swapNext: true });
    const hud = buildHud(world);
    expect(hud.weapon.name).toBe('Vine Lash');
    expect(hud.energy).toEqual({
      value: config.weapons.energyMax,
      max: config.weapons.energyMax,
      frac: 1,
    });
  });

  it('trong trận boss: máu boss, pha, vạch đổi pha theo dữ liệu', () => {
    const world = thornaWorld();
    world.player.respawn((world.arena!.first + 3) * t, 11 * t);
    world.step(IDLE_INPUT);
    world.boss!.hp = world.boss!.data.hp / 2;
    const boss = buildHud(world).boss!;
    expect(boss.name).toBe(config.bosses.thorna!.name);
    expect(boss.frac).toBe(0.5);
    expect(boss.phase).toBe(1);
    expect(boss.phaseMarks).toEqual([60, 30]);
  });

  it('phòng khóa đang đóng: đếm kẻ địch còn lại', () => {
    const world = new StageWorld({
      layout: buildStageLayout(STAGE_DEFS.golem, t),
      tileSize: t,
      stepSec: DT,
      player: config.player,
      weapons: config.weapons,
      boss: config.bosses.gray!,
      difficulty: normal,
      seed: 1,
      enemies: config.enemies,
      mechanics: config.stages.mechanics,
    });
    for (let i = 0; i < 60 * 8 && !world.lockedRoom; i += 1)
      world.step({ ...IDLE_INPUT, moveX: 1 });
    expect(world.lockedRoom).toBeDefined();
    expect(buildHud(world).roomRemaining).toBe(1);
  });
});

describe('con trỏ menu', () => {
  it('bỏ qua mục khóa, đi vòng hai đầu', () => {
    const c = new MenuCursor([true, false, false, true]);
    expect(c.index).toBe(0);
    expect(c.move(1)).toBe(3);
    expect(c.move(1)).toBe(0);
    expect(c.move(-1)).toBe(3);
    expect(c.select(1)).toBe(false);
    expect(c.index).toBe(3);
    expect(() => new MenuCursor([false])).toThrow();
  });
});

describe('nút biểu tượng vũ khí (vuốt)', () => {
  const touch = parseControls(loadData().controls).touch;

  it('chạm hoặc vuốt ngắn = vũ khí sau; vuốt trái = trước; vuốt phải = sau', () => {
    expect(swipeAction(0, touch.swipeMinDp)).toBe('swapNext');
    expect(swipeAction(-touch.swipeMinDp + 1, touch.swipeMinDp)).toBe('swapNext');
    expect(swipeAction(-touch.swipeMinDp, touch.swipeMinDp)).toBe('swapPrev');
    expect(swipeAction(80, touch.swipeMinDp)).toBe('swapNext');
  });

  it('có trong bố cục mặc định, nằm ngoài vùng cần ảo ở màn điện thoại', () => {
    const phone = { width: 844, height: 390 };
    const settings = defaultTouchSettings(touch);
    const weapon = resolveButtons(phone, touch, settings).find((b) => b.swipe)!;
    expect(weapon.action).toBe('swapNext');
    expect(inRect(stickZone(phone, touch, false), weapon.cx, weapon.cy)).toBe(false);
  });

  it('chỉ nút đổi vũ khí được là nút vuốt', () => {
    const raw = structuredClone(loadData().controls) as {
      touch: { buttons: { action: string; swipe?: boolean }[] };
    };
    raw.touch.buttons[0]!.swipe = true;
    expect(raw.touch.buttons[0]!.action).not.toMatch(/swap/);
    expect(() => parseControls(raw)).toThrow(/swipe/);
  });
});

describe('gridMove (bảng Xưởng)', () => {
  const rows = [3, 3, 3, 3, 3];
  it('trái/phải kẹp ở mép; lên/xuống giữ cột, không ra ngoài lưới', () => {
    expect(gridMove(rows, { row: 0, col: 0 }, 'left')).toEqual({ row: 0, col: 0 });
    expect(gridMove(rows, { row: 0, col: 1 }, 'right')).toEqual({ row: 0, col: 2 });
    expect(gridMove(rows, { row: 0, col: 2 }, 'up')).toEqual({ row: 0, col: 2 });
    expect(gridMove(rows, { row: 3, col: 2 }, 'down')).toEqual({ row: 4, col: 2 });
    expect(gridMove(rows, { row: 4, col: 2 }, 'down')).toEqual({ row: 4, col: 2 });
  });
  it('hàng ngắn hơn thì kẹp cột; bỏ qua hàng trống', () => {
    expect(gridMove([3, 1, 3], { row: 0, col: 2 }, 'down')).toEqual({ row: 1, col: 0 });
    expect(gridMove([3, 0, 2], { row: 0, col: 2 }, 'down')).toEqual({ row: 2, col: 1 });
  });
});
