/**
 * Bộ dữ liệu mẫu có đáp án cho báo cáo cổng MVP (ST-13-05a; GDD 13 mục 9, 10): 20 người chơi
 * giả (P01–P20) và các install biên (staff, phiên quá ngắn, ghi rác, nhóm dữ liệu khác, lô hỏng,
 * bản trùng). Đáp án ghi ở `tests/mvp-report.test.ts`.
 */
import type { TelemetryBatch } from '../src/logic/telemetry/batch';
import type { Props, TelemetryEvent } from '../src/logic/telemetry/schema';
import { addDays, dayStartMs } from '../src/logic/telemetry/report-data';

export const DAY0 = '2026-11-20';
export const TZ = 420;
export const PRO = 'prologue';
export const S1 = 'verdant_gardens';
export const S2 = 'prism_institute';
export const S3 = 'cryo_vault';
export const S4 = 'cirrus_tower';

type Device = 'keyboard' | 'touch' | 'gamepad';

export interface Fight {
  boss: string;
  outcome: 'win' | 'death' | 'exit';
  fightSec?: number;
  dmg?: Record<string, number>;
  /** `weaknessOwned`: ghi ở cả hai sự kiện; `start` chỉ ở `boss_start`; `none` không ghi. */
  owned?: boolean | 'start' | 'none';
}

export interface RunSpec {
  stage: string;
  /** `runSec` cuối của lượt. */
  sec: number;
  sections?: string[];
  kills?: number;
  pits?: number;
  fights?: Fight[];
  end?: 'clear' | 'quit' | 'progress' | 'none';
  skills?: string;
  upgrades?: Record<string, number>;
  gameSpeed?: number;
  /** Phần tiếp của lượt mở ở phiên trước (QB-154): không có `stage_start`, `tRun` bắt đầu từ đây. */
  continueFrom?: number;
  difficulty?: string;
  /** Thuộc tính thêm vào `stage_start`, `stage_end`/`stage_progress`. */
  start?: Props;
  endProps?: Props;
}

export type Item =
  | { run: RunSpec }
  | { survey: [string, string] }
  | { raw: TelemetryEvent['e'] }
  | { ev: [TelemetryEvent['e'], Props] };

export interface SessionSpec {
  /** Ngày so với ngày 0 (theo `t`); `dayText` thay chuỗi `day` (đồng hồ máy sai). */
  day: number;
  hour?: number;
  dayText?: string;
  sid?: string;
  staff?: boolean;
  items: Item[];
}

export interface PlayerSpec {
  install: string;
  device: Device;
  sessions: SessionSpec[];
  data?: string;
}

export const META = { wave: 'd1', build: 'abc1234', data: 'deadbeef' };

export function installId(i: number): string {
  return `${i.toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`;
}

const CAUSES = ['enemy:drone_linh', 'spike'];

