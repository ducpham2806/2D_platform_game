/**
 * Báo cáo cổng MVP (logic thuần, ST-13-05a; GDD 13 mục 6.1–6.5, 7.3–7.4; duyệt QA Lead
 * 14/11/2026): chỉ số chặn cổng MV1–MV7 kèm khoảng Wilson, dấu hiệu "hỏng" H1–H4 (Hỏng, Không
 * hỏng, Thiếu dữ liệu), phễu, bảng theo màn và theo thiết bị, việc đề xuất theo thứ tự sửa.
 * Đầu vào là `Dataset` (`report-data.ts`); `renderReport` in Markdown.
 */
import type { Dataset, Device, Ev, Player, Run } from './report-data';
import { addDays, buildPlayers, median, wilson } from './report-data';

/** Một màn trong báo cáo (Prologue hoặc màn chiến dịch của đợt). */
export interface ReportStage {
  id: string;
  name: string;
  /** Boss chiến dịch; Prologue không có (xong màn = `stage_end{clear}`). */
  boss?: string;
  /** Id vũ khí khắc chế boss, chỉ khi lấy được trong các màn của đợt (MV6). */
  weakness?: string;
  /** Thứ tự đoạn (`stages.json` `segments` rồi `boss`; H1). */
  sections: readonly string[];
  /** Thời gian hoàn thành dự kiến (phút, H3). */
  expectedMin?: number;
  /** Thời gian thắng boss theo thiết kế [ít nhất, nhiều nhất] giây (H4). */
  designFightSec?: readonly [number, number];
}

export interface ReportParams {
  /** `telemetry.gate`, `telemetry.broken` (mục 6.2, 6.3). */
  gate: Readonly<Record<string, number>>;
  broken: Readonly<Record<string, number>>;
  prologue: ReportStage;
  /** Màn chiến dịch của đợt theo thứ tự (MVP: 4 màn). */
  stages: readonly ReportStage[];
  /** Ngày 0 (gửi link), `YYYY-MM-DD`. Thiếu thì MV4 Thiếu dữ liệu (không đoán từ dữ liệu). */
  day0?: string;
  /** Cửa sổ đo: ngày 0 tới hết ngày `windowDays`. */
  windowDays: number;
  /** Tổng cấp Upgrade ≤ a, ≤ b, còn lại (H3). */
  upgradeBins: readonly [number, number];
  /** Nhánh nhiều bậc nhất hơn nhánh kế ≤ chừng này thì build cân bằng (H3). */
  skillTieMax: number;
  /** Tỷ lệ trận thiếu `weaknessOwned` tối đa (MV6). */
  missingWeaknessMax: number;
  /** Ngày giữa hai phiên lùi hoặc nhảy quá chừng này thì bỏ người đó khỏi MV4 (mục 9). */
  maxDayJump: number;
  /** Hơn chừng này install thì nhắc xem lại nguồn link (mục 9). */
  maxInstalls: number;
}

export type Verdict = 'pass' | 'fail' | 'borderline' | 'insufficient';
export type BrokenStatus = 'broken' | 'ok' | 'insufficient';
export type Conclusion = 'pass' | 'fail' | 'undecided';

export interface GateMetric {
  id: string;
  label: string;
  /** Tỷ lệ (MV1–MV6) hoặc mức chênh lớn nhất (MV7); undefined khi không có mẫu. */
  value: number | undefined;
  hits?: number;
  n: number;
  ci?: [number, number];
  threshold: number;
  /** `ge`: đạt khi ≥ ngưỡng; `le`: đạt khi ≤ ngưỡng. */
  dir: 'ge' | 'le';
  minN: number;
  verdict: Verdict;
  note?: string;
}

export interface BrokenRow {
  id: 'H1' | 'H2' | 'H3' | 'H4';
  stage: string;
  /** Đoạn (H1), thiết bị (H2), nhóm build (H3), build của lượt (H4). */
  where: string;
  value: number | undefined;
  n: number;
  status: BrokenStatus;
  detail: string;
}

export interface FunnelStep {
  label: string;
  players: number;
}

export interface SectionRow {
  section: string;
  reached: number;
  deaths: number;
  stuck: number;
}

export interface StageTable {
  stage: ReportStage;
  entered: number;
  cleared: number;
  sections: SectionRow[];
  causes: { cause: string; count: number }[];
  /** Xong ngay lượt đầu vào màn / người vào. */
  firstRunClear: number | undefined;
  /** Trung bình số lần chết trong màn trước lần xong đầu (người đã xong; GDD 17: ≤ 8). */
  deathsBeforeClear: number | undefined;
}

export interface DeviceRow {
  device: Device;
  players: number;
  runs: number;
  deathsPerMin: number | undefined;
  /** Hạ boss Stage 1 / người vào Stage 1 (thiết bị chính của người chơi). */
  stage1Clear: number | undefined;
  stage1N: number;
  /** F1: trung bình phiếu Nhảy, Lướt, Bắn (1–5). */
  feel: Record<FeelQ, number | undefined>;
  feelN: number;
}

type FeelQ = 'feel_jump' | 'feel_dash' | 'feel_shoot';

export interface MvpReport {
  header: {
    waves: string[];
    builds: string[];
    data: string | undefined;
    otherData: Dataset['otherData'];
    batches: number;
    rejectedBatches: number;
    events: number;
    rejected: number;
    duplicates: number;
    filtered: Dataset['filtered'];
    excluded: Dataset['excluded'];
    players: number;
    byDevice: Record<Device, number>;
    day0: string | undefined;
    windowDays: number;
    anomalies: number;
    singleShortSession: number;
    /** Người bỏ khỏi MV4 vì ngày lùi hoặc nhảy quá `maxDayJump`. */
    clockJumps: number;
  };
  gate: GateMetric[];
  broken: BrokenRow[];
  funnel: FunnelStep[];
  stages: StageTable[];
  devices: DeviceRow[];
  /** Ghi chú tính toán (màn bỏ khỏi MV7, nhiều nhóm dữ liệu…). */
  notes: string[];
  recommendations: string[];
  conclusion: Conclusion;
}

