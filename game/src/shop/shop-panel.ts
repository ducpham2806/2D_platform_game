/**
 * Quầy Mira, tab Upgrade (M9, đặc tả Hub mục 4, wireframe Shop.html, ADR-001): bảng HTML chỉ vẽ
 * `ShopModel` (logic thuần) và gọi các hàm thuần mua/gỡ. Mỗi giao dịch ghi một lần qua
 * `SaveManager.transact`; chỉ báo "đã mua" khi ghi xong, ghi lỗi thì bản lưu tự hoàn tác.
 *
 * Điều hướng như Xưởng: chạm/chuột trực tiếp; bàn phím và tay cầm qua `InputSnapshot` của
 * InputService (lưới thẻ rồi hàng nút); Tạm dừng quay lại. Nút không giữ focus.
 */
import { type GameConfig, STAGES_WITH_ENEMY_DATA } from '../core/game-config';
import { SHOP } from '../debug/flags';
import { gridMove, type GridPos, MENU_STICK_STEP, menuActivate } from '../logic/hud/menu-cursor';
import type { InputSnapshot } from '../logic/input/actions';
import { setInventory } from '../logic/save/save-data';
import type { SaveManager } from '../logic/save/save-manager';
import { buildShop, type ShopCardView, type ShopModel } from '../logic/shop/shop-model';
import { buyUpgrade, refundUpgrade, storyBossCount } from '../logic/shop/upgrades';
import { createPanel } from '../playtest/panel';

export interface ShopOptions {
  onClose: () => void;
}

type Action =
  { kind: 'card'; id: string } | { kind: 'buy' } | { kind: 'refund' } | { kind: 'close' };

/** Số thẻ mỗi hàng (lưới điều hướng; bố cục CSS cũng 4 cột). */
const CARDS_PER_ROW = 4;
const DOTS = { on: '●', off: '○' };

/** Số boss chiến dịch đã hạ, tính cho Quầy Mira (`?shop=1` coi như đủ mốc mở đầu tiên). */
export function shopBosses(save: SaveManager, config: GameConfig): number {
  const story = new Set(config.stages.stages.map((s) => s.boss));
  const real = storyBossCount(save.data.progress.bossesDefeated, story);
  const first = config.shop.unlockSchedule[0]?.afterBosses ?? 0;
  return SHOP ? Math.max(real, first) : real;
}

export function shopModel(save: SaveManager, config: GameConfig): ShopModel {
  return buildShop(config, {
    levels: save.data.inventory.upgrades,
    paid: save.data.inventory.upgradePaid,
    coreBits: save.data.inventory.coreBits,
    bosses: shopBosses(save, config),
    readOnly: save.readOnly,
    playableStages: STAGES_WITH_ENEMY_DATA,
    difficultyBy: save.data.progress.difficulty,
  });
}

export class ShopPanel {
  private readonly root: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private selected: string;
  private focus: GridPos = { row: 0, col: 0 };
  /** Nút Mua hoặc Gỡ đang chờ bấm lần hai để xác nhận. */
  private armed: 'buy' | 'refund' | undefined;
  /** Đang chờ ghi bản lưu: khóa nút mua, gỡ. */
  private busy = false;
  private message = '';
  private stickHeld = { x: true, y: true };
  private grid: Action[][] = [];
  private buttons = new Map<string, HTMLButtonElement>();
  private closed = false;

  constructor(
    private readonly save: SaveManager,
    private readonly config: GameConfig,
    private readonly options: ShopOptions,
  ) {
    const { root, body } = createPanel('Quầy Mira', 'cv-workshop cv-shop');
    this.root = root;
    this.body = body;
    const model = this.model();
    // Mặc định trỏ thẻ mua được rẻ nhất (gợi ý món đầu tiên), không có thì thẻ đầu.
    const cheapest = model.cards
      .filter((c) => c.state === 'buyable')
      .sort((a, b) => (a.nextCost ?? 0) - (b.nextCost ?? 0))[0];
    this.selected = cheapest?.id ?? model.cards[0]?.id ?? '';
    const index = model.cards.findIndex((c) => c.id === this.selected);
    this.focus = { row: Math.floor(index / CARDS_PER_ROW), col: index % CARDS_PER_ROW };
    root.addEventListener('mousedown', (e) => e.preventDefault());
    this.render();
  }

  destroy(): void {
    this.closed = true;
    this.root.remove();
  }

  private model(): ShopModel {
    return shopModel(this.save, this.config);
  }

