import type { KeyValueStore } from '../input/settings';

/** Cài đặt âm thanh của người chơi (bản tối thiểu: bật/tắt; âm lượng từng kênh làm ở màn Cài đặt). */
export interface AudioSettings {
  muted: boolean;
}

export const AUDIO_STORAGE_KEY = 'cv.audio';
const VERSION = 1;

export function loadAudioSettings(store: KeyValueStore): AudioSettings {
  const raw = store.get(AUDIO_STORAGE_KEY);
  if (raw === null) return { muted: false };
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v === 'object' && v !== null && (v as { version?: unknown }).version === VERSION)
      return { muted: (v as { muted?: unknown }).muted === true };
  } catch {
    // Hỏng thì về mặc định.
  }
  return { muted: false };
}

export function saveAudioSettings(store: KeyValueStore, settings: AudioSettings): void {
  store.set(AUDIO_STORAGE_KEY, JSON.stringify({ version: VERSION, muted: settings.muted }));
}
