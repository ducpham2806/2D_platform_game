import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { type GameConfig, parseLevelRange } from '../core/game-config';
import { getBus, getConfig, getInput, getSave } from '../core/phaser-services';
import { buildPrep, type PrepModel } from '../logic/difficulty/prep-model';
import { characterProgress, syncLevel } from '../logic/rpg/progression';
import { recordDifficultyChosen, stageDifficulty } from '../logic/save/save-data';
import { UNLOCK_ALL } from '../debug/flags';
import type { SaveManager } from '../logic/save/save-manager';
import { PrepPanel } from '../prep/prep-panel';
import { STAGE_DEFS, type StageDefId } from '../stages';
import { TEXT_STYLE } from './ui';

/** Mô hình màn Chuẩn bị cho màn `stage` (màn chiến dịch); undefined nếu màn không thuộc chiến dịch. */
export function prepModelFor(
  stage: StageDefId,
  save: SaveManager,
  config: GameConfig,
): PrepModel | undefined {
  const def = STAGE_DEFS[stage];
  const campaign = config.stages.stages.find((s) => s.id === def.campaign);
  if (!campaign) return undefined;
  const range = parseLevelRange(campaign.recommendedLevel);
  const level = characterProgress(
    save.data.character.exp,
    save.data.progress.bossesDefeated,
    new Set(config.stages.stages.map((s) => s.boss)),
    config.player.level,
  ).level;
  return buildPrep({
    stageName: `Stage ${campaign.index} ${campaign.name} · ${def.name}`,
    recommended: range,
    level,
    effectiveLevel: syncLevel(level, range, config.stages.levelSync),
    hintBelow: config.stages.levelSync.belowMin,
    // ?debug=1&unlock=1: mở mọi độ khó để chạy thử (không ghi bản lưu).
    difficulties: UNLOCK_ALL
      ? config.difficulties.map((d) => ({ ...d, unlockClearedOn: null }))
      : config.difficulties,
    progress: stageDifficulty(save.data, campaign.id),
  });
}

/**
 * Màn Chuẩn bị (GDD 11 mục 2.1, đặc tả Hub mục 3; MVP: Hub là menu): chọn độ khó rồi vào màn
 * chiến dịch. Bảng HTML phủ lên canvas (ADR-001).
 */
export class PrepScene extends Phaser.Scene {
  private panel: PrepPanel | undefined;
  private stage: StageDefId = 'thorna';

  constructor() {
    super(SceneKey.Prep);
  }

  init(data: { stage?: StageDefId } | undefined): void {
    this.stage = data?.stage ?? 'thorna';
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Prep });
    this.add
      .text(LOGIC_WIDTH / 2, 12, 'CHUẨN BỊ', { ...TEXT_STYLE, fontSize: '12px' })
      .setOrigin(0.5);
    this.input.enabled = false;
    if (this.input.keyboard) this.input.keyboard.enabled = false;
    getInput(this).setGameplayActive(false);
    const save = getSave(this);
    const config = getConfig(this);
    const model = prepModelFor(this.stage, save, config);
    if (!model) {
      // Màn không thuộc chiến dịch: vào thẳng, độ khó Thường.
      this.scene.start(SceneKey.Stage, { stage: this.stage });
      return;
    }
    const campaign = STAGE_DEFS[this.stage].campaign ?? '';
    this.panel = new PrepPanel(model, {
      onStart: (difficulty) => {
        save.update((s) => recordDifficultyChosen(s, campaign, difficulty));
        this.scene.start(SceneKey.Stage, { stage: this.stage, difficulty });
      },
      onBack: () => this.scene.start(SceneKey.Menu),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.panel?.destroy();
      this.panel = undefined;
    });
  }

  override update(): void {
    this.panel?.handle(getInput(this).step());
  }
}
