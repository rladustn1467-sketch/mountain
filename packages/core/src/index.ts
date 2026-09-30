/* ==========================================================================
   @hhc/core — AI 등산 코치 도메인 코어
   --------------------------------------------------------------------------
   플랫폼 중립 TypeScript. 웹 · iOS · Android · 서버가 공유한다.

   규칙 (CI 로 검사할 대상):
     · window / document / localStorage / navigator 를 참조하지 않는다
     · DOM · React · React Native 에 의존하지 않는다
     · 모든 계산은 순수 함수. 저장 · 렌더 · 네트워크는 호출 측이 담당한다

   빌드 산출물:
     dist/core.iife.js       → 전역 HHCCore       (현재 웹앱의 <script> 로드용)
     dist/core.mjs           → ESM                (모바일 / 서버 / 테스트용)
     dist/core-demo.iife.js  → 전역 HHCCoreDemo    (개발 전용, 별도 엔트리)
   ========================================================================== */

/* 타입 */
export type * from './types';
export { hasStatsData } from './types';

/* 아이콘 — 의미 키. 실제 아이콘 매핑은 플랫폼이 담당 (ISSUE-006) */
export { ICON_KEYS } from './icons';
export type { IconKey } from './icons';

/* 도메인 열거값 · 데이터 */
export { LEVELS, LEVEL_BY_KEY, clampLevel } from './levels';
export { COURSES, findCourse } from './catalog/courses';
export { ONBOARDING, optionTitle } from './catalog/onboarding';
export { MOCK_CONDITIONS, mockWeatherProvider } from './fixtures/weather';

/* 날씨 / 산행 예정일 해석 (ISSUE-004) */
export { resolveHikeDate, resolveWeather, PLAN_OFFSET_DAYS, FORECAST_HORIZON_DAYS } from './weather';
export type {
  WeatherProvider, HikeDateSource, HikeDateResolution,
  ResolveHikeDateInput, WeatherResolution, ResolveWeatherInput
} from './weather';

/* 시간 — 모든 날짜 계산은 Asia/Seoul 고정 (ISSUE-007) */
export {
  TIMEZONE, TZ_OFFSET_MINUTES, kstParts, kstDayIndex, kstStartOfDay,
  kstDayDiff, isSameKstDay, toKstDateInputValue, fromKstDateInputValue
} from './time';
export type { KstParts } from './time';

/* 계산 */
export { getStats, changeRate, mean, sum, computeCapabilities } from './stats';
export {
  MIN_RECORDS_FOR_COMPARISON, MIN_RECORDS_FOR_SERIES, MIN_RECORDS_FOR_PREFERRED_LEVEL,
  MIN_RECORDS_FOR_TREND, MIN_GAPS_FOR_INTERVAL
} from './stats';
export { buildAnalysis } from './analysis';
export { recommendNext, pickReason, buildGoalPlan } from './recommend';
export type { RecommendInput, GoalPlanInput } from './recommend';

/* 포맷 */
export { fmtDur, fmtDurClock, fmtPace, fmtDate, fmtRelative, fmtDateWithWeekday } from './format';

/* 차트 기하 (렌더는 플랫폼이 담당) */
export {
  elevationGeometry, sparklineGeometry, ringGeometry, barsGeometry, trailGeometry
} from './charts';
export type {
  Point, ElevationOptions, ElevationGeometry, SparklineOptions, SparklineGeometry,
  RingGeometry, BarInput, BarItem, BarsGeometry, TrailGeometry
} from './charts';

/* 상태 · 레코드 */
export { createDefaultState, mergeState } from './state/defaults';
export type { StateRepository } from './state/repository';
export { createRecord, sortRecordsByDateDesc, defaultIdGenerator } from './records';
export type { IdGenerator } from './records';

/* 데모 시드는 메인 번들에 포함하지 않는다 (ISSUE-012).
   개발 전용 엔트리 src/demo-entry.ts → dist/core-demo.iife.js (window.HHCCoreDemo) */

/** 번들 식별용 */
export const CORE_VERSION = '0.1.0';
