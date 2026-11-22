/**
 * Nhân vật và hiệu ứng của demo 2.5D: Kai, Thorna (dựng từ khối 3D, không cần file mô hình), đạn,
 * vùng cảnh báo đòn boss, hạt va chạm. Mọi vị trí lấy từ StageWorld (logic không đổi); lớp này chỉ
 * vẽ và tạo hoạt ảnh. Mô hình dựng hướng mặt +x rồi xoay quanh trục y theo hướng nhìn, nghiêng về
 * phía camera để thấy 3/4 thân (cảm giác 2.5D).
 */
import * as THREE from 'three';
import type { Boss } from '../logic/boss/boss';
import type { Projectile } from '../logic/combat/projectiles';
import type { PlayerPhysics } from '../logic/player/player-physics';
import type { TileMap } from '../logic/tilemap';
import { approach, boxCenter, boxFoot } from './coords';
import { PALETTE } from './stage3d';

const TILE = 16;
/** Góc nghiêng về phía camera khi nhìn sang phải (rad). */
const TURN = 0.5;

function std(
  color: number,
  opts: Partial<THREE.MeshStandardMaterialParameters> = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.25, ...opts });
}

function glow(color: number, intensity = 2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x111111,
    emissive: color,
    emissiveIntensity: intensity,
  });
}

function shadowAll(o: THREE.Object3D): void {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
}

/** Góc quay theo hướng nhìn (mặt +x, nghiêng về camera). */
function yawFor(facing: number): number {
  return facing > 0 ? -TURN : Math.PI + TURN;
}

// ───────────────────────────── Kai ─────────────────────────────

export class KaiModel {
  readonly root = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly legL: THREE.Mesh;
  private readonly legR: THREE.Mesh;
  private readonly armor: THREE.MeshStandardMaterial;
  private readonly muzzle: THREE.Mesh;
  private readonly muzzleLight: THREE.PointLight;
  private readonly ghosts: THREE.Mesh[] = [];
  private yaw = yawFor(1);
  private squash = 0;
  private flash = 0;
  private muzzleTime = 0;

