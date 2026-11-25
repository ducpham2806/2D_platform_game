import { expect, it, vi } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { bossFor, parseGameConfig } from '@/core/game-config';
import { InputAggregator } from '@/logic/input/aggregator';
import { defaultControlSettings } from '@/logic/input/settings';
import { addRewards, savedCheckpoint, SAVE_VERSION, stageProgress } from '@/logic/save/save-data';
import { SaveManager, type SaveStore } from '@/logic/save/save-manager';
import { StageSave } from '@/logic/save/stage-save';
import { StageWorld } from '@/logic/world/stage-world';
import { noWorldEvents } from '@/logic/world/world-types';
import { StageScene } from '@/scenes/stage-scene';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

vi.mock('phaser', () => ({ default: { Scene: class {} } }));

class DeferredStore implements SaveStore {
  readonly pending: { ok: () => void; fail: () => void }[] = [];
  constructor(public snapshot: string | null = null) {}
  async read() {
    return this.snapshot;
  }
  write(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pending.push({
        ok: () => {
          this.snapshot = text;
          resolve();
        },
        fail: () => reject(new Error('kho thử bị chặn')),
      });
    });
  }
}

const config = parseGameConfig(loadData());
const attempts = (store: DeferredStore, n: number) =>
  vi.waitFor(() => expect(store.pending).toHaveLength(n), { interval: 1 });

function sceneFixture(save?: SaveManager) {
  const scene = new StageScene();
  scene.init({ stage: save ? 'thorna' : 'gray' });
  const input = new InputAggregator('keyboard');
  const world = new StageWorld({
    layout: buildStageLayout(STAGE_DEFS.thorna, TILE_SIZE),
    tileSize: TILE_SIZE,
    stepSec: FIXED_STEP_MS / 1000,
    player: config.player,
    weapons: config.weapons,
    boss: bossFor(config, 'thorna', false)!,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    mechanics: config.stages.mechanics,
    seed: 42,
    ownedWeapons: [],
    level: 4,
  });
  const flash = vi.fn();
  const hint = vi.fn();
  const step = vi.spyOn(world, 'step').mockImplementation(() => noWorldEvents());
  Object.assign(scene, {
    world,
    saver: save ? new StageSave(save, 'thorna', 'thorna') : undefined,
    controls: {
      device: 'keyboard',
      step: () => input.step(),
      setWeaponLabel() {},
      setTouchHighlight() {},
      controlSettings: defaultControlSettings({
        ...config.controls,
        gamepad: config.controls.gamepad.buttons,
      }),
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
    hud: { flash, update() {}, hint: { setText: hint }, debug: { setText() {} } },
    time: { now: 0 },
    game: { loop: { actualFps: 60 } },
  });
  const frame = () => scene.update(FIXED_STEP_MS, FIXED_STEP_MS);
  const checkpoint = (n: number) => {
    step.mockReturnValueOnce({ ...noWorldEvents(), checkpoint: n });
    frame();
  };
  const log = (): string[] => flash.mock.calls.map(([message]) => String(message));
  return {
    scene,
    frame,
    checkpoint,
    log,
    hint,
    transition: () => Object.assign(scene, { saver: undefined }),
  };
}

it('QB-100: Checkpoint is reached immediately, but saved only when that write is acknowledged', async () => {
  const store = new DeferredStore();
  const save = await SaveManager.open(store);
  const ui = sceneFixture(save);
  ui.checkpoint(1);
  expect(ui.log()).toEqual(['Checkpoint 1']);
  expect(savedCheckpoint(stageProgress(save.data, 'thorna'), ['normal'])).toBe(1);
  await attempts(store, 1);
  expect(ui.log()).toEqual(['Checkpoint 1']);
  store.pending[0]!.ok();
  await vi.waitFor(() => expect(ui.log()).toEqual(['Checkpoint 1', 'Checkpoint 1 · đã lưu']));
});

it('QB-100: failure retains progress and backup path until the latest snapshot is stored', async () => {
  const store = new DeferredStore();
  const save = await SaveManager.open(store);
  const ui = sceneFixture(save);
  ui.checkpoint(1);
  await attempts(store, 1);
  store.pending[0]!.fail();
  await save.flush();
  ui.frame();
  expect(ui.log()).toEqual(['Checkpoint 1']);
  expect(ui.hint.mock.lastCall?.[0]).toContain('Dữ liệu lưu');
  expect(savedCheckpoint(stageProgress(save.data, 'thorna'), ['normal'])).toBe(1);

  ui.checkpoint(2);
  await attempts(store, 2);
  save.update((s) => addRewards(s, { coreBits: 12 }));
  store.pending[1]!.ok();
  await attempts(store, 3);
  ui.frame();
  expect(ui.hint.mock.lastCall?.[0]).toContain('Dữ liệu lưu');
  store.pending[2]!.ok();
  await save.flush();
  ui.frame();
  expect(ui.hint.mock.lastCall?.[0]).not.toContain('Dữ liệu lưu');
  expect(JSON.parse(store.snapshot!).inventory.coreBits).toBe(12);
});

it('QB-100: suppresses a completed write for an older checkpoint or a departed scene', async () => {
  const store = new DeferredStore();
  const save = await SaveManager.open(store);
  const ui = sceneFixture(save);
  ui.checkpoint(1);
  ui.checkpoint(2);
  await attempts(store, 1);
  store.pending[0]!.ok();
  await attempts(store, 2);
  expect(ui.log()).toEqual(['Checkpoint 1', 'Checkpoint 2']);
  ui.transition();
  store.pending[1]!.ok();
  await save.flush();
  expect(ui.log()).toEqual(['Checkpoint 1', 'Checkpoint 2']);
});

it('QB-101 / G1: read-only and no-saver modes never report a durable write', async () => {
  const store = new DeferredStore(JSON.stringify({ version: SAVE_VERSION + 1, revision: 9 }));
  const save = await SaveManager.open(store);
  const readOnly = sceneFixture(save);
  readOnly.checkpoint(1);
  await save.flush();
  readOnly.frame();
  expect(readOnly.log()).toEqual(['Checkpoint 1']);
  expect(readOnly.hint.mock.lastCall?.[0]).toContain('chỉ đọc');
  expect(store.pending).toHaveLength(0);
  const gate = sceneFixture();
  gate.checkpoint(1);
  expect(gate.log()).toEqual(['Checkpoint 1']);
  expect(gate.hint.mock.lastCall?.[0]).not.toContain('Dữ liệu lưu');
});
