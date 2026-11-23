import type { Objective3, PrototypeRoom } from '../logic/prototype3d/room';
import { FrameStats } from '../logic/telemetry/frame-stats';

const rounded = (value: number) => Math.round(value * 10) / 10;

export class RoomMeasurement {
  private stats = new FrameStats(1000 / 30, Infinity);
  private prevFrame: number | undefined;
  private loadMs: number | undefined;
  private fallsBySection: Record<Objective3, number> = { cross: 0, relay: 0, ridge: 0, exit: 0 };

  constructor(
    private readonly low: boolean,
    private readonly gray: boolean,
    private readonly session: string | null,
  ) {}

  ready() {
    this.loadMs ??= performance.now();
  }

  breakFrames() {
    this.prevFrame = undefined;
  }

  restart() {
    this.breakFrames();
    this.stats = new FrameStats(1000 / 30, Infinity);
    for (const section of ['cross', 'relay', 'ridge', 'exit'] as const)
      this.fallsBySection[section] = 0;
  }

  frame(now: number) {
    if (document.hidden) {
      this.breakFrames();
      return;
    }
    if (this.prevFrame !== undefined) this.stats.add(now - this.prevFrame);
    this.prevFrame = now;
  }

  fall(section: Objective3, count: number) {
    this.fallsBySection[section] += count;
  }

  open(world: PrototypeRoom) {
    const navigation = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    const metrics = {
      loadMs: this.loadMs === undefined ? null : rounded(this.loadMs),
      fpsAverage: this.stats.realMs
        ? rounded((1000 * this.stats.frames) / this.stats.realMs)
        : null,
      fpsMedian: this.stats.frames ? rounded(this.stats.fpsMedian) : null,
      slowFramePct: this.stats.frames ? rounded(this.stats.slowFramePct) : null,
      frames: this.stats.frames,
      activeMs: Math.round(this.stats.realMs),
    };
    const report = {
      version: 1,
      page: 'prototype-3d',
      quality: this.low ? 'low' : 'default',
      art: this.gray ? 'gray' : 'glb',
      navigation: navigation?.type,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      browser: navigator.userAgent,
      metrics,
      run: {
        finished: world.finished,
        elapsedSec: rounded(world.elapsed),
        checkpoint: world.checkpoint + 1,
        falls: world.falls,
        fallsBySection: { ...this.fallsBySection },
      },
    };
    const dialog = document.querySelector<HTMLDialogElement>('#measure-dialog')!;
    const form = document.querySelector<HTMLFormElement>('#measure-form')!;
    const button = document.querySelector<HTMLButtonElement>('#measure-save')!;
    const status = document.querySelector<HTMLElement>('#measure-status')!;
    const output = document.querySelector<HTMLTextAreaElement>('#measure-json')!;
    const stats = document.querySelector<HTMLElement>('#measure-stats')!;
    const load =
      metrics.loadMs === null ? 'Đang đo tải' : `Tải ${(metrics.loadMs / 1000).toFixed(2)} s`;
    stats.textContent = `${load} · ${metrics.fpsAverage ?? '—'} FPS trung bình · ${world.falls} lần rơi`;
    status.hidden = true;
    output.parentElement!.hidden = true;
    document.querySelector<HTMLButtonElement>('#measure-close')!.onclick = () => dialog.close();
    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const get = (key: string) => String(data.get(key) ?? '').trim();
      const json = JSON.stringify({
        ...report,
        feedback: {
          device: get('device'),
          landing: get('landing'),
          section: get('section'),
          notes: get('notes'),
        },
      });
      output.parentElement!.hidden = false;
      output.value = json;
      status.hidden = false;
      status.textContent = 'Có thể sao chép dữ liệu bên dưới.';
      if (!this.session) return;
      button.disabled = true;
      try {
        const url = new URL('./__prototype3d-report', location.href);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Playtest-Session': this.session },
          body: json,
        });
        if (!response.ok) throw new Error('Upload failed');
        status.textContent = 'Đã lưu kết quả trên máy chạy bản thử.';
      } catch {
        status.textContent = 'Chưa lưu được qua Wi-Fi. Hãy sao chép dữ liệu bên dưới.';
      } finally {
        button.disabled = false;
      }
    };
    dialog.showModal();
  }
}
