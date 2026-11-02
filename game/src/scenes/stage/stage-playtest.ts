import Phaser from 'phaser';
import { TILE_SIZE } from '../../core/constants';
import { TUNE } from '../../debug/flags';
import { LocalStorageStore } from '../../input/browser-store';
import type { InputService } from '../../input/input-service';
import { PlaytestRecorder, sectionAt } from '../../logic/playtest/recorder';
import { PLAYTEST_MIN_SEC, saveSession } from '../../logic/playtest/summary';
import type { TuningData } from '../../logic/playtest/tuning';
import type { StageWorld } from '../../logic/world/stage-world';
import type { WorldEvents } from '../../logic/world/world-types';
import { showRatingPanel } from '../../playtest/rating-panel';
import { loadTuning, showTuningPanel } from '../../playtest/tuning-panel';
import { GRAY_BOX_SECTIONS } from '../../stages/gray-box';

/** Lưu nhật ký định kỳ để phiên vẫn còn nếu trình duyệt bị tắt ngang. */
const SAVE_EVERY_SEC = 5;
/** Hỏi phiếu chấm điểm sau khi thông báo nhận vũ khí đã hiện xong. */
const RATING_DELAY_MS = 4800;

/** Thông số đã chỉnh trên máy này (chỉ khi bật ?tune=1 hoặc bản dev); không bật thì là dữ liệu gốc. */
export function tunedData(base: TuningData): TuningData {
  return TUNE ? loadTuning(new LocalStorageStore(), base) : base;
}

/**
 * Công cụ cổng Prototype gắn vào màn thử: ghi nhật ký chơi thử, hỏi phiếu chấm sau lần thắng
 * boss đầu tiên của phiên, và nút/phím F2 mở bảng chỉnh cảm giác. Khi bảng HTML đang mở thì
 * `paused` bật: scene ngừng chạy bước logic, ẩn nút cảm ứng và chặn chạm vào canvas.
 */
export class StagePlaytest {
  private readonly store = new LocalStorageStore();
  private readonly recorder = new PlaytestRecorder(
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    Date.now(),
    GRAY_BOX_SECTIONS.map((s) => s.id),
  );
  private sinceSave = 0;
  private modal = false;
  private ratingAsked = false;
  private button: HTMLButtonElement | undefined;
  private readonly onHidden = (): void => {
    if (document.hidden) this.save();
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: StageWorld,
    private readonly input: InputService,
    private readonly base: TuningData,
    /** Ghi nhật ký và hỏi phiếu chấm (chỉ màn xám của cổng Prototype); bảng chỉnh vẫn dùng được. */
    private readonly recording: boolean,
  ) {
    if (TUNE) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cv-tune-button';
      button.textContent = 'Chỉnh';
      button.title = 'Chỉnh cảm giác (F2)';
      button.addEventListener('click', () => this.openTuning());
      document.body.append(button);
      this.button = button;
      scene.input.keyboard?.on('keydown-F2', () => this.openTuning());
    }
    document.addEventListener('visibilitychange', this.onHidden);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.dispose());
  }

  get paused(): boolean {
    return this.modal;
  }

  /** Gọi sau mỗi bước logic với sự kiện của bước đó. */
  record(ev: WorldEvents, dt: number): void {
    if (!this.recording) return;
    const world = this.world;
    const section = sectionAt(GRAY_BOX_SECTIONS, Math.floor(world.player.centerX / TILE_SIZE));
    if (ev.playerDied) this.recorder.death(section);
    this.recorder.step(this.input.device, section, dt);
    if (ev.gateClosed || (ev.respawned && world.phase === 'boss')) this.recorder.bossStart();
    if (ev.bossDefeated) {
      this.recorder.bossWin();
      this.save();
      if (!this.ratingAsked) {
        this.ratingAsked = true;
        this.scene.time.delayedCall(RATING_DELAY_MS, () => this.askRating());
      }
    }
    this.sinceSave += dt;
    if (this.sinceSave >= SAVE_EVERY_SEC) this.save();
  }

  private askRating(): void {
    if (this.modal) return;
    this.openModal((done) =>
      showRatingPanel((ratings) => {
        if (ratings) this.recorder.rate(ratings);
        this.save();
        done();
      }),
    );
  }

  private openTuning(): void {
    if (this.modal) return;
    this.openModal((done) =>
      showTuningPanel(this.store, this.base, this.world.tuning, (data) => {
        this.world.retune(data);
        done();
      }),
    );
  }

  /** Dừng trận, mở một bảng HTML; bảng gọi `done` khi đóng thì chơi tiếp. */
  private openModal(show: (done: () => void) => void): void {
    this.modal = true;
    this.input.setGameplayActive(false);
    this.scene.input.enabled = false;
    show(() => {
      if (!this.scene.sys.isActive()) return;
      this.modal = false;
      this.scene.input.enabled = true;
      this.input.setGameplayActive(true);
      // Bỏ các lần bấm dồn lại lúc bảng mở (ví dụ Esc) để không lọt vào trận.
      this.input.step();
    });
  }

  private save(): void {
    this.sinceSave = 0;
    if (this.recording && this.recorder.session.durationSec >= PLAYTEST_MIN_SEC) {
      saveSession(this.store, this.recorder.session);
    }
  }

  private dispose(): void {
    this.save();
    document.removeEventListener('visibilitychange', this.onHidden);
    this.button?.remove();
    // Rời màn khi bảng còn mở (ví dụ đóng tab trên điện thoại rồi mở lại): gỡ bảng đi.
    for (const panel of document.querySelectorAll('.cv-panel')) panel.remove();
  }
}
