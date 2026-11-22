/**
 * Chỉ số phụ của báo cáo cổng MVP (logic thuần, ST-13-05b; GDD 13 mục 6.4): kinh tế K1–K6, độ
 * khó DK1–DK4, hướng dẫn T1–T4, kỹ thuật X1–X5, cảm giác F1, tiếp cận S1. Không chặn cổng: báo
 * cáo ghi Đúng mục tiêu, Lệch, Theo dõi hoặc Thiếu dữ liệu. Mục tiêu đọc từ
 * `telemetry.json → report.targets`.
 */
import type { Dataset, Device, Ev, Player, Run } from './report-data';
import { median } from './report-data';

/** Mục tiêu và số liệu game cho chỉ số phụ (dựng ở `core/mvp-report.ts`). */
export interface SecondaryParams {
  targets: SecondaryTargets;
  /** Số boss chiến dịch để Quầy mở (mốc đầu của `shop.unlockSchedule`). */
  shopOpenBosses: number;
  /** Giá rẻ nhất bán được lúc Quầy mở (K1). */
  cheapestPrice: number;
  /** Tổng giá mọi cấp Upgrade (K3, `04` mục 4: 14.593). */
  totalUpgradeCost: number;
  /** Thu Core Bit một lượt Thường theo id màn chiến dịch (`economy.incomeFormula`). */
  income: Readonly<Record<string, number>>;
  /** `rewardMul` theo id độ khó. */
  rewardMul: Readonly<Record<string, number>>;
  /** Id độ khó từ dễ tới khó (`difficulties.json`). */
  difficultyOrder: readonly string[];
}

export interface SecondaryTargets {
  k1: number;
  k2Max: number;
  k3SpendShare: number;
  k3MaxGap: number;
  k4Max: number;
  k6: readonly [number, number];
  dk1: readonly [number, number];
  dk2Max: number;
  dk3: number;
  dk4ChallengeQuit: number;
  dk4StoryDeaths: number;
  t1Min: readonly [number, number];
  t2Max: number;
  t3Max: number;
  t4: readonly [number, number, number];
  x1: number;
  x2Ms: number;
  x3Ms: number;
  x4Fps: number;
  x4Share: number;
  x5Max: number;
  f1: number;
  s1SlowStageMax: number;
  /** Id tùy chọn tiếp cận → giá trị mặc định (`settings_change.value` khác mặc định = có dùng). */
  s1Settings: Readonly<Record<string, number | boolean>>;
}

export type SecondaryStatus = 'ok' | 'off' | 'track' | 'insufficient';

export interface SecondaryMetric {
  id: string;
  label: string;
  value: number | undefined;
  /** Cách in giá trị. */
  unit: 'ratio' | 'mul' | 'min' | 'sec' | 'ms' | 'count' | 'score';
  n: number;
  /** Chữ mục tiêu, như "≥ 70%". */
  target: string;
  status: SecondaryStatus;
  detail?: string;
}

/** Màn trong báo cáo (phần chỉ số phụ cần). */
export interface SecondaryStage {
  id: string;
  boss?: string;
}

const EPS = 1e-9;
const num = (v: unknown, d = 0): number => (typeof v === 'number' ? v : d);
const sum = (xs: Iterable<number>): number => {
  let s = 0;
  for (const x of xs) s += x;
  return s;
};

/** Phân vị kiểu nội suy tuyến tính (p75 = `quantile(xs, 0.75)`). */
export function quantile(xs: readonly number[], q: number): number {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return (s[lo] as number) + ((s[hi] as number) - (s[lo] as number)) * (pos - lo);
}

function atLeast(v: number | undefined, t: number): SecondaryStatus {
  return v === undefined || Number.isNaN(v) ? 'insufficient' : v >= t - EPS ? 'ok' : 'off';
}

function atMost(v: number | undefined, t: number): SecondaryStatus {
  return v === undefined || Number.isNaN(v) ? 'insufficient' : v <= t + EPS ? 'ok' : 'off';
}

function within(v: number | undefined, [lo, hi]: readonly [number, number]): SecondaryStatus {
  if (v === undefined || Number.isNaN(v)) return 'insufficient';
  return v >= lo - EPS && v <= hi + EPS ? 'ok' : 'off';
}

