import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  // Đường dẫn tương đối để bản build chạy được trong Capacitor và khi mở từ thư mục con.
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      // Trang demo 2.5D (three.js) tách riêng: game Phaser không nạp three.js.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        ...(mode === 'lumen-qa'
          ? {}
          : {
              demo25d: fileURLToPath(new URL('./demo-25d.html', import.meta.url)),
              prototype3d: fileURLToPath(new URL('./prototype-3d.html', import.meta.url)),
            }),
      },
    },
    // Phaser nặng khoảng 1,2 MB đã nén nhỏ; cảnh báo kích thước chunk ở mức đó là bình thường.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
