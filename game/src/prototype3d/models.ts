import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type { KaiClip, PrototypeRoom } from '../logic/prototype3d/room';

export type KitPart = 'Floor' | 'Platform' | 'Edge' | 'Wall';

const KIT_PARTS: readonly KitPart[] = ['Floor', 'Platform', 'Edge', 'Wall'];
const CLIPS: readonly KaiClip[] = ['Idle', 'Run', 'Jump', 'Fall', 'Land', 'Dash', 'Shoot'];

export interface Models3d {
  kai: GLTF;
  kit: ReadonlyMap<KitPart, THREE.Object3D>;
}

export async function loadModels(base: URL): Promise<Models3d> {
  const loader = new GLTFLoader();
  const [kai, terrain] = await Promise.all([
    loader.loadAsync(new URL('kai.glb', base).href),
    loader.loadAsync(new URL('terrain-kit.glb', base).href),
  ]);
  const kit = new Map<KitPart, THREE.Object3D>();
  for (const id of KIT_PARTS) {
    const module = terrain.scene.getObjectByName(id);
    if (!module) throw new Error(`Thiếu mô-đun ${id} trong terrain-kit.glb`);
    kit.set(id, module);
  }
  for (const clip of CLIPS) {
    if (!kai.animations.some((animation) => animation.name === clip))
      throw new Error(`Thiếu hoạt ảnh Kai ${clip}`);
  }
  if (!kai.scene.getObjectByName('Muzzle')) throw new Error('Thiếu điểm nòng Arc Cannon trên Kai');
  return { kai, kit };
}

export class KaiActor {
  readonly root = new THREE.Group();
  private readonly mixer: THREE.AnimationMixer | undefined;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private readonly socket: THREE.Object3D | undefined;
  private readonly flash = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.13),
    new THREE.MeshBasicMaterial({ color: 0xbefff2, transparent: true }),
  );
  private current: KaiClip | undefined;
  private previousShots = 0;
  private flashTime = 0;

  constructor(model: GLTF | undefined) {
    if (model) {
      this.root.add(model.scene);
      this.socket = model.scene.getObjectByName('Muzzle');
      this.mixer = new THREE.AnimationMixer(model.scene);
      for (const animation of model.animations) {
        const action = this.mixer.clipAction(animation);
        if (animation.name !== 'Idle' && animation.name !== 'Run') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        this.actions.set(animation.name, action);
      }
    } else {
      const material = new THREE.MeshStandardMaterial({ color: 0xd5e0e7, roughness: 0.8 });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.89, 4, 8), material);
      body.position.y = 0.76;
      const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.21, 0.21), material);
      arrow.position.set(0.16, 1.05, 0.34);
      this.root.add(body, arrow);
    }
    this.flash.visible = false;
    if (this.socket) this.socket.add(this.flash);
    else {
      this.flash.position.set(0.17, 1.05, 0.47);
      this.root.add(this.flash);
    }
  }

  update(world: PrototypeRoom, dt: number, snap: boolean, previewYaw?: number) {
    const p = world.position;
    this.root.position.set(p.x, p.y, p.z);
    const yaw = previewYaw ?? Math.atan2(world.facing.x, world.facing.z);
    const difference = yaw - this.root.rotation.y;
    this.root.rotation.y += snap
      ? difference
      : Math.atan2(Math.sin(difference), Math.cos(difference)) * (1 - Math.exp(-16 * dt));
    const clip = world.clip;
    if (this.current !== clip) {
      if (this.current) this.actions.get(this.current)?.fadeOut(0.085);
      this.actions.get(clip)?.reset().fadeIn(0.085).play();
      this.current = clip;
    }
    this.mixer?.update(dt);
    if (world.shots > this.previousShots) this.flashTime = 0.09;
    this.previousShots = world.shots;
    this.flashTime = Math.max(0, this.flashTime - dt);
    this.flash.visible = this.flashTime > 0;
    this.flash.material.opacity = this.flashTime / 0.09;
    this.root.visible = world.respawnLeft <= 0;
  }

  get barrel(): THREE.Vector3 {
    return this.flash.getWorldPosition(new THREE.Vector3());
  }
}