const DEVICE_ORDER: readonly Device[] = ['keyboard', 'touch', 'gamepad'];
const FEEL: readonly FeelQ[] = ['feel_jump', 'feel_dash', 'feel_shoot'];
const EPS = 1e-9;
const NO_SECTION = '(đầu màn)';

function need(table: Readonly<Record<string, number>>, key: string): number {
  const v = table[key];
  if (v === undefined) throw new Error(`thiếu ngưỡng ${key}`);
  return v;
}

const num = (v: unknown, d = 0): number => (typeof v === 'number' ? v : d);
const sum = (xs: Iterable<number>): number => {
  let s = 0;
  for (const x of xs) s += x;
  return s;
};

/**
 * Chỉ số tỷ lệ, hướng ≥ θ (mục 6.5, duyệt QA Lead): Thiếu dữ liệu khi n < mẫu tối thiểu; Đạt khi
 * x/n ≥ θ; Biên khi x/n < θ ≤ cận trên Wilson; còn lại Không. So x/n với θ, dung sai 1e-9.
 */
export function ratioMetric(
  id: string,
  label: string,
  hits: number,
  n: number,
  threshold: number,
  minN: number,
  note?: string,
): GateMetric {
  const value = n > 0 ? hits / n : undefined;
  const ci = value !== undefined ? wilson(value, n) : undefined;
  let verdict: Verdict;
  if (value === undefined || n < minN) verdict = 'insufficient';
  else if (value >= threshold - EPS) verdict = 'pass';
  else verdict = ci && ci[1] >= threshold - EPS ? 'borderline' : 'fail';
  return {
    id,
    label,
    value,
    hits,
    n,
    ...(ci ? { ci } : {}),
    threshold,
    dir: 'ge',
    minN,
    verdict,
    ...(note ? { note } : {}),
  };
}

function runsIn(p: Player, stage: string): Run[] {
  return p.runs.filter((r) => r.stage === stage);
}

function clearedStage(p: Player, stage: string): boolean {
  return p.runs.some((r) => r.stage === stage && r.cleared);
}

// ───────────────────────── MV6 ─────────────────────────

interface WeaknessUse {
  fought: Set<string>;
  used: Set<string>;
  fights: number;
  missing: number;
}

/**
 * Dùng đúng vũ khí khắc chế (6.1, duyệt QA Lead): mỗi `boss_end` là một trận; `weaknessOwned` lấy
 * từ `boss_end`, không có thì từ `boss_start` gần nhất cùng boss trong lượt, vẫn không có thì trận
 * bị bỏ (đếm thiếu). Tỷ lệ = Σ dmg[điểm yếu] ÷ Σ dmg, gộp mọi trận của boss có vũ khí khắc chế.
 */
function weaknessUse(p: Player, stages: readonly ReportStage[], share: number): WeaknessUse {
  const weakOf = new Map<string, string>();
  for (const s of stages) if (s.boss && s.weakness) weakOf.set(s.boss, s.weakness);
  const agg = new Map<string, { weak: number; total: number }>();
  const out: WeaknessUse = { fought: new Set(), used: new Set(), fights: 0, missing: 0 };
  for (const r of p.runs) {
    const startOwned = new Map<string, boolean>();
    for (const e of r.events) {
      const boss = String(e.p.boss);
      if (!weakOf.has(boss)) continue;
      if (e.e === 'boss_start' && typeof e.p.weaknessOwned === 'boolean')
        startOwned.set(boss, e.p.weaknessOwned);
      if (e.e !== 'boss_end') continue;
      out.fights += 1;
      const owned =
        typeof e.p.weaknessOwned === 'boolean' ? e.p.weaknessOwned : startOwned.get(boss);
      if (owned === undefined) {
        out.missing += 1;
        continue;
      }
      if (!owned) continue;
      out.fought.add(boss);
      const dmg = (e.p.dmg ?? {}) as Record<string, number>;
      const a = agg.get(boss) ?? { weak: 0, total: 0 };
      a.weak += dmg[weakOf.get(boss) as string] ?? 0;
      a.total += sum(Object.values(dmg));
      agg.set(boss, a);
    }
  }
  for (const [boss, a] of agg)
    if (a.total > 0 && a.weak / a.total >= share - EPS) out.used.add(boss);
  return out;
}

// ───────────────────────── MV7, H2 ─────────────────────────

interface Group {
  deaths: number;
  kills: number;
  sec: number;
  players: Set<string>;
}

/** Chết/phút theo thiết bị của từng màn, gộp mọi lượt không giảm tốc (kể cả bỏ dở). */
function deathRates(
  players: readonly Player[],
  stages: readonly ReportStage[],
): { stage: string; rate: Partial<Record<Device, Group>> }[] {
  return stages.map((s) => {
    const rate: Partial<Record<Device, Group>> = {};
    for (const p of players)
      for (const r of runsIn(p, s.id)) {
        if (r.slowed) continue;
        const g = (rate[r.device] ??= { deaths: 0, kills: 0, sec: 0, players: new Set() });
        g.deaths += r.deaths;
        g.kills += r.kills;
        g.sec += r.runSec;
        g.players.add(p.install);
      }
    return { stage: s.id, rate };
  });
}

const perMin = (deaths: number, sec: number): number => deaths / (sec / 60);

/** Mức chênh cảm ứng so với bàn phím: touch ÷ keyboard − 1; bàn phím 0 thì 0 hoặc ∞. */
export function touchGap(touch: number, keyboard: number): number {
  if (keyboard > 0) return touch / keyboard - 1;
  return touch > 0 ? Number.POSITIVE_INFINITY : 0;
}

