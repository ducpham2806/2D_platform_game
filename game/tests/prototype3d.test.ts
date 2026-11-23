import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parsePrototype3d } from '@/core/prototype3d-config';
import { cameraMove, segmentHit, wallBounds } from '@/logic/prototype3d/geometry';
import { PrototypeRoom, STILL_3D } from '@/logic/prototype3d/room';
import roomData from '../../03-Data/prototype3d.json';

const config = parsePrototype3d(roomData);

function idle(world: PrototypeRoom, count = 12) {
  for (let i = 0; i < count; i++) world.step(STILL_3D);
}

function goto(world: PrototypeRoom, x: number, z: number, jump = false) {
  const falls = world.falls;
  for (let i = 0; i < 600; i++) {
    const dx = x - world.position.x;
    const dz = z - world.position.z;
    const d = Math.hypot(dx, dz);
    if (world.finished || (d < 0.24 && world.grounded)) return;
    const weight = Math.max(0.35, d);
    world.step({ ...STILL_3D, x: dx / weight, z: dz / weight, jump: jump && i === 0 });
    if (world.falls > falls) break;
  }
  expect.fail(`Không tới được (${x}, ${z}) từ ${JSON.stringify(world.position)}`);
}

describe('Phòng thử 3D', () => {
  it('kiểm dữ liệu nguồn, mọi điểm hồi sinh và đích có sàn đỡ', () => {
    expect(config.checkpoints).toHaveLength(2);
    expect(() => parsePrototype3d({ ...roomData, fallY: 0 })).toThrow(/fallY/);
    expect(() => parsePrototype3d({ ...roomData, spawn: { ...roomData.spawn, y: 0.1 } })).toThrow(
      /phải nằm trên sàn/,
    );
  });

  it('di chuyển theo cả hai trục và đổi hướng theo camera góc 3/4', () => {
    const world = new PrototypeRoom(config);
    const forward = cameraMove(0, 1, (config.camera.yawDeg * Math.PI) / 180);
    for (let i = 0; i < 30; i++) world.step({ ...STILL_3D, ...forward });
    expect(world.position.x).toBeLessThan(-0.6);
    expect(world.position.z).toBeLessThan(3);
    expect(world.grounded).toBe(true);
    expect(world.clip).toBe('Run');
  });

  it('khóa bằng cổng có va chạm kể cả khi lướt và bắn mở từ xa', () => {
    const world = new PrototypeRoom({ ...config, spawn: { x: config.gate.x, y: 1, z: -42.25 } });
    for (let i = 0; i < 45; i++) world.step({ ...STILL_3D, z: -1, dash: i === 0 });
    expect(world.position.z).toBeCloseTo(world.gate.max.z + config.radius);
    const ahead = new PrototypeRoom({ ...config, spawn: { x: config.relay.x, y: 1, z: -37 } });
    expect(ahead.aimingAtRelay).toBe(true);
    ahead.step({ ...STILL_3D, shoot: true });
    expect(ahead.relayPowered).toBe(false);
    idle(ahead, 24);
    expect(ahead.relayPowered).toBe(true);
    expect(ahead.obstacles).not.toContain(ahead.gate);
    expect(ahead.shots).toBe(1);
  });

  it('tia chạm vách ở đúng khoảng trên đoạn, kể cả tia nhanh hơn bề dày vách', () => {
    const box = wallBounds({ x: 0, y: 0, z: 0, width: 1, depth: 0.1, height: 2 });
    expect(segmentHit({ x: 0, y: 1, z: 2 }, { x: 0, y: 1, z: -2 }, box)).toBeCloseTo(0.4875);
    expect(segmentHit({ x: 0.7, y: 1, z: 2 }, { x: 0.7, y: 1, z: -2 }, box)).toBeUndefined();
  });

  it('hoàn thành toàn tuyến với hai checkpoint, hai cụm bục và mục tiêu', () => {
    const world = new PrototypeRoom(config);
    goto(world, 0, -19.75);
    goto(world, 1.7, -23.25, true);
    expect(world.position.y).toBe(0.52);
    goto(world, 0.8, -24.85);
    goto(world, -1.1, -28.7, true);
    expect(world.position.y).toBe(1);
    goto(world, -1.4, -30.76);
    goto(world, -2.6, -34.02, true);
    expect(world.checkpoint).toBe(0);
    goto(world, -2.6, -36.8);
    world.step({ ...STILL_3D, shoot: true });
    idle(world, 28);
    expect(world.relayPowered).toBe(true);
    for (const [x, z] of [
      [-2.6, -69.8],
      [11.7, -70],
      [11.7, -82.62],
    ] as const)
      goto(world, x, z);
    goto(world, 13, -86, true);
    expect(world.position.y).toBe(1.65);
    goto(world, 12.2, -88.95);
    goto(world, 10.4, -92.55, true);
    expect(world.position.y).toBe(2.1);
    goto(world, 9.5, -95.38);
    goto(world, 8.2, -98.6, true);
    goto(world, 8.2, -103);
    expect(world.checkpoint).toBe(1);
    goto(world, 8.2, -124.2);
    goto(world, -8.6, -124.2);
    for (const [x, z] of [
      [-8.6, -146],
      [-25, -146],
      [-25, -170],
      [-3, -170],
      [-3, -201],
    ] as const)
      goto(world, x, z);
    expect(world.finished).toBe(true);
    expect(world.elapsed).toBeGreaterThanOrEqual(60);
    expect(world.elapsed).toBeLessThan(90);
    expect(world.falls).toBe(0);
  });

  it('rơi về checkpoint gần nhất, giữ lõi đã bắn và kết quả lượt', () => {
    const first = config.checkpoints[0]!;
    const world = new PrototypeRoom({ ...config, spawn: first });
    world.step({ ...STILL_3D, shoot: true });
    idle(world, 32);
    expect(world.relayPowered).toBe(true);
    expect(world.checkpoint).toBe(0);
    for (let i = 0; i < 240; i++) {
      world.step({ ...STILL_3D, x: 1 });
      if (world.falls) break;
    }
    expect(world.falls).toBe(1);
    idle(world, 35);
    expect(world.position).toMatchObject({ x: first.x, y: first.y, z: first.z });
    expect(world.relayPowered).toBe(true);
    expect(world.shots).toBe(1);
    expect(world.grounded).toBe(true);
  });
});