const pctText = (v: number): string => `${Math.round(v * 100)}%`;
const numText = (v: number): string => String(v).replace('.', ',');

export function secondaryMetrics(
  ds: Dataset,
  players: readonly Player[],
  prologue: SecondaryStage,
  stages: readonly SecondaryStage[],
  sp: SecondaryParams,
): SecondaryMetric[] {
  const t = sp.targets;
  const pos = new Map<Ev, number>();
  ds.events.forEach((e, i) => pos.set(e, i));
  const out: SecondaryMetric[] = [];
  const rank = (d: unknown): number => sp.difficultyOrder.indexOf(String(d));
  const diff = (r: Run): string => String(r.start.difficulty);
  const clearPos = (r: Run): number => {
    const e = r.events.find((x) => x.e === 'boss_end' && x.p.outcome === 'win') ?? r.events.at(-1);
    return e ? (pos.get(e) ?? 0) : 0;
  };
  const campaign = new Set(stages.map((s) => s.id));

  // ── Kinh tế ──
  // K1: số dư sau lượt hạ boss chiến dịch thứ `shopOpenBosses`.
  let k1n = 0;
  let k1hits = 0;
  let k1missing = 0;
  for (const p of players) {
    const beaten = new Set<string>();
    for (const r of p.runs) {
      if (!r.cleared || !campaign.has(r.stage) || beaten.has(r.stage)) continue;
      beaten.add(r.stage);
      if (beaten.size !== sp.shopOpenBosses) continue;
      const bal = r.final?.balance;
      if (typeof bal !== 'number') k1missing += 1;
      else {
        k1n += 1;
        if (bal >= sp.cheapestPrice) k1hits += 1;
      }
      break;
    }
  }
  out.push({
    id: 'K1',
    label: `Đủ tiền cho món đầu tiên khi Quầy mở (${sp.cheapestPrice} Core Bit)`,
    value: k1n > 0 ? k1hits / k1n : undefined,
    unit: 'ratio',
    n: k1n,
    target: `≥ ${pctText(t.k1)}`,
    status: atLeast(k1n > 0 ? k1hits / k1n : undefined, t.k1),
    ...(k1missing > 0 ? { detail: `${k1missing} người thiếu số dư` } : {}),
  });

  // K2: số dư ở lần xong đầu (Thường) ÷ thu của màn.
  const k2: number[] = [];
  const k2by: string[] = [];
  for (const s of stages) {
    const inc = sp.income[s.id];
    if (!inc) continue;
    const xs: number[] = [];
    for (const p of players) {
      const r = p.runs.find((x) => x.stage === s.id && x.cleared);
      if (r && diff(r) === 'normal' && typeof r.final?.balance === 'number')
        xs.push(r.final.balance / inc);
    }
    if (xs.length > 0)
      k2by.push(`${s.id} ${numText(Math.round((sum(xs) / xs.length) * 100) / 100)}`);
    k2.push(...xs);
  }
  const k2v = k2.length > 0 ? sum(k2) / k2.length : undefined;
  out.push({
    id: 'K2',
    label: 'Số dư cuối màn ÷ thu của màn (lần xong đầu, Thường)',
    value: k2v,
    unit: 'mul',
    n: k2.length,
    target: `≤ ${numText(t.k2Max)}`,
    status: atMost(k2v, t.k2Max),
    ...(k2by.length > 0 ? { detail: k2by.join('; ') } : {}),
  });

  // K3: tổng giá đã trả tới lần xong màn cuối ở Thường ÷ tổng giá Upgrade, so với mô hình.
  const last = stages.at(-1);
  const cumIncome = sum(stages.map((s) => sp.income[s.id] ?? 0));
  const model = (t.k3SpendShare * cumIncome) / sp.totalUpgradeCost;
  const k3: number[] = [];
  if (last)
    for (const p of players) {
      const r = p.runs.find((x) => x.stage === last.id && x.cleared && diff(x) === 'normal');
      if (!r) continue;
      const until = clearPos(r);
      let paid = 0;
      for (const e of p.meta) {
        if ((pos.get(e) ?? 0) > until) continue;
        if (e.e === 'shop_buy') paid += num(e.p.price);
        if (e.e === 'shop_refund') paid -= num(e.p.price);
      }
      k3.push(paid / sp.totalUpgradeCost);
    }
  const k3v = k3.length > 0 ? sum(k3) / k3.length : undefined;
  out.push({
    id: 'K3',
    label: `Mức Upgrade sau ${last?.id ?? 'màn cuối'} Thường (đã trả ÷ ${sp.totalUpgradeCost})`,
    value: k3v,
    unit: 'ratio',
    n: k3.length,
    target: `${pctText(model)} ± ${Math.round(t.k3MaxGap * 100)} điểm`,
    status:
      k3v === undefined ? 'insufficient' : Math.abs(k3v - model) <= t.k3MaxGap + EPS ? 'ok' : 'off',
  });

  // K4: chơi lại màn (trừ màn cuối) ở độ khó bằng hoặc dễ hơn độ khó đã xong, khi còn màn chưa vào.
  const early = new Set(stages.slice(0, -1).map((s) => s.id));
  let k4 = 0;
  for (const p of players) {
    const entered = new Set<string>();
    let grind = false;
    for (const r of p.runs) {
      const cleared = (r.start.clearedBefore ?? []) as string[];
      const open = stages.some((s) => !entered.has(s.id) && s.id !== r.stage);
      if (
        early.has(r.stage) &&
        open &&
        cleared.length > 0 &&
        rank(r.start.difficulty) <= Math.max(...cleared.map(rank))
      )
        grind = true;
      entered.add(r.stage);
    }
    if (grind) k4 += 1;
  }
  const k4v = players.length > 0 ? k4 / players.length : undefined;
  out.push({
    id: 'K4',
    label: 'Lặp màn để kiếm tiền',
    value: k4v,
    unit: 'ratio',
    n: players.length,
    target: `< ${pctText(t.k4Max)}`,
    status: k4v === undefined ? 'insufficient' : k4v < t.k4Max - EPS ? 'ok' : 'off',
  });

  // K5: trung vị giây chơi ở lần mua đầu.
  const k5 = players
    .map((p) => p.meta.find((e) => e.e === 'shop_buy'))
    .filter((e): e is Ev => e !== undefined && typeof e.p.playSec === 'number')
    .map((e) => num(e.p.playSec));
  out.push({
    id: 'K5',
    label: 'Thời gian chơi tới lần mua đầu (trung vị)',
    value: k5.length > 0 ? median(k5) / 60 : undefined,
    unit: 'min',
    n: k5.length,
    target: 'theo dõi',
    status: k5.length > 0 ? 'track' : 'insufficient',
  });

  // K6: Core Bit lượt hạ boss đầu ÷ (thu của màn × rewardMul).
  const k6: number[] = [];
  for (const s of stages) {
    const inc = sp.income[s.id];
    if (!inc) continue;
    for (const p of players) {
      const r = p.runs.find((x) => x.stage === s.id && x.cleared);
      const mul = r ? sp.rewardMul[diff(r)] : undefined;
      if (r && mul && typeof r.final?.coreBitsEarned === 'number')
        k6.push(r.final.coreBitsEarned / (inc * mul));
    }
  }
  const k6v = k6.length > 0 ? median(k6) : undefined;
  out.push({
    id: 'K6',
    label: 'Core Bit lượt hạ boss đầu ÷ (thu của màn × hệ số thưởng), trung vị',
    value: k6v,
    unit: 'mul',
    n: k6.length,
    target: `${numText(t.k6[0])}–${numText(t.k6[1])}`,
    status: within(k6v, t.k6),
  });

  // ── Độ khó ──
  const challenge = sp.difficultyOrder.at(-1) ?? 'challenge';
  const story = sp.difficultyOrder[0] ?? 'story';
  const opened = players.filter((p) => p.runs.some((r) => r.start.challengeOpen === true));
  const tried = opened.filter((p) => p.runs.some((r) => diff(r) === challenge));
  const dk1 = opened.length > 0 ? tried.length / opened.length : undefined;
  out.push({
    id: 'DK1',
    label: 'Chọn Thử thách (người đã mở Thử thách)',
    value: dk1,
    unit: 'ratio',
    n: opened.length,
    target: `${pctText(t.dk1[0])}–${pctText(t.dk1[1])}`,
    status: within(dk1, t.dk1),
  });

  const quitShare = (d: string): [number, number] => {
    const rs = players.flatMap((p) => p.runs.filter((r) => campaign.has(r.stage) && diff(r) === d));
    return [rs.filter((r) => r.outcome !== 'clear').length, rs.length];
  };
  const [cq, cn] = quitShare(challenge);
  const [nq, nn] = quitShare('normal');
  const dk2 =
    cn > 0 && nn > 0
      ? nq > 0
        ? cq / cn / (nq / nn)
        : cq > 0
          ? Number.POSITIVE_INFINITY
          : 0
      : undefined;
  out.push({
    id: 'DK2',
    label: 'Bỏ cuộc ở Thử thách ÷ ở Thường (theo lượt)',
    value: dk2,
    unit: 'mul',
    n: cn,
    target: `≤ ${numText(t.dk2Max)}`,
    status: atMost(dk2, t.dk2Max),
    detail: `Thử thách ${cq}/${cn}, Thường ${nq}/${nn} lượt không xong`,
  });

  let dk3n = 0;
  let dk3hits = 0;
  for (const p of players)
    for (const s of stages) {
      const rs = p.runs.filter((r) => r.stage === s.id && diff(r) === story);
      if (rs.length === 0) continue;
      dk3n += 1;
      if (rs.some((r) => r.cleared)) dk3hits += 1;
    }
  const dk3 = dk3n > 0 ? dk3hits / dk3n : undefined;
  out.push({
    id: 'DK3',
    label: 'Màn vào ở Cốt truyện mà hạ boss ở Cốt truyện',
    value: dk3,
    unit: 'ratio',
    n: dk3n,
    target: `≥ ${pctText(t.dk3)}`,
    status: atLeast(dk3, t.dk3),
  });

  // DK4: quy tắc chỉnh.
  const flags: string[] = [];
  for (const s of stages) {
    const triers = players.filter((p) =>
      p.runs.some((r) => r.stage === s.id && diff(r) === challenge),
    );
    const stuck = new Map<string, number>();
    for (const p of triers) {
      const rs = p.runs.filter((r) => r.stage === s.id && diff(r) === challenge);
      if (rs.some((r) => r.cleared)) continue;
      const sec = rs.at(-1)?.furthest ?? [...(rs.at(-1)?.sections.keys() ?? [])].at(-1) ?? '?';
      stuck.set(sec, (stuck.get(sec) ?? 0) + 1);
    }
    for (const [sec, c] of stuck)
      if (triers.length > 0 && c / triers.length > t.dk4ChallengeQuit + EPS)
        flags.push(
          `${s.id}/${sec}: ${c}/${triers.length} người thử Thử thách bỏ cuộc → nới mẫu đòn`,
        );
    const deaths = new Map<string, number>();
    for (const p of players) {
      const by = new Map<string, number>();
      for (const r of p.runs.filter((x) => x.stage === s.id && diff(x) === story))
        for (const e of r.events)
          if (e.e === 'death' && typeof e.p.section === 'string')
            by.set(e.p.section, (by.get(e.p.section) ?? 0) + 1);
      for (const [sec, c] of by)
        if (c > t.dk4StoryDeaths) deaths.set(sec, (deaths.get(sec) ?? 0) + 1);
    }
    for (const [sec, c] of deaths)
      flags.push(
        `${s.id}/${sec}: ${c} người chết > ${t.dk4StoryDeaths} lần ở Cốt truyện → thêm checkpoint story`,
      );
  }
  out.push({
    id: 'DK4',
    label: 'Quy tắc chỉnh độ khó',
    value: flags.length,
    unit: 'count',
    n: players.length,
    target: 'không có',
    status: flags.length > 0 ? 'off' : 'ok',
    ...(flags.length > 0 ? { detail: flags.join('; ') } : {}),
  });

  // ── Hướng dẫn ──
  const proRuns = players.flatMap((p) =>
    p.runs.filter((r) => r.stage === prologue.id && r.cleared),
  );
  const t1 = proRuns.length > 0 ? median(proRuns.map((r) => r.runSec)) / 60 : undefined;
  out.push({
    id: 'T1',
    label: 'Thời lượng Prologue (trung vị lượt xong)',
    value: t1,
    unit: 'min',
    n: proRuns.length,
    target: `${numText(t.t1Min[0])}–${numText(t.t1Min[1])} phút`,
    status: within(t1, t.t1Min),
  });

  const started = new Map<string, number>();
  const stuckStep = new Map<string, number>();
  for (const p of players) {
    const all = [...p.meta, ...p.runs.flatMap((r) => r.events)];
    const skippedAll = all.some((e) => e.e === 'tutorial_skip' && e.p.scope === 'prologue');
    const done = new Set(
      all
        .filter((e) => e.e === 'tutorial_step_complete' || e.e === 'tutorial_skip')
        .map((e) => String(e.p.id)),
    );
    for (const id of new Set(
      all.filter((e) => e.e === 'tutorial_step_start').map((e) => String(e.p.id)),
    )) {
      started.set(id, (started.get(id) ?? 0) + 1);
      if (!skippedAll && !done.has(id)) stuckStep.set(id, (stuckStep.get(id) ?? 0) + 1);
    }
  }
  let worst: [string, number, number] | undefined;
  for (const [id, n] of started) {
    const share = (stuckStep.get(id) ?? 0) / n;
    if (!worst || share > worst[1] / worst[2]) worst = [id, stuckStep.get(id) ?? 0, n];
  }
  const t2 = worst ? worst[1] / worst[2] : undefined;
  out.push({
    id: 'T2',
    label: 'Bỏ cuộc tại một bước hướng dẫn (bước tệ nhất)',
    value: t2,
    unit: 'ratio',
    n: worst?.[2] ?? 0,
    target: `≤ ${pctText(t.t2Max)} mỗi bước`,
    status: atMost(t2, t.t2Max),
    ...(worst ? { detail: `bước ${worst[0]}: ${worst[1]}/${worst[2]}` } : {}),
  });

  const skipped = players.filter((p) =>
    [...p.meta, ...p.runs.flatMap((r) => r.events)].some(
      (e) =>
        (e.e === 'tutorial_skip' && e.p.scope === 'prologue') ||
        (e.e === 'tutorial_toggle' && e.p.on === false),
    ),
  ).length;
  const t3 = players.length > 0 ? skipped / players.length : undefined;
  out.push({
    id: 'T3',
    label: 'Bỏ qua hoặc tắt hướng dẫn',
    value: t3,
    unit: 'ratio',
    n: players.length,
    target: `≤ ${pctText(t.t3Max)}`,
    status: atMost(t3, t.t3Max),
  });

  const s1 = stages[0];
  const proStart = players.filter((p) => p.runs.some((r) => r.stage === prologue.id));
  const steps: [string, number][] = [
    [
      'xong Prologue (vào Hub)',
      proStart.filter((p) => p.runs.some((r) => r.stage === prologue.id && r.cleared)).length,
    ],
    ['vào Stage 1', s1 ? proStart.filter((p) => p.runs.some((r) => r.stage === s1.id)).length : 0],
    [
      'hạ boss Stage 1',
      s1 ? proStart.filter((p) => p.runs.some((r) => r.stage === s1.id && r.cleared)).length : 0,
    ],
  ];
  steps.forEach(([label, c], i) => {
    const v = proStart.length > 0 ? c / proStart.length : undefined;
    const target = t.t4[i] as number;
    out.push({
      id: `T4.${i + 1}`,
      label: `Phễu: ${label} / người vào Prologue`,
      value: v,
      unit: 'ratio',
      n: proStart.length,
      target: `≥ ${pctText(target)}`,
      status: atLeast(v, target),
    });
  });

  // ── Kỹ thuật ──
  const sessions = new Map<string, { fatal: boolean; platform: string }>();
  const toMenu: number[] = [];
  const toControl: number[] = [];
  let saveErrors = 0;
  for (const e of ds.events) {
    const key = `${e.install}|${e.sid}`;
    if (e.e === 'session_start')
      sessions.set(key, { fatal: false, platform: String(e.p.platform) });
    const s = sessions.get(key);
    if (e.e === 'client_error' && e.p.fatal === true && s) s.fatal = true;
    if (e.e === 'boot_timing') {
      if (typeof e.p.msToMenu === 'number') toMenu.push(e.p.msToMenu);
      if (typeof e.p.msToControl === 'number') toControl.push(e.p.msToControl);
    }
    if (e.e === 'save_error') saveErrors += 1;
  }
  const x1 =
    sessions.size > 0
      ? [...sessions.values()].filter((s) => !s.fatal).length / sessions.size
      : undefined;
  out.push({
    id: 'X1',
    label: 'Phiên không có lỗi chết game',
    value: x1,
    unit: 'ratio',
    n: sessions.size,
    target: `≥ ${pctText(t.x1)}`,
    status: atLeast(x1, t.x1),
  });
  const x2 = toMenu.length > 0 ? quantile(toMenu, 0.75) : undefined;
  out.push({
    id: 'X2',
    label: 'Vào game: p75 tới menu',
    value: x2,
    unit: 'ms',
    n: toMenu.length,
    target: `≤ ${t.x2Ms} ms`,
    status: atMost(x2, t.x2Ms),
  });
  const x3 = toControl.length > 0 ? quantile(toControl, 0.75) : undefined;
  out.push({
    id: 'X3',
    label: 'Điều khiển Kai từ lần mở đầu: p75',
    value: x3,
    unit: 'ms',
    n: toControl.length,
    target: `≤ ${t.x3Ms} ms`,
    status: atMost(x3, t.x3Ms),
    ...(toControl.length === 0 ? { detail: 'chưa ghi msToControl (ST-13-03)' } : {}),
  });
  const phoneRuns = players.flatMap((p) =>
    p.runs.filter((r) => {
      const pf = sessions.get(`${r.install}|${r.sid}`)?.platform;
      return (pf === 'android' || pf === 'ios') && typeof r.final?.fpsMedian === 'number';
    }),
  );
  const x4 =
    phoneRuns.length > 0
      ? phoneRuns.filter((r) => num(r.final?.fpsMedian) >= t.x4Fps).length / phoneRuns.length
      : undefined;
  out.push({
    id: 'X4',
    label: `Lượt trên điện thoại có FPS trung vị ≥ ${t.x4Fps}`,
    value: x4,
    unit: 'ratio',
    n: phoneRuns.length,
    target: `≥ ${pctText(t.x4Share)}`,
    status: atLeast(x4, t.x4Share),
  });
  out.push({
    id: 'X5',
    label: 'Lỗi lưu (`save_error`)',
    value: saveErrors,
    unit: 'count',
    n: sessions.size,
    target: `≤ ${t.x5Max}`,
    status: saveErrors <= t.x5Max ? 'ok' : 'off',
  });

  // ── Cảm giác ──
  for (const device of ['touch', 'keyboard', 'gamepad'] as const) {
    const means: [string, number][] = [];
    let n = 0;
    for (const q of ['feel_jump', 'feel_dash', 'feel_shoot']) {
      const vals: number[] = [];
      for (const p of players)
        for (const e of p.meta)
          if (e.e === 'survey_answer' && e.p.q === q && (e.p.device ?? p.device) === device) {
            const v = Number(e.p.a);
            if (Number.isInteger(v)) vals.push(v);
          }
      if (vals.length > 0) means.push([q.slice(5), sum(vals) / vals.length]);
      n = Math.max(n, vals.length);
    }
    const low = means.length > 0 ? Math.min(...means.map((m) => m[1])) : undefined;
    out.push({
      id: `F1.${DEVICE_ID[device]}`,
      label: `Cảm giác Nhảy, Lướt, Bắn (${DEVICE_TEXT[device]}, điểm thấp nhất)`,
      value: low,
      unit: 'score',
      n,
      target: `≥ ${numText(t.f1)}`,
      status: atLeast(low, t.f1),
      ...(means.length > 0
        ? { detail: means.map(([q, v]) => `${q} ${numText(Math.round(v * 10) / 10)}`).join(', ') }
        : {}),
    });
  }

  // ── Tiếp cận ──
  const touchPlayers = players.filter((p) => p.device === 'touch');
  const share = (xs: readonly Player[], f: (p: Player) => boolean): string =>
    xs.length > 0 ? `${xs.filter(f).length}/${xs.length}` : '0/0';
  const slowStages = stages
    .concat([prologue])
    .map((s) => {
      const ent = players.filter((p) => p.runs.some((r) => r.stage === s.id));
      const slow = ent.filter((p) => p.runs.some((r) => r.stage === s.id && r.slowed));
      return { s: s.id, n: ent.length, slow: slow.length };
    })
    .filter((x) => x.n > 0 && x.slow / x.n > t.s1SlowStageMax + EPS);
  const used = (id: string, def: number | boolean) => (p: Player) =>
    p.meta.some((e) => e.e === 'settings_change' && e.p.id === id && e.p.value !== def);
  const parts = [
    `tự bắn ${share(touchPlayers, (p) => p.runs.some((r) => r.start.autoFire === true))} người cảm ứng`,
    `hỗ trợ ngắm ${share(touchPlayers, (p) => p.runs.some((r) => r.start.aimAssist === true))}`,
    `giảm tốc ${share(players, (p) => p.runs.some((r) => r.slowed))} người`,
    ...Object.entries(t.s1Settings).map(([id, def]) => `${id} ${share(players, used(id, def))}`),
  ];
  out.push({
    id: 'S1',
    label: 'Dùng tùy chọn tiếp cận',
    value: undefined,
    unit: 'count',
    n: players.length,
    target: 'theo dõi',
    status: players.length > 0 ? 'track' : 'insufficient',
    detail:
      parts.join('; ') +
      (slowStages.length > 0
        ? `; màn có > ${pctText(t.s1SlowStageMax)} người dùng giảm tốc (quá khó, báo đặc tả màn): ${slowStages.map((x) => `${x.s} ${x.slow}/${x.n}`).join(', ')}`
        : ''),
  });
  return out;
}

