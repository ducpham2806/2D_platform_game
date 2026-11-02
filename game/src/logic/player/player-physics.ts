import type { TileMap } from '../tilemap';
import { type Box, groundBelow, moveX, moveY, wallBeside } from './collision';
import type { PlayerParams } from './player-params';
import {
  noEvents,
  type PlayerEvents,
  type PlayerInput,
  type PlayerStateName,
} from './player-types';

export {
  NO_INPUT,
  type PlayerEvents,
  type PlayerInput,
  type PlayerStateName,
} from './player-types';

/** Trừ thời gian; còn dưới 1 micro giây thì coi như hết (tránh sai số dấu phẩy động). */
function tick(timer: number, dt: number): number {
  const next = timer - dt;
  return next <= 1e-6 ? 0 : next;
}

/** Thời gian bỏ qua bục một chiều sau khi bấm Xuống + Nhảy để rơi xuyên qua. */
const DROP_THROUGH_SEC = 0.2;

/**
 * Vật lý và máy trạng thái của Kai (GDD 5.1, player.json). Logic thuần, bước cố định.
 * Thứ tự mỗi bước: đếm giờ → lướt → di chuyển ngang → nhảy → trọng lực → va chạm → trạng thái.
 */
export class PlayerPhysics {
  readonly box: Box;
  vx = 0;
  vy = 0;
  facing: 1 | -1 = 1;
  hp: number;
  state: PlayerStateName = 'idle';
  grounded = false;
  wallDir = 0;
  events: PlayerEvents = noEvents();

  private coyote = 0;
  private buffer = 0;
  private jumping = false;
  private dashTime = 0;
  private dashActive = false;
  private dashDir: 1 | -1 = 1;
  private dashCooldown = 0;
  private dashCarry = false;
  private wallLock = 0;
  private iFrames = 0;
  private dashIFrames = 0;
  private hurtTime = 0;
  private dropThrough = 0;
  private wallJumpedThisStep = false;

  constructor(
    private readonly params: PlayerParams,
    private readonly map: TileMap,
    spawnX: number,
    spawnBottom: number,
    readonly maxHp: number,
  ) {
    this.box = { x: 0, y: 0, w: params.width, h: params.height };
    this.hp = maxHp;
    this.respawn(spawnX, spawnBottom);
  }

  /** Đặt Kai đứng tại (giữa, đáy) và xóa mọi trạng thái tạm. */
  respawn(centerX: number, bottom: number, hp = this.maxHp): void {
    this.box.x = centerX - this.box.w / 2;
    this.box.y = bottom - this.box.h;
    this.vx = 0;
    this.vy = 0;
    this.hp = hp;
    this.coyote = 0;
    this.buffer = 0;
    this.jumping = false;
    this.dashTime = 0;
    this.dashActive = false;
    this.dashCooldown = 0;
    this.dashCarry = false;
    this.wallLock = 0;
    this.iFrames = 0;
    this.dashIFrames = 0;
    this.hurtTime = 0;
    this.dropThrough = 0;
    this.grounded = groundBelow(this.box, this.map) !== undefined;
    this.state = 'idle';
  }

  get centerX(): number {
    return this.box.x + this.box.w / 2;
  }

  get bottom(): number {
    return this.box.y + this.box.h;
  }

  get dashing(): boolean {
    return this.dashTime > 0;
  }

  get invulnerable(): boolean {
    return this.iFrames > 0 || this.dashIFrames > 0 || this.state === 'dead';
  }

  /** Còn bất tử sau khi bị đánh (để nhấp nháy). */
  get blinking(): boolean {
    return this.iFrames > 0;
  }

  /** Nhận sát thương từ một nguồn ở tọa độ X. Trả về false nếu đang bất tử. */
  applyHit(damage: number, sourceX: number): boolean {
    if (this.invulnerable) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.events.hurt = true;
    this.endDash();
    this.dashCarry = false;
    this.jumping = false;
    const away: 1 | -1 = sourceX > this.centerX ? -1 : 1;
    if (this.hp <= 0) {
      this.state = 'dead';
      this.events.died = true;
      this.vx = 0;
      return true;
    }
    this.vx = away * this.params.knockbackX;
    this.vy = -this.params.knockbackY;
    this.hurtTime = this.params.hurtStunSec;
    this.iFrames = this.params.iFramesAfterHitSec;
    return true;
  }

