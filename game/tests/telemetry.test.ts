import { describe, expect, it } from 'vitest';
import { ConfigError, parseGameConfig } from '@/core/game-config';
import { telemetryCatalogs, weaponId } from '@/core/telemetry-catalogs';
import { parseTelemetry, type TelemetryConfig } from '@/core/telemetry-config';
import { dataFingerprint, fnv1a } from '@/logic/hash';
import { envelopeBytes, makeBatch, makeBatches, type BatchMeta } from '@/logic/telemetry/batch';
import { TelemetryBuffer, type BufferLimits, type StoredEvent } from '@/logic/telemetry/buffer';
import { Telemetry } from '@/logic/telemetry/logger';
import {
  EVENT_NAMES,
  EVENT_SPECS,
  type EventName,
  type Prop,
  type PropSpec,
  type TelemetryEvent,
} from '@/logic/telemetry/schema';
import { sanitizeErrorMessage } from '@/logic/telemetry/text';
import {
  makeSid,
  validateBatchMeta,
  validateEvent,
  type ValidateOptions,
} from '@/logic/telemetry/validate';
import { loadData } from './helpers';

const data = loadData();
const game = parseGameConfig(data);
const config = game.telemetry as TelemetryConfig;
const catalogs = telemetryCatalogs(game);
const V: ValidateOptions = { textMaxChars: config.errorMsgMaxChars, catalogs };
const META: BatchMeta = {
  install: '3f6c0a1e-5b2d-4c7e-9a10-1234567890ab',
  wave: 'd1',
  build: 'a1b2c3d',
  data: '9e0f12ab',
};
const SID = 'k9x2ab0c';

/** Sự kiện thô để thử dữ liệu sai lược đồ. */
type Loose = Record<string, unknown> & { p: Record<string, unknown> };
type Section = Record<string, unknown>;
type TelJson = Section & {
  gate: Section;
  batch: Section;
  broken: Section;
  priority: Section;
  retry: Section;
};

/** Giá trị hợp lệ cho một kiểu thuộc tính (id lấy từ danh mục thật). */
function sample(s: PropSpec): Prop {
  switch (s.kind) {
    case 'int':
      return s.min ?? 0;
    case 'num':
      return (s.min ?? 0) + 0.5;
    case 'bool':
      return true;
    case 'enum':
      return s.values[0] as string;
    case 'id':
      return s.catalog ? ([...(catalogs[s.catalog] ?? [])][0] as string) : 'A';
    case 'ids':
      return s.catalog ? [...(catalogs[s.catalog] ?? [])].slice(0, 2) : ['A', 'B'];
    case 'map':
      return s.catalog === 'weapon'
        ? { arcCannon: 238, vineLash: 12 }
        : s.catalog === 'upgrade'
          ? { arc_core: 2 }
          : { touch: 120 };
    case 'pattern':
      return { day: '2026-11-20', screen: '900x400', skills: 'V2P1C0', lang: 'vi' }[s.pattern];
    case 'cause':
      return 'enemy:drone_linh';
    case 'scalar':
      return 1.25;
    case 'text':
      return 'Cannot read properties of undefined';
  }
}

function fullEvent(name: EventName, n = 0, sid = SID): TelemetryEvent {
  const props: Record<string, Prop> = {};
  for (const [k, s] of Object.entries(EVENT_SPECS[name].props as Record<string, PropSpec>))
    props[k] = sample(s);
  if (name === 'survey_answer') props.a = '4';
  return { e: name, t: 1763599990000 + n, sid, n, p: props };
}

const json = (ev: TelemetryEvent): string => JSON.stringify(ev);
const prio = (ev: TelemetryEvent) => config.priority[ev.e];
const isAscii = (s: string): boolean => /^[\x20-\x7e]*$/.test(s);