/** Sự kiện của một người chơi theo kịch bản. */
export function playerEvents(p: PlayerSpec): TelemetryEvent[] {
  const out: TelemetryEvent[] = [];
  const starts = new Map<string, number>();
  p.sessions.forEach((s, si) => {
    const sid = s.sid ?? `${p.install.slice(2, 8)}${si.toString(36).padStart(2, '0')}`;
    let n = 0;
    let t = dayStartMs(addDays(DAY0, s.day), TZ) + (s.hour ?? 10) * 3_600_000;
    const ev = (e: TelemetryEvent['e'], props: Props, at = t): void => {
      out.push({ e, t: at, sid, n, p: props });
      n += 1;
    };
    ev('session_start', {
      day: s.dayText ?? addDays(DAY0, s.day),
      tzMin: TZ,
      platform: p.device === 'touch' ? 'android' : 'windows',
      browser: 'chrome',
      ...(s.staff ? { staff: true } : {}),
    });
    for (const item of s.items) {
      if ('survey' in item) {
        ev('survey_answer', { q: item.survey[0], a: item.survey[1], device: p.device });
        continue;
      }
      if ('raw' in item) {
        ev(item.raw, { id: 'sfx', value: 0.5, where: 'menu' });
        continue;
      }
      if ('ev' in item) {
        ev(item.ev[0], item.ev[1]);
        continue;
      }
      const r = item.run;
      const t0 = r.continueFrom ?? 0;
      const at = (tRun: number): number => t + (tRun - t0) * 1000;
      if (r.continueFrom === undefined) {
        const k = (starts.get(r.stage) ?? 0) + 1;
        starts.set(r.stage, k);
        ev('stage_start', {
          stage: r.stage,
          difficulty: r.difficulty ?? 'normal',
          run: k,
          device: p.device,
          ...(r.skills ? { skills: r.skills } : {}),
          ...(r.upgrades ? { upgrades: r.upgrades } : {}),
          ...(r.gameSpeed !== undefined ? { gameSpeed: r.gameSpeed } : {}),
          ...r.start,
        });
      }
      const secs = r.sections ?? [];
      const span = r.sec - t0;
      secs.forEach((sec, i) => {
        const tRun = t0 + (span * i) / Math.max(secs.length, 1);
        ev('section_enter', { stage: r.stage, section: sec, tRun }, at(tRun));
      });
      const last = secs.at(-1);
      const dt = t0 + span * 0.9;
      for (let i = 0; i < (r.kills ?? 0); i += 1)
        ev(
          'death',
          {
            stage: r.stage,
            ...(last ? { section: last } : {}),
            kind: 'death',
            cause: CAUSES[i % CAUSES.length] as string,
            device: p.device,
            tRun: dt,
            streak: 1,
          },
          at(dt),
        );
      for (let i = 0; i < (r.pits ?? 0); i += 1)
        ev(
          'death',
          {
            stage: r.stage,
            ...(last ? { section: last } : {}),
            kind: 'pit',
            cause: 'pit',
            device: p.device,
            tRun: dt,
            streak: 1,
          },
          at(dt),
        );
      (r.fights ?? []).forEach((f, i) => {
        const owned = f.owned ?? true;
        ev(
          'boss_start',
          {
            stage: r.stage,
            boss: f.boss,
            attempt: i + 1,
            ...(owned === true || owned === false ? { weaknessOwned: owned } : {}),
            ...(owned === 'start' ? { weaknessOwned: true } : {}),
          },
          at(dt),
        );
        ev(
          'boss_end',
          {
            boss: f.boss,
            outcome: f.outcome,
            fightSec: f.fightSec ?? 70,
            dmg: f.dmg ?? { arcCannon: 250 },
            ...(owned === true || owned === false ? { weaknessOwned: owned } : {}),
            device: p.device,
            gameSpeed: r.gameSpeed ?? 1,
          },
          at(dt),
        );
      });
      const end = r.end ?? (r.fights?.some((f) => f.outcome === 'win') ? 'clear' : 'quit');
      const props: Props = {
        stage: r.stage,
        runSec: r.sec,
        deaths: r.kills ?? 0,
        pits: r.pits ?? 0,
        deviceSec: { [p.device]: r.sec },
        gameSpeedMin: r.gameSpeed ?? 1,
        ...(last ? { furthest: last } : {}),
        ...r.endProps,
      };
      if (end === 'clear' || end === 'quit') ev('stage_end', { ...props, outcome: end }, at(r.sec));
      if (end === 'progress') ev('stage_progress', props, at(r.sec));
      t = at(r.sec);
    }
  });
  return out;
}

/** Chia sự kiện thành lô `size` sự kiện. */
export function batchesOf(p: PlayerSpec, events: TelemetryEvent[], size = 40): TelemetryBatch[] {
  const out: TelemetryBatch[] = [];
  for (let i = 0; i < events.length; i += size) {
    const chunk = events.slice(i, i + size);
    const last = chunk.at(-1) as TelemetryEvent;
    out.push({
      schema: 2,
      install: p.install,
      wave: META.wave,
      build: META.build,
      data: p.data ?? META.data,
      batch: `${last.sid}-${out.length + 1}`,
      sentAt: last.t,
      events: chunk,
    });
  }
  return out;
}

// ───────────────────────── Kịch bản ─────────────────────────

const ALL = ['A', 'B', 'C', 'D', 'boss'];
const upTo = (sec: string): string[] => ALL.slice(0, ALL.indexOf(sec) + 1);
const HIGH = (weak: string): Record<string, number> => ({ [weak]: 50, arcCannon: 50 });
const LOW = (weak: string): Record<string, number> => ({ [weak]: 10, arcCannon: 90 });
const V_BUILD = { skills: 'V4P0C1', upgrades: { arc_core: 3, armor_plating: 3 } };
const BAL = { skills: 'V1P1C1', upgrades: { arc_core: 1 } };

