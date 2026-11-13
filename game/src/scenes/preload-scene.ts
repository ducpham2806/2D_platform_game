import Phaser from 'phaser';
import {
  DATA_BASE_PATH,
  DATA_MANIFEST,
  LOGIC_HEIGHT,
  LOGIC_WIDTH,
  SceneKey,
} from '../core/constants';
import { type ArtManifest, parseArtManifest } from '../core/art-manifest';
import { ConfigError, parseGameConfig } from '../core/game-config';
import { createAnimations, queueArt } from './stage/stage-art';
import { SfxPlayer } from '../audio/sfx-player';
import { getBus, setConfig, setInput, setSave, setSfx, setStrings } from '../core/phaser-services';
import { isLang } from '../core/strings-config';
import { urlParam } from '../debug/flags';
import { Strings } from '../logic/i18n';
import { LocalStorageStore } from '../input/browser-store';
import { InputService } from '../input/input-service';
import { SaveManager } from '../logic/save/save-manager';
import { openBrowserSaveStore } from '../save/browser-save-store';
import { MUTED_STYLE, TEXT_STYLE } from './ui';

const MANIFEST_KEY = 'data:manifest';
const ART_MANIFEST_KEY = 'art:manifest';
const ART_MANIFEST = 'assets/assets.json';

interface DataManifest {
  files: string[];
}

function isManifest(value: unknown): value is DataManifest {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as DataManifest).files) &&
    (value as DataManifest).files.every((f) => typeof f === 'string')
  );
}

/**
 * Nạp manifest dữ liệu, rồi mọi file JSON trong đó, hiện thanh tải, kiểm tra cấu hình.
 * Atlas hình sẽ được thêm vào đây khi có asset (05-Assets/manifest.csv).
 */
export class PreloadScene extends Phaser.Scene {
  private bar?: Phaser.GameObjects.Rectangle;
  private art: ArtManifest | undefined;

  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    const barWidth = 200;
    const x = (LOGIC_WIDTH - barWidth) / 2;
    const y = LOGIC_HEIGHT / 2;
    this.add.text(LOGIC_WIDTH / 2, y - 16, 'Đang tải...', TEXT_STYLE).setOrigin(0.5);
    this.add.rectangle(x, y, barWidth, 6).setOrigin(0, 0.5).setStrokeStyle(1, 0x7f8ea3);
    this.bar = this.add.rectangle(x + 1, y, 0, 4, 0x4fd1ff).setOrigin(0, 0.5);
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      this.bar?.setSize((barWidth - 2) * value, 4);
    });
    this.load.json(MANIFEST_KEY, DATA_MANIFEST);
    this.load.json(ART_MANIFEST_KEY, ART_MANIFEST);
  }

  create(): void {
    const manifest: unknown = this.cache.json.get(MANIFEST_KEY);
    if (!isManifest(manifest)) {
      this.fail('Không đọc được data/manifest.json (chạy "npm run sync-data")');
      return;
    }
    let art: ArtManifest;
    try {
      art = parseArtManifest(this.cache.json.get(ART_MANIFEST_KEY));
    } catch (error) {
      this.fail(error instanceof ConfigError ? error.message : String(error));
      return;
    }
    this.art = art;
    queueArt(this, art);
    const names = manifest.files.map((file) => file.replace(/\.json$/, ''));
    for (const name of names) {
      this.load.json(`data:${name}`, `${DATA_BASE_PATH}/${name}.json`);
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => void this.finish(names));
    this.load.start();
  }

  private async finish(names: string[]): Promise<void> {
    const files: Record<string, unknown> = {};
    for (const name of names) {
      files[name] = this.cache.json.get(`data:${name}`);
    }
    try {
      const config = parseGameConfig(files);
      if (this.art) createAnimations(this, this.art);
      setConfig(this, config);
      setInput(this, new InputService(config.controls, new LocalStorageStore(), getBus(this)));
      setSfx(this, new SfxPlayer(config.feedback, new LocalStorageStore()));
      const wanted = urlParam('lang');
      const lang = wanted !== undefined && isLang(wanted) ? wanted : config.strings.defaultLang;
      setStrings(this, new Strings(config.strings, lang));
      getBus(this).emit('config:ready', { config });
      const save = await SaveManager.open(await openBrowserSaveStore());
      if (save.lastError) console.warn(save.lastError);
      setSave(this, save);
      this.scene.start(SceneKey.Menu);
    } catch (error) {
      const message = error instanceof ConfigError ? error.message : String(error);
      this.fail(message);
    }
  }

  private fail(message: string): void {
    console.error(message);
    getBus(this).emit('config:error', { message });
    this.children.removeAll();
    this.add
      .text(8, 8, `Lỗi dữ liệu:\n${message}`, {
        ...MUTED_STYLE,
        color: '#ff8080',
        wordWrap: { width: LOGIC_WIDTH - 16 },
      })
      .setOrigin(0);
  }
}