// ───────────────────────── Build (H3, H4) ─────────────────────────

/** Hướng build: nhánh nhiều bậc nhất (V, P, C); hơn nhánh kế ≤ `tieMax` bậc thì "cân bằng". */
export function buildDirection(skills: unknown, tieMax: number): string {
  const m = typeof skills === 'string' ? /^V(\d+)P(\d+)C(\d+)$/.exec(skills) : null;
  if (!m) return 'không rõ';
  const ranks: [string, number][] = [
    ['V', Number(m[1])],
    ['P', Number(m[2])],
    ['C', Number(m[3])],
  ];
  ranks.sort((a, b) => b[1] - a[1]);
  const [top, second] = ranks as [[string, number], [string, number]];
  return top[1] - second[1] <= tieMax ? 'cân bằng' : top[0];
}

/** Bậc tổng cấp Upgrade lúc vào màn: 0–a, (a+1)–b, ≥ b+1. */
export function upgradeTier(upgrades: unknown, bins: readonly [number, number]): string {
  const total =
    upgrades && typeof upgrades === 'object'
      ? sum(Object.values(upgrades as Record<string, number>))
      : 0;
  return total <= bins[0]
    ? `0–${bins[0]}`
    : total <= bins[1]
      ? `${bins[0] + 1}–${bins[1]}`
      : `≥ ${bins[1] + 1}`;
}

// ───────────────────────── Báo cáo ─────────────────────────

