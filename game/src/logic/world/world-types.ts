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
  playerDied: boolean;
  respawned: boolean;
  gateClosed: boolean;
  bossPhaseChanged: boolean;
  bossLanded: boolean;
  bossDefeated: boolean;
  weaponGranted: string | undefined;
}

export function noWorldEvents(): WorldEvents {
  return {
    fired: undefined,
    emptyWeapon: false,
    swapped: false,
    hitTarget: false,
    blocked: false,
    shieldBroken: false,
    shieldHit: false,
    hitEnemy: false,
    enemyKilled: false,
    coreBitGained: 0,
    healed: 0,
    hitBoss: false,
    weakHit: false,
    playerHurt: false,
    playerDied: false,
    respawned: false,
    gateClosed: false,
    bossPhaseChanged: false,
    bossLanded: false,
    bossDefeated: false,
    weaponGranted: undefined,
  };
}
