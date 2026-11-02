import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Đường dẫn tương đối để bản build chạy được trong Capacitor và khi mở từ thư mục con.
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // Phaser nặng khoảng 1,2 MB đã nén nhỏ; cảnh báo kích thước chunk ở mức đó là bình thường.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
