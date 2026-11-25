import { afterEach, expect, it, vi } from 'vitest';
import { SceneKey } from '@/core/constants';
import { getSave, installBus } from '@/core/phaser-services';
import { decodeSaveCode } from '@/logic/save/save-code';
import { addRewards, defaultSave } from '@/logic/save/save-data';
import { MenuScene } from '@/scenes/menu-scene';
import { PreloadScene } from '@/scenes/preload-scene';
import { SaveScene } from '@/scenes/save-scene';
import { loadData } from './helpers';

// Run the real preload, menu and save panel; replace rendering and unrelated input hardware.
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Loader: { Events: { COMPLETE: 'complete' } },
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}));
vi.mock('@/input/input-service', () => ({ InputService: class {} }));

class Node extends EventTarget {
  readonly children: Node[] = [];
  textContent = '';
  value = '';
  disabled = false;
  readOnly = false;
  constructor(readonly tag: string) {
    super();
  }
  append(...children: Node[]) {
    this.children.push(...children);
  }
  all(): Node[] {
    return [this, ...this.children.flatMap((child) => child.all())];
  }
  setAttribute() {}
}

const seed = { ...addRewards(defaultSave(), { coreBits: 81 }), revision: 12 };
const original = JSON.stringify(seed);
const data = loadData();
const fileNames = Object.keys(data).map((key) => `${key}.json`);
type Row = {
  label: string;
  pointerUp?: () => void;
  setOrigin: () => Row;
  setInteractive: () => Row;
  on: (event: string, handler: () => void) => Row;
};

function browser(
  idbIssue?: 'read' | 'open' | 'blocked' | 'available',
  failLocalRead = false,
  initial: string | null = original,
) {
  let localValue: string | null = initial;
  let idbValue = original;
  const localRead = vi.fn((key: string) => {
    if (key !== 'cv.save') return null;
    if (failLocalRead) throw new Error('synthetic localStorage read failure');
    return localValue;
  });
  const localWrite = vi.fn((key: string, value: string) => {
    if (key === 'cv.save') localValue = value;
  });
  vi.stubGlobal('window', { localStorage: { getItem: localRead, setItem: localWrite } });
  const body = new Node('body');
  vi.stubGlobal('document', { body, createElement: (tag: string) => new Node(tag) });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const dbWrite = vi.fn((value: string) => (idbValue = value));
  const dbClose = vi.fn();
  let unblock: (() => void) | undefined;
  const dbOpen = vi.fn(() => {
    const result = {
      close: dbClose,
      transaction: () => {
        const tx = {
          oncomplete() {},
          objectStore: () => ({
            get: () => {
              const request = {
                error: new Error('synthetic get failure'),
                result: idbValue,
                onerror() {},
                onsuccess() {},
              };
              queueMicrotask(() => (idbIssue === 'read' ? request.onerror() : request.onsuccess()));
              return request;
            },
            put: (value: string) => {
              dbWrite(value);
              queueMicrotask(() => tx.oncomplete());
            },
          }),
        };
        return tx;
      },
    };
    const req = {
      error: new Error('synthetic open failure'),
      result,
      onblocked() {},
      onerror() {},
      onsuccess() {},
    };
    queueMicrotask(() => {
      if (idbIssue === 'blocked') {
        unblock = () => req.onsuccess();
        req.onblocked();
      } else if (idbIssue === 'open') req.onerror();
      else req.onsuccess();
    });
    return req;
  });
  vi.stubGlobal('indexedDB', idbIssue ? { open: dbOpen } : undefined);
  return {
    body,
    localRead,
    localWrite,
    dbWrite,
    dbClose,
    unblock: () => unblock?.(),
    restoreStorage: () => {
      if (idbIssue) idbIssue = 'available';
      failLocalRead = false;
    },
    stored: () => (idbIssue ? idbValue : localValue),
  };
}

