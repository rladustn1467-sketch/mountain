/* ==========================================================================
   STATE DEFAULTS — 기본 상태 + 저장된 상태 병합
   js/store.js:17-32 (DEFAULT_STATE) 및 38-50 (load 의 병합부) 에서 이동.

   localStorage 접근은 옮기지 않았다. core 는 "무엇이 기본값이고 어떻게
   병합하는가"만 알고, "어디에 저장하는가"는 플랫폼 어댑터가 정한다.
   ========================================================================== */
import type { AppState } from '../types';

export function createDefaultState(): AppState {
  return {
    profile: null,
    records: [],
    prefs: {
      theme: 'default',
      buttonShape: 'pill',
      customPrimary: null,
      customSecondary: null,
      units: 'metric',
      notifications: true
    },
    ui: {
      homeStageSeen: {},
      onboardedAt: null
    }
  };
}

/**
 * 저장소에서 읽은 값을 기본 상태 위에 병합한다.
 *
 * ISSUE-011: prefs / ui 만 한 단계 병합하는 얕은 머지다.
 *            records[] 항목에 필드를 추가하거나 구조를 바꾸면 기존 데이터가
 *            깨진다. 스키마 버전 필드와 마이그레이션 단계가 없다.
 *            (기존 동작을 유지하기 위해 이번 단계에서는 고치지 않는다)
 */
export function mergeState(parsed: unknown): AppState {
  const base = createDefaultState();
  if (!parsed || typeof parsed !== 'object') return base;
  const p = parsed as Partial<AppState>;
  return {
    ...base,
    ...p,
    prefs: { ...base.prefs, ...(p.prefs || {}) },
    ui: { ...base.ui, ...(p.ui || {}) }
  };
}