  step(input: PlayerInput, dt: number): PlayerEvents {
    const p = this.params;
    // Sự kiện của applyHit gọi giữa hai bước được giữ lại cho bước này.
    const carried = this.events;
    this.events = { ...noEvents(), hurt: carried.hurt, died: carried.died };
    this.wallJumpedThisStep = false;
    const wasGrounded = this.grounded;

    this.buffer = tick(this.buffer, dt);
    this.dashCooldown = tick(this.dashCooldown, dt);
    this.wallLock = tick(this.wallLock, dt);
    this.iFrames = tick(this.iFrames, dt);
    this.dashIFrames = tick(this.dashIFrames, dt);
    this.hurtTime = tick(this.hurtTime, dt);
    this.dropThrough = tick(this.dropThrough, dt);

    if (this.state === 'dead') {
      const vyBefore = this.vy;
      this.applyGravity(dt, false);
      this.moveBody(dt, vyBefore);
      return this.events;
    }

    const control = this.hurtTime <= 0;
    const dir = input.moveX > 0 ? 1 : input.moveX < 0 ? -1 : 0;
    if (control && input.jumpPressed) this.buffer = p.bufferSec;

    // Lướt.
    if (
      control &&
      input.dashPressed &&
      !this.dashing &&
      this.dashCooldown <= 0 &&
      (this.grounded || p.airDash)
    ) {
      this.dashTime = p.dashSec;
      this.dashActive = true;
      this.dashDir = dir !== 0 ? dir : this.facing;
      this.facing = this.dashDir;
      this.dashIFrames = p.dashIFrameSec;
      this.dashCarry = false;
      this.vy = 0;
      this.events.dashed = true;
    }

    // Di chuyển ngang.
    if (this.dashing) {
      this.vx = this.dashDir * p.dashSpeed;
    } else if (control && this.wallLock <= 0) {
      const speed = this.dashCarry ? p.dashSpeed : p.runSpeed;
      this.vx = dir * speed;
      if (dir !== 0) this.facing = dir;
    }

    // Nhảy, rơi xuyên bục, nhảy tường.
    if (control && this.buffer > 0) this.tryJump(input);
    // Coyote trừ SAU khi xét nhảy: bước rời gờ đầu tiên vẫn còn đủ coyoteSec.
    if (!this.grounded) this.coyote = tick(this.coyote, dt);

    // Nhảy biến thiên: thả nút khi còn lên nhanh thì cắt vận tốc.
    if (this.jumping && !input.jumpHeld && this.vy < -p.jumpCutSpeed) {
      this.vy = -p.jumpCutSpeed;
      this.jumping = false;
    }
    if (this.vy >= 0) this.jumping = false;

    const sliding =
      p.wallJump &&
      !this.grounded &&
      !this.dashing &&
      this.vy >= 0 &&
      this.wallDir !== 0 &&
      dir === this.wallDir;
    const vyBefore = this.vy;
    this.applyGravity(dt, sliding);
    this.moveBody(dt, vyBefore);

    if (this.dashing) {
      this.dashTime = tick(this.dashTime, dt);
      if (this.dashTime <= 0) this.endDash();
    }

    if (this.grounded) {
      this.coyote = p.coyoteSec;
      this.dashCarry = false;
      if (!wasGrounded) this.events.landed = true;
    }
    this.wallDir = this.grounded ? 0 : wallBeside(this.box, this.map);
    if (this.box.y > this.map.heightPx) this.events.fellOut = true;
    this.state = this.deriveState(dir);
    // Chạm tường lúc đang rơi nhanh: hãm ngay trong bước này, không đợi bước sau.
    if (this.state === 'wall_slide') this.vy = Math.min(this.vy, p.wallSlideSpeed);
    return this.events;
  }

  private tryJump(input: PlayerInput): void {
    const p = this.params;
    if (this.grounded && input.downHeld && groundBelow(this.box, this.map) === 'oneWay') {
      this.dropThrough = DROP_THROUGH_SEC;
      this.grounded = false;
      this.buffer = 0;
      this.coyote = 0;
      return;
    }
    if (this.grounded || this.coyote > 0) {
      if (this.dashing && p.dashJump) this.dashCarry = true;
      this.endDash();
      this.vy = -p.jumpSpeed;
      this.jumping = true;
      this.grounded = false;
      this.buffer = 0;
      this.coyote = 0;
      this.events.jumped = true;
      return;
    }
    const wall = this.wallDir !== 0 ? this.wallDir : wallBeside(this.box, this.map);
    if (p.wallJump && wall !== 0) {
      this.endDash();
      this.vy = -p.jumpSpeed;
      this.vx = -wall * p.wallJumpPush;
      this.facing = wall > 0 ? -1 : 1;
      this.wallLock = p.wallJumpLockSec;
      this.jumping = true;
      this.buffer = 0;
      this.dashCarry = false;
      this.events.jumped = true;
      this.events.wallJumped = true;
      this.wallJumpedThisStep = true;
    }
  }

  /** Kết thúc lướt (hết giờ, đụng tường, nhảy, bị đánh); hồi chiêu tính từ lúc lướt xong. */
  private endDash(): void {
    if (this.dashActive) this.dashCooldown = this.params.dashCooldownSec;
    this.dashActive = false;
    this.dashTime = 0;
  }

  private applyGravity(dt: number, sliding: boolean): void {
    const p = this.params;
    if (this.dashing) return;
    const g = this.vy < 0 ? p.gravity : p.gravity * p.fallGravityMul;
    this.vy += g * dt;
    this.vy = Math.min(this.vy, sliding ? p.wallSlideSpeed : p.maxFallSpeed);
  }

  /**
   * Dời theo vận tốc trung bình của bước (thay vì vận tốc cuối bước) để quỹ đạo nhảy khớp
   * công thức: độ cao tối đa đúng maxTiles thay vì hụt nửa bước mỗi khung.
   */
  private moveBody(dt: number, vyBefore: number): void {
    const hitX = moveX(this.box, this.vx * dt, this.map);
    if (hitX !== 0) {
      this.vx = 0;
      if (this.dashing) this.endDash();
    }
    const hitY = moveY(this.box, ((vyBefore + this.vy) / 2) * dt, this.map, this.dropThrough > 0);
    if (hitY !== 0) this.vy = 0;
    if (hitY === -1) this.jumping = false;
    this.grounded =
      this.vy >= 0 && this.dropThrough <= 0 && groundBelow(this.box, this.map) !== undefined;
  }

  private deriveState(dir: number): PlayerStateName {
    if (this.hp <= 0) return 'dead';
    if (this.hurtTime > 0) return 'hurt';
    if (this.dashing) return 'dash';
    if (this.wallJumpedThisStep) return 'wall_jump';
    if (!this.grounded) {
      if (this.vy >= 0 && this.wallDir !== 0 && dir === this.wallDir && this.params.wallJump)
        return 'wall_slide';
      return this.vy < 0 ? 'jump_up' : 'jump_fall';
    }
    if (this.events.landed) return 'land';
    return this.vx !== 0 ? 'run' : 'idle';
  }
}
