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
 * Bệ di động (dây leo đu...): mặt trên là một bục một chiều rộng `w` ở (x, y). `dx`, `dy` là
 * quãng bệ vừa đi trong bước này, để chở người đứng trên. Nhảy khỏi bệ cộng `jumpBonus` lực nhảy.
 */
export interface Platform {
  x: number;
  y: number;
  w: number;
  dx: number;
  dy: number;
  jumpBonus: number;
}

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
  /** Bất tử chỉ với đạn (P3): gốc + phần thêm, mất phần thêm khi cú lướt kết thúc/bị hủy. */
  private bulletIFrames = 0;
  /** Lượt lướt trên không còn lại (P1). */
  airDashesLeft = 0;
  /** Ân hạn nhảy tường (P2 bậc 2): thời gian còn lại và hướng tường vừa rời. */
  private wallGrace = 0;
  private lastWallDir = 0;
  private hurtTime = 0;
  private dropThrough = 0;
  private wallJumpedThisStep = false;
  /** Bệ đang đứng trên (nếu có). */
  private riding: Platform | undefined;
  /** Các bệ di động của màn; thế giới cập nhật vị trí trước mỗi bước. */
  platforms: readonly Platform[] = [];

  /** Máu tối đa theo cấp hiệu dụng (M8 đổi khi lên cấp giữa màn). */
  maxHp: number;

  constructor(
    private params: PlayerParams,
    private readonly map: TileMap,
    spawnX: number,
    spawnBottom: number,
    maxHp: number,
  ) {
    this.maxHp = maxHp;
    this.box = { x: 0, y: 0, w: params.width, h: params.height };
    this.hp = maxHp;
    this.respawn(spawnX, spawnBottom);
  }

  /** Đổi máu tối đa (lên cấp): máu hiện tại tăng/giảm cùng phần chênh, không dưới 1 khi còn sống. */
  setMaxHp(maxHp: number): void {
    const delta = maxHp - this.maxHp;
    this.maxHp = maxHp;
    if (this.hp > 0) this.hp = Math.max(1, Math.min(maxHp, this.hp + delta));
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
    this.bulletIFrames = 0;
    this.airDashesLeft = this.params.airDashes;
    this.wallGrace = 0;
    this.lastWallDir = 0;
    this.hurtTime = 0;
    this.dropThrough = 0;
    this.riding = undefined;
    // Sự kiện cũ (nhất là "chết") không được mang sang sau khi hồi sinh, nếu không bước đầu
    // tiên sau hồi sinh lại báo chết và Kai chết lặp mãi.
    this.events = noEvents();
    this.grounded = groundBelow(this.box, this.map) !== undefined;
    this.state = 'idle';
  }

  /** Đang đứng trên bệ di động (không tính chỗ đứng an toàn khi chạm gai). */
  get onPlatform(): boolean {
    return this.riding !== undefined;
  }

  /**
   * Chạm gai (đặc tả Stage 1 mục 3): mất `damage` máu (trừ khi đang bất tử sau cú đánh trước;
   * bất tử của lướt không cứu), rồi về chỗ (x giữa, đáy) an toàn và bất tử như khi bị đánh.
   * Hết máu thì chết tại chỗ. Trả về true nếu mất máu.
   */
  hitHazard(damage: number, safeX: number, safeBottom: number): boolean {
    if (this.state === 'dead') return false;
    const hurt = this.iFrames <= 0 && damage > 0;
    if (hurt) {
      this.hp = Math.max(0, this.hp - damage);
      this.events.hurt = true;
    }
    if (this.hp <= 0) {
      this.state = 'dead';
      this.events.died = true;
      this.vx = 0;
      this.riding = undefined;
      return hurt;
    }
    const iFrames = Math.max(this.iFrames, this.params.iFramesAfterHitSec);
    this.respawn(safeX, safeBottom, this.hp);
    this.iFrames = iFrames;
    return hurt;
  }

  /** Đổi thông số vật lý khi đang chơi (bảng chỉnh cảm giác). Hộp va chạm giữ nguyên. */
  setParams(params: PlayerParams): void {
    if (params.airDashes !== this.params.airDashes) this.airDashesLeft = params.airDashes;
    this.params = params;
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

  /** Đang bất tử với đạn (gốc của cú lướt hoặc phần thêm của P3). */
  get bulletGuard(): boolean {
    return this.bulletIFrames > 0;
  }

  /** Đang ở phần bất tử THÊM của P3 (hết bất tử gốc): để vẽ bóng mờ và tính sượt đạn. */
  get bulletGuardExtended(): boolean {
    return this.bulletIFrames > 0 && this.dashIFrames <= 0 && this.iFrames <= 0;
  }

  /** Số lượt lướt trên không tối đa (0 khi chưa có P1). */
  get airDashMax(): number {
    return this.params.airDashes;
  }

  /** Còn bất tử sau khi bị đánh (để nhấp nháy). */
  get blinking(): boolean {
    return this.iFrames > 0;
  }

  /**
   * Khiên C3 chặn một đòn (StageWorld đã kiểm tra khiên sẵn và Kai không bất tử): không mất máu,
   * không bật lùi, không ngắt lướt, không phát `hurt` (giữ mức nạp, không kích tín hiệu `hurt` của
   * hướng dẫn); chỉ bất tử `iFrameSec` để đòn khác cùng lúc không trúng ngay.
   */
  absorbHit(iFrameSec: number): void {
    this.iFrames = Math.max(this.iFrames, iFrameSec);
  }

  /** Nhận sát thương từ một nguồn ở tọa độ X. Trả về false nếu đang bất tử. */
  applyHit(damage: number, sourceX: number): boolean {
    if (this.invulnerable) return false;
    const away = sourceX > this.centerX ? -1 : 1;
    return this.takeHit(damage, away * this.params.knockbackX, -this.params.knockbackY);
  }

  /** Mối nguy môi trường chỉ xét bất tử sau trúng đòn, giống gai (QB-02). */
  applyHazardHit(damage: number, vx: number, vy: number): boolean {
    if (this.state === 'dead' || this.iFrames > 0 || damage <= 0) return false;
    return this.takeHit(damage, vx, vy);
  }

  private takeHit(damage: number, vx: number, vy: number): boolean {
    this.hp = Math.max(0, this.hp - damage);
    this.events.hurt = true;
    this.endDash();
    this.dashCarry = false;
    this.jumping = false;
    if (this.hp <= 0) {
      this.state = 'dead';
      this.events.died = true;
      this.vx = 0;
      return true;
    }
    this.vx = vx;
    this.vy = vy;
    this.hurtTime = this.params.hurtStunSec;
    this.iFrames = this.params.iFramesAfterHitSec;
    return true;
  }

  clearBufferedJump(): void {
    this.buffer = 0;
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
    this.bulletIFrames = tick(this.bulletIFrames, dt);
    this.wallGrace = tick(this.wallGrace, dt);
    this.hurtTime = tick(this.hurtTime, dt);
    this.dropThrough = tick(this.dropThrough, dt);

    if (this.state === 'dead') {
      this.riding = undefined;
      const vyBefore = this.vy;
      this.applyGravity(dt, false);
      this.moveBody(dt, vyBefore);
      return this.events;
    }

    this.carry();
    const control = this.hurtTime <= 0;
    const dir = input.moveX > 0 ? 1 : input.moveX < 0 ? -1 : 0;
    if (control && input.jumpPressed) this.buffer = p.bufferSec;

    // Lướt. Có P1 thì lướt trong thời gian coyote tính là lướt đất (không tốn lượt trên không).
    const groundDash = this.grounded || (p.airDashes > 0 && this.coyote > 0);
    const airDash = !groundDash && this.airDashesLeft > 0;
    if (
      control &&
      input.dashPressed &&
      !this.dashing &&
      this.dashCooldown <= 0 &&
      (groundDash || airDash)
    ) {
      if (!groundDash) {
        this.airDashesLeft -= 1;
        this.events.airDashed = true;
      }
      this.dashTime = p.dashSec;
      this.dashActive = true;
      this.dashDir = dir !== 0 ? dir : this.facing;
      this.facing = this.dashDir;
      this.dashIFrames = p.dashIFrameSec;
      this.bulletIFrames =
        p.bulletIFrameExtraSec > 0 ? p.dashIFrameSec + p.bulletIFrameExtraSec : 0;
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
    if (this.wallDir !== 0) {
      this.lastWallDir = this.wallDir;
      this.wallGrace = p.wallJumpGraceSec;
    }
    if (this.box.y > this.map.heightPx) this.events.fellOut = true;
    this.state = this.deriveState(dir);
    // Chạm tường lúc đang rơi nhanh: hãm ngay trong bước này, không đợi bước sau.
    if (this.state === 'wall_slide') this.vy = Math.min(this.vy, p.wallSlideSpeed);
    // Hồi lượt lướt trên không khi chạm đất (gồm đứng trên dây leo) hoặc bám tường.
    if ((this.grounded || this.state === 'wall_slide') && this.airDashesLeft < p.airDashes) {
      this.airDashesLeft = p.airDashes;
      this.events.airDashRestored = true;
    }
    return this.events;
  }

  private tryJump(input: PlayerInput): void {
    const p = this.params;
    const below = groundBelow(this.box, this.map);
    if (
      this.grounded &&
      input.downHeld &&
      (below === 'oneWay' || (below === undefined && this.riding))
    ) {
      this.dropThrough = DROP_THROUGH_SEC;
      this.riding = undefined;
      this.grounded = false;
      this.buffer = 0;
      this.coyote = 0;
      return;
    }
    if (this.grounded || this.coyote > 0) {
      if (this.dashing && p.dashJump) this.dashCarry = true;
      this.endDash();
      this.vy = -p.jumpSpeed * (1 + (this.riding?.jumpBonus ?? 0));
      this.riding = undefined;
      this.jumping = true;
      this.grounded = false;
      this.buffer = 0;
      this.coyote = 0;
      this.events.jumped = true;
      return;
    }
    const beside = this.wallDir !== 0 ? this.wallDir : wallBeside(this.box, this.map);
    // Ân hạn (P2 bậc 2): vừa rời tường trong wallJumpGraceSec vẫn nhảy tường được.
    const wall = beside !== 0 ? beside : this.wallGrace > 0 ? this.lastWallDir : 0;
    if (p.wallJump && wall !== 0) {
      this.wallGrace = 0;
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
    // Phần bất tử thêm của P3 mất ngay khi cú lướt kết thúc hoặc bị hủy (nhảy, tường, bị đánh).
    this.bulletIFrames = Math.min(this.bulletIFrames, this.dashIFrames);
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
    const prevBottom = this.bottom;
    const hitY = moveY(this.box, ((vyBefore + this.vy) / 2) * dt, this.map, this.dropThrough > 0);
    if (hitY !== 0) this.vy = 0;
    if (hitY === -1) this.jumping = false;
    this.landOnPlatform(prevBottom);
    this.grounded =
      this.vy >= 0 &&
      this.dropThrough <= 0 &&
      (this.riding !== undefined || groundBelow(this.box, this.map) !== undefined);
  }

  /** Đứng trên bệ di động thì đi theo bệ (vẫn bị tường chặn); bệ rời khỏi chân thì thôi chở. */
  private carry(): void {
    const r = this.riding;
    if (!r) return;
    if (!this.platforms.includes(r)) {
      this.riding = undefined;
      return;
    }
    moveX(this.box, r.dx, this.map);
    moveY(this.box, r.y - this.bottom, this.map, true);
    if (this.box.x + this.box.w <= r.x || this.box.x >= r.x + r.w) {
      this.riding = undefined;
      this.grounded = groundBelow(this.box, this.map) !== undefined;
    }
  }

  /**
   * Rơi xuống (hoặc đang đứng) trên mặt bệ di động thì đáp lên bệ. Mặt bệ là bục một chiều:
   * chỉ đỡ khi chân ở trên mặt bệ trước bước này (so với vị trí cũ hoặc mới của bệ).
   */
  private landOnPlatform(prevBottom: number): void {
    this.riding = undefined;
    if (this.vy < 0 || this.dropThrough > 0) return;
    const eps = 0.01;
    for (const p of this.platforms) {
      if (this.box.x + this.box.w <= p.x || this.box.x >= p.x + p.w) continue;
      const top = p.y;
      if (prevBottom <= Math.max(top, top - p.dy) + eps && this.bottom >= top - eps) {
        this.box.y = top - this.box.h;
        this.vy = 0;
        this.riding = p;
        return;
      }
    }
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