export function buildReport(ds: Dataset, params: ReportParams): MvpReport {
  const g = (k: string): number => need(params.gate, k);
  const br = (k: string): number => need(params.broken, k);
  const allStages = [params.prologue, ...params.stages];
  const bossOfStage = new Map<string, string>();
  for (const s of params.stages) if (s.boss) bossOfStage.set(s.id, s.boss);
  const { players, anomalies } = buildPlayers(ds, bossOfStage);
  const notes: string[] = [];
  const pro = params.prologue;
  const stage1 = params.stages[0];
  const minN = g('minSample');
  const minSmall = g('minSampleSmall');
  const minGroup = g('minGroup');
  const entered = (s: ReportStage): Player[] => players.filter((p) => runsIn(p, s.id).length > 0);

  // MV1–MV3.
  const proStarted = entered(pro);
  const gate: GateMetric[] = [
    ratioMetric(
      'MV1',
      `Xong ${pro.name}`,
      proStarted.filter((p) => clearedStage(p, pro.id)).length,
      proStarted.length,
      g('prologueClear'),
      minN,
      proStarted.length === 0 ? 'chưa có lượt Prologue nào' : undefined,
    ),
  ];
  if (stage1) {
    const s1 = entered(stage1);
    gate.push(
      ratioMetric(
        'MV2',
        `Hạ ${stage1.boss ?? stage1.name}`,
        s1.filter((p) => clearedStage(p, stage1.id)).length,
        s1.length,
        g('stage1Clear'),
        minN,
      ),
    );
  }
  const allDone = (p: Player): boolean => params.stages.every((s) => clearedStage(p, s.id));
  const anyStage = players.filter((p) => p.runs.length > 0);
  gate.push(
    ratioMetric(
      'MV3',
      `Hạ đủ ${params.stages.map((s) => s.boss ?? s.id).join(', ')}`,
      anyStage.filter(allDone).length,
      anyStage.length,
      g('allFourClear'),
      minN,
    ),
  );

  // MV4: quay lại ngày hôm sau, theo chuỗi `day` (giờ máy), trong [ngày 0; ngày 0 + windowDays].
  let clockJumps = 0;
  if (params.day0 === undefined) {
    gate.push({
      ...ratioMetric('MV4', 'Quay lại ngày hôm sau', 0, 0, g('returnNextDay'), minN),
      note: 'thiếu --day0',
    });
  } else {
    const day0 = params.day0;
    const lastDay = addDays(day0, params.windowDays);
    const lastFirst = addDays(day0, params.windowDays - 1);
    let outDays = 0;
    let hits = 0;
    let n = 0;
    for (const p of players) {
      if (clockJumped(p.days, params.maxDayJump)) {
        clockJumps += 1;
        continue;
      }
      const valid = p.days.filter((d) => d >= day0 && d <= lastDay).sort();
      outDays += p.days.length - valid.length;
      const first = valid[0];
      if (first === undefined || first > lastFirst) continue;
      n += 1;
      if (valid.includes(addDays(first, 1))) hits += 1;
    }
    gate.push(
      ratioMetric(
        'MV4',
        'Quay lại ngày hôm sau',
        hits,
        n,
        g('returnNextDay'),
        minN,
        [
          outDays > 0 ? `${outDays} phiên có ngày ngoài cửa sổ, không tính` : undefined,
          clockJumps > 0
            ? `${clockJumps} người bỏ vì ngày lùi hoặc nhảy > ${params.maxDayJump}`
            : undefined,
        ]
          .filter(Boolean)
          .join('; ') || undefined,
      ),
    );
  }

  // MV5: muốn chơi màn 5 (câu trả lời đầu tiên khác Bỏ qua), nhóm đã xong mọi màn của đợt.
  const done = players.filter(allDone);
  let yes = 0;
  let answered = 0;
  for (const p of done) {
    const ans = p.meta.find(
      (e) => e.e === 'survey_answer' && e.p.q === 'want_stage5' && e.p.a !== 'skip',
    );
    if (!ans) continue;
    answered += 1;
    if (ans.p.a === 'yes') yes += 1;
  }
  const mv5 = ratioMetric(
    'MV5',
    'Muốn chơi màn 5',
    yes,
    answered,
    g('wantStage5'),
    minSmall,
    `${answered}/${done.length} người xong ${params.stages.length} màn trả lời (trừ Bỏ qua)`,
  );
  if (done.length > 0 && answered / done.length < g('answerShareMin') - EPS) {
    mv5.verdict = 'insufficient';
    mv5.note += `; dưới ${pct(g('answerShareMin'))} nhóm trả lời`;
  }
  gate.push(mv5);

  // MV6: dùng đúng vũ khí khắc chế ở ≥ N boss.
  const needBosses = g('weaknessBosses');
  let mv6n = 0;
  let mv6hits = 0;
  let fights = 0;
  let missing = 0;
  for (const p of players) {
    const w = weaknessUse(p, params.stages, g('weaknessDamageShare'));
    fights += w.fights;
    missing += w.missing;
    if (w.fought.size < needBosses) continue;
    mv6n += 1;
    if (w.used.size >= needBosses) mv6hits += 1;
  }
  const mv6 = ratioMetric(
    'MV6',
    `Dùng đúng khắc chế ở ≥ ${needBosses} boss`,
    mv6hits,
    mv6n,
    g('weaknessUse'),
    minSmall,
    missing > 0 ? `${missing}/${fights} trận thiếu weaknessOwned` : undefined,
  );
  if (fights > 0 && missing / fights > params.missingWeaknessMax + EPS)
    mv6.verdict = 'insufficient';
  gate.push(mv6);

  // MV7 / H2: chết/phút cảm ứng so với bàn phím theo màn.
  const rates = deathRates(players, allStages);
  const brokenRows: BrokenRow[] = [];
  const theta = g('touchVsKeyboard');
  let mv7: number | undefined;
  let mv7Stage = '';
  const skipped: string[] = [];
  for (const sr of rates) {
    const t = sr.rate.touch;
    const k = sr.rate.keyboard;
    const tp = t?.players.size ?? 0;
    const kp = k?.players.size ?? 0;
    if (!t || !k || tp < minGroup || kp < minGroup || t.sec <= 0 || k.sec <= 0) {
      skipped.push(sr.stage);
      brokenRows.push({
        id: 'H2',
        stage: sr.stage,
        where: 'cảm ứng / bàn phím',
        value: undefined,
        n: tp + kp,
        status: 'insufficient',
        detail: `cảm ứng ${tp}, bàn phím ${kp} người; cần ≥ ${minGroup} mỗi nhóm`,
      });
      continue;
    }
    const gap = touchGap(perMin(t.deaths, t.sec), perMin(k.deaths, k.sec));
    const gapKills = touchGap(perMin(t.kills, t.sec), perMin(k.kills, k.sec));
    brokenRows.push({
      id: 'H2',
      stage: sr.stage,
      where: 'cảm ứng / bàn phím',
      value: gap,
      n: tp + kp,
      status: gap > theta + EPS ? 'broken' : 'ok',
      detail: `${fmt(perMin(t.deaths, t.sec))} so với ${fmt(perMin(k.deaths, k.sec))} chết/phút (${tp}, ${kp} người); không tính rơi hố: ${signed(gapKills)}`,
    });
    if (mv7 === undefined || gap > mv7) {
      mv7 = gap;
      mv7Stage = sr.stage;
    }
  }
  let mv7Verdict: Verdict;
  if (mv7 === undefined) mv7Verdict = 'insufficient';
  else if (mv7 > theta + EPS) mv7Verdict = 'fail';
  else mv7Verdict = skipped.length > 0 ? 'borderline' : 'pass';
  const mv7Notes = [
    mv7 !== undefined ? `cao nhất ở ${mv7Stage}` : undefined,
    skipped.length > 0 ? `màn thiếu mẫu: ${skipped.join(', ')}` : undefined,
  ].filter((x): x is string => x !== undefined);
  gate.push({
    id: 'MV7',
    label: 'Cảm ứng chết nhiều hơn bàn phím',
    value: mv7,
    n: allStages.length - skipped.length,
    threshold: theta,
    dir: 'le',
    minN: 1,
    verdict: mv7Verdict,
    ...(mv7Notes.length > 0 ? { note: `${mv7Notes.join('; ')}; n = số màn đủ mẫu` } : {}),
  });

  // H1: bỏ cuộc cùng một đoạn (màn có ≥ minGroup người vào; đoạn theo `segments`).
  const tables: StageTable[] = [];
  for (const s of allStages) {
    const ent = entered(s);
    const order = [NO_SECTION, ...s.sections];
    const unknown = new Set<string>();
    const stuck = new Map<string, number>();
    for (const p of ent) {
      let best = 0;
      for (const r of runsIn(p, s.id))
        for (const sec of [...r.sections.keys(), ...(r.furthest ? [r.furthest] : [])]) {
          const i = order.indexOf(sec);
          if (i < 0) unknown.add(sec);
          best = Math.max(best, i);
        }
      if (!clearedStage(p, s.id)) {
        const sec = order[best] as string;
        stuck.set(sec, (stuck.get(sec) ?? 0) + 1);
      }
    }
    tables.push(stageTable(s, ent, order, unknown, stuck));
    if (ent.length < minGroup) {
      brokenRows.push({
        id: 'H1',
        stage: s.id,
        where: '—',
        value: undefined,
        n: ent.length,
        status: 'insufficient',
        detail: `${ent.length} người vào màn; cần ≥ ${minGroup}`,
      });
      continue;
    }
    if (unknown.size > 0) {
      brokenRows.push({
        id: 'H1',
        stage: s.id,
        where: '—',
        value: undefined,
        n: ent.length,
        status: 'insufficient',
        detail: `đoạn ngoài danh sách của màn: ${[...unknown].sort().join(', ')}`,
      });
      continue;
    }
    let worst: [string, number] = [NO_SECTION, 0];
    for (const [sec, c] of stuck) if (c > worst[1]) worst = [sec, c];
    const value = worst[1] / ent.length;
    brokenRows.push({
      id: 'H1',
      stage: s.id,
      where: worst[1] > 0 ? worst[0] : '—',
      value,
      n: ent.length,
      status: value > br('quitSameSection') + EPS ? 'broken' : 'ok',
      detail: `${worst[1]}/${ent.length} người bỏ cuộc kẹt ở đây`,
    });
  }

  // H3: thời gian hoàn thành theo nhóm build (lượt hạ boss đầu).
  const ratioMax = br('buildTimeRatio');
  const minBuild = br('buildMinGroup');
  for (const s of params.stages) {
    if (!s.boss) continue;
    if (s.expectedMin === undefined) {
      brokenRows.push(missingRow('H3', s.id, `stages.json[${s.id}].expectedMin`));
      continue;
    }
    const groups = new Map<string, number[]>();
    for (const p of players) {
      let sec = 0;
      let slowed = false;
      let clear: Run | undefined;
      for (const r of runsIn(p, s.id)) {
        sec += r.runSec;
        slowed ||= r.slowed;
        if (r.cleared) {
          clear = r;
          break;
        }
      }
      if (!clear || slowed) continue;
      const key = `${buildDirection(clear.start.skills, params.skillTieMax)} · Upgrade ${upgradeTier(clear.start.upgrades, params.upgradeBins)}`;
      groups.set(key, [...(groups.get(key) ?? []), sec]);
    }
    let any = false;
    for (const [key, secs] of [...groups.entries()].sort()) {
      if (secs.length < minBuild) continue;
      any = true;
      const med = median(secs);
      const ratio = med / (s.expectedMin * 60);
      brokenRows.push({
        id: 'H3',
        stage: s.id,
        where: key,
        value: ratio,
        n: secs.length,
        status: ratio > ratioMax + EPS || ratio < 1 / ratioMax - EPS ? 'broken' : 'ok',
        detail: `trung vị ${fmt(med / 60, 1)} phút, dự kiến ${fmt(s.expectedMin, 1)}`,
      });
    }
    if (!any)
      brokenRows.push({
        id: 'H3',
        stage: s.id,
        where: '—',
        value: undefined,
        n: sum([...groups.values()].map((x) => x.length)),
        status: 'insufficient',
        detail: `chưa nhóm build nào đủ ${minBuild} người hạ boss`,
      });
  }

  // H4: thắng boss quá nhanh (lượt không giảm tốc).
  for (const s of params.stages) {
    if (!s.boss) continue;
    if (!s.designFightSec) {
      brokenRows.push(missingRow('H4', s.id, `stages.json[${s.id}].bossFightSec`));
      continue;
    }
    const limit = br('bossTtkFrac') * s.designFightSec[0];
    let wins = 0;
    let fastest = Number.POSITIVE_INFINITY;
    const before = brokenRows.length;
    for (const p of players)
      for (const r of runsIn(p, s.id)) {
        if (r.slowed) continue;
        for (const e of r.events) {
          if (e.e !== 'boss_end' || e.p.boss !== s.boss || e.p.outcome !== 'win') continue;
          if (num(e.p.gameSpeed, 1) < 1 - EPS) continue;
          wins += 1;
          const fight = num(e.p.fightSec);
          fastest = Math.min(fastest, fight);
          if (fight >= limit - EPS) continue;
          brokenRows.push({
            id: 'H4',
            stage: s.id,
            where: `${String(r.start.skills ?? '?')} · Upgrade ${upgradeTier(r.start.upgrades, params.upgradeBins)}`,
            value: fight,
            n: 1,
            status: 'broken',
            detail: `${s.boss} thắng sau ${fmt(fight, 1)} s (ngưỡng ${fmt(limit, 1)} s), ${String(r.start.difficulty)}, ${topDamage(e)}, install ${p.install.slice(0, 8)}`,
          });
        }
      }
    if (brokenRows.length === before)
      brokenRows.push({
        id: 'H4',
        stage: s.id,
        where: '—',
        value: wins > 0 ? fastest : undefined,
        n: wins,
        status: wins > 0 ? 'ok' : 'insufficient',
        detail:
          wins > 0
            ? `${wins} trận thắng, nhanh nhất ${fmt(fastest, 1)} s (ngưỡng ${fmt(limit, 1)} s)`
            : `chưa có trận thắng ${s.boss}`,
      });
  }

  // Phễu (Hub chưa có sự kiện: xong Prologue = vào Hub).
  const funnel: FunnelStep[] = [
    { label: `${pro.name}: vào`, players: proStarted.length },
    {
      label: `${pro.name}: xong (vào Hub)`,
      players: players.filter((p) => clearedStage(p, pro.id)).length,
    },
  ];
  for (const s of params.stages) {
    funnel.push({ label: `${s.name}: vào`, players: entered(s).length });
    funnel.push({
      label: `${s.name}: hạ ${s.boss ?? 'boss'}`,
      players: players.filter((p) => clearedStage(p, s.id)).length,
    });
  }

  if (ds.otherData.length > 0)
    notes.push(
      `Báo cáo nhóm dữ liệu \`${ds.data ?? '—'}\` (nhóm chứa ngày 0). Nhóm khác: ${ds.otherData.map((d) => `\`${d.data}\` (${d.events} sự kiện, ${d.installs} install)`).join(', ')}; chạy lại với \`--data\` để xem riêng (mục 7.4).`,
    );
  if (players.length > params.maxInstalls)
    notes.push(
      `${players.length} install, hơn ${params.maxInstalls}: xem lại link có lan ra ngoài nhóm tuyển không (mục 9).`,
    );
  if (anomalies > 0)
    notes.push(
      `${anomalies} lượt có \`stage_end{clear}\` mà không có \`boss_end{win}\` đúng boss màn: không tính là xong.`,
    );

  const byDevice: Record<Device, number> = { keyboard: 0, touch: 0, gamepad: 0 };
  for (const p of players) byDevice[p.device] += 1;
  const devices = deviceRows(players, rates, stage1);

  const failed =
    gate.some((m) => m.verdict === 'fail') || brokenRows.some((r) => r.status === 'broken');
  const open =
    gate.some((m) => m.verdict !== 'pass') || brokenRows.some((r) => r.status === 'insufficient');
  const conclusion: Conclusion = failed ? 'fail' : open ? 'undecided' : 'pass';
  return {
    header: {
      waves: ds.waves,
      builds: ds.builds,
      data: ds.data,
      otherData: ds.otherData,
      batches: ds.batches,
      rejectedBatches: ds.rejectedBatches,
      events: ds.events.length,
      rejected: ds.rejected,
      duplicates: ds.duplicates,
      filtered: ds.filtered,
      excluded: ds.excluded,
      players: players.length,
      byDevice,
      day0: params.day0,
      windowDays: params.windowDays,
      anomalies,
      singleShortSession: ds.singleShortSession,
      clockJumps,
    },
    gate,
    broken: brokenRows,
    funnel,
    stages: tables,
    devices,
    notes,
    recommendations: recommend(gate, brokenRows, devices, conclusion),
    conclusion,
  };
}

