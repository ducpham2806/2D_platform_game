import type { SaveStore } from '../logic/save/save-manager';

const DB_NAME = 'cyber-vanguard';
const DB_VERSION = 1;
const OBJECT_STORE = 'save';
const SLOT_KEY = 'main';
/** Dự phòng khi trình duyệt không có/chặn IndexedDB (một số chế độ ẩn danh). */
const LOCAL_KEY = 'cv.save';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB lỗi'));
  });
}

/** Bản lưu cục bộ trong IndexedDB (đặc tả M11), một ô lưu duy nhất, giá trị là chuỗi JSON. */
export class IndexedDbSaveStore implements SaveStore {
  private constructor(private readonly db: IDBDatabase) {}

  static async open(): Promise<IndexedDbSaveStore> {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(OBJECT_STORE))
        req.result.createObjectStore(OBJECT_STORE);
    };
    return new IndexedDbSaveStore(await request(req));
  }

  async read(): Promise<string | null> {
    const tx = this.db.transaction(OBJECT_STORE, 'readonly');
    const value: unknown = await request(tx.objectStore(OBJECT_STORE).get(SLOT_KEY));
    return typeof value === 'string' ? value : null;
  }

  write(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(OBJECT_STORE, 'readwrite');
      tx.objectStore(OBJECT_STORE).put(text, SLOT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB lỗi'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB bị hủy'));
    });
  }
}

export class LocalStorageSaveStore implements SaveStore {
  read(): Promise<string | null> {
    try {
      return Promise.resolve(window.localStorage.getItem(LOCAL_KEY));
    } catch {
      return Promise.resolve(null);
    }
  }

  write(text: string): Promise<void> {
    try {
      window.localStorage.setItem(LOCAL_KEY, text);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  }
}

/** IndexedDB nếu mở được, không thì localStorage. */
export async function openBrowserSaveStore(): Promise<SaveStore> {
  try {
    if (typeof indexedDB !== 'undefined') return await IndexedDbSaveStore.open();
  } catch (e) {
    console.warn('Không mở được IndexedDB, dùng localStorage', e);
  }
  return new LocalStorageSaveStore();
}
