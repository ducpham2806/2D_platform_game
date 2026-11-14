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

function pixelRatio(): number {
  const r = window.devicePixelRatio;
  return Number.isFinite(r) && r > 0 ? r : 1;
}

export function currentLayout(): ViewportLayout {
  const { width, height } = viewportSize();
  return computeLayout(width, height, LOGIC_WIDTH, LOGIC_HEIGHT, pixelRatio());
}

/**
 * Giữ canvas ở hệ số phóng nguyên (theo px thiết bị) lớn nhất vừa màn hình mỗi khi đổi kích
 * thước, xoay máy hoặc đổi tỉ lệ px (thu phóng trình duyệt, kéo sang màn hình khác). Tự căn
 * giữa bằng margin theo `ViewportLayout` (không dùng autoCenter của Phaser vì nó làm tròn theo
 * px CSS); phần dư là nền đen của trang. Trả về hàm hủy đăng ký.
 */
export function installIntegerScaling(game: Phaser.Game, bus: GameEventBus): () => void {
  let lastZoom = 0;
  let ratioQuery: MediaQueryList | undefined;
  const apply = (): void => {
    const layout = currentLayout();
    document.body.classList.toggle('portrait', layout.portrait);
    const style = game.canvas.style;
    style.marginLeft = `${layout.offsetX}px`;
    style.marginTop = `${layout.offsetY}px`;
    if (layout.zoom !== lastZoom) {
      lastZoom = layout.zoom;
      game.scale.setZoom(layout.zoom);
    }
    // refresh() đo lại vị trí canvas để đổi tọa độ chạm/chuột cho đúng.
    game.scale.refresh();
    bus.emit('viewport:changed', layout);
    watchRatio();
  };
  // Đổi tỉ lệ px mà không đổi kích thước cửa sổ (kéo sang màn hình khác) không có sự kiện resize.
  const watchRatio = (): void => {
    ratioQuery?.removeEventListener('change', apply);
    ratioQuery = window.matchMedia?.(`(resolution: ${pixelRatio()}dppx)`);
    ratioQuery?.addEventListener('change', apply);
  };
  apply();
  window.addEventListener('resize', apply);
  window.visualViewport?.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  return () => {
    window.removeEventListener('resize', apply);
    window.visualViewport?.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
    ratioQuery?.removeEventListener('change', apply);
  };
}