export function sampleCast(): PlayerSpec[] {
  const cast: PlayerSpec[] = [];
  for (let i = 1; i <= 20; i += 1) {
    const device: Device = i === 20 ? 'gamepad' : i % 2 === 1 ? 'touch' : 'keyboard';
    const touch = device === 'touch';
    const runs: RunSpec[] = [];
    // Prologue: P19, P20 bỏ (P19 có đoạn "intro" ngoài danh sách; P20 phiên ngắn duy nhất).
    if (i === 19) runs.push({ stage: PRO, sec: 240, kills: 1, sections: ['intro'], end: 'quit' });
    else if (i === 20) runs.push({ stage: PRO, sec: 100, end: 'quit' });
    else runs.push({ stage: PRO, sec: 240, kills: 1, end: 'clear' });
    // Stage 1: P01–P14 hạ Thorna; cảm ứng 2 chết + 1 rơi hố, bàn phím 2 chết (MV7 +50%).
    const s1 = { stage: S1, sec: 600, kills: 2, pits: touch ? 1 : 0, skills: 'V1P0C0' };
    if (i <= 14) runs.push({ ...s1, sections: ALL, fights: [{ boss: 'thorna', outcome: 'win' }] });
    if (i === 16)
      runs.push({ ...s1, sections: ALL, fights: [{ boss: 'thorna', outcome: 'death' }] });
    if (i === 17) runs.push({ ...s1, sections: upTo('B') });
    if (i === 18)
      // Thắng boss xám rồi stage_end{clear}: bất thường, không tính là xong.
      runs.push({ ...s1, sections: ALL, fights: [{ boss: 'gray', outcome: 'win' }] });
    cast.push({
      install: installId(i),
      device,
      sessions: [{ day: 0, items: runs.map((run) => ({ run })) }],
    });
  }
  const P = (i: number): PlayerSpec => cast[i - 1] as PlayerSpec;
  const s1Items = (i: number): Item[] => (P(i).sessions[0] as SessionSpec).items;
  const add = (i: number, ...items: Item[]): void => {
    s1Items(i).push(...items);
  };

  // P15: lượt Stage 1 qua hai phiên (QB-154), phiên sau tới boss rồi đóng tab (abandon).
  add(15, { run: { stage: S1, sec: 200, sections: upTo('B'), end: 'none' } });
  P(15).sessions.push({
    day: 0,
    hour: 11,
    items: [
      {
        run: {
          stage: S1,
          continueFrom: 200,
          sec: 600,
          sections: ['C', 'D', 'boss'],
          kills: 2,
          pits: 1,
          end: 'progress',
        },
      },
    ],
  });

  // Stage 2 (Lumen, khắc chế Vine Lash).
  const s2 = { stage: S2, sec: 660, kills: 2 };
  for (const i of [1, 2, 3]) {
    add(i, { run: { ...s2, ...V_BUILD, sec: 900, kills: 1, sections: upTo('D'), end: 'quit' } });
    add(i, {
      run: {
        ...s2,
        ...V_BUILD,
        sec: 600,
        kills: 1,
        sections: ALL,
        fights: [{ boss: 'lumen', outcome: 'win', dmg: HIGH('vineLash') }],
      },
    });
  }
  // K4: P05 chơi lại Stage 1 ở Thường sau khi đã xong (lặp kiếm tiền); P02 chơi lại ở Thử thách
  // (khó hơn: không tính), bỏ cuộc ở đoạn A (DK2, DK4).
  add(5, {
    run: { stage: S1, sec: 0, sections: ['A'], end: 'quit', start: { clearedBefore: ['normal'] } },
  });
  add(2, {
    run: {
      stage: S1,
      sec: 0,
      sections: ['A'],
      end: 'quit',
      difficulty: 'challenge',
      start: { clearedBefore: ['normal'], challengeOpen: true },
    },
  });
  for (const i of [4, 5, 7, 8, 9])
    add(i, {
      run: {
        ...s2,
        ...BAL,
        sections: ALL,
        fights: [{ boss: 'lumen', outcome: 'win', dmg: HIGH('vineLash') }],
      },
    });
  // P06: hai trận Lumen, gộp sát thương thì tỷ lệ Vine Lash thấp (một phát trúng không thành "dùng đúng").
  add(6, {
    run: {
      ...s2,
      ...BAL,
      sections: ALL,
      fights: [
        { boss: 'lumen', outcome: 'death', fightSec: 3, dmg: { vineLash: 5 } },
        { boss: 'lumen', outcome: 'win', dmg: { vineLash: 10, arcCannon: 240 } },
      ],
    },
  });
  // P13 chơi Stage 3 trước Stage 2 (chưa có Prism Beam).
  add(13, {
    run: {
      stage: S3,
      sec: 690,
      kills: 1,
      sections: ALL,
      fights: [{ boss: 'cryo', outcome: 'death', owned: false, dmg: { arcCannon: 100 } }],
    },
  });
  // P10–P14 kẹt ở đoạn C của Stage 2 (H1 5/14); P11 có giảm tốc và chết nhiều (bỏ khỏi MV7).
  for (const i of [10, 12, 13, 14]) add(i, { run: { ...s2, sections: upTo('C') } });
  add(11, { run: { ...s2, kills: 10, gameSpeed: 0.8, sections: upTo('C') } });

  // Stage 3 (Cryo, khắc chế Prism Beam).
  const s3 = { stage: S3, sec: 690, kills: 1 };
  const cryoWin = (dmg: Record<string, number>, owned: Fight['owned'] = true): Item => ({
    run: {
      ...s3,
      sections: ALL,
      fights: [{ boss: 'cryo', outcome: 'win', dmg, owned }],
    },
  });
  for (const i of [1, 2, 5]) add(i, cryoWin(HIGH('prismBeam')));
  for (const i of [3, 4, 6]) add(i, cryoWin(LOW('prismBeam')));
  add(7, cryoWin(HIGH('prismBeam'), 'none'));
  for (const i of [1, 2, 3]) Object.assign((s1Items(i).at(-1) as { run: RunSpec }).run, V_BUILD);
  for (const i of [4, 5, 6, 7]) Object.assign((s1Items(i).at(-1) as { run: RunSpec }).run, BAL);
  add(8, { run: { ...s3, sections: upTo('A') } });
  add(9, {
    run: {
      ...s3,
      sections: ALL,
      fights: [{ boss: 'cryo', outcome: 'death', owned: 'start', dmg: HIGH('prismBeam') }],
    },
  });

  // Quầy (K3, K5): trước Stage 4. P03 mua rồi hoàn lại.
  add(1, { ev: ['shop_buy', { item: 'arc_core', level: 1, price: 400, playSec: 1800 }] });
  add(1, { ev: ['shop_buy', { item: 'magnet_range', level: 1, price: 200, playSec: 1900 }] });
  add(2, { ev: ['shop_buy', { item: 'arc_core', level: 1, price: 400, playSec: 2400 }] });
  add(3, { ev: ['shop_buy', { item: 'arc_core', level: 1, price: 400, playSec: 3000 }] });
  add(3, { ev: ['shop_refund', { item: 'arc_core', level: 1, price: 400 }] });

  // Stage 4 (Aeris, khắc chế Frost Shard); P04 thắng sau 5 s (H4).
  const s4 = { stage: S4, sec: 720, kills: 1 };
  const aeris = (outcome: Fight['outcome'], dmg: Record<string, number>, fightSec = 70): Fight => ({
    boss: 'aeris',
    outcome,
    dmg,
    fightSec,
  });
  add(1, { run: { ...s4, ...V_BUILD, sections: ALL, fights: [aeris('win', HIGH('frostShard'))] } });
  for (const i of [2, 3])
    add(i, {
      run: { ...s4, ...V_BUILD, sections: ALL, fights: [aeris('win', LOW('frostShard'))] },
    });
  add(4, {
    run: {
      ...s4,
      ...BAL,
      sections: ALL,
      fights: [aeris('win', { frostShard: 120, arcCannon: 30 }, 5)],
    },
  });
  add(5, { run: { ...s4, sections: upTo('D') } });
  for (const i of [6, 7])
    add(i, { run: { ...s4, sections: ALL, fights: [aeris('death', HIGH('frostShard'))] } });

  // Phiếu: MV5 (P01 có, P02 bỏ qua rồi có, P03 không rồi có ở phiên sau, P04 không trả lời); F1.
  add(1, { survey: ['want_stage5', 'yes'] });
  add(2, { survey: ['want_stage5', 'skip'] }, { survey: ['want_stage5', 'yes'] });
  add(3, { survey: ['want_stage5', 'no'] });
  for (const i of [1, 3])
    add(
      i,
      { survey: ['feel_jump', '3'] },
      { survey: ['feel_dash', '4'] },
      { survey: ['feel_shoot', '4'] },
    );
  for (const i of [2, 4])
    add(
      i,
      { survey: ['feel_jump', '5'] },
      { survey: ['feel_dash', '5'] },
      { survey: ['feel_shoot', '4'] },
    );

  // Ngày (MV4): P01–P08 quay lại ngày 1; P03 sid phiên sau nhỏ hơn phiên đầu (sắp theo t, không
  // theo sid); P09 bắt đầu ngày 2, quay lại ngày 3; P10 bắt đầu ngày 7 (ngoài mẫu số); P11 đồng
  // hồ lùi; P12 có phiên ngày 9 (ngoài cửa sổ, ở đó P12 hạ Lumen: không được tính).
  for (let i = 1; i <= 8; i += 1) P(i).sessions.push({ day: 1, hour: 20, items: [] });
  (P(3).sessions[0] as SessionSpec).sid = 'zzzzzzzz';
  (P(3).sessions[1] as SessionSpec).sid = '00000000';
  (P(3).sessions[1] as SessionSpec).items.push({ survey: ['want_stage5', 'yes'] });
  (P(9).sessions[0] as SessionSpec).day = 2;
  P(9).sessions.push({ day: 3, items: [] });
  (P(10).sessions[0] as SessionSpec).day = 7;
  P(11).sessions.push({ day: 1, dayText: '2026-10-01', items: [] });
  P(12).sessions.push({
    day: 9,
    items: [{ run: { ...s2, sections: ALL, fights: [{ boss: 'lumen', outcome: 'win' }] } }],
  });
  // Sự kiện sai lược đồ (bị bỏ, không làm hỏng phần còn lại).
  add(6, { raw: 'settings_change' });
  secondaryScript(P, add);
  return cast;
}

