/* ==========================================================================
   STATE REPOSITORY — 저장 계층 인터페이스
   --------------------------------------------------------------------------
   core 는 저장 수단을 모른다. 플랫폼이 이 인터페이스를 구현한다.

     웹      localStorage 어댑터        (현재: js/store.js 안에 인라인)
     모바일  SQLite / AsyncStorage 어댑터
     서버    HTTP / DB 어댑터

   동기 · 비동기 양쪽을 허용한다. 모바일의 로컬 DB 와 서버 동기화는
   비동기이므로, 처음부터 Promise 를 받을 수 있게 열어 둔다.
   ========================================================================== */
import type { AppState } from '../types';

export interface StateRepository {
  load(): AppState | Promise<AppState>;
  save(state: AppState): void | Promise<void>;
  clear?(): void | Promise<void>;
}
