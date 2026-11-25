import { afterEach, expect, it, vi } from 'vitest';
import { type CharacterProgress } from '@/logic/rpg/progression';
import { encodeSaveCode, decodeSaveCode } from '@/logic/save/save-code';
import { addRewards, defaultSave, SAVE_VERSION } from '@/logic/save/save-data';
import { SaveManager, type SaveStore } from '@/logic/save/save-manager';
import { showSavePanel } from '@/save/save-panel';

class Element extends EventTarget {
  readonly nodes: Element[] = [];
  readonly attrs = new Map<string, string>();
  textContent = '';
  value = '';
  disabled = false;
  readOnly = false;

  constructor(readonly tag: string) {
    super();
  }

  append(...items: Element[]) {
    this.nodes.push(...items);
  }
  setAttribute(name: string, value: string) {
    this.attrs.set(name, value);
  }
  remove() {}
  select() {}
  click() {
    if (!this.disabled) this.dispatchEvent(new Event('click'));
  }

  all(): Element[] {
    return [this, ...this.nodes.flatMap((child) => child.all())];
  }
}

afterEach(() => vi.unstubAllGlobals());

class ControlledStore implements SaveStore {
  readonly pending: { succeed: () => void; fail: () => void }[] = [];
  constructor(public text: string) {}
  async read() {
    return this.text;
  }
  write(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pending.push({
        succeed: () => {
          this.text = text;
          resolve();
        },
        fail: () => reject(new Error('kho thử bị chặn')),
      });
    });
  }
}

function panel(save: SaveManager) {
  const body = new Element('body');
  vi.stubGlobal('document', { body, createElement: (tag: string) => new Element(tag) });
  const back = vi.fn();
  const progress = () => ({ level: 1, skillPoints: 0 }) as CharacterProgress;
  showSavePanel(save, back, progress);
  const all = body.all();
  const byLabel = (label: string) =>
    all.find((el) => el.tag === 'button' && el.textContent === label)!;
  const input = all.find((el) => el.tag === 'textarea' && !el.readOnly)!;
  const output = all.find((el) => el.tag === 'textarea' && el.readOnly)!;
  const status = all.find((el) => el.attrs.get('role') === 'status')!;
  return { byLabel, input, output, status, body, back };
}

const seed = addRewards(defaultSave(), { coreBits: 12 });
const incoming = encodeSaveCode({ ...addRewards(defaultSave(), { coreBits: 50 }), revision: 40 });
const exportedBits = (output: Element) => decodeSaveCode(output.value).inventory.coreBits;
const writes = (store: ControlledStore, count: number) =>
  vi.waitFor(() => expect(store.pending).toHaveLength(count), { interval: 1 });

it('QB-100: Nhập mã waits for storage, preserves text/previous save on failure, and supports retry', async () => {
  const store = new ControlledStore(JSON.stringify(seed));
  const save = await SaveManager.open(store);
  const ui = panel(save);
  const submit = ui.byLabel('Nhập mã');
  ui.input.value = incoming;
  submit.click();
  expect(ui.input.value).toBe(incoming);
  expect(ui.status?.textContent).toContain('Đang ghi');
  expect(ui.byLabel('Về menu').disabled).toBe(true);
  ui.byLabel('Xóa dữ liệu').click();
  await writes(store, 1);
  expect(exportedBits(ui.output)).toBe(12);
  store.pending[0]!.fail();
  await vi.waitFor(() => expect(ui.status?.textContent).toContain('Không ghi được'));
  expect(save.data).toEqual(seed);
  expect(JSON.parse(store.text)).toEqual(seed);
  expect(exportedBits(ui.output)).toBe(12);
  expect(ui.input.value).toBe(incoming);
  expect(submit.disabled).toBe(false);

  submit.click();
  await writes(store, 2);
  expect(ui.input.value).toBe(incoming);
  store.pending[1]!.succeed();
  await vi.waitFor(() => expect(ui.status?.textContent).toContain('Đã nhập bản lưu'));
  expect(ui.input.value).toBe('');
  expect(exportedBits(ui.output)).toBe(50);
  expect(save.data.revision).toBe(41);
});

it('QB-100: Xóa dữ liệu retains the previous save when the confirmed write fails', async () => {
  const store = new ControlledStore(JSON.stringify(seed));
  const save = await SaveManager.open(store);
  const ui = panel(save);
  ui.byLabel('Xóa dữ liệu').click();
  expect(store.pending).toHaveLength(0);
  ui.byLabel('Bấm lần nữa để xóa').click();
  await writes(store, 1);
  expect(ui.status?.textContent).toContain('Đang ghi');
  store.pending[0]!.fail();
  await vi.waitFor(() => expect(ui.status?.textContent).toContain('Không ghi được'));
  expect(exportedBits(ui.output)).toBe(12);
  expect(save.data).toEqual(seed);
  ui.byLabel('Xóa dữ liệu').click();
  ui.byLabel('Bấm lần nữa để xóa').click();
  await writes(store, 2);
  store.pending[1]!.succeed();
  await vi.waitFor(() => expect(ui.status?.textContent).toBe('Đã xóa tiến trình.'));
  expect(exportedBits(ui.output)).toBe(0);
  expect(JSON.parse(store.text).inventory.coreBits).toBe(0);
});

it('QB-101: newer-version slot stays protected from replacement', async () => {
  const store = new ControlledStore(JSON.stringify({ version: SAVE_VERSION + 1, revision: 9 }));
  const save = await SaveManager.open(store);
  const ui = panel(save);
  expect(ui.status?.textContent).toContain('Bản lưu không bị ghi đè.');
  expect(ui.byLabel('Nhập mã').disabled).toBe(true);
  expect(ui.byLabel('Xóa dữ liệu').disabled).toBe(true);
  expect(store.pending).toHaveLength(0);
});