describe('telemetry.json (ST-13-01, duyệt Technical Director 14/11)', () => {
  it('hợp lệ; ưu tiên đủ mọi sự kiện; lô ≤ 0,8 × giới hạn điểm nhận', () => {
    expect(game.telemetry).toBeDefined();
    expect(game.telemetryError).toBeUndefined();
    expect(Object.keys(config.priority).sort()).toEqual([...EVENT_NAMES].sort());
    expect(config.batch.maxBytes).toBeLessThanOrEqual(0.8 * config.endpoint.maxBatchBytes);
  });

  it('báo lỗi: phân số ngoài (0; 1], lô quá lớn, ưu tiên thiếu/lạ/sai, schema, buildTimeRatio, sự kiện quá lớn', () => {
    const bad = (patch: (t: TelJson) => void, re: RegExp) => {
      const t = structuredClone(data.telemetry) as TelJson;
      patch(t);
      expect(() => parseTelemetry(t)).toThrow(re);
    };
    bad((t) => (t.gate.stage1Clear = 1.2), /stage1Clear.*\(0; 1\]/);
    bad((t) => (t.gate.stage1Clear = 0), /stage1Clear/);
    bad((t) => (t.batch.maxBytes = 30000), /0,8/);
    bad((t) => delete t.priority.death, /priority\.death/);
    bad((t) => (t.priority.buy_gem = 1), /sự kiện lạ "buy_gem"/);
    bad((t) => (t.priority.death = 3), /priority\.death/);
    bad((t) => (t.schema = 1), /schema/);
    bad((t) => (t.broken.buildTimeRatio = 1), /buildTimeRatio/);
    bad((t) => (t.maxEventBytes = 24576), /maxEventBytes/);
    bad((t) => (t.retry.maxSec = 1), /maxSec/);
    expect(() => parseTelemetry(null)).toThrow(ConfigError);
  });

  it('file lỗi hoặc thiếu: tắt đo lường, game vẫn nạp được', () => {
    const broken = { ...data, telemetry: { schema: 2 } };
    const g = parseGameConfig(broken);
    expect(g.telemetry).toBeUndefined();
    expect(g.telemetryError).toMatch(/telemetry/);
    const missing = { ...data };
    delete missing.telemetry;
    expect(parseGameConfig(missing).telemetryError).toMatch(/thiếu/);
  });
});

describe('kiểm lược đồ (GDD 13 mục 10 ý 2)', () => {
  it('mọi sự kiện, đủ thuộc tính hoặc chỉ khóa bắt buộc, đều hợp lệ; khóa bắt buộc có trong danh sách', () => {
    for (const name of EVENT_NAMES) {
      expect(validateEvent(fullEvent(name), V), name).toEqual([]);
      const spec = EVENT_SPECS[name];
      const minimal = fullEvent(name);
      minimal.p = Object.fromEntries(
        Object.entries(minimal.p).filter(([k]) => spec.required.includes(k)),
      );
      expect(validateEvent(minimal, V), `${name} tối thiểu`).toEqual([]);
      for (const k of spec.required)
        expect((spec.props as Record<string, PropSpec>)[k], `${name}.${k}`).toBeDefined();
    }
  });

  it('chặn khóa lạ, chuỗi tự do, id ngoài danh mục, ngoài enum, số không hữu hạn, thiếu khóa, tên lạ', () => {
    const errs = (name: EventName, patch: (ev: Loose) => void) => {
      const ev = fullEvent(name) as unknown as Loose;
      patch(ev);
      return validateEvent(ev, V).join(' | ');
    };
    expect(errs('death', (ev) => (ev.p.name = 'Kai'))).toMatch(/khóa lạ "name"/);
    expect(errs('death', (ev) => (ev.p.section = 'tên người chơi'))).toMatch(/section.*id/);
    expect(errs('death', (ev) => (ev.p.stage = 'Kai'))).toMatch(/không có trong danh mục stage/);
    expect(errs('death', (ev) => (ev.p.cause = 'enemy:rong_lua'))).toMatch(/danh mục enemy/);
    expect(errs('death', (ev) => (ev.p.cause = 'lava'))).toMatch(/cause/);
    expect(errs('death', (ev) => (ev.p.kind = 'fall'))).toMatch(/kind.*enum/);
    expect(errs('death', (ev) => (ev.p.tRun = Number.NaN))).toMatch(/tRun.*hữu hạn/);
    expect(errs('death', (ev) => (ev.p.streak = 1.5))).toMatch(/streak.*nguyên/);
    expect(errs('death', (ev) => delete ev.p.stage)).toMatch(/thiếu "stage"/);
    expect(errs('death', (ev) => (ev.userAgent = 'Mozilla/5.0'))).toMatch(/phong bì: khóa lạ/);
    expect(errs('death', (ev) => (ev.sid = 'phien-1'))).toMatch(/sid/);
    expect(errs('death', (ev) => (ev.e = 'buy_gem'))).toMatch(/tên sự kiện lạ/);
    expect(errs('boss_end', (ev) => (ev.p.dmg = { 'Arc Cannon': 238 }))).toMatch(/Arc Cannon/);
    expect(errs('boss_end', (ev) => (ev.p.dmg = { plasma: 1 }))).toMatch(/danh mục weapon/);
    expect(errs('boss_end', (ev) => (ev.p.dmg = { arcCannon: 'nhiều' }))).toMatch(/cần số/);
    expect(
      errs('survey_answer', (ev) => Object.assign(ev.p, { q: 'feel_jump', a: 'yes' })),
    ).toMatch(/không hợp với câu/);
    expect(errs('settings_change', (ev) => (ev.p.value = 'tên'))).toMatch(/value/);
    expect(errs('session_start', (ev) => (ev.p.lang = 'vi-VN'))).toMatch(/lang/);
    expect(errs('client_error', (ev) => (ev.p.msg = 'Lỗi ở dòng 42'))).toMatch(/chưa làm sạch/);
    expect(
      errs('client_error', (ev) => (ev.p.msg = 'x'.repeat(config.errorMsgMaxChars + 1))),
    ).toMatch(/dài quá/);
  });

  it('phong bì lô: install UUID v4, wave, build, data đúng khuôn; sid 8 ký tự base36', () => {
    expect(validateBatchMeta(META)).toEqual([]);
    const bad = validateBatchMeta({ install: 'abc', wave: 'Đợt 1', build: 'xyz', data: '123' });
    expect(bad).toHaveLength(4);
    let r = 0;
    const sid = makeSid(() => ((r = (r + 0.37) % 1), r));
    expect(sid).toMatch(/^[0-9a-z]{8}$/);
  });
});

