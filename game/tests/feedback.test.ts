import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, TILE_SIZE } from '@/core/constants';
import { CUE_IDS, type CueId, parseFeedback } from '@/core/feedback-config';
import { parseGameConfig } from '@/core/game-config';
import {
  AUDIO_STORAGE_KEY,
  loadAudioSettings,
  saveAudioSettings,
} from '@/logic/feel/audio-settings';
import { CueCollector } from '@/logic/feel/cue-collector';
import { ParticlePool } from '@/logic/feel/particle-pool';
import { Squash } from '@/logic/feel/squash';
import { createRng } from '@/logic/rng';
import { StageWorld } from '@/logic/world/stage-world';
import { IDLE_INPUT, noWorldEvents, type WorldInput } from '@/logic/world/world-types';
import { buildStageLayout, STAGE_DEFS } from '@/stages';
import { loadData } from './helpers';

const DT = FIXED_STEP_MS / 1000;
const data = loadData();
const config = parseGameConfig(data);
const feedback = config.feedback;

type Raw = Record<string, Record<string, unknown>>;
const raw = (): Raw => structuredClone(data.feedback) as Raw;

function world(stage: keyof typeof STAGE_DEFS): StageWorld {
  return new StageWorld({
    layout: buildStageLayout(STAGE_DEFS[stage], TILE_SIZE),
    tileSize: TILE_SIZE,
    stepSec: DT,
    player: config.player,
    weapons: config.weapons,
    boss: config.bosses[STAGE_DEFS[stage].boss ?? 'gray']!,
    difficulty: config.difficulties.find((d) => d.id === 'normal')!,
    seed: 1,
    enemies: config.enemies,
    mechanics: config.stages.mechanics,
  });
}

/** Chạy màn, trả về mọi cue theo thứ tự kèm số bước. */
function play(w: StageWorld, input: (i: number) => WorldInput, steps: number): [number, CueId][] {
  const c = new CueCollector();
  const out: [number, CueId][] = [];
  for (let i = 0; i < steps; i += 1) {
    const ev = w.step(input(i));
    for (const cue of c.collect(w, ev)) out.push([i, cue]);
  }
  return out;
}

