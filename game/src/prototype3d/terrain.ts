import * as THREE from 'three';
import type { Position3, Prototype3dConfig } from '../core/prototype3d-config';
import { platformUnder } from '../logic/prototype3d/geometry';
import type { KitPart, Models3d } from './models';

type Placement = {
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
};

const COLORS: Record<KitPart, number> = {
  Floor: 0x426270,
  Platform: 0x69818a,
  Edge: 0x93afba,
  Wall: 0x546773,
};

function placePart(
  group: THREE.Group,
  id: KitPart,
  placements: Placement[],
  kit: Models3d['kit'] | undefined,
) {
  if (placements.length === 0) return;
  const template = kit?.get(id);
  const meshes: {
    geometry: THREE.BufferGeometry;
    material: THREE.Material | THREE.Material[];
    local: THREE.Matrix4;
  }[] = [];
  if (template) {
    template.updateWorldMatrix(true, true);
    const inverse = template.matrixWorld.clone().invert();
    template.traverse((o) => {
      if (o instanceof THREE.Mesh)
        meshes.push({
          geometry: o.geometry,
          material: o.material,
          local: inverse.clone().multiply(o.matrixWorld),
        });
    });
  } else {
    const geometry = new THREE.BoxGeometry(1, id === 'Wall' ? 1 : 0.18, 1);
    geometry.translate(0, id === 'Wall' ? 0.5 : -0.09, 0);
    meshes.push({
      geometry,
      material: new THREE.MeshStandardMaterial({ color: COLORS[id] }),
      local: new THREE.Matrix4(),
    });
  }

  const dummy = new THREE.Object3D();
  for (const part of meshes) {
    const batch = new THREE.InstancedMesh(part.geometry, part.material, placements.length);
    for (const [i, p] of placements.entries()) {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.width, p.height, p.depth);
      dummy.updateMatrix();
      batch.setMatrixAt(i, dummy.matrix.clone().multiply(part.local));
    }
    batch.receiveShadow = true;
    batch.computeBoundingSphere();
    group.add(batch);
  }
}

function deckPieces(config: Prototype3dConfig) {
  const tiles: Record<KitPart, Placement[]> = { Floor: [], Platform: [], Edge: [], Wall: [] };
  for (const p of config.platforms) {
    const cols = Math.ceil(p.width / 3.25),
      rows = Math.ceil(p.depth / 3.25);
    const width = p.width / cols,
      depth = p.depth / rows;
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) {
        tiles[p.kind === 'floor' ? 'Floor' : 'Platform'].push({
          x: p.x - p.width / 2 + (c + 0.5) * width,
          y: p.y,
          z: p.z - p.depth / 2 + (r + 0.5) * depth,
          width,
          depth,
          height: 1.2,
        });
      }
    for (const side of [-1, 1]) {
      tiles.Edge.push({
        x: p.x,
        y: p.y - 0.012,
        z: p.z + side * (p.depth / 2 - 0.13),
        width: p.width,
        depth: 0.24,
        height: 0.72,
      });
      tiles.Edge.push({
        x: p.x + side * (p.width / 2 - 0.12),
        y: p.y - 0.012,
        z: p.z,
        width: 0.24,
        depth: p.depth,
        height: 0.72,
      });
    }
  }
  for (const wall of config.walls) {
    const count = Math.ceil(wall.depth / 2.35);
    const depth = wall.depth / count;
    for (let i = 0; i < count; i++)
      tiles.Wall.push({ ...wall, depth, z: wall.z - wall.depth / 2 + (i + 0.5) * depth });
  }
  return tiles;
}

export function makeTerrain(
  scene: THREE.Scene,
  config: Prototype3dConfig,
  kit: Models3d['kit'] | undefined,
) {
  const layout = new THREE.Group();
  for (const [id, placements] of Object.entries(deckPieces(config)))
    placePart(layout, id as KitPart, placements, kit);
  scene.add(layout);
  makeUndercroft(scene, config);
  makeRoute(scene, config);
}

