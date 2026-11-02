import Phaser from 'phaser';
import { LOGIC_HEIGHT, LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus, getInput } from '../core/phaser-services';
import type { InputService } from '../input/input-service';
import { ACTION_LABELS, ACTIONS, type Action } from '../logic/input/actions';
import { gamepadButtonLabel, keyLabel } from '../logic/input/bindings';
import { MUTED_STYLE, TEXT_STYLE, textButton } from './ui';

type Tab = 'keyboard' | 'gamepad' | 'touch';
const TABS: ReadonlyArray<readonly [Tab, string]> = [
  ['keyboard', 'Bàn phím'],
  ['gamepad', 'Tay cầm'],
  ['touch', 'Cảm ứng'],
];
const ROW_STYLE = { ...TEXT_STYLE, fontSize: '9px' };
const ROW_TOP = 34;
const ROW_HEIGHT = 12;

/**
 * Cài đặt điều khiển (wireframe SettingsControls, Gamepad, Touch): đổi phím bàn phím,
 * đổi nút tay cầm, mở chế độ chỉnh bố cục nút cảm ứng. Lưu ngay sau mỗi thay đổi.
 * Điều hướng: ↑/↓ chọn dòng, Enter đổi, ←/→ đổi tab, Esc quay lại; hoặc chạm/bấm chuột.
 */
