import {
  MIRROR_CHARGES,
  type LaserMechanics,
  type StageMechanics,
} from '../../core/stage-mechanics-config';
import { ARC_CANNON } from '../combat/loadout';
import { overlaps, type Projectile } from '../combat/projectiles';
import type { Box } from '../player/collision';
import {
  laserBox,
  type LaserDirection,
  type LaserPath,
  type LaserSegment,
  type MirrorAngle,
  opticalCenter,
  traceLaser,
} from '../stage/laser-path';
import type {
  Cell,
  LaserSpawn,
  MirrorSpawn,
  OpticalDoorSpawn,
  OpticsLayout,
  SensorSpawn,
} from '../stage/layout';
import { Tile, type TileMap } from '../tilemap';
import type { WorldEvents } from './world-types';

const EPS = 1e-9;
type LaserState = 'off' | 'warning' | 'active';

export class LaserEmitter {
  readonly center;
  state: LaserState;
  path: LaserPath = [];
  boxes: readonly Box[] = [];
  private time: number;
  private hits = 0;

  constructor(
    readonly spawn: LaserSpawn,
    private readonly rules: LaserMechanics,
    tileSize: number,
  ) {
    this.center = opticalCenter(spawn.col, spawn.row, tileSize);
    const { periodSec, warnSec, onSec } = rules.pulse;
    const untilWarn = periodSec - warnSec - onSec - spawn.phase * periodSec;
    // Nguồn theo nhịp luôn báo đủ một lần trước xung đầu, kể cả khi bản đồ đặt lệch pha.
    this.time = -(untilWarn < -EPS ? untilWarn + periodSec : Math.max(0, untilWarn));
    this.state = spawn.mode === 'always' ? 'active' : this.time >= -EPS ? 'warning' : 'off';
  }

  step(dt: number): void {
    if (this.spawn.mode === 'always') return;
    const { periodSec, warnSec, onSec } = this.rules.pulse;
    this.time += dt;
    if (this.time >= periodSec - EPS) {
      this.time = Math.max(0, this.time - periodSec);
      this.hits = 0;
    }
    if (this.time < -EPS || this.time >= warnSec + onSec - EPS) this.state = 'off';
    else this.state = this.time < warnSec - EPS ? 'warning' : 'active';
  }

  setPath(path: LaserPath): void {
    this.path = path;
    this.boxes = path.map((segment) => laserBox(segment, this.rules.beamWidthPx));
  }

  collision(box: Box): LaserSegment | undefined {
    if (this.state !== 'active') return undefined;
    return this.path[this.boxes.findIndex((beam) => overlaps(beam, box))];
  }

  get canHit(): boolean {
    return this.spawn.mode === 'always' || this.hits < this.rules.hitsPerActivation;
  }

  registerHit(): void {
    this.hits += 1;
  }
}

class Mirror {
  readonly center;
  readonly box: Box;
  angle: MirrorAngle;
  turns = 0;
  private rotationLeft = 0;

  constructor(
    readonly spawn: MirrorSpawn,
    private readonly rules: StageMechanics['mirror'],
    tileSize: number,
  ) {
    this.center = opticalCenter(spawn.col, spawn.row, tileSize);
    this.box = { x: spawn.col * tileSize, y: spawn.row * tileSize, w: tileSize, h: tileSize };
    this.angle = spawn.angle;
  }

  get rotating(): boolean {
    return this.rotationLeft > EPS;
  }

  step(dt: number): void {
    this.rotationLeft = Math.max(0, this.rotationLeft - dt);
  }

  toggle(charge: number): boolean {
    if (this.rotating || charge < MIRROR_CHARGES.indexOf(this.rules.toggleMinCharge)) return false;
    this.angle = this.angle === 45 ? 135 : 45;
    this.turns += 1;
    this.rotationLeft = this.rules.rotateSec;
    return true;
  }

  reset(): void {
    this.angle = this.spawn.angle;
    this.turns = 0;
    this.rotationLeft = 0;
  }
}

class OpticalDoor {
  open = false;
  readonly box: Box;

  constructor(
    readonly spawn: OpticalDoorSpawn,
    private readonly map: TileMap,
  ) {
    const t = map.tileSize;
    this.box = {
      x: spawn.first * t,
      y: spawn.top * t,
      w: (spawn.last - spawn.first + 1) * t,
      h: (spawn.bottom - spawn.top + 1) * t,
    };
    this.fill(Tile.Solid);
  }

  unlock(): void {
    this.open = true;
    this.fill(Tile.Empty);
  }

  private fill(tile: Tile): void {
    const s = this.spawn;
    for (let row = s.top; row <= s.bottom; row += 1)
      for (let col = s.first; col <= s.last; col += 1) this.map.set(col, row, tile);
  }
}

class LightSensor {
  readonly box: Box;
  private litSec = 0;

  constructor(
    spawn: SensorSpawn,
    readonly door: OpticalDoor,
    tileSize: number,
    private readonly holdSec: number,
  ) {
    this.box = { x: spawn.col * tileSize, y: spawn.row * tileSize, w: tileSize, h: tileSize };
  }

  get progress(): number {
    return this.door.open ? 1 : this.holdSec > 0 ? this.litSec / this.holdSec : 0;
  }

