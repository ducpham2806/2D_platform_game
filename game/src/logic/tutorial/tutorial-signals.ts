/**
 * Đổi trạng thái và sự kiện của StageWorld trong một bước logic thành tập tín hiệu cho
 * TutorialManager (danh sách tín hiệu: core/tutorial-config.ts). Logic thuần.
 */
import type { StageWorld } from '../world/stage-world';
import type { WorldEvents } from '../world/world-types';

export interface SignalFrame {
  signals: Set<string>;
  /** Quãng Kai đi theo chiều ngang trong bước (ô; dương = sang phải; 0 khi bị dịch chuyển). */
  moveTiles: number;
}

export class TutorialSignals {
  private first = true;
  private prevX: number | undefined;
  private prevState = '';
  private prevOnPlatform = false;
  private prevSection: string | undefined;

  constructor(private readonly nearTiles: number) {}

  collect(world: StageWorld, ev: WorldEvents): SignalFrame {
    const s = new Set<string>();
    const pl = world.player;
    const t = world.map.tileSize;
    if (this.first) s.add('start');
    this.first = false;

    // Đi bộ: bỏ qua bước bị dịch chuyển (hồi sinh, về chỗ an toàn) để không tính là đi.
    const dx = this.prevX === undefined ? 0 : pl.centerX - this.prevX;
    const moveTiles = Math.abs(dx) < t ? dx / t : 0;
    this.prevX = pl.centerX;

    const state = pl.state;
    if (state !== this.prevState) {
      if (state === 'jump_up' && this.prevState !== 'wall_slide') s.add('jump');
      if (state === 'dash') s.add('dash');
      if (state === 'wall_slide') s.add('wallSlide');
      if (state === 'wall_jump') s.add('wallJump');
    }
    this.prevState = state;
    const onPlatform = pl.onPlatform;
    if (onPlatform && !this.prevOnPlatform) s.add('vine');
    this.prevOnPlatform = onPlatform;

    const col = Math.floor(pl.centerX / t);
    let section: string | undefined;
    for (const sec of world.layout.sections) if (col >= sec.fromCol) section = sec.id;
    if (section !== undefined && section !== this.prevSection) s.add(`section:${section}`);
    this.prevSection = section;

    for (const e of world.field?.enemies ?? []) {
      if (e.alive && Math.abs(e.centerX - pl.centerX) <= this.nearTiles * t)
        s.add(`near:${e.data.id}`);
    }

    if (ev.fired) {
      s.add('fire');
      s.add(`fire:${ev.fired}`);
      if (world.loadout.current.kind !== 'buster') s.add('fireWarden');
    }
    if (ev.swapped) s.add('swap');
    if (ev.checkpoint !== undefined) s.add('checkpoint');
    if (ev.enemyKilled) s.add('kill');
    if (ev.roomLocked) {
      s.add('roomLocked');
      for (const kind of world.lockedRoom?.kinds ?? []) s.add(`roomLocked:${kind}`);
    }
    if (ev.roomCleared) s.add('roomCleared');
    if (ev.secretFound !== undefined) s.add('secret');
    if (ev.spikeHit) s.add('spike');
    if (ev.fellInPit) s.add('pit');
    if (ev.playerDied) s.add('death');
    if (ev.healed > 0) s.add('heal');
    if (ev.playerHurt) s.add('hurt');
    if (ev.blocked) s.add('shieldBlocked');
    if (ev.shieldBroken) s.add('shieldBroken');
    if (ev.barrierBroken) s.add('barrierBroken');
    if (ev.gateClosed) s.add('bossGate');
    if (ev.bossPhaseChanged) s.add('bossPhase');
    if (ev.bossDefeated) s.add('bossDefeated');
    if (ev.weaponGranted !== undefined) s.add('weaponGranted');
    return { signals: s, moveTiles };
  }
}
