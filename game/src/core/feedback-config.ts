import { arr, ConfigError, isObject, num, obj, str } from './json-check';

/**
 * Kiểm tra 03-Data/feedback.json: âm thanh tổng hợp, hạt, co giãn hình theo từng "cue"
 * (việc xảy ra trong màn). Phần tối thiểu của M12 + hiệu ứng (GDD 14). Logic thuần.
 */

/** Mọi cue mà màn chơi phát ra (`logic/feel/cue-collector.ts`); dữ liệu phải khai đủ. */
export const CUE_IDS = [
  'jump',
  'wallJump',
  'land',
  'dash',
  'shot',
  'shotMid',
  'shotCharged',
  'sweep',
  'chargeMid',
  'chargeFull',
  'emptyWeapon',
  'swap',
  'hit',
  'hitBoss',
  'weakHit',
  'blocked',
  'shieldBroken',
  'enemyKilled',
  'hurt',
  'died',
  'respawn',
  'coreBit',
  'heal',
  'checkpoint',
  'secret',
  'roomLocked',
  'roomCleared',
  'barrierBroken',
  'bossGate',
  'bossTelegraph',
  'bossPhase',
  'bossLanded',
  'bossDefeated',
  'weaponGranted',
] as const;
export type CueId = (typeof CUE_IDS)[number];

export const SFX_WAVES = ['square', 'sawtooth', 'triangle', 'sine', 'noise'] as const;
export type SfxWave = (typeof SFX_WAVES)[number];

export interface SfxLayer {
  wave: SfxWave;
  /** Tần số đầu và cuối (Hz); với `noise` là tần số cắt của bộ lọc. */
  freqFrom: number;
  freqTo: number;
  sec: number;
  gain: number;
  delaySec: number;
}

export const CUE_ANCHORS = ['feet', 'muzzle', 'body', 'boss'] as const;
export type CueAnchor = (typeof CUE_ANCHORS)[number];

export interface ParticlePreset {
  count: number;
  speedMin: number;
  speedMax: number;
  /** Độ; 0 = sang phải, 90 = lên. */
  angleMin: number;
  angleMax: number;
  /** Lật góc theo hướng mặt nhân vật. */
  mirror: boolean;
  lifeSec: number;
  sizePx: number;
  /** 0xRRGGBB. */
  color: number;
  gravity: number;
}

export interface CueDef {
  sfx: string | undefined;
  particles: string | undefined;
  at: CueAnchor;
}

export interface Scale2 {
  x: number;
  y: number;
}

export interface FeedbackData {
  rules: { masterGain: number; maxVoices: number; minRepeatSec: number; maxParticles: number };
  squash: { recoverSec: number; jump: Scale2; land: Scale2; dash: Scale2 };
  sfx: Record<string, SfxLayer[]>;
  particles: Record<string, ParticlePreset>;
  cues: Record<CueId, CueDef>;
}

/** Một âm không dài quá mức này (âm dài là nhạc, không phải phản hồi). */
const MAX_SFX_SEC = 1.5;
const MIN_HZ = 20;
const MAX_HZ = 20000;

function range(value: unknown, path: string, min: number, max: number): number {
  const v = num(value, path);
  if (v < min || v > max)
    throw new ConfigError(`${path}: phải trong [${min}, ${max}] (đang là ${v})`);
  return v;
}

function pair(value: unknown, path: string): [unknown, unknown] {
  const p = arr(value, path);
  if (p.length !== 2) throw new ConfigError(`${path}: cần đúng 2 số [đầu, cuối]`);
  return [p[0], p[1]];
}

function parseLayer(value: unknown, path: string): SfxLayer {
  const l = obj(value, path);
  const wave = str(l.wave, `${path}.wave`);
  if (!(SFX_WAVES as readonly string[]).includes(wave))
    throw new ConfigError(`${path}.wave: "${wave}" không có (${SFX_WAVES.join(', ')})`);
  const [from, to] = pair(l.freq, `${path}.freq`);
  const sec = range(l.sec, `${path}.sec`, 0.01, MAX_SFX_SEC);
  const delaySec = l.delaySec === undefined ? 0 : range(l.delaySec, `${path}.delaySec`, 0, 1);
  if (delaySec + sec > MAX_SFX_SEC)
    throw new ConfigError(`${path}: delaySec + sec dài quá ${MAX_SFX_SEC} s`);
  return {
    wave: wave as SfxWave,
    freqFrom: range(from, `${path}.freq[0]`, MIN_HZ, MAX_HZ),
    freqTo: range(to, `${path}.freq[1]`, MIN_HZ, MAX_HZ),
    sec,
    gain: range(l.gain, `${path}.gain`, 0, 1),
    delaySec,
  };
}

