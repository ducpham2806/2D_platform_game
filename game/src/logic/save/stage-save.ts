/**
 * Nối một lượt chơi màn với bản lưu (M11). Đọc bản lưu để dựng phần WorldSetup (checkpoint,
 * vũ khí, bí mật, boss đã hạ), rồi theo sự kiện của StageWorld mà ghi lại:
 * - qua checkpoint, nhặt bí mật, hạ boss, nhận vũ khí: ghi ngay;
 * - EXP, Core Bit và thời gian chơi: cộng phần chênh lệch mỗi lần ghi và khi thoát màn,
 *   nên thoát giữa màn không mất Core Bit đã nhặt và không cộng trùng.
 * Logic thuần.
 */
import { NANO_CELL } from '../world/nano-cell';
import type { WorldEvents } from '../world/world-types';
import {
  addRewards,
  completeStage,
  grantWeapon,
  recordBossDefeated,
  recordCheckpoint,
  recordDifficultyCleared,
  recordSecret,
  savedCheckpoint,
  type SaveData,
  stageProgress,
} from './save-data';
import type { SaveManager } from './save-manager';

export interface StageSaveSetup {
  startCheckpoint: number;
  ownedWeapons: string[];
  takenSecrets: string[];
  bossDefeated: boolean;
}

/**
 * Phần WorldSetup lấy từ bản lưu cho màn `stageId` có boss `bossId`. `allowed`: các độ khó được
 * mang checkpoint sang (độ khó đang chọn và khó hơn, GDD 11 mục 2.4); không có thì mọi độ khó.
 */
export function stageSaveSetup(
  save: SaveData,
  stageId: string,
  bossId: string,
  allowed?: readonly string[],
): StageSaveSetup {
  const progress = stageProgress(save, stageId);
  return {
    startCheckpoint: savedCheckpoint(progress, allowed),
    ownedWeapons: [...save.character.weapons],
    takenSecrets: [...progress.secrets],
    bossDefeated: save.progress.bossesDefeated.includes(bossId),
  };
}

/** Bản lưu cũ đã ghi Nano Cell Stage 1 theo id của phòng thử M7. */
export function claimedNanoCells(
  save: SaveData,
  stages: readonly { id: string; nanoCell?: boolean }[],
): ReadonlySet<string> {
  const claimedIn = (id: string): boolean => stageProgress(save, id).secrets.includes(NANO_CELL);
  return new Set(
    stages
      .filter(
        ({ id, nanoCell }) =>
          nanoCell && (claimedIn(id) || (id === 'verdant_gardens' && claimedIn('mechanics'))),
      )
      .map(({ id }) => id),
  );
}

/** Số liệu tích lũy của lượt chơi mà StageWorld cung cấp. */
export interface RunTotals {
  readonly exp: number;
  readonly coreBits: number;
}

export class StageSave {
  private banked = { exp: 0, coreBits: 0, time: 0 };
  private time = 0;

  constructor(
    private readonly manager: SaveManager,
    private readonly stageId: string,
    private readonly bossId: string,
    private readonly opts: {
      /** Độ khó của lượt: checkpoint ghi theo độ khó này (mặc định Thường). */
      difficulty?: string;
      /** Màn chiến dịch mà boss của phòng này là boss chiến dịch: hạ boss thì ghi `cleared`. */
      clearsCampaign?: string;
      /** Ghi Nano Cell theo màn chiến dịch để dùng chung qua các bản đồ. */
      nanoCellStage?: string;
    } = {},
  ) {}

  get readOnly(): boolean {
    return this.manager.readOnly;
  }

  get readUnavailable(): boolean {
    return this.manager.readUnavailable;
  }

  get needsBackup(): boolean {
    return this.manager.needsBackup;
  }

  /** True nếu đã đổi bản trong bộ nhớ; biên nhận ghi là callback riêng. */
  step(ev: WorldEvents, run: RunTotals, dtSec: number, onWritten?: () => void): boolean {
    this.time += dtSec;
    const { stageId, bossId } = this;
    const changes: ((s: SaveData) => SaveData)[] = [];
    if (ev.checkpoint !== undefined) {
      const index = ev.checkpoint;
      const difficulty = this.opts.difficulty ?? 'normal';
      changes.push((s) => recordCheckpoint(s, stageId, index, difficulty));
    }
    for (const item of ev.secretsFound) {
      const source = item === NANO_CELL ? (this.opts.nanoCellStage ?? stageId) : stageId;
      changes.push((s) => recordSecret(s, source, item));
    }
    if (ev.weaponGranted !== undefined) {
      const weapon = ev.weaponGranted;
      changes.push((s) => grantWeapon(s, weapon));
    }
    if (ev.bossDefeated) {
      changes.push((s) => completeStage(recordBossDefeated(s, bossId), stageId));
      const campaign = this.opts.clearsCampaign;
      const difficulty = this.opts.difficulty ?? 'normal';
      if (campaign) changes.push((s) => recordDifficultyCleared(s, campaign, difficulty));
    }
    if (changes.length === 0) return false;
    return this.commit(run, changes, onWritten);
  }

  /** Thoát màn (về menu, đóng trang): cộng EXP, Core Bit, thời gian chưa ghi. */
  exit(run: RunTotals): boolean {
    return this.commit(run, []);
  }

  private commit(
    run: RunTotals,
    changes: ((s: SaveData) => SaveData)[],
    onWritten?: () => void,
  ): boolean {
    const gain = {
      exp: run.exp - this.banked.exp,
      coreBits: run.coreBits - this.banked.coreBits,
      playTimeSec: this.time - this.banked.time,
    };
    this.banked = { exp: run.exp, coreBits: run.coreBits, time: this.time };
    return this.manager.update(
      (s) => changes.reduce((acc, f) => f(acc), addRewards(s, gain)),
      onWritten,
    );
  }
}
