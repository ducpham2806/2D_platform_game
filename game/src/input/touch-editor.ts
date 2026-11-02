import type {
  SizePreset,
  StickMode,
  TouchConfig,
  TouchSettings,
} from '../logic/input/touch-layout';

/**
 * Bảng chỉnh bố cục nút cảm ứng (wireframe LayoutEdit): cỡ nút, độ trong suốt, rung,
 * tự bắn, hỗ trợ ngắm, thuận tay trái, kiểu cần ảo, Đặt lại, Xong.
 * Nằm ngoài lớp nút để các ô chọn và thanh trượt nhận thao tác bình thường.
 */
export class TouchEditorPanel {
  private readonly root: HTMLDivElement;
  private collapsed = false;

  constructor(
    private readonly config: TouchConfig,
    private settings: TouchSettings,
    private readonly onChange: (settings: TouchSettings) => void,
    private readonly onReset: () => void,
    private readonly onDone: () => void,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'touch-editor';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-label', 'Chỉnh bố cục nút');
    document.body.append(this.root);
    this.render();
  }

  setSettings(settings: TouchSettings): void {
    this.settings = settings;
    this.render();
  }

  destroy(): void {
    this.root.remove();
  }

  private update(patch: Partial<TouchSettings>): void {
    this.settings = { ...this.settings, ...patch };
    this.onChange(this.settings);
  }

  private render(): void {
    this.root.replaceChildren();
    this.root.classList.toggle('collapsed', this.collapsed);
    const header = document.createElement('div');
    header.className = 'touch-editor-header';
    const title = document.createElement('div');
    title.className = 'touch-editor-title';
    title.textContent = 'Kéo thả từng nút để đổi vị trí';
    // Bảng che một phần màn hình; thu gọn để kéo được các nút nằm phía sau.
    const toggle = this.button(this.collapsed ? 'Mở bảng' : 'Thu gọn', () => {
      this.collapsed = !this.collapsed;
      this.render();
    });
    header.append(title, toggle);
    if (this.collapsed) header.append(this.button('Xong', this.onDone, true));
    this.root.append(header);
    if (this.collapsed) return;

    this.root.append(
      this.select<SizePreset>(
        'Kích thước nút',
        this.settings.sizePreset,
        [
          ['small', 'Nhỏ'],
          ['medium', 'Vừa'],
          ['large', 'Lớn'],
        ],
        (v) => this.update({ sizePreset: v }),
      ),
      this.range('Độ trong suốt', this.settings.opacity, this.config.opacityRange, (v) =>
        this.update({ opacity: v }),
      ),
      this.select<StickMode>(
        'Cần ảo',
        this.settings.stickMode,
        [
          ['floating', 'Nổi (hiện tại chỗ chạm)'],
          ['fixed', 'Cố định'],
        ],
        (v) => this.update({ stickMode: v }),
      ),
      this.toggle('Rung phản hồi', this.settings.vibration, (v) => this.update({ vibration: v })),
      this.toggle('Tự bắn (auto-fire)', this.settings.autoFire, (v) =>
        this.update({ autoFire: v }),
      ),
      this.toggle('Hỗ trợ ngắm nhẹ', this.settings.aimAssist, (v) => this.update({ aimAssist: v })),
      this.toggle('Thuận tay trái', this.settings.leftHanded, (v) =>
        this.update({ leftHanded: v, offsets: {} }),
      ),
    );

    const actions = document.createElement('div');
    actions.className = 'touch-editor-actions';
    actions.append(this.button('Đặt lại', this.onReset), this.button('Xong', this.onDone, true));
    this.root.append(actions);
  }

  private row(label: string, control: HTMLElement): HTMLLabelElement {
    const row = document.createElement('label');
    row.className = 'touch-editor-row';
    const text = document.createElement('span');
    text.textContent = label;
    row.append(text, control);
    return row;
  }

  private select<T extends string>(
    label: string,
    value: T,
    options: ReadonlyArray<readonly [T, string]>,
    onPick: (value: T) => void,
  ): HTMLLabelElement {
    const select = document.createElement('select');
    for (const [v, text] of options) {
      const option = document.createElement('option');
      option.value = v;
      option.textContent = text;
      option.selected = v === value;
      select.append(option);
    }
    select.addEventListener('change', () => onPick(select.value as T));
    return this.row(label, select);
  }

  private range(
    label: string,
    value: number,
    [min, max]: [number, number],
    onPick: (value: number) => void,
  ): HTMLLabelElement {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = '0.05';
    input.value = String(value);
    input.addEventListener('input', () => onPick(Number(input.value)));
    return this.row(label, input);
  }

  private toggle(
    label: string,
    value: boolean,
    onPick: (value: boolean) => void,
  ): HTMLLabelElement {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = value;
    input.addEventListener('change', () => onPick(input.checked));
    return this.row(label, input);
  }

  private button(label: string, onClick: () => void, primary = false): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (primary) button.className = 'primary';
    button.addEventListener('click', onClick);
    return button;
  }
}