describe('làm sạch thông báo lỗi (QB-155)', () => {
  it('bỏ chuỗi trong nháy, URL, đường dẫn, chữ số, dấu; chỉ ASCII; ≤ errorMsgMaxChars; qua kiểm lược đồ', () => {
    const raw =
      'SyntaxError: Unexpected token in JSON at position 12: "CV1.eyJuYW1lIjoiS2FpIn0.9f8e" từ https://ducpham2806.github.io/x/index-BX12.js:3:4512 (đường /home/a/b/c.ts)';
    const msg = sanitizeErrorMessage(raw, config.errorMsgMaxChars);
    expect(msg).not.toMatch(/\d|https?:|github|home|CV1|eyJ/);
    expect(msg).toContain('SyntaxError: Unexpected token in JSON at position #');
    expect(msg).toContain('tu <url>');
    expect(isAscii(msg)).toBe(true);
    const long = sanitizeErrorMessage('Lỗi 😀 '.repeat(100), config.errorMsgMaxChars);
    expect(long.length).toBeLessThanOrEqual(config.errorMsgMaxChars);
    expect(
      validateEvent({ ...fullEvent('client_error'), p: { kind: 'error', msg, count: 1 } }, V),
    ).toEqual([]);
  });
});

describe('bộ đệm theo ưu tiên (GDD 13 mục 5, 10 ý 3; QB-150, QB-151)', () => {
  /** Xoay vòng ưu tiên: 300 sự kiện ưu tiên 0 rải đều trong 10.000. */
  function stream(count: number): TelemetryEvent[] {
    const out: TelemetryEvent[] = [];
    for (let i = 0; i < count; i += 1) {
      const name: EventName =
        i % 33 === 0 && out.filter((e) => e.e === 'boss_end').length < 300
          ? 'boss_end'
          : i % 2 === 0
            ? 'death'
            : 'skill_change';
      out.push(fullEvent(name, i));
    }
    return out;
  }

  it('đổ 10.000 sự kiện: không bao giờ vượt 256 KB / 2.000 sự kiện, không mất sự kiện ưu tiên 0', () => {
    const buf = new TelemetryBuffer(config.buffer);
    const events = stream(10000);
    const p0 = events.filter((ev) => ev.e === 'boss_end').length;
    expect(p0).toBe(300);
    for (const ev of events) {
      buf.push(ev, json(ev), prio(ev));
      expect(buf.size).toBeLessThanOrEqual(config.buffer.maxEvents);
      expect(buf.bytes).toBeLessThanOrEqual(config.buffer.maxBytes);
    }
    const kept = buf.all();
    expect(kept.filter((ev) => ev.e === 'boss_end')).toHaveLength(p0);
    expect(buf.lost).toBe(0);
    expect(buf.dropped[0]).toBe(0);
    expect(buf.dropped[1] + buf.dropped[2]).toBeGreaterThan(5000);
    for (let i = 1; i < kept.length; i += 1)
      expect((kept[i] as TelemetryEvent).n).toBeGreaterThan((kept[i - 1] as TelemetryEvent).n);
    expect(buf.bytes).toBe(kept.reduce((s, ev) => s + json(ev).length, 0));
    expect(isAscii(buf.serialize())).toBe(true);
  });

  it('toàn ưu tiên 0: lưu tới giới hạn rồi không lưu thêm, đếm lost, không vượt', () => {
    const buf = new TelemetryBuffer({ maxBytes: 1e9, maxEvents: 5 });
    for (let i = 0; i < 8; i += 1) {
      const ev = fullEvent('stage_end', i);
      expect(buf.push(ev, json(ev), 0)).toBe(i < 5);
    }
    expect(buf.size).toBe(5);
    expect(buf.lost).toBe(3);
  });

  it('thứ tự bỏ: đã nhận cũ nhất → chờ ưu tiên 2 → chờ ưu tiên 1; đang gửi và ưu tiên 0 không bỏ', () => {
    const limits: BufferLimits = { maxBytes: 1e9, maxEvents: 4 };
    const buf = new TelemetryBuffer(limits);
    const push = (name: EventName, n: number) => {
      const ev = fullEvent(name, n);
      return buf.push(ev, json(ev), prio(ev));
    };
    push('death', 0);
    push('skill_change', 1);
    push('death', 2);
    push('skill_change', 3);
    const b1 = buf.cutBatch(`${SID}-0`, 1, 1e9, 0);
    expect(b1?.events.map((ev) => ev.n)).toEqual([0]);
    buf.ack(`${SID}-0`);
    push('death', 4); // bỏ n=0 (đã nhận)
    expect(buf.all().map((ev) => ev.n)).toEqual([1, 2, 3, 4]);
    push('death', 5); // bỏ ưu tiên 2 cũ nhất (n=1)
    expect(buf.all().map((ev) => ev.n)).toEqual([2, 3, 4, 5]);
    buf.cutBatch(`${SID}-1`, 1, 1e9, 0); // n=2 đang gửi
    push('death', 6); // bỏ n=3 (ưu tiên 2)
    push('death', 7); // bỏ ưu tiên 1 chờ cũ nhất (n=4), không bỏ n=2 đang gửi
    expect(buf.all().map((ev) => ev.n)).toEqual([2, 5, 6, 7]);
    expect(buf.dropped).toEqual({ 0: 0, 1: 1, 2: 2 });
  });

  it('lô bất biến: chưa ack thì cắt lại trả đúng lô cũ dù có sự kiện mới; ack xong mới sang lô sau', () => {
    const buf = new TelemetryBuffer(config.buffer);
    for (let i = 0; i < 150; i += 1) {
      const ev = fullEvent('death', i);
      buf.push(ev, json(ev), 1);
    }
    const env = envelopeBytes(META, `${SID}-0`, 0);
    const a = buf.cutBatch(`${SID}-0`, config.batch.maxEvents, config.batch.maxBytes, env);
    expect(a?.events).toHaveLength(config.batch.maxEvents);
    const lot = makeBatch(META, a?.id as string, 0, a?.events as TelemetryEvent[]);
    expect(JSON.stringify(lot).length).toBeLessThanOrEqual(config.batch.maxBytes);
    const ev = fullEvent('death', 150);
    buf.push(ev, json(ev), 1);
    const retry = buf.cutBatch(`${SID}-1`, config.batch.maxEvents, config.batch.maxBytes, env);
    expect(retry).toEqual(a);
    buf.ack(`${SID}-0`);
    const b = buf.cutBatch(`${SID}-1`, config.batch.maxEvents, config.batch.maxBytes, env);
    expect(b?.id).toBe(`${SID}-1`);
    expect(b?.events.map((e) => e.n)).toEqual(Array.from({ length: 51 }, (_, i) => 100 + i));
    buf.discard(`${SID}-1`);
    expect(buf.pendingCount).toBe(0);
    expect(buf.cutBatch(`${SID}-2`, 100, 1e9, 0)).toBeUndefined();
  });

  it('lưu rồi nạp lại giữ trạng thái; gộp hàng đợi trùng không nhân đôi', () => {
    const buf = new TelemetryBuffer(config.buffer);
    for (let i = 0; i < 4; i += 1) {
      const ev = fullEvent('death', i);
      buf.push(ev, json(ev), 1);
    }
    buf.cutBatch('aaaaaaaa-0', 1, 1e9, 0);
    buf.ack('aaaaaaaa-0');
    buf.cutBatch('aaaaaaaa-1', 1, 1e9, 0);
    const stored = JSON.parse(buf.serialize()) as StoredEvent[];
    expect(stored.map((ev) => ev.s)).toEqual([-1, 'aaaaaaaa-1', undefined, undefined]);
    const next = new TelemetryBuffer(config.buffer);
    expect(next.restore(stored, prio)).toBe(4);
    expect(next.restore(stored, prio)).toBe(0);
    expect(next.serialize()).toBe(buf.serialize());
    expect(next.inFlight()?.id).toBe('aaaaaaaa-1');
  });
});

