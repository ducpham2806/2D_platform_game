import type { Objective3, PrototypeRoom } from '../logic/prototype3d/room';
import { FrameStats } from '../logic/telemetry/frame-stats';

const rounded = (value: number) => Math.round(value * 10) / 10;
const feedbackFields = ['device', 'landing', 'section', 'animation', 'notes'] as const;

interface RoomReport {
  version: 1;
  page: 'prototype-3d';
  quality: 'low' | 'default';
  art: 'gray' | 'glb';
  navigation: string | undefined;
  viewport: { width: number; height: number; dpr: number };
  browser: string;
  metrics: {
    loadMs: number | null;
    fpsAverage: number | null;
    fpsMedian: number | null;
    slowFramePct: number | null;
    frames: number;
    activeMs: number;
  };
  run: {
    finished: boolean;
    elapsedSec: number;
    checkpoint: number;
    falls: number;
    fallsBySection: Record<Objective3, number>;
  };
  feedback?: Partial<Record<(typeof feedbackFields)[number], string>>;
}

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

  private get storageKey() {
    return `prototype3d:measurement:${this.session ?? 'standalone'}`;
  }

  get savedReport(): RoomReport | undefined {
    try {
      const copy = localStorage.getItem(this.storageKey);
      if (!copy) return undefined;
      const report = JSON.parse(copy) as RoomReport;
      if (report.version === 1 && report.page === 'prototype-3d' && report.metrics && report.run)
        return report;
    } catch {
      // The textarea remains available when storage is blocked or the copy cannot be read.
    }
    return undefined;
  }

  private saveCopy(json: string): boolean {
    try {
      localStorage.setItem(this.storageKey, json);
      return true;
    } catch {
      return false;
    }
  }

  openSaved() {
    const report = this.savedReport;
    if (report) this.showReport(report);
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
    this.showReport({
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
    });
  }

  private showReport(report: RoomReport) {
    const dialog = document.querySelector<HTMLDialogElement>('#measure-dialog')!;
    const form = document.querySelector<HTMLFormElement>('#measure-form')!;
    const button = document.querySelector<HTMLButtonElement>('#measure-save')!;
    const status = document.querySelector<HTMLElement>('#measure-status')!;
    const output = document.querySelector<HTMLTextAreaElement>('#measure-json')!;
    const stats = document.querySelector<HTMLElement>('#measure-stats')!;
    const { metrics } = report;
    const load =
      metrics.loadMs === null ? 'Đang đo tải' : `Tải ${(metrics.loadMs / 1000).toFixed(2)} s`;
    stats.textContent = `${load} · ${metrics.fpsAverage ?? '—'} FPS trung bình · ${report.run.falls} lần rơi`;
    form.reset();
    const saved = report.feedback;
    status.hidden = !saved;
    output.parentElement!.hidden = !saved;
    if (saved) {
      for (const name of feedbackFields) {
        const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement;
        field.value = saved[name] ?? '';
      }
      status.textContent = 'Đã mở bản lưu trên trình duyệt.';
      output.value = JSON.stringify(report);
    }
    document.querySelector<HTMLButtonElement>('#measure-close')!.onclick = () => dialog.close();
    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const json = JSON.stringify({
        ...report,
        feedback: Object.fromEntries(
          feedbackFields.map((name) => [name, String(data.get(name) ?? '').trim()]),
        ),
      });
      const savedLocally = this.saveCopy(json);
      output.parentElement!.hidden = false;
      output.value = json;
      status.hidden = false;
      status.textContent = savedLocally
        ? 'Đã lưu trên trình duyệt. Có thể sao chép dữ liệu bên dưới.'
        : 'Hãy sao chép dữ liệu bên dưới để giữ kết quả.';
      status.scrollIntoView({ block: 'nearest' });
      if (!this.session) return;
      button.disabled = true;
      try {
        const url = new URL('./__prototype3d-report', location.href);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Playtest-Session': this.session },
          body: json,
        });
        if (response.status !== 201) throw new Error('Máy chủ chưa nhận báo cáo');
        status.textContent = 'Đã lưu kết quả trên máy chạy bản thử.';
      } catch {
        status.textContent = savedLocally
          ? 'Đã lưu trên trình duyệt. Hãy sao chép dữ liệu bên dưới hoặc gửi lại qua Wi-Fi.'
          : 'Chưa lưu được qua Wi-Fi. Hãy sao chép dữ liệu bên dưới.';
      } finally {
        button.disabled = false;
      }
    };
    dialog.showModal();
  }
}
