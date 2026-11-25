import type { Objective3, PrototypeRoom } from '../logic/prototype3d/room';
import { FrameStats } from '../logic/telemetry/frame-stats';

const rounded = (value: number) => Math.round(value * 10) / 10;
const feedbackFields = ['device', 'landing', 'section', 'animation', 'notes'] as const;

interface RoomFrameMetrics {
  fpsAverage: number | null;
  fpsMedian: number | null;
  // Absent in reports saved before the histogram limit was exported.
  fpsMedianUpperBound?: number | null;
  slowFramePct: number | null;
  frames: number;
  activeMs: number;
}

export function roomFrameMetrics(stats: FrameStats): RoomFrameMetrics {
  const upperBound = stats.fpsMedianUpperBound;
  return {
    fpsAverage: stats.realMs ? rounded((1000 * stats.frames) / stats.realMs) : null,
    fpsMedian: stats.frames && upperBound === null ? rounded(stats.fpsMedian) : null,
    fpsMedianUpperBound: upperBound,
    slowFramePct: stats.frames ? rounded(stats.slowFramePct) : null,
    frames: stats.frames,
    activeMs: Math.round(stats.realMs),
  };
}

interface RoomReport {
  version: 1;
  page: 'prototype-3d';
  submissionId?: string;
  readonly capture?: Readonly<RoomCapture>;
  quality: 'low' | 'default';
  art: 'gray' | 'glb';
  navigation: string | undefined;
  viewport: { width: number; height: number; dpr: number };
  browser: string;
  metrics: RoomFrameMetrics & { loadMs: number | null };
  run: {
    finished: boolean;
    elapsedSec: number;
    checkpoint: number;
    falls: number;
    fallsBySection: Record<Objective3, number>;
  };
  feedback?: Partial<Record<(typeof feedbackFields)[number], string>>;
}

interface RoomCapture {
  capturedAtUtc?: string;
  artifactSha256?: string;
}

export function roomCapture(now: Date, artifact: string | undefined): RoomCapture | undefined {
  const capturedAtUtc = Number.isFinite(now.getTime()) ? now.toISOString() : undefined;
  const artifactSha256 = artifact && /^[\da-f]{64}$/.test(artifact) ? artifact : undefined;
  if (capturedAtUtc === undefined && artifactSha256 === undefined) return undefined;
  return {
    ...(capturedAtUtc === undefined ? {} : { capturedAtUtc }),
    ...(artifactSha256 === undefined ? {} : { artifactSha256 }),
  };
}

export class RoomMeasurement {
  private stats = new FrameStats(1000 / 30, Infinity);
  private prevFrame: number | undefined;
  private loadMs: number | undefined;
  private fallsBySection: Record<Objective3, number> = { cross: 0, relay: 0, ridge: 0, exit: 0 };
  private readonly artifactSha256 = document.querySelector<HTMLMetaElement>(
    'meta[name="cv-prototype3d-artifact-sha256"]',
  )?.content;

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
      ...roomFrameMetrics(this.stats),
    };
    const capture = roomCapture(new Date(), this.artifactSha256);
    this.showReport({
      version: 1,
      page: 'prototype-3d',
      ...(capture === undefined ? {} : { capture }),
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
    const median =
      metrics.fpsMedianUpperBound === undefined
        ? ''
        : ` · ${metrics.fpsMedianUpperBound === null ? (metrics.fpsMedian ?? '—') : `≤${metrics.fpsMedianUpperBound}`} FPS trung vị`;
    stats.textContent = `${load} · ${metrics.fpsAverage ?? '—'} FPS trung bình${median} · ${report.run.falls} lần rơi`;
    form.reset();
    const saved = report.feedback;
    let latestFeedback = saved;
    let submissionId = report.submissionId;
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
      if (button.disabled) return;
      const data = new FormData(form);
      const feedback = Object.fromEntries(
        feedbackFields.map((name) => [name, String(data.get(name) ?? '').trim()]),
      );
      if (
        !submissionId ||
        !/^[\da-f]{32}$/.test(submissionId) ||
        feedbackFields.some((name) => feedback[name] !== (latestFeedback?.[name] ?? ''))
      ) {
        // getRandomValues cũng dùng được trên đường HTTP của máy thử.
        submissionId = Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
          n.toString(16).padStart(2, '0'),
        ).join('');
      }
      const json = JSON.stringify({
        ...report,
        feedback,
        submissionId,
      });
      latestFeedback = feedback;
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
