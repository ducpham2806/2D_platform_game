/**
 * Màn Kết quả (M10, P-UI-PREP-RESULT, wireframe Result.html): mô hình hiển thị dựng từ lượt chơi
 * màn. Bản Vertical slice có thời gian, số lần chết, EXP, Core Bit, vũ khí mới, bí mật; cấp/SP
 * (M8), Data Chip và Memory Log/Két giáp (chưa có dữ liệu) thêm khi làm module tương ứng.
 * Logic thuần.
 */

/** Phần StageWorld mà màn Kết quả đọc. */
export interface ResultSource {
  readonly elapsedSec: number;
  readonly deaths: number;
  readonly exp: number;
  readonly coreBits: number;
  readonly secrets: readonly { readonly taken: boolean }[];
}

export interface StageResultInfo {
  stageName: string;
  /** Core Bit trong bản lưu lúc vào màn (thanh trên cộng thêm phần nhặt trong lượt). */
  savedCoreBits: number;
  /** Vũ khí boss nhận trong lượt (thắng lần đầu). */
  newWeapon: string | undefined;
  /** Lời hướng dẫn còn dở cần nhắc lại (đã thay biểu tượng nút). */
  reminders: readonly string[];
}

export interface ResultRow {
  label: string;
  value: string;
}

export interface StageResultView {
  title: string;
  /** Tổng Core Bit sau màn (góc phải thanh trên). */
  coreBitsTotal: number;
  stats: ResultRow[];
  rewards: string[];
  reminders: string[];
}

/** "m:ss" (dưới 1 giờ, phút có 2 chữ số khi ≥ 10) hoặc "h:mm:ss"; làm tròn xuống theo giây. */
export function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec + 1e-6));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function buildStageResult(world: ResultSource, info: StageResultInfo): StageResultView {
  const found = world.secrets.filter((s) => s.taken).length;
  const rewards: string[] = [];
  if (info.newWeapon) rewards.push(`Vũ khí mới: ${info.newWeapon}`);
  if (world.secrets.length > 0) rewards.push(`Bí mật ${found}/${world.secrets.length}`);
  if (rewards.length === 0) rewards.push('Không có phần thưởng mới');
  return {
    title: `HOÀN THÀNH: ${info.stageName}`,
    coreBitsTotal: info.savedCoreBits + world.coreBits,
    stats: [
      { label: 'Thời gian', value: formatDuration(world.elapsedSec) },
      { label: 'Số lần chết', value: String(world.deaths) },
      { label: 'EXP', value: `+${world.exp}` },
      { label: 'Core Bit', value: `+${world.coreBits}` },
    ],
    rewards,
    reminders: [...info.reminders],
  };
}