/** Install biên: staff, phiên quá ngắn, ghi rác, nhóm dữ liệu khác. */
export function edgeCast(): PlayerSpec[] {
  const spam: Item[] = Array.from({ length: 400 }, () => ({ raw: 'settings_change' as const }));
  return [
    {
      install: installId(0x101),
      device: 'keyboard',
      sessions: [{ day: 0, staff: true, items: [{ run: { stage: PRO, sec: 240, end: 'clear' } }] }],
    },
    {
      install: installId(0x102),
      device: 'touch',
      sessions: [{ day: 0, items: [{ run: { stage: PRO, sec: 3, end: 'none' } }] }],
    },
    {
      install: installId(0x103),
      device: 'keyboard',
      sessions: [{ day: 0, items: [{ run: { stage: PRO, sec: 120, end: 'quit' } }, ...spam] }],
    },
    {
      install: installId(0x104),
      device: 'keyboard',
      data: 'cafebabe',
      sessions: [{ day: 3, items: [{ run: { stage: PRO, sec: 240, end: 'clear' } }] }],
    },
  ];
}

export interface Sample {
  batches: TelemetryBatch[];
  /** Lô gửi lại của P01 và gói xuất của P02 (trùng với `batches`). */
  resent: TelemetryBatch[];
  exported: { schema: 2; kind: 'export'; exportedAt: number; batches: TelemetryBatch[] };
  broken: unknown[];
  duplicates: number;
}