/** Ngày (theo thứ tự phiên) lùi, hoặc nhảy quá `maxJump` ngày giữa hai phiên liền nhau. */
export function clockJumped(days: readonly string[], maxJump: number): boolean {
  for (let i = 1; i < days.length; i += 1) {
    const a = Date.parse(`${days[i - 1] as string}T00:00:00Z`);
    const b = Date.parse(`${days[i] as string}T00:00:00Z`);
    if (b < a || (b - a) / 86_400_000 > maxJump) return true;
  }
  return false;
}

function missingRow(id: BrokenRow['id'], stage: string, field: string): BrokenRow {
  return {
    id,
    stage,
    where: '—',
    value: undefined,
    n: 0,
    status: 'insufficient',
    detail: `Thiếu dữ liệu: ${field}`,
  };
}

function topDamage(e: Ev): string {
  const dmg = (e.p.dmg ?? {}) as Record<string, number>;
  const total = sum(Object.values(dmg));
  const top = Object.entries(dmg).sort((a, b) => b[1] - a[1])[0];
  return top && total > 0
    ? `${top[0]} ${Math.round((top[1] / total) * 100)}% sát thương`
    : 'không có sát thương';
}

function stageTable(
  s: ReportStage,
  entered: readonly Player[],
  order: readonly string[],
  unknown: ReadonlySet<string>,
  stuck: ReadonlyMap<string, number>,
): StageTable {
  const reached = new Map<string, Set<string>>();
  const deaths = new Map<string, number>();
  const causes = new Map<string, number>();
  for (const p of entered)
    for (const r of runsIn(p, s.id)) {
      for (const sec of r.sections.keys()) {
        const set = reached.get(sec) ?? new Set<string>();
        set.add(r.install);
        reached.set(sec, set);
      }
      for (const e of r.events) {
        if (e.e !== 'death') continue;
        const sec = typeof e.p.section === 'string' ? e.p.section : NO_SECTION;
        deaths.set(sec, (deaths.get(sec) ?? 0) + 1);
        const cause = typeof e.p.cause === 'string' ? e.p.cause : String(e.p.kind);
        causes.set(cause, (causes.get(cause) ?? 0) + 1);
      }
    }
  const rows = [...order, ...[...unknown].sort()].filter(
    (sec) => sec !== NO_SECTION || (stuck.get(sec) ?? 0) > 0 || (deaths.get(sec) ?? 0) > 0,
  );
  const cleared = entered.filter((p) => clearedStage(p, s.id));
  const firstClear = entered.filter((p) => runsIn(p, s.id)[0]?.cleared).length;
  const before = cleared.map((p) => {
    let d = 0;
    for (const r of runsIn(p, s.id)) {
      d += r.deaths;
      if (r.cleared) break;
    }
    return d;
  });
  return {
    stage: s,
    entered: entered.length,
    cleared: cleared.length,
    sections: rows.map((sec) => ({
      section: sec,
      reached: reached.get(sec)?.size ?? 0,
      deaths: deaths.get(sec) ?? 0,
      stuck: stuck.get(sec) ?? 0,
    })),
    causes: [...causes.entries()]
      .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
      .slice(0, 5)
      .map(([cause, count]) => ({ cause, count })),
    firstRunClear: entered.length > 0 ? firstClear / entered.length : undefined,
    deathsBeforeClear: before.length > 0 ? sum(before) / before.length : undefined,
  };
}

