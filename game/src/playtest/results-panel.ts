import type { InputDevice } from '../logic/input/actions';
import type { KeyValueStore } from '../logic/input/settings';
import {
  clearSessions,
  loadSessions,
  makeExport,
  mergeSessions,
  parseExport,
  PLAYTEST_MIN_SEC,
  type PlaytestSummary,
  summarize,
} from '../logic/playtest/summary';
import { GRAY_BOX_SECTIONS } from '../stages/gray-box';
import { createPanel, panelActions, panelButton, showJson } from './panel';

const DEVICE_LABEL: Readonly<Record<InputDevice, string>> = {
  keyboard: 'Bàn phím',
  gamepad: 'Tay cầm',
  touch: 'Cảm ứng',
};

function sectionLabel(id: string): string {
  return GRAY_BOX_SECTIONS.find((s) => s.id === id)?.label ?? id;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text = '',
  className = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function deviceTable(summary: PlaytestSummary): HTMLElement {
  const wrap = el('div', '', 'cv-results-table');
  const table = el('table');
  const head = el('tr');
  for (const h of ['Thiết bị', 'Phiên', 'Phút', 'Chết/phút', 'Boss thắng', 'Thắng (s)', 'N/L/B'])
    head.append(el('th', h));
  table.append(head);
  for (const d of summary.byDevice) {
    const row = el('tr');
    const r = d.ratings;
    for (const cell of [
      DEVICE_LABEL[d.device],
      String(d.sessions),
      d.minutes.toFixed(1),
      d.deathsPerMinute.toFixed(2),
      `${d.bossWins}/${d.bossAttempts}`,
      d.medianBossWinSec === undefined ? '–' : d.medianBossWinSec.toFixed(0),
      r ? `${r.jump.toFixed(1)}/${r.dash.toFixed(1)}/${r.shoot.toFixed(1)} (${r.count})` : '–',
    ])
      row.append(el('td', cell));
    table.append(row);
  }
  wrap.append(table);
  return wrap;
}

function renderSummary(summary: PlaytestSummary, stored: number): HTMLElement[] {
  if (summary.sessions === 0) {
    return [
      el(
        'p',
        `Chưa có phiên nào dài hơn ${PLAYTEST_MIN_SEC} giây (${stored} phiên lưu trên máy). Vào màn thử, chơi rồi quay lại đây.`,
      ),
    ];
  }
  const out: HTMLElement[] = [
    el('p', `${summary.sessions} phiên tính được (bỏ phiên dưới ${PLAYTEST_MIN_SEC} giây).`),
  ];
  if (summary.flags.length > 0) {
    out.push(el('div', 'Dấu hiệu hỏng (GDD 17)', 'cv-results-heading cv-flag'));
    const list = el('ul');
    for (const f of summary.flags) list.append(el('li', f, 'cv-flag'));
    out.push(list);
  } else {
    out.push(
      el(
        'p',
        'Chưa thấy dấu hiệu hỏng theo GDD 17. Cần đủ dữ liệu: ít nhất 3 phiên chưa thắng boss, 3 lượt chấm điểm mỗi thiết bị.',
        'cv-panel-note',
      ),
    );
  }
  out.push(
    el('div', 'Theo thiết bị (N/L/B: điểm Nhảy/Lướt/Bắn, số lượt chấm)', 'cv-results-heading'),
  );
  out.push(deviceTable(summary));
  if (summary.deathsBySection.length > 0) {
    out.push(el('div', 'Chết theo đoạn', 'cv-results-heading'));
    out.push(
      el(
        'p',
        summary.deathsBySection.map((d) => `${sectionLabel(d.section)}: ${d.deaths}`).join(' · '),
      ),
    );
  }
  if (summary.quitBySection.length > 0) {
    out.push(el('div', 'Phiên chưa thắng boss dừng ở', 'cv-results-heading'));
    out.push(
      el(
        'p',
        summary.quitBySection
          .map((q) => `${sectionLabel(q.section)}: ${Math.round(q.share * 100)}%`)
          .join(' · '),
      ),
    );
  }
  return out;
}

/** Ô dán nhật ký của người thử khác để gộp vào máy này. */
function showImport(onImport: (text: string) => string): void {
  const { root, body } = createPanel('Gộp nhật ký của người thử khác', 'cv-json');
  const area = el('textarea');
  area.placeholder = 'Dán JSON người thử gửi (có thể dán nhiều gói trong một mảng [ ... ])';
  const status = el('div', '', 'cv-panel-note');
  body.append(
    area,
    status,
    panelActions(
      panelButton('Gộp', () => (status.textContent = onImport(area.value)), true),
      panelButton('Đóng', () => root.remove()),
    ),
  );
  area.focus();
}

/**
 * Màn Kết quả chơi thử: tổng hợp nhật ký trên máy theo tiêu chí cổng Prototype (GDD 17),
 * sao chép JSON để gửi, gộp nhật ký người khác, xóa dữ liệu.
 */
export function showResultsPanel(store: KeyValueStore, onBack: () => void): () => void {
  const { root, body } = createPanel('Kết quả chơi thử (lưu trên máy này)', 'cv-results');
  const content = el('div');
  const render = (): void => {
    const sessions = loadSessions(store);
    content.replaceChildren(...renderSummary(summarize(sessions), sessions.length));
  };
  let armed = false;
  const clear = panelButton('Xóa dữ liệu', () => {
    if (!armed) {
      armed = true;
      clear.textContent = 'Bấm lần nữa để xóa';
      return;
    }
    clearSessions(store);
    armed = false;
    clear.textContent = 'Xóa dữ liệu';
    render();
  });
  const close = (): void => {
    document.removeEventListener('keydown', onKey);
    for (const panel of document.querySelectorAll('.cv-panel')) panel.remove();
  };
  const back = (): void => {
    close();
    onBack();
  };
  const onKey = (e: KeyboardEvent): void => {
    // Esc: đóng bảng con trên cùng nếu có, không thì quay lại.
    if (e.key !== 'Escape') return;
    const panels = document.querySelectorAll('.cv-panel');
    const top = panels[panels.length - 1];
    if (top && top !== root) top.remove();
    else back();
  };
  document.addEventListener('keydown', onKey);
  body.append(
    content,
    panelActions(
      panelButton('Sao chép JSON', () =>
        showJson(
          'Nhật ký chơi thử (gửi lại cho nhóm)',
          JSON.stringify(makeExport(loadSessions(store), new Date(), navigator.userAgent)),
        ),
      ),
      panelButton('Gộp nhật ký', () =>
        showImport((text) => {
          const sessions = parseExport(text);
          if (!sessions) return 'Không đọc được JSON: hãy dán đúng đoạn người thử gửi.';
          const added = mergeSessions(store, sessions);
          render();
          return `Đã đọc ${sessions.length} phiên, thêm mới ${added}.`;
        }),
      ),
      clear,
      panelButton('Quay lại', back, true),
    ),
  );
  render();
  return close;
}
