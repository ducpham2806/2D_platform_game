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
  /** Số lần lướt trên không mỗi lần rời đất (kỹ năng P1); `airDash` của dữ liệu = không giới hạn. */
  airDashes: number;
  /** Rời tường chừng này giây vẫn nhảy tường được (P2 bậc 2). */
  wallJumpGraceSec: number;
  /** Bất tử thêm chỉ với đạn ở đầu cú lướt (P3), cộng sau phần bất tử gốc. */
  bulletIFrameExtraSec: number;
}

/** Phần thông số vật lý do build kỹ năng (M8) quyết định. */
export interface PlayerMods {
  airDashes: number;
  wallJumpGraceSec: number;
  bulletIFrameExtraSec: number;
}

export const NO_PLAYER_MODS: PlayerMods = {
  airDashes: 0,
  wallJumpGraceSec: 0,
  bulletIFrameExtraSec: 0,
};

export function playerParams(
  data: PlayerData,
  tileSize: number,
  stepSec: number,
  mods: PlayerMods = NO_PLAYER_MODS,
): PlayerParams {
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
    airDashes: data.abilities.airDash ? Infinity : mods.airDashes,
    wallJumpGraceSec: mods.wallJumpGraceSec,
    bulletIFrameExtraSec: mods.bulletIFrameExtraSec,
  };
}
