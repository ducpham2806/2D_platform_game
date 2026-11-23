import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseGameConfig } from '../src/core/game-config';
import {
  isDay,
  mvpReportParams,
  parseReportSettings,
  runMvpReport,
  secondaryParams,
} from '../src/core/mvp-report';
import { quantile } from '../src/logic/telemetry/report-extra';
import { weaponId } from '../src/core/telemetry-catalogs';
import {
  buildDirection,
  clockJumped,
  type GateMetric,
  type MvpReport,
  ratioMetric,
  touchGap,
  upgradeTier,
} from '../src/logic/telemetry/report';
import { addDays, collectBatches, dayStartMs, wilson } from '../src/logic/telemetry/report-data';
import { loadData } from './helpers';
import { buildSample, DAY0, installId, S1, S2, S3, S4 } from './mvp-sample';

type Files = Record<string, Record<string, Record<string, unknown>>>;

const DATA = loadData();
const SAMPLE = buildSample();
const INPUTS = [SAMPLE.batches, SAMPLE.resent, SAMPLE.exported, SAMPLE.broken];

/** Dữ liệu thật, hạ mẫu tối thiểu để bộ mẫu 20 người cho ra Đạt/Không thay vì Thiếu dữ liệu. */
function smallSampleFiles(): Record<string, unknown> {
  const files = structuredClone(DATA) as unknown as Files;
  const gate = (files.telemetry as Record<string, Record<string, unknown>>).gate as Record<
    string,
    unknown
  >;
  gate.minSample = 10;
  gate.minSampleSmall = 3;
  return files as unknown as Record<string, unknown>;
}

function metric(r: MvpReport, id: string): GateMetric {
  const m = r.gate.find((x) => x.id === id);
  if (!m) throw new Error(`thiếu ${id}`);
  return m;
}

function rows(r: MvpReport, id: string, stage?: string) {
  return r.broken.filter((x) => x.id === id && (stage === undefined || x.stage === stage));
}

