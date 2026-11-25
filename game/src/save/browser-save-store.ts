import type { SaveStore } from '../logic/save/save-manager';

const DB_NAME = 'cyber-vanguard';
const DB_VERSION = 1;
const OBJECT_STORE = 'save';
const SLOT_KEY = 'main';
/** Chỉ dùng khi trình duyệt không cung cấp IndexedDB; lỗi đọc kho không phải ô trống. */
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
    return new Promise((resolve, reject) => {
      let blocked = false;
      req.onblocked = () => {
        blocked = true;
        reject(new Error('IndexedDB bị một tab khác chặn'));
      };
      req.onupgradeneeded = () => {
        if (blocked) req.transaction?.abort();
        else if (!req.result.objectStoreNames.contains(OBJECT_STORE))
          req.result.createObjectStore(OBJECT_STORE);
      };
      req.onerror = () => reject(req.error ?? new Error('Không mở được IndexedDB'));
      req.onsuccess = () => {
        if (blocked) req.result.close();
        else resolve(new IndexedDbSaveStore(req.result));
      };
    });
  }

  async read(): Promise<string | null> {
    const tx = this.db.transaction(OBJECT_STORE, 'readonly');
    const value: unknown = await request(tx.objectStore(OBJECT_STORE).get(SLOT_KEY));
    if (value === undefined) return null;
    if (typeof value !== 'string') throw new Error('Ô IndexedDB không có định dạng chuỗi');
    return value;
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
  async read(): Promise<string | null> {
    return window.localStorage.getItem(LOCAL_KEY);
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

/** IndexedDB là kho chính. Không tự chuyển sang kho phụ khi kho chính có thể còn bản lưu. */
export async function openBrowserSaveStore(): Promise<SaveStore> {
  try {
    if (typeof indexedDB !== 'undefined') return await IndexedDbSaveStore.open();
  } catch (e) {
    const unavailable = async (): Promise<never> => {
      throw e;
    };
    return { read: unavailable, write: unavailable };
  }
  return new LocalStorageSaveStore();
}
