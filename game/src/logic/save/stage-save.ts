/**
 * Nối một lượt chơi màn với bản lưu (M11). Đọc bản lưu để dựng phần WorldSetup (checkpoint,
 * vũ khí, bí mật, boss đã hạ), rồi theo sự kiện của StageWorld mà ghi lại:
 * - qua checkpoint, nhặt bí mật, hạ boss, nhận vũ khí: ghi ngay;
 * - EXP, Core Bit và thời gian chơi: cộng phần chênh lệch mỗi lần ghi và khi thoát màn,
 *   nên thoát giữa màn không mất Core Bit đã nhặt và không cộng trùng.
 * Logic thuần.
 */
import type { WorldEvents } from '../world/world-types';
import {
  addRewards,
  completeStage,
  grantWeapon,
  recordBossDefeated,
  recordCheckpoint,
  recordSecret,
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

/** Phần WorldSetup lấy từ bản lưu cho màn `stageId` có boss `bossId`. */
export function stageSaveSetup(save: SaveData, stageId: string, bossId: string): StageSaveSetup {
  const progress = stageProgress(save, stageId);
  return {
    startCheckpoint: progress.checkpoint,
    ownedWeapons: [...save.character.weapons],
    takenSecrets: [...progress.secrets],
    bossDefeated: save.progress.bossesDefeated.includes(bossId),
  };
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
  ) {}

  /** Gọi sau mỗi bước logic. Trả về true nếu đã ghi. */
  step(ev: WorldEvents, run: RunTotals, dtSec: number): boolean {
    this.time += dtSec;
    const { stageId, bossId } = this;
    const changes: ((s: SaveData) => SaveData)[] = [];
    if (ev.checkpoint !== undefined) {
      const index = ev.checkpoint;
      changes.push((s) => recordCheckpoint(s, stageId, index));
    }
    if (ev.secretFound !== undefined) {
      const item = ev.secretFound;
      changes.push((s) => recordSecret(s, stageId, item));
    }
    if (ev.weaponGranted !== undefined) {
      const weapon = ev.weaponGranted;
      changes.push((s) => grantWeapon(s, weapon));
    }
    if (ev.bossDefeated) {
      changes.push((s) => completeStage(recordBossDefeated(s, bossId), stageId));
    }
    if (changes.length === 0) return false;
    return this.commit(run, changes);
  }

  /** Thoát màn (về menu, đóng trang): cộng EXP, Core Bit, thời gian chưa ghi. */
  exit(run: RunTotals): boolean {
    return this.commit(run, []);
  }

  private commit(run: RunTotals, changes: ((s: SaveData) => SaveData)[]): boolean {
    const gain = {
      exp: run.exp - this.banked.exp,
      coreBits: run.coreBits - this.banked.coreBits,
      playTimeSec: this.time - this.banked.time,
    };
    this.banked = { exp: run.exp, coreBits: run.coreBits, time: this.time };
    return this.manager.update((s) => changes.reduce((acc, f) => f(acc), addRewards(s, gain)));
  }
}