function readGlb(name: string) {
  const bytes = readFileSync(new URL(`../public/assets/prototype3d/${name}.glb`, import.meta.url));
  expect(bytes.subarray(0, 4).toString()).toBe('glTF');
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.byteLength);
  const jsonSize = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + jsonSize).toString()) as {
    skins?: { joints: number[] }[];
    animations?: { name: string; channels: unknown[] }[];
    nodes: { name: string }[];
  };
}

describe('Asset 3D mẫu', () => {
  it('Kai có armature, nòng pháo và bảy clip có kênh', () => {
    const file = readGlb('kai');
    expect(file.skins?.[0]?.joints.length).toBeGreaterThan(7);
    expect(file.nodes.some((node) => node.name === 'Muzzle')).toBe(true);
    expect(file.animations?.map((clip) => clip.name)).toEqual([
      'Idle',
      'Run',
      'Jump',
      'Fall',
      'Land',
      'Dash',
      'Shoot',
    ]);
    expect(file.animations?.every((clip) => clip.channels.length > 0)).toBe(true);
  });

  it('kit có đủ bốn mô-đun theo tên dùng ở runtime', () => {
    const names = readGlb('terrain-kit').nodes.map((node) => node.name);
    expect(names).toEqual(expect.arrayContaining(['Floor', 'Platform', 'Edge', 'Wall']));
  });
});
