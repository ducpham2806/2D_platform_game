/**
 * Đo lường một lượt vào màn (lớp nối của StageScene, EP-13 ST-13-02b). Chỉ chạy khi dịch vụ đo
 * lường bật và màn là màn chiến dịch (`StageDef.campaign`). Dựng `stage_start` từ bản lưu; mỗi bước
 * logic đưa sự kiện cho `StageTracker`; đếm khung bằng `FrameStats`; trang ẩn thì ghi
 * `stage_progress` (QB-98); rời màn (scene tắt: thoát, Chơi lại, sang Xưởng, đóng trang) thì ghi
 * `stage_end` (QB-47). Bước hướng dẫn và gợi ý NOVA cũng đi qua đây.
 */
import Phaser from 'phaser';
import { TILE_SIZE } from '../../core/constants';
import { weaponId } from '../../core/telemetry-catalogs';
import type { InputDevice } from '../../logic/input/actions';
import type { SaveManager } from '../../logic/save/save-manager';
import { FrameStats } from '../../logic/telemetry/frame-stats';
import { buildSignature, type RunExtras, StageTracker } from '../../logic/telemetry/stage-tracker';
import type { TutorialStepResult, TutorialView } from '../../logic/tutorial/tutorial-manager';
import type { StageWorld } from '../../logic/world/stage-world';
import type { WorldEvents } from '../../logic/world/world-types';
import type { StageDef } from '../../stages/stage-def';
import { getTelemetry, type TelemetryHandle } from './telemetry-service';

export interface StageTelemetryInit {
  def: StageDef;
  difficultyId: string;
  difficultyDefault: string;
  challengeOpen: boolean;
  /** Độ khó đã hạ boss của màn. */
  clearedBefore: readonly string[];
  save: SaveManager | undefined;
  /** Cấp thật (trước đồng bộ cấp theo màn). */
  level: number;
  /** Core Bit trong ví lúc vào màn. */
  savedCoreBits: number;
  device: InputDevice;
  stepSec: number;
}

export class StageTelemetry {
  private readonly frames: FrameStats;
  private readonly tracker: StageTracker;
  private hintShown: { id: string; level: number } | undefined;
  /** Thiết bị dùng gần nhất (cho `boss_end`, `stage_end` lúc rời màn). */
  private device: InputDevice;
  private readonly onHidden = (): void => {
    if (document.hidden) this.tracker.progress(this.extras());
  };

  private constructor(
    scene: Phaser.Scene,
    private readonly h: TelemetryHandle,
    private readonly world: StageWorld,
    private readonly init: StageTelemetryInit,
    stage: string,
  ) {
    const t = h.config.telemetry;
    if (!t) throw new Error('Thiếu cấu hình đo lường');
    this.device = init.device;
    this.frames = new FrameStats(t.frame.slowMs, t.frame.ignoreMs);
    this.tracker = new StageTracker(h.tel, world, {
      stage,
      tileSize: TILE_SIZE,
      weaponId,
      progressSec: t.stageProgressSec,
      gameSpeed: 1,
    });
    const run = (h.runs.get(stage) ?? 0) + 1;
    h.runs.set(stage, run);
    const save = init.save?.data;
    this.tracker.start(
      {
        room: init.def.id,
        difficulty: init.difficultyId,
        difficultyDefault: init.difficultyDefault,
        challengeOpen: init.challengeOpen,
        run,
        clearedBefore: [...init.clearedBefore],
        fromCheckpoint: world.checkpointIndex,
        level: Math.max(1, init.level),
        effLevel: Math.max(1, world.level),
        ...(save
          ? {
              skills: buildSignature(save.character.skills),
              upgrades: { ...save.inventory.upgrades },
              weapons: save.character.weapons.length,
            }
          : {}),
        coreBits: Math.max(0, Math.round(init.savedCoreBits)),
      },
      init.device,
    );
    document.addEventListener('visibilitychange', this.onHidden);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.onHidden);
      this.tracker.end(this.world.phase === 'won' ? 'clear' : 'quit', this.extras(), this.device);
    });
  }

  /** Bắt đầu đo lượt này nếu dịch vụ bật và màn là màn chiến dịch; không thì undefined. */
  static start(
    scene: Phaser.Scene,
    world: StageWorld,
    init: StageTelemetryInit,
  ): StageTelemetry | undefined {
    const h = getTelemetry(scene);
    const stage = init.def.campaign;
    if (!h?.config.telemetry || !stage) return undefined;
    return new StageTelemetry(scene, h, world, init, stage);
  }

  /** Mỗi khung hình (ms từ khung trước). */
  frame(deltaMs: number): void {
    this.frames.add(deltaMs);
  }

  /** Sau mỗi bước logic của trận. */
  step(ev: WorldEvents, device: InputDevice): void {
    this.device = device;
    this.tracker.step(ev, device, this.init.stepSec);
    if (this.tracker.progressDue()) this.tracker.progress(this.extras());
  }

  /** Gợi ý NOVA sau 3 lần chết vừa hiện. */
  hint(): void {
    this.tracker.hint(this.init.difficultyId);
  }

  /** Kết quả bước hướng dẫn của bước logic này và lời đang hiện (bậc gợi ý). */
  tutorial(
    result: TutorialStepResult,
    view: TutorialView | undefined,
    phase: string | undefined,
  ): void {
    if (result.started)
      this.h.log('tutorial_step_start', { id: result.started, ...(phase ? { phase } : {}) });
    for (const id of result.completed) this.h.log('tutorial_step_complete', { id });
    if (view && view.hintLevel > 0) {
      const prev = this.hintShown;
      if (!prev || prev.id !== view.id || prev.level < view.hintLevel) {
        this.hintShown = { id: view.id, level: view.hintLevel };
        this.h.log('tutorial_hint_shown', { id: view.id, level: Math.min(4, view.hintLevel) });
      }
    }
  }

  tutorialToggle(on: boolean): void {
    this.h.log('tutorial_toggle', { on, where: 'pause' });
  }

  private extras(): RunExtras {
    const w = this.world;
    return {
      realSec: this.frames.realMs / 1000,
      expEarned: w.exp,
      coreBitsEarned: w.coreBits,
      balance: this.init.savedCoreBits + w.coreBits,
      ...(this.frames.frames > 0
        ? { fpsMedian: this.frames.fpsMedian, slowFramePct: this.frames.slowFramePct }
        : {}),
    };
  }
}
