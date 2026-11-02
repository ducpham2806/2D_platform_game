import type { KeyValueStore } from '../logic/input/settings';

/** localStorage có bọc lỗi: chế độ ẩn danh hoặc bị chặn lưu thì vẫn chạy (chỉ không nhớ). */
export class LocalStorageStore implements KeyValueStore {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Không lưu được thì bỏ qua; cài đặt vẫn dùng được trong phiên này.
    }
  }
}
