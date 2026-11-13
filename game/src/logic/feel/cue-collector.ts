import type { CueId } from '../../core/feedback-config';
import type { PlayerEvents } from '../player/player-types';
import type { WorldEvents } from '../world/world-types';

/** Phần của màn chơi mà bộ gom cue cần đọc (StageWorld thỏa sẵn). */
export interface CueWorld {
  readonly player: { readonly events: PlayerEvents };
  readonly loadout: { readonly chargeLevel: number };
  readonly boss?: { readonly state: string } | undefined;
}

/**
 * Đổi sự kiện của một bước logic thành danh sách cue phản hồi (âm thanh, hạt, co giãn).
 * Logic thuần. Mảng trả về được dùng lại giữa các bước (không cấp phát mỗi bước): đọc xong
 * trong cùng bước, không giữ lại.
 */
export class CueCollector {
  private readonly out: CueId[] = [];
  private prevPlayerEvents: PlayerEvents | undefined;
  private prevCharge = 0;
  private prevBossState: string | undefined;

  collect(world: CueWorld, ev: WorldEvents): readonly CueId[] {
    const out = this.out;
    out.length = 0;

    // Khi hit-stop, nhân vật không chạy bước mới nên sự kiện cũ còn nguyên: không phát lại.
    const pe = world.player.events;
    if (pe !== this.prevPlayerEvents) {
      this.prevPlayerEvents = pe;
      if (pe.wallJumped) out.push('wallJump');
      else if (pe.jumped) out.push('jump');
      if (pe.landed) out.push('land');
      if (pe.dashed) out.push('dash');
    }

    if (ev.fired === 'shot') out.push('shot');
    else if (ev.fired === 'mid') out.push('shotMid');
    else if (ev.fired === 'charged') out.push('shotCharged');
    else if (ev.fired === 'sweep') out.push('sweep');
    const charge = world.loadout.chargeLevel;
    if (charge > this.prevCharge) out.push(charge >= 2 ? 'chargeFull' : 'chargeMid');
    this.prevCharge = charge;
    if (ev.emptyWeapon) out.push('emptyWeapon');
    if (ev.swapped) out.push('swap');

    // Một bước chỉ một âm trúng đòn: ưu tiên điểm yếu, rồi boss, rồi mục tiêu thường.
    if (ev.weakHit) out.push('weakHit');
    else if (ev.hitBoss) out.push('hitBoss');
    else if (ev.hitEnemy || ev.hitTarget || ev.shieldHit) out.push('hit');
    if (ev.shieldBroken) out.push('shieldBroken');
    else if (ev.blocked) out.push('blocked');
    if (ev.enemyKilled) out.push('enemyKilled');

    if (ev.playerDied) out.push('died');
    else if (ev.playerHurt) out.push('hurt');
    if (ev.respawned) out.push('respawn');
    if (ev.coreBitGained > 0) out.push('coreBit');
    if (ev.healed > 0) out.push('heal');
    if (ev.checkpoint !== undefined) out.push('checkpoint');
    if (ev.secretFound !== undefined) out.push('secret');
    if (ev.roomLocked) out.push('roomLocked');
    if (ev.roomCleared) out.push('roomCleared');
    if (ev.barrierBroken) out.push('barrierBroken');

    if (ev.gateClosed) out.push('bossGate');
    const bossState = world.boss?.state;
    if (bossState === 'telegraph' && this.prevBossState !== 'telegraph') out.push('bossTelegraph');
    this.prevBossState = bossState;
    if (ev.bossDefeated) out.push('bossDefeated');
    else if (ev.bossPhaseChanged) out.push('bossPhase');
    if (ev.bossLanded) out.push('bossLanded');
    if (ev.weaponGranted !== undefined) out.push('weaponGranted');
    return out;
  }
}
