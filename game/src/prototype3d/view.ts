import * as THREE from 'three';
import type { Marker3, Prototype3dConfig } from '../core/prototype3d-config';
import { segmentHit } from '../logic/prototype3d/geometry';
import type { PrototypeRoom } from '../logic/prototype3d/room';
import { KaiActor, type Models3d } from './models';
import { makeTerrain } from './terrain';

const MINT = 0x72f0db;
const AMBER = 0xffbd6e;
const RADIANS = Math.PI / 180;

function ring(radius: number, band: number, color: number) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(radius - band, radius, 40),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function pad(p: Marker3, color: number) {
  const fixture = new THREE.Group();
  fixture.position.set(p.x, p.y + 0.024, p.z);
  const outline = ring(0.86, 0.062, color);
  const inner = ring(0.65, 0.025, color);
  fixture.add(outline, inner);
  const tick = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.09, 0.11),
    new THREE.MeshBasicMaterial({ color }),
  );
  for (const angle of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    const led = tick.clone();
    led.position.set(0.84 * Math.sin(angle), 0, 0.84 * Math.cos(angle));
    fixture.add(led);
  }
  return { fixture, outline, inner };
}

function makeGate(c: Prototype3dConfig['gate']) {
  const gate = new THREE.Group();
  gate.position.set(c.x, c.y, c.z);
  const metal = new THREE.MeshStandardMaterial({
    color: 0x273d48,
    metalness: 0.45,
    roughness: 0.4,
  });
  const light = new THREE.MeshBasicMaterial({ color: AMBER });
  const cores = new THREE.MeshBasicMaterial({ color: MINT, opacity: 0.58, transparent: true });
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.34, c.height, c.depth + 0.11), metal);
    post.position.set(side * (c.width / 2 - 0.18), c.height / 2, 0);
    const rim = new THREE.Mesh(new THREE.BoxGeometry(0.08, c.height - 0.2, c.depth + 0.24), light);
    rim.position.copy(post.position);
    gate.add(post, rim);
  }
  const block = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(c.width - 0.64, c.height - 0.24, c.depth * 0.65),
    metal,
  );
  panel.position.y = c.height / 2;
  block.add(panel);
  for (let i = 1; i <= 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(c.width - 0.94, 0.045, c.depth * 0.72),
      cores,
    );
    stripe.position.y = (i * c.height) / 4;
    block.add(stripe);
  }
  gate.add(block);
  return { gate, block };
}

function makeRelay(p: Marker3) {
  const root = new THREE.Group();
  root.position.set(p.x, p.y, p.z);
  const decoration = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(p.radius * 0.72, 0),
    new THREE.MeshStandardMaterial({
      color: AMBER,
      emissive: 0x9b441a,
      emissiveIntensity: 1.4,
      roughness: 0.34,
    }),
  );
  const brace = new THREE.Mesh(
    new THREE.TorusGeometry(p.radius * 0.98, 0.038, 5, 18),
    new THREE.MeshBasicMaterial({ color: AMBER }),
  );
  decoration.add(body, brace);
  root.add(decoration);
  return { root, decoration, body, brace };
}

function playerShadow() {
  const pixels = new Uint8Array(32 * 32 * 4);
  for (let j = 0; j < 32; j++)
    for (let i = 0; i < 32; i++) {
      const distance = Math.min(1, Math.hypot(i - 15.5, j - 15.5) / 15.5);
      pixels[(j * 32 + i) * 4 + 3] = Math.round(204 * (1 - distance) ** 1.7);
    }
  const map = new THREE.DataTexture(pixels, 32, 32);
  map.magFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.46, 1.46),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  return shadow;
}

