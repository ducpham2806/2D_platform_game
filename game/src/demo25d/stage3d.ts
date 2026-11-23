/**
 * Cảnh 3D của màn (demo 2.5D): khối ô có chiều sâu, rêu sáng trên mặt, bục một chiều, cửa phòng
 * boss, tường nền và rừng cây nhiều lớp chìm trong sương (Verdant Gardens), bào tử bay, ánh sáng.
 * Mặt chơi là z = 0; 1 đơn vị = 1 ô.
 */
import * as THREE from 'three';
import { Tile, type TileMap } from '../logic/tilemap';
import { cellCenter } from './coords';

/** Độ sâu khối đặc (trục z, kéo về phía sau nhiều hơn phía trước). */
const SOLID_FRONT = 1.2;
const SOLID_BACK = 3.2;

export const PALETTE = {
  fog: 0x0b1f1c,
  sky: 0x123a33,
  ground: 0x05100e,
  stone: 0x24313a,
  stoneTop: 0x2f4a3a,
  moss: 0x5dff9a,
  neon: 0x4fd1ff,
  warn: 0xffa94d,
  danger: 0xff5d5d,
  root: 0xffd166,
};

/** Kết cấu tạo bằng mã (không cần file ảnh): đá có đường mạch mờ. */
function stoneTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#3d4b55';
  g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 140; i += 1) {
    const v = 48 + Math.floor(Math.random() * 30);
    g.fillStyle = `rgb(${v},${v + 8},${v + 14})`;
    g.fillRect(
      Math.random() * 64,
      Math.random() * 64,
      2 + Math.random() * 4,
      2 + Math.random() * 4,
    );
  }
  g.strokeStyle = 'rgba(93,255,154,0.18)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, 32);
  g.lineTo(20, 32);
  g.lineTo(28, 22);
  g.lineTo(64, 22);
  g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.5)';
  g.strokeRect(0.5, 0.5, 63, 63);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

export interface Stage3D {
  readonly scene: THREE.Scene;
  /** Gọi mỗi khung: bào tử bay, dây leo lắc, cửa đóng/mở theo bản đồ. */
  update(timeSec: number, map: TileMap): void;
}