  constructor(scene: THREE.Scene) {
    this.armor = std(0xd8e2ea, { metalness: 0.35, roughness: 0.4 });
    const suit = std(0x56677a, { roughness: 0.6 });
    const accent = glow(PALETTE.neon, 1.6);
    const legGeo = new THREE.BoxGeometry(0.2, 0.62, 0.2);
    legGeo.translate(0, -0.31, 0);
    this.legL = new THREE.Mesh(legGeo, suit);
    this.legR = new THREE.Mesh(legGeo, suit);
    this.legL.position.set(0, 0.64, -0.12);
    this.legR.position.set(0, 0.64, 0.12);
    const bootGeo = new THREE.BoxGeometry(0.3, 0.12, 0.22);
    for (const leg of [this.legL, this.legR]) {
      const boot = new THREE.Mesh(bootGeo, this.armor);
      boot.position.set(0.05, -0.58, 0);
      leg.add(boot);
    }
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.3, 4, 10), this.armor);
    torso.position.y = 0.98;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.5), accent);
    belt.position.y = 0.72;
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.36), suit);
    pack.position.set(-0.26, 1.02, 0);
    const packLight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.06), accent);
    packLight.position.set(-0.38, 1.02, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), this.armor);
    head.position.y = 1.48;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.3), accent);
    visor.position.set(0.17, 1.5, 0);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.04), accent);
    fin.position.set(-0.05, 1.7, 0);
    fin.rotation.z = 0.35;
    // Súng Arc Cannon ở tay phía camera.
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 10), suit);
    cannon.rotation.z = -Math.PI / 2;
    cannon.position.set(0.28, 1.0, 0.28);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 14), accent);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(0.5, 1.0, 0.28);
    this.muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glow(0x9ff3ff, 4));
    this.muzzle.position.set(0.56, 1.0, 0.28);
    this.muzzle.visible = false;
    this.muzzleLight = new THREE.PointLight(PALETTE.neon, 0, 4);
    this.muzzleLight.position.copy(this.muzzle.position);
    const visorLight = new THREE.PointLight(PALETTE.neon, 0.35, 1.6);
    visorLight.position.set(0.35, 1.5, 0.2);
    this.body.add(
      this.legL,
      this.legR,
      torso,
      belt,
      pack,
      packLight,
      head,
      visor,
      fin,
      cannon,
      ring,
      this.muzzle,
      this.muzzleLight,
      visorLight,
    );
    this.body.scale.setScalar(1.12);
    this.root.add(this.body);
    shadowAll(this.body);
    scene.add(this.root);
    // Bóng mờ khi lướt.
    const ghostMat = new THREE.MeshBasicMaterial({
      color: PALETTE.neon,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 4; i += 1) {
      const g = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.9, 3, 8), ghostMat.clone());
      g.visible = false;
      scene.add(g);
      this.ghosts.push(g);
    }
  }

  get position(): THREE.Vector3 {
    return this.root.position;
  }

  /** Đạn vừa bắn: lóe ở nòng. */
  fired(): void {
    this.muzzleTime = 0.08;
  }

  hurt(): void {
    this.flash = 0.25;
  }

  update(pl: PlayerPhysics, map: TileMap, t: number, dt: number, landed: boolean): void {
    const foot = boxFoot(pl.box, map.heightPx, TILE);
    this.root.position.set(foot.x, foot.y, 0);
    this.yaw = approach(this.yaw, yawFor(pl.facing), 18, dt);
    this.root.rotation.y = this.yaw;
    if (landed) this.squash = 1;
    this.squash = Math.max(0, this.squash - dt * 6);
    this.flash = Math.max(0, this.flash - dt);
    this.muzzleTime = Math.max(0, this.muzzleTime - dt);
    const run = pl.state === 'run';
    const swing = run ? Math.sin(t * 15) * 0.75 : 0;
    let legL = swing;
    let legR = -swing;
    let lean = run ? -0.14 : 0;
    let tilt = 0;
    let sx = 1;
    let sy = 1 - this.squash * 0.18;
    if (pl.state === 'jump_up' || pl.state === 'wall_jump') {
      legL = -0.7;
      legR = 0.4;
    } else if (pl.state === 'jump_fall') {
      legL = 0.35;
      legR = -0.45;
    } else if (pl.state === 'dash') {
      lean = -0.55;
      sx = 1.25;
      sy = 0.88;
    } else if (pl.state === 'wall_slide') {
      legL = 0.5;
      legR = 0.1;
      tilt = 0.18;
    } else if (pl.state === 'dead') {
      tilt = -1.4;
    } else if (pl.state === 'idle') {
      sy *= 1 + Math.sin(t * 2.4) * 0.012;
    }
    this.legL.rotation.z = legL;
    this.legR.rotation.z = legR;
    this.body.rotation.z = lean;
    this.body.rotation.x = tilt;
    this.body.scale.set(1.12 * sx, 1.12 * sy, 1.12);
    this.body.position.y = run ? Math.abs(Math.sin(t * 15)) * 0.07 : 0;
    this.armor.emissive.setHex(this.flash > 0 ? PALETTE.danger : 0x000000);
    this.armor.emissiveIntensity = this.flash > 0 ? 1.5 : 0;
    this.root.visible = !pl.blinking || Math.floor(t * 20) % 2 === 0;
    this.muzzle.visible = this.muzzleTime > 0;
    this.muzzleLight.intensity = this.muzzleTime > 0 ? 6 : 0;
    // Bóng lướt: các bản sao mờ dần ở vị trí cũ.
    for (let i = this.ghosts.length - 1; i >= 0; i -= 1) {
      const g = this.ghosts[i] as THREE.Mesh;
      const mat = g.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, mat.opacity - dt * 2.5);
      g.visible = mat.opacity > 0.01;
    }
    if (pl.state === 'dash' && Math.floor(t * 30) % 2 === 0) {
      const g = this.ghosts.shift() as THREE.Mesh;
      g.position.set(foot.x, foot.y + 0.8, -0.1);
      (g.material as THREE.MeshBasicMaterial).opacity = 0.35;
      g.visible = true;
      this.ghosts.push(g);
    }
  }
}

