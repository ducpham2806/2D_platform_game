/**
 * Xưởng Lắp Ráp, tab Kỹ năng (M8, ADR-001, wireframe Workshop.html): bảng HTML chỉ vẽ
 * `WorkshopModel` (logic thuần) và gọi các hàm thuần của cây kỹ năng.
 *
 * Điều hướng: chạm/chuột trực tiếp; bàn phím và tay cầm qua `InputSnapshot` của InputService
 * (đọc theo phím đã đổi): lên/xuống/trái/phải di chuyển trên lưới, Nhảy/Bắn/Tương tác chọn,
 * Tạm dừng quay lại. Nút không giữ focus để phím vẫn tới InputService (KeyboardSource bỏ qua phím
 * có đích nằm trong `.cv-panel`).
 */
import type { GameConfig } from '../core/game-config';
import { gridMove, type GridPos, MENU_STICK_STEP, menuActivate } from '../logic/hud/menu-cursor';
import type { InputSnapshot } from '../logic/input/actions';
import { characterProgress } from '../logic/rpg/progression';
import { learn, resetBranch, type SkillRanks } from '../logic/rpg/skill-tree';
import {
  buildWorkshop,
  type WorkshopModel,
  type WorkshopNodeView,
} from '../logic/rpg/workshop-model';
import { setSkills } from '../logic/save/save-data';
import type { SaveManager } from '../logic/save/save-manager';
import { createPanel } from '../playtest/panel';
import type { Props } from '../logic/telemetry/schema';

export interface WorkshopOptions {
  /** Dòng ghi chú cố định (mở từ menu tạm dừng: thay đổi áp dụng khi hồi sinh). */
  note?: string;
  onClose: () => void;
  /** Gọi sau mỗi lần bậc kỹ năng đổi. */
  onChange?: (skills: SkillRanks) => void;
  /** Đo lường (EP-13): học hoặc đặt lại kỹ năng. */
  onTelemetry?: (name: 'skill_change', props: Props) => void;
}

type Action =
  | { kind: 'node'; id: string }
  | { kind: 'learn' }
  | { kind: 'resetBranch'; id: string }
  | { kind: 'resetAll' }
  | { kind: 'close' };

const DOTS = { on: '●', off: '○' };

/** Tổng SP có được từ bản lưu (cấp từ EXP + boss chiến dịch đã hạ). */
export function totalSkillPoints(save: SaveManager, config: GameConfig): number {
  const storyBosses = new Set(config.stages.stages.map((s) => s.boss));
  return characterProgress(
    save.data.character.exp,
    save.data.progress.bossesDefeated,
    storyBosses,
    config.player.level,
  ).skillPoints;
}

/** Xưởng mở sau boss chiến dịch đầu tiên (đặc tả Hub mục 5, hướng dẫn R02). */
export function workshopUnlocked(save: SaveManager, config: GameConfig): boolean {
  const storyBosses = new Set(config.stages.stages.map((s) => s.boss));
  return save.data.progress.bossesDefeated.some((id) => storyBosses.has(id));
}

export class WorkshopPanel {
  private readonly root: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private selected: string;
  private focus: GridPos = { row: 0, col: 0 };
  /** Nút đặt lại đang chờ bấm lần hai để xác nhận (khóa hành động). */
  private armed: string | undefined;
  private message = '';
  private stickHeld = { x: true, y: true };
  /** Lưới hành động theo hàng (để điều hướng bằng phím/tay cầm). */
  private grid: Action[][] = [];
  private buttons = new Map<string, HTMLButtonElement>();

  constructor(
    private readonly save: SaveManager,
    private readonly config: GameConfig,
    private readonly options: WorkshopOptions,
  ) {
    const { root, body } = createPanel('Xưởng Lắp Ráp', 'cv-workshop');
    this.root = root;
    this.body = body;
    this.selected = config.skills.branches[0]?.nodes[0]?.id ?? '';
    // Không để nút giữ focus (phím phải tới InputService); chạm/chuột vẫn bấm được.
    root.addEventListener('mousedown', (e) => e.preventDefault());
    this.render();
  }

  destroy(): void {
    this.root.remove();
  }

