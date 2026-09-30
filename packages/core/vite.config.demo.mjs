/* @hhc/core 데모 엔트리 빌드 (ISSUE-012) — 개발 전용 번들.
   메인 번들(core.iife.js)과 분리해, 프로덕션에서 스크립트만 빼면 제외된다. */
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,          // 메인 번들 산출물을 지우지 않는다
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/demo-entry.ts'),
      name: 'HHCCoreDemo',
      formats: ['iife', 'es'],
      fileName: (format) => (format === 'iife' ? 'core-demo.iife.js' : 'core-demo.mjs')
    }
  }
});
