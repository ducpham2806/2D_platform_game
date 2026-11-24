import type { Position3, Prototype3dConfig } from '../../core/prototype3d-config';
import { type Bounds3, moveAxis, platformUnder, segmentHit, wallBounds } from './geometry';

export interface RoomInput {
  x: number;
  z: number;
  jump: boolean;
  dash: boolean;
  shoot: boolean;
}

export const STILL_3D: RoomInput = { x: 0, z: 0, jump: false, dash: false, shoot: false };

export interface Bolt3 {
  id: number;
  position: Position3;
  velocity: Position3;
  remaining: number;
}

export type KaiClip = 'Idle' | 'Run' | 'Jump' | 'Fall' | 'Land' | 'Dash' | 'Shoot';
export type Objective3 = 'cross' | 'relay' | 'ridge' | 'exit';

const EPS = 1e-6;
const ZERO = { x: 0, y: 0, z: 0 } as const;

function approach(current: number, target: number, amount: number): number {
  return current < target ? Math.min(target, current + amount) : Math.max(target, current - amount);
}

function near(p: Position3, marker: Position3 & { radius: number }): boolean {
  return (
    Math.abs(p.y - marker.y) < EPS && Math.hypot(p.x - marker.x, p.z - marker.z) <= marker.radius
  );
}

export class PrototypeRoom {
  readonly position: Position3;
  readonly velocity: Position3 = { ...ZERO };
  readonly facing = { x: 0, z: -1 };
  readonly bolts: Bolt3[] = [];
  readonly walls: Bounds3[];
  readonly gate: Bounds3;
  readonly relayBounds: Bounds3;
  private readonly closedWalls: Bounds3[];
  private readonly aimDot: number;
  elapsed = 0;
  falls = 0;
  shots = 0;
  checkpoint = -1;
  relayPowered = false;
  finished = false;
  grounded = true;
  respawnLeft = 0;
  dashLeft = 0;
  shotCue = 0;
  landCue = 0;
  private jumpBuffer = 0;
  private coyote = 0;
  private dashCooldown = 0;
  private cooldown = 0;
  private nextShotId = 1;

  constructor(readonly config: Prototype3dConfig) {
    this.position = { ...config.spawn };
    this.walls = config.walls.map(wallBounds);
    this.gate = wallBounds(config.gate);
    this.closedWalls = [...this.walls, this.gate];
    this.aimDot = Math.cos((config.aimConeDeg * Math.PI) / 180);
    const { x, y, z, radius } = config.relay;
    this.relayBounds = {
      min: { x: x - radius, y: y - radius, z: z - radius },
      max: { x: x + radius, y: y + radius, z: z + radius },
    };
  }

  get obstacles() {
    return this.relayPowered ? this.walls : this.closedWalls;
  }

  get objective(): Objective3 {
    if (this.checkpoint < 0 && !this.relayPowered) return 'cross';
    if (!this.relayPowered) return 'relay';
    return this.checkpoint < this.config.checkpoints.length - 1 ? 'ridge' : 'exit';
  }

  get clip(): KaiClip {
    if (this.dashLeft > 0) return 'Dash';
    if (this.shotCue > 0) return 'Shoot';
    if (!this.grounded) return this.velocity.y > 0 ? 'Jump' : 'Fall';
    if (this.landCue > 0) return 'Land';
    return Math.hypot(this.velocity.x, this.velocity.z) > 0.36 ? 'Run' : 'Idle';
  }

  get landingY(): number | undefined {
    return platformUnder(this.position, this.config.platforms)?.y;
  }

  get aimingAtRelay(): boolean {
    return this.aimTarget(this.muzzle) !== undefined;
  }

  private get muzzle(): Position3 {
    return {
      x: this.position.x,
      y: this.position.y + this.config.muzzleHeight,
      z: this.position.z,
    };
  }