  handle(snap: InputSnapshot): void {
    if (snap.pressed.pause) {
      this.run({ kind: 'close' });
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
        this.armed = undefined;
        const a = this.current();
        if (a?.kind === 'card') this.selected = a.id;
        this.render();
      }
    }
    if (menuActivate(snap)) {
      const a = this.current();
      if (a?.kind === 'card') {
        // Chọn thẻ bằng phím: nhảy tới nút Mua (mua phải bấm nút riêng và xác nhận).
        this.selected = a.id;
        this.focusOn('buy');
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
    if (a.kind === 'close') {
      this.options.onClose();
      return;
    }
    if (a.kind === 'card') {
      this.selected = a.id;
      this.armed = undefined;
      this.message = '';
      this.render();
      return;
    }
    const model = this.model();
    if (model.readOnly || this.busy || !model.open) return;
    const card = model.cards.find((c) => c.id === this.selected);
    if (!card) return;
    // Bước xác nhận: lần đầu chỉ đổi nút thành "Xác nhận", lần hai mới giao dịch.
    if (this.armed !== a.kind) {
      this.armed = a.kind;
      this.message =
        a.kind === 'buy'
          ? `Bấm "Xác nhận" để mua ${card.name} cấp ${card.level + 1} với ${card.nextCost} Core Bit.`
          : `Bấm lần nữa để gỡ ${card.name} cấp ${card.level}, hoàn ${card.refund} Core Bit.`;
      this.render();
      return;
    }
    this.armed = undefined;
    const inv = this.save.data.inventory;
    const result =
      a.kind === 'buy'
        ? buyUpgrade(
            this.config.shop,
            inv.upgrades,
            inv.coreBits,
            card.id,
            model.bosses,
            inv.upgradePaid,
          )
        : refundUpgrade(this.config.shop, inv.upgrades, inv.coreBits, card.id, inv.upgradePaid);
    if (!result.ok) {
      this.message = 'Không thực hiện được (kiểm tra số dư và điều kiện mở).';
      this.render();
      return;
    }
    this.busy = true;
    this.message = 'Đang lưu…';
    this.render();
    void this.save
      .transact((s) => setInventory(s, result.levels, result.coreBits, result.paid))
      .then((r) => {
        this.busy = false;
        if (r.ok)
          this.message =
            a.kind === 'buy'
              ? `Đã mua ${card.name} cấp ${result.level} (−${result.amount} Core Bit).`
              : `Đã gỡ, hoàn ${result.amount} Core Bit (${card.name} còn cấp ${result.level}).`;
        else this.message = `Không lưu được, chưa trừ tiền. ${r.error}`;
        if (!this.closed) this.render();
      });
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
    const model = this.model();
    this.buttons.clear();
    const grid: Action[][] = [];

    const head = document.createElement('div');
    head.className = 'cv-ws-head';
    head.innerHTML = `<span>Boss đã hạ: ${model.bosses}</span><span>Core Bit <b>${model.coreBits}</b></span>`;
    const tabs = document.createElement('div');
    tabs.className = 'cv-ws-tabs';
    // Lịch mở quầy: đặc tả Hub mục 4.3 (Booster, Skin sau boss 4, sang Alpha). Không có Premium.
    tabs.innerHTML =
      '<span class="on">Upgrade</span><span>Booster · sau boss 4</span><span>Skin · sau boss 4</span>';

    const cards = document.createElement('div');
    cards.className = 'cv-shop-cards';
    model.cards.forEach((c, i) => {
      const action: Action = { kind: 'card', id: c.id };
      const row = Math.floor(i / CARDS_PER_ROW);
      (grid[row] ??= []).push(action);
      cards.append(
        this.button(`card:${c.id}`, this.cardLabel(c, model), action, {
          cls: `cv-shop-card ${c.state}${c.id === this.selected ? ' selected' : ''}`,
        }),
      );
    });

    const sel = model.cards.find((c) => c.id === this.selected);
    const detail = document.createElement('div');
    detail.className = 'cv-ws-detail';
    if (sel) detail.innerHTML = this.detailHtml(sel, model);

    const buy: Action = { kind: 'buy' };
    const refund: Action = { kind: 'refund' };
    const close: Action = { kind: 'close' };
    grid.push([buy, refund, close]);
    const canTrade = model.open && !model.readOnly && !this.busy;
    let buyLabel = 'Mua';
    if (sel?.state === 'maxed') buyLabel = 'Đã đủ cấp';
    else if (this.armed === 'buy' && sel?.nextCost !== undefined)
      buyLabel = `Xác nhận (${sel.nextCost} Core Bit)`;
    const actions = document.createElement('div');
    actions.className = 'cv-panel-actions';
    actions.append(
      this.button('buy', buyLabel, buy, {
        cls: 'primary',
        disabled: !canTrade || sel?.state !== 'buyable',
      }),
      this.button(
        'refund',
        this.armed === 'refund'
          ? 'Bấm lần nữa để gỡ'
          : `Gỡ${sel?.refund ? ` (+${sel.refund})` : ''}`,
        refund,
        { disabled: !canTrade || sel?.refund === undefined },
      ),
      this.button('close', 'Quay lại', close),
    );
    const note = document.createElement('div');
    note.className = 'cv-panel-note';
    note.textContent = [
      model.readOnly ? 'Bản lưu chỉ đọc (của phiên bản game mới hơn): chỉ xem.' : '',
      this.message,
    ]
      .filter((x) => x.length > 0)
      .join(' ');

    this.grid = grid;
    // Hai cột trên màn ngang (thẻ | chi tiết và nút) để điện thoại ngang không phải cuộn.
    const side = document.createElement('div');
    side.className = 'cv-shop-side';
    side.append(detail, note, actions);
    const layout = document.createElement('div');
    layout.className = 'cv-shop-layout';
    layout.append(cards, side);
    this.body.replaceChildren(head, tabs, layout);
    const cur = this.current();
    for (const [key, b] of this.buttons) {
      const isCur =
        cur !== undefined &&
        ((cur.kind === 'card' && key === `card:${cur.id}`) ||
          (cur.kind !== 'card' && key === cur.kind));
      b.classList.toggle('cursor', isCur);
    }
  }

  private cardLabel(c: ShopCardView, model: ShopModel): string {
    const dots = DOTS.on.repeat(c.level) + DOTS.off.repeat(c.maxLevel - c.level);
    let price: string;
    if (c.state === 'maxed') price = '✓ Đủ cấp';
    else if (c.comingSoon) price = '🔒 Sắp có';
    else if (c.state === 'locked')
      price = `🔒 Sau ${c.unlockAfterBosses ?? model.openAfterBosses} boss`;
    else if (c.state === 'funds') price = `${c.nextCost} · thiếu ${c.missing}`;
    else price = `${c.nextCost} Core Bit`;
    return `<span class="name">${c.name}</span><span class="dots" aria-label="cấp ${c.level}/${c.maxLevel}">${dots}</span><span class="price">${price}</span>`;
  }

  private detailHtml(c: ShopCardView, model: ShopModel): string {
    const lines: string[] = [
      `<b>${c.name}</b> <small>cấp ${c.level}/${c.maxLevel}</small>`,
      `<p>${c.desc}</p>`,
    ];
    if (!model.open)
      lines.push(
        `<p class="lock">Quầy Upgrade mở sau ${model.openAfterBosses} boss (đã hạ ${model.bosses}).</p>`,
      );
    else if (c.comingSoon)
      lines.push('<p class="lock">Chưa có tác dụng trong bản này; mở bán khi có (Alpha).</p>');
    else if (c.state === 'maxed') lines.push('<p>Đã đủ cấp.</p>');
    else if (c.state === 'locked')
      lines.push(
        `<p class="lock">Cấp ${c.level + 1} mở khi hạ ${c.unlockAfterBosses} boss (đã hạ ${model.bosses}).</p>`,
      );
    else {
      const effect =
        c.effectNow && c.effectNext ? ` · ${c.effectNow} → <b>${c.effectNext}</b>` : '';
      lines.push(`<p>Cấp ${c.level + 1}: <b>${c.nextCost} Core Bit</b>${effect}</p>`);
      if (c.state === 'funds') {
        // Chỉ gợi ý, không chặn, không đẩy mua (đặc tả Hub mục 4.2).
        const inc = model.income;
        lines.push(
          `<p class="hint">Thiếu ${c.missing} Core Bit. ${inc.replay ? 'Chơi lại' : 'Một lượt'} Stage ${inc.stage}${inc.name ? ` ${inc.name}` : ''}${inc.difficultyName ? ` (${inc.difficultyName})` : ''} cho khoảng ${inc.coreBits} Core Bit.</p>`,
        );
      }
    }
    if (c.refund !== undefined)
      lines.push(`<small>Gỡ cấp ${c.level}: hoàn 100% số đã trả (${c.refund} Core Bit).</small>`);
    return lines.join('');
  }
}