function deviceRows(
  players: readonly Player[],
  rates: ReturnType<typeof deathRates>,
  stage1: ReportStage | undefined,
): DeviceRow[] {
  return DEVICE_ORDER.map((device) => {
    const own = players.filter((p) => p.device === device);
    let deaths = 0;
    let sec = 0;
    for (const sr of rates) {
      deaths += sr.rate[device]?.deaths ?? 0;
      sec += sr.rate[device]?.sec ?? 0;
    }
    const s1 = stage1 ? own.filter((p) => runsIn(p, stage1.id).length > 0) : [];
    const feel = {} as DeviceRow['feel'];
    let feelN = 0;
    for (const q of FEEL) {
      const vals: number[] = [];
      for (const p of players)
        for (const e of p.meta)
          if (e.e === 'survey_answer' && e.p.q === q && (e.p.device ?? p.device) === device) {
            const v = Number(e.p.a);
            if (Number.isInteger(v)) vals.push(v);
          }
      feel[q] = vals.length > 0 ? sum(vals) / vals.length : undefined;
      feelN = Math.max(feelN, vals.length);
    }
    return {
      device,
      players: own.length,
      runs: sum(own.map((p) => p.runs.length)),
      deathsPerMin: sec > 0 ? perMin(deaths, sec) : undefined,
      stage1Clear:
        stage1 && s1.length > 0
          ? s1.filter((p) => clearedStage(p, stage1.id)).length / s1.length
          : undefined,
      stage1N: s1.length,
      feel,
      feelN,
    };
  });
}

