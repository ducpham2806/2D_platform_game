import Phaser from 'phaser';
import { LOGIC_WIDTH, SceneKey } from '../core/constants';
import { getBus, getConfig, getInput, getSave, getStrings } from '../core/phaser-services';
import { MenuCursor } from '../logic/hud/menu-cursor';
import { formatGlyphs } from '../logic/input/glyphs';
import { formatRunTime, type StageResult } from '../logic/result/stage-result';
import { recordTutorialDone } from '../logic/save/save-data';
import { TutorialManager } from '../logic/tutorial/tutorial-manager';
import type { StageDefId } from '../stages';
import { MUTED_STYLE, NinePanel, TEXT_STYLE } from './ui';

export interface ResultSceneData {
  result: StageResult;
  /** Màn vừa chơi, để "Chơi lại màn". */
  stage: StageDefId;
}

type Choice = 'continue' | 'replay';

interface Item {
  label: string;
  choice: Choice | undefined;
  text?: Phaser.GameObjects.Text;
}

/** Bỏ qua đầu vào trong chừng này ms đầu, để cú bấm Bắn/Nhảy còn dở trong trận không chọn nhầm. */
const INPUT_GRACE_MS = 600;
const STICK_STEP = 0.6;
const ITEM_W = 132;
const COLOR = { idle: '#1d2a3b', picked: '#2f6d8f', off: '#151d29' };
/** Bước hướng dẫn "thử vũ khí mới" của Stage 1: chưa làm thì nhắc lại ở đây (kịch bản S13). */
const TRY_WEAPON_STEP = 'S13';
/** Giai đoạn hướng dẫn của màn Kết quả (R01…). */
const TUTORIAL_STAGE = 'afterStage1';

/**
 * Màn Kết quả (P-UI-PREP-RESULT, wireframe Result.html): thời gian, số lần chết, EXP (kèm cấp),
 * Core Bit, vũ khí mới, thu thập; Tiếp tục, Chơi lại màn. Chưa có: Data Chip, Memory Log, Két
 * giáp, SP và nút Mở Xưởng (M8), Về Hub (Hub còn là khung nên Tiếp tục về màn hình chính).
 */
export class ResultScene extends Phaser.Scene {
  private data_: ResultSceneData | undefined;
  private items: Item[] = [];
  private cursor: MenuCursor | undefined;
  private stickHeld = true;
  private openedAt = 0;
  private tutorial: TutorialManager | undefined;
  private nova: Phaser.GameObjects.Text | undefined;
  private started = false;

  constructor() {
    super(SceneKey.Result);
  }

  init(data: ResultSceneData | undefined): void {
    this.data_ = data;
  }

