import type { PlaytestRatings } from '../logic/playtest/recorder';
import { createPanel, panelActions, panelButton } from './panel';

const QUESTIONS: ReadonlyArray<readonly [keyof PlaytestRatings, string]> = [
  ['jump', 'Nhảy'],
  ['dash', 'Lướt'],
  ['shoot', 'Bắn'],
];

/**
 * Phiếu chấm cảm giác 1–5 sau khi thắng boss (tiêu chí cổng Prototype: "nhảy – lướt – bắn
 * sướng"). Gửi khi đủ ba câu; Bỏ qua thì không lưu gì.
 */
export function showRatingPanel(onDone: (ratings: PlaytestRatings | undefined) => void): void {
  const { root, body } = createPanel(
    'Cảm giác điều khiển thế nào? (1 tệ – 5 rất sướng)',
    'cv-rating',
  );
  const picked: Partial<PlaytestRatings> = {};
  const send = panelButton('Gửi', () => finish(picked as PlaytestRatings), true);
  send.disabled = true;
  for (const [key, label] of QUESTIONS) {
    const row = document.createElement('div');
    row.className = 'cv-rating-row';
    const name = document.createElement('span');
    name.textContent = label;
    row.append(name);
    const buttons: HTMLButtonElement[] = [];
    for (let score = 1; score <= 5; score += 1) {
      const b = panelButton(String(score), () => {
        picked[key] = score;
        for (const other of buttons) other.classList.toggle('picked', other === b);
        send.disabled = QUESTIONS.some(([k]) => picked[k] === undefined);
      });
      buttons.push(b);
      row.append(b);
    }
    body.append(row);
  }
  const finish = (ratings: PlaytestRatings | undefined): void => {
    root.remove();
    onDone(ratings);
  };
  body.append(
    panelActions(
      panelButton('Bỏ qua', () => finish(undefined)),
      send,
    ),
  );
}
