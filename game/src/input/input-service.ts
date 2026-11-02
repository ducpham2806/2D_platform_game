import type { ControlsConfig } from '../core/controls-config';
import type { GameEventBus } from '../core/game-events';
import type { Action, InputDevice, InputSnapshot } from '../logic/input/actions';
import { InputAggregator } from '../logic/input/aggregator';
import { remap } from '../logic/input/bindings';
import type { GlyphContext } from '../logic/input/glyphs';
import {
  type ControlSettings,
  defaultControlSettings,
  defaultTouchSettings,
  type KeyValueStore,
  loadControlSettings,
  saveControlSettings,
} from '../logic/input/settings';
import type { TouchSettings } from '../logic/input/touch-layout';
import { GamepadSource } from './gamepad-source';
import { KeyboardSource } from './keyboard-source';
import { TouchEditorPanel } from './touch-editor';
import { TouchOverlay } from './touch-overlay';

function prefersTouch(): boolean {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

/**
 * Điểm vào duy nhất cho đầu vào: gameplay gọi step() mỗi bước logic và chỉ đọc InputSnapshot.
 * Lớp nút cảm ứng chỉ hiện khi đang chơi và thiết bị dùng gần nhất là cảm ứng.
 */
export class InputService {
  private readonly aggregator: InputAggregator;
  private readonly keyboard: KeyboardSource;
  private readonly gamepad: GamepadSource;
  private readonly overlay: TouchOverlay;
  private editor: TouchEditorPanel | undefined;
  private settings: ControlSettings;
  private gameplayActive = false;
  private readonly onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') this.noteDevice('touch');
  };

  constructor(
    private readonly config: ControlsConfig,
    private readonly store: KeyValueStore,
    private readonly bus: GameEventBus,
  ) {
    this.settings = loadControlSettings(store, this.defaults());
    this.aggregator = new InputAggregator(prefersTouch() ? 'touch' : 'keyboard', (device) =>
      this.onDeviceChanged(device),
    );
    this.keyboard = new KeyboardSource(this.aggregator, this.settings.keyboard);
    this.gamepad = new GamepadSource(
      this.aggregator,
      this.settings.gamepad,
      config.gamepad.stickDeadzone,
    );
    this.overlay = new TouchOverlay(config.touch, this.settings.touch, this.aggregator, (offsets) =>
      this.updateTouch({ ...this.settings.touch, offsets }),
    );
    window.addEventListener('pointerdown', this.onPointerDown, { capture: true });
  }

  get device(): InputDevice {
    return this.aggregator.device;
  }

  get controlSettings(): Readonly<ControlSettings> {
    return this.settings;
  }

  get gamepadConnected(): boolean {
    return this.gamepad.connected;
  }

  /** Gọi đúng một lần mỗi bước logic 60 Hz. */
  step(): InputSnapshot {
    this.gamepad.poll();
    return this.aggregator.step();
  }

  /** Gọi mỗi khung khi không có vòng lặp gameplay (menu) để tay cầm vẫn được đọc khi đổi nút. */
  pollIdle(): void {
    this.gamepad.poll();
  }

  setGameplayActive(active: boolean): void {
    this.gameplayActive = active;
    this.refreshOverlay();
  }

  glyphContext(): GlyphContext {
    return {
      device: this.device,
      keyboard: this.settings.keyboard,
      gamepad: this.settings.gamepad,
    };
  }

  remapKey(action: Action, code: string): void {
    this.apply({ ...this.settings, keyboard: remap(this.settings.keyboard, action, code) });
  }

  remapButton(action: Action, index: number): void {
    this.apply({ ...this.settings, gamepad: remap(this.settings.gamepad, action, index) });
  }

  resetBindings(): void {
    const d = defaultControlSettings(this.defaults());
    this.apply({ ...this.settings, keyboard: d.keyboard, gamepad: d.gamepad });
  }

  captureKey(callback: (code: string) => void): void {
    this.keyboard.captureNext(callback);
  }

  captureButton(callback: (index: number) => void): void {
    this.gamepad.captureNext(callback);
  }

  cancelCapture(): void {
    this.keyboard.cancelCapture();
    this.gamepad.cancelCapture();
  }

  /** Mở chế độ kéo thả nút cảm ứng; onClose chạy khi người chơi bấm Xong. */
  openTouchEditor(onClose: () => void): void {
    if (this.editor) return;
    this.overlay.setMode('edit');
    this.editor = new TouchEditorPanel(
      this.config.touch,
      this.settings.touch,
      (touch) => this.updateTouch(touch),
      () => this.updateTouch(defaultTouchSettings(this.config.touch)),
      () => {
        this.editor?.destroy();
        this.editor = undefined;
        this.refreshOverlay();
        onClose();
      },
    );
  }

  get editingTouch(): boolean {
    return this.editor !== undefined;
  }

  private updateTouch(touch: TouchSettings): void {
    this.apply({ ...this.settings, touch });
  }

  private apply(settings: ControlSettings): void {
    const keyboardChanged = settings.keyboard !== this.settings.keyboard;
    const gamepadChanged = settings.gamepad !== this.settings.gamepad;
    this.settings = settings;
    if (keyboardChanged) this.keyboard.setBindings(settings.keyboard);
    if (gamepadChanged) this.gamepad.setBindings(settings.gamepad);
    this.overlay.setSettings(settings.touch);
    this.editor?.setSettings(settings.touch);
    saveControlSettings(this.store, settings);
    this.bus.emit('input:settings-changed', { settings });
  }

  private defaults() {
    return {
      keyboard: this.config.keyboard,
      gamepad: this.config.gamepad.buttons,
      touch: this.config.touch,
    };
  }

  private noteDevice(device: InputDevice): void {
    if (device !== this.aggregator.device) this.onDeviceChanged(device);
  }

  private onDeviceChanged(device: InputDevice): void {
    this.refreshOverlay(device);
    this.bus.emit('input:device-changed', { device });
  }

  private refreshOverlay(device: InputDevice = this.aggregator.device): void {
    if (this.editor) return;
    this.overlay.setMode(this.gameplayActive && device === 'touch' ? 'play' : 'hidden');
  }
}
