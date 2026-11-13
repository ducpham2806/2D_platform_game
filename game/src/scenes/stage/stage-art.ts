import Phaser from 'phaser';
import {
  type ActorBase,
  type ArtManifest,
  solidTileIndex,
  type StageTheme,
  TILE_INDEX,
} from '../../core/art-manifest';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from '../../core/constants';
import type { Boss } from '../../logic/boss/boss';
import { Golem, ShieldCharger } from '../../logic/enemy/behaviors';
import type { Enemy } from '../../logic/enemy/enemy';
import type { PlayerStateName } from '../../logic/player/player-physics';
import { Tile, type TileMap } from '../../logic/tilemap';
import type { StageWorld } from '../../logic/world/stage-world';

/** Thứ tự vẽ của màn chơi (HUD và hộp thoại dùng depth riêng, lớn hơn). */
export const ArtDepth = {
  bgFar: -30,
  bgMid: -29,
  tiles: -20,
  /** Graphics động (boss, kẻ địch dạng khối, hạt) ở depth 0. */
  props: -5,
  actors: 0.5,
  projectiles: 1,
  kai: 2,
  fx: 3,
} as const;

const PARALLAX = { far: 0.2, mid: 0.5 } as const;
const BASE = 'assets';

/** Xếp hàng tải mọi spritesheet và ảnh trong assets.json (gọi trong lúc tải). */
export function queueArt(scene: Phaser.Scene, manifest: ArtManifest): void {
  for (const s of manifest.sheets)
    scene.load.spritesheet(s.key, `${BASE}/${s.file}`, {
      frameWidth: s.frameW,
      frameHeight: s.frameH,
    });
  for (const i of manifest.images) scene.load.image(i.key, `${BASE}/${i.file}`);
}

/** Tạo hoạt ảnh toàn cục: mỗi spritesheet có fps > 0 thành một hoạt ảnh cùng tên. */
export function createAnimations(scene: Phaser.Scene, manifest: ArtManifest): void {
  for (const s of manifest.sheets) {
    if (s.fps <= 0 || scene.anims.exists(s.key)) continue;
    scene.anims.create({
      key: s.key,
      frames: scene.anims.generateFrameNumbers(s.key, { start: 0, end: s.frames - 1 }),
      frameRate: s.fps,
      repeat: s.loop ? -1 : 0,
    });
  }
}

/** Hai lớp nền parallax phủ kín khung hình, cuộn theo camera. */
export class Backdrop {
  private readonly far: Phaser.GameObjects.TileSprite;
  private readonly mid: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene, theme: StageTheme) {
    const make = (key: string, depth: number): Phaser.GameObjects.TileSprite =>
      scene.add
        .tileSprite(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT, key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(depth);
    this.far = make(`bg_${theme}_l1`, ArtDepth.bgFar);
    this.mid = make(`bg_${theme}_l2`, ArtDepth.bgMid);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.far.tilePositionX = Math.round(camera.scrollX * PARALLAX.far);
    this.mid.tilePositionX = Math.round(camera.scrollX * PARALLAX.mid);
  }
}

/**
 * Dựng lớp ô tĩnh của bản đồ bằng tileset của chủ đề: khối đặc tự ghép viền theo hàng xóm,
 * bục một chiều, gai. `skip`: ô vẽ động (vật chắn vỡ được, cửa) nên bỏ qua.
 */
export function buildTileLayer(
  scene: Phaser.Scene,
  map: TileMap,
  theme: StageTheme,
  skip: (col: number, row: number) => boolean,
): void {
  const solid = (c: number, r: number): boolean =>
    c < 0 || r < 0 || c >= map.cols || r >= map.rows || map.get(c, r) === Tile.Solid;
  const data: number[][] = [];
  for (let r = 0; r < map.rows; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < map.cols; c += 1) {
      const tile = map.get(c, r);
      if (skip(c, r)) row.push(-1);
      else if (tile === Tile.Solid) row.push(solidTileIndex(solid, c, r));
      else if (tile === Tile.OneWay) row.push(TILE_INDEX.oneWay);
      else if (tile === Tile.Hazard) row.push(TILE_INDEX.spike);
      else row.push(-1);
    }
    data.push(row);
  }
  const t = map.tileSize;
  const tilemap = scene.make.tilemap({ data, tileWidth: t, tileHeight: t });
  const key = `ts_${theme}`;
  const tileset = tilemap.addTilesetImage(key, key, t, t, 0, 0);
  if (!tileset) throw new Error(`Không tạo được tileset ${key}`);
  tilemap.createLayer(0, tileset, 0, 0)?.setDepth(ArtDepth.tiles);
}

