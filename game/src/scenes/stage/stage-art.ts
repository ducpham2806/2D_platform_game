import Phaser from 'phaser';
import {
  type ArtManifest,
  solidTileIndex,
  type StageTheme,
  TILE_INDEX,
} from '../../core/art-manifest';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from '../../core/constants';
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

const PROJECTILE_ART: Readonly<Record<string, { key: string; frames: number }>> = {
  shot: { key: 'fx_arc_shot', frames: 3 },
  mid: { key: 'fx_arc_mid', frames: 3 },
  charged: { key: 'fx_arc_charged', frames: 4 },
  enemyShot: { key: 'fx_enemy_shot', frames: 3 },
};

/** Loại đạn đã có hình (phần còn lại vẫn vẽ bằng khối trong stage-renderer). */
export function projectileHasArt(kind: string): boolean {
  return PROJECTILE_ART[kind] !== undefined;
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
    const art = PROJECTILE_ART[p.kind];
    if (!art) continue;
    pool.put(art.key, loopFrame(timeMs, art.frames, 12), p.x + p.w / 2, p.y + p.h / 2, p.vx < 0);
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