// ───────────────────────────── Thorna ─────────────────────────────

export class ThornaModel {
  readonly root = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly crown = new THREE.Group();
  private readonly arms: THREE.Group[] = [];
  private readonly skin: THREE.MeshStandardMaterial;
  private readonly bark: THREE.MeshStandardMaterial;
  private readonly eyeMat: THREE.MeshStandardMaterial;
  private readonly coreLight: THREE.PointLight;
  private yaw = yawFor(-1);
  private sink = 0;

  constructor(
    scene: THREE.Scene,
    private readonly boss: Boss,
  ) {
    const W = boss.box.w / TILE;
    const H = boss.box.h / TILE;
    this.bark = std(0x3a4a2c, { roughness: 0.9, metalness: 0.05 });
    this.skin = std(0x3f8f5a, { roughness: 0.6 });
    this.eyeMat = glow(0xd9ff5a, 3);
    const leaf = std(0x2f7a46, {
      emissive: 0x1a5a2c,
      emissiveIntensity: 0.4,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(W * 0.32, W * 0.46, H * 0.68, 12),
      this.bark,
    );
    trunk.position.y = H * 0.34;
    // Gân sáng trên thân.
    const veinMat = glow(PALETTE.moss, 1.4);
    for (let i = 0; i < 3; i += 1) {
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.06, H * 0.5, 0.06), veinMat);
      const a = (i / 3) * Math.PI * 2 + 0.4;
      vein.position.set(Math.cos(a) * W * 0.38, H * 0.33, Math.sin(a) * W * 0.38);
      vein.rotation.z = 0.12;
      this.body.add(vein);
    }
    const head = new THREE.Mesh(new THREE.SphereGeometry(W * 0.44, 16, 12), this.skin);
    head.scale.y = 0.85;
    head.position.y = H * 0.76;
    const eyeGeo = new THREE.SphereGeometry(W * 0.07, 8, 6);
    for (const z of [-0.18, 0.18]) {
      const eye = new THREE.Mesh(eyeGeo, this.eyeMat);
      eye.position.set(W * 0.36, H * 0.8, z * W);
      this.body.add(eye);
    }
    // Tán lá và nụ hoa.
    for (let i = 0; i < 9; i += 1) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(W * 0.16, H * 0.42, 5), leaf);
      const a = (i / 9) * Math.PI * 2;
      blade.position.set(Math.cos(a) * W * 0.3, H * 0.98, Math.sin(a) * W * 0.3);
      blade.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
      this.crown.add(blade);
    }
    const bud = new THREE.Mesh(
      new THREE.IcosahedronGeometry(W * 0.2, 0),
      std(0xd94f9b, { emissive: 0xff4fa8, emissiveIntensity: 0.9 }),
    );
    bud.position.y = H * 1.08;
    this.crown.add(bud);
    // Tay dây leo: chuỗi đốt lắc lư.
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      let parent: THREE.Object3D = arm;
      for (let k = 0; k < 5; k += 1) {
        const seg = new THREE.Mesh(
          new THREE.SphereGeometry(W * (0.11 - k * 0.012), 8, 6),
          k % 2 ? this.bark : this.skin,
        );
        seg.position.set(W * 0.18, -H * 0.06, 0);
        parent.add(seg);
        parent = seg;
      }
      arm.position.set(W * 0.1, H * 0.6, side * W * 0.42);
      arm.userData.side = side;
      this.arms.push(arm);
      this.body.add(arm);
    }
    // Rễ quanh chân.
    for (let i = 0; i < 6; i += 1) {
      const root = new THREE.Mesh(new THREE.ConeGeometry(W * 0.09, W * 0.7, 5), this.bark);
      const a = (i / 6) * Math.PI * 2;
      root.position.set(Math.cos(a) * W * 0.5, W * 0.05, Math.sin(a) * W * 0.5);
      root.rotation.set(Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3);
      this.body.add(root);
    }
    this.coreLight = new THREE.PointLight(PALETTE.moss, 3, 9);
    this.coreLight.position.set(W * 0.6, H * 0.55, 0.8);
    this.body.add(trunk, head, this.crown, this.coreLight);
    shadowAll(this.body);
    this.root.add(this.body);
    scene.add(this.root);
  }

  update(map: TileMap, t: number, dt: number): void {
    const b = this.boss;
    const foot = boxFoot(b.box, map.heightPx, TILE);
    this.root.position.set(foot.x, foot.y - this.sink, -0.2);
    this.yaw = approach(this.yaw, yawFor(b.facing), 8, dt);
    this.root.rotation.y = this.yaw;
    const tele = b.state === 'telegraph';
    const k = b.telegraphProgress;
    // Lắc lư khi chờ; rung mạnh dần khi sắp ra đòn.
    const shake = tele ? Math.sin(t * (30 + 40 * k)) * 0.04 * (0.5 + k) : 0;
    this.body.rotation.z = Math.sin(t * 1.4) * 0.04 + shake;
    this.crown.rotation.y = t * 0.3;
    for (const arm of this.arms) {
      const side = arm.userData.side as number;
      const reach = b.state === 'active' ? 0.9 : tele ? -0.5 * k : 0;
      arm.rotation.z = Math.sin(t * 2 + side) * 0.35 + reach;
      arm.rotation.x = side * 0.3;
    }
    const blink = Math.floor(t * (6 + 14 * k)) % 2 === 0;
    let skin = 0x3f8f5a;
    let light = PALETTE.moss;
    let lightI = 3;
    if (b.flash > 0) {
      skin = 0xffffff;
      lightI = 6;
    } else if (b.stunned) {
      skin = 0x9be7ff;
      light = 0x9be7ff;
    } else if (tele) {
      const stalk = b.attack === 'stalk';
      skin = blink ? (stalk ? 0xc084fc : 0xffa94d) : 0x3f8f5a;
      light = stalk ? 0xc084fc : PALETTE.warn;
      lightI = 3 + 7 * k;
    } else if (b.state === 'active') {
      light = PALETTE.danger;
      lightI = 6;
    }
    this.skin.color.setHex(skin);
    this.skin.emissive.setHex(b.flash > 0 ? 0xffffff : tele && blink ? light : 0x000000);
    this.skin.emissiveIntensity = b.flash > 0 ? 1 : tele ? 0.6 : 0;
    this.coreLight.color.setHex(light);
    this.coreLight.intensity = lightI;
    this.eyeMat.emissive.setHex(tele ? light : 0xd9ff5a);
    if (b.state === 'dead') {
      this.sink = Math.min((b.box.h / TILE) * 0.7, this.sink + dt * 0.8);
      this.body.rotation.z = -0.3 * Math.min(1, this.sink);
      this.coreLight.intensity = 0;
      this.skin.color.setHex(0x2a3344);
    }
  }
}