describe('báo cáo cổng MVP: bộ mẫu có đáp án (GDD 13 mục 9, 10)', () => {
  const { report: r, markdown } = runMvpReport(smallSampleFiles(), INPUTS, {
    day0: DAY0,
    waves: ['d1'],
  });

  it('đầu trang: lô hỏng, sự kiện sai lược đồ, bản trùng (QB-152), install loại', () => {
    const h = r.header;
    expect(h.players).toBe(20);
    expect(h.byDevice).toEqual({ keyboard: 9, touch: 10, gamepad: 1 });
    expect(h.rejectedBatches).toBe(1);
    expect(h.rejected).toBe(1);
    expect(h.duplicates).toBe(SAMPLE.duplicates);
    expect(h.excluded.staff).toEqual([installId(0x101)]);
    expect(h.excluded.short).toEqual([installId(0x102)]);
    expect(h.excluded.shortWithPrologue).toBe(1);
    expect(h.excluded.spam).toEqual([installId(0x103)]);
    expect(h.excluded.filtered).toEqual([installId(0x104)]);
    expect(h.otherData).toEqual([{ data: 'cafebabe', events: 3, installs: 1 }]);
    expect(h.data).toBe('deadbeef');
    expect(h.singleShortSession).toBe(1);
    expect(h.anomalies).toBe(1);
    // Phiên ngày 9 của P12 ngoài cửa sổ: bỏ ở mức sự kiện.
    expect(h.filtered.window).toBeGreaterThan(0);
  });

  it('MV1–MV7 đúng đáp án (giá trị, n, kết quả)', () => {
    const expected: [string, number, number, string][] = [
      ['MV1', 18, 20, 'pass'],
      ['MV2', 14, 18, 'pass'],
      ['MV3', 4, 20, 'fail'],
      ['MV4', 9, 18, 'pass'],
      ['MV5', 2, 3, 'pass'],
      ['MV6', 6, 8, 'pass'],
    ];
    for (const [id, hits, n, verdict] of expected) {
      const m = metric(r, id);
      expect([m.id, m.hits, m.n, m.verdict]).toEqual([id, hits, n, verdict]);
      const [lo, hi] = wilson(hits / n, n);
      expect(m.ci?.[0]).toBeCloseTo(lo, 6);
      expect(m.ci?.[1]).toBeCloseTo(hi, 6);
    }
    const mv7 = metric(r, 'MV7');
    expect(mv7.value).toBeCloseTo(0.5, 9);
    expect(mv7.verdict).toBe('fail');
    expect(mv7.note).toContain(S1);
    expect(mv7.note).toContain(`${S3}, ${S4}`);
    expect(metric(r, 'MV6').note).toBe('1/25 trận thiếu weaknessOwned');
    expect(metric(r, 'MV4').note).toContain('1 người bỏ vì ngày lùi');
    expect(r.conclusion).toBe('fail');
  });

  it('MV5 lấy câu trả lời đầu tiên khác Bỏ qua, phiên sắp theo t (không theo sid)', () => {
    // P03: "no" ở phiên sid zzzzzzzz (ngày 0) rồi "yes" ở sid 00000000 (ngày 1) → tính "no".
    expect(metric(r, 'MV5').note).toBe('3/4 người xong 4 màn trả lời (trừ Bỏ qua)');
  });

  it('H1: bỏ cuộc cùng đoạn; đoạn ngoài danh sách thì Thiếu dữ liệu; lượt qua hai phiên (QB-154)', () => {
    expect(rows(r, 'H1', S2)[0]).toMatchObject({ where: 'C', n: 14, status: 'broken' });
    expect(rows(r, 'H1', S2)[0]?.value).toBeCloseTo(5 / 14, 9);
    // P15 tới boss ở phiên thứ hai của cùng lượt, nên 3 người kẹt ở boss (P15, P16, P18).
    expect(rows(r, 'H1', S1)[0]).toMatchObject({ where: 'boss', n: 18, status: 'ok' });
    expect(rows(r, 'H1', S1)[0]?.value).toBeCloseTo(3 / 18, 9);
    expect(rows(r, 'H1', S3)[0]).toMatchObject({ where: 'boss', n: 10, status: 'ok' });
    expect(rows(r, 'H1', S4)[0]).toMatchObject({ where: 'boss', n: 7, status: 'ok' });
    expect(rows(r, 'H1', 'prologue')[0]).toMatchObject({ status: 'insufficient' });
    expect(rows(r, 'H1', 'prologue')[0]?.detail).toContain('intro');
  });

  it('H2: theo màn, bỏ lượt giảm tốc; màn thiếu mẫu ghi Thiếu dữ liệu', () => {
    expect(rows(r, 'H2', S1)[0]).toMatchObject({ status: 'broken', n: 18 });
    expect(rows(r, 'H2', S1)[0]?.detail).toContain('không tính rơi hố: +0%');
    // P11 (cảm ứng, giảm tốc, chết 10 lần) không vào nhóm.
    const s2 = rows(r, 'H2', S2)[0];
    expect(s2?.n).toBe(13);
    expect(s2?.value).toBeCloseTo(12 / 5640 / (14 / 5460) - 1, 9);
    expect(rows(r, 'H2', S3)[0]?.status).toBe('insufficient');
    expect(rows(r, 'H2', S4)[0]?.status).toBe('insufficient');
    expect(rows(r, 'H2', 'prologue')[0]).toMatchObject({ status: 'ok', value: 0 });
  });

  it('H3 nhóm build × bậc Upgrade; H4 thắng boss quá nhanh', () => {
    const v = rows(r, 'H3', S2).find((x) => x.where === 'V · Upgrade ≥ 6');
    expect(v).toMatchObject({ n: 3, status: 'broken' });
    expect(v?.value).toBeCloseTo(1500 / 660, 9);
    expect(rows(r, 'H3', S1)).toEqual([
      expect.objectContaining({ where: 'cân bằng · Upgrade 0–2', n: 14, status: 'ok', value: 1 }),
    ]);
    const h4 = rows(r, 'H4', S4);
    expect(h4).toHaveLength(1);
    expect(h4[0]).toMatchObject({ status: 'broken', value: 5, where: 'V1P1C1 · Upgrade 0–2' });
    expect(h4[0]?.detail).toContain('install 00000004');
    expect(rows(r, 'H4', S1)[0]).toMatchObject({ status: 'ok', n: 14 });
  });

  it('phễu, bảng theo màn, thiết bị, việc đề xuất theo thứ tự 7.4', () => {
    expect(r.funnel.map((f) => f.players)).toEqual([20, 18, 18, 14, 14, 9, 10, 7, 7, 4]);
    const s1 = r.stages.find((t) => t.stage.id === S1);
    expect(s1?.sections.map((s) => [s.section, s.reached, s.deaths, s.stuck])).toEqual([
      ['A', 18, 0, 0],
      ['B', 18, 3, 1],
      ['C', 17, 0, 0],
      ['D', 17, 0, 0],
      ['boss', 17, 42, 3],
    ]);
    expect(s1?.causes).toContainEqual({ cause: 'pit', count: 9 });
    const touch = r.devices.find((d) => d.device === 'touch');
    expect(touch?.feel).toEqual({ feel_jump: 3, feel_dash: 4, feel_shoot: 4 });
    expect(touch?.stage1Clear).toBeCloseTo(7 / 9, 9);
    const rec = r.recommendations.join('\n');
    const order = ['Bước 1', 'Bước 2', 'Bước 3', 'Bước 4', 'Bước 5'].map((k) => rec.indexOf(k));
    expect(order.every((i, k) => i >= 0 && (k === 0 || i > (order[k - 1] as number)))).toBe(true);
  });

  it('Markdown có đủ 8 phần, dòng hỏng đánh dấu', () => {
    for (const h of ['## 1.', '## 2.', '## 3.', '## 4.', '## 5.', '## 6.', '## 7.', '## 8.'])
      expect(markdown).toContain(h);
    expect(markdown).toContain('**Kết luận: CHƯA QUA cổng**');
    expect(markdown).toContain('| H1 | prism_institute | C | 36% | 14 | 🟧 Hỏng |');
    expect(markdown).toContain('| MV1 | Xong Prologue | 90% (18/20) | 20 | 0,70–0,97 |');
  });
});