describe('dữ liệu phản hồi', () => {
  it('mọi cue đều được khai và trỏ tới âm, kiểu hạt có thật', () => {
    for (const id of CUE_IDS) {
      const def = feedback.cues[id];
      expect(def, id).toBeDefined();
      if (def.sfx) expect(feedback.sfx[def.sfx], `${id}.sfx`).toBeDefined();
      if (def.particles) expect(feedback.particles[def.particles], `${id}.particles`).toBeDefined();
    }
  });

  it('mọi cue có âm thanh (GDD 14: phản hồi và cảnh báo đòn boss bằng âm thanh)', () => {
    for (const id of CUE_IDS) expect(feedback.cues[id].sfx, id).toBeDefined();
  });

  it('báo lỗi dữ liệu sai', () => {
    const bad = (patch: (r: Raw) => void, re: RegExp) => {
      const r = raw();
      patch(r);
      expect(() => parseFeedback(r)).toThrow(re);
    };
    bad((r) => delete r.cues!.jump, /cues\.jump: thiếu/);
    bad((r) => (r.cues!.bay = { sfx: 'jump' }), /cue lạ: bay/);
    bad((r) => (r.cues!.jump = { sfx: 'khong_co' }), /âm "khong_co"/);
    bad((r) => (r.cues!.jump = { sfx: 'jump', particles: 'khong_co', at: 'feet' }), /kiểu hạt/);
    bad((r) => (r.cues!.jump = { sfx: 'jump', particles: 'dust' }), /vị trí "at"/);
    bad((r) => (r.cues!.jump = { sfx: 'jump', particles: 'dust', at: 'dau' }), /"dau" không có/);
    bad((r) => (r.sfx!.jump = [{ wave: 'kèn', freq: [300, 500], sec: 0.1, gain: 0.2 }]), /wave/);
    bad(
      (r) => (r.sfx!.jump = [{ wave: 'square', freq: [5, 500], sec: 0.1, gain: 0.2 }]),
      /freq\[0\]/,
    );
    bad((r) => (r.sfx!.jump = [{ wave: 'square', freq: [300, 500], sec: 3, gain: 0.2 }]), /sec/);
    bad((r) => (r.sfx!.jump = [{ wave: 'square', freq: [300, 500], sec: 0.1, gain: 2 }]), /gain/);
    bad((r) => (r.sfx!.jump = []), /ít nhất một lớp/);
    bad((r) => ((r.particles!.dust as Record<string, unknown>).color = 'xanh'), /#rrggbb/);
    bad((r) => ((r.particles!.dust as Record<string, unknown>).count = 500), /count/);
    bad((r) => (r.rules!.masterGain = 3), /masterGain/);
    bad((r) => ((r.squash!.jump as Record<string, unknown>).x = 5), /squash\.jump\.x/);
  });
});

describe('CueCollector trên màn thật', () => {
  it('nhảy rồi đáp: đúng một "jump" rồi một "land"', () => {
    const cues = play(
      world('gray'),
      (i) => ({ ...IDLE_INPUT, jumpPressed: i === 30, jumpHeld: i >= 30 && i < 40 }),
      180,
    );
    const moves = cues.filter(([, c]) => c === 'jump' || c === 'land').filter(([i]) => i >= 30);
    expect(moves.map(([, c]) => c)).toEqual(['jump', 'land']);
    expect(moves[0]![0]).toBe(30);
  });

  it('lướt và bắn: "dash", "shot"; giữ nạp: "chargeMid" → "chargeFull" → "shotCharged"', () => {
    const w = world('gray');
    const cues = play(
      w,
      (i) => ({
        ...IDLE_INPUT,
        dashPressed: i === 30,
        shootPressed: i === 60 || i === 80,
        shootHeld: (i >= 60 && i < 62) || (i >= 80 && i < 200),
        shootReleased: i === 62 || i === 200,
      }),
      220,
    ).map(([, c]) => c);
    expect(cues).toContain('dash');
    const fire = cues.filter((c) => c.startsWith('shot') || c.startsWith('charge'));
    expect(fire.slice(0, 1)).toEqual(['shot']);
    expect(fire.slice(-3)).toEqual(['chargeMid', 'chargeFull', 'shotCharged']);
  });

  it('hit-stop không phát lại cue của nhân vật', () => {
    const c = new CueCollector();
    const events = {
      jumped: true,
      wallJumped: false,
      landed: false,
      dashed: false,
      hurt: false,
      died: false,
      fellOut: false,
    };
    const w = { player: { events }, loadout: { chargeLevel: 0 }, boss: undefined };
    expect(c.collect(w, noWorldEvents())).toEqual(['jump']);
    // Bước bị đóng băng: nhân vật không chạy, đối tượng sự kiện vẫn là cái cũ.
    expect(c.collect(w, noWorldEvents())).toEqual([]);
    expect(c.collect({ ...w, player: { events: { ...events } } }, noWorldEvents())).toEqual([
      'jump',
    ]);
  });

  it('boss: cảnh báo một lần mỗi lần báo trước; trúng điểm yếu thay cho trúng thường', () => {
    const c = new CueCollector();
    const events = {
      jumped: false,
      wallJumped: false,
      landed: false,
      dashed: false,
      hurt: false,
      died: false,
      fellOut: false,
    };
    const at = (state: string) => ({
      player: { events },
      loadout: { chargeLevel: 0 },
      boss: { state },
    });
    expect(c.collect(at('idle'), noWorldEvents())).toEqual([]);
    expect(c.collect(at('telegraph'), noWorldEvents())).toEqual(['bossTelegraph']);
    expect(c.collect(at('telegraph'), noWorldEvents())).toEqual([]);
    expect(c.collect(at('active'), noWorldEvents())).toEqual([]);
    expect(c.collect(at('telegraph'), noWorldEvents())).toEqual(['bossTelegraph']);
    expect(c.collect(at('idle'), { ...noWorldEvents(), hitBoss: true, weakHit: true })).toEqual([
      'weakHit',
    ]);
    expect(c.collect(at('idle'), { ...noWorldEvents(), hitBoss: true })).toEqual(['hitBoss']);
    expect(
      c.collect(at('dead'), {
        ...noWorldEvents(),
        bossDefeated: true,
        bossPhaseChanged: true,
        weaponGranted: 'Vine Lash',
      }),
    ).toEqual(['bossDefeated', 'weaponGranted']);
  });

  it('trận Thorna thật: có cảnh báo trước đòn đầu tiên', () => {
    const w = world('thorna');
    const cues = play(w, () => ({ ...IDLE_INPUT, moveX: 1 }), 60 * 12).map(([, c]) => c);
    expect(cues).toContain('bossGate');
    expect(cues).toContain('bossTelegraph');
    expect(cues.indexOf('bossGate')).toBeLessThan(cues.indexOf('bossTelegraph'));
  });
});

describe('ParticlePool', () => {
  const dust = feedback.particles.dust!;

  it('sức chứa cố định: phát bao nhiêu cũng không lớn thêm', () => {
    const pool = new ParticlePool(8);
    const rng = createRng(1);
    for (let i = 0; i < 20; i += 1) pool.spawn(dust, 0, 0, 1, rng);
    expect(pool.all).toHaveLength(8);
    expect(pool.aliveCount).toBe(8);
  });

  it('hạt hết thời gian sống thì tắt; bụi bay lên rồi rơi theo trọng lực', () => {
    const pool = new ParticlePool(16);
    pool.spawn(dust, 100, 100, 1, createRng(2));
    expect(pool.aliveCount).toBe(dust.count);
    pool.update(DT);
    for (const p of pool.all.filter((x) => x.alive)) expect(p.y).toBeLessThan(100);
    for (let i = 0; i < Math.ceil(dust.lifeSec / DT) + 1; i += 1) pool.update(DT);
    expect(pool.aliveCount).toBe(0);
  });

  it('mirror: nhìn trái thì hạt bay ngược lại', () => {
    const muzzle = feedback.particles.muzzle!;
    const right = new ParticlePool(8);
    const left = new ParticlePool(8);
    right.spawn(muzzle, 0, 0, 1, createRng(3));
    left.spawn(muzzle, 0, 0, -1, createRng(3));
    for (let i = 0; i < muzzle.count; i += 1) {
      expect(right.all[i]!.vx).toBeGreaterThan(0);
      expect(left.all[i]!.vx).toBeCloseTo(-right.all[i]!.vx, 10);
    }
  });
});

describe('Squash', () => {
  it('đặt rồi trở về 1 sau recoverSec, không vượt quá', () => {
    const s = new Squash(0.12);
    expect([s.x, s.y]).toEqual([1, 1]);
    s.set({ x: 0.8, y: 1.2 });
    expect(s.x).toBeCloseTo(0.8, 10);
    expect(s.y).toBeCloseTo(1.2, 10);
    s.update(0.06);
    expect(s.x).toBeGreaterThan(0.8);
    expect(s.x).toBeLessThan(1);
    s.update(0.2);
    expect([s.x, s.y]).toEqual([1, 1]);
  });
});

describe('cài đặt âm thanh', () => {
  const store = () => {
    const m = new Map<string, string>();
    return {
      get: (k: string) => m.get(k) ?? null,
      set: (k: string, v: string) => void m.set(k, v),
    };
  };

  it('mặc định bật; lưu rồi đọc lại; dữ liệu hỏng thì về mặc định', () => {
    const s = store();
    expect(loadAudioSettings(s).muted).toBe(false);
    saveAudioSettings(s, { muted: true });
    expect(loadAudioSettings(s).muted).toBe(true);
    s.set(AUDIO_STORAGE_KEY, '{hỏng');
    expect(loadAudioSettings(s).muted).toBe(false);
  });
});