// ───────────────────────────── Đạn ─────────────────────────────

const PROJ_COLOR: Readonly<Record<string, number>> = {
  shot: 0x7ff0ff,
  mid: 0x7ff0ff,
  charged: 0x4fd1ff,
  sweep: 0x7dff9a,
  enemyShot: 0xff7b5c,
  shockwave: 0xffa94d,
  drop: 0xff5d5d,
  bomb: 0xff8a3d,
  lash: 0x9be35a,
  root: 0xffd166,
  seed: 0xd94f9b,
};
/** Loại đạn vẽ thành khối dài theo hộp (đòn quét, sóng, rễ); còn lại là quả cầu sáng. */
const BOX_KINDS = new Set(['sweep', 'shockwave', 'lash', 'root']);

export class ProjectileLayer {
  private readonly live = new Map<number, THREE.Mesh>();
  private readonly free = new Map<string, THREE.Mesh[]>();
  private readonly mats = new Map<string, THREE.MeshStandardMaterial>();
  private readonly sphere = new THREE.SphereGeometry(0.5, 10, 8);
  private readonly box = new THREE.BoxGeometry(1, 1, 1);

  constructor(private readonly scene: THREE.Scene) {}

  private material(kind: string): THREE.MeshStandardMaterial {
    let m = this.mats.get(kind);
    if (!m) {
      const c = PROJ_COLOR[kind] ?? 0xffffff;
      m = new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: BOX_KINDS.has(kind) ? 1.4 : 3,
        transparent: BOX_KINDS.has(kind),
        opacity: BOX_KINDS.has(kind) ? 0.75 : 1,
      });
      this.mats.set(kind, m);
    }
    return m;
  }

  update(all: readonly Projectile[], map: TileMap, t: number): void {
    const seen = new Set<number>();
    for (const p of all) {
      if (!p.alive) continue;
      seen.add(p.id);
      let mesh = this.live.get(p.id);
      if (!mesh) {
        mesh =
          this.free.get(p.kind)?.pop() ??
          new THREE.Mesh(BOX_KINDS.has(p.kind) ? this.box : this.sphere, this.material(p.kind));
        mesh.userData.kind = p.kind;
        this.scene.add(mesh);
        this.live.set(p.id, mesh);
      }
      const c = boxCenter(p, map.heightPx, TILE);
      mesh.position.set(c.x, c.y, 0.15);
      if (BOX_KINDS.has(p.kind))
        mesh.scale.set(
          Math.max(0.15, p.w / TILE),
          Math.max(0.15, p.h / TILE),
          p.kind === 'shockwave' ? 1.6 : 0.6,
        );
      else {
        const r = Math.max(p.w, p.h) / TILE;
        const pulse = p.kind === 'charged' ? 1 + Math.sin(t * 30) * 0.15 : 1;
        mesh.scale.set(r * 1.4 * pulse, (Math.min(p.w, p.h) / TILE) * 1.4 * pulse, r * 1.4 * pulse);
      }
    }
    for (const [id, mesh] of this.live) {
      if (seen.has(id)) continue;
      this.live.delete(id);
      this.scene.remove(mesh);
      const kind = mesh.userData.kind as string;
      const list = this.free.get(kind) ?? [];
      list.push(mesh);
      this.free.set(kind, list);
    }
  }
}

