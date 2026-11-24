import { arr, ConfigError, num, obj, positiveNum, str } from './json-check';

export interface Position3 {
  x: number;
  y: number;
  z: number;
}

export interface Platform3 extends Position3 {
  id: string;
  width: number;
  depth: number;
  kind: 'floor' | 'platform';
}

export interface Wall3 extends Position3 {
  width: number;
  depth: number;
  height: number;
}

export interface Marker3 extends Position3 {
  radius: number;
}

export interface Checkpoint3 extends Marker3 {
  id: string;
}

export interface Camera3 {
  yawDeg: number;
  height: number;
  distance: number;
  fovDeg: number;
  lookHeight: number;
  lookAhead: number;
  follow: number;
}

export interface Prototype3dConfig {
  stepSec: number;
  runSpeed: number;
  acceleration: number;
  braking: number;
  gravity: number;
  jumpSpeed: number;
  maxFallSpeed: number;
  radius: number;
  height: number;
  jumpBufferSec: number;
  coyoteSec: number;
  dashSpeed: number;
  dashSec: number;
  dashCooldownSec: number;
  fallY: number;
  respawnSec: number;
  shotSpeed: number;
  shotCooldownSec: number;
  shotLifetimeSec: number;
  aimConeDeg: number;
  muzzleHeight: number;
  camera: Camera3;
  spawn: Position3;
  platforms: Platform3[];
  walls: Wall3[];
  checkpoints: Checkpoint3[];
  relay: Marker3;
  gate: Wall3;
  finish: Marker3;
}

function point(raw: unknown, path: string): Position3 {
  const o = obj(raw, path);
  return {
    x: num(o.x, `${path}.x`),
    y: num(o.y, `${path}.y`),
    z: num(o.z, `${path}.z`),
  };
}

function footprint(raw: unknown, path: string) {
  const o = obj(raw, path);
  return {
    ...point(o, path),
    width: positiveNum(o.width, `${path}.width`),
    depth: positiveNum(o.depth, `${path}.depth`),
  };
}

function wall(raw: unknown, path: string): Wall3 {
  const o = obj(raw, path);
  return { ...footprint(o, path), height: positiveNum(o.height, `${path}.height`) };
}

function marker(raw: unknown, path: string): Marker3 {
  const o = obj(raw, path);
  return { ...point(o, path), radius: positiveNum(o.radius, `${path}.radius`) };
}

function onFloor(p: Position3, platforms: Platform3[]): boolean {
  return platforms.some(
    (s) => p.y === s.y && Math.abs(p.x - s.x) < s.width / 2 && Math.abs(p.z - s.z) < s.depth / 2,
  );
}

export function parsePrototype3d(raw: unknown): Prototype3dConfig {
  const path = 'prototype3d';
  const o = obj(raw, path);
  const n = (key: string) => positiveNum(o[key], `${path}.${key}`);
  const camera = obj(o.camera, `${path}.camera`);
  const cn = (key: string) => positiveNum(camera[key], `${path}.camera.${key}`);
  const platforms = arr(o.platforms, `${path}.platforms`).map((entry, i): Platform3 => {
    const p = `${path}.platforms[${i}]`;
    const s = obj(entry, p);
    if (s.kind !== 'floor' && s.kind !== 'platform')
      throw new ConfigError(`${p}.kind: cần floor hoặc platform`);
    return { id: str(s.id, `${p}.id`), kind: s.kind, ...footprint(s, p) };
  });
  const checkpoints = arr(o.checkpoints, `${path}.checkpoints`).map((entry, i): Checkpoint3 => {
    const p = `${path}.checkpoints[${i}]`;
    const s = obj(entry, p);
    return { id: str(s.id, `${p}.id`), ...marker(s, p) };
  });
  for (const [label, items] of [
    ['platforms', platforms],
    ['checkpoints', checkpoints],
  ] as const) {
    if (items.length === 0 || new Set(items.map((p) => p.id)).size !== items.length)
      throw new ConfigError(`${path}.${label}: danh sách phải có id riêng và khác rỗng`);
  }
  const spawn = point(o.spawn, `${path}.spawn`);
  const finish = marker(o.finish, `${path}.finish`);
  if (![spawn, ...checkpoints, finish].every((p) => onFloor(p, platforms)))
    throw new ConfigError(`${path}: điểm xuất phát, checkpoint và đích phải nằm trên sàn`);
  const fallY = num(o.fallY, `${path}.fallY`);
  if (platforms.some((p) => p.y <= fallY))
    throw new ConfigError(`${path}.fallY: phải thấp hơn mọi bục`);
  const aimConeDeg = n('aimConeDeg');
  const fovDeg = cn('fovDeg');
  if (aimConeDeg >= 90 || fovDeg >= 100)
    throw new ConfigError(`${path}: góc ngắm hoặc FOV quá rộng`);
  const stepSec = n('stepSec');
  if (stepSec > 1 / 30) throw new ConfigError(`${path}.stepSec: bước vật lý quá dài`);

  return {
    stepSec,
    runSpeed: n('runSpeed'),
    acceleration: n('acceleration'),
    braking: n('braking'),
    gravity: n('gravity'),
    jumpSpeed: n('jumpSpeed'),
    maxFallSpeed: n('maxFallSpeed'),
    radius: n('radius'),
    height: n('height'),
    jumpBufferSec: n('jumpBufferSec'),
    coyoteSec: n('coyoteSec'),
    dashSpeed: n('dashSpeed'),
    dashSec: n('dashSec'),
    dashCooldownSec: n('dashCooldownSec'),
    fallY,
    respawnSec: n('respawnSec'),
    shotSpeed: n('shotSpeed'),
    shotCooldownSec: n('shotCooldownSec'),
    shotLifetimeSec: n('shotLifetimeSec'),
    aimConeDeg,
    muzzleHeight: n('muzzleHeight'),
    camera: {
      yawDeg: num(camera.yawDeg, `${path}.camera.yawDeg`),
      height: cn('height'),
      distance: cn('distance'),
      fovDeg,
      lookHeight: cn('lookHeight'),
      lookAhead: cn('lookAhead'),
      follow: cn('follow'),
    },
    spawn,
    platforms,
    walls: arr(o.walls, `${path}.walls`).map((e, i) => wall(e, `${path}.walls[${i}]`)),
    checkpoints,
    relay: marker(o.relay, `${path}.relay`),
    gate: wall(o.gate, `${path}.gate`),
    finish,
  };
}