/**
 * Bể hình vẽ lại mỗi khung (đạn, vật phẩm, ô động): `begin()`, nhiều lần `put(...)`, rồi `end()`
 * để ẩn hình thừa. Không tạo đối tượng mới sau khi bể đã đủ lớn.
 */
export class SpritePool {
  private readonly items: Phaser.GameObjects.Image[] = [];
  private used = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
  ) {}

  begin(): void {
    this.used = 0;
  }

  /** Đặt hình `key` (khung `frame`) với tâm ở (x, y). */
  put(key: string, frame: number, x: number, y: number, flipX = false): Phaser.GameObjects.Image {
    let img = this.items[this.used];
    if (!img) {
      img = this.scene.add.image(0, 0, key, frame).setDepth(this.depth);
      this.items.push(img);
    }
    this.used += 1;
    return img
      .setTexture(key, frame)
      .setPosition(Math.round(x), Math.round(y))
      .setFlipX(flipX)
      .setAlpha(1)
      .clearTint()
      .setVisible(true);
  }

  end(): void {
    for (let i = this.used; i < this.items.length; i += 1) this.items[i]?.setVisible(false);
  }
}

/** Hiệu ứng chạy một lần rồi tự ẩn (lóe nòng, nổ, Kai tan rã), lấy từ bể. */
export class FxLayer {
  private readonly idle: Phaser.GameObjects.Sprite[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  play(key: string, x: number, y: number, flipX = false): void {
    let sprite = this.idle.pop();
    if (!sprite) {
      sprite = this.scene.add.sprite(0, 0, key).setDepth(ArtDepth.fx);
      const s = sprite;
      s.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        s.setVisible(false);
        this.idle.push(s);
      });
    }
    sprite.setPosition(Math.round(x), Math.round(y)).setFlipX(flipX).setVisible(true).play(key);
  }
}

const KAI_STATE_ANIM: Readonly<Record<PlayerStateName, string>> = {
  idle: 'kai_idle',
  run: 'kai_run',
  land: 'kai_land',
  jump_up: 'kai_jump_up',
  jump_fall: 'kai_jump_fall',
  dash: 'kai_dash',
  wall_slide: 'kai_wall_slide',
  wall_jump: 'kai_wall_jump',
  hurt: 'kai_hurt',
  dead: 'kai_hurt',
};
/** Khung hình Kai 48x48, chân ở giữa đáy; nòng pháo cách chân chừng này (px) khi đứng. */
const KAI_MUZZLE = { x: 12, y: 15 } as const;

