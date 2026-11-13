import type { ParticlePreset } from '../../core/feedback-config';
import type { Rng } from '../rng';

export interface Particle {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Thời gian sống còn lại và ban đầu (giây). */
  life: number;
  total: number;
  size: number;
  color: number;
  gravity: number;
}

const DEG = Math.PI / 180;

/**
 * Bể hạt hiệu ứng có sức chứa cố định (rules/core-and-ai: không cấp phát trong vòng lặp). Hết chỗ
 * thì hạt mới thay hạt già nhất đang sống. Chỉ để vẽ, không ảnh hưởng luật chơi. Logic thuần.
 */
export class ParticlePool {
  readonly all: Particle[];
  private next = 0;

  constructor(capacity: number) {
    this.all = Array.from({ length: capacity }, () => ({
      alive: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      total: 0,
      size: 1,
      color: 0xffffff,
      gravity: 0,
    }));
  }

  get aliveCount(): number {
    let n = 0;
    for (const p of this.all) if (p.alive) n += 1;
    return n;
  }

  /** `facing`: 1 nhìn phải, -1 nhìn trái (chỉ dùng khi preset có `mirror`). */
  spawn(preset: ParticlePreset, x: number, y: number, facing: 1 | -1, rng: Rng): void {
    for (let i = 0; i < preset.count; i += 1) {
      const p = this.all[this.next];
      this.next = (this.next + 1) % this.all.length;
      if (!p) return;
      const angle = (preset.angleMin + (preset.angleMax - preset.angleMin) * rng()) * DEG;
      const speed = preset.speedMin + (preset.speedMax - preset.speedMin) * rng();
      const dir = preset.mirror ? facing : 1;
      p.alive = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed * dir;
      // Trục y màn hình hướng xuống: góc 90° là bay lên.
      p.vy = -Math.sin(angle) * speed;
      p.life = preset.lifeSec;
      p.total = preset.lifeSec;
      p.size = preset.sizePx;
      p.color = preset.color;
      p.gravity = preset.gravity;
    }
  }

  update(dtSec: number): void {
    for (const p of this.all) {
      if (!p.alive) continue;
      p.life -= dtSec;
      if (p.life <= 0) {
        p.alive = false;
        continue;
      }
      p.vy += p.gravity * dtSec;
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
    }
  }

  clear(): void {
    for (const p of this.all) p.alive = false;
  }
}