/** Việc đề xuất theo thứ tự sửa của mục 7.4. */
function recommend(
  gate: readonly GateMetric[],
  broken: readonly BrokenRow[],
  devices: readonly DeviceRow[],
  conclusion: Conclusion,
): string[] {
  if (conclusion === 'pass')
    return [
      'Qua cổng MVP (mục 7.4): MV1–MV7 đạt, không có dấu hiệu hỏng, không còn mục Thiếu dữ liệu. Producer ghi kết quả vào `04-Dev-Plan/08-Cong-MVP.md`.',
    ];
  const out: string[] = [];
  const bad = (id: string): boolean =>
    gate.some((m) => m.id === id && (m.verdict === 'fail' || m.verdict === 'borderline'));
  const hit = (id: BrokenRow['id']): BrokenRow[] =>
    broken.filter((r) => r.id === id && r.status === 'broken');
  if (bad('MV7') || hit('H2').length > 0)
    out.push(
      `Bước 1, điều khiển cảm ứng (MV7, H2): ${
        hit('H2')
          .map((r) => `${r.stage} ${signed(r.value)}`)
          .join(', ') || 'xem MV7'
      }.`,
    );
  const lowFeel = devices.filter((d) => FEEL.some((q) => (d.feel[q] ?? 5) < 4));
  if (lowFeel.length > 0)
    out.push(
      `Bước 2, thông số cảm giác (F1 < 4): ${lowFeel.map((d) => DEVICE_LABEL[d.device]).join(', ')}.`,
    );
  if (hit('H1').length > 0)
    out.push(
      `Bước 3, đoạn nhiều người bỏ cuộc (H1): ${hit('H1')
        .map((r) => `${r.stage}/${r.where} ${pct(r.value)}`)
        .join(', ')}. Nới khe né, thêm checkpoint trước khi chỉnh chỉ số.`,
    );
  if (hit('H3').length > 0 || hit('H4').length > 0)
    out.push(
      `Bước 4, cân bằng build và boss (H3, H4): ${[...hit('H3'), ...hit('H4')].map((r) => `${r.id} ${r.stage} ${r.where}`).join('; ')}.`,
    );
  const others = gate.filter((m) => m.verdict !== 'pass');
  if (others.length > 0)
    out.push(
      `Chỉ số cổng chưa đạt: ${others.map((m) => `${m.id} (${VERDICT[m.verdict]})`).join(', ')}.`,
    );
  if (conclusion === 'undecided')
    out.push(
      'Còn mục Biên hoặc Thiếu dữ liệu: chưa kết luận. Chỉ Producer được quyết định hoặc miễn, và ghi lý do (mục 6.5, 7.4).',
    );
  if (out.length > 0 && conclusion === 'fail')
    out.push('Bước 5: sửa xong thì thử lại với người mới (mục 7.4); không thêm hệ thống.');
  return out;
}

// ───────────────────────── Markdown ─────────────────────────

export const VERDICT: Record<Verdict, string> = {
  pass: 'Đạt',
  fail: 'Không',
  borderline: 'Biên',
  insufficient: 'Thiếu dữ liệu',
};

const STATUS: Record<BrokenStatus, string> = {
  broken: '🟧 Hỏng',
  ok: 'Không hỏng',
  insufficient: 'Thiếu dữ liệu',
};

const CONCLUSION: Record<Conclusion, string> = {
  pass: 'QUA cổng',
  fail: 'CHƯA QUA cổng',
  undecided: 'CHƯA KẾT LUẬN (còn Biên hoặc Thiếu dữ liệu)',
};

const DEVICE_LABEL: Record<Device, string> = {
  keyboard: 'Bàn phím',
  touch: 'Cảm ứng',
  gamepad: 'Tay cầm',
};

/** Số kiểu Việt: dấu phẩy thập phân. */
export function fmt(v: number | undefined, digits = 2): string {
  if (v === undefined || Number.isNaN(v)) return '—';
  if (!Number.isFinite(v)) return '∞';
  return v.toFixed(digits).replace('.', ',');
}

function pct(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return '—';
  if (!Number.isFinite(v)) return '∞';
  return `${Math.round(v * 100)}%`;
}

function signed(v: number | undefined): string {
  if (v === undefined || Number.isNaN(v)) return '—';
  return v >= 0 ? `+${pct(v)}` : `−${pct(-v)}`;
}

function share(part: number, whole: number): string {
  return whole > 0 ? pct(part / whole) : '—';
}

