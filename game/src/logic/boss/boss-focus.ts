import type { FocusAttack } from '../../core/boss-config';
import type { Box } from '../player/collision';

export interface FocusMark {
  x: number;
  y: number;
  radius: number;
  phase: 'track' | 'lock' | 'burn';
}

interface ScheduledMark extends FocusMark {
  id: number;
  hitConsumed: boolean;
  start: number;
  lockAt: number;
  burnAt: number;
  expiresAt: number;
  sampled: boolean;
}

const EPS = 1e-9;

/** Tiêu Điểm: bám tâm Kai, khóa vị trí, rồi đốt đúng vòng đã báo. */
export class BossFocus {
  private readonly scheduled: ScheduledMark[] = [];
  private readonly visible: ScheduledMark[] = [];
  private elapsed = 0;
  private end = 0;
  private finished = true;

  /** Khung nhìn chỉ đọc; thay đổi theo mỗi bước, không giữ làm ảnh chụp lịch sử. */
  get marks(): readonly Readonly<FocusMark>[] {
    return this.visible;
  }

  get done(): boolean {
    return this.finished;
  }

  begin(attack: FocusAttack, tileSize: number, speedMul: number, minTelegraphSec: number): void {
    this.clear();
    const radius = attack.radiusTiles * tileSize;
    const interval = attack.markIntervalSec / speedMul;
    const track = attack.trackSec / speedMul;
    const lock = Math.max(minTelegraphSec, attack.lockSec / speedMul);
    for (let i = 0; i < attack.count; i += 1) {
      const start = i * interval;
      const lockAt = start + track;
      const burnAt = lockAt + lock;
      const expiresAt = burnAt + attack.activeSec;
      this.scheduled.push({
        id: i,
        hitConsumed: false,
        x: 0,
        y: 0,
        radius,
        phase: 'track',
        start,
        lockAt,
        burnAt,
        expiresAt,
        sampled: false,
      });
      this.end = expiresAt;
    }
    this.finished = this.scheduled.length === 0;
  }

  step(playerX: number, playerY: number, dt: number): void {
    if (this.finished) return;
    const previous = this.elapsed;
    this.elapsed += dt;
    let count = 0;
    for (const mark of this.scheduled) {
      if (this.elapsed + EPS < mark.start) break;
      if (this.elapsed + EPS >= mark.expiresAt) continue;
      // Dùng mẫu của bước chứa mốc khóa, kể cả lúc Kai đang ở trên không.
      if (!mark.sampled || previous + EPS < mark.lockAt) {
        mark.x = playerX;
        mark.y = playerY;
        mark.sampled = true;
      }
      mark.phase =
        this.elapsed + EPS >= mark.burnAt
          ? 'burn'
          : this.elapsed + EPS >= mark.lockAt
            ? 'lock'
            : 'track';
      this.visible[count] = mark;
      count += 1;
    }
    this.visible.length = count;
    this.finished = this.elapsed + EPS >= this.end;
  }

  clear(): void {
    this.scheduled.length = 0;
    this.visible.length = 0;
    this.elapsed = 0;
    this.end = 0;
    this.finished = true;
  }

  hit(box: Box): boolean {
    for (const mark of this.visible) if (this.intersectsBurn(mark, box)) return true;
    return false;
  }

  /** Không lấy dấu trúng nếu đòn bị né hoặc Kai đang bất tử. */
  pendingHit(box: Box): Readonly<{ id: number; x: number }> | undefined {
    for (const mark of this.visible) {
      if (!mark.hitConsumed && this.intersectsBurn(mark, box)) return mark;
    }
    return undefined;
  }

  consumeHit(id: number): void {
    const mark = this.scheduled[id];
    if (mark?.phase === 'burn' && this.elapsed + EPS < mark.expiresAt) mark.hitConsumed = true;
  }

  private intersectsBurn(mark: FocusMark, box: Box): boolean {
    if (mark.phase !== 'burn') return false;
    const dx = Math.max(box.x - mark.x, 0, mark.x - (box.x + box.w));
    const dy = Math.max(box.y - mark.y, 0, mark.y - (box.y + box.h));
    return dx * dx + dy * dy < mark.radius * mark.radius;
  }
}
