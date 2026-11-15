/** Đầu vào và sự kiện của thế giới màn chơi (logic thuần). */
export interface WorldInput {
  moveX: number;
  moveY: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  dashPressed: boolean;
  downHeld: boolean;
  shootPressed: boolean;
  shootHeld: boolean;
  shootReleased: boolean;
  swapPrev: boolean;
  swapNext: boolean;
  /** Tùy chọn cảm ứng (chỉ bật khi đang dùng cảm ứng). */
  autoFire: boolean;
  aimAssist: boolean;
}

export const IDLE_INPUT: WorldInput = {
  moveX: 0,
  moveY: 0,
  jumpPressed: false,
  jumpHeld: false,
  dashPressed: false,
  downHeld: false,
  shootPressed: false,
  shootHeld: false,
  shootReleased: false,
  swapPrev: false,
  swapNext: false,
  autoFire: false,
  aimAssist: false,
};

export type WorldPhase = 'explore' | 'boss' | 'won';

/** Chuyện xảy ra trong bước vừa chạy, để scene phát âm thanh, rung, hiện chữ. */
export interface WorldEvents {
  fired: 'shot' | 'mid' | 'charged' | 'sweep' | undefined;
  emptyWeapon: boolean;
  swapped: boolean;
  hitTarget: boolean;
  blocked: boolean;
  /**
   * Đạn của Kai trúng boss đang bất tử đổi pha (QB-31): đạn mất, không sát thương. Tách khỏi
   * `blocked` (khiên) để hướng dẫn S06 không tính là thất bại.
   */
  bossImmune: boolean;
  shieldBroken: boolean;
  /** Phát phá khiên làm mòn khiên Lính Kén nhưng chưa vỡ. */
  shieldHit: boolean;
  hitEnemy: boolean;
  enemyKilled: boolean;
  /** Core Bit vừa nhặt, máu vừa hồi trong bước này. */
  coreBitGained: number;
  healed: number;
  hitBoss: boolean;
  weakHit: boolean;
  playerHurt: boolean;
  /** Nguồn đòn làm Kai mất máu trong bước này (`enemy:<id>`, `boss:<đòn>`, `spike`). */
  hurtBy: string | undefined;
  playerDied: boolean;
  /** Nguồn cú đánh cuối khi Kai chết (thêm `pit`); GDD 13 `death.cause`. */
  deathCause: string | undefined;
  respawned: boolean;
  gateClosed: boolean;
  bossPhaseChanged: boolean;
  bossLanded: boolean;
  bossDefeated: boolean;
  weaponGranted: string | undefined;
  /** M7: số thứ tự (từ 1) của checkpoint vừa chạm. */
  checkpoint: number | undefined;
  /** Rơi hố nhưng còn máu: mất máu và về checkpoint (không tính là chết). */
  fellInPit: boolean;
  /** Chạm gai: mất máu (nếu không bất tử) và về chỗ an toàn. */
  spikeHit: boolean;
  /** Phòng khóa vừa đóng cửa / vừa mở vì hạ hết kẻ địch. */
  roomLocked: boolean;
  roomCleared: boolean;
  /** Vật chắn (rễ khô) vừa vỡ. */
  barrierBroken: boolean;
  /** Vật phẩm bí mật vừa nhặt (id vật phẩm). */
  secretFound: string | undefined;
  /** M8: vừa lướt trên không (P1); lượt lướt trên không vừa hồi. */
  airDash: boolean;
  airDashRestored: boolean;
  /** M8: một viên đạn vừa sượt qua trong phần bất tử thêm (P3 bậc 3). */
  graze: boolean;
  /** M8 Vanguard: vụ nổ lan (tâm, bán kính px) và đạn nạp đầy trúng lúc mục tiêu đang hở. */
  burst: { x: number; y: number; r: number } | undefined;
  punishHit: boolean;
  /** M8 Core: khiên C3 vừa chặn một đòn (và vỡ); khiên vừa hồi xong. */
  kaiShieldAbsorbed: boolean;
  kaiShieldReady: boolean;
}

export function noWorldEvents(): WorldEvents {
  return {
    fired: undefined,
    emptyWeapon: false,
    swapped: false,
    hitTarget: false,
    blocked: false,
    bossImmune: false,
    shieldBroken: false,
    shieldHit: false,
    hitEnemy: false,
    enemyKilled: false,
    coreBitGained: 0,
    healed: 0,
    hitBoss: false,
    weakHit: false,
    playerHurt: false,
    hurtBy: undefined,
    playerDied: false,
    deathCause: undefined,
    respawned: false,
    gateClosed: false,
    bossPhaseChanged: false,
    bossLanded: false,
    bossDefeated: false,
    weaponGranted: undefined,
    checkpoint: undefined,
    fellInPit: false,
    spikeHit: false,
    roomLocked: false,
    roomCleared: false,
    barrierBroken: false,
    secretFound: undefined,
    airDash: false,
    airDashRestored: false,
    graze: false,
    burst: undefined,
    punishHit: false,
    kaiShieldAbsorbed: false,
    kaiShieldReady: false,
  };
}
