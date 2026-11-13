import type Phaser from 'phaser';
import { computeLayout, type ViewportLayout } from '../logic/scale';
import { LOGIC_HEIGHT, LOGIC_WIDTH } from './constants';
import type { GameEventBus } from './game-events';

function viewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  return {
    width: Math.floor(vv?.width ?? window.innerWidth),
    height: Math.floor(vv?.height ?? window.innerHeight),
  };
}

export function currentLayout(): ViewportLayout {
  const { width, height } = viewportSize();
  return computeLayout(width, height, LOGIC_WIDTH, LOGIC_HEIGHT, window.devicePixelRatio);
}

/**
 * Giữ canvas ở hệ số phóng nguyên (theo điểm ảnh thật) lớn nhất vừa màn hình mỗi khi đổi kích thước
 * hoặc xoay máy. Phaser tự căn giữa (autoCenter); phần dư là nền đen của trang.
 * Trả về hàm hủy đăng ký.
 */
export function installIntegerScaling(game: Phaser.Game, bus: GameEventBus): () => void {
  let lastZoom = 0;
  const apply = (): void => {
    const layout = currentLayout();
    document.body.classList.toggle('portrait', layout.portrait);
    if (layout.zoom !== lastZoom) {
      lastZoom = layout.zoom;
      game.scale.setZoom(layout.zoom);
    }
    game.scale.refresh();
    bus.emit('viewport:changed', layout);
  };
  apply();
  window.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  return () => {
    window.removeEventListener('resize', apply);
    window.visualViewport?.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
  };
}
