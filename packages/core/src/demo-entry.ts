/* ==========================================================================
   @hhc/core 데모 엔트리 — 개발 · 프로토타입 전용 (ISSUE-012)
   --------------------------------------------------------------------------
   데모 시드 생성기를 메인 번들에서 분리한다.

     dist/core.iife.js       → window.HHCCore       프로덕션에도 포함
     dist/core-demo.iife.js  → window.HHCCoreDemo   개발 빌드에서만 로드

   프로덕션 빌드에서 두 번째 스크립트를 빼면 데모 코드가 번들에 들어가지 않고,
   앱은 데모 기능 없이 정상 동작한다 (js/store.js · profile 화면이 존재 여부를
   확인한다).

   현재 프로토타입 단계에서는 index.html 이 둘 다 로드하므로 동작은 이전과 같다.
   ========================================================================== */
export { createDemoState } from './demo';
export type { DemoKind, DemoSeedInput, DemoSeedResult } from './demo';
