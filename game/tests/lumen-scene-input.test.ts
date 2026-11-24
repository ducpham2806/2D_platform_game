import { afterEach, describe, expect, it, vi } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { bossFor, parseGameConfig } from '@/core/game-config';
import type { Action, InputDevice, InputSnapshot } from '@/logic/input/actions';
import { TouchOverlay } from '@/input/touch-overlay';
import { InputAggregator } from '@/logic/input/aggregator';
import { defaultControlSettings } from '@/logic/input/settings';
import type { TouchSettings } from '@/logic/input/touch-layout';
import { StageWorld } from '@/logic/world/stage-world';
import { StageScene } from '@/scenes/stage-scene';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

// Leave StageScene.update and combat real; supply only the canvas and the input service's UI shell.
vi.mock('phaser', () => ({ default: { Scene: class {} } }));
vi.mock('@/input/safe-area', () => ({
  readSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// The StageScene/World and DOM event listeners are real; this shim replaces rendering only.
class TouchElement extends EventTarget {
  readonly dataset: Record<string, string> = {};
  readonly children: TouchElement[] = [];
  readonly style = { setProperty() {} };
  readonly classes = new Set<string>();
  readonly classList = {
    add: (name: string) => this.classes.add(name),
    remove: (name: string) => this.classes.delete(name),
  };
  append(...elements: TouchElement[]): void {
    this.children.push(...elements);
  }
  setPointerCapture(): void {}
  remove(): void {}
}

function useTouchDom(): void {
  vi.stubGlobal('window', Object.assign(new EventTarget(), { innerWidth: 863, innerHeight: 360 }));
  vi.stubGlobal('document', { createElement: () => new TouchElement(), body: new TouchElement() });
  vi.stubGlobal('navigator', {});
}

afterEach(() => vi.unstubAllGlobals());

const config = parseGameConfig(loadData());
const FIGHT_STEP = FIXED_STEP_MS / 1000;

function fixture(device: InputDevice = 'keyboard', ownedWeapons: string[] = [], realTouch = false) {
  const difficulty = config.difficulties.find((row) => row.id === 'normal')!;
  const world = new StageWorld({
    layout: buildStageLayout(STAGE_DEFS.lumen, TILE_SIZE),
    tileSize: TILE_SIZE,
    stepSec: FIGHT_STEP,
    player: config.player,
    weapons: config.weapons,
    boss: bossFor(config, 'lumen', false)!,
    difficulty,
    mechanics: config.stages.mechanics,
    seed: 2187,
    ownedWeapons,
    level: 5,
  });
  const scene = new StageScene();
  scene.init({ stage: 'lumen' });
  const input = new InputAggregator(device);
  const settings = defaultControlSettings({
    ...config.controls,
    gamepad: config.controls.gamepad.buttons,
  });
  const moved: TouchSettings['offsets'][] = [];
  const touch = realTouch
    ? new TouchOverlay(config.controls.touch, settings.touch, input, (offsets) =>
        moved.push(offsets),
      )
    : undefined;
  touch?.setMode('play');
  const pointer = (type: string, id: number, x: number, y: number) => {
    if (!touch) throw new Error('Touch overlay not mounted');
    const event = Object.assign(new Event(type, { cancelable: true }), {
      pointerId: id,
      clientX: x,
      clientY: y,
    });
    touch.root.dispatchEvent(event);
  };
  const camera = {
    worldView: { x: 0, y: 0, width: 320, height: 192 },
    setBounds() {},
    flash() {},
    shake() {},
  };
  const finishPause = () => Reflect.get(scene, 'onPauseChoice').call(scene, 'resume');
  const pause = {
    isOpen: false,
    show() {
      this.isOpen = true;
    },
    hide() {
      this.isOpen = false;
    },
    handle(snap: InputSnapshot) {
      if (snap.pressed.pause) finishPause();
    },
  };
  Object.assign(scene, {
    world,
    pause,
    controls: {
      get device() {
        return input.device;
      },
      step: () => input.step(),
      hasPendingRelease: (action: 'shoot') => input.hasPendingRelease(action),
      setGameplayActive(active: boolean) {
        if (touch) touch.setMode(active ? 'play' : 'hidden');
        else if (!active) input.releaseAll('touch');
      },
      setWeaponLabel() {},
      setTouchHighlight() {},
      controlSettings: settings,
      glyphContext: () => ({
        device,
        keyboard: config.controls.keyboard,
        gamepad: config.controls.gamepad.buttons,
      }),
    },
    registry: { get: () => config },
    cameras: { main: camera },
    time: { now: 0 },
    game: { loop: { actualFps: 60 } },
  });
  const step = (count = 1) => {
    for (let i = 0; i < count; i += 1) scene.update(i * FIXED_STEP_MS, FIXED_STEP_MS);
  };
  const press = (action: Action) => input.press(device, action);
  const release = (action: Action) => input.release(device, action);
  const tap = (action: Action) => {
    press(action);
    step();
    release(action);
    step();
  };
  const charge = () => {
    press('shoot');
    step(80);
    expect(world.loadout.chargeLevel).toBe(2);
  };
  const charged = () => world.pool.count('player', ['charged']);
  return {
    world,
    input,
    pause,
    finishPause,
    step,
    press,
    release,
    tap,
    charge,
    charged,
    pointer,
    touch,
    moved,
  };
}

describe('ST-15-10 · giữ và nhả Arc Cannon khi đổi chế độ nhập', () => {
  it('nhả Bắn trong khi tạm dừng không biến lần nhấn nhanh tiếp theo thành đạn nạp', () => {
    const fx = fixture();
    fx.charge();
    fx.tap('pause');
    const frozen = fx.world.elapsedSec;
    fx.release('shoot');
    fx.step(5);
    expect(fx.world.elapsedSec).toBe(frozen);
    fx.tap('pause');
    expect(fx.pause.isOpen).toBe(false);
    fx.tap('shoot');
    expect(fx.charged()).toBe(0);
  });

  it('giữ phím Bắn liên tục qua tạm dừng rồi nhả vẫn bắn đúng đạn nạp', () => {
    const fx = fixture();
    fx.charge();
    fx.tap('pause');
    fx.step(5);
    fx.tap('pause');
    expect(fx.world.loadout.chargeLevel).toBe(2);
    fx.release('shoot');
    fx.step();
    expect(fx.charged()).toBe(1);
  });

  it('tạm dừng và nhả Bắn trong cùng bước không bắn trễ', () => {
    const fx = fixture();
    fx.charge();
    fx.press('pause');
    fx.release('shoot');
    fx.step();
    expect(fx.pause.isOpen).toBe(true);
    fx.release('pause');
    fx.step();
    fx.tap('pause');
    fx.tap('shoot');
    expect(fx.charged()).toBe(0);
  });

  it('chạm dừng khi còn giữ Bắn không bắn ngoài ý muốn lúc đóng menu bằng chạm', () => {
    const fx = fixture('touch');
    fx.charge();
    fx.press('pause');
    fx.step();
    expect(fx.pause.isOpen).toBe(true);
    // Pointer-based Resume can arrive before the next fixed simulation step drains the release.
    fx.finishPause();
    fx.step();
    expect(fx.charged()).toBe(0);
    fx.tap('shoot');
    expect(fx.charged()).toBe(0);
  });

  it('nhả Bắn rồi bấm Tiếp tục trước bước kế tiếp cũng bỏ nạp', () => {
    const fx = fixture();
    fx.charge();
    fx.tap('pause');
    fx.release('shoot');
    fx.finishPause();
    fx.step();
    expect(fx.charged()).toBe(0);
  });

  it('ẩn cảm ứng không bỏ nạp nếu phím Bắn khác vẫn giữ', () => {
    const fx = fixture('touch');
    fx.charge();
    fx.input.press('keyboard', 'shoot');
    fx.press('pause');
    fx.step();
    fx.finishPause();
    fx.step();
    expect(fx.world.loadout.chargeLevel).toBe(2);
    fx.input.release('keyboard', 'shoot');
    fx.step();
    expect(fx.charged()).toBe(1);
  });

  it('nhả Bắn trong menu không xóa nạp Arc Cannon đã cất khi đang cầm Vine Lash', () => {
    const fx = fixture('keyboard', ['Vine Lash']);
    fx.charge();
    fx.tap('swapNext');
    expect(fx.world.loadout.current.name).toBe('Vine Lash');
    fx.tap('pause');
    fx.release('shoot');
    fx.step(5);
    expect(fx.world.loadout.chargeLevel).toBe(2);
    fx.tap('pause');
    fx.tap('swapPrev');
    expect(fx.world.loadout.chargeLevel).toBe(2);
  });

  it('vào thoại cổng bằng cảm ứng huỷ nạp ngay khi lớp nút ẩn', () => {
    const fx = fixture('touch');
    fx.charge();
    fx.press('right');
    for (let i = 0; i < 300 && fx.world.phase !== 'boss'; i += 1) fx.step();
    expect(fx.world.phase).toBe('boss');
    expect(fx.world.loadout.chargeLevel).toBe(0);
    expect(fx.charged()).toBe(0);
  });

  it('nhả Bắn trong thoại ở cổng Lumen không nạp trước cho phát đầu trận', () => {
    const fx = fixture();
    fx.charge();
    fx.press('right');
    for (let i = 0; i < 300 && fx.world.phase !== 'boss'; i += 1) fx.step();
    expect(fx.world.phase).toBe('boss');
    const frozen = fx.world.elapsedSec;
    fx.release('right');
    fx.release('shoot');
    fx.step(30);
    expect(fx.world.elapsedSec).toBe(frozen);
    expect(fx.world.loadout.chargeLevel).toBe(0);
    fx.tap('dash'); // Bỏ qua thoại sau thời gian chống bấm nhầm.
    fx.tap('shoot');
    expect(fx.world.elapsedSec).toBeGreaterThan(frozen);
    expect(fx.charged()).toBe(0);
  });
});

describe('ST-15-10 · gián đoạn điểm chạm trong trận', () => {
  // Tâm Bắn với viewport Pixel 7 ngang: neo phải 156 px, neo dưới 62 px.
  const shoot = [707, 298] as const;
  const open = () => {
    useTouchDom();
    return fixture('touch', [], true);
  };

  it.each(['pointercancel', 'lostpointercapture'])(
    '%s bỏ nạp, không bắn đạn nạp hoặc giữ nút',
    (event) => {
      const fx = open();
      fx.pointer('pointerdown', 3, ...shoot);
      fx.step(80);
      expect(fx.world.loadout.chargeLevel).toBe(2);
      fx.pointer(event, 3, ...shoot);
      fx.step();
      expect(fx.charged()).toBe(0);
      expect(fx.world.loadout.chargeLevel).toBe(0);
      fx.step(80);
      expect(fx.world.loadout.chargeLevel).toBe(0);
    },
  );

  it('mất bắt chạm cần ảo dừng di chuyển nhưng ngón bắn còn lại vẫn nhả bình thường', () => {
    const fx = open();
    fx.pointer('pointerdown', 3, ...shoot);
    fx.step(80);
    fx.pointer('pointerdown', 7, 80, 220);
    fx.pointer('pointermove', 7, 140, 220);
    fx.step(8);
    const x = fx.world.player.centerX;
    expect(fx.world.player.vx).toBeGreaterThan(0);
    fx.pointer('lostpointercapture', 7, 140, 220);
    fx.step(3);
    expect(fx.world.player.centerX).toBe(x);
    expect(fx.world.loadout.chargeLevel).toBe(2);
    fx.pointer('pointerup', 3, ...shoot);
    fx.pointer('lostpointercapture', 3, ...shoot);
    fx.step();
    expect(fx.charged()).toBe(1);
  });

  it('bấm rồi bị hệ thống hủy trước bước kế tiếp không bắn; chạm nhanh thật vẫn bắn', () => {
    const fx = open();
    fx.pointer('pointerdown', 3, ...shoot);
    fx.pointer('pointercancel', 3, ...shoot);
    fx.step();
    expect(fx.world.pool.count('player', ['shot'])).toBe(0);
    fx.pointer('pointerdown', 4, ...shoot);
    fx.pointer('pointerup', 4, ...shoot);
    fx.pointer('lostpointercapture', 4, ...shoot);
    fx.step();
    expect(fx.world.pool.count('player', ['shot'])).toBe(1);
  });

  it('mất chạm đang giữ Bắn không hủy nạp của nguồn còn giữ cùng nút', () => {
    const fx = open();
    fx.pointer('pointerdown', 3, ...shoot);
    fx.step(80);
    fx.input.press('keyboard', 'shoot');
    fx.pointer('pointercancel', 3, ...shoot);
    fx.step();
    expect(fx.world.loadout.chargeLevel).toBe(2);
    expect(fx.charged()).toBe(0);
    fx.input.release('keyboard', 'shoot');
    fx.step();
    expect(fx.charged()).toBe(1);
  });
  it('hủy thao tác vuốt không đổi vũ khí và một lượt vuốt mới vẫn dùng được', () => {
    useTouchDom();
    const fx = fixture('touch', ['Vine Lash'], true);
    const weaponButton = [539, 254] as const;
    fx.pointer('pointerdown', 4, ...weaponButton);
    fx.pointer('pointermove', 4, 610, 254);
    fx.pointer('lostpointercapture', 4, 610, 254);
    fx.pointer('pointerup', 4, 610, 254);
    fx.step();
    expect(fx.world.loadout.current.name).toBe('Arc Cannon');
    fx.pointer('pointerdown', 5, ...weaponButton);
    fx.pointer('pointerup', 5, 610, 254);
    fx.step();
    expect(fx.world.loadout.current.name).toBe('Vine Lash');
  });

  it('hủy kéo nút ở chế độ chỉnh không lưu vị trí ngoài ý muốn', () => {
    const fx = open();
    fx.touch?.setMode('edit');
    fx.pointer('pointerdown', 4, ...shoot);
    fx.pointer('pointermove', 4, 737, 280);
    fx.pointer('pointercancel', 4, 737, 280);
    fx.pointer('lostpointercapture', 4, 737, 280);
    expect(fx.moved).toHaveLength(0);
    fx.pointer('pointerdown', 5, ...shoot);
    fx.pointer('pointermove', 5, 737, 280);
    fx.pointer('pointerup', 5, 737, 280);
    expect(fx.moved).toHaveLength(1);
  });
});