export function buildSample(): Sample {
  const batches: TelemetryBatch[] = [];
  const byInstall = new Map<string, TelemetryBatch[]>();
  for (const p of [...sampleCast(), ...edgeCast()]) {
    const events = playerEvents(p);
    // Sự kiện `raw` của P06 thêm khóa lạ để kiểm lược đồ chặn.
    const list0 = events.map((e) =>
      p.install === installId(6) && e.e === 'settings_change'
        ? { ...e, p: { ...e.p, bogus: 1 } }
        : e,
    );
    const list = batchesOf(p, list0);
    byInstall.set(p.install, list);
    batches.push(...list);
  }
  const p1 = (byInstall.get(installId(1)) ?? [])[0] as TelemetryBatch;
  const resent = [{ ...p1, batch: `${p1.batch}r` }];
  const p2 = byInstall.get(installId(2)) ?? [];
  const exported = { schema: 2 as const, kind: 'export' as const, exportedAt: 0, batches: p2 };
  const broken = [{ ...p1, install: 'not-a-uuid' }];
  const duplicates = p1.events.length + p2.reduce((n, b) => n + b.events.length, 0);
  return { batches, resent, exported, broken, duplicates };
}

type Adder = (i: number, ...items: Item[]) => void;

/** Lượt thứ `k` ở màn `stage` của người chơi `i` (để gắn thêm thuộc tính). */
function runOf(p: PlayerSpec, stage: string, k = 0): RunSpec {
  const runs = p.sessions.flatMap((s) =>
    s.items.flatMap((x) => ('run' in x && x.run.stage === stage ? [x.run] : [])),
  );
  const r = runs[k];
  if (!r) throw new Error(`thiếu lượt ${stage}#${k} của ${p.install}`);
  return r;
}