  step(input: RoomInput): void {
    if (this.finished) return;
    const c = this.config,
      dt = c.stepSec;
    this.elapsed += dt;
    if (this.respawnLeft > 0) {
      this.respawnLeft -= dt;
      if (this.respawnLeft <= EPS) this.respawn();
      return;
    }

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.dashLeft = Math.max(0, this.dashLeft - dt);
    this.shotCue = Math.max(0, this.shotCue - dt);
    this.landCue = Math.max(0, this.landCue - dt);
    this.jumpBuffer = input.jump ? c.jumpBufferSec : Math.max(0, this.jumpBuffer - dt);
    this.coyote = this.grounded ? c.coyoteSec : Math.max(0, this.coyote - dt);

    const mag = Math.hypot(input.x, input.z);
    const weight = Math.max(1, mag);
    if (mag > EPS && this.dashLeft <= EPS) {
      this.facing.x = input.x / mag;
      this.facing.z = input.z / mag;
    }
    if (input.dash && this.dashCooldown <= EPS) {
      this.dashLeft = c.dashSec;
      this.dashCooldown = c.dashCooldownSec;
    }
    if (this.jumpBuffer > EPS && this.coyote > EPS) {
      this.velocity.y = c.jumpSpeed;
      this.coyote = this.jumpBuffer = 0;
      this.grounded = false;
    }

    if (this.dashLeft > EPS) {
      this.velocity.x = this.facing.x * c.dashSpeed;
      this.velocity.z = this.facing.z * c.dashSpeed;
    } else {
      const change = (mag > EPS ? c.acceleration : c.braking) * dt;
      this.velocity.x = approach(this.velocity.x, (input.x * c.runSpeed) / weight, change);
      this.velocity.z = approach(this.velocity.z, (input.z * c.runSpeed) / weight, change);
    }
    for (const axis of ['x', 'z'] as const) {
      const delta = this.velocity[axis] * dt;
      if (
        Math.abs(moveAxis(this.position, axis, delta, c.radius, c.height, this.obstacles) - delta) >
        EPS
      )
        this.velocity[axis] = 0;
    }
    this.moveVertical(dt);

    if (this.position.y < c.fallY) {
      this.falls += 1;
      this.respawnLeft = c.respawnSec;
      this.bolts.length = 0;
      return;
    }
    if (input.shoot && this.cooldown <= EPS) this.fire();
    this.moveBolts(dt);
    if (this.grounded) this.checkRoute();
  }

  private moveVertical(dt: number) {
    const c = this.config,
      from = this.position.y;
    const descending = this.velocity.y <= 0;
    this.velocity.y = Math.max(-c.maxFallSpeed, this.velocity.y - c.gravity * dt);
    const to = from + this.velocity.y * dt;
    const floor = descending
      ? platformUnder(this.position, c.platforms, c.radius * 0.5)
      : undefined;
    if (floor && to <= floor.y + EPS) {
      if (!this.grounded) this.landCue = 0.16;
      this.grounded = true;
      this.position.y = floor.y;
      this.velocity.y = 0;
    } else {
      this.grounded = false;
      this.position.y = to;
    }
  }

  private aimTarget(from: Position3): Position3 | undefined {
    if (this.relayPowered) return undefined;
    const point = this.config.relay;
    const dx = point.x - from.x,
      dz = point.z - from.z;
    const d = Math.hypot(dx, dz);
    if (
      d < EPS ||
      d > this.config.shotLifetimeSec * this.config.shotSpeed ||
      (dx * this.facing.x + dz * this.facing.z) / d < this.aimDot
    )
      return undefined;
    return this.obstacles.some((b) => segmentHit(from, point, b) !== undefined) ? undefined : point;
  }

  private fire() {
    const c = this.config;
    const origin = this.muzzle;
    const aim = this.aimTarget(origin);
    const delta = aim
      ? { x: aim.x - origin.x, y: aim.y - origin.y, z: aim.z - origin.z }
      : { x: this.facing.x, y: 0, z: this.facing.z };
    const factor = c.shotSpeed / Math.hypot(delta.x, delta.y, delta.z);
    this.bolts.push({
      id: this.nextShotId++,
      position: origin,
      velocity: { x: delta.x * factor, y: delta.y * factor, z: delta.z * factor },
      remaining: c.shotLifetimeSec,
    });
    this.shots += 1;
    this.shotCue = 0.18;
    this.cooldown = c.shotCooldownSec;
  }

  private moveBolts(dt: number) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i]!;
      const { position: from, velocity } = bolt;
      const to = {
        x: from.x + velocity.x * dt,
        y: from.y + velocity.y * dt,
        z: from.z + velocity.z * dt,
      };
      let wall = Infinity;
      for (const b of this.obstacles) wall = Math.min(wall, segmentHit(from, to, b) ?? Infinity);
      const target = this.relayPowered
        ? Infinity
        : (segmentHit(from, to, this.relayBounds) ?? Infinity);
      bolt.remaining -= dt;
      if (target < wall) {
        this.relayPowered = true;
        this.bolts.splice(i, 1);
      } else if (wall !== Infinity || bolt.remaining <= 0) this.bolts.splice(i, 1);
      else bolt.position = to;
    }
  }

  private checkRoute() {
    for (let i = this.checkpoint + 1; i < this.config.checkpoints.length; i++) {
      if (near(this.position, this.config.checkpoints[i]!)) this.checkpoint = i;
    }
    this.finished = this.relayPowered && near(this.position, this.config.finish);
  }

  private respawn() {
    const checkpoint = this.config.checkpoints[this.checkpoint];
    const { x, y, z } = checkpoint ?? this.config.spawn;
    Object.assign(this.position, { x, y, z });
    Object.assign(this.velocity, ZERO);
    this.facing.x = 0;
    this.facing.z = -1;
    this.respawnLeft = this.dashLeft = this.shotCue = this.landCue = 0;
    this.cooldown = this.dashCooldown = this.coyote = this.jumpBuffer = 0;
    this.grounded = true;
  }
}