// ───────────────────────── Cảnh báo đòn boss ─────────────────────────

/** Vùng cảnh báo (cột mưa đạn, đường bắn, vệt quất, vết nứt rễ…), vẽ lại mỗi khung từ một pool. */
export class TelegraphLayer {
  private readonly pool: THREE.Mesh[] = [];
  private used = 0;
  private readonly geo = new THREE.BoxGeometry(1, 1, 1);

  constructor(private readonly scene: THREE.Scene) {}

  private take(color: number, opacity: number): THREE.Mesh {
    let m = this.pool[this.used];
    if (!m) {
      m = new THREE.Mesh(
        this.geo,
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      this.scene.add(m);
      this.pool.push(m);
    }
    this.used += 1;
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.color.setHex(color);
    mat.opacity = opacity;
    m.visible = true;
    return m;
  }

  update(boss: Boss | undefined, map: TileMap, t: number): void {
    this.used = 0;
    if (boss && boss.state === 'telegraph') {
      const a = 0.25 + 0.6 * boss.telegraphProgress;
      const rows = map.rows;
      const floorY = (map.heightPx - (boss.box.y + boss.box.h)) / TILE;
      if (boss.attack === 'rain' || boss.attack === 'bloom') {
        for (const col of boss.rainCols) {
          const m = this.take(PALETTE.danger, a * 0.35);
          m.position.set(col + 0.5, rows / 2, 0.05);
          m.scale.set(0.9, rows - 2, 1.4);
        }
      } else if (boss.attack === 'shot' || boss.attack === 'thorns') {
        const y = (map.heightPx - boss.shotLaneY) / TILE;
        for (let x = 1; x < map.cols - 1; x += 1) {
          if (Math.floor(x + t * 8) % 2) continue;
          const m = this.take(PALETTE.danger, a);
          m.position.set(x + 0.5, y, 0.2);
          m.scale.set(0.5, 0.08, 0.08);
        }
      } else if (boss.attack === 'lash') {
        const reach = boss.lashReachPx / TILE;
        const cx =
          boss.facing > 0
            ? (boss.box.x + boss.box.w) / TILE + reach / 2
            : boss.box.x / TILE - reach / 2;
        const m = this.take(PALETTE.danger, a * 0.8);
        m.position.set(cx, floorY + 0.15, 0.2);
        m.scale.set(reach, 0.25, 1.6);
      } else if (boss.attack === 'roots') {
        for (const x of boss.rootXs) {
          const m = this.take(PALETTE.root, a);
          m.position.set(x / TILE, floorY + 0.03, 0.2);
          m.scale.set(0.9, 0.06, 1.8);
        }
      } else if (boss.attack === 'slam') {
        const m = this.take(PALETTE.warn, a);
        m.position.set(boss.slamTargetX / TILE, floorY + 0.05, 0.2);
        m.scale.set(1.2, 0.1, 1.8);
      }
    }
    if (boss) {
      const floorY = (map.heightPx - (boss.box.y + boss.box.h)) / TILE;
      for (const mark of boss.stalkMarks) {
        const col = this.take(0xc084fc, 0.15 + 0.3 * mark.progress);
        col.position.set(mark.x / TILE, floorY + 0.9, 0.1);
        col.scale.set(0.8, 1.8, 1.4);
      }
    }
    for (let i = this.used; i < this.pool.length; i += 1)
      (this.pool[i] as THREE.Mesh).visible = false;
  }
}

// ───────────────────────────── Hạt ─────────────────────────────

/** Hạt va chạm (pool cố định, cộng màu). */
export class Sparks {
  private readonly n = 360;
  private readonly pos = new Float32Array(this.n * 3);
  private readonly vel = new Float32Array(this.n * 3);
  private readonly life = new Float32Array(this.n);
  private readonly col = new Float32Array(this.n * 3);
  private readonly geo = new THREE.BufferGeometry();
  private next = 0;