/**
 * Sự kiện cho chỉ số phụ (ST-13-05b). Đáp án ở `tests/mvp-report.test.ts`:
 * K1 7/8, K2 13,5/13, K3 1000/4/14593, K4 1/20, K5 40 phút, K6 trung vị 1; DK1 1/4, DK2 (1/1) ÷
 * (17/52), DK3 1/2, DK4 2 cờ; T1 4 phút, T2 bước S01 1/6, T3 2/20, T4 18, 18, 14 trên 20; X1
 * 30/31, X2 3500 ms, X3 thiếu, X4 3/4, X5 1; F1 cảm ứng 3; S1 tự bắn 2/10.
 */
function secondaryScript(P: (i: number) => PlayerSpec, add: Adder): void {
  const merge = (r: RunSpec, key: 'start' | 'endProps', props: Props): void => {
    r[key] = { ...r[key], ...props };
  };
  // K1: số dư sau lượt hạ boss thứ hai (Lumen); P09 không có số dư.
  for (let i = 1; i <= 8; i += 1) {
    const r = runOf(P(i), S2, i <= 3 ? 1 : 0);
    merge(r, 'endProps', { balance: i === 8 ? 150 : 300 });
  }
  // K2: số dư ở lần xong Stage 1; K6: Core Bit kiếm được.
  for (const [i, bal] of [
    [1, 225],
    [2, 225],
    [3, 225],
    [4, 225],
    [5, 450],
  ] as const)
    merge(runOf(P(i), S1), 'endProps', { balance: bal });
  for (const [i, bits] of [
    [1, 225],
    [2, 225],
    [3, 225],
    [4, 225],
    [6, 180],
    [7, 270],
  ] as const)
    merge(runOf(P(i), S1), 'endProps', { coreBitsEarned: bits });
  // DK1: đã mở Thử thách; DK3, DK4: Cốt truyện (P06 hạ Cryo, P08 chết 4 lần ở đoạn A).
  merge(runOf(P(1), S2), 'start', { challengeOpen: true });
  for (const i of [3, 4]) merge(runOf(P(i), S3), 'start', { challengeOpen: true });
  runOf(P(6), S3).difficulty = 'story';
  Object.assign(runOf(P(8), S3), { difficulty: 'story', kills: 4 });
  // Hướng dẫn (T2, T3).
  for (const i of [1, 2, 3, 4])
    add(
      i,
      { ev: ['tutorial_step_start', { id: 'S01' }] },
      { ev: ['tutorial_step_complete', { id: 'S01' }] },
    );
  add(5, { ev: ['tutorial_step_start', { id: 'S01' }] });
  add(
    6,
    { ev: ['tutorial_step_start', { id: 'S01' }] },
    { ev: ['tutorial_skip', { id: 'S01', scope: 'step' }] },
  );
  add(
    7,
    { ev: ['tutorial_step_start', { id: 'S02' }] },
    { ev: ['tutorial_skip', { id: 'S02', scope: 'prologue' }] },
  );
  add(8, { ev: ['tutorial_toggle', { on: false, where: 'pause' }] });
  // Kỹ thuật (X1–X5).
  [1000, 2000, 3000, 5000].forEach((ms, k) =>
    (P(k + 1).sessions[0] as SessionSpec).items.unshift({ ev: ['boot_timing', { msToMenu: ms }] }),
  );
  add(10, { ev: ['client_error', { kind: 'error', fatal: true, msg: 'boom', count: 1 }] });
  add(10, { ev: ['save_error', { op: 'write', code: 'write' }] });
  for (const [i, fps] of [
    [1, 60],
    [3, 50],
    [5, 58],
    [7, 60],
  ] as const)
    merge(runOf(P(i), S1), 'endProps', { fpsMedian: fps });
  // Tiếp cận (S1).
  for (const i of [1, 3]) merge(runOf(P(i), S1), 'start', { autoFire: true });
  merge(runOf(P(5), S1), 'start', { aimAssist: true });
  add(2, { ev: ['settings_change', { id: 'a11y.colorblind', value: 1, where: 'menu' }] });
  add(4, { ev: ['settings_change', { id: 'a11y.colorblind', value: 0, where: 'menu' }] });
  // K3: mua sau khi hạ Aeris không tính.
  add(2, { ev: ['shop_buy', { item: 'arc_core', level: 2, price: 500, playSec: 9000 }] });
}