function parseColor(value: unknown, path: string): number {
  const s = str(value, path);
  if (!/^#[0-9a-fA-F]{6}$/.test(s)) throw new ConfigError(`${path}: cần màu dạng #rrggbb`);
  return Number.parseInt(s.slice(1), 16);
}

function parsePreset(value: unknown, path: string): ParticlePreset {
  const p = obj(value, path);
  const [s0, s1] = pair(p.speed, `${path}.speed`);
  const [a0, a1] = pair(p.angleDeg, `${path}.angleDeg`);
  const speedMin = num(s0, `${path}.speed[0]`, { min: 0 });
  const speedMax = num(s1, `${path}.speed[1]`, { min: speedMin });
  const angleMin = num(a0, `${path}.angleDeg[0]`);
  const angleMax = num(a1, `${path}.angleDeg[1]`, { min: angleMin });
  if (p.mirror !== undefined && typeof p.mirror !== 'boolean')
    throw new ConfigError(`${path}.mirror: cần true/false`);
  return {
    count: range(p.count, `${path}.count`, 1, 64),
    speedMin,
    speedMax,
    angleMin,
    angleMax,
    mirror: p.mirror === true,
    lifeSec: range(p.lifeSec, `${path}.lifeSec`, 0.02, 2),
    sizePx: range(p.sizePx, `${path}.sizePx`, 1, 8),
    color: parseColor(p.color, `${path}.color`),
    gravity: num(p.gravity, `${path}.gravity`),
  };
}

function parseScale(value: unknown, path: string): Scale2 {
  const s = obj(value, path);
  return { x: range(s.x, `${path}.x`, 0.5, 2), y: range(s.y, `${path}.y`, 0.5, 2) };
}

export function parseFeedback(value: unknown): FeedbackData {
  const f = obj(value, 'feedback');
  const r = obj(f.rules, 'feedback.rules');
  const rules = {
    masterGain: range(r.masterGain, 'feedback.rules.masterGain', 0, 1),
    maxVoices: range(r.maxVoices, 'feedback.rules.maxVoices', 1, 32),
    minRepeatSec: range(r.minRepeatSec, 'feedback.rules.minRepeatSec', 0, 1),
    maxParticles: range(r.maxParticles, 'feedback.rules.maxParticles', 1, 512),
  };
  const sq = obj(f.squash, 'feedback.squash');
  const squash = {
    recoverSec: range(sq.recoverSec, 'feedback.squash.recoverSec', 0.01, 1),
    jump: parseScale(sq.jump, 'feedback.squash.jump'),
    land: parseScale(sq.land, 'feedback.squash.land'),
    dash: parseScale(sq.dash, 'feedback.squash.dash'),
  };

  const sfx: Record<string, SfxLayer[]> = {};
  for (const [id, layers] of Object.entries(obj(f.sfx, 'feedback.sfx'))) {
    const list = arr(layers, `feedback.sfx.${id}`).map((l, i) =>
      parseLayer(l, `feedback.sfx.${id}[${i}]`),
    );
    if (list.length === 0) throw new ConfigError(`feedback.sfx.${id}: cần ít nhất một lớp`);
    sfx[id] = list;
  }
  const particles: Record<string, ParticlePreset> = {};
  for (const [id, preset] of Object.entries(obj(f.particles, 'feedback.particles'))) {
    const p = parsePreset(preset, `feedback.particles.${id}`);
    if (p.count > rules.maxParticles)
      throw new ConfigError(`feedback.particles.${id}.count: nhiều hơn rules.maxParticles`);
    particles[id] = p;
  }

  const rawCues = obj(f.cues, 'feedback.cues');
  const unknown = Object.keys(rawCues).filter((k) => !(CUE_IDS as readonly string[]).includes(k));
  if (unknown.length > 0) throw new ConfigError(`feedback.cues: cue lạ: ${unknown.join(', ')}`);
  const cues = {} as Record<CueId, CueDef>;
  for (const id of CUE_IDS) {
    const path = `feedback.cues.${id}`;
    if (!isObject(rawCues[id])) throw new ConfigError(`${path}: thiếu (mọi cue phải được khai)`);
    const c = obj(rawCues[id], path);
    const sound = c.sfx === undefined ? undefined : str(c.sfx, `${path}.sfx`);
    if (sound !== undefined && sfx[sound] === undefined)
      throw new ConfigError(`${path}.sfx: âm "${sound}" không có trong feedback.sfx`);
    const preset = c.particles === undefined ? undefined : str(c.particles, `${path}.particles`);
    if (preset !== undefined && particles[preset] === undefined)
      throw new ConfigError(`${path}.particles: kiểu hạt "${preset}" không có`);
    const at = c.at === undefined ? 'body' : str(c.at, `${path}.at`);
    if (!(CUE_ANCHORS as readonly string[]).includes(at))
      throw new ConfigError(`${path}.at: "${at}" không có (${CUE_ANCHORS.join(', ')})`);
    if (preset !== undefined && c.at === undefined)
      throw new ConfigError(`${path}: có hạt thì phải khai vị trí "at"`);
    cues[id] = { sfx: sound, particles: preset, at: at as CueAnchor };
  }
  return { rules, squash, sfx, particles, cues };
}