describe('lô và gói xuất (GDD 13 mục 5, 8)', () => {
  it('mỗi lô ≤ 100 sự kiện, ≤ 24 KB; đủ sự kiện, đúng thứ tự, id không trùng; sự kiện quá lớn bị bỏ', () => {
    const events = Array.from({ length: 950 }, (_, i) =>
      fullEvent(EVENT_NAMES[i % EVENT_NAMES.length] as EventName, i),
    );
    const { batches, skipped } = makeBatches(
      events,
      META,
      config.batch,
      (i) => `${SID}-${i}`,
      1763600000000,
    );
    expect(skipped).toEqual([]);
    for (const b of batches) {
      expect(b.events.length).toBeLessThanOrEqual(config.batch.maxEvents);
      expect(JSON.stringify(b).length).toBeLessThanOrEqual(config.batch.maxBytes);
      expect(validateBatchMeta(b)).toEqual([]);
    }
    expect(batches.flatMap((b) => b.events)).toEqual(events);
    expect(new Set(batches.map((b) => b.batch)).size).toBe(batches.length);
    const huge = {
      ...fullEvent('death'),
      p: { stage: 'verdant_gardens', kind: 'death', section: 'y'.repeat(30000) },
    } as TelemetryEvent;
    const r = makeBatches(
      [huge, events[0] as TelemetryEvent],
      META,
      config.batch,
      (i) => `s-${i}`,
      0,
    );
    expect(r.skipped).toEqual([huge]);
    expect(r.batches[0]?.events).toHaveLength(1);
  });
});

