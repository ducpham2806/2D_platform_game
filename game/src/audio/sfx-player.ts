import type { FeedbackData, SfxLayer } from '../core/feedback-config';
import {
  type AudioSettings,
  loadAudioSettings,
  saveAudioSettings,
} from '../logic/feel/audio-settings';
import type { KeyValueStore } from '../logic/input/settings';

/** Thời gian lên âm lượng của mỗi lớp (tránh tiếng "tách" đầu âm). */
const ATTACK_SEC = 0.004;
const NOISE_SEC = 1.5;

type AudioCtor = typeof AudioContext;

/**
 * Phát âm thanh tổng hợp bằng Web Audio theo 03-Data/feedback.json (chưa có file âm thanh).
 * - AudioContext chỉ tạo sau cú chạm/bấm phím đầu tiên (trình duyệt chặn âm thanh tự phát).
 * - Ẩn tab thì tạm ngưng, hiện lại thì chạy tiếp (M12: không giật khi đổi tab).
 * - Giới hạn số âm cùng lúc (`maxVoices`) và khoảng lặp tối thiểu của cùng một âm.
 */
export class SfxPlayer {
  private ctx: AudioContext | undefined;
  private master: GainNode | undefined;
  private noise: AudioBuffer | undefined;
  private voices = 0;
  private readonly lastAt = new Map<string, number>();
  private settings: AudioSettings;
  private unlocked = false;

  constructor(
    private readonly data: FeedbackData,
    private readonly store: KeyValueStore,
  ) {
    this.settings = loadAudioSettings(store);
    const unlock = (): void => {
      this.unlocked = true;
      this.ensureContext();
      void this.ctx?.resume();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('gamepadconnected', unlock);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.unlocked) void this.ctx.resume();
    });
  }

  get muted(): boolean {
    return this.settings.muted;
  }

  setMuted(muted: boolean): void {
    this.settings = { muted };
    saveAudioSettings(this.store, this.settings);
    if (this.master) this.master.gain.value = muted ? 0 : this.data.rules.masterGain;
  }

  /** Phát âm `id` (khóa trong feedback.sfx). Chưa mở khóa âm thanh, đang tắt hoặc quá tải thì bỏ qua. */
  play(id: string): void {
    const layers = this.data.sfx[id];
    const ctx = this.ctx;
    if (!layers || !ctx || !this.master || this.settings.muted || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const last = this.lastAt.get(id);
    if (last !== undefined && now - last < this.data.rules.minRepeatSec) return;
    if (this.voices + layers.length > this.data.rules.maxVoices) return;
    this.lastAt.set(id, now);
    for (const layer of layers) this.playLayer(ctx, this.master, layer, now + layer.delaySec);
  }

  private ensureContext(): void {
    if (this.ctx) return;
    const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return;
    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = this.settings.muted ? 0 : this.data.rules.masterGain;
      master.connect(ctx.destination);
      const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * NOISE_SEC), ctx.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
      this.ctx = ctx;
      this.master = master;
      this.noise = noise;
    } catch {
      // Không có âm thanh thì game vẫn chạy.
    }
  }

  private playLayer(ctx: AudioContext, out: AudioNode, layer: SfxLayer, at: number): void {
    const end = at + layer.sec;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(layer.gain, at + ATTACK_SEC);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(out);
    let source: AudioScheduledSourceNode;
    if (layer.wave === 'noise') {
      if (!this.noise) return;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(layer.freqFrom, at);
      filter.frequency.exponentialRampToValueAtTime(layer.freqTo, end);
      src.connect(filter);
      filter.connect(gain);
      source = src;
    } else {
      const osc = ctx.createOscillator();
      osc.type = layer.wave;
      osc.frequency.setValueAtTime(layer.freqFrom, at);
      osc.frequency.exponentialRampToValueAtTime(layer.freqTo, end);
      osc.connect(gain);
      source = osc;
    }
    this.voices += 1;
    source.onended = () => {
      this.voices -= 1;
      gain.disconnect();
    };
    source.start(at);
    source.stop(end + 0.02);
  }
}
