/**
 * Màn Chuẩn bị, bản cắt MVP (01-GDD/11-Do-kho.md mục 2.1, wireframe Prep.html, ADR-001): bảng HTML
 * chỉ vẽ `PrepModel` (logic thuần). Chọn độ khó rồi Bắt đầu: tối đa 2 chạm, giữ mặc định thì 1.
 *
 * Điều hướng như Xưởng, Quầy Mira: chạm/chuột trực tiếp; bàn phím và tay cầm qua `InputSnapshot`
 * (lưới: hàng thẻ độ khó, hàng nút); Tạm dừng quay lại. Nút không giữ focus.
 */
import type { PrepModel, PrepOption } from '../logic/difficulty/prep-model';
import { gridMove, type GridPos, MENU_STICK_STEP, menuActivate } from '../logic/hud/menu-cursor';
import type { InputSnapshot } from '../logic/input/actions';
import { createPanel } from '../playtest/panel';

export interface PrepOptions {
  onStart: (difficultyId: string) => void;
  onBack: () => void;
}

type Action = { kind: 'difficulty'; id: string } | { kind: 'start' } | { kind: 'back' };

export class PrepPanel {
  private readonly root: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private selected: string;
  private focus: GridPos;
  private stickHeld = { x: true, y: true };
  private grid: Action[][] = [];
  private buttons = new Map<string, HTMLButtonElement>();
  private message = '';

  constructor(
    private readonly model: PrepModel,
    private readonly options: PrepOptions,
  ) {
    const { root, body } = createPanel('Chuẩn bị', 'cv-workshop cv-prep');
    this.root = root;
    this.body = body;
    this.selected = model.selected;
    // Con trỏ bắt đầu ở nút Bắt đầu: giữ độ khó mặc định thì chỉ cần một lần bấm.
    this.focus = { row: 1, col: 0 };
    root.addEventListener('mousedown', (e) => e.preventDefault());
    this.render();
  }

  destroy(): void {
    this.root.remove();
  }

  /** Độ khó đang chọn (test, chạy thử). */
  get difficulty(): string {
    return this.selected;
  }

  handle(snap: InputSnapshot): void {
    if (snap.pressed.pause) {
      this.run({ kind: 'back' });
      return;
    }
    const dir = this.direction(snap);
    if (dir) {
      const next = gridMove(
        this.grid.map((r) => r.length),
        this.focus,
        dir,
      );
      if (next.row !== this.focus.row || next.col !== this.focus.col) {
        this.focus = next;
        this.render();
      }
    }
    if (menuActivate(snap)) {
      const a = this.grid[this.focus.row]?.[this.focus.col];
      if (a) this.run(a, true);
    }
  }

  private direction(snap: InputSnapshot): 'up' | 'down' | 'left' | 'right' | undefined {
    if (snap.pressed.up) return 'up';
    if (snap.pressed.down) return 'down';
    if (snap.pressed.left) return 'left';
    if (snap.pressed.right) return 'right';
    const sx = Math.abs(snap.moveX) >= MENU_STICK_STEP;
    const sy = Math.abs(snap.moveY) >= MENU_STICK_STEP;
    let dir: 'up' | 'down' | 'left' | 'right' | undefined;
    if (sy && !this.stickHeld.y) dir = snap.moveY < 0 ? 'up' : 'down';
    else if (sx && !this.stickHeld.x) dir = snap.moveX < 0 ? 'left' : 'right';
    this.stickHeld = { x: sx, y: sy };
    return dir;
  }

  /** `byKey`: chọn bằng phím/tay cầm thì chọn xong nhảy con trỏ tới Bắt đầu. */
  private run(a: Action, byKey = false): void {
    if (a.kind === 'back') {
      this.options.onBack();
      return;
    }
    if (a.kind === 'start') {
      this.options.onStart(this.selected);
      return;
    }
    const option = this.model.options.find((o) => o.id === a.id);
    if (!option) return;
    if (option.locked) {
      this.message = option.lockText ?? '';
    } else {
      this.selected = option.id;
      this.message = '';
      if (byKey) this.focus = { row: 1, col: 0 };
    }
    this.render();
  }

  private button(
    key: string,
    label: string,
    action: Action,
    opts: { disabled?: boolean; cls?: string } = {},
  ): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = label;
    b.dataset.key = key;
    if (opts.cls) b.className = opts.cls;
    b.disabled = opts.disabled ?? false;
    b.addEventListener('click', () => {
      this.grid.forEach((row, r) =>
        row.forEach((x, c) => {
          if (x === action) this.focus = { row: r, col: c };
        }),
      );
      this.run(action);
    });
    this.buttons.set(key, b);
    return b;
  }

  private render(): void {
    const m = this.model;
    this.buttons.clear();
    const head = document.createElement('div');
    head.className = 'cv-ws-head';
    const [lo, hi] = m.recommended;
    const level =
      m.effectiveLevel === m.level ? `${m.level}` : `${m.level} (hiệu dụng ${m.effectiveLevel})`;
    head.innerHTML = `<span><b>${m.stageName}</b></span><span>Cấp ${level} · khuyến nghị ${lo}–${hi}</span>`;

    const cards = document.createElement('div');
    cards.className = 'cv-prep-cards';
    const row: Action[] = [];
    for (const o of m.options) {
      const action: Action = { kind: 'difficulty', id: o.id };
      row.push(action);
      cards.append(
        this.button(`difficulty:${o.id}`, this.cardLabel(o), action, {
          cls: `cv-prep-card${o.locked ? ' locked' : ''}${o.id === this.selected ? ' selected' : ''}`,
        }),
      );
    }

    const notes: string[] = [];
    if (m.levelHint) notes.push(m.levelHint);
    notes.push('Booster mở sau boss 4.');
    if (this.message) notes.push(this.message);
    const note = document.createElement('div');
    note.className = 'cv-panel-note';
    note.textContent = notes.join(' ');

    const start: Action = { kind: 'start' };
    const back: Action = { kind: 'back' };
    const picked = m.options.find((o) => o.id === this.selected);
    const actions = document.createElement('div');
    actions.className = 'cv-panel-actions';
    actions.append(
      this.button('start', `Bắt đầu · ${picked?.name ?? ''}`, start, {
        cls: 'primary cv-prep-start',
      }),
      this.button('back', 'Quay lại', back),
    );

    this.grid = [row, [start, back]];
    this.body.replaceChildren(head, cards, note, actions);
    const cur = this.grid[this.focus.row]?.[this.focus.col];
    for (const [key, b] of this.buttons) {
      const isCur =
        cur !== undefined &&
        ((cur.kind === 'difficulty' && key === `difficulty:${cur.id}`) ||
          (cur.kind !== 'difficulty' && key === cur.kind));
      b.classList.toggle('cursor', isCur);
    }
  }

  private cardLabel(o: PrepOption): string {
    const lock = o.locked ? `<span class="lock">🔒 ${o.lockText ?? ''}</span>` : '';
    return `<span class="name">${o.name}</span><span class="desc">${o.desc}</span><span class="stats">${o.stats}</span>${lock}`;
  }
}
