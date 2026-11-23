import { describe, expect, it } from 'vitest';
import { parseUi } from '@/core/ui-config';
import { deathHintExpired } from '@/logic/difficulty/difficulty';
import { BOX_ORDER, readingSec, TimedBox, topBox } from '@/logic/hud/text-boxes';
import { loadData } from './helpers';

const ui = parseUi(loadData().ui);
const rules = ui.reading;
const STEP = 1 / 60;

/** Chạy `sec` giây theo bước cố định ở một trạng thái đồng hồ. */
function run(box: TimedBox, sec: number, clock: 'frozen' | 'covered' | 'free'): void {
  const steps = Math.round(sec / STEP);
  for (let i = 0; i < steps; i += 1) box.step(STEP, clock);
}

describe('hộp chữ (EP-14 ST-14-08)', () => {
  it('QB-70: thứ tự hội thoại > Kết quả > gợi ý chết > hướng dẫn > câu nhiệm vụ > Báo ngắn', () => {
    expect(BOX_ORDER).toEqual([
      'dialogue',
      'result',
      'deathHint',
      'tutorial',
      'questLine',
      'toast',
    ]);
    expect(topBox({ tutorial: true, deathHint: true })).toBe('deathHint');
    expect(topBox({ tutorial: true, deathHint: true, dialogue: true })).toBe('dialogue');
    expect(topBox({ deathHint: true, result: true })).toBe('result');
    expect(topBox({ toast: true, questLine: true })).toBe('questLine');
    expect(topBox({ tutorial: false })).toBeUndefined();
    expect(topBox({})).toBeUndefined();
  });

  it('QB-72: thời gian đọc = max(tối thiểu, số ký tự / tốc độ đọc), đếm theo ký tự thật', () => {
    expect(rules).toEqual({ charsPerSec: 15, minSec: 3, maxWaitSec: 10 });
    expect(readingSec('Ngắn.', rules.minSec, rules.charsPerSec)).toBe(rules.minSec);
    const long = 'x'.repeat(90);
    expect(readingSec(long, rules.minSec, rules.charsPerSec)).toBe(90 / rules.charsPerSec);
    // Gợi ý chết dùng mức tối thiểu riêng (showSec 6).
    expect(readingSec('Ngắn.', ui.difficultyHint.showSec, rules.charsPerSec)).toBe(6);
    // Ký tự ngoài BMP tính là 1, không phải 2 đơn vị UTF-16; chữ Việt tách dấu (NFD) đếm như NFC.
    expect(readingSec('🙂'.repeat(60), 0, 15)).toBe(4);
    const vi = 'Ba lần rồi. Không chê đâu.'.repeat(4);
    expect(readingSec(vi.normalize('NFD'), 0, 15)).toBe(readingSec(vi, 0, 15));
  });

  it('QB-72: hộp tự tắt đúng hạn khi được hiện', () => {
    const box = new TimedBox(rules);
    box.post('Ngắn.');
    run(box, rules.minSec - 0.1, 'free');
    expect(box.text).toBe('Ngắn.');
    run(box, 0.2, 'free');
    expect(box.active).toBe(false);
  });

  it('QB-72: tạm dừng không đếm giờ (cả thời gian đọc lẫn thời gian chờ)', () => {
    const box = new TimedBox(rules);
    box.post('Ba lần rồi.', 6);
    run(box, 2, 'free');
    run(box, 60, 'frozen');
    expect(box.active).toBe(true);
    expect(box.remainingSec).toBeCloseTo(4, 5);
    expect(box.waitedSec).toBe(0);
    run(box, 4.1, 'free');
    expect(box.active).toBe(false);
  });

  it('QB-70, QB-72: bị hội thoại che thì ẩn, không trừ thời gian đọc, rồi hiện lại với phần còn lại', () => {
    const box = new TimedBox(rules);
    box.post('Ba lần rồi.', 6);
    run(box, 2, 'free');
    run(box, 5, 'covered');
    expect(box.active).toBe(true);
    expect(box.remainingSec).toBeCloseTo(4, 5);
    expect(box.waitedSec).toBeCloseTo(5, 5);
    run(box, 1, 'free');
    expect(box.waitedSec).toBe(0);
    expect(box.remainingSec).toBeCloseTo(3, 5);
  });

  it('QB-71: bị che liền quá maxWaitSec thì hủy; các lần che ngắn không cộng dồn', () => {
    const box = new TimedBox(rules);
    box.post('Ba lần rồi.', 6);
    run(box, rules.maxWaitSec - 1, 'covered');
    run(box, 0.5, 'free');
    run(box, rules.maxWaitSec - 1, 'covered');
    expect(box.active).toBe(true);
    run(box, 2, 'covered');
    expect(box.active).toBe(false);
    // Tạm dừng giữa lúc bị che không làm hộp chờ lâu hơn.
    const b2 = new TimedBox(rules);
    b2.post('Câu khác.');
    run(b2, rules.maxWaitSec - 1, 'covered');
    run(b2, 120, 'frozen');
    expect(b2.active).toBe(true);
  });

  it('QB-71: cancel() hủy cả câu đang chờ lẫn câu đang hiện; post() thay câu cũ', () => {
    const box = new TimedBox(rules);
    box.post('A');
    box.cancel();
    expect(box.active).toBe(false);
    box.post('B');
    run(box, 1, 'free');
    box.cancel();
    expect(box.text).toBeUndefined();
    box.post('C');
    box.post('D', 8);
    expect(box.text).toBe('D');
    expect(box.remainingSec).toBe(8);
    // Bước khi không có câu: không lỗi, không làm gì.
    box.cancel();
    box.step(1, 'free');
    expect(box.active).toBe(false);
  });

  it('QB-71, QB-72: trận đứng yên vì hội thoại thì không cộng thời gian chờ (frozen)', () => {
    const box = new TimedBox(rules);
    box.post('Nhận vũ khí: Vine Lash.');
    run(box, 60, 'frozen');
    expect(box.active).toBe(true);
    expect(box.waitedSec).toBe(0);
    run(box, 1, 'free');
    expect(box.remainingSec).toBeCloseTo(rules.minSec - 1, 5);
  });

  it('step() báo bước đầu tiên câu hiện tới người chơi (đo lường difficulty_hint)', () => {
    const box = new TimedBox(rules);
    box.post('Ba lần rồi.', 6);
    expect(box.step(STEP, 'covered')).toBe(false);
    expect(box.step(STEP, 'frozen')).toBe(false);
    expect(box.step(STEP, 'free')).toBe(true);
    expect(box.step(STEP, 'covered')).toBe(false);
    expect(box.step(STEP, 'free')).toBe(false);
    box.post('Câu mới.');
    expect(box.step(STEP, 'free')).toBe(true);
    // Hủy trước khi kịp hiện: không bao giờ báo đã hiện.
    box.post('Câu bị hủy.');
    box.cancel();
    expect(box.step(STEP, 'free')).toBe(false);
  });

  it('QB-71: gợi ý chết hết ngữ cảnh khi hạ boss, qua checkpoint hoặc vào đấu trường', () => {
    const ev = { bossDefeated: false, checkpoint: undefined, gateClosed: false };
    expect(deathHintExpired(ev)).toBe(false);
    expect(deathHintExpired({ ...ev, bossDefeated: true })).toBe(true);
    expect(deathHintExpired({ ...ev, checkpoint: 2 })).toBe(true);
    expect(deathHintExpired({ ...ev, gateClosed: true })).toBe(true);
  });

  it('ui.reading: kiểm dữ liệu', () => {
    const data = loadData().ui as Record<string, unknown>;
    const reading = data.reading as Record<string, unknown>;
    const bad = (patch: Record<string, unknown>) => ({
      ...data,
      reading: { ...reading, ...patch },
    });
    expect(() => parseUi(bad({ charsPerSec: 2 }))).toThrow(/charsPerSec/);
    expect(() => parseUi(bad({ minSec: 0 }))).toThrow(/minSec/);
    expect(() => parseUi(bad({ maxWaitSec: 2 }))).toThrow(/maxWaitSec: phải ≥ minSec/);
    expect(() => parseUi({ ...data, reading: undefined })).toThrow(/ui.reading/);
    const hint = data.difficultyHint as Record<string, unknown>;
    expect(() => parseUi({ ...data, difficultyHint: { ...hint, showSec: 2 } })).toThrow(
      /showSec: phải ≥ reading.minSec/,
    );
  });
});