describe('báo cáo cổng MVP: tham số và trường hợp khác', () => {
  it('ngưỡng thật (mẫu tối thiểu 30): MV1–MV6 Thiếu dữ liệu, MV7 vẫn Không', () => {
    const { report } = runMvpReport(DATA, INPUTS, { day0: DAY0 });
    for (const id of ['MV1', 'MV2', 'MV3', 'MV4', 'MV5', 'MV6'])
      expect(metric(report, id).verdict).toBe('insufficient');
    expect(metric(report, 'MV7').verdict).toBe('fail');
    expect(report.conclusion).toBe('fail');
  });

  it('thiếu ngày 0: không cắt cửa sổ, MV4 Thiếu dữ liệu (không đoán từ dữ liệu)', () => {
    const { report } = runMvpReport(smallSampleFiles(), INPUTS, {});
    expect(metric(report, 'MV4')).toMatchObject({ verdict: 'insufficient', note: 'thiếu --day0' });
    // Phiên ngày 9 của P12 được tính: thêm một người hạ Lumen.
    expect(report.funnel[5]?.players).toBe(10);
    expect(report.header.filtered.window).toBe(0);
  });

  it('--data chọn nhóm dữ liệu khác; --build lọc ở mức sự kiện', () => {
    const other = runMvpReport(smallSampleFiles(), INPUTS, { day0: DAY0, data: 'cafebabe' });
    expect(other.report.header.players).toBe(1);
    const none = runMvpReport(smallSampleFiles(), INPUTS, { day0: DAY0, builds: ['fff0000'] });
    expect(none.report.header.players).toBe(0);
    expect(none.report.header.filtered.build).toBeGreaterThan(0);
  });

  it('chỉ có mục Thiếu dữ liệu, không mục nào Không hay Hỏng: Chưa kết luận', () => {
    const one = SAMPLE.batches.filter((b) => b.install === installId(20));
    const { report, markdown } = runMvpReport(DATA, [one], { day0: DAY0 });
    expect(report.header.players).toBe(1);
    expect(report.gate.every((m) => m.verdict === 'insufficient')).toBe(true);
    expect(report.broken.some((x) => x.status === 'broken')).toBe(false);
    expect(report.conclusion).toBe('undecided');
    expect(markdown).toContain('CHƯA KẾT LUẬN');
  });

  it('đọc gói xuất, bảng tải từ điểm nhận ({payload}), mảng lô, một lô', () => {
    const b = SAMPLE.batches[0];
    expect(collectBatches({ kind: 'export', batches: [b, b] })).toHaveLength(2);
    expect(collectBatches([{ payload: b }, b])).toEqual([b, b]);
    expect(collectBatches(b)).toEqual([b]);
  });

  it('tham số từ dữ liệu: điểm yếu chỉ khi có trong đợt, đoạn = segments + boss', () => {
    const config = parseGameConfig(DATA);
    const settings = parseReportSettings(DATA.telemetry);
    const p = mvpReportParams(config, settings, DAY0);
    expect(p.prologue.id).toBe('prologue');
    expect(p.stages.map((s) => [s.boss, s.weakness ?? null, s.expectedMin])).toEqual([
      ['thorna', null, 10],
      ['lumen', 'vineLash', 11],
      ['cryo', 'prismBeam', 11.5],
      ['aeris', 'frostShard', 12],
    ]);
    expect(p.stages[0]?.sections).toEqual(['A', 'B', 'C', 'D', 'boss']);
    expect(p.stages[3]?.designFightSec).toEqual([75, 105]);
    // Điểm yếu trong bosses.json (nếu boss đã có) trùng bossWeakness của stages.json.
    for (const st of config.stages.stages) {
      const boss = config.bosses[st.boss];
      if (boss) expect(weaponId(boss.weakness)).toBe(weaponId(st.bossWeakness));
    }
    expect(() => mvpReportParams(config, settings, '2026-02-30')).toThrow(/ngày 0/);
  });

  it('khối report sai bị chặn (game không đọc khối này nên không tắt đo lường)', () => {
    const bad = (patch: Record<string, unknown>) => {
      const t = structuredClone(DATA.telemetry) as Record<string, Record<string, unknown>>;
      Object.assign(t.report as Record<string, unknown>, patch);
      return () => parseReportSettings(t);
    };
    expect(bad({ stages: ['verdant_gardens'] })).toThrow(/prologue/);
    expect(bad({ upgradeBins: [5, 2] })).toThrow(/upgradeBins/);
    expect(bad({ missingWeaknessMax: 1 })).toThrow(/missingWeaknessMax/);
    const config = parseGameConfig(DATA);
    const s = parseReportSettings(DATA.telemetry);
    expect(() => mvpReportParams(config, { ...s, stages: ['prologue', 'nope'] })).toThrow(/nope/);
  });
});

