/* Vite 설정 — 현재 Vanilla JS 구조를 "그대로" 서빙하기 위한 최소 설정.
   index.html 의 <script src="js/..."> 태그를 모듈로 바꾸지 않았으므로
   기존 코드는 한 줄도 수정하지 않고 동작한다.

   이 설정은 향후 TypeScript / 모노레포 / 프레임워크 도입 시
   개발 서버를 다시 고르지 않아도 되도록 미리 깔아두는 토대다. */
import { cpSync } from 'node:fs';
import { defineConfig } from 'vite';

/* Vite 는 type="module" 이 아닌 <script src> 를 번들에 포함하지 않는다.
   index.html 을 모듈로 바꾸는 것은 ESM 마이그레이션(별도 단계)의 일이므로,
   빌드 시 원본 js/ · images/ 를 그대로 복사해 dist 를 동작 가능하게 만든다.
   ESM 으로 전환하면 이 플러그인은 삭제한다. */
function copyLegacyAssets() {
  return {
    name: 'copy-legacy-assets',
    apply: 'build',
    closeBundle() {
      for (const dir of ['js', 'images']) {
        cpSync(dir, `dist/${dir}`, { recursive: true });
      }
      /* index.html 이 <script src> 로 읽는 도메인 코어 번들.
         core-demo.iife.js 는 개발 전용이다 (ISSUE-012) — 프로덕션 빌드에서
         제외하려면 아래 목록과 index.html 의 스크립트 태그에서 함께 빼면 된다. */
      for (const f of ['core.iife.js', 'core-demo.iife.js']) {
        cpSync(`packages/core/dist/${f}`, `dist/packages/core/dist/${f}`);
      }
    }
  };
}

export default defineConfig({
  plugins: [copyLegacyAssets()],
  root: '.',
  publicDir: false,        // images/ 는 소스 트리에서 직접 참조하므로 public 복사 불필요
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: false
  },
  preview: {
    port: 5174,
    host: '127.0.0.1'
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    /* 비(非)모듈 <script src> 와 상대경로 자산을 그대로 옮기기 위해
       기본 HTML 처리에 맡긴다. */
    assetsInlineLimit: 0
  }
});
