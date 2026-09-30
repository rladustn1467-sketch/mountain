/* @hhc/core 빌드 — 두 가지 형식을 함께 낸다.
     core.iife.js : 전역 HHCCore. 현재 웹앱이 <script src> 로 읽는다.
     core.mjs     : ESM. 향후 모바일 / 서버 / 테스트가 import 한다.  */
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'HHCCore',
      formats: ['iife', 'es'],
      fileName: (format) => (format === 'iife' ? 'core.iife.js' : 'core.mjs')
    }
  }
});