/** Hình Kai: hoạt ảnh theo trạng thái, lật theo hướng, co giãn, vòng nạp ở nòng pháo. */
export class KaiView {
  readonly sprite: Phaser.GameObjects.Sprite;
  private readonly charge: Phaser.GameObjects.Sprite;
  private respawning = false;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add.sprite(0, 0, 'kai_idle').setOrigin(0.5, 1).setDepth(ArtDepth.kai);
    this.charge = scene.add.sprite(0, 0, 'fx_charge_1').setDepth(ArtDepth.fx).setVisible(false);
    this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'kai_respawn', () => {
      this.respawning = false;
    });
  }

  /** Chạy hoạt ảnh hồi sinh một lần rồi mới trở lại hoạt ảnh theo trạng thái. */
  playRespawn(): void {
    this.respawning = true;
    this.sprite.play('kai_respawn');
  }

  /**
   * @param feetX, feetY giữa hai chân (đáy hộp va chạm), đã nội suy.
   * @param chargeLevel 0 không nạp, 1 nạp vừa, 2 nạp đầy.
   */
  update(
    world: StageWorld,
    feetX: number,
    feetY: number,
    scaleX: number,
    scaleY: number,
    visible: boolean,
    chargeLevel: number,
  ): void {
    const pl = world.player;
    if (!this.respawning) this.sprite.play(KAI_STATE_ANIM[pl.state], true);
    const right = pl.facing > 0;
    this.sprite
      .setPosition(feetX, feetY)
      .setFlipX(!right)
      .setScale(scaleX, scaleY)
      .setVisible(visible);
    if (chargeLevel > 0 && visible) {
      const key = chargeLevel >= 2 ? 'fx_charge_full' : 'fx_charge_1';
      this.charge
        .setPosition(feetX + (right ? KAI_MUZZLE.x : -KAI_MUZZLE.x), feetY - KAI_MUZZLE.y)
        .setVisible(true)
        .play(key, true);
    } else {
      this.charge.setVisible(false);
    }
  }
}

/** Khung hoạt ảnh lặp của một spritesheet theo thời gian (cho hình vẽ bằng SpritePool). */
function loopFrame(timeMs: number, frames: number, fps: number): number {
  return Math.floor((timeMs / 1000) * fps) % frames;
}

const PROJECTILE_ART: Readonly<Record<string, { key: string; frames: number; fps: number }>> = {
  shot: { key: 'fx_arc_shot', frames: 3, fps: 12 },
  mid: { key: 'fx_arc_mid', frames: 3, fps: 12 },
  charged: { key: 'fx_arc_charged', frames: 4, fps: 12 },
  enemyShot: { key: 'fx_enemy_shot', frames: 3, fps: 10 },
  shockwave: { key: 'fx_shockwave', frames: 3, fps: 12 },
  drop: { key: 'fx_drop', frames: 2, fps: 12 },
  seed: { key: 'fx_seed', frames: 3, fps: 10 },
  bomb: { key: 'fx_bomb', frames: 2, fps: 8 },
};
/** Đòn dạng dải dài (kích thước theo dữ liệu): ghép từ đốt 16 px, khung 0 = thân, 1 = ngọn. */
const SEGMENT = 16;