const DEVICE_ID: Record<Device, string> = {
  touch: 'cam-ung',
  keyboard: 'ban-phim',
  gamepad: 'tay-cam',
};
const DEVICE_TEXT: Record<Device, string> = {
  touch: 'cảm ứng',
  keyboard: 'bàn phím',
  gamepad: 'tay cầm',
};

const STATUS_TEXT: Record<SecondaryStatus, string> = {
  ok: 'Đúng mục tiêu',
  off: '🟧 Lệch',
  track: 'Theo dõi',
  insufficient: 'Thiếu dữ liệu',
};

function valueText(m: SecondaryMetric): string {
  const v = m.value;
  if (v === undefined || Number.isNaN(v)) return '—';
  if (!Number.isFinite(v)) return '∞';
  switch (m.unit) {
    case 'ratio':
      return pctText(v);
    case 'mul':
    case 'score':
      return numText(Math.round(v * 100) / 100);
    case 'min':
      return `${numText(Math.round(v * 10) / 10)} phút`;
    case 'sec':
      return `${numText(Math.round(v * 10) / 10)} s`;
    case 'ms':
      return `${Math.round(v)} ms`;
    case 'count':
      return String(v);
  }
}

/** Bảng Markdown của mục 7 (chỉ số phụ). */
export function renderSecondary(ms: readonly SecondaryMetric[]): string[] {
  const L = [
    'Không chặn cổng; dùng để chọn việc sửa (GDD 13 mục 6.4). Mục tiêu ở `telemetry.json → report.targets`.',
    '',
    '| Mã | Chỉ số | Giá trị | n | Mục tiêu | Kết quả | Chi tiết |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const m of ms)
    L.push(
      `| ${m.id} | ${m.label} | ${valueText(m)} | ${m.n} | ${m.target} | ${STATUS_TEXT[m.status]} | ${m.detail ?? ''} |`,
    );
  return L;
}