async function enterGame() {
  const registry = new Map<string, unknown>();
  const rows: Row[] = [];
  const add = {
    text: (_x: number, _y: number, label: string) => {
      const row: Row = {
        label,
        setOrigin: () => row,
        setInteractive: () => row,
        on: (event, handler) => {
          if (event === 'pointerup') row.pointerUp = handler;
          return row;
        },
      };
      rows.push(row);
      return row;
    },
  };
  const common = { registry, game: { registry }, add, input: {}, events: { once: vi.fn() } };
  const preload = Object.assign(new PreloadScene(), common, {
    cache: {
      json: {
        get: (key: string) =>
          key === 'data:manifest' ? { files: fileNames } : data[key.slice('data:'.length)],
      },
    },
    load: {
      json() {},
      once: (_event: string, callback: () => void) => callback(),
      start() {},
    },
    scene: { start: vi.fn() },
  });
  installBus(preload.game);
  preload.create();
  await vi.waitFor(() => expect(preload.scene.start).toHaveBeenCalledWith(SceneKey.Menu), {
    interval: 1,
    timeout: 300,
  });
  const menu = Object.assign(new MenuScene(), common, { scene: { start: vi.fn() } });
  menu.create();
  const showSave = () => {
    rows.find((row) => row.label === 'Dữ liệu lưu')?.pointerUp?.();
    expect(menu.scene.start).toHaveBeenCalledWith(SceneKey.Save);
    Object.assign(new SaveScene(), common).create();
  };
  return { save: getSave(menu), rows, showSave };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each(['read', 'open', 'blocked', 'local'] as const)(
  'QB-100: unreadable startup slot (%s) stays untouched and the menu labels temporary backups',
  async (issue) => {
    const fx = browser(issue === 'local' ? undefined : issue, issue === 'local');
    const { save, rows, showSave } = await enterGame();
    const receipt = vi.fn();
    // A transient read error doesn't mean the store will reject a subsequent write.
    save.update((data) => addRewards(data, { coreBits: 7 }), receipt);
    await save.flush();
    expect(fx.stored()).toBe(original);
    expect(fx.dbWrite).not.toHaveBeenCalled();
    expect(fx.localWrite).not.toHaveBeenCalled();
    expect(receipt).not.toHaveBeenCalled();
    expect(rows.some((row) => row.label.includes('Chơi tạm'))).toBe(true);
    expect(save.readOnly).toBe(true);
    expect(save.data.savedAt).toBe(0);
    expect(await save.reset()).toMatchObject({ ok: false });
    showSave();
    const all = fx.body.all();
    const out = all.find((node) => node.tag === 'textarea' && node.readOnly)!;
    expect(decodeSaveCode(out.value).inventory.coreBits).toBe(7);
    expect(all.some((node) => node.textContent.includes('của phiên tạm'))).toBe(true);
    expect(all.some((node) => node.textContent.includes('sao lưu trước'))).toBe(true);
    expect(all.find((node) => node.textContent === 'Nhập mã')?.disabled).toBe(true);
    expect(all.find((node) => node.textContent === 'Xóa dữ liệu')?.disabled).toBe(true);

    if (issue === 'open' || issue === 'blocked')
      expect(fx.localRead).not.toHaveBeenCalledWith('cv.save');
    if (issue === 'blocked') {
      fx.unblock();
      expect(fx.dbClose).toHaveBeenCalledOnce();
    }
  },
);

it('QB-100: confirmed-empty localStorage still saves and can be reloaded', async () => {
  const fx = browser(undefined, false, null);
  const { save, rows } = await enterGame();
  expect(save.data).toEqual(defaultSave());
  expect(rows.some((row) => row.label.includes('Chơi tạm'))).toBe(false);
  save.update((data) => addRewards(data, { coreBits: 34 }));
  await save.flush();
  expect(fx.localWrite).toHaveBeenCalledOnce();
  expect((await enterGame()).save.data.inventory.coreBits).toBe(34);
});

it('QB-100: permission recovery alone never persists temporary progress; reload finds the original', async () => {
  const fx = browser('read');
  const temporary = (await enterGame()).save;
  temporary.update((data) => addRewards(data, { coreBits: 7 }));
  fx.restoreStorage();
  temporary.update((data) => addRewards(data, { coreBits: 8 }));
  await temporary.flush();
  expect(temporary.data.inventory.coreBits).toBe(15);
  expect(fx.dbWrite).not.toHaveBeenCalled();
  const reloaded = (await enterGame()).save;
  expect(reloaded.readOnly).toBe(false);
  expect(reloaded.data).toEqual(seed);
  reloaded.update((data) => addRewards(data, { coreBits: 2 }));
  await reloaded.flush();
  expect(fx.dbWrite).toHaveBeenCalledOnce();
  expect(JSON.parse(fx.stored()!).inventory.coreBits).toBe(83);
});