export class ControlsScene extends Phaser.Scene {
  private controls?: InputService;
  private tab: Tab = 'keyboard';
  private selected = 0;
  private capturing: Action | undefined;
  private content?: Phaser.GameObjects.Container;
  private status?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.Controls);
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Controls });
    this.controls = getInput(this);
    this.add.text(8, 6, 'ĐIỀU KHIỂN', { ...TEXT_STYLE, fontSize: '12px' });
    TABS.forEach(([tab, label], i) => {
      textButton(this, 150 + i * 58, 13, label, () => this.switchTab(tab));
    });
    this.content = this.add.container(0, 0);
    this.status = this.add.text(8, LOGIC_HEIGHT - 14, '', MUTED_STYLE);
    this.render();

    // Đọc phím thẳng từ trình duyệt (không qua hàng đợi của Phaser) để thứ tự sự kiện khớp
    // với lớp bắt phím của InputService, kể cả khi người chơi bấm rất nhanh.
    const onKey = (e: KeyboardEvent): void => this.onKey(e);
    window.addEventListener('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', onKey);
      this.controls?.cancelCapture();
    });
  }

  override update(): void {
    // Không có vòng lặp gameplay ở đây, nhưng tay cầm vẫn cần được đọc để bắt nút khi đổi.
    this.controls?.pollIdle();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat || this.controls?.editingTouch) return;
    if (this.capturing) {
      // Đang chờ nút tay cầm: Esc trên bàn phím để hủy.
      if (this.tab === 'gamepad' && e.code === 'Escape') {
        this.controls?.cancelCapture();
        this.capturing = undefined;
        this.render();
      }
      return;
    }
    switch (e.code) {
      case 'Escape':
        this.scene.start(SceneKey.Menu);
        break;
      case 'ArrowUp':
        this.selected = Math.max(0, this.selected - 1);
        this.render();
        break;
      case 'ArrowDown':
        this.selected = Math.min(ACTIONS.length - 1, this.selected + 1);
        this.render();
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        const i = TABS.findIndex(([t]) => t === this.tab);
        const next = TABS[(i + (e.code === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
        if (next) this.switchTab(next[0]);
        break;
      }
      case 'Enter': {
        const action = ACTIONS[this.selected];
        if (this.tab === 'touch') this.openEditor();
        else if (action) this.startCapture(action);
        break;
      }
    }
  }

  private switchTab(tab: Tab): void {
    this.controls?.cancelCapture();
    this.capturing = undefined;
    this.tab = tab;
    this.render();
  }

  private startCapture(action: Action): void {
    const controls = this.controls;
    if (!controls) return;
    this.capturing = action;
    this.render();
    // Phím vừa bắt cũng tới onKey của màn này ngay sau đó; giữ cờ capturing tới hết sự kiện
    // để nó không bị hiểu là lệnh điều hướng.
    const done = (): void => {
      window.setTimeout(() => {
        this.capturing = undefined;
        this.render();
      }, 0);
    };
    // Chỉ bắt đầu chờ sau khi sự kiện đang xử lý (Enter hoặc chạm) kết thúc,
    // nếu không chính phím Enter sẽ bị bắt làm phím mới.
    window.setTimeout(() => {
      if (this.capturing !== action) return;
      if (this.tab === 'keyboard') {
        controls.captureKey((code) => {
          // Esc hủy, trừ khi đang đổi phím cho chính hành động Tạm dừng.
          if (code !== 'Escape' || action === 'pause') controls.remapKey(action, code);
          done();
        });
      } else {
        controls.captureButton((index) => {
          controls.remapButton(action, index);
          done();
        });
      }
    }, 0);
  }

  private openEditor(): void {
    // Phaser nghe sự kiện thả chuột/chạm trên cả cửa sổ, nên cú bấm vào bảng HTML có thể
    // "xuyên" xuống nút Phaser bên dưới. Tắt nhận chạm của màn này trong lúc chỉnh.
    this.input.enabled = false;
    this.controls?.openTouchEditor(() => {
      this.input.enabled = true;
      this.render();
    });
    this.render();
  }

  private render(): void {
    const content = this.content;
    const controls = this.controls;
    if (!content || !controls) return;
    content.removeAll(true);
    const settings = controls.controlSettings;

    if (this.tab === 'touch') {
      const t = settings.touch;
      const lines = [
        `Cỡ nút: ${{ small: 'Nhỏ', medium: 'Vừa', large: 'Lớn' }[t.sizePreset]}  ·  Trong suốt: ${Math.round(t.opacity * 100)}%`,
        `Cần ảo: ${t.stickMode === 'floating' ? 'nổi' : 'cố định'}  ·  Thuận tay trái: ${t.leftHanded ? 'BẬT' : 'TẮT'}`,
        `Rung: ${t.vibration ? 'BẬT' : 'TẮT'}  ·  Tự bắn: ${t.autoFire ? 'BẬT' : 'TẮT'}  ·  Ngắm nhẹ: ${t.aimAssist ? 'BẬT' : 'TẮT'}`,
        `Nút đã kéo vị trí riêng: ${Object.keys(t.offsets).length}`,
      ];
      lines.forEach((line, i) => content.add(this.add.text(12, ROW_TOP + i * 14, line, ROW_STYLE)));
      content.add(
        textButton(this, LOGIC_WIDTH / 2, 118, 'Chỉnh bố cục nút', () => this.openEditor()),
      );
      this.status?.setText(
        controls.editingTouch
          ? 'Đang chỉnh: kéo nút, bấm Xong khi xong'
          : 'Enter hoặc chạm để mở chế độ kéo thả · Esc: quay lại',
      );
      return;
    }

    ACTIONS.forEach((action, i) => {
      const y = ROW_TOP + i * ROW_HEIGHT;
      const isSelected = i === this.selected;
      const bound =
        this.tab === 'keyboard'
          ? settings.keyboard[action].map(keyLabel).join(' / ')
          : settings.gamepad[action].map(gamepadButtonLabel).join(' / ');
      const value = this.capturing === action ? '… bấm phím/nút mới' : bound || '(chưa gán)';
      const color = this.capturing === action ? '#ffd166' : isSelected ? '#4fd1ff' : '#e8f1ff';
      const label = this.add.text(12, y, `${isSelected ? '›' : ' '} ${ACTION_LABELS[action]}`, {
        ...ROW_STYLE,
        color,
      });
      const keys = this.add.text(120, y, value, { ...ROW_STYLE, color });
      label.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        this.selected = i;
        this.startCapture(action);
      });
      content.add([label, keys]);
    });
    content.add(
      textButton(this, LOGIC_WIDTH - 44, ROW_TOP + 4, 'Mặc định', () => {
        controls.resetBindings();
        this.render();
      }),
    );
    const padNote =
      this.tab === 'gamepad' && !controls.gamepadConnected
        ? 'Chưa thấy tay cầm: cắm vào rồi bấm một nút · '
        : '';
    this.status?.setText(
      this.capturing
        ? this.tab === 'keyboard'
          ? 'Bấm phím mới (Esc để hủy)'
          : 'Bấm nút mới trên tay cầm (Esc để hủy)'
        : `${padNote}↑/↓ chọn · Enter đổi · ←/→ tab · Esc quay lại`,
    );
  }
}