  step(dt: number, lasers: readonly LaserEmitter[]): boolean {
    if (this.door.open) return false;
    if (!lasers.some((laser) => laser.collision(this.box))) {
      this.reset();
      return false;
    }
    this.litSec += dt;
    if (this.litSec + EPS < this.holdSec) return false;
    return this.activate();
  }

  activate(): boolean {
    if (this.door.open) return false;
    this.door.unlock();
    return true;
  }

  reset(): void {
    this.litSec = 0;
  }
}

export class StageOptics {
  readonly lasers: readonly LaserEmitter[];
  readonly mirrors: readonly Mirror[];
  readonly sensors: readonly LightSensor[];
  readonly doors: readonly OpticalDoor[];
  private readonly mirrorByCell = new Map<number, Mirror>();
  private readonly toggled = new Set<Mirror>();
  private mapRevision = -1;

  constructor(
    layout: OpticsLayout,
    private readonly map: TileMap,
    private readonly rules: StageMechanics,
  ) {
    const t = map.tileSize;
    this.doors = layout.doors.map((spawn) => new OpticalDoor(spawn, map));
    const doors = new Map(this.doors.map((door) => [door.spawn.id, door]));
    this.sensors = layout.sensors.map((spawn) => {
      const door = doors.get(spawn.doorId);
      if (!door) throw new Error(`Cảm biến thiếu cửa ${spawn.doorId}`);
      return new LightSensor(spawn, door, t, rules.sensor.holdSec);
    });
    this.mirrors = layout.mirrors.map((spawn) => new Mirror(spawn, rules.mirror, t));
    for (const m of this.mirrors) this.mirrorByCell.set(m.spawn.row * map.cols + m.spawn.col, m);
    this.lasers = layout.lasers.map((spawn) => new LaserEmitter(spawn, rules.laser, t));
    this.refreshPaths();
  }

  step(dt: number, ev: WorldEvents): void {
    const redirected = this.toggled.size > 0;
    if (redirected || this.mapRevision !== this.map.revision) this.refreshPaths();
    this.toggled.clear();
    for (const mirror of this.mirrors) mirror.step(dt);
    for (const laser of this.lasers) laser.step(dt);
    for (const sensor of this.sensors) {
      if (redirected) sensor.reset();
      if (sensor.step(dt, this.lasers)) ev.sensorActivated = true;
    }
  }

  absorbShot(shot: Projectile, ev: WorldEvents): boolean {
    if (shot.owner !== 'player' || shot.weapon !== ARC_CANNON) return false;
    const charge = MIRROR_CHARGES.findIndex((kind) => kind === shot.kind);
    if (charge < 0) return false;
    let mirror: Mirror | undefined;
    for (const candidate of this.mirrors) {
      if (!overlaps(candidate.box, shot)) continue;
      if (!mirror || (candidate.center.x - mirror.center.x) * shot.vx < 0) mirror = candidate;
    }
    if (!mirror) return false;
    if (!this.toggled.has(mirror) && mirror.toggle(charge)) {
      this.toggled.add(mirror);
      ev.mirrorToggled = true;
    }
    return true;
  }

  trace(
    origin: { x: number; y: number },
    direction: LaserDirection,
    maxBounces: number,
    rangePx?: number,
  ): LaserPath {
    return traceLaser(this.map, origin, direction, this.mirrorAt, maxBounces, rangePx);
  }

  /** Tia từ đầu dẫn phía trên gương đã chọn; xung hai chỉ đảo góc ảo của gương đó. */
  bossBeamPath(mirror: Cell, fromY: number, alternate: boolean, maxBounces: number): LaserPath {
    return traceLaser(
      this.map,
      { x: (mirror.col + 0.5) * this.map.tileSize, y: fromY },
      'down',
      (col, row) => {
        const angle = this.mirrorAt(col, row);
        if (!alternate || col !== mirror.col || row !== mirror.row || angle === undefined)
          return angle;
        return angle === 45 ? 135 : 45;
      },
      maxBounces,
    );
  }

  /** Một xung từ vũ khí mở cửa; laser môi trường vẫn phải chiếu liên tục đủ thời gian giữ. */
  receiveBeam(boxes: readonly Box[], ev: WorldEvents): void {
    for (const sensor of this.sensors)
      if (boxes.some((box) => overlaps(sensor.box, box)) && sensor.activate())
        ev.sensorActivated = true;
  }

  reset(): void {
    for (const mirror of this.mirrors) mirror.reset();
    for (const sensor of this.sensors) sensor.reset();
    this.toggled.clear();
    this.refreshPaths();
  }

  private readonly mirrorAt = (col: number, row: number): MirrorAngle | undefined =>
    this.mirrorByCell.get(row * this.map.cols + col)?.angle;

  readonly isMirrorCell = (col: number, row: number): boolean =>
    col >= 0 && col < this.map.cols && this.mirrorAt(col, row) !== undefined;

  private refreshPaths(): void {
    this.mapRevision = this.map.revision;
    for (const laser of this.lasers) {
      laser.setPath(this.trace(laser.center, laser.spawn.direction, this.rules.mirror.maxBounces));
    }
  }
}