describe('Telemetry (bộ ghi; QB-153, QB-155, QB-156)', () => {
  const make = (over: Partial<TelemetryConfig> = {}, strict = false) => {
    let clock = 1763599990000;
    return new Telemetry({
      config: { ...config, ...over },
      catalogs,
      sid: SID,
      now: () => (clock += 1000),
      strict,
    });
  };

  it('phong bì t, sid, n tăng dần; sự kiện sai bị bỏ, đếm rejected, không tốn n; strict thì ném lỗi', () => {
    const tel = make();
    const a = tel.log('section_enter', { stage: 'verdant_gardens', section: 'A', tRun: 1.5 });
    expect(
      tel.log('death', { stage: 'verdant_gardens', kind: 'death', note: 'tự do' }),
    ).toBeUndefined();
    const b = tel.log('checkpoint', { stage: 'verdant_gardens', index: 1, tRun: 30 });
    expect(tel.rejected).toBe(1);
    expect(tel.lastRejected.join()).toMatch(/khóa lạ "note"/);
    expect([a?.n, b?.n]).toEqual([0, 1]);
    expect((b?.t ?? 0) - (a?.t ?? 0)).toBe(2000);
    expect(() => make({}, true).log('death', { stage: 'Kai', kind: 'death' })).toThrow(
      /đo lường sai/,
    );
  });

  it('làm tròn lúc ghi: giây 0,1; tỉ lệ 0,001', () => {
    const tel = make();
    const ev = tel.log('stage_progress', {
      stage: 'verdant_gardens',
      runSec: 12.3456,
      slowFramePct: 3.14159,
      gameSpeedMin: 0.66666,
    });
    expect(ev?.p).toMatchObject({ runSec: 12.3, slowFramePct: 3.142, gameSpeedMin: 0.667 });
  });

  it('sự kiện lớn hơn maxEventBytes bị bỏ', () => {
    const tel = make({ maxEventBytes: 120 });
    expect(tel.log('section_enter', { stage: 'verdant_gardens', section: 'A' })).toBeDefined();
    expect(
      tel.log('stage_start', {
        stage: 'verdant_gardens',
        difficulty: 'normal',
        run: 1,
        device: 'touch',
        level: 3,
        coreBits: 999,
      }),
    ).toBeUndefined();
    expect(tel.lastRejected.join()).toMatch(/maxEventBytes/);
  });

  it('tắt gửi: xóa bộ đệm, không ghi gì thêm, không có sự kiện "off"', () => {
    const tel = make();
    tel.log('consent', { state: 'notice' });
    tel.disable();
    expect(tel.buffer.size).toBe(0);
    expect(tel.log('consent', { state: 'on' })).toBeUndefined();
    tel.clientError('error', 'stage', false, 'x');
    expect(tel.buffer.size).toBe(0);
    expect(tel.enabled).toBe(false);
  });

  it('client_error: lần đầu count 1, lặp chỉ đếm, ghi bù khi flush; quá errorsPerSession bản ghi thì chỉ đếm', () => {
    const tel = make();
    for (let i = 0; i < 3; i += 1)
      tel.clientError('error', 'stage', false, `TypeError at https://x.io/a.js:${i}:5`);
    const errs = () => tel.buffer.all().filter((ev) => ev.e === 'client_error');
    expect(errs().map((ev) => ev.p.count)).toEqual([1]);
    tel.flushErrorCounts();
    expect(errs().map((ev) => ev.p.count)).toEqual([1, 2]);
    tel.flushErrorCounts();
    expect(errs()).toHaveLength(2);
    for (let i = 0; i < 50; i += 1)
      tel.clientError(
        'rejection',
        'menu',
        false,
        `lỗi loại ${'abcdefghijklmnopqrstuvwxyz'[i % 26]}${'xyz'[i % 3]}`,
      );
    tel.flushErrorCounts();
    expect(errs()).toHaveLength(config.errorsPerSession);
  });

  it('xuất JSON: dạng lô, đủ sự kiện (kể cả đã nhận), hợp lệ, chỉ ASCII', () => {
    const tel = make();
    tel.log('consent', { state: 'notice' });
    tel.log('stage_start', {
      stage: 'verdant_gardens',
      difficulty: 'normal',
      run: 1,
      device: 'touch',
    });
    tel.buffer.cutBatch(`${SID}-0`, 1, 1e9, 0);
    tel.buffer.ack(`${SID}-0`);
    const text = JSON.stringify(tel.exportAll(META));
    expect(isAscii(text)).toBe(true);
    const exp = JSON.parse(text);
    expect(exp.kind).toBe('export');
    const events = exp.batches.flatMap((b: { events: TelemetryEvent[] }) => b.events);
    expect(events.map((ev: TelemetryEvent) => ev.e)).toEqual(['consent', 'stage_start']);
    for (const ev of events) expect(validateEvent(ev, V)).toEqual([]);
  });
});