export function buildStage3D(
  map: TileMap,
  gate: { col: number; rows: readonly number[] } | undefined,
  lowQuality: boolean,
): Stage3D {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.fog);
  scene.fog = new THREE.FogExp2(PALETTE.fog, 0.026);

  // Ánh sáng: trời xanh lục, đất tối; đèn chính từ trước-trên-trái có bóng.
  scene.add(new THREE.HemisphereLight(0x8fe3c8, 0x1a2a24, 1.9));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.8);
  key.position.set(map.cols * 0.35, map.rows + 10, 14);
  key.target.position.set(map.cols / 2, 0, 0);
  if (!lowQuality) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 1024);
    const cam = key.shadow.camera;
    cam.left = -map.cols / 2 - 4;
    cam.right = map.cols / 2 + 4;
    cam.top = map.rows;
    cam.bottom = -map.rows;
    cam.near = 1;
    cam.far = 80;
    key.shadow.bias = -0.0015;
  }
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x4fd1ff, 1.4);
  rim.position.set(map.cols, 6, -12);
  const fill = new THREE.DirectionalLight(0xa8dcff, 0.9);
  fill.position.set(map.cols / 2, 4, 30);
  fill.target.position.set(map.cols / 2, 4, 0);
  scene.add(rim, fill, fill.target);

  // Khối đặc: InstancedMesh, một lần vẽ cho cả bản đồ.
  const solids: { col: number; row: number }[] = [];
  const ones: { col: number; row: number }[] = [];
  const spikes: { col: number; row: number }[] = [];
  for (let row = 0; row < map.rows; row += 1)
    for (let col = 0; col < map.cols; col += 1) {
      const t = map.get(col, row);
      if (t === Tile.Solid && !(gate && col === gate.col && gate.rows.includes(row)))
        solids.push({ col, row });
      else if (t === Tile.OneWay) ones.push({ col, row });
      else if (t === Tile.Hazard) spikes.push({ col, row });
    }
  const depth = SOLID_FRONT + SOLID_BACK;
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture(),
    roughness: 0.85,
    metalness: 0.15,
  });
  const solidMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, depth),
    stoneMat,
    Math.max(1, solids.length),
  );
  const m = new THREE.Matrix4();
  solids.forEach((s, i) => {
    const c = cellCenter(s.col, s.row, map.rows);
    m.makeTranslation(c.x, c.y, (SOLID_FRONT - SOLID_BACK) / 2);
    solidMesh.setMatrixAt(i, m);
  });
  solidMesh.count = solids.length;
  solidMesh.castShadow = !lowQuality;
  solidMesh.receiveShadow = !lowQuality;
  scene.add(solidMesh);

  // Rêu sáng trên mặt các khối có ô trống phía trên (đọc được mép nền như bản 2D).
  const tops = solids.filter((s) => s.row > 0 && map.get(s.col, s.row - 1) !== Tile.Solid);
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x2f6a46,
    emissive: PALETTE.moss,
    emissiveIntensity: 0.3,
    roughness: 0.7,
  });
  // Rêu chỉ phủ dải trước của mặt khối, phần sau là đá: mép nền đọc rõ mà không chói cả mặt.
  const mossMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.02, 0.12, 0.9),
    mossMat,
    Math.max(1, tops.length),
  );
  tops.forEach((s, i) => {
    const c = cellCenter(s.col, s.row, map.rows);
    m.makeTranslation(c.x, c.y + 0.5, SOLID_FRONT - 0.43);
    mossMesh.setMatrixAt(i, m);
  });
  mossMesh.count = tops.length;
  mossMesh.receiveShadow = !lowQuality;
  scene.add(mossMesh);

  // Bục một chiều: tấm mỏng nổi, viền xanh dương.
  const platMat = new THREE.MeshStandardMaterial({
    color: 0x31424f,
    metalness: 0.5,
    roughness: 0.35,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0x0c1a22,
    emissive: PALETTE.neon,
    emissiveIntensity: 1.6,
  });
  const plat = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.22, 1.6),
    platMat,
    Math.max(1, ones.length),
  );
  const platEdge = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 0.05, 0.08),
    edgeMat,
    Math.max(1, ones.length),
  );
  ones.forEach((s, i) => {
    const c = cellCenter(s.col, s.row, map.rows);
    m.makeTranslation(c.x, c.y + 0.39, 0);
    plat.setMatrixAt(i, m);
    m.makeTranslation(c.x, c.y + 0.4, 0.82);
    platEdge.setMatrixAt(i, m);
  });
  plat.count = platEdge.count = ones.length;
  plat.castShadow = plat.receiveShadow = !lowQuality;
  scene.add(plat, platEdge);

  // Gai: chóp nhọn đỏ.
  if (spikes.length > 0) {
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x3a1f24,
      emissive: PALETTE.danger,
      emissiveIntensity: 0.6,
    });
    const sp = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.16, 0.6, 5),
      spikeMat,
      spikes.length * 3,
    );
    let k = 0;
    for (const s of spikes) {
      const c = cellCenter(s.col, s.row, map.rows);
      for (const dx of [-0.3, 0, 0.3]) {
        m.makeTranslation(c.x + dx, c.y - 0.2, 0);
        sp.setMatrixAt(k, m);
        k += 1;
      }
    }
    scene.add(sp);
  }

  // Cửa phòng boss: cột năng lượng, hiện khi bản đồ đóng cửa.
  const gateGroup = new THREE.Group();
  if (gate) {
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x1b2430,
      emissive: PALETTE.warn,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.85,
    });
    for (const row of gate.rows) {
      const c = cellCenter(gate.col, row, map.rows);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1, 1.4), barMat);
      bar.position.set(c.x, c.y, 0);
      gateGroup.add(bar);
    }
    scene.add(gateGroup);
  }

  // Tường nền: tấm lớn phía sau, mạch sáng mờ.
  // Bờ tường thấp ở chân (không che rừng phía sau).
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(map.cols + 40, 5),
    new THREE.MeshStandardMaterial({ color: 0x1a362e, roughness: 1 }),
  );
  back.position.set(map.cols / 2, -0.5, -SOLID_BACK - 0.01);
  back.receiveShadow = !lowQuality;
  scene.add(back);

  // Bầu trời xa: dải sáng xanh lục sau rừng để thân cây nổi thành bóng.
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4;
  skyCanvas.height = 128;
  const sg = skyCanvas.getContext('2d') as CanvasRenderingContext2D;
  const grad = sg.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#0b1f1c');
  grad.addColorStop(0.55, '#1f6b55');
  grad.addColorStop(0.8, '#3fa883');
  grad.addColorStop(1, '#0b1f1c');
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 4, 128);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(map.cols + 160, map.rows + 40),
    new THREE.MeshBasicMaterial({ map: skyTex, fog: false }),
  );
  sky.position.set(map.cols / 2, map.rows / 2 - 4, -40);
  scene.add(sky);

  // Rừng nền: thân cây lớn và dây leo sáng ở nhiều lớp sâu (sương làm mờ dần).
  const rng = mulberry(91);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x35503f, roughness: 0.95 });
  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x0c241a,
    emissive: PALETTE.moss,
    emissiveIntensity: 0.9,
  });
  const vines: THREE.Mesh[] = [];
  for (let i = 0; i < 26; i += 1) {
    const z = -6 - rng() * 22;
    const r = 0.5 + rng() * 1.3;
    const h = map.rows + 14;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 9), trunkMat);
    trunk.position.set(-10 + rng() * (map.cols + 20), h / 2 - 3, z);
    scene.add(trunk);
    if (rng() < 0.7) {
      const len = 2 + rng() * 5;
      const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, len, 4), vineMat);
      vine.position.set(trunk.position.x + r + 0.2, map.rows - len / 2 + 1, z + 0.5);
      vine.userData.phase = rng() * 6.28;
      vines.push(vine);
      scene.add(vine);
    }
  }
  // Dây leo treo ngay sau mặt chơi.
  for (let i = 0; i < 14; i += 1) {
    const len = 1.5 + rng() * 3.5;
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 4), vineMat);
    vine.position.set(1 + rng() * (map.cols - 2), map.rows - 1 - len / 2, -1.6 - rng() * 1.2);
    vine.userData.phase = rng() * 6.28;
    vines.push(vine);
    scene.add(vine);
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), vineMat);
    bud.position.set(0, -len / 2, 0);
    vine.add(bud);
  }

  // Cột sáng xiên từ tán cây (cộng màu).
  const shaftMat = new THREE.MeshBasicMaterial({
    color: 0x9dffcf,
    transparent: true,
    opacity: 0.05,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 6; i += 1) {
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.5, map.rows + 8), shaftMat);
    shaft.position.set(rng() * map.cols, map.rows / 2, -2 - rng() * 6);
    shaft.rotation.z = 0.35;
    scene.add(shaft);
  }

  // Bào tử phát sáng bay chậm.
  const count = lowQuality ? 120 : 320;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    pos[i * 3] = rng() * map.cols;
    pos[i * 3 + 1] = rng() * (map.rows + 2);
    pos[i * 3 + 2] = -6 + rng() * 9;
  }
  const sporeGeo = new THREE.BufferGeometry();
  sporeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const spores = new THREE.Points(
    sporeGeo,
    new THREE.PointsMaterial({
      color: 0xb6ffd6,
      size: 0.09,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(spores);
  const base = pos.slice();

  return {
    scene,
    update(timeSec: number, current: TileMap): void {
      const p = sporeGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < count; i += 1) {
        const ph = i * 1.7;
        p.setX(i, (base[i * 3] as number) + Math.sin(timeSec * 0.3 + ph) * 0.6);
        p.setY(i, ((base[i * 3 + 1] as number) + timeSec * 0.25 + ph) % (current.rows + 2));
      }
      p.needsUpdate = true;
      for (const v of vines)
        v.rotation.z = Math.sin(timeSec * 0.8 + (v.userData.phase as number)) * 0.06;
      if (gate) {
        const closed = gate.rows.some((r) => current.isSolid(gate.col, r));
        gateGroup.visible = closed;
        if (closed)
          for (const bar of gateGroup.children) bar.scale.x = 1 + Math.sin(timeSec * 12) * 0.15;
      }
    },
  };
}

/** Ngẫu nhiên có hạt giống để cảnh nền giống nhau mỗi lần mở. */
function mulberry(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
