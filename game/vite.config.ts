import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const sha256 = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const roomFiles = [
  'data/prototype3d.json',
  'assets/prototype3d/kai.glb',
  'assets/prototype3d/terrain-kit.glb',
];

/** Dấu vân tay của đầu ra phòng 3D; không thêm tệp, URL hoặc nhãn cho trang khác. */
function prototypeRoomArtifact(): Plugin {
  let publicDir: string;
  return {
    name: 'prototype-room-artifact',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    transformIndexHtml: {
      order: 'post',
      async handler(_html, { path, chunk, bundle }) {
        if (path !== '/prototype-3d.html' || !chunk || !bundle || !publicDir) return;
        const files = new Map<string, string>();
        const visit = (name: string): boolean => {
          if (files.has(name)) return true;
          const part = bundle[name];
          if (!part) return false;
          if (part.type === 'asset') {
            files.set(name, sha256(part.source));
            return true;
          }
          files.set(name, sha256(part.code));
          return [
            ...part.imports,
            ...part.dynamicImports,
            ...(part.viteMetadata?.importedCss ?? []),
            ...(part.viteMetadata?.importedAssets ?? []),
          ].every(visit);
        };
        if (!visit(chunk.fileName)) return;
        try {
          for (const name of roomFiles) {
            files.set(name, sha256(await readFile(join(publicDir, name))));
          }
        } catch {
          return; // Bản thiếu dữ liệu không được gán nhãn như một gói đã hoàn chỉnh.
        }
        const digest = sha256(
          JSON.stringify([...files].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
        );
        return [
          {
            tag: 'meta',
            attrs: { name: 'cv-prototype3d-artifact-sha256', content: digest },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

export default defineConfig(({ mode }) => ({
  // Đường dẫn tương đối để bản build chạy được trong Capacitor và khi mở từ thư mục con.
  base: './',
  plugins: [prototypeRoomArtifact()],
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