interface BoxLike {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Dải ngang (Dây Quất, roi Vine Lash): ngọn ở đầu xa người ra đòn (`dir` 1 = sang phải). */
function putWhip(pool: SpritePool, key: string, box: BoxLike, dir: number): void {
  const n = Math.max(1, Math.ceil(box.w / SEGMENT));
  const cy = box.y + box.h / 2;
  for (let i = 0; i < n; i += 1) {
    const last = i === n - 1;
    // Đốt cuối canh theo mép xa để dải không dài quá hộp gây sát thương.
    const off = last ? box.w - SEGMENT / 2 : i * SEGMENT + SEGMENT / 2;
    const x = dir > 0 ? box.x + off : box.x + box.w - off;
    pool.put(key, last ? 1 : 0, x, cy, dir < 0);
  }
}

/** Cột rễ trồi: ngọn ở trên cùng, thân lặp xuống tới đáy hộp. */
function putRoot(pool: SpritePool, box: BoxLike): void {
  const cx = box.x + box.w / 2;
  const n = Math.max(1, Math.ceil(box.h / SEGMENT));
  for (let i = 0; i < n; i += 1)
    pool.put('fx_root', i === 0 ? 0 : 1, cx, box.y + i * SEGMENT + SEGMENT / 2);
}

/** Sắp biến mất thì nhấp nháy (giống bản vẽ khối trước đây). */
const PICKUP_BLINK_SEC = 2;

/** Vẽ đạn, vật phẩm, cửa, checkpoint, vật chắn bằng hình (gọi mỗi khung). */
export function drawWorldArt(
  pool: SpritePool,
  world: StageWorld,
  theme: StageTheme,
  timeMs: number,
): void {
  const t = world.map.tileSize;
  const ts = `ts_${theme}`;
  const half = t / 2;
  pool.begin();
  for (const p of world.pool.all) {
    if (p.kind === 'root') putRoot(pool, p);
    else if (p.kind === 'lash') putWhip(pool, 'fx_lash', p, world.boss?.facing ?? 1);
    else if (p.kind === 'sweep') putWhip(pool, 'fx_sweep', p, world.player.facing);
    else {
      const art = PROJECTILE_ART[p.kind];
      if (!art) continue;
      const frame = loopFrame(timeMs, art.frames, art.fps);
      pool.put(art.key, frame, p.x + p.w / 2, p.y + p.h / 2, p.vx < 0);
    }
  }
  // Bia tập bắn (màn xám): khung 0 đứng, 1 vừa trúng, 2 đã hạ; bia có khiên dùng hình khiên.
  for (const target of world.targets) {
    const b = target.box;
    const frame = !target.alive ? 2 : target.flash > 0 ? 1 : 0;
    pool.put('obj_target', frame, b.x + b.w / 2, b.y + b.h - 16);
    if (target.alive && target.shieldUp) pool.put('en_cocoon_shield', 0, b.x - 3, b.y + b.h - 16);
  }
  for (const s of world.secrets) {
    if (s.taken) continue;
    const bob = Math.round(Math.sin(timeMs / 300) * 2);
    pool.put(
      'obj_secret',
      loopFrame(timeMs, 4, 8),
      s.box.x + s.box.w / 2,
      s.box.y + s.box.h / 2 + bob,
    );
  }
  // Bệ ở đầu dây leo đu: lát bằng ô bục một chiều của chủ đề.
  for (const v of world.vines) {
    const p = v.platform;
    for (let x = p.x; x < p.x + p.w; x += t) pool.put(ts, TILE_INDEX.oneWay, x + half, p.y + half);
  }
  if (world.field) {
    for (const p of world.field.pickups.all) {
      if (p.ttl < PICKUP_BLINK_SEC && Math.floor(timeMs / 100) % 2 === 0) continue;
      const coin = p.kind === 'coreBit';
      pool.put(
        coin ? 'obj_core_bit' : 'obj_health',
        loopFrame(timeMs, coin ? 4 : 2, coin ? 8 : 4),
        p.x + p.w / 2,
        p.y + p.h / 2,
      );
    }
  }
  if (world.gateCol !== undefined) {
    for (const r of world.gateRows) {
      if (!world.map.isSolid(world.gateCol, r)) continue;
      pool.put(ts, TILE_INDEX.gate, world.gateCol * t + half, r * t + half);
    }
  }
  for (const room of world.rooms) {
    if (room.state !== 'locked') continue;
    for (const d of room.spawn.doors)
      pool.put(ts, TILE_INDEX.gate, d.col * t + half, d.row * t + half);
  }
  world.layout.checkpoints.forEach((cp, i) => {
    const on = i < world.checkpointIndex;
    pool.put(
      ts,
      on ? TILE_INDEX.checkpointOn : TILE_INDEX.checkpointOff,
      cp.col * t + half,
      cp.row * t + half,
    );
  });
  for (const b of world.barriers) {
    if (b.broken) continue;
    const s = b.spawn;
    for (let r = s.top; r <= s.bottom; r += 1)
      for (let c = s.first; c <= s.last; c += 1)
        pool.put(ts, TILE_INDEX.barrier, c * t + half, r * t + half);
  }
  pool.end();
}

const ACTOR_FPS = { idle: 8, attack: 12 } as const;
const ACTOR_FRAMES = 4;
const WHITE = 0xffffff;
/** Golem pha 2: ánh đỏ. */
const GOLEM_RAGE_TINT = 0xffb4b4;
/** Lõi hạt của Thorna nằm cách chân chừng này (px), theo hình vẽ. */
const THORNA_CORE_ABOVE_FEET = 28;

function enemyBase(e: Enemy): ActorBase {
  const d = e.data;
  if (e instanceof Golem) return 'mb_golem';
  if (d.behavior === 'turret') return d.attack.count > 1 ? 'en_spike_turret' : 'en_turret';
  if (d.behavior === 'butterfly') return 'en_butterfly';
  if (d.behavior === 'shieldCharger') return 'en_cocoon';
  return 'en_drone';
}

/** Đặt hình một nhân vật: đáy hình trùng đáy hộp va chạm, tâm ngang trùng tâm hộp. Hình gốc nhìn sang trái. */
function putActor(
  pool: SpritePool,
  scene: Phaser.Scene,
  base: ActorBase | 'boss_thorna_stun',
  attack: boolean,
  box: { x: number; y: number; w: number; h: number },
  facing: number,
  timeMs: number,
): Phaser.GameObjects.Image {
  const key = base === 'boss_thorna_stun' ? base : `${base}_${attack ? 'attack' : 'idle'}`;
  const frames = base === 'boss_thorna_stun' ? 2 : ACTOR_FRAMES;
  const frame = loopFrame(timeMs, frames, attack ? ACTOR_FPS.attack : ACTOR_FPS.idle);
  const h = scene.textures.getFrame(key, 0)?.height ?? 0;
  return pool.put(key, frame, box.x + box.w / 2, box.y + box.h - h / 2, facing > 0);
}

/**
 * Vẽ kẻ địch, mini-boss và boss bằng hình. Báo trước đòn dùng dải `attack`; trúng đòn nháy trắng;
 * kẻ địch "vô hại" (Prologue) vẽ mờ. Chỉ dẫn vị trí đòn của boss vẫn vẽ ở stage-renderer.
 */
export function drawActors(
  pool: SpritePool,
  scene: Phaser.Scene,
  world: StageWorld,
  timeMs: number,
): void {
  pool.begin();
  const blink = Math.floor(timeMs / 70) % 2 === 0;
  for (const e of world.enemies) {
    if (!e.alive) continue;
    const dashing = (e instanceof ShieldCharger || e instanceof Golem) && e.state === 'dash';
    const img = putActor(
      pool,
      scene,
      enemyBase(e),
      e.telegraphing || dashing,
      e.box,
      e.facing,
      timeMs,
    );
    if (e.flash > 0) img.setTintFill(WHITE);
    else if (e instanceof Golem && e.phase === 2) img.setTint(GOLEM_RAGE_TINT);
    if (e.harmless) img.setAlpha(0.6);
    if (e instanceof ShieldCharger && e.shieldUp) {
      const b = e.box;
      const x = e.facing > 0 ? b.x + b.w + 2 : b.x - 2;
      const strength = e.shieldLeft / Math.max(1, e.data.shieldHits);
      pool
        .put('en_cocoon_shield', e.telegraphing && blink ? 1 : 0, x, b.y + b.h - 16, e.facing > 0)
        .setAlpha(0.5 + 0.5 * strength);
    }
  }
  const boss = world.boss;
  if (boss && boss.state !== 'dead') drawBossArt(pool, scene, boss, timeMs);
  pool.end();
}

function drawBossArt(pool: SpritePool, scene: Phaser.Scene, boss: Boss, timeMs: number): void {
  const thorna = boss.data.id !== 'gray';
  const base: ActorBase = thorna ? 'boss_thorna' : 'boss_gray';
  const acting = boss.state === 'telegraph' || boss.state === 'active';
  const img =
    thorna && boss.stunned
      ? putActor(pool, scene, 'boss_thorna_stun', false, boss.box, boss.facing, timeMs)
      : putActor(pool, scene, base, acting, boss.box, boss.facing, timeMs);
  if (boss.flash > 0) img.setTintFill(WHITE);
  if (thorna) {
    const b = boss.box;
    pool.put(
      'boss_thorna_core',
      Math.min(2, boss.phase),
      b.x + b.w / 2,
      b.y + b.h - THORNA_CORE_ABOVE_FEET,
    );
  }
}
