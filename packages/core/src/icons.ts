/* ==========================================================================
   ICON KEYS — 의미 기반 아이콘 키 (ISSUE-006)
   --------------------------------------------------------------------------
   core 는 아이콘의 "의미" 만 정하고, 어떤 아이콘 세트로 그릴지는 플랫폼이 정한다.

     core            'trend-up'
     웹              fa-arrow-trend-up   (js/icons.js 의 매핑)
     React Native    MaterialIcons 등    (플랫폼 매핑을 추가하면 된다)

   이전에는 core 가 'fa-arrow-trend-up' 같은 Font Awesome 클래스명을 직접
   내보내서, Font Awesome 을 쓰지 않는 모바일에서는 그대로 쓸 수 없었다.

   주의: 키를 추가하면 각 플랫폼 매핑에도 반드시 추가해야 한다.
         웹 매핑은 js/icons.js 에 있고, 누락 시 콘솔 경고를 남긴다.
   ========================================================================== */

export type IconKey =
  /* 이정표 · 기준선 */
  | 'flag'
  | 'flag-finish'
  | 'brain'
  | 'route'
  /* 추세 */
  | 'trend-up'
  | 'trend-down'
  | 'equal'
  /* 고도 */
  | 'mountain'
  | 'mountain-sun'
  /* 페이스 · 체력 */
  | 'pace-stability'
  | 'strength'
  /* 주기 · 일정 */
  | 'interval'
  | 'calendar'
  /* 난이도 제안 */
  | 'level-up'
  | 'recovery'
  | 'balanced'
  /* 날씨 */
  | 'weather-clear';

/** 검증 · 매핑 누락 확인용 전체 목록 */
export const ICON_KEYS: readonly IconKey[] = [
  'flag', 'flag-finish', 'brain', 'route',
  'trend-up', 'trend-down', 'equal',
  'mountain', 'mountain-sun',
  'pace-stability', 'strength',
  'interval', 'calendar',
  'level-up', 'recovery', 'balanced',
  'weather-clear'
];