export class PrototypeView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly focus = new THREE.Vector3();
  private readonly candidate = new THREE.Vector3();
  private readonly followOffset: THREE.Vector3;
  private readonly actor: KaiActor;
  private readonly gate: ReturnType<typeof makeGate>;
  private readonly relay: ReturnType<typeof makeRelay>;
  private readonly checkpoints: ReturnType<typeof pad>[];
  private readonly exit: ReturnType<typeof pad>;
  private readonly shadow = playerShadow();
  private readonly landing = ring(0.53, 0.035, MINT);
  private readonly boltMeshes = new Map<number, THREE.Mesh>();
  private readonly boltGeometry = new THREE.CylinderGeometry(0.035, 0.07, 0.55, 6);
  private readonly boltMaterial = new THREE.MeshBasicMaterial({ color: 0x8bffed });
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly dir = new THREE.Vector3();
  private lastFalls = 0;
  private lastReset = true;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly config: Prototype3dConfig,
    model: Models3d | undefined,
    private readonly low: boolean,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !low,
      powerPreference: 'high-performance',
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.23;
    this.scene.background = new THREE.Color(model ? 0x152d3d : 0x1d2d3a);
    this.scene.fog = new THREE.FogExp2(this.scene.background, 0.035);
    this.scene.add(new THREE.HemisphereLight(0xc2f9ff, 0x447176, 2.15));
    const key = new THREE.DirectionalLight(0xffe5ce, 2.25);
    key.position.set(-12, 18, 5);
    const fill = new THREE.DirectionalLight(0x58e8d5, 1.1);
    fill.position.set(8, 5, -14);
    this.scene.add(key, fill);
    this.camera = new THREE.PerspectiveCamera(config.camera.fovDeg, 1, 0.14, 106);
    const yaw = config.camera.yawDeg * RADIANS;
    this.followOffset = new THREE.Vector3(
      Math.sin(yaw) * config.camera.distance,
      config.camera.height,
      Math.cos(yaw) * config.camera.distance,
    );

    makeTerrain(this.scene, config, model?.kit);
    this.actor = new KaiActor(model?.kai);
    this.gate = makeGate(config.gate);
    this.relay = makeRelay(config.relay);
    this.checkpoints = config.checkpoints.map((p) => pad(p, MINT));
    this.exit = pad(config.finish, AMBER);
    this.exit.fixture.scale.setScalar(1.66);
    const finishArch = this.gate.gate.clone();
    const panel = finishArch.children.at(-1);
    if (panel) finishArch.remove(panel);
    finishArch.position.set(config.finish.x, config.finish.y, config.finish.z - 0.7);
    finishArch.scale.set(0.6, 0.88, 0.8);
    this.scene.add(
      this.actor.root,
      this.gate.gate,
      this.relay.root,
      ...this.checkpoints.map((p) => p.fixture),
      this.exit.fixture,
      finishArch,
      this.shadow,
      this.landing,
    );
    this.landing.material.depthWrite = false;
  }

  size(width: number, height: number) {
    this.renderer.setPixelRatio(this.low ? 1 : Math.min(devicePixelRatio || 1, 1.6));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  reset() {
    this.lastReset = true;
  }

  render(world: PrototypeRoom, dt: number, time: number, preview: boolean) {
    const snap = this.lastReset || (this.lastFalls !== world.falls && world.respawnLeft <= 0);
    if (world.respawnLeft <= 0) this.lastFalls = world.falls;
    this.lastReset = false;
    this.actor.update(
      world,
      dt,
      snap,
      preview ? this.config.camera.yawDeg * RADIANS + 0.22 : undefined,
    );
    this.follow(world, dt, snap, preview);
    this.updateFixtures(world, dt, time);
    this.updateBolts(world);
    this.renderer.render(this.scene, this.camera);
  }

  private follow(world: PrototypeRoom, dt: number, snap: boolean, preview: boolean) {
    const { x, y, z } = world.position;
    const settings = this.config.camera;
    const depth = settings.lookAhead;
    const lookY = world.respawnLeft > 0 ? this.focus.y : y + settings.lookHeight;
    this.candidate.set(x + world.facing.x * depth, lookY, z + world.facing.z * depth);
    if (preview) {
      const yaw = settings.yawDeg * RADIANS;
      this.candidate.x -= 2.85 * Math.cos(yaw);
      this.candidate.z += 2.85 * Math.sin(yaw);
    }
    if (snap) this.candidate.y = y + settings.lookHeight;
    this.focus.lerp(this.candidate, snap ? 1 : 1 - Math.exp(-settings.follow * dt));
    this.candidate.copy(this.focus).add(this.followOffset);
    let nearest = 1;
    for (const box of world.obstacles) {
      const hit = segmentHit(this.focus, this.candidate, box);
      if (hit !== undefined && hit > 0.04) nearest = Math.min(nearest, Math.max(0.3, hit - 0.045));
    }
    this.camera.position.copy(this.candidate).lerp(this.focus, 1 - nearest);
    this.camera.lookAt(this.focus);
  }

  private updateFixtures(world: PrototypeRoom, dt: number, time: number) {
    const active = world.relayPowered;
    const open = active ? this.config.gate.height + 0.15 : 0;
    this.gate.block.position.y += (open - this.gate.block.position.y) * (1 - Math.exp(-12 * dt));
    this.relay.decoration.rotation.y = time * 1.6;
    this.relay.decoration.rotation.x = 0.16 * Math.sin(time * 2.2);
    this.relay.body.material.color.setHex(active ? MINT : AMBER);
    this.relay.body.material.emissive.setHex(active ? 0x239a87 : 0x9b441a);
    this.relay.brace.material.color.setHex(active ? MINT : world.aimingAtRelay ? 0xfff5d6 : AMBER);
    const pulse = 0.78 + Math.sin(time * 3.4) * 0.19;
    this.relay.brace.scale.setScalar(world.aimingAtRelay ? 1.12 : 1);
    for (const [i, p] of this.checkpoints.entries()) {
      p.outline.material.opacity = i <= world.checkpoint ? 0.96 : pulse * 0.64;
      p.inner.material.opacity = i <= world.checkpoint ? 0.85 : 0.35;
    }
    this.exit.outline.material.opacity = pulse;

    const landing = world.landingY;
    const p = world.position;
    this.landing.visible = landing !== undefined && !world.grounded && world.respawnLeft <= 0;
    this.shadow.visible = landing !== undefined && world.respawnLeft <= 0;
    if (landing !== undefined) {
      this.shadow.position.set(p.x, landing + 0.018, p.z);
      this.shadow.material.opacity = 1 - Math.min(0.68, (p.y - landing) * 0.22);
      this.landing.position.set(p.x, landing + 0.021, p.z);
      this.landing.material.opacity = pulse;
    }
  }

  private updateBolts(world: PrototypeRoom) {
    const ids = new Set<number>();
    for (const bolt of world.bolts) {
      ids.add(bolt.id);
      let mesh = this.boltMeshes.get(bolt.id);
      if (!mesh) {
        mesh = new THREE.Mesh(this.boltGeometry, this.boltMaterial);
        this.scene.add(mesh);
        this.boltMeshes.set(bolt.id, mesh);
      }
      const { x, y, z } = bolt.position;
      const start = Math.max(0, 1 - (this.config.shotLifetimeSec - bolt.remaining) * 14);
      mesh.position.set(x, y, z);
      if (start > 0) mesh.position.lerp(this.actor.barrel, start);
      this.dir.set(bolt.velocity.x, bolt.velocity.y, bolt.velocity.z).normalize();
      mesh.quaternion.setFromUnitVectors(this.up, this.dir);
    }
    for (const [id, mesh] of this.boltMeshes) {
      if (ids.has(id)) continue;
      mesh.removeFromParent();
      this.boltMeshes.delete(id);
    }
  }
}