  create(): void {
    getBus(this).emit('scene:changed', { key: SceneKey.Result });
    const data = this.data_;
    if (!data) {
      this.scene.start(SceneKey.Menu);
      return;
    }
    const r = data.result;
    const s = getStrings(this);
    const cx = LOGIC_WIDTH / 2;
    this.openedAt = this.time.now;
    this.started = false;
    this.stickHeld = true;
    getInput(this).setGameplayActive(false);

    this.add.image(0, 0, 'ui_menu_bg').setOrigin(0).setAlpha(0.35);
    new NinePanel(this, 10, 34, 300, 100);
    this.add.text(cx, 12, s.t('result.title'), { ...TEXT_STYLE, fontSize: '14px' }).setOrigin(0.5);
    this.add.text(cx, 27, r.stageName, MUTED_STYLE).setOrigin(0.5);

    const level =
      r.levelAfter > r.levelBefore
        ? ` (${s.t('result.levelUp', { from: r.levelBefore, to: r.levelAfter })})`
        : ` (${s.t('result.level', { n: r.levelAfter })})`;
    const left: [string, string][] = [
      [s.t('result.time'), formatRunTime(r.timeSec)],
      [s.t('result.deaths'), String(r.deaths)],
      [s.t('result.exp'), `+${r.expGained}${level}`],
      [s.t('result.coreBit'), `+${r.coreBitsGained}`],
    ];
    this.add.text(20, 40, s.t('result.section'), { ...MUTED_STYLE, fontSize: '8px' });
    left.forEach(([label, value], i) => {
      const y = 52 + i * 13;
      this.add.text(20, y, label, MUTED_STYLE);
      this.add.text(150, y, value, TEXT_STYLE).setOrigin(1, 0);
    });

    const right: { text: string; highlight: boolean }[] = [];
    if (r.weapon)
      right.push({ text: s.t('result.newWeapon', { name: r.weapon }), highlight: true });
    if (r.secretsTotal > 0)
      right.push({
        text: s.t('result.secrets', { found: r.secretsFound, total: r.secretsTotal }),
        highlight: false,
      });
    if (r.levelAfter > r.levelBefore)
      right.push({ text: s.t('result.leveledUp'), highlight: true });
    if (right.length === 0) right.push({ text: s.t('result.nothingNew'), highlight: false });
    this.add.text(172, 40, s.t('result.rewards'), { ...MUTED_STYLE, fontSize: '8px' });
    right.forEach((line, i) => {
      this.add.text(172, 52 + i * 13, line.text, {
        ...TEXT_STYLE,
        color: line.highlight ? '#ffd166' : '#e8f1ff',
      });
    });

    // Lời NOVA (R01) và lời nhắc thử vũ khí mới nếu rời màn mà chưa thử.
    const save = getSave(this);
    const done = save.data.tutorial.done;
    const tutorialOn = !save.data.tutorial.off;
    this.tutorial = new TutorialManager(getConfig(this).tutorial, TUTORIAL_STAGE, done, tutorialOn);
    this.nova = this.add
      .text(cx, 110, '', {
        ...TEXT_STYLE,
        fontSize: '9px',
        align: 'center',
        wordWrap: { width: 280, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);
    if (tutorialOn && r.weapon && !done.includes(TRY_WEAPON_STEP)) {
      const ctx = getInput(this).glyphContext();
      this.add
        .text(cx, 124, formatGlyphs(s.t('result.tryWeapon', { name: r.weapon }), ctx), {
          ...MUTED_STYLE,
          fontSize: '8px',
        })
        .setOrigin(0.5, 0);
    }

    this.items = [
      { label: s.t('result.continue'), choice: 'continue' },
      { label: s.t('result.replay'), choice: 'replay' },
      { label: s.t('result.workshop'), choice: undefined },
    ];
    this.cursor = new MenuCursor(this.items.map((i) => i.choice !== undefined));
    this.items.forEach((item, i) => {
      const enabled = item.choice !== undefined;
      const text = this.add
        .text(cx, 146 + i * 16, item.label, {
          ...(enabled ? TEXT_STYLE : MUTED_STYLE),
          fixedWidth: ITEM_W,
          align: 'center',
          padding: { x: 0, y: 2 },
        })
        .setOrigin(0.5);
      if (enabled) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerup', () => {
          if (!this.ready()) return;
          this.cursor?.select(i);
          this.activate();
        });
      }
      item.text = text;
    });
    this.refresh();
  }

  override update(_time: number, delta: number): void {
    const cursor = this.cursor;
    if (!cursor) return;
    const snap = getInput(this).step();
    this.stepTutorial(delta / 1000);
    if (!this.ready()) return;
    let dir: 1 | -1 | 0 = 0;
    if (snap.pressed.up) dir = -1;
    else if (snap.pressed.down) dir = 1;
    const stick = Math.abs(snap.moveY) >= STICK_STEP;
    if (dir === 0 && stick && !this.stickHeld) dir = snap.moveY < 0 ? -1 : 1;
    this.stickHeld = stick;
    if (dir !== 0) {
      cursor.move(dir);
      this.refresh();
    }
    if (snap.pressed.jump || snap.pressed.shoot || snap.pressed.interact) this.activate();
  }

  private ready(): boolean {
    return this.time.now - this.openedAt >= INPUT_GRACE_MS;
  }

  private stepTutorial(dtSec: number): void {
    const tut = this.tutorial;
    if (!tut) return;
    const signals = this.started ? new Set<string>() : new Set(['start']);
    this.started = true;
    const result = tut.step(signals, 0, dtSec);
    if (result.completed.length > 0)
      getSave(this).update((s) => recordTutorialDone(s, result.completed));
    const view = tut.view;
    this.nova?.setText(view ? `${view.speaker}: ${view.text}` : '');
  }

  private activate(): void {
    const data = this.data_;
    const choice = this.items[this.cursor?.index ?? 0]?.choice;
    if (!data || !choice) return;
    if (choice === 'replay') this.scene.start(SceneKey.Stage, { stage: data.stage });
    else this.scene.start(SceneKey.Menu);
  }

  private refresh(): void {
    this.items.forEach((item, i) => {
      const enabled = item.choice !== undefined;
      item.text?.setBackgroundColor(
        !enabled ? COLOR.off : i === this.cursor?.index ? COLOR.picked : COLOR.idle,
      );
    });
  }
}