describe('dấu vân tay dữ liệu, id vũ khí', () => {
  it('fnv1a đúng vector chuẩn; dấu vân tay không phụ thuộc thứ tự, CRLF, telemetry.json', () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    expect(fnv1a(enc(''))).toBe(0x811c9dc5);
    expect(fnv1a(enc('a'))).toBe(0xe40c292c);
    const files = [
      { name: 'b.json', text: '{"x":1}\n' },
      { name: 'a.json', text: '{"y":2}\r\n' },
      { name: 'telemetry.json', text: '{"gate":1}' },
    ];
    const fp = dataFingerprint(files);
    expect(fp).toMatch(/^[0-9a-f]{8}$/);
    expect(dataFingerprint([...files].reverse())).toBe(fp);
    expect(
      dataFingerprint([
        files[0],
        { name: 'a.json', text: '{"y":2}\n' },
        { name: 'telemetry.json', text: '{"gate":0.5}' },
      ] as typeof files),
    ).toBe(fp);
    expect(
      dataFingerprint([files[0], { name: 'a.json', text: '{"y":3}\n' }] as typeof files),
    ).not.toBe(fp);
  });

  it('id vũ khí từ tên hiển thị; danh mục có màn, boss, vũ khí thật', () => {
    expect(weaponId('Vine Lash')).toBe('vineLash');
    expect(weaponId('Arc Cannon')).toBe('arcCannon');
    expect(catalogs.stage?.has('verdant_gardens')).toBe(true);
    expect(catalogs.stage?.has('prologue')).toBe(true);
    expect(catalogs.boss?.has('thorna')).toBe(true);
    expect(catalogs.weapon?.has('vineLash')).toBe(true);
  });
});