function makeUndercroft(scene: THREE.Scene, config: Prototype3dConfig) {
  const steel = new THREE.MeshStandardMaterial({
    color: 0x233e4a,
    metalness: 0.4,
    roughness: 0.67,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x102732, roughness: 0.9 });
  const light = new THREE.MeshBasicMaterial({ color: 0x547f84 });
  const box = new THREE.BoxGeometry(1, 1, 1);
  const support = new THREE.InstancedMesh(box, steel, config.platforms.length * 2);
  const accent = new THREE.InstancedMesh(box, light, config.platforms.length * 2);
  const dummy = new THREE.Object3D();
  let index = 0;
  for (const p of config.platforms) {
    for (const side of [-1, 1]) {
      const x = p.x + side * p.width * 0.34,
        z = p.z;
      dummy.position.set(x, p.y - 2.14, z);
      dummy.scale.set(0.55, 3.8, Math.min(1.8, p.depth * 0.32));
      dummy.updateMatrix();
      support.setMatrixAt(index, dummy.matrix);
      dummy.position.set(x - side * 0.28, p.y - 1.5, z);
      dummy.scale.set(0.045, 0.85, 0.58);
      dummy.updateMatrix();
      accent.setMatrixAt(index++, dummy.matrix);
    }
  }
  scene.add(support, accent);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(240, 330), dark);
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, -7.2, -71);
  scene.add(base);
  const grid = new THREE.GridHelper(280, 74, 0x244957, 0x1c3945);
  grid.position.set(0, -7.16, -72);
  scene.add(grid);
  const buildings = new THREE.InstancedMesh(box, steel, 42);
  for (let i = 0; i < 42; i++) {
    const len = 2.3 + ((i * 29) % 15) * 0.52;
    dummy.position.set(
      (i % 2 === 0 ? -1 : 1) * (20 + ((i * 23) % 13) * 1.1),
      -7 + len / 2,
      7 - i * 4.3,
    );
    dummy.scale.set(1.2 + ((i * 19) % 3), len, 1.3);
    dummy.updateMatrix();
    buildings.setMatrixAt(i, dummy.matrix);
  }
  scene.add(buildings);
}

function makeRoute(scene: THREE.Scene, config: Prototype3dConfig) {
  const points: Position3[] = [
    config.spawn,
    ...config.platforms.map(({ x, y, z }) => ({ x, y, z })),
    config.finish,
  ];
  const arrows: { p: Position3; yaw: number }[] = [];
  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]!,
      to = points[i]!;
    const dx = to.x - from.x,
      dz = to.z - from.z;
    const distance = Math.hypot(dx, dz);
    const count = Math.floor(distance / 3.6);
    for (let j = 1; j <= count; j++) {
      const t = (j - 0.35) / count;
      const p = { x: from.x + dx * t, y: Math.max(from.y, to.y), z: from.z + dz * t };
      const floor = platformUnder(p, config.platforms);
      if (floor) arrows.push({ p: { ...p, y: floor.y }, yaw: Math.atan2(dx, dz) });
    }
  }
  const shape = new THREE.Shape()
    .moveTo(0, 0.4)
    .lineTo(-0.3, -0.02)
    .lineTo(-0.11, -0.02)
    .lineTo(-0.11, -0.24)
    .lineTo(0.11, -0.24)
    .lineTo(0.11, -0.02)
    .lineTo(0.3, -0.02)
    .lineTo(0, 0.4);
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(Math.PI / 2);
  const marker = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: 0xf9b663,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    }),
    arrows.length,
  );
  const dummy = new THREE.Object3D();
  for (const [i, { p, yaw }] of arrows.entries()) {
    dummy.position.set(p.x, p.y + 0.012, p.z);
    dummy.rotation.y = yaw;
    dummy.updateMatrix();
    marker.setMatrixAt(i, dummy.matrix);
  }
  scene.add(marker);
}
