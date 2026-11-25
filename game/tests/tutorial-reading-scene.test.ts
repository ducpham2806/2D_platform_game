import { expect, it, vi } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { bossFor, parseGameConfig } from '@/core/game-config';
import { TimedBox } from '@/logic/hud/text-boxes';
import { InputAggregator } from '@/logic/input/aggregator';
import { defaultControlSettings } from '@/logic/input/settings';
import { TutorialManager } from '@/logic/tutorial/tutorial-manager';
import { StageWorld } from '@/logic/world/stage-world';
import { StageScene } from '@/scenes/stage-scene';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

vi.mock('phaser', () => ({ default: { Scene: class {} } }));

it('QB-70/72: sau gợi ý chết, StageScene hiện lại lời hướng dẫn chưa đọc hết', () => {
  const config = parseGameConfig(loadData());
  const dt = FIXED_STEP_MS / 1000;
  const difficulty = config.difficulties.find((d) => d.id === 'normal')!;
  const world = new StageWorld({
    layout: buildStageLayout(STAGE_DEFS.thorna, TILE_SIZE),
    tileSize: TILE_SIZE,
    stepSec: dt,
    player: config.player,
    weapons: config.weapons,
    boss: bossFor(config, 'thorna', false)!,
    difficulty,
    mechanics: config.stages.mechanics,
    seed: 42,
    ownedWeapons: [],
    level: 4,
  });
  const entry = config.tutorial.steps.find((s) => s.id === 'S08')!;
  expect(entry.require).toBeUndefined();
  const manager = new TutorialManager({ ...config.tutorial, steps: [entry] }, entry.stage);
  const tutorialBox = { show: vi.fn(), hide: vi.fn() };
  const hintBox = { show: vi.fn(), hide: vi.fn() };
  const timed = new TimedBox(config.ui.reading);
  timed.post('Lời khuyên sau lần ngã', entry.showSec + 1);
  let start = true;
  const scene = new StageScene();
  scene.init({ stage: 'thorna' });
  const input = new InputAggregator('keyboard');
  const settings = defaultControlSettings({
    ...config.controls,
    gamepad: config.controls.gamepad.buttons,
  });
  Object.assign(scene, {
    world,
    controls: {
      device: 'keyboard',
      step: () => input.step(),
      setWeaponLabel() {},
      setTouchHighlight() {},
      controlSettings: settings,
      glyphContext: () => ({
        device: 'keyboard',
        keyboard: config.controls.keyboard,
        gamepad: config.controls.gamepad.buttons,
      }),
    },
    registry: { get: () => config },
    cameras: {
      main: {
        worldView: { x: 0, y: 0, width: 320, height: 192 },
        setBounds() {},
        flash() {},
        shake() {},
      },
    },
    time: { now: 0 },
    game: { loop: { actualFps: 60 } },
    tutorial: {
      manager,
      box: tutorialBox,
      signals: {
        collect() {
          const signals = start ? new Set([entry.trigger.on!]) : new Set<string>();
          start = false;
          return { signals, moveTiles: 0 };
        },
      },
    },
    deathHint: { timed, box: hintBox, used: true },
  });
  let time = 0;
  const frames = (seconds: number) => {
    for (let i = 0; i < Math.ceil(seconds / dt); i += 1) {
      time += FIXED_STEP_MS;
      scene.update(time, FIXED_STEP_MS);
    }
  };
  frames(entry.showSec + 0.5);
  expect(hintBox.show).toHaveBeenCalled();
  expect(tutorialBox.show).not.toHaveBeenCalled();
  expect(manager.completed.has(entry.id)).toBe(false);

  frames(0.75);
  expect(timed.active).toBe(false);
  expect(tutorialBox.show).toHaveBeenCalled();
  expect(manager.view?.id).toBe(entry.id);
  frames(entry.showSec);
  expect(manager.completed.has(entry.id)).toBe(true);
  expect(manager.view).toBeUndefined();
});
