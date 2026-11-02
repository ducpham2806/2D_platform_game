import type { PlayerData } from '../../core/player-config';

/**
 * Đổi số liệu thiết kế (ô, giây) trong player.json thành tham số vật lý (px, px/s, px/s²).
 * Trọng lực suy ra từ độ cao nhảy tối đa và thời gian lên đỉnh, nên độ cao nhảy luôn đúng GDD
 * dù chỉnh apexSec để đổi cảm giác.
 */
export interface PlayerParams {
  tileSize: number;
  width: number;
  height: number;
  runSpeed: number;
  gravity: number;
  fallGravityMul: number;
  maxFallSpeed: number;
  jumpSpeed: number;
  /** Thả nút nhảy khi còn đang lên nhanh hơn mức này thì cắt về mức này (nhảy thấp). */
  jumpCutSpeed: number;
  coyoteSec: number;
  bufferSec: number;
  dashSpeed: number;
  dashSec: number;
  dashCooldownSec: number;
  dashIFrameSec: number;
  wallSlideSpeed: number;
  wallJumpPush: number;
  wallJumpLockSec: number;
  iFramesAfterHitSec: number;
  hurtStunSec: number;
  knockbackX: number;
  knockbackY: number;
  airDash: boolean;
  wallJump: boolean;
  dashJump: boolean;
}

export function playerParams(data: PlayerData, tileSize: number, stepSec: number): PlayerParams {
  const maxHeight = data.jump.maxTiles * tileSize;
  const minHeight = data.jump.minTiles * tileSize;
  const t = data.jump.apexSec;
  const gravity = (2 * maxHeight) / (t * t);
  const jumpSpeed = (2 * maxHeight) / t;
  // Chạm nhanh nhất cũng giữ nút ít nhất một bước, nên trừ quãng lên của bước đầu
  // để độ cao nhảy ngắn nhất vẫn ≈ minTiles.
  const cutHeight = Math.max(0, minHeight - jumpSpeed * stepSec);
  return {
    tileSize,
    width: data.hitboxPx.width,
    height: data.hitboxPx.height,
    runSpeed: data.speedTilesPerSec * tileSize,
    gravity,
    fallGravityMul: data.jump.fallGravityMul,
    maxFallSpeed: data.jump.maxFallTilesPerSec * tileSize,
    jumpSpeed,
    jumpCutSpeed: Math.sqrt(2 * gravity * cutHeight),
    coyoteSec: data.jump.coyoteSec,
    bufferSec: data.jump.bufferSec,
    dashSpeed: (data.dash.tiles * tileSize) / data.dash.durationSec,
    dashSec: data.dash.durationSec,
    dashCooldownSec: data.dash.cooldownSec,
    dashIFrameSec: data.dash.iFrameSec,
    wallSlideSpeed: data.wallSlideTilesPerSec * tileSize,
    wallJumpPush: data.wallJump.pushTilesPerSec * tileSize,
    wallJumpLockSec: data.wallJump.lockSec,
    iFramesAfterHitSec: data.iFramesAfterHitSec,
    hurtStunSec: data.hurt.stunSec,
    knockbackX: data.hurt.knockbackTilesPerSec.x * tileSize,
    knockbackY: data.hurt.knockbackTilesPerSec.y * tileSize,
    airDash: data.abilities.airDash,
    wallJump: data.abilities.wallJump,
    dashJump: data.abilities.dashJump,
  };
}