  private model(): WorkshopModel {
    return buildWorkshop(
      this.config.skills,
      this.save.data.character.skills,
      totalSkillPoints(this.save, this.config),
      this.save.readOnly,
    );
  }

  /** Đọc đầu vào của một bước (bàn phím, tay cầm). */
  handle(snap: InputSnapshot): void {
    if (snap.pressed.pause) {
      this.run({ kind: 'close' });
      return;
    }
    const dir = this.direction(snap);
    if (dir) {
      const rows = this.grid.map((r) => r.length);
      const next = gridMove(rows, this.focus, dir);
      if (next.row !== this.focus.row || next.col !== this.focus.col) {
        this.focus = next;
        this.armed = undefined;
        const a = this.current();
        if (a?.kind === 'node') this.selected = a.id;
        this.render();
      }
    }
    if (menuActivate(snap)) {
      const a = this.current();
      if (a?.kind === 'node') {
        // Chọn nút bằng phím: nhảy tới nút "Học" (học phải bấm nút riêng, tránh học nhầm).
        this.selected = a.id;
        this.focusOn('learn');
        this.render();
      } else if (a) this.run(a);
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

  private current(): Action | undefined {
    return this.grid[this.focus.row]?.[this.focus.col];
  }

  private focusOn(kind: Action['kind']): void {
    this.grid.forEach((row, r) =>
      row.forEach((a, c) => {
        if (a.kind === kind) this.focus = { row: r, col: c };
      }),
    );
  }

  private run(a: Action): void {
    const model = this.model();
    if (a.kind === 'close') {
      this.options.onClose();
      return;
    }
    if (a.kind === 'node') {
      this.selected = a.id;
      this.armed = undefined;
      this.render();
      return;
    }
    if (model.readOnly) return;
    const skills = this.save.data.character.skills;
    let next: SkillRanks | undefined;
    if (a.kind === 'learn') {
      next = learn(this.config.skills, skills, this.selected, model.available);
      const node = this.config.skills.nodes[this.selected];
      this.message = next && node ? `Đã học ${node.name} bậc ${next[this.selected]}.` : '';
    } else {
      const key = a.kind === 'resetAll' ? 'all' : a.id;
      if (this.armed !== key) {
        this.armed = key;
        this.message = 'Bấm lần nữa để xác nhận đặt lại (hoàn 100% SP, miễn phí).';
        this.render();
        return;
      }
      this.armed = undefined;
      next = a.kind === 'resetAll' ? {} : resetBranch(this.config.skills, skills, a.id);
      this.message = 'Đã đặt lại, hoàn SP.';
    }
    if (next) {
      const learned = next;
      this.save.update((s) => setSkills(s, learned));
      this.options.onChange?.(learned);
      this.options.onTelemetry?.(
        'skill_change',
        a.kind === 'learn'
          ? { node: this.selected, rank: learned[this.selected] ?? 0, action: 'learn' }
          : { action: 'reset' },
      );
    }
    this.render();
  }

  private button(
    key: string,
    label: string,
    action: Action,
    opts: { disabled?: boolean; cls?: string; title?: string } = {},
  ): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = label;
    b.dataset.key = key;
    if (opts.cls) b.className = opts.cls;
    if (opts.title) b.title = opts.title;
    b.disabled = opts.disabled ?? false;
    b.addEventListener('click', () => {
      // Chạm/chuột: đưa con trỏ tới đúng nút vừa bấm.
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
    const model = this.model();
    this.buttons.clear();
    const grid: Action[][] = [[], [], [], [], []];
    const head = document.createElement('div');
    head.className = 'cv-ws-head';
    head.innerHTML = `<span>SP còn lại: <b>${model.available}</b> / ${model.total}</span><span>Core Bit ${this.save.data.inventory.coreBits}</span>`;
    const tabs = document.createElement('div');
    tabs.className = 'cv-ws-tabs';
    tabs.innerHTML =
      '<span class="on">Kỹ năng</span><span>Module · khi có module đầu tiên</span><span>Giáp · khi có Két giáp</span><span>Tủ skin · mở sau boss 5</span><span>Loadout · mở sau boss 5</span>';

    const cols = document.createElement('div');
    cols.className = 'cv-ws-cols';
    for (const branch of model.branches) {
      const col = document.createElement('div');
      col.className = 'cv-ws-col';
      const title = document.createElement('div');
      title.className = 'cv-ws-branch';
      title.innerHTML = `<b>${branch.name}</b><small>${branch.role}</small>`;
      col.append(title);
      branch.nodes.forEach((n, tier) => {
        const action: Action = { kind: 'node', id: n.id };
        grid[tier]?.push(action);
        col.append(
          this.button(`node:${n.id}`, this.nodeLabel(n), action, {
            cls: `cv-ws-node ${n.state}${n.id === this.selected ? ' selected' : ''}`,
          }),
        );
      });
      const reset: Action = { kind: 'resetBranch', id: branch.id };
      grid[3]?.push(reset);
      col.append(
        this.button(
          `reset:${branch.id}`,
          this.armed === branch.id ? 'Bấm lần nữa' : `Đặt lại nhánh (${branch.spent} SP)`,
          reset,
          { disabled: model.readOnly || branch.spent === 0, cls: 'cv-ws-reset' },
        ),
      );
      cols.append(col);
    }

    const sel = model.branches.flatMap((b) => b.nodes).find((n) => n.id === this.selected);
    const detail = document.createElement('div');
    detail.className = 'cv-ws-detail';
    const learnAction: Action = { kind: 'learn' };
    const resetAll: Action = { kind: 'resetAll' };
    const close: Action = { kind: 'close' };
    grid[4]?.push(learnAction, resetAll, close);
    if (sel) {
      const ranks = sel.rankTexts
        .map(
          (t, i) =>
            `<li class="${i < sel.rank ? 'done' : i === sel.rank ? 'next' : ''}">Bậc ${i + 1}: ${t}</li>`,
        )
        .join('');
      const lock = sel.requires ? `<p class="lock">Mở khi: ${sel.requires}</p>` : '';
      detail.innerHTML = `<b>${sel.name}</b> <small>tầng ${sel.tier} · ${sel.rank}/${sel.maxRank} bậc</small><p>${this.config.skills.nodes[sel.id]?.desc ?? ''}</p><ul>${ranks}</ul>${lock}`;
    }
    const learnLabel = sel?.state === 'maxed' ? 'Đã đủ bậc' : 'Học (1 SP)';
    const actions = document.createElement('div');
    actions.className = 'cv-panel-actions';
    actions.append(
      this.button('learn', learnLabel, learnAction, {
        cls: 'primary',
        disabled: model.readOnly || sel?.state !== 'learnable',
      }),
      this.button('resetAll', this.armed === 'all' ? 'Bấm lần nữa' : 'Đặt lại tất cả', resetAll, {
        disabled: model.readOnly || model.spent === 0,
      }),
      this.button('close', 'Quay lại', close),
    );
    const note = document.createElement('div');
    note.className = 'cv-panel-note';
    const notes = [
      model.readOnly ? 'Bản lưu chỉ đọc (của phiên bản game mới hơn): chỉ xem.' : '',
      this.options.note ?? '',
      this.message,
    ].filter((x) => x.length > 0);
    note.textContent = notes.join(' ');

    this.grid = grid;
    this.body.replaceChildren(head, tabs, cols, detail, note, actions);
    // Đánh dấu nút đang trỏ (bàn phím, tay cầm).
    const cur = this.current();
    for (const [key, b] of this.buttons) {
      const isCur =
        cur !== undefined &&
        ((cur.kind === 'node' && key === `node:${cur.id}`) ||
          (cur.kind === 'resetBranch' && key === `reset:${cur.id}`) ||
          key === cur.kind);
      b.classList.toggle('cursor', isCur);
    }
  }

  private nodeLabel(n: WorkshopNodeView): string {
    const dots = DOTS.on.repeat(n.rank) + DOTS.off.repeat(n.maxRank - n.rank);
    return `<span>${n.name}</span><span class="dots" aria-label="${n.rank}/${n.maxRank} bậc">${dots}</span>`;
  }
}