describe('báo cáo cổng MVP: chỉ số phụ (ST-13-05b, GDD 13 mục 6.4)', () => {
  const { report: r, markdown } = runMvpReport(DATA, INPUTS, { day0: DAY0, waves: ['d1'] });
  const m = (id: string) => {
    const x = r.secondary.find((y) => y.id === id);
    if (!x) throw new Error(`thiếu ${id}`);
    return x;
  };

  it('số liệu game: giá rẻ nhất lúc Quầy mở, tổng giá Upgrade, thu theo màn (04 mục 2, 4, 8)', () => {
    const config = parseGameConfig(DATA);
    const sp = secondaryParams(
      config,
      [S1, S2, S3, S4],
      parseReportSettings(DATA.telemetry).targets,
    );
    expect(sp.shopOpenBosses).toBe(2);
    expect(sp.cheapestPrice).toBe(200);
    expect(sp.totalUpgradeCost).toBe(14593);
    expect(sp.income).toEqual({ [S1]: 225, [S2]: 300, [S3]: 375, [S4]: 450 });
    expect(sp.difficultyOrder).toEqual(['story', 'normal', 'challenge']);
  });

  it('kinh tế K1–K6', () => {
    expect(m('K1')).toMatchObject({ n: 8, status: 'ok', detail: '1 người thiếu số dư' });
    expect(m('K1').value).toBeCloseTo(7 / 8, 9);
    expect(m('K2')).toMatchObject({ n: 13, status: 'ok' });
    expect(m('K2').value).toBeCloseTo(13.5 / 13, 9);
    // Mua sau khi hạ Aeris không tính; hoàn tiền trừ ra.
    expect(m('K3')).toMatchObject({ n: 4, status: 'ok' });
    expect(m('K3').value).toBeCloseTo(1000 / 4 / 14593, 9);
    expect(m('K4')).toMatchObject({ n: 20, status: 'ok' });
    expect(m('K4').value).toBeCloseTo(1 / 20, 9);
    expect(m('K5')).toMatchObject({ value: 40, status: 'track', n: 3 });
    expect(m('K6')).toMatchObject({ value: 1, n: 6, status: 'ok' });
  });

  it('độ khó DK1–DK4', () => {
    expect(m('DK1')).toMatchObject({ value: 0.25, n: 4, status: 'off' });
    expect(m('DK2').detail).toBe('Thử thách 1/1, Thường 17/51 lượt không xong');
    expect(m('DK2').value).toBeCloseTo(51 / 17, 9);
    expect(m('DK3')).toMatchObject({ value: 0.5, n: 2, status: 'off' });
    expect(m('DK4')).toMatchObject({ value: 2, status: 'off' });
    expect(m('DK4').detail).toContain(`${S1}/A: 1/1 người thử Thử thách`);
    expect(m('DK4').detail).toContain(`${S3}/A: 1 người chết > 3 lần`);
  });

  it('hướng dẫn T1–T4', () => {
    expect(m('T1')).toMatchObject({ value: 4, n: 18, status: 'ok' });
    expect(m('T2')).toMatchObject({ n: 6, status: 'off', detail: 'bước S01: 1/6' });
    expect(m('T3')).toMatchObject({ value: 0.1, status: 'ok' });
    expect([m('T4.1').value, m('T4.2').value, m('T4.3').value]).toEqual([0.9, 0.9, 0.7]);
    expect([m('T4.1').status, m('T4.2').status, m('T4.3').status]).toEqual(['ok', 'ok', 'ok']);
  });

  it('kỹ thuật X1–X5, cảm giác F1, tiếp cận S1', () => {
    expect(m('X1')).toMatchObject({ n: 31, status: 'off' });
    expect(m('X1').value).toBeCloseTo(30 / 31, 9);
    expect(m('X2')).toMatchObject({ value: 3500, status: 'off' });
    expect(m('X3')).toMatchObject({ status: 'insufficient', n: 0 });
    expect(m('X4')).toMatchObject({ value: 0.75, n: 4, status: 'off' });
    expect(m('X5')).toMatchObject({ value: 1, status: 'off' });
    expect(m('F1.cam-ung')).toMatchObject({ value: 3, status: 'off' });
    expect(m('F1.ban-phim')).toMatchObject({ value: 4, status: 'ok' });
    expect(m('F1.tay-cam').status).toBe('insufficient');
    expect(m('S1').detail).toBe(
      'tự bắn 2/10 người cảm ứng; hỗ trợ ngắm 1/10; giảm tốc 1/20 người; a11y.colorblind 1/20; a11y.textSize 0/20',
    );
    expect(markdown).toContain(
      '| DK1 | Chọn Thử thách (người đã mở Thử thách) | 25% | 4 | 10%–20% | 🟧 Lệch |',
    );
  });

  it('phân vị nội suy; mục tiêu sai bị chặn', () => {
    expect(quantile([1000, 2000, 3000, 5000], 0.75)).toBe(3500);
    expect(quantile([7], 0.75)).toBe(7);
    const t = structuredClone(DATA.telemetry) as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    (t.report as Record<string, Record<string, unknown>>).targets = {
      ...(t.report?.targets as Record<string, unknown>),
      t4: [0.9, 0.8],
    };
    expect(() => parseReportSettings(t)).toThrow(/t4/);
  });
});