export function renderReport(r: MvpReport, title: string): string {
  const L: string[] = [];
  const h = r.header;
  L.push(`# ${title}`, '');
  L.push('## 1. Đầu trang', '');
  L.push(
    `- Đợt: ${h.waves.join(', ') || '—'}. Build: ${h.builds.join(', ') || '—'}. Dữ liệu: \`${h.data ?? '—'}\`.`,
  );
  L.push(
    `- Ngày 0: ${h.day0 ?? '— (thiếu --day0)'}; cửa sổ đo tới hết ${h.day0 ? addDays(h.day0, h.windowDays) : '—'}.`,
  );
  L.push(
    `- Người chơi: ${h.players} (bàn phím ${h.byDevice.keyboard}, cảm ứng ${h.byDevice.touch}, tay cầm ${h.byDevice.gamepad}; theo thiết bị nhiều giây chơi nhất).`,
  );
  L.push(
    `- Lô: ${h.batches} (bỏ ${h.rejectedBatches} lô sai phong bì); sự kiện: ${h.events}; bỏ vì sai lược đồ: ${h.rejected}; bản trùng: ${h.duplicates}.`,
  );
  L.push(
    `- Sự kiện lọc: ngoài đợt ${h.filtered.wave}, ngoài danh sách build ${h.filtered.build}, ngoài cửa sổ đo ${h.filtered.window}.`,
  );
  L.push(
    `- Install loại: staff ${h.excluded.staff.length}; mọi phiên quá ngắn ${h.excluded.short.length} (trong đó ${h.excluded.shortWithPrologue} đã vào Prologue); ghi rác ${h.excluded.spam.length}; hết sự kiện sau lọc ${h.excluded.filtered.length}.`,
  );
  L.push(
    `- Install chỉ có một phiên ngắn (có thể là tab ẩn danh, làm MV4 thấp hơn thật): ${h.singleShortSession}.`,
  );
  L.push('', `**Kết luận: ${CONCLUSION[r.conclusion]}** (mục 7.4).`, '');

  L.push('## 2. Cổng (MV1–MV7)', '');
  L.push('| Mã | Chỉ số | Giá trị | n | Khoảng 95% | Ngưỡng | Kết quả | Ghi chú |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const m of r.gate) {
    const value = m.dir === 'le' ? signed(m.value) : `${pct(m.value)} (${m.hits ?? 0}/${m.n})`;
    const ci = m.ci ? `${fmt(m.ci[0])}–${fmt(m.ci[1])}` : '—';
    const thr = m.dir === 'ge' ? `≥ ${fmt(m.threshold)}` : `≤ +${pct(m.threshold)}`;
    const note = [
      m.note,
      m.verdict === 'insufficient' && m.n < m.minN ? `cần n ≥ ${m.minN}` : undefined,
    ]
      .filter(Boolean)
      .join('; ');
    L.push(
      `| ${m.id} | ${m.label} | ${value} | ${m.n} | ${ci} | ${thr} | ${VERDICT[m.verdict]} | ${note} |`,
    );
  }
  L.push('');

  L.push('## 3. Dấu hiệu hỏng (H1–H4)', '');
  L.push(
    '| Mã | Màn | Ở đâu | Giá trị | n | Kết quả | Chi tiết |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  );
  const rank: Record<BrokenStatus, number> = { broken: 0, insufficient: 1, ok: 2 };
  const rows = [...r.broken].sort(
    (a, b) => a.id.localeCompare(b.id) || rank[a.status] - rank[b.status],
  );
  for (const x of rows) {
    const value =
      x.id === 'H4'
        ? x.value === undefined
          ? '—'
          : `${fmt(x.value, 1)} s`
        : x.id === 'H3'
          ? x.value === undefined
            ? '—'
            : `× ${fmt(x.value)}`
          : x.id === 'H2'
            ? signed(x.value)
            : pct(x.value);
    L.push(
      `| ${x.id} | ${x.stage} | ${x.where} | ${value} | ${x.n} | ${STATUS[x.status]} | ${x.detail} |`,
    );
  }
  L.push('');

  L.push(
    '## 4. Phễu',
    '',
    '| Mốc | Người | % so với mốc đầu | % so với mốc trước |',
    '| --- | --- | --- | --- |',
  );
  const first = r.funnel[0]?.players ?? 0;
  r.funnel.forEach((f, i) => {
    const prev = i > 0 ? (r.funnel[i - 1]?.players ?? 0) : f.players;
    L.push(
      `| ${f.label} | ${f.players} | ${share(f.players, first)} | ${share(f.players, prev)} |`,
    );
  });
  L.push('');

  L.push('## 5. Theo màn', '');
  for (const t of r.stages) {
    L.push(
      `### ${t.stage.name} (\`${t.stage.id}\`)`,
      '',
      `Vào ${t.entered}, xong ${t.cleared} (${share(t.cleared, t.entered)}); xong ngay lượt đầu ${pct(t.firstRunClear)}; chết trung bình trước lần xong đầu ${fmt(t.deathsBeforeClear, 1)}.`,
      '',
    );
    if (t.entered > 0 && t.sections.length > 0) {
      L.push('| Đoạn | Người tới | Chết | Bỏ cuộc kẹt ở đây |', '| --- | --- | --- | --- |');
      for (const s of t.sections)
        L.push(
          `| ${s.section} | ${s.reached} | ${s.deaths} | ${s.stuck} (${share(s.stuck, t.entered)}) |`,
        );
      L.push('');
    }
    if (t.causes.length > 0)
      L.push(
        `Nguyên nhân chết nhiều nhất: ${t.causes.map((c) => `\`${c.cause}\` ${c.count}`).join(', ')}.`,
        '',
      );
  }

  L.push('## 6. Thiết bị', '');
  L.push(
    '| Thiết bị | Người | Lượt | Chết/phút | Hạ boss Stage 1 | Nhảy | Lướt | Bắn |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  );
  for (const d of r.devices)
    L.push(
      `| ${DEVICE_LABEL[d.device]} | ${d.players} | ${d.runs} | ${fmt(d.deathsPerMin)} | ${pct(d.stage1Clear)} (n ${d.stage1N}) | ${fmt(d.feel.feel_jump, 1)} | ${fmt(d.feel.feel_dash, 1)} | ${fmt(d.feel.feel_shoot, 1)} |`,
    );
  L.push(
    '',
    'Chết/phút gồm cả rơi hố còn máu, bỏ lượt có giảm tốc. Phiếu F1 theo thiết bị lúc trả lời; mục tiêu ≥ 4.',
    '',
  );

  L.push('## 7. Chỉ số phụ', '', 'K, DK, T, X, S: chưa tính (ST-13-05b).', '');

  L.push('## 8. Việc đề xuất', '');
  for (const x of r.recommendations) L.push(`- ${x}`);
  if (r.notes.length > 0) {
    L.push('', '## Ghi chú tính toán', '');
    for (const n of r.notes) L.push(`- ${n}`);
  }
  L.push('');
  return L.join('\n');
}
