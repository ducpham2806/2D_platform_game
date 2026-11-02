import type { KeyValueStore } from '../logic/input/settings';
import {
  applyField,
  applyStored,
  readField,
  toStored,
  TUNING_FIELDS,
  type TuningData,
  tuningDiff,
} from '../logic/playtest/tuning';
import { createPanel, panelActions, panelButton, showJson } from './panel';

const TUNING_KEY = 'cv.tuning';

export function loadTuning(store: KeyValueStore, base: TuningData): TuningData {
  try {
    const raw: unknown = JSON.parse(store.get(TUNING_KEY) ?? '{}');
    return raw && typeof raw === 'object' ? applyStored(base, raw as Record<string, number>) : base;
  } catch {
    return base;
  }
}

function saveTuning(store: KeyValueStore, base: TuningData, current: TuningData): void {
  store.set(TUNING_KEY, JSON.stringify(toStored(base, current)));
}

/**
 * Bảng chỉnh cảm giác: mỗi thông số một thanh trượt, áp ngay vào trận đang chơi khi đóng bảng,
 * lưu trên máy để lần sau vào màn vẫn còn, và xuất phần đã đổi để dán vào 03-Data.
 */
export function showTuningPanel(
  store: KeyValueStore,
  base: TuningData,
  current: TuningData,
  onClose: (data: TuningData) => void,
): void {
  const { root, body } = createPanel('Chỉnh cảm giác (cổng Prototype)', 'cv-tuning');
  let data = current;
  const list = document.createElement('div');
  list.className = 'cv-tuning-list';
  const rows: Array<() => void> = [];
  let group = '';
  for (const field of TUNING_FIELDS) {
    if (field.file !== group) {
      group = field.file;
      const h = document.createElement('div');
      h.className = 'cv-tuning-group';
      h.textContent = group === 'player' ? 'Kai' : group === 'weapons' ? 'Arc Cannon' : 'Boss xám';
      list.append(h);
    }
    const row = document.createElement('label');
    row.className = 'cv-tuning-row';
    const name = document.createElement('span');
    name.textContent = field.label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(field.min);
    input.max = String(field.max);
    input.step = String(field.step);
    const value = document.createElement('output');
    const sync = (): void => {
      const v = readField(data, field);
      input.value = String(v);
      value.textContent = String(v);
      row.classList.toggle('changed', v !== readField(base, field));
    };
    input.addEventListener('input', () => {
      data = applyField(data, field, Number(input.value));
      for (const s of rows) s();
    });
    rows.push(sync);
    row.append(name, input, value);
    list.append(row);
  }
  for (const s of rows) s();
  const note = document.createElement('div');
  note.className = 'cv-panel-note';
  note.textContent =
    'Kai và Arc Cannon đổi ngay khi bấm Chơi tiếp; thông số boss áp từ trận sau (hồi sinh hoặc ra rồi vào lại phòng). Lưu trên máy này.';
  const close = (): void => {
    saveTuning(store, base, data);
    root.remove();
    onClose(data);
  };
  body.append(
    list,
    note,
    panelActions(
      panelButton('Đặt lại', () => {
        data = base;
        for (const s of rows) s();
      }),
      panelButton('Sao chép JSON', () => {
        const diff = tuningDiff(base, data);
        showJson(
          'Thông số đã đổi (dán vào 03-Data)',
          Object.keys(diff).length ? JSON.stringify(diff, null, 2) : '{}  // chưa đổi gì',
        );
      }),
      panelButton('Chơi tiếp', close, true),
    ),
  );
}