  constructor(scene: THREE.Scene) {
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const pts = new THREE.Points(
      this.geo,
      new THREE.PointsMaterial({
        size: 0.16,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    pts.frustumCulled = false;
    scene.add(pts);
  }

  burst(x: number, y: number, color: number, count: number, speed = 6): void {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i += 1) {
      const k = this.next;
      this.next = (this.next + 1) % this.n;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.pos[k * 3] = x;
      this.pos[k * 3 + 1] = y;
      this.pos[k * 3 + 2] = 0.3;
      this.vel[k * 3] = Math.cos(a) * s;
      this.vel[k * 3 + 1] = Math.sin(a) * s + 2;
      this.vel[k * 3 + 2] = (Math.random() - 0.5) * s;
      this.life[k] = 0.4 + Math.random() * 0.4;
      this.col[k * 3] = c.r;
      this.col[k * 3 + 1] = c.g;
      this.col[k * 3 + 2] = c.b;
    }
  }

  update(dt: number): void {
    const { pos, vel, life, col } = this;
    for (let k = 0; k < this.n; k += 1) {
      const l = (life[k] ?? 0) - dt;
      if (l <= -dt) {
        pos[k * 3 + 1] = -100;
        continue;
      }
      life[k] = l;
      vel[k * 3 + 1] = (vel[k * 3 + 1] ?? 0) - 14 * dt;
      for (let j = 0; j < 3; j += 1)
        pos[k * 3 + j] = (pos[k * 3 + j] ?? 0) + (vel[k * 3 + j] ?? 0) * dt;
      if (l < 0.5) for (let j = 0; j < 3; j += 1) col[k * 3 + j] = (col[k * 3 + j] ?? 0) * 0.92;
    }
    (this.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }
}