describe('báo cáo cổng MVP: phép tính', () => {
  it('khoảng Wilson khớp bảng GDD 13 mục 6.5 tới 0,01', () => {
    const table: [number, number, number, number][] = [
      [0.9, 50, 0.79, 0.96],
      [0.9, 30, 0.74, 0.97],
      [0.7, 50, 0.56, 0.81],
      [0.7, 30, 0.52, 0.83],
      [0.35, 50, 0.23, 0.49],
      [0.35, 30, 0.21, 0.53],
    ];
    for (const [p, n, lo, hi] of table) {
      const [a, b] = wilson(p, n);
      expect(Math.abs(a - lo)).toBeLessThanOrEqual(0.005 + 1e-9);
      expect(Math.abs(b - hi)).toBeLessThanOrEqual(0.005 + 1e-9);
    }
    expect(wilson(1, 5)[1]).toBe(1);
    expect(wilson(0, 5)[0]).toBe(0);
  });

  it('phán quyết tỷ lệ: Đạt, Biên, Không, Thiếu dữ liệu; so x/n không làm tròn', () => {
    expect(ratioMetric('X', '', 63, 90, 0.7, 30).verdict).toBe('pass');
    expect(ratioMetric('X', '', 18, 30, 0.7, 30).verdict).toBe('borderline');
    expect(ratioMetric('X', '', 10, 30, 0.7, 30).verdict).toBe('fail');
    expect(ratioMetric('X', '', 20, 20, 0.7, 30).verdict).toBe('insufficient');
    expect(ratioMetric('X', '', 0, 0, 0.7, 1).verdict).toBe('insufficient');
  });

  it('mức chênh cảm ứng; hướng build; bậc Upgrade; đồng hồ máy nhảy', () => {
    expect(touchGap(0.3, 0.2)).toBeCloseTo(0.5, 9);
    expect(touchGap(0, 0)).toBe(0);
    expect(touchGap(0.1, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(buildDirection('V3P1C0', 1)).toBe('V');
    expect(buildDirection('V2P1C0', 1)).toBe('cân bằng');
    expect(buildDirection('V0P0C4', 1)).toBe('C');
    expect(buildDirection(undefined, 1)).toBe('không rõ');
    expect(upgradeTier({ a: 1, b: 1 }, [2, 5])).toBe('0–2');
    expect(upgradeTier({ a: 3 }, [2, 5])).toBe('3–5');
    expect(upgradeTier({ a: 6 }, [2, 5])).toBe('≥ 6');
    expect(clockJumped(['2026-11-20', '2026-11-21'], 30)).toBe(false);
    expect(clockJumped(['2026-11-20', '2026-10-01'], 30)).toBe(true);
    expect(clockJumped(['2026-11-20', '2027-01-20'], 30)).toBe(true);
  });

  it('ngày và mốc giờ theo múi giờ đợt', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(dayStartMs('2026-11-20', 420)).toBe(Date.UTC(2026, 10, 19, 17));
    expect(isDay('2026-02-29')).toBe(false);
    expect(isDay('2028-02-29')).toBe(true);
  });
});

describe('npm run mvp-report', () => {
  it('đọc file, ghi Markdown', () => {
    const dir = mkdtempSync(join(tmpdir(), 'mvp-'));
    const input = join(dir, 'lo.json');
    const out = join(dir, 'bao-cao.md');
    writeFileSync(input, JSON.stringify(SAMPLE.batches));
    execFileSync(
      process.execPath,
      [resolve(__dirname, '../scripts/mvp-report.mjs'), '--day0', DAY0, '--out', out, input],
      { stdio: 'pipe' },
    );
    const md = readFileSync(out, 'utf8');
    expect(md).toContain('## 2. Cổng (MV1–MV7)');
    expect(md).toContain('Người chơi: 20');
  }, 20_000);
});
